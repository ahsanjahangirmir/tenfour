"""Trip Simulation Service — docs/spec.md section 7. Owns the day-by-day
walk through a trip, applying the rulebook.md limits (11-hour driving,
14-hour window, 30-minute break, 70-hour/8-day cycle, 34-hour restart,
sleeper-berth split) and producing the ordered list of ScheduleBlocks.

The 70-hour/8-day cycle is tracked as a single running total seeded from
the user-entered Current Cycle Used value, only ever increasing (from
on-duty time) or zeroing out (via a 34-hour restart) — the app has no
visibility into the driver's on-duty history before the trip starts, so
there's nothing to "roll off" a trailing 8-day window with. This matches
how docs/user-acceptance-testing-cases.md Case 7 describes the limit
being hit and cleared.
"""

from dataclasses import dataclass
from datetime import timedelta
from math import asin, cos, radians, sin, sqrt

from django.db import transaction

from core.adapters.routing import GeocodeError, RoutingAdapter
from core.models import ScheduleBlock, Trip

from .rest_strategy import FullResetStrategy, SplitSleeperStrategy, choose_strategy
from .schedule_builder import ScheduleBuilder

DRIVING_LIMIT_MINUTES = 11 * 60
WINDOW_LIMIT_MINUTES = 14 * 60
BREAK_INTERVAL_MINUTES = 8 * 60
BREAK_MINUTES = 30
CYCLE_LIMIT_MINUTES = 70 * 60
RESTART_MINUTES = 34 * 60
FUEL_INTERVAL_MILES = 1000
FUEL_STOP_MINUTES = 30
PICKUP_DROPOFF_MINUTES = 60
SAME_PLACE_TOLERANCE_MILES = 0.25
EPSILON_MINUTES = 1e-6
EARTH_RADIUS_MILES = 3958.8


class InvalidTripError(Exception):
    """Raised for trip inputs that geocode fine individually but don't
    make sense together (e.g. pickup and dropoff at the same place)."""


@dataclass
class SimulationState:
    cycle_used_minutes: float
    driving_since_reset: float = 0
    driving_since_break: float = 0
    odometer_since_fuel: float = 0
    window_start: object = None
    in_split_between: bool = False
    split_pending_second_half: bool = False


def _same_place(a, b):
    return (
        abs(a["lat"] - b["lat"]) < 0.01 and abs(a["lon"] - b["lon"]) < 0.01
    )  # ~0.7 miles at mid US latitudes — geocoder noise, not a real distance apart


def _haversine_miles(lat1, lon1, lat2, lon2):
    lat1, lon1, lat2, lon2 = (radians(v) for v in (lat1, lon1, lat2, lon2))
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    return 2 * EARTH_RADIUS_MILES * asin(sqrt(a))


class LegPath:
    """Wraps a leg's own polyline geometry (its slice of the overall route
    shape, per RoutingAdapter.directions) so a stop partway through the leg
    can be placed by walking the actual road-following shape rather than a
    straight line between the leg's two endpoints — a straight line cuts
    across whatever the real route curves around, landing stops visibly off
    the route line on the map."""

    def __init__(self, geometry):
        self.points = [tuple(p) for p in geometry] or [(0.0, 0.0)]
        self.cumulative = [0.0]
        for (lat1, lon1), (lat2, lon2) in zip(self.points, self.points[1:]):
            self.cumulative.append(self.cumulative[-1] + _haversine_miles(lat1, lon1, lat2, lon2))
        self.total = self.cumulative[-1]

    def point_at_fraction(self, fraction):
        if len(self.points) == 1 or self.total <= 0:
            return self.points[-1]

        target = max(0.0, min(1.0, fraction)) * self.total
        for i in range(1, len(self.cumulative)):
            if self.cumulative[i] >= target:
                seg_start, seg_end = self.cumulative[i - 1], self.cumulative[i]
                seg_fraction = 0.0 if seg_end == seg_start else (target - seg_start) / (seg_end - seg_start)
                lat1, lon1 = self.points[i - 1]
                lat2, lon2 = self.points[i]
                return (lat1 + (lat2 - lat1) * seg_fraction, lon1 + (lon2 - lon1) * seg_fraction)
        return self.points[-1]


class TripSimulationService:
    def __init__(self, routing_adapter=None):
        self.routing = routing_adapter or RoutingAdapter()

    def create_trip(
        self,
        user,
        *,
        current_text,
        pickup_text,
        dropoff_text,
        current_cycle_used_hours,
        trip_start_datetime,
    ):
        current = self.routing.geocode(current_text)
        pickup = self.routing.geocode(pickup_text)
        dropoff = self.routing.geocode(dropoff_text)

        if _same_place(pickup, dropoff):
            raise InvalidTripError(
                "Pickup and dropoff can't be the same place — that isn't a real trip to plan."
            )

        skip_leg1 = _same_place(current, pickup)

        waypoints = [(pickup["lat"], pickup["lon"]), (dropoff["lat"], dropoff["lon"])]
        if not skip_leg1:
            waypoints.insert(0, (current["lat"], current["lon"]))

        route = self.routing.directions(waypoints)
        leg1 = None if skip_leg1 else route["legs"][0]
        leg2 = route["legs"][-1]

        day_start = trip_start_datetime.replace(hour=0, minute=0, second=0, microsecond=0)
        builder = ScheduleBuilder(day_start, current["lat"], current["lon"])
        state = SimulationState(cycle_used_minutes=current_cycle_used_hours * 60)

        lead_in_minutes = (trip_start_datetime - day_start).total_seconds() / 60
        builder.add("off_duty", lead_in_minutes)

        if leg1:
            self._drive_leg(
                builder, state, leg1["geometry"],
                leg1["distance_miles"], leg1["duration_minutes"],
            )
        self._add_on_duty_event(builder, state, PICKUP_DROPOFF_MINUTES, "pickup")

        self._drive_leg(
            builder, state, leg2["geometry"],
            leg2["distance_miles"], leg2["duration_minutes"],
        )
        self._add_on_duty_event(builder, state, PICKUP_DROPOFF_MINUTES, "dropoff")

        trip_end_day = builder.current_time.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
        trail_minutes = (trip_end_day - builder.current_time).total_seconds() / 60
        builder.add("off_duty", trail_minutes)

        driving_minutes = sum(
            (b["end_datetime"] - b["start_datetime"]).total_seconds() / 60
            for b in builder.blocks
            if b["duty_status"] == "driving"
        )
        # Trailing padding always lands exactly on the next midnight, so
        # this is already the count of calendar days the trip touched.
        total_days = (builder.current_time.date() - day_start.date()).days

        with transaction.atomic():
            trip = Trip.objects.create(
                user=user,
                current_location_text=current_text,
                current_lat=current["lat"],
                current_lon=current["lon"],
                pickup_location_text=pickup_text,
                pickup_lat=pickup["lat"],
                pickup_lon=pickup["lon"],
                dropoff_location_text=dropoff_text,
                dropoff_lat=dropoff["lat"],
                dropoff_lon=dropoff["lon"],
                current_cycle_used_hours=current_cycle_used_hours,
                trip_start_datetime=trip_start_datetime,
                route_geometry=route["geometry"],
                distance_miles=route["distance_miles"],
                driving_hours=driving_minutes / 60,
                total_days=total_days,
            )
            ScheduleBlock.objects.bulk_create(
                ScheduleBlock(trip=trip, **block) for block in builder.blocks
            )
        return trip

    # -- Internals --------------------------------------------------------

    def _add_on_duty_event(self, builder, state, minutes, stop_type):
        self._ensure_window_open(builder, state)
        builder.add("on_duty_not_driving", minutes, stop_type=stop_type)
        state.cycle_used_minutes += minutes

    def _ensure_window_open(self, builder, state):
        if state.window_start is None and not state.in_split_between:
            state.window_start = builder.current_time

    def _drive_leg(self, builder, state, geometry, distance_miles, duration_minutes):
        if duration_minutes <= EPSILON_MINUTES:
            return

        path = LegPath(geometry)
        miles_per_minute = distance_miles / duration_minutes
        remaining_minutes = duration_minutes
        miles_covered = 0.0

        while remaining_minutes > EPSILON_MINUTES:
            if state.cycle_used_minutes >= CYCLE_LIMIT_MINUTES - EPSILON_MINUTES:
                builder.add("off_duty", RESTART_MINUTES, stop_type="34hr_restart")
                state.cycle_used_minutes = 0
                state.driving_since_reset = 0
                state.driving_since_break = 0
                state.window_start = None
                state.in_split_between = False
                state.split_pending_second_half = False
                continue

            self._ensure_window_open(builder, state)

            if state.driving_since_break >= BREAK_INTERVAL_MINUTES - EPSILON_MINUTES:
                builder.add("on_duty_not_driving", BREAK_MINUTES, stop_type="30min_break")
                state.cycle_used_minutes += BREAK_MINUTES
                state.driving_since_break = 0
                continue

            window_elapsed = (
                (builder.current_time - state.window_start).total_seconds() / 60
                if state.window_start
                else 0
            )
            driving_capped = state.driving_since_reset >= DRIVING_LIMIT_MINUTES - EPSILON_MINUTES
            window_capped = (not state.in_split_between) and window_elapsed >= WINDOW_LIMIT_MINUTES - EPSILON_MINUTES

            if driving_capped or window_capped:
                if state.split_pending_second_half:
                    SplitSleeperStrategy().complete(builder, state)
                else:
                    binding = "driving" if driving_capped else "window"
                    choose_strategy(binding).apply(builder, state)
                continue

            caps = [
                remaining_minutes,
                DRIVING_LIMIT_MINUTES - state.driving_since_reset,
                BREAK_INTERVAL_MINUTES - state.driving_since_break,
                CYCLE_LIMIT_MINUTES - state.cycle_used_minutes,
            ]
            if not state.in_split_between:
                caps.append(WINDOW_LIMIT_MINUTES - window_elapsed)

            miles_to_fuel = FUEL_INTERVAL_MILES - state.odometer_since_fuel
            minutes_to_fuel = miles_to_fuel / miles_per_minute if miles_per_minute > 0 else float("inf")
            caps.append(minutes_to_fuel)

            chunk_minutes = max(0.0, min(caps))
            if chunk_minutes <= EPSILON_MINUTES:
                # Safety valve — should be unreachable given the checks above.
                FullResetStrategy().apply(builder, state)
                continue

            chunk_miles = chunk_minutes * miles_per_minute
            miles_covered += chunk_miles
            fraction = min(1.0, miles_covered / distance_miles) if distance_miles else 1.0
            end_lat, end_lon = path.point_at_fraction(fraction)

            builder.add(
                "driving",
                chunk_minutes,
                stop_type="driving_leg",
                end_lat=end_lat,
                end_lon=end_lon,
                distance_miles=chunk_miles,
            )
            state.driving_since_reset += chunk_minutes
            state.driving_since_break += chunk_minutes
            state.cycle_used_minutes += chunk_minutes
            state.odometer_since_fuel += chunk_miles
            remaining_minutes -= chunk_minutes

            fuel_due = state.odometer_since_fuel >= FUEL_INTERVAL_MILES - 1e-6
            if fuel_due and remaining_minutes > EPSILON_MINUTES:
                builder.add("on_duty_not_driving", FUEL_STOP_MINUTES, stop_type="fuel_stop")
                state.cycle_used_minutes += FUEL_STOP_MINUTES
                state.odometer_since_fuel = 0

"""Routing Adapter (Adapter pattern) — the single interface the simulation
and geocoding services use for routing, geocoding, and reverse geocoding.
Wraps OpenRouteService (driving-hgv profile) as the primary provider, the
US Census Geocoder as an unlimited US-only fallback, and the bundled city
dataset as a last resort, per docs/spec.md sections 3 and 7. Callers never
talk to a vendor SDK directly, so the fallback chain can change without
touching business logic.
"""

import concurrent.futures
import logging

import requests
from django.conf import settings

from .cache import GEOCODE_TTL_SECONDS, ROUTE_TTL_SECONDS, CacheAdapter
from .cities_data import nearest_city
from .us_states import FIPS_TO_ABBR

logger = logging.getLogger(__name__)

ORS_BASE_URL = "https://api.openrouteservice.org"
CENSUS_BASE_URL = "https://geocoding.geo.census.gov/geocoder"
METERS_PER_MILE = 1609.344
REQUEST_TIMEOUT = 15

# ORS's `driving-hgv` profile applies its own conservative per-road-class
# speed table when estimating `duration`, which comes out well below real
# interstate truck speeds (observed ~35 mph average on routes that are
# almost entirely interstate, vs. a realistic ~60 mph highway cruising
# average) — there's no request parameter on the hosted API to raise it.
# Since the HOS simulation's driving-hour math depends entirely on
# duration, not distance, that gap alone was enough to trigger spurious
# 11-hour resets on trips well under the real limit. `distance` (and the
# route geometry, needed for truck-legal routing around height/weight
# restrictions) still comes straight from ORS; only `duration` is
# recomputed from that distance using this flat average instead.
AVERAGE_HIGHWAY_SPEED_MPH = 60


class GeocodeError(Exception):
    """Raised when a location cannot be resolved to a real place, so the
    view can turn it into the clear, form-blocking message described in
    docs/user-acceptance-testing-cases.md Case 12."""


class RoutingAdapter:
    def __init__(self):
        self._cache = CacheAdapter()

    # -- Forward geocoding ------------------------------------------------

    def geocode(self, text):
        """Resolves free-text like "Dallas, TX" to {lat, lon, label}.
        Raises GeocodeError if no provider can place it."""
        key = self._cache.geocode_key(text)
        cached = self._cache.get(key)
        if cached:
            return cached

        result = self._geocode_ors(text) or self._geocode_census(text)
        if not result:
            raise GeocodeError(f"Could not find a location matching \"{text}\".")

        self._cache.set(key, result, GEOCODE_TTL_SECONDS)
        return result

    def _geocode_ors(self, text):
        try:
            response = requests.get(
                f"{ORS_BASE_URL}/geocode/search",
                params={
                    "api_key": settings.ORS_API_KEY,
                    "text": text,
                    "boundary.country": "US",
                    "size": 1,
                },
                timeout=REQUEST_TIMEOUT,
            )
            response.raise_for_status()
            features = response.json().get("features", [])
            if not features:
                return None
            feature = features[0]
            lon, lat = feature["geometry"]["coordinates"]
            return {"lat": lat, "lon": lon, "label": feature["properties"].get("label", text)}
        except (requests.RequestException, KeyError, ValueError, IndexError) as exc:
            logger.warning("ORS geocode failed for %r: %s", text, exc)
            return None

    def _geocode_census(self, text):
        try:
            response = requests.get(
                f"{CENSUS_BASE_URL}/locations/onelineaddress",
                params={"address": text, "benchmark": "Public_AR_Current", "format": "json"},
                timeout=REQUEST_TIMEOUT,
            )
            response.raise_for_status()
            matches = response.json()["result"]["addressMatches"]
            if not matches:
                return None
            match = matches[0]
            coords = match["coordinates"]
            return {
                "lat": coords["y"],
                "lon": coords["x"],
                "label": match.get("matchedAddress", text),
            }
        except (requests.RequestException, KeyError, ValueError, IndexError) as exc:
            logger.warning("Census geocode failed for %r: %s", text, exc)
            return None

    # -- Reverse geocoding --------------------------------------------------

    def reverse_geocode(self, lat, lon):
        """Resolves coordinates to a "City, ST" remark string. Always
        returns something — falls all the way through to the bundled
        nearest-city dataset rather than raising."""
        key = self._cache.reverse_geocode_key(lat, lon)
        cached = self._cache.get(key)
        if cached:
            return cached

        label = (
            self._reverse_geocode_ors(lat, lon)
            or self._reverse_geocode_census(lat, lon)
            or nearest_city(lat, lon)[0]
        )
        self._cache.set(key, label, GEOCODE_TTL_SECONDS)
        return label

    def batch_reverse_geocode(self, points):
        """points: iterable of (lat, lon). Returns a list of labels in
        the same order — used by the Phase 2 batch reverse-geocode step.

        Each lookup is an independent blocking HTTP call (ORS, with Census
        and an offline city dataset as fallbacks), and on a first-time
        generation almost every point is a cache miss — dispatching them
        one after another turned a handful of network round trips into a
        multi-second wait that grew with every schedule block. Running them
        concurrently instead means the whole batch takes roughly as long as
        the single slowest lookup rather than the sum of all of them."""
        points = list(points)
        if not points:
            return []
        with concurrent.futures.ThreadPoolExecutor(max_workers=min(10, len(points))) as executor:
            return list(executor.map(lambda point: self.reverse_geocode(*point), points))

    def _reverse_geocode_ors(self, lat, lon):
        try:
            response = requests.get(
                f"{ORS_BASE_URL}/geocode/reverse",
                params={
                    "api_key": settings.ORS_API_KEY,
                    "point.lon": lon,
                    "point.lat": lat,
                    "size": 1,
                    "layers": "locality",
                },
                timeout=REQUEST_TIMEOUT,
            )
            response.raise_for_status()
            features = response.json().get("features", [])
            if not features:
                return None
            props = features[0]["properties"]
            name, region_a = props.get("name"), props.get("region_a")
            if not name:
                return None
            return f"{name}, {region_a}" if region_a else name
        except (requests.RequestException, KeyError, ValueError, IndexError) as exc:
            logger.warning("ORS reverse geocode failed for (%s, %s): %s", lat, lon, exc)
            return None

    def _reverse_geocode_census(self, lat, lon):
        try:
            response = requests.get(
                f"{CENSUS_BASE_URL}/geographies/coordinates",
                params={
                    "x": lon,
                    "y": lat,
                    "benchmark": "Public_AR_Current",
                    "vintage": "Current_Current",
                    "layers": "Incorporated Places",
                    "format": "json",
                },
                timeout=REQUEST_TIMEOUT,
            )
            response.raise_for_status()
            places = response.json()["result"]["geographies"].get("Incorporated Places", [])
            if not places:
                return None
            place = places[0]
            state = FIPS_TO_ABBR.get(place.get("STATE"))
            name = place.get("BASENAME") or place.get("NAME")
            return f"{name}, {state}" if state else name
        except (requests.RequestException, KeyError, ValueError, IndexError) as exc:
            logger.warning("Census reverse geocode failed for (%s, %s): %s", lat, lon, exc)
            return None

    # -- Directions -----------------------------------------------------

    def directions(self, waypoints):
        """waypoints: ordered list of (lat, lon), at least 2. Returns
        {distance_miles, duration_minutes, geometry: [[lat, lon], ...],
        legs: [{distance_miles, duration_minutes, geometry: [[lat, lon], ...]}, ...]}
        — one leg per consecutive waypoint pair, using the driving-hgv
        profile. Each leg's `geometry` is its own slice of the overall
        route polyline (per ORS's `way_points` indices), so callers that
        need to place a stop partway through a leg can walk that leg's
        actual road-following shape instead of a straight line between
        its two endpoints. Raises GeocodeError if the route cannot be
        computed."""
        key = self._cache.route_key(waypoints)
        cached = self._cache.get(key)
        if cached:
            return cached

        try:
            response = requests.post(
                f"{ORS_BASE_URL}/v2/directions/driving-hgv/geojson",
                headers={
                    "Authorization": settings.ORS_API_KEY,
                    "Content-Type": "application/json",
                },
                json={"coordinates": [[lon, lat] for lat, lon in waypoints]},
                timeout=REQUEST_TIMEOUT,
            )
            response.raise_for_status()
            data = response.json()
            feature = data["features"][0]
            props = feature["properties"]
            summary = props["summary"]
            geometry = [[lat, lon] for lon, lat in feature["geometry"]["coordinates"]]
            way_points = props.get("way_points") or [0, len(geometry) - 1]
            legs = []
            for i, seg in enumerate(props["segments"]):
                leg_distance_miles = seg["distance"] / METERS_PER_MILE
                legs.append(
                    {
                        "distance_miles": leg_distance_miles,
                        "duration_minutes": leg_distance_miles / AVERAGE_HIGHWAY_SPEED_MPH * 60,
                        "geometry": geometry[way_points[i] : way_points[i + 1] + 1],
                    }
                )
            total_distance_miles = summary["distance"] / METERS_PER_MILE
            result = {
                "distance_miles": total_distance_miles,
                "duration_minutes": total_distance_miles / AVERAGE_HIGHWAY_SPEED_MPH * 60,
                "geometry": geometry,
                "legs": legs,
            }
        except (requests.RequestException, KeyError, ValueError, IndexError) as exc:
            logger.warning("ORS directions failed for %r: %s", waypoints, exc)
            raise GeocodeError(
                "Could not calculate a driving route between those locations."
            ) from exc

        self._cache.set(key, result, ROUTE_TTL_SECONDS)
        return result

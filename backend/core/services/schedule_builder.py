"""Schedule Builder (Builder pattern) — assembles the block-by-block trip
timeline incrementally as the Trip Simulation Service proceeds, per
docs/spec.md section 7, instead of the simulation service building a raw
list of dicts by hand. Each `add()` call advances the builder's notion of
"now" and "current position" for the next block.
"""

from datetime import timedelta


class ScheduleBuilder:
    def __init__(self, start_datetime, start_lat, start_lon):
        self.current_time = start_datetime
        self.current_lat = start_lat
        self.current_lon = start_lon
        self.blocks = []
        self._sequence = 0

    def add(
        self,
        duty_status,
        minutes,
        *,
        stop_type="",
        is_split_sleeper=False,
        end_lat=None,
        end_lon=None,
        distance_miles=0,
    ):
        if minutes <= 0:
            return None

        end_lat = self.current_lat if end_lat is None else end_lat
        end_lon = self.current_lon if end_lon is None else end_lon
        start_time = self.current_time
        end_time = start_time + timedelta(minutes=minutes)

        block = {
            "sequence_order": self._sequence,
            "duty_status": duty_status,
            "stop_type": stop_type,
            "is_split_sleeper": is_split_sleeper,
            "start_datetime": start_time,
            "end_datetime": end_time,
            "start_lat": self.current_lat,
            "start_lon": self.current_lon,
            "end_lat": end_lat,
            "end_lon": end_lon,
            "distance_miles": distance_miles,
        }
        self.blocks.append(block)
        self._sequence += 1
        self.current_time = end_time
        self.current_lat = end_lat
        self.current_lon = end_lon
        return block

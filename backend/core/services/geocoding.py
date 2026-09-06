"""Geocoding Service — docs/spec.md section 7. Runs the Phase 2 batch
reverse-geocode step described in section 4: turns every schedule block's
start coordinates into a "City, ST" remark, via the Routing Adapter's
fallback chain and cache (so re-generating logs for the same trip is
free after the first pass)."""

from core.adapters.routing import RoutingAdapter
from core.models import ScheduleBlock


class GeocodingService:
    def __init__(self, routing_adapter=None):
        self.routing = routing_adapter or RoutingAdapter()

    def annotate_remarks(self, trip):
        blocks = list(trip.schedule_blocks.all())
        labels = self.routing.batch_reverse_geocode(
            (block.start_lat, block.start_lon) for block in blocks
        )
        for block, label in zip(blocks, labels):
            block.remark_location_text = label
        ScheduleBlock.objects.bulk_update(blocks, ["remark_location_text"])

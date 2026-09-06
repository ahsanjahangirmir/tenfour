"""Log Sheet Service — docs/spec.md section 7. Aggregates a trip's
ScheduleBlocks into one LogSheet row per calendar day, and snapshots the
driver/carrier details entered on this trip's Phase 2 form onto the Trip
record permanently, so the generated log doesn't change after the fact.
"""

from datetime import datetime, time, timedelta

from django.db import transaction

from core.models import LogSheet

from .geocoding import GeocodingService


class LogSheetService:
    def __init__(self, geocoding_service=None):
        self.geocoding = geocoding_service or GeocodingService()

    def generate_logs(
        self,
        trip,
        *,
        driver_number,
        driver_full_name,
        truck_number,
        trailer_number,
        carrier_name,
        carrier_address,
        time_base,
        shipping_document_number,
        shipper_name,
        commodity,
        co_driver_name,
    ):
        with transaction.atomic():
            trip.driver_number_snapshot = driver_number
            trip.driver_name_snapshot = driver_full_name
            trip.truck_number_snapshot = truck_number
            trip.trailer_number_snapshot = trailer_number
            trip.carrier_name_snapshot = carrier_name
            trip.carrier_address_snapshot = carrier_address
            trip.time_base_snapshot = time_base

            trip.shipping_document_number = shipping_document_number or ""
            trip.shipper_name = shipper_name or ""
            trip.commodity = commodity or ""
            trip.co_driver_name = co_driver_name or "N/A"
            trip.logs_generated = True
            trip.save()

            self.geocoding.annotate_remarks(trip)

            trip.log_sheets.all().delete()
            log_sheets = self._build_log_sheets(trip)
            LogSheet.objects.bulk_create(log_sheets)

        return trip

    def _build_log_sheets(self, trip):
        blocks = list(trip.schedule_blocks.order_by("sequence_order"))
        days = {}
        order = []
        for block in blocks:
            self._accumulate_block(block, days, order)

        multi_day = len(order) > 1
        sheets = []
        for day_number, day in enumerate(order, start=1):
            acc = days[day]
            driving = round(acc["driving"])
            sleeper_berth = round(acc["sleeper_berth"])
            on_duty_not_driving = round(acc["on_duty_not_driving"])
            # Off duty absorbs the rounding remainder so the four totals
            # always sum to exactly 24 hours (rulebook.md, Case 21).
            off_duty = 24 * 60 - driving - sleeper_berth - on_duty_not_driving

            sheets.append(
                LogSheet(
                    trip=trip,
                    log_date=day,
                    day_number=day_number,
                    multi_day_flag=multi_day,
                    driving_miles_today=round(acc["miles"], 1),
                    truck_mileage_today=round(acc["miles"], 1),
                    off_duty_minutes=off_duty,
                    sleeper_berth_minutes=sleeper_berth,
                    driving_minutes=driving,
                    on_duty_not_driving_minutes=on_duty_not_driving,
                )
            )
        return sheets

    def _accumulate_block(self, block, days, order):
        cursor = block.start_datetime
        end = block.end_datetime
        total_minutes = (end - cursor).total_seconds() / 60
        if total_minutes <= 0:
            return

        while cursor < end:
            day = cursor.date()
            if day not in days:
                days[day] = {
                    "off_duty": 0.0,
                    "sleeper_berth": 0.0,
                    "driving": 0.0,
                    "on_duty_not_driving": 0.0,
                    "miles": 0.0,
                }
                order.append(day)

            next_midnight = datetime.combine(day + timedelta(days=1), time.min, tzinfo=cursor.tzinfo)
            segment_end = min(end, next_midnight)
            minutes = (segment_end - cursor).total_seconds() / 60

            days[day][block.duty_status] += minutes
            days[day]["miles"] += block.distance_miles * (minutes / total_minutes)

            cursor = segment_end

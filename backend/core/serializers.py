from rest_framework import serializers

from .models import LogSheet, ScheduleBlock, Trip, TripPreset
from .validators import driver_number_validator, trailer_number_validator, truck_number_validator


class ScheduleBlockSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScheduleBlock
        fields = [
            "id",
            "sequence_order",
            "duty_status",
            "stop_type",
            "is_split_sleeper",
            "start_datetime",
            "end_datetime",
            "start_lat",
            "start_lon",
            "end_lat",
            "end_lon",
            "distance_miles",
            "remark_location_text",
        ]


class LogSheetSerializer(serializers.ModelSerializer):
    class Meta:
        model = LogSheet
        fields = [
            "id",
            "log_date",
            "day_number",
            "multi_day_flag",
            "driving_miles_today",
            "truck_mileage_today",
            "off_duty_minutes",
            "sleeper_berth_minutes",
            "driving_minutes",
            "on_duty_not_driving_minutes",
        ]


class TripBreakdownSerializer(serializers.Serializer):
    distance_miles = serializers.FloatField()
    driving_hours = serializers.FloatField()
    total_days = serializers.IntegerField()
    off_duty_hours = serializers.FloatField()
    sleeper_berth_hours = serializers.FloatField()
    on_duty_not_driving_hours = serializers.FloatField()
    num_rests = serializers.IntegerField()
    num_fuel_stops = serializers.IntegerField()


class TripListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trip
        fields = [
            "id",
            "current_location_text",
            "pickup_location_text",
            "dropoff_location_text",
            "trip_start_datetime",
            "distance_miles",
            "driving_hours",
            "total_days",
            "logs_generated",
            "created_at",
        ]


class TripDetailSerializer(serializers.ModelSerializer):
    schedule_blocks = ScheduleBlockSerializer(many=True, read_only=True)
    log_sheets = LogSheetSerializer(many=True, read_only=True)
    breakdown = serializers.SerializerMethodField()

    class Meta:
        model = Trip
        fields = [
            "id",
            "current_location_text",
            "current_lat",
            "current_lon",
            "pickup_location_text",
            "pickup_lat",
            "pickup_lon",
            "dropoff_location_text",
            "dropoff_lat",
            "dropoff_lon",
            "current_cycle_used_hours",
            "trip_start_datetime",
            "route_geometry",
            "distance_miles",
            "driving_hours",
            "total_days",
            "logs_generated",
            "driver_number_snapshot",
            "driver_name_snapshot",
            "truck_number_snapshot",
            "trailer_number_snapshot",
            "carrier_name_snapshot",
            "carrier_address_snapshot",
            "time_base_snapshot",
            "shipping_document_number",
            "shipper_name",
            "commodity",
            "co_driver_name",
            "created_at",
            "schedule_blocks",
            "log_sheets",
            "breakdown",
        ]

    def get_breakdown(self, trip):
        blocks = trip.schedule_blocks.all()
        minutes_by_status = {"off_duty": 0, "sleeper_berth": 0, "driving": 0, "on_duty_not_driving": 0}
        num_rests = 0
        num_fuel_stops = 0
        for block in blocks:
            duration = (block.end_datetime - block.start_datetime).total_seconds() / 60
            minutes_by_status[block.duty_status] += duration
            if block.stop_type in ("10hr_rest", "34hr_restart"):
                num_rests += 1
            elif block.stop_type == "fuel_stop":
                num_fuel_stops += 1

        return {
            "distance_miles": trip.distance_miles,
            "driving_hours": trip.driving_hours,
            "total_days": trip.total_days,
            "off_duty_hours": minutes_by_status["off_duty"] / 60,
            "sleeper_berth_hours": minutes_by_status["sleeper_berth"] / 60,
            "on_duty_not_driving_hours": minutes_by_status["on_duty_not_driving"] / 60,
            "num_rests": num_rests,
            "num_fuel_stops": num_fuel_stops,
        }


class TripCreateSerializer(serializers.Serializer):
    current_location_text = serializers.CharField(max_length=255)
    pickup_location_text = serializers.CharField(max_length=255)
    dropoff_location_text = serializers.CharField(max_length=255)
    current_cycle_used_hours = serializers.FloatField(min_value=0, max_value=70)
    trip_start_datetime = serializers.DateTimeField()


class GenerateLogsSerializer(serializers.Serializer):
    shipping_document_number = serializers.CharField(max_length=100, required=False, allow_blank=True)
    shipper_name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    commodity = serializers.CharField(max_length=255, required=False, allow_blank=True)
    co_driver_name = serializers.CharField(max_length=255, required=False, allow_blank=True)

    # Driver/carrier details, entered fresh for this trip — nothing is
    # saved for reuse on future trips.
    driver_number = serializers.CharField(max_length=7, validators=[driver_number_validator])
    driver_full_name = serializers.CharField(max_length=255)
    truck_number = serializers.CharField(max_length=20, validators=[truck_number_validator])
    trailer_number = serializers.CharField(max_length=20, validators=[trailer_number_validator])
    carrier_name = serializers.CharField(max_length=255)
    carrier_address = serializers.CharField(max_length=500)
    time_base = serializers.CharField(max_length=50)

    def validate(self, data):
        has_shipping_doc = bool(data.get("shipping_document_number"))
        has_shipper_info = bool(data.get("shipper_name")) and bool(data.get("commodity"))
        if not has_shipping_doc and not has_shipper_info:
            raise serializers.ValidationError(
                "Enter either a shipping document number, or both a shipper name and commodity."
            )
        return data


class TripPresetSerializer(serializers.ModelSerializer):
    class Meta:
        model = TripPreset
        fields = [
            "id",
            "name",
            "current_location_text",
            "pickup_location_text",
            "dropoff_location_text",
            "default_cycle_used_hours",
        ]

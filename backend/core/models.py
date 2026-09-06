import uuid

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class User(models.Model):
    """A signed-in driver. Identity lives in Clerk; this row is just the
    join point for a driver's trips. Driver/carrier details are entered
    fresh on each trip's Phase 2 form rather than saved here — see Trip's
    *_snapshot fields below. Created lazily on first authenticated
    request — see core.authentication.ClerkJWTAuthentication.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    clerk_user_id = models.CharField(max_length=255, unique=True)
    email = models.EmailField(blank=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    # Duck-typed to satisfy DRF/Django's expectations of a "user" object
    # (this model is not Django's AUTH_USER_MODEL — Clerk owns identity).
    is_authenticated = True
    is_anonymous = False

    def __str__(self):
        return self.email or self.clerk_user_id


class DutyStatus(models.TextChoices):
    OFF_DUTY = "off_duty", "Off Duty"
    SLEEPER_BERTH = "sleeper_berth", "Sleeper Berth"
    DRIVING = "driving", "Driving"
    ON_DUTY_NOT_DRIVING = "on_duty_not_driving", "On Duty (Not Driving)"


class StopType(models.TextChoices):
    DRIVING_LEG = "driving_leg", "Driving leg"
    PICKUP = "pickup", "Pickup"
    DROPOFF = "dropoff", "Dropoff"
    FUEL_STOP = "fuel_stop", "Fuel stop"
    BREAK_30MIN = "30min_break", "30-minute break"
    REST_10HR = "10hr_rest", "10-hour rest"
    RESTART_34HR = "34hr_restart", "34-hour restart"


class Trip(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="trips")

    current_location_text = models.CharField(max_length=255)
    current_lat = models.FloatField()
    current_lon = models.FloatField()
    pickup_location_text = models.CharField(max_length=255)
    pickup_lat = models.FloatField()
    pickup_lon = models.FloatField()
    dropoff_location_text = models.CharField(max_length=255)
    dropoff_lat = models.FloatField()
    dropoff_lon = models.FloatField()

    current_cycle_used_hours = models.FloatField(
        validators=[MinValueValidator(0), MaxValueValidator(70)]
    )
    trip_start_datetime = models.DateTimeField()

    # Route geometry (GeoJSON-style list of [lat, lon] pairs) so a past
    # trip's map can be reopened from history without re-calling the
    # routing API and burning OpenRouteService's daily quota.
    route_geometry = models.JSONField(default=list, blank=True)

    distance_miles = models.FloatField(default=0)
    driving_hours = models.FloatField(default=0)
    total_days = models.IntegerField(default=1)
    logs_generated = models.BooleanField(default=False)

    # Profile snapshot — copied from User at the moment logs are generated.
    driver_number_snapshot = models.CharField(max_length=7, blank=True)
    driver_name_snapshot = models.CharField(max_length=255, blank=True)
    truck_number_snapshot = models.CharField(max_length=20, blank=True)
    trailer_number_snapshot = models.CharField(max_length=20, blank=True)
    carrier_name_snapshot = models.CharField(max_length=255, blank=True)
    carrier_address_snapshot = models.CharField(max_length=500, blank=True)
    time_base_snapshot = models.CharField(max_length=50, blank=True)

    # Phase 2 trip-specific fields.
    shipping_document_number = models.CharField(max_length=100, blank=True)
    shipper_name = models.CharField(max_length=255, blank=True)
    commodity = models.CharField(max_length=255, blank=True)
    co_driver_name = models.CharField(max_length=255, blank=True, default="N/A")

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.current_location_text} -> {self.pickup_location_text} -> {self.dropoff_location_text}"


class ScheduleBlock(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="schedule_blocks")
    sequence_order = models.IntegerField()
    duty_status = models.CharField(max_length=32, choices=DutyStatus.choices)
    stop_type = models.CharField(max_length=32, choices=StopType.choices, blank=True)
    is_split_sleeper = models.BooleanField(default=False)
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    start_lat = models.FloatField()
    start_lon = models.FloatField()
    end_lat = models.FloatField()
    end_lon = models.FloatField()
    distance_miles = models.FloatField(default=0)
    remark_location_text = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["sequence_order"]

    @property
    def duration_minutes(self):
        return (self.end_datetime - self.start_datetime).total_seconds() / 60


class LogSheet(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="log_sheets")
    log_date = models.DateField()
    day_number = models.IntegerField()
    multi_day_flag = models.BooleanField(default=False)
    driving_miles_today = models.FloatField(default=0)
    truck_mileage_today = models.FloatField(default=0)
    off_duty_minutes = models.IntegerField(default=0)
    sleeper_berth_minutes = models.IntegerField(default=0)
    driving_minutes = models.IntegerField(default=0)
    on_duty_not_driving_minutes = models.IntegerField(default=0)

    class Meta:
        ordering = ["day_number"]


class TripPreset(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    current_location_text = models.CharField(max_length=255)
    pickup_location_text = models.CharField(max_length=255)
    dropoff_location_text = models.CharField(max_length=255)
    default_cycle_used_hours = models.FloatField(default=0)

    def __str__(self):
        return self.name

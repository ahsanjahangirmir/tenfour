from django.db import migrations

PRESETS = [
    {
        "name": "LA to Denver via Vegas",
        "current_location_text": "Los Angeles, CA",
        "pickup_location_text": "Las Vegas, NV",
        "dropoff_location_text": "Denver, CO",
        "default_cycle_used_hours": 10,
    },
    {
        "name": "Dallas short-haul",
        "current_location_text": "Dallas, TX",
        "pickup_location_text": "Fort Worth, TX",
        "dropoff_location_text": "Waco, TX",
        "default_cycle_used_hours": 5,
    },
    {
        "name": "Chicago to Atlanta",
        "current_location_text": "Chicago, IL",
        "pickup_location_text": "Indianapolis, IN",
        "dropoff_location_text": "Atlanta, GA",
        "default_cycle_used_hours": 20,
    },
    {
        "name": "Cross-country: Seattle to Miami",
        "current_location_text": "Seattle, WA",
        "pickup_location_text": "Denver, CO",
        "dropoff_location_text": "Miami, FL",
        "default_cycle_used_hours": 15,
    },
    {
        "name": "Northeast corridor",
        "current_location_text": "Boston, MA",
        "pickup_location_text": "New York, NY",
        "dropoff_location_text": "Washington, DC",
        "default_cycle_used_hours": 8,
    },
]


def seed_presets(apps, schema_editor):
    TripPreset = apps.get_model("core", "TripPreset")
    for preset in PRESETS:
        TripPreset.objects.get_or_create(name=preset["name"], defaults=preset)


def remove_presets(apps, schema_editor):
    TripPreset = apps.get_model("core", "TripPreset")
    TripPreset.objects.filter(name__in=[p["name"] for p in PRESETS]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0003_scheduleblock_distance_miles"),
    ]

    operations = [
        migrations.RunPython(seed_presets, remove_presets),
    ]

from django.contrib import admin

from .models import LogSheet, ScheduleBlock, Trip, TripPreset, User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ["email", "clerk_user_id", "created_at"]
    search_fields = ["email", "clerk_user_id"]


class ScheduleBlockInline(admin.TabularInline):
    model = ScheduleBlock
    extra = 0
    ordering = ["sequence_order"]


class LogSheetInline(admin.TabularInline):
    model = LogSheet
    extra = 0
    ordering = ["day_number"]


@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "pickup_location_text", "dropoff_location_text", "logs_generated", "created_at"]
    list_filter = ["logs_generated"]
    inlines = [ScheduleBlockInline, LogSheetInline]


@admin.register(TripPreset)
class TripPresetAdmin(admin.ModelAdmin):
    list_display = ["name", "current_location_text", "pickup_location_text", "dropoff_location_text"]

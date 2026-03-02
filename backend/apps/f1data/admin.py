from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import (
    Season, Circuit, Event, Team, Driver,
    Session, SessionResult, Lap, TelemetryFrame, TrackMap
)


@admin.register(Season)
class SeasonAdmin(admin.ModelAdmin):
    list_display = ("year",)


@admin.register(Circuit)
class CircuitAdmin(admin.ModelAdmin):
    list_display = ("name", "location", "country")


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("name", "season", "round_number", "date", "circuit")
    list_filter = ("season",)


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ("name", "nationality")


@admin.register(Driver)
class DriverAdmin(admin.ModelAdmin):
    list_display = ("code", "full_name", "team", "team_color")


@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ("event", "type", "date")
    list_filter = ("type", "event__season")


@admin.register(SessionResult)
class SessionResultAdmin(admin.ModelAdmin):
    list_display = ("session", "driver", "finish_position", "points", "status")
    list_filter = ("session__type", "status")


@admin.register(Lap)
class LapAdmin(admin.ModelAdmin):
    list_display = ("session", "driver", "lap_number", "lap_time", "compound")


@admin.register(TelemetryFrame)
class TelemetryFrameAdmin(admin.ModelAdmin):
    list_display = ("session", "driver", "timestamp_ms", "speed", "lap_number")
    list_filter = ("session", "driver")


@admin.register(TrackMap)
class TrackMapAdmin(admin.ModelAdmin):
    list_display = ("circuit",)
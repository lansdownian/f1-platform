from django.db import models

# Create your models here.
from django.db import models


class Season(models.Model):
    year = models.IntegerField(unique=True)

    def __str__(self):
        return str(self.year)


class Circuit(models.Model):
    name = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    country = models.CharField(max_length=255)

    class Meta:
        unique_together = ("name", "country")

    def __str__(self):
        return self.name


class Event(models.Model):
    season = models.ForeignKey(Season, on_delete=models.CASCADE, related_name="events") 
    # related_name is used to access events from the season object/model using .events
    # on_delete=models.CASCADE means that if the season is deleted, all the events associated with it will be deleted
    # on_delete=models.SET_NULL means that if the season is deleted, the events will not be deleted and the foreign key will be set to NULL
    # on_delete=models.PROTECT means that if the season is deleted, the events will not be deleted and an error will be raised
    # on_delete=models.SET_DEFAULT means that if the season is deleted, the events will not be deleted and the default value will be set
    # on_delete=models.SET means that if the season is deleted, the events will not be deleted and the value will be set to the value of the SET
    # on_delete=models.DO_NOTHING means that if the season is deleted, the events will not be deleted and nothing will happen
    # on_delete=models.NO_ACTION means that if the season is deleted, the events will not be deleted and nothing will happen
    # on_delete=models.RESTRICT means that if the season is deleted, the events will not be deleted and an error will be raised
    circuit = models.ForeignKey(Circuit, on_delete=models.SET_NULL, null=True, related_name="events")
    round_number = models.IntegerField()
    name = models.CharField(max_length=255)
    date = models.DateField()

    class Meta:
        unique_together = ("season", "round_number")

    def __str__(self):
        return f"{self.season.year} — {self.name}"


class Team(models.Model):
    name = models.CharField(max_length=255, unique=True)
    nationality = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return self.name


class Driver(models.Model):
    code = models.CharField(max_length=3, unique=True)
    permanent_number = models.IntegerField(null=True, blank=True)
    full_name = models.CharField(max_length=255)
    team = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True, related_name="drivers")
    team_color = models.CharField(max_length=7, default="#FFFFFF")

    def __str__(self):
        return f"{self.code} — {self.full_name}"


class Session(models.Model):
    class SessionType(models.TextChoices):
        RACE = "R", "Race"
        QUALIFYING = "Q", "Qualifying"
        SPRINT = "S", "Sprint"
        PRACTICE_1 = "FP1", "Practice 1"
        PRACTICE_2 = "FP2", "Practice 2"
        PRACTICE_3 = "FP3", "Practice 3"

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="sessions")
    type = models.CharField(max_length=3, choices=SessionType.choices)
    date = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("event", "type")

    def __str__(self):
        return f"{self.event} — {self.get_type_display()}"


class SessionResult(models.Model):
    class Status(models.TextChoices):
        FINISHED = "FIN", "Finished"
        DNF = "DNF", "Did Not Finish"
        DSQ = "DSQ", "Disqualified"
        DNS = "DNS", "Did Not Start"
        NC = "NC", "Not Classified"

    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name="results")
    driver = models.ForeignKey(Driver, on_delete=models.CASCADE, related_name="results")
    team = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True, related_name="results")
    grid_position = models.IntegerField(null=True, blank=True)
    finish_position = models.IntegerField(null=True, blank=True)
    points = models.FloatField(default=0)
    status = models.CharField(max_length=3, choices=Status.choices, default=Status.FINISHED)
    fastest_lap = models.BooleanField(default=False)

    class Meta:
        unique_together = ("session", "driver")

    def __str__(self):
        return f"{self.session} — {self.driver.code} P{self.finish_position}"


class Lap(models.Model):
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name="laps")
    driver = models.ForeignKey(Driver, on_delete=models.CASCADE, related_name="laps")
    lap_number = models.IntegerField()
    lap_time = models.DurationField(null=True, blank=True)
    sector_1 = models.DurationField(null=True, blank=True)
    sector_2 = models.DurationField(null=True, blank=True)
    sector_3 = models.DurationField(null=True, blank=True)
    compound = models.CharField(max_length=50, blank=True)
    stint = models.IntegerField(null=True, blank=True)
    is_personal_best = models.BooleanField(default=False)

    class Meta:
        unique_together = ("session", "driver", "lap_number")

    def __str__(self):
        return f"{self.session} — {self.driver.code} Lap {self.lap_number}"


class TelemetryFrame(models.Model):
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name="telemetry_frames")
    driver = models.ForeignKey(Driver, on_delete=models.CASCADE, related_name="telemetry_frames")
    timestamp_ms = models.BigIntegerField()
    x = models.FloatField()
    y = models.FloatField()
    speed = models.FloatField(null=True)
    gear = models.IntegerField(null=True)
    throttle = models.FloatField(null=True)
    brake = models.BooleanField(default=False)
    drs = models.IntegerField(null=True)
    lap_number = models.IntegerField(null=True)
    compound = models.CharField(max_length=20, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["session", "timestamp_ms"]),
            models.Index(fields=["session", "driver", "timestamp_ms"]),
        ]

    def __str__(self):
        return f"{self.session} — {self.driver.code} @ {self.timestamp_ms}ms"


class TrackMap(models.Model):
    circuit = models.ForeignKey(Circuit, on_delete=models.CASCADE, related_name="track_maps")
    x_points = models.JSONField()
    y_points = models.JSONField()

    def __str__(self):
        return f"TrackMap — {self.circuit.name}"
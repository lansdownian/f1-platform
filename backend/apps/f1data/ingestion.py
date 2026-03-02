import fastf1
import numpy as np
from django.db import transaction
from .models import (
    Season, Circuit, Event, Team, Driver,
    Session, TelemetryFrame, TrackMap
)

# Team colors mapping
TEAM_COLORS = {
    "Red Bull Racing": "#3671C6",
    "Ferrari": "#E8002D",
    "Mercedes": "#27F4D2",
    "McLaren": "#FF8000",
    "Aston Martin": "#229971",
    "Alpine": "#FF87BC",
    "Williams": "#64C4FF",
    "RB": "#6692FF",
    "Haas F1 Team": "#B6BABD",
    "Kick Sauber": "#52E252",
}

COMPOUND_COLORS = {
    "SOFT": "#FF3333",
    "MEDIUM": "#FFD700",
    "HARD": "#FFFFFF",
    "INTERMEDIATE": "#39B54A",
    "WET": "#0067FF",
}


def ingest_session(year: int, round_number: int, session_type: str = "R"):
    """
    Main ingestion entry point.
    Call: ingest_session(2024, 1, "R")
    """
    fastf1.Cache.enable_cache(".fastf1-cache")

    ff1_session = fastf1.get_session(year, round_number, session_type)
    ff1_session.load(telemetry=True, laps=True, weather=False)

    with transaction.atomic():
        season, _ = Season.objects.get_or_create(year=year)

        circuit, _ = Circuit.objects.get_or_create(
            name=ff1_session.event["OfficialEventName"],
            defaults={
                "location": ff1_session.event.get("Location", ""),
                "country": ff1_session.event.get("Country", ""),
            }
        )

        event, _ = Event.objects.get_or_create(
            season=season,
            round_number=round_number,
            defaults={
                "circuit": circuit,
                "name": ff1_session.event["EventName"],
                "date": ff1_session.event["EventDate"].date(),
            }
        )

        session, _ = Session.objects.get_or_create(
            event=event,
            type=session_type,
            defaults={"date": ff1_session.date}
        )

        # Delete existing frames for clean re-ingest
        TelemetryFrame.objects.filter(session=session).delete()

        _ingest_track_map(ff1_session, circuit)
        _ingest_drivers_and_telemetry(ff1_session, session)

    return session.id


def _ingest_track_map(ff1_session, circuit):
    """Extract track outline from first driver's telemetry."""
    if TrackMap.objects.filter(circuit=circuit).exists():
        return

    try:
        driver_code = ff1_session.drivers[0]
        lap = ff1_session.laps.pick_driver(driver_code).pick_fastest()
        tel = lap.get_telemetry()

        TrackMap.objects.create(
            circuit=circuit,
            x_points=tel["X"].tolist(),
            y_points=tel["Y"].tolist(),
        )
    except Exception as e:
        print(f"Track map extraction failed: {e}")


def _ingest_drivers_and_telemetry(ff1_session, session):
    """Ingest all driver telemetry frames, sampled every 200ms."""
    frames_to_create = []
    session_start = ff1_session.session_start_time

    for driver_code in ff1_session.drivers:
        try:
            driver_info = ff1_session.get_driver(driver_code)
            team_name = driver_info.get("TeamName", "Unknown")
            color = TEAM_COLORS.get(team_name, "#FFFFFF")

            team, _ = Team.objects.get_or_create(
                name=team_name,
                defaults={"nationality": ""}
            )

            driver, _ = Driver.objects.get_or_create(
                code=driver_code,
                defaults={
                    "full_name": driver_info.get("FullName", driver_code),
                    "permanent_number": driver_info.get("DriverNumber", None),
                    "team": team,
                    "team_color": color,
                }
            )
            # Update color if changed
            Driver.objects.filter(code=driver_code).update(team_color=color, team=team)

            laps = ff1_session.laps.pick_driver(driver_code)

            for _, lap in laps.iterlaps():
                try:
                    tel = lap.get_telemetry().add_distance()
                    if tel.empty:
                        continue

                    compound = lap.get("Compound", "UNKNOWN") or "UNKNOWN"
                    lap_number = int(lap.get("LapNumber", 0) or 0)

                    # Sample every 200ms to keep DB size reasonable
                    tel = tel.iloc[::4]

                    for _, row in tel.iterrows():
                        t = row.get("SessionTime")
                        if t is None or (hasattr(t, 'isnull') and t.isnull()):
                            continue

                        ts_ms = int(t.total_seconds() * 1000)

                        frames_to_create.append(TelemetryFrame(
                            session=session,
                            driver=driver,
                            timestamp_ms=ts_ms,
                            x=float(row.get("X", 0) or 0),
                            y=float(row.get("Y", 0) or 0),
                            speed=float(row.get("Speed", 0) or 0),
                            gear=int(row.get("nGear", 0) or 0),
                            throttle=float(row.get("Throttle", 0) or 0),
                            brake=bool(row.get("Brake", False)),
                            drs=int(row.get("DRS", 0) or 0),
                            lap_number=lap_number,
                            compound=str(compound),
                        ))

                        # Bulk insert every 5000 rows
                        if len(frames_to_create) >= 5000:
                            TelemetryFrame.objects.bulk_create(frames_to_create)
                            frames_to_create = []

                except Exception as e:
                    print(f"Lap error for {driver_code}: {e}")
                    continue

        except Exception as e:
            print(f"Driver error {driver_code}: {e}")
            continue

    if frames_to_create:
        TelemetryFrame.objects.bulk_create(frames_to_create)
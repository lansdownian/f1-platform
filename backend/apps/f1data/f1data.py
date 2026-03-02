# for ninja routers and api 
from ninja import Router
from django.shortcuts import get_object_or_404
from .models import Season, Event, Session, TelemetryFrame, TrackMap, Driver
from .ingestion import ingest_session as run_ingestion

router = Router()


@router.get("/seasons")
def list_seasons(request):
    return [{"id": s.id, "year": s.year} for s in Season.objects.order_by("-year")]


@router.get("/events/{year}")
def list_events(request, year: int):
    season = get_object_or_404(Season, year=year)
    return [
        {
            "id": e.id,
            "round": e.round_number,
            "name": e.name,
            "date": str(e.date),
        }
        for e in season.events.order_by("round_number")
    ]


@router.get("/sessions/{event_id}")
def list_sessions(request, event_id: int):
    event = get_object_or_404(Event, id=event_id)
    return [
        {"id": s.id, "type": s.type, "label": s.get_type_display()}
        for s in event.sessions.all()
    ]


@router.get("/trackmap/{session_id}")
def get_track_map(request, session_id: int):
    session = get_object_or_404(Session, id=session_id)
    track = session.event.circuit.track_maps.first()
    if not track:
        return {"x": [], "y": []}
    return {"x": track.x_points, "y": track.y_points}


@router.get("/drivers/{session_id}")
def get_drivers(request, session_id: int):
    session = get_object_or_404(Session, id=session_id)
    drivers = Driver.objects.filter(
        telemetry_frames__session=session
    ).distinct().values("id", "code", "full_name", "team_color", "team__name")
    return list(drivers)


@router.get("/frames/{session_id}")
def get_frames(request, session_id: int, from_ms: int = 0, to_ms: int = 10000):
    """
    Returns telemetry frames for all drivers between from_ms and to_ms.
    Frontend should paginate: request in chunks of 10000ms.
    """
    frames = (
        TelemetryFrame.objects
        .filter(session_id=session_id, timestamp_ms__gte=from_ms, timestamp_ms__lt=to_ms)
        .select_related("driver")
        .order_by("timestamp_ms")
        .values(
            "driver__code", "driver__team_color", "timestamp_ms",
            "x", "y", "speed", "gear", "throttle", "brake", "drs",
            "lap_number", "compound"
        )
    )
    return list(frames)


@router.get("/session-duration/{session_id}")
def get_session_duration(request, session_id: int):
    """Returns min and max timestamp_ms for the session."""
    from django.db.models import Min, Max
    result = TelemetryFrame.objects.filter(session_id=session_id).aggregate(
        min_ms=Min("timestamp_ms"),
        max_ms=Max("timestamp_ms")
    )
    return result


@router.post("/ingest")
def ingest(request, year: int, round: int, type: str = "R"):
    """Trigger ingestion. Run once per session."""
    try:
        session_id = run_ingestion(year, round, type)
        return {"status": "ok", "session_id": session_id}
    except Exception as e:
        return {"status": "error", "detail": str(e)}
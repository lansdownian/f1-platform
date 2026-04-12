import fastf1
from datetime import datetime

CURRENT_SEASON = datetime.now().year

fastf1.Cache.enable_cache("cache/")


def get_latest_race_data():
    schedule = fastf1.get_event_schedule(CURRENT_SEASON)

    now = datetime.now()

    completed_races = schedule[schedule['EventDate'] < now]
    latest_event = completed_races.iloc[-1]

    session = fastf1.get_session(
        CURRENT_SEASON,
        latest_event['EventName'],
        'R'
    )
    session.load()

    # 🏁 Race Info
    race_info = {
        "name": latest_event['EventName'],
        "location": latest_event['Location'],
        "date": str(latest_event['EventDate'])
    }

    # 🏆 Results
    results = []
    for _, row in session.results.iterrows():
        results.append({
            "position": int(row["Position"]),
            "driver": row["Abbreviation"],
            "team": row["TeamName"],
            "grid": int(row["GridPosition"]),
            "status": row["Status"]
        })

    # 🔥 Fastest Lap
    fastest_lap = session.laps.pick_fastest()
    fastest = {
        "driver": fastest_lap["Driver"],
        "time": str(fastest_lap["LapTime"])
    }

    return {
        "race": race_info,
        "results": results,
        "fastest_lap": fastest
    }
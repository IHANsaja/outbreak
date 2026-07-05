import json
from pathlib import Path
from datetime import datetime, timedelta, timezone


def seed_history():
    """Generates a realistic 12-hour, hourly-spaced synthetic history window
    for Hanwella (Station 21), ending "now". Each record has a real `datetime`
    field 1 hour apart from its neighbors, matching what api_client.py now
    builds via real-timestamp interpolation - this is the fixture consumed
    directly by test_api.py to exercise /predict without needing live
    Supabase data.
    """
    fixture_file = Path(__file__).resolve().parent / "test_fixture.json"

    anchor = datetime.now(timezone.utc)
    base_level = 4.6

    history = []
    for i in range(12):
        ts = anchor - timedelta(hours=(11 - i))
        level = base_level + i * 0.05
        history.append({
            "station_id": 21,
            "river_id": 22,
            "hour": ts.hour,
            "month": ts.month,
            "alert_level": 7.0,
            "minor_flood": 8.0,
            "major_flood": 9.0,
            "water_level_lag1": level - 0.05 if i > 0 else level,
            "water_level_lag2": level - 0.10 if i > 1 else level,
            "rainfall_roll3": 10.5,
            "water_level_now": level,
            "datetime": ts.isoformat(),
            "time_idx": i,
        })

    with open(fixture_file, 'w') as f:
        json.dump(history, f, indent=2)
    print(f"Seeded {len(history)}-hour realistic fixture to {fixture_file}")


if __name__ == "__main__":
    seed_history()

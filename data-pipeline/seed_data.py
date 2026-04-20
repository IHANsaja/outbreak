import json
from pathlib import Path

def seed_history():
    history_file = Path("d:/Projects/outbreak/data-pipeline/latest_history.json")
    
    # Create 12 dummy reports for Hanwella (Station 21)
    base_report = {
        "station_id": 21,
        "river_id": 22,
        "hour": 12,
        "month": 4,
        "alert_level": 7.0,
        "minor_flood": 8.0,
        "major_flood": 9.0,
        "water_level_lag1": 4.5,
        "water_level_lag2": 4.4,
        "rainfall_roll3": 10.5,
        "water_level_now": 4.6
    }
    
    history = {
        "21": [base_report.copy() for _ in range(12)]
    }
    
    # Introduce small variations
    for i in range(12):
        history["21"][i]["water_level_now"] += i * 0.05
        history["21"][i]["hour"] = (12 + i*3) % 24
        
    with open(history_file, 'w') as f:
        json.dump(history, f)
    print("History seeded successfully.")

if __name__ == "__main__":
    seed_history()

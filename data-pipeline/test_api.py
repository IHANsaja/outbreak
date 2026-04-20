import requests
import json

def test_api():
    url = "http://localhost:8000/predict"
    
    # Send 12 reports
    history = []
    for i in range(12):
        history.append({
            "station_id": 21,
            "river_id": 22,
            "hour": (12 + i*3) % 24,
            "month": 4,
            "alert_level": 7.0,
            "minor_flood": 8.0,
            "major_flood": 9.0,
            "water_level_lag1": 4.5,
            "water_level_lag2": 4.4,
            "rainfall_roll3": 10.0,
            "water_level_now": 4.6 + i*0.1
        })
    
    print(f"Sending request to {url}...")
    try:
        resp = requests.post(url, json=history, timeout=10)
        print(f"Status Code: {resp.status_code}")
        if resp.status_code == 200:
            print("Response Forecasts:")
            print(json.dumps(resp.json()["forecasts"], indent=4))
        else:
            print(f"Error: {resp.text}")
    except Exception as e:
        print(f"Connection Error: {e}")

if __name__ == "__main__":
    test_api()

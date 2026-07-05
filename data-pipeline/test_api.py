import requests
import json
from pathlib import Path
from seed_data import seed_history


def test_api():
    url = "http://localhost:8000/predict"

    fixture_file = Path(__file__).resolve().parent / "test_fixture.json"
    if not fixture_file.exists():
        seed_history()
    with open(fixture_file) as f:
        history = json.load(f)

    print(f"Sending request to {url} with {len(history)} hourly-spaced records...")
    try:
        resp = requests.post(url, json=history, timeout=15)
        print(f"Status Code: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            print("Response Forecasts:")
            print(json.dumps(data["forecasts"], indent=4))
            print("Dampened flags:")
            print(json.dumps(data.get("dampened", {}), indent=4))
        else:
            print(f"Error: {resp.text}")
    except Exception as e:
        print(f"Connection Error: {e}")


if __name__ == "__main__":
    test_api()

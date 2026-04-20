import requests
import json
import logging
import pandas as pd
import os
from dotenv import load_dotenv
from datetime import datetime
from pathlib import Path

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

class APIClient:
    def __init__(self, api_url=None, history_file="latest_history.json"):
        # Load from environment or use defaults
        self.api_url = api_url or os.getenv("FORECASTING_ENGINE_URL", "http://localhost:8000")
        self.history_file = Path(history_file)
        self.history = self._load_history()
        
        # Supabase Config - Using direct REST API for robustness
        self.supabase_url = os.getenv("SUPABASE_URL", "")
        # Service role key (Legacy JWT) for backend bypass of RLS
        self.supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    def _load_history(self):
        if self.history_file.exists():
            try:
                with open(self.history_file, 'r') as f:
                    return json.load(f)
            except:
                return {}
        return {}

    def _save_history(self):
        with open(self.history_file, 'w') as f:
            json.dump(self.history, f)

    def _get_previous_report(self, station_id):
        """Fetches the most recent report for a station from Supabase."""
        headers = {
            "apikey": self.supabase_key,
            "Authorization": f"Bearer {self.supabase_key}"
        }
        url = f"{self.supabase_url}/rest/v1/river_reports?station_id=eq.{station_id}&order=created_at.desc&limit=1"
        try:
            resp = requests.get(url, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                return data[0] if data else None
        except Exception as e:
            logger.error(f"Failed to fetch previous report for station {station_id}: {e}")
        return None

    def update_and_send(self, new_rows):
        """
        Takes rows from pipeline_core, updates station history, sends to forecasting engine,
        and finally persists results to Supabase via PostgREST.
        """
        now = datetime.now()
        month = now.month
        hour = now.hour

        for row in new_rows:
            station_id = int(row['station_id'])
            
            # Fetch previous state for lags
            prev = self._get_previous_report(station_id)
            
            # Safely handle missing fields from the scraper
            water_now = float(row.get('water_level_now', 0.0))
            lag1 = float(prev.get('water_level_now', water_now)) if prev else water_now
            lag2 = float(prev.get('water_level_lag1', lag1)) if prev else lag1
            
            # Prepare the report format for the API history window
            report = {
                "station_id": station_id,
                "river_id": int(row['river_id']),
                "hour": hour,
                "month": month,
                "alert_level": float(row.get('alert_level', 4.0)), # Default if missing
                "minor_flood": float(row.get('minor_flood', 6.0)),
                "major_flood": float(row.get('major_flood', 8.0)),
                "water_level_lag1": lag1,
                "water_level_lag2": lag2,
                "rainfall_roll3": float(row.get('rainfall', 0.0)),
                "water_level_now": water_now
            }

            # Handle Station History for internal tracking
            if str(station_id) not in self.history:
                self.history[str(station_id)] = []
            
            self.history[str(station_id)].append(report)
            if len(self.history[str(station_id)]) > 24:
                self.history[str(station_id)] = self.history[str(station_id)][-24:]

            # 2. Get AI Forecast from Engine
            forecast = {}
            try:
                # We need at least some history for better prediction, but engine takes single reports too
                # For optimal prediction, the engine expects the last 12-24 records, 
                # but we'll send the current one as a start.
                resp = requests.post(f"{self.api_url}/predict", json=self.history[str(station_id)])
                if resp.status_code == 200:
                    forecast = resp.json()
                    logger.info(f"Received forecast for station {station_id}: {forecast}")
                else:
                    logger.warning(f"Forecasting engine returned {resp.status_code}: {resp.text}")
            except Exception as e:
                logger.error(f"Failed to reach forecasting engine: {e}")

            # 3. Persist combined report + forecast to Supabase
            # Engine response: {"success": true, "forecasts": {"early_warning_1h": ..., ...}}
            forecasts_data = forecast.get("forecasts", {})
            final_record = {
                **report,
                "forecast_1h": forecasts_data.get("early_warning_1h"),
                "forecast_12h": forecasts_data.get("trend_monitor_12h"),
                "forecast_24h": forecasts_data.get("strategic_path_24h"),
                "is_anomaly": forecast.get("is_anomaly", False)
            }

            headers = {
                "apikey": self.supabase_key,
                "Authorization": f"Bearer {self.supabase_key}",
                "Content-Type": "application/json",
                "Prefer": "return=minimal"
            }
            
            try:
                db_resp = requests.post(
                    f"{self.supabase_url}/rest/v1/river_reports",
                    headers=headers,
                    data=json.dumps(final_record)
                )
                if db_resp.status_code in [200, 201]:
                    logger.info(f"Successfully persisted report for station {station_id} to Supabase")
                else:
                    logger.error(f"Supabase persistence failed: {db_resp.status_code} - {db_resp.text}")
            except Exception as e:
                logger.error(f"Request to Supabase failed: {e}")

        self._save_history()

    def _post_to_engine(self, history_window):
        try:
            resp = requests.post(
                f"{self.api_url}/predict",
                json=history_window,
                timeout=10
            )
            if resp.status_code == 200:
                result = resp.json()
                logger.info(f"Forecast updated for Station {history_window[-1]['station_id']}")
                return result['forecasts']
            else:
                logger.error(f"Engine prediction failed: {resp.text}")
        except Exception as e:
            logger.error(f"Error connecting to Forecasting Engine: {e}")
        return None

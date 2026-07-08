import requests
import json
import logging
import pandas as pd
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta, timezone
from pathlib import Path

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)


class APIClient:
    def __init__(self, api_url=None):
        # Load from environment or use defaults
        self.api_url = api_url or os.getenv("FORECASTING_ENGINE_URL", "http://localhost:8000")

        # Supabase Config - Using direct REST API for robustness
        self.supabase_url = os.getenv("SUPABASE_URL", "")
        # Service role key (Legacy JWT) for backend bypass of RLS
        self.supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    def _get_real_window(self, station_id, hours=48):
        """Fetches all real (non-anomalous, non-negative) rows for a station
        within the last `hours` wall-clock hours, sorted ascending by
        timestamp. This replaces the old row-count-based `limit=N` fetch,
        which had no awareness of how much real time those N rows actually
        spanned (in production, gaps between consecutive rows range from
        minutes to over a day)."""
        headers = {
            "apikey": self.supabase_key,
            "Authorization": f"Bearer {self.supabase_key}"
        }
        since = (datetime.now(timezone.utc) - timedelta(hours=hours)).isoformat()
        url = f"{self.supabase_url}/rest/v1/river_reports"
        params = {
            "station_id": f"eq.{station_id}",
            "is_anomaly": "eq.false",
            "water_level_now": "gte.0",
            "timestamp": f"gte.{since}",
            "order": "timestamp.asc",
            "limit": "500",
        }
        try:
            resp = requests.get(url, headers=headers, params=params, timeout=15)
            if resp.status_code == 200:
                return resp.json()
            logger.warning(f"_get_real_window non-200 for station {station_id}: {resp.status_code}")
        except Exception as e:
            logger.error(f"Failed to fetch real window for station {station_id}: {e}")
        return []

    def _build_hourly_window(self, real_rows, anchor_dt, n_hours=12):
        """Linearly interpolates real (irregularly-spaced) readings onto a
        strict hourly grid ending at `anchor_dt` - mirroring exactly how the
        training dataset was built (real ~3-hourly DMC reports interpolated
        onto an hourly grid). This is what makes water_level_lag1/lag2
        genuinely mean "1 hour ago" / "2 hours ago" again, instead of
        "whatever the previous database row happened to be, regardless of
        real elapsed time."

        Returns (target_index, hourly_water_level, hourly_rolling_rainfall),
        or None if there isn't enough real coverage to interpolate at least 2
        points of the requested window.
        """
        idx = pd.to_datetime([r['timestamp'] for r in real_rows], utc=True)
        wl = pd.Series([float(r['water_level_now']) for r in real_rows], index=idx)
        rf = pd.Series(
            [float(r.get('rainfall', r.get('rainfall_roll3', 0.0)) or 0.0) for r in real_rows],
            index=idx
        )
        # pandas requires a unique, monotonic index to interpolate
        wl = wl[~wl.index.duplicated(keep='last')].sort_index()
        rf = rf[~rf.index.duplicated(keep='last')].sort_index()

        earliest_real = wl.index.min()
        anchor_ts = pd.Timestamp(anchor_dt)
        if anchor_ts.tzinfo is None:
            anchor_ts = anchor_ts.tz_localize('UTC')
        target_index = pd.date_range(end=anchor_ts, periods=n_hours, freq='h')

        usable_targets = target_index[target_index >= earliest_real]
        if len(usable_targets) < 2:
            return None

        combined_wl = wl.reindex(wl.index.union(target_index)).interpolate(method='time')
        combined_rf = rf.reindex(rf.index.union(target_index)).interpolate(method='time')

        hourly_wl = combined_wl.reindex(target_index)
        hourly_rf = combined_rf.reindex(target_index)

        # rainfall_roll3: pragmatic approximation given no persisted raw
        # rainfall time series - interpolate the noisy single-value rainfall
        # anchors onto the hourly grid, then take a genuine trailing 3-hour
        # rolling mean of that interpolated series. This is the best
        # available approximation, not a true rolling sum of raw sub-hourly
        # rainfall readings.
        rolled_rf = hourly_rf.rolling(window=3, min_periods=1).mean()

        # Target points older than our earliest real coverage remain NaN
        # after reindex/interpolate (pandas won't extrapolate). Hold the
        # earliest/latest known value flat for those - a documented "we
        # don't know what happened before we started measuring" fallback,
        # not a fabricated trend. The >=2-usable-target gate above already
        # bounds how much of the window this can affect.
        hourly_wl = hourly_wl.bfill().ffill()
        rolled_rf = rolled_rf.bfill().ffill()

        return target_index, hourly_wl, rolled_rf

    def _prepare_window(self, real_rows, current_report, anchor_dt):
        """Builds the 12-row, hourly-interpolated payload sent to /predict.
        Returns None when there isn't enough real history to interpolate
        meaningfully (fewer than 2 real points, or real coverage spanning
        less than 2 hours) - callers should persist null forecasts rather
        than fabricate a window from near-nothing."""
        rows = list(real_rows)
        rows.append({
            'timestamp': anchor_dt.isoformat(),
            'water_level_now': current_report['water_level_now'],
            'rainfall': current_report.get('rainfall', 0.0),
            'rainfall_roll3': current_report.get('rainfall', 0.0),
        })

        if len(rows) < 2:
            return None

        first_ts = pd.to_datetime(rows[0]['timestamp'], utc=True)
        last_ts = pd.to_datetime(rows[-1]['timestamp'], utc=True)
        span_hours = (last_ts - first_ts).total_seconds() / 3600.0
        if span_hours < 2:
            return None

        built = self._build_hourly_window(rows, anchor_dt, n_hours=12)
        if built is None:
            return None
        target_index, hourly_wl, rolled_rf = built

        records = []
        for i, ts in enumerate(target_index):
            now_val = hourly_wl.iloc[i]
            lag1 = hourly_wl.iloc[i - 1] if i >= 1 else now_val
            lag2 = hourly_wl.iloc[i - 2] if i >= 2 else lag1
            records.append({
                "station_id": current_report['station_id'],
                "river_id": current_report['river_id'],
                "hour": int(ts.hour),
                "month": int(ts.month),
                "alert_level": current_report['alert_level'],
                "minor_flood": current_report['minor_flood'],
                "major_flood": current_report['major_flood'],
                "water_level_lag1": float(lag1),
                "water_level_lag2": float(lag2),
                "rainfall_roll3": float(rolled_rf.iloc[i]),
                "water_level_now": float(now_val),
                "datetime": ts.isoformat(),
                "time_idx": i,
            })
        return records

    def update_and_send(self, new_rows):
        """
        Takes rows from pipeline_core, builds a real-timestamp-interpolated
        historical window, sends it to the forecasting engine, and persists
        the combined report + forecast to Supabase via PostgREST.
        """
        for row in new_rows:
            station_id = int(row['station_id'])
            anchor_dt = datetime.now(timezone.utc)

            water_now = float(row.get('water_level_now', 0.0))
            rainfall_now = float(row.get('rainfall', 0.0))

            real_rows = self._get_real_window(station_id, hours=48)
            prev = real_rows[-1] if real_rows else None

            # Threshold fallback: use the most recent real row if the
            # scraper returned ~0 (extraction failure). Verified against
            # live production data: every station currently has a stable,
            # correctly-extracted threshold triple, so this fallback is a
            # dormant edge case (first-ever reading for a brand new station)
            # rather than an active issue - left as-is per audit findings.
            alert = float(row.get('alert_level', 0.0))
            if alert <= 0.1 and prev: alert = float(prev.get('alert_level', 4.0))
            elif alert <= 0.1: alert = 4.0

            minor = float(row.get('minor_flood', 0.0))
            if minor <= 0.1 and prev: minor = float(prev.get('minor_flood', 6.0))
            elif minor <= 0.1: minor = 6.0

            major = float(row.get('major_flood', 0.0))
            if major <= 0.1 and prev: major = float(prev.get('major_flood', 8.0))
            elif major <= 0.1: major = 8.0

            current_report = {
                "station_id": station_id,
                "river_id": int(row['river_id']),
                "alert_level": alert,
                "minor_flood": minor,
                "major_flood": major,
                "water_level_now": water_now,
                "rainfall": rainfall_now,
            }

            history_window = self._prepare_window(real_rows, current_report, anchor_dt)

            forecast = {}
            if history_window is not None:
                try:
                    resp = requests.post(f"{self.api_url}/predict", json=history_window, timeout=15)
                    if resp.status_code == 200:
                        forecast = resp.json()
                        logger.info(f"Received forecast for station {station_id}: {forecast}")
                    else:
                        logger.warning(f"Forecasting engine returned {resp.status_code}: {resp.text}")
                except Exception as e:
                    logger.error(f"Failed to reach forecasting engine: {e}")
            else:
                logger.warning(
                    f"Station {station_id}: insufficient real history to interpolate "
                    f"(need >=2 real points spanning >=2h) - storing null forecasts."
                )

            forecasts_data = forecast.get("forecasts", {})
            dampened_data = forecast.get("dampened", {})
            quantile_range = forecast.get("quantile_range", {}).get("strategic_path_24h")

            # lag1/lag2 persisted alongside the report reflect what the model
            # actually used (the interpolated hourly values), not just the
            # raw previous database row.
            if history_window:
                lag1 = history_window[-2]['water_level_now'] if len(history_window) >= 2 else water_now
                lag2 = history_window[-3]['water_level_now'] if len(history_window) >= 3 else lag1
                rainfall_roll3_final = history_window[-1]['rainfall_roll3']
            else:
                lag1 = float(prev.get('water_level_now', water_now)) if prev else water_now
                lag2 = water_now
                rainfall_roll3_final = rainfall_now

            final_record = {
                "station_id": station_id,
                "river_id": int(row['river_id']),
                "hour": anchor_dt.hour,
                "month": anchor_dt.month,
                "alert_level": alert,
                "minor_flood": minor,
                "major_flood": major,
                "water_level_lag1": lag1,
                "water_level_lag2": lag2,
                "rainfall_roll3": rainfall_roll3_final,
                "water_level_now": water_now,
                "forecast_1h": forecasts_data.get("early_warning_1h"),
                "forecast_12h": forecasts_data.get("trend_monitor_12h"),
                "forecast_24h": forecasts_data.get("strategic_path_24h"),
                "is_anomaly": forecast.get("is_anomaly", False),
                "dampened_1h": dampened_data.get("early_warning_1h", False),
                "dampened_12h": dampened_data.get("trend_monitor_12h", False),
                "dampened_24h": dampened_data.get("strategic_path_24h", False),
                "forecast_24h_lower": quantile_range.get("lower") if quantile_range else None,
                "forecast_24h_upper": quantile_range.get("upper") if quantile_range else None,
                "forecast_24h_confidence_pct": quantile_range.get("confidence_pct") if quantile_range else None,
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

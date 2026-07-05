from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import numpy as np
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
from predictor import ForecastingEngine

app = FastAPI(title="Outbreak Flood Forecasting Engine")

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Engine
engine = ForecastingEngine(
    models_dir="../models"
)

class RiverReport(BaseModel):
    station_id: int
    river_id: int
    hour: int
    month: int
    alert_level: float
    minor_flood: float
    major_flood: float
    water_level_lag1: float
    water_level_lag2: float
    rainfall_roll3: float
    water_level_now: float
    datetime: Optional[str] = None
    time_idx: Optional[int] = None

@app.get("/health")
def health():
    return {"status": "operational", "roles": ["Early Warning", "Trend Monitor", "Strategic Path"]}


def _smart_pad(records: list, target: int = 12) -> list:
    """Pad a short history window to `target` records using linear-trend
    backward projection instead of a flat repeated-first-row line.

    In normal operation the caller (data-pipeline/api_client.py) already
    builds a full 12-row, hourly-interpolated window before POSTing here, so
    this rarely triggers. It exists as defense-in-depth for any other direct
    caller (e.g. test scripts) that sends fewer than 12 records."""
    if len(records) >= target:
        return records
    if len(records) < 2:
        # With <2 records we truly cannot infer a trend; fall back to
        # flat-repeat as an honest last resort.
        while len(records) < target and records:
            records.insert(0, records[0].copy())
        return records

    now_val = records[-1]['water_level_now']
    prev_val = records[-2]['water_level_now']
    delta = now_val - prev_val
    needed = target - len(records)
    padding = []
    for i in range(needed, 0, -1):
        p = records[0].copy()
        p['water_level_now'] = max(0.0, now_val - delta * (i + len(records) - 1))
        padding.append(p)
    return padding + records


@app.post("/predict")
def predict(history: List[RiverReport]):
    """
    Expects a list of 12 RiverReport objects (historical window).
    Returns specialized forecasts for 1h, 12h, and 24h.
    """
    if len(history) < 1:
        raise HTTPException(status_code=400, detail="At least 1 report is required.")

    records = [r.dict() for r in history]
    records = _smart_pad(records, target=12)

    df = pd.DataFrame(records)
    
    # --- Column preparation ---
    # 'rainfall' is required by TFT but not sent by the API client
    if 'rainfall' not in df.columns:
        df['rainfall'] = df['rainfall_roll3']
    
    # 'time_idx' must be sequential integers; generate if missing/null
    if df['time_idx'].isnull().all():
        df['time_idx'] = np.arange(len(df), dtype=np.int64)
    else:
        df['time_idx'] = pd.to_numeric(df['time_idx'], errors='coerce').ffill().astype(np.int64)
        
    # --- Type coercion ---
    # Numeric coercion for all feature columns
    for col in engine.base_features:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')
    df['rainfall'] = pd.to_numeric(df['rainfall'], errors='coerce')
    
    # Integer columns
    df['hour'] = df['hour'].astype(np.int64)
    df['month'] = df['month'].astype(np.int64)
    
    # Categorical columns (strings for TFT, converted to numeric inside XGBoost/LSTM methods)
    df['station_id'] = df['station_id'].astype(str)
    df['river_id'] = df['river_id'].astype(str)

    try:
        forecasts = engine.get_specialized_forecasts(df)
        
        # Anomaly Detection: Mark as anomaly if results are physically impossible
        # or show extreme divergence from the current reading.
        last_val = float(df.iloc[-1]['water_level_now'])
        is_anomaly = False
        
        # Check for extreme levels or jumps (>15m in 12h/24h)
        if (forecasts["trend_monitor_12h"] > 25.0 or forecasts["trend_monitor_12h"] < 0.0 or
            forecasts["strategic_path_24h"] > 25.0 or forecasts["strategic_path_24h"] < 0.0):
            is_anomaly = True
            
        if abs(forecasts["trend_monitor_12h"] - last_val) > 15.0:
            is_anomaly = True

        return {
            "success": True,
            "is_anomaly": is_anomaly,
            "forecasts": {
                "early_warning_1h": forecasts["early_warning_1h"],
                "trend_monitor_12h": forecasts["trend_monitor_12h"],
                "strategic_path_24h": forecasts["strategic_path_24h"]
            },
            "dampened": forecasts["dampened"],
            "units": "meters",
            "metadata": {
                "window_size": len(df),
                "last_reading": last_val
            }
        }
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

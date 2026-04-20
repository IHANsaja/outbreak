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

@app.post("/predict")
def predict(history: List[RiverReport]):
    """
    Expects a list of 12 RiverReport objects (historical window).
    Returns specialized forecasts for 1h, 12h, and 24h.
    """
    if len(history) < 1:
        raise HTTPException(status_code=400, detail="At least 1 report is required.")
    
    # Pad history to 12 records if we have fewer — repeat the oldest record
    records = [r.dict() for r in history]
    while len(records) < 12:
        records.insert(0, records[0].copy())
    
    df = pd.DataFrame(records)
    
    # --- Column preparation ---
    # 'rainfall' is required by TFT but not sent by the API client
    if 'rainfall' not in df.columns:
        df['rainfall'] = df['rainfall_roll3']
    
    # 'time_idx' must be sequential integers; generate if missing/null
    if df['time_idx'].isnull().all():
        df['time_idx'] = np.arange(len(df), dtype=np.int64)
    else:
        df['time_idx'] = pd.to_numeric(df['time_idx'], errors='coerce').fillna(method='ffill').astype(np.int64)
        
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
        return {
            "success": True,
            "forecasts": {
                "early_warning_1h": forecasts["early_warning_1h"],
                "trend_monitor_12h": forecasts["trend_monitor_12h"],
                "strategic_path_24h": forecasts["strategic_path_24h"]
            },
            "units": "meters",
            "metadata": {
                "window_size": len(df),
                "last_reading": float(df.iloc[-1]['water_level_now'])
            }
        }
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

import torch
import torch.nn as nn
import pandas as pd
import numpy as np
import joblib
import os
from typing import List, Dict
from pathlib import Path

# Suppress warnings for cleaner logs
import warnings
warnings.filterwarnings("ignore")


class FloodLSTM(nn.Module):
    """LSTM architecture matching the trained checkpoint.
    Architecture derived from state_dict inspection:
      - lstm: input_size=10, hidden_size=128, num_layers=2
      - fc:   in_features=128, out_features=1
    """
    def __init__(self, input_size=10, hidden_size=128, num_layers=2, output_size=1):
        super().__init__()
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_size, output_size)

    def forward(self, x):
        out, _ = self.lstm(x)
        out = self.fc(out[:, -1, :])  # Take last timestep
        return out


class ForecastingEngine:
    def __init__(self, models_dir="../models"):
        self.models_dir = Path(models_dir)
        self.xgb_model = None
        self.lstm_model = None
        self.tft_model = None
        
        # Original 10 features used by XGBoost and LSTM during training
        self.base_features = [
            'station_id', 'river_id', 'hour', 'month', 
            'alert_level', 'minor_flood', 'major_flood',
            'water_level_lag1', 'water_level_lag2', 'rainfall_roll3'
        ]
        
        # TFT additionally requires 'rainfall' as a time_varying_known_real
        self.features = self.base_features + ['rainfall']
        
        self._load_models()

    def _load_models(self):
        try:
            # XGBoost
            xgb_path = self.models_dir / "flood_xgboost_retrained_accurate.pkl"
            if xgb_path.exists():
                self.xgb_model = joblib.load(xgb_path)
                print("XGBoost Ready: 1h Early Warning")
            
            # LSTM - saved as state_dict, need to reconstruct the model
            lstm_path = self.models_dir / "flood_lstm_retrained_accurate.pth"
            if lstm_path.exists():
                state_dict = torch.load(lstm_path, map_location=torch.device('cpu'), weights_only=False)
                self.lstm_model = FloodLSTM(input_size=10, hidden_size=128, num_layers=2)
                self.lstm_model.load_state_dict(state_dict)
                self.lstm_model.eval()
                print("LSTM Ready: 12h Trend Monitor")
            
            # TFT (Temporal Fusion Transformer)
            tft_path = self.models_dir / "tft_flood_model_final.ckpt"
            if tft_path.exists():
                from pytorch_forecasting import TemporalFusionTransformer
                self.tft_model = TemporalFusionTransformer.load_from_checkpoint(tft_path, map_location="cpu")
                self.tft_model.eval()
                print("TFT Ready: 24h Strategic Path")
                
        except Exception as e:
            print(f"Model Loading Error: {e}")
            import traceback
            traceback.print_exc()

    def predict_xgb_1h(self, history_df: pd.DataFrame):
        if self.xgb_model:
            latest = history_df.iloc[-1:].copy()
            # XGBoost requires numeric types for all columns
            for col in ['station_id', 'river_id']:
                if col in latest.columns:
                    latest[col] = pd.to_numeric(latest[col], errors='coerce').fillna(0).astype(np.int64)
            return float(self.xgb_model.predict(latest[self.base_features])[0])
        return 0.0

    def predict_lstm_recursive(self, history_df: pd.DataFrame, steps: int = 4):
        if not self.lstm_model: return 0.0
        
        current_history = history_df.copy()
        predictions = []
        
        for _ in range(steps):
            # LSTM uses base_features (10 features), must be numeric
            lstm_subset = current_history.iloc[-12:][self.base_features].copy()
            for col in ['station_id', 'river_id']:
                lstm_subset[col] = pd.to_numeric(lstm_subset[col], errors='coerce').fillna(0)
                
            input_data = lstm_subset.values.astype(np.float32)
            input_tensor = torch.FloatTensor(input_data).unsqueeze(0)
            
            with torch.no_grad():
                out = self.lstm_model(input_tensor)
                pred_val = float(out.numpy().flatten()[0])
                predictions.append(pred_val)
                
            new_row = current_history.iloc[-1].copy()
            new_row['water_level_lag2'] = current_history.iloc[-1]['water_level_lag1']
            new_row['water_level_lag1'] = current_history.iloc[-1]['water_level_now']
            new_row['water_level_now'] = pred_val
            new_row['hour'] = (new_row['hour'] + 3) % 24
            
            current_history = pd.concat([current_history, pd.DataFrame([new_row])], ignore_index=True)
            
        return predictions[-1]

    def predict_tft_recursive(self, history_df: pd.DataFrame, steps: int = 8):
        if not self.tft_model: return 0.0
        
        current_history = history_df.copy()
        
        # Ensure 'rainfall' column exists
        if 'rainfall' not in current_history.columns:
            current_history['rainfall'] = current_history.get('rainfall_roll3', 0.0)
        
        # Ensure time_idx exists and is valid
        if 'time_idx' not in current_history.columns or current_history['time_idx'].isnull().any():
            current_history['time_idx'] = np.arange(len(current_history), dtype=np.int64)
            
        # Enforce types: time_idx/hour/month = int64, station_id/river_id = str
        current_history['time_idx'] = current_history['time_idx'].astype(np.int64)
        current_history['hour'] = current_history['hour'].astype(np.int64)
        current_history['month'] = current_history['month'].astype(np.int64)
        current_history['station_id'] = current_history['station_id'].astype(str)
        current_history['river_id'] = current_history['river_id'].astype(str)

        predictions = []

        for _ in range(steps):
            with torch.no_grad():
                preds = self.tft_model.predict(current_history, mode="prediction")
                pred_val = float(preds.numpy().flatten()[0])
                predictions.append(pred_val)

            new_row = current_history.iloc[-1].copy()
            new_row['hour'] = (new_row['hour'] + 3) % 24
            new_row['water_level_lag2'] = current_history.iloc[-1]['water_level_lag1']
            new_row['water_level_lag1'] = current_history.iloc[-1]['water_level_now']
            new_row['water_level_now'] = pred_val
            new_row['time_idx'] = int(current_history.iloc[-1]['time_idx']) + 1
            
            current_history = pd.concat([current_history.iloc[1:], pd.DataFrame([new_row])], ignore_index=True)
            
            # Re-enforce types after concat
            current_history['time_idx'] = current_history['time_idx'].astype(np.int64)
            current_history['hour'] = current_history['hour'].astype(np.int64)
            current_history['month'] = current_history['month'].astype(np.int64)
            current_history['station_id'] = current_history['station_id'].astype(str)
            current_history['river_id'] = current_history['river_id'].astype(str)

        return predictions[-1]

    def get_specialized_forecasts(self, history_df: pd.DataFrame):
        return {
            "early_warning_1h": self.predict_xgb_1h(history_df),
            "trend_monitor_12h": self.predict_lstm_recursive(history_df, steps=4),
            "strategic_path_24h": self.predict_tft_recursive(history_df, steps=8)
        }

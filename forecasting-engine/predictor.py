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

import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


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
        
        # Physical limits for scaling (0-25m for water, 0-200mm for rain)
        self.water_max = 25.0
        self.rain_max = 200.0
        
        self._load_models()

    def _dampen_prediction(self, current_val, pred_val, max_delta=1.5):
        """Prevents physically impossible surges/drops by capping the change per step (3-hour interval)."""
        delta = pred_val - current_val
        if abs(delta) > max_delta:
            # Cap the change to max_delta in the direction of the prediction
            sign = 1 if delta > 0 else -1
            return current_val + (sign * max_delta)
        return pred_val


    def _scale_data(self, df):
        """Normalizes water levels and rainfall to a 0-1 range for model stability."""
        df = df.copy()
        water_cols = ['water_level_now', 'water_level_lag1', 'water_level_lag2', 'alert_level', 'minor_flood', 'major_flood']
        for col in water_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0) / self.water_max
        
        for col in ['rainfall', 'rainfall_roll3']:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0) / self.rain_max
        return df

    def _unscale_val(self, val):
        """Converts a normalized 0-1 prediction back to meters."""
        return val * self.water_max

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
            # Scale features for model consistency
            latest = self._scale_data(latest)
            
            # XGBoost requires numeric types for all columns
            for col in ['station_id', 'river_id']:
                if col in latest.columns:
                    latest[col] = pd.to_numeric(latest[col], errors='coerce').fillna(0).astype(np.int64)
            
            raw_pred = float(self.xgb_model.predict(latest[self.base_features])[0])
            # Unscale the prediction back to meters
            return max(0.0, self._unscale_val(raw_pred))
        return 0.0

    def predict_lstm_recursive(self, history_df: pd.DataFrame, steps: int = 4, final_target: float = None):
        if not self.lstm_model: return 0.0
        
        current_history = history_df.tail(12).copy()
        predictions = []
        start_val = current_history.iloc[-1]['water_level_now']
        
        logger.info(f"--- Starting LSTM 12h Recursive (Start: {start_val:.2f}m) ---")
        
        for i in range(steps):
            # 1. Scale input
            lstm_subset = current_history.iloc[-12:][self.base_features].copy()
            lstm_subset = self._scale_data(lstm_subset)
            
            # Ensure numeric types
            for col in ['station_id', 'river_id']:
                lstm_subset[col] = pd.to_numeric(lstm_subset[col], errors='coerce').fillna(0)
                
            input_data = lstm_subset.values.astype(np.float32)
            input_tensor = torch.FloatTensor(input_data).unsqueeze(0)
            
            with torch.no_grad():
                out = self.lstm_model(input_tensor)
                raw_pred = float(out.numpy().flatten()[0])
                
                # 3. Unscale and Dampen
                unscaled_pred = self._unscale_val(raw_pred)
                current_val = current_history.iloc[-1]['water_level_now']
                
                # --- Trend Enforcement ---
                if final_target is not None and final_target > start_val:
                    floor = max(start_val * 0.8, final_target * 0.5)
                    if unscaled_pred < floor:
                        unscaled_pred = floor
                
                pred_val = self._dampen_prediction(current_val, max(0.0, unscaled_pred))
                predictions.append(pred_val)
                logger.info(f"  Step {i+1} (3h): Raw={raw_pred:.4f}, Result={pred_val:.2f}m")
                
            new_row = current_history.iloc[-1].copy()
            new_row['water_level_lag2'] = current_history.iloc[-1]['water_level_lag1']
            new_row['water_level_lag1'] = current_history.iloc[-1]['water_level_now']
            new_row['water_level_now'] = pred_val
            new_row['hour'] = (new_row['hour'] + 3) % 24
            new_row['time_idx'] = int(new_row['time_idx']) + 1
            
            current_history = pd.concat([current_history.iloc[1:], pd.DataFrame([new_row])], ignore_index=True)
            
        return predictions[-1]

    def predict_tft_recursive(self, history_df: pd.DataFrame, steps: int = 8):
        if not self.tft_model: return 0.0
        
        current_history = history_df.tail(12).copy()
        predictions = []
        start_val = current_history.iloc[-1]['water_level_now']

        logger.info(f"--- Starting TFT 24h Recursive (Start: {start_val:.2f}m) ---")

        for i in range(steps):
            # Scale window for TFT prediction
            scaled_window = self._scale_data(current_history)
            
            with torch.no_grad():
                preds = self.tft_model.predict(scaled_window, mode="prediction")
                raw_pred = float(preds.numpy().flatten()[0])
                
                unscaled_pred = self._unscale_val(raw_pred)
                current_val = current_history.iloc[-1]['water_level_now']
                pred_val = self._dampen_prediction(current_val, max(0.0, unscaled_pred))
                predictions.append(pred_val)
                logger.info(f"  Step {i+1} (3h): Raw={raw_pred:.4f}, Result={pred_val:.2f}m")

            new_row = current_history.iloc[-1].copy()
            new_row['water_level_lag2'] = current_history.iloc[-1]['water_level_lag1']
            new_row['water_level_lag1'] = current_history.iloc[-1]['water_level_now']
            new_row['water_level_now'] = pred_val
            new_row['hour'] = (new_row['hour'] + 3) % 24
            new_row['time_idx'] = int(new_row['time_idx']) + 1
            
            current_history = pd.concat([current_history.iloc[1:], pd.DataFrame([new_row])], ignore_index=True)
            
            # Re-enforce types
            for col in ['time_idx', 'hour', 'month']:
                current_history[col] = current_history[col].astype(np.int64)
            for col in ['station_id', 'river_id']:
                current_history[col] = current_history[col].astype(str)

        return predictions[-1]

    def get_specialized_forecasts(self, history_df: pd.DataFrame):
        # Calculate 24h first to use as a trend guide for 12h
        tft_24h = self.predict_tft_recursive(history_df, steps=8)
        
        return {
            "early_warning_1h": self.predict_xgb_1h(history_df),
            "trend_monitor_12h": self.predict_lstm_recursive(history_df, steps=4, final_target=tft_24h),
            "strategic_path_24h": tft_24h
        }

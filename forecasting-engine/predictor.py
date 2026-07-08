import torch
import torch.nn as nn
import pandas as pd
import numpy as np
import joblib
import os
from typing import List, Dict, Tuple, Optional
from pathlib import Path

# Suppress warnings for cleaner logs
import warnings
warnings.filterwarnings("ignore")

import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Empirical basis: dataset_documentation.md's validated real surge events show
# rises of +8.36m and +9.90m across a single raw ~3-hour DMC reporting gap
# (Hanwella Jun-2024, Nag Street Aug-2022) => ~2.8-3.3 m/hour during the most
# extreme recorded real events. We cap recursive per-hour steps at 3.0 m/hour:
# generous enough to let genuine extreme-surge forecasts through un-clipped,
# while still catching runaway/non-physical recursive drift from model error
# accumulation. This is a documented, defensible assumption, not a formally
# derived hydrological limit.
MAX_DELTA_PER_HOUR = 3.0


def _advance_one_hour(hour: int, month: int) -> Tuple[int, int]:
    """Advance the categorical hour feature by 1 real hour when no real
    datetime is available (fallback path only - see predict_*_recursive).
    Day-of-month rollover is not tracked (the trained models only take `hour`
    and `month`, no `day`), so only hour wraparound is handled here. A full
    24-step recursive run covers at most 24h, i.e. crosses at most one
    midnight boundary in the typical case; not incrementing `month` on wrap
    is a documented simplification for this fallback-only path.
    """
    new_hour = (hour + 1) % 24
    return new_hour, month


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

    def _dampen_prediction(self, current_val, pred_val, max_delta=MAX_DELTA_PER_HOUR) -> Tuple[float, bool]:
        """Prevents physically impossible surges/drops by capping the change
        per hour. Returns (value, was_clipped) so callers can log/flag when
        the model's raw output was overridden instead of silently masking a
        bad prediction."""
        delta = pred_val - current_val
        if abs(delta) > max_delta:
            sign = 1 if delta > 0 else -1
            clipped = current_val + (sign * max_delta)
            logger.warning(
                f"Dampening triggered: raw prediction {pred_val:.2f}m implies "
                f"{delta:+.2f}m/h change from {current_val:.2f}m - clipped to "
                f"{clipped:.2f}m (cap {max_delta}m/h)."
            )
            return clipped, True
        return pred_val, False

    def _step_rainfall_roll3(self, history_before_step: pd.DataFrame) -> float:
        """Future rainfall is unknown at inference time. We hold the
        rolling-3h rainfall value constant at the last known real/interpolated
        value rather than assuming it decays to zero or keeps rising - a flat
        persistence forecast is the simplest defensible assumption for a
        short (<=24h) horizon, and avoids injecting a fabricated trend the
        model was never shown. Known limitation: real storms don't have
        constant rainfall, but guessing a decay/rise curve without real
        forecast data would be equally fabricated and harder to justify."""
        return float(history_before_step.iloc[-1]['rainfall_roll3'])

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
                # weights_only=False: PyTorch 2.6+ defaults torch.load to
                # weights_only=True, which rejects this checkpoint's pickled
                # pytorch_forecasting.GroupNormalizer object. Same trust
                # rationale as the LSTM load above - this is our own trained
                # model artifact, not third-party/untrusted content.
                self.tft_model = TemporalFusionTransformer.load_from_checkpoint(tft_path, map_location="cpu", weights_only=False)
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

    def predict_lstm_recursive(self, history_df: pd.DataFrame, steps: int = 12) -> Tuple[float, bool]:
        if not self.lstm_model: return 0.0, False

        current_history = history_df.tail(12).copy()
        has_dt = 'datetime' in current_history.columns and current_history['datetime'].notna().all()
        last_dt = None
        if has_dt:
            current_history['datetime'] = pd.to_datetime(current_history['datetime'])
            last_dt = current_history.iloc[-1]['datetime']

        predictions = []
        clipped_any = False
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

                # Unscale and dampen. LSTM's output is a pure model output -
                # no cross-model blending with TFT (removed: previously this
                # step nudged the value toward TFT's 24h forecast via a
                # hardcoded floor, which meant "LSTM 12h" was never a pure
                # LSTM number despite the label).
                unscaled_pred = self._unscale_val(raw_pred)
                current_val = current_history.iloc[-1]['water_level_now']

                pred_val, was_clipped = self._dampen_prediction(current_val, max(0.0, unscaled_pred))
                clipped_any = clipped_any or was_clipped
                predictions.append(pred_val)
                logger.info(f"  Step {i+1} (+1h): Raw={raw_pred:.4f}, Result={pred_val:.2f}m")

            new_row = current_history.iloc[-1].copy()
            new_row['water_level_lag2'] = current_history.iloc[-1]['water_level_lag1']
            new_row['water_level_lag1'] = current_history.iloc[-1]['water_level_now']
            new_row['water_level_now'] = pred_val

            if has_dt:
                last_dt = last_dt + pd.Timedelta(hours=1)
                new_row['datetime'] = last_dt
                new_row['hour'] = last_dt.hour
                new_row['month'] = last_dt.month
            else:
                new_row['hour'], new_row['month'] = _advance_one_hour(int(new_row['hour']), int(new_row['month']))

            new_row['rainfall_roll3'] = self._step_rainfall_roll3(current_history)
            new_row['time_idx'] = int(new_row['time_idx']) + 1

            current_history = pd.concat([current_history.iloc[1:], pd.DataFrame([new_row])], ignore_index=True)

        return predictions[-1], clipped_any

    def predict_tft_recursive(self, history_df: pd.DataFrame, steps: int = 24) -> Tuple[float, bool, Optional[Dict[str, float]]]:
        """Returns (point_prediction, was_clipped, quantile_info).
        quantile_info is None if the model's quantile spread could not be
        extracted (missing model, extraction error, etc.) - never fabricated.

        NOTE ON RECURSIVE UNCERTAINTY: the quantile spread is extracted ONLY
        at the final (24th) recursive step, reflecting the model's own
        uncertainty about that last step given the (partly synthetic) history
        fed into it - not the full compounding uncertainty across all 24
        recursive steps. This is a documented simplification, consistent with
        how the point forecast already works recursively.
        """
        if not self.tft_model: return 0.0, False, None

        current_history = history_df.tail(12).copy()
        has_dt = 'datetime' in current_history.columns and current_history['datetime'].notna().all()
        last_dt = None
        if has_dt:
            current_history['datetime'] = pd.to_datetime(current_history['datetime'])
            last_dt = current_history.iloc[-1]['datetime']

        predictions = []
        clipped_any = False
        quantile_info: Optional[Dict[str, float]] = None
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
                pred_val, was_clipped = self._dampen_prediction(current_val, max(0.0, unscaled_pred))
                clipped_any = clipped_any or was_clipped
                predictions.append(pred_val)
                logger.info(f"  Step {i+1} (+1h): Raw={raw_pred:.4f}, Result={pred_val:.2f}m")

                if i == steps - 1:
                    quantile_info = self._extract_tft_quantiles(scaled_window, current_val)

            new_row = current_history.iloc[-1].copy()
            new_row['water_level_lag2'] = current_history.iloc[-1]['water_level_lag1']
            new_row['water_level_lag1'] = current_history.iloc[-1]['water_level_now']
            new_row['water_level_now'] = pred_val

            if has_dt:
                last_dt = last_dt + pd.Timedelta(hours=1)
                new_row['datetime'] = last_dt
                new_row['hour'] = last_dt.hour
                new_row['month'] = last_dt.month
            else:
                new_row['hour'], new_row['month'] = _advance_one_hour(int(new_row['hour']), int(new_row['month']))

            new_row['rainfall_roll3'] = self._step_rainfall_roll3(current_history)
            new_row['time_idx'] = int(new_row['time_idx']) + 1

            current_history = pd.concat([current_history.iloc[1:], pd.DataFrame([new_row])], ignore_index=True)

            # Re-enforce types (unchanged from prior behavior)
            for col in ['time_idx', 'hour', 'month']:
                current_history[col] = current_history[col].astype(np.int64)
            for col in ['station_id', 'river_id']:
                current_history[col] = current_history[col].astype(str)

        return predictions[-1], clipped_any, quantile_info

    # pytorch_forecasting's library default 7-quantile output, used only as a
    # logged fallback assumption when this checkpoint's real quantile levels
    # can't be introspected via model.loss.quantiles.
    DEFAULT_QUANTILES = [0.02, 0.1, 0.25, 0.5, 0.75, 0.9, 0.98]

    def _extract_tft_quantiles(self, scaled_window: pd.DataFrame, current_val: float) -> Optional[Dict[str, float]]:
        """Extracts TFT's real quantile spread for its most recent prediction
        step. Returns None (never fabricates a range) on any failure."""
        try:
            with torch.no_grad():
                quantile_preds = self.tft_model.predict(scaled_window, mode="quantiles")
            arr = quantile_preds.numpy().flatten()

            quantile_levels = getattr(getattr(self.tft_model, "loss", None), "quantiles", None)
            if quantile_levels is None or len(quantile_levels) != len(arr):
                logger.warning(
                    f"TFT model.loss has no usable .quantiles matching output shape "
                    f"(got {len(arr)} values) - assuming default {self.DEFAULT_QUANTILES}"
                )
                quantile_levels = self.DEFAULT_QUANTILES
                if len(quantile_levels) != len(arr):
                    logger.error(
                        f"TFT quantile output has {len(arr)} columns, neither real nor "
                        f"assumed levels match - skipping quantile range."
                    )
                    return None

            min_q, max_q = min(quantile_levels), max(quantile_levels)
            lower_idx = quantile_levels.index(min_q)
            upper_idx = quantile_levels.index(max_q)

            lower_val = max(0.0, self._unscale_val(float(arr[lower_idx])))
            upper_val = max(0.0, self._unscale_val(float(arr[upper_idx])))

            # Same physical-plausibility cap as the point forecast (user-approved):
            # a citizen should never see a range implying an impossible water level.
            lower_val, _ = self._dampen_prediction(current_val, lower_val)
            upper_val, _ = self._dampen_prediction(current_val, upper_val)

            confidence_pct = (max_q - min_q) * 100
            logger.info(
                f"TFT quantile range: [{lower_val:.2f}m, {upper_val:.2f}m] "
                f"confidence={confidence_pct:.0f}% (levels {min_q}-{max_q})"
            )
            return {"lower": lower_val, "upper": upper_val, "confidence_pct": confidence_pct}
        except Exception as e:
            logger.error(f"TFT quantile extraction failed: {e}")
            return None

    def get_specialized_forecasts(self, history_df: pd.DataFrame):
        # Each model's forecast is now computed and returned independently -
        # no cross-model blending (previously TFT's 24h was computed first
        # specifically to feed a hidden trend-enforcement floor into LSTM's
        # 12h output; that coupling has been removed, so computation order
        # no longer matters functionally).
        xgb_val = self.predict_xgb_1h(history_df)
        lstm_val, lstm_clipped = self.predict_lstm_recursive(history_df, steps=12)
        tft_val, tft_clipped, tft_quantiles = self.predict_tft_recursive(history_df, steps=24)

        return {
            "early_warning_1h": xgb_val,
            "trend_monitor_12h": lstm_val,
            "strategic_path_24h": tft_val,
            "dampened": {
                "early_warning_1h": False,
                "trend_monitor_12h": lstm_clipped,
                "strategic_path_24h": tft_clipped,
            },
            "quantile_range": {
                "strategic_path_24h": tft_quantiles,  # None if unavailable
            },
        }

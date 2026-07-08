import torch
import pandas as pd
import numpy as np
from pytorch_forecasting import TemporalFusionTransformer
import os

def debug_tft_quantiles():
    tft_path = "../models/tft_flood_model_final.ckpt"
    if not os.path.exists(tft_path):
        print(f"Model not found at {tft_path}")
        return

    print(f"Loading model from {tft_path}...")
    try:
        model = TemporalFusionTransformer.load_from_checkpoint(tft_path, map_location="cpu", weights_only=False)
        print("Model loaded successfully.")
    except Exception as e:
        print(f"Load Failed: {e}")
        import traceback
        traceback.print_exc()
        return

    model.eval()
    quantiles = getattr(getattr(model, "loss", None), "quantiles", None)
    print(f"model.loss = {model.loss!r}")
    print(f"model.loss.quantiles = {quantiles}")

    # Build a DataFrame with ALL columns the model expects (mirrors debug_tft.py)
    data = []
    for i in range(24):
        row = {
            'station_id': "21",
            'river_id': "22",
            'hour': i % 24,
            'month': 4,
            'alert_level': 2.5,
            'minor_flood': 3.0,
            'major_flood': 4.5,
            'rainfall': 1.2,
            'water_level_now': 1.5 + (i * 0.01),
            'water_level_lag1': 1.4 + (i * 0.01),
            'water_level_lag2': 1.3 + (i * 0.01),
            'rainfall_roll3': 0.8,
            'time_idx': i,
        }
        data.append(row)

    df = pd.DataFrame(data)
    df['time_idx'] = df['time_idx'].astype(np.int64)
    df['hour'] = df['hour'].astype(np.int64)
    df['month'] = df['month'].astype(np.int64)
    df['station_id'] = df['station_id'].astype(str)
    df['river_id'] = df['river_id'].astype(str)

    try:
        print("\nAttempting quantile prediction...")
        with torch.no_grad():
            preds = model.predict(df, mode="quantiles")
        arr = preds.numpy().flatten()
        print(f"SUCCESS! shape: {preds.shape}, values: {arr}")
        if quantiles is not None and len(quantiles) == len(arr):
            for q, v in zip(quantiles, arr):
                print(f"  quantile {q}: {v}")
    except Exception as e:
        print(f"Quantile prediction Failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_tft_quantiles()

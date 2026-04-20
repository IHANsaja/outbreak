import torch
import pandas as pd
import numpy as np
from pytorch_forecasting import TemporalFusionTransformer
import os

def debug_tft():
    tft_path = "../models/tft_flood_model_final.ckpt"
    if not os.path.exists(tft_path):
        print(f"Model not found at {tft_path}")
        return
        
    print(f"Loading model from {tft_path}...")
    try:
        model = TemporalFusionTransformer.load_from_checkpoint(tft_path, map_location="cpu")
        print("Model loaded successfully.")
        print(f"Target: {model.dataset_parameters.get('target', '')}")
        print(f"Group IDs: {model.dataset_parameters.get('group_ids', [])}")
        print(f"Known reals: {model.dataset_parameters.get('time_varying_known_reals', [])}")
        print(f"Unknown reals: {model.dataset_parameters.get('time_varying_unknown_reals', [])}")
        print(f"Static categoricals: {model.dataset_parameters.get('static_categoricals', [])}")
        print(f"Max encoder length: {model.dataset_parameters.get('max_encoder_length', 'N/A')}")
    except Exception as e:
        print(f"Load Failed: {e}")
        return
    
    # Build a DataFrame with ALL columns the model expects
    data = []
    for i in range(24):  # Use enough rows for encoder length
        row = {
            'station_id': "21",
            'river_id': "22",
            'hour': i % 24,
            'month': 4,
            'alert_level': 2.5,
            'minor_flood': 3.0,
            'major_flood': 4.5,
            'rainfall': 1.2,        # <-- was missing before!
            'water_level_now': 1.5 + (i * 0.01),
            'water_level_lag1': 1.4 + (i * 0.01),
            'water_level_lag2': 1.3 + (i * 0.01),
            'rainfall_roll3': 0.8,
            'time_idx': i,
        }
        data.append(row)
        
    df = pd.DataFrame(data)
    
    # Enforce correct types
    df['time_idx'] = df['time_idx'].astype(np.int64)
    df['hour'] = df['hour'].astype(np.int64)
    df['month'] = df['month'].astype(np.int64)
    df['station_id'] = df['station_id'].astype(str)
    df['river_id'] = df['river_id'].astype(str)
    
    print(f"\nDataFrame shape: {df.shape}")
    print(f"DataFrame Dtypes:\n{df.dtypes}")
    
    try:
        print("\nAttempting prediction...")
        model.eval()
        with torch.no_grad():
            preds = model.predict(df, mode="prediction")
        print(f"SUCCESS! Prediction shape: {preds.shape}")
        print(f"Prediction values: {preds.numpy().flatten()[:5]}")
    except Exception as e:
        print(f"Prediction Failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_tft()

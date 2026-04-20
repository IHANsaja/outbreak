# Outbreak Flood Forecasting Pipeline & Specialized AI Roles

This document describes the architecture and operation of the automated flood forecasting system.

## 1. System Overview

The system consists of three main components:
1.  **DMC Data Pipeline**: Scrapes real-time reports from the Disaster Management Centre every 3 hours.
2.  **Forecasting Engine**: A FastAPI service hosting XGBoost, LSTM, and Temporal Fusion Transformer (TFT) models.
3.  **AI Dashboard**: A React frontend visualizing three specialized forecasting roles.

---

## 2. Model Specialization

The models are not redundant; they work together like a weather-station crew:

| Model | Role | Horizon | Purpose | UI Indicator |
| :--- | :--- | :--- | :--- | :--- |
| **XGBoost** | Early Warning | 1-Hour | High-speed reaction to the very latest report. | Solid Rose Line |
| **LSTM** | Trend Monitor | 12-Hours | Analyzes basin saturation trends for mid-term safety. | Dashed Orange Line |
| **TFT** | Strategic Path | 24-Hours | Long-term outlook with confidence in seasonal/hourly shifts. | Dashed Amber Line |

---

## 3. Data Pipeline (`/data-pipeline`)

### Automated Workflow
The `scheduler.py` script runs on a 3-hour cycle synchronized to Sri Lanka (GMT+5:30).
- **Triggers**: 00:35, 03:35, 06:35, 09:35, 12:35, 15:35, 18:35, 21:35.
- **Logic**:
    1.  **Fetch**: Crawls DMC report list.
    2.  **Extract**: Checks for digital PDFs first (`pdfplumber`); if failing, triggers OCR (`easyocr` on CPU).
    3.  **Map**: Converts station names to Model IDs using `water_levels_global_ml_mapping.csv`.
    4.  **Buffer**: Maintains a rolling window of the last 12 reports per station.
    5.  **POST**: Sends the window to the Forecasting Engine.

### Files
- `scheduler.py`: The cron loop.
- `pipeline_core.py`: Hybrid extraction engine.
- `api_client.py`: Communications and history buffering.

---

## 4. Forecasting Engine (`/forecasting-engine`)

### Multi-Step Prediction
The engine implements **Recursive Forecasting** for LSTM and TFT:
1.  Predict $T+1$.
2.  Append prediction to internal state.
3.  Predict $T+n$ (up to $n=8$ for 24 hours).

### API Endpoints
- `POST /predict`: Receives 12 historical reports and returns values for all 3 specialized roles.

---

## 5. Maintenance & Logs

- **Pipeline Logs**: Located at `d:\Projects\outbreak\data-pipeline\pipeline.log`. Check here if reports are not appearing.
- **State**: `pipeline_state.json` tracks processed URLs to avoid duplicates.
- **Buffer**: `latest_history.json` stores the current 12-report window for active stations.

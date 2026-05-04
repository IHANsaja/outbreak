# Outbreak-AI: Nationwide Flood Forecasting & Disaster Management System

> **Smart AI-powered early warning system for flood prediction and disaster management across Sri Lanka's river networks.**

## Overview

**Outbreak-AI** is a comprehensive disaster management platform that combines:

- **🌊 Advanced AI Forecasting**: Multi-model ensemble (XGBoost, LSTM, TFT) predicting flood risk at 1-hour, 12-hour, and 24-hour horizons
- **📊 Automated Data Pipeline**: Hybrid extraction from government PDFs/images with OCR fallback, normalized across 88 monitoring stations
- **🗺️ Real-time Dashboard**: Interactive web interface for citizens, authorities, and disaster responders
- **🔐 Role-Based Access**: Separate citizen dashboards, authority command centers, and AI analysis tools
- **📱 Offline Resilience**: Standalone HTML application for mesh-network communication during network outages

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        EXTERNAL SOURCES                          │
│  DMC Website (PDFs/Images) → Government Bulletins                │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                    DATA PIPELINE (Python)                        │
│  • Scraper: BeautifulSoup, pdfplumber, EasyOCR                  │
│  • Extractor: Hybrid PDF parsing + OCR fallback                 │
│  • Normalizer: Fuzzy matching, type coercion, lag features      │
│  • Scheduler: APScheduler (configurable intervals)              │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│            FORECASTING ENGINE (FastAPI + PyTorch)                │
│  • XGBoost: 1-hour early warning (MAE: 0.0246m, R²: 0.9934)    │
│  • LSTM: 12-hour trend monitoring (MAE: 0.0331m, R²: 0.9932)   │
│  • TFT: 24-hour strategic planning (MAE: 0.3182m, R²: 0.8823)  │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│         PERSISTENCE & API (Supabase + PostgREST)                │
│  • PostgreSQL: 3NF schema with RLS (Row Level Security)          │
│  • Auth: Supabase Auth + JWT tokens                              │
│  • Real-time: PostgREST HTTP API layer                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│         WEB DASHBOARD (Next.js + React)                          │
│  • Online Mode: Citizen, Authority, & AI dashboards             │
│  • Offline Mode: Standalone HTML for mesh networks              │
│  • Maps: Interactive Leaflet.js visualizations                  │
│  • Real-time: Server Actions for data fetching                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
outbreak/
├── data-pipeline/              # Python data ingestion layer
│   ├── pipeline_core.py        # Scraper, PDF extractor, OCR fallback
│   ├── api_client.py           # Supabase integration
│   ├── scheduler.py            # APScheduler orchestration
│   ├── pipeline_state.json     # Deduplication memory
│   ├── requirements.txt        # Python dependencies
│   └── downloads/              # Temporary file cache
│
├── forecasting-engine/         # Python AI inference layer
│   ├── main.py                 # FastAPI server & endpoints
│   ├── predictor.py            # Model loading & inference
│   ├── tft_flood_model_final.ckpt    # TFT checkpoint
│   ├── flood_lstm_retrained_accurate.pth   # LSTM weights
│   └── requirements.txt        # PyTorch, Darts, XGBoost
│
├── onlineMode/                 # Next.js web application
│   ├── app/                    # Route groups (citizen, authority, AI)
│   ├── components/             # Reusable React components
│   ├── lib/                    # Supabase client & utilities
│   ├── utils/                  # Helpers & formatters
│   ├── package.json            # Node dependencies
│   └── tsconfig.json           # TypeScript configuration
│
├── offlineMode/                # Standalone HTML application
│   └── index.html              # Zero-dependency offline UI
│
├── models/                     # Trained model artifacts
│   ├── tft_flood_model_final.ckpt
│   ├── flood_lstm_retrained_accurate.pth
│   └── tft_weights.pth
│
├── data/                       # Static datasets
│   └── water_levels_global_ml_mapping.csv   # Station ID mapping
│
├── docs/                       # Comprehensive documentation
│   ├── PIPELINE_GUIDE.md       # Data pipeline deep dive
│   ├── DATA_PIPELINE_FLOW.md   # Step-by-step flow logic
│   ├── database_architecture_explanation.md
│   ├── implementation_chapter.md
│   ├── MODEL_ANALYSIS_DEEP_DIVE.md
│   ├── model_comparison.md
│   ├── training_evaluation_report.md
│   └── dataset_documentation.md
│
├── currentDatabase.sql         # Database schema (Supabase)
└── README.md                   # This file
```

---

## 🔄 Data Pipeline: From PDFs to Predictions

### Pipeline Stages

| **Stage** | **Component** | **Input** | **Output** | **Technology** |
|-----------|---------------|-----------|-----------|-----------------|
| **1. Acquisition** | Scraper | DMC website HTML | PDF/image URLs | BeautifulSoup, requests |
| **2. Extraction** | Hybrid Parser | PDF/image files | Structured table data | pdfplumber + EasyOCR |
| **3. Deduplication** | State Manager | URL list | Unique new reports | pipeline_state.json |
| **4. Normalization** | Data Cleaner | Raw numbers + text | Fuzzy-matched station IDs | pandas, fuzzy string matching |
| **5. Enrichment** | Context Builder | Current water level | 12-hour history window | Supabase API queries |
| **6. Inference** | AI Engine | History window | 1h/12h/24h forecasts | FastAPI + Darts/PyTorch |
| **7. Persistence** | API Client | Predictions | River reports table | PostgREST HTTP |

### Key Features

- **Idempotent Design**: Safe to run multiple times without creating duplicates
- **Self-Healing**: Recovers gracefully from missed cycles or API timeouts
- **Hybrid Extraction**: Digital PDF parsing (100% accurate) with OCR fallback for scanned images
- **Edge Padding**: Uses last available data point if <12 hours of history exists
- **Lag Features**: Automatically calculates water_level_lag1 and water_level_lag2 for temporal context

### Running the Pipeline

```bash
# One-time execution
python data-pipeline/scheduler.py --once

# Continuous scheduled mode (default: every 3 hours)
python data-pipeline/scheduler.py

# Custom interval (example: every 30 minutes)
python data-pipeline/scheduler.py --interval 30
```

---

## 🤖 AI Forecasting Engine

### Model Architecture

The system uses an **Ensemble of Specialists**—three distinct models optimized for different forecasting horizons:

#### 1. **XGBoost (Early Warning)** ⚡
- **Use Case**: 1-hour-ahead predictions (flash flood detection)
- **Architecture**: Gradient-boosted decision trees (1,000+ trees)
- **Performance**: MAE: **0.0246m** | RMSE: **0.1332m** | R²: **0.9934**
- **Speed**: ~50ms inference per station
- **Strength**: Extreme accuracy for short-term anomaly detection
- **Trade-off**: Less interpretable than other models

#### 2. **LSTM (Trend Monitor)** 📈
- **Use Case**: 12-hour predictions (flood buildup tracking)
- **Architecture**: Recurrent Neural Network with cell state (3 LSTM layers)
- **Performance**: MAE: **0.0331m** | RMSE: **0.1353m** | R²: **0.9932**
- **Speed**: ~100ms inference per station
- **Strength**: Captures temporal dependencies and seasonal patterns
- **Training**: 100 epochs on 1.5M-row dataset

#### 3. **TFT (Strategic Planning)** 🎯
- **Use Case**: 24-hour predictions (evacuation planning, long-term outlook)
- **Architecture**: Temporal Fusion Transformer with multi-head attention
- **Performance**: MAE: **0.3182m** | RMSE: **0.5548m** | R²: **0.8823**
- **Speed**: ~200ms inference per station
- **Strength**: Interpretable attention weights show which factors matter most
- **Advantage**: Can transfer knowledge between rivers with limited data

### Dataset & Training

**Training Dataset**: `water_levels_90_rivers_ready.csv`
- **Total Observations**: ~1,479,819 hourly records
- **Monitoring Stations**: 88 rivers (97.8% of 90-station network)
- **River Basins**: 36 major basins across Sri Lanka
- **Temporal Resolution**: Hourly (via linear interpolation)
- **Time Span**: Multiple years of historical data

**Feature Engineering** (10 input features):
1. `station_id` - River station identifier
2. `water_level` - Current water level (meters)
3. `water_level_lag1` - Level 1 hour ago
4. `water_level_lag2` - Level 2 hours ago
5. `rainfall` - Current rainfall rate (mm/hr)
6. `rainfall_roll3` - 3-hour rolling average rainfall
7. `hour` - Hour of day (0-23)
8. `month` - Month of year (1-12)
9. `day_of_week` - Day of week (0-6)
10. `time_idx` - Sequential time index for Transformers

### Why This Dataset Upgrade Was Critical

The original dataset (42K rows) was insufficient for deep learning. The 1.5M-row dataset delivered:

| Metric | Before (42K rows) | After (1.5M rows) | Improvement |
|--------|------------------|------------------|-------------|
| **XGBoost R²** | 0.27 | 0.9934 | +268% |
| **LSTM R²** | 0.78 | 0.9932 | +27% |
| **TFT R²** | 0.52 | 0.8823 | +70% |
| **Data Density** | 2-3 readings/day | 1-hour uniform | 35× more training examples |

**Key Improvements**:
- Uniform hourly resampling eliminated lag feature corruption
- 35× more training examples enabled deep learning convergence
- Longer time coverage captured rare flood events
- Consistent temporal spacing enabled multi-hour sequence learning

---

## 📊 Database Architecture (Supabase)

### Schema Overview

The database is designed in **3rd Normal Form (3NF)** with 8 core tables:

#### Core Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `auth.users` | Supabase managed auth | id, email, created_at |
| `profiles` | User profiles linked to auth | id (FK), full_name, role, email |
| `incidents` | Citizen-reported disasters | id, reporter_id (FK), latitude, longitude, itype, status |
| `sos_requests` | Emergency help requests | id, user_id (FK), latitude, longitude, stype, status |
| `river_reports` | Water level & forecast data | id, station_id, water_level, forecast_1h/12h/24h, timestamp |
| `hazards` | Identified flood zones | id, severity, latitude, longitude, title, status |
| `official_updates` | Government announcements | id, authority_id (FK), title, content, severity |
| `resources` | Emergency supplies & personnel | id, region_id (FK), rtype, quantity, status |

#### Security

- **Row Level Security (RLS)**: Enabled on all sensitive tables
- **Role-Based Access**: Citizens see public incidents; authorities see all data
- **API Authentication**: JWT tokens via `SUPABASE_SERVICE_ROLE_KEY`

### Integration Points

**Data Pipeline → Supabase**:
```
POST /rest/v1/river_reports
Headers: Authorization: Bearer <SERVICE_ROLE_KEY>
Body: { station_id, water_level, forecast_1h, forecast_12h, forecast_24h, timestamp }
```

**Next.js Dashboard ← Supabase**:
```typescript
const { data } = await supabase
  .from("river_reports")
  .select("*")
  .eq("station_id", 21)
  .order("timestamp", { ascending: false })
  .limit(12);
```

---

## 🌐 Web Application (Next.js)

### User Roles & Access Levels

#### 1. **Citizen Dashboard** (Public, `/`)
- Real-time water level updates
- Interactive map with river monitoring stations
- Situation briefing (downloadable PDF)
- Community incident reports
- News & hazard alerts
- SOS requests for personal emergencies

#### 2. **Authority Dashboard** (Protected, `/authority/*`)
- Command center with all incidents and SOS requests
- Hazard zone management
- Resource allocation and logistics
- Strategic operations map
- Analytics and trend reports

#### 3. **AI Dashboard** (Protected, `/analysis/*`)
- Model performance metrics
- Forecast accuracy tracking
- Feature importance analysis
- Prediction uncertainty bounds

### Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | Next.js | 16.1.6 | SSR, server actions, file routing |
| UI Library | React | 19.2.3 | Component-based development |
| Language | TypeScript | 5.x | Type safety |
| Styling | Tailwind CSS | 4.x | Utility-first responsive design |
| Maps | Leaflet + react-leaflet | 5.0.0 | Interactive geospatial visualization |
| Animations | Framer Motion | 12.34.3 | Smooth transitions & feedback |
| Icons | Lucide React | 0.575.0 | Scalable vector icons |
| Backend-as-a-Service | Supabase | 2.99.0 | Auth, database, real-time APIs |
| Form Handling | React Hook Form | Latest | Efficient form state management |

### Route Structure

```
app/
├── (citizen)/                          # Public routes
│   ├── page.tsx                        # Dashboard home
│   ├── map/situation/page.tsx         # Interactive map
│   ├── incidents/page.tsx             # Incident list
│   ├── news/page.tsx                  # Hazard feed
│   ├── briefing/page.tsx              # Downloadable briefing
│   └── updates/page.tsx               # Official updates
│
├── (authority)/                        # Protected routes (Role: authority)
│   ├── dashboard/page.tsx             # Command center
│   ├── incidents/page.tsx             # Incident management
│   ├── hazards/page.tsx               # Hazard zones
│   ├── resources/page.tsx             # Resource allocation
│   └── map/page.tsx                   # Operations map
│
└── (analysis)/                         # Protected routes (Role: analyst)
    ├── models/page.tsx                # Model performance
    └── forecasts/page.tsx             # Forecast accuracy
```

### Server Actions (Data Fetching)

```typescript
// Example: Fetch latest water levels
export async function getLatestReports(stationIds: number[]) {
  const { data } = await supabase
    .from("river_reports")
    .select("*")
    .in("station_id", stationIds)
    .order("timestamp", { ascending: false })
    .limit(1);
  return data;
}
```

---

## 🔌 API Endpoints

### Forecasting Engine (FastAPI)

```
POST /predict
Content-Type: application/json

Request:
{
  "station_id": 21,
  "records": [
    { "water_level": 5.2, "rainfall": 2.1, "hour": 14, "month": 5 },
    { "water_level": 5.1, "rainfall": 1.8, "hour": 13, "month": 5 },
    ...
  ]
}

Response:
{
  "station_id": 21,
  "forecast_1h": 5.35,
  "forecast_12h": 6.2,
  "forecast_24h": 5.8,
  "confidence": 0.95,
  "model_used": "ensemble"
}
```

### Supabase PostgREST API

```
GET  /rest/v1/river_reports?station_id=eq.21&order=timestamp.desc&limit=24
POST /rest/v1/river_reports
PATCH /rest/v1/incidents?id=eq.<id>
DELETE /rest/v1/sos_requests?id=eq.<id>
```

---

## 📱 Offline Mode

For disaster scenarios where internet connectivity is lost:

- **Technology**: Vanilla HTML/CSS/JavaScript (zero dependencies)
- **Communication**: Simulated mesh networking with JSON sync bundles
- **Features**: SOS broadcast with GPS location, offline incident form
- **File**: `offlineMode/index.html` (standalone, can be served locally)

---

## 🚀 Installation & Setup

### Prerequisites

- **Python 3.9+** (data pipeline & forecasting engine)
- **Node.js 18+** (Next.js web application)
- **Supabase Account** (database & authentication)
- **Environment Variables** (.env.local)

### 1. Data Pipeline Setup

```bash
cd data-pipeline

# Install Python dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials:
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Test the pipeline
python test_api.py
python test_parser.py

# Run once to verify
python scheduler.py --once
```

### 2. Forecasting Engine Setup

```bash
cd forecasting-engine

# Install Python dependencies
pip install -r requirements.txt

# Download pre-trained models (already in /models)
# - tft_flood_model_final.ckpt
# - flood_lstm_retrained_accurate.pth

# Start the FastAPI server
python main.py

# Server runs on http://localhost:8000
# Docs available at http://localhost:8000/docs
```

### 3. Web Application Setup

```bash
cd onlineMode

# Install Node dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local:
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Development server
npm run dev

# Production build
npm run build
npm run start
```

### 4. Database Setup

```bash
# Using Supabase CLI
supabase db push

# Or manually:
# 1. Connect to Supabase PostgreSQL console
# 2. Execute currentDatabase.sql
```

---

## 📖 Key Concepts & Glossary

### Forecasting Terms

- **Inference**: Running live data through a trained model to generate predictions
- **Look-back Window**: Historical data window required by models (typically 12 hours)
- **Edge Padding**: Repeating oldest available data when insufficient history exists
- **Ensemble**: Combining multiple different models for better overall performance

### Data Engineering Terms

- **Fuzzy String Matching**: Approximate string comparison to link inconsistent station names
- **Type Coercion**: Converting text values (e.g., "5.2m") to numeric types (5.2)
- **Lag Features**: Using past values as inputs (water_level_lag1, water_level_lag2)
- **Recursive Forecasting**: Iteratively predicting future hours by using prior predictions as inputs
- **Idempotency**: Safe to execute multiple times without side effects

### AI/ML Terms

- **R² Score (Coefficient of Determination)**: Proportion of variance explained by model (0-1, higher is better)
- **MAE (Mean Absolute Error)**: Average magnitude of prediction errors (in meters)
- **RMSE (Root Mean Squared Error)**: Square root of mean squared errors (penalizes large errors)
- **LSTM (Long Short-Term Memory)**: Recurrent neural network with cell state for sequence learning
- **Transformer/Attention**: Mechanism that learns which past events matter most for future prediction
- **Overfitting**: When model memorizes training data instead of learning generalizable patterns

---

## 📚 Documentation Files

Detailed technical guides are available in the `/docs` directory:

| Document | Purpose |
|----------|---------|
| [PIPELINE_GUIDE.md](docs/PIPELINE_GUIDE.md) | Complete data pipeline architecture & engineering guide |
| [DATA_PIPELINE_FLOW.md](docs/DATA_PIPELINE_FLOW.md) | Step-by-step flow logic with diagrams |
| [database_architecture_explanation.md](docs/database_architecture_explanation.md) | Supabase schema design & 3NF analysis |
| [implementation_chapter.md](docs/implementation_chapter.md) | Full system implementation details |
| [MODEL_ANALYSIS_DEEP_DIVE.md](docs/MODEL_ANALYSIS_DEEP_DIVE.md) | Evolution of AI models from baseline to production |
| [model_comparison.md](docs/model_comparison.md) | "Fair Fight" comparison of XGBoost vs LSTM vs TFT |
| [training_evaluation_report.md](docs/training_evaluation_report.md) | Model training analysis & performance metrics |
| [dataset_documentation.md](docs/dataset_documentation.md) | Data collection, cleaning, & preparation process |
| [STATIONS_DATA_EMPTY_REASON.md](docs/STATIONS_DATA_EMPTY_REASON.md) | Why some stations have no data |

---

## 🔍 Monitoring & Debugging

### Check Pipeline Health

```bash
# View latest processed reports
tail -f data-pipeline/latest_history.json

# Check deduplication memory
cat data-pipeline/pipeline_state.json | jq 'length'

# Monitor scheduler logs
python scheduler.py --once --verbose
```

### Test Forecasting Engine

```bash
# FastAPI interactive docs
http://localhost:8000/docs

# Test prediction endpoint
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"station_id": 21, "records": [...]}'
```

### Database Queries

```sql
-- Latest water levels for all stations
SELECT station_id, water_level, timestamp 
FROM river_reports 
WHERE timestamp > NOW() - INTERVAL '1 hour'
ORDER BY timestamp DESC;

-- Forecast accuracy (R² by model)
SELECT station_id, 
       AVG(ABS(forecast_1h - actual_water_level)) as mae_1h
FROM river_reports
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY station_id;
```

---

## 🤝 Contributing

1. **Read the Docs**: Start with [PIPELINE_GUIDE.md](docs/PIPELINE_GUIDE.md)
2. **Feature Branch**: `git checkout -b feature/your-feature`
3. **Test Thoroughly**: Ensure pipeline idempotency and model performance
4. **Update Documentation**: Add docstrings and update relevant `.md` files
5. **Submit PR**: Include test results and performance metrics

---

## 📞 Support & Issues

- **Data Pipeline Issues**: Check [STATIONS_DATA_EMPTY_REASON.md](docs/STATIONS_DATA_EMPTY_REASON.md)
- **Model Performance**: See [model_comparison.md](docs/model_comparison.md)
- **Database Problems**: Review [database_architecture_explanation.md](docs/database_architecture_explanation.md)
- **Deployment**: Consult [implementation_chapter.md](docs/implementation_chapter.md)

---

## 📄 License

This project is part of the Outbreak Disaster Management Initiative. All code, models, and documentation are provided as-is for humanitarian purposes.

---

**Last Updated**: May 4, 2026  
**Maintainer**: J A D IHAN HANSAJA
**Status**: Production (v0.1.0)

# Outbreak Application Mock Data Documentation

This document outlines the mock and simulated data used throughout the Outbreak platform to ensure a high-quality user experience even when live telemetry or user-generated data is sparse.

## Features and Mock Data Summary

| Feature | Component / File | Data Type | Purpose |
| :--- | :--- | :--- | :--- |
| **NLP Analysis** | `NLPDeepDiveModal` | Messages, Keywords, Sentiment | Demonstrates AI processing of citizen reports. |
| **Digital Response** | `DigitalSupportModal` | Support Channels, Case Details | Illustrates emergency aid automation protocols. |
| **River Analytics** | `WaterLevelAnalyticsModal` | Station Matrix, Benchmarks | Visualizes historical vs. current flood data. |
| **Situation Map** | `SituationMapInner` | Default Coordinates, UI Overlays | Ensures map accessibility and visual consistency. |
| **Authority Dashboard** | `AuthorityDashboard` | Activity Charts, Status Labels | Fallback for system activity visualization. |
| **AI Insights** | `AIDashboard` | Confidence Scores, Risk Labels | Provides context for model-driven predictions. |

---

## Detailed Data Inventory

### 1. NLP Analysis Deep Dive
Located in: `components/AIModals.tsx`

| Field | Mock Values / Format |
| :--- | :--- |
| **Cluster Keywords** | `WATER LEVEL`, `trapped`, `RISING`, `Road`, `HELP`, `School`, `Children`, `URGENT`, `food`, `first floor` |
| **Sample Messages** | 1. "Water is entering the kitchen now. We have moved to the roof. Please send a boat." (Panic)<br>2. "Galle road is completely blocked near the bridge. No vehicles can pass." (Warning)<br>3. "Can anyone hear us? Power is out and phone battery is dying." (Panic) |
| **Sentiment** | **85%** Panic/Fear intensity based on keyword density. |
| **Sources** | Social Media: **312**, Hotline: **89**, SMS Gateway: **49** |

### 2. Digital Support Protocols
Located in: `components/AIModals.tsx`

| Protocol Name | Response Type | Detail / Description |
| :--- | :--- | :--- |
| **SMS Alert Broadcast** | Instant | Radius: 5km • Targets: App Cache Users |
| **Evacuation Routing** | Interactive | Protocol: Smart Path • Format: Deep Link |
| **E-Relief Voucher** | Secured | Item: Food/Water Bundle • Auth: SMS Code |
| **Virtual ER (Tele-Med)**| Synced | Wait Time: <1 min • Channel: Encrypted Video |

**Emergency Case Simulation:**
- **Title**: Medical Emergency - Galle Face
- **Message**: "Urgent help needed. Elderly person with breathing difficulty. Water rising fast on ground floor."
- **Location**: `6.9271° N, 79.8471° E`

### 3. Hydrological Analytics
Located in: `components/AIModals.tsx`

| Station Name | Level | Status | Trend |
| :--- | :--- | :--- | :--- |
| **Nagalagam Street** | 7.2 ft | Alert | Normal |
| **Hanwella Bridge** | 4.1 ft | Normal | Stable |
| **Kitulgala** | 5.9 ft | Rising | Upward |
| **Norwood Station** | -- | Offline | Maintenance |

**Historical Benchmarks:**
- **2016 Major Flood**: Used as a static SVG path benchmark (Critical Threshold at **9.0ft**).
- **Current Projection**: Simulated trend of **+1.2ft / hr**.

### 4. Situation Map Defaults
Located in: `components/SituationMapInner.tsx` and `app/(citizen)/page.tsx`

| Element | Default Value |
| :--- | :--- |
| **User Coordinates** | `[6.9271, 79.8612]` (Colombo Center) |
| **Hazard Marker** | Color: `#ef4444` (Red) |
| **Incident Marker** | Color: `#f97316` (Orange) |
| **Need Marker** | Color: `#8b5cf6` (Purple) |
| **News Marker** | Color: `#fbbf24` (Amber) + Pulse Animation |

### 5. Authority Dashboard Activity
Located in: `app/(authority)/authority/dashboard/page.tsx`

| Metric | Fallback Logic |
| :--- | :--- |
| **System Activity** | `[10, 40, 25, 70, 45, 90, 30, 60, 20]` (Hourly volume counts) |
| **AI Confidence** | Hardcoded **94%** displayed in AI telemetry cards. |
| **Map Label** | "Active Incident Simulation View" displayed on the operations map. |

---

## Data Management Strategy

- **Live Data Priority**: The application is designed to prioritize data from Supabase (`hazards`, `sos_requests`, `incidents`, `river_reports`) over mock data.
- **Fallback Mechanism**: Mock data is primarily used in **Modals** and **Analytics Views** where real-time historical comparisons (e.g., 2016 flood) are required but not currently indexed in the live database.
- **DMC Metadata**: Station names and river basins are sourced from the static [stations.json](file:///d:/Projects/outbreak/onlineMode/lib/stations.json) file for accurate labeling.

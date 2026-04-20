# Why Some Stations Have Empty Data & No AI Predictions

This document explains the technical and systemic reasons why the Outbreak AI Dashboard displays real-time telemetry and AI predictions for some stations (e.g., Hanwella, Glencourse) while others show "No telemetry data".

## 1. DMC Publishing Limitations (The Primary Cause)
The foundation of the pipeline relies on the official telemetry bulletins published by the **Disaster Management Centre (DMC)**. 
- While the platform's machine learning configuration (`water_levels_global_ml_mapping.csv`) is aware of **90 distinct river stations** across Sri Lanka, the DMC **does not publish data for all 90 stations continuously**.
- Standard DMC PDF bulletins typically only list around **35 to 40 major active stations** at any given time. Minor tributaries and seasonal monitoring points are often omitted from routine reports unless severe flooding risk is present in those exact sub-basins.
- If the station is absent from the PDF, the scraper (`data-pipeline`) cannot extract a current water level.

## 2. Requirement of Current State for AI Context
The `forecasting-engine` utilizes advanced Deep Learning models (like the Temporal Fusion Transformer). 
- To produce a reliable 1h, 12h, or 24h risk forecast, the model requires an **initial baseline context**—the current water level at minimum, and ideally a trailing history of up to 12 hours.
- We implemented an automated padding mechanism that allows the AI to predict based on even a *single* recent data point. However, if **zero data points** have been scraped for a station over the active monitoring window, the AI skips prediction entirely to avoid generating purely hallucinated, unsafe flood alerts.

## 3. Optical Character Recognition (OCR) Variations
A small subset of stations may fail to map due to inconsistencies in how government reports type their names. 
- The pipeline uses PyPDF / OCR to lift tabular data and string-matches the station names against the `global_ml_mapping` file. 
- If the DMC prints a typo (e.g., "Kalu ganga" instead of "Kalu Ganga" or random whitespace anomalies that the string matcher misses), that specific row gets silently skipped during pipeline assimilation.
- This results in the station remaining "dormant" on the dashboard.

## Summary
The "AI Live" filter on the dashboard accurately reflects **Data Availability**. The absence of data for certain stations is structurally normal. It accurately tells you that the Sri Lankan DMC has not officially broadcasted metrics for those isolated river branches in today's tracking cycle. As soon as the DMC issues a threat reading for those dormant stations, the pipeline will seamlessly pick it up and instantly trigger the AI routing.

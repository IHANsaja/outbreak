export interface RiverReport {
    station_id: number;
    river_id: number;
    hour: number;
    month: number;
    alert_level: number;
    minor_flood: number;
    major_flood: number;
    water_level_lag1: number;
    water_level_lag2: number;
    rainfall_roll3: number;
    water_level_now?: number;
    datetime?: string;
}

export interface ForecastingResult {
    early_warning_1h: number;
    trend_monitor_12h: number;
    strategic_path_24h: number;
}

export async function fetchForecast(history: RiverReport[]): Promise<ForecastingResult | null> {
    const apiUrl = process.env.NEXT_PUBLIC_FORECASTING_API_URL || 'http://localhost:8000';
    
    try {
        const response = await fetch(`${apiUrl}/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(history),
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }

        const data = await response.json();
        // Updated to match the new 'forecasts' key in main.py
        return data.forecasts;
    } catch (error) {
        console.error("Failed to fetch forecast:", error);
        return null;
    }
}

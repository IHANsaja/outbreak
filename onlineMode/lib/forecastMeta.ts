export const FORECAST_MODEL_META = {
  forecast_1h: { label: "1h Early Warning", model: "XGBoost" },
  forecast_12h: { label: "12h Trend Monitor", model: "LSTM" },
  forecast_24h: { label: "24h Strategic Path", model: "TFT" },
} as const;

export type ForecastHorizonKey = keyof typeof FORECAST_MODEL_META;

/** Formats a forecast value honestly: shows the value if present, otherwise
 * a single consistent "insufficient data" placeholder instead of coercing
 * null/undefined into a fake 0. */
export function formatForecast(value: number | null | undefined, unit = "m"): string {
  if (value == null) return "—";
  return `${value.toFixed(2)}${unit}`;
}

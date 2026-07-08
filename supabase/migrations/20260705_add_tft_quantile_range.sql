ALTER TABLE public.river_reports
  ADD COLUMN IF NOT EXISTS forecast_24h_lower double precision,
  ADD COLUMN IF NOT EXISTS forecast_24h_upper double precision,
  ADD COLUMN IF NOT EXISTS forecast_24h_confidence_pct double precision;

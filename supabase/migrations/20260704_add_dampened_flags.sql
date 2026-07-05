-- Surfaces whether the forecasting engine's dampening safety cap clipped a
-- forecast (previously this was silently hidden - a model producing a wildly
-- wrong number would be quietly masked instead of visible).
ALTER TABLE public.river_reports
  ADD COLUMN IF NOT EXISTS dampened_1h boolean,
  ADD COLUMN IF NOT EXISTS dampened_12h boolean,
  ADD COLUMN IF NOT EXISTS dampened_24h boolean;

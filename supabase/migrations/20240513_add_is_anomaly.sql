-- Add is_anomaly column to river_reports table
ALTER TABLE public.river_reports 
ADD COLUMN IF NOT EXISTS is_anomaly BOOLEAN DEFAULT false;

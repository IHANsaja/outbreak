-- Migration Script
-- Run this in your Supabase SQL Editor to add the new location tracking fields to the profiles table.

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_location_lat DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS last_location_lng DECIMAL(11, 8);

-- Optional: Add an index if you plan to query users by location frequently
-- CREATE INDEX idx_profiles_location ON public.profiles(last_location_lat, last_location_lng);

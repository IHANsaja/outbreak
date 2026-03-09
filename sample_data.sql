-- SAMPLE DATA FOR OUTBREAK SYSTEM
-- NOTE: This script skips the profiles table to avoid conflicts with Supabase Auth users.
-- References to profiles (reporter_id, user_id, etc.) are set to NULL or omitted for portability.

-- 1. Regions
INSERT INTO public.regions (name, severity_level, impact_percentage) VALUES
('Central Colombo', 'High', 75),
('North Colombo', 'Mod', 40),
('South Colombo', 'Critical', 90),
('East Colombo', 'Low', 15),
('West Colombo', 'High', 65);

-- 2. Hazards (Danger Zones)
INSERT INTO public.hazards (severity, title, description, latitude, longitude, status) VALUES
('high', 'Toxic Smoke Plume', 'A large plume of toxic smoke is moving East from the industrial fire. Stay indoors.', 6.9271, 79.8612, 'active'),
('medium', 'Structural Instability', 'Bridge over North River showing signs of collapse. Closed to all traffic.', 6.9412, 79.8556, 'active'),
('high', 'Flash Flood Warning', 'Sudden rise in water levels in the low-lying areas of South Colombo.', 6.9012, 79.8756, 'active');

-- 3. Official Updates
INSERT INTO public.official_updates (title, content, severity) VALUES
('Evacuation Order: Zone A', 'All residents in Zone A are ordered to evacuate immediately to the nearest shelter.', 'urgent'),
('Safe Zones Established', 'New safe zones with food and water now open at the downtown stadium.', 'info'),
('Relief Center Locations', 'New relief centers have been opened at City Hall for those affected by the floods.', 'info'),
('Weather Warning', 'A secondary storm front is expected to hit in 4 hours. Secure all loose items.', 'warning');

-- 4. Incidents (Damage Reports)
INSERT INTO public.incidents (itype, latitude, longitude, description, status) VALUES
('Flooding', 6.9271, 79.8612, 'Severe flooding reported in the downtown area. Water levels rising rapidly.', 'verified'),
('Road Block', 6.9312, 79.8456, 'Major road blockage due to fallen trees and debris.', 'pending'),
('Landslide', 6.9456, 79.8789, 'Minor landslide detected near the hillside community.', 'verified'),
('Structural Damage', 6.9123, 79.8345, 'Significant structural damage reported in residential buildings.', 'pending');

-- 5. SOS Requests
INSERT INTO public.sos_requests (stype, latitude, longitude, additional_info, status) VALUES
('medical', 6.9200, 79.8600, 'Elderly person needs oxygen supply urgently.', 'active'),
('rescue', 6.9350, 79.8400, 'Family trapped on the second floor due to flooding.', 'dispatched'),
('fire', 6.9100, 79.8500, 'Electric transformer fire near residential block.', 'active');

-- 6. Resources (Logistics)
INSERT INTO public.resources (name, rtype, region_id, quantity, unit, status) 
SELECT 'Medical Kits', 'medical', id, 150, 'kits', 'available' FROM public.regions WHERE name = 'Central Colombo';

INSERT INTO public.resources (name, rtype, region_id, quantity, unit, status) 
SELECT 'Potable Water', 'food', id, 2500, 'liters', 'low' FROM public.regions WHERE name = 'South Colombo';

INSERT INTO public.resources (name, rtype, region_id, quantity, unit, status) 
SELECT 'Emergency Rations', 'food', id, 800, 'packs', 'critical' FROM public.regions WHERE name = 'South Colombo';

INSERT INTO public.resources (name, rtype, region_id, quantity, unit, status) 
SELECT 'Rescue Personnel', 'personnel', id, 24, 'staff', 'available' FROM public.regions WHERE name = 'West Colombo';

-- 7. CLEANUP QUERIES (Run these to remove sample data ONLY after testing is done)
DELETE FROM public.resources;
DELETE FROM public.sos_requests;
DELETE FROM public.incidents;
DELETE FROM public.official_updates;
DELETE FROM public.hazards;
DELETE FROM public.regions;

-- OUTBREAK SYSTEM DATABASE SCHEMA
-- Designed for Supabase (PostgreSQL)
-- This schema assumes Supabase Auth is used.

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 0. Cleanup (Optional: use with caution)
-- DROP TABLE IF EXISTS resources;
-- DROP TABLE IF EXISTS regions;
-- DROP TABLE IF EXISTS official_updates;
-- DROP TABLE IF EXISTS hazards;
-- DROP TABLE IF EXISTS sos_requests;
-- DROP TABLE IF EXISTS incidents;
-- DROP TABLE IF EXISTS profiles;
-- DROP TYPE IF EXISTS user_role;
-- ... (other types)

-- Enumerated Types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('citizen', 'community_supporter', 'authority');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE incident_type AS ENUM ('Flooding', 'Landslide', 'Structural Damage', 'Road Block');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE incident_status AS ENUM ('pending', 'verified', 'resolved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE sos_type AS ENUM ('medical', 'rescue', 'supplies', 'fire');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE sos_status AS ENUM ('active', 'dispatched', 'resolved');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE hazard_severity AS ENUM ('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE hazard_status AS ENUM ('active', 'cleared');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE update_severity AS ENUM ('info', 'warning', 'urgent');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE region_severity AS ENUM ('Low', 'Mod', 'High', 'Critical');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE resource_type AS ENUM ('medical', 'food', 'personnel', 'vehicle');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE resource_status AS ENUM ('available', 'low', 'critical');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 1. Profiles Table (Links to auth.users managed by Supabase)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'citizen',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    last_location_lat DECIMAL(10, 8),
    last_location_lng DECIMAL(11, 8)
);

-- Row Level Security (RLS) for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Incidents Table (Damage Reports)
CREATE TABLE public.incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    itype incident_type NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    gps_accuracy DECIMAL(5, 2),
    evidence_photo_url TEXT,
    description TEXT,
    status incident_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. SOS Requests Table
CREATE TABLE public.sos_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    stype sos_type NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    additional_info TEXT,
    status sos_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Hazards Table (Danger Zones)
CREATE TABLE public.hazards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    severity hazard_severity NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    status hazard_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Official Updates Table
CREATE TABLE public.official_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    authority_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    severity update_severity DEFAULT 'info',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Regions Table (Impact Stats)
CREATE TABLE public.regions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    severity_level region_severity DEFAULT 'Low',
    impact_percentage INTEGER CHECK (impact_percentage BETWEEN 0 AND 100),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Resources Table (Logistics)
CREATE TABLE public.resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    rtype resource_type NOT NULL,
    region_id UUID REFERENCES public.regions(id) ON DELETE CASCADE,
    quantity DECIMAL(12, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    status resource_status DEFAULT 'available',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX idx_incidents_location ON public.incidents(latitude, longitude);
CREATE INDEX idx_sos_location ON public.sos_requests(latitude, longitude);
CREATE INDEX idx_hazards_location ON public.hazards(latitude, longitude);
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON incidents FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_regions_updated_at BEFORE UPDATE ON regions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON resources FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- RPC for Chart Data
CREATE OR REPLACE FUNCTION get_hourly_stats()
RETURNS TABLE (hour int, count bigint) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        EXTRACT(HOUR FROM created_at)::int as hour,
        COUNT(*)::bigint as count
    FROM (
        SELECT created_at FROM public.sos_requests
        UNION ALL
        SELECT created_at FROM public.incidents
    ) combined_activity
    WHERE created_at > NOW() - INTERVAL '24 hours'
    GROUP BY hour
    ORDER BY hour;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

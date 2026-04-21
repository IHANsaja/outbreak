-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.hazards (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  severity USER-DEFINED NOT NULL,
  title character varying NOT NULL,
  description text,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  status USER-DEFINED DEFAULT 'active'::hazard_status,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT hazards_pkey PRIMARY KEY (id)
);
CREATE TABLE public.incidents (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  reporter_id uuid,
  itype USER-DEFINED NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  gps_accuracy numeric,
  evidence_photo_url text,
  description text,
  status USER-DEFINED DEFAULT 'pending'::incident_status,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT incidents_pkey PRIMARY KEY (id),
  CONSTRAINT incidents_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.official_updates (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  authority_id uuid,
  title character varying NOT NULL,
  content text NOT NULL,
  severity USER-DEFINED DEFAULT 'info'::update_severity,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT official_updates_pkey PRIMARY KEY (id),
  CONSTRAINT official_updates_authority_id_fkey FOREIGN KEY (authority_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email character varying NOT NULL UNIQUE,
  full_name character varying NOT NULL,
  role USER-DEFINED NOT NULL DEFAULT 'citizen'::user_role,
  created_at timestamp with time zone DEFAULT now(),
  last_login timestamp with time zone,
  last_location_lat numeric,
  last_location_lng numeric,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.regions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying NOT NULL UNIQUE,
  severity_level USER-DEFINED DEFAULT 'Low'::region_severity,
  impact_percentage integer CHECK (impact_percentage >= 0 AND impact_percentage <= 100),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT regions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.resources (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying NOT NULL,
  rtype USER-DEFINED NOT NULL,
  region_id uuid,
  quantity numeric NOT NULL,
  unit character varying NOT NULL,
  status USER-DEFINED DEFAULT 'available'::resource_status,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT resources_pkey PRIMARY KEY (id),
  CONSTRAINT resources_region_id_fkey FOREIGN KEY (region_id) REFERENCES public.regions(id)
);
CREATE TABLE public.river_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  station_id integer NOT NULL,
  river_id integer NOT NULL,
  water_level_now double precision NOT NULL,
  water_level_lag1 double precision,
  water_level_lag2 double precision,
  rainfall_roll3 double precision,
  hour integer NOT NULL,
  month integer NOT NULL,
  alert_level double precision,
  minor_flood double precision,
  major_flood double precision,
  forecast_1h double precision,
  forecast_12h double precision,
  forecast_24h double precision,
  timestamp timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  is_anomaly boolean DEFAULT false,
  CONSTRAINT river_reports_pkey PRIMARY KEY (id)
);
CREATE TABLE public.sos_requests (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  stype USER-DEFINED NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  additional_info text,
  status USER-DEFINED DEFAULT 'active'::sos_status,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT sos_requests_pkey PRIMARY KEY (id),
  CONSTRAINT sos_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
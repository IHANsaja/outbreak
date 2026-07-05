-- RPC consumed by onlineMode/app/actions/data.ts::getHourlyActivityStats()
-- to render the authority dashboard's "System Activity" hourly bar chart.
-- Returns one row per hour (0-23) with the count of incidents + SOS
-- requests created in that hour over the last 24 hours.
CREATE OR REPLACE FUNCTION public.get_hourly_stats()
RETURNS TABLE(hour integer, count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH hours AS (
    SELECT generate_series(0, 23) AS hour
  ),
  events AS (
    SELECT created_at FROM public.incidents WHERE created_at >= now() - interval '24 hours'
    UNION ALL
    SELECT created_at FROM public.sos_requests WHERE created_at >= now() - interval '24 hours'
  ),
  counted AS (
    SELECT EXTRACT(HOUR FROM created_at)::integer AS hour, count(*) AS count
    FROM events
    GROUP BY 1
  )
  SELECT h.hour, COALESCE(c.count, 0) AS count
  FROM hours h
  LEFT JOIN counted c ON c.hour = h.hour
  ORDER BY h.hour;
$$;

GRANT EXECUTE ON FUNCTION public.get_hourly_stats() TO authenticated, anon;

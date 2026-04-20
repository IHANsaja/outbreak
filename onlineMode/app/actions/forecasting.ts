"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getLatestRiverReports(stationId: number) {
  const { data, error } = await supabase
    .from("river_reports")
    .select("*")
    .eq("station_id", stationId)
    .order("timestamp", { ascending: false })
    .limit(12);

  if (error) {
    console.error("Error fetching river reports:", error);
    return [];
  }

  // Return in reverse chronological order for the chart (oldest to newest)
  return data.reverse();
}

import stationsData from "../../lib/stations.json";

/**
 * Returns available stations based on current active monitoring,
 * decorated with a boolean indicating if AI data is available.
 */
export async function getMonitoredStations() {
  // Fetch a recent sample of reports to determine which stations are active
  const { data } = await supabase
    .from("river_reports")
    .select("station_id")
    .order("timestamp", { ascending: false })
    .limit(2000);
    
  const activeIds = new Set<number>();
  if (data) {
    data.forEach(r => activeIds.add(r.station_id));
  }
  
  return stationsData.map(s => ({
    ...s,
    hasData: activeIds.has(s.id)
  }));
}

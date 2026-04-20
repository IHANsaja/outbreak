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

/**
 * Returns available stations based on current active monitoring.
 * Note: In production, this would come from a 'stations' table.
 */
export async function getMonitoredStations() {
  return [
    { id: 21, name: "Hanwella", river: "Kelani Ganga" },
    { id: 18, name: "Glencourse", river: "Kelani Ganga" },
    { id: 4, name: "Baddegama", river: "Gin Ganga" },
    { id: 68, name: "Panadugama", river: "Nilwala Ganga" },
    { id: 72, name: "Ratnapura", river: "Kalu Ganga" },
  ];
}

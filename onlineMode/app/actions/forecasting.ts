"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getLatestRiverReports(stationId: number) {
  // Fetch more records to ensure we have enough to sample hourly
  const { data, error } = await supabase
    .from("river_reports")
    .select("*")
    .eq("station_id", stationId)
    .order("timestamp", { ascending: false })
    .limit(300);

  if (error) {
    console.error("Error fetching river reports:", error);
    return [];
  }

  // Sample one record per hour
  const hourlyData: any[] = [];
  const seenHours = new Set<string>();

  for (const report of data) {
    const hourStr = new Date(report.timestamp).toISOString().slice(0, 13); // YYYY-MM-DDTHH
    if (!seenHours.has(hourStr)) {
      hourlyData.push(report);
      seenHours.add(hourStr);
    }
    if (hourlyData.length >= 12) break;
  }

  // Return in reverse chronological order for the chart (oldest to newest)
  return hourlyData.reverse();
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

/**
 * Fetches the absolute latest report for every station.
 * Used for dashboard-wide AI insight cards (e.g. Total stations at risk).
 */
export async function getGlobalAIInsights() {
  // Use a subquery/distinct logic to get the newest row per station_id
  const { data, error } = await supabase
    .from("river_reports")
    .select("*")
    .order("timestamp", { ascending: false });

  if (error) {
    console.error("Error fetching global insights:", error);
    return [];
  }

  // Deduplicate to get the latest per station
  const latestPerStation = new Map<number, any>();
  data.forEach(report => {
    if (!latestPerStation.has(report.station_id)) {
      latestPerStation.set(report.station_id, report);
    }
  });

  return Array.from(latestPerStation.values());
}

/**
 * Fetches data for a detailed report:
 * 1. Latest 24 reports for the chart
 * 2. Station metadata
 * 3. Latest report for ALL stations
 */
export async function getDetailedReportData(stationId: number) {
  // Fetch detailed history for selected station
  const stationPromise = supabase
    .from("river_reports")
    .select("*")
    .eq("station_id", stationId)
    .order("timestamp", { ascending: false })
    .limit(24);

  // Fetch global latest for all stations
  const globalPromise = supabase
    .from("river_reports")
    .select("*")
    .order("timestamp", { ascending: false });

  const [stationRes, globalRes] = await Promise.all([stationPromise, globalPromise]);

  if (stationRes.error || globalRes.error) {
    console.error("Error fetching detailed report data:", stationRes.error || globalRes.error);
    return { reports: [], station: null, globalInsights: [] };
  }

  // Sample hourly records for the chart
  const hourlyReports: any[] = [];
  const seenHours = new Set<string>();
  const rawReports = stationRes.data || [];

  for (const report of rawReports) {
    const hourStr = new Date(report.timestamp).toISOString().slice(0, 13);
    if (!seenHours.has(hourStr)) {
      hourlyReports.push(report);
      seenHours.add(hourStr);
    }
    if (hourlyReports.length >= 24) break;
  }

  const station = stationsData.find(s => s.id === stationId);
  
  // Deduplicate global results for the "all river status" table
  const latestPerStation = new Map<number, any>();
  globalRes.data?.forEach(report => {
    if (!latestPerStation.has(report.station_id)) {
      latestPerStation.set(report.station_id, report);
    }
  });

  return { 
    reports: hourlyReports.reverse(), 
    station,
    globalInsights: Array.from(latestPerStation.values())
  };
}

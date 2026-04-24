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
/**
 * Fetches a summary of the latest DMC pipeline data for the home page.
 * Returns the latest report per station with station name/river metadata,
 * plus aggregate stats for the national water level overview.
 */
export async function getLatestDMCBrief() {
  const { data, error } = await supabase
    .from("river_reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("Error fetching DMC brief:", error);
    return { stations: [], stats: { totalMonitored: 0, atAlert: 0, flooding: 0, anomalies: 0, lastUpdated: null } };
  }

  // Deduplicate to get the latest report per station
  const latestPerStation = new Map<number, any>();
  data.forEach(report => {
    if (!latestPerStation.has(report.station_id)) {
      latestPerStation.set(report.station_id, report);
    }
  });

  const stationReports = Array.from(latestPerStation.values()).map(report => {
    const stationMeta = stationsData.find(s => s.id === report.station_id);
    const status = 
      report.water_level_now >= (report.major_flood || 999) ? "flood" :
      report.water_level_now >= (report.minor_flood || 999) ? "minor_flood" :
      report.water_level_now >= (report.alert_level || 999) ? "alert" : "safe";
    
    return {
      ...report,
      station_name: stationMeta?.name || `Station ${report.station_id}`,
      river_name: stationMeta?.river || "Unknown River",
      status,
      delta: report.water_level_lag1 ? +(report.water_level_now - report.water_level_lag1).toFixed(2) : 0,
    };
  });

  // Sort: critical first, then by water level descending
  stationReports.sort((a, b) => {
    const order: Record<string, number> = { flood: 0, minor_flood: 1, alert: 2, safe: 3 };
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
    return b.water_level_now - a.water_level_now;
  });

  const stats = {
    totalMonitored: stationReports.length,
    atAlert: stationReports.filter(r => r.status === "alert" || r.status === "minor_flood" || r.status === "flood").length,
    flooding: stationReports.filter(r => r.status === "flood" || r.status === "minor_flood").length,
    anomalies: stationReports.filter(r => r.is_anomaly).length,
    lastUpdated: stationReports[0]?.created_at || null,
  };

  return { stations: stationReports, stats };
}

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

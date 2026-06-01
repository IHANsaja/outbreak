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
 * Returns ALL stations from stations.json enriched with their latest river_reports data.
 * Every station always appears on the map. Stations with live data include forecasts/water levels.
 * This is designed for the SituationMap component — self-contained, no parent plumbing needed.
 */
export async function getMapStations() {
  // Fetch recent reports to find the latest per station
  const { data, error } = await supabase
    .from("river_reports")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(2000);

  if (error) {
    console.error("Error fetching map station data:", error);
  }

  // Build a map of station_id → latest report
  const latestByStation = new Map<number, any>();
  if (data) {
    for (const row of data) {
      if (!latestByStation.has(row.station_id)) {
        latestByStation.set(row.station_id, row);
      }
    }
  }

  // Merge every station from stations.json with its latest report (if any)
  return stationsData.map(station => {
    const report = latestByStation.get(station.id);
    return {
      station_id: station.id,
      name: station.name,
      river: station.river,
      latitude: station.latitude,
      longitude: station.longitude,
      // Live data (null if no report exists)
      hasData: !!report,
      water_level_now: report?.water_level_now ?? null,
      water_level_lag1: report?.water_level_lag1 ?? null,
      rainfall_roll3: report?.rainfall_roll3 ?? null,
      alert_level: report?.alert_level ?? null,
      minor_flood: report?.minor_flood ?? null,
      major_flood: report?.major_flood ?? null,
      forecast_1h: report?.forecast_1h ?? null,
      forecast_12h: report?.forecast_12h ?? null,
      forecast_24h: report?.forecast_24h ?? null,
      is_anomaly: report?.is_anomaly ?? false,
      timestamp: report?.timestamp ?? null,
    };
  });
}

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

  // Enrich with station metadata (lat, lng, name, river) from stations.json
  return Array.from(latestPerStation.values()).map(report => {
    const station = stationsData.find(s => s.id === report.station_id);
    return {
      ...report,
      latitude: station?.latitude ?? null,
      longitude: station?.longitude ?? null,
      name: station?.name ?? `Station ${report.station_id}`,
      river: station?.river ?? "Unknown River",
    };
  });
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

export async function getCriticalAlerts() {
  // Fetch latest reports for all stations (scanning 1000 to be safe for coverage)
  const { data, error } = await supabase
    .from("river_reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    console.error("Error fetching alerts:", error);
    return [];
  }

  // Deduplicate to get the latest per station
  const latestPerStation = new Map<number, any>();
  data.forEach(report => {
    if (!latestPerStation.has(report.station_id)) {
      latestPerStation.set(report.station_id, report);
    }
  });

  const alerts: any[] = [];
  
  latestPerStation.forEach((report) => {
    const stationMeta = stationsData.find(s => s.id === report.station_id);
    const river = stationMeta?.river || "Unknown River";
    const station = stationMeta?.name || "Unknown Station";
    
    // Check Current Status
    let currentLevel = "safe";
    if (report.water_level_now >= (report.major_flood || 999)) currentLevel = "major";
    else if (report.water_level_now >= (report.minor_flood || 999)) currentLevel = "minor";
    else if (report.water_level_now >= (report.alert_level || 999)) currentLevel = "alert";

    // Check Forecast Status (max of 1h, 12h, 24h)
    const maxForecast = Math.max(
      report.forecast_1h || 0, 
      report.forecast_12h || 0, 
      report.forecast_24h || 0
    );
    
    let forecastLevel = "safe";
    if (maxForecast >= (report.major_flood || 999)) forecastLevel = "major";
    else if (maxForecast >= (report.minor_flood || 999)) forecastLevel = "minor";
    else if (maxForecast >= (report.alert_level || 999)) forecastLevel = "alert";

    // Only alert if either current or forecast is at least "alert" level
    if (currentLevel !== "safe" || forecastLevel !== "safe") {
      alerts.push({
        station_id: report.station_id,
        river,
        station,
        currentLevel,
        forecastLevel,
        isAnomaly: report.is_anomaly,
        timestamp: report.timestamp
      });
    }
  });

  return alerts;
}

import { getCriticalAlerts } from "../onlineMode/app/actions/forecasting";

async function test() {
  console.log("Fetching alerts...");
  const alerts = await getCriticalAlerts();
  console.log("Active Alerts:", JSON.stringify(alerts, null, 2));
}

test();

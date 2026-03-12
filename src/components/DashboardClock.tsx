import { useEffect } from "react";
import { useDashboardStore } from "@/stores/dashboardStore";

// Single global clock — increments tick every second.
// Mount once in each page that needs live data (Dashboard, DisplayDashboard).
export default function DashboardClock() {
  const incrementTick = useDashboardStore((s) => s.incrementTick);

  useEffect(() => {
    const id = setInterval(incrementTick, 1000);
    return () => clearInterval(id);
  }, [incrementTick]);

  return null;
}

import { useEffect } from "react";
import { useDashboardStore } from "@/stores/dashboardStore";

export default function DashboardClock() {
  const incrementTick = useDashboardStore((s) => s.incrementTick);

  useEffect(() => {
    const id = setInterval(incrementTick, 1000);
    return () => clearInterval(id);
  }, []);

  return null;
}

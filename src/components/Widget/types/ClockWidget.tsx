import { useState, useEffect } from "react";
import type { ClockConfig } from "@/types/widget";

export default function ClockWidget({ config }: { config: ClockConfig }) {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const formatted = config.format === "12h"
    ? time.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })
    : time.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

  return (
    <div className="widget-clock">
      <span className="widget-clock__time">{formatted}</span>
    </div>
  );
}

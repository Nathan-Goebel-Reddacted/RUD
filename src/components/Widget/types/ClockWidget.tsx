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
    <div className="d-flex align-center justify-center w-full h-full">
      <span style={{ fontSize: '2.2rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.05em' }}>{formatted}</span>
    </div>
  );
}

import { useEffect, useState } from "react";
import {
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { LineChartConfig } from "@/types/widget";
import { appendEntry, getEntries } from "@/stores/widgetHistory";

function groupAndCount(rows: unknown[], xKey: string): Record<string, unknown>[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    if (typeof row !== "object" || row === null) continue;
    const val = String((row as Record<string, unknown>)[xKey] ?? "");
    counts.set(val, (counts.get(val) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => Number(a[0]) - Number(b[0]) || a[0].localeCompare(b[0]))
    .map(([k, v]) => ({ [xKey]: k, count: v }));
}

const DEFAULT_COLORS = [
  "#4a9eff",
  "#ff6b6b",
  "#51cf66",
  "#ffd43b",
  "#cc5de8",
  "#74c0fc",
];

type Props = {
  data:      unknown;
  config:    LineChartConfig;
  widgetId:  string;
  fetchedAt: number | null;
};

function formatTime(ts: unknown): string {
  if (typeof ts !== "number") return String(ts);
  return new Date(ts).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function LineChart({ data, config, widgetId, fetchedAt }: Props) {
  const { xKey, yKeys, xLabel, yLabel, colors, aggregation, keepHistory, maxPoints = 50 } = config;
  const [, forceUpdate] = useState(0);

  // RUD041: append a snapshot to history on each new fetch
  useEffect(() => {
    if (!keepHistory || fetchedAt === null) return;
    const obj: Record<string, unknown> = { _t: fetchedAt };
    if (typeof data === "object" && data !== null && !Array.isArray(data)) {
      Object.assign(obj, data as Record<string, unknown>);
    } else if (!Array.isArray(data) && data !== null && data !== undefined) {
      // scalar → use first yKey
      if (yKeys[0]) obj[yKeys[0]] = data;
    }
    appendEntry(widgetId, obj, maxPoints);
    forceUpdate((n) => n + 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchedAt]);

  // Use history when enabled; otherwise use live data array
  const rawRows: unknown[] = keepHistory
    ? getEntries(widgetId)
    : (Array.isArray(data) ? data : []);

  const rows = aggregation === "count" ? groupAndCount(rawRows, xKey) : rawRows;
  const activeYKeys    = aggregation === "count" ? ["count"] : yKeys;
  const useHistoryXKey = keepHistory && aggregation !== "count";
  const activeXKey     = useHistoryXKey ? "_t" : xKey;

  if (rows.length === 0) {
    return <p className="widget-chart__empty">No data</p>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ReLineChart data={rows as Record<string, unknown>[]} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #ccc)" />
        <XAxis
          dataKey={activeXKey}
          tickFormatter={useHistoryXKey ? formatTime : undefined}
          label={xLabel ? { value: xLabel, position: "insideBottom", offset: -4 } : undefined}
          tick={{ fontSize: 11 }}
        />
        <YAxis
          label={
            yLabel
              ? { value: yLabel, angle: -90, position: "insideLeft" }
              : undefined
          }
          tick={{ fontSize: 11 }}
        />
        <Tooltip labelFormatter={useHistoryXKey ? (v) => formatTime(v) : undefined} />
        {activeYKeys.length > 1 && <Legend />}
        {activeYKeys.map((key, idx) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={(colors && colors[idx]) ?? DEFAULT_COLORS[idx % DEFAULT_COLORS.length]}
            dot={false}
          />
        ))}
      </ReLineChart>
    </ResponsiveContainer>
  );
}

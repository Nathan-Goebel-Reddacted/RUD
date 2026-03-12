import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { BarChartConfig } from "@/types/widget";
import { resolveThresholdColor } from "@/types/widget";

type Props = {
  data:   unknown;
  config: BarChartConfig;
};

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

export default function BarChart({ data, config }: Props) {
  const { xKey, yKey, xLabel, yLabel, color, aggregation, thresholds } = config;

  const rawRows    = Array.isArray(data) ? data : [];
  const rows       = aggregation === "count" ? groupAndCount(rawRows, xKey) : rawRows;
  const activeYKey = aggregation === "count" ? "count" : yKey;
  const defaultColor = color ?? "var(--primary-color, #4a9eff)";
  const hasThresholds = thresholds && thresholds.length > 0;

  if (rows.length === 0) {
    return <p className="widget-chart__empty">No data</p>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ReBarChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #ccc)" />
        <XAxis
          dataKey={xKey}
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
        <Tooltip />
        <Bar dataKey={activeYKey} fill={defaultColor}>
          {hasThresholds && rows.map((row, i) => {
            const val = Number((row as Record<string, unknown>)[activeYKey] ?? 0);
            const cellColor = resolveThresholdColor(val, thresholds!) ?? defaultColor;
            return <Cell key={i} fill={cellColor} />;
          })}
        </Bar>
      </ReBarChart>
    </ResponsiveContainer>
  );
}

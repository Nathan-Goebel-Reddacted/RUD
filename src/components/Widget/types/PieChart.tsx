import {
  PieChart as RePieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { PieChartConfig } from "@/types/widget";

const DEFAULT_COLORS = [
  "#4a9eff", "#ff6b6b", "#4caf50", "#ffc107", "#9c27b0",
  "#00bcd4", "#ff9800", "#e91e63", "#607d8b", "#8bc34a",
];

type Props = {
  data:   unknown;
  config: PieChartConfig;
};

function groupAndCount(rows: unknown[], key: string): { name: string; value: number }[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    if (typeof row !== "object" || row === null) continue;
    const val = String((row as Record<string, unknown>)[key] ?? "");
    counts.set(val, (counts.get(val) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
}

export default function PieChart({ data, config }: Props) {
  const { labelKey, valueKey, colors, aggregation, showLabels = true } = config;
  const palette = colors?.length ? colors : DEFAULT_COLORS;

  if (!Array.isArray(data) || data.length === 0) {
    return <p style={{ opacity: 0.5, fontSize: "0.85rem" }}>No data</p>;
  }

  const slices: { name: string; value: number }[] =
    aggregation === "count"
      ? groupAndCount(data, labelKey)
      : data
          .filter((row) => typeof row === "object" && row !== null)
          .map((row) => {
            const r = row as Record<string, unknown>;
            return {
              name:  String(r[labelKey] ?? ""),
              value: Number(r[valueKey] ?? 0),
            };
          })
          .filter((s) => !isNaN(s.value));

  if (slices.length === 0) {
    return <p style={{ opacity: 0.5, fontSize: "0.85rem" }}>No data</p>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RePieChart>
        <Pie
          data={slices}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius="70%"
          label={showLabels ? (({ name, percent }: { name?: string; percent?: number }) => `${name ?? ""} (${((percent ?? 0) * 100).toFixed(0)}%)`) : false}
          labelLine={showLabels}
          isAnimationActive={false}
        >
          {slices.map((_, i) => (
            <Cell key={i} fill={palette[i % palette.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number | undefined) => (value ?? 0).toLocaleString()} />
        {!showLabels && <Legend />}
      </RePieChart>
    </ResponsiveContainer>
  );
}

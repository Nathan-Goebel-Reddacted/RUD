import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { BarChartConfig } from "@/types/widget";

type Props = {
  data:   unknown;
  config: BarChartConfig;
};

export default function BarChart({ data, config }: Props) {
  const { xKey, yKey, xLabel, yLabel, color } = config;

  const rows = Array.isArray(data) ? data : [];

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
        <Bar dataKey={yKey} fill={color ?? "var(--primary-color, #4a9eff)"} />
      </ReBarChart>
    </ResponsiveContainer>
  );
}

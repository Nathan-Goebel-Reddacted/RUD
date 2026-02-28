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

const DEFAULT_COLORS = [
  "#4a9eff",
  "#ff6b6b",
  "#51cf66",
  "#ffd43b",
  "#cc5de8",
  "#74c0fc",
];

type Props = {
  data:   unknown;
  config: LineChartConfig;
};

export default function LineChart({ data, config }: Props) {
  const { xKey, yKeys, xLabel, yLabel, colors } = config;

  const rows = Array.isArray(data) ? data : [];

  if (rows.length === 0) {
    return <p className="widget-chart__empty">No data</p>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ReLineChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
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
        {yKeys.length > 1 && <Legend />}
        {yKeys.map((key, idx) => (
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

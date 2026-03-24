import type { GaugeConfig } from "@/types/widget";
import { resolveThresholdColor } from "@/types/widget";

type Props = {
  data:      unknown;
  config:    GaugeConfig;
  widgetId:  string;
  fetchedAt: number | null;
};

// SVG semi-circle gauge
// viewBox: 0 0 200 110, cx=100, cy=100, r=80
// Arc spans 180° from left (180°) to right (0°)
const CX = 100;
const CY = 100;
const R  = 80;
const STROKE = 12;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const start = polarToCartesian(cx, cy, r, startDeg);
  const end   = polarToCartesian(cx, cy, r, endDeg);
  const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  const sweep = endDeg > startDeg ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} ${sweep} ${end.x} ${end.y}`;
}

export default function GaugeWidget({ data, config }: Props) {
  const { min = 0, max = 100, unit, decimalPlaces, thresholds, color = "#4a9eff" } = config;

  if (Array.isArray(data) || (typeof data === "object" && data !== null)) {
    return (
      <div className="widget-card__error">
        <span className="widget-card__error-icon">⚠</span>
        <span>Data path returns an object or array — use a path pointing to a scalar value (e.g. <code>$.total</code>)</span>
      </div>
    );
  }

  const num       = data !== null && data !== undefined ? Number(data) : NaN;
  const clamped   = isNaN(num) ? 0 : Math.min(Math.max(num, min), max);
  const range     = max - min || 1;
  const normalized = (clamped - min) / range;

  // Arc goes from 180° (left) sweeping to 0° (right) — so value arc ends at 180° - normalized*180°
  const bgStart    = 180;
  const bgEnd      = 0;
  const valueEnd   = 180 - normalized * 180;

  const arcColor = (!isNaN(num) && thresholds?.length)
    ? resolveThresholdColor(num, thresholds) ?? color
    : color;

  let display = "—";
  if (!isNaN(num)) {
    display = decimalPlaces !== undefined ? num.toFixed(decimalPlaces) : String(num);
  }

  const leftPt  = polarToCartesian(CX, CY, R, 180);
  const rightPt = polarToCartesian(CX, CY, R, 0);

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.25rem" }}>
      <svg
        viewBox="0 0 200 110"
        style={{ width: "100%", maxWidth: "220px", overflow: "visible" }}
        aria-hidden="true"
      >
        {/* Background arc */}
        <path
          d={arcPath(CX, CY, R, bgStart, bgEnd)}
          fill="none"
          stroke="var(--border-color)"
          strokeWidth={STROKE}
          strokeLinecap="round"
        />
        {/* Value arc — only render if there's a value */}
        {!isNaN(num) && normalized > 0 && (
          <path
            d={arcPath(CX, CY, R, bgStart, valueEnd)}
            fill="none"
            stroke={arcColor}
            strokeWidth={STROKE}
            strokeLinecap="round"
          />
        )}
        {/* Min label */}
        <text
          x={leftPt.x - 6}
          y={leftPt.y + 14}
          textAnchor="middle"
          fontSize="11"
          fill="var(--text-color)"
          opacity="0.5"
        >
          {min}
        </text>
        {/* Max label */}
        <text
          x={rightPt.x + 6}
          y={rightPt.y + 14}
          textAnchor="middle"
          fontSize="11"
          fill="var(--text-color)"
          opacity="0.5"
        >
          {max}
        </text>
        {/* Center value */}
        <text
          x={CX}
          y={CY - 4}
          textAnchor="middle"
          fontSize="28"
          fontWeight="700"
          fill={!isNaN(num) ? arcColor : "var(--text-color)"}
        >
          {display}
        </text>
        {unit && (
          <text
            x={CX}
            y={CY + 16}
            textAnchor="middle"
            fontSize="13"
            fill="var(--text-color)"
            opacity="0.6"
          >
            {unit}
          </text>
        )}
      </svg>
    </div>
  );
}

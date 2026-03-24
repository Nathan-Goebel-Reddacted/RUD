import type { ProgressConfig } from "@/types/widget";
import { resolveThresholdColor } from "@/types/widget";

type Props = {
  data:      unknown;
  config:    ProgressConfig;
  widgetId:  string;
  fetchedAt: number | null;
};

export default function ProgressWidget({ data, config }: Props) {
  const {
    min = 0,
    max = 100,
    unit,
    decimalPlaces,
    showPercent = true,
    color = "#4a9eff",
    thresholds,
  } = config;

  if (Array.isArray(data) || (typeof data === "object" && data !== null)) {
    return (
      <div className="widget-card__error">
        <span className="widget-card__error-icon">⚠</span>
        <span>Data path returns an object or array — use a path pointing to a scalar value (e.g. <code>$.total</code>)</span>
      </div>
    );
  }

  const num      = data !== null && data !== undefined ? Number(data) : NaN;
  const range    = max - min || 1;
  const clamped  = isNaN(num) ? 0 : Math.min(Math.max(num, min), max);
  const pct      = ((clamped - min) / range) * 100;

  const barColor = (!isNaN(num) && thresholds?.length)
    ? resolveThresholdColor(num, thresholds) ?? color
    : color;

  let display = "—";
  if (!isNaN(num)) {
    display = decimalPlaces !== undefined ? num.toFixed(decimalPlaces) : String(num);
  }

  return (
    <div className="d-flex flex-col align-stretch" style={{ gap: "0.5rem", width: "100%" }}>
      {/* Value row */}
      <div className="d-flex justify-between align-baseline" style={{ gap: "0.4rem" }}>
        <div className="d-flex align-baseline" style={{ gap: "0.3rem" }}>
          <span className="widget-number-card__value" style={{ color: barColor }}>
            {display}
          </span>
          {unit && <span style={{ fontSize: "1rem", opacity: 0.6 }}>{unit}</span>}
        </div>
        {showPercent && !isNaN(num) && (
          <span style={{ fontSize: "0.85rem", opacity: 0.55, fontVariantNumeric: "tabular-nums" }}>
            {pct.toFixed(0)}%
          </span>
        )}
      </div>
      {/* Bar */}
      <div
        style={{
          width: "100%",
          height: "10px",
          borderRadius: "5px",
          background: "var(--border-color)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${isNaN(num) ? 0 : pct}%`,
            height: "100%",
            borderRadius: "5px",
            background: barColor,
            transition: "width 0.4s ease",
          }}
        />
      </div>
      {/* Min/max labels */}
      <div className="d-flex justify-between" style={{ fontSize: "0.72rem", opacity: 0.45 }}>
        <span>{min}{unit ? ` ${unit}` : ""}</span>
        <span>{max}{unit ? ` ${unit}` : ""}</span>
      </div>
    </div>
  );
}

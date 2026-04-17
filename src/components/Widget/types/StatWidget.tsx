import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { StatConfig } from "@/types/widget";
import { resolveThresholdColor } from "@/types/widget";
import { appendScalar, getScalars } from "@/stores/widgetHistory";
import { useValueChange } from "@/hooks/useValueChange";

type Props = {
  data:      unknown;
  config:    StatConfig;
  widgetId:  string;
  fetchedAt: number | null;
};

export default function StatWidget({ data, config, widgetId, fetchedAt }: Props) {
  const {
    unit,
    decimalPlaces,
    deltaFormat = "absolute",
    positiveColor = "#4caf50",
    negativeColor = "#f44336",
    thresholds,
  } = config;

  const [, forceUpdate] = useState(0);

  if (Array.isArray(data) || (typeof data === "object" && data !== null)) {
    return (
      <div className="widget-card__error">
        <span className="widget-card__error-icon">⚠</span>
        <span>Data path returns an object or array — use a path pointing to a scalar value (e.g. <code>$.total</code>)</span>
      </div>
    );
  }

  const num = data !== null && data !== undefined ? Number(data) : NaN;

  useEffect(() => {
    if (!isNaN(num) && fetchedAt !== null) {
      appendScalar(widgetId, num, 2);
      forceUpdate((n) => n + 1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchedAt]);

  const history  = getScalars(widgetId);
  const previous = history.length >= 2 ? history[history.length - 2] : null;

  let delta: number | null = null;
  if (previous !== null && !isNaN(num)) {
    if (deltaFormat === "percent") {
      delta = previous !== 0 ? ((num - previous) / Math.abs(previous)) * 100 : null;
    } else {
      delta = num - previous;
    }
  }

  const valueColor = (!isNaN(num) && thresholds?.length)
    ? resolveThresholdColor(num, thresholds)
    : undefined;

  let display = "—";
  if (!isNaN(num)) {
    display = decimalPlaces !== undefined ? num.toFixed(decimalPlaces) : String(num);
  }

  const changed = useValueChange(display, fetchedAt);

  let deltaDisplay = "—";
  let deltaColor   = "var(--text-color)";
  let DeltaIcon    = Minus;

  if (delta !== null) {
    const sign = delta > 0 ? "+" : "";
    if (deltaFormat === "percent") {
      const decimals = decimalPlaces !== undefined ? decimalPlaces : 1;
      deltaDisplay = `${sign}${delta.toFixed(decimals)}%`;
    } else {
      deltaDisplay = decimalPlaces !== undefined
        ? `${sign}${delta.toFixed(decimalPlaces)}`
        : `${sign}${delta}`;
    }
    if (delta > 0) {
      deltaColor = positiveColor;
      DeltaIcon  = TrendingUp;
    } else if (delta < 0) {
      deltaColor = negativeColor;
      DeltaIcon  = TrendingDown;
    }
  }

  return (
    <div className="d-flex flex-col align-stretch" style={{ gap: "0.35rem" }}>
      {/* Main value */}
      <div className="d-flex align-baseline" style={{ gap: "0.4rem" }}>
        <span className={`widget-number-card__value${changed ? " widget-value--changed" : ""}`} style={valueColor ? { color: valueColor } : undefined}>
          {display}
        </span>
        {unit && <span style={{ fontSize: "1rem", opacity: 0.6 }}>{unit}</span>}
      </div>
      {/* Delta row */}
      <div className="d-flex align-center" style={{ gap: "0.3rem", color: deltaColor, fontSize: "0.9rem", fontWeight: 500 }}>
        <DeltaIcon size={14} strokeWidth={2} />
        <span>{deltaDisplay}</span>
        {deltaFormat === "percent" && delta !== null && unit && (
          <span style={{ opacity: 0.5, fontSize: "0.78rem", fontWeight: 400 }}>
            ({delta > 0 ? "+" : ""}{decimalPlaces !== undefined ? (num - (previous ?? 0)).toFixed(decimalPlaces) : (num - (previous ?? 0))}{unit})
          </span>
        )}
      </div>
    </div>
  );
}

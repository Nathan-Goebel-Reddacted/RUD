import { useEffect, useState } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import type { NumberCardConfig } from "@/types/widget";
import { resolveThresholdColor } from "@/types/widget";
import { appendScalar, getScalars } from "@/stores/widgetHistory";
import { useValueChange } from "@/hooks/useValueChange";

type Props = {
  data:      unknown;
  config:    NumberCardConfig;
  widgetId:  string;
  fetchedAt: number | null;
};

export default function NumberCard({ data, config, widgetId, fetchedAt }: Props) {
  const { unit, decimalPlaces, thresholds, keepHistory, maxPoints = 50 } = config;

  const isInvalidType = Array.isArray(data) || (typeof data === "object" && data !== null);
  const num = !isInvalidType && data !== null && data !== undefined ? Number(data) : NaN;

  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (keepHistory && !isNaN(num) && fetchedAt !== null) {
      appendScalar(widgetId, num, maxPoints);
      forceUpdate((n) => n + 1);
    }
  }, [fetchedAt]);

  let display = "—";
  if (!isNaN(num)) {
    display = decimalPlaces !== undefined ? num.toFixed(decimalPlaces) : String(num);
  }

  const color   = (!isNaN(num) && thresholds?.length)
    ? resolveThresholdColor(num, thresholds)
    : undefined;
  const changed = useValueChange(display, fetchedAt);

  if (isInvalidType) {
    return (
      <div className="widget-card__error">
        <span className="widget-card__error-icon">⚠</span>
        <span>Data path returns an object or array — use a path pointing to a scalar value (e.g. <code>$.total</code> or <code>$[0].id</code>)</span>
      </div>
    );
  }

  const history   = keepHistory ? getScalars(widgetId) : [];
  const sparkData = history.map((v) => ({ v }));

  return (
    <div className={keepHistory ? 'd-flex flex-col align-stretch' : 'd-flex align-baseline'} style={{ gap: keepHistory ? '0.25rem' : '0.4rem' }}>
      <div className="d-flex align-baseline" style={{ gap: '0.4rem' }}>
        <span className={`widget-number-card__value${changed ? " widget-value--changed" : ""}`} style={color ? { color } : undefined}>
          {display}
        </span>
        {unit && <span style={{ fontSize: '1rem', opacity: 0.6 }}>{unit}</span>}
      </div>
      {keepHistory && sparkData.length > 1 && (
        <div style={{ width: '100%', height: '40px', marginTop: '0.15rem' }}>
          <ResponsiveContainer width="100%" height={40}>
            <LineChart data={sparkData}>
              <Line
                type="monotone"
                dataKey="v"
                stroke={color ?? "#4a9eff"}
                dot={false}
                strokeWidth={1.5}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

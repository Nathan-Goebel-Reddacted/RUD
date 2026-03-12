import { useEffect, useState } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import type { NumberCardConfig } from "@/types/widget";
import { resolveThresholdColor } from "@/types/widget";
import { appendScalar, getScalars } from "@/stores/widgetHistory";

type Props = {
  data:      unknown;
  config:    NumberCardConfig;
  widgetId:  string;
  fetchedAt: number | null;
};

export default function NumberCard({ data, config, widgetId, fetchedAt }: Props) {
  const { unit, decimalPlaces, thresholds, keepHistory, maxPoints = 50 } = config;

  if (Array.isArray(data) || (typeof data === "object" && data !== null)) {
    return (
      <div className="widget-card__error">
        <span className="widget-card__error-icon">⚠</span>
        <span>Data path returns an object or array — use a path pointing to a scalar value (e.g. <code>$.total</code> or <code>$[0].id</code>)</span>
      </div>
    );
  }

  const num = data !== null && data !== undefined ? Number(data) : NaN;
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (keepHistory && !isNaN(num) && fetchedAt !== null) {
      appendScalar(widgetId, num, maxPoints);
      forceUpdate((n) => n + 1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchedAt]);

  let display = "—";
  if (!isNaN(num)) {
    display = decimalPlaces !== undefined ? num.toFixed(decimalPlaces) : String(num);
  }

  const color = (!isNaN(num) && thresholds?.length)
    ? resolveThresholdColor(num, thresholds)
    : undefined;

  const history   = keepHistory ? getScalars(widgetId) : [];
  const sparkData = history.map((v) => ({ v }));

  return (
    <div className={`widget-number-card${keepHistory ? " widget-number-card--with-history" : ""}`}>
      <div className="widget-number-card__top">
        <span className="widget-number-card__value" style={color ? { color } : undefined}>
          {display}
        </span>
        {unit && <span className="widget-number-card__unit">{unit}</span>}
      </div>
      {keepHistory && sparkData.length > 1 && (
        <div className="widget-number-card__sparkline">
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

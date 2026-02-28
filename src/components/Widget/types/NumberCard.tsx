import type { NumberCardConfig } from "@/types/widget";

type Props = {
  data:   unknown;
  config: NumberCardConfig;
};

export default function NumberCard({ data, config }: Props) {
  const { unit, decimalPlaces } = config;

  if (Array.isArray(data) || (typeof data === "object" && data !== null)) {
    return (
      <div className="widget-card__error">
        <span className="widget-card__error-icon">⚠</span>
        <span>Data path returns an object or array — use a path pointing to a scalar value (e.g. <code>$.total</code> or <code>$[0].id</code>)</span>
      </div>
    );
  }

  let display = "—";
  if (data !== null && data !== undefined) {
    const num = Number(data);
    display = !isNaN(num)
      ? (decimalPlaces !== undefined ? num.toFixed(decimalPlaces) : String(num))
      : String(data);
  }

  return (
    <div className="widget-number-card">
      <span className="widget-number-card__value">{display}</span>
      {unit && <span className="widget-number-card__unit">{unit}</span>}
    </div>
  );
}

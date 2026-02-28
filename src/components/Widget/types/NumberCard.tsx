import type { NumberCardConfig } from "@/types/widget";

type Props = {
  data:   unknown;
  config: NumberCardConfig;
};

export default function NumberCard({ data, config }: Props) {
  const { unit, decimalPlaces } = config;

  let display = "—";
  if (data !== null && data !== undefined) {
    const num = Number(data);
    if (!isNaN(num)) {
      display =
        decimalPlaces !== undefined ? num.toFixed(decimalPlaces) : String(num);
    } else {
      display = String(data);
    }
  }

  return (
    <div className="widget-number-card">
      <span className="widget-number-card__value">{display}</span>
      {unit && <span className="widget-number-card__unit">{unit}</span>}
    </div>
  );
}

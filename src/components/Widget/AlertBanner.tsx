import { useTranslation } from "react-i18next";
import type { AlertEvent } from "@/types/widget";

export type ActiveAlert = AlertEvent & { uid: string };

type Props = {
  alerts:    ActiveAlert[];
  onDismiss: (uid: string) => void;
};

export default function AlertBanner({ alerts, onDismiss }: Props) {
  const { t } = useTranslation();
  if (alerts.length === 0) return null;

  return (
    <div className="alert-banner" role="alert" aria-live="polite">
      {alerts.map((a) => (
        <div
          key={a.uid}
          className="alert-banner__item"
          style={{ "--alert-item-color": a.color } as React.CSSProperties}
        >
          <span className="alert-banner__dot" />
          <span>
            <strong>{a.widgetLabel}</strong>
            {" — "}
            {t("alert.thresholdCrossed", { value: a.value })}
          </span>
          <button
            className="alert-banner__dismiss"
            title={t("alert.dismiss")}
            onClick={() => onDismiss(a.uid)}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

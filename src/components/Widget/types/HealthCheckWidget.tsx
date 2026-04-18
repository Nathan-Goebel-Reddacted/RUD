import { useTranslation } from "react-i18next";
import type { HealthCheckConfig, WidgetDataState } from "@/types/widget";
import { resolveThresholdColor } from "@/types/widget";
import { useValueChange } from "@/hooks/useValueChange";

function isOk(httpCode: number | null, okCodes?: number[]): boolean {
  if (httpCode === null) return false;
  if (okCodes && okCodes.length > 0) return okCodes.includes(httpCode);
  return httpCode >= 200 && httpCode < 300;
}

type Props = {
  config:    HealthCheckConfig;
  dataState: WidgetDataState;
};

export default function HealthCheckWidget({ config, dataState }: Props) {
  const { t } = useTranslation();
  const { httpCode, loading, error } = dataState;

  const ok      = isOk(httpCode, config.okCodes);
  const changed = useValueChange(String(ok), dataState.fetchedAt);

  if (loading && httpCode === null) {
    return <div className="d-flex align-center gap-2 w-full h-full" style={{ opacity: 0.5 }}>…</div>;
  }

  if (error === "endpoint_not_found" || error === "cors") {
    return (
      <div className="d-flex align-center gap-2 w-full h-full" style={{ opacity: 0.7 }}>
        <span className="widget-health-check__dot" style={{ background: "var(--danger-color, #e05252)" }} />
        <span className="widget-health-check__status">!</span>
        <span style={{ fontSize: '1rem', opacity: 0.55, fontVariantNumeric: 'tabular-nums' }}>{t(`widgetCard.error.${error === "cors" ? "cors" : "endpointNotFound"}`)}</span>
      </div>
    );
  }

  let dotColor = ok ? "#51cf66" : "#ff6b6b";
  if (config.thresholds?.length && httpCode !== null) {
    dotColor = resolveThresholdColor(httpCode, config.thresholds) ?? dotColor;
  }

  return (
    <div className="d-flex align-center gap-2 w-full h-full">
      <span className={`widget-health-check__dot${changed ? " widget-value--changed" : ""}`} style={{ background: dotColor }} />
      <span className="widget-health-check__status" style={{ color: dotColor }}>
        {ok ? t("widgetHealthCheck.ok") : t("widgetHealthCheck.ko")}
      </span>
      {httpCode !== null && (
        <span style={{ fontSize: '1rem', opacity: 0.55, fontVariantNumeric: 'tabular-nums' }}>{httpCode}</span>
      )}
    </div>
  );
}

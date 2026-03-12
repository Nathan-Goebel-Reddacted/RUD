import { useTranslation } from "react-i18next";
import type { HealthCheckConfig, WidgetDataState } from "@/types/widget";
import { resolveThresholdColor } from "@/types/widget";

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

  if (loading && httpCode === null) {
    return <div className="widget-health-check widget-health-check--loading">…</div>;
  }

  if (error === "endpoint_not_found" || error === "cors") {
    return (
      <div className="widget-health-check widget-health-check--error">
        <span className="widget-health-check__dot" style={{ background: "var(--danger-color, #e05252)" }} />
        <span className="widget-health-check__status">!</span>
        <span className="widget-health-check__code">{t(`widgetCard.error.${error === "cors" ? "cors" : "endpointNotFound"}`)}</span>
      </div>
    );
  }

  const ok = isOk(httpCode, config.okCodes);

  // RUD040: threshold color overrides default ok/ko color
  let dotColor = ok ? "#51cf66" : "#ff6b6b";
  if (config.thresholds?.length && httpCode !== null) {
    dotColor = resolveThresholdColor(httpCode, config.thresholds) ?? dotColor;
  }

  return (
    <div className="widget-health-check">
      <span className="widget-health-check__dot" style={{ background: dotColor }} />
      <span className="widget-health-check__status" style={{ color: dotColor }}>
        {ok ? t("widgetHealthCheck.ok") : t("widgetHealthCheck.ko")}
      </span>
      {httpCode !== null && (
        <span className="widget-health-check__code">{httpCode}</span>
      )}
    </div>
  );
}

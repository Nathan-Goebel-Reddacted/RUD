import { useTranslation } from "react-i18next";
import { Pencil, Trash2 } from "lucide-react";
import type { Widget, WidgetDataState } from "@/types/widget";
import WidgetSkeleton from "./WidgetSkeleton";
import NumberCard from "./types/NumberCard";
import Table from "./types/Table";
import BarChart from "./types/BarChart";
import LineChart from "./types/LineChart";
import TextWidget from "./types/TextWidget";
import RawResponse from "./types/RawResponse";

type Props = {
  widget:    Widget;
  dataState: WidgetDataState;
  onEdit?:   (widget: Widget) => void;
  onDelete?: (id: string) => void;
  readonly?: boolean;
};

function ErrorMessage({ error }: { error: string }) {
  const { t } = useTranslation();
  const messages: Record<string, string> = {
    endpoint_not_found: t("widgetCard.error.endpointNotFound"),
    cors:               t("widgetCard.error.cors"),
    http_error:         t("widgetCard.error.httpError"),
    parse_error:        t("widgetCard.error.parseError"),
    no_data:            t("widgetCard.error.noData"),
    invalid_path:       t("widgetCard.error.invalidPath"),
  };
  return (
    <div className="widget-card__error">
      <span className="widget-card__error-icon">⚠</span>
      <span>{messages[error] ?? error}</span>
    </div>
  );
}

function WidgetBody({ widget, dataState }: { widget: Widget; dataState: WidgetDataState }) {
  // Text is static — render before data checks (no fetch needed)
  if (widget.config.type === "text") {
    return <TextWidget config={widget.config} />;
  }

  if (dataState.loading && dataState.data === null) return <WidgetSkeleton />;
  if (dataState.error) return <ErrorMessage error={dataState.error} />;

  switch (widget.config.type) {
    case "number-card":   return <NumberCard   data={dataState.data} config={widget.config} />;
    case "table":         return <Table        data={dataState.data} config={widget.config} />;
    case "bar-chart":     return <BarChart     data={dataState.data} config={widget.config} />;
    case "line-chart":    return <LineChart    data={dataState.data} config={widget.config} />;
    case "raw-response":  return <RawResponse  data={dataState.data} />;
  }
}

export default function WidgetCard({ widget, dataState, onEdit, onDelete, readonly }: Props) {
  const { t } = useTranslation();

  return (
    <div className="widget-card">
      {/* Edit/delete overlay — appears on hover, full top strip */}
      {!readonly && (onEdit || onDelete) && (
        <div className="widget-card__overlay">
          <span className="widget-card__overlay-label">{widget.label}</span>
          <div className="widget-card__overlay-actions">
            {onEdit && (
              <button
                className="widget-card__overlay-btn"
                title={t("widgetCard.editWidget")}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => onEdit(widget)}
              >
                <Pencil size={17} strokeWidth={2} />
              </button>
            )}
            {onDelete && (
              <button
                className="widget-card__overlay-btn widget-card__overlay-btn--danger"
                title={t("widgetCard.deleteWidget")}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => onDelete(widget.id)}
              >
                <Trash2 size={17} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Readonly label (display mode) */}
      {readonly && widget.label && (
        <div className="widget-card__header">
          <span className="widget-card__label">{widget.label}</span>
        </div>
      )}

      <div className="widget-card__body">
        <WidgetBody widget={widget} dataState={dataState} />
      </div>
    </div>
  );
}

import type { Widget, WidgetDataState } from "@/types/widget";
import WidgetSkeleton from "./WidgetSkeleton";
import NumberCard from "./types/NumberCard";
import Table from "./types/Table";
import BarChart from "./types/BarChart";
import LineChart from "./types/LineChart";

type Props = {
  widget:   Widget;
  dataState: WidgetDataState;
  onEdit?:  (widget: Widget) => void;
  onDelete?:(id: string) => void;
  readonly?: boolean;
};

function ErrorMessage({ error }: { error: string }) {
  const messages: Record<string, string> = {
    endpoint_not_found: "Endpoint not found — check API config",
    cors:               "CORS error — the API blocked the request",
    http_error:         "HTTP error — the server returned an error",
    parse_error:        "Parse error — the response is not valid JSON",
    no_data:            "No data matched the data path",
    invalid_path:       "Invalid JSONPath expression",
  };
  return (
    <div className="widget-card__error">
      <span className="widget-card__error-icon">⚠</span>
      <span>{messages[error] ?? error}</span>
    </div>
  );
}

function WidgetBody({ widget, dataState }: { widget: Widget; dataState: WidgetDataState }) {
  if (dataState.loading && dataState.data === null) return <WidgetSkeleton />;
  if (dataState.error) return <ErrorMessage error={dataState.error} />;

  const { config } = widget;
  switch (config.type) {
    case "number-card":
      return <NumberCard data={dataState.data} config={config} />;
    case "table":
      return <Table data={dataState.data} config={config} />;
    case "bar-chart":
      return <BarChart data={dataState.data} config={config} />;
    case "line-chart":
      return <LineChart data={dataState.data} config={config} />;
  }
}

export default function WidgetCard({ widget, dataState, onEdit, onDelete, readonly }: Props) {
  return (
    <div className="widget-card">
      <div className="widget-card__header">
        <span className="widget-card__label">{widget.label}</span>
        {!readonly && (
          <div className="widget-card__actions">
            {onEdit && (
              <button
                className="widget-card__action-btn"
                title="Edit widget"
                onClick={() => onEdit(widget)}
              >
                ✎
              </button>
            )}
            {onDelete && (
              <button
                className="widget-card__action-btn widget-card__action-btn--danger"
                title="Delete widget"
                onClick={() => onDelete(widget.id)}
              >
                ✕
              </button>
            )}
          </div>
        )}
      </div>
      <div className="widget-card__body">
        <WidgetBody widget={widget} dataState={dataState} />
      </div>
    </div>
  );
}

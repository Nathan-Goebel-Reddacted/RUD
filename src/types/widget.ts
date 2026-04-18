export const WidgetType = {
  NUMBER_CARD:   "number-card",
  TABLE:         "table",
  BAR_CHART:     "bar-chart",
  LINE_CHART:    "line-chart",
  TEXT:          "text",
  RAW_RESPONSE:  "raw-response",
  CLOCK:         "clock",
  LAST_UPDATE:   "last-update",
  HEALTH_CHECK:  "health-check",
  GAUGE:         "gauge",
  STAT:          "stat",
  PROGRESS:      "progress",
  PIE_CHART:     "pie-chart",
  FORM:          "form",
  BUTTON:        "button",
  TOGGLE:        "toggle",
  SLIDER:        "slider",
  SELECT:        "select",
  SEARCH:        "search",
} as const;
export type WidgetType = typeof WidgetType[keyof typeof WidgetType];

export type WidgetPosition = { x: number; y: number; w: number; h: number };
export type Threshold = {
  value: number;
  color: string;
};

function resolveThresholdColor(value: number, thresholds: Threshold[]): string | undefined {
  if (thresholds.length === 0) return undefined;
  const sorted = [...thresholds].sort((a, b) => a.value - b.value);
  let color: string | undefined;
  for (const t of sorted) {
    if (value >= t.value) color = t.color;
  }
  return color;
}
export { resolveThresholdColor };

export type NumberCardConfig = {
  type:           "number-card";
  unit?:          string;
  decimalPlaces?: number;
  thresholds?:    Threshold[];
  keepHistory?:   boolean;
  maxPoints?:     number;
};
export type TableConfig = {
  type:        "table";
  columns:     Array<{ key: string; label: string; width?: number }>;
  maxRows?:    number;
  showHeader?: boolean;
};
export type BarChartConfig = {
  type:         "bar-chart";
  xKey:         string;
  yKey:         string;
  xLabel?:      string;
  yLabel?:      string;
  color?:       string;
  aggregation?: "count";
  thresholds?:  Threshold[];
};
export type LineChartConfig = {
  type:          "line-chart";
  xKey:          string;
  yKeys:         string[];
  xLabel?:       string;
  yLabel?:       string;
  colors?:       string[];
  aggregation?:  "count";
  keepHistory?:  boolean;
  maxPoints?:    number;
};
export type TextConfig = {
  type:      "text";
  content:   string;
  fontSize?: number;
};
export type RawResponseConfig = {
  type: "raw-response";
};
export type ClockConfig = {
  type:   "clock";
  format: "24h" | "12h";
};
export type LastUpdateConfig = {
  type:          "last-update";
  displayFormat: "relative" | "absolute";
};
export type HealthCheckConfig = {
  type:        "health-check";
  okCodes?:    number[];
  thresholds?: Threshold[];
};

export type GaugeConfig = {
  type:           "gauge";
  min?:           number;
  max?:           number;
  unit?:          string;
  decimalPlaces?: number;
  thresholds?:    Threshold[];
  color?:         string;
};

export type PieChartConfig = {
  type:         "pie-chart";
  labelKey:     string;
  valueKey:     string;
  colors?:      string[];
  aggregation?: "count";
  showLabels?:  boolean;
};

export type ProgressConfig = {
  type:           "progress";
  min?:           number;
  max?:           number;
  unit?:          string;
  decimalPlaces?: number;
  showPercent?:   boolean;
  color?:         string;
  thresholds?:    Threshold[];
};

export type StatConfig = {
  type:           "stat";
  unit?:          string;
  decimalPlaces?: number;
  deltaFormat?:   "absolute" | "percent";
  positiveColor?: string;
  negativeColor?: string;
  thresholds?:    Threshold[];
};

export type SliderConfig = {
  type:               "slider";
  readConnectionId?:  string;
  readEndpointId?:    string;
  readDataPath?:      string;
  writeConnectionId:  string;
  writeEndpointId:    string;
  writeKey:           string;
  min?:               number;
  max?:               number;
  step?:              number;
  unit?:              string;
};

export type SelectOptionConfig = {
  label: string;
  value: string;
};

export type SearchConfig = {
  type:         "search";
  connectionId: string;
  endpointId:   string;
  queryParam:   string;
  dataPath?:    string;
  columns?:     Array<{ key: string; label: string; width?: number }>;
  placeholder?: string;
  minChars?:    number;
};

export type SelectConfig = {
  type:                   "select";
  // Options source
  optionsSource:          "static" | "dynamic";
  staticOptions?:         SelectOptionConfig[];
  // Dynamic options (GET)
  optionsConnectionId?:   string;
  optionsEndpointId?:     string;
  optionsDataPath?:       string;
  optionsLabelKey?:       string;
  optionsValueKey?:       string;
  readConnectionId?:      string;
  readEndpointId?:        string;
  readDataPath?:          string;
  writeConnectionId:      string;
  writeEndpointId:        string;
  writeKey:               string;
};

export type ToggleConfig = {
  type:              "toggle";
  readConnectionId:  string;
  readEndpointId:    string;
  readDataPath:      string;
  writeConnectionId: string;
  writeEndpointId:   string;
  writeKey:          string;
  labelOn?:          string;
  labelOff?:         string;
};

export type ButtonItemConfig = {
  label:             string;
  connectionId:      string;
  endpointId:        string;
  variant?:          "primary" | "danger" | "ghost";
  responseDataPath?: string;
};

export type ButtonConfig = {
  type:    "button";
  buttons: ButtonItemConfig[];
  layout?: "horizontal" | "vertical";
};

export type FormFieldConfig = {
  key:           string;
  label:         string;
  type:          "text" | "number" | "textarea";
  defaultValue?: string;
  required?:     boolean;
};

export type FormConfig = {
  type:              "form";
  fields:            FormFieldConfig[];
  submitLabel?:      string;
  responseDataPath?: string;
};

export type WidgetConfig =
  | NumberCardConfig
  | TableConfig
  | BarChartConfig
  | LineChartConfig
  | TextConfig
  | RawResponseConfig
  | ClockConfig
  | LastUpdateConfig
  | HealthCheckConfig
  | GaugeConfig
  | StatConfig
  | ProgressConfig
  | PieChartConfig
  | FormConfig
  | ButtonConfig
  | ToggleConfig
  | SliderConfig
  | SelectConfig
  | SearchConfig;

export type Widget = {
  id:               string;
  label:            string;
  connectionId:     string;
  endpointId:       string;
  dataPath:         string;
  position:         WidgetPosition;
  config:           WidgetConfig;
  refreshOverride?: number;
  transform?:       string;
  alertEnabled?:    boolean;
  alertCooldown?:   number;
};

export type AlertEvent = {
  widgetId:    string;
  widgetLabel: string;
  value:       number;
  color:       string;
};

export type Dashboard = {
  id:              string;
  title:           string;
  widgets:         Widget[];
  refreshInterval: number;
  showInDisplay:   boolean;
};

export type WidgetDataError =
  | "endpoint_not_found"
  | "cors"
  | "http_error"
  | "parse_error"
  | "no_data"
  | "invalid_path"
  | "transform_error";

export type WidgetDataState = {
  data:      unknown;
  loading:   boolean;
  error:     WidgetDataError | null;
  httpCode:  number | null;
  fetchedAt: number | null;
};

export type FetchCacheEntry = {
  data:      unknown;
  fetchedAt: number;
  error:     string | null;
  loading:   boolean;
  httpCode:  number | null;
};

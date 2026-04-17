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

// ─── Thresholds (RUD040) ───────────────────────────────────────────────────
// Sorted ascending by value. The highest threshold whose value ≤ current wins.
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

// ─── Widget configs ────────────────────────────────────────────────────────
export type NumberCardConfig = {
  type:           "number-card";
  unit?:          string;
  decimalPlaces?: number;
  thresholds?:    Threshold[];
  keepHistory?:   boolean;
  maxPoints?:     number; // default 50
};
export type TableConfig = {
  type:        "table";
  columns:     Array<{ key: string; label: string; width?: number }>;
  maxRows?:    number;
  showHeader?: boolean; // default true
};
export type BarChartConfig = {
  type:         "bar-chart";
  xKey:         string;
  yKey:         string;
  xLabel?:      string;
  yLabel?:      string;
  color?:       string;
  aggregation?: "count"; // group by xKey and count rows
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
  maxPoints?:    number; // default 50
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
  okCodes?:    number[]; // empty = any 2xx
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
  deltaFormat?:   "absolute" | "percent"; // default "absolute"
  positiveColor?: string; // default "#4caf50"
  negativeColor?: string; // default "#f44336"
  thresholds?:    Threshold[];
};

export type SliderConfig = {
  type:               "slider";
  // Read current value (GET, optional)
  readConnectionId?:  string;
  readEndpointId?:    string;
  readDataPath?:      string;
  // Write value (PUT/PATCH)
  writeConnectionId:  string;
  writeEndpointId:    string;
  writeKey:           string;  // body: { [writeKey]: number }
  // Range
  min?:               number;  // default 0
  max?:               number;  // default 100
  step?:              number;  // default 1
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
  queryParam:   string;    // query param name sent on each keystroke, e.g. "q"
  dataPath?:    string;    // JSONPath to extract the results array
  columns?:     Array<{ key: string; label: string; width?: number }>;
  placeholder?: string;
  minChars?:    number;    // minimum chars before triggering search, default 1
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
  optionsLabelKey?:       string;  // key for label in each item
  optionsValueKey?:       string;  // key for value in each item
  // Read current value (GET, optional)
  readConnectionId?:      string;
  readEndpointId?:        string;
  readDataPath?:          string;
  // Write selected value
  writeConnectionId:      string;
  writeEndpointId:        string;
  writeKey:               string;
};

export type ToggleConfig = {
  type:              "toggle";
  // Read state (GET)
  readConnectionId:  string;
  readEndpointId:    string;
  readDataPath:      string;  // JSONPath to extract the boolean value
  // Write state (PUT/PATCH)
  writeConnectionId: string;
  writeEndpointId:   string;
  writeKey:          string;  // body: { [writeKey]: true | false }
  // Display
  labelOn?:          string;  // default "ON"
  labelOff?:         string;  // default "OFF"
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
  layout?: "horizontal" | "vertical"; // default "horizontal"
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
  submitLabel?:      string;  // default: "Send"
  responseDataPath?: string;  // JSONPath to extract message from response
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
  transform?:       string; // JS expression applied after JSONPath extraction
  alertEnabled?:    boolean;
  alertCooldown?:   number; // seconds, default 60
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

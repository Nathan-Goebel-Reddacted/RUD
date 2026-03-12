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

export type WidgetConfig =
  | NumberCardConfig
  | TableConfig
  | BarChartConfig
  | LineChartConfig
  | TextConfig
  | RawResponseConfig
  | ClockConfig
  | LastUpdateConfig
  | HealthCheckConfig;

export type Widget = {
  id:              string;
  label:           string;
  connectionId:    string;
  endpointId:      string;
  dataPath:        string;
  position:        WidgetPosition;
  config:          WidgetConfig;
  refreshOverride?: number;
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
  | "invalid_path";

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

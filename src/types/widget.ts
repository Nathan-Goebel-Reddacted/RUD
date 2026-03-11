export const WidgetType = {
  NUMBER_CARD:  "number-card",
  TABLE:        "table",
  BAR_CHART:    "bar-chart",
  LINE_CHART:   "line-chart",
  TEXT:         "text",
  RAW_RESPONSE: "raw-response",
} as const;
export type WidgetType = typeof WidgetType[keyof typeof WidgetType];

export type WidgetPosition = { x: number; y: number; w: number; h: number };

export type NumberCardConfig = {
  type:          "number-card";
  unit?:         string;
  decimalPlaces?: number;
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
};
export type LineChartConfig = {
  type:    "line-chart";
  xKey:    string;
  yKeys:   string[];
  xLabel?: string;
  yLabel?: string;
  colors?: string[];
};
export type TextConfig = {
  type:      "text";
  content:   string;
  fontSize?: number;
};
export type RawResponseConfig = {
  type: "raw-response";
};
export type WidgetConfig =
  | NumberCardConfig
  | TableConfig
  | BarChartConfig
  | LineChartConfig
  | TextConfig
  | RawResponseConfig;

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
};

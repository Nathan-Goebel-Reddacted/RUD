import type { WidgetConfig, WidgetType } from "@/types/widget";

export type RegistryEntry = {
  type:          WidgetType;
  labelKey:      string;
  descKey:       string;
  defaultConfig: () => WidgetConfig;
};

const _REGISTRY_MAP = {
  "number-card":  { labelKey: "widgetDrawer.types.numberCard",  descKey: "widgetDrawer.desc.numberCard",  defaultConfig: (): WidgetConfig => ({ type: "number-card" }) },
  "table":        { labelKey: "widgetDrawer.types.table",       descKey: "widgetDrawer.desc.table",       defaultConfig: (): WidgetConfig => ({ type: "table", columns: [] }) },
  "bar-chart":    { labelKey: "widgetDrawer.types.barChart",    descKey: "widgetDrawer.desc.barChart",    defaultConfig: (): WidgetConfig => ({ type: "bar-chart", xKey: "", yKey: "" }) },
  "line-chart":   { labelKey: "widgetDrawer.types.lineChart",   descKey: "widgetDrawer.desc.lineChart",   defaultConfig: (): WidgetConfig => ({ type: "line-chart", xKey: "", yKeys: [] }) },
  "text":         { labelKey: "widgetDrawer.types.text",        descKey: "widgetDrawer.desc.text",        defaultConfig: (): WidgetConfig => ({ type: "text", content: "" }) },
  "raw-response": { labelKey: "widgetDrawer.types.rawResponse", descKey: "widgetDrawer.desc.rawResponse", defaultConfig: (): WidgetConfig => ({ type: "raw-response" }) },
  "clock":        { labelKey: "widgetDrawer.types.clock",       descKey: "widgetDrawer.desc.clock",       defaultConfig: (): WidgetConfig => ({ type: "clock", format: "24h" }) },
  "last-update":  { labelKey: "widgetDrawer.types.lastUpdate",  descKey: "widgetDrawer.desc.lastUpdate",  defaultConfig: (): WidgetConfig => ({ type: "last-update", displayFormat: "relative" }) },
  "health-check": { labelKey: "widgetDrawer.types.healthCheck", descKey: "widgetDrawer.desc.healthCheck", defaultConfig: (): WidgetConfig => ({ type: "health-check" }) },
  "gauge":        { labelKey: "widgetDrawer.types.gauge",       descKey: "widgetDrawer.desc.gauge",       defaultConfig: (): WidgetConfig => ({ type: "gauge", min: 0, max: 100 }) },
  "stat":         { labelKey: "widgetDrawer.types.stat",        descKey: "widgetDrawer.desc.stat",        defaultConfig: (): WidgetConfig => ({ type: "stat", deltaFormat: "absolute" }) },
  "progress":     { labelKey: "widgetDrawer.types.progress",    descKey: "widgetDrawer.desc.progress",    defaultConfig: (): WidgetConfig => ({ type: "progress", min: 0, max: 100 }) },
  "pie-chart":    { labelKey: "widgetDrawer.types.pieChart",    descKey: "widgetDrawer.desc.pieChart",    defaultConfig: (): WidgetConfig => ({ type: "pie-chart", labelKey: "", valueKey: "" }) },
  "form":         { labelKey: "widgetDrawer.types.form",        descKey: "widgetDrawer.desc.form",        defaultConfig: (): WidgetConfig => ({ type: "form", fields: [] }) },
  "button":       { labelKey: "widgetDrawer.types.button",      descKey: "widgetDrawer.desc.button",      defaultConfig: (): WidgetConfig => ({ type: "button", buttons: [], layout: "horizontal" }) },
  "toggle":       { labelKey: "widgetDrawer.types.toggle",      descKey: "widgetDrawer.desc.toggle",      defaultConfig: (): WidgetConfig => ({ type: "toggle", readConnectionId: "", readEndpointId: "", readDataPath: "", writeConnectionId: "", writeEndpointId: "", writeKey: "" }) },
  "slider":       { labelKey: "widgetDrawer.types.slider",      descKey: "widgetDrawer.desc.slider",      defaultConfig: (): WidgetConfig => ({ type: "slider", writeConnectionId: "", writeEndpointId: "", writeKey: "", min: 0, max: 100, step: 1 }) },
  "select":       { labelKey: "widgetDrawer.types.select",      descKey: "widgetDrawer.desc.select",      defaultConfig: (): WidgetConfig => ({ type: "select", optionsSource: "static", staticOptions: [], writeConnectionId: "", writeEndpointId: "", writeKey: "" }) },
  "search":       { labelKey: "widgetDrawer.types.search",      descKey: "widgetDrawer.desc.search",      defaultConfig: (): WidgetConfig => ({ type: "search", connectionId: "", endpointId: "", queryParam: "q" }) },
} satisfies Record<WidgetType, Omit<RegistryEntry, "type">>;

export const WIDGET_REGISTRY: RegistryEntry[] =
  (Object.keys(_REGISTRY_MAP) as WidgetType[]).map((type) => ({
    type,
    ..._REGISTRY_MAP[type],
  }));

export function getRegistryEntry(type: WidgetType): RegistryEntry {
  const entry = WIDGET_REGISTRY.find((e) => e.type === type);
  if (!entry) throw new Error(`[widgetRegistry] Missing entry for type: ${type}`);
  return entry;
}

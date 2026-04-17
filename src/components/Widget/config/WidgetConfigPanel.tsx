import { useState, useEffect, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useApiStore } from "@/stores/apiStore";
import { fetchWidgetData, extractData, applyTransform } from "@/services/widgetFetch";
import {
  WidgetType,
  type Widget,
  type WidgetConfig,
  type NumberCardConfig,
  type TableConfig,
  type BarChartConfig,
  type LineChartConfig,
  type TextConfig,
  type ClockConfig,
  type LastUpdateConfig,
  type HealthCheckConfig,
  type GaugeConfig,
  type PieChartConfig,
  type ProgressConfig,
  type StatConfig,
  type FormConfig,
  type FormFieldConfig,
  type ButtonConfig,
  type ButtonItemConfig,
  type ToggleConfig,
  type SliderConfig,
  type SelectConfig,
  type SelectOptionConfig,
  type SearchConfig,
  type Threshold,
} from "@/types/widget";
import EndpointSelector from "./EndpointSelector";
import DataPathInput from "./DataPathInput";
import AxisKeySelector from "./AxisKeySelector";
import ColorPicker from "@/components/tool/ColorPicker";

type Props = {
  initial?:      Widget;
  initialType?:  WidgetType;
  onSave:        (widget: Omit<Widget, "id" | "position"> & { id?: string }) => void;
  onCancel:      () => void;
};

function defaultConfig(type: WidgetType): WidgetConfig {
  switch (type) {
    case "number-card":  return { type: "number-card" };
    case "table":        return { type: "table", columns: [] };
    case "bar-chart":    return { type: "bar-chart", xKey: "", yKey: "" };
    case "line-chart":   return { type: "line-chart", xKey: "", yKeys: [] };
    case "text":         return { type: "text", content: "" };
    case "raw-response": return { type: "raw-response" };
    case "clock":        return { type: "clock", format: "24h" };
    case "last-update":  return { type: "last-update", displayFormat: "relative" };
    case "health-check": return { type: "health-check" };
    case "gauge":        return { type: "gauge", min: 0, max: 100 };
    case "stat":         return { type: "stat", deltaFormat: "absolute" };
    case "progress":     return { type: "progress", min: 0, max: 100 };
    case "pie-chart":    return { type: "pie-chart", labelKey: "", valueKey: "" };
    case "form":         return { type: "form", fields: [] };
    case "button":       return { type: "button", buttons: [], layout: "horizontal" };
    case "toggle":       return { type: "toggle", readConnectionId: "", readEndpointId: "", readDataPath: "", writeConnectionId: "", writeEndpointId: "", writeKey: "" };
    case "slider":       return { type: "slider", writeConnectionId: "", writeEndpointId: "", writeKey: "", min: 0, max: 100, step: 1 };
    case "select":       return { type: "select", optionsSource: "static", staticOptions: [], writeConnectionId: "", writeEndpointId: "", writeKey: "" };
    case "search":       return { type: "search", connectionId: "", endpointId: "", queryParam: "q" };
  }
}

function extractKeys(data: unknown): string[] {
  if (Array.isArray(data) && data.length > 0) {
    const first = data[0];
    if (typeof first === "object" && first !== null) {
      return Object.keys(first as object);
    }
  }
  if (typeof data === "object" && data !== null) {
    return Object.keys(data as object);
  }
  return [];
}

const TYPE_LABELS: Record<WidgetType, string> = {
  "number-card":  "widgetDrawer.types.numberCard",
  "table":        "widgetDrawer.types.table",
  "bar-chart":    "widgetDrawer.types.barChart",
  "line-chart":   "widgetDrawer.types.lineChart",
  "text":         "widgetDrawer.types.text",
  "raw-response": "widgetDrawer.types.rawResponse",
  "clock":        "widgetDrawer.types.clock",
  "last-update":  "widgetDrawer.types.lastUpdate",
  "health-check": "widgetDrawer.types.healthCheck",
  "gauge":        "widgetDrawer.types.gauge",
  "stat":         "widgetDrawer.types.stat",
  "progress":     "widgetDrawer.types.progress",
  "pie-chart":    "widgetDrawer.types.pieChart",
  "form":         "widgetDrawer.types.form",
  "button":       "widgetDrawer.types.button",
  "toggle":       "widgetDrawer.types.toggle",
  "slider":       "widgetDrawer.types.slider",
  "select":       "widgetDrawer.types.select",
  "search":       "widgetDrawer.types.search",
};

export default function WidgetConfigPanel({ initial, initialType, onSave, onCancel }: Props) {
  const { t } = useTranslation();
  const connections = useApiStore((state) => state.connections);

  const [label,        setLabel]        = useState(initial?.label ?? "");
  const [connectionId, setConnectionId] = useState(initial?.connectionId ?? "");
  const [endpointId,   setEndpointId]   = useState(initial?.endpointId ?? "");
  const [dataPath,     setDataPath]     = useState(initial?.dataPath ?? "");
  const [type,         setType]         = useState<WidgetType>(
    (initial?.config.type as WidgetType) ?? initialType ?? WidgetType.NUMBER_CARD
  );
  const [config,       setConfig]       = useState<WidgetConfig>(
    initial?.config ?? defaultConfig(initialType ?? WidgetType.NUMBER_CARD)
  );
  const [refreshOverride, setRefreshOverride] = useState<number | undefined>(initial?.refreshOverride);
  const [transform,      setTransform]      = useState<string>(initial?.transform ?? "");
  const [alertEnabled,   setAlertEnabled]   = useState<boolean>(initial?.alertEnabled ?? false);
  const [alertCooldown,  setAlertCooldown]  = useState<number>(initial?.alertCooldown ?? 60);
  const [rawPreview,   setRawPreview]   = useState<unknown>(null);
  const [dataKeys,     setDataKeys]     = useState<string[]>([]);
  const [fetching,     setFetching]     = useState(false);
  const fetchControllerRef = useRef<AbortController | null>(null);

  const isStatic       = type === "text" || type === "clock";
  const isForm         = type === "form";
  // Types that manage their own endpoint selection internally
  const SELF_MANAGED: WidgetType[] = ["button", "toggle", "slider", "select", "search"];
  const isSelfManaged  = SELF_MANAGED.includes(type);
  const needsDataPath  = !isStatic && !isForm && !isSelfManaged && type !== "health-check" && type !== "last-update";
  const isValid        = isStatic || isSelfManaged || (!!connectionId && !!endpointId);

  function handleTypeChange(newType: WidgetType) {
    setType(newType);
    setConfig(defaultConfig(newType));
  }

  async function fetchPreview() {
    const conn = connections.find((c) => c.getId() === connectionId);
    const ep   = conn?.getEndpoints().find((e) => e.getId() === endpointId);
    if (!conn || !ep) return;
    fetchControllerRef.current?.abort();
    const controller = new AbortController();
    fetchControllerRef.current = controller;
    setFetching(true);
    try {
      const result = await fetchWidgetData(conn, ep, "", controller.signal);
      if (controller.signal.aborted) return;
      if (result.raw !== null) {
        setRawPreview(result.raw);
        const { value } = extractData(result.raw, dataPath);
        setDataKeys(extractKeys(value ?? result.raw));
      }
    } finally {
      if (!controller.signal.aborted) setFetching(false);
    }
  }

  useEffect(() => {
    setDataKeys([]);
    setRawPreview(null);
  }, [connectionId, endpointId]);

  function updateDataKeys(raw: unknown, path: string) {
    const { value } = extractData(raw, path);
    setDataKeys(extractKeys(value ?? raw));
  }

  function handleDataPathChange(path: string) {
    setDataPath(path);
    if (rawPreview !== null) updateDataKeys(rawPreview, path);
  }

  const ALERT_TYPES: WidgetType[] = ["number-card", "bar-chart", "health-check", "gauge", "stat", "progress"];
  const supportsAlerts = ALERT_TYPES.includes(type);

  function handleSave() {
    if (!isValid) return;
    onSave({
      id:           initial?.id,
      label:        label.trim(),
      connectionId: isStatic ? "" : connectionId,
      endpointId:   isStatic ? "" : endpointId,
      dataPath:     needsDataPath ? dataPath : "",
      config,
      refreshOverride:  isStatic || isForm || isSelfManaged ? undefined : refreshOverride,
      transform:        isStatic || isForm || isSelfManaged ? undefined : transform.trim() || undefined,
      alertEnabled:     supportsAlerts ? alertEnabled : undefined,
      alertCooldown:    supportsAlerts && alertEnabled ? alertCooldown : undefined,
    });
  }

  // ─── Transform preview (RUD052) ────────────────────────────────────────────
  const transformPreview = useMemo(() => {
    if (!transform.trim() || rawPreview === null) return null;
    const { value } = extractData(rawPreview, dataPath);
    const result = applyTransform(value, transform);
    if (result.error) return { error: true, display: t("widgetConfig.transformError") };
    return { error: false, display: JSON.stringify(result.value) };
  }, [transform, rawPreview, dataPath]);

  // ─── Threshold editor (RUD040) ─────────────────────────────────────────────
  function renderThresholds(thresholds: Threshold[], onChange: (t: Threshold[]) => void) {
    return (
      <div className="form-group">
        <div className="d-flex justify-between align-center">
          <label className="form-label">{t("widgetConfig.thresholds")}</label>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => onChange([...thresholds, { value: 0, color: "#ff6b6b" }])}
          >
            {t("widgetConfig.addThreshold")}
          </button>
        </div>
        {thresholds.length === 0 && (
          <span className="form-hint">{t("widgetConfig.thresholdsHint")}</span>
        )}
        {thresholds.map((th, i) => (
          <div key={i} className="d-flex align-center gap-2" style={{ marginBottom: '0.35rem' }}>
            <input
              type="number"
              className="form-input flex-1"
              placeholder={t("widgetConfig.thresholdValue")}
              value={th.value}
              onChange={(e) => {
                const copy = [...thresholds];
                copy[i] = { ...th, value: Number(e.target.value) };
                onChange(copy);
              }}
            />
            <ColorPicker
              className="threshold-row__color"
              value={th.color}
              onChange={(v) => {
                const copy = [...thresholds];
                copy[i] = { ...th, color: v };
                onChange(copy);
              }}
            />
            <button
              type="button"
              className="endpoint-form__row-remove"
              onClick={() => onChange(thresholds.filter((_, j) => j !== i))}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    );
  }

  // ─── History config (RUD041) ───────────────────────────────────────────────
  function renderHistoryConfig(keepHistory: boolean, maxPoints: number, onChange: (kh: boolean, mp: number) => void) {
    return (
      <div className="form-group">
        <label className="d-flex align-center gap-2" style={{ cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={keepHistory}
            onChange={(e) => onChange(e.target.checked, maxPoints)}
          />
          <span style={{ marginLeft: "0.4rem" }}>{t("widgetConfig.keepHistory")}</span>
        </label>
        {keepHistory && (
          <input
            className="form-input"
            type="number"
            min={2}
            max={500}
            value={maxPoints}
            placeholder="50"
            onChange={(e) => onChange(keepHistory, Number(e.target.value) || 50)}
          />
        )}
        {keepHistory && (
          <span className="form-hint">{t("widgetConfig.keepHistoryHint")}</span>
        )}
      </div>
    );
  }

  // ─── Per-type config fields ────────────────────────────────────────────────
  function renderConfigFields() {
    // Shared helper: connection + endpoint selector pair (used by toggle, slider, select)
    const connEpSelector = (
      label: string,
      connId: string, epId: string,
      onConnChange: (cId: string) => void,
      onEpChange: (eId: string) => void,
    ) => {
      const selConn = connections.find((cc) => cc.getId() === connId);
      const eps     = selConn?.getEndpoints() ?? [];
      return (
        <div className="form-group">
          <label className="form-label">{label}</label>
          <div className="d-flex gap-2">
            <select
              className="form-select flex-1"
              value={connId}
              onChange={(e) => onConnChange(e.target.value)}
            >
              <option value="">{t("widgetConfig.button.selectConnection")}</option>
              {connections.map((cc) => (
                <option key={cc.getId()} value={cc.getId()}>{cc.getLabel()}</option>
              ))}
            </select>
            <select
              className="form-select flex-1"
              value={epId}
              onChange={(e) => onEpChange(e.target.value)}
              disabled={!selConn}
            >
              <option value="">{t("widgetConfig.button.selectEndpoint")}</option>
              {eps.map((ep) => (
                <option key={ep.getId()} value={ep.getId()}>{ep.getLabel() || ep.getPath()}</option>
              ))}
            </select>
          </div>
        </div>
      );
    };

    switch (type) {
      case "number-card": {
        const c = config as NumberCardConfig;
        return (
          <>
            <div className="form-group">
              <label className="form-label">{t("widgetConfig.unit")}</label>
              <input
                className="form-input"
                type="text"
                placeholder={t("widgetConfig.unitPlaceholder")}
                value={c.unit ?? ""}
                onChange={(e) => setConfig({ ...c, unit: e.target.value || undefined })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t("widgetConfig.decimals")}</label>
              <input
                className="form-input"
                type="number"
                min={0}
                max={10}
                value={c.decimalPlaces ?? ""}
                placeholder={t("widgetConfig.autoPlaceholder")}
                onChange={(e) => setConfig({
                  ...c,
                  decimalPlaces: e.target.value ? Number(e.target.value) : undefined,
                })}
              />
            </div>
            {renderThresholds(c.thresholds ?? [], (th) => setConfig({ ...c, thresholds: th }))}
            {renderHistoryConfig(
              c.keepHistory ?? false,
              c.maxPoints ?? 50,
              (kh, mp) => setConfig({ ...c, keepHistory: kh, maxPoints: mp }),
            )}
          </>
        );
      }
      case "table": {
        const c = config as TableConfig;
        const allKeys = Array.from(new Set([
          ...dataKeys,
          ...c.columns.map((col) => col.key),
        ]));
        const selectedKeys = new Set(c.columns.map((col) => col.key));

        function toggleColumn(key: string, checked: boolean) {
          if (checked) {
            setConfig({ ...c, columns: [...c.columns, { key, label: key }] });
          } else {
            setConfig({ ...c, columns: c.columns.filter((col) => col.key !== key) });
          }
        }
        function updateColumnLabel(key: string, newLabel: string) {
          setConfig({
            ...c,
            columns: c.columns.map((col) => col.key === key ? { ...col, label: newLabel } : col),
          });
        }

        return (
          <>
            <div className="form-group">
              <label className="form-label">{t("widgetConfig.maxRows")}</label>
              <input
                className="form-input"
                type="number"
                min={1}
                value={c.maxRows ?? ""}
                placeholder={t("widgetConfig.allPlaceholder")}
                onChange={(e) => setConfig({
                  ...c,
                  maxRows: e.target.value ? Number(e.target.value) : undefined,
                })}
              />
            </div>
            <div className="form-group">
              <label className="d-flex align-center gap-2" style={{ cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={c.showHeader !== false}
                  onChange={(e) => setConfig({ ...c, showHeader: e.target.checked })}
                />
                <span style={{ marginLeft: "0.4rem" }}>{t("widgetConfig.showHeaders")}</span>
              </label>
            </div>
            <div className="form-group">
              <label className="form-label">
                {t("widgetConfig.visibleColumns")}
                {c.columns.length === 0 && <span className="form-hint">{t("widgetConfig.allAuto")}</span>}
              </label>
              {allKeys.length === 0 ? (
                <span className="form-hint">{t("widgetConfig.fetchColumnsHint")}</span>
              ) : (
                <div className="d-flex flex-col gap-1">
                  {allKeys.map((key) => {
                    const col = c.columns.find((col) => col.key === key);
                    return (
                      <div key={key} className="d-flex align-center gap-2">
                        <input
                          type="checkbox"
                          id={`col-${key}`}
                          checked={selectedKeys.has(key)}
                          onChange={(e) => toggleColumn(key, e.target.checked)}
                        />
                        <label htmlFor={`col-${key}`} className="font-mono" style={{ fontSize: '0.82rem', minWidth: '80px', opacity: 0.85, cursor: 'pointer' }}>{key}</label>
                        {selectedKeys.has(key) && (
                          <input
                            className="form-input flex-1"
                            type="text"
                            placeholder={key}
                            value={col?.label ?? key}
                            onChange={(e) => updateColumnLabel(key, e.target.value)}
                          />
                        )}
                      </div>
                    );
                  })}
                  {c.columns.length > 0 && (
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => setConfig({ ...c, columns: [] })}
                    >
                      {t("widgetConfig.clearColumns")}
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        );
      }
      case "bar-chart": {
        const c = config as BarChartConfig;
        return (
          <>
            <AxisKeySelector
              label={t("widgetConfig.xAxis")}
              value={c.xKey}
              keys={dataKeys}
              onChange={(k) => setConfig({ ...c, xKey: k })}
            />
            <div className="form-group">
              <label className="d-flex align-center gap-2" style={{ cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={c.aggregation === "count"}
                  onChange={(e) => setConfig({
                    ...c,
                    aggregation: e.target.checked ? "count" : undefined,
                  })}
                />
                <span style={{ marginLeft: "0.4rem" }}>
                  {t("widgetConfig.countRows")}
                </span>
              </label>
              <span className="form-hint">
                {t("widgetConfig.countRowsHint")}
              </span>
            </div>
            {c.aggregation !== "count" && (
              <AxisKeySelector
                label={t("widgetConfig.yAxis")}
                value={c.yKey}
                keys={dataKeys}
                onChange={(k) => setConfig({ ...c, yKey: k })}
              />
            )}
            <div className="form-group">
              <label className="form-label">{t("widgetConfig.barColor")}</label>
              <ColorPicker
                value={c.color ?? "#4a9eff"}
                onChange={(v) => setConfig({ ...c, color: v })}
              />
            </div>
            {renderThresholds(c.thresholds ?? [], (th) => setConfig({ ...c, thresholds: th }))}
          </>
        );
      }
      case "line-chart": {
        const c = config as LineChartConfig;
        return (
          <>
            {!c.keepHistory && (
              <AxisKeySelector
                label={t("widgetConfig.xAxis")}
                value={c.xKey}
                keys={dataKeys}
                onChange={(k) => setConfig({ ...c, xKey: k })}
              />
            )}
            <div className="form-group">
              <label className="d-flex align-center gap-2" style={{ cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={c.aggregation === "count"}
                  onChange={(e) => setConfig({
                    ...c,
                    aggregation: e.target.checked ? "count" : undefined,
                  })}
                />
                <span style={{ marginLeft: "0.4rem" }}>
                  {t("widgetConfig.countRows")}
                </span>
              </label>
              <span className="form-hint">{t("widgetConfig.countRowsHint")}</span>
            </div>
            {c.aggregation !== "count" && (
              <div className="form-group">
                <label className="form-label">{t("widgetConfig.yKeys")}</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder={t("widgetConfig.yKeysPlaceholder")}
                  value={c.yKeys.join(", ")}
                  onChange={(e) => setConfig({
                    ...c,
                    yKeys: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  })}
                />
                {dataKeys.length > 0 && (
                  <span className="form-hint">
                    {t("widgetConfig.availableKeys", { keys: dataKeys.join(", ") })}
                  </span>
                )}
              </div>
            )}
            {renderHistoryConfig(
              c.keepHistory ?? false,
              c.maxPoints ?? 50,
              (kh, mp) => setConfig({ ...c, keepHistory: kh, maxPoints: mp }),
            )}
          </>
        );
      }
      case "text": {
        const c = config as TextConfig;
        return (
          <>
            <div className="form-group">
              <label className="form-label">{t("widgetConfig.textContent")}</label>
              <textarea
                className="form-input"
                rows={4}
                placeholder={t("widgetConfig.textPlaceholder")}
                value={c.content}
                onChange={(e) => setConfig({ ...c, content: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t("widgetConfig.fontSize")}</label>
              <input
                className="form-input"
                type="number"
                min={8}
                max={200}
                placeholder={t("widgetConfig.autoPlaceholder")}
                value={c.fontSize ?? ""}
                onChange={(e) => setConfig({
                  ...c,
                  fontSize: e.target.value ? Number(e.target.value) : undefined,
                })}
              />
            </div>
          </>
        );
      }
      case "raw-response": {
        return (
          <p className="form-hint">
            {t("widgetConfig.rawHint")}
          </p>
        );
      }
      case "clock": {
        const c = config as ClockConfig;
        return (
          <div className="form-group">
            <label className="form-label">{t("widgetConfig.clockFormat")}</label>
            <select
              className="form-select"
              value={c.format}
              onChange={(e) => setConfig({ ...c, format: e.target.value as ClockConfig["format"] })}
            >
              <option value="24h">{t("widgetConfig.clock24h")}</option>
              <option value="12h">{t("widgetConfig.clock12h")}</option>
            </select>
          </div>
        );
      }
      case "last-update": {
        const c = config as LastUpdateConfig;
        return (
          <div className="form-group">
            <label className="form-label">{t("widgetConfig.lastUpdateFormat")}</label>
            <select
              className="form-select"
              value={c.displayFormat}
              onChange={(e) => setConfig({ ...c, displayFormat: e.target.value as LastUpdateConfig["displayFormat"] })}
            >
              <option value="relative">{t("widgetConfig.lastUpdateRelative")}</option>
              <option value="absolute">{t("widgetConfig.lastUpdateAbsolute")}</option>
            </select>
          </div>
        );
      }
      case "health-check": {
        const c = config as HealthCheckConfig;
        const okCodesStr = (c.okCodes ?? []).join(", ");
        return (
          <>
            <div className="form-group">
              <label className="form-label">{t("widgetConfig.healthOkCodes")}</label>
              <input
                className="form-input"
                type="text"
                placeholder={t("widgetConfig.healthOkCodesPlaceholder")}
                value={okCodesStr}
                onChange={(e) => {
                  const codes = e.target.value
                    .split(",")
                    .map((s) => parseInt(s.trim(), 10))
                    .filter((n) => !isNaN(n));
                  setConfig({ ...c, okCodes: codes.length ? codes : undefined });
                }}
              />
              <span className="form-hint">{t("widgetConfig.healthOkCodesHint")}</span>
            </div>
            {renderThresholds(c.thresholds ?? [], (th) => setConfig({ ...c, thresholds: th }))}
          </>
        );
      }
      case "gauge": {
        const c = config as GaugeConfig;
        return (
          <>
            <div className="form-group">
              <label className="form-label">{t("widgetConfig.gaugeMin")}</label>
              <input
                className="form-input"
                type="number"
                value={c.min ?? 0}
                onChange={(e) => setConfig({ ...c, min: Number(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t("widgetConfig.gaugeMax")}</label>
              <input
                className="form-input"
                type="number"
                value={c.max ?? 100}
                onChange={(e) => setConfig({ ...c, max: Number(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t("widgetConfig.unit")}</label>
              <input
                className="form-input"
                type="text"
                placeholder={t("widgetConfig.unitPlaceholder")}
                value={c.unit ?? ""}
                onChange={(e) => setConfig({ ...c, unit: e.target.value || undefined })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t("widgetConfig.decimals")}</label>
              <input
                className="form-input"
                type="number"
                min={0}
                max={10}
                value={c.decimalPlaces ?? ""}
                placeholder={t("widgetConfig.autoPlaceholder")}
                onChange={(e) => setConfig({
                  ...c,
                  decimalPlaces: e.target.value ? Number(e.target.value) : undefined,
                })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t("widgetConfig.gaugeColor")}</label>
              <ColorPicker
                value={c.color ?? "#4a9eff"}
                onChange={(v) => setConfig({ ...c, color: v })}
              />
            </div>
            {renderThresholds(c.thresholds ?? [], (th) => setConfig({ ...c, thresholds: th }))}
          </>
        );
      }
      case "stat": {
        const c = config as StatConfig;
        return (
          <>
            <div className="form-group">
              <label className="form-label">{t("widgetConfig.unit")}</label>
              <input
                className="form-input"
                type="text"
                placeholder={t("widgetConfig.unitPlaceholder")}
                value={c.unit ?? ""}
                onChange={(e) => setConfig({ ...c, unit: e.target.value || undefined })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t("widgetConfig.decimals")}</label>
              <input
                className="form-input"
                type="number"
                min={0}
                max={10}
                value={c.decimalPlaces ?? ""}
                placeholder={t("widgetConfig.autoPlaceholder")}
                onChange={(e) => setConfig({
                  ...c,
                  decimalPlaces: e.target.value ? Number(e.target.value) : undefined,
                })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t("widgetConfig.statDeltaFormat")}</label>
              <select
                className="form-select"
                value={c.deltaFormat ?? "absolute"}
                onChange={(e) => setConfig({ ...c, deltaFormat: e.target.value as StatConfig["deltaFormat"] })}
              >
                <option value="absolute">{t("widgetConfig.statDeltaAbsolute")}</option>
                <option value="percent">{t("widgetConfig.statDeltaPercent")}</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t("widgetConfig.statPositiveColor")}</label>
              <ColorPicker
                value={c.positiveColor ?? "#4caf50"}
                onChange={(v) => setConfig({ ...c, positiveColor: v })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t("widgetConfig.statNegativeColor")}</label>
              <ColorPicker
                value={c.negativeColor ?? "#f44336"}
                onChange={(v) => setConfig({ ...c, negativeColor: v })}
              />
            </div>
            {renderThresholds(c.thresholds ?? [], (th) => setConfig({ ...c, thresholds: th }))}
          </>
        );
      }
      case "progress": {
        const c = config as ProgressConfig;
        return (
          <>
            <div className="form-group">
              <label className="form-label">{t("widgetConfig.gaugeMin")}</label>
              <input
                className="form-input"
                type="number"
                value={c.min ?? 0}
                onChange={(e) => setConfig({ ...c, min: Number(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t("widgetConfig.gaugeMax")}</label>
              <input
                className="form-input"
                type="number"
                value={c.max ?? 100}
                onChange={(e) => setConfig({ ...c, max: Number(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t("widgetConfig.unit")}</label>
              <input
                className="form-input"
                type="text"
                placeholder={t("widgetConfig.unitPlaceholder")}
                value={c.unit ?? ""}
                onChange={(e) => setConfig({ ...c, unit: e.target.value || undefined })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t("widgetConfig.decimals")}</label>
              <input
                className="form-input"
                type="number"
                min={0}
                max={10}
                value={c.decimalPlaces ?? ""}
                placeholder={t("widgetConfig.autoPlaceholder")}
                onChange={(e) => setConfig({
                  ...c,
                  decimalPlaces: e.target.value ? Number(e.target.value) : undefined,
                })}
              />
            </div>
            <div className="form-group">
              <label className="d-flex align-center gap-2" style={{ cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={c.showPercent !== false}
                  onChange={(e) => setConfig({ ...c, showPercent: e.target.checked })}
                />
                <span style={{ marginLeft: "0.4rem" }}>{t("widgetConfig.progressShowPercent")}</span>
              </label>
            </div>
            <div className="form-group">
              <label className="form-label">{t("widgetConfig.gaugeColor")}</label>
              <ColorPicker
                value={c.color ?? "#4a9eff"}
                onChange={(v) => setConfig({ ...c, color: v })}
              />
            </div>
            {renderThresholds(c.thresholds ?? [], (th) => setConfig({ ...c, thresholds: th }))}
          </>
        );
      }
      case "pie-chart": {
        const c = config as PieChartConfig;
        return (
          <>
            <div className="form-group">
              <label className="d-flex align-center gap-2" style={{ cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={c.aggregation === "count"}
                  onChange={(e) => setConfig({
                    ...c,
                    aggregation: e.target.checked ? "count" : undefined,
                  })}
                />
                <span style={{ marginLeft: "0.4rem" }}>{t("widgetConfig.countRows")}</span>
              </label>
              <span className="form-hint">{t("widgetConfig.countRowsHint")}</span>
            </div>
            <AxisKeySelector
              label={t("widgetConfig.pieLabelKey")}
              value={c.labelKey}
              keys={dataKeys}
              onChange={(k) => setConfig({ ...c, labelKey: k })}
            />
            {c.aggregation !== "count" && (
              <AxisKeySelector
                label={t("widgetConfig.pieValueKey")}
                value={c.valueKey}
                keys={dataKeys}
                onChange={(k) => setConfig({ ...c, valueKey: k })}
              />
            )}
            <div className="form-group">
              <label className="d-flex align-center gap-2" style={{ cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={c.showLabels !== false}
                  onChange={(e) => setConfig({ ...c, showLabels: e.target.checked })}
                />
                <span style={{ marginLeft: "0.4rem" }}>{t("widgetConfig.pieShowLabels")}</span>
              </label>
            </div>
          </>
        );
      }
      case "form": {
        const c = config as FormConfig;
        const updateField = (i: number, patch: Partial<FormFieldConfig>) => {
          const fields = c.fields.map((f, idx) => idx === i ? { ...f, ...patch } : f);
          setConfig({ ...c, fields });
        };
        const removeField = (i: number) => setConfig({ ...c, fields: c.fields.filter((_, idx) => idx !== i) });
        const addField    = () => setConfig({ ...c, fields: [...c.fields, { key: "", label: "", type: "text" }] });
        return (
          <>
            {/* Submit button label */}
            <div className="form-group">
              <label className="form-label">{t("widgetConfig.form.submitLabel")}</label>
              <input
                className="form-input"
                type="text"
                placeholder={t("widgetConfig.form.submitLabelPlaceholder")}
                value={c.submitLabel ?? ""}
                onChange={(e) => setConfig({ ...c, submitLabel: e.target.value || undefined })}
              />
            </div>

            {/* Fields */}
            <div className="form-group">
              <div className="d-flex justify-between align-center" style={{ marginBottom: "0.4rem" }}>
                <label className="form-label" style={{ margin: 0 }}>{t("widgetConfig.form.fields")}</label>
                <button type="button" className="btn btn--ghost btn--sm" onClick={addField}>
                  {t("widgetConfig.form.addField")}
                </button>
              </div>
              {c.fields.length === 0 && (
                <span className="form-hint">{t("widgetConfig.form.noFields")}</span>
              )}
              {c.fields.map((field, i) => (
                <div key={i} className="form-field-row" style={{ border: "1px solid var(--border-color)", borderRadius: 4, padding: "0.5rem", marginBottom: "0.4rem" }}>
                  <div className="d-flex gap-2" style={{ marginBottom: "0.3rem" }}>
                    <input
                      className="form-input flex-1"
                      type="text"
                      placeholder={t("widgetConfig.form.fieldKey")}
                      value={field.key}
                      onChange={(e) => updateField(i, { key: e.target.value })}
                    />
                    <input
                      className="form-input flex-1"
                      type="text"
                      placeholder={t("widgetConfig.form.fieldLabel")}
                      value={field.label}
                      onChange={(e) => updateField(i, { label: e.target.value })}
                    />
                    <button type="button" className="btn btn--ghost btn--sm" style={{ color: "var(--danger-color)" }} onClick={() => removeField(i)}>✕</button>
                  </div>
                  <div className="d-flex gap-2 align-center">
                    <select
                      className="form-select"
                      style={{ flex: 1 }}
                      value={field.type}
                      onChange={(e) => updateField(i, { type: e.target.value as FormFieldConfig["type"] })}
                    >
                      <option value="text">{t("widgetConfig.form.typeText")}</option>
                      <option value="number">{t("widgetConfig.form.typeNumber")}</option>
                      <option value="textarea">{t("widgetConfig.form.typeTextarea")}</option>
                    </select>
                    <input
                      className="form-input flex-1"
                      type="text"
                      placeholder={t("widgetConfig.form.fieldDefault")}
                      value={field.defaultValue ?? ""}
                      onChange={(e) => updateField(i, { defaultValue: e.target.value || undefined })}
                    />
                    <label className="d-flex align-center gap-1" style={{ cursor: "pointer", whiteSpace: "nowrap", fontSize: "0.8rem" }}>
                      <input
                        type="checkbox"
                        checked={field.required ?? false}
                        onChange={(e) => updateField(i, { required: e.target.checked })}
                      />
                      {t("widgetConfig.form.required")}
                    </label>
                  </div>
                </div>
              ))}
            </div>

            {/* Response data path */}
            <div className="form-group">
              <label className="form-label">{t("widgetConfig.form.responseDataPath")}</label>
              <input
                className="form-input"
                type="text"
                placeholder={t("widgetConfig.form.responseDataPathPlaceholder")}
                value={c.responseDataPath ?? ""}
                onChange={(e) => setConfig({ ...c, responseDataPath: e.target.value || undefined })}
              />
              <span className="form-hint">{t("widgetConfig.form.responseDataPathHint")}</span>
            </div>
          </>
        );
      }
      case "button": {
        const c = config as ButtonConfig;
        const updateBtn = (i: number, patch: Partial<ButtonItemConfig>) => {
          const buttons = c.buttons.map((b, idx) => idx === i ? { ...b, ...patch } : b);
          setConfig({ ...c, buttons });
        };
        const removeBtn = (i: number) => setConfig({ ...c, buttons: c.buttons.filter((_, idx) => idx !== i) });
        const addBtn    = () => setConfig({ ...c, buttons: [...c.buttons, { label: "", connectionId: "", endpointId: "", variant: "primary" }] });
        return (
          <>
            {/* Layout */}
            <div className="form-group">
              <label className="form-label">{t("widgetConfig.button.layout")}</label>
              <select
                className="form-select"
                value={c.layout ?? "horizontal"}
                onChange={(e) => setConfig({ ...c, layout: e.target.value as ButtonConfig["layout"] })}
              >
                <option value="horizontal">{t("widgetConfig.button.horizontal")}</option>
                <option value="vertical">{t("widgetConfig.button.vertical")}</option>
              </select>
            </div>

            {/* Buttons list */}
            <div className="form-group">
              <div className="d-flex justify-between align-center" style={{ marginBottom: "0.4rem" }}>
                <label className="form-label" style={{ margin: 0 }}>{t("widgetConfig.button.buttons")}</label>
                <button type="button" className="btn btn--ghost btn--sm" onClick={addBtn}>
                  {t("widgetConfig.button.addButton")}
                </button>
              </div>
              {c.buttons.length === 0 && (
                <span className="form-hint">{t("widgetConfig.button.noButtons")}</span>
              )}
              {c.buttons.map((btn, i) => {
                const btnConn = connections.find((cc) => cc.getId() === btn.connectionId);
                const btnEps  = btnConn?.getEndpoints() ?? [];
                return (
                  <div key={i} style={{ border: "1px solid var(--border-color)", borderRadius: 4, padding: "0.5rem", marginBottom: "0.4rem" }}>
                    <div className="d-flex gap-2 align-center" style={{ marginBottom: "0.3rem" }}>
                      <input
                        className="form-input flex-1"
                        type="text"
                        placeholder={t("widgetConfig.button.buttonLabel")}
                        value={btn.label}
                        onChange={(e) => updateBtn(i, { label: e.target.value })}
                      />
                      <select
                        className="form-select"
                        style={{ flex: "0 0 auto", width: "110px" }}
                        value={btn.variant ?? "primary"}
                        onChange={(e) => updateBtn(i, { variant: e.target.value as ButtonItemConfig["variant"] })}
                      >
                        <option value="primary">{t("widgetConfig.button.variantPrimary")}</option>
                        <option value="danger">{t("widgetConfig.button.variantDanger")}</option>
                        <option value="ghost">{t("widgetConfig.button.variantGhost")}</option>
                      </select>
                      <button type="button" className="btn btn--ghost btn--sm" style={{ color: "var(--danger-color)" }} onClick={() => removeBtn(i)}>✕</button>
                    </div>
                    <div className="d-flex gap-2" style={{ marginBottom: "0.3rem" }}>
                      <select
                        className="form-select flex-1"
                        value={btn.connectionId}
                        onChange={(e) => updateBtn(i, { connectionId: e.target.value, endpointId: "" })}
                      >
                        <option value="">{t("widgetConfig.button.selectConnection")}</option>
                        {connections.map((cc) => (
                          <option key={cc.getId()} value={cc.getId()}>{cc.getLabel()}</option>
                        ))}
                      </select>
                      <select
                        className="form-select flex-1"
                        value={btn.endpointId}
                        onChange={(e) => updateBtn(i, { endpointId: e.target.value })}
                        disabled={!btnConn}
                      >
                        <option value="">{t("widgetConfig.button.selectEndpoint")}</option>
                        {btnEps.map((ep) => (
                          <option key={ep.getId()} value={ep.getId()}>{ep.getLabel() || ep.getPath()}</option>
                        ))}
                      </select>
                    </div>
                    <input
                      className="form-input"
                      type="text"
                      placeholder={t("widgetConfig.button.responseDataPath")}
                      value={btn.responseDataPath ?? ""}
                      onChange={(e) => updateBtn(i, { responseDataPath: e.target.value || undefined })}
                    />
                  </div>
                );
              })}
            </div>
          </>
        );
      }
      case "toggle": {
        const c = config as ToggleConfig;
        return (
          <>
            {/* Read config */}
            {connEpSelector(
              t("widgetConfig.toggle.readEndpoint"),
              c.readConnectionId, c.readEndpointId,
              (cId) => setConfig({ ...c, readConnectionId: cId, readEndpointId: "" }),
              (eId) => setConfig({ ...c, readEndpointId: eId }),
            )}
            <div className="form-group">
              <label className="form-label">{t("widgetConfig.toggle.readDataPath")}</label>
              <input
                className="form-input font-mono"
                type="text"
                placeholder="$.enabled  or  $.status"
                value={c.readDataPath}
                onChange={(e) => setConfig({ ...c, readDataPath: e.target.value })}
              />
              <span className="form-hint">{t("widgetConfig.toggle.readDataPathHint")}</span>
            </div>

            {/* Write config */}
            {connEpSelector(
              t("widgetConfig.toggle.writeEndpoint"),
              c.writeConnectionId, c.writeEndpointId,
              (cId) => setConfig({ ...c, writeConnectionId: cId, writeEndpointId: "" }),
              (eId) => setConfig({ ...c, writeEndpointId: eId }),
            )}
            <div className="form-group">
              <label className="form-label">{t("widgetConfig.toggle.writeKey")}</label>
              <input
                className="form-input"
                type="text"
                placeholder={t("widgetConfig.toggle.writeKeyPlaceholder")}
                value={c.writeKey}
                onChange={(e) => setConfig({ ...c, writeKey: e.target.value })}
              />
              <span className="form-hint">{t("widgetConfig.toggle.writeKeyHint")}</span>
            </div>

            {/* Display labels */}
            <div className="d-flex gap-2">
              <div className="form-group flex-1">
                <label className="form-label">{t("widgetConfig.toggle.labelOn")}</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="ON"
                  value={c.labelOn ?? ""}
                  onChange={(e) => setConfig({ ...c, labelOn: e.target.value || undefined })}
                />
              </div>
              <div className="form-group flex-1">
                <label className="form-label">{t("widgetConfig.toggle.labelOff")}</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="OFF"
                  value={c.labelOff ?? ""}
                  onChange={(e) => setConfig({ ...c, labelOff: e.target.value || undefined })}
                />
              </div>
            </div>
          </>
        );
      }
      case "slider": {
        const c = config as SliderConfig;
        return (
          <>
            {/* Optional read */}
            {connEpSelector(
              t("widgetConfig.slider.readEndpoint"),
              c.readConnectionId ?? "", c.readEndpointId ?? "",
              (cId) => setConfig({ ...c, readConnectionId: cId, readEndpointId: "" }),
              (eId) => setConfig({ ...c, readEndpointId: eId }),
            )}
            <div className="form-group">
              <label className="form-label">{t("widgetConfig.slider.readDataPath")}</label>
              <input
                className="form-input font-mono"
                type="text"
                placeholder="$.value"
                value={c.readDataPath ?? ""}
                onChange={(e) => setConfig({ ...c, readDataPath: e.target.value })}
              />
              <span className="form-hint">{t("widgetConfig.slider.readDataPathHint")}</span>
            </div>

            {/* Write */}
            {connEpSelector(
              t("widgetConfig.slider.writeEndpoint"),
              c.writeConnectionId, c.writeEndpointId,
              (cId) => setConfig({ ...c, writeConnectionId: cId, writeEndpointId: "" }),
              (eId) => setConfig({ ...c, writeEndpointId: eId }),
            )}
            <div className="form-group">
              <label className="form-label">{t("widgetConfig.slider.writeKey")}</label>
              <input
                className="form-input"
                type="text"
                placeholder={t("widgetConfig.slider.writeKeyPlaceholder")}
                value={c.writeKey}
                onChange={(e) => setConfig({ ...c, writeKey: e.target.value })}
              />
              <span className="form-hint">{t("widgetConfig.slider.writeKeyHint")}</span>
            </div>

            {/* Range */}
            <div className="d-flex gap-2">
              <div className="form-group flex-1">
                <label className="form-label">{t("widgetConfig.slider.min")}</label>
                <input
                  className="form-input"
                  type="number"
                  value={c.min ?? 0}
                  onChange={(e) => setConfig({ ...c, min: Number(e.target.value) })}
                />
              </div>
              <div className="form-group flex-1">
                <label className="form-label">{t("widgetConfig.slider.max")}</label>
                <input
                  className="form-input"
                  type="number"
                  value={c.max ?? 100}
                  onChange={(e) => setConfig({ ...c, max: Number(e.target.value) })}
                />
              </div>
              <div className="form-group flex-1">
                <label className="form-label">{t("widgetConfig.slider.step")}</label>
                <input
                  className="form-input"
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={c.step ?? 1}
                  onChange={(e) => setConfig({ ...c, step: Number(e.target.value) })}
                />
              </div>
            </div>

            {/* Unit */}
            <div className="form-group">
              <label className="form-label">{t("widgetConfig.slider.unit")}</label>
              <input
                className="form-input"
                type="text"
                placeholder={t("widgetConfig.slider.unitPlaceholder")}
                value={c.unit ?? ""}
                onChange={(e) => setConfig({ ...c, unit: e.target.value || undefined })}
              />
            </div>
          </>
        );
      }
      case "select": {
        const c = config as SelectConfig;
        const updateOpt = (i: number, patch: Partial<SelectOptionConfig>) => {
          const opts = (c.staticOptions ?? []).map((o, idx) => idx === i ? { ...o, ...patch } : o);
          setConfig({ ...c, staticOptions: opts });
        };
        const removeOpt = (i: number) =>
          setConfig({ ...c, staticOptions: (c.staticOptions ?? []).filter((_, idx) => idx !== i) });
        const addOpt = () =>
          setConfig({ ...c, staticOptions: [...(c.staticOptions ?? []), { label: "", value: "" }] });
        return (
          <>
            {/* Options source */}
            <div className="form-group">
              <label className="form-label">{t("widgetConfig.select.optionsSource")}</label>
              <select
                className="form-select"
                value={c.optionsSource}
                onChange={(e) => setConfig({ ...c, optionsSource: e.target.value as SelectConfig["optionsSource"] })}
              >
                <option value="static">{t("widgetConfig.select.static")}</option>
                <option value="dynamic">{t("widgetConfig.select.dynamic")}</option>
              </select>
            </div>

            {/* Static options */}
            {c.optionsSource === "static" && (
              <div className="form-group">
                <div className="d-flex justify-between align-center" style={{ marginBottom: "0.4rem" }}>
                  <label className="form-label" style={{ margin: 0 }}>{t("widgetConfig.select.options")}</label>
                  <button type="button" className="btn btn--ghost btn--sm" onClick={addOpt}>
                    {t("widgetConfig.select.addOption")}
                  </button>
                </div>
                {(c.staticOptions ?? []).length === 0 && (
                  <span className="form-hint">{t("widgetConfig.select.noOptions")}</span>
                )}
                {(c.staticOptions ?? []).map((opt, i) => (
                  <div key={i} className="d-flex gap-2 align-center" style={{ marginBottom: "0.3rem" }}>
                    <input
                      className="form-input flex-1"
                      type="text"
                      placeholder={t("widgetConfig.select.optionLabel")}
                      value={opt.label}
                      onChange={(e) => updateOpt(i, { label: e.target.value })}
                    />
                    <input
                      className="form-input flex-1"
                      type="text"
                      placeholder={t("widgetConfig.select.optionValue")}
                      value={opt.value}
                      onChange={(e) => updateOpt(i, { value: e.target.value })}
                    />
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      style={{ color: "var(--danger-color)" }}
                      onClick={() => removeOpt(i)}
                    >✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* Dynamic options */}
            {c.optionsSource === "dynamic" && (
              <>
                {connEpSelector(
                  t("widgetConfig.select.optionsEndpoint"),
                  c.optionsConnectionId ?? "", c.optionsEndpointId ?? "",
                  (cId) => setConfig({ ...c, optionsConnectionId: cId, optionsEndpointId: "" }),
                  (eId) => setConfig({ ...c, optionsEndpointId: eId }),
                )}
                <div className="form-group">
                  <label className="form-label">{t("widgetConfig.select.optionsDataPath")}</label>
                  <input
                    className="form-input font-mono"
                    type="text"
                    placeholder="$.items"
                    value={c.optionsDataPath ?? ""}
                    onChange={(e) => setConfig({ ...c, optionsDataPath: e.target.value })}
                  />
                </div>
                <div className="d-flex gap-2">
                  <div className="form-group flex-1">
                    <label className="form-label">{t("widgetConfig.select.optionsLabelKey")}</label>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="name"
                      value={c.optionsLabelKey ?? ""}
                      onChange={(e) => setConfig({ ...c, optionsLabelKey: e.target.value })}
                    />
                  </div>
                  <div className="form-group flex-1">
                    <label className="form-label">{t("widgetConfig.select.optionsValueKey")}</label>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="id"
                      value={c.optionsValueKey ?? ""}
                      onChange={(e) => setConfig({ ...c, optionsValueKey: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Read current value (optional) */}
            {connEpSelector(
              t("widgetConfig.select.readEndpoint"),
              c.readConnectionId ?? "", c.readEndpointId ?? "",
              (cId) => setConfig({ ...c, readConnectionId: cId, readEndpointId: "" }),
              (eId) => setConfig({ ...c, readEndpointId: eId }),
            )}
            <div className="form-group">
              <label className="form-label">{t("widgetConfig.select.readDataPath")}</label>
              <input
                className="form-input font-mono"
                type="text"
                placeholder="$.value"
                value={c.readDataPath ?? ""}
                onChange={(e) => setConfig({ ...c, readDataPath: e.target.value })}
              />
              <span className="form-hint">{t("widgetConfig.select.readDataPathHint")}</span>
            </div>

            {/* Write */}
            {connEpSelector(
              t("widgetConfig.select.writeEndpoint"),
              c.writeConnectionId, c.writeEndpointId,
              (cId) => setConfig({ ...c, writeConnectionId: cId, writeEndpointId: "" }),
              (eId) => setConfig({ ...c, writeEndpointId: eId }),
            )}
            <div className="form-group">
              <label className="form-label">{t("widgetConfig.select.writeKey")}</label>
              <input
                className="form-input"
                type="text"
                placeholder={t("widgetConfig.select.writeKeyPlaceholder")}
                value={c.writeKey}
                onChange={(e) => setConfig({ ...c, writeKey: e.target.value })}
              />
              <span className="form-hint">{t("widgetConfig.select.writeKeyHint")}</span>
            </div>
          </>
        );
      }
      case "search": {
        const c = config as SearchConfig;
        return (
          <>
            {/* Endpoint */}
            {connEpSelector(
              t("widgetConfig.search.endpoint"),
              c.connectionId, c.endpointId,
              (cId) => setConfig({ ...c, connectionId: cId, endpointId: "" }),
              (eId) => setConfig({ ...c, endpointId: eId }),
            )}

            {/* Query param name */}
            <div className="form-group">
              <label className="form-label">{t("widgetConfig.search.queryParam")}</label>
              <input
                className="form-input"
                type="text"
                placeholder={t("widgetConfig.search.queryParamPlaceholder")}
                value={c.queryParam}
                onChange={(e) => setConfig({ ...c, queryParam: e.target.value })}
              />
              <span className="form-hint">{t("widgetConfig.search.queryParamHint")}</span>
            </div>

            {/* Data path */}
            <div className="form-group">
              <label className="form-label">{t("widgetConfig.search.dataPath")}</label>
              <input
                className="form-input font-mono"
                type="text"
                placeholder="$.results  or  $.items"
                value={c.dataPath ?? ""}
                onChange={(e) => setConfig({ ...c, dataPath: e.target.value })}
              />
              <span className="form-hint">{t("widgetConfig.search.dataPathHint")}</span>
            </div>

            {/* Placeholder */}
            <div className="form-group">
              <label className="form-label">{t("widgetConfig.search.placeholder")}</label>
              <input
                className="form-input"
                type="text"
                placeholder={t("widgetConfig.search.placeholderPlaceholder")}
                value={c.placeholder ?? ""}
                onChange={(e) => setConfig({ ...c, placeholder: e.target.value || undefined })}
              />
            </div>

            {/* Min chars */}
            <div className="form-group">
              <label className="form-label">{t("widgetConfig.search.minChars")}</label>
              <input
                className="form-input"
                type="number"
                min={1}
                value={c.minChars ?? 1}
                onChange={(e) => setConfig({ ...c, minChars: Math.max(1, Number(e.target.value)) })}
              />
              <span className="form-hint">{t("widgetConfig.search.minCharsHint")}</span>
            </div>
          </>
        );
      }
    }
  }

  return (
    <div className="d-flex flex-col" style={{ maxHeight: '85vh' }}>
      <div style={{ padding: '1rem 1.25rem 0.5rem', borderBottom: '1px solid var(--border-color)' }}>
        <h2 style={{ margin: 0, fontSize: '1rem' }}>{initial ? t("widgetConfig.titleEdit") : t("widgetConfig.titleAdd")}</h2>
      </div>

      <div className="flex-1 overflow-auto" style={{ padding: '1rem 1.25rem' }}>
        {/* Label */}
        <div className="form-group">
          <label className="form-label">{t("widgetConfig.labelField")}</label>
          <input
            className="form-input"
            type="text"
            placeholder={t("widgetConfig.labelPlaceholder")}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>

        {/* Widget type */}
        <div className="form-group">
          <label className="form-label">{t("widgetConfig.widgetType")}</label>
          <select
            className="form-select"
            value={type}
            onChange={(e) => handleTypeChange(e.target.value as WidgetType)}
          >
            {Object.values(WidgetType).map((v) => (
              <option key={v} value={v}>{t(TYPE_LABELS[v])}</option>
            ))}
          </select>
        </div>

        {/* Endpoint selector — hidden for static and self-managed widgets */}
        {!isStatic && !isSelfManaged && (
          <>
            <EndpointSelector
              connectionId={connectionId}
              endpointId={endpointId}
              onChange={(cId, eId) => { setConnectionId(cId); setEndpointId(eId); }}
            />

            {needsDataPath && connectionId && endpointId && (
              <button
                className="btn btn--secondary"
                onClick={fetchPreview}
                disabled={fetching}
              >
                {fetching ? t("widgetConfig.fetching") : t("widgetConfig.fetchPreview")}
              </button>
            )}

            {needsDataPath && (
              <DataPathInput
                value={dataPath}
                onChange={handleDataPathChange}
                preview={rawPreview}
              />
            )}

            {needsDataPath && (
              <div className="form-group">
                <label className="form-label">{t("widgetConfig.transform")}</label>
                <input
                  className="form-input font-mono"
                  type="text"
                  placeholder={t("widgetConfig.transformPlaceholder")}
                  value={transform}
                  onChange={(e) => setTransform(e.target.value)}
                />
                <span className="form-hint">{t("widgetConfig.transformHint")}</span>
                {transformPreview && (
                  <span
                    className="form-hint"
                    style={{ color: transformPreview.error ? "var(--danger-color)" : "var(--text-color)", opacity: 1 }}
                  >
                    → {transformPreview.display}
                  </span>
                )}
              </div>
            )}
          </>
        )}

        {/* Type-specific config */}
        {renderConfigFields()}

        {/* Fetch interval — hidden for static, form and self-managed widgets */}
        {!isStatic && !isForm && !isSelfManaged && (
          <div className="form-group">
            <label className="form-label">{t("widgetConfig.fetchInterval")}</label>
            <input
              className="form-input"
              type="number"
              min={1}
              placeholder={t("widgetConfig.fetchIntervalPlaceholder")}
              value={refreshOverride ?? ""}
              onChange={(e) =>
                setRefreshOverride(e.target.value ? Number(e.target.value) : undefined)
              }
            />
            <span className="form-hint">{t("widgetConfig.fetchIntervalHint")}</span>
          </div>
        )}

        {/* Alert config — only for widget types that support thresholds */}
        {supportsAlerts && (
          <>
            <div className="form-group" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "0.75rem", marginTop: "0.25rem" }}>
              <label className="d-flex align-center gap-2" style={{ cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={alertEnabled}
                  onChange={(e) => setAlertEnabled(e.target.checked)}
                />
                <span style={{ marginLeft: "0.4rem" }}>{t("widgetConfig.alertEnabled")}</span>
              </label>
              <span className="form-hint">{t("widgetConfig.alertEnabledHint")}</span>
            </div>
            {alertEnabled && (
              <div className="form-group">
                <label className="form-label">{t("widgetConfig.alertCooldown")}</label>
                <input
                  className="form-input"
                  type="number"
                  min={5}
                  value={alertCooldown}
                  onChange={(e) => setAlertCooldown(Math.max(5, Number(e.target.value)))}
                />
                <span className="form-hint">{t("widgetConfig.alertCooldownHint")}</span>
              </div>
            )}
          </>
        )}
      </div>

      <div className="d-flex justify-end gap-2" style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border-color)' }}>
        <button className="btn btn--secondary" onClick={onCancel}>{t("widgetConfig.cancel")}</button>
        <button className="btn btn--primary" onClick={handleSave} disabled={!isValid}>
          {initial ? t("widgetConfig.save") : t("widgetConfig.addWidget")}
        </button>
      </div>
    </div>
  );
}

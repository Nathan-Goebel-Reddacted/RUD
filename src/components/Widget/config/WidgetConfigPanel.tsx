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
  const [rawPreview,   setRawPreview]   = useState<unknown>(null);
  const [dataKeys,     setDataKeys]     = useState<string[]>([]);
  const [fetching,     setFetching]     = useState(false);
  const fetchControllerRef = useRef<AbortController | null>(null);

  const isStatic      = type === "text" || type === "clock";
  const needsDataPath = !isStatic && type !== "health-check" && type !== "last-update";
  const isValid       = isStatic || (!!connectionId && !!endpointId);

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

  function handleSave() {
    if (!isValid) return;
    onSave({
      id:           initial?.id,
      label:        label.trim(),
      connectionId: isStatic ? "" : connectionId,
      endpointId:   isStatic ? "" : endpointId,
      dataPath:     needsDataPath ? dataPath : "",
      config,
      refreshOverride: isStatic ? undefined : refreshOverride,
      transform:    transform.trim() || undefined,
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

        {/* Endpoint selector — hidden for static widgets */}
        {!isStatic && (
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

        {/* Fetch interval — hidden for static widgets */}
        {!isStatic && (
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

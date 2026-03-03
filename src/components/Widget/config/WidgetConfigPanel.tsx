import { useState, useEffect } from "react";
import { useApiStore } from "@/stores/apiStore";
import { fetchWidgetData } from "@/services/widgetFetch";
import { extractData } from "@/services/widgetFetch";
import {
  WidgetType,
  type Widget,
  type WidgetConfig,
  type NumberCardConfig,
  type TableConfig,
  type BarChartConfig,
  type LineChartConfig,
  type TextConfig,
} from "@/types/widget";
import EndpointSelector from "./EndpointSelector";
import DataPathInput from "./DataPathInput";
import AxisKeySelector from "./AxisKeySelector";

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

export default function WidgetConfigPanel({ initial, initialType, onSave, onCancel }: Props) {
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
  const [rawPreview,   setRawPreview]   = useState<unknown>(null);
  const [dataKeys,     setDataKeys]     = useState<string[]>([]);
  const [fetching,     setFetching]     = useState(false);

  // When type changes, reset config keeping connectionId/endpointId
  function handleTypeChange(newType: WidgetType) {
    setType(newType);
    setConfig(defaultConfig(newType));
  }

  // Fetch preview data to power AxisKeySelector and DataPathInput preview
  async function fetchPreview() {
    const conn = connections.find((c) => c.getId() === connectionId);
    const ep   = conn?.getEndpoints().find((e) => e.getId() === endpointId);
    if (!conn || !ep) return;
    setFetching(true);
    try {
      const result = await fetchWidgetData(conn, ep, ""); // fetch raw
      if (result.raw !== null) {
        setRawPreview(result.raw);
        const { value } = extractData(result.raw, dataPath);
        setDataKeys(extractKeys(value ?? result.raw));
      }
    } finally {
      setFetching(false);
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

  const isStatic = type === "text";
  const isValid  = isStatic || (!!connectionId && !!endpointId);

  function handleSave() {
    if (!isValid) return;
    onSave({
      id:           initial?.id,
      label:        label.trim(),
      connectionId: isStatic ? "" : connectionId,
      endpointId:   isStatic ? "" : endpointId,
      dataPath:     isStatic ? "" : dataPath,
      config,
      refreshOverride: isStatic ? undefined : refreshOverride,
    });
  }

  // Config-specific fields
  function renderConfigFields() {
    switch (type) {
      case "number-card": {
        const c = config as NumberCardConfig;
        return (
          <>
            <div className="form-group">
              <label className="form-label">Unit (optional)</label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. ms, %, users"
                value={c.unit ?? ""}
                onChange={(e) => setConfig({ ...c, unit: e.target.value || undefined })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Decimal places</label>
              <input
                className="form-input"
                type="number"
                min={0}
                max={10}
                value={c.decimalPlaces ?? ""}
                placeholder="auto"
                onChange={(e) => setConfig({
                  ...c,
                  decimalPlaces: e.target.value ? Number(e.target.value) : undefined,
                })}
              />
            </div>
          </>
        );
      }
      case "table": {
        const c = config as TableConfig;
        // Available keys = union of live data keys + existing column keys
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
              <label className="form-label">Max rows</label>
              <input
                className="form-input"
                type="number"
                min={1}
                value={c.maxRows ?? ""}
                placeholder="all"
                onChange={(e) => setConfig({
                  ...c,
                  maxRows: e.target.value ? Number(e.target.value) : undefined,
                })}
              />
            </div>
            <div className="form-group">
              <label className="column-selector__row" style={{ cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={c.showHeader !== false}
                  onChange={(e) => setConfig({ ...c, showHeader: e.target.checked })}
                />
                <span style={{ marginLeft: "0.4rem" }}>Show column headers</span>
              </label>
            </div>
            <div className="form-group">
              <label className="form-label">
                Visible columns
                {c.columns.length === 0 && <span className="form-hint"> — all (auto)</span>}
              </label>
              {allKeys.length === 0 ? (
                <span className="form-hint">Fetch data preview to see available columns.</span>
              ) : (
                <div className="column-selector">
                  {allKeys.map((key) => {
                    const col = c.columns.find((col) => col.key === key);
                    return (
                      <div key={key} className="column-selector__row">
                        <input
                          type="checkbox"
                          id={`col-${key}`}
                          checked={selectedKeys.has(key)}
                          onChange={(e) => toggleColumn(key, e.target.checked)}
                        />
                        <label htmlFor={`col-${key}`} className="column-selector__key">{key}</label>
                        {selectedKeys.has(key) && (
                          <input
                            className="form-input column-selector__label"
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
                      Clear — show all columns
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
              label="X axis key"
              value={c.xKey}
              keys={dataKeys}
              onChange={(k) => setConfig({ ...c, xKey: k })}
            />
            <div className="form-group">
              <label className="column-selector__row" style={{ cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={c.aggregation === "count"}
                  onChange={(e) => setConfig({
                    ...c,
                    aggregation: e.target.checked ? "count" : undefined,
                  })}
                />
                <span style={{ marginLeft: "0.4rem" }}>
                  Count rows by X key (group & count)
                </span>
              </label>
              <span className="form-hint">
                Groups data by the X key and counts occurrences — no Y key needed.
              </span>
            </div>
            {c.aggregation !== "count" && (
              <AxisKeySelector
                label="Y axis key (value)"
                value={c.yKey}
                keys={dataKeys}
                onChange={(k) => setConfig({ ...c, yKey: k })}
              />
            )}
            <div className="form-group">
              <label className="form-label">Bar color (optional)</label>
              <input
                className="form-input"
                type="color"
                value={c.color ?? "#4a9eff"}
                onChange={(e) => setConfig({ ...c, color: e.target.value })}
              />
            </div>
          </>
        );
      }
      case "line-chart": {
        const c = config as LineChartConfig;
        return (
          <>
            <AxisKeySelector
              label="X axis key"
              value={c.xKey}
              keys={dataKeys}
              onChange={(k) => setConfig({ ...c, xKey: k })}
            />
            <div className="form-group">
              <label className="form-label">Y keys (values) — comma-separated</label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. value, count"
                value={c.yKeys.join(", ")}
                onChange={(e) => setConfig({
                  ...c,
                  yKeys: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                })}
              />
              {dataKeys.length > 0 && (
                <span className="form-hint">
                  Available keys: {dataKeys.join(", ")}
                </span>
              )}
            </div>
          </>
        );
      }
      case "text": {
        const c = config as TextConfig;
        return (
          <>
            <div className="form-group">
              <label className="form-label">Text content *</label>
              <textarea
                className="form-input"
                rows={4}
                placeholder="Enter text to display…"
                value={c.content}
                onChange={(e) => setConfig({ ...c, content: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Font size (px, optional)</label>
              <input
                className="form-input"
                type="number"
                min={8}
                max={200}
                placeholder="auto"
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
            Displays the full JSON response. No additional configuration needed.
          </p>
        );
      }
    }
  }

  return (
    <div className="widget-config-panel">
      <div className="widget-config-panel__header">
        <h2>{initial ? "Edit Widget" : "Add Widget"}</h2>
      </div>

      <div className="widget-config-panel__body">
        {/* Label */}
        <div className="form-group">
          <label className="form-label">Widget label</label>
          <input
            className="form-input"
            type="text"
            placeholder="e.g. Total Users"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>

        {/* Endpoint selector — hidden for static widgets */}
        {!isStatic && (
          <>
            <EndpointSelector
              connectionId={connectionId}
              endpointId={endpointId}
              onChange={(cId, eId) => { setConnectionId(cId); setEndpointId(eId); }}
            />

            {connectionId && endpointId && (
              <button
                className="btn btn--secondary"
                onClick={fetchPreview}
                disabled={fetching}
              >
                {fetching ? "Fetching…" : "Fetch data preview"}
              </button>
            )}

            <DataPathInput
              value={dataPath}
              onChange={handleDataPathChange}
              preview={rawPreview}
            />
          </>
        )}

        {/* Widget type */}
        <div className="form-group">
          <label className="form-label">Widget type *</label>
          <select
            className="form-select"
            value={type}
            onChange={(e) => handleTypeChange(e.target.value as WidgetType)}
          >
            {Object.entries(WidgetType).map(([, v]) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>

        {/* Type-specific config */}
        {renderConfigFields()}

        {/* Fetch interval — hidden for static widgets */}
        {!isStatic && (
          <div className="form-group">
            <label className="form-label">Fetch interval (seconds)</label>
            <input
              className="form-input"
              type="number"
              min={1}
              placeholder="default (30 s)"
              value={refreshOverride ?? ""}
              onChange={(e) =>
                setRefreshOverride(e.target.value ? Number(e.target.value) : undefined)
              }
            />
            <span className="form-hint">Leave empty to use the global default (30 s).</span>
          </div>
        )}
      </div>

      <div className="widget-config-panel__footer">
        <button className="btn btn--secondary" onClick={onCancel}>Cancel</button>
        <button className="btn btn--primary" onClick={handleSave} disabled={!isValid}>
          {initial ? "Save" : "Add widget"}
        </button>
      </div>
    </div>
  );
}

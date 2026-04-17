import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { Widget, SliderConfig } from "@/types/widget";
import { useApiStore } from "@/stores/apiStore";
import { useProfileStore } from "@/stores/profileStore";
import { fetchWidgetData } from "@/services/widgetFetch";
import { sendFormEndpoint } from "@/services/apiFetch";

const DEBOUNCE_MS = 300;

type Props = { widget: Widget };

export default function SliderWidget({ widget }: Props) {
  const { t }       = useTranslation();
  const config      = widget.config as SliderConfig;
  const connections = useApiStore((s) => s.connections);
  const vars        = useProfileStore((s) => s.profile?.getVariables() ?? {});

  const min  = config.min  ?? 0;
  const max  = config.max  ?? 100;
  const step = config.step ?? 1;

  const readConn  = connections.find((c) => c.getId() === config.readConnectionId)  ?? null;
  const readEp    = readConn?.getEndpoints().find((e) => e.getId() === config.readEndpointId) ?? null;
  const writeConn = connections.find((c) => c.getId() === config.writeConnectionId) ?? null;
  const writeEp   = writeConn?.getEndpoints().find((e) => e.getId() === config.writeEndpointId) ?? null;

  const [value,    setValue]    = useState<number>(min);
  const [loading,  setLoading]  = useState<boolean>(false);
  const [writing,  setWriting]  = useState<boolean>(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Read initial value from API
  useEffect(() => {
    if (!readConn || !readEp) return;
    setLoading(true);
    fetchWidgetData(readConn, readEp, config.readDataPath ?? "", undefined, vars).then((result) => {
      if (result.data !== null && result.data !== undefined) {
        const num = Number(result.data);
        if (!isNaN(num)) setValue(Math.min(max, Math.max(min, num)));
      }
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.readConnectionId, config.readEndpointId, config.readDataPath]);

  const sendWrite = async (newValue: number) => {
    if (!writeConn || !writeEp || !config.writeKey) return;
    setWriting(true);
    await sendFormEndpoint(writeConn, writeEp, { [config.writeKey]: newValue }, vars);
    setWriting(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    setValue(newValue);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => sendWrite(newValue), DEBOUNCE_MS);
  };

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const isDisabled = loading || !writeConn || !writeEp || !config.writeKey;
  const displayVal = Number.isInteger(step) ? value.toFixed(0) : String(value);

  return (
    <div className="widget-slider">
      <div className="widget-slider__header">
        <span className={`widget-slider__value${writing ? " widget-slider__value--writing" : ""}`}>
          {loading ? "…" : displayVal}
        </span>
        {config.unit && (
          <span className="widget-slider__unit">{config.unit}</span>
        )}
      </div>
      <input
        className="widget-slider__range"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={isDisabled}
        onChange={handleChange}
      />
      <div className="widget-slider__bounds">
        <span>{min}{config.unit ?? ""}</span>
        <span>{max}{config.unit ?? ""}</span>
      </div>
      {(!writeConn || !writeEp || !config.writeKey) && (
        <span style={{ fontSize: "0.75rem", opacity: 0.5 }}>
          {t("widgetSlider.noWriteEndpoint")}
        </span>
      )}
    </div>
  );
}

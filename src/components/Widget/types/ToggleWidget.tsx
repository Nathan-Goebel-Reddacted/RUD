import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { Widget, ToggleConfig } from "@/types/widget";
import { useApiStore } from "@/stores/apiStore";
import { useProfileStore } from "@/stores/profileStore";
import { fetchWidgetData } from "@/services/widgetFetch";
import { sendFormEndpoint } from "@/services/apiFetch";

type ToggleStatus = "loading" | "ready" | "error" | "writing";

function toBoolean(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number")  return v !== 0;
  if (typeof v === "string")  return v.toLowerCase() === "true" || v === "1";
  return false;
}

type Props = { widget: Widget };

export default function ToggleWidget({ widget }: Props) {
  const { t }       = useTranslation();
  const config      = widget.config as ToggleConfig;
  const connections = useApiStore((s) => s.connections);
  const vars        = useProfileStore((s) => s.profile?.getVariables() ?? {});

  const readConn  = connections.find((c) => c.getId() === config.readConnectionId)  ?? null;
  const readEp    = readConn?.getEndpoints().find((e) => e.getId() === config.readEndpointId) ?? null;
  const writeConn = connections.find((c) => c.getId() === config.writeConnectionId) ?? null;
  const writeEp   = writeConn?.getEndpoints().find((e) => e.getId() === config.writeEndpointId) ?? null;

  const [status, setStatus] = useState<ToggleStatus>("loading");
  const [value,  setValue]  = useState<boolean>(false);
  const [writeError, setWriteError] = useState<boolean>(false);
  const writeErrorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setStatus("loading");
    if (!readConn || !readEp) {
      setStatus("error");
      return;
    }
    fetchWidgetData(readConn, readEp, config.readDataPath, undefined, vars).then((result) => {
      if (result.error && result.error !== "no_data") {
        setStatus("error");
        return;
      }
      setValue(toBoolean(result.data));
      setStatus("ready");
    });

    return () => { if (writeErrorTimerRef.current) clearTimeout(writeErrorTimerRef.current); };
  }, [config.readConnectionId, config.readEndpointId, config.readDataPath]);

  const handleToggle = async () => {
    if (status !== "ready" || !writeConn || !writeEp || !config.writeKey) return;

    const newValue = !value;
    setValue(newValue);
    setStatus("writing");
    setWriteError(false);

    const result = await sendFormEndpoint(
      writeConn, writeEp,
      { [config.writeKey]: newValue },
      vars
    );

    if (result.status !== "ok") {
      setValue(!newValue);
      setWriteError(true);
      if (writeErrorTimerRef.current) clearTimeout(writeErrorTimerRef.current);
      writeErrorTimerRef.current = setTimeout(() => setWriteError(false), 2500);
    }
    setStatus("ready");
  };

  const labelOn  = config.labelOn  || t("widgetToggle.on");
  const labelOff = config.labelOff || t("widgetToggle.off");

  if (status === "error") {
    return (
      <div className="d-flex align-center gap-2" style={{ opacity: 0.6 }}>
        <span className="widget-card__error-icon">⚠</span>
        <span style={{ fontSize: "0.85rem" }}>{t("widgetCard.error.endpointNotFound")}</span>
      </div>
    );
  }

  const isLoading  = status === "loading";
  const isWriting  = status === "writing";
  const isDisabled = isLoading || isWriting || !writeConn || !writeEp || !config.writeKey;

  return (
    <div className="widget-toggle">
      <button
        className={`widget-toggle__track${value ? " widget-toggle__track--on" : ""}${isDisabled ? " widget-toggle__track--disabled" : ""}`}
        role="switch"
        aria-checked={value}
        disabled={isDisabled}
        onClick={handleToggle}
      >
        <span className="widget-toggle__thumb" />
      </button>

      <span className={`widget-toggle__label${value ? " widget-toggle__label--on" : ""}`}>
        {isLoading  ? "…"
         : isWriting ? "…"
         : value     ? labelOn
         : labelOff}
      </span>

      {writeError && (
        <span className="widget-toggle__error">{t("widgetToggle.writeError")}</span>
      )}
    </div>
  );
}

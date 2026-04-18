import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { Widget, SelectConfig, SelectOptionConfig } from "@/types/widget";
import { useApiStore } from "@/stores/apiStore";
import { useProfileStore } from "@/stores/profileStore";
import { fetchWidgetData } from "@/services/widgetFetch";
import { sendFormEndpoint } from "@/services/apiFetch";

type Props = { widget: Widget };

export default function SelectWidget({ widget }: Props) {
  const { t }       = useTranslation();
  const config      = widget.config as SelectConfig;
  const connections = useApiStore((s) => s.connections);
  const vars        = useProfileStore((s) => s.profile?.getVariables() ?? {});

  const optConn  = connections.find((c) => c.getId() === config.optionsConnectionId) ?? null;
  const optEp    = optConn?.getEndpoints().find((e) => e.getId() === config.optionsEndpointId) ?? null;
  const readConn = connections.find((c) => c.getId() === config.readConnectionId)    ?? null;
  const readEp   = readConn?.getEndpoints().find((e) => e.getId() === config.readEndpointId) ?? null;
  const writeConn = connections.find((c) => c.getId() === config.writeConnectionId)  ?? null;
  const writeEp   = writeConn?.getEndpoints().find((e) => e.getId() === config.writeEndpointId) ?? null;

  const [options,  setOptions]  = useState<SelectOptionConfig[]>(config.staticOptions ?? []);
  const [selected, setSelected] = useState<string>("");
  const [loading,  setLoading]  = useState<boolean>(false);
  const [writing,  setWriting]  = useState<boolean>(false);

  useEffect(() => {
    if (config.optionsSource === "static") {
      setOptions(config.staticOptions ?? []);
      return;
    }
    if (!optConn || !optEp) return;
    fetchWidgetData(optConn, optEp, config.optionsDataPath ?? "", undefined, vars).then((result) => {
      const raw = result.data;
      if (!Array.isArray(raw)) return;
      const labelKey = config.optionsLabelKey ?? "label";
      const valueKey = config.optionsValueKey ?? "value";
      const opts: SelectOptionConfig[] = raw.map((item) => {
        if (typeof item === "object" && item !== null) {
          const obj = item as Record<string, unknown>;
          return { label: String(obj[labelKey] ?? ""), value: String(obj[valueKey] ?? "") };
        }
        return { label: String(item), value: String(item) };
      });
      setOptions(opts);
    });
  }, [config.optionsSource, config.optionsConnectionId, config.optionsEndpointId, config.optionsDataPath]);

  useEffect(() => {
    if (!readConn || !readEp) return;
    setLoading(true);
    fetchWidgetData(readConn, readEp, config.readDataPath ?? "", undefined, vars).then((result) => {
      if (result.data !== null && result.data !== undefined) {
        setSelected(String(result.data));
      }
      setLoading(false);
    });
  }, [config.readConnectionId, config.readEndpointId, config.readDataPath]);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    setSelected(newValue);
    if (!writeConn || !writeEp || !config.writeKey) return;
    setWriting(true);
    await sendFormEndpoint(writeConn, writeEp, { [config.writeKey]: newValue }, vars);
    setWriting(false);
  };

  const isDisabled = loading || writing || !writeConn || !writeEp || !config.writeKey;

  return (
    <div className="widget-select">
      <select
        className={`widget-select__input${writing ? " widget-select__input--writing" : ""}`}
        value={selected}
        disabled={isDisabled}
        onChange={handleChange}
      >
        {loading
          ? <option value="">{t("widgetSelect.loading")}</option>
          : options.length === 0
            ? <option value="">{t("widgetSelect.noOptions")}</option>
            : <>
                <option value="" disabled>{t("widgetSelect.placeholder")}</option>
                {options.map((opt, i) => (
                  <option key={i} value={opt.value}>{opt.label}</option>
                ))}
              </>
        }
      </select>
      {writing && <span className="widget-select__status">{t("widgetSelect.saving")}</span>}
    </div>
  );
}

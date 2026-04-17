import { useState } from "react";
import { useTranslation } from "react-i18next";
import { JSONPath } from "jsonpath-plus";
import type { Widget, FormConfig } from "@/types/widget";
import { useApiStore } from "@/stores/apiStore";
import { useProfileStore } from "@/stores/profileStore";
import { sendFormEndpoint } from "@/services/apiFetch";

type FormStatus = "idle" | "loading" | "success" | "error";

type Props = { widget: Widget };

export default function FormWidget({ widget }: Props) {
  const { t } = useTranslation();
  const config = widget.config as FormConfig;

  const connections = useApiStore((s) => s.connections);
  const vars        = useProfileStore((s) => s.profile?.getVariables() ?? {});

  const conn = connections.find((c) => c.getId() === widget.connectionId) ?? null;
  const ep   = conn?.getEndpoints().find((e) => e.getId() === widget.endpointId) ?? null;

  // Initialise field values from defaultValue
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const field of config.fields) {
      init[field.key] = field.defaultValue ?? "";
    }
    return init;
  });

  const [status,   setStatus]   = useState<FormStatus>("idle");
  const [response, setResponse] = useState<string | null>(null);

  if (!conn || !ep) {
    return (
      <div className="widget-card__error">
        <span className="widget-card__error-icon">⚠</span>
        <span>{t("widgetCard.error.endpointNotFound")}</span>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setResponse(null);

    // Build payload — cast number fields to Number
    const formData: Record<string, string | number> = {};
    for (const field of config.fields) {
      const raw = values[field.key] ?? "";
      formData[field.key] = field.type === "number" ? Number(raw) : raw;
    }

    const result = await sendFormEndpoint(conn, ep, formData, vars);

    let displayText = result.rawText ?? "";

    // Optional: extract a specific field from the JSON response
    if (config.responseDataPath && result.rawText) {
      try {
        const parsed   = JSON.parse(result.rawText);
        const extracted = JSONPath({ path: config.responseDataPath, json: parsed as object });
        if (Array.isArray(extracted) && extracted.length > 0) {
          displayText = String(extracted[0]);
        }
      } catch { /* keep raw text */ }
    }

    setStatus(result.status === "ok" ? "success" : "error");
    setResponse(displayText || null);
  };

  const submitLabel = config.submitLabel || t("widgetForm.submit");

  return (
    <div className="widget-form">
      <form className="widget-form__fields" onSubmit={handleSubmit}>
        {config.fields.map((field) => (
          <div key={field.key} className="widget-form__field">
            {field.label && (
              <label className="widget-form__label" htmlFor={`wf-${widget.id}-${field.key}`}>
                {field.label}
                {field.required && <span className="widget-form__required">*</span>}
              </label>
            )}
            {field.type === "textarea" ? (
              <textarea
                id={`wf-${widget.id}-${field.key}`}
                className="widget-form__input widget-form__input--textarea"
                value={values[field.key] ?? ""}
                required={field.required}
                onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
              />
            ) : (
              <input
                id={`wf-${widget.id}-${field.key}`}
                className="widget-form__input"
                type={field.type === "number" ? "number" : "text"}
                value={values[field.key] ?? ""}
                required={field.required}
                onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
              />
            )}
          </div>
        ))}

        <button
          type="submit"
          className={`widget-form__submit${status === "loading" ? " widget-form__submit--loading" : ""}`}
          disabled={status === "loading"}
        >
          {status === "loading" ? t("widgetForm.sending") : submitLabel}
        </button>
      </form>

      {(status === "success" || status === "error") && response !== null && (
        <pre className={`widget-form__response widget-form__response--${status}`}>
          {response}
        </pre>
      )}
    </div>
  );
}

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { JSONPath } from "jsonpath-plus";
import type { Widget, ButtonConfig } from "@/types/widget";
import { useApiStore } from "@/stores/apiStore";
import { useProfileStore } from "@/stores/profileStore";
import { sendEndpoint } from "@/services/apiFetch";

type BtnStatus = "idle" | "loading" | "success" | "error";

type BtnState = {
  status:   BtnStatus;
  response: string | null;
};

type Props = { widget: Widget };

const FLASH_DURATION_MS = 2500;

export default function ButtonWidget({ widget }: Props) {
  const { t }       = useTranslation();
  const config      = widget.config as ButtonConfig;
  const connections = useApiStore((s) => s.connections);
  const vars        = useProfileStore((s) => s.profile?.getVariables() ?? {});

  const [states, setStates] = useState<Record<number, BtnState>>({});

  const layout   = config.layout ?? "horizontal";
  const isVertical = layout === "vertical";

  const setBtn = (i: number, patch: Partial<BtnState>) =>
    setStates((prev) => ({ ...prev, [i]: { ...{ status: "idle", response: null }, ...prev[i], ...patch } }));

  const handleClick = async (i: number) => {
    const btn = config.buttons[i];
    if (!btn) return;

    const conn = connections.find((c) => c.getId() === btn.connectionId) ?? null;
    const ep   = conn?.getEndpoints().find((e) => e.getId() === btn.endpointId) ?? null;

    if (!conn || !ep) {
      setBtn(i, { status: "error", response: t("widgetCard.error.endpointNotFound") });
      setTimeout(() => setBtn(i, { status: "idle", response: null }), FLASH_DURATION_MS);
      return;
    }

    setBtn(i, { status: "loading", response: null });

    const result = await sendEndpoint(conn, ep, vars);

    let displayText: string | null = null;
    if (btn.responseDataPath && result.rawText) {
      try {
        const parsed    = JSON.parse(result.rawText);
        const extracted = JSONPath({ path: btn.responseDataPath, json: parsed as object });
        if (Array.isArray(extracted) && extracted.length > 0) {
          displayText = String(extracted[0]);
        }
      } catch { displayText = result.rawText.slice(0, 200) || null; }
    }

    setBtn(i, {
      status:   result.status === "ok" ? "success" : "error",
      response: displayText,
    });
    setTimeout(() => setBtn(i, { status: "idle", response: null }), FLASH_DURATION_MS);
  };

  if (config.buttons.length === 0) {
    return (
      <div style={{ opacity: 0.5, fontSize: "0.85rem" }}>
        {t("widgetButton.noButtons")}
      </div>
    );
  }

  return (
    <div
      className={`widget-button-group${isVertical ? " widget-button-group--vertical" : ""}`}
    >
      {config.buttons.map((btn, i) => {
        const s       = states[i] ?? { status: "idle", response: null };
        const variant = btn.variant ?? "primary";
        const cls     = [
          "widget-button",
          `widget-button--${variant}`,
          s.status !== "idle" ? `widget-button--${s.status}` : "",
        ].filter(Boolean).join(" ");

        return (
          <div key={i} className="widget-button-item">
            <button
              className={cls}
              disabled={s.status === "loading"}
              onClick={() => handleClick(i)}
            >
              {s.status === "loading" && <span className="widget-button__spinner" />}
              {s.status === "success" && <span className="widget-button__icon">✓</span>}
              {s.status === "error"   && <span className="widget-button__icon">✗</span>}
              <span>{btn.label || t("widgetButton.unnamed")}</span>
            </button>
            {s.response && (
              <span className={`widget-button__response widget-button__response--${s.status}`}>
                {s.response}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

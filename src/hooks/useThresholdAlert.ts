import { useState, useEffect, useRef } from "react";
import type { Widget, WidgetDataState, AlertEvent } from "@/types/widget";
import { resolveThresholdColor } from "@/types/widget";

export function useThresholdAlert(
  widget: Widget,
  dataState: WidgetDataState,
  onAlert?: (event: AlertEvent) => void,
): { alertColor: string | null } {
  const [alertColor, setAlertColor] = useState<string | null>(null);

  const prevColorRef   = useRef<string | undefined>(undefined);
  const lastAlertMsRef = useRef<number>(0);
  const flashTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const config = widget.config;

    if (!widget.alertEnabled) return;

    const thresholds = "thresholds" in config ? config.thresholds : undefined;
    if (!thresholds?.length) return;

    if (dataState.loading || dataState.error) return;

    let num: number;
    if (config.type === "health-check") {
      if (dataState.httpCode === null) return;
      num = dataState.httpCode;
    } else {
      if (dataState.data === null || dataState.data === undefined) return;
      num = Number(dataState.data);
      if (isNaN(num)) return;
    }

    const currentColor = resolveThresholdColor(num, thresholds);

    if (prevColorRef.current === undefined) {
      prevColorRef.current = currentColor;
      return;
    }

    if (currentColor === prevColorRef.current) return;

    prevColorRef.current = currentColor;

    const cooldownMs = Math.max(5, widget.alertCooldown ?? 60) * 1000;
    const now = Date.now();
    if (now - lastAlertMsRef.current < cooldownMs) return;

    lastAlertMsRef.current = now;
    const flashColor = currentColor ?? "#4a9eff";

    setAlertColor(flashColor);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setAlertColor(null), 2000);

    onAlert?.({ widgetId: widget.id, widgetLabel: widget.label, value: num, color: flashColor });

  }, [dataState.fetchedAt, dataState.httpCode]);

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  return { alertColor };
}

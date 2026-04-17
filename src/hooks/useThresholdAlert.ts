import { useState, useEffect, useRef } from "react";
import type { Widget, WidgetDataState, AlertEvent } from "@/types/widget";
import { resolveThresholdColor } from "@/types/widget";

/**
 * Detects when a widget's value crosses a threshold boundary and triggers a visual alert.
 * Only fires when the resolved threshold color changes (i.e. a boundary was crossed).
 * Respects alertCooldown to avoid spam on oscillating values.
 * Returns alertColor for the duration of the flash (2s), then resets to null.
 */
export function useThresholdAlert(
  widget: Widget,
  dataState: WidgetDataState,
  onAlert?: (event: AlertEvent) => void,
): { alertColor: string | null } {
  const [alertColor, setAlertColor] = useState<string | null>(null);

  // undefined = no baseline yet (first fetch — do not alert)
  const prevColorRef   = useRef<string | undefined>(undefined);
  const lastAlertMsRef = useRef<number>(0);
  const flashTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const config = widget.config;

    // Only alert if alertEnabled
    if (!widget.alertEnabled) return;

    // Only widgets with thresholds configured
    const thresholds = "thresholds" in config ? config.thresholds : undefined;
    if (!thresholds?.length) return;

    // Skip while loading or erroring
    if (dataState.loading || dataState.error) return;

    // Resolve numeric value — HealthCheck uses httpCode, others use data scalar
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

    // First fetch — just establish baseline, no alert
    if (prevColorRef.current === undefined) {
      prevColorRef.current = currentColor;
      return;
    }

    // No boundary crossing
    if (currentColor === prevColorRef.current) return;

    prevColorRef.current = currentColor;

    // Cooldown check
    const cooldownMs = Math.max(5, widget.alertCooldown ?? 60) * 1000;
    const now = Date.now();
    if (now - lastAlertMsRef.current < cooldownMs) return;

    lastAlertMsRef.current = now;
    const flashColor = currentColor ?? "#4a9eff";

    // Trigger 2s flash
    setAlertColor(flashColor);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setAlertColor(null), 2000);

    // Bubble up to display page
    onAlert?.({ widgetId: widget.id, widgetLabel: widget.label, value: num, color: flashColor });

  // fetchedAt changing is the reliable signal that new data arrived
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataState.fetchedAt, dataState.httpCode]);

  // Cleanup flash timer on unmount
  useEffect(() => {
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  return { alertColor };
}

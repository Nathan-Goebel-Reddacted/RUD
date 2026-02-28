import { useEffect, useRef, useState } from "react";
import { useApiStore } from "@/stores/apiStore";
import { useDashboardStore } from "@/stores/dashboardStore";
import { fetchWidgetData } from "@/services/widgetFetch";
import type { Widget, WidgetDataState, FetchCacheEntry } from "@/types/widget";

const DEFAULT_INTERVAL = 30; // seconds

export function useWidgetData(widget: Widget): WidgetDataState {
  const { connectionId, endpointId, dataPath, refreshOverride } = widget;

  const connections   = useApiStore((s) => s.connections);
  const fetchCache    = useDashboardStore((s) => s.fetchCache);
  const setFetchCache = useDashboardStore((s) => s.setFetchCache);
  const tick          = useDashboardStore((s) => s.tick);

  const intervalMs = (refreshOverride ?? DEFAULT_INTERVAL) * 1000;
  const cacheKey   = `${connectionId}::${endpointId}::${dataPath}`;

  const [state, setState] = useState<WidgetDataState>({
    data:      null,
    loading:   true,
    error:     null,
    httpCode:  null,
    fetchedAt: null,
  });

  // fetchingRef tracks an in-flight request for THIS widget instance.
  // We do NOT use cached.loading for deduplication to avoid the StrictMode
  // double-invoke bug (abort → cached.loading stays true → fetch never restarts).
  const fetchingRef   = useRef(false);
  const controllerRef = useRef<AbortController | null>(null);

  // Abort on unmount only
  useEffect(() => {
    return () => { controllerRef.current?.abort(); };
  }, []);

  // Driven by the global clock tick (1s base rate from DashboardClock)
  useEffect(() => {
    const conn = connections.find((c) => c.getId() === connectionId) ?? null;
    const ep   = conn?.getEndpoints().find((e) => e.getId() === endpointId) ?? null;

    if (!conn || !ep) {
      setState({ data: null, loading: false, error: "endpoint_not_found", httpCode: null, fetchedAt: null });
      return;
    }

    const cached: FetchCacheEntry | undefined = fetchCache[cacheKey];

    // If cache is fresh → sync state and skip fetch
    if (cached) {
      const age = Date.now() - cached.fetchedAt;
      if (age < intervalMs) {
        setState({
          data:      cached.data,
          loading:   false,
          error:     cached.error as WidgetDataState["error"],
          httpCode:  null,
          fetchedAt: cached.fetchedAt,
        });
        return;
      }
    }

    // Skip if this instance is already fetching
    if (fetchingRef.current) return;

    // Start fetch
    fetchingRef.current = true;
    setState((prev) => ({ ...prev, loading: true }));

    const controller = new AbortController();
    controllerRef.current = controller;

    fetchWidgetData(conn, ep, dataPath, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        const entry: FetchCacheEntry = {
          data:      result.data,
          fetchedAt: Date.now(),
          error:     result.error,
          loading:   false,
        };
        setFetchCache(cacheKey, entry);
        setState({
          data:      result.data,
          loading:   false,
          error:     result.error,
          httpCode:  result.httpCode,
          fetchedAt: entry.fetchedAt,
        });
      })
      .catch((_err) => {
        if (controller.signal.aborted) return; // unmount — ignore silently
        setState((prev) => ({ ...prev, loading: false, error: "http_error" }));
      })
      .finally(() => { fetchingRef.current = false; });

  // tick is the only explicit dependency — on each 1s tick we re-evaluate
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  return state;
}

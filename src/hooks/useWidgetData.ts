import { useEffect, useState, useCallback } from "react";
import { useApiStore } from "@/stores/apiStore";
import { useDashboardStore } from "@/stores/dashboardStore";
import { fetchWidgetData } from "@/services/widgetFetch";
import type { Widget, WidgetDataState, FetchCacheEntry } from "@/types/widget";

const STALE_THRESHOLD_FACTOR = 0.9; // consider fresh if age < 90% of refresh interval

export function useWidgetData(widget: Widget): WidgetDataState {
  const { connectionId, endpointId, dataPath, refreshOverride } = widget;

  const connections     = useApiStore((state) => state.connections);
  const fetchCache      = useDashboardStore((state) => state.fetchCache);
  const setFetchCache   = useDashboardStore((state) => state.setFetchCache);
  const refreshInterval = useDashboardStore((state) => state.currentDashboard.refreshInterval);

  const effectiveInterval = (refreshOverride ?? refreshInterval) * 1000;
  const cacheKey          = `${connectionId}::${endpointId}`;

  const [state, setState] = useState<WidgetDataState>({
    data:      null,
    loading:   true,
    error:     null,
    httpCode:  null,
    fetchedAt: null,
  });

  const conn = connections.find((c) => c.getId() === connectionId) ?? null;
  const ep   = conn?.getEndpoints().find((e) => e.getId() === endpointId) ?? null;

  const doFetch = useCallback(
    async (signal: AbortSignal, cacheRef: { cancelled: boolean }) => {
      if (!conn || !ep) {
        setState((prev) => ({ ...prev, loading: false, error: "endpoint_not_found" }));
        return;
      }

      // Check cache freshness
      const cached: FetchCacheEntry | undefined = fetchCache[cacheKey];
      if (cached && !cached.loading) {
        const age = Date.now() - cached.fetchedAt;
        if (age < effectiveInterval * STALE_THRESHOLD_FACTOR) {
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

      // Mark loading in cache to prevent parallel fetches by other widgets
      setFetchCache(cacheKey, {
        data:      cached?.data ?? null,
        fetchedAt: cached?.fetchedAt ?? Date.now(),
        error:     cached?.error ?? null,
        loading:   true,
      });

      setState((prev) => ({ ...prev, loading: true }));

      try {
        const result = await fetchWidgetData(conn, ep, dataPath, signal);
        if (cacheRef.cancelled) return;

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
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (cacheRef.cancelled) return;
        setState((prev) => ({ ...prev, loading: false, error: "http_error" }));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cacheKey, connectionId, endpointId, dataPath, effectiveInterval]
  );

  useEffect(() => {
    const controller  = new AbortController();
    const cacheRef    = { cancelled: false };

    doFetch(controller.signal, cacheRef);
    const interval = setInterval(() => doFetch(controller.signal, cacheRef), effectiveInterval);

    return () => {
      cacheRef.cancelled = true;
      controller.abort();
      clearInterval(interval);
    };
  }, [doFetch, effectiveInterval]);

  return state;
}

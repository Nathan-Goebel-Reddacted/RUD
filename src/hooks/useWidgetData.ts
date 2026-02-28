import { useEffect, useRef, useState } from "react";
import { useApiStore } from "@/stores/apiStore";
import { useDashboardStore } from "@/stores/dashboardStore";
import { fetchWidgetData } from "@/services/widgetFetch";
import type { Widget, WidgetDataState, FetchCacheEntry } from "@/types/widget";

const DEFAULT_INTERVAL = 30; // seconds, used if widget has no refreshOverride

export function useWidgetData(widget: Widget): WidgetDataState {
  const { connectionId, endpointId, dataPath, refreshOverride } = widget;

  const connections   = useApiStore((s) => s.connections);
  const fetchCache    = useDashboardStore((s) => s.fetchCache);
  const setFetchCache = useDashboardStore((s) => s.setFetchCache);
  const tick          = useDashboardStore((s) => s.tick);

  const intervalMs = (refreshOverride ?? DEFAULT_INTERVAL) * 1000;
  const cacheKey   = `${connectionId}::${endpointId}`;

  const [state, setState] = useState<WidgetDataState>({
    data:      null,
    loading:   true,
    error:     null,
    httpCode:  null,
    fetchedAt: null,
  });

  const controllerRef = useRef<AbortController | null>(null);
  const fetchingRef   = useRef(false);

  // Abort on unmount
  useEffect(() => {
    return () => { controllerRef.current?.abort(); };
  }, []);

  // React to each tick (fires every second from DashboardClock)
  useEffect(() => {
    const conn = connections.find((c) => c.getId() === connectionId) ?? null;
    const ep   = conn?.getEndpoints().find((e) => e.getId() === endpointId) ?? null;

    if (!conn || !ep) {
      setState((prev) => ({ ...prev, loading: false, error: "endpoint_not_found" }));
      return;
    }

    const cached: FetchCacheEntry | undefined = fetchCache[cacheKey];

    // Update local state from cache if fresh
    if (cached && !cached.loading) {
      const age = Date.now() - cached.fetchedAt;
      setState({
        data:      cached.data,
        loading:   false,
        error:     cached.error as WidgetDataState["error"],
        httpCode:  null,
        fetchedAt: cached.fetchedAt,
      });
      // Still stale → fall through to fetch
      if (age < intervalMs) return;
    }

    // Skip if already fetching this endpoint
    if (cached?.loading || fetchingRef.current) return;

    // Mark as fetching
    fetchingRef.current = true;
    setFetchCache(cacheKey, {
      data:      cached?.data ?? null,
      fetchedAt: cached?.fetchedAt ?? Date.now(),
      error:     cached?.error ?? null,
      loading:   true,
    });
    setState((prev) => ({ ...prev, loading: true }));

    controllerRef.current?.abort();
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
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setState((prev) => ({ ...prev, loading: false, error: "http_error" }));
      })
      .finally(() => { fetchingRef.current = false; });

  // tick drives re-evaluation; intervalMs and cacheKey are stable per widget config
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  return state;
}

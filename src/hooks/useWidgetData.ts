import { useEffect, useRef, useState } from "react";
import { useApiStore } from "@/stores/apiStore";
import { useDashboardStore } from "@/stores/dashboardStore";
import { useProfileStore } from "@/stores/profileStore";
import { fetchWidgetData, applyTransform, extractData, buildWsUrl } from "@/services/widgetFetch";
import type { Widget, WidgetDataState, FetchCacheEntry } from "@/types/widget";

const DEFAULT_INTERVAL = 30;

function withTransform(
  data: unknown,
  error: WidgetDataState["error"],
  transform: string | undefined
): { data: unknown; error: WidgetDataState["error"] } {
  if (!transform?.trim() || error !== null) return { data, error };
  const result = applyTransform(data, transform);
  return { data: result.value, error: result.error };
}

export function useWidgetData(widget: Widget): WidgetDataState {
  const { connectionId, endpointId, dataPath, refreshOverride, transform } = widget;

  const connections   = useApiStore((s) => s.connections);
  const fetchCache    = useDashboardStore((s) => s.fetchCache);
  const setFetchCache = useDashboardStore((s) => s.setFetchCache);
  const tick          = useDashboardStore((s) => s.tick);
  const profile       = useProfileStore((s) => s.profile);
  const vars          = profile?.getVariables() ?? {};

  const intervalMs = (refreshOverride ?? DEFAULT_INTERVAL) * 1000;
  const cacheKey   = `${connectionId}::${endpointId}::${dataPath}`;

  const [state, setState] = useState<WidgetDataState>({
    data:      null,
    loading:   true,
    error:     null,
    httpCode:  null,
    fetchedAt: null,
  });

  const fetchingRef   = useRef(false);
  const controllerRef = useRef<AbortController | null>(null);
  const wsRef         = useRef<WebSocket | null>(null);

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
      wsRef.current?.close();
    };
  }, []);

  const varsKey = JSON.stringify(vars);
  useEffect(() => {
    const conn = connections.find((c) => c.getId() === connectionId) ?? null;
    const ep   = conn?.getEndpoints().find((e) => e.getId() === endpointId) ?? null;

    if (!conn || !ep || !ep.isWebSocket()) return;

    setState({ data: null, loading: true, error: null, httpCode: null, fetchedAt: null });

    wsRef.current?.close();
    let ws: WebSocket;
    try {
      ws = new WebSocket(buildWsUrl(conn, ep, vars));
    } catch {
      setState({ data: null, loading: false, error: "http_error", httpCode: null, fetchedAt: null });
      return;
    }
    wsRef.current = ws;

    ws.onopen = () => {
      const msg = ep.getWsSubscribeMessage();
      if (msg?.trim()) ws.send(msg);
    };

    ws.onmessage = (event) => {
      let raw: unknown;
      try { raw = JSON.parse(event.data as string); } catch { raw = event.data; }
      const { value, error } = extractData(raw, dataPath);
      const transformed = withTransform(value, error, transform);
      setState({ data: transformed.data, loading: false, error: transformed.error, httpCode: null, fetchedAt: Date.now() });
    };

    ws.onerror = () => setState((prev) => ({ ...prev, loading: false, error: "http_error" }));
    ws.onclose = () => setState((prev) => ({ ...prev, loading: false }));

    return () => { ws.close(); wsRef.current = null; };
  }, [connectionId, endpointId, dataPath, transform, varsKey]);

  useEffect(() => {
    const conn = connections.find((c) => c.getId() === connectionId) ?? null;
    const ep   = conn?.getEndpoints().find((e) => e.getId() === endpointId) ?? null;

    if (!conn || !ep) {
      setState({ data: null, loading: false, error: "endpoint_not_found", httpCode: null, fetchedAt: null });
      return;
    }

    if (ep.isWebSocket()) return;

    const cached: FetchCacheEntry | undefined = fetchCache[cacheKey];

    if (cached) {
      const age = Date.now() - cached.fetchedAt;
      if (age < intervalMs) {
        const transformed = withTransform(cached.data, cached.error as WidgetDataState["error"], transform);
        setState({
          data:      transformed.data,
          loading:   false,
          error:     transformed.error,
          httpCode:  cached.httpCode,
          fetchedAt: cached.fetchedAt,
        });
        return;
      }
    }

    if (fetchingRef.current) return;

    fetchingRef.current = true;
    setState((prev) => ({ ...prev, loading: true }));

    const controller = new AbortController();
    controllerRef.current = controller;

    fetchWidgetData(conn, ep, dataPath, controller.signal, vars)
      .then((result) => {
        if (controller.signal.aborted) return;
        const entry: FetchCacheEntry = {
          data:      result.data,
          fetchedAt: Date.now(),
          error:     result.error,
          loading:   false,
          httpCode:  result.httpCode,
        };
        setFetchCache(cacheKey, entry);
        const transformed = withTransform(result.data, result.error, transform);
        setState({
          data:      transformed.data,
          loading:   false,
          error:     transformed.error,
          httpCode:  result.httpCode,
          fetchedAt: entry.fetchedAt,
        });
      })
      .catch(() => {
        if (controller.signal.aborted) return; // unmount — ignore silently
        setState((prev) => ({ ...prev, loading: false, error: "http_error" }));
      })
      .finally(() => { fetchingRef.current = false; });

  }, [tick]);

  return state;
}

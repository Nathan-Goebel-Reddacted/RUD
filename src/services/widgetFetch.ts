import { JSONPath } from "jsonpath-plus";
import ApiConnection from "@/class/ApiConnection";
import ApiEndpoint from "@/class/ApiEndpoint";
import { AuthType } from "@/enum/authType";
import type { WidgetDataError } from "@/types/widget";
import { substituteVars } from "@/services/substituteVars";

export type WidgetFetchResult = {
  raw:      unknown;
  data:     unknown;
  httpCode: number | null;
  error:    WidgetDataError | null;
};

function buildHeaders(conn: ApiConnection, vars: Record<string, string>): Record<string, string> {
  const rawHeaders = conn.getHeaders();
  const headers: Record<string, string> = {};
  for (const [k, v] of Object.entries(rawHeaders)) {
    headers[k] = substituteVars(v, vars);
  }
  const authValue = substituteVars(conn.getAuthValue(), vars);
  switch (conn.getAuthType()) {
    case AuthType.BEARER:
      headers["Authorization"] = `Bearer ${authValue}`;
      break;
    case AuthType.API_KEY:
      headers["X-API-Key"] = authValue;
      break;
    case AuthType.BASIC:
      headers["Authorization"] = `Basic ${btoa(authValue)}`;
      break;
  }
  return headers;
}

function buildUrl(conn: ApiConnection, ep: ApiEndpoint, vars: Record<string, string>): string {
  let path = ep.getPath();
  for (const param of ep.getPathParams()) {
    if (param.defaultValue) {
      path = path.replace(`{${param.name}}`, encodeURIComponent(substituteVars(param.defaultValue, vars)));
    }
  }
  const queryParts = ep
    .getQueryParams()
    .filter((p) => p.defaultValue)
    .map((p) => `${encodeURIComponent(p.name)}=${encodeURIComponent(substituteVars(p.defaultValue, vars))}`);
  const base = substituteVars(conn.getBaseUrl(), vars).replace(/\/$/, "");
  return `${base}${path}${queryParts.length ? "?" + queryParts.join("&") : ""}`;
}

export function extractData(
  raw: unknown,
  path: string
): { value: unknown; error: WidgetDataError | null } {
  if (!path || path.trim() === "") {
    return { value: raw, error: null };
  }
  try {
    const result = JSONPath({ path, json: raw as object });
    if (result === undefined || result === null) {
      return { value: null, error: "no_data" };
    }
    if (Array.isArray(result) && result.length === 0) {
      return { value: [], error: null };
    }
    // JSONPath always returns an array — unwrap single values
    if (Array.isArray(result) && result.length === 1) {
      return { value: result[0], error: null };
    }
    return { value: result, error: null };
  } catch {
    return { value: undefined, error: "invalid_path" };
  }
}

export function applyTransform(
  value: unknown,
  transform: string
): { value: unknown; error: "transform_error" | null } {
  try {
    // eslint-disable-next-line no-new-func
    const result = new Function("value", `"use strict"; return (${transform})`)(value);
    return { value: result, error: null };
  } catch {
    return { value: null, error: "transform_error" };
  }
}

export async function fetchWidgetData(
  conn: ApiConnection,
  ep: ApiEndpoint,
  dataPath: string,
  signal?: AbortSignal,
  vars: Record<string, string> = {},
  extraQueryParams?: Record<string, string>
): Promise<WidgetFetchResult> {
  const headers = buildHeaders(conn, vars);
  const options: RequestInit = { method: ep.getMethod(), headers, signal };
  if (ep.hasBody() && ep.getBody()) {
    options.body = ep.getBody();
    headers["Content-Type"] = ep.getBodyContentType();
  }

  let url = buildUrl(conn, ep, vars);
  if (extraQueryParams && Object.keys(extraQueryParams).length > 0) {
    const sep = url.includes("?") ? "&" : "?";
    url += sep + Object.entries(extraQueryParams)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&");
  }
  console.debug("[widgetFetch] →", ep.getMethod(), url);

  try {
    const res = await fetch(url, options);
    let raw: unknown;
    const text = await res.text();
    try {
      raw = JSON.parse(text);
    } catch {
      return { raw: null, data: null, httpCode: res.status, error: "parse_error" };
    }
    if (!res.ok) {
      return { raw, data: null, httpCode: res.status, error: "http_error" };
    }
    const { value, error } = extractData(raw, dataPath);
    return { raw, data: value, httpCode: res.status, error };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw err; // re-throw to let the hook handle cleanup
    }
    // TypeError = network failure (includes CORS, bad URL, no internet)
    // Log the real error so devtools show the actual cause
    if (err instanceof TypeError) {
      console.error("[widgetFetch] network error:", err.message);
    }
    const isNetworkError = err instanceof TypeError; // includes CORS, no internet, bad URL
    return { raw: null, data: null, httpCode: null, error: isNetworkError ? "cors" : "http_error" };
  }
}

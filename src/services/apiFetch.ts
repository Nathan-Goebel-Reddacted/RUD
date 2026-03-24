import ApiConnection from "@/class/ApiConnection";
import ApiEndpoint from "@/class/ApiEndpoint";
import { AuthType } from "@/enum/authType";
import { substituteVars } from "@/services/substituteVars";

export type FetchStatus = "unknown" | "loading" | "ok" | "error";

export type FetchResult = {
  status: "ok" | "error";
  httpCode?: number;
  preview?: string;
  corsError: boolean;
};

function buildFetchHeaders(conn: ApiConnection, vars: Record<string, string>): Record<string, string> {
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

function buildEndpointUrl(conn: ApiConnection, ep: ApiEndpoint, vars: Record<string, string>): string {
  let path = ep.getPath();
  for (const param of ep.getPathParams()) {
    if (param.defaultValue) {
      path = path.replace(`{${param.name}}`, encodeURIComponent(substituteVars(param.defaultValue, vars)));
    }
  }
  const queryParts = ep.getQueryParams()
    .filter((p) => p.defaultValue)
    .map((p) => `${encodeURIComponent(p.name)}=${encodeURIComponent(substituteVars(p.defaultValue, vars))}`);
  const base = substituteVars(conn.getBaseUrl(), vars).replace(/\/$/, "");
  return `${base}${path}${queryParts.length ? "?" + queryParts.join("&") : ""}`;
}

export async function sendEndpoint(
  conn: ApiConnection,
  ep: ApiEndpoint,
  vars: Record<string, string> = {}
): Promise<FetchResult> {
  const headers = buildFetchHeaders(conn, vars);
  const options: RequestInit = { method: ep.getMethod(), headers };
  if (ep.hasBody() && ep.getBody()) {
    options.body = ep.getBody();
    headers["Content-Type"] = ep.getBodyContentType();
  }
  try {
    const res = await fetch(buildEndpointUrl(conn, ep, vars), options);
    let preview: string | undefined;
    try {
      const text = await res.text();
      preview = text.trimEnd().slice(0, 400) || undefined;
    } catch { /* ignore read errors */ }
    return { status: res.ok ? "ok" : "error", httpCode: res.status, preview, corsError: false };
  } catch (err) {
    return { status: "error", corsError: err instanceof TypeError };
  }
}

// Any HTTP response = server reachable (ok). Network/CORS error = error.
export async function testConnection(conn: ApiConnection, vars: Record<string, string> = {}): Promise<"ok" | "error"> {
  const headers = buildFetchHeaders(conn, vars);
  try {
    await fetch(substituteVars(conn.getBaseUrl(), vars), { method: "GET", headers });
    return "ok";
  } catch {
    return "error";
  }
}

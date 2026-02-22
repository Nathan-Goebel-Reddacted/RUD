import ApiConnection from "@/class/ApiConnection";
import ApiEndpoint from "@/class/ApiEndpoint";
import { AuthType } from "@/enum/authType";

export type FetchStatus = "unknown" | "loading" | "ok" | "error";

function buildFetchHeaders(conn: ApiConnection): Record<string, string> {
  const headers: Record<string, string> = { ...conn.getHeaders() };
  switch (conn.getAuthType()) {
    case AuthType.BEARER:
      headers["Authorization"] = `Bearer ${conn.getAuthValue()}`;
      break;
    case AuthType.API_KEY:
      headers["X-API-Key"] = conn.getAuthValue();
      break;
    case AuthType.BASIC:
      headers["Authorization"] = `Basic ${btoa(conn.getAuthValue())}`;
      break;
  }
  return headers;
}

function buildEndpointUrl(conn: ApiConnection, ep: ApiEndpoint): string {
  let path = ep.getPath();
  for (const param of ep.getPathParams()) {
    if (param.defaultValue) {
      path = path.replace(`{${param.name}}`, encodeURIComponent(param.defaultValue));
    }
  }
  const queryParts = ep.getQueryParams()
    .filter((p) => p.defaultValue)
    .map((p) => `${encodeURIComponent(p.name)}=${encodeURIComponent(p.defaultValue)}`);
  const base = conn.getBaseUrl().replace(/\/$/, "");
  return `${base}${path}${queryParts.length ? "?" + queryParts.join("&") : ""}`;
}

export async function sendEndpoint(
  conn: ApiConnection,
  ep: ApiEndpoint
): Promise<"ok" | "error"> {
  const headers = buildFetchHeaders(conn);
  const options: RequestInit = { method: ep.getMethod(), headers };
  if (ep.hasBody() && ep.getBody()) {
    options.body = ep.getBody();
    headers["Content-Type"] = ep.getBodyContentType();
  }
  try {
    const res = await fetch(buildEndpointUrl(conn, ep), options);
    return res.ok ? "ok" : "error";
  } catch {
    return "error";
  }
}

// Any HTTP response = server reachable (ok). Network/CORS error = error.
export async function testConnection(conn: ApiConnection): Promise<"ok" | "error"> {
  const headers = buildFetchHeaders(conn);
  try {
    await fetch(conn.getBaseUrl(), { method: "GET", headers });
    return "ok";
  } catch {
    return "error";
  }
}

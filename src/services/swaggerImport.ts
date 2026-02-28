import * as jsYAML from "js-yaml";

import ApiConnection from "@/class/ApiConnection";
import ApiEndpoint from "@/class/ApiEndpoint";
import { AuthType } from "@/enum/authType";
import { HttpMethod } from "@/enum/httpMethod";
import { ParamType, BodyContentType, type QueryParam } from "@/types/endpoint";

type Spec = Record<string, unknown>;
type PathItem = Record<string, unknown>;
type Operation = { parameters?: Param[]; requestBody?: unknown };
type Param = {
  in: string;
  name: string;
  type?: string;
  schema?: { type?: string; default?: unknown };
  required?: boolean;
  default?: unknown;
};

const VALID_METHODS = ["get", "post", "put", "patch", "delete"] as const;
type ValidMethod = (typeof VALID_METHODS)[number];

function parseSpec(text: string, filename: string): Spec {
  const isYaml = filename.endsWith(".yaml") || filename.endsWith(".yml");

  let raw: unknown;
  if (isYaml) {
    raw = jsYAML.load(text);
  } else {
    try {
      raw = JSON.parse(text);
    } catch {
      raw = jsYAML.load(text);
    }
  }

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Invalid spec: file does not contain a valid object");
  }

  const spec = raw as Spec;
  const isSwagger2 = typeof spec.swagger === "string" && spec.swagger.startsWith("2");
  const isOpenApi3 = typeof spec.openapi === "string" && spec.openapi.startsWith("3");

  if (!isSwagger2 && !isOpenApi3) {
    throw new Error("Invalid spec: not a recognized Swagger 2.0 or OpenAPI 3.x document");
  }

  return spec;
}

function extractBaseUrl(spec: Spec): string {
  if (typeof spec.openapi === "string") {
    const servers = spec.servers as Array<{
      url: string;
      variables?: Record<string, { default?: string }>;
    }> | undefined;
    const server = servers?.[0];
    if (!server) return "";
    let url = server.url;
    if (server.variables) {
      url = url.replace(
        /\{(\w+)\}/g,
        (_, name: string) => server.variables?.[name]?.default ?? name
      );
    }
    return url;
  }

  const host = typeof spec.host === "string" ? spec.host : "";
  const basePath = typeof spec.basePath === "string" ? spec.basePath : "";
  const schemes = spec.schemes as string[] | undefined;
  const scheme = schemes?.[0] ?? "https";
  return host ? `${scheme}://${host}${basePath}` : "";
}

function extractAuth(spec: Spec): AuthType {
  const isV3 = typeof spec.openapi === "string";
  const components = spec.components as Spec | undefined;
  const securitySchemes: Record<string, Spec> = isV3
    ? ((components?.securitySchemes as Record<string, Spec>) ?? {})
    : ((spec.securityDefinitions as Record<string, Spec>) ?? {});

  for (const scheme of Object.values(securitySchemes)) {
    if (scheme.type === "apiKey") return AuthType.API_KEY;
    if (scheme.type === "http") {
      if (scheme.scheme === "bearer") return AuthType.BEARER;
      if (scheme.scheme === "basic") return AuthType.BASIC;
    }
    if (scheme.type === "basic") return AuthType.BASIC;
    if (scheme.type === "oauth2" || scheme.type === "openIdConnect") return AuthType.BEARER;
  }
  return AuthType.NONE;
}

function extractLabel(spec: Spec, baseUrl: string): string {
  const info = spec.info as Spec | undefined;
  const title = typeof info?.title === "string" ? info.title.trim() : "";
  if (title.length >= 3) return title;
  try {
    return new URL(baseUrl).hostname;
  } catch {
    return "Imported API";
  }
}

function mapParamType(type: string | undefined): ParamType {
  if (type === "integer" || type === "number") return ParamType.NUMBER;
  if (type === "boolean") return ParamType.BOOLEAN;
  return ParamType.STRING;
}

function mapOperation(path: string, method: ValidMethod, operation: Operation): ApiEndpoint {
  const ep = new ApiEndpoint();
  ep.createAnApiEndpoint(path, method.toUpperCase() as HttpMethod);

  const params = operation.parameters ?? [];

  const pathParams = params
    .filter((p) => p.in === "path")
    .map((p) => ({
      name: p.name,
      type: mapParamType(p.schema?.type ?? p.type),
      defaultValue: String(p.default ?? p.schema?.default ?? ""),
    }));
  if (pathParams.length > 0) ep.setPathParams(pathParams);

  const queryParams: QueryParam[] = params
    .filter((p) => p.in === "query")
    .map((p) => ({
      name: p.name,
      type: mapParamType(p.schema?.type ?? p.type),
      required: p.required ?? false,
      defaultValue: String(p.default ?? p.schema?.default ?? ""),
    }));
  ep.setQueryParams(queryParams);

  if (operation.requestBody && ep.hasBody()) {
    const body = operation.requestBody as { content?: Record<string, unknown> };
    const content = body.content ?? {};
    if ("application/json" in content) {
      ep.setBodyContentType(BodyContentType.JSON);
    } else if ("application/x-www-form-urlencoded" in content) {
      ep.setBodyContentType(BodyContentType.FORM_DATA);
    }
  }

  return ep;
}

export async function importSwaggerFile(file: File): Promise<ApiConnection> {
  const text = await file.text();
  const spec = parseSpec(text, file.name);

  const baseUrl = extractBaseUrl(spec);
  const label   = extractLabel(spec, baseUrl);

  const conn = new ApiConnection();
  conn.createAnApiConnection(label, baseUrl);
  conn.setAuthType(extractAuth(spec));

  const paths = (spec.paths ?? {}) as Record<string, PathItem>;
  for (const [path, pathItem] of Object.entries(paths)) {
    for (const method of VALID_METHODS) {
      const operation = pathItem[method];
      if (!operation || typeof operation !== "object") continue;
      try {
        const ep = mapOperation(path, method, operation as Operation);
        conn.addEndpoint(ep);
      } catch {
        // Skip endpoints that fail mapping
      }
    }
  }

  const validation = conn.isApiConnectionValid();
  if (!validation.isSuccess()) {
    const code = validation.getAllReason()[0]?.getreasonCode() ?? "invalid";
    throw new Error(`Invalid spec: ${code}`);
  }

  return conn;
}

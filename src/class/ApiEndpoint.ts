import { HttpMethod } from "@/enum/httpMethod";
import ActionResult from "@/services/resultAction";
import {
  ParamType,
  BodyContentType,
  type PathParam,
  type QueryParam,
} from "@/types/endpoint";

class ApiEndpoint {
  private id: string         = "";
  private path: string       = "";
  private method: HttpMethod = HttpMethod.GET;

  private pathParams:       PathParam[]    = [];
  private queryParams:      QueryParam[]   = [];
  private responseDataPath: string         = "";
  private body:             string         = "";
  private bodyContentType:  BodyContentType = BodyContentType.JSON;

  constructor() {}

  public createAnApiEndpoint(
    path: string,
    method: HttpMethod,
    id?: string
  ): void {
    this.id     = id ?? crypto.randomUUID();
    this.path   = path;
    this.method = method;
    this.pathParams = ApiEndpoint.extractPathParams(path, []);
  }

  // Re-sync path params when path changes, preserving existing type/default
  public updatePath(path: string): void {
    this.path = path;
    this.pathParams = ApiEndpoint.extractPathParams(path, this.pathParams);
  }

  private static extractPathParams(path: string, existing: PathParam[]): PathParam[] {
    const matches = [...path.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
    return matches.map((name) => {
      const prev = existing.find((p) => p.name === name);
      return prev ?? { name, type: ParamType.STRING, defaultValue: "" };
    });
  }

  public isApiEndpointValid(): ActionResult {
    const result = new ActionResult("");
    if (this.path.trim().length === 0) {
      result.addReason("ApiEndpoint.path.empty", "apiEndpoint.invalidPath");
    }
    if (!this.path.startsWith("/")) {
      result.addReason("ApiEndpoint.path.noLeadingSlash", "apiEndpoint.pathNoLeadingSlash");
    }
    if (!Object.values(HttpMethod).includes(this.method)) {
      result.addReason("ApiEndpoint.method.invalid", "apiEndpoint.invalidMethod");
    }
    return result;
  }

  public getId(): string               { return this.id; }
  public getPath(): string             { return this.path; }
  public getMethod(): HttpMethod       { return this.method; }
  public getPathParams(): PathParam[]  { return [...this.pathParams]; }
  public getQueryParams(): QueryParam[]{ return [...this.queryParams]; }
  public getResponseDataPath(): string { return this.responseDataPath; }
  public getBody(): string             { return this.body; }
  public getBodyContentType(): BodyContentType { return this.bodyContentType; }

  public setMethod(method: HttpMethod): void             { this.method = method; }
  public setPathParams(params: PathParam[]): void        { this.pathParams = params; }
  public setQueryParams(params: QueryParam[]): void      { this.queryParams = params; }
  public setResponseDataPath(path: string): void         { this.responseDataPath = path; }
  public setBody(body: string): void                     { this.body = body; }
  public setBodyContentType(ct: BodyContentType): void   { this.bodyContentType = ct; }

  public hasBody(): boolean {
    return (["POST", "PUT", "PATCH"] as string[]).includes(this.method);
  }

  public toJSON(): object {
    return {
      id:               this.id,
      path:             this.path,
      method:           this.method,
      pathParams:       this.pathParams,
      queryParams:      this.queryParams,
      responseDataPath: this.responseDataPath,
      body:             this.body,
      bodyContentType:  this.bodyContentType,
    };
  }

  public static fromJSON(data: unknown): ApiEndpoint | null {
    try {
      if (!data || typeof data !== "object") return null;
      const d = data as Record<string, unknown>;
      const e = new ApiEndpoint();
      e.createAnApiEndpoint(
        typeof d.path === "string" ? d.path : "",
        Object.values(HttpMethod).includes(d.method as HttpMethod)
          ? (d.method as HttpMethod)
          : HttpMethod.GET,
        typeof d.id === "string" ? d.id : undefined
      );
      if (Array.isArray(d.pathParams))  e.setPathParams(d.pathParams as PathParam[]);
      if (Array.isArray(d.queryParams)) e.setQueryParams(d.queryParams as QueryParam[]);
      if (typeof d.responseDataPath === "string") e.setResponseDataPath(d.responseDataPath);
      if (typeof d.body === "string") e.setBody(d.body);
      if (Object.values(BodyContentType).includes(d.bodyContentType as BodyContentType)) {
        e.setBodyContentType(d.bodyContentType as BodyContentType);
      }
      if (!e.isApiEndpointValid().isSuccess()) return null;
      return e;
    } catch {
      return null;
    }
  }
}

export default ApiEndpoint;

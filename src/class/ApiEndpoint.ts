import { HttpMethod } from "@/enum/httpMethod";
import ActionResult from "@/services/resultAction";

class ApiEndpoint {
  private id: string       = "";
  private path: string     = "";
  private method: HttpMethod = HttpMethod.GET;
  private label: string    = "";

  constructor() {}

  public createAnApiEndpoint(
    path: string,
    method: HttpMethod,
    label: string,
    id?: string
  ): void {
    this.id     = id ?? crypto.randomUUID();
    this.path   = path;
    this.method = method;
    this.label  = label;
  }

  public isApiEndpointValid(): ActionResult {
    const result = new ActionResult("");
    if (this.path.trim().length === 0) {
      result.addReason("ApiEndpoint.path.empty", "apiEndpoint.invalidPath");
    }
    if (!this.path.startsWith("/")) {
      result.addReason("ApiEndpoint.path.noLeadingSlash", "apiEndpoint.pathNoLeadingSlash");
    }
    if (this.label.trim().length === 0) {
      result.addReason("ApiEndpoint.label.empty", "apiEndpoint.invalidLabel");
    }
    if (!Object.values(HttpMethod).includes(this.method)) {
      result.addReason("ApiEndpoint.method.invalid", "apiEndpoint.invalidMethod");
    }
    return result;
  }

  public getId(): string       { return this.id; }
  public getPath(): string     { return this.path; }
  public getMethod(): HttpMethod { return this.method; }
  public getLabel(): string    { return this.label; }

  public setPath(path: string): void  { this.path = path; }
  public setMethod(method: HttpMethod): void { this.method = method; }
  public setLabel(label: string): void { this.label = label; }

  public toJSON(): object {
    return {
      id:     this.id,
      path:   this.path,
      method: this.method,
      label:  this.label,
    };
  }

  public static fromJSON(data: unknown): ApiEndpoint | null {
    try {
      if (!data || typeof data !== "object") return null;
      const d = data as Record<string, unknown>;
      const e = new ApiEndpoint();
      e.createAnApiEndpoint(
        typeof d.path   === "string" ? d.path   : "",
        Object.values(HttpMethod).includes(d.method as HttpMethod)
          ? (d.method as HttpMethod)
          : HttpMethod.GET,
        typeof d.label  === "string" ? d.label  : "",
        typeof d.id     === "string" ? d.id     : undefined
      );
      if (!e.isApiEndpointValid().isSuccess()) return null;
      return e;
    } catch {
      return null;
    }
  }
}

export default ApiEndpoint;

import { AuthType } from "@/enum/authType";
import ActionResult from "@/services/resultAction";
import ApiEndpoint from "@/class/ApiEndpoint";

class ApiConnection {
  private id: string        = "";
  private label: string     = "";
  private baseUrl: string   = "";
  private headers: Record<string, string> = {};
  private authType: AuthType  = AuthType.NONE;
  private authValue: string   = "";
  private endpoints: ApiEndpoint[] = [];

  constructor() {}

  public createAnApiConnection(
    label: string,
    baseUrl: string,
    id?: string
  ): void {
    this.id      = id ?? crypto.randomUUID();
    this.label   = label;
    this.baseUrl = baseUrl;
  }

  public isApiConnectionValid(): ActionResult {
    const result = new ActionResult("");
    if (this.label.trim().length < 3) {
      result.addReason("ApiConnection.label.tooShort", "apiConnection.invalidLabel");
    }
    if (!this.isUrlValid(this.baseUrl)) {
      result.addReason("ApiConnection.baseUrl.invalid", "apiConnection.invalidBaseUrl");
    }
    if (!Object.values(AuthType).includes(this.authType)) {
      result.addReason("ApiConnection.authType.invalid", "apiConnection.invalidAuthType");
    }
    return result;
  }

  private isUrlValid(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }

  public getId(): string      { return this.id; }
  public getLabel(): string   { return this.label; }
  public getBaseUrl(): string { return this.baseUrl; }
  public getHeaders(): Record<string, string> { return { ...this.headers }; }
  public getAuthType(): AuthType  { return this.authType; }
  public getAuthValue(): string   { return this.authValue; }
  public getEndpoints(): ApiEndpoint[] { return [...this.endpoints]; }

  public setLabel(label: string): void     { this.label = label; }
  public setBaseUrl(baseUrl: string): void { this.baseUrl = baseUrl; }
  public setAuthType(authType: AuthType): void   { this.authType = authType; }
  public setAuthValue(authValue: string): void   { this.authValue = authValue; }

  public setHeader(key: string, value: string): void {
    this.headers[key] = value;
  }

  public removeHeader(key: string): void {
    delete this.headers[key];
  }

  public addEndpoint(endpoint: ApiEndpoint): void {
    this.endpoints.push(endpoint);
  }

  public removeEndpoint(id: string): void {
    this.endpoints = this.endpoints.filter((e) => e.getId() !== id);
  }

  public toJSON(): object {
    return {
      id:        this.id,
      label:     this.label,
      baseUrl:   this.baseUrl,
      headers:   { ...this.headers },
      authType:  this.authType,
      authValue: this.authValue,
      endpoints: this.endpoints.map((e) => e.toJSON()),
    };
  }

  public static fromJSON(data: unknown): ApiConnection | null {
    try {
      if (!data || typeof data !== "object") return null;
      const d = data as Record<string, unknown>;
      const c = new ApiConnection();
      c.createAnApiConnection(
        typeof d.label   === "string" ? d.label   : "",
        typeof d.baseUrl === "string" ? d.baseUrl : "",
        typeof d.id      === "string" ? d.id      : undefined
      );
      if (Object.values(AuthType).includes(d.authType as AuthType)) {
        c.setAuthType(d.authType as AuthType);
      }
      if (typeof d.authValue === "string") {
        c.setAuthValue(d.authValue);
      }
      if (d.headers && typeof d.headers === "object") {
        for (const [k, v] of Object.entries(d.headers as Record<string, unknown>)) {
          if (typeof v === "string") c.setHeader(k, v);
        }
      }
      if (Array.isArray(d.endpoints)) {
        for (const raw of d.endpoints) {
          const endpoint = ApiEndpoint.fromJSON(raw);
          if (endpoint) c.addEndpoint(endpoint);
        }
      }
      if (!c.isApiConnectionValid().isSuccess()) return null;
      return c;
    } catch {
      return null;
    }
  }
}

export default ApiConnection;

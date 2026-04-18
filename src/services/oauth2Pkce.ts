import type ApiConnection from "@/class/ApiConnection";

type StoredToken = {
  accessToken:   string;
  refreshToken?: string;
  expiresAt:     number;
};

type PendingFlow = {
  verifier:     string;
  state:        string;
  connectionId: string;
  tokenUrl:     string;
  clientId:     string;
  redirectUri:  string;
};

const PENDING_KEY     = "rud-pkce-pending";
const tokenKey        = (id: string) => `rud-oauth2-${id}`;

function base64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function generateCodeVerifier(): Promise<string> {
  const arr = new Uint8Array(64);
  crypto.getRandomValues(arr);
  return base64url(arr);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return base64url(new Uint8Array(hash));
}

export async function startOAuth2Flow(conn: ApiConnection): Promise<void> {
  const cfg = conn.getOAuth2Config();
  if (!cfg) throw new Error("No OAuth2 config on connection");

  const verifier   = await generateCodeVerifier();
  const challenge  = await generateCodeChallenge(verifier);
  const state      = base64url(crypto.getRandomValues(new Uint8Array(16)));

  const pending: PendingFlow = {
    verifier,
    state,
    connectionId: conn.getId(),
    tokenUrl:     cfg.tokenUrl,
    clientId:     cfg.clientId,
    redirectUri:  cfg.redirectUri,
  };
  sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending));

  const params = new URLSearchParams({
    response_type:         "code",
    client_id:             cfg.clientId,
    redirect_uri:          cfg.redirectUri,
    scope:                 cfg.scope,
    state,
    code_challenge:        challenge,
    code_challenge_method: "S256",
  });
  window.location.href = `${cfg.authorizationUrl}?${params.toString()}`;
}

export async function handleOAuth2Callback(
  code: string,
  state: string
): Promise<{ connectionId: string }> {
  const raw = sessionStorage.getItem(PENDING_KEY);
  if (!raw) throw new Error("No pending OAuth2 flow");

  const pending: PendingFlow = JSON.parse(raw);
  if (pending.state !== state) throw new Error("State mismatch — possible CSRF");

  sessionStorage.removeItem(PENDING_KEY);

  const body = new URLSearchParams({
    grant_type:    "authorization_code",
    code,
    redirect_uri:  pending.redirectUri,
    client_id:     pending.clientId,
    code_verifier: pending.verifier,
  });

  const res = await fetch(pending.tokenUrl, {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json" },
    body:    body.toString(),
  });

  if (!res.ok) throw new Error(`Token endpoint returned ${res.status}`);

  const json = await res.json() as Record<string, unknown>;
  const accessToken  = String(json["access_token"]  ?? "");
  const refreshToken = typeof json["refresh_token"] === "string" ? json["refresh_token"] : undefined;
  const expiresIn    = typeof json["expires_in"]    === "number"  ? json["expires_in"]    : 3600;

  if (!accessToken) throw new Error("No access_token in response");

  const stored: StoredToken = {
    accessToken,
    refreshToken,
    expiresAt: Date.now() + expiresIn * 1000,
  };
  sessionStorage.setItem(tokenKey(pending.connectionId), JSON.stringify(stored));

  return { connectionId: pending.connectionId };
}

export function getOAuth2Token(connectionId: string): string | null {
  try {
    const raw = sessionStorage.getItem(tokenKey(connectionId));
    if (!raw) return null;
    const stored: StoredToken = JSON.parse(raw);
    if (Date.now() < stored.expiresAt - 30_000) return stored.accessToken;
    return null;
  } catch {
    return null;
  }
}

export function hasOAuth2Token(connectionId: string): boolean {
  return getOAuth2Token(connectionId) !== null;
}

export async function refreshOAuth2Token(
  conn: ApiConnection
): Promise<string | null> {
  try {
    const raw = sessionStorage.getItem(tokenKey(conn.getId()));
    if (!raw) return null;
    const stored: StoredToken = JSON.parse(raw);
    if (!stored.refreshToken) return null;

    const cfg = conn.getOAuth2Config();
    if (!cfg) return null;

    const body = new URLSearchParams({
      grant_type:    "refresh_token",
      refresh_token: stored.refreshToken,
      client_id:     cfg.clientId,
    });

    const res = await fetch(cfg.tokenUrl, {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json" },
      body:    body.toString(),
    });

    if (!res.ok) return null;

    const json       = await res.json() as Record<string, unknown>;
    const newToken   = String(json["access_token"] ?? "");
    if (!newToken) return null;

    const expiresIn  = typeof json["expires_in"] === "number" ? json["expires_in"] : 3600;
    const newRefresh = typeof json["refresh_token"] === "string" ? json["refresh_token"] : stored.refreshToken;

    const updated: StoredToken = {
      accessToken:  newToken,
      refreshToken: newRefresh,
      expiresAt:    Date.now() + expiresIn * 1000,
    };
    sessionStorage.setItem(tokenKey(conn.getId()), JSON.stringify(updated));
    return newToken;
  } catch {
    return null;
  }
}

export function clearOAuth2Token(connectionId: string): void {
  sessionStorage.removeItem(tokenKey(connectionId));
}

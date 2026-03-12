import { deflateSync, inflateSync, strToU8, strFromU8 } from "fflate";
import type Profile from "@/class/Profiles";
import type ApiConnection from "@/class/ApiConnection";
import type { Dashboard } from "@/types/widget";
import { importBackup, type ImportResult } from "./profileBackup";

export const QR_WARN_BYTES = 2048;
export const QR_MAX_BYTES  = 3072;

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 8192;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.slice(i, i + chunk));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function fromBase64Url(encoded: string): Uint8Array {
  const b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

function shortenUUIDs(json: string): string {
  const map = new Map<string, string>();
  return json.replace(UUID_RE, (uuid) => {
    const key = uuid.toLowerCase();
    if (!map.has(key)) map.set(key, map.size.toString(36));
    return map.get(key)!;
  });
}

export function encodeProfileToQR(
  profile:     Profile,
  connections: ApiConnection[],
  dashboards:  Dashboard[],
): { data: string; sizeBytes: number } {
  const payload = {
    version:     "2.0",
    profile:     profile.toJSON(),
    connections: connections.map((c) => c.toJSON()),
    dashboards,
  };
  const json = shortenUUIDs(JSON.stringify(payload));
  const compressed = deflateSync(strToU8(json), { level: 9 });
  const data = toBase64Url(compressed);
  return { data, sizeBytes: data.length };
}

export function buildQRUrl(compressedData: string): string {
  const base = (import.meta.env.VITE_QR_BASE_URL as string | undefined)?.replace(/\/$/, "")
    ?? (window.location.origin + import.meta.env.BASE_URL.replace(/\/$/, ""));
  return `${base}/no-profile#import?data=${compressedData}`;
}

export function decodeProfileFromQR(encoded: string): ImportResult {
  if (encoded.length > 100_000) return { ok: false, error: "backup.parseError" };
  try {
    const json = strFromU8(inflateSync(fromBase64Url(encoded)));
    if (!json) return { ok: false, error: "backup.parseError" };
    return importBackup(json);
  } catch {
    return { ok: false, error: "backup.parseError" };
  }
}

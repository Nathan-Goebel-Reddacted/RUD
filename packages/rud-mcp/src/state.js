#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from "fs";
import { randomUUID } from "crypto";
import { deflateSync, strToU8 } from "fflate";

export const STATE_FILE = "rud-state.json";

const DEFAULT_STATE = () => ({
  version:     "2.0",
  exportedAt:  new Date().toISOString(),
  profile: {
    profileName:      "MCP Dashboard",
    language:         "en",
    backgroundColor:  "#242424",
    borderColor:      "#888888",
    textColor:        "#646cff",
    textHoverColor:   "#535bf2",
    displayMode:      "timer",
    displayInterval:  30,
    scrollSpeed:      0,
    loopPauseMs:      2000,
    variables:        {},
    animationsEnabled: true,
  },
  connections: [],
  dashboards: [
    {
      id:              randomUUID(),
      title:           "Dashboard 1",
      refreshInterval: 30,
      showInDisplay:   true,
      widgets:         [],
    },
  ],
});

export function loadState() {
  if (!existsSync(STATE_FILE)) return DEFAULT_STATE();
  try {
    return JSON.parse(readFileSync(STATE_FILE, "utf8"));
  } catch {
    return DEFAULT_STATE();
  }
}

export function saveState(state) {
  state.exportedAt = new Date().toISOString();
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
}

// ─── URL generation ───────────────────────────────────────────────────────────

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

function shortenUUIDs(json) {
  const map = new Map();
  return json.replace(UUID_RE, (uuid) => {
    const key = uuid.toLowerCase();
    if (!map.has(key)) map.set(key, map.size.toString(36));
    return map.get(key);
  });
}

function toBase64Url(bytes) {
  let binary = "";
  const chunk = 8192;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.slice(i, i + chunk));
  }
  return Buffer.from(binary, "binary").toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export function generateImportUrl(state, appBaseUrl = "http://localhost:5173") {
  const payload = {
    version:     state.version,
    profile:     state.profile,
    connections: state.connections,
    dashboards:  state.dashboards,
  };
  const json       = shortenUUIDs(JSON.stringify(payload));
  const compressed = deflateSync(strToU8(json), { level: 9 });
  const data       = toBase64Url(compressed);
  const base       = appBaseUrl.replace(/\/$/, "");
  return `${base}/no-profile#import?data=${data}`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function uuid() {
  return randomUUID();
}

export function findConnection(state, connectionId) {
  return state.connections.find((c) => c.id === connectionId) ?? null;
}

export function getDashboard(state, index = 0) {
  return state.dashboards[index] ?? null;
}

export function nextWidgetPosition(widgets) {
  if (widgets.length === 0) return { x: 0, y: 0, w: 4, h: 3 };
  const maxY = Math.max(...widgets.map((w) => (w.position?.y ?? w.y ?? 0) + (w.position?.h ?? w.h ?? 3)));
  return { x: 0, y: maxY, w: 4, h: 3 };
}

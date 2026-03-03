import type { Dashboard } from "@/types/widget";
import ApiConnection from "@/class/ApiConnection";
import Profile from "@/class/Profiles";

export type ProfileBackup = {
  version: "1.0";
  exportedAt: string;
  profile: object;
  connections: object[];
  dashboard: Dashboard;
};

export function exportBackup(
  profile: Profile,
  connections: ApiConnection[],
  dashboard: Dashboard
): void {
  const data: ProfileBackup = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    profile: profile.toJSON(),
    connections: connections.map((c) => c.toJSON()),
    dashboard,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${profile.getProfileName().replace(/\s+/g, "-")}-backup.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export type ImportResult =
  | { ok: true; profile: Profile; connections: ApiConnection[]; dashboard: Dashboard }
  | { ok: false; error: string };

export function importBackup(json: string): ImportResult {
  try {
    const data = JSON.parse(json) as Record<string, unknown>;

    if (data.version !== "1.0") {
      return { ok: false, error: "backup.invalidVersion" };
    }

    const profile = Profile.fromJSON(data.profile);
    if (!profile) {
      return { ok: false, error: "backup.invalidProfile" };
    }

    const connections: ApiConnection[] = [];
    if (Array.isArray(data.connections)) {
      for (const raw of data.connections) {
        const c = ApiConnection.fromJSON(raw);
        if (c) connections.push(c);
      }
    }

    const dashboard = data.dashboard as Dashboard;
    if (!dashboard || typeof dashboard.id !== "string") {
      return { ok: false, error: "backup.invalidDashboard" };
    }

    return { ok: true, profile, connections, dashboard };
  } catch {
    return { ok: false, error: "backup.parseError" };
  }
}

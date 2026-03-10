import type { Dashboard } from "@/types/widget";
import ApiConnection from "@/class/ApiConnection";
import Profile from "@/class/Profiles";

export type ProfileBackupV1 = {
  version:     "1.0";
  exportedAt:  string;
  profile:     Record<string, unknown>;
  connections: Record<string, unknown>[];
  dashboard:   Dashboard;
};

export type ProfileBackupV2 = {
  version:     "2.0";
  exportedAt:  string;
  profile:     Record<string, unknown>;
  connections: Record<string, unknown>[];
  dashboards:  Dashboard[];
};

export type ProfileBackup = ProfileBackupV1 | ProfileBackupV2;

export function exportBackup(
  profile:     Profile,
  connections: ApiConnection[],
  dashboards:  Dashboard[],
): void {
  const data: ProfileBackupV2 = {
    version:     "2.0",
    exportedAt:  new Date().toISOString(),
    profile:     profile.toJSON() as Record<string, unknown>,
    connections: connections.map((c) => c.toJSON() as Record<string, unknown>),
    dashboards,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${profile.getProfileName().replace(/\s+/g, "-")}-backup.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export type ImportResult =
  | { ok: true; profile: Profile; connections: ApiConnection[]; dashboards: Dashboard[] }
  | { ok: false; error: string };

export function importBackup(json: string): ImportResult {
  try {
    const data = JSON.parse(json) as Record<string, unknown>;

    if (data.version !== "1.0" && data.version !== "2.0") {
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

    let dashboards: Dashboard[];

    if (data.version === "1.0") {
      const d = data.dashboard as Dashboard;
      if (!d || typeof d.id !== "string") {
        return { ok: false, error: "backup.invalidDashboard" };
      }
      dashboards = [d];
    } else {
      // v2.0
      if (!Array.isArray(data.dashboards) || data.dashboards.length === 0) {
        return { ok: false, error: "backup.invalidDashboard" };
      }
      const valid = (data.dashboards as Dashboard[]).filter((d) => d && typeof d.id === "string");
      if (valid.length === 0) {
        return { ok: false, error: "backup.invalidDashboard" };
      }
      dashboards = valid;
    }

    return { ok: true, profile, connections, dashboards };
  } catch {
    return { ok: false, error: "backup.parseError" };
  }
}

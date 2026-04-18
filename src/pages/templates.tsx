import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { encodeObjectToImportUrl } from "@/services/profileQR";

type TemplateEntry = {
  id:          string;
  file:        string;
  name:        string;
  description: string;
  tags:        string[];
  apis:        string[];
};

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; templates: TemplateEntry[] };

type ImportState = Record<string, "idle" | "loading" | "error">;

export default function Templates() {
  const { t } = useTranslation();
  const [state,       setState]       = useState<State>({ status: "loading" });
  const [importState, setImportState] = useState<ImportState>({});

  useEffect(() => {
    fetch("templates/index.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<TemplateEntry[]>;
      })
      .then((templates) => setState({ status: "ok", templates }))
      .catch((e: unknown) => setState({ status: "error", message: String(e) }));
  }, []);

  const handleImport = async (entry: TemplateEntry) => {
    setImportState((prev) => ({ ...prev, [entry.id]: "loading" }));
    try {
      const res = await fetch(`templates/${entry.file}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload = await res.json();
      const url = encodeObjectToImportUrl(payload);
      window.location.href = url;
    } catch {
      setImportState((prev) => ({ ...prev, [entry.id]: "error" }));
      setTimeout(() => setImportState((prev) => ({ ...prev, [entry.id]: "idle" })), 3000);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 style={{ marginBottom: "0.25rem" }}>{t("templates.title")}</h1>
      <p style={{ opacity: 0.55, marginBottom: "2rem", fontSize: "0.9rem" }}>
        {t("templates.subtitle")}
      </p>

      {state.status === "loading" && (
        <p style={{ opacity: 0.5 }}>{t("templates.loading")}</p>
      )}

      {state.status === "error" && (
        <p style={{ color: "var(--danger-color)" }}>{t("templates.loadError")}</p>
      )}

      {state.status === "ok" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1.25rem" }}>
          {state.templates.map((entry) => {
            const istate = importState[entry.id] ?? "idle";
            return (
              <div
                key={entry.id}
                style={{
                  background: "var(--background-color)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                  padding: "1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: "1rem" }}>{entry.name}</h3>
                  <p style={{ margin: "0.4rem 0 0", fontSize: "0.83rem", opacity: 0.65, lineHeight: 1.4 }}>
                    {entry.description}
                  </p>
                </div>

                {entry.apis.length > 0 && (
                  <div style={{ fontSize: "0.75rem", opacity: 0.45 }}>
                    API: {entry.apis.join(", ")}
                  </div>
                )}

                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                  {entry.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: "0.7rem",
                        padding: "0.15rem 0.5rem",
                        borderRadius: "999px",
                        background: "var(--border-color)",
                        opacity: 0.7,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <button
                  style={{ marginTop: "auto" }}
                  disabled={istate === "loading"}
                  onClick={() => handleImport(entry)}
                >
                  {istate === "loading"
                    ? t("templates.importing")
                    : istate === "error"
                    ? t("templates.importError")
                    : t("templates.import")}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <p style={{ marginTop: "2.5rem", fontSize: "0.8rem", opacity: 0.4 }}>
        {t("templates.contribute")}
      </p>
    </div>
  );
}

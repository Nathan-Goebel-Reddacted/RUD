import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { SearchConfig } from "@/types/widget";
import type { Widget } from "@/types/widget";
import { useApiStore } from "@/stores/apiStore";
import { fetchWidgetData } from "@/services/widgetFetch";
import { useProfileStore } from "@/stores/profileStore";

type Props = {
  widget: Widget;
};

export default function SearchWidget({ widget }: Props) {
  const { t } = useTranslation();
  const c = widget.config as SearchConfig;

  const connections  = useApiStore((s) => s.connections);
  const profileVars  = useProfileStore((s) => s.profile?.getVariables?.() ?? {});

  const conn = connections.find((cc) => cc.getId() === c.connectionId);
  const ep   = conn?.getEndpoints().find((e) => e.getId() === c.endpointId);

  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState<unknown[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef    = useRef<AbortController | null>(null);

  const minChars = c.minChars ?? 1;

  function triggerSearch(term: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    if (term.length < minChars) {
      setResults(null);
      setError(null);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      if (!conn || !ep) {
        setError(t("widgetCard.error.endpointNotFound"));
        return;
      }
      abortRef.current = new AbortController();
      setLoading(true);
      setError(null);
      try {
        const res = await fetchWidgetData(
          conn, ep, c.dataPath ?? "", abortRef.current.signal, profileVars,
          { [c.queryParam]: term },
        );
        if (res.error) {
          setError(res.error);
          setResults(null);
        } else {
          const arr = Array.isArray(res.data) ? res.data : res.data != null ? [res.data] : [];
          setResults(arr);
        }
      } catch {
        // aborted — ignore
      } finally {
        setLoading(false);
      }
    }, 300);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    triggerSearch(val);
  }

  // ── Result table ──────────────────────────────────────────────────────────
  const rows = (results ?? []).filter(
    (r): r is Record<string, unknown> => typeof r === "object" && r !== null,
  );

  const visibleColumns: Array<{ key: string; label: string; width?: number }> =
    c.columns && c.columns.length > 0
      ? c.columns
      : rows.length > 0
        ? Object.keys(rows[0]).map((k) => ({ key: k, label: k }))
        : [];

  return (
    <div className="search-widget">
      <div className="search-widget__input-row">
        <input
          className="search-widget__input"
          type="search"
          placeholder={c.placeholder ?? t("widgetSearch.placeholder")}
          value={query}
          onChange={handleChange}
          autoComplete="off"
        />
        {loading && <span className="search-widget__spinner" />}
      </div>

      {error && (
        <p className="search-widget__error">⚠ {error}</p>
      )}

      {!error && results === null && (
        <p className="search-widget__hint">
          {minChars > 1
            ? t("widgetSearch.typeMinChars", { count: minChars })
            : t("widgetSearch.typeToSearch")}
        </p>
      )}

      {!error && results !== null && rows.length === 0 && (
        <p className="search-widget__hint">{t("widgetSearch.noResults")}</p>
      )}

      {!error && rows.length > 0 && (
        <div className="search-widget__results">
          <table className="widget-table">
            <thead>
              <tr>
                {visibleColumns.map((col) => (
                  <th key={col.key} style={col.width ? { width: col.width } : undefined}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  {visibleColumns.map((col) => (
                    <td key={col.key}>
                      {row[col.key] !== undefined && row[col.key] !== null
                        ? String(row[col.key])
                        : "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

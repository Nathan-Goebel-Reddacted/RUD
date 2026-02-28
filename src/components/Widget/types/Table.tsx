import type { TableConfig } from "@/types/widget";

type Props = {
  data:   unknown;
  config: TableConfig;
};

export default function Table({ data, config }: Props) {
  const { columns, maxRows } = config;

  const rows: Record<string, unknown>[] = (() => {
    if (!Array.isArray(data)) return [];
    const slice = maxRows !== undefined ? data.slice(0, maxRows) : data;
    return slice.filter((r): r is Record<string, unknown> => typeof r === "object" && r !== null);
  })();

  if (rows.length === 0) {
    return <p className="widget-table__empty">No data</p>;
  }

  const visibleColumns: Array<{ key: string; label: string; width?: number }> =
    columns.length > 0
      ? columns
      : Object.keys(rows[0]).map((k) => ({ key: k, label: k }));

  return (
    <div className="widget-table__wrapper">
      <table className="widget-table">
        <thead>
          <tr>
            {visibleColumns.map((col) => (
              <th
                key={col.key}
                style={col.width ? { width: col.width } : undefined}
              >
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
  );
}

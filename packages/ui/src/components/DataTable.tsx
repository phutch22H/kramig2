import React from "react";

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  onRowClick,
  emptyMessage = "No data available",
}: DataTableProps<T>) {
  const tableStyle: React.CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  };

  const thStyle: React.CSSProperties = {
    textAlign: "left",
    padding: "12px 16px",
    borderBottom: "2px solid #e5e7eb",
    fontWeight: 600,
    color: "#374151",
    backgroundColor: "#f9fafb",
  };

  const tdStyle: React.CSSProperties = {
    padding: "12px 16px",
    borderBottom: "1px solid #e5e7eb",
    color: "#111827",
  };

  const rowStyle: React.CSSProperties = {
    cursor: onRowClick ? "pointer" : "default",
    transition: "background-color 100ms",
  };

  const emptyStyle: React.CSSProperties = {
    padding: "32px 16px",
    textAlign: "center",
    color: "#6b7280",
  };

  if (data.length === 0) {
    return (
      <table style={tableStyle}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={thStyle}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={emptyStyle} colSpan={columns.length}>
              {emptyMessage}
            </td>
          </tr>
        </tbody>
      </table>
    );
  }

  return (
    <table style={tableStyle}>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key} style={thStyle}>
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((item, idx) => (
          <tr
            key={idx}
            style={rowStyle}
            onClick={() => onRowClick?.(item)}
          >
            {columns.map((col) => (
              <td key={col.key} style={tdStyle}>
                {col.render
                  ? col.render(item)
                  : (item[col.key] as React.ReactNode) ?? ""}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

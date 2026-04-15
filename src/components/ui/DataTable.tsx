"use client";
import React from "react";

interface Column<T> { key: string; label: string; align?: "left" | "right"; render?: (val: unknown, row: T) => React.ReactNode; }

export function DataTable<T extends Record<string, unknown>>({ columns, data, onRowClick, emptyMessage = "No data", loading = false }: {
  columns: Column<T>[]; data: T[]; onRowClick?: (row: T) => void; emptyMessage?: string; loading?: boolean;
}) {
  if (loading) return (
    <div style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-surface-4)", borderRadius: 12, padding: 48, textAlign: "center" }}>
      <span style={{ color: "#555d6f", fontSize: 13 }}>Loading...</span>
    </div>
  );
  return (
    <div style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-surface-4)", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-surface-4)" }}>
              {columns.map((c) => (
                <th key={c.key} style={{ padding: "10px 14px", fontSize: 10, fontWeight: 600, color: "#555d6f", textTransform: "uppercase", letterSpacing: "0.06em", textAlign: c.align || "left" }}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan={columns.length} style={{ padding: 40, textAlign: "center", fontSize: 13, color: "#555d6f" }}>{emptyMessage}</td></tr>
            ) : data.map((row, i) => (
              <tr key={i} onClick={() => onRowClick?.(row)} style={{ borderBottom: "1px solid rgba(45,50,61,0.5)", cursor: onRowClick ? "pointer" : "default", transition: "background 0.15s" }}
                onMouseEnter={(e) => { if (onRowClick) (e.currentTarget as HTMLElement).style.background = "rgba(35,39,48,0.5)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}>
                {columns.map((c) => (
                  <td key={c.key} style={{ padding: "10px 14px", fontSize: 13, textAlign: c.align || "left", fontFamily: c.align === "right" ? "var(--font-mono)" : "inherit" }}>
                    {c.render ? c.render(row[c.key], row) : String(row[c.key] ?? "-")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

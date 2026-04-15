"use client";

export function StatCard({ label, value, prefix, suffix, format = "number", className }: {
  label: string; value: string | number; prefix?: string; suffix?: string;
  format?: "number" | "currency" | "percent"; className?: string;
}) {
  const fmt = (v: string | number) => {
    const n = typeof v === "string" ? parseFloat(v) : v;
    if (isNaN(n)) return String(v);
    if (format === "currency") return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(2)}`;
    if (format === "percent") return `${n.toFixed(2)}%`;
    return n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toFixed(0);
  };
  return (
    <div className={className} style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-surface-4)", borderRadius: 12, padding: "14px 16px" }}>
      <p style={{ fontSize: 10, fontWeight: 600, color: "#555d6f", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
      <div style={{ marginTop: 6, display: "flex", alignItems: "baseline", gap: 3 }}>
        {prefix && <span style={{ fontSize: 13, color: "#555d6f" }}>{prefix}</span>}
        <span style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-mono)", letterSpacing: "-0.02em" }}>{fmt(value)}</span>
        {suffix && <span style={{ fontSize: 13, color: "#555d6f" }}>{suffix}</span>}
      </div>
    </div>
  );
}

"use client";
import { useState, useEffect, useRef } from "react";
import type { CampaignStatus, DashboardFilters, DeviceType, TrafficSource } from "@/types";

// ---- Status Badge ----
const statusStyles: Record<CampaignStatus, { bg: string; color: string; border: string }> = {
  draft: { bg: "rgba(107,114,128,0.12)", color: "#9ca3af", border: "rgba(107,114,128,0.2)" },
  active: { bg: "rgba(34,197,94,0.12)", color: "#4ade80", border: "rgba(34,197,94,0.2)" },
  paused: { bg: "rgba(245,158,11,0.12)", color: "#fbbf24", border: "rgba(245,158,11,0.2)" },
  archived: { bg: "rgba(239,68,68,0.12)", color: "#f87171", border: "rgba(239,68,68,0.2)" },
};
export function StatusBadge({ status }: { status: CampaignStatus }) {
  const s = statusStyles[status] || statusStyles.draft;
  return <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", fontSize: 11, fontWeight: 500, borderRadius: 99, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{status}</span>;
}

// ---- Modal ----
export function Modal({ open, onClose, title, children, size = "md" }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: "sm" | "md" | "lg";
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) { document.addEventListener("keydown", h); document.body.style.overflow = "hidden"; }
    return () => { document.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [open, onClose]);
  if (!open) return null;
  const w = size === "sm" ? 420 : size === "lg" ? 640 : 520;
  return (
    <div ref={ref} onClick={(e) => { if (e.target === ref.current) onClose(); }}
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} />
      <div style={{ position: "relative", background: "var(--color-surface-2)", border: "1px solid var(--color-surface-4)", borderRadius: 16, width: "100%", maxWidth: w, maxHeight: "85vh", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid var(--color-surface-4)" }}>
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8b93a6", cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>
        <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

// ---- Filter Bar ----
const PRESETS = [{ label: "Today", days: 0 }, { label: "7d", days: 7 }, { label: "14d", days: 14 }, { label: "30d", days: 30 }];
export function FilterBar({ filters, onChange, showSource = false }: {
  filters: DashboardFilters; onChange: (f: DashboardFilters) => void; showSource?: boolean;
}) {
  const [active, setActive] = useState(0);
  const preset = (days: number, i: number) => {
    setActive(i);
    const to = new Date().toISOString().split("T")[0];
    const from = days === 0 ? to : new Date(Date.now() - days * 864e5).toISOString().split("T")[0];
    onChange({ ...filters, date_from: from, date_to: to });
  };
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
      <div style={{ display: "flex", background: "var(--color-surface-2)", borderRadius: 8, border: "1px solid var(--color-surface-4)", padding: 2 }}>
        {PRESETS.map((p, i) => (
          <button key={p.label} onClick={() => preset(p.days, i)} style={{
            padding: "5px 12px", fontSize: 11, fontWeight: 500, borderRadius: 6, border: "none", cursor: "pointer", transition: "all 0.15s",
            background: active === i ? "var(--color-brand-600)" : "transparent",
            color: active === i ? "#fff" : "#8b93a6",
          }}>{p.label}</button>
        ))}
      </div>
      <input type="date" value={filters.date_from || ""} onChange={(e) => { setActive(-1); onChange({ ...filters, date_from: e.target.value }); }}
        style={{ width: 130, padding: "4px 8px", fontSize: 11, background: "var(--color-surface-1)", border: "1px solid var(--color-surface-4)", borderRadius: 6, color: "#e2e4e9" }} />
      <span style={{ color: "#555d6f", fontSize: 11 }}>to</span>
      <input type="date" value={filters.date_to || ""} onChange={(e) => { setActive(-1); onChange({ ...filters, date_to: e.target.value }); }}
        style={{ width: 130, padding: "4px 8px", fontSize: 11, background: "var(--color-surface-1)", border: "1px solid var(--color-surface-4)", borderRadius: 6, color: "#e2e4e9" }} />
      <input type="text" placeholder="Country" value={filters.country_code || ""} maxLength={2}
        onChange={(e) => onChange({ ...filters, country_code: e.target.value.toUpperCase() || undefined })}
        style={{ width: 80, padding: "4px 8px", fontSize: 11, background: "var(--color-surface-1)", border: "1px solid var(--color-surface-4)", borderRadius: 6, color: "#e2e4e9" }} />
      <select value={filters.device || ""} onChange={(e) => onChange({ ...filters, device: (e.target.value as DeviceType) || undefined })}
        style={{ width: 100, padding: "4px 8px", fontSize: 11, background: "var(--color-surface-1)", border: "1px solid var(--color-surface-4)", borderRadius: 6, color: "#e2e4e9" }}>
        <option value="">All devices</option><option value="desktop">Desktop</option><option value="mobile">Mobile</option><option value="tablet">Tablet</option>
      </select>
      {showSource && (
        <select value={filters.traffic_source || ""} onChange={(e) => onChange({ ...filters, traffic_source: (e.target.value as TrafficSource) || undefined })}
          style={{ width: 100, padding: "4px 8px", fontSize: 11, background: "var(--color-surface-1)", border: "1px solid var(--color-surface-4)", borderRadius: 6, color: "#e2e4e9" }}>
          <option value="">All sources</option><option value="taboola">Taboola</option><option value="meta">Meta</option><option value="google">Google</option><option value="tiktok">TikTok</option>
        </select>
      )}
    </div>
  );
}

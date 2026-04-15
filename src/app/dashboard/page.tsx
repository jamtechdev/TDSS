"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatCard } from "@/components/ui/StatCard";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge, FilterBar } from "@/components/ui/Shared";
import { useFetch } from "@/hooks/useFetch";
import type { CampaignSummary, CampaignStatus, DashboardFilters } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<DashboardFilters>({ date_from: new Date().toISOString().split("T")[0], date_to: new Date().toISOString().split("T")[0] });
  const { data, loading } = useFetch<{ campaigns: CampaignSummary[] }>("/api/campaigns");
  const campaigns = data?.campaigns || [];
  const t = campaigns.reduce((a, c) => ({ visits: a.visits + (c.total_visits || 0), clicks: a.clicks + (c.total_clicks || 0), conversions: a.conversions + (c.total_conversions || 0), revenue: a.revenue + (c.total_revenue || 0), cost: a.cost + (c.total_cost || 0), profit: a.profit + (c.total_profit || 0) }), { visits: 0, clicks: 0, conversions: 0, revenue: 0, cost: 0, profit: 0 });
  const ctr = t.visits > 0 ? (t.clicks / t.visits) * 100 : 0;
  const cr = t.clicks > 0 ? (t.conversions / t.clicks) * 100 : 0;
  const roi = t.cost > 0 ? ((t.revenue - t.cost) / t.cost) * 100 : 0;
  const epc = t.clicks > 0 ? t.revenue / t.clicks : 0;

  const columns = [
    { key: "name", label: "Campaign", render: (_: unknown, r: CampaignSummary) => (<div><div style={{ fontWeight: 500 }}>{r.name}</div><div style={{ fontSize: 11, color: "#555d6f", fontFamily: "var(--font-mono)", marginTop: 2 }}>{r.slug}</div></div>) },
    { key: "status", label: "Status", render: (v: unknown) => <StatusBadge status={v as CampaignStatus} /> },
    { key: "total_visits", label: "Visits", align: "right" as const, render: (v: unknown) => (v as number).toLocaleString() },
    { key: "total_clicks", label: "Clicks", align: "right" as const, render: (v: unknown) => (v as number).toLocaleString() },
    { key: "avg_ctr", label: "CTR", align: "right" as const, render: (v: unknown) => `${(v as number).toFixed(2)}%` },
    { key: "total_conversions", label: "Conv.", align: "right" as const },
    { key: "total_revenue", label: "Revenue", align: "right" as const, render: (v: unknown) => <span style={{ color: "var(--color-green)" }}>${(v as number).toFixed(2)}</span> },
    { key: "total_cost", label: "Cost", align: "right" as const, render: (v: unknown) => <span style={{ color: "var(--color-red)" }}>${(v as number).toFixed(2)}</span> },
    { key: "total_profit", label: "Profit", align: "right" as const, render: (v: unknown) => { const p = v as number; return <span style={{ color: p >= 0 ? "var(--color-green)" : "var(--color-red)" }}>{p >= 0 ? "+" : ""}${p.toFixed(2)}</span>; } },
    { key: "avg_roi", label: "ROI", align: "right" as const, render: (v: unknown) => { const r = v as number; return <span style={{ color: r >= 0 ? "var(--color-green)" : "var(--color-red)" }}>{r >= 0 ? "+" : ""}{r.toFixed(1)}%</span>; } },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>Dashboard</h1>
          <p style={{ fontSize: 13, color: "#555d6f", marginTop: 4 }}>Global performance overview</p>
        </div>
        <FilterBar filters={filters} onChange={setFilters} showSource />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10 }}>
        <StatCard label="Visits" value={t.visits} />
        <StatCard label="Clicks" value={t.clicks} />
        <StatCard label="CTR" value={ctr} format="percent" />
        <StatCard label="Conversions" value={t.conversions} />
        <StatCard label="CR" value={cr} format="percent" />
        <StatCard label="Revenue" value={t.revenue} format="currency" />
        <StatCard label="Cost" value={t.cost} format="currency" />
        <StatCard label="Profit" value={t.profit} format="currency" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        <div style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-surface-4)", borderRadius: 12, padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: "rgba(26,108,245,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📈</div>
          <div><p style={{ fontSize: 10, fontWeight: 600, color: "#555d6f", textTransform: "uppercase", letterSpacing: "0.06em" }}>ROI</p><p style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-mono)", color: roi >= 0 ? "var(--color-green)" : "var(--color-red)" }}>{roi >= 0 ? "+" : ""}{roi.toFixed(1)}%</p></div>
        </div>
        <div style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-surface-4)", borderRadius: 12, padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: "rgba(6,182,212,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🎯</div>
          <div><p style={{ fontSize: 10, fontWeight: 600, color: "#555d6f", textTransform: "uppercase", letterSpacing: "0.06em" }}>EPC</p><p style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-mono)" }}>${epc.toFixed(2)}</p></div>
        </div>
        <div style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-surface-4)", borderRadius: 12, padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: "rgba(245,158,11,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⚡</div>
          <div><p style={{ fontSize: 10, fontWeight: 600, color: "#555d6f", textTransform: "uppercase", letterSpacing: "0.06em" }}>Active Campaigns</p><p style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-mono)" }}>{campaigns.filter(c => c.status === "active").length}</p></div>
        </div>
      </div>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600 }}>All Campaigns</h2>
          <button onClick={() => router.push("/dashboard/campaigns/new")} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "var(--color-brand-600)", color: "#fff", fontSize: 13, fontWeight: 500, borderRadius: 8, border: "none", cursor: "pointer" }}>+ New Campaign</button>
        </div>
        <DataTable columns={columns} data={campaigns} loading={loading} onRowClick={(r) => router.push(`/dashboard/campaigns/${r.id}`)} emptyMessage="No campaigns yet. Create your first campaign to get started." />
      </div>
    </div>
  );
}

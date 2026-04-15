"use client";
import { useState } from "react";
import { useFetch } from "@/hooks/useFetch";
import { StatCard } from "@/components/ui/StatCard";
import { FilterBar } from "@/components/ui/Shared";
import { DataTable } from "@/components/ui/DataTable";
import type { CampaignSummary, DashboardFilters } from "@/types";

export default function ReportsPage() {
  const [filters, setFilters] = useState<DashboardFilters>({ date_from: new Date(Date.now() - 30 * 864e5).toISOString().split("T")[0], date_to: new Date().toISOString().split("T")[0] });
  const [groupBy, setGroupBy] = useState("date");
  const [campaign, setCampaign] = useState("");
  const { data: cd } = useFetch<{ campaigns: CampaignSummary[] }>("/api/campaigns");
  const campaigns = cd?.campaigns || [];
  const qp = new URLSearchParams();
  if (campaign) qp.set("campaign_id", campaign);
  if (filters.date_from) qp.set("date_from", filters.date_from);
  if (filters.date_to) qp.set("date_to", filters.date_to);
  if (filters.country_code) qp.set("country", filters.country_code);
  if (filters.device) qp.set("device", filters.device);
  qp.set("group_by", groupBy);
  const { data: kd, loading } = useFetch<{ kpis: Array<Record<string, unknown>> }>(`/api/kpi?${qp.toString()}`);
  const kpis = kd?.kpis || [];
  const t = kpis.reduce<{ visits: number; clicks: number; conversions: number; revenue: number; cost: number; profit: number }>(
    (a, k) => ({
      visits: a.visits + ((k.visits as number) || 0),
      clicks: a.clicks + ((k.clicks as number) || 0),
      conversions: a.conversions + ((k.conversions as number) || 0),
      revenue: a.revenue + ((k.revenue as number) || 0),
      cost: a.cost + ((k.cost as number) || 0),
      profit: a.profit + ((k.profit as number) || 0),
    }),
    { visits: 0, clicks: 0, conversions: 0, revenue: 0, cost: 0, profit: 0 }
  );

  const columns = [
    { key: "key", label: groupBy.charAt(0).toUpperCase() + groupBy.slice(1), render: (v: unknown) => <span style={{ fontWeight: 500 }}>{(v as string) || "Unknown"}</span> },
    { key: "visits", label: "Visits", align: "right" as const, render: (v: unknown) => (v as number).toLocaleString() },
    { key: "clicks", label: "Clicks", align: "right" as const, render: (v: unknown) => (v as number).toLocaleString() },
    { key: "ctr", label: "CTR", align: "right" as const, render: (v: unknown) => `${(v as number).toFixed(2)}%` },
    { key: "conversions", label: "Conv.", align: "right" as const },
    { key: "cr", label: "CR", align: "right" as const, render: (v: unknown) => `${(v as number).toFixed(2)}%` },
    { key: "revenue", label: "Revenue", align: "right" as const, render: (v: unknown) => <span style={{ color: "var(--color-green)" }}>${(v as number).toFixed(2)}</span> },
    { key: "cost", label: "Cost", align: "right" as const, render: (v: unknown) => <span style={{ color: "var(--color-red)" }}>${(v as number).toFixed(2)}</span> },
    { key: "profit", label: "Profit", align: "right" as const, render: (v: unknown) => { const p = v as number; return <span style={{ color: p >= 0 ? "var(--color-green)" : "var(--color-red)" }}>${p.toFixed(2)}</span>; } },
    { key: "roi", label: "ROI", align: "right" as const, render: (v: unknown) => { const r = v as number; return <span style={{ color: r >= 0 ? "var(--color-green)" : "var(--color-red)" }}>{r >= 0 ? "+" : ""}{r.toFixed(1)}%</span>; } },
    { key: "epc", label: "EPC", align: "right" as const, render: (v: unknown) => `$${(v as number).toFixed(2)}` },
    { key: "cpa", label: "CPA", align: "right" as const, render: (v: unknown) => `$${(v as number).toFixed(2)}` },
  ];

  const card = { background: "var(--color-surface-2)", border: "1px solid var(--color-surface-4)", borderRadius: 12, padding: 16 };
  const labelStyle = { display: "block" as const, fontSize: 12, fontWeight: 500, color: "#8b93a6", marginBottom: 4 };

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Reports</h1>
      <p style={{ fontSize: 13, color: "#555d6f", marginBottom: 20 }}>Detailed KPI breakdown and analysis</p>
      <div style={{ ...card, marginBottom: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
          <div><label style={labelStyle}>Campaign</label><select value={campaign} onChange={e => setCampaign(e.target.value)} style={{ width: 200 }}><option value="">All Campaigns</option>{campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label style={labelStyle}>Group By</label><select value={groupBy} onChange={e => setGroupBy(e.target.value)} style={{ width: 130 }}><option value="date">Date</option><option value="lander">Lander</option><option value="offer">Offer</option><option value="country">Country</option><option value="device">Device</option></select></div>
        </div>
        <FilterBar filters={filters} onChange={setFilters} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginBottom: 20 }}>
        <StatCard label="Visits" value={t.visits} /><StatCard label="Clicks" value={t.clicks} /><StatCard label="Conversions" value={t.conversions} /><StatCard label="Revenue" value={t.revenue} format="currency" /><StatCard label="Cost" value={t.cost} format="currency" /><StatCard label="Profit" value={t.profit} format="currency" />
      </div>
      <DataTable columns={columns} data={kpis} loading={loading} emptyMessage="No KPI data for selected filters" />
    </div>
  );
}

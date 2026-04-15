"use client";
import { useRouter } from "next/navigation";
import { useFetch } from "@/hooks/useFetch";
import { DataTable } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/Shared";
import type { CampaignSummary, CampaignStatus } from "@/types";

export default function CampaignsPage() {
  const router = useRouter();
  const { data, loading } = useFetch<{ campaigns: CampaignSummary[] }>("/api/campaigns");
  const campaigns = data?.campaigns || [];
  const columns = [
    { key: "name", label: "Campaign", render: (_: unknown, r: CampaignSummary) => (<div><div style={{ fontWeight: 500 }}>{r.name}</div><div style={{ fontSize: 11, color: "#555d6f", fontFamily: "var(--font-mono)", marginTop: 2 }}>{r.slug}</div></div>) },
    { key: "status", label: "Status", render: (v: unknown) => <StatusBadge status={v as CampaignStatus} /> },
    { key: "total_visits", label: "Visits", align: "right" as const, render: (v: unknown) => (v as number).toLocaleString() },
    { key: "total_clicks", label: "Clicks", align: "right" as const, render: (v: unknown) => (v as number).toLocaleString() },
    { key: "avg_ctr", label: "CTR", align: "right" as const, render: (v: unknown) => `${(v as number).toFixed(2)}%` },
    { key: "total_revenue", label: "Revenue", align: "right" as const, render: (v: unknown) => <span style={{ color: "var(--color-green)" }}>${(v as number).toFixed(2)}</span> },
    { key: "total_profit", label: "Profit", align: "right" as const, render: (v: unknown) => { const p = v as number; return <span style={{ color: p >= 0 ? "var(--color-green)" : "var(--color-red)" }}>{p >= 0 ? "+" : ""}${p.toFixed(2)}</span>; } },
    { key: "avg_roi", label: "ROI", align: "right" as const, render: (v: unknown) => { const r = v as number; return <span style={{ color: r >= 0 ? "var(--color-green)" : "var(--color-red)" }}>{r >= 0 ? "+" : ""}{r.toFixed(1)}%</span>; } },
  ];
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div><h1 style={{ fontSize: 22, fontWeight: 700 }}>Campaigns</h1><p style={{ fontSize: 13, color: "#555d6f", marginTop: 4 }}>{campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""}</p></div>
        <button onClick={() => router.push("/dashboard/campaigns/new")} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "var(--color-brand-600)", color: "#fff", fontSize: 13, fontWeight: 500, borderRadius: 8, border: "none", cursor: "pointer" }}>+ New Campaign</button>
      </div>
      <DataTable columns={columns} data={campaigns} loading={loading} onRowClick={(r) => router.push(`/dashboard/campaigns/${r.id}`)} emptyMessage="No campaigns yet." />
    </div>
  );
}

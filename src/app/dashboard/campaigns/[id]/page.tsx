"use client";
import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { useFetch, apiPut } from "@/hooks/useFetch";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/Shared";
import { DataTable } from "@/components/ui/DataTable";
import type { Campaign } from "@/types";

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [copied, setCopied] = useState<string | null>(null);
  const [showScript, setShowScript] = useState(false);
  const [abType, setAbType] = useState<"lander" | "offer">("lander");

  const { data, loading, refetch } = useFetch<{ campaign: Campaign; tracking_script: string; campaign_url: string }>(`/api/campaigns/${id}`);
  const { data: abData, loading: abLoading } = useFetch<{ results: Array<Record<string, unknown>> }>(`/api/ab-test?campaign_id=${id}&type=${abType}`);

  const campaign = data?.campaign;
  const script = data?.tracking_script || "";
  const url = data?.campaign_url || "";
  const abResults = abData?.results || [];

  const copy = (text: string, label: string) => { navigator.clipboard.writeText(text); setCopied(label); setTimeout(() => setCopied(null), 2000); };
  const toggle = async () => { if (!campaign) return; await apiPut(`/api/campaigns/${id}`, { status: campaign.status === "active" ? "paused" : "active" }); refetch(); };

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: "#555d6f" }}>Loading...</div>;
  if (!campaign) return <div style={{ textAlign: "center", padding: 60, color: "#555d6f" }}>Campaign not found</div>;

  const landers = campaign.landers || [];
  const offers = campaign.offers || [];
  const tv = abResults.reduce((s, r) => s + ((r.visits as number) || 0), 0);
  const tc = abResults.reduce((s, r) => s + ((r.clicks as number) || 0), 0);
  const tconv = abResults.reduce((s, r) => s + ((r.conversions as number) || 0), 0);
  const trev = abResults.reduce((s, r) => s + ((r.revenue as number) || 0), 0);
  const tcost = abResults.reduce((s, r) => s + ((r.cost as number) || 0), 0);

  const card = { background: "var(--color-surface-2)", border: "1px solid var(--color-surface-4)", borderRadius: 12, padding: 16 };
  const btnSec = { padding: "7px 14px", background: "var(--color-surface-3)", border: "1px solid var(--color-surface-4)", borderRadius: 8, color: "#e2e4e9", fontSize: 13, cursor: "pointer" as const, display: "inline-flex" as const, alignItems: "center" as const, gap: 6 };

  const abCols = [
    { key: "variant_name", label: "Variant", render: (_: unknown, r: Record<string, unknown>) => { const isWinner = r.is_winner === true; return (<div style={{ display: "flex", alignItems: "center", gap: 6 }}>{isWinner && <span>🏆</span>}<span style={{ fontWeight: isWinner ? 600 : 400, color: isWinner ? "var(--color-amber)" : "inherit" }}>{r.variant_name as string}</span></div>); } },
    { key: "weight", label: "Weight", align: "right" as const, render: (v: unknown) => `${v}%` },
    { key: "visits", label: "Visits", align: "right" as const, render: (v: unknown) => (v as number).toLocaleString() },
    { key: "clicks", label: "Clicks", align: "right" as const, render: (v: unknown) => (v as number).toLocaleString() },
    { key: "ctr", label: "CTR", align: "right" as const, render: (v: unknown) => `${(v as number).toFixed(2)}%` },
    { key: "conversions", label: "Conv.", align: "right" as const },
    { key: "cr", label: "CR", align: "right" as const, render: (v: unknown) => `${(v as number).toFixed(2)}%` },
    { key: "revenue", label: "Revenue", align: "right" as const, render: (v: unknown) => <span style={{ color: "var(--color-green)" }}>${(v as number).toFixed(2)}</span> },
    { key: "epc", label: "EPC", align: "right" as const, render: (v: unknown) => `$${(v as number).toFixed(2)}` },
    { key: "confidence", label: "Conf.", align: "right" as const, render: (v: unknown) => (<div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}><div style={{ width: 50, height: 5, borderRadius: 3, background: "var(--color-surface-4)", overflow: "hidden" }}><div style={{ height: "100%", borderRadius: 3, background: "var(--color-brand-500)", width: `${v}%` }} /></div><span style={{ fontSize: 11, color: "#8b93a6" }}>{v as number}%</span></div>) },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => router.back()} style={{ background: "none", border: "none", color: "#8b93a6", cursor: "pointer", fontSize: 18, marginTop: 4 }}>←</button>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}><h1 style={{ fontSize: 22, fontWeight: 700 }}>{campaign.name}</h1><StatusBadge status={campaign.status} /></div>
            <div style={{ display: "flex", gap: 12, marginTop: 4, fontSize: 13, color: "#555d6f" }}><span style={{ fontFamily: "var(--font-mono)" }}>{campaign.slug}</span><span style={{ textTransform: "uppercase", fontSize: 11 }}>{campaign.traffic_source}</span></div>
          </div>
        </div>
        <button onClick={toggle} style={btnSec}>{campaign.status === "active" ? "⏸ Pause" : "▶ Activate"}</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={card}><p style={{ fontSize: 10, fontWeight: 600, color: "#555d6f", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Campaign URL</p><div style={{ display: "flex", gap: 8 }}><code style={{ flex: 1, fontSize: 12, color: "var(--color-brand-400)", background: "var(--color-surface-1)", padding: "8px 12px", borderRadius: 8, fontFamily: "var(--font-mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{url}</code><button onClick={() => copy(url, "url")} style={btnSec}>{copied === "url" ? "✓" : "📋"}</button></div></div>
        <div style={card}><p style={{ fontSize: 10, fontWeight: 600, color: "#555d6f", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Tracking Script</p><div style={{ display: "flex", gap: 8 }}><button onClick={() => setShowScript(!showScript)} style={{ ...btnSec, flex: 1, justifyContent: "center" }}>{showScript ? "Hide" : "View Script"}</button><button onClick={() => copy(script, "script")} style={btnSec}>{copied === "script" ? "✓" : "📋"}</button></div></div>
      </div>
      {showScript && <div style={card}><pre style={{ fontSize: 11, color: "#d1d5db", fontFamily: "var(--font-mono)", whiteSpace: "pre-wrap", maxHeight: 240, overflowY: "auto", background: "var(--color-surface-1)", padding: 14, borderRadius: 8 }}>{script}</pre></div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
        <StatCard label="Visits" value={tv} /><StatCard label="Clicks" value={tc} /><StatCard label="Conversions" value={tconv} /><StatCard label="Revenue" value={trev} format="currency" /><StatCard label="Profit" value={trev - tcost} format="currency" />
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600 }}>A/B Test Results</h2>
          <div style={{ display: "flex", background: "var(--color-surface-2)", borderRadius: 8, border: "1px solid var(--color-surface-4)", padding: 2 }}>
            {(["lander", "offer"] as const).map(t => (<button key={t} onClick={() => setAbType(t)} style={{ padding: "5px 14px", fontSize: 12, fontWeight: 500, borderRadius: 6, border: "none", cursor: "pointer", background: abType === t ? "var(--color-brand-600)" : "transparent", color: abType === t ? "#fff" : "#8b93a6" }}>{t === "lander" ? `Landers (${landers.length})` : `Offers (${offers.length})`}</button>))}
          </div>
        </div>
        {abResults.some(r => r.is_winner) && <div style={{ padding: 12, borderRadius: 10, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}><span style={{ fontSize: 20 }}>🏆</span><div><p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-amber)" }}>Winner: {(abResults.find(r => r.is_winner) as Record<string, unknown>)?.variant_name as string}</p><p style={{ fontSize: 11, color: "rgba(245,158,11,0.7)" }}>Based on {abType === "lander" ? "CTR" : "EPC"}</p></div></div>}
        <DataTable columns={abCols} data={abResults} loading={abLoading} emptyMessage={`No ${abType} data yet`} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div><h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10 }}>Landers</h2>{landers.map(l => (<div key={l.id} style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}><div><p style={{ fontWeight: 500, fontSize: 13 }}>{l.name}</p><p style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "#555d6f", marginTop: 2 }}>{l.url}</p></div><span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: "rgba(26,108,245,0.12)", color: "var(--color-brand-400)", border: "1px solid rgba(26,108,245,0.2)" }}>{l.weight}%</span></div>))}</div>
        <div><h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10 }}>Offers</h2>{offers.map(o => (<div key={o.id} style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}><div><p style={{ fontWeight: 500, fontSize: 13 }}>{o.name}</p><p style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "#555d6f", marginTop: 2 }}>{o.url}</p></div><span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: "rgba(26,108,245,0.12)", color: "var(--color-brand-400)", border: "1px solid rgba(26,108,245,0.2)" }}>{o.weight}%</span></div>))}</div>
      </div>
    </div>
  );
}

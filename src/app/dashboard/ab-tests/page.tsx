"use client";
import { useState } from "react";
import { useFetch } from "@/hooks/useFetch";
import { DataTable } from "@/components/ui/DataTable";
import type { CampaignSummary } from "@/types";

export default function ABTestsPage() {
  const { data } = useFetch<{ campaigns: CampaignSummary[] }>("/api/campaigns");
  const campaigns = (data?.campaigns || []).filter(c => c.status === "active");
  const [selected, setSelected] = useState<string | null>(null);
  const [type, setType] = useState<"lander" | "offer">("lander");
  const { data: abData, loading } = useFetch<{ results: Array<Record<string, unknown>> }>(selected ? `/api/ab-test?campaign_id=${selected}&type=${type}` : "", { autoFetch: !!selected });
  const results = abData?.results || [];

  const card = { background: "var(--color-surface-2)", border: "1px solid var(--color-surface-4)", borderRadius: 12, padding: 16 };

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>A/B Tests</h1>
      <p style={{ fontSize: 13, color: "#555d6f", marginBottom: 20 }}>Compare variants side-by-side with winner recommendations</p>

      <div style={{ ...card, marginBottom: 20, display: "flex", gap: 16, alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}><label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#8b93a6", marginBottom: 4 }}>Campaign</label><select value={selected || ""} onChange={e => setSelected(e.target.value || null)}><option value="">Choose...</option>{campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div style={{ display: "flex", background: "var(--color-surface-1)", borderRadius: 8, border: "1px solid var(--color-surface-4)", padding: 2 }}>
          {(["lander", "offer"] as const).map(t => (<button key={t} onClick={() => setType(t)} style={{ padding: "7px 16px", fontSize: 13, fontWeight: 500, borderRadius: 6, border: "none", cursor: "pointer", background: type === t ? "var(--color-brand-600)" : "transparent", color: type === t ? "#fff" : "#8b93a6" }}>{t === "lander" ? "Landers" : "Offers"}</button>))}
        </div>
      </div>

      {!selected ? (
        <div style={{ ...card, padding: 60, textAlign: "center" }}><p style={{ fontSize: 30, marginBottom: 10 }}>🧪</p><p style={{ color: "#8b93a6", fontSize: 15, fontWeight: 500 }}>Select a campaign</p><p style={{ color: "#555d6f", fontSize: 12, marginTop: 4 }}>Choose an active campaign to view A/B test comparisons</p></div>
      ) : (
        <>
          {results.some(r => r.is_winner) && <div style={{ padding: 14, borderRadius: 12, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}><span style={{ fontSize: 24 }}>🏆</span><div><p style={{ fontWeight: 600, color: "var(--color-amber)" }}>Winner: {(results.find(r => r.is_winner) as Record<string, unknown>)?.variant_name as string}</p><p style={{ fontSize: 11, color: "rgba(245,158,11,0.7)" }}>Best {type === "lander" ? "CTR" : "EPC"} performance</p></div></div>}
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(results.length, 3)}, 1fr)`, gap: 14, marginBottom: 16 }}>
            {results.map(r => {
              const isWinner = r.is_winner === true;
              return (
              <div key={r.variant_id as string} style={{ ...card, border: isWinner ? "1px solid rgba(245,158,11,0.3)" : card.border, background: isWinner ? "rgba(245,158,11,0.04)" : card.background }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>{isWinner && <span>🏆</span>}<span style={{ fontWeight: 600 }}>{r.variant_name as string}</span></div>
                  <span style={{ fontSize: 10, color: "#8b93a6" }}>{r.confidence as number}%</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[["Visits", r.visits], ["Clicks", r.clicks], ["CTR", `${(r.ctr as number).toFixed(2)}%`], ["Conv.", r.conversions], ["CR", `${(r.cr as number).toFixed(2)}%`], ["EPC", `$${(r.epc as number).toFixed(2)}`], ["Revenue", <span key="rev" style={{ color: "var(--color-green)" }}>${(r.revenue as number).toFixed(2)}</span>], ["Profit", <span key="pft" style={{ color: (r.profit as number) >= 0 ? "var(--color-green)" : "var(--color-red)" }}>${(r.profit as number).toFixed(2)}</span>]].map(([label, val], j) => (
                    <div key={j}><p style={{ fontSize: 9, color: "#555d6f", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label as string}</p><p style={{ fontWeight: 700, fontFamily: "var(--font-mono)", fontSize: 14, marginTop: 2 }}>{typeof val === "number" ? val.toLocaleString() : val}</p></div>
                  ))}
                </div>
              </div>
            )})}
          </div>
          {results.length === 0 && !loading && <div style={{ ...card, padding: 40, textAlign: "center", color: "#555d6f" }}>No {type} data available yet</div>}
        </>
      )}
    </div>
  );
}

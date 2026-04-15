"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost, useFetch } from "@/hooks/useFetch";
import type { TrafficSource, Domain } from "@/types";

interface VariantInput { name: string; url: string; weight: number; }

export default function NewCampaignPage() {
  const router = useRouter();
  const { data: dd } = useFetch<{ domains: Domain[] }>("/api/domains");
  const domains = dd?.domains || [];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [source, setSource] = useState<TrafficSource>("taboola");
  const [extId, setExtId] = useState("");
  const [domainId, setDomainId] = useState("");
  const [notes, setNotes] = useState("");
  const [landers, setLanders] = useState<VariantInput[]>([{ name: "Lander A", url: "", weight: 50 }, { name: "Lander B", url: "", weight: 50 }]);
  const [offers, setOffers] = useState<VariantInput[]>([{ name: "Offer A", url: "", weight: 50 }, { name: "Offer B", url: "", weight: 50 }]);

  const updateV = (arr: VariantInput[], setArr: (v: VariantInput[]) => void, i: number, field: string, val: string | number) => { const u = [...arr]; (u[i] as Record<string, unknown>)[field] = val; setArr(u); };
  const addV = (arr: VariantInput[], setArr: (v: VariantInput[]) => void, prefix: string) => setArr([...arr, { name: `${prefix} ${String.fromCharCode(65 + arr.length)}`, url: "", weight: 0 }]);
  const removeV = (arr: VariantInput[], setArr: (v: VariantInput[]) => void, i: number) => { if (arr.length > 1) setArr(arr.filter((_, j) => j !== i)); };

  const submit = async () => {
    if (!name.trim()) { setError("Name required"); return; }
    if (landers.some(l => !l.url)) { setError("All landers need a URL"); return; }
    if (offers.some(o => !o.url)) { setError("All offers need a URL"); return; }
    setLoading(true); setError(null);
    try {
      const r = await apiPost<{ campaign: { id: string } }>("/api/campaigns", { name, traffic_source: source, traffic_source_campaign_id: extId || undefined, domain_id: domainId || undefined, notes: notes || undefined, landers, offers });
      router.push(`/dashboard/campaigns/${r.campaign.id}`);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  };

  const cardStyle = { background: "var(--color-surface-2)", border: "1px solid var(--color-surface-4)", borderRadius: 12, padding: 20, marginBottom: 20 };
  const rowStyle = { display: "flex", alignItems: "center", gap: 10, padding: 10, borderRadius: 8, background: "var(--color-surface-1)", border: "1px solid var(--color-surface-4)", marginBottom: 8 };
  const labelStyle = { display: "block", fontSize: 12, fontWeight: 500, color: "#8b93a6", marginBottom: 4 };
  const btnDanger = { background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 16, padding: 4 };

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", color: "#8b93a6", cursor: "pointer", fontSize: 18 }}>←</button>
        <div><h1 style={{ fontSize: 22, fontWeight: 700 }}>Create Campaign</h1><p style={{ fontSize: 13, color: "#555d6f", marginTop: 2 }}>Set up a new traffic distribution campaign</p></div>
      </div>
      {error && <div style={{ padding: 12, borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: 13, marginBottom: 16 }}>{error}</div>}

      <div style={cardStyle}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>Basic Information</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ gridColumn: "1/-1" }}><label style={labelStyle}>Campaign Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. FR - Weight Loss - Taboola Q2" /></div>
          <div><label style={labelStyle}>Traffic Source</label><select value={source} onChange={e => setSource(e.target.value as TrafficSource)}><option value="taboola">Taboola</option><option value="meta">Meta Ads</option><option value="google">Google Ads</option><option value="tiktok">TikTok Ads</option><option value="other">Other</option></select></div>
          <div><label style={labelStyle}>External Campaign ID</label><input type="text" value={extId} onChange={e => setExtId(e.target.value)} placeholder="For cost sync" /></div>
          <div><label style={labelStyle}>Tracking Domain</label><select value={domainId} onChange={e => setDomainId(e.target.value)}><option value="">Select domain...</option>{domains.map(d => <option key={d.id} value={d.id}>{d.domain}</option>)}</select></div>
          <div><label style={labelStyle}>Notes</label><input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional" /></div>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div><h2 style={{ fontSize: 16, fontWeight: 600 }}>Landers</h2><p style={{ fontSize: 11, color: "#555d6f" }}>Landing page variants for A/B testing</p></div>
          <button onClick={() => addV(landers, setLanders, "Lander")} style={{ padding: "5px 12px", background: "var(--color-surface-3)", border: "1px solid var(--color-surface-4)", borderRadius: 6, color: "#e2e4e9", fontSize: 12, cursor: "pointer" }}>+ Add</button>
        </div>
        {landers.map((l, i) => (
          <div key={i} style={rowStyle}>
            <input type="text" value={l.name} onChange={e => updateV(landers, setLanders, i, "name", e.target.value)} style={{ width: 130 }} placeholder="Name" />
            <input type="url" value={l.url} onChange={e => updateV(landers, setLanders, i, "url", e.target.value)} style={{ flex: 1 }} placeholder="https://..." />
            <input type="number" value={l.weight} onChange={e => updateV(landers, setLanders, i, "weight", parseInt(e.target.value) || 0)} style={{ width: 70, textAlign: "center" }} min={0} max={100} />
            <span style={{ fontSize: 11, color: "#555d6f" }}>%</span>
            <button onClick={() => removeV(landers, setLanders, i)} style={btnDanger}>✕</button>
          </div>
        ))}
        <p style={{ fontSize: 11, color: "#555d6f", marginTop: 6 }}>Total: {landers.reduce((s, l) => s + l.weight, 0)}% {landers.reduce((s, l) => s + l.weight, 0) !== 100 && <span style={{ color: "var(--color-amber)" }}>⚠ Should equal 100%</span>}</p>
      </div>

      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div><h2 style={{ fontSize: 16, fontWeight: 600 }}>Offers</h2><p style={{ fontSize: 11, color: "#555d6f" }}>Product page variants for split testing</p></div>
          <button onClick={() => addV(offers, setOffers, "Offer")} style={{ padding: "5px 12px", background: "var(--color-surface-3)", border: "1px solid var(--color-surface-4)", borderRadius: 6, color: "#e2e4e9", fontSize: 12, cursor: "pointer" }}>+ Add</button>
        </div>
        {offers.map((o, i) => (
          <div key={i} style={rowStyle}>
            <input type="text" value={o.name} onChange={e => updateV(offers, setOffers, i, "name", e.target.value)} style={{ width: 130 }} placeholder="Name" />
            <input type="url" value={o.url} onChange={e => updateV(offers, setOffers, i, "url", e.target.value)} style={{ flex: 1 }} placeholder="https://..." />
            <input type="number" value={o.weight} onChange={e => updateV(offers, setOffers, i, "weight", parseInt(e.target.value) || 0)} style={{ width: 70, textAlign: "center" }} min={0} max={100} />
            <span style={{ fontSize: 11, color: "#555d6f" }}>%</span>
            <button onClick={() => removeV(offers, setOffers, i)} style={btnDanger}>✕</button>
          </div>
        ))}
        <p style={{ fontSize: 11, color: "#555d6f", marginTop: 6 }}>Total: {offers.reduce((s, o) => s + o.weight, 0)}% {offers.reduce((s, o) => s + o.weight, 0) !== 100 && <span style={{ color: "var(--color-amber)" }}>⚠ Should equal 100%</span>}</p>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingBottom: 40 }}>
        <button onClick={() => router.back()} style={{ padding: "8px 16px", background: "var(--color-surface-3)", border: "1px solid var(--color-surface-4)", borderRadius: 8, color: "#e2e4e9", fontSize: 13, cursor: "pointer" }}>Cancel</button>
        <button onClick={submit} disabled={loading} style={{ padding: "8px 20px", background: "var(--color-brand-600)", color: "#fff", fontSize: 13, fontWeight: 500, borderRadius: 8, border: "none", cursor: "pointer", opacity: loading ? 0.6 : 1 }}>{loading ? "Creating..." : "Create Campaign"}</button>
      </div>
    </div>
  );
}

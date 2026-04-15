"use client";
import { useState } from "react";
import { useFetch, apiPost } from "@/hooks/useFetch";
import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Shared";
import type { Conversion, CampaignSummary } from "@/types";

export default function ConversionsPage() {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ campaign_id: "", revenue: "", order_id: "", product_name: "", date: new Date().toISOString().split("T")[0] });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { data, loading, refetch } = useFetch<{ conversions: Conversion[] }>("/api/conversions");
  const { data: cd } = useFetch<{ campaigns: CampaignSummary[] }>("/api/campaigns");
  const conversions = data?.conversions || [];
  const campaigns = cd?.campaigns || [];
  const totalRev = conversions.reduce((s, c) => s + parseFloat(c.revenue as unknown as string), 0);

  const submit = async () => {
    if (!form.campaign_id || !form.revenue) { setFormError("Campaign and revenue required"); return; }
    setSubmitting(true); setFormError(null);
    try { await apiPost("/api/conversions", { ...form, revenue: parseFloat(form.revenue) }); setShowModal(false); setForm({ campaign_id: "", revenue: "", order_id: "", product_name: "", date: new Date().toISOString().split("T")[0] }); refetch(); }
    catch (e) { setFormError((e as Error).message); }
    finally { setSubmitting(false); }
  };

  const columns = [
    { key: "created_at", label: "Date", render: (v: unknown) => { const d = new Date(v as string); return <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "#8b93a6" }}>{d.toLocaleDateString()} {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>; } },
    { key: "source", label: "Source", render: (v: unknown) => <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 99, background: v === "shopify" ? "rgba(26,108,245,0.12)" : "rgba(107,114,128,0.12)", color: v === "shopify" ? "var(--color-brand-400)" : "#9ca3af", border: `1px solid ${v === "shopify" ? "rgba(26,108,245,0.2)" : "rgba(107,114,128,0.2)"}` }}>{v as string}</span> },
    { key: "revenue", label: "Revenue", align: "right" as const, render: (v: unknown) => <span style={{ color: "var(--color-green)", fontFamily: "var(--font-mono)", fontWeight: 500 }}>${parseFloat(v as string).toFixed(2)}</span> },
    { key: "order_id", label: "Order ID", render: (v: unknown) => <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "#555d6f" }}>{(v as string) || "—"}</span> },
    { key: "product_name", label: "Product", render: (v: unknown) => (v as string) || "—" },
    { key: "campaign_id", label: "Campaign", render: (v: unknown) => { const c = campaigns.find(c => c.id === v); return <span style={{ fontSize: 12 }}>{c?.name || (v as string).slice(0, 8)}</span>; } },
  ];

  const card = { background: "var(--color-surface-2)", border: "1px solid var(--color-surface-4)", borderRadius: 12, padding: 16 };
  const labelStyle = { display: "block" as const, fontSize: 12, fontWeight: 500, color: "#8b93a6", marginBottom: 4 };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div><h1 style={{ fontSize: 22, fontWeight: 700 }}>Conversions</h1><p style={{ fontSize: 13, color: "#555d6f", marginTop: 4 }}>{conversions.length} total conversions</p></div>
        <button onClick={() => setShowModal(true)} style={{ padding: "8px 16px", background: "var(--color-brand-600)", color: "#fff", fontSize: 13, fontWeight: 500, borderRadius: 8, border: "none", cursor: "pointer" }}>+ Add Manual</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
        <div style={{ ...card, display: "flex", alignItems: "center", gap: 14 }}><div style={{ width: 40, height: 40, borderRadius: 8, background: "rgba(34,197,94,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>💰</div><div><p style={{ fontSize: 10, fontWeight: 600, color: "#555d6f", textTransform: "uppercase" }}>Total Revenue</p><p style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--color-green)" }}>${totalRev.toFixed(2)}</p></div></div>
        <div style={{ ...card, display: "flex", alignItems: "center", gap: 14 }}><div style={{ width: 40, height: 40, borderRadius: 8, background: "rgba(26,108,245,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🛒</div><div><p style={{ fontSize: 10, fontWeight: 600, color: "#555d6f", textTransform: "uppercase" }}>Shopify</p><p style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-mono)" }}>{conversions.filter(c => c.source === "shopify").length}</p></div></div>
        <div style={{ ...card, display: "flex", alignItems: "center", gap: 14 }}><div style={{ width: 40, height: 40, borderRadius: 8, background: "rgba(107,114,128,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>✏️</div><div><p style={{ fontSize: 10, fontWeight: 600, color: "#555d6f", textTransform: "uppercase" }}>Manual</p><p style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-mono)" }}>{conversions.filter(c => c.source === "manual").length}</p></div></div>
      </div>

      <DataTable columns={columns} data={conversions} loading={loading} emptyMessage="No conversions recorded yet" />

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Manual Conversion">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {formError && <div style={{ padding: 10, borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: 13 }}>{formError}</div>}
          <div><label style={labelStyle}>Campaign</label><select value={form.campaign_id} onChange={e => setForm({ ...form, campaign_id: e.target.value })}><option value="">Select...</option>{campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label style={labelStyle}>Revenue ($)</label><input type="number" step="0.01" value={form.revenue} onChange={e => setForm({ ...form, revenue: e.target.value })} placeholder="0.00" /></div>
          <div><label style={labelStyle}>Order ID</label><input type="text" value={form.order_id} onChange={e => setForm({ ...form, order_id: e.target.value })} placeholder="Optional" /></div>
          <div><label style={labelStyle}>Product</label><input type="text" value={form.product_name} onChange={e => setForm({ ...form, product_name: e.target.value })} placeholder="Optional" /></div>
          <div><label style={labelStyle}>Date</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 6 }}>
            <button onClick={() => setShowModal(false)} style={{ padding: "7px 14px", background: "var(--color-surface-3)", border: "1px solid var(--color-surface-4)", borderRadius: 8, color: "#e2e4e9", fontSize: 13, cursor: "pointer" }}>Cancel</button>
            <button onClick={submit} disabled={submitting} style={{ padding: "7px 16px", background: "var(--color-brand-600)", color: "#fff", fontSize: 13, fontWeight: 500, borderRadius: 8, border: "none", cursor: "pointer" }}>{submitting ? "Saving..." : "Add"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

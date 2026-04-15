"use client";
import { useState } from "react";
import { useFetch, apiPost, apiDelete } from "@/hooks/useFetch";
import { Modal } from "@/components/ui/Shared";
import type { Domain } from "@/types";

export default function DomainsPage() {
  const [showModal, setShowModal] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data, loading, refetch } = useFetch<{ domains: Domain[] }>("/api/domains");
  const domains = data?.domains || [];

  const add = async () => {
    if (!newDomain.trim()) { setError("Domain required"); return; }
    setSubmitting(true); setError(null);
    try { await apiPost("/api/domains", { domain: newDomain, notes: notes || undefined }); setShowModal(false); setNewDomain(""); setNotes(""); refetch(); }
    catch (e) { setError((e as Error).message); }
    finally { setSubmitting(false); }
  };
  const del = async (id: string) => { if (!confirm("Remove this domain?")) return; try { await apiDelete(`/api/domains?id=${id}`); refetch(); } catch (e) { alert((e as Error).message); } };

  const card = { background: "var(--color-surface-2)", border: "1px solid var(--color-surface-4)", borderRadius: 12, padding: 16 };
  const labelStyle = { display: "block" as const, fontSize: 12, fontWeight: 500, color: "#8b93a6", marginBottom: 4 };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div><h1 style={{ fontSize: 22, fontWeight: 700 }}>Domains</h1><p style={{ fontSize: 13, color: "#555d6f", marginTop: 4 }}>Manage custom tracking domains</p></div>
        <button onClick={() => setShowModal(true)} style={{ padding: "8px 16px", background: "var(--color-brand-600)", color: "#fff", fontSize: 13, fontWeight: 500, borderRadius: 8, border: "none", cursor: "pointer" }}>+ Add Domain</button>
      </div>

      <div style={{ ...card, marginBottom: 20 }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>🛡️ DNS Setup Guide</h3>
        <div style={{ fontSize: 13, color: "#8b93a6", lineHeight: 1.6 }}>
          <p>1. Add a CNAME record pointing your tracking domain to your app server.</p>
          <p>2. Configure SSL (Let&apos;s Encrypt or your provider).</p>
          <p>3. Add the domain here and mark verified once DNS propagates.</p>
          <p style={{ marginTop: 6, fontSize: 11 }}>Example: <code style={{ color: "var(--color-brand-400)", background: "var(--color-surface-1)", padding: "2px 6px", borderRadius: 4 }}>track.yourdomain.com CNAME your-app.vercel.app</code></p>
        </div>
      </div>

      {loading ? <div style={{ ...card, padding: 40, textAlign: "center", color: "#555d6f" }}>Loading...</div> :
       domains.length === 0 ? <div style={{ ...card, padding: 60, textAlign: "center" }}><p style={{ fontSize: 30, marginBottom: 10 }}>🌐</p><p style={{ color: "#8b93a6", fontSize: 15, fontWeight: 500 }}>No domains yet</p></div> :
       <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
         {domains.map(d => (
           <div key={d.id} style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center", transition: "border-color 0.15s" }}>
             <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
               <div style={{ width: 40, height: 40, borderRadius: 8, background: "var(--color-surface-3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🌐</div>
               <div><p style={{ fontWeight: 600 }}>{d.domain}</p>{d.notes && <p style={{ fontSize: 11, color: "#555d6f", marginTop: 2 }}>{d.notes}</p>}</div>
             </div>
             <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
               <div style={{ display: "flex", gap: 12 }}>
                 <span style={{ fontSize: 12, color: "#8b93a6", display: "flex", alignItems: "center", gap: 4 }}>{d.is_verified ? "✅" : "❌"} {d.is_verified ? "Verified" : "Unverified"}</span>
                 <span style={{ fontSize: 12, color: "#8b93a6", display: "flex", alignItems: "center", gap: 4 }}>{d.ssl_active ? "🔒" : "🔓"} {d.ssl_active ? "SSL" : "No SSL"}</span>
               </div>
               <button onClick={() => del(d.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 16 }}>🗑️</button>
             </div>
           </div>
         ))}
       </div>
      }

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Domain">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {error && <div style={{ padding: 10, borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: 13 }}>{error}</div>}
          <div><label style={labelStyle}>Domain</label><input type="text" value={newDomain} onChange={e => setNewDomain(e.target.value)} placeholder="track.yourdomain.com" /></div>
          <div><label style={labelStyle}>Notes</label><input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional" /></div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 6 }}>
            <button onClick={() => setShowModal(false)} style={{ padding: "7px 14px", background: "var(--color-surface-3)", border: "1px solid var(--color-surface-4)", borderRadius: 8, color: "#e2e4e9", fontSize: 13, cursor: "pointer" }}>Cancel</button>
            <button onClick={add} disabled={submitting} style={{ padding: "7px 16px", background: "var(--color-brand-600)", color: "#fff", fontSize: 13, fontWeight: 500, borderRadius: 8, border: "none", cursor: "pointer" }}>{submitting ? "Adding..." : "Add"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

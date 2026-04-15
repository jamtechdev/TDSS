"use client";
import { useState, useEffect, useCallback } from "react";

export function useFetch<T>(url: string, opts?: { autoFetch?: boolean }) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchData = useCallback(async (u?: string) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(u || url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json); return json;
    } catch (e) { setError((e as Error).message); return null; }
    finally { setLoading(false); }
  }, [url]);
  useEffect(() => { if (opts?.autoFetch !== false) fetchData(); }, [fetchData, opts?.autoFetch]);
  return { data, loading, error, refetch: fetchData };
}

export async function apiPost<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) { const e = await res.json().catch(() => ({ error: `HTTP ${res.status}` })); throw new Error(e.error); }
  return res.json();
}

export async function apiPut<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) { const e = await res.json().catch(() => ({ error: `HTTP ${res.status}` })); throw new Error(e.error); }
  return res.json();
}

export async function apiDelete(url: string): Promise<void> {
  const res = await fetch(url, { method: "DELETE" });
  if (!res.ok) { const e = await res.json().catch(() => ({ error: `HTTP ${res.status}` })); throw new Error(e.error); }
}

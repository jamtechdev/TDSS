import { createServerClient } from "./supabase";

const TABOOLA_API = "https://backstage.taboola.com/backstage/api/1.0";

function getProxyConfig() {
  // Prefer direct API if client credentials are set
  if (process.env.TABOOLA_CLIENT_ID && process.env.TABOOLA_CLIENT_SECRET) return null;
  const proxyUrl = process.env.TABOOLA_PROXY_URL;
  const proxyToken = process.env.TABOOLA_PROXY_TOKEN;
  if (proxyUrl && proxyToken) return { proxyUrl, proxyToken };
  return null;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function authenticate(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.token;
  const clientId = process.env.TABOOLA_CLIENT_ID || "";
  const clientSecret = process.env.TABOOLA_CLIENT_SECRET || "";
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch("https://backstage.taboola.com/backstage/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Taboola auth failed: ${res.status} ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  cachedToken = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
  return data.access_token;
}

async function taboolaGet(path: string): Promise<Response> {
  const proxy = getProxyConfig();
  if (proxy) {
    // Use proxy — it handles auth, only GET allowed
    const url = `${proxy.proxyUrl}${path}`;
    return fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${proxy.proxyToken}` },
    });
  }
  // Direct API — authenticate with OAuth
  const token = await authenticate();
  return fetch(`${TABOOLA_API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function syncTaboolaCosts() {
  const supabase = createServerClient();
  const errors: string[] = [];
  let synced = 0;
  try {
    const accountId = process.env.TABOOLA_ACCOUNT_ID;
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const res = await taboolaGet(
      `/${accountId}/reports/campaign-summary/dimensions/campaign_day_breakdown?start_date=${yesterday}&end_date=${today}`
    );
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Taboola API ${res.status}: ${body.slice(0, 200)}`);
    }
    const data = await res.json();
    const rows = data.results || [];
    const { data: campaigns } = await supabase
      .from("campaigns").select("id, traffic_source_campaign_id")
      .eq("traffic_source", "taboola").not("traffic_source_campaign_id", "is", null);
    if (!campaigns) return { synced: 0, errors: ["No Taboola campaigns found"] };
    const map = new Map(campaigns.map((c: { id: string; traffic_source_campaign_id: string }) => [c.traffic_source_campaign_id, c.id]));
    for (const row of rows) {
      const internalId = map.get(row.campaign);
      if (!internalId) continue;
      // Taboola returns date as "2026-04-15 00:00:00.0" — normalize to YYYY-MM-DD
      const normalizedDate = (row.date || "").split(" ")[0];
      const countryCode = row.country || null;
      // Delete existing rows first (unique index with nullable country_code doesn't prevent NULL duplicates)
      const del = supabase.from("costs").delete()
        .eq("campaign_id", internalId).eq("traffic_source", "taboola").eq("date", normalizedDate);
      if (countryCode) del.eq("country_code", countryCode); else del.is("country_code", null);
      await del;
      const { error } = await supabase.from("costs").insert({
        campaign_id: internalId, traffic_source: "taboola", external_campaign_id: row.campaign,
        amount: parseFloat(row.spent) || 0, currency: row.currency || "USD",
        date: normalizedDate, country_code: countryCode,
        raw_data: row, synced_at: new Date().toISOString(),
      });
      if (error) errors.push(error.message); else synced++;
    }
  } catch (err) { errors.push((err as Error).message); }
  return { synced, errors };
}

import { createServerClient } from "./supabase";

const TABOOLA_API = "https://backstage.taboola.com/backstage/api/1.0";
let cachedToken: { token: string; expiresAt: number } | null = null;

async function authenticate(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.token;
  const res = await fetch(`${TABOOLA_API}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.TABOOLA_CLIENT_ID || "",
      client_secret: process.env.TABOOLA_CLIENT_SECRET || "",
      grant_type: "client_credentials",
    }),
  });
  if (!res.ok) throw new Error(`Taboola auth failed: ${res.status}`);
  const data = await res.json();
  cachedToken = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
  return data.access_token;
}

export async function syncTaboolaCosts() {
  const supabase = createServerClient();
  const errors: string[] = [];
  let synced = 0;
  try {
    const token = await authenticate();
    const accountId = process.env.TABOOLA_ACCOUNT_ID;
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const res = await fetch(
      `${TABOOLA_API}/${accountId}/reports/campaign-summary/dimensions/campaign_day_breakdown?start_date=${yesterday}&end_date=${today}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) throw new Error(`Taboola API: ${res.status}`);
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
      const { error } = await supabase.from("costs").upsert({
        campaign_id: internalId, traffic_source: "taboola", external_campaign_id: row.campaign,
        amount: parseFloat(row.spent) || 0, currency: row.currency || "USD",
        date: row.date, country_code: row.country || null,
        raw_data: row, synced_at: new Date().toISOString(),
      }, { onConflict: "campaign_id,date,country_code,traffic_source" });
      if (error) errors.push(error.message); else synced++;
    }
  } catch (err) { errors.push((err as Error).message); }
  return { synced, errors };
}

import { createServerClient } from "./supabase";

export async function aggregateKPIs(dateFrom?: string, dateTo?: string) {
  const supabase = createServerClient();
  const errors: string[] = [];
  const today = new Date().toISOString().split("T")[0];
  const from = dateFrom || today;
  const to = dateTo || today;
  const { data: campaigns } = await supabase.from("campaigns").select("id").in("status", ["active", "paused"]);
  if (!campaigns) return { computed: 0, errors: ["No campaigns"] };
  let computed = 0;
  for (const campaign of campaigns) {
    try {
      const { data: visits } = await supabase.from("sessions").select("lander_id, country_code, device, created_at")
        .eq("campaign_id", campaign.id).gte("created_at", `${from}T00:00:00Z`).lte("created_at", `${to}T23:59:59Z`);
      const { data: clicks } = await supabase.from("clicks").select("lander_id, offer_id, country_code, device, created_at")
        .eq("campaign_id", campaign.id).gte("created_at", `${from}T00:00:00Z`).lte("created_at", `${to}T23:59:59Z`);
      const { data: convs } = await supabase.from("conversions").select("lander_id, offer_id, country_code, revenue, created_at")
        .eq("campaign_id", campaign.id).gte("created_at", `${from}T00:00:00Z`).lte("created_at", `${to}T23:59:59Z`);
      const { data: costs } = await supabase.from("costs").select("amount, country_code, date")
        .eq("campaign_id", campaign.id).gte("date", from).lte("date", to);

      type Bucket = { campaign_id: string; lander_id: string | null; offer_id: string | null; date: string; country_code: string | null; device: string | null; visits: number; clicks: number; conversions: number; revenue: number; cost: number; };
      const buckets = new Map<string, Bucket>();
      const key = (d: string, l?: string | null, o?: string | null, c?: string | null, dv?: string | null) => `${d}|${l||""}|${o||""}|${c||""}|${dv||""}`;
      const get = (k: string, d: string, l?: string | null, o?: string | null, c?: string | null, dv?: string | null) => {
        if (!buckets.has(k)) buckets.set(k, { campaign_id: campaign.id, lander_id: l || null, offer_id: o || null, date: d, country_code: c || null, device: dv || null, visits: 0, clicks: 0, conversions: 0, revenue: 0, cost: 0 });
        return buckets.get(k)!;
      };
      for (const v of visits || []) { const d = v.created_at.split("T")[0]; get(key(d, v.lander_id, null, v.country_code, v.device), d, v.lander_id, null, v.country_code, v.device).visits++; }
      for (const c of clicks || []) { const d = c.created_at.split("T")[0]; get(key(d, c.lander_id, c.offer_id, c.country_code, c.device), d, c.lander_id, c.offer_id, c.country_code, c.device).clicks++; }
      for (const cv of convs || []) { const d = cv.created_at.split("T")[0]; const b = get(key(d, cv.lander_id, cv.offer_id, cv.country_code, null), d, cv.lander_id, cv.offer_id, cv.country_code, null); b.conversions++; b.revenue += parseFloat(cv.revenue as string) || 0; }
      const totalByDate = new Map<string, number>();
      for (const v of visits || []) { const d = v.created_at.split("T")[0]; totalByDate.set(d, (totalByDate.get(d) || 0) + 1); }
      for (const cost of costs || []) { const amt = parseFloat(cost.amount as string) || 0; const tv = totalByDate.get(cost.date) || 1; for (const [, b] of buckets) { if (b.date === cost.date) { b.cost += cost.country_code && b.country_code === cost.country_code ? amt : amt * (b.visits / tv); } } }
      // Delete existing aggregates for this campaign+date range, then insert fresh
      const bucketDates = new Set<string>();
      for (const [, b] of buckets) bucketDates.add(b.date);
      for (const d of bucketDates) {
        await supabase.from("kpi_aggregates").delete().eq("campaign_id", campaign.id).eq("date", d);
      }
      for (const [, b] of buckets) {
        const ctr = b.visits > 0 ? (b.clicks / b.visits) * 100 : 0;
        const cr = b.clicks > 0 ? (b.conversions / b.clicks) * 100 : 0;
        const roi = b.cost > 0 ? ((b.revenue - b.cost) / b.cost) * 100 : 0;
        const epc = b.clicks > 0 ? b.revenue / b.clicks : 0;
        const cpa = b.conversions > 0 ? b.cost / b.conversions : 0;
        const { error } = await supabase.from("kpi_aggregates").insert({
          campaign_id: b.campaign_id, lander_id: b.lander_id, offer_id: b.offer_id, date: b.date,
          country_code: b.country_code, device: b.device, visits: b.visits, clicks: b.clicks,
          conversions: b.conversions, revenue: b.revenue, cost: Math.round(b.cost * 100) / 100,
          ctr: Math.round(ctr * 1e4) / 1e4, cr: Math.round(cr * 1e4) / 1e4, roi: Math.round(roi * 1e4) / 1e4,
          epc: Math.round(epc * 1e4) / 1e4, cpa: Math.round(cpa * 1e4) / 1e4, profit: Math.round((b.revenue - b.cost) * 100) / 100,
          computed_at: new Date().toISOString(),
        });
        if (error) errors.push(error.message); else computed++;
      }
    } catch (err) { errors.push(`${campaign.id}: ${(err as Error).message}`); }
  }
  return { computed, errors };
}

export async function getABTestResults(campaignId: string, variantType: "lander" | "offer", dateFrom?: string, dateTo?: string) {
  const supabase = createServerClient();
  const from = dateFrom || "2020-01-01";
  const to = dateTo || new Date().toISOString().split("T")[0];
  const idField = variantType === "lander" ? "lander_id" : "offer_id";
  const { data: variants } = await supabase.from(variantType === "lander" ? "landers" : "offers").select("*").eq("campaign_id", campaignId);
  if (!variants || !variants.length) return [];
  const results = [];
  for (const v of variants) {
    const { data: kpis } = await supabase.from("kpi_aggregates").select("*").eq("campaign_id", campaignId).eq(idField, v.id).gte("date", from).lte("date", to);
    const t = (kpis || []).reduce((a: { visits: number; clicks: number; conversions: number; revenue: number; cost: number }, k: Record<string, unknown>) => ({
      visits: a.visits + ((k.visits as number) || 0), clicks: a.clicks + ((k.clicks as number) || 0),
      conversions: a.conversions + ((k.conversions as number) || 0), revenue: a.revenue + (parseFloat(k.revenue as string) || 0),
      cost: a.cost + (parseFloat(k.cost as string) || 0),
    }), { visits: 0, clicks: 0, conversions: 0, revenue: 0, cost: 0 });
    results.push({ variant_id: v.id, variant_name: v.name, variant_type: variantType, weight: v.weight, is_active: v.is_active, ...t,
      ctr: t.visits > 0 ? (t.clicks / t.visits) * 100 : 0, cr: t.clicks > 0 ? (t.conversions / t.clicks) * 100 : 0,
      epc: t.clicks > 0 ? t.revenue / t.clicks : 0, roi: t.cost > 0 ? ((t.revenue - t.cost) / t.cost) * 100 : 0, profit: t.revenue - t.cost,
    });
  }
  const metric = variantType === "lander" ? "ctr" : "epc";
  const sorted = [...results].sort((a, b) => (b[metric] as number) - (a[metric] as number));
  const totalSamples = results.reduce((s, r) => s + r.clicks, 0);
  return results.map((r) => ({ ...r, is_winner: sorted[0]?.variant_id === r.variant_id, confidence: Math.min(99, Math.round((r.clicks / Math.max(totalSamples * 0.1, 1)) * 50)) }));
}

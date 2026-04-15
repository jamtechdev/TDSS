import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const supabase = createServerClient();
  const p = request.nextUrl.searchParams;
  const groupBy = p.get("group_by") || "date";
  let query = supabase.from("kpi_aggregates").select("*");
  if (p.get("campaign_id")) query = query.eq("campaign_id", p.get("campaign_id"));
  if (p.get("date_from")) query = query.gte("date", p.get("date_from"));
  if (p.get("date_to")) query = query.lte("date", p.get("date_to"));
  if (p.get("country")) query = query.eq("country_code", p.get("country"));
  if (p.get("device")) query = query.eq("device", p.get("device"));
  const { data, error } = await query.order("date", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const map = new Map<string, { key: string; visits: number; clicks: number; conversions: number; revenue: number; cost: number }>();
  for (const row of data || []) {
    const key = (row[groupBy === "lander" ? "lander_id" : groupBy === "offer" ? "offer_id" : groupBy === "country" ? "country_code" : groupBy === "device" ? "device" : "date"] as string) || "unknown";
    const e = map.get(key) || { key, visits: 0, clicks: 0, conversions: 0, revenue: 0, cost: 0 };
    e.visits += (row.visits as number) || 0; e.clicks += (row.clicks as number) || 0;
    e.conversions += (row.conversions as number) || 0; e.revenue += parseFloat(row.revenue as string) || 0;
    e.cost += parseFloat(row.cost as string) || 0; map.set(key, e);
  }
  const kpis = Array.from(map.values()).map(i => ({
    ...i, ctr: i.visits > 0 ? (i.clicks / i.visits) * 100 : 0, cr: i.clicks > 0 ? (i.conversions / i.clicks) * 100 : 0,
    roi: i.cost > 0 ? ((i.revenue - i.cost) / i.cost) * 100 : 0, epc: i.clicks > 0 ? i.revenue / i.clicks : 0,
    cpa: i.conversions > 0 ? i.cost / i.conversions : 0, profit: i.revenue - i.cost,
  }));
  return NextResponse.json({ kpis });
}

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const supabase = createServerClient();
  const campaignId = request.nextUrl.searchParams.get("campaign_id");
  const limit = parseInt(request.nextUrl.searchParams.get("limit") || "50");
  let query = supabase.from("conversions").select("*").order("created_at", { ascending: false }).limit(limit);
  if (campaignId) query = query.eq("campaign_id", campaignId);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ conversions: data });
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient();
  const body = await request.json();
  if (!body.campaign_id || body.revenue === undefined) return NextResponse.json({ error: "campaign_id and revenue required" }, { status: 400 });
  const { data, error } = await supabase.from("conversions").insert({
    campaign_id: body.campaign_id, lander_id: body.lander_id || null, offer_id: body.offer_id || null,
    source: "manual", revenue: body.revenue, order_id: body.order_id || null, product_name: body.product_name || null,
    currency: body.currency || "USD", country_code: body.country_code || null,
    created_at: body.date ? new Date(body.date).toISOString() : new Date().toISOString(),
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ conversion: data }, { status: 201 });
}

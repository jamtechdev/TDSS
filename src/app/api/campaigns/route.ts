import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { generateSlug } from "@/distribution";

export async function GET(request: NextRequest) {
  const supabase = createServerClient();
  const status = request.nextUrl.searchParams.get("status");
  let query = supabase.from("campaign_summary").select("*");
  if (status) query = query.eq("status", status);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaigns: data });
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient();
  const body = await request.json();
  if (!body.name || !body.landers?.length || !body.offers?.length)
    return NextResponse.json({ error: "Name, landers, and offers required" }, { status: 400 });
  const slug = generateSlug(body.name);
  const { data: campaign, error: cErr } = await supabase.from("campaigns").insert({
    name: body.name, slug, status: "draft", traffic_source: body.traffic_source || "taboola",
    traffic_source_campaign_id: body.traffic_source_campaign_id || null,
    domain_id: body.domain_id || null, notes: body.notes || null,
  }).select().single();
  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });
  const { data: landers } = await supabase.from("landers").insert(
    body.landers.map((l: { name: string; url: string; weight: number }) => ({ campaign_id: campaign.id, name: l.name, url: l.url, weight: l.weight }))
  ).select();
  const { data: offers } = await supabase.from("offers").insert(
    body.offers.map((o: { name: string; url: string; weight: number }) => ({ campaign_id: campaign.id, name: o.name, url: o.url, weight: o.weight }))
  ).select();
  return NextResponse.json({ campaign: { ...campaign, landers, offers } }, { status: 201 });
}

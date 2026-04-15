import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { generateTrackingScript } from "@/distribution";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServerClient();
  const { data: campaign, error } = await supabase.from("campaigns").select("*, domain:domains(*), landers(*), offers(*), targeting_rules(*)").eq("id", id).single();
  if (error || !campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const trackingDomain = campaign.domain?.domain ? `https://${campaign.domain.domain}` : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return NextResponse.json({ campaign, tracking_script: generateTrackingScript(campaign.slug, trackingDomain), campaign_url: `${trackingDomain}/c/${campaign.slug}` });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServerClient();
  const body = await request.json();
  const update: Record<string, unknown> = {};
  for (const k of ["name", "status", "traffic_source", "traffic_source_campaign_id", "domain_id", "notes"]) if (body[k] !== undefined) update[k] = body[k];
  const { data: campaign, error } = await supabase.from("campaigns").update(update).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (body.landers) for (const l of body.landers) { if (l.id) await supabase.from("landers").update({ name: l.name, url: l.url, weight: l.weight, is_active: l.is_active }).eq("id", l.id); else await supabase.from("landers").insert({ campaign_id: id, name: l.name, url: l.url, weight: l.weight }); }
  if (body.offers) for (const o of body.offers) { if (o.id) await supabase.from("offers").update({ name: o.name, url: o.url, weight: o.weight, is_active: o.is_active }).eq("id", o.id); else await supabase.from("offers").insert({ campaign_id: id, name: o.name, url: o.url, weight: o.weight }); }
  return NextResponse.json({ campaign });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServerClient();
  const { error } = await supabase.from("campaigns").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getClientIP, getGeoFromHeaders, detectDevice, detectBrowser, detectOS } from "@/lib/geo";

export async function POST(request: NextRequest) {
  const supabase = createServerClient();
  try {
    const body = await request.json();
    if (!body.campaign_slug) return NextResponse.json({ error: "campaign_slug required" }, { status: 400 });
    const { data: campaign } = await supabase.from("campaigns").select("id").eq("slug", body.campaign_slug).eq("status", "active").single();
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    const headers = request.headers;
    const ip = getClientIP(headers);
    const geo = getGeoFromHeaders(headers);
    const ua = headers.get("user-agent") || body.user_agent || "";
    if (body.visitor_id) {
      const ago = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const { data: existing } = await supabase.from("sessions").select("id").eq("campaign_id", campaign.id).eq("visitor_id", body.visitor_id).gte("created_at", ago).limit(1).single();
      if (existing) return NextResponse.json({ session_id: existing.id, cached: true });
    }
    const { data: session, error } = await supabase.from("sessions").insert({
      campaign_id: campaign.id, visitor_id: body.visitor_id || null, ip_address: ip,
      country_code: geo.country_code || body.country_code || null, region: geo.region || null, city: geo.city || null,
      device: body.device || detectDevice(ua), browser: detectBrowser(ua), os: detectOS(ua),
      language: body.language || null, referrer: body.referrer || null, user_agent: ua,
    }).select("id").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ session_id: session.id });
  } catch (err) { return NextResponse.json({ error: (err as Error).message }, { status: 500 }); }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
}

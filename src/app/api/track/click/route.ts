import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { selectOffer } from "@/distribution";
import { getClientIP, getGeoFromHeaders, detectDevice } from "@/lib/geo";

export async function GET(request: NextRequest) {
  const supabase = createServerClient();
  const sid = request.nextUrl.searchParams.get("sid");
  const slug = request.nextUrl.searchParams.get("slug");
  if (!sid || !slug) return NextResponse.redirect(new URL("/", request.url));
  try {
    const { data: session } = await supabase.from("sessions").select("id, campaign_id, country_code, device, lander_id").eq("id", sid).single();
    if (!session) return NextResponse.redirect(new URL("/", request.url));
    const { data: campaign } = await supabase.from("campaigns").select("id, offers(*), targeting_rules(*)").eq("id", session.campaign_id).single();
    if (!campaign?.offers?.length) return NextResponse.redirect(new URL("/", request.url));
    const headers = request.headers;
    const geo = getGeoFromHeaders(headers);
    const ua = headers.get("user-agent") || "";
    const offer = selectOffer(campaign.offers, campaign.targeting_rules || [], {
      country_code: session.country_code || geo.country_code,
      device: (session.device || detectDevice(ua)) as "desktop" | "mobile" | "tablet",
    });
    if (!offer) return NextResponse.redirect(new URL("/", request.url));
    await supabase.from("clicks").insert({
      session_id: session.id, campaign_id: session.campaign_id, lander_id: session.lander_id,
      offer_id: offer.id, country_code: session.country_code || geo.country_code,
      device: session.device || detectDevice(ua), ip_address: getClientIP(headers),
    });
    const url = new URL(offer.url);
    url.searchParams.set("tds_click", session.id);
    return NextResponse.redirect(url.toString(), 302);
  } catch { return NextResponse.redirect(new URL("/", request.url)); }
}

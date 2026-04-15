import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import * as crypto from "crypto";

export async function POST(request: NextRequest) {
  const supabase = createServerClient();
  try {
    const raw = await request.text();
    const body = JSON.parse(raw);
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
    if (secret) {
      const hmac = request.headers.get("x-shopify-hmac-sha256");
      const computed = crypto.createHmac("sha256", secret).update(raw, "utf-8").digest("base64");
      if (hmac !== computed) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    const orderId = body.id?.toString() || body.order_number?.toString();
    const totalPrice = parseFloat(body.total_price || "0");
    const productName = body.line_items?.[0]?.title || "Unknown";
    let clickId: string | null = null;
    let sessionId: string | null = null;
    for (const a of body.note_attributes || []) { if (a.name === "tds_click") clickId = a.value; if (a.name === "tds_session") sessionId = a.value; }
    if (!clickId && body.landing_site) try { clickId = new URL(body.landing_site, "https://x.com").searchParams.get("tds_click"); } catch {}
    if (!clickId && !sessionId) return NextResponse.json({ status: "ignored" });
    let campaignId: string | null = null, landerId: string | null = null, offerId: string | null = null, cc: string | null = null;
    if (clickId) {
      const { data: click } = await supabase.from("clicks").select("campaign_id,lander_id,offer_id,country_code,session_id").eq("id", clickId).single();
      if (click) { campaignId = click.campaign_id; landerId = click.lander_id; offerId = click.offer_id; cc = click.country_code; sessionId = click.session_id; }
    }
    if (!campaignId) return NextResponse.json({ status: "ignored" });
    const { data: existing } = await supabase.from("conversions").select("id").eq("order_id", orderId).eq("source", "shopify").limit(1).single();
    if (existing) return NextResponse.json({ status: "duplicate" });
    const { data: conv, error } = await supabase.from("conversions").insert({
      click_id: clickId, session_id: sessionId, campaign_id: campaignId, lander_id: landerId, offer_id: offerId,
      source: "shopify", revenue: totalPrice, order_id: orderId, product_name: productName, currency: body.currency || "USD", country_code: cc,
    }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ status: "success", conversion_id: conv.id });
  } catch (err) { return NextResponse.json({ error: (err as Error).message }, { status: 500 }); }
}

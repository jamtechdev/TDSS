import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { selectLander } from "@/distribution";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = createServerClient();
  const { data: campaign } = await supabase.from("campaigns").select("id, slug, status, landers(*)").eq("slug", slug).eq("status", "active").single();
  if (!campaign?.landers?.length) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  const lander = selectLander(campaign.landers);
  if (!lander) return NextResponse.json({ error: "No landers" }, { status: 500 });
  const url = new URL(lander.url);
  url.searchParams.set("tds_campaign", campaign.slug);
  return NextResponse.redirect(url.toString(), 302);
}

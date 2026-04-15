import { NextRequest, NextResponse } from "next/server";
import { getABTestResults } from "@/lib/kpi";

export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const campaignId = p.get("campaign_id");
  const type = (p.get("type") || "lander") as "lander" | "offer";
  if (!campaignId) return NextResponse.json({ error: "campaign_id required" }, { status: 400 });
  try {
    const results = await getABTestResults(campaignId, type, p.get("date_from") || undefined, p.get("date_to") || undefined);
    return NextResponse.json({ results });
  } catch (err) { return NextResponse.json({ error: (err as Error).message }, { status: 500 }); }
}

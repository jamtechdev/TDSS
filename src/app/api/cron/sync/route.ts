import { NextRequest, NextResponse } from "next/server";
import { syncTaboolaCosts } from "@/lib/taboola";
import { aggregateKPIs } from "@/lib/kpi";

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const results: Record<string, unknown> = {};
  try { results.taboola = await syncTaboolaCosts(); } catch (e) { results.taboola = { error: (e as Error).message }; }
  try {
    const y = new Date(Date.now() - 864e5).toISOString().split("T")[0];
    const t = new Date().toISOString().split("T")[0];
    results.kpi = await aggregateKPIs(y, t);
  } catch (e) { results.kpi = { error: (e as Error).message }; }
  return NextResponse.json({ status: "completed", timestamp: new Date().toISOString(), results });
}

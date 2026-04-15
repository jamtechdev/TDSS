import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase.from("domains").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ domains: data });
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient();
  const body = await request.json();
  if (!body.domain) return NextResponse.json({ error: "domain required" }, { status: 400 });
  const domain = body.domain.replace(/^https?:\/\//, "").replace(/\/+$/, "").toLowerCase();
  const { data, error } = await supabase.from("domains").insert({ domain, is_verified: body.is_verified || false, ssl_active: body.ssl_active || false, notes: body.notes || null }).select().single();
  if (error) return NextResponse.json({ error: error.code === "23505" ? "Domain already exists" : error.message }, { status: error.code === "23505" ? 409 : 500 });
  return NextResponse.json({ domain: data }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const supabase = createServerClient();
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const { error } = await supabase.from("domains").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

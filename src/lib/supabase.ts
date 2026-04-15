import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabase =
  url && anonKey ? createClient(url, anonKey, { auth: { persistSession: false } }) : null;

export function createServerClient() {
  const sUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const sKey = process.env.SUPABASE_SERVICE_ROLE_KEY || anonKey!;
  return createClient(sUrl, sKey, { auth: { persistSession: false } });
}

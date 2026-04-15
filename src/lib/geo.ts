import type { DeviceType } from "@/types";

export interface GeoData { country_code: string; region: string; city: string; }

export function getClientIP(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || headers.get("cf-connecting-ip") || "0.0.0.0";
}

export function getGeoFromHeaders(headers: Headers): GeoData {
  return {
    country_code: headers.get("cf-ipcountry") || headers.get("x-vercel-ip-country") || "",
    region: headers.get("x-vercel-ip-country-region") || "",
    city: headers.get("x-vercel-ip-city") || "",
  };
}

export function detectDevice(ua: string): DeviceType {
  const l = ua.toLowerCase();
  if (/tablet|ipad|playbook|silk/i.test(l)) return "tablet";
  if (/mobile|iphone|ipod|android.*mobile|opera m(ob|in)|windows phone/i.test(l)) return "mobile";
  return "desktop";
}

export function detectBrowser(ua: string): string {
  const l = ua.toLowerCase();
  if (l.includes("firefox")) return "Firefox";
  if (l.includes("edg")) return "Edge";
  if (l.includes("opr") || l.includes("opera")) return "Opera";
  if (l.includes("chrome")) return "Chrome";
  if (l.includes("safari")) return "Safari";
  return "Other";
}

export function detectOS(ua: string): string {
  const l = ua.toLowerCase();
  if (l.includes("windows")) return "Windows";
  if (l.includes("mac os") || l.includes("macos")) return "macOS";
  if (l.includes("linux")) return "Linux";
  if (l.includes("android")) return "Android";
  if (l.includes("ios") || l.includes("iphone") || l.includes("ipad")) return "iOS";
  return "Other";
}

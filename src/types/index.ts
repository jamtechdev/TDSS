export type CampaignStatus = "draft" | "active" | "paused" | "archived";
export type TrafficSource = "taboola" | "meta" | "google" | "tiktok" | "other";
export type DeviceType = "desktop" | "mobile" | "tablet";
export type TargetingType = "geo" | "device";
export type ConversionSource = "shopify" | "manual";

export interface Domain {
  id: string;
  domain: string;
  is_verified: boolean;
  ssl_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  slug: string;
  status: CampaignStatus;
  traffic_source: TrafficSource;
  traffic_source_campaign_id?: string;
  domain_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  domain?: Domain;
  landers?: Lander[];
  offers?: Offer[];
  targeting_rules?: TargetingRule[];
}

export interface Lander {
  id: string;
  campaign_id: string;
  name: string;
  url: string;
  weight: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Offer {
  id: string;
  campaign_id: string;
  name: string;
  url: string;
  weight: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TargetingRule {
  id: string;
  campaign_id: string;
  rule_type: TargetingType;
  country_code?: string | null;
  region?: string | null;
  device?: DeviceType | null;
  offer_id?: string | null;
  priority: number;
  is_active: boolean;
  created_at: string;
}

export interface Conversion {
  id: string;
  click_id?: string;
  session_id?: string;
  campaign_id: string;
  lander_id?: string;
  offer_id?: string;
  source: ConversionSource;
  revenue: number;
  order_id?: string;
  product_name?: string;
  currency: string;
  country_code?: string;
  created_at: string;
}

export interface CampaignSummary {
  id: string;
  name: string;
  slug: string;
  status: CampaignStatus;
  traffic_source?: TrafficSource;
  domain?: string;
  total_visits: number;
  total_clicks: number;
  total_conversions: number;
  total_revenue: number;
  total_cost: number;
  total_profit: number;
  avg_ctr: number;
  avg_cr: number;
  avg_roi: number;
  avg_epc: number;
  avg_cpa: number;
  created_at: string;
}

export interface DashboardFilters {
  date_from?: string;
  date_to?: string;
  country_code?: string;
  device?: DeviceType;
  traffic_source?: TrafficSource;
}

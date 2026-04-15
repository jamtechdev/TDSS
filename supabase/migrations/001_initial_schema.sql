-- ============================================================
-- TDS (Traffic Distribution System) — Full Database Schema
-- Supabase / PostgreSQL
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. DOMAINS
-- ============================================================
CREATE TABLE domains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain VARCHAR(255) NOT NULL UNIQUE,
  is_verified BOOLEAN DEFAULT false,
  ssl_active BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. CAMPAIGNS
-- ============================================================
CREATE TYPE campaign_status AS ENUM ('draft', 'active', 'paused', 'archived');
CREATE TYPE traffic_source_type AS ENUM ('taboola', 'meta', 'google', 'tiktok', 'other');

CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE, -- used in the campaign URL
  status campaign_status DEFAULT 'draft',
  traffic_source traffic_source_type DEFAULT 'taboola',
  traffic_source_campaign_id VARCHAR(255), -- external campaign ID (e.g. Taboola campaign ID)
  domain_id UUID REFERENCES domains(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_campaigns_slug ON campaigns(slug);
CREATE INDEX idx_campaigns_status ON campaigns(status);

-- ============================================================
-- 3. LANDERS (Landing Pages)
-- ============================================================
CREATE TABLE landers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  weight INTEGER NOT NULL DEFAULT 100, -- traffic split weight (percentage points)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_landers_campaign ON landers(campaign_id);

-- ============================================================
-- 4. OFFERS (Product Pages)
-- ============================================================
CREATE TABLE offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  weight INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_offers_campaign ON offers(campaign_id);

-- ============================================================
-- 5. GEO/DEVICE TARGETING RULES
-- ============================================================
CREATE TYPE targeting_type AS ENUM ('geo', 'device');
CREATE TYPE device_type AS ENUM ('desktop', 'mobile', 'tablet');

CREATE TABLE targeting_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  rule_type targeting_type NOT NULL,
  -- Geo targeting
  country_code VARCHAR(2),       -- ISO 3166-1 alpha-2
  region VARCHAR(100),
  -- Device targeting
  device device_type,
  -- Target offer
  offer_id UUID REFERENCES offers(id) ON DELETE CASCADE,
  priority INTEGER DEFAULT 0,    -- higher = checked first
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_targeting_campaign ON targeting_rules(campaign_id);

-- ============================================================
-- 6. SESSIONS (Visitor Tracking)
-- ============================================================
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  lander_id UUID REFERENCES landers(id) ON DELETE SET NULL,
  -- Visitor info
  visitor_id VARCHAR(64),       -- fingerprint or cookie ID
  ip_address INET,
  country_code VARCHAR(2),
  region VARCHAR(100),
  city VARCHAR(100),
  device device_type,
  browser VARCHAR(100),
  os VARCHAR(100),
  language VARCHAR(20),
  referrer TEXT,
  user_agent TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_campaign ON sessions(campaign_id);
CREATE INDEX idx_sessions_visitor ON sessions(visitor_id);
CREATE INDEX idx_sessions_created ON sessions(created_at);
CREATE INDEX idx_sessions_country ON sessions(country_code);

-- ============================================================
-- 7. CLICKS
-- ============================================================
CREATE TABLE clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  lander_id UUID REFERENCES landers(id) ON DELETE SET NULL,
  offer_id UUID REFERENCES offers(id) ON DELETE SET NULL,
  -- Click metadata
  country_code VARCHAR(2),
  device device_type,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clicks_session ON clicks(session_id);
CREATE INDEX idx_clicks_campaign ON clicks(campaign_id);
CREATE INDEX idx_clicks_created ON clicks(created_at);
CREATE INDEX idx_clicks_lander ON clicks(lander_id);
CREATE INDEX idx_clicks_offer ON clicks(offer_id);

-- ============================================================
-- 8. CONVERSIONS
-- ============================================================
CREATE TYPE conversion_source AS ENUM ('shopify', 'manual');

CREATE TABLE conversions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  click_id UUID REFERENCES clicks(id) ON DELETE SET NULL,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  lander_id UUID REFERENCES landers(id) ON DELETE SET NULL,
  offer_id UUID REFERENCES offers(id) ON DELETE SET NULL,
  -- Conversion data
  source conversion_source NOT NULL DEFAULT 'manual',
  revenue DECIMAL(12, 2) NOT NULL DEFAULT 0,
  order_id VARCHAR(255),        -- Shopify order ID or manual reference
  product_name VARCHAR(255),
  currency VARCHAR(3) DEFAULT 'USD',
  -- Metadata
  country_code VARCHAR(2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversions_campaign ON conversions(campaign_id);
CREATE INDEX idx_conversions_click ON conversions(click_id);
CREATE INDEX idx_conversions_created ON conversions(created_at);

-- ============================================================
-- 9. COSTS (from Taboola / other sources)
-- ============================================================
CREATE TABLE costs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  traffic_source traffic_source_type NOT NULL DEFAULT 'taboola',
  external_campaign_id VARCHAR(255),
  -- Cost data
  amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  date DATE NOT NULL,
  country_code VARCHAR(2),
  -- Metadata
  raw_data JSONB,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_costs_campaign ON costs(campaign_id);
CREATE INDEX idx_costs_date ON costs(date);
CREATE UNIQUE INDEX idx_costs_unique ON costs(campaign_id, date, country_code, traffic_source);

-- ============================================================
-- 10. KPI AGGREGATES (pre-computed for dashboard speed)
-- ============================================================
CREATE TABLE kpi_aggregates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  lander_id UUID REFERENCES landers(id) ON DELETE SET NULL,
  offer_id UUID REFERENCES offers(id) ON DELETE SET NULL,
  -- Dimensions
  date DATE NOT NULL,
  country_code VARCHAR(2),
  device device_type,
  -- Metrics
  visits INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue DECIMAL(12, 2) DEFAULT 0,
  cost DECIMAL(12, 2) DEFAULT 0,
  -- Computed (stored for fast reads)
  ctr DECIMAL(8, 4) DEFAULT 0,       -- clicks/visits * 100
  cr DECIMAL(8, 4) DEFAULT 0,        -- conversions/clicks * 100
  roi DECIMAL(12, 4) DEFAULT 0,      -- (revenue-cost)/cost * 100
  epc DECIMAL(12, 4) DEFAULT 0,      -- revenue/clicks
  cpa DECIMAL(12, 4) DEFAULT 0,      -- cost/conversions
  profit DECIMAL(12, 2) DEFAULT 0,   -- revenue - cost
  -- Timestamps
  computed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_kpi_campaign ON kpi_aggregates(campaign_id);
CREATE INDEX idx_kpi_date ON kpi_aggregates(date);
CREATE UNIQUE INDEX idx_kpi_unique ON kpi_aggregates(
  campaign_id, COALESCE(lander_id, '00000000-0000-0000-0000-000000000000'),
  COALESCE(offer_id, '00000000-0000-0000-0000-000000000000'),
  date, COALESCE(country_code, '__'), COALESCE(device, 'desktop')
);

-- ============================================================
-- 11. FUNCTIONS: KPI Aggregation
-- ============================================================
CREATE OR REPLACE FUNCTION compute_kpi_metrics(
  p_visits INTEGER,
  p_clicks INTEGER,
  p_conversions INTEGER,
  p_revenue DECIMAL,
  p_cost DECIMAL
) RETURNS TABLE(
  ctr DECIMAL, cr DECIMAL, roi DECIMAL, 
  epc DECIMAL, cpa DECIMAL, profit DECIMAL
) AS $$
BEGIN
  RETURN QUERY SELECT
    CASE WHEN p_visits > 0 THEN (p_clicks::DECIMAL / p_visits * 100) ELSE 0 END,
    CASE WHEN p_clicks > 0 THEN (p_conversions::DECIMAL / p_clicks * 100) ELSE 0 END,
    CASE WHEN p_cost > 0 THEN ((p_revenue - p_cost) / p_cost * 100) ELSE 0 END,
    CASE WHEN p_clicks > 0 THEN (p_revenue / p_clicks) ELSE 0 END,
    CASE WHEN p_conversions > 0 THEN (p_cost / p_conversions) ELSE 0 END,
    (p_revenue - p_cost);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
-- 12. VIEWS: Dashboard Queries
-- ============================================================
CREATE OR REPLACE VIEW campaign_summary AS
SELECT
  c.id,
  c.name,
  c.slug,
  c.status,
  c.traffic_source,
  d.domain,
  COALESCE(SUM(k.visits), 0) AS total_visits,
  COALESCE(SUM(k.clicks), 0) AS total_clicks,
  COALESCE(SUM(k.conversions), 0) AS total_conversions,
  COALESCE(SUM(k.revenue), 0) AS total_revenue,
  COALESCE(SUM(k.cost), 0) AS total_cost,
  COALESCE(SUM(k.profit), 0) AS total_profit,
  CASE WHEN SUM(k.visits) > 0 THEN (SUM(k.clicks)::DECIMAL / SUM(k.visits) * 100) ELSE 0 END AS avg_ctr,
  CASE WHEN SUM(k.clicks) > 0 THEN (SUM(k.conversions)::DECIMAL / SUM(k.clicks) * 100) ELSE 0 END AS avg_cr,
  CASE WHEN SUM(k.cost) > 0 THEN ((SUM(k.revenue) - SUM(k.cost)) / SUM(k.cost) * 100) ELSE 0 END AS avg_roi,
  CASE WHEN SUM(k.clicks) > 0 THEN (SUM(k.revenue) / SUM(k.clicks)) ELSE 0 END AS avg_epc,
  CASE WHEN SUM(k.conversions) > 0 THEN (SUM(k.cost) / SUM(k.conversions)) ELSE 0 END AS avg_cpa,
  c.created_at
FROM campaigns c
LEFT JOIN domains d ON c.domain_id = d.id
LEFT JOIN kpi_aggregates k ON c.id = k.campaign_id
GROUP BY c.id, c.name, c.slug, c.status, c.traffic_source, d.domain, c.created_at;

-- ============================================================
-- 13. RLS (Row Level Security) - Basic setup
-- ============================================================
-- For internal use, we keep it simple. Enable RLS but allow all for authenticated users.
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE landers ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE targeting_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_aggregates ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (internal tool)
CREATE POLICY "Allow all for authenticated" ON campaigns FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON landers FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON offers FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON sessions FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON clicks FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON conversions FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON costs FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON domains FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON targeting_rules FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON kpi_aggregates FOR ALL USING (true);

-- ============================================================
-- 14. TRIGGERS: updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_campaigns_updated BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_landers_updated BEFORE UPDATE ON landers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_offers_updated BEFORE UPDATE ON offers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_domains_updated BEFORE UPDATE ON domains FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_sessions_updated BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

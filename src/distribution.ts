import type { Lander, Offer, TargetingRule, DeviceType } from '@/types';

/**
 * Weighted random selection — picks a variant based on configured weights.
 * Works for both landers and offers.
 */
export function weightedSelect<T extends { weight: number; is_active: boolean }>(
  variants: T[]
): T | null {
  const active = variants.filter((v) => v.is_active);
  if (active.length === 0) return null;
  if (active.length === 1) return active[0];

  const totalWeight = active.reduce((sum, v) => sum + v.weight, 0);
  let random = Math.random() * totalWeight;

  for (const variant of active) {
    random -= variant.weight;
    if (random <= 0) return variant;
  }

  return active[active.length - 1];
}

/**
 * Select a lander based on weights.
 */
export function selectLander(landers: Lander[]): Lander | null {
  return weightedSelect(landers);
}

/**
 * Select an offer — first checks targeting rules, then falls back to weight-based.
 */
export function selectOffer(
  offers: Offer[],
  rules: TargetingRule[],
  visitorContext: {
    country_code?: string;
    region?: string;
    device?: DeviceType;
  }
): Offer | null {
  // Sort rules by priority (highest first)
  const activeRules = rules
    .filter((r) => r.is_active)
    .sort((a, b) => b.priority - a.priority);

  for (const rule of activeRules) {
    let matches = true;

    if (rule.rule_type === 'geo') {
      if (rule.country_code && visitorContext.country_code) {
        matches = rule.country_code.toLowerCase() === visitorContext.country_code.toLowerCase();
      }
      if (matches && rule.region && visitorContext.region) {
        matches = rule.region.toLowerCase() === visitorContext.region.toLowerCase();
      }
    }

    if (rule.rule_type === 'device') {
      if (rule.device && visitorContext.device) {
        matches = rule.device === visitorContext.device;
      }
    }

    if (matches && rule.offer_id) {
      const targetOffer = offers.find((o) => o.id === rule.offer_id && o.is_active);
      if (targetOffer) return targetOffer;
    }
  }

  // No targeting rule matched — fall back to weighted selection
  return weightedSelect(offers);
}

/**
 * Generate a unique campaign slug from the name.
 */
export function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}

/**
 * Parse device type from user agent string.
 */
export function parseDeviceType(userAgent: string): DeviceType {
  const ua = userAgent.toLowerCase();
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android.*mobile|opera m(ob|in)|windows phone/i.test(ua)) return 'mobile';
  return 'desktop';
}

/**
 * Generate the tracking script for a campaign.
 */
export function generateTrackingScript(
  campaignSlug: string,
  trackingDomain: string
): string {
  return `<!-- TDS Tracking Script -->
<script>
(function() {
  var TDS_DOMAIN = "${trackingDomain}";
  var TDS_SLUG = "${campaignSlug}";
  
  function generateVisitorId() {
    var stored = null;
    try { stored = localStorage.getItem('tds_vid'); } catch(e) {}
    if (stored) return stored;
    var id = 'v_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
    try { localStorage.setItem('tds_vid', id); } catch(e) {}
    return id;
  }
  
  function getDeviceType() {
    var ua = navigator.userAgent.toLowerCase();
    if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
    if (/mobile|iphone|ipod|android.*mobile|opera m(ob|in)|windows phone/i.test(ua)) return 'mobile';
    return 'desktop';
  }
  
  function track() {
    var visitorId = generateVisitorId();
    var payload = {
      campaign_slug: TDS_SLUG,
      visitor_id: visitorId,
      device: getDeviceType(),
      browser: navigator.userAgent,
      language: navigator.language || '',
      referrer: document.referrer || '',
      user_agent: navigator.userAgent,
      page_url: window.location.href
    };
    
    fetch(TDS_DOMAIN + '/api/track/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.session_id) {
        window.__TDS_SESSION = data.session_id;
        // Store session for /click usage
        try { sessionStorage.setItem('tds_session', data.session_id); } catch(e) {}
        // Update all CTA links
        updateClickLinks(data.session_id);
      }
    })
    .catch(function(e) { console.warn('[TDS] Tracking error:', e); });
  }
  
  function updateClickLinks(sessionId) {
    var links = document.querySelectorAll('a[href*="/click"], a[data-tds-click]');
    links.forEach(function(link) {
      var url = new URL(TDS_DOMAIN + '/api/track/click');
      url.searchParams.set('sid', sessionId);
      url.searchParams.set('slug', TDS_SLUG);
      link.href = url.toString();
    });
  }
  
  // Auto-init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', track);
  } else {
    track();
  }
  
  // Expose for manual usage
  window.TDS = {
    getClickUrl: function() {
      var sid = window.__TDS_SESSION || '';
      try { sid = sid || sessionStorage.getItem('tds_session') || ''; } catch(e) {}
      return TDS_DOMAIN + '/api/track/click?sid=' + sid + '&slug=' + TDS_SLUG;
    }
  };
})();
</script>`;
}

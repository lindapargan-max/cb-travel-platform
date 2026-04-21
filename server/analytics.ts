import { sql } from "drizzle-orm";
import { getDb } from "./db";

let _tableEnsured = false;
async function ensureTable() {
  if (_tableEnsured) return;
  const db = await getDb();
  if (!db) return;
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS pageViews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sessionId VARCHAR(64) NOT NULL,
      ipAddress VARCHAR(255),
      userAgent VARCHAR(1000),
      path VARCHAR(500),
      referrer VARCHAR(500),
      country VARCHAR(100),
      city VARCHAR(100),
      viewedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_session (sessionId),
      INDEX idx_viewed (viewedAt)
    )`);
    _tableEnsured = true;
  } catch (e) {
    console.error('[Analytics] ensureTable error:', e);
  }
}

const geoCache = new Map<string, { country: string | null; city: string | null; expires: number }>();

function isPrivateOrLoopback(ip: string): boolean {
  if (!ip || ip === 'unknown') return true;
  // IPv4 private / loopback
  if (ip.startsWith('127.') || ip.startsWith('10.') || ip.startsWith('192.168.')) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return true;
  // IPv6 loopback / link-local / unique-local
  if (ip === '::1' || ip.toLowerCase().startsWith('fe80:') || ip.toLowerCase().startsWith('fc') || ip.toLowerCase().startsWith('fd')) return true;
  return false;
}

async function lookupOnce(url: string, parser: (data: any) => { country: string | null; city: string | null }) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 2500);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'cb-travel-analytics/1.0' } });
    if (!res.ok) return null;
    const data: any = await res.json();
    return parser(data);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function lookupGeo(ip: string): Promise<{ country: string | null; city: string | null }> {
  if (isPrivateOrLoopback(ip)) return { country: null, city: null };

  const cached = geoCache.get(ip);
  if (cached && cached.expires > Date.now()) return { country: cached.country, city: cached.city };

  // Try ipapi.co first (works for IPv4 + IPv6)
  let result = await lookupOnce(
    `https://ipapi.co/${encodeURIComponent(ip)}/json/`,
    (d) => ({ country: d?.country_name || null, city: d?.city || null })
  );

  // Fallback to ip-api.com if first failed or returned empty
  if (!result || (!result.country && !result.city)) {
    result = await lookupOnce(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,city`,
      (d) => (d?.status === 'success' ? { country: d.country || null, city: d.city || null } : { country: null, city: null })
    );
  }

  if (!result) result = { country: null, city: null };
  // Cache successes for 24h, failures for only 10 min so transient errors recover quickly
  const ttl = (result.country || result.city) ? 24 * 60 * 60 * 1000 : 10 * 60 * 1000;
  geoCache.set(ip, { country: result.country, city: result.city, expires: Date.now() + ttl });
  if (!result.country && !result.city) {
    console.warn('[Analytics] geo lookup empty for IP:', ip);
  }
  return result;
}

export async function recordPageView(opts: {
  sessionId: string; ipAddress: string; userAgent: string; path: string; referrer: string;
}): Promise<void> {
  await ensureTable();
  const db = await getDb();
  if (!db) return;
  // Take only the first IP from a comma-separated x-forwarded-for chain
  let cleanIp = (opts.ipAddress || '').split(',')[0].trim();
  // Normalize IPv4-mapped IPv6 (::ffff:1.2.3.4 -> 1.2.3.4)
  if (cleanIp.toLowerCase().startsWith('::ffff:')) cleanIp = cleanIp.slice(7);
  cleanIp = cleanIp.slice(0, 255);
  const { country, city } = await lookupGeo(cleanIp);
  try {
    await db.execute(sql`INSERT INTO pageViews (sessionId, ipAddress, userAgent, path, referrer, country, city, viewedAt)
      VALUES (${opts.sessionId.slice(0, 64)}, ${cleanIp}, ${(opts.userAgent || '').slice(0, 1000)},
              ${(opts.path || '').slice(0, 500)}, ${(opts.referrer || '').slice(0, 500)}, ${country}, ${city}, UTC_TIMESTAMP())`);
  } catch (e) {
    console.error('[Analytics] recordPageView error:', e);
  }
}

export async function getLiveVisitors() {
  await ensureTable();
  const db = await getDb();
  if (!db) return { count: 0, sessions: [] as any[] };
  try {
    const result: any = await db.execute(sql`
      SELECT sessionId,
             DATE_FORMAT(MAX(viewedAt), '%Y-%m-%dT%H:%i:%sZ') AS lastSeen,
             MAX(ipAddress) AS ipAddress,
             MAX(userAgent) AS userAgent,
             MAX(country)   AS country,
             MAX(city)      AS city,
             SUBSTRING_INDEX(GROUP_CONCAT(path ORDER BY viewedAt DESC SEPARATOR '|||'), '|||', 1) AS lastPath,
             COUNT(*)       AS pageViews
      FROM pageViews
      WHERE viewedAt >= (UTC_TIMESTAMP() - INTERVAL 5 MINUTE)
      GROUP BY sessionId
      ORDER BY MAX(viewedAt) DESC
    `);
    const sessions = result?.[0] || [];
    return { count: sessions.length, sessions };
  } catch (e) {
    console.error('[Analytics] getLiveVisitors error:', e);
    return { count: 0, sessions: [] as any[] };
  }
}

export async function getStats() {
  await ensureTable();
  const empty = {
    visitorsToday: 0, viewsToday: 0,
    visitorsWeek: 0, viewsWeek: 0,
    visitorsMonth: 0, viewsMonth: 0,
    topPages: [] as { path: string; views: number }[],
    topCountries: [] as { country: string; views: number }[],
    topReferrers: [] as { referrer: string; views: number }[],
    hourly: [] as { hour: string; views: number }[],
  };
  const db = await getDb();
  if (!db) return empty;
  try {
    const [todayR]: any   = await db.execute(sql`SELECT COUNT(DISTINCT sessionId) AS visitors, COUNT(*) AS views FROM pageViews WHERE viewedAt >= (UTC_TIMESTAMP() - INTERVAL 1 DAY)`);
    const [weekR]: any    = await db.execute(sql`SELECT COUNT(DISTINCT sessionId) AS visitors, COUNT(*) AS views FROM pageViews WHERE viewedAt >= (UTC_TIMESTAMP() - INTERVAL 7 DAY)`);
    const [monthR]: any   = await db.execute(sql`SELECT COUNT(DISTINCT sessionId) AS visitors, COUNT(*) AS views FROM pageViews WHERE viewedAt >= (UTC_TIMESTAMP() - INTERVAL 30 DAY)`);
    const [pagesR]: any   = await db.execute(sql`SELECT path, COUNT(*) AS views FROM pageViews WHERE viewedAt >= (UTC_TIMESTAMP() - INTERVAL 7 DAY) GROUP BY path ORDER BY views DESC LIMIT 10`);
    const [countryR]: any = await db.execute(sql`SELECT COALESCE(NULLIF(country,''),'Unknown') AS country, COUNT(*) AS views FROM pageViews WHERE viewedAt >= (UTC_TIMESTAMP() - INTERVAL 7 DAY) GROUP BY country ORDER BY views DESC LIMIT 10`);
    const [refR]: any     = await db.execute(sql`SELECT COALESCE(NULLIF(referrer,''),'Direct') AS referrer, COUNT(*) AS views FROM pageViews WHERE viewedAt >= (UTC_TIMESTAMP() - INTERVAL 7 DAY) GROUP BY referrer ORDER BY views DESC LIMIT 10`);
    const [hourlyR]: any  = await db.execute(sql`SELECT DATE_FORMAT(viewedAt,'%Y-%m-%d %H:00') AS hour, COUNT(*) AS views FROM pageViews WHERE viewedAt >= (UTC_TIMESTAMP() - INTERVAL 24 HOUR) GROUP BY hour ORDER BY hour ASC`);
    return {
      visitorsToday: Number(todayR?.[0]?.visitors || 0),
      viewsToday:    Number(todayR?.[0]?.views || 0),
      visitorsWeek:  Number(weekR?.[0]?.visitors || 0),
      viewsWeek:     Number(weekR?.[0]?.views || 0),
      visitorsMonth: Number(monthR?.[0]?.visitors || 0),
      viewsMonth:    Number(monthR?.[0]?.views || 0),
      topPages:      (pagesR || []).map((r: any) => ({ path: r.path, views: Number(r.views) })),
      topCountries:  (countryR || []).map((r: any) => ({ country: r.country, views: Number(r.views) })),
      topReferrers:  (refR || []).map((r: any) => ({ referrer: r.referrer, views: Number(r.views) })),
      hourly:        (hourlyR || []).map((r: any) => ({ hour: r.hour, views: Number(r.views) })),
    };
  } catch (e) {
    console.error('[Analytics] getStats error:', e);
    return empty;
  }
}

export async function getRecentVisits(limit = 100) {
  await ensureTable();
  const db = await getDb();
  if (!db) return [] as any[];
  try {
    const lim = Math.max(1, Math.min(500, Math.floor(limit)));
    const result: any = await db.execute(sql.raw(`
      SELECT id, sessionId, ipAddress, userAgent, path, referrer, country, city,
             DATE_FORMAT(viewedAt, '%Y-%m-%dT%H:%i:%sZ') AS viewedAt
      FROM pageViews ORDER BY viewedAt DESC LIMIT ${lim}
    `));
    return (result?.[0] || []) as any[];
  } catch (e) {
    console.error('[Analytics] getRecentVisits error:', e);
    return [];
  }
}

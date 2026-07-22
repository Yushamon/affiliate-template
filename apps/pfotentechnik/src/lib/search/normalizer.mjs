const metric = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;

export function normalizeUrl(value, canonicalOrigin = "https://pfotentechnik.de") {
  const raw = String(value || "").trim();
  if (!raw) return "/";
  try {
    const url = new URL(raw.startsWith("/") ? raw : raw.match(/^https?:\/\//i) ? raw : `/${raw}`, canonicalOrigin);
    const pathname = url.pathname.replace(/\/{2,}/g, "/").replace(/\/+$/, "");
    return pathname ? `${pathname}/` : "/";
  } catch {
    const cleaned = raw.split(/[?#]/, 1)[0].replace(/^https?:\/\/[^/]+/i, "");
    const pathname = `/${cleaned}`.replace(/\/{2,}/g, "/").replace(/\/+$/, "");
    return pathname || "/";
  }
}

export function normalizeQuery(value) {
  const original = String(value || "").trim().replace(/\s+/g, " ");
  return { original, key: original.toLocaleLowerCase("de-DE") };
}

export function summarizeMetrics(rows = []) {
  let clicks = 0;
  let impressions = 0;
  let weightedPosition = 0;
  for (const row of rows) {
    const rowImpressions = metric(row.impressions);
    clicks += metric(row.clicks);
    impressions += rowImpressions;
    weightedPosition += metric(row.position) * rowImpressions;
  }
  return {
    clicks: Math.round(clicks),
    impressions: Math.round(impressions),
    ctr: impressions ? Number(((clicks / impressions) * 100).toFixed(2)) : 0,
    position: impressions ? Number((weightedPosition / impressions).toFixed(1)) : 0,
  };
}

export function mergeMetricRows(rows = [], kind) {
  const merged = new Map();
  for (const row of rows) {
    const visible = kind === "page" ? String(row.page || "") : normalizeQuery(row.query).original;
    if (!visible) continue;
    const key = kind === "page" ? normalizeUrl(visible) : normalizeQuery(visible).key;
    const current = merged.get(key) || { visible: kind === "page" ? key : visible, rows: [] };
    current.rows.push(row);
    if (kind === "query" && visible.length > current.visible.length) current.visible = visible;
    merged.set(key, current);
  }
  return [...merged.values()].map(({ visible, rows: grouped }) => ({
    [kind]: visible,
    ...summarizeMetrics(grouped),
  })).sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks);
}

export function percentChange(current, previous) {
  if (!previous) return current ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

export function metricChange(current, previous) {
  return {
    clicks: percentChange(current.clicks, previous.clicks),
    impressions: percentChange(current.impressions, previous.impressions),
    ctr: Number((current.ctr - previous.ctr).toFixed(2)),
    position: Number((previous.position - current.position).toFixed(1)),
  };
}

import fs from "node:fs";
import path from "node:path";
import { DATA_DIR, atomicWriteJson } from "./config.mjs";
import { SearchError } from "./errors.mjs";
import { normalizeQuery, normalizeUrl } from "./normalizer.mjs";

const rangeKeys = ["7d", "28d", "3m", "6m", "12m"];
const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;

export function combineMetricValues(entries) {
  const available = entries.filter((entry) => entry && typeof entry === "object");
  if (!available.length) return null;
  let clicks = 0, impressions = 0, weightedPosition = 0, positionWeight = 0;
  for (const entry of available) {
    clicks += number(entry.clicks); impressions += number(entry.impressions);
    if (entry.position !== null && Number.isFinite(Number(entry.position)) && number(entry.impressions) > 0) { weightedPosition += Number(entry.position) * number(entry.impressions); positionWeight += number(entry.impressions); }
  }
  return { clicks: Math.round(clicks), impressions: Math.round(impressions), ctr: impressions ? Number(((clicks / impressions) * 100).toFixed(2)) : 0, position: positionWeight ? Number((weightedPosition / positionWeight).toFixed(1)) : null };
}

function providerMetric(row) {
  return row ? { clicks: number(row.clicks), impressions: number(row.impressions), ctr: number(row.ctr), position: row.position === null || row.position === undefined ? null : number(row.position) } : null;
}

function mergeRows(googleRows = [], bingRows = [], field) {
  const groups = new Map();
  for (const [provider, rows] of [["google", googleRows], ["bing", bingRows]]) {
    for (const row of rows || []) {
      const visible = field === "page" ? normalizeUrl(row.page) : normalizeQuery(row.query).original;
      const key = field === "page" ? visible : normalizeQuery(visible).key; if (!key) continue;
      const group = groups.get(key) || { visible, providers: {} }; group.providers[provider] = providerMetric(row); groups.set(key, group);
    }
  }
  return [...groups.values()].map((group) => {
    const metrics = combineMetricValues(Object.values(group.providers));
    const sources = Object.keys(group.providers);
    return { [field]: group.visible, ...metrics, sources, providers: group.providers };
  }).sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks);
}

function mergeTrend(googleRows = [], bingRows = []) {
  const groups = new Map();
  for (const [provider, rows] of [["google", googleRows], ["bing", bingRows]]) for (const row of rows || []) {
    const date = String(row.date || "").slice(0, 10); if (!date) continue;
    const group = groups.get(date) || {}; group[provider] = providerMetric(row); groups.set(date, group);
  }
  return [...groups.entries()].map(([date, providers]) => ({ date, ...combineMetricValues(Object.values(providers)), sources: Object.keys(providers), providers })).sort((a, b) => a.date.localeCompare(b.date));
}

function differenceRecommendations(pages, queries, bingRange, bingStale) {
  const result = [];
  for (const row of [...pages, ...queries]) {
    const target = row.page || row.query; const field = row.page ? { page: row.page } : { page: "", query: row.query };
    if (row.providers.bing && !row.providers.google && row.providers.bing.impressions > 0) result.push({ priority: "medium", type: "bing-only-visibility", title: "Nur bei Bing sichtbar", ...field, reason: `Für „${target}“ liegen im Zeitraum Bing-Impressionen, aber keine Google-Impressionen im Datensatz vor.`, action: "Google-Sichtbarkeit separat prüfen; fehlende Trafficdaten nicht als fehlende Indexierung interpretieren." });
    if (row.providers.google && !row.providers.bing && row.providers.google.impressions > 0) result.push({ priority: "low", type: "google-only-visibility", title: "Keine Bing-Impressionen im Zeitraum", ...field, reason: `Für „${target}“ liegen Google-, aber keine Bing-Impressionen im gewählten Zeitraum vor.`, action: "Bing-Sichtbarkeit, Snippet und Crawl-Hinweise prüfen." });
    if (row.providers.google && row.providers.bing) {
      const ctrDiff = Math.abs(row.providers.google.ctr - row.providers.bing.ctr); const posDiff = row.providers.google.position !== null && row.providers.bing.position !== null ? Math.abs(row.providers.google.position - row.providers.bing.position) : 0;
      if (ctrDiff >= 2) result.push({ priority: "medium", type: "provider-ctr-gap", title: "Deutliche CTR-Differenz", ...field, reason: `Google ${row.providers.google.ctr.toFixed(2)} %, Bing ${row.providers.bing.ctr.toFixed(2)} %.`, action: "Snippets und Suchintention providerbezogen vergleichen." });
      if (posDiff >= 5) result.push({ priority: "medium", type: "provider-position-gap", title: "Deutliche Positionsdifferenz", ...field, reason: `Google Position ${row.providers.google.position}, Bing Position ${row.providers.bing.position}.`, action: "Provider-spezifische Rankings und interne Signale vergleichen." });
    }
  }
  if (bingStale) result.push({ priority: "low", type: "bing-stale", title: "Bing-Daten veraltet", page: "", reason: "Combined enthält den letzten gültigen Bing-Datenstand.", action: "Bing-Sync und Datenalter prüfen; kurzfristige Vergleiche zurückhaltend bewerten." });
  const crawlErrors = (bingRange?.crawl || []).reduce((sum, row) => sum + number(row.crawlErrors) + number(row.code5xx), 0);
  if (crawlErrors) result.push({ priority: "high", type: "bing-crawl", title: "Bing-Crawl-Hinweise prüfen", page: "", reason: `${crawlErrors} gelieferte Crawl-/5xx-Hinweise im Zeitraum.`, action: "Bing-Crawl-Daten und betroffene URLs im Webmaster-Portal prüfen." });
  return result.slice(0, 150);
}

export function buildCombinedDashboard({ google = null, bing = null, staleProviders = [], generatedAt = new Date().toISOString() }) {
  if (!google?.ranges && !bing?.ranges) throw new SearchError("SEARCH_NO_DATA", { message: "Keine gültigen Google- oder Bing-Daten für Combined vorhanden." });
  const ranges = {};
  for (const key of rangeKeys) {
    const googleRange = google?.ranges?.[key] || null; const bingRange = bing?.ranges?.[key] || null; if (!googleRange && !bingRange) continue;
    const current = combineMetricValues([googleRange?.metrics?.current, bingRange?.metrics?.current]);
    const previous = combineMetricValues([googleRange?.metrics?.previous, bingRange?.metrics?.previous]);
    const change = previous ? { clicks: previous.clicks ? Number((((current.clicks - previous.clicks) / previous.clicks) * 100).toFixed(1)) : current.clicks ? 100 : 0, impressions: previous.impressions ? Number((((current.impressions - previous.impressions) / previous.impressions) * 100).toFixed(1)) : current.impressions ? 100 : 0, ctr: Number((current.ctr - previous.ctr).toFixed(2)), position: current.position !== null && previous.position !== null ? Number((previous.position - current.position).toFixed(1)) : null } : null;
    const pages = mergeRows(googleRange?.pages, bingRange?.pages, "page"); const queries = mergeRows(googleRange?.queries, bingRange?.queries, "query");
    ranges[key] = {
      key, label: googleRange?.label || bingRange?.label || key, startDate: googleRange?.startDate || bingRange?.startDate || "", endDate: googleRange?.endDate || bingRange?.endDate || "",
      comparisonStartDate: googleRange?.comparisonStartDate || bingRange?.comparisonStartDate || "", comparisonEndDate: googleRange?.comparisonEndDate || bingRange?.comparisonEndDate || "",
      dataState: "combined", partial: staleProviders.length > 0, lowData: current.impressions < 100, metrics: { current, previous, change }, pages, queries,
      trend: mergeTrend(googleRange?.trend, bingRange?.trend), crawl: bingRange?.crawl || [],
      recommendations: [...(googleRange?.recommendations || []).map((item) => ({ ...item, source: "google" })), ...(bingRange?.recommendations || []).map((item) => ({ ...item, source: "bing" })), ...differenceRecommendations(pages, queries, bingRange, staleProviders.includes("bing"))],
      providerAvailability: { google: Boolean(googleRange), bing: Boolean(bingRange), stale: staleProviders },
    };
  }
  const dataUpdatedAt = { google: google?.generatedAt || null, bing: bing?.dataUpdatedAt || bing?.generatedAt || null };
  return { schemaVersion: 2, provider: "combined", generatedAt, property: google?.property || bing?.siteUrl || "pfotentechnik.de", defaultRange: ranges["7d"] ? "7d" : Object.keys(ranges)[0], dataUpdatedAt, providerStatus: { google: google ? (staleProviders.includes("google") ? "stale" : "current") : "missing", bing: bing ? (staleProviders.includes("bing") ? "stale" : "current") : "missing" }, ranges };
}

export function readProviderDashboard(provider) {
  const file = path.join(DATA_DIR, provider === "google" ? "gsc-dashboard-ranges.json" : "bing-dashboard-ranges.json");
  if (!fs.existsSync(file)) return null;
  try { const parsed = JSON.parse(fs.readFileSync(file, "utf8")); return parsed?.ranges ? parsed : null; } catch { return null; }
}

export function writeCombinedDashboard(payload) {
  const rangesFile = path.join(DATA_DIR, "search-dashboard-ranges.json"); const singleFile = path.join(DATA_DIR, "search-dashboard.json"); const active = payload.ranges[payload.defaultRange];
  atomicWriteJson(rangesFile, payload); atomicWriteJson(singleFile, { schemaVersion: 2, provider: "combined", generatedAt: payload.generatedAt, property: payload.property, dataUpdatedAt: payload.dataUpdatedAt, providerStatus: payload.providerStatus, range: payload.defaultRange, ...active });
  return { rangesFile, singleFile, pagesCount: active.pages.length, queriesCount: active.queries.length, metrics: active.metrics.current };
}

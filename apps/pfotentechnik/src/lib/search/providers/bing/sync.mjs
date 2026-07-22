import fs from "node:fs";
import path from "node:path";
import { DATA_DIR, atomicWriteJson } from "../../config.mjs";
import { SearchError } from "../../errors.mjs";
import { searchLog } from "../../logging.mjs";
import { metricChange, normalizeQuery, normalizeUrl } from "../../normalizer.mjs";
import { recordProviderError, updateProviderStatus } from "../../status-store.mjs";
import { createBingClient } from "./client.mjs";
import { findConfiguredSite, loadBingConfig } from "./config.mjs";
import { mapBingCrawlStats, mapBingPageStats, mapBingQueryStats } from "./mapper.mjs";

export const BING_RANGE_DEFINITIONS = [
  ["7d", "Letzte 7 Tage", 7], ["28d", "Letzte 28 Tage", 28], ["3m", "Letzte 3 Monate", 90],
  ["6m", "Letzte 6 Monate", 180], ["12m", "Letzte 12 Monate", 365],
];

const dayMs = 86_400_000;
const isoDay = (value) => new Date(value).toISOString().slice(0, 10);
const addDays = (date, days) => new Date(date.getTime() + days * dayMs);
const within = (date, start, end) => { const time = Date.parse(date); return Number.isFinite(time) && time >= start.getTime() && time <= end.getTime() + dayMs - 1; };

export function summarizeBingRows(rows = []) {
  let clicks = 0, impressions = 0, weightedPosition = 0, positionImpressions = 0, weightedClickPosition = 0, positionClicks = 0;
  for (const row of rows) {
    clicks += Number(row.clicks || 0); impressions += Number(row.impressions || 0);
    if (row.position !== null && Number.isFinite(Number(row.position)) && row.impressions > 0) { weightedPosition += Number(row.position) * row.impressions; positionImpressions += row.impressions; }
    if (row.avgClickPosition !== null && Number.isFinite(Number(row.avgClickPosition)) && row.clicks > 0) { weightedClickPosition += Number(row.avgClickPosition) * row.clicks; positionClicks += row.clicks; }
  }
  return {
    clicks: Math.round(clicks), impressions: Math.round(impressions), ctr: impressions ? Number(((clicks / impressions) * 100).toFixed(2)) : 0,
    position: positionImpressions ? Number((weightedPosition / positionImpressions).toFixed(1)) : null,
    avgClickPosition: positionClicks ? Number((weightedClickPosition / positionClicks).toFixed(1)) : null,
  };
}

function aggregateRows(rows, field) {
  const groups = new Map();
  for (const row of rows) {
    const visible = field === "page" ? normalizeUrl(row.page) : normalizeQuery(row.query).original;
    const key = field === "page" ? visible : normalizeQuery(visible).key;
    if (!key) continue;
    const group = groups.get(key) || { visible, rows: [] };
    group.rows.push(row); groups.set(key, group);
  }
  return [...groups.values()].map((group) => ({ [field]: group.visible, ...summarizeBingRows(group.rows) })).sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks);
}

function aggregateTrend(rows) {
  const groups = new Map();
  for (const row of rows) { const date = isoDay(row.date); const group = groups.get(date) || []; group.push(row); groups.set(date, group); }
  return [...groups.entries()].map(([date, grouped]) => ({ date, ...summarizeBingRows(grouped) })).sort((a, b) => a.date.localeCompare(b.date));
}

function recommendations(pages, queries, freshness) {
  const result = [];
  for (const page of pages) {
    if (page.impressions >= 20 && page.clicks === 0) result.push({ priority: "medium", type: "bing-zero-clicks", title: "Bing-Impressionen ohne Klick", page: page.page, reason: `${page.impressions} Bing-Impressionen ohne Klick`, action: "Snippet und Suchintention für Bing prüfen; fehlenden Traffic nicht als Indexierungsfehler interpretieren." });
    else if (page.position !== null && page.position >= 4 && page.position <= 20 && page.impressions >= 20) result.push({ priority: "medium", type: "bing-ranking", title: "Bing-Rankingchance", page: page.page, reason: `${page.impressions} Impressionen bei Position ${page.position}`, action: "Inhalt und interne Verlinkung für die sichtbare Bing-Query prüfen." });
  }
  for (const query of queries.filter((row) => row.impressions >= 20 && row.ctr < 2).slice(0, 20)) result.push({ priority: "medium", type: "bing-ctr", title: "Bing-CTR-Chance", page: "", query: query.query, reason: `${query.impressions} Impressionen bei ${query.ctr.toFixed(2)} % CTR`, action: "Title und Description auf die Bing-Suchintention ausrichten." });
  if (freshness.status === "stale") result.push({ priority: "low", type: "bing-stale", title: "Bing-Daten sind veraltet", page: "", reason: freshness.note, action: "Bing-Portal und API-Aktualisierung prüfen; keine kurzfristigen Trends ableiten." });
  return result.slice(0, 100);
}

export function buildBingDashboard({ siteUrl, queryRows, pageRows, crawlRows, generatedAt = new Date().toISOString() }) {
  const timestamps = [...queryRows, ...pageRows, ...crawlRows].map((row) => Date.parse(row.date)).filter(Number.isFinite);
  const dataUpdatedAt = timestamps.length ? new Date(Math.max(...timestamps)).toISOString() : null;
  const ageDays = dataUpdatedAt ? Math.max(0, Math.floor((Date.now() - Date.parse(dataUpdatedAt)) / dayMs)) : null;
  const freshness = { status: ageDays === null ? "unknown" : ageDays <= 8 ? "current" : "stale", ageDays, note: ageDays === null ? "Bing hat keinen datierten Datenstand geliefert." : `Bing-Trafficdaten werden periodisch, typischerweise wöchentlich aktualisiert; letzter gelieferter Stand ist ${ageDays} Tag(e) alt.` };
  const anchor = addDays(new Date(), -1);
  const ranges = {};
  for (const [key, label, days] of BING_RANGE_DEFINITIONS) {
    const end = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), anchor.getUTCDate()));
    const start = addDays(end, -(days - 1));
    const previousEnd = addDays(start, -1); const previousStart = addDays(previousEnd, -(days - 1));
    const currentQueriesRaw = queryRows.filter((row) => within(row.date, start, end));
    const previousQueriesRaw = queryRows.filter((row) => within(row.date, previousStart, previousEnd));
    const pages = aggregateRows(pageRows.filter((row) => within(row.date, start, end)), "page");
    const queries = aggregateRows(currentQueriesRaw, "query");
    const current = summarizeBingRows(currentQueriesRaw.length ? currentQueriesRaw : pageRows.filter((row) => within(row.date, start, end)));
    const previous = previousQueriesRaw.length ? summarizeBingRows(previousQueriesRaw) : null;
    const crawl = crawlRows.filter((row) => within(row.date, start, end));
    ranges[key] = {
      key, label, startDate: isoDay(start), endDate: isoDay(end), comparisonStartDate: isoDay(previousStart), comparisonEndDate: isoDay(previousEnd),
      dataState: "periodic", partial: false, lowData: current.impressions < 100, comparisonAvailable: Boolean(previous),
      metrics: { current, previous, change: previous ? { ...metricChange(current, previous), position: current.position !== null && previous.position !== null ? Number((previous.position - current.position).toFixed(1)) : null } : null }, pages, queries,
      trend: aggregateTrend(currentQueriesRaw), crawl, recommendations: recommendations(pages, queries, freshness),
    };
  }
  return { schemaVersion: 2, provider: "bing", generatedAt, dataUpdatedAt, siteUrl, property: siteUrl, defaultRange: "28d", freshness, ranges };
}

function writeBingDashboard(payload) {
  const rangesFile = path.join(DATA_DIR, "bing-dashboard-ranges.json");
  const singleFile = path.join(DATA_DIR, "bing-dashboard.json");
  const active = payload.ranges[payload.defaultRange];
  atomicWriteJson(rangesFile, payload);
  atomicWriteJson(singleFile, { schemaVersion: 2, provider: "bing", generatedAt: payload.generatedAt, dataUpdatedAt: payload.dataUpdatedAt, siteUrl: payload.siteUrl, property: payload.siteUrl, freshness: payload.freshness, range: payload.defaultRange, ...active });
  JSON.parse(fs.readFileSync(rangesFile, "utf8")); JSON.parse(fs.readFileSync(singleFile, "utf8"));
}

export async function syncBingSearch({ client: providedClient, onProgress } = {}) {
  const started = Date.now(); const lastAttemptAt = new Date().toISOString();
  updateProviderStatus("bing", { lastAttemptAt, lastError: null });
  try {
    const config = loadBingConfig(); const client = providedClient || createBingClient({ config });
    onProgress?.({ step: "bing-sites", message: "Bing-Website und Verifizierung werden geprüft." });
    const sites = await client.getUserSites(); const matches = findConfiguredSite(sites, config.siteUrl);
    if (matches.length !== 1) throw new SearchError("BING_SITE_NOT_FOUND");
    if (matches[0].IsVerified === false) throw new SearchError("BING_SITE_NOT_VERIFIED");
    const siteUrl = matches[0].Url || config.siteUrl;
    onProgress?.({ step: "bing-traffic", message: "Bing-Queries und Seiten werden geladen." });
    const [queriesRaw, pagesRaw, crawlRaw] = await Promise.all([client.getQueryStats(siteUrl), client.getPageStats(siteUrl), client.getCrawlStats(siteUrl)]);
    onProgress?.({ step: "bing-normalize", message: "Bing-Daten werden normalisiert und nach Zeiträumen gefiltert." });
    const payload = buildBingDashboard({ siteUrl, queryRows: mapBingQueryStats(queriesRaw), pageRows: mapBingPageStats(pagesRaw), crawlRows: mapBingCrawlStats(crawlRaw) });
    writeBingDashboard(payload);
    const active = payload.ranges[payload.defaultRange]; const durationMs = Date.now() - started;
    updateProviderStatus("bing", { configured: true, connected: true, health: "connected", property: siteUrl, siteUrl, lastAttemptAt, lastSuccessfulSyncAt: payload.generatedAt, dataUpdatedAt: payload.dataUpdatedAt, lastDurationMs: durationMs, lastError: null, pagesCount: active.pages.length, queriesCount: active.queries.length, crawlRowsCount: active.crawl.length });
    searchLog({ provider: "bing", action: "sync", status: "succeeded", durationMs, records: active.pages.length + active.queries.length + active.crawl.length });
    return { ok: true, generatedAt: payload.generatedAt, dataUpdatedAt: payload.dataUpdatedAt, siteUrl, ranges: Object.keys(payload.ranges), pagesCount: active.pages.length, queriesCount: active.queries.length, crawlRowsCount: active.crawl.length, durationMs };
  } catch (error) {
    recordProviderError("bing", error, { lastDurationMs: Date.now() - started });
    searchLog({ provider: "bing", action: "sync", status: "failed", durationMs: Date.now() - started, code: error?.code, message: error?.message });
    throw error;
  }
}

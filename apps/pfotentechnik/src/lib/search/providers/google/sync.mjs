import fs from "node:fs";
import path from "node:path";
import { createGoogleClient } from "./client.mjs";
import { DATA_DIR, DEFAULT_PROPERTY, atomicWriteJson, loadGoogleConfig } from "../../config.mjs";
import { SearchError } from "../../errors.mjs";
import { mergeMetricRows, metricChange, normalizeQuery, normalizeUrl, summarizeMetrics } from "../../normalizer.mjs";
import { searchLog } from "../../logging.mjs";
import { recordProviderError, updateProviderStatus } from "../../status-store.mjs";

export const RANGE_DEFINITIONS = [
  ["7d", "Letzte 7 Tage", 7], ["28d", "Letzte 28 Tage", 28], ["3m", "Letzte 3 Monate", 90],
  ["6m", "Letzte 6 Monate", 180], ["12m", "Letzte 12 Monate", 365],
];

const isoDate = (date) => date.toISOString().slice(0, 10);
const addDays = (date, days) => { const copy = new Date(date); copy.setUTCDate(copy.getUTCDate() + days); return copy; };

function apiRows(rows, field) {
  return (rows || []).map((row) => ({
    [field]: row.keys?.[0] || "",
    clicks: Number(row.clicks || 0),
    impressions: Number(row.impressions || 0),
    ctr: Number((Number(row.ctr || 0) * 100).toFixed(2)),
    position: Number(Number(row.position || 0).toFixed(1)),
  }));
}

function recommendations(pages) {
  const rows = [];
  for (const page of pages) {
    if (page.position >= 8 && page.position <= 20 && page.impressions >= 20) rows.push({
      priority: "high", type: "quick-win", title: "Top-10-Chance", page: page.page,
      reason: `${page.impressions} Impressionen bei Position ${page.position.toFixed(1)}`,
      action: "Suchintention vertiefen und passende interne Links aus Hubs oder Cornerstones setzen.",
    });
    if (page.impressions >= 50 && page.position <= 15 && page.ctr < 2.5) rows.push({
      priority: "medium", type: "ctr", title: "Snippet optimieren", page: page.page,
      reason: `${page.impressions} Impressionen bei ${page.ctr.toFixed(2)} % CTR`,
      action: "Title und Description auf Nutzen, Suchintention und Differenzierung ausrichten.",
    });
  }
  return rows.slice(0, 100);
}

export async function loadGoogleRange(client, property, key, label, days, progress) {
  const end = addDays(new Date(), -1);
  const start = addDays(end, -(days - 1));
  const previousEnd = addDays(start, -1);
  const previousStart = addDays(previousEnd, -(days - 1));
  const base = { type: "web", dataState: "all" };
  progress?.({ step: `metrics-${key}`, message: `${label}: Kennzahlen werden geladen.` });
  const [currentRaw, previousRaw] = await Promise.all([
    client.query(property, { ...base, startDate: isoDate(start), endDate: isoDate(end) }),
    client.query(property, { ...base, startDate: isoDate(previousStart), endDate: isoDate(previousEnd) }),
  ]);
  progress?.({ step: `details-${key}`, message: `${label}: Seiten, Queries und Trend werden geladen.` });
  const [pagesRaw, queriesRaw, trendRaw] = await Promise.all([
    client.queryAll(property, { ...base, startDate: isoDate(start), endDate: isoDate(end), dimensions: ["page"] }),
    client.queryAll(property, { ...base, startDate: isoDate(start), endDate: isoDate(end), dimensions: ["query"] }),
    client.queryAll(property, { ...base, startDate: isoDate(start), endDate: isoDate(end), dimensions: ["date"] }, { maxRows: 400 }),
  ]);
  const current = summarizeMetrics(apiRows(currentRaw.rows, "metric"));
  const previous = summarizeMetrics(apiRows(previousRaw.rows, "metric"));
  const pages = mergeMetricRows(apiRows(pagesRaw.rows, "page").map((row) => ({ ...row, page: normalizeUrl(row.page) })), "page");
  const queries = mergeMetricRows(apiRows(queriesRaw.rows, "query").map((row) => ({ ...row, query: normalizeQuery(row.query).original })), "query");
  const trend = apiRows(trendRaw.rows, "date").sort((a, b) => a.date.localeCompare(b.date));
  return {
    key, label, startDate: isoDate(start), endDate: isoDate(end), comparisonStartDate: isoDate(previousStart), comparisonEndDate: isoDate(previousEnd),
    dataState: "all", partial: Boolean(currentRaw.metadata?.first_incomplete_date), lowData: current.impressions < 100,
    metrics: { current, previous, change: metricChange(current, previous) }, pages, queries, trend, recommendations: recommendations(pages),
  };
}

function writeDashboardPayload(payload) {
  const rangesFile = path.join(DATA_DIR, "gsc-dashboard-ranges.json");
  const singleFile = path.join(DATA_DIR, "gsc-dashboard.json");
  const defaultRange = payload.ranges[payload.defaultRange];
  if (!defaultRange || !Object.keys(payload.ranges).length) throw new SearchError("SEARCH_NO_DATA");
  atomicWriteJson(rangesFile, payload);
  atomicWriteJson(singleFile, { schemaVersion: payload.schemaVersion, generatedAt: payload.generatedAt, property: payload.property, provider: payload.provider, range: payload.defaultRange, ...defaultRange });
  JSON.parse(fs.readFileSync(rangesFile, "utf8"));
  JSON.parse(fs.readFileSync(singleFile, "utf8"));
}

export async function syncGoogleSearch({ ranges, onProgress } = {}) {
  const started = Date.now();
  const attemptAt = new Date().toISOString();
  updateProviderStatus("google", { lastAttemptAt: attemptAt, lastError: null });
  try {
    const config = loadGoogleConfig(false);
    const property = config?.property || config?.siteUrl || DEFAULT_PROPERTY;
    const client = await createGoogleClient();
    const accessible = await client.listSites();
    if (!accessible.some((site) => site.siteUrl === property)) throw new SearchError("SEARCH_PROPERTY_ACCESS_DENIED");
    const selected = RANGE_DEFINITIONS.filter(([key]) => !ranges?.length || ranges.includes(key));
    const datasets = {};
    for (let index = 0; index < selected.length; index += 1) {
      const [key, label, days] = selected[index];
      onProgress?.({ step: `range-${key}`, current: index + 1, total: selected.length, message: `${label} wird synchronisiert.` });
      datasets[key] = await loadGoogleRange(client, property, key, label, days, onProgress);
    }
    const payload = { schemaVersion: 2, generatedAt: new Date().toISOString(), property, provider: "google", defaultRange: datasets["7d"] ? "7d" : Object.keys(datasets)[0], ranges: datasets };
    writeDashboardPayload(payload);
    const active = datasets[payload.defaultRange];
    const durationMs = Date.now() - started;
    updateProviderStatus("google", {
      configured: true, connected: true, health: "connected", property, lastAttemptAt: attemptAt,
      lastSuccessfulSyncAt: payload.generatedAt, lastDurationMs: durationMs, lastError: null,
      pagesCount: active.pages.length, queriesCount: active.queries.length,
    });
    searchLog({ provider: "google", action: "sync", status: "succeeded", durationMs, records: active.pages.length + active.queries.length });
    return { ok: true, generatedAt: payload.generatedAt, property, ranges: Object.keys(datasets), pagesCount: active.pages.length, queriesCount: active.queries.length, durationMs };
  } catch (error) {
    recordProviderError("google", error, { lastDurationMs: Date.now() - started });
    searchLog({ provider: "google", action: "sync", status: "failed", durationMs: Date.now() - started, code: error?.code, message: error?.message });
    throw error;
  }
}

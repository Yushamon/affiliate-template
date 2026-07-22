import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { normalizeUrl, normalizeQuery, summarizeMetrics, mergeMetricRows, metricChange } from "../src/lib/search/normalizer.mjs";
import { redactSecrets, SearchError } from "../src/lib/search/errors.mjs";
import { readSearchStatus, updateProviderStatus } from "../src/lib/search/status-store.mjs";
import { readSearchDashboardCandidates } from "../src/lib/search/dashboard-file-loader.mjs";
import { createSearchActionService } from "../src/lib/search/action-service.mjs";
import { validateOAuthCallback } from "../src/lib/search/providers/google/auth.mjs";
import { loadGoogleRange } from "../src/lib/search/providers/google/sync.mjs";
import { validateBingConfig, findConfiguredSite } from "../src/lib/search/providers/bing/config.mjs";
import { createBingClient, unwrapBingResponse } from "../src/lib/search/providers/bing/client.mjs";
import { parseBingDate, mapBingQueryStats, mapBingPageStats, mapBingCrawlStats } from "../src/lib/search/providers/bing/mapper.mjs";
import { buildBingDashboard, summarizeBingRows } from "../src/lib/search/providers/bing/sync.mjs";
import { buildCombinedDashboard, combineMetricValues } from "../src/lib/search/combined.mjs";
import { classifyProviderResults } from "../src/lib/search/platform.mjs";
import { toPublicError } from "../src/lib/search/errors.mjs";
import { atomicWriteJson } from "../src/lib/search/config.mjs";
import { sanitizeLogEntry } from "../src/lib/search/logging.mjs";

test("URL-Normalisierung entfernt Hostvarianten, Query, Hash und vereinheitlicht Slashes", () => {
  assert.equal(normalizeUrl("http://www.pfotentechnik.de//ratgeber/?utm_source=x#teil"), "/ratgeber/");
  assert.equal(normalizeUrl("produkt/test"), "/produkt/test/");
  assert.equal(normalizeUrl("/"), "/");
});

test("Query-Normalisierung erhält sichtbaren Text und erzeugt stabilen Schlüssel", () => {
  assert.deepEqual(normalizeQuery("  GPS   Tracker Katze "), { original: "GPS Tracker Katze", key: "gps tracker katze" });
});

test("Metriken verwenden neu berechnete CTR und impressionsgewichtete Position", () => {
  const result = summarizeMetrics([{ clicks: 2, impressions: 10, position: 2 }, { clicks: 1, impressions: 30, position: 10 }]);
  assert.deepEqual(result, { clicks: 3, impressions: 40, ctr: 7.5, position: 8 });
  assert.deepEqual(metricChange(result, { clicks: 1, impressions: 20, ctr: 5, position: 9 }), { clicks: 200, impressions: 100, ctr: 2.5, position: 1 });
});

test("Doppelte URL- und Query-Varianten werden normalisiert zusammengeführt", () => {
  const pages = mergeMetricRows([
    { page: "https://www.pfotentechnik.de/a/?x=1", clicks: 1, impressions: 10, position: 4 },
    { page: "https://pfotentechnik.de/a/#x", clicks: 2, impressions: 30, position: 8 },
  ], "page");
  assert.deepEqual(pages[0], { page: "/a/", clicks: 3, impressions: 40, ctr: 7.5, position: 7 });
  const queries = mergeMetricRows([{ query: "GPS  Tracker", clicks: 1, impressions: 10, position: 5 }, { query: "gps tracker", clicks: 1, impressions: 10, position: 7 }], "query");
  assert.equal(queries.length, 1);
  assert.equal(queries[0].position, 6);
});

test("Statusdatei ist bei fehlender Datei sicher und atomar aktualisierbar", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "pt-search-status-"));
  const file = path.join(directory, "status.json");
  try {
    assert.equal(readSearchStatus(file).google.connected, false);
    updateProviderStatus("google", { connected: true, property: "sc-domain:pfotentechnik.de" }, file);
    assert.equal(readSearchStatus(file).google.property, "sc-domain:pfotentechnik.de");
    assert.doesNotThrow(() => JSON.parse(fs.readFileSync(file, "utf8")));
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

test("Ungültige Status-JSON wird nicht still akzeptiert", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "pt-search-invalid-"));
  const file = path.join(directory, "status.json");
  try {
    fs.writeFileSync(file, "{broken", "utf8");
    assert.throws(() => readSearchStatus(file), (error) => error.code === "SEARCH_INVALID_DATA");
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

test("Dashboard-Dateiloader behandelt fehlende und ungültige Dateien nachvollziehbar", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "pt-search-loader-"));
  try {
    const rangesFile = path.join(directory, "ranges.json");
    const singleFile = path.join(directory, "single.json");
    fs.writeFileSync(rangesFile, "invalid", "utf8");
    const missing = readSearchDashboardCandidates({ rangesFile, singleFile });
    assert.equal(missing.source, "none");
    assert.deepEqual(missing.diagnostics.map((item) => item.code), ["json-read-failed", "file-missing"]);
    fs.writeFileSync(singleFile, JSON.stringify({ schemaVersion: 1, range: "7d", metrics: {} }), "utf8");
    assert.equal(readSearchDashboardCandidates({ rangesFile, singleFile }).source, "single");
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

test("Action-Allowlist lehnt Unbekanntes und parallele identische Aktionen ab", async () => {
  let release;
  const waiting = new Promise((resolve) => { release = resolve; });
  const service = createSearchActionService({ "google.sync": () => waiting }, { logger: () => {} });
  assert.throws(() => service.start("arbitrary.command"), (error) => error.code === "SEARCH_ACTION_NOT_ALLOWED");
  const first = service.start("google.sync");
  assert.throws(() => service.start("google.sync"), (error) => error.code === "SEARCH_SYNC_ALREADY_RUNNING");
  release({ ok: true });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(service.get(first.id).status, "succeeded");
});

test("Secrets werden aus Fehlern und URLs entfernt", () => {
  const redacted = redactSecrets("client_secret=abc refresh_token:xyz Authorization: Bearer token123 https://x/?code=secret&state=private");
  for (const secret of ["=abc", ":xyz", "token123", "code=secret", "state=private"]) assert.equal(redacted.includes(secret), false);
});

test("OAuth-State und Ablaufzeit werden validiert", () => {
  const session = { state: "expected", redirectUri: "http://127.0.0.1:4178/callback", expiresAt: Date.now() + 1000 };
  assert.equal(validateOAuthCallback(session, "http://127.0.0.1:4178/callback?state=expected&code=ok"), "ok");
  assert.throws(() => validateOAuthCallback(session, "http://127.0.0.1:4178/callback?state=wrong&code=ok"), (error) => error.code === "SEARCH_OAUTH_STATE_INVALID");
  assert.throws(() => validateOAuthCallback({ ...session, expiresAt: 1 }, "http://127.0.0.1/callback?state=expected&code=ok"), (error) => error.code === "SEARCH_OAUTH_REQUIRED");
});

test("Google-Range verarbeitet gemockte API-Daten ohne echte Zugangsdaten", async () => {
  let metricCall = 0;
  const mock = {
    async query() {
      metricCall += 1;
      return { rows: [{ clicks: metricCall === 1 ? 4 : 2, impressions: metricCall === 1 ? 100 : 80, ctr: .04, position: metricCall === 1 ? 9 : 10 }] };
    },
    async queryAll(_property, body) {
      const dimension = body.dimensions[0];
      if (dimension === "page") return { rows: [{ keys: ["https://www.pfotentechnik.de/a/?utm=x"], clicks: 2, impressions: 50, ctr: .04, position: 8 }, { keys: ["https://pfotentechnik.de/a/#x"], clicks: 2, impressions: 50, ctr: .04, position: 10 }] };
      if (dimension === "query") return { rows: [{ keys: [" GPS  Tracker "], clicks: 4, impressions: 100, ctr: .04, position: 9 }] };
      return { rows: [{ keys: ["2026-07-01"], clicks: 4, impressions: 100, ctr: .04, position: 9 }] };
    },
  };
  const range = await loadGoogleRange(mock, "sc-domain:pfotentechnik.de", "7d", "Letzte 7 Tage", 7);
  assert.equal(range.metrics.current.ctr, 4);
  assert.equal(range.pages.length, 1);
  assert.equal(range.pages[0].position, 9);
  assert.equal(range.queries[0].query, "GPS Tracker");
  assert.equal(range.lowData, false);
});

test("Bing-Konfiguration validiert API-Key und Site-URL", () => {
  assert.throws(() => validateBingConfig({ apiKey: "", siteUrl: "https://pfotentechnik.de" }), (error) => error.code === "BING_API_KEY_MISSING");
  assert.throws(() => validateBingConfig({ apiKey: "test", siteUrl: "" }), (error) => error.code === "BING_SITE_URL_MISSING");
  assert.equal(validateBingConfig({ apiKey: "test", siteUrl: "https://pfotentechnik.de" }).configured, true);
});

test("Bing-Wrapper und GetUserSites werden korrekt verarbeitet", async () => {
  assert.deepEqual(unwrapBingResponse({ d: [{ Url: "https://pfotentechnik.de", IsVerified: true }] }), [{ Url: "https://pfotentechnik.de", IsVerified: true }]);
  const captured = [];
  const client = createBingClient({ config: { apiKey: "unit-secret", siteUrl: "https://pfotentechnik.de" }, fetchImpl: async (url) => {
    captured.push(url); return { ok: true, status: 200, headers: { get: () => null }, text: async () => JSON.stringify({ d: [{ Url: "http://www.pfotentechnik.de/", IsVerified: true }] }) };
  } });
  const sites = await client.getUserSites();
  assert.equal(findConfiguredSite(sites, "https://pfotentechnik.de").length, 1);
  assert.equal(captured[0] instanceof URL, true);
  assert.equal(captured[0].searchParams.get("apikey"), "unit-secret");
});

test("Bing-API-Key erscheint nicht in öffentlichen Fehlern", async () => {
  const key = "never-expose-this-key";
  const client = createBingClient({ config: { apiKey: key, siteUrl: "https://pfotentechnik.de" }, fetchImpl: async () => ({ ok: false, status: 401, headers: { get: () => null }, text: async () => JSON.stringify({ d: { ErrorCode: "InvalidApiKey", Message: key } }) }) });
  let caught; try { await client.getUserSites(); } catch (error) { caught = error; }
  const safe = toPublicError(caught);
  assert.equal(JSON.stringify(safe).includes(key), false);
  assert.equal(safe.code, "BING_AUTH_FAILED");
});

test("Bing-Datumsparser unterstützt Microsoft- und ISO-Format und verwirft Ungültiges", () => {
  assert.equal(parseBingDate("/Date(1316156400000-0700)/"), new Date(1316156400000).toISOString());
  assert.equal(parseBingDate("2026-07-20T00:00:00Z"), "2026-07-20T00:00:00.000Z");
  assert.equal(parseBingDate("nicht-ein-datum"), null);
});

test("Bing QueryStats, PageStats und CrawlStats mappen nur reale Felder", () => {
  const raw = { Query: "  GPS  Tracker ", Date: "/Date(1316156400000)/", Clicks: 2, Impressions: 20, AvgClickPosition: 4, AvgImpressionPosition: 6 };
  assert.deepEqual(mapBingQueryStats([raw])[0], { query: "GPS Tracker", date: new Date(1316156400000).toISOString(), clicks: 2, impressions: 20, ctr: 10, position: 6, avgClickPosition: 4 });
  assert.equal(mapBingPageStats([{ ...raw, Query: "https://www.pfotentechnik.de/a/?x=1" }])[0].page, "/a/");
  const crawl = mapBingCrawlStats([{ Date: raw.Date, CrawledPages: 9, CrawlErrors: 2, Code4xx: 1, InIndex: 8 }])[0];
  assert.deepEqual({ crawledPages: crawl.crawledPages, crawlErrors: crawl.crawlErrors, code4xx: crawl.code4xx, inIndex: crawl.inIndex }, { crawledPages: 9, crawlErrors: 2, code4xx: 1, inIndex: 8 });
});

test("Bing-Metriken berechnen CTR sowie Impression- und Klickposition gewichtet", () => {
  assert.deepEqual(summarizeBingRows([{ clicks: 1, impressions: 10, position: 2, avgClickPosition: 3 }, { clicks: 3, impressions: 30, position: 10, avgClickPosition: 7 }]), { clicks: 4, impressions: 40, ctr: 10, position: 8, avgClickPosition: 6 });
});

test("Bing-Ranges filtern reale Daten und markieren fehlende Vergleiche", () => {
  const yesterday = new Date(); yesterday.setUTCDate(yesterday.getUTCDate() - 1); yesterday.setUTCHours(0, 0, 0, 0);
  const date = yesterday.toISOString();
  const payload = buildBingDashboard({ siteUrl: "https://pfotentechnik.de", queryRows: [{ query: "gps tracker", date, clicks: 1, impressions: 10, ctr: 10, position: 5, avgClickPosition: 4 }], pageRows: [{ page: "/gps-tracker/", date, clicks: 1, impressions: 10, ctr: 10, position: 5, avgClickPosition: 4 }], crawlRows: [] });
  assert.equal(payload.ranges["7d"].queries.length, 1);
  assert.equal(payload.ranges["7d"].comparisonAvailable, false);
  assert.equal(payload.ranges["7d"].metrics.previous, null);
});

const providerPayload = (provider, metrics, rows = {}) => ({ provider, generatedAt: "2026-07-20T00:00:00Z", property: "pfotentechnik.de", siteUrl: "https://pfotentechnik.de", defaultRange: "7d", ranges: { "7d": { key: "7d", label: "7 Tage", startDate: "2026-07-14", endDate: "2026-07-20", comparisonStartDate: "2026-07-07", comparisonEndDate: "2026-07-13", metrics: { current: metrics, previous: null, change: null }, pages: rows.pages || [], queries: rows.queries || [], trend: [], crawl: [], recommendations: [] } } });

test("Combined addiert Google und Bing und gewichtet Positionen", () => {
  const google = providerPayload("google", { clicks: 10, impressions: 100, ctr: 10, position: 4 }, { pages: [{ page: "https://pfotentechnik.de/a/", clicks: 10, impressions: 100, ctr: 10, position: 4 }] });
  const bing = providerPayload("bing", { clicks: 5, impressions: 50, ctr: 10, position: 10 }, { pages: [{ page: "http://www.pfotentechnik.de/a", clicks: 5, impressions: 50, ctr: 10, position: 10 }] });
  const combined = buildCombinedDashboard({ google, bing });
  assert.deepEqual(combined.ranges["7d"].metrics.current, { clicks: 15, impressions: 150, ctr: 10, position: 6 });
  assert.equal(combined.ranges["7d"].pages.length, 1);
  assert.deepEqual(combined.ranges["7d"].pages[0].sources, ["google", "bing"]);
});

test("Combined funktioniert mit nur Google, nur Bing und veralteten Bing-Daten", () => {
  const google = providerPayload("google", { clicks: 1, impressions: 10, ctr: 10, position: 5 });
  const bing = providerPayload("bing", { clicks: 2, impressions: 20, ctr: 10, position: 7 });
  assert.equal(buildCombinedDashboard({ google }).ranges["7d"].metrics.current.clicks, 1);
  assert.equal(buildCombinedDashboard({ bing }).ranges["7d"].metrics.current.clicks, 2);
  assert.equal(buildCombinedDashboard({ google, bing, staleProviders: ["bing"] }).providerStatus.bing, "stale");
  assert.deepEqual(combineMetricValues([null, { clicks: 2, impressions: 20, position: 7 }]), { clicks: 2, impressions: 20, ctr: 10, position: 7 });
});

test("Provider-Gesamtstatus unterscheidet Erfolg, Teilerfolg, Fehler und Skip", () => {
  assert.equal(classifyProviderResults({ google: "succeeded", bing: "succeeded" }), "succeeded");
  assert.equal(classifyProviderResults({ google: "succeeded", bing: "failed" }), "partial");
  assert.equal(classifyProviderResults({ google: "failed", bing: "failed" }), "failed");
  assert.equal(classifyProviderResults({ google: "skipped", bing: "skipped" }), "skipped");
});

test("search.sync kollidiert mit Einzel-Syncs in beide Richtungen", async () => {
  let release; const waiting = new Promise((resolve) => { release = resolve; }); const handlers = { "search.sync": () => waiting, "google.sync": () => waiting, "bing.sync": () => waiting };
  const first = createSearchActionService(handlers, { logger: () => {} }); first.start("search.sync"); assert.throws(() => first.start("google.sync"), (error) => error.code === "SEARCH_SYNC_ALREADY_RUNNING"); release({ ok: true }); await new Promise((resolve) => setTimeout(resolve, 0));
  let releaseSecond; const waitingSecond = new Promise((resolve) => { releaseSecond = resolve; }); const second = createSearchActionService({ ...handlers, "google.sync": () => waitingSecond }, { logger: () => {} }); second.start("google.sync"); assert.throws(() => second.start("search.sync"), (error) => error.code === "SEARCH_SYNC_ALREADY_RUNNING"); releaseSecond({ ok: true }); await new Promise((resolve) => setTimeout(resolve, 0));
});

test("Atomisches Schreiben erhält vorhandene Daten bei Serialisierungsfehler", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "pt-search-atomic-")); const file = path.join(directory, "dashboard.json");
  try { fs.writeFileSync(file, JSON.stringify({ valid: true }), "utf8"); assert.throws(() => atomicWriteJson(file, { invalid: 1n }), (error) => error.code === "SEARCH_WRITE_FAILED"); assert.deepEqual(JSON.parse(fs.readFileSync(file, "utf8")), { valid: true }); }
  finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

test("API-Key wird auch aus strukturierten Logs redigiert", () => {
  const key = "log-secret-value"; const entry = sanitizeLogEntry({ provider: "bing", action: "sync", status: "failed", message: `Request failed: https://ssl.bing.com/?apikey=${key}` });
  assert.equal(JSON.stringify(entry).includes(key), false);
  assert.equal(entry.message.includes("[REDACTED]"), true);
});

test("Combined-Datei bleibt mit dem Advisor-Dashboardformat kompatibel", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "pt-search-advisor-"));
  try {
    const rangesFile = path.join(directory, "search-dashboard-ranges.json"); const singleFile = path.join(directory, "search-dashboard.json");
    const google = providerPayload("google", { clicks: 1, impressions: 10, ctr: 10, position: 5 }); const payload = buildCombinedDashboard({ google });
    fs.writeFileSync(rangesFile, JSON.stringify(payload), "utf8"); const loaded = readSearchDashboardCandidates({ rangesFile, singleFile });
    assert.equal(loaded.root.provider, "combined"); assert.equal(loaded.root.ranges["7d"].metrics.current.clicks, 1); assert.equal(loaded.source, "ranges");
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

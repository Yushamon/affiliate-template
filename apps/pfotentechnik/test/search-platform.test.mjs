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

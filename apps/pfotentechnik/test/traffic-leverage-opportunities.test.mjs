import assert from "node:assert/strict";
import test from "node:test";
import {
  composeTrafficOpportunities,
  normalizeTrafficRoute,
} from "../src/lib/seo/traffic-opportunities.mjs";
import { evaluateOpportunityMetrics } from "../src/lib/seo/opportunity-state.mjs";

const range = {
  metrics: { change: { impressions: 25 } },
  pages: [
    { page: "/produkt/a/", clicks: 2, impressions: 80, ctr: 2.5, position: 6.2 },
    { page: "/produkt/b/", clicks: 0, impressions: 3, ctr: 0, position: 5.2 },
    { page: "/produkt/c/", clicks: 0, impressions: 80, ctr: 0, position: 48 },
  ],
  pageQueries: [
    { page: "https://pfotentechnik.de/produkt/a", query: "  Produkt A  ", clicks: 2, impressions: 80, ctr: 2.5, position: 6.2 },
    { page: "/produkt/a/", query: "produkt a", clicks: 1, impressions: 20, ctr: 5, position: 7 },
    { page: "/produkt/b/", query: "produkt b", clicks: 0, impressions: 3, ctr: 0, position: 5.2 },
    { page: "/produkt/c/", query: "produkt c", clicks: 0, impressions: 80, ctr: 0, position: 48 },
  ],
};

const inputs = {
  range,
  recovery: { opportunities: [{ page: "/produkt/a/", status: "push", score: 80, metrics: range.pages[0] }] },
  linkHealth: { findings: [{ code: "NO_INCOMING_INTERNAL_LINK", targetRoute: "/produkt/a/" }] },
  demand: { findings: [{ id: "A2", primaryIntentOwner: "/produkt/a/", coverage: "partial", recommendation: "structured-data", structuredDataSource: "dispensingPrecision" }] },
};

test("Opportunity Composer priorisiert deterministisch und dedupliziert Page/Query-Mappings", () => {
  const first = composeTrafficOpportunities(inputs);
  const second = composeTrafficOpportunities(inputs);
  assert.deepEqual(first, second);
  assert.equal(first.filter((item) => item.page === "/produkt/a/" && item.query === "Produkt A").length, 1);
  assert.equal(new Set(first.map((item) => item.id)).size, first.length);
});

test("Strike Zone respektiert Position, Query-Mapping und Low-Impression-Rauschen", () => {
  const items = composeTrafficOpportunities(inputs);
  const strike = items.find((item) => item.page === "/produkt/a/");
  const lowData = items.find((item) => item.page === "/produkt/b/");
  const distant = items.find((item) => item.page === "/produkt/c/");
  assert.equal(normalizeTrafficRoute("https://pfotentechnik.de/produkt/a?x=1"), "/produkt/a/");
  assert.equal(strike.zone, "STRIKE");
  assert.equal(strike.query, "Produkt A");
  assert.equal(strike.ctrOpportunity, true);
  assert.equal(strike.internalAuthorityGap, true);
  assert.deepEqual(strike.dataAssets, ["dispensingPrecision"]);
  assert.equal(lowData.lowData, true);
  assert.notEqual(lowData.zone, "STRIKE");
  assert.equal(lowData.ctrOpportunity, false);
  assert.notEqual(distant.zone, "STRIKE");
  assert.equal(distant.ctrOpportunity, false);
});

test("fehlende GSC-Daten erzeugen keine erfundenen Opportunities", () => {
  assert.deepEqual(composeTrafficOpportunities({ range: null }), []);
});

test("Outcome-Messung verlangt ausreichende Pre/Post-Daten und bewertet erst dann", () => {
  const insufficient = evaluateOpportunityMetrics(
    { clicks: 0, impressions: 4, ctr: 0, position: 8 },
    { clicks: 2, impressions: 20, ctr: 10, position: 4 },
  );
  assert.equal(insufficient.status, "insufficient-data");
  const improved = evaluateOpportunityMetrics(
    { clicks: 1, impressions: 20, ctr: 5, position: 12 },
    { clicks: 4, impressions: 30, ctr: 13.33, position: 8 },
  );
  assert.equal(improved.status, "improved");
  assert.equal(improved.deltas.position, 4);
  assert.equal(improved.sufficientData, true);
});

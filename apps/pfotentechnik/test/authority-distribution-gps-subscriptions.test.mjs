import test from "node:test";
import assert from "node:assert/strict";
import {
  buildGpsSubscriptionSnapshot,
  buildSnapshotFromNormalized,
  normalizeGpsProduct,
} from "../src/lib/authority-distribution/gps-subscriptions.mjs";

const NOW = "2026-08-25T10:00:00.000Z";
const source = (overrides = {}) => ({
  source: "Hersteller Support",
  url: "https://manufacturer.example/support",
  accessedAt: "2026-08-20",
  assertion: "Abo und Tarif sind Herstellerangaben.",
  fields: ["gps"],
  ...overrides,
});
const product = (slug, required, overrides = {}) => ({
  title: slug,
  slug,
  productUrl: `/produkt/${slug}/`,
  manufacturer: { key: "brand", name: "Brand", slug: "brand" },
  category: { key: "gps-tracker" },
  productStatus: "active",
  updatedAt: "2026-08-24",
  gps: required === undefined ? {} : { subscriptionRequired: required },
  evidenceSources: [source()],
  ...overrides,
});
const normalized = (slug, status, eligible = true) => ({
  product: slug,
  slug,
  productUrl: `/produkt/${slug}/`,
  manufacturer: { key: "brand", name: "Brand", slug: "brand" },
  productStatus: "active",
  dataUpdatedAt: NOW,
  subscription: { status, price: { value: null, currency: null, interval: null, unknown: true } },
  evidence: eligible ? [{ source: "Hersteller", url: "https://example.com", sourceType: "manufacturer", checkedAt: NOW, confidence: "high", supports: ["gps"], assertion: "Abo", stale: false }] : [],
  eligible,
  exclusionReasons: eligible ? [] : ["test-exclusion"],
});

test("unknown wird ausgeschlossen und niemals false", () => {
  const result = normalizeGpsProduct(product("unknown", undefined), { generatedAt: NOW });
  assert.equal(result.subscription.status, "unknown");
  assert.equal(result.eligible, false);
  assert.ok(result.exclusionReasons.includes("subscription-status-unknown"));
});

test("fehlende Evidence wird ausgeschlossen", () => {
  const result = normalizeGpsProduct(product("no-evidence", true, { evidenceSources: [] }), { generatedAt: NOW });
  assert.equal(result.eligible, false);
  assert.ok(result.exclusionReasons.includes("subscription-evidence-missing"));
});

test("required, none und optional werden korrekt gezählt", () => {
  const snapshot = buildSnapshotFromNormalized([
    normalized("required", "required"),
    normalized("none", "none"),
    normalized("optional", "optional"),
  ], { generatedAt: NOW });
  assert.deepEqual(snapshot.population.counts, { total: 3, eligible: 3, excluded: 0, unknown: 0, required: 1, optional: 1, none: 1 });
});

test("Nenner und Prozentwerte verwenden nur eligible", () => {
  const snapshot = buildSnapshotFromNormalized([
    normalized("required", "required"),
    normalized("none", "none"),
    normalized("excluded", "unknown", false),
  ], { generatedAt: NOW });
  assert.equal(snapshot.population.counts.eligible, 2);
  assert.equal(snapshot.population.percentages.evidenceCoverage, 66.7);
  assert.equal(snapshot.population.percentages.required, 50);
  assert.equal(snapshot.population.percentages.withoutMandatorySubscription, 50);
});

test("doppelte Produkte werden verhindert", () => {
  assert.throws(() => buildSnapshotFromNormalized([
    normalized("duplicate", "required"),
    normalized("duplicate", "none"),
  ], { generatedAt: NOW }), /Doppeltes GPS-Produkt/);
});

test("identischer Snapshot erzeugt kein Change Finding und behält Version", () => {
  const first = buildSnapshotFromNormalized([normalized("same", "required")], { generatedAt: NOW });
  const second = buildSnapshotFromNormalized([normalized("same", "required")], { generatedAt: "2026-08-25T11:00:00.000Z", previousSnapshot: first });
  assert.equal(second.changeFinding, null);
  assert.equal(second.snapshotVersion, first.snapshotVersion);
});

test("Statusänderung erzeugt Change Finding", () => {
  const first = buildSnapshotFromNormalized([normalized("changed", "none")], { generatedAt: NOW });
  const second = buildSnapshotFromNormalized([normalized("changed", "required")], { generatedAt: "2026-08-25T11:00:00.000Z", previousSnapshot: first });
  assert.equal(second.changeFinding.changes[0].type, "subscription-status-changed");
  assert.equal(second.changeFinding.changes[0].before, "none");
  assert.equal(second.changeFinding.changes[0].after, "required");
});

test("Statement wird aus aktuellen Zahlen erzeugt", () => {
  const snapshot = buildSnapshotFromNormalized([
    normalized("a", "required"),
    normalized("b", "required"),
    normalized("c", "none"),
  ], { generatedAt: NOW });
  assert.match(snapshot.finding.statement, /^2 von 3 /);
  assert.match(snapshot.finding.statement, /kostenpflichtigen Ortungsdienst/);
  assert.match(snapshot.finding.statement, /1 kommen ohne Pflichtdienst/);
  assert.equal(snapshot.validation.passed, true);
});

test("Freitext wird nicht in Abo-Status konvertiert", () => {
  const result = normalizeGpsProduct(product("text-only", undefined, {
    specs: [{ label: "Abo", value: "Kein Abo erforderlich" }],
  }), { generatedAt: NOW });
  assert.equal(result.subscription.status, "unknown");
  assert.equal(result.eligible, false);
});

test("stale Evidence wird ausgeschlossen", () => {
  const result = normalizeGpsProduct(product("stale", true, {
    evidenceSources: [source({ accessedAt: "2025-01-01" })],
  }), { generatedAt: NOW, staleDays: 180 });
  assert.equal(result.eligible, false);
  assert.ok(result.exclusionReasons.includes("subscription-evidence-stale"));
});

test("Source-of-Truth Boolean false wird als none normalisiert", () => {
  const snapshot = buildGpsSubscriptionSnapshot([product("no-subscription", false)], { generatedAt: NOW });
  assert.equal(snapshot.population.counts.none, 1);
  assert.equal(snapshot.products[0].subscription.status, "none");
});

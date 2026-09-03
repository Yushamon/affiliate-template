import assert from "node:assert/strict";
import test from "node:test";
import { buildLitterCompatibilitySnapshot } from "../src/lib/authority-distribution/litter-compatibility.mjs";
import { buildLitterCompatibilityModel } from "../src/domain/litterCompatibility.ts";
import { resolveComparisonValue } from "../src/domain/comparison/comparisonDataPlatform.ts";

const evidence = [{ source: "Hersteller", url: "https://example.com/product", sourceType: "manufacturer", verifiedAt: "2026-09-03", assertion: "Kompatibilität" }];
const product = (slug, overrides = {}) => ({ title: slug, slug, productStatus: "active", category: { key: "automatische-katzentoiletten" }, litterCompatibility: { status: "partial", compatibleTypes: ["mineral-clumping"], conditionalTypes: [], incompatibleTypes: ["pellets"], clumpingRequirement: "required", grainSize: { maxDiameterMm: 3 }, researchedAt: "2026-09-03", evidence, ...overrides } });

test("kompatible, inkompatible und Korngroessen-Daten bleiben strukturiert", () => {
  const snapshot = buildLitterCompatibilitySnapshot([product("one")]);
  assert.deepEqual(snapshot.products[0].compatibleTypes, ["mineral-clumping"]);
  assert.deepEqual(snapshot.products[0].incompatibleTypes, ["pellets"]);
  assert.equal(snapshot.products[0].clumpingRequirement, "required");
  assert.equal(snapshot.products[0].grainSize.maxDiameterMm, 3);
  assert.equal(snapshot.products[0].evidence[0].url, "https://example.com/product");
});

test("partial Evidence zaehlt, unknown bleibt sichtbar", () => {
  const snapshot = buildLitterCompatibilitySnapshot([product("known"), product("unknown", { status: "unknown", compatibleTypes: [], incompatibleTypes: [], clumpingRequirement: "unknown", evidence: [] })]);
  assert.equal(snapshot.population.partial, 1);
  assert.equal(snapshot.population.withoutEvidence, 1);
  assert.deepEqual(snapshot.products.find((item) => item.slug === "unknown").unknowns, ["compatibility"]);
});

test("unter 80 Prozent entsteht kein Aggregate Finding", () => {
  const products = [product("known"), ...Array.from({ length: 4 }, (_, index) => product(`unknown-${index}`, { status: "unknown", compatibleTypes: [], incompatibleTypes: [], clumpingRequirement: "unknown", evidence: [] }))];
  const snapshot = buildLitterCompatibilitySnapshot(products);
  assert.equal(snapshot.population.coverage, 20);
  assert.equal(snapshot.publicationGate.status, "not-ready");
  assert.equal(snapshot.finding, null);
});

test("80 Prozent mit traceable Evidence ist publication-ready", () => {
  const products = [...Array.from({ length: 4 }, (_, index) => product(`known-${index}`)), product("unknown", { status: "unknown", compatibleTypes: [], incompatibleTypes: [], clumpingRequirement: "unknown", evidence: [] })];
  const snapshot = buildLitterCompatibilitySnapshot(products);
  assert.equal(snapshot.population.coverage, 80);
  assert.equal(snapshot.publicationGate.evidenceTraceable, true);
  assert.equal(snapshot.publicationGate.status, "ready");
  assert.match(snapshot.finding.statement, /^4 von 4/);
});

test("Produkt- und Vergleichsausgabe lesen die normalisierte Source of Truth", () => {
  const data = product("visible").litterCompatibility;
  const model = buildLitterCompatibilityModel(data);
  assert.match(model.decisionFact.value, /Geeignet:/);
  assert.match(model.decisionFact.consequence, /Klumpstreu erforderlich/);
  const value = resolveComparisonValue({
    product: { data: { title: "Box", recommendation: "Test", manufacturer: { name: "Test" }, specs: [], strengths: [], decision: { attention: [] }, comparisonData: { custom: { streu: "Alttext" } }, comparisonFilters: {}, litterCompatibility: data } },
    item: { slug: "visible", values: { streu: "Alter Vergleichstext" } },
    criterion: { key: "streu", label: "Streukompatibilität" }
  });
  assert.match(value, /klumpende Mineralstreu/);
  assert.doesNotMatch(value, /Alttext|Alter Vergleichstext/);
});

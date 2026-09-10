import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

import { buildFountainCostExperience } from "../src/domain/fountainCostExperience.mjs";
import { fountainCostUiManifest, fountainCostUiManifestBySlug } from "../src/domain/fountainCostUiManifest.mjs";
import { featureGates, resolveFountainRunningCostsGate } from "../src/config/featureGates.ts";

const require = createRequire(import.meta.url);
const dataset = require("../research/fountain-cost-35.0b.json");
const readiness = require("../../../reports/seo-cockpit/fountain-product-ui-readiness-35.0b.2.json");
const resolution = require("../../../reports/seo-cockpit/fountain-accessory-commerce-resolution-35.0b.2.json");
const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const now = "2026-09-10T12:00:00Z";
const trackingId = "yusha0f-21";
const record = (slug) => structuredClone(dataset.products.find((entry) => entry.slug === slug));
const entry = (slug) => structuredClone(fountainCostUiManifestBySlug.get(slug));
const build = (slug, overrides = {}) => buildFountainCostExperience({
  enabled: true, manifestEntry: entry(slug), datasetRecord: record(slug), trackingId, now, ...overrides
});

test("1. feature OFF renders no model", () => {
  assert.equal(buildFountainCostExperience({ enabled: false, manifestEntry: entry("cat-mate-335-pet-fountain"), datasetRecord: record("cat-mate-335-pet-fountain"), trackingId, now }), null);
});

test("2. feature ON supports FULL", () => {
  const model = build("cat-mate-335-pet-fountain");
  assert.equal(model.state, "FULL"); assert.ok(model.annualCost); assert.ok(model.affiliate);
});

test("3. feature ON supports COST_ONLY", () => {
  const model = build("cat-mate-shell-fountain");
  assert.equal(model.state, "COST_ONLY"); assert.ok(model.annualCost); assert.equal(model.affiliate, null);
});

test("4. feature ON supports OFFER_ONLY", () => {
  const model = build("oneisall-7l-dog-water-fountain");
  assert.equal(model.state, "OFFER_ONLY"); assert.equal(model.annualCost, null); assert.ok(model.offer);
});

test("5. feature ON supports INFO_ONLY", () => {
  const model = build("petkit-eversweet-ultra");
  assert.equal(model.state, "INFO_ONLY"); assert.equal(model.annualCost, null); assert.equal(model.affiliate, null);
});

test("6. HIDE renders nothing", () => {
  assert.equal(buildFountainCostExperience({ enabled: true, manifestEntry: { ...entry("cat-mate-335-pet-fountain"), state: "HIDE" }, datasetRecord: record("cat-mate-335-pet-fountain"), trackingId, now }), null);
});

test("7. interval ranges stay ranges", () => {
  const model = build("petsafe-streamside-trinkbrunnen");
  assert.ok(model.annualCost.low < model.annualCost.high); assert.match(model.annualCost.visible, /–/); assert.match(model.annualCost.accessible, / bis /);
});

test("8. fixed intervals produce one rounded annual value", () => {
  const model = build("cat-mate-335-pet-fountain");
  assert.equal(model.annualCost.low, model.annualCost.high); assert.match(model.annualCost.visible, /^ca\./);
});

test("9. missing current price suppresses costs", () => {
  const data = record("cat-mate-335-pet-fountain");
  data.data.consumables[0].offers[0].price.current = null;
  const model = buildFountainCostExperience({ enabled: true, manifestEntry: entry(data.slug), datasetRecord: data, trackingId, now });
  assert.equal(model.annualCost, null);
});

test("10. missing interval suppresses costs", () => {
  const data = record("cat-mate-335-pet-fountain");
  data.data.consumables[0].replacementInterval = { status: "unknown" };
  const model = buildFountainCostExperience({ enabled: true, manifestEntry: entry(data.slug), datasetRecord: data, trackingId, now });
  assert.equal(model.annualCost, null); assert.equal(model.interval, null);
});

test("11. UNKNOWN filter requirement is not described as mandatory or optional", () => {
  const model = build("cat-mate-335-pet-fountain");
  assert.equal(model.requirementKnown, false); assert.match(model.conditionalCostNote, /Bei Nutzung/);
  assert.doesNotMatch(JSON.stringify(model), /Pflichtkosten|optional/i);
});

test("12. affiliate-ready uses the existing tracked direct URL", () => {
  const model = build("catit-pixi-smart-trinkbrunnen");
  assert.match(model.affiliate.url, /^https:\/\/www\.amazon\.de\/dp\/B095CFB3VZ\?tag=yusha0f-21$/);
  assert.equal(model.affiliate.label, "Ersatzfilter ansehen");
});

test("13. non-affiliate offer has no CTA", () => {
  const model = build("cat-mate-shell-fountain");
  assert.ok(model.offer); assert.equal(model.affiliate, null);
});

test("14. PETLIBRO pack mismatch remains COST_ONLY", () => {
  for (const slug of ["petlibro-dockstream-2-smart", "petlibro-dockstream-2-smart-cordless", "petlibro-dockstream-cordless"]) {
    const model = build(slug); assert.equal(model.state, "COST_ONLY"); assert.deepEqual(model.conflicts, ["COST_INPUT_OFFER_MISMATCH"]); assert.equal(model.affiliate, null);
  }
});

test("15. pump costs never enter this model", () => {
  const model = build("cat-mate-335-pet-fountain");
  assert.equal(model.pumpCostsIncluded, false); assert.doesNotMatch(JSON.stringify(model), /pump-eu|Ersatzpumpe/);
});

test("16. no TCO or dataset ranking claims are exposed", () => {
  const serialized = JSON.stringify(build("cat-mate-335-pet-fountain"));
  assert.doesNotMatch(serialized, /Median|Quartil|günstigster|teuerster|Prozentrang|threeYear|Total Cost/i);
});

test("17. feature OFF adds no schema.org output", () => {
  const model = buildFountainCostExperience({ enabled: false, manifestEntry: entry("cat-mate-335-pet-fountain"), datasetRecord: record("cat-mate-335-pet-fountain"), trackingId, now });
  assert.equal(model, null);
  const route = fs.readFileSync(path.join(app, "src/pages/produkt/[product].astro"), "utf8");
  assert.doesNotMatch(route, /runningCosts|fountainCost/i);
});

test("18. feature OFF creates no affiliate URL", () => {
  const model = buildFountainCostExperience({ enabled: false, manifestEntry: entry("cat-mate-335-pet-fountain"), datasetRecord: record("cat-mate-335-pet-fountain"), trackingId, now });
  assert.equal(JSON.stringify(model), "null");
});

test("19. product without fountain manifest remains unchanged", () => {
  assert.equal(buildFountainCostExperience({ enabled: true, datasetRecord: { slug: "ordinary-product", data: {} }, trackingId, now }), null);
});

test("20. other product categories have no activation entry", () => {
  assert.equal(fountainCostUiManifestBySlug.has("petlibro-granary-2-vision"), false);
});

test("activation manifest is validated against actual 35.0B/35.0B.2 data", () => {
  assert.equal(fountainCostUiManifest.length, 24);
  const counts = Object.fromEntries(["FULL", "COST_ONLY", "OFFER_ONLY", "INFO_ONLY", "HIDE"].map((state) => [state, fountainCostUiManifest.filter((item) => item.state === state).length]));
  assert.deepEqual(counts, { FULL: 5, COST_ONLY: 10, OFFER_ONLY: 1, INFO_ONLY: 8, HIDE: 0 });
  for (const manifest of fountainCostUiManifest) {
    const expected = readiness.products.find((item) => item.slug === manifest.slug);
    const source = dataset.products.find((item) => item.slug === manifest.slug);
    assert.ok(expected && source, manifest.slug);
    assert.equal(manifest.state, expected.futureUiState, manifest.slug);
    assert.equal(manifest.costRenderable, expected.annualFilterCost.available, manifest.slug);
    assert.equal(manifest.offerRenderable, expected.filterOfferAvailable, manifest.slug);
    assert.equal(manifest.affiliateCtaRenderable, expected.filterAffiliateReady, manifest.slug);
    if (manifest.costRenderable) assert.ok(source.data.consumables.some((item) => item.offers?.some((offer) => offer.id === manifest.costOfferId)), manifest.slug);
    if (manifest.affiliateCtaRenderable) assert.equal(resolution.offers.find((item) => item.slug === manifest.slug)?.status, "AFFILIATE_READY", manifest.slug);
  }
});

test("production gate is false and preview requires DEV plus explicit request", () => {
  assert.equal(featureGates.fountainRunningCosts.productionEnabled, false);
  assert.equal(resolveFountainRunningCostsGate({ isDev: false, previewRequested: true }), false);
  assert.equal(resolveFountainRunningCostsGate({ isDev: true, previewRequested: false }), false);
  assert.equal(resolveFountainRunningCostsGate({ isDev: true, previewRequested: true }), true);
});

test("component is secondary, semantic, responsive and uses inline gated styles", () => {
  const experience = fs.readFileSync(path.join(app, "src/components/product-experience-2/ProductExperience2.astro"), "utf8");
  const component = fs.readFileSync(path.join(app, "src/components/product-experience-2/ProductRunningCosts.astro"), "utf8");
  const renderedCosts = experience.indexOf("{model.runningCosts &&");
  assert.ok(experience.indexOf("<ProductDecisionFacts2") < renderedCosts);
  assert.ok(renderedCosts < experience.indexOf("<ProductEverydayTimeline"));
  assert.match(component, /<section[\s\S]*aria-labelledby/); assert.match(component, /<h2/); assert.match(component, /<style is:inline>/);
  assert.match(component, /min-width:0/); assert.match(component, /@media \(min-width:720px\)/); assert.doesNotMatch(component, /<table|position:\s*sticky|!important/);
});

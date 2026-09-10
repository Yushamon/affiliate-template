import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import yaml from "js-yaml";

const directory = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(directory, "..");
const repository = path.resolve(app, "../..");
const read = (relativePath) => fs.readFileSync(path.join(app, relativePath), "utf8");

function frontmatter(relativePath) {
  const source = read(relativePath);
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(match, `${relativePath} needs YAML frontmatter`);
  return { data: yaml.load(match[1]), source };
}

const productPath = "src/content/products/flappie.md";
const manufacturerPath = "src/content/manufacturers/flappie.md";
const comparisonPath = "src/content/comparisons/katzenklappen-mit-app-und-beuteerkennung.md";
const hubPath = "src/content/pages/katzenklappen.md";

test("Flappie uses the current product, subscription, evidence and decision contracts", () => {
  const { data } = frontmatter(productPath);

  assert.equal(data.slug, "flappie");
  assert.equal(data.productStatus, "active");
  assert.equal(data.manufacturer.slug, "flappie");
  assert.equal(data.category.key, "katzenklappen");
  assert.equal(data.editorial.assessmentType, "data-review");
  assert.equal(data.editorial.testedHandsOn, false);
  assert.equal(data.subscription.status, "unknown");
  assert.equal(data.subscription.requiredForCoreFunction, false);
  assert.equal(data.subscription.plans.length, 0);
  assert.ok(data.evidenceSources.length >= 10);
  assert.ok(data.decision.bestFor.length >= 3);
  assert.ok(data.decision.attention.length >= 4);
  assert.ok(data.failureModes.powerOutage.sourceUrl);
  assert.ok(data.failureModes.wifiOutage.sourceUrl);
  assert.equal(data.failureModes.cloudOutage.status, "unknown");
  assert.equal(data.images.gallery.length, 3);
});

test("Flappie manufacturer, hub and one relevant comparison resolve the relationship", () => {
  const product = frontmatter(productPath).data;
  const manufacturer = frontmatter(manufacturerPath).data;
  const comparison = frontmatter(comparisonPath);
  const hub = read(hubPath);

  assert.equal(manufacturer.key, product.manufacturer.key);
  assert.deepEqual(manufacturer.productSlugs, ["flappie"]);
  assert.ok(manufacturer.featuredProductSlugs.includes("flappie"));
  assert.ok(comparison.data.items.some((item) => item.slug === "flappie"));
  assert.match(comparison.source, /\/produkt\/flappie\//);
  assert.match(hub, /\[Flappie\]\(\/produkt\/flappie\/\)/);
  assert.deepEqual(product.comparisons, ["katzenklappen-mit-app-und-beuteerkennung"]);
});

test("Cat ID remains unavailable instead of being promoted as an active feature", () => {
  const { data, source } = frontmatter(productPath);

  assert.deepEqual(data.multiPet.identificationMethods, ["none"]);
  assert.equal(data.multiPet.identifiesIndividual, "unavailable");
  assert.equal(data.multiPet.individualAccess, "unavailable");
  assert.equal(data.multiPet.individualRules, "unavailable");
  assert.equal(data.sensorLimits.identificationLimitation.status, "unavailable");
  assert.ok(!data.features.some((feature) => /^Cat ID$/i.test(feature)));
  assert.match(source, /Cat ID ist (?:noch )?nicht allgemein aktiv/i);
});

test("the over-98-percent number is always presented as an unverified manufacturer claim", () => {
  const { data, source } = frontmatter(productPath);
  const comparison = frontmatter(comparisonPath).source;
  const matchingSpec = data.specs.find((spec) => />98|über 98/.test(spec.value));

  assert.match(matchingSpec.value, /laut Hersteller/i);
  assert.match(source, /über 98 Prozent[\s\S]{0,100}Herstellerclaim/i);
  assert.match(comparison, />98\s*% laut Hersteller/i);
  assert.doesNotMatch(`${source}\n${comparison}`, /PfotenTechnik-(?:Praxis)?test[^\n]{0,80}(?:98|über 98)/i);
  assert.doesNotMatch(`${source}\n${comparison}`, /erkennt Beute zu (?:über )?98\s*% zuverlässig/i);
});

test("offline and power-outage claims are source-backed and function-specific", () => {
  const { data } = frontmatter(productPath);
  const offlineSource = "https://support.flappiedoors.com/en-US/use-flappie-without-wi-fi-4794173";
  const powerSource = "https://support.flappiedoors.com/en-US/what-happens-if-the-power-goes-out-4794140";

  assert.equal(data.failureModes.wifiOutage.sourceUrl, offlineSource);
  assert.equal(data.failureModes.wifiOutage.functions.detection, "supported");
  assert.equal(data.failureModes.wifiOutage.functions.localRecording, "supported");
  assert.equal(data.failureModes.wifiOutage.functions.remoteAccess, "unavailable");
  assert.equal(data.failureModes.powerOutage.sourceUrl, powerSource);
  assert.equal(data.failureModes.powerOutage.functions.detection, "unavailable");
  assert.ok(data.evidenceSources.some((item) => item.url === offlineSource));
  assert.ok(data.evidenceSources.some((item) => item.url === powerSource));
});

test("34.9 discovery is closed as inventory, never as a new editorial intent", () => {
  const report = JSON.parse(fs.readFileSync(path.join(repository, "reports/product-batches/34.10-flappie.json"), "utf8"));
  const historical = JSON.parse(fs.readFileSync(path.join(repository, "reports/product-data-gap/34.9-product-data-gap.json"), "utf8"));

  assert.equal(report.gapResolution.statusBefore, "missing-relevant");
  assert.equal(report.gapResolution.statusAfter, "existing-complete");
  assert.equal(report.gapResolution.productInventoryGap, "resolved");
  assert.deepEqual(report.gapResolution.productPageRequired, { required: true, status: "resolved" });
  assert.equal(report.gapResolution.newEditorialIntent, false);
  assert.equal(report.gapResolution.newGuideRequired, false);
  assert.equal(report.gapResolution.newComparisonRequired, false);
  assert.deepEqual(historical.resolution34_10, {
    historicalFindingPreserved: true,
    product: "flappie",
    statusBefore: "missing-relevant",
    statusAfter: "existing-complete",
    productInventoryGap: "resolved",
    productPageRequired: { required: true, status: "resolved" },
    newEditorialIntent: false,
    newGuideRequired: false,
    newComparisonRequired: false,
    report: "reports/product-batches/34.10-flappie.json"
  });
});

test("all six Flappie media roles resolve to real WebP files", () => {
  const names = ["hero", "thumbnail", "comparison", "gallery-1", "gallery-2", "gallery-3"];

  for (const name of names) {
    const absolute = path.join(app, `src/assets/images/products/flappie/${name}.webp`);
    const bytes = fs.readFileSync(absolute);
    assert.ok(bytes.length > 10_000, `${name}.webp should not be an empty placeholder`);
    assert.equal(bytes.subarray(0, 4).toString("ascii"), "RIFF");
    assert.equal(bytes.subarray(8, 12).toString("ascii"), "WEBP");
  }
});

test("official-store products use their provider CTA instead of an Amazon-only label", () => {
  const priceBox = read("src/components/product-experience-2/PriceBox2.astro");

  assert.match(priceBox, /const ctaLabel = affiliate\.label \|\|/);
  assert.doesNotMatch(priceBox, /const ctaLabel = price\?\.formattedCurrent \? "Bei Amazon ansehen"/);
});

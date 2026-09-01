import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";
import { selectComparisonFinalists } from "../src/domain/comparison/finalistSelection.mjs";

const yaml = createRequire(import.meta.url)("js-yaml");
const app = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

const readData = (kind, slug) => {
  const file = path.join(app, "src", "content", kind, `${slug}.md`);
  const source = fs.readFileSync(file, "utf8");
  const match = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(match, `${kind}/${slug}: missing frontmatter`);
  return yaml.load(match[1], { schema: yaml.JSON_SCHEMA }) ?? {};
};

const candidateFor = (productSlug) => {
  const data = readData("products", productSlug);
  return {
    slug: productSlug,
    title: data.title,
    href: data.productUrl,
    score: data.score,
    rating: data.rating,
    recommendation: data.recommendation,
    features: data.features,
    strengths: data.strengths,
    attention: data.decision?.attention,
    bestFor: data.decision?.bestFor,
    failureModes: data.failureModes,
    comparisonFilters: data.comparisonFilters,
    testStatus: data.testStatus,
    productStatus: data.productStatus,
    evidence: data.editorial?.evidence
  };
};

const runComparison = (slug) => {
  const data = readData("comparisons", slug);
  const products = (data.items ?? [])
    .filter((item) => item.type === "product" && fs.existsSync(path.join(app, "src", "content", "products", `${item.slug}.md`)))
    .map((item) => candidateFor(item.slug));
  const result = selectComparisonFinalists({ candidates: products });
  return { slug, candidateCount: products.length, data, result };
};

test("automatic selection works across feeder, GPS and fountain comparisons", () => {
  const cases = [
    runComparison("beste-futterautomaten-mit-kamera"),
    runComparison("beste-gps-tracker-fuer-hunde"),
    runComparison("beste-trinkbrunnen-fuer-katzen")
  ];
  for (const current of cases) {
    assert.ok(current.candidateCount >= 2, `${current.slug}: too few candidates`);
    assert.ok(current.result.finalists.length <= 2);
    assert.equal(current.result.overrideUsed, false);
    for (const finalist of current.result.finalists) {
      assert.equal(typeof current.result.selectionReasons[finalist.slug], "string");
    }
    console.log(JSON.stringify({
      comparison: current.slug,
      candidateCount: current.candidateCount,
      finalists: current.result.finalists.map((item) => item.slug),
      whySelected: current.result.selectionReasons,
      relevantAlternatives: current.result.alternatives.map((item) => item.slug),
      manualOverrideRequired: current.result.overrideUsed ? "YES" : "NO"
    }));
  }
});

test("reference automatic finalists are independent from legacy slugs", () => {
  const current = runComparison("beste-futterautomaten-mit-kamera");
  const legacy = [current.data.recommendation?.winnerSlug, current.data.recommendation?.alternativeSlug].filter(Boolean);
  const automatic = current.result.finalists.map((item) => item.slug);
  assert.ok(automatic.length >= 1);
  assert.equal(current.result.overrideUsed, false);
  assert.notDeepEqual(automatic, legacy);
  console.log(JSON.stringify({ comparison: current.slug, automaticFinalists: automatic, legacyFinalists: legacy }));
});


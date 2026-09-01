import test from "node:test";
import assert from "node:assert/strict";
import { selectComparisonFinalists } from "../src/domain/comparison/finalistSelection.mjs";

const candidate = (slug, score, comparisonFilters, extra = {}) => ({
  slug,
  title: slug,
  href: `/produkt/${slug}/`,
  score,
  recommendation: extra.recommendation ?? `${slug} Schwerpunkt`,
  strengths: extra.strengths ?? ["Dokumentierter Schwerpunkt"],
  features: extra.features ?? [],
  comparisonFilters,
  testStatus: extra.testStatus ?? "editorial-review",
  productStatus: "active"
});

test("selects two deterministic finalists and preserves distinct alternatives", () => {
  const result = selectComparisonFinalists({
    candidates: [
      candidate("alpha", 94, { camera: true, app: true }),
      candidate("beta", 92, { camera: true, app: true }),
      candidate("gamma", 86, { camera: true, dualChamber: true }),
      candidate("delta", 61, { camera: false, offline: true })
    ]
  });

  assert.deepEqual(result.finalists.map((item) => item.slug), ["alpha", "gamma"]);
  assert.equal(result.alternatives.some((item) => item.slug === "beta"), true);
  assert.equal(typeof result.selectionReasons.alpha, "string");
  assert.equal(typeof result.alternativeReasons.beta, "string");
  assert.equal(result.technical.every((item) => item.slug !== "alpha" && item.slug !== "gamma"), true);
  assert.equal(result.overrideUsed, false);
});

test("selection is stable regardless of source order", () => {
  const candidates = [
    candidate("alpha", 94, { camera: true }),
    candidate("beta", 88, { dualChamber: true }),
    candidate("gamma", 88, { app: true })
  ];
  const first = selectComparisonFinalists({ candidates });
  const second = selectComparisonFinalists({ candidates: [...candidates].reverse() });
  assert.deepEqual(
    second.finalists.map((item) => item.slug),
    first.finalists.map((item) => item.slug)
  );
});

test("invalid or discontinued overrides never invent finalists", () => {
  const result = selectComparisonFinalists({
    candidates: [candidate("alpha", 90, { camera: true }), { ...candidate("old", 99, {}), productStatus: "archived" }],
    override: ["missing", "old"]
  });
  assert.deepEqual(result.finalists.map((item) => item.slug), ["alpha"]);
  assert.equal(result.overrideUsed, false);
});

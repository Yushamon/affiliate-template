import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { calculateProductScore as calculateCentralProductScore } from "../src/domain/productScore.ts";
import {
  calculateProductScore as calculateScriptProductScore,
  resolveComparisonValue
} from "../scripts/comparison-platform/data-platform.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const APP = path.join(ROOT, "apps", "pfotentechnik");

const examples = [
  { score: 88, rating: 2.2, ratings: { a: 1, b: 2 } },
  { score: 4.2, rating: 2.2, ratings: { a: 1, b: 2 } },
  { rating: 3.8, ratings: { a: 3.8, b: 3.1, c: 4.0, d: 2.8, e: 2.8 } },
  { rating: 4.1, ratings: {} },
  { rating: 0, ratings: {} }
];

test("Vergleichsskripte und Produktseiten berechnen denselben Score", () => {
  for (const input of examples) {
    assert.deepEqual(
      calculateScriptProductScore(input),
      calculateCentralProductScore(input)
    );
  }
});

test("Vergleichswerte ignorieren abweichende Score-Overrides", () => {
  const product = {
    title: "Litter-Robot 5 Pro",
    manufacturer: { name: "Whisker" },
    rating: 3.8,
    ratings: {
      sicherheit: 3.8,
      platz: 3.1,
      reinigung: 4.0,
      folgekosten: 2.8,
      datenschutz: 2.8
    },
    comparisonData: { custom: { score: 99, bewertung: 4.9 } },
    comparisonFilters: {},
    specs: []
  };
  const item = {
    slug: "litter-robot-5-pro",
    values: { score: 99, bewertung: 4.9 },
    overrides: { score: 100, bewertung: 5.0 }
  };

  assert.equal(resolveComparisonValue({
    product,
    item,
    criterion: { key: "score", label: "Redaktioneller Score", format: "number" }
  }), "66");

  assert.equal(resolveComparisonValue({
    product,
    item,
    criterion: { key: "bewertung", label: "Bewertung", format: "number" }
  }), "3,3");
});

test("Gerenderte Vergleichsansicht und Empfehlung verwenden calculateProductScore", () => {
  const viewModel = fs.readFileSync(
    path.join(APP, "src", "domain", "comparison", "buildComparisonViewModel.ts"),
    "utf8"
  );
  const recommendation = fs.readFileSync(
    path.join(APP, "src", "domain", "comparison", "recommendationEngine.ts"),
    "utf8"
  );
  const platform = fs.readFileSync(
    path.join(APP, "src", "domain", "comparison", "comparisonDataPlatform.ts"),
    "utf8"
  );

  assert.match(viewModel, /calculateProductScore\(product\.data\)\.score/);
  assert.match(recommendation, /calculateProductScore\(data\)\.score/);
  assert.match(platform, /calculateProductScore\(product\.data\)/);
  assert.doesNotMatch(viewModel, /Math\.round\(product\.data\.rating \* 20\)/);
  assert.doesNotMatch(recommendation, /Math\.round\(data\.rating \* 20\)/);
});

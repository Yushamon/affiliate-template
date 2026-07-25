import fs from "node:fs";
import path from "node:path";
import {
  COMPARISON_DIR,
  PRODUCT_DIR,
  REPORT_DIR,
  loadEntries,
  slugOf,
  ensureReportDir
} from "./core.mjs";
import { resolveComparisonValue } from "./data-platform.mjs";

const thresholdArg = process.argv.find((arg) =>
  arg.startsWith("--factual-threshold=")
);
const FACTUAL_THRESHOLD = thresholdArg
  ? Number(thresholdArg.split("=")[1])
  : 85;

const asList = (value) => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];
  return Object.values(value)
    .filter((entry) => entry && typeof entry === "object");
};

const comparisons = loadEntries(COMPARISON_DIR);
const products = loadEntries(PRODUCT_DIR);
const productBySlug = new Map(
  products.map((entry) => [slugOf(entry), entry.data])
);

let total = 0;
let factual = 0;
let disclosed = 0;
let unresolved = 0;
let legacy = 0;

for (const comparison of comparisons) {
  for (const item of asList(comparison.data.items)) {
    legacy += Object.keys(
      item?.values &&
      typeof item.values === "object"
        ? item.values
        : {}
    ).length;

    const product =
      item.type === "product"
        ? productBySlug.get(item.slug)
        : undefined;

    for (const criterion of asList(comparison.data.criteria)) {
      if (!criterion?.key) continue;
      total++;

      const value = resolveComparisonValue({
        product,
        item,
        criterion
      });

      if (!value || value === "–") unresolved++;
      else if (value === "Nicht dokumentiert") disclosed++;
      else factual++;
    }
  }
}

const factualCoverage = total
  ? Math.round((factual / total) * 1000) / 10
  : 100;

const renderableCoverage = total
  ? Math.round(
      ((factual + disclosed) / total) * 1000
    ) / 10
  : 100;

console.log("Comparison Data Platform – Phase-3-Verifikation");
console.log(`Faktische Abdeckung: ${factualCoverage} %`);
console.log(`Darstellbare Abdeckung: ${renderableCoverage} %`);
console.log(`Transparent fehlend: ${disclosed}`);
console.log(`Nicht aufgelöst: ${unresolved}`);
console.log(`Legacy-values: ${legacy}`);
console.log(`Faktischer Schwellenwert: ${FACTUAL_THRESHOLD} %`);

if (
  renderableCoverage !== 100 ||
  unresolved !== 0 ||
  legacy !== 0 ||
  factualCoverage < FACTUAL_THRESHOLD
) {
  process.exitCode = 1;
}

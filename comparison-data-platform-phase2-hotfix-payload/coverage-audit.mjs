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

const STRICT = process.argv.includes("--strict");
const thresholdArg = process.argv.find(
  (argument) => argument.startsWith("--threshold=")
);
const THRESHOLD = thresholdArg
  ? Number(thresholdArg.split("=")[1])
  : 95;

const asList = (value) => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];

  return Object.entries(value)
    .sort(([a], [b]) => {
      const aNumber = Number(a);
      const bNumber = Number(b);
      return Number.isFinite(aNumber) &&
        Number.isFinite(bNumber)
        ? aNumber - bNumber
        : a.localeCompare(b, "de");
    })
    .map(([, entry]) => entry)
    .filter((entry) => entry && typeof entry === "object");
};

export function runCoverageAudit({
  strict = STRICT,
  threshold = THRESHOLD
} = {}) {
  const comparisons = loadEntries(COMPARISON_DIR);
  const products = loadEntries(PRODUCT_DIR);

  const productBySlug = new Map(
    products.map((entry) => [slugOf(entry), entry.data])
  );

  const cells = [];
  let resolved = 0;
  let unresolved = 0;
  let legacyValues = 0;
  let objectStructuredComparisons = 0;

  for (const comparison of comparisons) {
    if (
      comparison.data.items &&
      !Array.isArray(comparison.data.items)
    ) {
      objectStructuredComparisons++;
    }

    const criteria = asList(comparison.data.criteria);
    const items = asList(comparison.data.items);

    for (const item of items) {
      const legacy =
        item?.values &&
        typeof item.values === "object"
          ? item.values
          : {};

      legacyValues += Object.keys(legacy).length;

      const product =
        item.type === "product"
          ? productBySlug.get(item.slug)
          : undefined;

      for (const criterion of criteria) {
        if (!criterion?.key) continue;

        const value = resolveComparisonValue({
          product,
          item,
          criterion
        });

        const isResolved = Boolean(
          value &&
          value !== "–"
        );

        if (isResolved) resolved++;
        else unresolved++;

        cells.push({
          comparison: slugOf(comparison),
          file: comparison.rel,
          product: item.slug,
          criterion: criterion.key,
          criterionLabel: criterion.label,
          resolved: isResolved,
          value: isResolved ? value : null
        });
      }
    }
  }

  const total = resolved + unresolved;
  const coverage = total
    ? Math.round((resolved / total) * 1000) / 10
    : 100;

  const unresolvedCells = cells.filter(
    (cell) => !cell.resolved
  );

  const report = {
    generatedAt: new Date().toISOString(),
    threshold,
    passed:
      coverage >= threshold &&
      legacyValues === 0,
    summary: {
      comparisons: comparisons.length,
      products: products.length,
      cells: total,
      resolved,
      unresolved,
      coverage,
      legacyValues,
      objectStructuredComparisons
    },
    unresolvedCells
  };

  ensureReportDir();

  fs.writeFileSync(
    path.join(
      REPORT_DIR,
      "comparison-data-coverage-phase2.json"
    ),
    JSON.stringify(report, null, 2) + "\n",
    "utf8"
  );

  fs.writeFileSync(
    path.join(
      REPORT_DIR,
      "comparison-data-coverage-phase2.md"
    ),
    [
      "# Comparison Data Coverage – Phase 2",
      "",
      `Erstellt: ${report.generatedAt}`,
      "",
      `- Schwellenwert: ${threshold} %`,
      `- Abdeckung: ${coverage} %`,
      `- aufgelöst: ${resolved}`,
      `- offen: ${unresolved}`,
      `- Legacy-values: ${legacyValues}`,
      `- Objektstruktur-Kompatibilität: ` +
        `${objectStructuredComparisons} Vergleiche`,
      `- Status: ${
        report.passed
          ? "BESTANDEN"
          : "NICHT BESTANDEN"
      }`,
      "",
      "## Offene Zellen",
      "",
      ...(unresolvedCells.length
        ? unresolvedCells.map(
            (cell) =>
              `- \`${cell.file}\` → ` +
              `\`${cell.product}\` → ` +
              `\`${cell.criterion}\``
          )
        : ["Keine."]),
      ""
    ].join("\n"),
    "utf8"
  );

  console.log("Comparison Data Coverage – Phase 2");
  console.log(`Abdeckung: ${coverage} %`);
  console.log(`Aufgelöst: ${resolved}`);
  console.log(`Offen: ${unresolved}`);
  console.log(`Legacy-values: ${legacyValues}`);
  console.log(
    `Objektstruktur-Kompatibilität: ` +
    `${objectStructuredComparisons}`
  );
  console.log(`Schwellenwert: ${threshold} %`);

  if (strict && !report.passed) {
    process.exitCode = 1;
  }

  return report;
}

if (
  process.argv[1] &&
  import.meta.url.endsWith(
    process.argv[1].replaceAll("\\", "/")
  )
) {
  runCoverageAudit({
    strict: STRICT,
    threshold: THRESHOLD
  });
}

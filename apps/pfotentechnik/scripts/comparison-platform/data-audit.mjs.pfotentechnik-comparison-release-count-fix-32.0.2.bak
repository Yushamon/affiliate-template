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
const EXPECTED_COMPARISONS = 26;
const MIN_VISIBLE_ROWS = 3;
const MIN_RENDERED_COVERAGE = 95;

const isResolved = (value) => Boolean(value) && value !== "–";

export function runDataAudit({ strict = STRICT } = {}) {
  const comparisons = loadEntries(COMPARISON_DIR);
  const products = loadEntries(PRODUCT_DIR);
  const productBySlug = new Map(products.map((entry) => [slugOf(entry), entry.data]));

  let allResolved = 0;
  let allUnresolved = 0;
  let renderedResolved = 0;
  let renderedUnresolved = 0;
  let legacyValueCount = 0;
  let overrideCount = 0;

  const comparisonReports = comparisons.map((comparison) => {
    const criteria = Array.isArray(comparison.data.criteria)
      ? comparison.data.criteria
      : [];
    const items = (Array.isArray(comparison.data.items)
      ? comparison.data.items
      : []).filter((item) => item.type === "product");

    const rows = criteria.map((criterion) => {
      const cells = items.map((item) => {
        const value = resolveComparisonValue({
          product: productBySlug.get(item.slug),
          item,
          criterion
        });
        const resolved = isResolved(value);
        if (resolved) allResolved++;
        else allUnresolved++;
        return {
          product: item.slug,
          value,
          resolved
        };
      });

      const resolvedCount = cells.filter((cell) => cell.resolved).length;
      const visible = cells.length >= 2 && resolvedCount === cells.length;

      if (visible) {
        renderedResolved += resolvedCount;
        renderedUnresolved += cells.length - resolvedCount;
      }

      return {
        key: criterion.key,
        label: criterion.label,
        resolved: resolvedCount,
        total: cells.length,
        coverage: cells.length
          ? Math.round(resolvedCount / cells.length * 1000) / 10
          : 0,
        visible,
        cells
      };
    });

    for (const item of items) {
      legacyValueCount += Object.keys(item.values ?? {}).length;
      overrideCount += Object.keys(item.overrides ?? {}).length;
    }

    const visibleRows = rows.filter((row) => row.visible);
    return {
      slug: slugOf(comparison),
      file: comparison.rel,
      items: items.length,
      criteria: criteria.length,
      visibleRows: visibleRows.length,
      hiddenRows: rows.length - visibleRows.length,
      passed: items.length >= 2 && visibleRows.length >= MIN_VISIBLE_ROWS,
      rows
    };
  });

  const sourceCells = allResolved + allUnresolved;
  const renderedCells = renderedResolved + renderedUnresolved;
  const sourceCoverage = sourceCells
    ? Math.round(allResolved / sourceCells * 1000) / 10
    : 100;
  const renderedCoverage = renderedCells
    ? Math.round(renderedResolved / renderedCells * 1000) / 10
    : 0;

  const failures = [];
  if (comparisons.length !== EXPECTED_COMPARISONS) {
    failures.push(`Erwartet: ${EXPECTED_COMPARISONS} Vergleiche, gefunden: ${comparisons.length}.`);
  }
  for (const comparison of comparisonReports) {
    if (!comparison.passed) {
      failures.push(
        `${comparison.slug}: nur ${comparison.visibleRows} vollständig belegte Kriterien.`
      );
    }
  }
  if (renderedCoverage < MIN_RENDERED_COVERAGE) {
    failures.push(
      `Gerenderte Datenabdeckung ${renderedCoverage} % liegt unter ${MIN_RENDERED_COVERAGE} %.`
    );
  }

  const report = {
    generatedAt: new Date().toISOString(),
    expectedComparisons: EXPECTED_COMPARISONS,
    thresholds: {
      minimumVisibleRows: MIN_VISIBLE_ROWS,
      minimumRenderedCoverage: MIN_RENDERED_COVERAGE
    },
    passed: failures.length === 0,
    summary: {
      comparisons: comparisons.length,
      products: products.length,
      sourceCells,
      allResolved,
      allUnresolved,
      sourceCoverage,
      renderedCells,
      renderedResolved,
      renderedUnresolved,
      renderedCoverage,
      legacyValueCount,
      overrideCount
    },
    failures,
    comparisons: comparisonReports
  };

  ensureReportDir();
  fs.writeFileSync(
    path.join(REPORT_DIR, "comparison-data-platform.json"),
    JSON.stringify(report, null, 2) + "\n",
    "utf8"
  );

  const markdown = [
    "# Comparison Data Platform Audit",
    "",
    `Erstellt: ${report.generatedAt}`,
    "",
    `**Status: ${report.passed ? "BESTANDEN" : "NICHT BESTANDEN"}**`,
    "",
    `- Vergleiche: ${report.summary.comparisons} / ${EXPECTED_COMPARISONS}`,
    `- Quellabdeckung: ${report.summary.sourceCoverage} %`,
    `- öffentlich gerenderte Abdeckung: ${report.summary.renderedCoverage} %`,
    `- alte values-Felder: ${report.summary.legacyValueCount}`,
    `- bewusste Overrides: ${report.summary.overrideCount}`,
    "",
    "## Vergleichsseiten",
    "",
    "| Vergleich | Items | Kriterien sichtbar | ausgeblendet | Status |",
    "|---|---:|---:|---:|---|",
    ...report.comparisons.map((item) =>
      `| \`${item.slug}\` | ${item.items} | ${item.visibleRows} | ${item.hiddenRows} | ${item.passed ? "OK" : "BLOCKIERT"} |`
    ),
    "",
    "## Blocker",
    "",
    ...(report.failures.length
      ? report.failures.map((failure) => `- ${failure}`)
      : ["- Keine."]),
    "",
    "Unvollständige Quellkriterien bleiben im JSON-Bericht sichtbar, werden aber nicht als leere Tabellenzeilen veröffentlicht.",
    ""
  ].join("\n");

  fs.writeFileSync(
    path.join(REPORT_DIR, "comparison-data-platform.md"),
    markdown,
    "utf8"
  );

  console.log("Comparison Data Platform Audit");
  console.log(`Vergleiche: ${comparisons.length}/${EXPECTED_COMPARISONS}`);
  console.log(`Quellabdeckung: ${sourceCoverage} %`);
  console.log(`Gerenderte Abdeckung: ${renderedCoverage} %`);
  console.log(`Status: ${report.passed ? "BESTANDEN" : "NICHT BESTANDEN"}`);

  if (strict && !report.passed) process.exitCode = 1;
  return report;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replaceAll("\\", "/"))) {
  runDataAudit({ strict: STRICT });
}

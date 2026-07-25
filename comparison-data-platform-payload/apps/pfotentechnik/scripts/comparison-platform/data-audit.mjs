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

export function runDataAudit({ strict = STRICT } = {}) {
  const comparisons = loadEntries(COMPARISON_DIR);
  const products = loadEntries(PRODUCT_DIR);
  const productBySlug = new Map(products.map((entry) => [slugOf(entry), entry.data]));
  const issues = [];

  let itemCount = 0;
  let legacyValueCount = 0;
  let overrideCount = 0;
  let resolvedCount = 0;
  let unresolvedCount = 0;

  for (const comparison of comparisons) {
    const criteria = Array.isArray(comparison.data.criteria)
      ? comparison.data.criteria
      : [];
    const items = Array.isArray(comparison.data.items)
      ? comparison.data.items
      : [];

    for (const item of items) {
      itemCount++;
      const legacy = item?.values && typeof item.values === "object"
        ? item.values
        : {};
      const overrides = item?.overrides && typeof item.overrides === "object"
        ? item.overrides
        : {};

      legacyValueCount += Object.keys(legacy).length;
      overrideCount += Object.keys(overrides).length;

      if (Object.keys(legacy).length) {
        issues.push({
          level: "warning",
          code: "LEGACY_FIXED_VALUES",
          file: comparison.rel,
          itemSlug: item.slug,
          message: `${Object.keys(legacy).length} feste values-Felder sollten migriert werden.`
        });
      }

      const product = item.type === "product"
        ? productBySlug.get(item.slug)
        : undefined;

      for (const criterion of criteria) {
        const value = resolveComparisonValue({ product, item, criterion });
        if (value && value !== "–") {
          resolvedCount++;
        } else {
          unresolvedCount++;
          issues.push({
            level: "warning",
            code: "COMPARISON_VALUE_UNRESOLVED",
            file: comparison.rel,
            itemSlug: item.slug,
            criterionKey: criterion.key,
            message: `Kein zentraler Wert für ${criterion.key}.`
          });
        }
      }
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      comparisons: comparisons.length,
      products: products.length,
      items: itemCount,
      legacyValueCount,
      overrideCount,
      resolvedCount,
      unresolvedCount,
      centralResolutionPercent:
        resolvedCount + unresolvedCount > 0
          ? Math.round(resolvedCount / (resolvedCount + unresolvedCount) * 1000) / 10
          : 100
    },
    issues
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
    `- Vergleiche: ${report.summary.comparisons}`,
    `- Produkte: ${report.summary.products}`,
    `- Items: ${report.summary.items}`,
    `- alte feste values-Felder: ${report.summary.legacyValueCount}`,
    `- bewusste Overrides: ${report.summary.overrideCount}`,
    `- zentral aufgelöste Zellen: ${report.summary.resolvedCount}`,
    `- nicht aufgelöste Zellen: ${report.summary.unresolvedCount}`,
    `- zentrale Datenabdeckung: ${report.summary.centralResolutionPercent} %`,
    "",
    "## Befunde",
    "",
    ...(issues.length
      ? issues.map((issue) =>
          `- **${issue.code}** – \`${issue.file}\` · ${issue.itemSlug ?? ""}${issue.criterionKey ? ` · ${issue.criterionKey}` : ""}: ${issue.message}`
        )
      : ["Keine Befunde."]),
    ""
  ].join("\n");

  fs.writeFileSync(
    path.join(REPORT_DIR, "comparison-data-platform.md"),
    markdown,
    "utf8"
  );

  console.log("Comparison Data Platform Audit");
  console.log(`Zentrale Datenabdeckung: ${report.summary.centralResolutionPercent} %`);
  console.log(`Legacy values: ${legacyValueCount}`);
  console.log(`Overrides: ${overrideCount}`);
  console.log(`Nicht aufgelöst: ${unresolvedCount}`);

  if (strict && legacyValueCount > 0) process.exitCode = 1;
  return report;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replaceAll("\\", "/"))) {
  runDataAudit({ strict: STRICT });
}

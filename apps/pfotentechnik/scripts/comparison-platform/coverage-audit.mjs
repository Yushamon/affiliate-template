#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { REPORT_DIR, ensureReportDir } from "./core.mjs";
import { runDataAudit } from "./data-audit.mjs";

const strict = process.argv.includes("--strict");
const thresholdArg = process.argv.find((value) => value.startsWith("--threshold="));
const threshold = thresholdArg ? Number(thresholdArg.split("=")[1]) : 95;

const dataReport = runDataAudit({ strict: false });
const coverage = dataReport.summary.renderedCoverage;
const passed =
  dataReport.summary.comparisons === dataReport.expectedComparisons &&
  dataReport.comparisons.every((item) => item.passed) &&
  coverage >= threshold;

const report = {
  generatedAt: new Date().toISOString(),
  threshold,
  passed,
  summary: {
    comparisons: dataReport.summary.comparisons,
    sourceCoverage: dataReport.summary.sourceCoverage,
    renderedCoverage: coverage,
    visibleRows: dataReport.comparisons.reduce((sum, item) => sum + item.visibleRows, 0),
    hiddenRows: dataReport.comparisons.reduce((sum, item) => sum + item.hiddenRows, 0)
  },
  comparisons: dataReport.comparisons.map((item) => ({
    slug: item.slug,
    visibleRows: item.visibleRows,
    hiddenRows: item.hiddenRows,
    passed: item.passed
  }))
};

ensureReportDir();
fs.writeFileSync(
  path.join(REPORT_DIR, "comparison-data-coverage-phase2.json"),
  JSON.stringify(report, null, 2) + "\n"
);
fs.writeFileSync(
  path.join(REPORT_DIR, "comparison-data-coverage-phase2.md"),
  [
    "# Comparison Data Coverage – Release Closure",
    "",
    `Status: ${passed ? "BESTANDEN" : "NICHT BESTANDEN"}`,
    `Vergleiche: ${report.summary.comparisons}`,
    `Quellabdeckung: ${report.summary.sourceCoverage} %`,
    `Gerenderte Abdeckung: ${report.summary.renderedCoverage} %`,
    `Sichtbare Kriterien: ${report.summary.visibleRows}`,
    `Ausgeblendete unvollständige Kriterien: ${report.summary.hiddenRows}`,
    `Schwellenwert: ${threshold} %`,
    ""
  ].join("\n")
);

console.log("Comparison Data Coverage – Release Closure");
console.log(`Gerenderte Abdeckung: ${coverage} %`);
console.log(`Status: ${passed ? "BESTANDEN" : "NICHT BESTANDEN"}`);

if (strict && !passed) process.exitCode = 1;

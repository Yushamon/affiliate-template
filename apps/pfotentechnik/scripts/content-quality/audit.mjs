#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { collectContentQuality } from "./core.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, "../..");
const repoRoot = path.resolve(appRoot, "../..");
const strict = process.argv.includes("--strict");
const reportRoot = path.join(appRoot, "reports/content-quality");
const generatedRoot = path.join(appRoot, "src/generated");
const config = JSON.parse(fs.readFileSync(path.join(here, "config.json"), "utf8"));

const csvCell = (value) => {
  const text = Array.isArray(value) ? value.join(" | ") : String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, "\"\"")}"` : text;
};

const csv = (headers, rows) => [
  headers.join(","),
  ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(","))
].join("\n") + "\n";

const countBy = (values, key) => Object.fromEntries(
  [...values.reduce((map, value) => {
    const item = typeof key === "function" ? key(value) : value[key];
    map.set(item || "unknown", (map.get(item || "unknown") ?? 0) + 1);
    return map;
  }, new Map()).entries()].sort(([left], [right]) => String(left).localeCompare(String(right), "de"))
);

const writeJson = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n", "utf8");

fs.mkdirSync(reportRoot, { recursive: true });
fs.mkdirSync(generatedRoot, { recursive: true });

let result;
try {
  result = collectContentQuality({ appRoot, repoRoot, config });
} catch (error) {
  console.error(`Content-Quality-Audit abgebrochen: ${error.message}`);
  process.exit(1);
}

const publicPages = result.pages.filter((page) => page.indexable);
const errors = result.findings.filter((item) => item.severity === "error");
const warnings = result.findings.filter((item) => item.severity === "warning");
const openConflicts = result.conflicts.filter((item) => item.after === "open" || item.after === "incomplete");
const resolvedConflicts = result.conflicts.filter((item) => item.after === "resolved");
const manualReview = result.decisions.filter((item) => item.decision === "MANUAL_REVIEW");
const summary = {
  indexablePages: publicPages.length,
  totalHtmlPages: result.pages.length,
  pageTypes: countBy(publicPages, "pageType"),
  clusters: countBy(publicPages, "cluster"),
  intents: countBy(publicPages, (page) => page.searchIntent.primary),
  decisions: countBy(result.decisions, "decision"),
  errors: errors.length,
  warnings: warnings.length,
  exactDuplicates: result.findings.filter((item) => item.code === "CONTENT_EXACT_DUPLICATE").length,
  nearDuplicates: result.findings.filter((item) => item.code === "CONTENT_NEAR_DUPLICATE").length,
  intentConflicts: openConflicts.filter((item) => item.type === "exact-intent-conflict").length,
  topicOwnerConflicts: result.findings.filter((item) => item.code === "CONTENT_TOPIC_OWNER_CONFLICT").length,
  weakPages: result.findings.filter((item) => item.code === "CONTENT_THIN_WITHOUT_VALUE").length,
  manualReview: manualReview.length,
  consolidatedPages: result.decisions.filter((item) => item.decision === "CONSOLIDATE").length,
  differentiatedPages: result.decisions.filter((item) => item.decision === "DIFFERENTIATE").length,
  resolvedConflicts: resolvedConflicts.length
};

const inventoryPages = result.pages.map(({ mainText, outgoingRoutes, features, quality, topicOwner, searchIntent, _similarity, ...page }) => ({
  ...page,
  searchIntent: {
    primary: searchIntent.primary,
    secondary: page.secondaryIntents,
    confidence: searchIntent.confidence,
    source: searchIntent.source
  },
  topicOwner,
  quality
}));

const inventory = {
  schemaVersion: 1,
  sourcePreference: "rendered-dist-with-source-enrichment",
  searchData: result.searchData,
  summary,
  pages: inventoryPages
};
const cannibalizationReport = {
  schemaVersion: 1,
  thresholds: config.thresholds,
  allowedSeparations: config.allowedSeparations,
  topicOwners: config.topicOwners,
  searchData: result.searchData,
  summary,
  findings: result.findings,
  conflicts: result.conflicts
};

writeJson(path.join(reportRoot, "content-inventory.json"), inventory);
writeJson(path.join(reportRoot, "cannibalization-report.json"), cannibalizationReport);

fs.writeFileSync(path.join(reportRoot, "content-inventory.csv"), csv([
  "route", "sourceFile", "pageType", "title", "h1", "metaTitle", "metaDescription", "canonical",
  "indexable", "inSitemap", "publishedAt", "updatedAt", "author", "cluster", "primaryIntent",
  "secondaryIntents", "topicOwner", "mainEntity", "animal", "productCategory", "character",
  "internalIncomingLinks", "internalOutgoingLinks", "linkDepth", "wordCount", "headingCount",
  "structuredData", "recommendationTypes", "relatedProducts", "relatedComparisons", "qualityScore",
  "searchClicks", "searchImpressions", "searchCtr", "searchPosition"
], result.pages.map((page) => ({
  ...page,
  primaryIntent: page.searchIntent.primary,
  secondaryIntents: page.secondaryIntents,
  topicOwner: page.topicOwner.route,
  qualityScore: page.quality.score,
  searchClicks: page.searchPerformance?.clicks ?? "",
  searchImpressions: page.searchPerformance?.impressions ?? "",
  searchCtr: page.searchPerformance?.ctr ?? "",
  searchPosition: page.searchPerformance?.position ?? ""
}))), "utf8");

fs.writeFileSync(path.join(reportRoot, "indexation-decisions.csv"), csv([
  "route", "decision", "reason", "confidence", "conflictRoutes", "topicOwner", "action"
], result.decisions), "utf8");

const inventoryMarkdown = [
  "# Content-Inventar",
  "",
  "Das Inventar bevorzugt den gerenderten Build und ergänzt ihn um Metadaten aus den Quelldateien.",
  "",
  `- Indexierbare Seiten: ${summary.indexablePages}`,
  `- Gerenderte HTML-Seiten insgesamt: ${summary.totalHtmlPages}`,
  `- Cluster: ${Object.keys(summary.clusters).length}`,
  `- Primäre Intent-Kategorien: ${Object.keys(summary.intents).length}`,
  `- Harte Fehler: ${summary.errors}`,
  `- Warnungen: ${summary.warnings}`,
  "",
  "## Seitentypen",
  "",
  ...Object.entries(summary.pageTypes).map(([name, count]) => `- ${name}: ${count}`),
  "",
  "## Suchintentionen",
  "",
  ...Object.entries(summary.intents).map(([name, count]) => `- ${name}: ${count}`),
  "",
  "## Cluster",
  "",
  ...Object.entries(summary.clusters).map(([name, count]) => `- ${name}: ${count}`),
  ""
].join("\n");
fs.writeFileSync(path.join(reportRoot, "content-inventory.md"), inventoryMarkdown, "utf8");

const conflictLines = result.conflicts.length
  ? result.conflicts.map((item) => [
      `### ${item.id}`,
      "",
      `- Typ: ${item.type}`,
      `- Status: ${item.after}`,
      `- Schweregrad: ${item.severity}`,
      `- Routen: ${item.routes.join(" ↔ ")}`,
      `- Intentionen: ${item.intents.join(" ↔ ")}`,
      `- Maßnahme: ${item.action}`,
      `- Begründung: ${item.reason}`,
      item.metrics ? `- Ähnlichkeit: ${item.metrics.combined}` : "- Ähnlichkeit: nach Konsolidierung nicht erneut berechnet",
      ""
    ].join("\n"))
  : ["Keine Konflikte."];
const findingsLines = result.findings.length
  ? result.findings.map((item) => `- **${item.severity.toUpperCase()} · ${item.code}** · ${item.routes.join(" ↔ ")}: ${item.evidence}`)
  : ["Keine offenen Befunde."];
const reportMarkdown = [
  "# Content-Quality- und Kannibalisierungsreport",
  "",
  `- Indexierbare Seiten: ${summary.indexablePages}`,
  `- Exakte Duplikate: ${summary.exactDuplicates}`,
  `- Near-Duplicates: ${summary.nearDuplicates}`,
  `- Offene Intent-Konflikte: ${summary.intentConflicts}`,
  `- Gelöste Konflikte: ${summary.resolvedConflicts}`,
  `- Manuelle Prüffälle: ${summary.manualReview}`,
  `- Harte Fehler: ${summary.errors}`,
  `- Warnungen: ${summary.warnings}`,
  "",
  "## Konflikte und bewusste Abgrenzungen",
  "",
  ...conflictLines,
  "## Audit-Befunde",
  "",
  ...findingsLines,
  "",
  "## Entscheidungsmatrix",
  "",
  ...Object.entries(summary.decisions).map(([name, count]) => `- ${name}: ${count}`),
  ""
].join("\n");
fs.writeFileSync(path.join(reportRoot, "cannibalization-report.md"), reportMarkdown, "utf8");

const advisorItems = result.decisions
  .filter((item) => ["IMPROVE", "DIFFERENTIATE", "MANUAL_REVIEW"].includes(item.decision))
  .map((item) => {
    const page = result.pages.find((candidate) => candidate.route === item.route);
    const pageFindings = result.findings.filter((finding) => finding.routes.includes(item.route));
    return {
      id: `content-quality|${item.route.replace(/^\/|\/$/g, "").replace(/\//g, "|") || "home"}`,
      route: item.route,
      affectedFile: page?.sourceFile ?? "",
      title: `${item.decision}: ${page?.title ?? item.route}`,
      decision: item.decision,
      confidence: item.confidence,
      priority: pageFindings.some((finding) => finding.severity === "error") ? "high" : "medium",
      problem: item.reason,
      nextAction: item.decision === "MANUAL_REVIEW"
        ? "Redaktionell prüfen und erst nach bestätigter Intent-Gleichheit konsolidieren."
        : item.decision === "DIFFERENTIATE"
          ? "Title, H1, Einstieg und interne Zielrolle fachlich voneinander abgrenzen."
          : "Den konkreten Content-Quality-Befund beheben.",
      codes: pageFindings.map((finding) => finding.code),
      validationCommands: [
        "npm --workspace apps/pfotentechnik run audit:content-quality:strict",
        "npm --workspace apps/pfotentechnik run seo:release:check"
      ]
    };
  });
writeJson(path.join(generatedRoot, "content-quality-advisor.json"), {
  schemaVersion: 1,
  sourceReport: "apps/pfotentechnik/reports/content-quality/cannibalization-report.json",
  items: advisorItems
});

console.log("Content-Quality-Audit abgeschlossen");
console.log(`Indexierbare Seiten: ${summary.indexablePages}`);
console.log(`Harte Fehler: ${summary.errors}`);
console.log(`Warnungen: ${summary.warnings}`);
console.log(`Gelöste Konflikte: ${summary.resolvedConflicts}`);
console.log(`Report: ${path.relative(repoRoot, path.join(reportRoot, "cannibalization-report.md"))}`);
for (const item of errors) console.error(`ERROR ${item.code}: ${item.routes.join(" ↔ ")} · ${item.evidence}`);
for (const item of warnings) console.warn(`WARN ${item.code}: ${item.routes.join(" ↔ ")} · ${item.evidence}`);

if (strict && errors.length) process.exit(1);

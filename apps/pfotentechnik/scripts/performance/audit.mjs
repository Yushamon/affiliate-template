#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  auditRouteMetrics,
  auditSourceMetrics,
  collectRoute,
  collectSourceMetrics,
  mergedBudget,
} from "./core.mjs";

const SCRIPT_ROOT = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(SCRIPT_ROOT, "../..");
const REPO_ROOT = path.resolve(APP_ROOT, "../..");
const DIST_ROOT = path.join(APP_ROOT, "dist");
const REPORT_ROOT = path.join(APP_ROOT, "reports/performance");
const args = new Set(process.argv.slice(2));
const strict = args.has("--strict");
const outputArg = process.argv.slice(2).find((arg) => arg.startsWith("--output="));
const outputBase = outputArg
  ? path.resolve(process.cwd(), outputArg.slice("--output=".length))
  : path.join(REPORT_ROOT, "after-latest");

const routes = [
  { route: "/", category: "home", label: "Startseite" },
  { route: "/vergleiche/", category: "listing", label: "Vergleichsindex" },
  { route: "/vergleiche/beste-futterautomaten-fuer-katzen/", category: "comparison", label: "Vergleich Futterautomaten" },
  { route: "/vergleiche/gps-tracker-ohne-abo/", category: "comparison", label: "Vergleich GPS-Tracker" },
  { route: "/produkt/petlibro-granary-2-vision/", category: "product", label: "Produktdetail" },
  { route: "/hersteller/petlibro/", category: "listing", label: "Herstellerdetail" },
  { route: "/wissen/", category: "listing", label: "Wissenshub" },
  { route: "/smarte-futterautomaten/", category: "article", label: "Cornerstone" },
  { route: "/hund-trinkt-ploetzlich-viel/", category: "article", label: "Ratgeber" },
  { route: "/kontakt/", category: "utility", label: "Kontakt" }
];

const budgets = JSON.parse(fs.readFileSync(path.join(SCRIPT_ROOT, "budgets.json"), "utf8"));
const routeResults = routes.map((definition) => {
  const result = collectRoute(DIST_ROOT, definition);
  if (result.metrics) {
    result.findings.push(...auditRouteMetrics(
      definition.route,
      result.metrics,
      mergedBudget(budgets, definition.category),
    ));
  }
  return result;
});
const source = collectSourceMetrics(APP_ROOT, REPO_ROOT);
const findings = [
  ...routeResults.flatMap((result) => result.findings),
  ...auditSourceMetrics(source),
];
const errors = findings.filter((finding) => finding.severity === "error");
const warnings = findings.filter((finding) => finding.severity === "warning");
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  mode: strict ? "strict" : "diagnostic",
  status: errors.length === 0 ? "ok" : "error",
  environment: {
    build: "Astro production output",
    viewportLab: "Static output audit; browser lab documented separately",
    distRoot: path.relative(REPO_ROOT, DIST_ROOT),
  },
  budgets,
  source,
  routes: routeResults.map(({ definition, metrics, findings: routeFindings }) => ({
    ...definition,
    metrics,
    findings: routeFindings,
  })),
  findings,
  summary: {
    routes: routeResults.length,
    measuredRoutes: routeResults.filter((result) => result.metrics).length,
    errors: errors.length,
    warnings: warnings.length,
  },
};

const markdown = [
  "# PfotenTechnik Performance Audit",
  "",
  `- Status: ${report.status.toUpperCase()}`,
  `- Modus: ${report.mode}`,
  `- Routen: ${report.summary.measuredRoutes}/${report.summary.routes}`,
  `- Fehler: ${errors.length}`,
  `- Warnungen: ${warnings.length}`,
  "",
  "## Routen",
  "",
  "| Route | HTML | CSS | JS | DOM | Bilder | Befunde |",
  "| --- | ---: | ---: | ---: | ---: | ---: | ---: |",
  ...report.routes.map((item) => item.metrics
    ? `| ${item.route} | ${item.metrics.htmlBytes} B | ${item.metrics.cssBytes} B | ${item.metrics.jsBytes} B | ${item.metrics.domNodes} | ${item.metrics.imageBytes} B | ${item.findings.length} |`
    : `| ${item.route} | – | – | – | – | – | ${item.findings.length} |`),
  "",
  "## Source",
  "",
  `- CSS-Dateien: ${source.cssFiles}`,
  `- CSS-Bytes: ${source.cssBytes}`,
  `- !important-Deklarationen: ${source.importantDeclarations}`,
  `- Hydration-Direktiven: ${source.hydrationDirectives}`,
  `- Globale DOM-Korrektur: ${source.runtimeDomCorrectionPresent ? "vorhanden" : "entfernt"}`,
  `- Obsolete Comparison-CSS-Dateien: ${source.legacyComparisonFiles.length}`,
  "",
  "## Befunde",
  "",
  ...(findings.length
    ? findings.map((finding) => `- ${finding.severity.toUpperCase()} ${finding.code} (${finding.route}): ${finding.message}`)
    : ["Keine."]),
  "",
].join("\n");

fs.mkdirSync(path.dirname(outputBase), { recursive: true });
fs.writeFileSync(`${outputBase}.json`, `${JSON.stringify(report, null, 2)}\n`, "utf8");
fs.writeFileSync(`${outputBase}.md`, markdown, "utf8");
console.log(markdown);
console.log(`JSON: ${outputBase}.json`);
console.log(`Markdown: ${outputBase}.md`);

if (strict && errors.length > 0) process.exitCode = 1;


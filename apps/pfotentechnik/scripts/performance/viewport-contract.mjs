#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeHtml, routeFile } from "./core.mjs";

const SCRIPT_ROOT = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(SCRIPT_ROOT, "../..");
const DIST_ROOT = path.join(APP_ROOT, "dist");
const REPORT_ROOT = path.join(APP_ROOT, "reports/performance");
const routes = [
  "/",
  "/vergleiche/",
  "/vergleiche/beste-futterautomaten-fuer-katzen/",
  "/vergleiche/gps-tracker-ohne-abo/",
  "/produkt/petlibro-granary-2-vision/",
  "/hersteller/petlibro/",
  "/wissen/",
  "/smarte-futterautomaten/",
  "/hund-trinkt-ploetzlich-viel/",
  "/kontakt/",
];
const viewports = [
  { name: "mobile", width: 390 },
  { name: "tablet", width: 768 },
  { name: "desktop", width: 1366 },
];
const results = [];
const findings = [];

for (const route of routes) {
  const file = routeFile(DIST_ROOT, route);
  if (!fs.existsSync(file)) {
    findings.push({ code: "PERF_ROUTE_MISSING", route, message: "Build-Route fehlt." });
    continue;
  }
  const html = fs.readFileSync(file, "utf8");
  const metrics = analyzeHtml(html, DIST_ROOT);
  const viewportMeta = html.match(/<meta\b[^>]*name=["']viewport["'][^>]*>/i)?.[0] ?? "";
  const h1Count = (html.match(/<h1\b/gi) ?? []).length;
  for (const viewport of viewports) {
    const itemFindings = [];
    if (!/width\s*=\s*device-width/i.test(viewportMeta)) {
      itemFindings.push({ code: "PERF_VIEWPORT_META_MISSING", route, viewport: viewport.name, message: "Viewport-Meta fehlt." });
    }
    if (metrics.missingDimensions > 0) {
      itemFindings.push({ code: "PERF_IMAGE_DIMENSIONS_MISSING", route, viewport: viewport.name, message: `${metrics.missingDimensions} Bilder ohne Maße.` });
    }
    if (h1Count < 1) {
      itemFindings.push({ code: "PERF_DOCUMENT_OUTLINE_INVALID", route, viewport: viewport.name, message: "Keine H1 gefunden." });
    }
    findings.push(...itemFindings);
    results.push({ route, viewport, findings: itemFindings });
  }
}

const css = fs.readdirSync(path.join(DIST_ROOT, "_astro"))
  .filter((name) => name.endsWith(".css"))
  .map((name) => fs.readFileSync(path.join(DIST_ROOT, "_astro", name), "utf8"))
  .join("\n");
if (!/@media[^{]*(?:(?:max-)?width\s*(?::|<=)\s*(?:7[0-9]{2}|8[0-9]{2}|9[0-9]{2})px)/i.test(css)) {
  findings.push({
    code: "PERF_RESPONSIVE_BREAKPOINT_MISSING",
    route: "source",
    message: "Kein Tablet-/Mobile-Breakpoint im Build-CSS gefunden.",
  });
}

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  status: findings.length === 0 ? "ok" : "error",
  method: "static production-output contract; no layout engine",
  viewports,
  results,
  findings,
  summary: {
    checks: results.length,
    passed: results.filter((result) => result.findings.length === 0).length,
    failed: results.filter((result) => result.findings.length > 0).length,
  },
};
const markdown = [
  "# PfotenTechnik Viewport Contract",
  "",
  `- Status: ${report.status.toUpperCase()}`,
  "- Methode: statischer Vertrag gegen Produktions-HTML/CSS, keine Browser-Layoutersatzmessung",
  `- Checks: ${report.summary.checks}`,
  `- Bestanden: ${report.summary.passed}`,
  `- Fehlgeschlagen: ${report.summary.failed}`,
  "",
  "## Befunde",
  "",
  ...(findings.length
    ? findings.map((finding) => `- ${finding.code} ${finding.route}${finding.viewport ? ` (${finding.viewport})` : ""}: ${finding.message}`)
    : ["Keine."]),
  "",
].join("\n");

fs.mkdirSync(REPORT_ROOT, { recursive: true });
fs.writeFileSync(path.join(REPORT_ROOT, "viewport-contract-latest.json"), `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(path.join(REPORT_ROOT, "viewport-contract-latest.md"), markdown);
console.log(markdown);
if (findings.length > 0) process.exitCode = 1;

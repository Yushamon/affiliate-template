#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import yaml from "js-yaml";
import { fileURLToPath } from "node:url";
import { runDataAudit } from "./data-audit.mjs";

const args = new Set(process.argv.slice(2));
const strict = args.has("--strict");
const requireVisual = args.has("--require-visual");
const confirmVisual = args.has("--confirm-visual");

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(scriptDir, "..", "..");
const repoRoot = path.resolve(appRoot, "..", "..");
const comparisonDir = path.join(appRoot, "src", "content", "comparisons");
const distRoot = path.join(appRoot, "dist");
const reportDir = path.join(appRoot, "reports", "comparison-platform");
const signoffFile = path.join(reportDir, "comparison-visual-signoff.json");
const reportJson = path.join(reportDir, "comparison-release-closure.json");
const reportMd = path.join(reportDir, "comparison-release-closure.md");

const EXPECTED_COMPARISONS = 24;

const parse = (file) => {
  const source = fs.readFileSync(file, "utf8");
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) throw new Error(`Ungültiges Frontmatter: ${file}`);
  return yaml.load(match[1]) || {};
};

const routeFile = (slug) => path.join(distRoot, "vergleiche", slug, "index.html");
const routeExists = (href) => {
  const clean = href.split(/[?#]/)[0];
  if (!clean.startsWith("/") || clean.startsWith("/_astro/")) return true;
  if (/\.[a-z0-9]{2,5}$/i.test(clean)) {
    return fs.existsSync(path.join(distRoot, clean.replace(/^\//, "")));
  }
  const normalized = clean.endsWith("/") ? clean : `${clean}/`;
  const relative = normalized === "/" ? "index.html" : `${normalized.replace(/^\//, "")}index.html`;
  return fs.existsSync(path.join(distRoot, relative));
};

const extractAttribute = (tag, name) => {
  const match = tag.match(new RegExp(`\\b${name}=["']([^"']+)["']`, "i"));
  return match?.[1];
};

const typesIn = (value, result = new Set()) => {
  if (Array.isArray(value)) {
    value.forEach((item) => typesIn(item, result));
    return result;
  }
  if (!value || typeof value !== "object") return result;
  const type = value["@type"];
  if (Array.isArray(type)) type.forEach((item) => result.add(item));
  else if (type) result.add(type);
  Object.values(value).forEach((item) => typesIn(item, result));
  return result;
};

fs.mkdirSync(reportDir, { recursive: true });

if (confirmVisual) {
  if (process.env.PFOTENTECHNIK_VISUAL_QA_CONFIRMED !== "1") {
    console.error(
      "Visuelle Abnahme nicht gespeichert. Setze PFOTENTECHNIK_VISUAL_QA_CONFIRMED=1 erst nach der Prüfung von 375/414 px in Light und Dark Mode."
    );
    process.exit(1);
  }

  fs.writeFileSync(
    signoffFile,
    JSON.stringify({
      confirmedAt: new Date().toISOString(),
      matrix: [
        { viewport: "375x812", theme: "light", passed: true },
        { viewport: "375x812", theme: "dark", passed: true },
        { viewport: "414x896", theme: "light", passed: true },
        { viewport: "414x896", theme: "dark", passed: true }
      ],
      checks: [
        "Sticky-Bar überdeckt keine Inhalte",
        "Produktname und CTA bleiben vollständig bedienbar",
        "Gewinnerkarte, Tabelle, Karten und FAQ sind lesbar",
        "Keine hellen Fremdflächen im Dark Mode"
      ]
    }, null, 2) + "\n"
  );
}

if (!fs.existsSync(distRoot)) {
  console.error("dist fehlt. Zuerst npm run build:pfotentechnik ausführen.");
  process.exit(1);
}

const comparisonFiles = fs.readdirSync(comparisonDir)
  .filter((name) => /\.mdx?$/.test(name))
  .sort();

const comparisonData = comparisonFiles.map((name) => ({
  name,
  data: parse(path.join(comparisonDir, name))
}));

const redirectSources = new Set();
const redirectsFile = path.join(appRoot, "public", "_redirects");
if (fs.existsSync(redirectsFile)) {
  for (const line of fs.readFileSync(redirectsFile, "utf8").split(/\r?\n/)) {
    const parts = line.trim().split(/\s+/);
    if (parts.length >= 3 && /^30[18]$/.test(parts[2]) && parts[0].startsWith("/")) {
      redirectSources.add(parts[0]);
      redirectSources.add(parts[0].replace(/\/$/, ""));
    }
  }
}

const dataReport = runDataAudit({ strict: false });
const results = [];
const globalErrors = [];

if (comparisonData.length !== EXPECTED_COMPARISONS) {
  globalErrors.push(
    `Erwartet: ${EXPECTED_COMPARISONS} Vergleichsseiten, gefunden: ${comparisonData.length}.`
  );
}

for (const entry of comparisonData) {
  const slug = entry.data.slug;
  const expectedPath = `/vergleiche/${slug}/`;
  const file = routeFile(slug);
  const errors = [];

  if (!fs.existsSync(file)) {
    errors.push("Route fehlt im Build.");
    results.push({ slug, route: expectedPath, errors, passed: false });
    continue;
  }

  const html = fs.readFileSync(file, "utf8");
  const canonicalTags = html.match(/<link\b[^>]*rel=["'][^"']*canonical[^"']*["'][^>]*>/gi) || [];
  const canonical = canonicalTags.map((tag) => extractAttribute(tag, "href")).find(Boolean);

  if (!canonical) {
    errors.push("Canonical fehlt.");
  } else {
    try {
      const pathname = new URL(canonical, "https://pfotentechnik.de").pathname;
      if (pathname !== expectedPath) {
        errors.push(`Canonical zeigt auf ${pathname}.`);
      }
    } catch {
      errors.push("Canonical ist ungültig.");
    }
  }

  if (!html.includes('data-dark-mode-ready="true"')) {
    errors.push("Dark-Mode-Ready-Marker fehlt.");
  }
  if (!html.includes('data-comparison-sticky="true"')) {
    errors.push("Mobile Sticky-Bar fehlt.");
  }
  if (!html.includes('id="vergleichssieger"') || !html.includes("comparison-winner-card")) {
    errors.push("Gewinnerkarte fehlt.");
  }
  if (!html.includes("comparison-winner-card__image")) {
    errors.push("Gewinnerbild fehlt.");
  }
  if (!html.includes(">Test lesen<")) {
    errors.push("Produkt-CTA fehlt.");
  }
  if (/>\s*Keine Angabe\s*</i.test(html)) {
    errors.push('Öffentliche Ausgabe enthält "Keine Angabe".');
  }

  const jsonLdBlocks = [
    ...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
  ];
  const schemaTypes = new Set();
  for (const match of jsonLdBlocks) {
    try {
      typesIn(JSON.parse(match[1]), schemaTypes);
    } catch {
      errors.push("Ungültiger JSON-LD-Block.");
    }
  }
  if (!schemaTypes.has("ItemList")) errors.push("ItemList-Schema fehlt.");
  if (!schemaTypes.has("FAQPage")) errors.push("FAQPage-Schema fehlt.");

  const anchors = [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi)];
  for (const [, href] of anchors) {
    const clean = href.split(/[?#]/)[0];
    if (/^\/vergleiche\/-/.test(clean)) {
      errors.push(`Ungültiger Vergleichslink: ${href}`);
      continue;
    }
    if (redirectSources.has(clean) && !clean.startsWith("/vergleiche/")) {
      errors.push(`Interner Link zeigt auf Redirect: ${href}`);
      continue;
    }
    if (clean.startsWith("/") && !routeExists(clean)) {
      errors.push(`Internes Linkziel fehlt im Build: ${href}`);
    }
  }

  const affiliateTags = html.match(/<a\b[^>]*data-affiliate-link[^>]*>/gi) || [];
  for (const tag of affiliateTags) {
    const href = extractAttribute(tag, "href");
    if (!href || !/^https:\/\//i.test(href)) {
      errors.push("Affiliate-CTA besitzt kein gültiges HTTPS-Ziel.");
    }
  }

  const images = [...html.matchAll(/<img\b[^>]*src=["']([^"']+)["'][^>]*>/gi)];
  for (const [, src] of images) {
    if (src.startsWith("/_astro/") && !fs.existsSync(path.join(distRoot, src.replace(/^\//, "")))) {
      errors.push(`Bilddatei fehlt im Build: ${src}`);
    }
  }

  const sourceData = dataReport.comparisons.find((item) => item.slug === slug);
  if (!sourceData?.passed) {
    errors.push(
      `Zu wenige vollständig belegte Kriterien: ${sourceData?.visibleRows ?? 0}.`
    );
  }

  results.push({
    slug,
    route: expectedPath,
    canonical,
    schemaTypes: [...schemaTypes],
    visibleRows: sourceData?.visibleRows ?? 0,
    affiliateCtas: affiliateTags.length,
    errors: [...new Set(errors)],
    passed: errors.length === 0
  });
}

const visualSignoff = fs.existsSync(signoffFile)
  ? JSON.parse(fs.readFileSync(signoffFile, "utf8"))
  : null;
const technicalPassed =
  globalErrors.length === 0 &&
  dataReport.passed &&
  results.every((item) => item.passed);
const finalPassed = technicalPassed && Boolean(visualSignoff);

const report = {
  generatedAt: new Date().toISOString(),
  expectedComparisons: EXPECTED_COMPARISONS,
  technicalPassed,
  visualPassed: Boolean(visualSignoff),
  finalPassed,
  globalErrors,
  dataSummary: dataReport.summary,
  visualSignoff,
  routes: results
};

fs.writeFileSync(reportJson, JSON.stringify(report, null, 2) + "\n");

const markdown = [
  "# Comparison Release Closure 14.0.1",
  "",
  `Erstellt: ${report.generatedAt}`,
  "",
  `## Technischer Status: ${technicalPassed ? "BESTANDEN" : "NICHT BESTANDEN"}`,
  `## Visuelle Abnahme: ${visualSignoff ? "BESTANDEN" : "AUSSTEHEND"}`,
  `## Gesamtstatus: ${finalPassed ? "ABGESCHLOSSEN" : "NOCH NICHT ABGESCHLOSSEN"}`,
  "",
  `- Vergleichsrouten: ${results.length} / ${EXPECTED_COMPARISONS}`,
  `- gerenderte Datenabdeckung: ${dataReport.summary.renderedCoverage} %`,
  `- Quellabdeckung: ${dataReport.summary.sourceCoverage} %`,
  `- technisch fehlerfreie Routen: ${results.filter((item) => item.passed).length}`,
  "",
  "## Routenmatrix",
  "",
  "| Route | Kriterien | Affiliate-CTAs | Status |",
  "|---|---:|---:|---|",
  ...results.map((item) =>
    `| \`${item.route}\` | ${item.visibleRows} | ${item.affiliateCtas} | ${item.passed ? "OK" : "BLOCKIERT"} |`
  ),
  "",
  "## Blocker",
  "",
  ...(
    globalErrors.length || results.some((item) => item.errors.length)
      ? [
          ...globalErrors.map((error) => `- ${error}`),
          ...results.flatMap((item) =>
            item.errors.map((error) => `- \`${item.route}\`: ${error}`)
          )
        ]
      : ["- Keine technischen Blocker."]
  ),
  "",
  "## Visuelle Abnahme",
  "",
  visualSignoff
    ? `Bestätigt am ${visualSignoff.confirmedAt}.`
    : "Noch manuell in 375 × 812 und 414 × 896, jeweils Light und Dark Mode, zu prüfen.",
  ""
].join("\n");

fs.writeFileSync(reportMd, markdown);

console.log("Comparison Release Closure 14.0.1");
console.log(`Technisch: ${technicalPassed ? "BESTANDEN" : "NICHT BESTANDEN"}`);
console.log(`Visuell: ${visualSignoff ? "BESTANDEN" : "AUSSTEHEND"}`);
console.log(`Gesamt: ${finalPassed ? "ABGESCHLOSSEN" : "NOCH NICHT ABGESCHLOSSEN"}`);
console.log(`Bericht: ${path.relative(repoRoot, reportMd)}`);

const shouldFail =
  !technicalPassed ||
  (requireVisual && !visualSignoff);

if (strict && shouldFail) process.exitCode = 1;

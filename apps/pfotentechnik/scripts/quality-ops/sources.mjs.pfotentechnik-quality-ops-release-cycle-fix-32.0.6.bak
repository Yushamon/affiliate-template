import fs from "node:fs";
import path from "node:path";
import { APP_ROOT } from "../../src/lib/search/config.mjs";

const report = (...names) => names.map((name) => path.join(APP_ROOT, "reports", name));

/**
 * Eine Registry-Zeile entspricht genau einem fachlichen Reportadapter.
 * Ein physischer Report wird nur einmal eingelesen. Die spätere Klassifikation
 * ordnet einzelne Findings den passenden Bereichen zu.
 */
export const QUALITY_SOURCE_REGISTRY = Object.freeze([
  { id: "repository-audit", label: "Repository Audit", area: "repository-audit", files: report("repository-audit.json") },
  { id: "technical-seo", label: "Technical SEO", area: "technical-seo", files: report("seo-release/build-output-latest.json") },
  { id: "internal-linking", label: "Internal Linking", area: "internal-linking", files: report("internal-linking/internal-link-health-audit.json", "internal-linking/internal-link-audit.json") },
  { id: "cannibalization", label: "Cannibalization", area: "cannibalization", files: report("content-quality/cannibalization-report.json") },
  { id: "content-inventory", label: "Content Inventory", area: "content-quality", files: report("content-quality/content-inventory.json") },
  { id: "product-data", label: "Product Governance", area: "product-governance", files: report("product-data-audit.json") },
  { id: "comparison-audit", label: "Comparison Governance", area: "comparison-governance", files: report("comparison-platform/comparison-audit.json") },
  { id: "comparison-data", label: "Comparison Data", area: "comparison-governance", files: report("comparison-platform/comparison-data-platform.json") },
  { id: "performance", label: "Performance", area: "performance", files: report("performance/after-latest.json") },
  { id: "viewport-contract", label: "Viewport Contract", area: "performance", files: report("performance/viewport-contract-latest.json") },
  { id: "media-center", label: "Media Center", area: "image-coverage", files: report("media-center-audit.json") },
  { id: "comparison-heroes", label: "Comparison Heroes", area: "image-coverage", files: report("comparison-platform/hero-assets-15.4.4.json") },
  { id: "visual-qa", label: "Design System Visual QA", area: "accessibility", files: report("design-system/visual-qa-latest.json") },
  { id: "release-preflight", label: "Release Preflight", area: "release-gate", files: [path.join(APP_ROOT, ".seo-release", "preflight-latest.json")] },
  { id: "comparison-release", label: "Comparison Release", area: "release-gate", files: report("comparison-platform/comparison-release-closure.json") },
  { id: "price-intelligence", label: "Price Intelligence", area: "price-status", files: report("price-intelligence-audit.json") },
  { id: "product-experience", label: "Product Experience", area: "recommendation-conflicts", files: report("product-experience-2-audit.json") },
  { id: "seo-copilot-report", label: "SEO Copilot Product Health", area: "product-governance", files: report("seo-copilot-report.json") },
  { id: "topical-authority", label: "Topical Authority", area: "content-quality", files: report("topical-authority/topical-authority-center-audit.json") },
  { id: "decision-journeys", label: "Decision Journeys", area: "decision-journey", files: report("decision-journeys/latest.json") },
]);

const FINDING_KEYS = /^(findings|issues|errors|warnings|failures|missing|conflicts|quickWins|recommendedNextActions|reviewRequired|technical|editorial)$/i;
const severityForKey = (key) =>
  /error|failure|technical/i.test(key) ? "error"
  : /warning|missing|conflict|review|editorial/i.test(key) ? "warning"
  : "info";

const value = (item, keys) =>
  keys.map((key) => item?.[key]).find((candidate) =>
    candidate !== undefined && candidate !== null && candidate !== ""
  );

const list = (candidate) => Array.isArray(candidate) ? candidate : candidate ? [candidate] : [];
const normalized = (candidate) => String(candidate ?? "").trim().toLowerCase();

/** Quality Operations ist eine Arbeitsliste, kein Spiegel jeder Audit-Prüfliste. */
export function isOperationalFinding(source, key, item) {
  const record = item && typeof item === "object" ? item : {};
  const severity = normalized(record.effectiveSeverity || record.severity || record.level || severityForKey(key));
  const code = normalized(record.code || record.type || key);

  if (source.id === "visual-qa") return severity === "severe" || severity === "critical";
  if (source.id === "decision-journeys") return normalized(key) === "technical" || severity === "error" || severity === "critical";
  if (source.id === "repository-audit") {
    return severity === "error" || severity === "critical"
      || (severity === "warning" && normalized(record.area) === "structured-data");
  }
  if (source.id === "internal-linking") {
    return severity === "error" || severity === "critical" || /(?:runtime|effective)-error/.test(normalized(record.classification));
  }
  if (source.id === "product-data") return normalized(key) === "errors" || severity === "error" || severity === "critical";
  if (["price-intelligence", "comparison-heroes", "seo-copilot-report"].includes(source.id)) return false;
  if (source.id === "content-inventory") return false;
  if (source.id === "topical-authority") return severity === "error" || severity === "critical";
  if (source.id === "performance") return severity === "error" || severity === "critical";
  if (source.id === "cannibalization" && code === "intent-separation") return false;
  return severity !== "info" && severity !== "note" && severity !== "ok";
}

function contextFrom(item, inherited = {}) {
  if (!item || typeof item !== "object" || Array.isArray(item)) return inherited;
  return {
    file: value(item, ["file", "sourceFile", "filePath", "path"]) || inherited.file,
    route: value(item, ["route", "url", "page", "canonicalRoute", "sourceRoute", "targetRoute"]) || inherited.route,
    component: value(item, ["component", "componentName"]) || inherited.component,
    slug: value(item, ["slug", "productSlug"]) || inherited.slug,
    title: value(item, ["title", "name", "product"]) || inherited.title,
  };
}

function findingFrom(item, source, key, context, reportPath) {
  const object = item && typeof item === "object" ? item : { message: String(item) };
  const descriptionValue = value(object, [
    "message",
    "reason",
    "description",
    "title",
    "label",
    "evidence",
    "error",
    "warning",
  ]);
  const code = value(object, ["code", "type", "id", "check", "rule"]) || key;
  const description = ["string", "number", "boolean"].includes(typeof descriptionValue)
    ? String(descriptionValue)
    : `${code}${object.value !== undefined ? `: ${object.value}` : ""}`;
  const file = value(object, ["file", "sourceFile", "filePath", "path"]) || context.file;
  const route = value(object, [
    "route",
    "url",
    "page",
    "canonicalRoute",
    "sourceRoute",
    "targetRoute",
  ]) || context.route
    || (context.slug && source.area === "product-governance" ? `/produkt/${context.slug}/` : "");
  const severity = value(object, ["severity", "level", "priority", "status"]) || severityForKey(key);
  const autoFixPossible =
    source.id === "comparison-audit"
    && /metadata|normalize|format/i.test(`${code} ${description}`);

  const files = [...new Set([...list(object.files), ...list(file)])];
  const urls = [...new Set([...list(object.routes), ...list(object.urls), ...list(route)])];

  return {
    type: String(code),
    category: source.area,
    area: source.area,
    severity,
    confidence: value(object, ["confidence"]) ?? 90,
    source: source.label,
    reportPath: path.relative(APP_ROOT, reportPath).replaceAll("\\", "/"),
    files,
    urls,
    component: value(object, ["component", "componentName"]) || context.component,
    description: String(description),
    impact: value(object, ["impact"]),
    recommendedSolution: value(object, [
      "recommendedSolution",
      "action",
      "recommendedAction",
      "nextAction",
      "recommendation",
    ]),
    releaseBlocker: /critical|fatal|blocker/i.test(String(severity)),
    manualFixRequired: !autoFixPossible,
    autoFixPossible,
    autoFixAvailable: autoFixPossible,
    autoFixId: autoFixPossible ? "comparison-safe-autofix" : "",
    codexSuitable: true,
  };
}

function collectNested(node, source, reportPath, findings, inherited = {}, seen = new Set()) {
  if (!node || typeof node !== "object" || seen.has(node)) return;
  seen.add(node);
  const context = contextFrom(node, inherited);

  for (const [key, child] of Object.entries(node)) {
    if (Array.isArray(child) && FINDING_KEYS.test(key)) {
      for (const item of child) {
        if (isOperationalFinding(source, key, item)) {
          findings.push(findingFrom(item, source, key, context, reportPath));
        }
      }
      continue;
    }

    if (Array.isArray(child)) {
      for (const item of child) collectNested(item, source, reportPath, findings, context, seen);
    } else if (child && typeof child === "object") {
      collectNested(child, source, reportPath, findings, context, seen);
    }
  }
}

function collectDerived(parsed, source, reportPath, findings) {
  if (["price-intelligence", "comparison-heroes", "seo-copilot-report"].includes(source.id)) return;
  if (source.id === "price-intelligence" && Array.isArray(parsed.products)) {
    for (const product of parsed.products.filter((item) => item.stale || !item.current)) {
      findings.push(findingFrom({
        code: product.stale ? "PRICE_STALE" : "PRICE_MISSING",
        severity: "warning",
        message: `${product.title || product.slug}: Preisstatus ist ${product.stale ? "veraltet" : "nicht verfügbar"}.`,
        route: product.slug ? `/produkt/${product.slug}/` : "",
        action: "Preisquelle prüfen; redaktionelle Bewertung und Produktscore unverändert lassen.",
      }, source, "warnings", {}, reportPath));
    }
  }

  if (source.id === "content-inventory" && Array.isArray(parsed.pages)) {
    for (const page of parsed.pages.filter((item) =>
      item.indexable
      && /ratgeber|comparison|vergleich/i.test(String(item.pageType || ""))
      && !String(item.author || "").trim()
    )) {
      findings.push(findingFrom({
        code: "AUTHOR_MISSING",
        severity: /ratgeber|comparison|vergleich/.test(`${page.pageType} ${page.route}`) ? "warning" : "info",
        message: `Autorenangabe fehlt auf ${page.canonicalRoute || page.route || page.title}.`,
        file: page.sourceFile,
        route: page.canonicalRoute || page.route,
        action: "Prüfen, ob für diesen Seitentyp eine belegte Autorenangabe erforderlich ist.",
      }, source, "warnings", {}, reportPath));
    }
  }

  if (source.id === "product-data" && Array.isArray(parsed.products)) {
    for (const product of parsed.products.filter((item) => list(item.errors).length || list(item.warnings).length)) {
      if (![...list(product.errors), ...list(product.warnings)].some((item) => String(item).trim())) {
        findings.push(findingFrom({
          code: "PRODUCT_COVERAGE",
          message: `${product.title || product.slug}: Produktabdeckung prüfen.`,
          file: product.file,
          route: product.slug ? `/produkt/${product.slug}/` : "",
        }, source, "warnings", {}, reportPath));
      }
    }
  }
}

const normalizedReportIdentity = (reportPath) => {
  try {
    return fs.realpathSync(reportPath);
  } catch {
    return path.resolve(reportPath);
  }
};

export function collectQualitySources({ registry = QUALITY_SOURCE_REGISTRY } = {}) {
  const findings = [];
  const sources = [];
  const processedReports = new Set();
  let duplicatesPrevented = 0;

  for (const source of registry) {
    const reportPath = source.files.find((candidate) => fs.existsSync(candidate));
    if (!reportPath) {
      sources.push({
        id: source.id,
        label: source.label,
        area: source.area,
        status: "missing",
        reportPath: null,
        generatedAt: null,
        findingCount: 0,
      });
      continue;
    }

    const identity = normalizedReportIdentity(reportPath);
    if (processedReports.has(identity)) {
      duplicatesPrevented += 1;
      sources.push({
        id: source.id,
        label: source.label,
        area: source.area,
        status: "deduplicated",
        reportPath: path.relative(APP_ROOT, reportPath).replaceAll("\\", "/"),
        generatedAt: null,
        findingCount: 0,
      });
      continue;
    }

    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(reportPath, "utf8"));
    } catch (error) {
      sources.push({
        id: source.id,
        label: source.label,
        area: source.area,
        status: "invalid",
        reportPath: path.relative(APP_ROOT, reportPath).replaceAll("\\", "/"),
        generatedAt: null,
        findingCount: 0,
        error: error.message,
      });
      continue;
    }

    const before = findings.length;
    collectNested(parsed, source, reportPath, findings);
    collectDerived(parsed, source, reportPath, findings);
    processedReports.add(identity);

    const stat = fs.statSync(reportPath);
    sources.push({
      id: source.id,
      label: source.label,
      area: source.area,
      status: "available",
      reportPath: path.relative(APP_ROOT, reportPath).replaceAll("\\", "/"),
      generatedAt: parsed.generatedAt || parsed.finishedAt || stat.mtime.toISOString(),
      findingCount: findings.length - before,
    });
  }

  return { findings, sources, duplicatesPrevented };
}

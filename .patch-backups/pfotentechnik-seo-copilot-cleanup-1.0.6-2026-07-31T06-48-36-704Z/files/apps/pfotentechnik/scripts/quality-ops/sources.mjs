import fs from "node:fs";
import path from "node:path";
import { APP_ROOT } from "../../src/lib/search/config.mjs";

const report = (...names) => names.map((name) => path.join(APP_ROOT, "reports", name));

export const QUALITY_SOURCE_REGISTRY = Object.freeze([
  { id: "repository-audit", label: "Repository Audit", area: "repository-audit", files: report("repository-audit.json") },
  { id: "technical-seo", label: "Technical SEO", area: "technical-seo", files: report("seo-release/build-output-latest.json") },
  { id: "internal-linking", label: "Internal Linking", area: "internal-linking", files: report("internal-linking/internal-link-health-audit.json", "internal-linking/internal-link-audit.json") },
  { id: "content-quality", label: "Content Quality", area: "content-quality", files: report("content-quality/cannibalization-report.json") },
  { id: "cannibalization", label: "Cannibalization", area: "cannibalization", files: report("content-quality/cannibalization-report.json") },
  { id: "product-governance", label: "Product Governance", area: "product-governance", files: report("product-data-audit.json") },
  { id: "comparison-governance", label: "Comparison Governance", area: "comparison-governance", files: report("comparison-platform/comparison-audit.json", "comparison-platform/comparison-data-platform.json") },
  { id: "performance", label: "Performance", area: "performance", files: report("performance/after-latest.json", "performance/viewport-contract-latest.json") },
  { id: "images", label: "Images", area: "image-coverage", files: report("comparison-platform/hero-assets-15.4.4.json", "media-center-audit.json") },
  { id: "structured-data", label: "Structured Data", area: "structured-data", files: report("seo-release/build-output-latest.json", "comparison-platform/comparison-audit.json") },
  { id: "json-ld", label: "JSON-LD", area: "json-ld", files: report("seo-release/build-output-latest.json") },
  { id: "accessibility", label: "Accessibility", area: "accessibility", files: report("design-system/visual-qa-latest.json") },
  { id: "trust", label: "Trust", area: "trust", files: report("content-quality/cannibalization-report.json") },
  { id: "eeat", label: "EEAT", area: "eeat", files: report("content-quality/content-inventory.json") },
  { id: "build", label: "Build", area: "build", files: report("seo-release/build-output-latest.json") },
  { id: "release-gate", label: "Release Gate", area: "release-gate", files: [path.join(APP_ROOT, ".seo-release", "preflight-latest.json"), ...report("comparison-platform/comparison-release-closure.json")] },
  { id: "broken-links", label: "Broken Links", area: "broken-links", files: report("internal-linking/internal-link-target-audit.json", "internal-linking/internal-link-health-audit.json") },
  { id: "redirects", label: "Redirects", area: "redirects", files: report("seo-release/build-output-latest.json") },
  { id: "sitemap", label: "Sitemap", area: "sitemap", files: report("seo-release/build-output-latest.json") },
  { id: "canonicals", label: "Canonicals", area: "canonicals", files: report("seo-release/build-output-latest.json", "content-quality/content-inventory.json") },
  { id: "robots", label: "Robots", area: "robots", files: report("seo-release/build-output-latest.json") },
  { id: "product-coverage", label: "Product Coverage", area: "product-coverage", files: report("product-data-audit.json") },
  { id: "price-status", label: "Price Status", area: "price-status", files: report("price-intelligence-audit.json") },
  { id: "manufacturer-coverage", label: "Manufacturer Coverage", area: "manufacturer-coverage", files: report("product-data-audit.json") },
  { id: "recommendation-conflicts", label: "Recommendation Conflicts", area: "recommendation-conflicts", files: report("product-experience-2-audit.json", "seo-copilot-report.json") },
  { id: "image-coverage", label: "Image Coverage", area: "image-coverage", files: report("media-center-audit.json", "comparison-platform/hero-assets-15.4.4.json") },
  { id: "author-coverage", label: "Author Coverage", area: "author-coverage", files: report("content-quality/content-inventory.json") },
]);

const FINDING_KEYS = /^(findings|issues|errors|warnings|failures|missing|conflicts|quickWins|recommendedNextActions|reviewRequired)$/i;
const severityForKey = (key) => /error|failure/i.test(key) ? "error" : /warning|missing|conflict|review/i.test(key) ? "warning" : "info";
const value = (item, keys) => keys.map((key) => item?.[key]).find((candidate) => candidate !== undefined && candidate !== null && candidate !== "");
const list = (candidate) => Array.isArray(candidate) ? candidate : candidate ? [candidate] : [];

function contextFrom(item, inherited = {}) {
  if (!item || typeof item !== "object" || Array.isArray(item)) return inherited;
  return {
    file: value(item, ["file", "sourceFile", "filePath", "path"]) || inherited.file,
    route: value(item, ["route", "url", "page", "canonicalRoute", "sourceRoute", "targetRoute"]) || inherited.route,
    slug: value(item, ["slug", "productSlug"]) || inherited.slug,
    title: value(item, ["title", "name", "product"]) || inherited.title,
  };
}

function findingFrom(item, source, key, context, reportPath) {
  const object = item && typeof item === "object" ? item : { message: String(item) };
  const description = value(object, ["message", "reason", "description", "title", "label", "evidence", "error", "warning"]) || String(item);
  const code = value(object, ["code", "type", "id", "check", "rule"]) || key;
  const file = value(object, ["file", "sourceFile", "filePath", "path"]) || context.file;
  const route = value(object, ["route", "url", "page", "canonicalRoute", "sourceRoute", "targetRoute"]) || context.route
    || (context.slug && source.area === "product-governance" ? `/produkt/${context.slug}/` : "");
  const severity = value(object, ["severity", "level", "priority", "status"]) || severityForKey(key);
  return {
    type: String(code),
    category: source.area,
    area: source.area,
    severity,
    confidence: value(object, ["confidence"]) ?? 90,
    source: source.label,
    reportPath: path.relative(APP_ROOT, reportPath).replaceAll("\\", "/"),
    files: list(file),
    urls: list(route),
    description: String(description),
    impact: value(object, ["impact"]),
    recommendedAction: value(object, ["action", "recommendedAction", "nextAction"]),
    releaseBlocker: /critical|fatal|blocker/i.test(String(severity)),
    manualFixRequired: !/auto.?fix/i.test(String(code)),
    autoFixAvailable: source.id === "comparison-governance" && /metadata|normalize|format/i.test(`${code} ${description}`),
    autoFixId: source.id === "comparison-governance" ? "comparison-safe-autofix" : "",
  };
}

function collectNested(node, source, reportPath, findings, inherited = {}, seen = new Set()) {
  if (!node || typeof node !== "object" || seen.has(node)) return;
  seen.add(node);
  const context = contextFrom(node, inherited);
  for (const [key, child] of Object.entries(node)) {
    if (Array.isArray(child) && FINDING_KEYS.test(key)) {
      for (const item of child) findings.push(findingFrom(item, source, key, context, reportPath));
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
  if (source.id === "price-status" && Array.isArray(parsed.products)) {
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
  if (source.id === "author-coverage" && Array.isArray(parsed.pages)) {
    for (const page of parsed.pages.filter((item) => item.indexable && !String(item.author || "").trim())) {
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
  if (source.id === "product-coverage" && Array.isArray(parsed.products)) {
    for (const product of parsed.products.filter((item) => list(item.errors).length || list(item.warnings).length)) {
      if (!list(product.errors).length && !list(product.warnings).length) continue;
      // Nested extraction records the concrete messages. This marker only exists if a product has no usable message.
      if (![...list(product.errors), ...list(product.warnings)].some((item) => String(item).trim())) {
        findings.push(findingFrom({ code: "PRODUCT_COVERAGE", message: `${product.title || product.slug}: Produktabdeckung prüfen.`, file: product.file }, source, "warnings", {}, reportPath));
      }
    }
  }
}

export function collectQualitySources({ registry = QUALITY_SOURCE_REGISTRY } = {}) {
  const findings = [];
  const sources = [];
  const processed = new Set();
  for (const source of registry) {
    const reportPath = source.files.find((candidate) => fs.existsSync(candidate));
    if (!reportPath) {
      sources.push({ id: source.id, label: source.label, area: source.area, status: "missing", reportPath: null, generatedAt: null, findingCount: 0 });
      continue;
    }
    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(reportPath, "utf8"));
    } catch (error) {
      sources.push({ id: source.id, label: source.label, area: source.area, status: "invalid", reportPath: path.relative(APP_ROOT, reportPath), generatedAt: null, findingCount: 0, error: error.message });
      continue;
    }
    const before = findings.length;
    const identity = `${reportPath}|${source.area}`;
    if (!processed.has(identity)) {
      collectNested(parsed, source, reportPath, findings);
      collectDerived(parsed, source, reportPath, findings);
      processed.add(identity);
    }
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
  return { findings, sources };
}

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  analyzeHtml,
  auditRouteMetrics,
  auditSourceMetrics,
  collectRoute,
} from "../scripts/performance/core.mjs";

const budget = {
  htmlWarning: 100,
  htmlHard: 200,
  cssWarning: 100,
  cssHard: 200,
  jsWarning: 100,
  jsHard: 200,
  domWarning: 10,
  domHard: 20,
  imageWarning: 100,
  imageHard: 200,
  stylesheetHard: 1,
  importantWarning: 1,
  importantHard: 2,
};

const codes = (findings) => new Set(findings.map((finding) => finding.code));

test("HTML parser detects lazy LCP, dimensions and DOM shape", () => {
  const metrics = analyzeHtml("<!doctype html><html><body><main><img src='/hero.webp' loading='lazy'></main></body></html>");
  assert.equal(metrics.images, 1);
  assert.equal(metrics.probableLcpLazy, true);
  assert.equal(metrics.missingDimensions, 1);
  assert.ok(metrics.domNodes >= 4);
});

test("route budgets expose stable error codes", () => {
  const findings = auditRouteMetrics("/fixture/", {
    htmlBytes: 201,
    cssBytes: 201,
    jsBytes: 201,
    domNodes: 21,
    imageBytes: 201,
    importantDeclarations: 3,
    probableLcpLazy: true,
    missingDimensions: 1,
    stylesheets: 2,
  }, budget);
  const actual = codes(findings);
  for (const code of [
    "PERF_BUDGET_CSS_EXCEEDED",
    "PERF_BUDGET_JS_EXCEEDED",
    "PERF_HTML_TOO_LARGE",
    "PERF_DOM_TOO_COMPLEX",
    "PERF_IMAGE_BYTES_EXCEEDED",
    "PERF_LCP_IMAGE_LAZY",
    "PERF_IMAGE_DIMENSIONS_MISSING",
    "PERF_RENDER_BLOCKING_STYLESHEET",
    "PERF_CSS_SPECIFICITY_HIGH",
  ]) assert.ok(actual.has(code), code);
});

test("source audit rejects runtime DOM correction and obsolete CSS", () => {
  const findings = auditSourceMetrics({
    runtimeDomCorrectionPresent: true,
    hydrationDirectives: 2,
    legacyComparisonFiles: ["comparison-mobile-hotfix.css"],
  });
  const actual = codes(findings);
  assert.ok(actual.has("PERF_DUPLICATE_RUNTIME_DOM"));
  assert.ok(actual.has("PERF_UNUSED_HYDRATION"));
  assert.ok(actual.has("PERF_RENDER_BLOCKING_STYLESHEET"));
});

test("clean fixture stays below the gate", () => {
  const findings = auditRouteMetrics("/fixture/", {
    htmlBytes: 90,
    cssBytes: 90,
    jsBytes: 0,
    domNodes: 8,
    imageBytes: 90,
    importantDeclarations: 0,
    probableLcpLazy: false,
    missingDimensions: 0,
    stylesheets: 1,
  }, budget);
  assert.deepEqual(findings, []);
});

test("missing production route has a stable error code", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "pfotentechnik-perf-route-"));
  const result = collectRoute(root, { route: "/missing/", category: "utility" });
  assert.equal(result.findings[0]?.code, "PERF_ROUTE_MISSING");
});

test("runtime cleanup is static and the release gate contains one performance phase", () => {
  const appRoot = path.resolve(import.meta.dirname, "..");
  const repoRoot = path.resolve(appRoot, "../..");
  const projectLayout = fs.readFileSync(path.join(appRoot, "src/layouts/ProjectLayout.astro"), "utf8");
  const productPage = fs.readFileSync(path.join(appRoot, "src/pages/produkt/[product].astro"), "utf8");
  const renderer = fs.readFileSync(path.join(repoRoot, "packages/affiliate-core/src/renderer/PremiumRenderer.astro"), "utf8");
  const preflight = fs.readFileSync(path.join(appRoot, "scripts/seo/release-preflight.mjs"), "utf8");

  assert.doesNotMatch(projectLayout, /SiteRuntimeFixes|product-mobile-premium/);
  assert.match(productPage, /pfotentechnik-product-mobile-premium\.css/);
  assert.match(renderer, /data-pt-product-card/);
  assert.match(renderer, /--pt-score-angle/);
  assert.equal((preflight.match(/"audit:performance:strict"/g) ?? []).length, 1);
});

test("dynamic routes reuse build-scoped content and derived indexes", () => {
  const appRoot = path.resolve(import.meta.dirname, "..");
  const registry = fs.readFileSync(path.join(appRoot, "src/domain/content/registry.ts"), "utf8");
  const related = fs.readFileSync(path.join(appRoot, "src/domain/content/related.ts"), "utf8");
  const productModel = fs.readFileSync(path.join(appRoot, "src/domain/productExperience/model.ts"), "utf8");
  const dynamicRoutes = [
    "src/pages/[slug].astro",
    "src/pages/hersteller/[manufacturer].astro",
    "src/pages/produkt/[product].astro",
    "src/pages/vergleiche/[comparison].astro",
  ].map((relativePath) => fs.readFileSync(path.join(appRoot, relativePath), "utf8"));

  assert.match(registry, /pagesPromise \?\?= getCollection\("pages"\)/);
  assert.match(registry, /allContentPromise \?\?= loadAllContent\(\)/);
  assert.match(related, /targetContextCache = new WeakMap/);
  assert.match(related, /scoreRelatedEntry\(entry, options, scoringContext\)/);
  assert.match(productModel, /priceIndexCache = new WeakMap/);
  assert.match(productModel, /getPriceIndex\(allProducts, currentEntry\)/);
  for (const route of dynamicRoutes) {
    assert.doesNotMatch(route, /\bgetCollection\(/);
    assert.doesNotMatch(route, /\bgetEntry\(/);
  }
});

test("SEO advisor uses the compact cached work-package snapshot", () => {
  const appRoot = path.resolve(import.meta.dirname, "..");
  const advisorPage = fs.readFileSync(path.join(appRoot, "src/pages/admin/seo/advisor.astro"), "utf8");
  const workPackageLoader = fs.readFileSync(path.join(appRoot, "src/lib/seo/advisor/loadWorkPackages.ts"), "utf8");
  const contentLoader = fs.readFileSync(path.join(appRoot, "src/lib/seo/advisor/loadContent.ts"), "utf8");

  assert.match(advisorPage, /SeoWorkPackages/);
  assert.doesNotMatch(advisorPage, /loadSeoAdvisorData|loadProductIntelligence/);
  assert.match(workPackageLoader, /const payload = loadSeoDashboard\(\)/);
  assert.doesNotMatch(workPackageLoader, /loadSeoAdvisorData|loadProductIntelligence|loadAdvisorContent/);
  assert.doesNotMatch(workPackageLoader, /buildSeoAdvisor/);
  assert.match(workPackageLoader, /seoWorkPackageDataPromise \?\?= loadSeoWorkPackageDataUncached\(\)/);
  assert.match(contentLoader, /getPages\(\)/);
  assert.doesNotMatch(contentLoader, /\bgetCollection\(/);
});

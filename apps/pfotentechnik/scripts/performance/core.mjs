import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const VOID_ELEMENTS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input", "link",
  "meta", "param", "source", "track", "wbr",
]);

const attr = (tag, name) => {
  const match = tag.match(new RegExp(`\\s${name}(?:\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)'|([^\\s>]+)))?`, "i"));
  return match ? (match[1] ?? match[2] ?? match[3] ?? "") : undefined;
};

const assetPath = (distRoot, url) => {
  if (!url || /^(?:data:|https?:|\/\/)/i.test(url)) return undefined;
  const clean = url.split(/[?#]/, 1)[0];
  return path.join(distRoot, decodeURIComponent(clean.replace(/^\/+/, "")));
};

const bytesForAssets = (distRoot, urls) => {
  let bytes = 0;
  let found = 0;
  for (const url of new Set(urls)) {
    const file = assetPath(distRoot, url);
    if (file && fs.existsSync(file) && fs.statSync(file).isFile()) {
      bytes += fs.statSync(file).size;
      found += 1;
    }
  }
  return { bytes, files: found };
};

export const analyzeHtml = (html, distRoot = "") => {
  const withoutEmbeddedContent = html.replace(
    /<(script|style)\b([^>]*)>[\s\S]*?<\/\1\s*>/gi,
    "<$1$2></$1>",
  );
  const stack = [];
  let domNodes = 0;
  let domDepth = 0;
  for (const match of withoutEmbeddedContent.matchAll(/<\/?([a-z][\w:-]*)\b[^>]*>/gi)) {
    const tag = match[0];
    const name = match[1].toLowerCase();
    if (tag.startsWith("</")) {
      const index = stack.lastIndexOf(name);
      if (index >= 0) stack.length = index;
      continue;
    }
    domNodes += 1;
    domDepth = Math.max(domDepth, stack.length + 1);
    if (!VOID_ELEMENTS.has(name) && !tag.endsWith("/>")) stack.push(name);
  }

  const stylesheetUrls = [];
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    if (attr(match[0], "rel")?.split(/\s+/).includes("stylesheet")) {
      const href = attr(match[0], "href");
      if (href) stylesheetUrls.push(href);
    }
  }

  const scriptUrls = [];
  let inlineScripts = 0;
  for (const match of html.matchAll(/<script\b[^>]*>/gi)) {
    const src = attr(match[0], "src");
    if (src) scriptUrls.push(src);
    else if (attr(match[0], "type") !== "application/ld+json") inlineScripts += 1;
  }

  const imageUrls = [];
  let images = 0;
  let eagerImages = 0;
  let lazyImages = 0;
  let highPriorityImages = 0;
  let missingDimensions = 0;
  let probableLcpLazy = false;
  let firstContentImageSeen = false;
  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = match[0];
    images += 1;
    const src = attr(tag, "src");
    if (src) imageUrls.push(src);
    const srcset = attr(tag, "srcset");
    if (srcset) {
      for (const candidate of srcset.split(",")) {
        const url = candidate.trim().split(/\s+/, 1)[0];
        if (url) imageUrls.push(url);
      }
    }
    const loading = attr(tag, "loading");
    const priority = attr(tag, "fetchpriority");
    if (loading === "lazy") lazyImages += 1;
    if (loading === "eager") eagerImages += 1;
    if (priority === "high") highPriorityImages += 1;
    const isDynamicLightboxPreview = attr(tag, "data-lightbox-image") !== undefined;
    if (!isDynamicLightboxPreview && (!attr(tag, "width") || !attr(tag, "height"))) {
      missingDimensions += 1;
    }
    if (!firstContentImageSeen && attr(tag, "aria-hidden") !== "true") {
      firstContentImageSeen = true;
      probableLcpLazy = loading === "lazy";
    }
  }

  const cssAssets = bytesForAssets(distRoot, stylesheetUrls);
  const jsAssets = bytesForAssets(distRoot, scriptUrls);
  const imageAssets = bytesForAssets(distRoot, imageUrls);
  let importantDeclarations = 0;
  for (const url of new Set(stylesheetUrls)) {
    const file = assetPath(distRoot, url);
    if (file && fs.existsSync(file)) {
      importantDeclarations += (fs.readFileSync(file, "utf8").match(/!important\b/g) ?? []).length;
    }
  }

  return {
    htmlBytes: Buffer.byteLength(html),
    htmlBrotliBytes: zlib.brotliCompressSync(Buffer.from(html)).length,
    domNodes,
    domDepth,
    stylesheets: new Set(stylesheetUrls).size,
    cssBytes: cssAssets.bytes,
    cssFiles: cssAssets.files,
    scripts: new Set(scriptUrls).size,
    jsBytes: jsAssets.bytes,
    jsFiles: jsAssets.files,
    inlineScripts,
    images,
    imageAssetFiles: imageAssets.files,
    imageBytes: imageAssets.bytes,
    eagerImages,
    lazyImages,
    highPriorityImages,
    missingDimensions,
    probableLcpLazy,
    importantDeclarations,
  };
};

export const auditRouteMetrics = (route, metrics, budget) => {
  const findings = [];
  const add = (code, severity, message, actual, limit) => findings.push({
    code, severity, route, message, actual, limit,
  });
  const threshold = (value, warning, hard, code, label) => {
    if (value > hard) add(code, "error", `${label}: ${value} > ${hard}.`, value, hard);
    else if (value > warning) add(code, "warning", `${label}: ${value} > ${warning}.`, value, warning);
  };

  threshold(metrics.cssBytes, budget.cssWarning, budget.cssHard, "PERF_BUDGET_CSS_EXCEEDED", "CSS-Budget überschritten");
  threshold(metrics.jsBytes, budget.jsWarning, budget.jsHard, "PERF_BUDGET_JS_EXCEEDED", "JS-Budget überschritten");
  threshold(metrics.htmlBytes, budget.htmlWarning, budget.htmlHard, "PERF_HTML_TOO_LARGE", "HTML-Budget überschritten");
  threshold(metrics.domNodes, budget.domWarning, budget.domHard, "PERF_DOM_TOO_COMPLEX", "DOM-Budget überschritten");
  threshold(metrics.imageBytes, budget.imageWarning, budget.imageHard, "PERF_IMAGE_BYTES_EXCEEDED", "Bildbudget überschritten");
  threshold(
    metrics.importantDeclarations,
    budget.importantWarning,
    budget.importantHard,
    "PERF_CSS_SPECIFICITY_HIGH",
    "!important-Budget überschritten",
  );

  if (metrics.probableLcpLazy) {
    add("PERF_LCP_IMAGE_LAZY", "error", "Das erste inhaltliche Bild wird lazy geladen.", true, false);
  }
  if (metrics.missingDimensions > 0) {
    add("PERF_IMAGE_DIMENSIONS_MISSING", "error", `${metrics.missingDimensions} Bilder ohne width/height.`, metrics.missingDimensions, 0);
  }
  if (metrics.stylesheets > budget.stylesheetHard) {
    add(
      "PERF_RENDER_BLOCKING_STYLESHEET",
      "error",
      `${metrics.stylesheets} render-blockierende Stylesheets.`,
      metrics.stylesheets,
      budget.stylesheetHard,
    );
  }
  return findings;
};

export const mergedBudget = (budgets, category) => ({
  ...budgets.defaults,
  ...(budgets.categories[category] ?? {}),
});

export const routeFile = (distRoot, route) => {
  const relative = route === "/" ? "index.html" : `${route.replace(/^\/|\/$/g, "")}/index.html`;
  return path.join(distRoot, relative);
};

export const collectRoute = (distRoot, definition) => {
  const file = routeFile(distRoot, definition.route);
  if (!fs.existsSync(file)) {
    return {
      definition,
      metrics: undefined,
      findings: [{
        code: "PERF_ROUTE_MISSING",
        severity: "error",
        route: definition.route,
        message: `Gerenderte Route fehlt: ${file}`,
        actual: false,
        limit: true,
      }],
    };
  }
  return {
    definition,
    metrics: analyzeHtml(fs.readFileSync(file, "utf8"), distRoot),
    findings: [],
  };
};

const walkFiles = (root, extension, output = []) => {
  if (!fs.existsSync(root)) return output;
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) walkFiles(full, extension, output);
    else if (entry.name.endsWith(extension)) output.push(full);
  }
  return output;
};

export const collectSourceMetrics = (appRoot, repoRoot) => {
  const cssFiles = [
    ...walkFiles(path.join(appRoot, "src"), ".css"),
    ...walkFiles(path.join(repoRoot, "packages/affiliate-core/src"), ".css"),
  ];
  const astroFiles = [
    ...walkFiles(path.join(appRoot, "src"), ".astro"),
    ...walkFiles(path.join(repoRoot, "packages/affiliate-core/src"), ".astro"),
  ];
  let cssBytes = 0;
  let importantDeclarations = 0;
  let hydrationDirectives = 0;
  for (const file of cssFiles) {
    const content = fs.readFileSync(file, "utf8");
    cssBytes += Buffer.byteLength(content);
    importantDeclarations += (content.match(/!important\b/g) ?? []).length;
  }
  for (const file of astroFiles) {
    hydrationDirectives += (fs.readFileSync(file, "utf8").match(/\bclient:(?:load|idle|visible|media|only)\b/g) ?? []).length;
  }
  const runtimeFix = path.join(appRoot, "src/components/SiteRuntimeFixes.astro");
  const legacyComparisonFiles = [
    "comparison.css",
    "comparison-editorial-cover.css",
    "comparison-premium-ux.css",
    "comparison-premium-seo.css",
    "comparison-ux-polish-3.2.css",
    "comparison-mobile-price-fix-4.0.1.css",
    "comparison-cta-system.css",
    "comparison-mobile-hotfix.css",
  ].filter((name) => fs.existsSync(path.join(
    repoRoot,
    "packages/affiliate-core/src/components/comparison",
    name,
  )));
  return {
    cssFiles: cssFiles.length,
    cssBytes,
    importantDeclarations,
    hydrationDirectives,
    runtimeDomCorrectionPresent: fs.existsSync(runtimeFix),
    legacyComparisonFiles,
  };
};

export const auditSourceMetrics = (source) => {
  const findings = [];
  if (source.runtimeDomCorrectionPresent) {
    findings.push({
      code: "PERF_DUPLICATE_RUNTIME_DOM",
      severity: "error",
      route: "source",
      message: "Globale DOM-Korrektur ist weiterhin vorhanden.",
      actual: true,
      limit: false,
    });
  }
  if (source.hydrationDirectives > 0) {
    findings.push({
      code: "PERF_UNUSED_HYDRATION",
      severity: "warning",
      route: "source",
      message: `${source.hydrationDirectives} Hydration-Direktiven müssen begründet bleiben.`,
      actual: source.hydrationDirectives,
      limit: 0,
    });
  }
  if (source.legacyComparisonFiles.length > 0) {
    findings.push({
      code: "PERF_RENDER_BLOCKING_STYLESHEET",
      severity: "error",
      route: "source",
      message: `Obsolete Comparison-CSS-Dateien: ${source.legacyComparisonFiles.join(", ")}.`,
      actual: source.legacyComparisonFiles.length,
      limit: 0,
    });
  }
  return findings;
};

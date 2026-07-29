#!/usr/bin/env electron
const { app, BrowserWindow } = require("electron");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

app.commandLine.appendSwitch("disable-gpu");

const APP_ROOT = path.resolve(__dirname, "../..");
const DIST_ROOT = path.join(APP_ROOT, "dist");
const REPORT_ROOT = path.join(APP_ROOT, "reports/performance");
const FAILURE_ROOT = path.join(REPORT_ROOT, "viewport-failures");
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
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1366, height: 900 },
];
const mime = {
  ".css": "text/css",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".xml": "application/xml",
};

const fileForRequest = (requestUrl) => {
  const pathname = decodeURIComponent(new URL(requestUrl, "http://localhost").pathname);
  const relative = pathname.endsWith("/") ? `${pathname}index.html` : pathname;
  const candidate = path.resolve(DIST_ROOT, `.${relative}`);
  if (!candidate.startsWith(`${DIST_ROOT}${path.sep}`) && candidate !== DIST_ROOT) return undefined;
  return candidate;
};

const server = http.createServer((request, response) => {
  const file = fileForRequest(request.url || "/");
  if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }
  response.writeHead(200, {
    "content-type": mime[path.extname(file)] || "application/octet-stream",
    "cache-control": "no-store",
  });
  fs.createReadStream(file).pipe(response);
});

const slugFor = (route) => route === "/"
  ? "home"
  : route.replace(/^\/|\/$/g, "").replaceAll("/", "--");

const inspectPage = () => {
  const root = document.documentElement;
  const missingDimensions = [...document.images].filter(
    (image) => !image.hasAttribute("data-lightbox-image")
      && (!image.hasAttribute("width") || !image.hasAttribute("height")),
  );
  const brokenImages = [...document.images].filter(
    (image) => !image.hasAttribute("data-lightbox-image") && image.complete && image.naturalWidth === 0,
  );
  const firstContentImage = [...document.images].find(
    (image) => !image.hasAttribute("data-lightbox-image") && image.getClientRects().length > 0,
  );
  return {
    title: document.title,
    h1Count: document.querySelectorAll("h1").length,
    viewportMeta: document.querySelector('meta[name="viewport"]')?.getAttribute("content") || "",
    clientWidth: root.clientWidth,
    scrollWidth: root.scrollWidth,
    horizontalOverflow: Math.max(0, root.scrollWidth - root.clientWidth),
    missingDimensions: missingDimensions.length,
    brokenImages: brokenImages.length,
    firstContentImageLazy: firstContentImage?.loading === "lazy",
    stylesheets: document.styleSheets.length,
  };
};

const findingsFor = (route, viewport, metrics) => {
  const findings = [];
  const add = (code, message) => findings.push({ code, route, viewport: viewport.name, message });
  if (metrics.horizontalOverflow > 2) {
    add("PERF_VIEWPORT_HORIZONTAL_OVERFLOW", `${metrics.horizontalOverflow}px horizontaler Überlauf.`);
  }
  if (metrics.missingDimensions > 0) {
    add("PERF_IMAGE_DIMENSIONS_MISSING", `${metrics.missingDimensions} Bilder ohne Maße.`);
  }
  if (metrics.brokenImages > 0) {
    add("PERF_IMAGE_LOAD_FAILED", `${metrics.brokenImages} Bilder konnten nicht geladen werden.`);
  }
  if (metrics.firstContentImageLazy) {
    add("PERF_LCP_IMAGE_LAZY", "Das erste sichtbare Bild wird lazy geladen.");
  }
  if (metrics.h1Count < 1) {
    add("PERF_DOCUMENT_OUTLINE_INVALID", "Keine H1 gefunden.");
  }
  if (!/width\s*=\s*device-width/i.test(metrics.viewportMeta)) {
    add("PERF_VIEWPORT_META_MISSING", "Viewport-Meta fehlt oder ist ungültig.");
  }
  return findings;
};

app.whenReady().then(async () => {
  if (!fs.existsSync(DIST_ROOT)) throw new Error(`Build-Ausgabe fehlt: ${DIST_ROOT}`);
  fs.mkdirSync(REPORT_ROOT, { recursive: true });
  fs.mkdirSync(FAILURE_ROOT, { recursive: true });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const results = [];
  const allFindings = [];
  const window = new BrowserWindow({
    show: false,
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
    },
  });

  for (const viewport of viewports) {
    window.setContentSize(viewport.width, viewport.height);
    for (const route of routes) {
      let metrics;
      let findings;
      try {
        await window.loadURL(`${baseUrl}${route}`);
        await window.webContents.executeJavaScript(
          "Promise.all([document.fonts?.ready, new Promise(resolve => setTimeout(resolve, 80))])",
        );
        metrics = await window.webContents.executeJavaScript(`(${inspectPage.toString()})()`);
        findings = findingsFor(route, viewport, metrics);
      } catch (error) {
        metrics = undefined;
        findings = [{
          code: "PERF_ROUTE_LOAD_FAILED",
          route,
          viewport: viewport.name,
          message: error instanceof Error ? error.message : String(error),
        }];
      }
      if (findings.length > 0) {
        const screenshot = path.join(FAILURE_ROOT, `${slugFor(route)}-${viewport.width}.png`);
        await window.webContents.capturePage().then((image) => fs.writeFileSync(screenshot, image.toPNG()));
      }
      allFindings.push(...findings);
      results.push({ route, viewport, metrics, findings });
    }
  }

  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    status: allFindings.length === 0 ? "ok" : "error",
    engine: process.versions.chrome,
    results,
    findings: allFindings,
    summary: {
      checks: results.length,
      passed: results.filter((result) => result.findings.length === 0).length,
      failed: results.filter((result) => result.findings.length > 0).length,
    },
  };
  const markdown = [
    "# PfotenTechnik Viewport Smoke Test",
    "",
    `- Status: ${report.status.toUpperCase()}`,
    `- Chromium: ${report.engine}`,
    `- Checks: ${report.summary.checks}`,
    `- Bestanden: ${report.summary.passed}`,
    `- Fehlgeschlagen: ${report.summary.failed}`,
    "",
    "## Befunde",
    "",
    ...(allFindings.length
      ? allFindings.map((finding) => `- ${finding.code} ${finding.route} (${finding.viewport}): ${finding.message}`)
      : ["Keine."]),
    "",
  ].join("\n");
  fs.writeFileSync(path.join(REPORT_ROOT, "viewport-latest.json"), `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(path.join(REPORT_ROOT, "viewport-latest.md"), markdown);
  console.log(markdown);
  window.destroy();
  server.close();
  app.exit(allFindings.length === 0 ? 0 : 1);
}).catch((error) => {
  console.error(error);
  server.close();
  app.exit(1);
});

#!/usr/bin/env electron
const { app, BrowserWindow } = require("electron");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

app.commandLine.appendSwitch("disable-gpu");

const APP_ROOT = path.resolve(__dirname, "../..");
const DIST_ROOT = path.join(APP_ROOT, "dist");
const REPORT_ROOT = path.join(APP_ROOT, "reports/visual-legacy-audit-34.3a");
const SCREENSHOT_ROOT = path.join(REPORT_ROOT, "screenshots");

const groups = {
  categoryControls: [
    "/smarte-futterautomaten/",
    "/trinkbrunnen/",
    "/gps-tracker/",
    "/katzenklappen/",
    "/haustierkameras/",
    "/automatische-katzentoiletten/",
  ],
  otherHubs: [
    "/vergleiche/",
    "/hersteller/",
    "/wissen/",
    "/kaufberatung/",
    "/smarte-haustiertechnik/",
  ],
  legalUtility: [
    "/impressum/",
    "/datenschutz/",
    "/affiliate-hinweis/",
    "/kontakt/",
    "/redaktion/",
  ],
  methodology: ["/so-bewerten-wir/"],
  functional: ["/futterautomat-berater/", "/berater/futterautomat/"],
  noindexUtility: ["/foundation/"],
};

const routes = Object.entries(groups).flatMap(([group, values]) =>
  values.map((route) => ({ route, group })),
);
const modes = [
  { name: "375-light", width: 375, height: 812, theme: "light" },
  { name: "375-dark", width: 375, height: 812, theme: "dark" },
  { name: "1600-light", width: 1600, height: 1000, theme: "light" },
  { name: "1600-dark", width: 1600, height: 1000, theme: "dark" },
];
const screenshotRoutes = new Set([
  "/impressum/",
  "/redaktion/",
  "/futterautomat-berater/",
]);

const mime = {
  ".avif": "image/avif",
  ".css": "text/css",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
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
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }
  response.writeHead(200, {
    "content-type": mime[path.extname(file)] || "application/octet-stream",
    "cache-control": "no-store",
  });
  fs.createReadStream(file).pipe(response);
});

const slugFor = (route) => route.replace(/^\/+|\/+$/g, "").replaceAll("/", "--");

const inspectPage = () => {
  const root = document.documentElement;
  const body = document.body;
  const visible = (element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
  };
  const tokenColor = (name) => {
    const sample = document.createElement("span");
    sample.style.cssText = `position:fixed;left:-9999px;background:var(${name})`;
    body.append(sample);
    const color = getComputedStyle(sample).backgroundColor;
    sample.remove();
    return color;
  };
  const surfaceColors = [
    "--pt-color-page",
    "--pt-color-surface",
    "--pt-color-surface-soft",
    "--pt-color-surface-raised",
    "--pt-theme-bg",
    "--pt-theme-surface",
    "--pt-theme-surface-2",
    "--pt-theme-surface-3",
  ].map(tokenColor);
  const bodyBackground = getComputedStyle(body).backgroundColor;
  const htmlBackground = getComputedStyle(root).backgroundColor;
  const legacyDarkColors = new Set([
    "rgb(16, 31, 50)",
    "rgb(23, 39, 61)",
    "rgb(19, 34, 56)",
    "rgb(15, 29, 48)",
  ]);
  const whiteSurfaces = [];
  const legacyDarkSurfaces = [];
  if (root.dataset.theme === "dark") {
    for (const element of document.querySelectorAll("body *")) {
      if (!visible(element) || /^(IMG|PICTURE|VIDEO|SVG|PATH)$/.test(element.tagName)) continue;
      const rect = element.getBoundingClientRect();
      if (rect.width * rect.height < 900) continue;
      const background = getComputedStyle(element).backgroundColor;
      if (background === "rgb(255, 255, 255)") {
        whiteSurfaces.push(element.className || element.tagName.toLowerCase());
      }
      if (legacyDarkColors.has(background)) {
        legacyDarkSurfaces.push(element.className || element.tagName.toLowerCase());
      }
    }
  }

  const focusTarget = [...document.querySelectorAll("main a[href], main button:not([disabled]), main input:not([disabled])")]
    .find(visible);
  let focusVisible = true;
  if (focusTarget instanceof HTMLElement) {
    focusTarget.focus({ preventScroll: true });
    const style = getComputedStyle(focusTarget);
    focusVisible = style.outlineStyle !== "none" || style.boxShadow !== "none";
  }

  const legal = document.querySelector(".pt-legal-page");
  const legalWidth = legal ? Math.round(legal.getBoundingClientRect().width) : null;
  return {
    title: document.title,
    h1Count: document.querySelectorAll("h1").length,
    foundation: root.hasAttribute("data-pt-foundation") && body.hasAttribute("data-pt-foundation"),
    header: Boolean(document.querySelector("header.site-header-v2")),
    footer: Boolean(document.querySelector("footer")),
    clientWidth: root.clientWidth,
    scrollWidth: root.scrollWidth,
    horizontalOverflow: Math.max(0, root.scrollWidth - root.clientWidth),
    bodyBackground,
    htmlBackground,
    foundationPageBackground: surfaceColors.includes(bodyBackground) || surfaceColors.includes(htmlBackground),
    bodyColor: getComputedStyle(body).color,
    brokenImages: [...document.images].filter((image) => image.complete && image.naturalWidth === 0).length,
    whiteSurfaces: [...new Set(whiteSurfaces)].slice(0, 12),
    legacyDarkSurfaces: [...new Set(legacyDarkSurfaces)].slice(0, 12),
    focusVisible,
    legalWidth,
    documentHeight: Math.ceil(Math.max(body.scrollHeight, root.scrollHeight)),
  };
};

const findingsFor = ({ route, group }, mode, metrics) => {
  const findings = [];
  const add = (code, detail) => findings.push({ code, route, mode: mode.name, detail });
  if (!metrics.foundation) add("FOUNDATION_MISSING", "Foundation marker missing on html/body.");
  if (!metrics.header || !metrics.footer) add("SHELL_INCOMPLETE", "Shared header or footer missing.");
  if (metrics.h1Count !== 1) add("HEADING_INVALID", `Expected one H1, found ${metrics.h1Count}.`);
  if (metrics.horizontalOverflow > 1) add("HORIZONTAL_OVERFLOW", `${metrics.horizontalOverflow}px overflow.`);
  if (!metrics.foundationPageBackground) add("PAGE_BACKGROUND_NON_SEMANTIC", `${metrics.bodyBackground} / ${metrics.htmlBackground}`);
  if (metrics.brokenImages > 0) add("BROKEN_MEDIA", `${metrics.brokenImages} broken image(s).`);
  if (mode.theme === "dark" && metrics.whiteSurfaces.length) add("WHITE_SURFACE_IN_DARK", metrics.whiteSurfaces.join(", "));
  if (mode.theme === "dark" && metrics.legacyDarkSurfaces.length) add("PRE_GRAPHITE_SURFACE", metrics.legacyDarkSurfaces.join(", "));
  if (!metrics.focusVisible) add("FOCUS_NOT_VISIBLE", "First functional control has no visible focus treatment.");
  if (group === "legalUtility" && metrics.legalWidth !== null && metrics.legalWidth > 760) {
    add("READING_AXIS_TOO_WIDE", `${metrics.legalWidth}px legal reading axis.`);
  }
  return findings;
};

app.whenReady().then(async () => {
  if (!fs.existsSync(DIST_ROOT)) throw new Error(`Build output missing: ${DIST_ROOT}`);
  fs.mkdirSync(SCREENSHOT_ROOT, { recursive: true });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const window = new BrowserWindow({
    show: false,
    width: 1600,
    height: 1000,
    webPreferences: { contextIsolation: true, sandbox: true },
  });
  window.webContents.debugger.attach("1.3");

  const results = [];
  const allFindings = [];
  for (const item of routes) {
    for (const mode of modes) {
      window.setContentSize(mode.width, mode.height);
      await window.loadURL(`${baseUrl}${item.route}`);
      await window.webContents.executeJavaScript(`
        document.documentElement.dataset.theme = ${JSON.stringify(mode.theme)};
        document.documentElement.classList.toggle("dark", ${mode.theme === "dark"});
        document.documentElement.classList.toggle("light", ${mode.theme === "light"});
        Promise.all([
          document.fonts?.ready,
          ...[...document.images].map((image) => image.complete ? Promise.resolve() : new Promise((resolve) => {
            image.addEventListener("load", resolve, { once: true });
            image.addEventListener("error", resolve, { once: true });
            setTimeout(resolve, 1500);
          })),
          new Promise((resolve) => setTimeout(resolve, 120))
        ]);
      `);
      const metrics = await window.webContents.executeJavaScript(`(${inspectPage.toString()})()`);
      const findings = findingsFor(item, mode, metrics);
      allFindings.push(...findings);
      results.push({ ...item, mode: mode.name, theme: mode.theme, viewport: { width: mode.width, height: mode.height }, metrics, findings });

      if (screenshotRoutes.has(item.route)) {
        const shot = await window.webContents.debugger.sendCommand("Page.captureScreenshot", {
          format: "png",
          fromSurface: true,
          captureBeyondViewport: true,
        });
        fs.writeFileSync(
          path.join(SCREENSHOT_ROOT, `${slugFor(item.route)}-${mode.name}.png`),
          Buffer.from(shot.data, "base64"),
        );
      }
    }
  }

  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    engine: process.versions.chrome,
    status: allFindings.length === 0 ? "pass" : "fail",
    routeCount: routes.length,
    checkCount: results.length,
    screenshotCount: screenshotRoutes.size * modes.length,
    groups,
    results,
    findings: allFindings,
  };
  fs.writeFileSync(path.join(REPORT_ROOT, "browser-audit.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ status: report.status, routes: report.routeCount, checks: report.checkCount, screenshots: report.screenshotCount, findings: allFindings }, null, 2));

  window.webContents.debugger.detach();
  window.destroy();
  server.close();
  app.exit(allFindings.length === 0 ? 0 : 1);
}).catch((error) => {
  console.error(error);
  server.close();
  app.exit(1);
});

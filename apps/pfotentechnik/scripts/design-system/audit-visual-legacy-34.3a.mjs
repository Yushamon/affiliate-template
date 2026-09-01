#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const previewUrl = process.env.PREVIEW_URL ?? "http://127.0.0.1:4330";
const cdpPort = process.env.CDP_PORT ?? "9227";
const reportRoot = path.resolve("reports/visual-legacy-audit-34.3a");
const screenshotRoot = path.join(reportRoot, "screenshots");

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
const routes = Object.entries(groups).flatMap(([group, values]) => values.map((route) => ({ route, group })));
const modes = [
  { name: "375-light", width: 375, height: 812, theme: "light" },
  { name: "375-dark", width: 375, height: 812, theme: "dark" },
  { name: "1600-light", width: 1600, height: 1000, theme: "light" },
  { name: "1600-dark", width: 1600, height: 1000, theme: "dark" },
];
const screenshotRoutes = new Set(["/impressum/", "/redaktion/", "/futterautomat-berater/"]);
const slugFor = (route) => route.replace(/^\/+|\/+$/g, "").replaceAll("/", "--");

fs.mkdirSync(screenshotRoot, { recursive: true });
const targets = await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json();
const target = targets.find((entry) => entry.type === "page");
if (!target) throw new Error("No CDP page target available.");
const socket = new WebSocket(target.webSocketDebuggerUrl);
const pending = new Map();
let requestId = 0;
socket.onmessage = ({ data }) => {
  const message = JSON.parse(data);
  const request = pending.get(message.id);
  if (!request) return;
  pending.delete(message.id);
  message.error ? request.reject(new Error(`${request.method}: ${message.error.message}`)) : request.resolve(message.result);
};
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++requestId;
  pending.set(id, { method, resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});
const evaluate = async (expression, awaitPromise = false) => {
  const result = await send("Runtime.evaluate", { expression, awaitPromise, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
  return result.result?.value;
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const setMode = async (mode) => {
  await send("Emulation.setDeviceMetricsOverride", {
    width: mode.width,
    height: mode.height,
    deviceScaleFactor: 1,
    mobile: mode.width < 768,
  });
  await send("Emulation.setEmulatedMedia", {
    media: "",
    features: [{ name: "prefers-color-scheme", value: mode.theme }],
  });
};
const navigate = async (route, theme) => {
  await send("Page.navigate", { url: `${previewUrl}${route}` });
  await sleep(350);
  await evaluate(`(async () => {
    document.documentElement.dataset.theme = ${JSON.stringify(theme)};
    document.documentElement.classList.toggle('dark', ${theme === "dark"});
    document.documentElement.classList.toggle('light', ${theme === "light"});
    await Promise.all([
      document.fonts?.ready,
      ...[...document.images].map(async image => { image.loading = 'eager'; try { await image.decode(); } catch {} })
    ]);
    scrollTo(0, 0);
    await new Promise(resolve => setTimeout(resolve, 80));
  })()`, true);
};

const inspectExpression = `(() => {
  const root = document.documentElement;
  const body = document.body;
  const visible = element => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
  };
  const tokenColor = name => {
    const sample = document.createElement('span');
    sample.style.cssText = 'position:fixed;left:-9999px;background:var(' + name + ')';
    body.append(sample);
    const color = getComputedStyle(sample).backgroundColor;
    sample.remove();
    return color;
  };
  const tokenLength = name => {
    const sample = document.createElement('span');
    sample.style.cssText = 'position:fixed;left:-9999px;width:var(' + name + ')';
    body.append(sample);
    const width = sample.getBoundingClientRect().width;
    sample.remove();
    return width;
  };
  const surfaceColors = [
    '--pt-color-page', '--pt-color-surface', '--pt-color-surface-soft', '--pt-color-surface-raised',
    '--pt-theme-bg', '--pt-theme-surface', '--pt-theme-surface-2', '--pt-theme-surface-3',
    '--pt33-color-page', '--pt33-color-surface', '--pt33-color-surface-subtle', '--pt33-color-surface-raised'
  ].map(tokenColor);
  const bodyBackground = getComputedStyle(body).backgroundColor;
  const htmlBackground = getComputedStyle(root).backgroundColor;
  const legacyDarkColors = new Set(['rgb(16, 31, 50)', 'rgb(23, 39, 61)', 'rgb(19, 34, 56)', 'rgb(15, 29, 48)']);
  const whiteSurfaces = [];
  const legacyDarkSurfaces = [];
  if (root.dataset.theme === 'dark') {
    for (const element of document.querySelectorAll('body *')) {
      if (!visible(element) || /^(IMG|PICTURE|VIDEO|SVG|PATH)$/.test(element.tagName) || element.closest('[data-pt-mode="light"]')) continue;
      const rect = element.getBoundingClientRect();
      if (rect.width * rect.height < 900) continue;
      const background = getComputedStyle(element).backgroundColor;
      if (background === 'rgb(255, 255, 255)') whiteSurfaces.push(element.className || element.tagName.toLowerCase());
      if (legacyDarkColors.has(background)) legacyDarkSurfaces.push(element.className || element.tagName.toLowerCase());
    }
  }
  const focusTarget = [...document.querySelectorAll('main a[href], main button:not([disabled]), main input:not([disabled])')].find(visible);
  let focusVisible = true;
  if (focusTarget instanceof HTMLElement) {
    focusTarget.focus({ preventScroll: true });
    const style = getComputedStyle(focusTarget);
    focusVisible = style.outlineStyle !== 'none' || style.boxShadow !== 'none';
  }
  const legal = document.querySelector('.pt-legal-page');
  const overflowElements = [...document.querySelectorAll('body *')].filter(element => {
    if (!visible(element)) return false;
    const rect = element.getBoundingClientRect();
    return element.scrollWidth > element.clientWidth + 1 || rect.right > root.clientWidth + 1 || rect.left < -1;
  }).slice(0, 12).map(element => ({
    tag: element.tagName,
    className: typeof element.className === 'string' ? element.className : '',
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
    text: element.textContent?.replace(/\\s+/g, ' ').trim().slice(0, 90) ?? ''
  }));
  return {
    title: document.title,
    h1Count: document.querySelectorAll('h1').length,
    foundation: root.hasAttribute('data-pt-foundation') && body.hasAttribute('data-pt-foundation'),
    header: Boolean(document.querySelector('header.site-header-v2')),
    footer: Boolean(document.querySelector('footer')),
    clientWidth: root.clientWidth,
    scrollWidth: root.scrollWidth,
    horizontalOverflow: Math.max(0, root.scrollWidth - root.clientWidth),
    bodyBackground,
    htmlBackground,
    foundationPageBackground: surfaceColors.includes(bodyBackground) || surfaceColors.includes(htmlBackground),
    bodyColor: getComputedStyle(body).color,
    brokenImages: [...document.images].filter(image => image.complete && image.naturalWidth === 0 && image.alt !== 'Vergrößerte Bildansicht').length,
    whiteSurfaces: [...new Set(whiteSurfaces)].slice(0, 12),
    legacyDarkSurfaces: [...new Set(legacyDarkSurfaces)].slice(0, 12),
    focusVisible,
    legalWidth: legal ? Math.round(legal.getBoundingClientRect().width) : null,
    legalMaxWidth: Math.round(tokenLength('--pt-content-narrow')),
    overflowElements,
    documentHeight: Math.ceil(Math.max(body.scrollHeight, root.scrollHeight)),
  };
})()`;

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
  if (group === "legalUtility" && metrics.legalWidth !== null && metrics.legalWidth > metrics.legalMaxWidth + 1) add("READING_AXIS_TOO_WIDE", `${metrics.legalWidth}px legal reading axis; token max ${metrics.legalMaxWidth}px.`);
  return findings;
};

const results = [];
const allFindings = [];
for (const item of routes) {
  for (const mode of modes) {
    await setMode(mode);
    await navigate(item.route, mode.theme);
    const metrics = await evaluate(inspectExpression);
    const findings = findingsFor(item, mode, metrics);
    results.push({ ...item, mode: mode.name, theme: mode.theme, viewport: { width: mode.width, height: mode.height }, metrics, findings });
    allFindings.push(...findings);

    if (screenshotRoutes.has(item.route)) {
      const layout = await send("Page.getLayoutMetrics");
      const size = layout.cssContentSize;
      const shot = await send("Page.captureScreenshot", {
        format: "png",
        captureBeyondViewport: true,
        clip: { x: 0, y: 0, width: size.width, height: size.height, scale: 1 },
      });
      fs.writeFileSync(path.join(screenshotRoot, `${slugFor(item.route)}-${mode.name}.png`), Buffer.from(shot.data, "base64"));
    }
  }
}

const screenshots = fs.readdirSync(screenshotRoot).filter((file) => file.endsWith(".png")).sort();
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  status: allFindings.length === 0 ? "pass" : "fail",
  routeCount: routes.length,
  checkCount: results.length,
  screenshotCount: screenshots.length,
  groups,
  screenshots,
  results,
  findings: allFindings,
};
fs.writeFileSync(path.join(reportRoot, "browser-audit.json"), `${JSON.stringify(report, null, 2)}\n`);
socket.close();
console.log(JSON.stringify({ status: report.status, routes: report.routeCount, checks: report.checkCount, screenshots: report.screenshotCount, findings: allFindings }, null, 2));
if (screenshots.length !== 12) process.exitCode = 1;
if (allFindings.length) process.exitCode = 1;

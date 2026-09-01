#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const previewUrl = process.env.PREVIEW_URL ?? "http://127.0.0.1:4326";
const cdpPort = process.env.CDP_PORT ?? "9227";
const reportRoot = path.resolve("reports/production-cleanup-34.4");
const routes = [
  { route: "/", type: "Homepage" },
  { route: "/produkt/furbo-mini-360/", type: "Product" },
  { route: "/vergleiche/beste-futterautomaten-fuer-katzen/", type: "Comparison" },
  { route: "/smarte-futterautomaten/", type: "Category" },
  { route: "/hersteller/petkit/", type: "Manufacturer" },
  { route: "/futterautomat-richtig-reinigen/", type: "Guide" },
  { route: "/wissen/", type: "Secondary hub" },
  { route: "/impressum/", type: "Legal" },
  { route: "/futterautomat-berater/", type: "Utility" },
];
const modes = [
  { name: "375-light", width: 375, height: 812, theme: "light" },
  { name: "375-dark", width: 375, height: 812, theme: "dark" },
  { name: "1600-light", width: 1600, height: 1000, theme: "light" },
  { name: "1600-dark", width: 1600, height: 1000, theme: "dark" },
];

fs.mkdirSync(reportRoot, { recursive: true });
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
  message.error
    ? request.reject(new Error(`${request.method}: ${message.error.message}`))
    : request.resolve(message.result);
};
await new Promise((resolve, reject) => {
  socket.onopen = resolve;
  socket.onerror = reject;
});
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

const inspect = `(() => {
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
    const value = getComputedStyle(sample).backgroundColor;
    sample.remove();
    return value;
  };
  const backgrounds = [
    '--pt-color-page', '--pt-color-surface', '--pt-color-surface-soft', '--pt-color-surface-raised'
  ].map(tokenColor);
  const bodyBackground = getComputedStyle(body).backgroundColor;
  const htmlBackground = getComputedStyle(root).backgroundColor;
  const whiteSurfaces = [];
  if (root.dataset.theme === 'dark') {
    for (const element of document.querySelectorAll('main *')) {
      if (!visible(element) || /^(IMG|PICTURE|VIDEO|SVG|PATH)$/.test(element.tagName)) continue;
      const rect = element.getBoundingClientRect();
      if (rect.width * rect.height < 1200) continue;
      if (getComputedStyle(element).backgroundColor === 'rgb(255, 255, 255)') {
        whiteSurfaces.push(typeof element.className === 'string' ? element.className : element.tagName);
      }
    }
  }
  const guideMain = document.querySelector('#guide-main');
  const guideArticle = guideMain?.querySelector('article');
  const guideDetailsAncestor = guideArticle?.closest('details');
  const firstGuideHeading = guideArticle?.querySelector('h2, h3');
  return {
    title: document.title,
    foundation: root.hasAttribute('data-pt-foundation') && body.hasAttribute('data-pt-foundation'),
    header: Boolean(document.querySelector('header.site-header-v2')),
    footer: Boolean(document.querySelector('footer')),
    h1Count: document.querySelectorAll('h1').length,
    clientWidth: root.clientWidth,
    scrollWidth: root.scrollWidth,
    horizontalOverflow: Math.max(0, root.scrollWidth - root.clientWidth),
    bodyBackground,
    htmlBackground,
    foundationBackground: backgrounds.includes(bodyBackground) || backgrounds.includes(htmlBackground),
    brokenImages: [...document.images].filter(image => image.complete && image.naturalWidth === 0 && image.alt !== 'Vergrößerte Bildansicht').length,
    whiteSurfaces: [...new Set(whiteSurfaces)].slice(0, 12),
    productMiniCount: document.querySelectorAll('.pt-product-mini').length,
    disclosureCount: document.querySelectorAll('.pt-disclosure').length,
    guide: guideMain ? {
      visible: visible(guideMain) && Boolean(guideArticle && visible(guideArticle)),
      inDetails: Boolean(guideDetailsAncestor),
      gatePresent: /Vollständigen Ratgeber(?: mit Praxisdetails)? öffnen/i.test(body.textContent ?? ''),
      internalPolicyPresent: /Nur wenn es die Frage beantwortet|eingebetteter Katalog/i.test(body.textContent ?? ''),
      firstHeading: firstGuideHeading?.textContent?.trim() ?? null,
    } : null,
  };
})()`;

const results = [];
const findings = [];
for (const item of routes) {
  for (const mode of modes) {
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
    await send("Page.navigate", { url: `${previewUrl}${item.route}` });
    await sleep(250);
    await evaluate(`(async () => {
      document.documentElement.dataset.theme = ${JSON.stringify(mode.theme)};
      document.documentElement.classList.toggle('dark', ${mode.theme === "dark"});
      document.documentElement.classList.toggle('light', ${mode.theme === "light"});
      await Promise.all([document.fonts?.ready, ...[...document.images].map(async image => {
        image.loading = 'eager';
        try { await image.decode(); } catch {}
      })]);
      scrollTo(0, 0);
    })()`, true);
    const metrics = await evaluate(inspect);
    const current = [];
    const add = (code, detail) => current.push({ code, detail });
    if (!metrics.foundation) add("FOUNDATION_MISSING", "html/body marker missing");
    if (!metrics.header || !metrics.footer) add("SHELL_INCOMPLETE", "shared header/footer missing");
    if (metrics.h1Count !== 1) add("HEADING_INVALID", `found ${metrics.h1Count} H1 elements`);
    if (metrics.horizontalOverflow > 1) add("HORIZONTAL_OVERFLOW", `${metrics.horizontalOverflow}px`);
    if (!metrics.foundationBackground) add("PAGE_BACKGROUND_NON_SEMANTIC", `${metrics.bodyBackground} / ${metrics.htmlBackground}`);
    if (metrics.brokenImages) add("BROKEN_MEDIA", `${metrics.brokenImages} image(s)`);
    if (mode.theme === "dark" && metrics.whiteSurfaces.length) add("WHITE_SURFACE_IN_DARK", metrics.whiteSurfaces.join(", "));
    if (item.type === "Guide") {
      if (!metrics.guide?.visible) add("GUIDE_PRIMARY_HIDDEN", "#guide-main article is not visible");
      if (metrics.guide?.inDetails) add("GUIDE_PRIMARY_DISCLOSURE", "primary article is inside details");
      if (metrics.guide?.gatePresent) add("GUIDE_GATE_PRESENT", "reader-facing gate copy found");
      if (metrics.guide?.internalPolicyPresent) add("GUIDE_POLICY_COPY", "internal editorial language found");
    }
    results.push({ ...item, mode: mode.name, viewport: { width: mode.width, height: mode.height }, metrics, findings: current });
    findings.push(...current.map((finding) => ({ route: item.route, mode: mode.name, ...finding })));
  }
}

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  status: findings.length ? "fail" : "pass",
  routeCount: routes.length,
  checkCount: results.length,
  results,
  findings,
};
fs.writeFileSync(path.join(reportRoot, "browser-audit.json"), `${JSON.stringify(report, null, 2)}\n`);
socket.close();
console.log(JSON.stringify({ status: report.status, routes: report.routeCount, checks: report.checkCount, findings }, null, 2));
if (findings.length) process.exitCode = 1;

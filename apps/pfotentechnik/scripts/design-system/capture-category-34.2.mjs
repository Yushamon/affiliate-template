#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const preview = process.env.PREVIEW_URL ?? "http://127.0.0.1:4321";
const port = process.env.CDP_PORT ?? "9226";
const captureFinal = process.env.CAPTURE_FINAL === "1";
const routes = [
  "/smarte-futterautomaten/",
  "/trinkbrunnen/",
  "/gps-tracker/",
  "/katzenklappen/",
  "/haustierkameras/",
  "/automatische-katzentoiletten/"
];
const widths = [320, 375, 430, 768, 820, 1024, 1280, 1440, 1600];
const themes = ["light", "dark"];
const reportPath = path.resolve("reports/category-experience-34.2/browser-qa.json");
const finalDir = path.resolve("reports/design-system/category-34.2/final");
const timeoutMs = 60_000;

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
if (captureFinal) fs.mkdirSync(finalDir, { recursive: true });

const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const target = targets.find((entry) => entry.type === "page");
if (!target) throw new Error("No CDP page target available");

const socket = new WebSocket(target.webSocketDebuggerUrl);
const pending = new Map();
let requestId = 0;
const timeout = (promise, label) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error(`QA timeout: ${label}`)), timeoutMs))
]);
socket.onmessage = ({ data }) => {
  const message = JSON.parse(data);
  const request = pending.get(message.id);
  if (!request) return;
  pending.delete(message.id);
  if (message.error) request.reject(new Error(`${message.error.message} (${request.method})`));
  else request.resolve(message);
};
await timeout(new Promise((resolve, reject) => {
  socket.onopen = resolve;
  socket.onerror = reject;
}), "CDP connection");
const send = (method, params = {}) => timeout(new Promise((resolve, reject) => {
  const id = ++requestId;
  pending.set(id, { method, resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
}), method);
const evaluate = async (expression, awaitPromise = false) => {
  const response = await send("Runtime.evaluate", { expression, awaitPromise, returnByValue: true });
  if (response.result?.exceptionDetails) throw new Error(response.result.exceptionDetails.text ?? "Runtime.evaluate failed");
  return response.result?.result?.value;
};
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const capture = async (name) => {
  await evaluate("scrollTo(0, 0)");
  const response = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
  fs.writeFileSync(path.join(finalDir, name), Buffer.from(response.result.data, "base64"));
};

await send("Page.enable");
await send("Runtime.enable");
const report = [];

for (const route of routes) {
  for (const width of widths) {
    for (const theme of themes) {
      await send("Emulation.setDeviceMetricsOverride", {
        width,
        height: width <= 430 ? 844 : 1000,
        deviceScaleFactor: 1,
        mobile: width <= 430
      });
      await send("Emulation.setEmulatedMedia", {
        media: "",
        features: [{ name: "prefers-color-scheme", value: theme }]
      });
      await send("Page.navigate", { url: `${preview}${route}` });
      await wait(500);
      await evaluate(`[...document.querySelectorAll('.pt-category-hub img')].forEach((image) => { image.loading = 'eager'; })`);
      for (let attempt = 0; attempt < 24; attempt += 1) {
        const imagesReady = await evaluate(`[...document.querySelectorAll('.pt-category-hub img')].every((image) => image.complete && image.naturalWidth > 0 && image.naturalHeight > 0)`);
        if (imagesReady) break;
        await wait(250);
      }

      const qa = JSON.parse(await evaluate(`JSON.stringify((() => {
        const rect = (element) => {
          const value = element?.getBoundingClientRect();
          return value ? { left: value.left, top: value.top, right: value.right, bottom: value.bottom, width: value.width, height: value.height } : null;
        };
        const visible = (element) => Boolean(element && element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden');
        const intersects = (a, b) => Boolean(a && b && a.width > 0 && b.width > 0 && a.left < b.right - .5 && a.right > b.left + .5 && a.top < b.bottom - .5 && a.bottom > b.top + .5);
        const insideViewport = (element) => {
          const value = rect(element);
          return value && value.left >= -.5 && value.right <= document.documentElement.clientWidth + .5;
        };
        const sections = [...document.querySelectorAll('.pt-category-hub > header, .pt-category-hub > section')];
        const products = [...document.querySelectorAll('.pt-category-hub__product')].map((product) => {
          const media = rect(product.querySelector('.pt-category-hub__product-media, .pt-category-hub__product-fallback'));
          const copy = rect(product.querySelector('.pt-category-hub__product-copy'));
          const decision = rect(product.querySelector('.pt-category-hub__product-decision'));
          const score = rect(product.querySelector('.pt-score'));
          const price = rect(product.querySelector('.pt-category-hub__product-decision > p'));
          return { card: rect(product), media, copy, decision, score, price, overlap: intersects(media, copy) || intersects(copy, decision) || intersects(score, price) };
        });
        const interactive = [...document.querySelectorAll('.pt-category-hub__path-list > a, .pt-category-hub__comparison-list > a, .pt-category-hub__product-media, .pt-category-hub__product-decision > a, .pt-category-hub__guide-list > a, .pt-category-hub__trust-links a, .pt-category-hub__depth > summary, .pt-category-hub__closing > a')].filter(visible);
        const images = [...document.querySelectorAll('.pt-category-hub img')].filter(visible);
        const surfaces = [...document.querySelectorAll('.pt-category-hub__path-list, .pt-category-hub__products, .pt-category-hub__depth, .pt-category-hub__depth > summary, .pt-category-hub__closing')].map((element) => ({ className: element.className, background: getComputedStyle(element).backgroundColor }));
        const focusTarget = document.querySelector('.pt-category-hub__closing > a');
        focusTarget?.focus();
        const focusStyle = focusTarget ? getComputedStyle(focusTarget) : null;
        return {
          route: location.pathname,
          dark: matchMedia('(prefers-color-scheme: dark)').matches,
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
          scrollHeight: document.documentElement.scrollHeight,
          h1Count: document.querySelectorAll('h1').length,
          requirementCount: document.querySelectorAll('.pt-category-hub__requirement-list > li').length,
          pathCount: document.querySelectorAll('.pt-category-hub__path-list > a').length,
          comparisonCount: document.querySelectorAll('.pt-category-hub__comparison-list > a').length,
          productCount: products.length,
          guideCount: document.querySelectorAll('.pt-category-hub__guide-list > a').length,
          evidenceCount: document.querySelectorAll('.pt-category-hub__reading > section').length,
          sectionsOrdered: sections.every((section, index) => index === 0 || section.getBoundingClientRect().top >= sections[index - 1].getBoundingClientRect().bottom - .5),
          headingsInside: [...document.querySelectorAll('.pt-category-hub h1, .pt-category-hub h2, .pt-category-hub h3')].filter(visible).every(insideViewport),
          interactiveMinHeight: Math.min(...interactive.map((element) => rect(element)?.height ?? 0)),
          interactiveInside: interactive.every(insideViewport),
          imagesReady: images.every((image) => image.complete && image.naturalWidth > 0 && image.naturalHeight > 0 && insideViewport(image)),
          products,
          whiteSurfaceInDark: ${JSON.stringify(theme)} === 'dark' && surfaces.some((surface) => surface.background === 'rgb(255, 255, 255)' || surface.background === 'rgba(255, 255, 255, 1)'),
          focusVisible: document.activeElement === focusTarget && focusStyle && (focusStyle.outlineStyle !== 'none' || focusStyle.boxShadow !== 'none'),
          detailsSemantic: document.querySelector('.pt-category-hub__depth') instanceof HTMLDetailsElement && document.querySelector('.pt-category-hub__depth > summary') instanceof HTMLElement,
          scoreLabels: [...document.querySelectorAll('.pt-category-hub__product .pt-score')].every((score) => score.getAttribute('aria-label')?.includes('von 100')),
          footerBackground: getComputedStyle(document.querySelector('footer')).backgroundColor
        };
      })())`));

      const pass = qa.route === route && qa.dark === (theme === "dark") &&
        qa.clientWidth === qa.scrollWidth && qa.h1Count === 1 && qa.requirementCount === 6 &&
        qa.pathCount >= 3 && qa.pathCount <= 6 && qa.comparisonCount >= 1 && qa.comparisonCount <= 4 &&
        qa.productCount >= 3 && qa.productCount <= 6 && qa.guideCount >= 1 && qa.guideCount <= 5 &&
        qa.evidenceCount >= 3 && qa.evidenceCount <= 5 && qa.sectionsOrdered && qa.headingsInside &&
        qa.interactiveMinHeight >= 43.5 && qa.interactiveInside && qa.imagesReady &&
        qa.products.every((product) => product.card && product.media && product.copy && product.decision && product.score && !product.overlap) &&
        !qa.whiteSurfaceInDark && qa.focusVisible && qa.detailsSemantic && qa.scoreLabels;

      report.push({ route, width, theme, pass, ...qa });
      if (!pass) throw new Error(`Category 34.2 QA failed ${route} ${width}/${theme}: ${JSON.stringify(qa)}`);
      console.log(`PASS ${route} ${width}/${theme}`);

      if (captureFinal && route === "/smarte-futterautomaten/" && (width === 375 || width === 1600)) {
        await capture(`category-futterautomaten-${width}-${theme}-full.png`);
      }
    }
  }
}

const finalScreenshots = captureFinal
  ? fs.readdirSync(finalDir).filter((file) => file.endsWith(".png")).sort()
  : [];
if (captureFinal && finalScreenshots.length !== 4) {
  throw new Error(`Expected exactly four final PNGs, found ${finalScreenshots.length}: ${finalScreenshots.join(", ")}`);
}
fs.writeFileSync(reportPath, `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  preview,
  cases: report.length,
  routes,
  widths,
  themes,
  finalScreenshots,
  report
}, null, 2)}\n`);
socket.close();
console.log(`Category 34.2 browser QA passed: ${report.length} cases`);
console.log(`Report: ${reportPath}`);

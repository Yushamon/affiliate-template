#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const route = "/vergleiche/beste-futterautomaten-mit-kamera/";
const output = path.resolve("reports/design-system/reference-comparison-33.1.0/after");
const timeoutMs = 12_000;
const cdpPort = process.env.CDP_PORT ?? "9222";
const previewUrl = process.env.PREVIEW_URL ?? "http://127.0.0.1:4321";
const step = (name) => console.log(`[qa] ${name}`);
const withTimeout = (promise, name) => Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error(`QA timeout: ${name}`)), timeoutMs))]);
step("browser connect");
const pages = await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json();
const page = pages.find((item) => item.type === "page" && item.url.includes(route)) ?? pages.find((item) => item.type === "page");
if (!page) throw new Error("Keine CDP-Browserseite verfügbar.");
const socket = new WebSocket(page.webSocketDebuggerUrl);
const waiting = new Map(); let id = 0;
socket.onmessage = ({ data }) => { const message = JSON.parse(data); if (message.id) console.log(`[qa] response ${message.id}`); const done = waiting.get(message.id); if (done) { waiting.delete(message.id); done.resolve(message); } };
socket.onclose = () => { for (const pending of waiting.values()) pending.reject(new Error("QA CDP socket closed")); waiting.clear(); };
await withTimeout(new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; }), "browser connect");
const send = (method, params = {}) => withTimeout(new Promise((resolve, reject) => { const requestId = ++id; console.log(`[qa] request ${requestId} ${method}`); waiting.set(requestId, { resolve, reject }); socket.send(JSON.stringify({ id: requestId, method, params })); }), method);
const evaluate = async (expression, awaitPromise = false) => { const response = await send("Runtime.evaluate", { expression, awaitPromise, returnByValue: true }); if (response.result.exceptionDetails) throw new Error(response.result.exceptionDetails.text); return response.result.result.value; };
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
step("navigation start"); await send("Page.navigate", { url: `${previewUrl}${route}` });
await sleep(700);
step("navigation complete");

const requested = new Set((process.env.CAPTURE_VIEWPORTS ?? "").split(",").filter(Boolean).map(Number));
const themes = (process.env.CAPTURE_THEMES ?? "light,dark").split(",").filter(Boolean);
const captureScreenshots = process.env.CAPTURE_SCREENSHOTS !== "0";
const viewports = [[320, 844], [375, 844], [430, 844], [768, 1024], [820, 1024], [1024, 960], [1280, 960], [1440, 960], [1600, 1000]].filter(([width]) => !requested.size || requested.has(width));
const crops = { hero: ".rc33__hero", "20-seconds": ".rc33__fast", difference: ".rc33__difference", "personal-fit": ".rc33__fit", scenarios: ".rc33__scenarios", "only-differences": ".rc33__differences", community: ".comparison-content", "final-decision": ".rc33__final", sources: ".editorial-transparency", footer: "footer" };
const geometrySelectors = [".pt-page--reference-comparison33", ".rc33", ".rc33__hero", ".rc33__stage", ".rc33__fast", ".rc33__difference", ".rc33__fit", ".rc33__scenarios", ".rc33__alternatives", ".rc33__differences", ".comparison-content", ".rc33__final", ".editorial-transparency", ".decision-next-steps", "footer"];
fs.mkdirSync(output, { recursive: true });
const reportPath = path.join(output, "theme-emulation-gate.json");
const previousReport = fs.existsSync(reportPath) ? JSON.parse(fs.readFileSync(reportPath, "utf8")) : [];
const report = previousReport.filter((entry) => !viewports.some(([width]) => entry.width === width));

async function capture(name, selector) {
  let clip;
  if (selector) {
    clip = JSON.parse(await evaluate(`JSON.stringify((() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) throw new Error("Missing crop: ${selector}"); const r = el.getBoundingClientRect(); return { x: 0, y: Math.max(0, r.top + scrollY - 16), width: innerWidth, height: Math.min(Math.max(r.height + 32, innerHeight), 2200), scale: 1 }; })())`));
  }
  const image = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, ...(clip ? { clip } : {}) });
  fs.writeFileSync(path.join(output, `${name}.png`), Buffer.from(image.result.data, "base64"));
}

for (const [width, height] of viewports) for (const theme of themes) {
  step(`${width}px ${theme}: theme setup`);
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 768 });
  await send("Emulation.setEmulatedMedia", { media: "", features: [{ name: "prefers-color-scheme", value: theme }] });
  await send("Page.reload", { ignoreCache: true }); await sleep(700);
  step(`${width}px ${theme}: closed explorer check`); await evaluate(`(() => { const details = document.querySelector('.rc33__fit .rc33__explorer'); if (!(details instanceof HTMLDetailsElement)) throw new Error('Missing reference explorer details'); details.open = false; })()`);
  await evaluate(`(() => { for (const image of document.querySelectorAll('.rc33__product img, .rc33__alternatives img')) { image.loading = 'eager'; image.scrollIntoView({ block: 'center' }); } })()`);
  // Fullpage capture can rasterize a decoded-but-offscreen image as a blank
  // tile. Wait for every selected/alternative image to decode before capture.
  await evaluate(`Promise.all([...document.querySelectorAll('.rc33__product img, .rc33__alternatives img')].map((image) => image.decode ? image.decode().catch(() => undefined) : Promise.resolve()))`, true);
  await sleep(700);
  const gate = JSON.parse(await evaluate(`JSON.stringify((() => { const details = document.querySelector('.rc33__fit .rc33__explorer'); const explorer = details?.querySelector('.comparison-lab'); const clientWidth = document.documentElement.clientWidth; const scrollWidth = document.documentElement.scrollWidth; const describe = (el) => { const table = el.closest('table'); const rect = table?.getBoundingClientRect(); return { tag: el.tagName, className: el.className, right: el.getBoundingClientRect().right, parent: el.parentElement?.className, section: el.closest('section, article')?.className, table: table ? { left: rect.left, right: rect.right, width: rect.width, scrollWidth: table.scrollWidth, clientWidth: table.clientWidth, display: getComputedStyle(table).display } : null }; }; const productNames = [...document.querySelectorAll('.rc33__product h2, .rc33__alternatives h3')].map((el) => el.textContent?.trim()); const explorerProducts = [...document.querySelectorAll('.comparison-lab [data-product-picker]')].map((input) => input.value); return { dark: matchMedia('(prefers-color-scheme: dark)').matches, background: getComputedStyle(document.body).backgroundColor, clientWidth, scrollWidth, overflow: scrollWidth === clientWidth, detailsOpen: details?.open, explorerDisplay: explorer ? getComputedStyle(explorer).display : null, productNames, explorerProducts, offenders: [...document.querySelectorAll('*')].filter((el) => el.getBoundingClientRect().right > clientWidth + 1).slice(0, 8).map(describe), scrollContainers: [...document.querySelectorAll('*')].filter((el) => el.scrollWidth > el.clientWidth + 1).slice(0, 12).map((el) => ({ tag: el.tagName, className: el.className, scrollWidth: el.scrollWidth, clientWidth: el.clientWidth, overflowX: getComputedStyle(el).overflowX })), edgeElements: [...document.querySelectorAll('*')].filter((el) => { const right = el.getBoundingClientRect().right; return right >= scrollWidth - 1 && right <= scrollWidth + 1; }).slice(0, 8).map(describe), images: [...document.querySelectorAll('.rc33__product img, .rc33__alternatives img')].map((image) => { const rect = image.getBoundingClientRect(); return { src: image.currentSrc || image.src, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight, complete: image.complete, rect: { width: rect.width, height: rect.height } }; }) }; })())`));
  const requiredProducts = ['petlibro-granary-camera-feeder', 'petkit-yumshare-dual-hopper', 'petkit-yumshare-solo-2'];
  const requiredNames = ['PETLIBRO Granary Camera Feeder', 'PETKIT YumShare Dual-Hopper 2', 'PETKIT YumShare Solo 2'];
  if (gate.dark !== (theme === "dark") || !gate.overflow || gate.images.length < 3 || gate.images.some((image) => !image.complete || !image.naturalWidth || !image.naturalHeight) || requiredNames.some((name) => !gate.productNames.includes(name)) || requiredProducts.some((product) => !gate.explorerProducts.includes(product))) throw new Error(`QA gate failed at ${width}px ${theme}: ${JSON.stringify(gate)}`);
  if (width <= 430) {
    step(`${width}px ${theme}: open explorer and drawer check`);
    const interaction = JSON.parse(await evaluate(`JSON.stringify((() => { const geometry = () => ({ clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth, overflow: document.documentElement.scrollWidth === document.documentElement.clientWidth }); const details = document.querySelector('.rc33__fit .rc33__explorer'); const summary = details?.querySelector('summary'); const initiallyClosed = details?.open === false; summary?.focus(); summary?.click(); const opened = details?.open === true; const open = geometry(); const drawerButton = details?.querySelector('[data-filter-open]'); drawerButton?.click(); const drawerElement = details?.querySelector('[data-filter-drawer]'); const drawerOpen = drawerElement?.classList.contains('is-open'); const drawer = geometry(); drawerElement?.querySelector('[data-filter-close]')?.click(); summary?.click(); const closedAgain = details?.open === false; const closed = geometry(); return { initiallyClosed, opened, open, drawerOpen, drawer, closedAgain, closed, summaryFocused: document.activeElement === summary }; })())`));
    if (!interaction.initiallyClosed || !interaction.opened || !interaction.drawerOpen || !interaction.closedAgain || !interaction.open.overflow || !interaction.drawer.overflow || !interaction.closed.overflow || !interaction.summaryFocused) throw new Error(`Explorer interaction gate failed at ${width}px ${theme}: ${JSON.stringify(interaction)}`);
    gate.interaction = interaction;
  }
  if (captureScreenshots) {
    step(`${width}px ${theme}: screenshot`);
    await capture(`reference-comparison-${width}-${theme}-full`);
    if ([430, 1440].includes(width)) for (const [name, selector] of Object.entries(crops)) await capture(`reference-comparison-${width}-${theme}-${name}`, selector);
  }
  gate.geometry = JSON.parse(await evaluate(`JSON.stringify(${JSON.stringify(geometrySelectors)}.map((selector) => { const element = document.querySelector(selector); if (!element) return { selector, missing: true }; const rect = element.getBoundingClientRect(); const style = getComputedStyle(element); const parent = element.parentElement; return { selector, parent: parent?.className || parent?.tagName, left: rect.left, right: rect.right, width: rect.width, paddingLeft: style.paddingLeft, paddingRight: style.paddingRight, marginLeft: style.marginLeft, marginRight: style.marginRight, maxWidth: style.maxWidth, boxSizing: style.boxSizing, parentWidth: parent?.getBoundingClientRect().width }; }))`));
  report.push({ width, theme, ...gate });
}
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");
socket.close();
step("browser close");
console.log(`Deterministische Reference-Comparison-Captures erstellt: ${output}`);

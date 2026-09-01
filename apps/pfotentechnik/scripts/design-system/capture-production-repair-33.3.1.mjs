#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const previewUrl = process.env.PREVIEW_URL ?? "http://127.0.0.1:4330";
const cdpPort = process.env.CDP_PORT ?? "9226";
const output = path.resolve("reports/production-repair-33.3.1/final");
const reportPath = path.resolve("reports/production-repair-33.3.1/browser-qa.json");
const timeoutMs = 15_000;
const productRoute = "/produkt/petsafe-petporte-smart-flap/";
const comparisonRoute = "/vergleiche/beste-mikrochip-katzenklappen/";
const viewports = [320, 375, 430, 768, 1024, 1600];
const themes = ["light", "dark"];

fs.mkdirSync(output, { recursive: true });
fs.mkdirSync(path.dirname(reportPath), { recursive: true });

const pages = await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json();
const page = pages.find((entry) => entry.type === "page");
if (!page) throw new Error("No CDP page target available.");

const socket = new WebSocket(page.webSocketDebuggerUrl);
const waiting = new Map();
let requestId = 0;
const timeout = (promise, label) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error(`QA timeout: ${label}`)), timeoutMs))
]);

socket.onmessage = ({ data }) => {
  const message = JSON.parse(data);
  const pending = waiting.get(message.id);
  if (!pending) return;
  waiting.delete(message.id);
  pending.resolve(message);
};
socket.onclose = () => {
  for (const pending of waiting.values()) pending.reject(new Error("CDP socket closed"));
  waiting.clear();
};
await timeout(new Promise((resolve, reject) => {
  socket.onopen = resolve;
  socket.onerror = reject;
}), "CDP connection");

const send = (method, params = {}) => timeout(new Promise((resolve, reject) => {
  const id = ++requestId;
  waiting.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
}), method);
const evaluate = async (expression, awaitPromise = false) => {
  const response = await send("Runtime.evaluate", { expression, awaitPromise, returnByValue: true });
  if (response.result?.exceptionDetails) throw new Error(response.result.exceptionDetails.text);
  return response.result?.result?.value;
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const navigate = async (route) => {
  await send("Page.navigate", { url: `${previewUrl}${route}` });
  await sleep(900);
  await evaluate("document.readyState");
};
const setViewport = async (width, theme) => {
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height: width < 768 ? 844 : 1000,
    deviceScaleFactor: 1,
    mobile: width < 768
  });
  await send("Emulation.setEmulatedMedia", {
    media: "",
    features: [{ name: "prefers-color-scheme", value: theme }]
  });
  await send("Page.reload", { ignoreCache: true });
  await sleep(750);
};
const prepareImages = () => evaluate(`Promise.all([...document.images].map(async (image) => {
  image.loading = 'eager';
  image.scrollIntoView({ block: 'center' });
  try { await image.decode?.(); } catch {}
}))`, true);
const screenshot = async (name) => {
  const data = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
  fs.writeFileSync(path.join(output, name), Buffer.from(data.result.data, "base64"));
};

const reports = [];
for (const width of viewports) for (const theme of themes) {
  await navigate(productRoute);
  await setViewport(width, theme);
  await prepareImages();
  const product = JSON.parse(await evaluate(`JSON.stringify((() => {
    const images = [...document.querySelectorAll('.alternatives__image img')];
    const fallback = [...document.querySelectorAll('.alternatives__image--fallback')];
    const imageState = images.map((image) => { const r = image.getBoundingClientRect(); return { src: image.currentSrc || image.src, complete: image.complete, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight, width: r.width, height: r.height }; });
    return { clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth, imageState, fallback: fallback.map((item) => item.getBoundingClientRect().height), scoreRings: document.querySelectorAll('.px2-hero .pt-score__ring, .alternatives .pt-score__ring').length };
  })())`));
  if (product.scrollWidth > product.clientWidth || product.imageState.some((image) => !image.complete || !image.naturalWidth || !image.naturalHeight || !image.width || !image.height) || product.fallback.some((height) => height > 150) || product.scoreRings < 2) throw new Error(`Product QA failed ${width}/${theme}: ${JSON.stringify(product)}`);
  if (width === 375) await screenshot(`product-petsafe-petporte-375-${theme}-full.png`);

  await navigate(comparisonRoute);
  await setViewport(width, theme);
  const interaction = JSON.parse(await evaluate(`JSON.stringify((() => {
    const details = document.querySelector('.rc33__fit .rc33__explorer');
    const summary = details?.querySelector('summary');
    if (!(details instanceof HTMLDetailsElement) || !(summary instanceof HTMLElement)) throw new Error('Explorer details missing');
    const initiallyClosed = !details.open;
    summary.focus(); summary.click();
    const opened = details.open;
    const picker = [...details.querySelectorAll('[data-product-picker]')];
    const count = details.querySelector('[data-selection-count]');
    const state = () => ({ selected: picker.filter((input) => input.checked).length, count: count?.textContent?.trim(), disabled: picker.filter((input) => input.disabled).length });
    picker.forEach((input) => { input.checked = false; input.dispatchEvent(new Event('change', { bubbles: true })); });
    const zero = state();
    picker[0].click(); const one = state();
    picker.slice(1, 4).forEach((input) => input.click()); const maximum = state();
    const fifthBefore = picker[4]?.checked ?? false; picker[4]?.click(); const maximumGuarded = !picker[4]?.checked && !fifthBefore;
    details.querySelector('[data-selection-reset]')?.click();
    const drawerButton = details.querySelector('[data-filter-open]'); drawerButton?.click();
    const drawer = details.querySelector('[data-filter-drawer]'); const drawerOpen = drawer?.classList.contains('is-open');
    drawer?.querySelector('[data-filter-close]')?.click();
    const focused = document.activeElement === summary;
    return { initiallyClosed, opened, focused, zero, one, maximum, maximumGuarded, drawerOpen };
  })())`));
  await prepareImages();
  const comparison = JSON.parse(await evaluate(`JSON.stringify((() => {
    const rect = (element) => { const r = element.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; };
    const intersects = (a, b) => a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;
    const cards = [...document.querySelectorAll('.comparison-pick-card')].filter((card) => !card.hidden).map((card) => {
      const control = card.querySelector('.comparison-pick-card__control'); const image = card.querySelector('.comparison-pick-card__media'); const identity = card.querySelector('[data-picker-identity]'); const score = card.querySelector('.comparison-pick-card__score'); const price = card.querySelector('.comparison-pick-card__price');
      const values = { card: rect(card), control: rect(control), image: rect(image), identity: rect(identity), score: rect(score), price: rect(price) };
      return { ...values, valid: [values.control, values.image, values.identity, values.score, values.price].every((item) => item.width > 0 && item.height > 0), overlap: intersects(values.control, values.image) || intersects(values.image, values.identity) || intersects(values.identity, values.score) || intersects(values.identity, values.price) || intersects(values.score, values.price) };
    });
    const images = [...document.querySelectorAll('.rc33__product img, .rc33__alternatives img, .comparison-pick-card__media img')].map((image) => { const r = image.getBoundingClientRect(); return { src: image.currentSrc || image.src, complete: image.complete, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight, width: r.width, height: r.height }; });
    return { clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth, cards, duplicateIndicators: document.querySelectorAll('.comparison-pick-card__check').length, scoreRings: document.querySelectorAll('.rc33 .pt-score__ring, .comparison-lab .pt-score__ring').length, images };
  })())`));
  if (!interaction.initiallyClosed || !interaction.opened || !interaction.focused || interaction.zero.count !== '0 von 4 gewählt' || interaction.one.count !== '1 von 4 gewählt' || interaction.maximum.count !== '4 von 4 gewählt' || !interaction.maximumGuarded || !interaction.drawerOpen) throw new Error(`Explorer interaction QA failed ${width}/${theme}: ${JSON.stringify(interaction)}`);
  if (comparison.scrollWidth > comparison.clientWidth || comparison.duplicateIndicators || comparison.cards.some((card) => !card.valid || card.overlap) || comparison.images.some((image) => !image.complete || !image.naturalWidth || !image.naturalHeight || !image.width || !image.height) || comparison.scoreRings < 6) throw new Error(`Comparison QA failed ${width}/${theme}: ${JSON.stringify(comparison)}`);
  reports.push({ width, theme, product, comparison, interaction });
  if (width === 375) await screenshot(`comparison-microchip-explorer-open-375-${theme}-full.png`);
}

fs.writeFileSync(reportPath, JSON.stringify(reports, null, 2) + "\n");
socket.close();
console.log(`Production Repair 33.3.1 browser QA passed: ${reportPath}`);

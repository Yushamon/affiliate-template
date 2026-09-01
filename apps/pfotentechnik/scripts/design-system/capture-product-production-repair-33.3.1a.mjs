#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const previewUrl = process.env.PREVIEW_URL ?? "http://127.0.0.1:4330";
const cdpPort = process.env.CDP_PORT ?? "9226";
const reportRoot = path.resolve("reports/product-production-repair-33.3.1a");
const finalRoot = path.join(reportRoot, "final");
const timeoutMs = 20_000;
const affectedRoute = "/produkt/neakasa-m1-lite/";
const widths = [320, 375, 430, 768, 1024, 1600];
const themes = ["light", "dark"];

fs.mkdirSync(finalRoot, { recursive: true });

const productRoot = path.resolve("dist/produkt");
const slugs = fs.readdirSync(productRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(productRoot, entry.name, "index.html")))
  .map((entry) => entry.name)
  .sort();
if (slugs.length !== 101) throw new Error(`Expected 101 product routes, found ${slugs.length}.`);

const targets = await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json();
const target = targets.find((entry) => entry.type === "page");
if (!target) throw new Error("No CDP page target available.");

const socket = new WebSocket(target.webSocketDebuggerUrl);
const waiting = new Map();
let requestId = 0;
const withTimeout = (promise, label) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error(`QA timeout: ${label}`)), timeoutMs))
]);

socket.onmessage = ({ data }) => {
  const message = JSON.parse(data);
  const pending = waiting.get(message.id);
  if (!pending) return;
  waiting.delete(message.id);
  if (message.error) pending.reject(new Error(`${pending.method}: ${message.error.message}`));
  else pending.resolve(message.result);
};
socket.onclose = () => {
  for (const pending of waiting.values()) pending.reject(new Error("CDP socket closed"));
  waiting.clear();
};
await withTimeout(new Promise((resolve, reject) => {
  socket.onopen = resolve;
  socket.onerror = reject;
}), "CDP connection");

const send = (method, params = {}) => withTimeout(new Promise((resolve, reject) => {
  const id = ++requestId;
  waiting.set(id, { method, resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
}), method);
const evaluate = async (expression, awaitPromise = false) => {
  const result = await send("Runtime.evaluate", { expression, awaitPromise, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
  return result.result?.value;
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const setViewport = async (width, theme, reload = true) => {
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
  if (reload) {
    await send("Page.reload", { ignoreCache: true });
    await sleep(550);
  }
};
const navigate = async (route) => {
  await send("Page.navigate", { url: `${previewUrl}${route}` });
  await sleep(450);
  await evaluate("document.readyState");
};
const decodeHero = () => evaluate(`(async () => {
  const image = document.querySelector('.pg29__desktop .pg29__tile:first-child img')
    ?? document.querySelector('.pg29__mobile .pg29__slide:first-child img');
  if (image) { image.loading = 'eager'; try { await image.decode(); } catch {} }
})()`, true);
const screenshot = async (name) => {
  await evaluate("scrollTo(0, 0)");
  const metrics = await send("Page.getLayoutMetrics");
  const size = metrics.cssContentSize;
  const result = await send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
    clip: { x: 0, y: 0, width: size.width, height: size.height, scale: 1 }
  });
  fs.writeFileSync(path.join(finalRoot, name), Buffer.from(result.data, "base64"));
};

await setViewport(1024, "light", false);
const heroAudit = [];
for (const slug of slugs) {
  await navigate(`/produkt/${slug}/`);
  await decodeHero();
  const record = JSON.parse(await evaluate(`(async () => JSON.stringify(await (async () => {
    const gallery = document.querySelector('[data-product-gallery-v29]');
    const image = document.querySelector('.pg29__desktop .pg29__tile:first-child img');
    const stage = image?.closest('.pg29__tile');
    const rect = image?.getBoundingClientRect();
    const stageRect = stage?.getBoundingClientRect();
    let response = null;
    if (image?.currentSrc) {
      try {
        const fetched = await fetch(image.currentSrc, { cache: 'no-store' });
        const blob = await fetched.blob();
        response = { status: fetched.status, ok: fetched.ok, contentType: fetched.headers.get('content-type'), bytes: blob.size };
      } catch (error) { response = { status: 0, ok: false, error: String(error) }; }
    }
    let visual = null;
    if (image?.naturalWidth && image?.naturalHeight) {
      try {
        const canvas = document.createElement('canvas'); canvas.width = 12; canvas.height = 12;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        context.drawImage(image, 0, 0, 12, 12);
        const pixels = context.getImageData(0, 0, 12, 12).data;
        let opaque = 0; const colors = new Set();
        for (let index = 0; index < pixels.length; index += 4) {
          if (pixels[index + 3] > 8) opaque++;
          colors.add(Math.round(pixels[index] / 16) + ':' + Math.round(pixels[index + 1] / 16) + ':' + Math.round(pixels[index + 2] / 16) + ':' + Math.round(pixels[index + 3] / 16));
        }
        visual = { opaqueRatio: opaque / 144, sampledColors: colors.size };
      } catch (error) { visual = { error: String(error) }; }
    }
    const computed = image ? getComputedStyle(image) : null;
    const role = gallery?.dataset.primaryMediaRole ?? null;
    const fallback = gallery?.dataset.primaryMediaFallback === 'true';
    const checks = {
      present: image instanceof HTMLImageElement,
      complete: image?.complete === true,
      naturalDimensions: (image?.naturalWidth ?? 0) >= 320 && (image?.naturalHeight ?? 0) >= 240,
      renderedDimensions: (rect?.width ?? 0) >= 200 && (rect?.height ?? 0) >= 150,
      stageVisible: (stageRect?.width ?? 0) > 0 && (stageRect?.height ?? 0) > 0,
      cssVisible: computed ? computed.display !== 'none' && computed.visibility !== 'hidden' && Number(computed.opacity) > 0 : false,
      http: response?.ok === true && response?.status === 200 && response?.contentType?.startsWith('image/') && response?.bytes > 0,
      visual: visual?.opaqueRatio > .02 && visual?.sampledColors > 1,
      expectedSource: role === 'hero' && fallback === false
    };
    const failures = Object.entries(checks).filter(([, pass]) => !pass).map(([name]) => name);
    return {
      slug: location.pathname.split('/').filter(Boolean).at(-1),
      title: document.querySelector('h1')?.textContent?.trim() ?? null,
      source: { role, fallback },
      src: image?.getAttribute('src') ?? null,
      currentSrc: image?.currentSrc ?? null,
      alt: image?.alt ?? null,
      complete: image?.complete ?? false,
      naturalWidth: image?.naturalWidth ?? 0,
      naturalHeight: image?.naturalHeight ?? 0,
      rect: rect ? { width: rect.width, height: rect.height } : null,
      stageRect: stageRect ? { width: stageRect.width, height: stageRect.height } : null,
      response,
      visual,
      checks,
      valid: failures.length === 0,
      reason: failures.length ? failures.join(', ') : 'explicit Astro hero; HTTP 200; decoded; visible; non-empty visual sample'
    };
  })()))()`, true));
  if (record.slug !== slug) throw new Error(`Route mismatch: expected ${slug}, rendered ${record.slug}.`);
  heroAudit.push(record);
}
const invalidHeroes = heroAudit.filter((entry) => !entry.valid);
fs.writeFileSync(path.join(reportRoot, "product-hero-browser-audit.json"), JSON.stringify({
  summary: { routes: heroAudit.length, valid: heroAudit.length - invalidHeroes.length, invalid: invalidHeroes.length },
  products: heroAudit
}, null, 2) + "\n");
if (invalidHeroes.length) throw new Error(`Hero audit failed: ${invalidHeroes.map((entry) => `${entry.slug} (${entry.reason})`).join('; ')}`);

const responsive = [];
for (const width of widths) for (const theme of themes) {
  await setViewport(width, theme, false);
  await navigate(affectedRoute);
  await setViewport(width, theme, true);
  await decodeHero();
  const result = JSON.parse(await evaluate(`JSON.stringify((() => {
    const mobile = innerWidth < 760;
    const image = document.querySelector(mobile ? '.pg29__mobile .pg29__slide:first-child img' : '.pg29__desktop .pg29__tile:first-child img');
    const summary = document.querySelector('.verdict__decision-summary');
    const rows = [...(summary?.children ?? [])];
    const fit = document.querySelector('[data-category-fit]');
    const imageRect = image?.getBoundingClientRect();
    const summaryRect = summary?.getBoundingClientRect();
    const rowRects = rows.map((row) => { const r = row.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height }; });
    const fitRect = fit?.getBoundingClientRect();
    const summaryStyle = summary ? getComputedStyle(summary) : null;
    const values = rows.map((row) => ({ label: row.querySelector('dt')?.textContent?.trim(), value: row.querySelector('dd')?.textContent?.trim() }));
    return {
      width: innerWidth,
      theme: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
      viewport: { clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth },
      hero: { currentSrc: image?.currentSrc, complete: image?.complete, naturalWidth: image?.naturalWidth, naturalHeight: image?.naturalHeight, rect: imageRect ? { width: imageRect.width, height: imageRect.height } : null },
      summary: { values, rect: summaryRect ? { top: summaryRect.top, bottom: summaryRect.bottom, width: summaryRect.width, height: summaryRect.height } : null, rows: rowRects, columns: summaryStyle?.gridTemplateColumns, background: summaryStyle?.backgroundColor },
      fit: { present: fit instanceof HTMLElement, rect: fitRect ? { top: fitRect.top, width: fitRect.width, height: fitRect.height } : null, form: Boolean(fit?.querySelector('form')) },
      leakage: /PETLIBRO[^.]{0,120}(Halsband|Anhänger)|Halsband nötig/i.test(document.body.innerText),
      content: document.querySelector('.verdict__tradeoff p')?.textContent?.trim()
    };
  })())`));
  const stacked = width <= 430 ? result.summary.rows[1]?.top >= result.summary.rows[0]?.bottom - 1 : true;
  const columns = width >= 768 ? Math.abs((result.summary.rows[0]?.top ?? 0) - (result.summary.rows[1]?.top ?? 99)) < 2 : true;
  const localGap = result.fit.rect && result.summary.rect ? result.fit.rect.top - result.summary.rect.bottom : -1;
  const failures = [
    result.viewport.scrollWidth > result.viewport.clientWidth && "horizontal-overflow",
    (!result.hero.complete || !result.hero.naturalWidth || !result.hero.naturalHeight || !result.hero.rect?.width || !result.hero.rect?.height) && "hero",
    (result.summary.values.length !== 2 || result.summary.values.some((entry) => !entry.label || !entry.value)) && "summary-content",
    !stacked && "summary-stack",
    !columns && "summary-columns",
    (!result.fit.present || !result.fit.form) && "personal-fit",
    (localGap < 0 || localGap > 80) && "local-spacing",
    result.leakage && "cross-product-leakage"
  ].filter(Boolean);
  responsive.push({ ...result, localGap, valid: failures.length === 0, reason: failures.length ? failures.join(", ") : "pass" });
  if (failures.length) throw new Error(`Responsive QA failed ${width}/${theme}: ${failures.join(', ')}`);
  if (width === 375 || width === 1600) await screenshot(`neakasa-m1-lite-${width}-${theme}-full.png`);
}

fs.writeFileSync(path.join(reportRoot, "responsive-browser-qa.json"), JSON.stringify({
  route: affectedRoute,
  matrix: responsive,
  summary: { combinations: responsive.length, valid: responsive.filter((entry) => entry.valid).length }
}, null, 2) + "\n");

const screenshots = fs.readdirSync(finalRoot).filter((name) => name.endsWith(".png")).sort();
if (screenshots.length !== 4) throw new Error(`Expected exactly four final screenshots, found ${screenshots.length}.`);
socket.close();
console.log(`Product Production Repair 33.3.1a browser QA passed: 101 heroes, ${responsive.length} responsive combinations, 4 final screenshots.`);

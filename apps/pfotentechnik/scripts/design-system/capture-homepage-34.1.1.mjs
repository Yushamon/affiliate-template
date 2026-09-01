#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const port = process.env.CDP_PORT ?? "9225";
const preview = process.env.PREVIEW_URL ?? "http://127.0.0.1:4321";
const outputDir = path.resolve("reports/design-system/homepage-34.1.1/final");
const reportPath = path.resolve("reports/design-system/homepage-34.1.1/browser-qa.json");
const viewports = [320, 375, 430, 768, 820, 1024, 1280, 1440, 1600];
const baselineScrollHeight = { light: 10426, dark: 10426 };

const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const page = targets.find((target) => target.type === "page");
if (!page) throw new Error("Kein Page-Target am CDP-Port gefunden");

const socket = new WebSocket(page.webSocketDebuggerUrl);
const pending = new Map();
let id = 0;
socket.onmessage = ({ data }) => {
  const message = JSON.parse(data);
  const request = pending.get(message.id);
  if (!request) return;
  pending.delete(message.id);
  if (message.error) request.reject(new Error(`${message.error.message} (${request.method})`));
  else request.resolve(message);
};
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const requestId = ++id;
  const timeout = setTimeout(() => {
    pending.delete(requestId);
    reject(new Error(`CDP timeout: ${method}`));
  }, 15000);
  pending.set(requestId, {
    method,
    resolve: (message) => { clearTimeout(timeout); resolve(message); },
    reject: (error) => { clearTimeout(timeout); reject(error); }
  });
  socket.send(JSON.stringify({ id: requestId, method, params }));
});
const evaluate = async (expression, awaitPromise = false) => {
  const response = await send("Runtime.evaluate", { expression, awaitPromise, returnByValue: true });
  if (response.result?.exceptionDetails) throw new Error(response.result.exceptionDetails.text ?? "Runtime.evaluate failed");
  return response.result?.result?.value;
};
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const inspect = `(() => {
  const rect = (element) => {
    const value = element?.getBoundingClientRect();
    return value ? { top: Math.round(value.top), bottom: Math.round(value.bottom), left: Math.round(value.left), right: Math.round(value.right), width: Math.round(value.width), height: Math.round(value.height) } : null;
  };
  const h1 = document.querySelector(".pt-home h1");
  const hero = document.querySelector(".pt-home__hero");
  const primary = document.querySelector(".pt-home__button--primary");
  const homepageImages = [...document.querySelectorAll(".pt-home img")];
  const sections = [...document.querySelectorAll(".pt-home > section")];
  const headings = [...document.querySelectorAll(".pt-home h1, .pt-home h2, .pt-home h3")];
  const tapTargets = [...document.querySelectorAll(".pt-home__button, .pt-home__need-list a, .pt-home__category-list a, .pt-home__decision, .pt-home__guide-list > a")];
  primary?.focus();
  const focus = primary ? getComputedStyle(primary) : null;
  return {
    url: location.href,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    scrollHeight: document.documentElement.scrollHeight,
    h1Count: document.querySelectorAll("h1").length,
    h1: rect(h1),
    hero: rect(hero),
    sections: sections.map((section) => ({ className: section.className, rect: rect(section) })),
    sectionOrderValid: sections.every((section, index) => index === 0 || section.getBoundingClientRect().top >= sections[index - 1].getBoundingClientRect().bottom),
    headingsInViewport: headings.every((heading) => { const value = heading.getBoundingClientRect(); return value.left >= 0 && value.right <= document.documentElement.clientWidth; }),
    tapTargetsValid: tapTargets.every((target) => target.getBoundingClientRect().height >= 44),
    images: homepageImages.map((image) => ({ currentSrc: image.currentSrc, complete: image.complete, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight })),
    focus: focus ? { outlineWidth: focus.outlineWidth, outlineStyle: focus.outlineStyle } : null,
    pageBackground: getComputedStyle(document.body).backgroundColor
  };
})()`;

fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
await send("Page.enable");
await send("Runtime.enable");

const report = [];
for (const width of viewports) {
  for (const theme of ["light", "dark"]) {
    await send("Emulation.setDeviceMetricsOverride", {
      width,
      height: width <= 430 ? 844 : 960,
      deviceScaleFactor: 1,
      mobile: width <= 430
    });
    await send("Emulation.setEmulatedMedia", { media: "", features: [{ name: "prefers-color-scheme", value: theme }] });
    await send("Page.navigate", { url: `${preview}/` });
    await wait(500);
    await evaluate(`(async () => { await document.fonts.ready; for (const image of document.images) { image.loading = "eager"; try { await image.decode(); } catch {} } window.scrollTo(0, 0); })()`, true);
    await wait(100);
    const result = await evaluate(inspect);
    const pass = result.clientWidth === result.scrollWidth &&
      result.h1Count === 1 &&
      result.h1?.left >= 0 && result.h1?.right <= result.clientWidth &&
      result.hero?.left >= 0 && result.hero?.right <= result.clientWidth &&
      result.sectionOrderValid && result.headingsInViewport && result.tapTargetsValid &&
      result.images.length > 0 && result.images.every((image) => image.complete && image.naturalWidth > 0 && image.naturalHeight > 0) &&
      result.focus?.outlineWidth !== "0px";
    report.push({ viewport: width, theme, pass, ...result });
    if (!pass) {
      console.error(JSON.stringify({ viewport: width, theme, ...result }, null, 2));
      throw new Error(`Homepage browser gate failed: ${width}px ${theme}`);
    }

    if (width === 375 || width === 1600) {
      const capture = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
      fs.writeFileSync(path.join(outputDir, `homepage-${width}-${theme}-full.png`), Buffer.from(capture.result.data, "base64"));
    }
  }
}

const mobile = Object.fromEntries(report.filter((entry) => entry.viewport === 375).map((entry) => [entry.theme, {
  before: baselineScrollHeight[entry.theme],
  after: entry.scrollHeight,
  reduction: baselineScrollHeight[entry.theme] - entry.scrollHeight,
  reductionPercent: Number((((baselineScrollHeight[entry.theme] - entry.scrollHeight) / baselineScrollHeight[entry.theme]) * 100).toFixed(1))
}]));
fs.writeFileSync(reportPath, `${JSON.stringify({ preview, generatedAt: new Date().toISOString(), baselineScrollHeight, mobile, report }, null, 2)}\n`);
socket.close();
console.log(`Homepage 34.1.1 browser QA passed: ${report.length} viewport/theme cases`);
console.log(JSON.stringify({ mobile }, null, 2));

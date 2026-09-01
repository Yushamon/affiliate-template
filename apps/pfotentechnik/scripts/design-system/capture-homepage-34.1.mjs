#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const port = process.env.CDP_PORT ?? "9225";
const preview = process.env.PREVIEW_URL ?? "http://127.0.0.1:4328";
const outputDir = path.resolve("reports/design-system/homepage-34.1/final");
const reportPath = path.resolve("reports/design-system/homepage-34.1/browser-qa.json");
const viewports = [320, 375, 430, 768, 820, 1024, 1280, 1440, 1600];

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
    return value ? { left: Math.round(value.left), right: Math.round(value.right), width: Math.round(value.width), height: Math.round(value.height) } : null;
  };
  const h1 = document.querySelector(".pt-home h1");
  const hero = document.querySelector(".pt-home__hero");
  const heroContent = document.querySelector(".pt-home__hero-content");
  const primary = document.querySelector(".pt-home__button--primary");
  const homepageImages = [...document.querySelectorAll(".pt-home img")];
  primary?.focus();
  const focus = primary ? getComputedStyle(primary) : null;
  return {
    url: location.href,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    h1Count: document.querySelectorAll("h1").length,
    h1: rect(h1),
    h1Style: h1 ? { maxWidth: getComputedStyle(h1).maxWidth, fontSize: getComputedStyle(h1).fontSize, overflowWrap: getComputedStyle(h1).overflowWrap } : null,
    hero: rect(hero),
    heroContent: rect(heroContent),
    primary: rect(primary),
    focus: focus ? { outlineWidth: focus.outlineWidth, outlineStyle: focus.outlineStyle } : null,
    sections: [...document.querySelectorAll(".pt-home > section")].map((section) => section.className),
    images: homepageImages.map((image) => ({ currentSrc: image.currentSrc, complete: image.complete, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight })),
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
    await evaluate(`(async () => { for (const image of document.images) { image.loading = "eager"; try { await image.decode(); } catch {} } window.scrollTo(0, 0); })()`, true);
    await wait(100);
    const result = await evaluate(inspect);
    const pass = result.clientWidth === result.scrollWidth &&
      result.h1Count === 1 &&
      result.h1?.left >= 0 && result.h1?.right <= result.clientWidth &&
      result.hero?.left >= 0 && result.hero?.right <= result.clientWidth &&
      result.primary?.height >= 44 &&
      result.images.length > 0 && result.images.every((image) => image.complete && image.naturalWidth > 0 && image.naturalHeight > 0) &&
      result.focus?.outlineWidth !== "0px";
    report.push({ viewport: width, theme, pass, ...result });
    if (!pass) {
      console.error(JSON.stringify({ viewport: width, theme, ...result }, null, 2));
      throw new Error(`Homepage browser gate failed: ${width}px ${theme}`);
    }

    if ((width === 375 || width === 1600) && ["light", "dark"].includes(theme)) {
      const capture = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
      fs.writeFileSync(path.join(outputDir, `homepage-${width}-${theme}-full.png`), Buffer.from(capture.result.data, "base64"));
    }
  }
}

fs.writeFileSync(reportPath, `${JSON.stringify({ preview, generatedAt: new Date().toISOString(), report }, null, 2)}\n`);
socket.close();
console.log(`Homepage 34.1 browser QA passed: ${report.length} viewport/theme cases`);

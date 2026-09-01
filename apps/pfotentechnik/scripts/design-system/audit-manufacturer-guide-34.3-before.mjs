#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const previewUrl = process.env.PREVIEW_URL ?? "http://127.0.0.1:4330";
const cdpPort = process.env.CDP_PORT ?? "9227";
const reportRoot = path.resolve("reports/design-system/manufacturer-guide-34.3");
const routes = [
  { type: "manufacturer", route: "/hersteller/petkit/" },
  { type: "guide", route: "/futterautomat-richtig-reinigen/" }
];

fs.mkdirSync(reportRoot, { recursive: true });
const targets = await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json();
const target = targets.find((entry) => entry.type === "page");
if (!target) throw new Error("No CDP page target available.");

const socket = new WebSocket(target.webSocketDebuggerUrl);
const waiting = new Map();
let id = 0;
socket.onmessage = ({ data }) => {
  const message = JSON.parse(data);
  const pending = waiting.get(message.id);
  if (!pending) return;
  waiting.delete(message.id);
  message.error ? pending.reject(new Error(message.error.message)) : pending.resolve(message.result);
};
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const requestId = ++id;
  waiting.set(requestId, { resolve, reject });
  socket.send(JSON.stringify({ id: requestId, method, params }));
});
const evaluate = async (expression, awaitPromise = false) => {
  const result = await send("Runtime.evaluate", { expression, awaitPromise, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
  return result.result?.value;
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

await send("Emulation.setDeviceMetricsOverride", { width: 375, height: 844, deviceScaleFactor: 1, mobile: true });
const metrics = [];
for (const entry of routes) {
  await send("Page.navigate", { url: `${previewUrl}${entry.route}` });
  await sleep(900);
  await evaluate(`Promise.all([...document.images].map(async image => { image.loading = 'eager'; try { await image.decode(); } catch {} }))`, true);
  const html = await (await fetch(`${previewUrl}${entry.route}`)).text();
  const runtime = JSON.parse(await evaluate(`JSON.stringify((() => {
    const main = document.querySelector('main') ?? document.body;
    const sections = [...main.querySelectorAll(':scope section, :scope article > section')];
    const images = [...main.querySelectorAll('img')];
    const resources = performance.getEntriesByType('resource');
    const imageResources = resources.filter(item => item.initiatorType === 'img');
    const scripts = resources.filter(item => item.initiatorType === 'script');
    const text = main.innerText.replace(/\\s+/g, ' ').trim();
    return {
      title: document.title,
      h1: main.querySelector('h1')?.textContent?.trim() ?? null,
      htmlBytes: new TextEncoder().encode(document.documentElement.outerHTML).length,
      responseHtmlBytes: ${new TextEncoder().encode(html).length},
      domNodes: main.querySelectorAll('*').length,
      imageBytes: imageResources.reduce((sum, item) => sum + (item.transferSize || item.decodedBodySize || 0), 0),
      imageCount: images.length,
      brokenImages: images.filter(image => !image.complete || !image.naturalWidth || !image.naturalHeight || !image.getBoundingClientRect().width || !image.getBoundingClientRect().height).length,
      imageFailures: images.flatMap(image => {
        const rect = image.getBoundingClientRect();
        return image.complete && image.naturalWidth && image.naturalHeight && rect.width && rect.height ? [] : [{ src: image.currentSrc || image.src, alt: image.alt, complete: image.complete, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight, width: rect.width, height: rect.height, hidden: getComputedStyle(image).display === 'none' || getComputedStyle(image).visibility === 'hidden' }];
      }),
      documentHeight375: document.documentElement.scrollHeight,
      internalLinks: [...main.querySelectorAll('a[href]')].filter(link => { try { return new URL(link.href).origin === location.origin; } catch { return false; } }).length,
      majorSections: sections.length,
      details: main.querySelectorAll('details').length,
      cards: main.querySelectorAll('.pt-surface, [class*=card], [class*=grid] > article, [class*=grid] > a').length,
      hydratedJsBytes: scripts.reduce((sum, item) => sum + (item.transferSize || item.decodedBodySize || 0), 0),
      scriptCount: scripts.length,
      textCharacters: text.length,
      textWords: text.split(/\\s+/).filter(Boolean).length,
      normalizedText: text
    };
  })())`));
  metrics.push({ ...entry, ...runtime });
}

fs.writeFileSync(path.join(reportRoot, "before-metrics.json"), JSON.stringify({ capturedAt: new Date().toISOString(), viewport: { width: 375, height: 844 }, metrics }, null, 2) + "\n");
socket.close();
console.log(`34.3 before metrics captured for ${metrics.length} representative routes.`);

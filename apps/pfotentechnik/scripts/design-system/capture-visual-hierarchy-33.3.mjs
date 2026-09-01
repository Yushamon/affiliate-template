#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const port = process.env.CDP_PORT ?? "9224";
const preview = process.env.PREVIEW_URL ?? "http://127.0.0.1:4327";
const outputDir = path.resolve("reports/design-system/visual-hierarchy-33.3/final");
const routes = {
  product: "/produkt/petlibro-dockstream-rfid-smart/",
  comparison: "/vergleiche/beste-futterautomaten-mit-kamera/",
  homepage: "/",
  category: "/smarte-futterautomaten/",
  manufacturer: "/hersteller/petlibro/",
  guide: "/futterautomat-richtig-reinigen/"
};
const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const page = targets.find((item) => item.type === "page");
if (!page) throw new Error("Kein page-Target gefunden");
const socket = new WebSocket(page.webSocketDebuggerUrl);
const pending = new Map();
let id = 0;
socket.onmessage = ({ data }) => {
  const message = JSON.parse(data);
  const resolve = pending.get(message.id);
  if (resolve) { pending.delete(message.id); resolve(message); }
};
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
const send = (method, params = {}) => new Promise((resolve) => {
  const requestId = ++id;
  pending.set(requestId, resolve);
  socket.send(JSON.stringify({ id: requestId, method, params }));
});
const evaluate = async (expression, awaitPromise = false) => {
  const result = await send("Runtime.evaluate", { expression, awaitPromise, returnByValue: true });
  if (result.result?.exceptionDetails) throw new Error(result.result.exceptionDetails.text ?? "Runtime.evaluate failed");
  return result.result?.result?.value;
};
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
fs.mkdirSync(outputDir, { recursive: true });
await send("Page.enable");
await send("Runtime.enable");
for (const [type, route] of Object.entries(routes)) {
  for (const theme of ["light", "dark"]) {
    await send("Emulation.setDeviceMetricsOverride", { width: 375, height: 844, deviceScaleFactor: 1, mobile: true });
    await send("Emulation.setEmulatedMedia", { media: "", features: [{ name: "prefers-color-scheme", value: theme }] });
    await send("Page.navigate", { url: `${preview}${route}` });
    await wait(1000);
    await evaluate(`(async()=>{for(const image of document.images){image.loading='eager';try{await image.decode()}catch{}} window.scrollTo(0,0);})()`, true);
    await wait(200);
    const result = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
    fs.writeFileSync(path.join(outputDir, `${type}-375-${theme}-full.png`), Buffer.from(result.result.data, "base64"));
    await send("Emulation.setDeviceMetricsOverride", { width: 1600, height: 960, deviceScaleFactor: 1, mobile: false });
    await send("Page.reload", { ignoreCache: true });
    await wait(1000);
    await evaluate(`(async()=>{for(const image of document.images){image.loading='eager';try{await image.decode()}catch{}} window.scrollTo(0,0);})()`, true);
    await wait(200);
    const desktop = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
    fs.writeFileSync(path.join(outputDir, `${type}-1600-${theme}-full.png`), Buffer.from(desktop.result.data, "base64"));
  }
}
socket.close();
console.log(`Created ${Object.keys(routes).length * 4} screenshots in ${outputDir}`);

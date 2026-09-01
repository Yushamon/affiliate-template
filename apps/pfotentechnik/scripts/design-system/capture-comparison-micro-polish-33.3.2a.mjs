#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const previewUrl = process.env.PREVIEW_URL ?? "http://127.0.0.1:4321";
const cdpPort = process.env.CDP_PORT ?? "9224";
const route = "/vergleiche/beste-haustierkameras/";
const widths = [320, 375, 430, 768, 1024, 1280, 1440, 1600];
const themes = ["light", "dark"];
const reportDirectory = path.resolve("reports/comparison-micro-polish-33.3.2a");
const outputDirectory = path.join(reportDirectory, "final");
const timeoutMs = 20_000;

fs.mkdirSync(outputDirectory, { recursive: true });

const targets = await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json();
const target = targets.find((entry) => entry.type === "page");
if (!target) throw new Error("No CDP page target available.");

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
  request.resolve(message);
};
socket.onclose = () => {
  for (const request of pending.values()) request.reject(new Error("CDP socket closed"));
  pending.clear();
};
await timeout(new Promise((resolve, reject) => {
  socket.onopen = resolve;
  socket.onerror = reject;
}), "CDP connection");

const send = (method, params = {}) => timeout(new Promise((resolve, reject) => {
  const id = ++requestId;
  pending.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
}), method);
const evaluate = async (expression, awaitPromise = false) => {
  const response = await send("Runtime.evaluate", { expression, awaitPromise, returnByValue: true });
  if (response.result?.exceptionDetails) throw new Error(response.result.exceptionDetails.text);
  return response.result?.result?.value;
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
await send("DOM.enable");
await send("CSS.enable");

const captureFitDetail = async (width, theme, fit) => {
  const margin = width <= 430 ? 0 : 24;
  const x = Math.max(0, fit.left - margin);
  const y = Math.max(0, fit.documentTop - 16);
  const clipWidth = Math.min(width - x, fit.width + margin * 2);
  const clipHeight = fit.height + 32;
  const response = await send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
    clip: { x, y, width: clipWidth, height: clipHeight, scale: 1 }
  });
  fs.writeFileSync(
    path.join(outputDirectory, `comparison-haustierkameras-${width}-${theme}-fit-closed-detail.png`),
    Buffer.from(response.result.data, "base64")
  );
};

const results = [];
for (const width of widths) for (const theme of themes) {
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height: width <= 430 ? 844 : 1000,
    deviceScaleFactor: 1,
    mobile: width < 768
  });
  await send("Emulation.setTouchEmulationEnabled", { enabled: width < 768 });
  await send("Emulation.setEmulatedMedia", {
    media: "",
    features: [{ name: "prefers-color-scheme", value: theme }]
  });
  await send("Page.navigate", { url: `${previewUrl}${route}` });
  await sleep(850);
  await evaluate(`Promise.all([...document.images].map(async (image) => {
    image.loading = "eager";
    try { await image.decode?.(); } catch {}
  }))`, true);

  const closed = JSON.parse(await evaluate(`JSON.stringify((() => {
    const details = document.querySelector('.rc33__explorer');
    const summary = details?.querySelector(':scope > summary');
    const label = summary?.querySelector(':scope > span');
    const icon = summary?.querySelector(':scope > svg');
    const fit = document.querySelector('.rc33__fit');
    const eyebrow = fit?.querySelector(':scope > span');
    const heading = fit?.querySelector(':scope > h2');
    const supportingCopy = fit?.querySelector(':scope > p');
    if (details instanceof HTMLDetailsElement) details.open = false;
    const rect = (element) => {
      const value = element?.getBoundingClientRect();
      return value ? { left: value.left, top: value.top, right: value.right, bottom: value.bottom, width: value.width, height: value.height, documentTop: value.top + scrollY } : null;
    };
    const summaryStyle = summary ? getComputedStyle(summary) : null;
    const detailsStyle = details ? getComputedStyle(details) : null;
    const labelStyle = label ? getComputedStyle(label) : null;
    const fitRect = rect(fit);
    return {
      prefersDark: matchMedia('(prefers-color-scheme: dark)').matches,
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      semantics: { details: details?.tagName, summary: summary?.tagName, iconHidden: icon?.getAttribute('aria-hidden') },
      fit: fitRect,
      eyebrow: rect(eyebrow),
      heading: rect(heading),
      supportingCopy: rect(supportingCopy),
      trigger: rect(details),
      summary: rect(summary),
      label: rect(label),
      icon: rect(icon),
      summaryBackground: summaryStyle?.backgroundColor,
      detailsBackground: detailsStyle?.backgroundColor,
      borderColor: detailsStyle?.borderColor,
      labelLineHeight: labelStyle ? parseFloat(labelStyle.lineHeight) : null,
      labelFontWeight: labelStyle?.fontWeight
    };
  })())`));

  const documentNode = await send("DOM.getDocument", { depth: 0 });
  const summaryNode = await send("DOM.querySelector", { nodeId: documentNode.result.root.nodeId, selector: ".rc33__explorer > summary" });
  await send("CSS.forcePseudoState", { nodeId: summaryNode.result.nodeId, forcedPseudoClasses: ["hover"] });
  await sleep(60);
  const hover = JSON.parse(await evaluate(`JSON.stringify((() => {
    const summary = document.querySelector('.rc33__explorer > summary');
    return { matches: summary?.matches(':hover'), background: summary ? getComputedStyle(summary).backgroundColor : null };
  })())`));
  await send("CSS.forcePseudoState", { nodeId: summaryNode.result.nodeId, forcedPseudoClasses: [] });

  await evaluate(`document.querySelector('.rc33__explorer > summary')?.focus()`);
  const focus = JSON.parse(await evaluate(`JSON.stringify((() => {
    const summary = document.querySelector('.rc33__explorer > summary');
    const style = summary ? getComputedStyle(summary) : null;
    return { active: document.activeElement === summary, outlineStyle: style?.outlineStyle, outlineWidth: style?.outlineWidth, boxShadow: style?.boxShadow };
  })())`));

  const open = JSON.parse(await evaluate(`JSON.stringify((() => {
    const details = document.querySelector('.rc33__explorer');
    const summary = details?.querySelector(':scope > summary');
    summary?.click();
    const rect = (element) => { const value = element?.getBoundingClientRect(); return value ? { left: value.left, right: value.right, width: value.width, height: value.height } : null; };
    return {
      open: details instanceof HTMLDetailsElement && details.open,
      trigger: rect(details),
      summary: rect(summary),
      explorer: rect(details?.querySelector('.comparison-lab')),
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth
    };
  })())`));
  await evaluate(`document.querySelector('.rc33__explorer > summary')?.click()`);
  await evaluate(`document.activeElement instanceof HTMLElement && document.activeElement.blur()`);

  const tolerance = 1;
  const aligned = [closed.eyebrow, closed.heading, closed.supportingCopy, closed.trigger]
    .every((item) => item && Math.abs(item.left - closed.eyebrow.left) <= tolerance);
  const labelIconSeparated = closed.label && closed.icon && closed.label.right <= closed.icon.left - tolerance;
  const contained = closed.summary && closed.label && closed.icon
    && closed.label.left >= closed.summary.left - tolerance
    && closed.icon.right <= closed.summary.right + tolerance;
  const desktopProportion = width < 1280 || closed.trigger.width < closed.fit.width * .75;
  const mobileWidth = width > 430 || Math.abs(closed.trigger.width - closed.fit.width) <= tolerance;
  const heightValid = closed.summary.height >= 48 && closed.summary.height <= (width === 320 ? 68 : 56.5);
  const noWrapAt375 = width !== 375 || closed.label.height <= closed.labelLineHeight * 1.25;
  const hoverVisible = width < 768 || hover.background !== closed.summaryBackground;
  const focusVisible = focus.active && (focus.outlineStyle !== "none" || focus.boxShadow !== "none");
  const semanticsValid = closed.semantics.details === "DETAILS" && closed.semantics.summary === "SUMMARY" && closed.semantics.iconHidden === "true";
  const openValid = open.open && open.explorer?.width > 0 && open.scrollWidth === open.clientWidth && Math.abs(open.trigger.width - closed.fit.width) <= tolerance;
  const surfaceValid = closed.detailsBackground !== "rgba(0, 0, 0, 0)" && !(theme === "dark" && closed.detailsBackground === "rgb(255, 255, 255)");

  if (closed.scrollWidth !== closed.clientWidth || closed.prefersDark !== (theme === "dark") || !aligned || !labelIconSeparated || !contained || !desktopProportion || !mobileWidth || !heightValid || !noWrapAt375 || !hoverVisible || !focusVisible || !semanticsValid || !openValid || !surfaceValid) {
    throw new Error(`Comparison micro-polish QA failed ${width}/${theme}: ${JSON.stringify({ closed, hover, focus, open, aligned, labelIconSeparated, contained, desktopProportion, mobileWidth, heightValid, noWrapAt375, hoverVisible, focusVisible, semanticsValid, openValid, surfaceValid })}`);
  }

  results.push({ width, theme, aligned, labelIconSeparated, contained, desktopProportion, mobileWidth, heightValid, noWrapAt375, hoverVisible, focusVisible, semanticsValid, openValid, surfaceValid, closed, hover, focus, open });

  if (width === 375 || width === 1600) await captureFitDetail(width, theme, closed.fit);
}

fs.writeFileSync(path.join(reportDirectory, "browser-qa.json"), JSON.stringify(results, null, 2) + "\n");
socket.close();
console.log(`Comparison micro-polish 33.3.2a browser QA passed: ${results.length} viewport/theme runs; 4 detail captures.`);

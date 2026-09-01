#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const previewUrl = process.env.PREVIEW_URL ?? "http://127.0.0.1:4321";
const cdpPort = process.env.CDP_PORT ?? "9224";
const route = "/vergleiche/beste-haustierkameras/";
const widths = [320, 375, 430, 768, 820, 1024, 1280, 1440, 1600];
const themes = ["light", "dark"];
const output = path.resolve("reports/comparison-repair-33.3.2/final");
const reportPath = path.resolve("reports/comparison-repair-33.3.2/geometry-browser-qa.json");
const timeoutMs = 20_000;

fs.mkdirSync(output, { recursive: true });

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
const screenshot = async (name) => {
  await evaluate("scrollTo(0, 0)");
  const response = await send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true
  });
  fs.writeFileSync(path.join(output, name), Buffer.from(response.result.data, "base64"));
};

const results = [];
for (const width of widths) for (const theme of themes) {
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height: width <= 430 ? 844 : 1000,
    deviceScaleFactor: 1,
    mobile: width < 768
  });
  await send("Emulation.setEmulatedMedia", {
    media: "",
    features: [{ name: "prefers-color-scheme", value: theme }]
  });
  await send("Page.navigate", { url: `${previewUrl}${route}` });
  await sleep(900);
  await evaluate(`Promise.all([...document.images].map(async (image) => {
    image.loading = "eager";
    try { await image.decode?.(); } catch {}
  }))`, true);

  const closedAxis = JSON.parse(await evaluate(`JSON.stringify((() => {
    const rect = (selector) => { const r = document.querySelector(selector)?.getBoundingClientRect(); return r ? { left: r.left, right: r.right, width: r.width } : null; };
    const fit = document.querySelector('.rc33__explorer');
    if (fit instanceof HTMLDetailsElement) fit.open = false;
    return {
      differenceSection: rect('.rc33__differences'),
      fitSection: rect('.rc33__fit'),
      scenarioSection: rect('.rc33__scenarios'),
      differenceContent: rect('.rc33__differences > span'),
      fitContent: rect('.rc33__fit > span'),
      scenarioContent: rect('.rc33__scenarios > span')
    };
  })())`));

  await evaluate(`(() => {
    const explorer = document.querySelector('.rc33__explorer');
    const technical = document.querySelector('.rc33__technical-details');
    const methodology = document.querySelector('.comparison-content--production-depth');
    if (explorer instanceof HTMLDetailsElement) explorer.open = true;
    if (technical instanceof HTMLDetailsElement) technical.open = true;
    if (methodology instanceof HTMLDetailsElement) methodology.open = true;
  })()`);
  await sleep(150);

  const qa = JSON.parse(await evaluate(`JSON.stringify((() => {
    const rect = (element) => { const r = element?.getBoundingClientRect(); return r ? { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height } : null; };
    const intersects = (a, b) => a && b && a.width > 0 && b.width > 0 && a.left < b.right - .5 && a.right > b.left + .5 && a.top < b.bottom - .5 && a.bottom > b.top + .5;
    const transparent = (value) => value === 'rgba(0, 0, 0, 0)' || value === 'transparent';
    const white = (value) => value === 'rgb(255, 255, 255)' || value === 'rgba(255, 255, 255, 1)';
    const summaries = [...document.querySelectorAll('.rc33__technical-details > summary, .rc33__explorer > summary, .comparison-content--production-depth > summary, .comparison-lab__group > summary')].map((summary) => {
      const label = summary.querySelector(':scope > span:first-child, .comparison-lab__group-title');
      const icon = summary.querySelector(':scope > svg, .comparison-lab__group-toggle');
      const background = getComputedStyle(summary).backgroundColor;
      return { rect: rect(summary), label: rect(label), icon: rect(icon), overlap: intersects(rect(label), rect(icon)), background, transparent: transparent(background), whiteInDark: ${JSON.stringify(theme)} === 'dark' && white(background) };
    });
    const cards = [...document.querySelectorAll('.comparison-pick-card')].filter((card) => !card.hidden).map((card) => {
      const media = rect(card.querySelector('.comparison-pick-card__media'));
      const identity = rect(card.querySelector('[data-picker-identity]'));
      const ring = rect(card.querySelector('.pt-score__ring'));
      const verdict = rect(card.querySelector('.pt-score__verdict'));
      const score = rect(card.querySelector('.comparison-pick-card__score'));
      const priceElement = card.querySelector('.comparison-pick-card__price');
      const price = rect(priceElement);
      return {
        media, identity, ring, verdict, score, price,
        card: rect(card),
        priceText: priceElement?.textContent?.trim(),
        priceWhiteSpace: priceElement ? getComputedStyle(priceElement).whiteSpace : null,
        overlap: {
          scoreLabel: intersects(ring, verdict),
          scorePrice: intersects(score, price),
          priceName: intersects(price, identity),
          thumbnailIdentity: intersects(media, identity)
        }
      };
    });
    const tones = {};
    for (const score of document.querySelectorAll('.pt-score')) {
      const tone = [...score.classList].find((name) => name.startsWith('pt-score--') && ['excellent','good','solid','limited','poor'].includes(name.slice(10)));
      if (!tone) continue;
      const key = tone.slice(10);
      const color = getComputedStyle(score).getPropertyValue('--pt-score-tone-accent').trim();
      (tones[key] ??= []).push(color);
    }
    const details = [...document.querySelectorAll('.rc33__technical-details, .rc33__explorer, .comparison-content--production-depth, .comparison-lab__group')].map((element) => {
      const background = getComputedStyle(element).backgroundColor;
      return { className: element.className, rect: rect(element), background, transparent: transparent(background), whiteInDark: ${JSON.stringify(theme)} === 'dark' && white(background) };
    });
    const focusTarget = document.querySelector('.rc33__explorer > summary');
    focusTarget?.focus();
    const focusStyle = focusTarget ? getComputedStyle(focusTarget) : null;
    return {
      prefersDark: matchMedia('(prefers-color-scheme: dark)').matches,
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      cards,
      summaries,
      details,
      tones,
      focusVisible: document.activeElement === focusTarget && focusStyle && (focusStyle.outlineStyle !== 'none' || focusStyle.boxShadow !== 'none'),
      technicalRows: document.querySelectorAll('.rc33__technical-details[open] dl > div').length,
      methodologyHeadings: [...document.querySelectorAll('.comparison-content--production-depth[open] article h2, .comparison-content--production-depth[open] article h3')].map((heading) => ({ text: heading.textContent?.trim(), size: parseFloat(getComputedStyle(heading).fontSize), rect: rect(heading) }))
    };
  })())`));

  const tolerance = 1;
  const axisValues = [closedAxis.differenceSection, closedAxis.fitSection, closedAxis.scenarioSection];
  const contentValues = [closedAxis.differenceContent, closedAxis.fitContent, closedAxis.scenarioContent];
  const axisAligned = axisValues.every(Boolean) && axisValues.every((item) => Math.abs(item.left - axisValues[0].left) <= tolerance && Math.abs(item.right - axisValues[0].right) <= tolerance);
  const contentAligned = contentValues.every(Boolean) && contentValues.every((item) => Math.abs(item.left - contentValues[0].left) <= tolerance);
  const cardFailure = qa.cards.some((card) => !card.media || !card.identity || !card.ring || !card.verdict || !card.price || card.priceWhiteSpace !== "nowrap" || Object.values(card.overlap).some(Boolean));
  const cardContainmentFailure = qa.cards.some((card) => [card.media, card.identity, card.ring, card.verdict, card.score, card.price].some((item) => item.left < card.card.left - tolerance || item.right > card.card.right + tolerance || item.top < card.card.top - tolerance || item.bottom > card.card.bottom + tolerance));
  const summaryFailure = qa.summaries.some((summary) => !summary.rect || !summary.label || !summary.icon || summary.overlap || summary.transparent || summary.whiteInDark);
  const disclosureFailure = qa.details.some((detail) => !detail.rect || detail.rect.width <= 0 || detail.transparent || detail.whiteInDark);
  const toneFailure = Object.values(qa.tones).some((colors) => new Set(colors).size !== 1 || !colors[0]);
  const methodologyFailure = qa.technicalRows < 1 || qa.methodologyHeadings.length < 1 || qa.methodologyHeadings.some((heading) => heading.rect.width <= 0 || heading.size > 31.6);
  if (qa.scrollWidth > qa.clientWidth || qa.prefersDark !== (theme === "dark") || !axisAligned || !contentAligned || cardFailure || cardContainmentFailure || summaryFailure || disclosureFailure || toneFailure || !qa.focusVisible || methodologyFailure) {
    throw new Error(`Comparison Repair QA failed ${width}/${theme}: ${JSON.stringify({ closedAxis, qa, axisAligned, contentAligned, cardFailure, cardContainmentFailure, summaryFailure, disclosureFailure, toneFailure, methodologyFailure })}`);
  }

  results.push({ width, theme, axisAligned, contentAligned, ...qa });

  if (width === 375) {
    await evaluate(`(() => {
      document.querySelector('.rc33__explorer').open = true;
      document.querySelector('.rc33__technical-details').open = false;
      document.querySelector('.comparison-content--production-depth').open = false;
    })()`);
    await screenshot(`comparison-haustierkameras-375-${theme}-fit-open-full.png`);
  }
  if (width === 1600) {
    await evaluate(`(() => {
      document.querySelector('.rc33__explorer').open = false;
      document.querySelector('.rc33__technical-details').open = true;
      document.querySelector('.comparison-content--production-depth').open = true;
    })()`);
    await screenshot(`comparison-haustierkameras-1600-${theme}-technical-method-open-full.png`);
  }
}

fs.writeFileSync(reportPath, JSON.stringify(results, null, 2) + "\n");
socket.close();
console.log(`Comparison Repair 33.3.2 browser QA passed: ${reportPath}`);

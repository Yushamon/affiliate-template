#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const previewUrl = process.env.PREVIEW_URL ?? "http://127.0.0.1:4330";
const cdpPort = process.env.CDP_PORT ?? "9227";
const reportRoot = path.resolve("reports/design-system/manufacturer-guide-34.3");
const finalRoot = path.join(reportRoot, "final");
const widths = [320, 375, 430, 768, 820, 1024, 1280, 1440, 1600];
const themes = ["light", "dark"];
const routes = [
  { type: "manufacturer", route: "/hersteller/petkit/", coverage: ["many-products", "multiple-categories"] },
  { type: "manufacturer", route: "/hersteller/petlibro/", coverage: ["many-products"] },
  { type: "manufacturer", route: "/hersteller/aqara/", coverage: ["few-products"] },
  { type: "manufacturer", route: "/hersteller/pawsync/", coverage: ["sparse-data"] },
  { type: "guide", route: "/welcher-futterautomat-ist-der-richtige/", expectedKind: "buying", coverage: ["buying"] },
  { type: "guide", route: "/hund-hat-durchfall/", expectedKind: "problem", coverage: ["problem"] },
  { type: "guide", route: "/gps-tracker-richtig-befestigen/", expectedKind: "how-to", coverage: ["how-to"] },
  { type: "guide", route: "/gps-oder-bluetooth/", expectedKind: "explanation", coverage: ["technology"] },
  { type: "guide", route: "/futterautomat-richtig-reinigen/", expectedKind: "how-to", coverage: ["media-rich"] },
  { type: "guide", route: "/biofilm-im-katzentrinkbrunnen/", expectedKind: "how-to", coverage: ["sparse"] }
];
const representatives = [
  { type: "manufacturer", route: "/hersteller/petkit/", slug: "petkit" },
  { type: "guide", route: "/futterautomat-richtig-reinigen/", slug: "futterautomat-richtig-reinigen" }
];

fs.mkdirSync(finalRoot, { recursive: true });
const targets = await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json();
const target = targets.find((entry) => entry.type === "page");
if (!target) throw new Error("No CDP page target available.");
const socket = new WebSocket(target.webSocketDebuggerUrl);
const pending = new Map();
let requestId = 0;
socket.onmessage = ({ data }) => {
  const message = JSON.parse(data);
  const request = pending.get(message.id);
  if (!request) return;
  pending.delete(message.id);
  message.error ? request.reject(new Error(`${request.method}: ${message.error.message}`)) : request.resolve(message.result);
};
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++requestId;
  pending.set(id, { method, resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});
const evaluate = async (expression, awaitPromise = false) => {
  const result = await send("Runtime.evaluate", { expression, awaitPromise, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
  return result.result?.value;
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const setViewport = async (width, theme) => {
  await send("Emulation.setDeviceMetricsOverride", { width, height: width < 768 ? 844 : 1000, deviceScaleFactor: 1, mobile: width < 768 });
  await send("Emulation.setEmulatedMedia", { media: "", features: [{ name: "prefers-color-scheme", value: theme }] });
};
const navigate = async (route) => {
  await send("Page.navigate", { url: `${previewUrl}${route}` });
  await sleep(420);
  await evaluate("document.readyState");
};
const inspectKeyboardFocus = async () => {
  for (let step = 0; step < 80; step += 1) {
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
    const result = await evaluate(`(() => {
      const root = document.querySelector('[data-manufacturer-experience], [data-guide-experience]');
      const active = document.activeElement;
      if (!root?.contains(active)) return null;
      const style = getComputedStyle(active);
      return {
        tag: active.tagName,
        outlineStyle: style.outlineStyle,
        outlineWidth: parseFloat(style.outlineWidth),
        boxShadow: style.boxShadow,
        valid: (style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0) || style.boxShadow !== 'none'
      };
    })()`);
    if (result) return result;
  }
  return { tag: null, outlineStyle: null, outlineWidth: 0, boxShadow: null, valid: false };
};
const prepareOpenPage = () => evaluate(`(async () => {
  document.querySelectorAll('main details').forEach(details => details.open = true);
  const images = [...document.querySelectorAll('main img')].filter(image => image.alt !== 'Vergrößerte Bildansicht');
  for (const image of images) { image.loading = 'eager'; try { await image.decode(); } catch {} }
  scrollTo(0, 0);
})()`, true);
const screenshot = async (name) => {
  await evaluate("scrollTo(0, 0)");
  const metrics = await send("Page.getLayoutMetrics");
  const size = metrics.cssContentSize;
  const result = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: 0, y: 0, width: size.width, height: size.height, scale: 1 } });
  fs.writeFileSync(path.join(finalRoot, name), Buffer.from(result.data, "base64"));
};

const matrix = [];
for (const width of widths) for (const theme of themes) for (const page of routes) {
  await setViewport(width, theme);
  await navigate(page.route);
  const keyboardFocus = await inspectKeyboardFocus();
  const initial = JSON.parse(await evaluate(`JSON.stringify((() => {
    const root = document.querySelector('[data-manufacturer-experience], [data-guide-experience]');
    const hero = root?.querySelector('[class$="__hero"]');
    const copy = hero?.querySelector('[class$="__hero-copy"]');
    const media = hero?.querySelector('[class$="__hero-media"]');
    const rect = element => { if (!element) return null; const r = element.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; };
    const copyRect = rect(copy); const mediaRect = rect(media);
    const overlaps = copyRect && mediaRect ? copyRect.left < mediaRect.right - 1 && copyRect.right > mediaRect.left + 1 && copyRect.top < mediaRect.bottom - 1 && copyRect.bottom > mediaRect.top + 1 : false;
    const actions = [...(root?.querySelectorAll('.pt-manufacturer__start a, .pt-manufacturer__comparison-list a, .pt-guide__hero-action, .pt-guide__next a, details > summary') ?? [])].filter(element => element.getBoundingClientRect().height > 0);
    return {
      root: Boolean(root),
      experience: root?.dataset.manufacturerExperience ?? root?.dataset.guideExperience ?? null,
      guideKind: root?.dataset.guideKind ?? null,
      h1: root?.querySelector('h1')?.textContent?.trim() ?? null,
      answer: root?.querySelector('.pt-guide__answer')?.textContent?.trim() ?? null,
      quickItems: root?.querySelectorAll('.pt-guide__summary li').length ?? 0,
      startPaths: root?.querySelectorAll('.pt-manufacturer__start nav > a').length ?? 0,
      families: root?.querySelectorAll('.pt-manufacturer__families > details').length ?? 0,
      selectedProducts: root?.querySelectorAll('.pt-manufacturer__products article, .pt-guide__products article').length ?? 0,
      comparisonExits: root?.querySelectorAll('.pt-manufacturer__comparison-list > a[href^="/vergleiche/"]').length ?? 0,
      brandExits: root?.querySelectorAll('.pt-manufacturer__comparison-list > a[href^="/vergleiche/"], .pt-manufacturer__comparison-list > a[href^="/hersteller/"]').length ?? 0,
      longformVisible: (() => {
        const longform = root?.querySelector('.pt-guide__longform');
        if (!(longform instanceof HTMLElement)) return false;
        const rect = longform.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && !longform.closest('details:not([open])');
      })(),
      articleVisible: (() => {
        const article = root?.querySelector('.pt-guide__prose');
        if (!(article instanceof HTMLElement)) return false;
        const rect = article.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && !article.closest('details:not([open])');
      })(),
      guideGate: /Vollständigen Ratgeber öffnen|Nur wenn es die Frage beantwortet/i.test(root?.textContent ?? ''),
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      hero: { copy: copyRect, media: mediaRect, overlaps },
      touchTargets: actions.map(element => ({ tag: element.tagName, height: element.getBoundingClientRect().height, width: element.getBoundingClientRect().width })).filter(item => item.height < 44 || item.width < 44),
      canonical: document.querySelector('link[rel="canonical"]')?.href ?? null,
      schema: [...document.querySelectorAll('script[type="application/ld+json"]')].flatMap(script => { try { const value = JSON.parse(script.textContent); return Array.isArray(value) ? value.map(item => item['@type']) : [value['@type']]; } catch { return ['INVALID']; } }),
      faqVisible: document.querySelectorAll('.faq-section details').length,
      text: root?.textContent?.replace(/\\s+/g, ' ').trim() ?? ''
    };
  })())`));
  await prepareOpenPage();
  const opened = JSON.parse(await evaluate(`JSON.stringify((() => {
    const root = document.querySelector('[data-manufacturer-experience], [data-guide-experience]');
    const images = [...(root?.querySelectorAll('img') ?? [])].filter(image => image.alt !== 'Vergrößerte Bildansicht');
    const media = images.map(image => { const r = image.getBoundingClientRect(); return { src: image.currentSrc || image.src, alt: image.alt, complete: image.complete, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight, width: r.width, height: r.height, valid: image.complete && image.naturalWidth > 0 && image.naturalHeight > 0 && r.width > 0 && r.height > 0 }; });
    const scores = [...(root?.querySelectorAll('.pt-score') ?? [])].map(score => { const meter = score.querySelector('[role="meter"]'); const r = score.getBoundingClientRect(); const value = Number(meter?.getAttribute('aria-valuenow')); return { value, width: r.width, height: r.height, valid: Number.isFinite(value) && value >= 0 && value <= 100 && r.width > 0 && r.height > 0 }; });
    const clipped = [...(root?.querySelectorAll('h1, h2, h3, summary, a, b, strong') ?? [])].filter(element => { const style = getComputedStyle(element); return element.getBoundingClientRect().width > 0 && element.scrollWidth > element.clientWidth + 2 && !['auto', 'scroll'].includes(style.overflowX) && style.textOverflow !== 'ellipsis'; }).slice(0, 10).map(element => ({ tag: element.tagName, text: element.textContent.trim().slice(0, 90), clientWidth: element.clientWidth, scrollWidth: element.scrollWidth }));
    const tables = [...(root?.querySelectorAll('table') ?? [])].map(table => { const r = table.getBoundingClientRect(); return { width: r.width, scrollWidth: table.scrollWidth, viewportContained: r.left >= -1 && r.right <= document.documentElement.clientWidth + 1 }; });
    const disclosureOverflow = [...(root?.querySelectorAll('details > summary') ?? [])].filter(summary => summary.scrollWidth > summary.clientWidth + 2).map(summary => summary.textContent.trim().slice(0, 90));
    return { clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth, media, scores, clipped, tables, disclosureOverflow, internalLinks: [...(root?.querySelectorAll('a[href^="/"]') ?? [])].length };
  })())`));

  const failures = [
    !initial.root && "missing-root",
    initial.experience !== "34.3" && "wrong-experience",
    page.expectedKind && initial.guideKind !== page.expectedKind && `guide-kind:${initial.guideKind}`,
    !initial.h1 && "missing-h1",
    page.type === "guide" && !initial.answer && "missing-answer",
    page.type === "guide" && initial.quickItems === 0 && "missing-summary",
    page.type === "guide" && !initial.longformVisible && "longform-hidden",
    page.type === "guide" && !initial.articleVisible && "article-hidden",
    page.type === "guide" && initial.guideGate && "internal-guide-gate",
    page.type === "manufacturer" && initial.startPaths === 0 && "missing-start-paths",
    page.type === "manufacturer" && initial.families === 0 && "missing-families",
    page.type === "manufacturer" && initial.brandExits === 0 && "missing-brand-exit",
    initial.scrollWidth !== initial.clientWidth && "initial-overflow",
    initial.hero.overlaps && "hero-overlap",
    initial.touchTargets.length && "touch-target",
    !keyboardFocus.valid && "focus-state",
    !initial.canonical?.includes(page.route) && "canonical",
    initial.schema.includes("INVALID") && "schema-invalid",
    opened.scrollWidth !== opened.clientWidth && "opened-overflow",
    opened.media.some((image) => !image.valid) && "media",
    opened.scores.some((score) => !score.valid) && "score",
    opened.clipped.length && "clipped-text",
    opened.tables.some((table) => !table.viewportContained) && "table-overflow",
    opened.disclosureOverflow.length && "disclosure-overflow"
  ].filter(Boolean);
  matrix.push({ ...page, width, theme, keyboardFocus, initial: { ...initial, text: undefined, textCharacters: initial.text.length }, opened, valid: failures.length === 0, reason: failures.length ? failures.join(", ") : "pass" });
  if (failures.length) throw new Error(`${page.route} ${width}/${theme}: ${failures.join(', ')} ${JSON.stringify({ initialScroll: [initial.clientWidth, initial.scrollWidth], openedScroll: [opened.clientWidth, opened.scrollWidth], clipped: opened.clipped, tables: opened.tables, disclosureOverflow: opened.disclosureOverflow })}`);
}

for (const representative of representatives) for (const width of [375, 1600]) for (const theme of themes) {
  await setViewport(width, theme);
  await navigate(representative.route);
  await evaluate(`Promise.all([...document.querySelectorAll('main img')].filter(image => image.alt !== 'Vergrößerte Bildansicht' && image.getBoundingClientRect().height > 0).map(async image => { image.loading = 'eager'; try { await image.decode(); } catch {} })).then(() => scrollTo(0, 0))`, true);
  await screenshot(`${representative.type}-${representative.slug}-${width}-${theme}-full.png`);
}

const screenshots = fs.readdirSync(finalRoot).filter((file) => file.endsWith(".png")).sort();
if (screenshots.length !== 8) throw new Error(`Expected exactly eight final screenshots, found ${screenshots.length}.`);
fs.writeFileSync(path.join(reportRoot, "browser-qa.json"), JSON.stringify({
  summary: { routes: routes.length, widths: widths.length, themes: themes.length, combinations: matrix.length, valid: matrix.filter((entry) => entry.valid).length, screenshots: screenshots.length },
  coverage: routes.map(({ route, type, coverage, expectedKind }) => ({ route, type, coverage, expectedKind })),
  fallbackUsage: matrix.filter((entry) => entry.width === 375 && entry.theme === "light").map((entry) => ({ route: entry.route, type: entry.type, guideKind: entry.initial.guideKind, contentMediaCount: entry.opened.media.length, noMediaFallback: entry.opened.media.length === 0 })),
  screenshots,
  matrix
}, null, 2) + "\n");
socket.close();
console.log(`Manufacturer + Guide 34.3 browser QA passed: ${matrix.length} combinations, ${screenshots.length} final screenshots.`);

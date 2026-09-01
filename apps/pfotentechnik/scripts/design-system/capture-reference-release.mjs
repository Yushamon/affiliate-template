#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const endpoint = "http://127.0.0.1:9222/json/list";
const routePart = "/produkt/petlibro-dockstream-rfid-smart/";
const outputDir = path.resolve("reports/design-system/reference-product-33.0.1h");

const pages = await (await fetch(endpoint)).json();
const page = pages.find((item) => item.type === "page" && item.url.includes(routePart));
if (!page) throw new Error(`Keine Debug-Seite für ${routePart} gefunden.`);

const socket = new WebSocket(page.webSocketDebuggerUrl);
const pending = new Map();
let commandId = 0;

socket.onmessage = ({ data }) => {
  const message = JSON.parse(data);
  if (!message.id || !pending.has(message.id)) return;
  pending.get(message.id)(message);
  pending.delete(message.id);
};
await new Promise((resolve, reject) => {
  socket.onopen = resolve;
  socket.onerror = reject;
});

const send = (method, params = {}) => new Promise((resolve) => {
  const id = ++commandId;
  pending.set(id, resolve);
  socket.send(JSON.stringify({ id, method, params }));
});
const evaluate = async (expression, awaitPromise = false) => {
  const result = await send("Runtime.evaluate", { expression, awaitPromise, returnByValue: true });
  if (result.result.exceptionDetails) throw new Error(result.result.exceptionDetails.text);
  return result.result.result.value;
};
const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function warmAllImages() {
  await evaluate(`(async () => {
    document.querySelectorAll("img[loading=lazy]").forEach((image) => { image.loading = "eager"; });
    const steps = Math.ceil(document.documentElement.scrollHeight / Math.max(1, innerHeight));
    for (let step = 0; step <= steps; step += 1) {
      scrollTo(0, Math.min(document.documentElement.scrollHeight, step * innerHeight));
      await new Promise((resolve) => setTimeout(resolve, 140));
    }
    await new Promise((resolve) => setTimeout(resolve, 900));
    await Promise.all([...document.querySelectorAll("[data-product-gallery-v29] img")]
      .map((image) => image.decode().catch(() => {})));
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    scrollTo(0, 0);
  })()`, true);
  await pause(250);
}

async function capture(name, selector) {
  let clip;
  if (selector) {
    clip = JSON.parse(await evaluate(`JSON.stringify((() => {
      const target = document.querySelector(${JSON.stringify(selector)});
      if (!target) throw new Error("Screenshot target missing: ${selector}");
      const rect = target.getBoundingClientRect();
      return { x: 0, y: Math.max(0, rect.top + window.scrollY - 16), width: window.innerWidth, height: window.innerHeight, scale: 1 };
    })())`));
  }
  const result = await send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
    ...(clip ? { clip } : {}),
  });
  fs.writeFileSync(path.join(outputDir, `${name}.png`), Buffer.from(result.result.data, "base64"));
}

fs.mkdirSync(outputDir, { recursive: true });
const allConfigurations = [
  { width: 320, height: 844, mobile: true, label: "320" },
  { width: 360, height: 844, mobile: true, label: "360" },
  { width: 375, height: 844, mobile: true, label: "375" },
  { width: 390, height: 844, mobile: true, label: "390" },
  { width: 430, height: 844, mobile: true, label: "430" },
  { width: 768, height: 1024, mobile: false, label: "768" },
  { width: 820, height: 1024, mobile: false, label: "820" },
  { width: 1024, height: 960, mobile: false, label: "1024" },
  { width: 1280, height: 960, mobile: false, label: "1280" },
  { width: 1440, height: 960, mobile: false, label: "1440" },
];
const requestedViewports = process.env.CAPTURE_VIEWPORTS?.split(",").filter(Boolean);
const configurations = requestedViewports
  ? allConfigurations.filter((viewport) => requestedViewports.includes(viewport.label))
  : allConfigurations;
const themes = ["light", "dark"];
const previousReportPath = path.join(outputDir, "release-gate.json");
const previousReport = requestedViewports && fs.existsSync(previousReportPath)
  ? JSON.parse(fs.readFileSync(previousReportPath, "utf8"))
  : [];
const report = previousReport.filter((item) => !configurations.some((viewport) => viewport.label === item.viewport));
const sectionAxes = {
  hero: { selector: ".px2-hero__meta", classification: "content" },
  decision: { selector: ".verdict", classification: "content" },
  decisionWarning: { selector: ".verdict__tradeoff", classification: "content" },
  decisionLine: { selector: ".verdict__decision-line", classification: "content" },
  productFit: { selector: ".category-fit", classification: "content" },
  decisionFacts: { selector: ".decision-facts", classification: "content" },
  usage: { selector: ".timeline", classification: "content" },
  community: { selector: ".community", classification: "content" },
  strengthsWeaknesses: { selector: ".details", classification: "content" },
  faq: { selector: ".details__faq", classification: "content" },
  evidence: { selector: ".evidence", classification: "content" },
  alternatives: { selector: "#alternativen", classification: "content" },
  transparency: { selector: ".editorial-transparency__facts", classification: "content" },
  nextSteps: { selector: ".pt-next-steps__grid", classification: "content" },
  furtherReading: { selector: ".pt-page--reference33 > .ui-section .ui-grid", classification: "content" },
  gallery: { selector: "[data-product-gallery-v29]", classification: "full-bleed" },
};

for (const viewport of configurations) {
  for (const theme of themes) {
    await send("Emulation.setDeviceMetricsOverride", {
      width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: viewport.mobile,
    });
    await send("Emulation.setEmulatedMedia", { media: "", features: [{ name: "prefers-color-scheme", value: theme }] });
    await send("Page.reload", { ignoreCache: true });
    await pause(700);
    await warmAllImages();
    const gate = await evaluate(`JSON.stringify({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      gallery: (() => { const rect = document.querySelector("[data-product-gallery-v29]")?.getBoundingClientRect(); return rect && { left: rect.left, right: rect.right }; })(),
      galleryImages: [...document.querySelectorAll(".pg29__desktop img")].map((image) => ({ src: image.currentSrc || image.src, complete: image.complete, naturalWidth: image.naturalWidth })),
      alternatives: [...document.querySelectorAll(".alternatives img")].map((image) => ({ complete: image.complete, naturalWidth: image.naturalWidth })),
      nextStepsStyle: (() => { const section = document.querySelector(".pt-next-steps"); const card = section?.querySelector(".pt-next-steps__card"); return section && card && { hasReferenceParent: Boolean(section.closest(".pt-page--reference33")), pt33Surface: getComputedStyle(section).getPropertyValue("--pt33-color-surface-raised").trim(), cardBackground: getComputedStyle(card).backgroundImage, cardColor: getComputedStyle(card).backgroundColor, nextCard: getComputedStyle(section).getPropertyValue("--next-card").trim() }; })(),
      brokenImages: [...document.images].filter((image) => image.complete && !image.naturalWidth && !image.matches("[data-lightbox-image]")).length,
      sections: Object.fromEntries(Object.entries(${JSON.stringify(sectionAxes)}).map(([name, item]) => {
        const rect = document.querySelector(item.selector)?.getBoundingClientRect();
        return [name, rect && { left: rect.left, right: rect.right, width: rect.width, classification: item.classification }];
      })),
    })`);
    const result = { viewport: viewport.label, theme, ...JSON.parse(gate) };
    const axis = result.sections.hero;
    result.geometry = {
      reference: axis ? { left: axis.left, right: axis.right, width: axis.width } : null,
      results: Object.fromEntries(Object.entries(result.sections).map(([name, rect]) => {
        if (!rect) return [name, { result: "MISSING" }];
        if (!viewport.mobile || rect.classification !== "content") return [name, { result: "NOT_APPLICABLE" }];
        const pass = Math.abs(rect.left - axis.left) <= 1 && Math.abs(rect.right - axis.right) <= 1;
        return [name, { result: pass ? "PASS" : "FAIL" }];
      })),
    };
    const geometryFailed = Object.values(result.geometry.results).some((item) => item.result === "FAIL" || item.result === "MISSING");
    const galleryFailed = result.galleryImages.some((image) => !image.complete || !image.naturalWidth);
    if (result.scrollWidth !== result.clientWidth || result.brokenImages || geometryFailed || galleryFailed) {
      throw new Error(`Reference geometry gate failed at ${viewport.label}px ${theme}.`);
    }
    report.push(result);
    await capture(`full-${viewport.label}-${theme}`);
    await capture(`hero-${viewport.label}-${theme}`, ".px2-hero");
    await capture(`alternatives-${viewport.label}-${theme}`, "#alternativen");
    await capture(`faq-${viewport.label}-${theme}`, ".details__faq");
    await capture(`transparency-${viewport.label}-${theme}`, ".editorial-transparency");
    await capture(`further-reading-${viewport.label}-${theme}`, ".pt-page--reference33 > .ui-section");
    await capture(`closing-${viewport.label}-${theme}`, ".editorial-transparency");
    if (["430", "1440"].includes(viewport.label)) {
      await capture(`decision-fit-facts-${theme}`, ".verdict");
      await capture(`community-strengths-${theme}`, ".community");
      await capture(`faq-evidence-${theme}`, ".details__faq");
    }
  }
}

fs.writeFileSync(path.join(outputDir, "release-gate.json"), JSON.stringify(report, null, 2) + "\n");
const geometryRows = report
  .filter((item) => Number(item.viewport) <= 430)
  .flatMap((item) => Object.entries(item.sections).map(([component, rect]) => [
    item.viewport,
    item.theme,
    component,
    rect?.left ?? "–",
    rect?.right ?? "–",
    rect?.width ?? "–",
    rect?.classification ?? "–",
    item.geometry.results[component]?.result ?? "MISSING",
  ]));
const geometryMarkdown = [
  "# Reference Product 33.0.1h – Mobile Geometry Gate",
  "",
  "Die Gallery ist die einzige explizite Full-Bleed-Ausnahme. Alle `content`-Zeilen werden gegen die Hero-Content-Achse mit ±1 px geprüft.",
  "",
  "| Viewport | Theme | Component | Left | Right | Width | Classification | Result |",
  "|---:|---|---|---:|---:|---:|---|---|",
  ...geometryRows.map((row) => `| ${row.join(" | ")} |`),
  "",
].join("\n");
fs.writeFileSync(path.join(outputDir, "mobile-geometry.md"), geometryMarkdown);
socket.close();
console.log(`Screenshots erstellt: ${outputDir}`);

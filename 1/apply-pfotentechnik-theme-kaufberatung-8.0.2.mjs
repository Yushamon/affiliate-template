#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync, spawnSync } from "node:child_process";

const PATCH_NAME = "pfotentechnik-theme-kaufberatung-8.0.2";
const BASELINE_COMMIT = "66f0b597e5b313273dcd1a654dd6f18477f80574";
const ROOT_MARKER = path.join(
  "apps",
  "pfotentechnik",
  "src",
  "layouts",
  "ProjectLayout.astro"
);

const args = process.argv.slice(2);
const runBuild = args.includes("--build");
const explicitRoot = args.find((arg) => !arg.startsWith("--"));

const fail = (message) => {
  console.error(`\n[${PATCH_NAME}] ${message}\n`);
  process.exit(1);
};

const findRepoRoot = (startPath) => {
  let current = path.resolve(startPath);

  while (true) {
    if (fs.existsSync(path.join(current, ROOT_MARKER))) return current;
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
};

const repoRoot = findRepoRoot(explicitRoot ?? process.cwd());
if (!repoRoot) {
  fail(
    "Repository nicht gefunden. Starte den Installer im affiliate-template-Ordner " +
      "oder übergib den Repository-Pfad als erstes Argument."
  );
}

const projectLayoutPath =
  "apps/pfotentechnik/src/layouts/ProjectLayout.astro";

const payload = {
  "apps/pfotentechnik/src/styles/pfotentechnik-theme-fixes.css": "/*\n * PfotenTechnik Theme + Kaufberatung Fix 8.0.2\n * Final correction layer loaded after the consolidated design system.\n */\n\n/* Product Renderer 4.1 uses local light-only variables. Map them to the\n   semantic site tokens so prefers-color-scheme works without a JS theme class. */\n[data-product-page] .native-product {\n  --np-page: var(--pt-theme-canvas) !important;\n  --np-surface: var(--pt-theme-surface) !important;\n  --np-surface-raised: var(--pt-theme-surface) !important;\n  --np-surface-soft: var(--pt-theme-surface-2) !important;\n  --np-surface-muted: var(--pt-theme-surface-3) !important;\n  --np-text: var(--pt-theme-text) !important;\n  --np-text-soft: var(--pt-theme-text-soft) !important;\n  --np-muted: var(--pt-theme-text-muted) !important;\n  --np-border: var(--pt-theme-border) !important;\n  --np-border-strong: var(--pt-theme-border-strong) !important;\n  --np-green: var(--pt-theme-accent) !important;\n  --np-green-strong: var(--pt-theme-accent-hover) !important;\n  --np-green-soft: var(--pt-theme-accent-soft) !important;\n  --np-red: var(--pt-theme-danger) !important;\n  --np-red-soft: var(--pt-theme-danger-soft) !important;\n  --np-amber: var(--pt-theme-warning) !important;\n  --np-shadow-sm: var(--pt-theme-shadow-xs) !important;\n  --np-shadow-md: var(--pt-theme-shadow-sm) !important;\n  --np-shadow-lg: var(--pt-theme-shadow-md) !important;\n\n  width: min(100%, 1180px);\n  margin-inline: auto;\n  color: var(--pt-theme-text-soft);\n}\n\n[data-product-page].pt-product-detail {\n  width: min(100%, 1180px);\n  max-width: 1180px;\n  margin-inline: auto;\n}\n\n[data-product-page] :is(\n  .native-product__intro,\n  .native-gallery__stage,\n  .native-gallery__fallback,\n  .native-buybox,\n  .native-panel,\n  .pt-review-method,\n  .pt-product-links,\n  .pt-everyday-review-grid article\n) {\n  border-color: var(--pt-theme-border) !important;\n  color: var(--pt-theme-text-soft) !important;\n}\n\n[data-product-page] :is(\n  .native-buybox,\n  .native-panel,\n  .pt-review-method,\n  .pt-product-links,\n  .pt-everyday-review-grid article\n) {\n  background: var(--pt-theme-surface) !important;\n  box-shadow: var(--pt-theme-shadow-sm) !important;\n}\n\n[data-product-page] .native-product__intro {\n  background:\n    radial-gradient(\n      circle at 88% 10%,\n      color-mix(in srgb, var(--pt-theme-accent) 12%, transparent),\n      transparent 34%\n    ),\n    linear-gradient(\n      145deg,\n      var(--pt-theme-surface),\n      var(--pt-theme-surface-2)\n    ) !important;\n}\n\n[data-product-page] :is(\n  .native-gallery__stage,\n  .native-gallery__fallback\n) {\n  background: linear-gradient(\n    145deg,\n    var(--pt-theme-surface),\n    var(--pt-theme-surface-2)\n  ) !important;\n}\n\n[data-product-page] .pt-product-health {\n  border-color: color-mix(\n    in srgb,\n    var(--pt-theme-accent) 24%,\n    var(--pt-theme-border)\n  ) !important;\n  background: linear-gradient(\n    145deg,\n    var(--pt-theme-accent-soft),\n    var(--pt-theme-surface) 62%\n  ) !important;\n  color: var(--pt-theme-text-soft) !important;\n  box-shadow: var(--pt-theme-shadow-sm) !important;\n}\n\n[data-product-page] :is(h1, h2, h3, h4, strong, dt) {\n  color: var(--pt-theme-text) !important;\n}\n\n[data-product-page] :is(p, li, dd, small, figcaption) {\n  color: var(--pt-theme-text-soft);\n}\n\n[data-product-page] :is(\n  .native-gallery__thumb,\n  .native-buybox__secondary,\n  .native-quickfacts__card\n) {\n  border-color: var(--pt-theme-border-strong) !important;\n  background: var(--pt-theme-surface-2) !important;\n}\n\n[data-product-page] .native-quickfacts__card--primary {\n  background: linear-gradient(\n    145deg,\n    color-mix(\n      in srgb,\n      var(--pt-theme-accent) 8%,\n      var(--pt-theme-surface-2)\n    ),\n    var(--pt-theme-surface)\n  ) !important;\n}\n\n[data-product-page] .native-product__badge--soft {\n  border-color: color-mix(\n    in srgb,\n    var(--pt-theme-accent) 30%,\n    var(--pt-theme-border)\n  ) !important;\n  background: var(--pt-theme-accent-soft) !important;\n  color: var(--pt-theme-accent-text) !important;\n}\n\n/* Theme-safe header and navigation surfaces. */\n.site-header-v2 {\n  border-bottom-color: var(--pt-theme-divider) !important;\n  background: color-mix(\n    in srgb,\n    var(--pt-theme-overlay) 92%,\n    transparent\n  ) !important;\n}\n\n.main-nav-v2,\n.nav-toggle-button {\n  border-color: var(--pt-theme-border-strong) !important;\n  background: var(--pt-theme-surface) !important;\n  color: var(--pt-theme-text) !important;\n}\n\n/* The shared header still exposes a feeder-specific advisor anchor.\n   SiteRuntimeFixes turns it into the general PfotenTechnik purchase-advice CTA.\n   A separate navigation entry is added only inside the collapsible mobile menu. */\n.header-advisor-link {\n  display: none !important;\n}\n\n.header-advisor-link[data-pt-purchase-advice=\"desktop\"],\n.main-nav-v2 [data-pt-purchase-advice=\"nav\"] {\n  min-height: 42px;\n  align-items: center;\n  justify-content: center;\n  border: 1px solid color-mix(\n    in srgb,\n    var(--pt-theme-accent) 70%,\n    var(--pt-theme-border)\n  ) !important;\n  border-radius: 11px;\n  background: var(--pt-theme-accent) !important;\n  color: var(--pt-theme-text-inverse) !important;\n  box-shadow: 0 10px 24px color-mix(\n    in srgb,\n    var(--pt-theme-accent) 20%,\n    transparent\n  );\n  font-weight: 850;\n  text-decoration: none;\n}\n\n.header-advisor-link[data-pt-purchase-advice=\"desktop\"]:hover,\n.header-advisor-link[data-pt-purchase-advice=\"desktop\"]:focus-visible,\n.main-nav-v2 [data-pt-purchase-advice=\"nav\"]:hover,\n.main-nav-v2 [data-pt-purchase-advice=\"nav\"]:focus-visible {\n  border-color: var(--pt-theme-accent-hover) !important;\n  background: var(--pt-theme-accent-hover) !important;\n  color: var(--pt-theme-text-inverse) !important;\n}\n\n.main-nav-v2 [data-pt-purchase-advice=\"nav\"] {\n  display: none;\n}\n\n@media (min-width: 1100px) {\n  .header-advisor-link[data-pt-purchase-advice=\"desktop\"] {\n    display: inline-flex !important;\n    padding-inline: 16px;\n  }\n}\n\n@media (max-width: 760px) {\n  [data-product-page].pt-product-detail,\n  [data-product-page] .native-product {\n    width: 100%;\n    max-width: 100%;\n  }\n\n  .main-nav-v2 {\n    box-shadow: var(--pt-theme-shadow-menu) !important;\n  }\n\n  .main-nav-v2 [data-pt-purchase-advice=\"nav\"] {\n    display: inline-flex;\n    width: 100%;\n    margin-top: 4px;\n    padding-inline: 16px;\n  }\n}\n",
  "apps/pfotentechnik/src/components/SiteRuntimeFixes.astro": "<script is:inline>\n  (() => {\n    const PURCHASE_ADVICE_HREF = \"/kaufberatung/\";\n    const PURCHASE_ADVICE_LABEL = \"Kaufberatung\";\n\n    const editorialStatuses = new Set([\n      \"editorial review\",\n      \"editorial-review\",\n      \"redaktionelle einordnung\",\n      \"redaktionelle bewertung\",\n      \"redaktionell bewertet\"\n    ]);\n\n    const normalize = (value) =>\n      String(value ?? \"\")\n        .trim()\n        .toLocaleLowerCase(\"de-DE\")\n        .replace(/[_-]+/g, \" \")\n        .replace(/\\s+/g, \" \");\n\n    const ensurePurchaseAdviceCta = () => {\n      const desktopCta = document.querySelector(\".header-advisor-link\");\n\n      if (desktopCta instanceof HTMLAnchorElement) {\n        desktopCta.href = PURCHASE_ADVICE_HREF;\n        desktopCta.textContent = PURCHASE_ADVICE_LABEL;\n        desktopCta.setAttribute(\n          \"aria-label\",\n          \"Allgemeine Kaufberatung öffnen\"\n        );\n        desktopCta.dataset.ptPurchaseAdvice = \"desktop\";\n      }\n\n      const navigation = document.querySelector(\".main-nav-v2\");\n      if (!(navigation instanceof HTMLElement)) return;\n\n      let navCta = navigation.querySelector(\n        '[data-pt-purchase-advice=\"nav\"]'\n      );\n\n      if (!(navCta instanceof HTMLAnchorElement)) {\n        navCta = document.createElement(\"a\");\n        navCta.dataset.ptPurchaseAdvice = \"nav\";\n        navigation.append(navCta);\n      }\n\n      navCta.href = PURCHASE_ADVICE_HREF;\n      navCta.textContent = PURCHASE_ADVICE_LABEL;\n      navCta.setAttribute(\n        \"aria-label\",\n        \"Allgemeine Kaufberatung öffnen\"\n      );\n    };\n\n    const removeGenericEditorialStatus = () => {\n      document\n        .querySelectorAll(\n          \"[data-product-page] .native-buybox__meta > div\"\n        )\n        .forEach((row) => {\n          const label = normalize(row.querySelector(\"dt\")?.textContent);\n          const value = normalize(row.querySelector(\"dd\")?.textContent);\n\n          if (label === \"status\" && editorialStatuses.has(value)) {\n            row.remove();\n          }\n        });\n    };\n\n    const applyFixes = () => {\n      ensurePurchaseAdviceCta();\n      removeGenericEditorialStatus();\n    };\n\n    applyFixes();\n\n    if (!window.__ptSiteRuntimeFixesInstalled) {\n      window.__ptSiteRuntimeFixesInstalled = true;\n      document.addEventListener(\"astro:page-load\", applyFixes);\n    }\n  })();\n</script>\n",
  "apps/pfotentechnik/src/pages/kaufberatung.astro": "---\nimport ProjectLayout from \"../layouts/ProjectLayout.astro\";\n\nconst options = [\n  {\n    eyebrow: \"Geführter Berater verfügbar\",\n    title: \"Futterautomaten\",\n    text:\n      \"Beantworte wenige Fragen zu Tier, Futterart, App, Kamera und Mehrtierhaushalt. Der Berater grenzt die passende Geräteklasse ein.\",\n    primaryLabel: \"Futterautomaten-Berater starten\",\n    primaryHref: \"/berater/futterautomat/\",\n    secondaryLabel: \"Futterautomaten-Ratgeber öffnen\",\n    secondaryHref: \"/smarte-futterautomaten/\"\n  },\n  {\n    eyebrow: \"Vergleiche und Ratgeber\",\n    title: \"Trinkbrunnen\",\n    text:\n      \"Ordne Material, Reinigung, Filterkosten, Lautstärke und die passende Größe für Hund oder Katze ein.\",\n    primaryLabel: \"Trinkbrunnen auswählen\",\n    primaryHref: \"/trinkbrunnen/\",\n    secondaryLabel: \"Alle Vergleiche ansehen\",\n    secondaryHref: \"/vergleiche/\"\n  },\n  {\n    eyebrow: \"Vergleiche und Ratgeber\",\n    title: \"GPS-Tracker\",\n    text:\n      \"Vergleiche Netzabdeckung, Abo-Kosten, Akkulaufzeit, Gewicht und die Eignung für Hund oder Katze.\",\n    primaryLabel: \"GPS-Tracker vergleichen\",\n    primaryHref: \"/gps-tracker/\",\n    secondaryLabel: \"Alle Vergleiche ansehen\",\n    secondaryHref: \"/vergleiche/\"\n  }\n];\n---\n\n<ProjectLayout\n  title=\"Kaufberatung für smarte Haustiertechnik\"\n  description=\"Wähle den passenden Beratungsweg für Futterautomaten, Trinkbrunnen und GPS-Tracker.\"\n  seoTitle=\"Kaufberatung für Haustiertechnik | PfotenTechnik\"\n  seoDescription=\"Geführter Futterautomaten-Berater sowie unabhängige Vergleiche und Ratgeber für Trinkbrunnen und GPS-Tracker.\"\n  canonical=\"/kaufberatung/\"\n  schemaType=\"webpage\"\n>\n  <div class=\"pt-advice-hub\">\n    <header class=\"pt-advice-hero\">\n      <p class=\"pt-advice-eyebrow\">Kaufberatung</p>\n      <h1>Welche Haustiertechnik passt wirklich zu dir?</h1>\n      <p class=\"pt-advice-lead\">\n        Starte beim Produktbereich. Wir führen dich entweder durch einen\n        geführten Berater oder direkt zu den passenden Vergleichen und\n        Ratgebern.\n      </p>\n\n      <div class=\"pt-advice-note\">\n        <strong>Transparent eingeordnet:</strong>\n        Der geführte Schritt-für-Schritt-Berater ist derzeit für\n        Futterautomaten verfügbar. Bei Trinkbrunnen und GPS-Trackern führen\n        wir direkt in die passenden Vergleichs- und Ratgeberbereiche.\n      </div>\n    </header>\n\n    <section\n      class=\"pt-advice-options\"\n      aria-labelledby=\"pt-advice-options-title\"\n    >\n      <div class=\"pt-advice-section-head\">\n        <p class=\"pt-advice-eyebrow\">Produktbereich wählen</p>\n        <h2 id=\"pt-advice-options-title\">\n          Der passende Einstieg ohne Umwege\n        </h2>\n      </div>\n\n      <div class=\"pt-advice-grid\">\n        {\n          options.map((option) => (\n            <article class=\"pt-advice-card\">\n              <span>{option.eyebrow}</span>\n              <h3>{option.title}</h3>\n              <p>{option.text}</p>\n\n              <div class=\"pt-advice-actions\">\n                <a\n                  class=\"pt-advice-primary\"\n                  href={option.primaryHref}\n                >\n                  {option.primaryLabel}\n                </a>\n                <a\n                  class=\"pt-advice-secondary\"\n                  href={option.secondaryHref}\n                >\n                  {option.secondaryLabel}\n                </a>\n              </div>\n            </article>\n          ))\n        }\n      </div>\n    </section>\n\n    <aside class=\"pt-advice-footer\">\n      <div>\n        <p class=\"pt-advice-eyebrow\">Noch offen?</p>\n        <h2>Erst vergleichen, dann entscheiden</h2>\n        <p>\n          Die Vergleichsübersicht bündelt alle bereits eingeordneten\n          Produktkategorien. Dort kannst du nach Tier, Einsatz und Funktion\n          weiter eingrenzen.\n        </p>\n      </div>\n      <a href=\"/vergleiche/\">Zur Vergleichsübersicht</a>\n    </aside>\n  </div>\n</ProjectLayout>\n\n<style>\n  .pt-advice-hub {\n    width: min(100%, 1180px);\n    margin-inline: auto;\n    color: var(--pt-theme-text-soft);\n  }\n\n  .pt-advice-hero {\n    padding: clamp(32px, 6vw, 72px);\n    border: 1px solid var(--pt-theme-border);\n    border-radius: clamp(24px, 4vw, 38px);\n    background:\n      radial-gradient(\n        circle at 90% 8%,\n        color-mix(\n          in srgb,\n          var(--pt-theme-accent) 16%,\n          transparent\n        ),\n        transparent 34%\n      ),\n      linear-gradient(\n        145deg,\n        var(--pt-theme-surface),\n        var(--pt-theme-surface-2)\n      );\n    box-shadow: var(--pt-theme-shadow-md);\n  }\n\n  .pt-advice-eyebrow {\n    margin: 0 0 12px;\n    color: var(--pt-theme-accent);\n    font-size: 0.76rem;\n    font-weight: 900;\n    letter-spacing: 0.12em;\n    text-transform: uppercase;\n  }\n\n  .pt-advice-hero h1 {\n    max-width: 860px;\n    margin: 0;\n    color: var(--pt-theme-text);\n    font-size: clamp(2.6rem, 7vw, 5.5rem);\n    line-height: 0.98;\n    letter-spacing: -0.06em;\n  }\n\n  .pt-advice-lead {\n    max-width: 760px;\n    margin: 24px 0 0;\n    color: var(--pt-theme-text-soft);\n    font-size: clamp(1.05rem, 2.2vw, 1.3rem);\n    line-height: 1.7;\n  }\n\n  .pt-advice-note {\n    max-width: 820px;\n    margin-top: 28px;\n    padding: 16px 18px;\n    border: 1px solid color-mix(\n      in srgb,\n      var(--pt-theme-accent) 28%,\n      var(--pt-theme-border)\n    );\n    border-radius: 16px;\n    background: var(--pt-theme-accent-soft);\n    color: var(--pt-theme-text-soft);\n    line-height: 1.6;\n  }\n\n  .pt-advice-note strong {\n    color: var(--pt-theme-text);\n  }\n\n  .pt-advice-options {\n    margin-top: clamp(64px, 9vw, 112px);\n  }\n\n  .pt-advice-section-head {\n    max-width: 760px;\n    margin-bottom: 28px;\n  }\n\n  .pt-advice-section-head h2,\n  .pt-advice-footer h2 {\n    margin: 0;\n    color: var(--pt-theme-text);\n    font-size: clamp(2rem, 5vw, 3.6rem);\n    line-height: 1.04;\n    letter-spacing: -0.045em;\n  }\n\n  .pt-advice-grid {\n    display: grid;\n    grid-template-columns: repeat(3, minmax(0, 1fr));\n    gap: 18px;\n  }\n\n  .pt-advice-card {\n    display: flex;\n    min-width: 0;\n    min-height: 430px;\n    flex-direction: column;\n    padding: 28px;\n    border: 1px solid var(--pt-theme-border);\n    border-radius: 24px;\n    background: var(--pt-theme-surface);\n    box-shadow: var(--pt-theme-shadow-sm);\n  }\n\n  .pt-advice-card > span {\n    color: var(--pt-theme-accent);\n    font-size: 0.74rem;\n    font-weight: 900;\n    letter-spacing: 0.08em;\n    text-transform: uppercase;\n  }\n\n  .pt-advice-card h3 {\n    margin: 28px 0 12px;\n    color: var(--pt-theme-text);\n    font-size: clamp(1.7rem, 3vw, 2.35rem);\n    line-height: 1.05;\n    letter-spacing: -0.035em;\n  }\n\n  .pt-advice-card p {\n    margin: 0;\n    color: var(--pt-theme-text-muted);\n    line-height: 1.68;\n  }\n\n  .pt-advice-actions {\n    display: grid;\n    gap: 10px;\n    margin-top: auto;\n    padding-top: 28px;\n  }\n\n  .pt-advice-actions a,\n  .pt-advice-footer > a {\n    display: flex;\n    min-height: 50px;\n    align-items: center;\n    justify-content: center;\n    padding: 12px 16px;\n    border-radius: 12px;\n    font-weight: 850;\n    text-align: center;\n    text-decoration: none;\n  }\n\n  .pt-advice-primary,\n  .pt-advice-footer > a {\n    background: var(--pt-theme-accent);\n    color: var(--pt-theme-text-inverse);\n  }\n\n  .pt-advice-primary:hover,\n  .pt-advice-footer > a:hover {\n    background: var(--pt-theme-accent-hover);\n    color: var(--pt-theme-text-inverse);\n  }\n\n  .pt-advice-secondary {\n    border: 1px solid var(--pt-theme-border-strong);\n    background: var(--pt-theme-surface-2);\n    color: var(--pt-theme-text);\n  }\n\n  .pt-advice-footer {\n    display: grid;\n    grid-template-columns: minmax(0, 1fr) auto;\n    gap: 32px;\n    align-items: center;\n    margin-top: clamp(64px, 9vw, 112px);\n    padding: clamp(28px, 5vw, 48px);\n    border: 1px solid var(--pt-theme-border);\n    border-radius: 28px;\n    background: var(--pt-theme-surface-2);\n  }\n\n  .pt-advice-footer p:last-child {\n    max-width: 720px;\n    margin: 16px 0 0;\n    color: var(--pt-theme-text-muted);\n    line-height: 1.7;\n  }\n\n  .pt-advice-footer > a {\n    min-width: 220px;\n  }\n\n  @media (max-width: 900px) {\n    .pt-advice-grid {\n      grid-template-columns: 1fr;\n    }\n\n    .pt-advice-card {\n      min-height: 0;\n    }\n\n    .pt-advice-footer {\n      grid-template-columns: 1fr;\n    }\n\n    .pt-advice-footer > a {\n      width: 100%;\n    }\n  }\n\n  @media (max-width: 560px) {\n    .pt-advice-hero,\n    .pt-advice-card,\n    .pt-advice-footer {\n      padding: 22px;\n      border-radius: 20px;\n    }\n\n    .pt-advice-hero h1 {\n      font-size: clamp(2.4rem, 12vw, 3.5rem);\n    }\n  }\n</style>\n"
};

const newlineOf = (text) => (text.includes("\r\n") ? "\r\n" : "\n");

const addImportsToAstroFrontmatter = (text, imports) => {
  const newline = newlineOf(text);
  const delimiters = [...text.matchAll(/^---[ \t]*$/gm)];

  if (delimiters.length < 2) {
    throw new Error(
      "ProjectLayout.astro besitzt kein vollständiges Astro-Frontmatter."
    );
  }

  const missing = imports.filter((entry) => !text.includes(entry));
  if (missing.length === 0) return text;

  const closingIndex = delimiters[1].index;
  const prefix = text.slice(0, closingIndex);
  const separator = prefix.endsWith(newline) ? "" : newline;
  const block = missing.join(newline) + newline;

  return text.slice(0, closingIndex) + separator + block + text.slice(closingIndex);
};

const addRuntimeComponent = (text) => {
  if (/<SiteRuntimeFixes(?:\s+[^>]*)?\s*\/>/.test(text)) return text;

  const closingTag = "</AffiliateLayout>";
  const closeIndex = text.lastIndexOf(closingTag);
  if (closeIndex === -1) {
    throw new Error(
      "ProjectLayout.astro enthält kein schließendes AffiliateLayout-Element."
    );
  }

  const newline = newlineOf(text);
  const lineStart = text.lastIndexOf(newline, closeIndex - 1) + newline.length;
  const beforeTag = text.slice(lineStart, closeIndex);
  const indentation = beforeTag.match(/^[ \t]*/)?.[0] ?? "";
  const insertion = `${indentation}<SiteRuntimeFixes />${newline}`;

  if (beforeTag.trim() === "") {
    return text.slice(0, lineStart) + insertion + text.slice(lineStart);
  }

  return text.slice(0, closeIndex) + newline + insertion + text.slice(closeIndex);
};

const patchProjectLayout = (source) => {
  let text = source;

  text = addImportsToAstroFrontmatter(text, [
    'import "../styles/pfotentechnik-theme-fixes.css";',
    'import SiteRuntimeFixes from "../components/SiteRuntimeFixes.astro";'
  ]);

  return addRuntimeComponent(text);
};

const original = new Map();
const planned = new Map();

try {
  const projectLayoutAbsolute = path.join(repoRoot, projectLayoutPath);
  if (!fs.existsSync(projectLayoutAbsolute)) {
    throw new Error(`Pflichtdatei fehlt: ${projectLayoutPath}`);
  }

  const projectLayoutSource = fs.readFileSync(
    projectLayoutAbsolute,
    "utf8"
  );
  original.set(projectLayoutPath, projectLayoutSource);
  planned.set(projectLayoutPath, patchProjectLayout(projectLayoutSource));

  for (const [relativePath, content] of Object.entries(payload)) {
    const absolutePath = path.join(repoRoot, relativePath);
    original.set(
      relativePath,
      fs.existsSync(absolutePath)
        ? fs.readFileSync(absolutePath, "utf8")
        : null
    );
    planned.set(relativePath, content);
  }
} catch (error) {
  fail(`Vorprüfung fehlgeschlagen. Es wurde nichts verändert.\n${error.message}`);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(
  repoRoot,
  ".patch-backups",
  `${PATCH_NAME}-${timestamp}`
);
const changed = [];

try {
  for (const [relativePath, nextContent] of planned) {
    const previousContent = original.get(relativePath);
    if (previousContent === nextContent) continue;

    if (previousContent !== null) {
      const backupPath = path.join(backupRoot, relativePath);
      fs.mkdirSync(path.dirname(backupPath), { recursive: true });
      fs.writeFileSync(backupPath, previousContent, "utf8");
    }

    const targetPath = path.join(repoRoot, relativePath);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, nextContent, "utf8");
    changed.push(relativePath);
  }
} catch (error) {
  for (const [relativePath, previousContent] of original) {
    const targetPath = path.join(repoRoot, relativePath);
    if (previousContent === null) {
      if (fs.existsSync(targetPath)) fs.rmSync(targetPath);
    } else {
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.writeFileSync(targetPath, previousContent, "utf8");
    }
  }

  fail(
    `Schreibvorgang fehlgeschlagen und wurde zurückgerollt.\n${error.message}`
  );
}

let currentCommit = null;
try {
  currentCommit = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"]
  }).trim();
} catch {
  // Git ist für die lokale Anwendung nicht erforderlich.
}

console.log(`\n[${PATCH_NAME}] angewendet.`);
console.log(`Repository: ${repoRoot}`);

if (currentCommit && currentCommit !== BASELINE_COMMIT) {
  console.log(
    `Hinweis: Aktueller Commit ${currentCommit.slice(0, 12)} weicht von ` +
      `der geprüften Basis ${BASELINE_COMMIT.slice(0, 12)} ab. ` +
      "Der Installer verwendet keine versionsabhängigen Textanker."
  );
}

if (changed.length === 0) {
  console.log("Keine Änderungen nötig. Der Patch ist bereits vollständig aktiv.");
} else {
  console.log("Geänderte Dateien:");
  changed.forEach((file) => console.log(`  - ${file}`));
  console.log(`Backups: ${backupRoot}`);
}

if (runBuild) {
  console.log("\nStarte npm run build:pfotentechnik ...");
  const result = spawnSync("npm", ["run", "build:pfotentechnik"], {
    cwd: repoRoot,
    stdio: "inherit",
    shell: process.platform === "win32"
  });

  if (result.status !== 0) {
    fail(
      "Patch wurde angewendet, aber der Build ist fehlgeschlagen. " +
        `Die Backups liegen unter ${backupRoot}.`
    );
  }

  console.log("Build erfolgreich.");
} else {
  console.log(
    "\nValidierung: npm run build:pfotentechnik\n" +
      "Optional automatisch: node apply-pfotentechnik-theme-kaufberatung-8.0.2.mjs --build"
  );
}

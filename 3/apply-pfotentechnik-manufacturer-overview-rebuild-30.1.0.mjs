#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const PATCH = "pfotentechnik-manufacturer-overview-rebuild-30.1.0";
const root = process.cwd();

const page = path.join(
  root,
  "apps",
  "pfotentechnik",
  "src",
  "pages",
  "hersteller",
  "[manufacturer].astro"
);

const component = path.join(
  root,
  "apps",
  "pfotentechnik",
  "src",
  "components",
  "manufacturer",
  "ManufacturerOverviewHero.astro"
);

const testFile = path.join(
  root,
  "apps",
  "pfotentechnik",
  "test",
  "manufacturer-overview-rebuild-30.1.0.test.mjs"
);

function fail(message) {
  throw new Error(`[${PATCH}] ${message}`);
}

function backupFile(file, backupRoot) {
  if (!fs.existsSync(file)) return;
  const destination = path.join(backupRoot, path.relative(root, file));
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(file, destination);
}

function removeMarkedStyle(source, startMarker, endMarker) {
  let output = source;

  while (output.includes(startMarker)) {
    const markerIndex = output.indexOf(startMarker);
    const styleStart = output.lastIndexOf("<style", markerIndex);
    const endMarkerIndex = output.indexOf(endMarker, markerIndex);

    if (styleStart === -1 || endMarkerIndex === -1) {
      fail(`Unvollständiger Styleblock: ${startMarker}`);
    }

    const styleEnd = output.indexOf("</style>", endMarkerIndex);
    if (styleEnd === -1) {
      fail(`Schließendes </style> fehlt: ${startMarker}`);
    }

    output =
      output.slice(0, styleStart) +
      output.slice(styleEnd + "</style>".length);
  }

  return output;
}

if (!fs.existsSync(page)) {
  fail(`Erwartete Datei fehlt: ${path.relative(root, page)}`);
}

const componentSource = `---
import type { ImageMetadata } from "astro";
import OptimizedImage from "@affiliate-core/components/OptimizedImage.astro";
import { toEditorialScore } from "@affiliate-core/utils/editorialScore";

interface Props {
  name: string;
  recommendation: string;
  summary: string;
  image: {
    src: ImageMetadata | string;
    alt?: string;
  };
  rating?: number | null;
  website?: string | null;
}

const {
  name,
  recommendation,
  summary,
  image,
  rating,
  website
} = Astro.props;
---

<header class="pt-manufacturer-overview">
  <div class="pt-manufacturer-overview__heading">
    <span class="pt-manufacturer-overview__eyebrow">Unsere Einschätzung</span>
    <h1>{name}</h1>
  </div>

  <div class="pt-manufacturer-overview__visual">
    <OptimizedImage
      src={image.src}
      alt={image.alt ?? name}
      class="pt-manufacturer-overview__image"
      layout="full-width"
      fit="contain"
      priority
    />
  </div>

  <div class="pt-manufacturer-overview__copy">
    <p class="pt-manufacturer-overview__recommendation">{recommendation}</p>
    <p class="pt-manufacturer-overview__summary">{summary}</p>

    {rating && (
      <div class="pt-manufacturer-overview__rating">
        <strong>{toEditorialScore(rating, 5)}</strong>
        <span>Redaktionelle Herstellerbewertung</span>
      </div>
    )}

    {website && (
      <a
        class="pt-manufacturer-overview__website"
        href={website}
        rel="noopener noreferrer"
        target="_blank"
      >
        Herstellerwebsite <span aria-hidden="true">↗</span>
      </a>
    )}
  </div>
</header>

<style>
  .pt-manufacturer-overview {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(20rem, 42%);
    grid-template-areas:
      "heading visual"
      "copy visual";
    gap: 1rem clamp(1.5rem, 4vw, 3rem);
    align-items: center;
    min-width: 0;
    padding: clamp(1.5rem, 4vw, 3rem);
    overflow: hidden;
    border: 1px solid var(--pt-color-border);
    border-radius: clamp(1.25rem, 3vw, 2rem);
    background: var(--pt-color-surface);
  }

  .pt-manufacturer-overview__heading {
    grid-area: heading;
    display: grid;
    align-self: end;
    gap: .75rem;
    min-width: 0;
  }

  .pt-manufacturer-overview__eyebrow {
    color: var(--pt-color-primary);
    font-size: .875rem;
    font-weight: 800;
    letter-spacing: .09em;
    line-height: 1.3;
    text-transform: uppercase;
  }

  h1 {
    margin: 0;
    color: var(--pt-color-text);
    font-size: clamp(2.75rem, 7vw, 5.5rem);
    line-height: .95;
    overflow-wrap: anywhere;
  }

  .pt-manufacturer-overview__visual {
    grid-area: visual;
    display: grid;
    place-items: center;
    align-self: stretch;
    min-width: 0;
    min-height: 24rem;
    overflow: hidden;
    border-radius: 1.25rem;
    background: var(--pt-color-surface-subtle, #f7f8fa);
  }

  .pt-manufacturer-overview__image {
    display: block;
    width: 100%;
    height: 100%;
    max-height: 34rem;
    padding: clamp(.75rem, 2vw, 1.5rem);
    object-fit: contain;
    object-position: center;
  }

  .pt-manufacturer-overview__copy {
    grid-area: copy;
    display: grid;
    align-self: start;
    gap: 1rem;
    min-width: 0;
  }

  .pt-manufacturer-overview__copy p {
    margin: 0;
    max-width: 58ch;
    font-size: clamp(1rem, 1.8vw, 1.125rem);
    line-height: 1.65;
  }

  .pt-manufacturer-overview__recommendation {
    color: var(--pt-color-text);
    font-weight: 750;
  }

  .pt-manufacturer-overview__summary {
    color: var(--pt-color-text-muted);
  }

  .pt-manufacturer-overview__rating {
    display: flex;
    align-items: center;
    gap: .75rem;
    width: fit-content;
    max-width: 100%;
  }

  .pt-manufacturer-overview__rating strong {
    color: var(--pt-color-primary);
    font-size: 1.5rem;
    line-height: 1;
  }

  .pt-manufacturer-overview__rating span {
    color: var(--pt-color-text-muted);
    font-size: .875rem;
  }

  .pt-manufacturer-overview__website {
    width: fit-content;
    color: var(--pt-color-primary);
    font-weight: 800;
    text-decoration: none;
  }

  .pt-manufacturer-overview__website:hover {
    text-decoration: underline;
    text-underline-offset: .2em;
  }

  @media (max-width: 820px) {
    .pt-manufacturer-overview {
      grid-template-columns: minmax(0, 1fr);
      grid-template-areas:
        "heading"
        "visual"
        "copy";
      align-items: start;
      gap: 1.25rem;
      padding: clamp(1.25rem, 5vw, 1.75rem);
    }

    h1 {
      font-size: clamp(2.6rem, 13vw, 4.25rem);
      line-height: .98;
      overflow-wrap: normal;
      word-break: normal;
    }

    .pt-manufacturer-overview__visual {
      width: 100%;
      min-height: 0;
      aspect-ratio: 4 / 3;
    }

    .pt-manufacturer-overview__image {
      max-height: none;
      padding: .75rem;
    }
  }

  @media (max-width: 480px) {
    .pt-manufacturer-overview {
      border-radius: 1.5rem;
    }

    .pt-manufacturer-overview__visual {
      aspect-ratio: 1 / 1;
    }
  }
</style>
`;

const testSource = `import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const root = process.cwd();
const page = path.join(root, "apps/pfotentechnik/src/pages/hersteller/[manufacturer].astro");
const component = path.join(root, "apps/pfotentechnik/src/components/manufacturer/ManufacturerOverviewHero.astro");

test("Herstellerseite nutzt ausschließlich den neuen Overview-Hero", () => {
  const pageSource = fs.readFileSync(page, "utf8");
  assert.match(pageSource, /<ManufacturerOverviewHero/);
  assert.doesNotMatch(pageSource, /<header class="manufacturer-hero"/);
  assert.doesNotMatch(pageSource, /PT manufacturer hero media 4\\.2\\.0/);
  assert.doesNotMatch(pageSource, /PT manufacturer media and score 4\\.3\\.0/);
  assert.doesNotMatch(pageSource, /pfotentechnik-manufacturer-hero-layout-30\\.0\\.[0-9]+/);
});

test("Neuer Hero besitzt eigene, kollisionsfreie CSS-Ownership", () => {
  const source = fs.readFileSync(component, "utf8");
  assert.match(source, /class="pt-manufacturer-overview"/);
  assert.match(source, /class="pt-manufacturer-overview__image"/);
  assert.match(source, /grid-template-areas:[\\s\\S]*"heading"[\\s\\S]*"visual"[\\s\\S]*"copy"/);
  assert.doesNotMatch(source, /!important/);
});
`;

let pageSource = fs.readFileSync(page, "utf8");

if (!pageSource.includes('import ManufacturerOverviewHero from "../../components/manufacturer/ManufacturerOverviewHero.astro";')) {
  const importAnchor = 'import DecisionNextSteps from "../../components/DecisionNextSteps.astro";';

  if (!pageSource.includes(importAnchor)) {
    fail("Import-Anker für ManufacturerOverviewHero wurde nicht gefunden.");
  }

  pageSource = pageSource.replace(
    importAnchor,
    `${importAnchor}\nimport ManufacturerOverviewHero from "../../components/manufacturer/ManufacturerOverviewHero.astro";`
  );
}

const heroStartPattern = /[ \t]*<header\s+class=["']manufacturer-hero["'][^>]*>/;
const heroStartMatch = pageSource.match(heroStartPattern);

if (heroStartMatch) {
  const start = heroStartMatch.index;
  const openEnd = start + heroStartMatch[0].length;
  const close = pageSource.indexOf("</header>", openEnd);

  if (close === -1) {
    fail("Altes Hersteller-Hero-Element besitzt kein schließendes </header>.");
  }

  const replacement = `
    <ManufacturerOverviewHero
      name={manufacturer.name}
      recommendation={manufacturer.recommendation}
      summary={manufacturer.summary}
      image={manufacturer.images.hero}
      rating={manufacturer.rating}
      website={manufacturer.website}
    />`;

  pageSource =
    pageSource.slice(0, start) +
    replacement +
    pageSource.slice(close + "</header>".length);
} else if (!pageSource.includes("<ManufacturerOverviewHero")) {
  fail("Weder altes Hersteller-Hero-Element noch neuer Overview-Hero gefunden.");
}

const oldStyleMarkers = [
  ["/* PT manufacturer hero media 4.2.0 */", "/* End PT manufacturer hero media 4.2.0 */"],
  ["/* PT manufacturer media and score 4.3.0 */", "/* End PT manufacturer media and score 4.3.0 */"],
  ["/* pfotentechnik-manufacturer-hero-layout-30.0.0 */", "/* End pfotentechnik-manufacturer-hero-layout-30.0.0 */"],
  ["/* pfotentechnik-manufacturer-hero-layout-30.0.1 */", "/* End pfotentechnik-manufacturer-hero-layout-30.0.1 */"],
  ["/* pfotentechnik-manufacturer-hero-layout-30.0.2 */", "/* End pfotentechnik-manufacturer-hero-layout-30.0.2 */"]
];

for (const [start, end] of oldStyleMarkers) {
  pageSource = removeMarkedStyle(pageSource, start, end);
}

if (pageSource.includes('<header class="manufacturer-hero"')) {
  fail("Altes Hersteller-Hero-Element blieb erhalten.");
}

if (!pageSource.includes("<ManufacturerOverviewHero")) {
  fail("Neuer ManufacturerOverviewHero wurde nicht eingebaut.");
}

if (!pageSource.includes("<script is:inline>")) {
  fail("Bestehender Score-Normalisierungs-Scriptblock ging verloren.");
}

const backupRoot = path.join(
  root,
  ".patch-backups",
  `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

backupFile(page, backupRoot);
backupFile(component, backupRoot);
backupFile(testFile, backupRoot);

fs.mkdirSync(path.dirname(component), { recursive: true });
fs.mkdirSync(path.dirname(testFile), { recursive: true });

fs.writeFileSync(component, componentSource, "utf8");
fs.writeFileSync(page, pageSource, "utf8");
fs.writeFileSync(testFile, testSource, "utf8");

console.log(`[${PATCH}] Backup: ${path.relative(root, backupRoot)}`);
console.log(`[${PATCH}] Neu: ${path.relative(root, component)}`);
console.log(`[${PATCH}] Geändert: ${path.relative(root, page)}`);
console.log(`[${PATCH}] Neu: ${path.relative(root, testFile)}`);
console.log(`[${PATCH}] Altes Hersteller-Hero-Element und bekannte Legacy-Styles entfernt.`);
console.log(`[${PATCH}] Neuer Hero besitzt isolierte CSS-Ownership.`);

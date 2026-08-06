#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const PATCH = "pfotentechnik-manufacturer-hero-layout-30.0.1";
const root = process.cwd();
const target = path.join(
  root,
  "apps",
  "pfotentechnik",
  "src",
  "pages",
  "hersteller",
  "[manufacturer].astro"
);

function fail(message) {
  throw new Error(`[${PATCH}] ${message}`);
}

function count(source, pattern) {
  return (source.match(pattern) ?? []).length;
}

if (!fs.existsSync(target)) {
  fail(`Erwartete Datei fehlt: ${path.relative(root, target)}`);
}

const original = fs.readFileSync(target, "utf8");
let source = original;

// Bereits vollständig installiert
if (
  source.includes(`/* ${PATCH} */`) &&
  source.includes('class="manufacturer-hero__content"') &&
  source.includes('class="manufacturer-hero__media"')
) {
  console.log(`[${PATCH}] Bereits aktuell: ${path.relative(root, target)}`);
  process.exit(0);
}

/*
 * Markup robust normalisieren.
 * Unterstützt sowohl den Git-Stand mit <div> als auch Zwischenstände,
 * in denen Klassen oder zusätzliche Leerzeichen bereits vorhanden sind.
 */
if (!source.includes('class="manufacturer-hero__content"')) {
  const heroOpenPattern =
    /(<header\s+class=["'][^"']*\bmanufacturer-hero\b[^"']*["'][^>]*>\s*)<div(?:\s+class=["'][^"']*["'])?\s*>/;

  if (!heroOpenPattern.test(source)) {
    fail(
      "Der Inhaltscontainer des Hersteller-Heros wurde im aktuellen Arbeitsstand nicht gefunden. " +
      "Erwartet wird direkt nach <header class=\"manufacturer-hero\"> ein <div>."
    );
  }

  source = source.replace(
    heroOpenPattern,
    '$1<div class="manufacturer-hero__content">'
  );
}

if (!source.includes('class="manufacturer-hero__media"')) {
  const imagePattern =
    /(\n[ \t]*)<OptimizedImage\s+([\s\S]*?src=\{manufacturer\.images\.hero\.src\}[\s\S]*?)\/>/;

  const match = source.match(imagePattern);
  if (!match) {
    fail("Das Hero-Bild mit manufacturer.images.hero.src wurde nicht gefunden.");
  }

  const indent = match[1];
  const imageMarkup = `<OptimizedImage ${match[2]}/>`;
  source = source.replace(
    imagePattern,
    `${indent}<div class="manufacturer-hero__media">${indent}  ${imageMarkup.replace(/\n/g, `${indent}  `)}${indent}</div>`
  );
}

/*
 * Nur die beiden bekannten Legacy-Blöcke entfernen.
 * Der Score-Normalisierungs-Scriptblock bleibt unangetastet.
 */
const legacyBlocks = [
  /<style\s+is:global>\s*\/\*\s*PT manufacturer hero media 4\.2\.0\s*\*\/[\s\S]*?\/\*\s*End PT manufacturer hero media 4\.2\.0\s*\*\/\s*<\/style>\s*/g,
  /<style\s+is:global>\s*\/\*\s*PT manufacturer media and score 4\.3\.0\s*\*\/[\s\S]*?\/\*\s*End PT manufacturer media and score 4\.3\.0\s*\*\/\s*<\/style>\s*/g
];

for (const pattern of legacyBlocks) {
  source = source.replace(pattern, "");
}

const css = `
<style is:global>
/* ${PATCH} */
.manufacturer-detail {
  display: grid;
  gap: clamp(1.5rem, 4vw, 3rem);
  min-width: 0;
}

.manufacturer-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(18rem, 42%);
  grid-template-areas: "content media";
  align-items: center;
  gap: clamp(1.5rem, 4vw, 3rem);
  min-width: 0;
  padding: clamp(1.5rem, 4vw, 3rem);
  overflow: hidden;
  border: 1px solid var(--pt-color-border);
  border-radius: clamp(1.25rem, 3vw, 2rem);
  background: var(--pt-color-surface);
}

.manufacturer-hero__content {
  grid-area: content;
  position: relative;
  z-index: 1;
  display: grid;
  align-content: center;
  gap: 1rem;
  min-width: 0;
}

.manufacturer-hero__content > span {
  color: var(--pt-color-primary);
  font-size: .875rem;
  font-weight: 800;
  letter-spacing: .09em;
  line-height: 1.3;
  text-transform: uppercase;
}

.manufacturer-hero h1 {
  margin: 0;
  max-width: 12ch;
  color: var(--pt-color-text);
  font-size: clamp(2.75rem, 7vw, 5.5rem);
  line-height: .95;
  overflow-wrap: anywhere;
}

.manufacturer-hero p {
  margin: 0;
  max-width: 58ch;
  color: var(--pt-color-text-muted);
  font-size: clamp(1rem, 1.8vw, 1.125rem);
  line-height: 1.65;
}

.manufacturer-hero .recommendation {
  color: var(--pt-color-text);
  font-weight: 700;
}

.manufacturer-hero .rating {
  display: flex;
  align-items: center;
  gap: .75rem;
  width: fit-content;
  max-width: 100%;
}

.manufacturer-hero .rating strong {
  font-size: 1.5rem;
  line-height: 1;
}

.manufacturer-hero .rating span {
  color: var(--pt-color-text-muted);
  font-size: .875rem;
}

.manufacturer-hero .website {
  width: fit-content;
  color: var(--pt-color-primary);
  font-weight: 800;
  text-decoration: none;
}

.manufacturer-hero .website:hover {
  text-decoration: underline;
  text-underline-offset: .2em;
}

.manufacturer-hero__media {
  grid-area: media;
  display: grid;
  place-items: center;
  align-self: stretch;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  border-radius: 1.25rem;
  background: var(--pt-color-surface-subtle, #f7f8fa);
}

.manufacturer-hero__media picture {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  min-height: 22rem;
  padding: clamp(.75rem, 2vw, 1.5rem);
}

.manufacturer-hero__media img {
  display: block;
  width: 100%;
  height: 100%;
  max-height: 34rem;
  margin: 0;
  object-fit: contain;
  object-position: center;
  transform: none;
}

@media (max-width: 820px) {
  .manufacturer-hero {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      "content"
      "media";
    align-items: start;
    gap: 1.25rem;
    padding: clamp(1.25rem, 5vw, 1.75rem);
  }

  .manufacturer-hero h1 {
    max-width: none;
    font-size: clamp(2.6rem, 13vw, 4.25rem);
    line-height: .98;
  }

  .manufacturer-hero__media {
    width: 100%;
    aspect-ratio: 4 / 3;
  }

  .manufacturer-hero__media picture {
    min-height: 0;
    padding: .75rem;
  }

  .manufacturer-hero__media img {
    max-height: none;
  }
}

@media (max-width: 480px) {
  .manufacturer-hero {
    border-radius: 1.5rem;
  }

  .manufacturer-hero__content {
    gap: .8rem;
  }

  .manufacturer-hero__media {
    aspect-ratio: 1 / 1;
  }
}
/* End ${PATCH} */
</style>
`;

const insertionPoint = source.lastIndexOf("</ProjectLayout>");
if (insertionPoint === -1) {
  fail("Schließendes </ProjectLayout> fehlt.");
}

source =
  source.slice(0, insertionPoint).trimEnd() +
  "\n\n" +
  css.trim() +
  "\n" +
  source.slice(insertionPoint);

if (count(source, /class="manufacturer-hero__content"/g) !== 1) {
  fail("Hersteller-Hero enthält nicht genau einen Content-Container.");
}

if (count(source, /class="manufacturer-hero__media"/g) !== 1) {
  fail("Hersteller-Hero enthält nicht genau einen Medien-Container.");
}

if (
  source.includes("PT manufacturer hero media 4.2.0") ||
  source.includes("PT manufacturer media and score 4.3.0")
) {
  fail("Mindestens ein Legacy-CSS-Block blieb erhalten.");
}

if (!source.includes("<script is:inline>")) {
  fail("Der bestehende Inline-Scriptbereich ging unerwartet verloren.");
}

const backupRoot = path.join(
  root,
  ".patch-backups",
  `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);
const backup = path.join(backupRoot, path.relative(root, target));

fs.mkdirSync(path.dirname(backup), { recursive: true });
fs.copyFileSync(target, backup);
fs.writeFileSync(target, source, "utf8");

console.log(`[${PATCH}] Backup: ${path.relative(root, backup)}`);
console.log(`[${PATCH}] Geändert: ${path.relative(root, target)}`);
console.log(`[${PATCH}] Legacy-Hero-CSS entfernt und responsives Layout installiert.`);

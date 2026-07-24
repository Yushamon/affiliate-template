#!/usr/bin/env node
/**
 * PfotenTechnik Manufacturer Hero Height 5.4.0
 *
 * Usage:
 *   node apply-pfotentechnik-manufacturer-hero-height-5.4.0.mjs --check
 *   node apply-pfotentechnik-manufacturer-hero-height-5.4.0.mjs
 */

import fs from "node:fs";
import path from "node:path";

const VERSION = "5.4.0";
const CHECK = process.argv.includes("--check");
const TARGET = "apps/pfotentechnik/src/pages/hersteller/[manufacturer].astro";
const START = "/* manufacturer-hero-height-5.4.0 */";
const END = "/* end manufacturer-hero-height-5.4.0 */";

function findRoot(start = process.cwd()) {
  let current = path.resolve(start);

  while (true) {
    const candidate = path.join(current, TARGET);
    if (fs.existsSync(candidate)) return current;

    const parent = path.dirname(current);
    if (parent === current) {
      throw new Error(
        `Repository-Wurzel nicht gefunden. Erwartet wurde: ${TARGET}`
      );
    }
    current = parent;
  }
}

const root = findRoot();
const targetPath = path.join(root, TARGET);
const source = fs.readFileSync(targetPath, "utf8");

const requiredStructures = [
  '<header class="manufacturer-hero">',
  'manufacturer-hero-redesign-5.3',
  '.manufacturer-hero > :global(img)',
  '</ProjectLayout>',
  '<style>'
];

const missing = requiredStructures.filter((item) => !source.includes(item));
if (missing.length > 0) {
  throw new Error(
    `Unbekannter Repository-Stand. Fehlende Strukturmerkmale: ${missing.join(", ")}`
  );
}

const css = `${START}
  /*
   * Finaler Cascade-Fix gegen die konkurrierenden Media-Patches 4.2, 4.3
   * und das Redesign 5.3. Der Textbereich bleibt unverändert.
   */
  .manufacturer-hero {
    min-height: 0;
  }

  .manufacturer-hero > :global(picture) {
    align-self: center;
    display: grid;
    width: 100%;
    height: clamp(220px, 25vw, 320px) !important;
    min-height: 0 !important;
    max-height: 320px !important;
    aspect-ratio: auto !important;
    place-items: center;
    overflow: hidden;
    padding: clamp(.65rem, 1.6vw, 1rem) !important;
    background: var(--pt-theme-media-surface, #f7f8fa);
  }

  .manufacturer-hero > :global(picture img),
  .manufacturer-hero > :global(img) {
    display: block;
    width: 100% !important;
    height: 100% !important;
    min-height: 0 !important;
    max-height: 100% !important;
    object-fit: contain !important;
    object-position: center !important;
  }

  @media (max-width: 900px) {
    .manufacturer-hero > :global(picture) {
      height: clamp(180px, 36vw, 240px) !important;
      max-height: 240px !important;
    }
  }

  @media (max-width: 640px) {
    .manufacturer-hero > :global(picture) {
      height: clamp(130px, 39vw, 175px) !important;
      max-height: 175px !important;
      padding: .5rem !important;
    }
  }

  @media (max-width: 390px) {
    .manufacturer-hero > :global(picture) {
      height: 140px !important;
      max-height: 140px !important;
    }
  }

  @media (prefers-color-scheme: dark) {
    .manufacturer-hero > :global(picture) {
      border-top-color: var(--pt-theme-border, rgba(226, 232, 240, .13));
      background: var(--pt-theme-media-surface, #f5f7f6);
    }
  }
${END}`;

function removeExistingBlock(text) {
  const start = text.indexOf(START);
  if (start === -1) return text;

  const end = text.indexOf(END, start);
  if (end === -1) {
    throw new Error("Vorhandener 5.4.0-Block ist unvollständig.");
  }

  return (
    text.slice(0, start).trimEnd() +
    "\n" +
    text.slice(end + END.length).trimStart()
  );
}

let next = removeExistingBlock(source);

const finalStyleClose = next.lastIndexOf("</style>");
if (finalStyleClose === -1) {
  throw new Error("Finaler Style-Block wurde nicht gefunden.");
}

next =
  next.slice(0, finalStyleClose).trimEnd() +
  "\n\n" +
  css +
  "\n" +
  next.slice(finalStyleClose);

if (next === source) {
  console.log(`[manufacturer-hero-height-${VERSION}] Bereits installiert.`);
  process.exit(0);
}

console.log(`[manufacturer-hero-height-${VERSION}] Ziel: ${TARGET}`);
console.log(`[manufacturer-hero-height-${VERSION}] Modus: ${CHECK ? "--check" : "installieren"}`);

if (CHECK) {
  console.log("Check erfolgreich. Eine Datei würde geändert.");
  process.exit(0);
}

const backupDir = path.join(
  root,
  ".patch-backups",
  `manufacturer-hero-height-${VERSION}-${Date.now()}`
);
const backupPath = path.join(backupDir, TARGET);

fs.mkdirSync(path.dirname(backupPath), { recursive: true });
fs.copyFileSync(targetPath, backupPath);
fs.writeFileSync(targetPath, next, "utf8");

console.log("Patch erfolgreich installiert.");
console.log(`Backup: ${backupPath}`);
console.log("Jetzt ausführen:");
console.log("  npm run build:pfotentechnik");

#!/usr/bin/env node
/**
 * PfotenTechnik Sticky Bar Product Title 3.2.4
 *
 * Usage:
 *   node apply-pfotentechnik-stickybar-product-title-3.2.4.mjs --check
 *   node apply-pfotentechnik-stickybar-product-title-3.2.4.mjs
 */

import fs from "node:fs";
import path from "node:path";

const VERSION = "3.2.4";
const CHECK = process.argv.includes("--check");
const TARGET =
  "packages/affiliate-core/src/components/comparison/ComparisonStickyBar.astro";

const START = "/* comparison-stickybar-product-title-3.2.4 */";
const END = "/* end comparison-stickybar-product-title-3.2.4 */";

function findRoot(start = process.cwd()) {
  let current = path.resolve(start);

  while (true) {
    if (fs.existsSync(path.join(current, TARGET))) return current;

    const parent = path.dirname(current);
    if (parent === current) {
      throw new Error("Repository-Wurzel nicht gefunden.");
    }

    current = parent;
  }
}

function removeBlock(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  if (start === -1) return source;

  const end = source.indexOf(endMarker, start);
  if (end === -1) {
    throw new Error(`Unvollständiger Patchblock: ${startMarker}`);
  }

  return (
    source.slice(0, start).trimEnd() +
    "\n" +
    source.slice(end + endMarker.length).trimStart()
  );
}

const root = findRoot();
const file = path.join(root, TARGET);
const original = fs.readFileSync(file, "utf8");

for (const required of [
  "comparison-stickybar-mobile-final-3.2.3",
  ".comparison-sticky-bar > div:first-child strong",
  "text-overflow: ellipsis",
  "white-space: nowrap"
]) {
  if (!original.includes(required)) {
    throw new Error(`Unbekannter Repository-Stand. Fehlend: ${required}`);
  }
}

let next = removeBlock(original, START, END);

const css = `
${START}
@media (max-width: 760px) {
  .comparison-sticky-bar > div:first-child {
    align-items: flex-start !important;
  }

  .comparison-sticky-bar > div:first-child strong {
    display: -webkit-box !important;
    max-width: none !important;
    overflow: hidden !important;
    text-overflow: clip !important;
    white-space: normal !important;
    overflow-wrap: anywhere !important;
    -webkit-box-orient: vertical !important;
    -webkit-line-clamp: 2 !important;
  }
}
${END}
`;

const styleClose = next.lastIndexOf("</style>");
if (styleClose === -1) {
  throw new Error("Abschließender Style-Block nicht gefunden.");
}

next =
  next.slice(0, styleClose).trimEnd() +
  "\n\n" +
  css.trim() +
  "\n" +
  next.slice(styleClose);

if (next === original) {
  console.log(`[stickybar-product-title-${VERSION}] Bereits installiert.`);
  process.exit(0);
}

console.log(`[stickybar-product-title-${VERSION}] Ziel: ${TARGET}`);
console.log(
  `[stickybar-product-title-${VERSION}] Modus: ${
    CHECK ? "--check" : "installieren"
  }`
);

if (CHECK) {
  console.log("Check erfolgreich. Eine Datei würde geändert.");
  process.exit(0);
}

const backup = path.join(
  root,
  ".patch-backups",
  `stickybar-product-title-${VERSION}-${Date.now()}`,
  TARGET
);

fs.mkdirSync(path.dirname(backup), { recursive: true });
fs.copyFileSync(file, backup);
fs.writeFileSync(file, next, "utf8");

console.log("Patch erfolgreich installiert.");
console.log(`Backup: ${backup}`);
console.log("Jetzt ausführen:");
console.log("  npm run build:pfotentechnik");

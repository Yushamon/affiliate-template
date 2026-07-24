#!/usr/bin/env node
/**
 * PfotenTechnik Sticky Bar Mobile Final 3.2.3
 *
 * Usage:
 *   node apply-pfotentechnik-stickybar-mobile-final-3.2.3.mjs --check
 *   node apply-pfotentechnik-stickybar-mobile-final-3.2.3.mjs
 */

import fs from "node:fs";
import path from "node:path";

const VERSION = "3.2.3";
const CHECK = process.argv.includes("--check");
const TARGET =
  "packages/affiliate-core/src/components/comparison/ComparisonStickyBar.astro";

const MARKERS = [
  [
    "/* comparison-stickybar-theme-3.2.1 */",
    "/* end comparison-stickybar-theme-3.2.1 */"
  ],
  [
    "/* comparison-stickybar-layout-hotfix-3.2.2 */",
    "/* end comparison-stickybar-layout-hotfix-3.2.2 */"
  ],
  [
    "/* comparison-stickybar-mobile-final-3.2.3 */",
    "/* end comparison-stickybar-mobile-final-3.2.3 */"
  ]
];

function findRoot(start = process.cwd()) {
  let current = path.resolve(start);

  while (true) {
    if (fs.existsSync(path.join(current, TARGET))) {
      return current;
    }

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
  'class="comparison-sticky-bar"',
  "Top-Empfehlung",
  "product.title",
  "price?.url",
  "<style is:global>"
]) {
  if (!original.includes(required)) {
    throw new Error(`Unbekannter Repository-Stand. Fehlend: ${required}`);
  }
}

let next = original;

for (const [start, end] of MARKERS) {
  next = removeBlock(next, start, end);
}

const css = `
/* comparison-stickybar-mobile-final-3.2.3 */
.comparison-sticky-bar {
  position: fixed !important;
  z-index: 90 !important;
  right: max(.75rem, env(safe-area-inset-right)) !important;
  bottom: max(.75rem, env(safe-area-inset-bottom)) !important;
  left: max(.75rem, env(safe-area-inset-left)) !important;

  display: flex !important;
  width: auto !important;
  max-width: 760px !important;
  min-width: 0 !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: .75rem !important;

  margin-inline: auto !important;
  padding: .7rem !important;

  border: 1px solid var(--comparison-line) !important;
  border-radius: 1rem !important;

  color: var(--comparison-text) !important;
  background: var(--comparison-surface) !important;
  box-shadow: 0 14px 38px rgba(20, 32, 26, .16) !important;
  backdrop-filter: blur(14px);
}

.comparison-sticky-bar > div {
  min-width: 0 !important;
}

.comparison-sticky-bar > div:first-child {
  display: grid !important;
  flex: 1 1 auto !important;
  gap: .08rem !important;
  padding-inline: .2rem !important;
}

.comparison-sticky-bar > div:first-child span {
  color: var(--comparison-muted) !important;
  font-size: .68rem !important;
  font-weight: 750 !important;
  line-height: 1.15 !important;
}

.comparison-sticky-bar > div:first-child strong {
  display: block !important;
  min-width: 0 !important;
  overflow: hidden !important;
  color: var(--comparison-text) !important;
  font-size: .92rem !important;
  line-height: 1.25 !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}

.comparison-sticky-bar > div:last-child {
  display: flex !important;
  flex: 0 0 auto !important;
  gap: .5rem !important;
}

.comparison-sticky-bar .comparison-button {
  min-height: 44px !important;
  padding: .68rem .9rem !important;
  white-space: nowrap !important;
}

.comparison-sticky-bar .comparison-button--secondary {
  color: var(--comparison-accent) !important;
  border-color: color-mix(
    in srgb,
    var(--comparison-accent) 38%,
    var(--comparison-line)
  ) !important;
  background: var(--comparison-surface) !important;
}

.comparison-sticky-bar .comparison-button--secondary:hover {
  color: var(--comparison-text) !important;
  background: var(--comparison-surface-soft) !important;
}

@media (max-width: 760px) {
  .comparison-sticky-bar {
    display: grid !important;
    grid-template-columns: minmax(0, 1fr) !important;
    gap: .45rem !important;
    padding: .55rem !important;
    border-radius: .95rem !important;
  }

  .comparison-sticky-bar > div:first-child {
    display: flex !important;
    align-items: baseline !important;
    gap: .4rem !important;
    padding: 0 .15rem !important;
  }

  .comparison-sticky-bar > div:first-child span {
    flex: 0 0 auto !important;
    font-size: .62rem !important;
  }

  .comparison-sticky-bar > div:first-child strong {
    flex: 1 1 auto !important;
    font-size: .78rem !important;
  }

  .comparison-sticky-bar > div:last-child {
    display: grid !important;
    grid-template-columns: minmax(0, .82fr) minmax(0, 1.18fr) !important;
    width: 100% !important;
    gap: .45rem !important;
  }

  .comparison-sticky-bar .comparison-button {
    width: 100% !important;
    min-width: 0 !important;
    min-height: 44px !important;
    padding: .6rem .45rem !important;
    font-size: .78rem !important;
    line-height: 1.15 !important;
    white-space: normal !important;
  }
}

@media (max-width: 360px) {
  .comparison-sticky-bar > div:first-child span {
    display: none !important;
  }

  .comparison-sticky-bar > div:last-child {
    grid-template-columns: minmax(0, 1fr) !important;
  }
}

/*
 * Dark Mode nur bei einem ausdrücklich aktivierten Website-Theme.
 * Kein prefers-color-scheme-Fallback, damit ein dunkles Betriebssystem
 * den hellen Website-Modus nicht überschreibt.
 */
html[data-theme="dark"] .comparison-sticky-bar,
html.dark .comparison-sticky-bar,
body.dark .comparison-sticky-bar,
[data-theme="dark"] .comparison-sticky-bar,
html[data-color-scheme="dark"] .comparison-sticky-bar,
html[data-mode="dark"] .comparison-sticky-bar {
  border-color: var(--comparison-line) !important;
  color: var(--comparison-text) !important;
  background: var(--comparison-surface-raised) !important;
  box-shadow: 0 14px 38px rgba(0, 0, 0, .32) !important;
}
/* end comparison-stickybar-mobile-final-3.2.3 */
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
  console.log(`[stickybar-mobile-final-${VERSION}] Bereits installiert.`);
  process.exit(0);
}

console.log(`[stickybar-mobile-final-${VERSION}] Ziel: ${TARGET}`);
console.log(
  `[stickybar-mobile-final-${VERSION}] Modus: ${
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
  `stickybar-mobile-final-${VERSION}-${Date.now()}`,
  TARGET
);

fs.mkdirSync(path.dirname(backup), { recursive: true });
fs.copyFileSync(file, backup);
fs.writeFileSync(file, next, "utf8");

console.log("Patch erfolgreich installiert.");
console.log(`Backup: ${backup}`);
console.log("Jetzt ausführen:");
console.log("  npm run build:pfotentechnik");

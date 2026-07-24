#!/usr/bin/env node
/**
 * PfotenTechnik Sticky Bar Layout Hotfix 3.2.2
 *
 * Usage:
 *   node apply-pfotentechnik-stickybar-layout-hotfix-3.2.2.mjs --check
 *   node apply-pfotentechnik-stickybar-layout-hotfix-3.2.2.mjs
 */

import fs from "node:fs";
import path from "node:path";

const VERSION = "3.2.2";
const CHECK = process.argv.includes("--check");
const TARGET = "packages/affiliate-core/src/components/comparison/ComparisonStickyBar.astro";
const OLD_START = "/* comparison-stickybar-theme-3.2.1 */";
const OLD_END = "/* end comparison-stickybar-theme-3.2.1 */";
const NEW_START = "/* comparison-stickybar-layout-hotfix-3.2.2 */";
const NEW_END = "/* end comparison-stickybar-layout-hotfix-3.2.2 */";

function findRoot(start = process.cwd()) {
  let current = path.resolve(start);
  while (true) {
    if (fs.existsSync(path.join(current, TARGET))) return current;
    const parent = path.dirname(current);
    if (parent === current) throw new Error("Repository-Wurzel nicht gefunden.");
    current = parent;
  }
}

function removeBlock(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  if (start === -1) return source;
  const end = source.indexOf(endMarker, start);
  if (end === -1) throw new Error(`Unvollständiger Style-Block: ${startMarker}`);
  return source.slice(0, start).trimEnd() + "\n" + source.slice(end + endMarker.length).trimStart();
}

const root = findRoot();
const file = path.join(root, TARGET);
const original = fs.readFileSync(file, "utf8");

for (const required of [
  'class="comparison-sticky-bar"',
  "Top-Empfehlung",
  "comparison-button--secondary",
  "<style is:global>"
]) {
  if (!original.includes(required)) {
    throw new Error(`Unbekannter Repository-Stand. Fehlend: ${required}`);
  }
}

let next = removeBlock(original, OLD_START, OLD_END);
next = removeBlock(next, NEW_START, NEW_END);

const css = `
${NEW_START}
.comparison-sticky-bar {
  position: fixed;
  z-index: 90;
  right: max(.75rem, env(safe-area-inset-right));
  bottom: max(.75rem, env(safe-area-inset-bottom));
  left: max(.75rem, env(safe-area-inset-left));
  display: flex;
  width: auto;
  max-width: 760px;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: .75rem;
  margin-inline: auto;
  padding: .7rem;
  border: 1px solid var(--comparison-line);
  border-radius: 1rem;
  color: var(--comparison-text);
  background: var(--comparison-surface);
  box-shadow: 0 14px 38px rgba(20, 32, 26, .16);
  backdrop-filter: blur(14px);
}

.comparison-sticky-bar > div {
  min-width: 0;
}

.comparison-sticky-bar > div:first-child {
  display: grid;
  flex: 1 1 auto;
  gap: .08rem;
  padding-inline: .2rem;
}

.comparison-sticky-bar > div:first-child span {
  color: var(--comparison-muted);
  font-size: .68rem;
  font-weight: 750;
  line-height: 1.15;
}

.comparison-sticky-bar > div:first-child strong {
  display: block;
  min-width: 0;
  overflow: hidden;
  color: var(--comparison-text);
  font-size: .92rem;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.comparison-sticky-bar > div:last-child {
  display: flex;
  flex: 0 0 auto;
  gap: .5rem;
}

.comparison-sticky-bar .comparison-button {
  min-height: 44px;
  padding: .68rem .9rem;
  white-space: nowrap;
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
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: .55rem;
    padding: .6rem;
  }

  .comparison-sticky-bar > div:first-child {
    display: grid;
    padding-inline: .15rem;
  }

  .comparison-sticky-bar > div:first-child strong {
    max-width: none;
    font-size: .88rem;
  }

  .comparison-sticky-bar > div:last-child {
    display: grid;
    grid-template-columns: minmax(0, .78fr) minmax(0, 1.22fr);
    width: 100%;
  }

  .comparison-sticky-bar .comparison-button {
    width: 100%;
    min-width: 0;
    min-height: 46px;
    padding: .65rem .55rem;
    font-size: .8rem;
    line-height: 1.15;
    white-space: normal;
  }
}

@media (max-width: 360px) {
  .comparison-sticky-bar > div:last-child {
    grid-template-columns: minmax(0, 1fr);
  }
}

html[data-theme="dark"] .comparison-sticky-bar,
html.dark .comparison-sticky-bar,
body.dark .comparison-sticky-bar,
[data-theme="dark"] .comparison-sticky-bar {
  border-color: var(--comparison-line);
  color: var(--comparison-text);
  background: var(--comparison-surface-raised);
  box-shadow: 0 14px 38px rgba(0, 0, 0, .32);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]):not(.light) .comparison-sticky-bar {
    border-color: var(--comparison-line);
    color: var(--comparison-text);
    background: var(--comparison-surface-raised);
    box-shadow: 0 14px 38px rgba(0, 0, 0, .32);
  }
}
${NEW_END}
`;

const styleClose = next.lastIndexOf("</style>");
if (styleClose === -1) throw new Error("Style-Block nicht gefunden.");

next =
  next.slice(0, styleClose).trimEnd() +
  "\n\n" +
  css.trim() +
  "\n" +
  next.slice(styleClose);

if (next === original) {
  console.log(`[stickybar-layout-hotfix-${VERSION}] Bereits installiert.`);
  process.exit(0);
}

console.log(`[stickybar-layout-hotfix-${VERSION}] Ziel: ${TARGET}`);
console.log(`[stickybar-layout-hotfix-${VERSION}] Modus: ${CHECK ? "--check" : "installieren"}`);

if (CHECK) {
  console.log("Check erfolgreich. Eine Datei würde geändert.");
  process.exit(0);
}

const backup = path.join(
  root,
  ".patch-backups",
  `stickybar-layout-hotfix-${VERSION}-${Date.now()}`,
  TARGET
);

fs.mkdirSync(path.dirname(backup), { recursive: true });
fs.copyFileSync(file, backup);
fs.writeFileSync(file, next, "utf8");

console.log("Patch erfolgreich installiert.");
console.log(`Backup: ${backup}`);
console.log("Jetzt ausführen:");
console.log("  npm run build:pfotentechnik");

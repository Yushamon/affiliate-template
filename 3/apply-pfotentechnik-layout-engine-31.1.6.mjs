#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const PATCH = "pfotentechnik-layout-engine-31.1.6";
const scriptFile = fileURLToPath(import.meta.url);

function findRoot(start) {
  let current = path.resolve(start);
  while (true) {
    if (
      fs.existsSync(path.join(current, "package.json")) &&
      fs.existsSync(path.join(current, "apps", "pfotentechnik")) &&
      fs.existsSync(path.join(current, "packages", "affiliate-core"))
    ) return current;
    const parent = path.dirname(current);
    if (parent === current) throw new Error(`[${PATCH}] Repository-Root nicht gefunden.`);
    current = parent;
  }
}

const root = findRoot(process.cwd());
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupDir = path.join(root, ".patch-backups", `${PATCH}-${stamp}`);

const files = {
  css: path.join(root, "packages/affiliate-core/src/components/comparison/comparison-system.css"),
  tokens: path.join(root, "packages/affiliate-core/src/components/comparison/comparison-tokens.css"),
  hero: path.join(root, "packages/affiliate-core/src/components/comparison/ComparisonHero.astro"),
  shell: path.join(root, "packages/affiliate-core/src/components/comparison/ComparisonShell.astro"),
  layout: path.join(root, "packages/affiliate-core/src/styles/page-layout-engine.css"),
  route: path.join(root, "apps/pfotentechnik/src/pages/vergleiche/[comparison].astro"),
  test: path.join(root, "apps/pfotentechnik/test/pfotentechnik-layout-engine-31.1.6.test.mjs")
};

for (const [name, file] of Object.entries(files)) {
  if (name === "test") continue;
  if (!fs.existsSync(file)) throw new Error(`[${PATCH}] Datei fehlt: ${path.relative(root, file)}`);
}

const originals = new Map();
const changed = [];

function read(file) { return fs.readFileSync(file, "utf8"); }
function backup(file) {
  if (originals.has(file)) return;
  const value = fs.existsSync(file) ? fs.readFileSync(file) : null;
  originals.set(file, value);
  if (value === null) return;
  const target = path.join(backupDir, path.relative(root, file));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, value);
}
function write(file, content) {
  const previous = fs.existsSync(file) ? read(file) : "";
  const next = previous.includes("\r\n") ? content.replace(/\r?\n/g, "\r\n") : content.replace(/\r\n/g, "\n");
  if (previous === next) return;
  backup(file);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, next, "utf8");
  changed.push(path.relative(root, file));
}
function rollback() {
  for (const [file, value] of [...originals.entries()].reverse()) {
    if (value === null) fs.rmSync(file, { force: true });
    else {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, value);
    }
  }
}
function run(command, args) {
  console.log(`[${PATCH}] ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`[${PATCH}] Befehl fehlgeschlagen: ${command} ${args.join(" ")}`);
}

function findMatchingBrace(source, openIndex) {
  let depth = 1;
  let quote = "";
  let comment = false;

  for (let i = openIndex + 1; i < source.length; i++) {
    const c = source[i];
    const n = source[i + 1];

    if (comment) {
      if (c === "*" && n === "/") {
        comment = false;
        i++;
      }
      continue;
    }

    if (!quote && c === "/" && n === "*") {
      comment = true;
      i++;
      continue;
    }

    if (quote) {
      if (c === "\\") {
        i++;
        continue;
      }
      if (c === quote) quote = "";
      continue;
    }

    if (c === '"' || c === "'") {
      quote = c;
      continue;
    }

    if (c === "{") depth++;
    if (c === "}") depth--;

    if (depth === 0) return i;
  }

  return -1;
}

function cleanCssRange(source, predicate) {
  let result = "";
  let cursor = 0;

  while (cursor < source.length) {
    const open = source.indexOf("{", cursor);
    if (open < 0) {
      result += source.slice(cursor);
      break;
    }

    const close = findMatchingBrace(source, open);
    if (close < 0) {
      result += source.slice(cursor);
      break;
    }

    let selectorStart = open - 1;
    while (selectorStart >= cursor && source[selectorStart] !== "}" && source[selectorStart] !== ";") {
      selectorStart--;
    }
    selectorStart++;

    result += source.slice(cursor, selectorStart);

    const selector = source.slice(selectorStart, open).trim();
    const body = source.slice(open + 1, close);

    if (/^@(?:media|supports|layer|container)/i.test(selector)) {
      const cleanedBody = cleanCssRange(body, predicate);
      if (cleanedBody.trim()) {
        result += `${source.slice(selectorStart, open + 1)}${cleanedBody}}`;
      }
    } else if (!predicate(selector)) {
      result += source.slice(selectorStart, close + 1);
    }

    cursor = close + 1;
  }

  return result;
}

function removeBlocks(source, predicate) {
  return cleanCssRange(source, predicate);
}


function purgeFlatRules(source, selectorPattern) {
  const rulePattern = /(^|\n)([^\n{}]*?(?:\n[^\n{}]*?)*?)\{([^{}]*)\}/g;
  let previous = "";
  let next = source;

  while (next !== previous) {
    previous = next;
    next = next.replace(rulePattern, (whole, prefix, selector, body) => {
      if (!selectorPattern.test(selector)) return whole;
      selectorPattern.lastIndex = 0;
      return prefix;
    });
  }

  return next;
}

function isLegacyHeroSelector(selector) {
  return selector.split(",").some((part) => {
    const value = part.trim();
    return /\\.comparison-hero(?=\\s|__|--)/.test(value);
  });
}

function isComparisonThemeOverride(selector) {
  return /(?:\\.theme-dark\\b|\\.dark\\b|\\[data-theme[^\\]]*\\])/.test(selector) &&
    /\\.comparison-/.test(selector);
}

function purgeLegacyComparisonRules(source) {
  let next = source;
  let previous = "";

  while (next !== previous) {
    previous = next;

    next = next.replace(/([^{}]+)\\{([^{}]*)\\}/g, (whole, selector) => {
      if (isLegacyHeroSelector(selector)) return "";
      if (isComparisonThemeOverride(selector)) return "";
      return whole;
    });

    next = next.replace(
      /@(?:media|supports|layer|container)[^{]*\\{\\s*\\}/g,
      ""
    );
  }

  return next;
}

const canonicalCss = `
/* Layout Engine 31.1.6: current rendered comparison cover */
.comparison-cover {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(280px, 0.95fr);
  grid-template-areas:
    "copy media"
    "facts media"
    "filters filters";
  gap: clamp(1.25rem, 3vw, 2.5rem);
  overflow: hidden;
  padding: clamp(1.25rem, 3vw, 2.5rem);
  border: 1px solid var(--pt-color-border);
  border-radius: var(--pt-radius-xl, 1.5rem);
  color: var(--pt-color-text);
  background: var(--pt-color-surface);
  box-shadow: var(--pt-shadow-card, 0 14px 38px rgb(0 0 0 / 0.08));
}

.comparison-cover__copy {
  grid-area: copy;
  align-self: end;
  min-width: 0;
  padding: 0;
}

.comparison-cover__eyebrow {
  display: inline-flex;
  margin: 0 0 0.75rem;
  color: var(--pt-color-text-muted);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.comparison-cover__copy h1 {
  max-width: 16ch;
  margin: 0;
  color: var(--pt-color-text);
  font-size: clamp(2.25rem, 5vw, 4.75rem);
  line-height: 1;
  letter-spacing: -0.05em;
  text-wrap: balance;
}

.comparison-cover__copy > p {
  max-width: 62ch;
  margin: 1rem 0 0;
  color: var(--pt-color-text-muted);
  font-size: clamp(1rem, 1.4vw, 1.15rem);
  line-height: 1.65;
}

.comparison-cover__media {
  grid-area: media;
  min-width: 0;
  min-height: clamp(320px, 38vw, 520px);
  overflow: hidden;
  border: 1px solid var(--pt-color-border);
  border-radius: var(--pt-radius-lg, 1rem);
  background: var(--pt-color-surface-soft);
}

.comparison-cover__media picture,
.comparison-cover__media .comparison-cover__image {
  display: block;
  width: 100%;
  height: 100%;
}

.comparison-cover__media img {
  display: block;
  width: 100%;
  height: 100%;
  max-width: none;
  object-fit: cover;
  object-position: center;
}

.comparison-cover__facts {
  grid-area: facts;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
  margin: 0;
}

.comparison-cover__fact {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.75rem;
  padding: 0.9rem;
  border: 1px solid var(--pt-color-border);
  border-radius: var(--pt-radius-md, 0.75rem);
  color: var(--pt-color-text);
  background: var(--pt-color-surface-raised);
}

.comparison-cover__fact dt {
  color: var(--pt-color-text);
  font-size: 0.82rem;
  font-weight: 800;
}

.comparison-cover__fact dd {
  margin: 0.15rem 0 0;
  color: var(--pt-color-text-muted);
  font-size: 0.78rem;
}

.comparison-cover > .comparison-hero-filters,
.comparison-cover > [data-comparison-filters] {
  grid-area: filters;
}

.recommendation-card,
.comparison-fit-card,
.comparison-table-wrap,
.comparison-verdict,
.comparison-sticky-bar {
  border-color: var(--pt-color-border);
  color: var(--pt-color-text);
  background: var(--pt-color-surface);
}

.recommendation-card__image-link,
.comparison-placeholder,
.comparison-table thead th {
  background: var(--pt-color-surface-soft);
}

.comparison-table th,
.comparison-table td {
  border-color: var(--pt-color-border);
}

.comparison-table tbody th,
.comparison-table tbody td {
  color: var(--pt-color-text);
  background: var(--pt-color-surface);
}

.comparison-button {
  border-color: var(--pt-color-action-bg);
  color: var(--pt-color-action-text);
  background: var(--pt-color-action-bg);
}

.comparison-button:hover {
  background: var(--pt-color-action-bg-hover);
}

.comparison-button--secondary {
  border-color: var(--pt-color-border);
  color: var(--pt-color-text);
  background: var(--pt-color-surface);
}

@media (max-width: 759px) {
  .comparison-cover {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      "copy"
      "media"
      "facts"
      "filters";
    gap: 1rem;
    padding: 1rem;
    border-radius: var(--pt-radius-lg, 1rem);
  }

  .comparison-cover__copy h1 {
    max-width: none;
    font-size: clamp(2rem, 10vw, 3rem);
  }

  .comparison-cover__media {
    min-height: 260px;
  }

  .comparison-cover__facts {
    grid-template-columns: minmax(0, 1fr);
  }
}
`;

function migrateCss(source) {
  let next = source;

  next = removeBlocks(next, (selector) => {
    const normalized = selector.replace(/\s+/g, " ");
    return /\.comparison-hero(?:\b|__|-)/.test(normalized) ||
      /\.comparison-cover(?:\b|__|-)/.test(normalized);
  });

  next = removeBlocks(next, (selector) => {
    const normalized = selector.replace(/\s+/g, " ");
    return /(?:\.theme-dark\b|\.dark\b|\[data-theme[^\]]*\])/.test(normalized) &&
      /\.comparison-/.test(normalized);
  });

  const fixed = [
    [/#fff(?:fff)?\b/gi, "var(--pt-color-surface)"],
    [/#16302b|#18743b|#0f5d2d|#e5f5e8/gi, "var(--pt-color-surface)"]
  ];
  for (const [pattern, replacement] of fixed) next = next.replace(pattern, replacement);

  next = next.replace(
    /\/\*\s*Layout Engine 31\.1: current rendered comparison cover\s*\*\/[\s\S]*$/m,
    ""
  );

  next = purgeLegacyComparisonRules(next);

  return `${next.trim()}\n\n${canonicalCss.trim()}\n`;
}

function migrateHero(source) {
  let next = source
    .replace(/data-comparison-cover=(?:"[^"]*"|'[^']*')/, 'data-comparison-cover="31.1.6"')
    .replace(/<header\s+class=(["'])comparison-cover\1/, '<header class="comparison-cover" data-layout-engine="31.1.6"');
  if (!/data-layout-engine="31\.1\.6"/.test(next)) {
    next = next.replace(
      /<header\s+class=(["'])comparison-cover\1/,
      '<header class="comparison-cover" data-layout-engine="31.1.6"'
    );
  }
  next = next.replace(/\s+data-layout-engine="31\.1\.6"\s+data-layout-engine="31\.1\.6"/g, ' data-layout-engine="31.1.6"');
  return next;
}

const testSource = `import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..", "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const css = read("packages/affiliate-core/src/components/comparison/comparison-system.css");
const hero = read("packages/affiliate-core/src/components/comparison/ComparisonHero.astro");
const layout = read("packages/affiliate-core/src/styles/page-layout-engine.css");
const route = read("apps/pfotentechnik/src/pages/vergleiche/[comparison].astro");

test("Tests prüfen den aktuell gerenderten Cover-DOM", () => {
  assert.match(hero, /class="comparison-cover"/);
  assert.match(hero, /comparison-cover__copy/);
  assert.match(hero, /comparison-cover__media/);
  assert.match(hero, /comparison-cover__facts/);
  assert.match(hero, /data-layout-engine="31\\.1\\.6"/);
});

test("sichtbarer Cover verwendet globale Layout- und Theme-Tokens", () => {
  assert.match(css, /\\.comparison-cover\\s*\\{[\\s\\S]*grid-template-columns:/);
  assert.match(css, /\\.comparison-cover\\s*\\{[\\s\\S]*background:\\s*var\\(--pt-color-surface\\)/);
  assert.match(css, /\\.comparison-cover\\s*\\{[\\s\\S]*border:\\s*1px solid var\\(--pt-color-border\\)/);
  assert.match(css, /\\.comparison-cover__copy h1\\s*\\{[\\s\\S]*color:\\s*var\\(--pt-color-text\\)/);
  assert.match(css, /\\.comparison-cover__copy\\s*>\\s*p\\s*\\{[\\s\\S]*color:\\s*var\\(--pt-color-text-muted\\)/);
});

test("mobile Cover hat 16px Innenabstand und einspaltige Struktur", () => {
  assert.match(css, /@media\\s*\\(max-width:\\s*759px\\)[\\s\\S]*\\.comparison-cover\\s*\\{[\\s\\S]*grid-template-columns:\\s*minmax\\(0,\\s*1fr\\)/);
  assert.match(css, /@media\\s*\\(max-width:\\s*759px\\)[\\s\\S]*\\.comparison-cover\\s*\\{[\\s\\S]*padding:\\s*1rem/);
  assert.match(layout, /--pt-page-gutter:\\s*16px/);
});

test("tote Hero-Basis und alte Hero-Elemente wurden entfernt", () => {
  const selectors = [...css.matchAll(/([^{}]+)\\{[^{}]*\\}/g)].map((match) => match[1].trim());
  const legacySelectors = selectors.filter((selector) =>
    selector.split(",").some((part) =>
      /\\.comparison-hero(?=\\s|__|--)/.test(part.trim())
    )
  );
  assert.deepEqual(legacySelectors, []);
  assert.match(css, /\\.comparison-hero-filters/);
});

test("sichtbare Cards und Tabellen verwenden globale Tokens", () => {
  assert.match(css, /\\.recommendation-card[\\s\\S]*background:\\s*var\\(--pt-color-surface\\)/);
  assert.match(css, /\\.comparison-table thead th[\\s\\S]*background:\\s*var\\(--pt-color-surface-soft\\)/);
  assert.match(css, /\\.comparison-button[\\s\\S]*color:\\s*var\\(--pt-color-action-text\\)/);
});

test("keine Vergleichs-Theme-Sonderselektoren", () => {
  for (const block of css.matchAll(/([^{}]+)\\{[^{}]*\\}/g)) {
    const selector = block[1];
    if (/\\.comparison-/.test(selector)) {
      assert.doesNotMatch(selector, /\\.theme-dark\\b|\\.dark\\b|\\[data-theme/);
    }
  }
});

test("Vergleichsroute bleibt am gemeinsamen Layout-Owner", () => {
  assert.match(route, /mainClass="container--page"/);
  assert.match(route, /class="pt-page pt-page--comparison"/);
});
`;

try {
  write(files.css, migrateCss(read(files.css)));
  write(files.hero, migrateHero(read(files.hero)));
  write(files.test, testSource);

  run(process.execPath, ["--check", scriptFile]);
  run(process.execPath, ["--check", files.test]);
  run(process.execPath, ["--test", files.test]);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "lint:content"]);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "build"]);

  const dist = path.join(root, "apps", "pfotentechnik", "dist", "vergleiche");
  if (fs.existsSync(dist)) {
    const htmlFiles = [];
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.isFile() && entry.name === "index.html") htmlFiles.push(full);
      }
    };
    walk(dist);
    const sample = htmlFiles.find((file) => read(file).includes("comparison-cover"));
    if (!sample) throw new Error(`[${PATCH}] Build-HTML enthält keinen gerenderten comparison-cover.`);
    const html = read(sample);
    if (!html.includes('data-layout-engine="31.1.6"')) {
      throw new Error(`[${PATCH}] Build-HTML enthält nicht die aktuelle Layout-Engine.`);
    }
  }

  console.log(`[${PATCH}] Backup: ${path.relative(root, backupDir)}`);
  console.log(`[${PATCH}] Geändert: ${changed.length}`);
  changed.forEach((file) => console.log(`- ${file}`));
  console.log(`[${PATCH}] Erfolgreich abgeschlossen.`);
} catch (error) {
  rollback();
  console.error(`[${PATCH}] Fehler. Änderungen wurden zurückgerollt.`);
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
}

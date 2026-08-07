#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-comparison-desktop-polish-recovery-32.4.1";

function findRoot(start) {
  let dir = path.resolve(start);
  for (let i = 0; i < 10; i++) {
    if (
      fs.existsSync(path.join(dir, "package.json")) &&
      fs.existsSync(path.join(dir, "apps", "pfotentechnik", "package.json"))
    ) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`[${PATCH}] Repository-Root nicht gefunden.`);
}

const root = findRoot(process.cwd());
const cssFile = path.join(root, "packages", "affiliate-core", "src", "components", "comparison", "comparison-experience.css");
const heroFile = path.join(root, "packages", "affiliate-core", "src", "components", "comparison", "ComparisonHero.astro");
const priceFile = path.join(root, "packages", "affiliate-core", "src", "components", "comparison", "ComparisonPriceSignal.astro");
const shellFile = path.join(root, "packages", "affiliate-core", "src", "components", "comparison", "ComparisonShell.astro");
const testFile = path.join(root, "apps", "pfotentechnik", "test", "pfotentechnik-comparison-desktop-polish-recovery-32.4.1.test.mjs");

for (const file of [cssFile, heroFile, priceFile, shellFile]) {
  if (!fs.existsSync(file)) throw new Error(`[${PATCH}] Datei fehlt: ${path.relative(root, file)}`);
}

function backup(file) {
  const bak = `${file}.${PATCH}.bak`;
  if (!fs.existsSync(bak)) fs.copyFileSync(file, bak);
}

function replaceOnce(source, before, after, label) {
  if (source.includes(after)) return source;
  if (!source.includes(before)) throw new Error(`[${PATCH}] Marker nicht gefunden: ${label}`);
  return source.replace(before, after);
}

let hero = fs.readFileSync(heroFile, "utf8");
hero = replaceOnce(
  hero,
  `const visibleFacts = [
  productFact ? { label: \`${"${productFact.value}"} Modelle\`, value: "im Vergleich", icon: "box" } : { label: \`${"${productCount}"} Modelle\`, value: "im Vergleich", icon: "box" },
  { label: "Redaktionell", value: "bewertet", icon: "check" },
  dateFact ? { label: "Datenstand", value: dateFact.value, icon: "calendar" } : null
].filter(Boolean);`,
  `const visibleFacts = [
  productFact ? { label: \`${"${productFact.value}"} Modelle\`, value: "im Vergleich", icon: "box", glyph: "▦" } : { label: \`${"${productCount}"} Modelle\`, value: "im Vergleich", icon: "box", glyph: "▦" },
  { label: "Redaktionell", value: "bewertet", icon: "check", glyph: "✓" },
  dateFact ? { label: "Datenstand", value: dateFact.value, icon: "calendar", glyph: "◷" } : null
].filter(Boolean);`,
  "visibleFacts"
);
hero = replaceOnce(
  hero,
  `<span class={\`comparison-cover__fact-icon comparison-cover__fact-icon--${"${fact.icon}"}\`} aria-hidden="true"></span>`,
  `<span class={\`comparison-cover__fact-icon comparison-cover__fact-icon--${"${fact.icon}"}\`} aria-hidden="true">{fact.glyph}</span>`,
  "Fact-Icon-Markup"
);
backup(heroFile);
fs.writeFileSync(heroFile, hero, "utf8");

let price = fs.readFileSync(priceFile, "utf8");
price = replaceOnce(
  price,
  `  .comparison-price-signal--standard {
    padding: 1rem 0 .25rem;
  }

  .comparison-price-signal--standard .comparison-price-signal__amount {
    font-size: clamp(1.65rem, 5vw, 2rem);
    letter-spacing: -.025em;
  }`,
  `  .comparison-price-signal--standard {
    grid-template-columns: minmax(0, 1fr);
    gap: .35rem;
    padding: 1rem 0 .25rem;
  }

  .comparison-price-signal--standard .comparison-price-signal__label {
    display: block;
    max-width: none;
  }

  .comparison-price-signal--standard .comparison-price-signal__amount {
    display: block;
    max-width: 100%;
    overflow-wrap: anywhere;
    font-size: clamp(1.65rem, 3.25vw, 2rem);
    letter-spacing: -.025em;
    line-height: 1.08;
    text-align: left;
    white-space: normal;
  }`,
  "Standard-Preis"
);
backup(priceFile);
fs.writeFileSync(priceFile, price, "utf8");

let css = fs.readFileSync(cssFile, "utf8");
const marker = "/* Comparison Experience 32.4.0 desktop polish */";

if (!css.includes(marker)) {
  backup(cssFile);
  css += `

${marker}

@media (min-width: 48rem) {
  .comparison-cover-filters {
    grid-column: 1 / -1;
    width: 100%;
    padding: 1rem;
  }

  .comparison-cover-filters__grid {
    grid-template-columns: repeat(4, minmax(10rem, 1fr));
    gap: 1rem;
  }

  .comparison-cover-filter {
    display: grid;
    min-width: 0;
    gap: .45rem;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
  }

  .comparison-cover-filter__label {
    display: block;
    min-width: 0;
    overflow: visible;
    color: var(--pt-color-text-muted);
    font-size: .78rem;
    font-weight: 800;
    line-height: 1.25;
    white-space: normal;
  }

  .comparison-cover-filter__control {
    display: block;
    width: 100%;
    min-width: 0;
  }

  .comparison-cover-filter__select {
    width: 100%;
    min-width: 0;
    min-height: 48px;
    padding-inline: .875rem 2.5rem;
    text-overflow: ellipsis;
  }

  .comparison-cover-filters__actions {
    margin-top: .125rem;
  }

  .comparison-editorial-recommendation__body {
    grid-template-columns:
      minmax(15rem, .92fr)
      minmax(22rem, 1.35fr)
      minmax(15.5rem, .72fr);
    gap: clamp(1.25rem, 2.25vw, 2rem);
  }

  .comparison-editorial-recommendation__decision {
    min-width: 0;
  }

  .comparison-editorial-recommendation__copy h2 {
    overflow-wrap: anywhere;
  }
}

.pt-page--comparison .comparison-content {
  width: 100%;
  min-width: 0;
  max-width: 90rem;
  margin-inline: auto;
  color: var(--pt-color-text-muted);
  font-size: clamp(1rem, .96rem + .18vw, 1.125rem);
  line-height: 1.65;
}

.pt-page--comparison .comparison-content > :first-child {
  margin-top: 0;
}

.pt-page--comparison .comparison-content :where(h2, h3, h4) {
  max-width: 24ch;
  color: var(--pt-color-text);
  line-height: 1.08;
  letter-spacing: -.035em;
  text-wrap: balance;
}

.pt-page--comparison .comparison-content h2 {
  margin: clamp(2.75rem, 6vw, 4.75rem) 0 1rem;
  font-size: clamp(2rem, 4vw, 3.7rem);
}

.pt-page--comparison .comparison-content h3 {
  margin: clamp(2rem, 4vw, 3rem) 0 .75rem;
  font-size: clamp(1.45rem, 2.4vw, 2.25rem);
}

.pt-page--comparison .comparison-content :where(p, ul, ol, table) {
  margin-block: 0 1rem;
}

.pt-page--comparison .comparison-content :where(p, li) {
  max-width: 78ch;
}

.pt-page--comparison .comparison-content :where(ul, ol) {
  padding-left: 1.4rem;
}

.pt-page--comparison .comparison-content li + li {
  margin-top: .35rem;
}

.pt-page--comparison .comparison-content table {
  width: 100%;
  margin-top: 1.25rem;
  border-collapse: separate;
  border-spacing: 0;
  overflow: hidden;
  border: 1px solid var(--pt-color-border);
  border-radius: var(--pt-radius-lg, 1rem);
  background: var(--pt-color-surface);
}

.pt-page--comparison .comparison-content :where(th, td) {
  padding: .75rem .875rem;
  border-bottom: 1px solid var(--pt-color-border);
  vertical-align: top;
  text-align: left;
}

.pt-page--comparison .comparison-content th {
  color: var(--pt-color-text);
  background: var(--pt-color-surface-raised);
  font-weight: 800;
}

.pt-page--comparison .comparison-content tr:last-child td {
  border-bottom: 0;
}

@media (max-width: 47.99rem) {
  .pt-page--comparison .comparison-content h2 {
    font-size: clamp(1.9rem, 10vw, 2.75rem);
  }

  .pt-page--comparison .comparison-content table {
    display: block;
    max-width: 100%;
    overflow-x: auto;
  }
}
`;
  fs.writeFileSync(cssFile, css, "utf8");
}

let shell = fs.readFileSync(shellFile, "utf8");
if (shell.includes('data-comparison-experience="32.0.2"')) {
  backup(shellFile);
  shell = shell.replace('data-comparison-experience="32.0.2"', 'data-comparison-experience="32.4.0"');
  fs.writeFileSync(shellFile, shell, "utf8");
}

const test = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..", "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

const css = read("packages/affiliate-core/src/components/comparison/comparison-experience.css");
const hero = read("packages/affiliate-core/src/components/comparison/ComparisonHero.astro");
const price = read("packages/affiliate-core/src/components/comparison/ComparisonPriceSignal.astro");
const shell = read("packages/affiliate-core/src/components/comparison/ComparisonShell.astro");

test("Hero-Facts besitzen sichtbare Icons", () => {
  assert.match(hero, /glyph: "▦"/);
  assert.match(hero, /glyph: "✓"/);
  assert.match(hero, />\\{fact\\.glyph\\}<\\/span>/);
});

test("Desktop-Filter nutzt volle Hero-Breite", () => {
  assert.match(css, /grid-column:\\s*1 \\/ -1/);
  assert.match(css, /repeat\\(4, minmax\\(10rem, 1fr\\)\\)/);
});

test("Standardpreis ist kollisionsfrei vertikal", () => {
  assert.match(price, /grid-template-columns:\\s*minmax\\(0, 1fr\\)/);
  assert.match(price, /white-space:\\s*normal/);
  assert.match(price, /text-align:\\s*left/);
});

test("Vergleichscontent besitzt eigenen Editorial-Rhythmus", () => {
  assert.match(css, /\\.pt-page--comparison \\.comparison-content h2/);
  assert.match(css, /\\.pt-page--comparison \\.comparison-content table/);
});

test("Patch führt keine important-Regeln ein", () => {
  const section = css.split("/* Comparison Experience 32.4.0 desktop polish */")[1] ?? "";
  assert.doesNotMatch(section, /!important/);
});

test("Shell markiert Experience 32.4.0", () => {
  assert.match(shell, /data-comparison-experience="32\\.4\\.0"/);
});
`;

fs.writeFileSync(testFile, test, "utf8");

function run(command, args) {
  console.log(`[${PATCH}] ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32"
  });
  if (result.status !== 0) throw new Error(`[${PATCH}] Prüfung fehlgeschlagen: ${command} ${args.join(" ")}`);
}

run(process.execPath, ["--test", testFile]);

console.log(`[${PATCH}] Recovery erfolgreich. Bereits angewendete 32.4.0-Änderungen wurden idempotent übernommen.`);
console.log(`[${PATCH}] Danach: npm --workspace apps/pfotentechnik run build`);

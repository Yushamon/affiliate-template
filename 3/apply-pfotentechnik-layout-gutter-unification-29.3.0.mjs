#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-layout-gutter-unification-29.3.0";
const root = process.cwd();

const files = {
  layout: path.join(root, "packages/affiliate-core/src/styles/layout.css"),
  productRoute: path.join(root, "apps/pfotentechnik/src/pages/produkt/[product].astro"),
  comparisonRoute: path.join(root, "apps/pfotentechnik/src/pages/vergleiche/[comparison].astro"),
  comparisonCss: path.join(root, "packages/affiliate-core/src/components/comparison/comparison-system.css"),
  experience: path.join(root, "apps/pfotentechnik/src/components/product-experience-2/ProductExperience2.astro"),
  hero: path.join(root, "apps/pfotentechnik/src/components/product-experience-2/ProductHero2.astro"),
  test: path.join(root, "apps/pfotentechnik/test/layout-gutter-unification-29.3.0.test.mjs"),
};

for (const [label, file] of Object.entries(files)) {
  if (label === "test") continue;
  if (!fs.existsSync(file)) throw new Error(`[${PATCH}] Erwartete Datei fehlt: ${path.relative(root, file)}`);
}

const original = new Map();
for (const file of Object.values(files)) {
  if (fs.existsSync(file)) original.set(file, fs.readFileSync(file, "utf8"));
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupDir = path.join(root, ".patch-backups", `${PATCH}-${stamp}`);
fs.mkdirSync(backupDir, { recursive: true });
for (const [file, content] of original) {
  const rel = path.relative(root, file);
  const target = path.join(backupDir, rel);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}
console.log(`[${PATCH}] Backup: ${path.relative(root, backupDir)}`);

function write(file, content) {
  const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  if (current === content) {
    console.log(`[${PATCH}] Bereits aktuell: ${path.relative(root, file)}`);
    return;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  console.log(`[${PATCH}] Geändert: ${path.relative(root, file)}`);
}

function removeBalancedRule(source, selector) {
  let cursor = 0;
  while (true) {
    const start = source.indexOf(selector, cursor);
    if (start < 0) break;
    const open = source.indexOf("{", start + selector.length);
    if (open < 0) break;
    const between = source.slice(start + selector.length, open).trim();
    if (between && !between.startsWith(",")) {
      cursor = open + 1;
      continue;
    }
    let depth = 0;
    let end = -1;
    for (let i = open; i < source.length; i++) {
      if (source[i] === "{") depth++;
      else if (source[i] === "}") {
        depth--;
        if (depth === 0) { end = i + 1; break; }
      }
    }
    if (end < 0) throw new Error(`[${PATCH}] CSS-Regel nicht balanciert: ${selector}`);
    source = source.slice(0, start) + source.slice(end);
    cursor = start;
  }
  return source;
}

function normalize(source) {
  return source.replace(/\n{4,}/g, "\n\n\n").trimEnd() + "\n";
}

function ensureMainClass(source, value) {
  if (/mainClass\s*=\s*["'][^"']+["']/.test(source)) {
    return source.replace(/mainClass\s*=\s*["'][^"']+["']/, `mainClass="${value}"`);
  }
  const marker = /(\n\s*author=\{[^}]+\}\s*\n|\n\s*updatedAt=\{[^}]+\}\s*\n)/;
  const match = source.match(marker);
  if (!match) throw new Error(`[${PATCH}] ProjectLayout-Anker für mainClass fehlt.`);
  return source.replace(match[0], `${match[0]}  mainClass="${value}"\n`);
}

let layout = fs.readFileSync(files.layout, "utf8");
layout = layout.replace(/\.container\s*\{[\s\S]*?\n\}/, `.container {
  --pt-page-gutter: 12px;
  --pt-container-gutter: 24px;
  width: 100%;
  min-width: 0;
  max-width: 1200px;
  margin: 0 auto;
  padding: 70px var(--pt-container-gutter);
}`);
layout = removeBalancedRule(layout, ".container.container--product");
layout = removeBalancedRule(layout, ".container--product");
if (!layout.includes(".container.container--immersive")) {
  layout += `\n/* Gemeinsamer Seiten-Gutter und generischer immersiver Layout-Owner. */
@media (max-width: 768px) {
  .container {
    --pt-container-gutter: var(--pt-page-gutter);
    padding-inline: var(--pt-container-gutter);
  }

  .container.container--immersive {
    width: 100%;
    max-width: none;
    margin: 0;
    padding: 0 0 calc(64px + env(safe-area-inset-bottom));
  }
}
`;
}
write(files.layout, normalize(layout));

write(files.productRoute, ensureMainClass(fs.readFileSync(files.productRoute, "utf8"), "container--immersive"));
write(files.comparisonRoute, ensureMainClass(fs.readFileSync(files.comparisonRoute, "utf8"), "container--immersive"));

let comparisonCss = fs.readFileSync(files.comparisonCss, "utf8");
comparisonCss = comparisonCss.replace(/\.comparison-detail\s*\{\s*--comparison-readable-width:[\s\S]*?\}/, `.comparison-detail {
  --comparison-readable-width: 76rem;
  padding-inline: var(--pt-page-gutter, 12px);
}`);
comparisonCss = comparisonCss.replace(/\.comparison-detail\s*>\s*\.comparison-content,\s*\n?\.comparison-detail\s*>\s*#faq\s*\{[\s\S]*?\}/, `.comparison-detail > .comparison-content,
.comparison-detail > #faq {
  width: min(100%, var(--comparison-readable-width));
  margin-inline: auto;
}`);
write(files.comparisonCss, comparisonCss);

for (const file of [files.experience, files.hero]) {
  let source = fs.readFileSync(file, "utf8");
  source = source
    .replace(/margin-inline:\s*12px\s*;/g, "margin-inline: var(--pt-page-gutter, 12px);")
    .replace(/padding-inline:\s*12px\s*;/g, "padding-inline: var(--pt-page-gutter, 12px);");
  write(file, source);
}

const test = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read = (file) => fs.readFileSync(new URL(file, import.meta.url), "utf8");
const layout = read("../../../packages/affiliate-core/src/styles/layout.css");
const productRoute = read("../src/pages/produkt/[product].astro");
const comparisonRoute = read("../src/pages/vergleiche/[comparison].astro");
const comparisonCss = read("../../../packages/affiliate-core/src/components/comparison/comparison-system.css");
const experience = read("../src/components/product-experience-2/ProductExperience2.astro");
const hero = read("../src/components/product-experience-2/ProductHero2.astro");

test("Produkt und Vergleich verwenden denselben generischen Layout-Owner", () => {
  assert.match(productRoute, /mainClass="container--immersive"/);
  assert.match(comparisonRoute, /mainClass="container--immersive"/);
  assert.doesNotMatch(layout, /container--product/);
});

test("globaler mobiler Seitengutter ist definiert", () => {
  assert.match(layout, /--pt-page-gutter:\\s*12px/);
  assert.match(layout, /\\.container\\.container--immersive/);
});

test("Vergleich besitzt keinen doppelten Außenabstand", () => {
  assert.match(comparisonCss, /padding-inline:\\s*var\\(--pt-page-gutter, 12px\\)/);
  assert.match(comparisonCss, /width:\\s*min\\(100%, var\\(--comparison-readable-width\\)\\)/);
  assert.doesNotMatch(comparisonCss, /--comparison-page-gutter/);
});

test("Produktinhalte konsumieren den globalen Gutter", () => {
  assert.match(experience + hero, /var\\(--pt-page-gutter, 12px\\)/);
});

test("Galerie bleibt vom Seitengutter entkoppelt", () => {
  assert.doesNotMatch(hero, /px2-hero__media[^}]*margin-inline:\\s*var\\(--pt-page-gutter/s);
  assert.doesNotMatch(hero, /px2-hero__media[^}]*padding-inline:\\s*var\\(--pt-page-gutter/s);
});
`;
write(files.test, test);

function run(label, command, args) {
  console.log(`[${PATCH}] Prüfe: ${label}`);
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: false });
  if (result.status !== 0) throw new Error(`[${PATCH}] ${label} fehlgeschlagen (Exit ${result.status}).`);
  console.log(`[${PATCH}] BESTANDEN: ${label}`);
}

try {
  run("Syntaxprüfung des Tests", process.execPath, ["--check", path.relative(root, files.test)]);
  run("Layout-Gutter-Test", process.execPath, ["--test", path.relative(root, files.test)]);
  run("Astro-Build", "npm", ["--workspace", "apps/pfotentechnik", "run", "build"]);
  console.log(`[${PATCH}] Abgeschlossen.`);
  console.log(`[${PATCH}] Produktgalerie bleibt mobil randlos.`);
  console.log(`[${PATCH}] Produkt- und Vergleichsinhalte verwenden denselben 12px-Gutter.`);
} catch (error) {
  for (const [file, content] of original) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  }
  if (!original.has(files.test) && fs.existsSync(files.test)) fs.rmSync(files.test);
  console.error(`[${PATCH}] FEHLER: ${error.message}`);
  console.error(`[${PATCH}] Änderungen wurden zurückgerollt.`);
  process.exit(1);
}

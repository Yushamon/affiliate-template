#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-product-mobile-layout-closure-28.3.0";
const log = (m) => console.log(`[${PATCH}] ${m}`);

function findRoot(start) {
  let current = path.resolve(start);
  for (let i = 0; i < 16; i += 1) {
    if (fs.existsSync(path.join(current, "apps", "pfotentechnik", "package.json"))) return current;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}

function read(file) {
  return fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
}

function write(file, content, repo) {
  const next = content.replace(/\r\n/g, "\n").replace(/\s+$/u, "") + "\n";
  const current = fs.existsSync(file) ? read(file) : "";
  if (current === next) return log(`Bereits aktuell: ${path.relative(repo, file)}`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, next, "utf8");
  log(`Geändert: ${path.relative(repo, file)}`);
}

function replaceOnce(source, before, after, label) {
  const count = source.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: ${count} Treffer statt 1.`);
  return source.replace(before, after);
}

function styleRange(source, label) {
  const starts = [...source.matchAll(/<style>/g)];
  const ends = [...source.matchAll(/<\/style>/g)];
  if (starts.length !== 1 || ends.length !== 1) {
    throw new Error(`${label}: genau ein Style-Block erwartet.`);
  }
  return { start: starts[0].index, end: ends[0].index + 8 };
}

function replaceStyle(source, label, css) {
  const r = styleRange(source, label);
  return source.slice(0, r.start) + `<style>\n${css.trim()}\n</style>` + source.slice(r.end);
}

function findBlockEnd(source, brace) {
  let depth = 0;
  for (let i = brace; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    if (source[i] === "}") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  throw new Error("CSS-Block nicht geschlossen.");
}

function removeRule(source, selector, max = 1) {
  const matches = [];
  let cursor = 0;
  while (cursor < source.length) {
    const index = source.indexOf(selector, cursor);
    if (index < 0) break;
    let brace = index + selector.length;
    while (/\s/.test(source[brace] || "")) brace += 1;
    if (source[brace] === "{") {
      const end = findBlockEnd(source, brace);
      matches.push({ start: index, end: end + 1 });
      cursor = end + 1;
    } else {
      cursor = index + selector.length;
    }
  }
  if (matches.length > max) throw new Error(`${selector}: ${matches.length} Regeln gefunden.`);
  let next = source;
  for (const match of matches.reverse()) {
    next = next.slice(0, match.start) + next.slice(match.end);
  }
  return next;
}

function run(command, args, label, cwd) {
  log(`Prüfe: ${label}`);
  const executable = process.platform === "win32" && command === "npm" ? "npm.cmd" : command;
  const result = spawnSync(executable, args, { cwd, stdio: "inherit", shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} fehlgeschlagen (Exit ${result.status}).`);
  log(`BESTANDEN: ${label}`);
}

const REPO = findRoot(process.cwd());
const APP = path.join(REPO, "apps", "pfotentechnik");
const files = {
  layout: path.join(REPO, "packages/affiliate-core/src/layouts/AffiliateLayout.astro"),
  layoutCss: path.join(REPO, "packages/affiliate-core/src/styles/layout.css"),
  route: path.join(APP, "src/pages/produkt/[product].astro"),
  renderer: path.join(APP, "src/components/product-standard-2/ProductRenderer.astro"),
  experience: path.join(APP, "src/components/product-experience-2/ProductExperience2.astro"),
  hero: path.join(APP, "src/components/product-experience-2/ProductHero2.astro"),
  premium: path.join(APP, "src/styles/pfotentechnik-product-mobile-premium.css"),
  test: path.join(APP, "test/product-mobile-layout-closure-28.3.0.test.mjs"),
};

for (const file of Object.values(files).slice(0, 7)) {
  if (!fs.existsSync(file)) throw new Error(`Datei fehlt: ${path.relative(REPO, file)}`);
  const source = read(file);
  if (/^(<<<<<<<|=======|>>>>>>>)/m.test(source)) throw new Error(`Git-Konfliktmarker: ${path.relative(REPO, file)}`);
}

let layout = read(files.layout);
let layoutCss = read(files.layoutCss);
let route = read(files.route);
let renderer = read(files.renderer);
let experience = read(files.experience);
let hero = read(files.hero);
let premium = read(files.premium);

if (!layout.includes("mainClass?: string;")) {
  layout = replaceOnce(
    layout,
    "  breadcrumbs?: BreadcrumbItem[];\n",
    "  breadcrumbs?: BreadcrumbItem[];\n  mainClass?: string;\n",
    "AffiliateLayout Props",
  );
}
if (!layout.includes("  mainClass\n} = Astro.props;")) {
  layout = replaceOnce(
    layout,
    "  headerLinks = projectConfig.headerLinks,\n  breadcrumbs\n} = Astro.props;",
    "  headerLinks = projectConfig.headerLinks,\n  breadcrumbs,\n  mainClass\n} = Astro.props;",
    "AffiliateLayout Destructuring",
  );
}
layout = replaceOnce(
  layout,
  '<main class:list={["container", isHome && "container--home"]}>',
  '<main class:list={["container", isHome && "container--home", mainClass]}>',
  "AffiliateLayout Main",
);

if (!layoutCss.includes(".container--product")) {
  layoutCss = layoutCss.replace(
    /\.container\s*\{[\s\S]*?\}\n/,
    (match) => `${match}\n.container--product {\n  max-width: 1200px;\n  padding: 70px 24px;\n}\n`,
  );
  layoutCss = layoutCss.replace(
    /@media \(max-width: 768px\) \{\n/,
    `@media (max-width: 768px) {\n  .container--product {\n    max-width: none;\n    padding: 0 12px calc(64px + env(safe-area-inset-bottom));\n  }\n\n`,
  );
}

if (!route.includes('mainClass="container--product"')) {
  route = replaceOnce(
    route,
    '  schemaType="webpage"\n',
    '  schemaType="webpage"\n  mainClass="container--product"\n',
    "Produkt-Route mainClass",
  );
}

renderer = renderer.replace(
  /<div class="px2-route-layout-owner">\s*<ProductExperience2 model=\{model\} \/>\s*<\/div>\s*<style>[\s\S]*?<\/style>/,
  "<ProductExperience2 model={model} />",
);
if (!renderer.includes("<ProductExperience2 model={model} />")) {
  throw new Error("ProductRenderer-Zielstruktur fehlt.");
}

experience = replaceStyle(
  experience,
  "ProductExperience2",
  `
  .px2 {
    --px2-surface: var(--pt-color-surface);
    --px2-surface-soft: var(--pt-color-surface-soft);
    --px2-surface-raised: var(--pt-color-surface-raised);
    --px2-text: var(--pt-color-text);
    --px2-muted: var(--pt-color-text-muted);
    --px2-border: var(--pt-color-border);
    --px2-action-bg: var(--pt-color-action-bg);
    --px2-action-bg-hover: var(--pt-color-action-bg-hover);
    --px2-action-text: var(--pt-color-action-text);
    --px2-accent-text: var(--pt-color-accent-text);
    --px2-green: var(--px2-action-bg);
    --px2-green-strong: var(--px2-action-bg);
    --px2-green-soft: var(--pt-color-success-soft);
    --px2-amber: var(--pt-color-warning-500);
    --px2-amber-soft: var(--pt-color-warning-soft);
    --px2-red: var(--pt-color-danger-600);
    --px2-red-soft: var(--pt-color-danger-soft);
    --px2-indigo: var(--pt-color-accent-600);
    --px2-shadow: var(--pt-shadow-sm);
    --px2-on-accent: var(--px2-action-text);
    display: grid;
    gap: clamp(24px, 4vw, 46px);
    width: 100%;
    min-width: 0;
    margin: 0;
    padding: 0;
    color: var(--px2-text);
  }

  .px2 :global(*) {
    box-sizing: border-box;
  }
  `,
);

const heroRange = styleRange(hero, "ProductHero2");
let heroCss = hero.slice(heroRange.start + 7, heroRange.end - 8);
heroCss = removeRule(heroCss, ".px2-hero__media[data-mobile-gallery-full-bleed]", 2);
heroCss += `

  @media (max-width: 759px) {
    .px2-hero__media[data-mobile-gallery-full-bleed] {
      width: calc(100% + 24px);
      max-width: none;
      margin: 0 -12px;
    }
  }
`;
hero = replaceStyle(hero, "ProductHero2", heroCss);

premium = removeRule(premium, "main.container:has([data-product-page])", 1);
premium = premium.replace(
  /main\.container:has\(\[data-product-page\]\)\s*>\s*\[data-product-page\]\s*,\s*/g,
  "",
);

const test = `import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
const read = (p) => fs.readFileSync(path.join(process.cwd(), p), "utf8");
const layout = read("../../packages/affiliate-core/src/layouts/AffiliateLayout.astro");
const layoutCss = read("../../packages/affiliate-core/src/styles/layout.css");
const route = read("src/pages/produkt/[product].astro");
const renderer = read("src/components/product-standard-2/ProductRenderer.astro");
const experience = read("src/components/product-experience-2/ProductExperience2.astro");
const hero = read("src/components/product-experience-2/ProductHero2.astro");
const premium = read("src/styles/pfotentechnik-product-mobile-premium.css");

test("offizieller Produktcontainer", () => {
  assert.match(layout, /mainClass\\?: string/);
  assert.match(layout, /mainClass\\]\\}/);
  assert.match(route, /mainClass="container--product"/);
  assert.match(layoutCss, /\\.container--product/);
  assert.match(layoutCss, /padding:\\s*0 12px calc\\(64px \\+ env\\(safe-area-inset-bottom\\)\\)/);
});
test("kein Renderer-Layout-Hack", () => {
  assert.doesNotMatch(renderer, /px2-route-layout-owner|main\\.container/);
});
test("kein zweiter Experience-Gutter", () => {
  assert.match(experience, /padding:\\s*0/);
  assert.doesNotMatch(experience, /padding:\\s*70px 24px|max-width:\\s*1200px/);
});
test("Galerie bricht exakt um 12px aus", () => {
  assert.match(hero, /width:\\s*calc\\(100%\\s*\\+\\s*24px\\)/);
  assert.match(hero, /margin:\\s*0\\s+-12px/);
  assert.doesNotMatch(hero, /48px|-24px|100d?vw|left:\\s*50%|translateX/);
});
test("alte Produkt-Container-Regel entfernt", () => {
  assert.doesNotMatch(premium, /main\\.container:has\\(\\[data-product-page\\]\\)/);
});
`;

const backup = path.join(REPO, ".patch-backups", `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`);
const targets = Object.values(files);
fs.mkdirSync(backup, { recursive: true });
for (const file of targets) {
  if (!fs.existsSync(file)) continue;
  const dest = path.join(backup, path.relative(REPO, file));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(file, dest);
}
log(`Backup: ${path.relative(REPO, backup)}`);

const rollback = () => {
  for (const file of targets) {
    const saved = path.join(backup, path.relative(REPO, file));
    if (fs.existsSync(saved)) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.copyFileSync(saved, file);
    } else if (file === files.test && fs.existsSync(file)) {
      fs.rmSync(file, { force: true });
    }
  }
};

try {
  write(files.layout, layout, REPO);
  write(files.layoutCss, layoutCss, REPO);
  write(files.route, route, REPO);
  write(files.renderer, renderer, REPO);
  write(files.experience, experience, REPO);
  write(files.hero, hero, REPO);
  write(files.premium, premium, REPO);
  write(files.test, test, REPO);

  run(process.execPath, ["--check", path.relative(APP, files.test)], "Syntaxprüfung", APP);
  run(process.execPath, ["--test", path.relative(APP, files.test)], "Produkt-Mobile-Layout-Test", APP);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "lint:content"], "Content-Lint", REPO);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "build"], "Astro-Build", REPO);

  log("BESTANDEN: Galerie randlos, normale Inhalte mit 12px Gutter.");
  log("BESTANDEN: doppelte Container- und Experience-Abstände entfernt.");
  log("Abgeschlossen.");
} catch (error) {
  rollback();
  log(`FEHLER: ${error instanceof Error ? error.message : String(error)}`);
  log("Änderungen wurden zurückgerollt.");
  process.exitCode = 1;
}

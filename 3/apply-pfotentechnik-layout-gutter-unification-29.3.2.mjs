#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-layout-gutter-unification-29.3.2";
const log = (message) => console.log(`[${PATCH}] ${message}`);

function findRoot(start) {
  let current = path.resolve(start);
  for (let depth = 0; depth < 16; depth += 1) {
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

function normalizeBlankLines(source) {
  return source
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trimEnd() + "\n";
}

function write(file, content, repo) {
  const next = normalizeBlankLines(content);
  const current = fs.existsSync(file) ? read(file) : "";
  if (current === next) {
    log(`Bereits aktuell: ${path.relative(repo, file)}`);
    return false;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, next, "utf8");
  log(`Geändert: ${path.relative(repo, file)}`);
  return true;
}

function findMatchingBrace(source, openIndex) {
  let depth = 0;
  let quote = "";
  let escaped = false;
  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index];

    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = "";
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }

    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  throw new Error("Nicht geschlossene CSS-Klammer gefunden.");
}

function replaceRuleBody(source, selector, transform, { required = true } = {}) {
  let cursor = 0;
  let matches = 0;
  let output = source;

  while (true) {
    const selectorIndex = output.indexOf(selector, cursor);
    if (selectorIndex < 0) break;

    const openIndex = output.indexOf("{", selectorIndex + selector.length);
    if (openIndex < 0) break;

    const prefix = output.slice(selectorIndex + selector.length, openIndex).trim();
    if (prefix && !prefix.startsWith(",")) {
      cursor = openIndex + 1;
      continue;
    }

    const closeIndex = findMatchingBrace(output, openIndex);
    const body = output.slice(openIndex + 1, closeIndex);
    const nextBody = transform(body, matches);

    output = output.slice(0, openIndex + 1) + nextBody + output.slice(closeIndex);
    cursor = openIndex + 1 + nextBody.length + 1;
    matches += 1;
  }

  if (required && matches === 0) throw new Error(`CSS-Regel fehlt: ${selector}`);
  return { source: output, matches };
}

function removeStandaloneRules(source, selector) {
  let cursor = 0;
  let removed = 0;
  let output = source;

  while (true) {
    const selectorIndex = output.indexOf(selector, cursor);
    if (selectorIndex < 0) break;

    const openIndex = output.indexOf("{", selectorIndex + selector.length);
    if (openIndex < 0) break;

    const selectorText = output.slice(selectorIndex, openIndex).trim();
    if (selectorText !== selector) {
      cursor = openIndex + 1;
      continue;
    }

    const closeIndex = findMatchingBrace(output, openIndex);
    let start = selectorIndex;
    while (start > 0 && output[start - 1] === "\n") start -= 1;
    let end = closeIndex + 1;
    while (end < output.length && output[end] === "\n") end += 1;

    output = output.slice(0, start) + "\n" + output.slice(end);
    cursor = start + 1;
    removed += 1;
  }

  return { source: output, removed };
}

function ensureMainClass(source, className) {
  if (/mainClass\s*=\s*["'][^"']*["']/.test(source)) {
    return source.replace(
      /mainClass\s*=\s*["'][^"']*["']/,
      `mainClass="${className}"`
    );
  }

  const layoutOpen = source.match(/<ProjectLayout\b[\s\S]*?>/);
  if (!layoutOpen) throw new Error("ProjectLayout-Aufruf fehlt.");

  const replacement = layoutOpen[0].replace(/>$/, `\n  mainClass="${className}"\n>`);
  return source.replace(layoutOpen[0], replacement);
}

function replaceAllLiteral(source, from, to) {
  return source.split(from).join(to);
}

function run(command, args, label, cwd) {
  log(`Prüfe: ${label}`);
  const executable = process.platform === "win32" && command === "npm" ? "npm.cmd" : command;
  const result = spawnSync(executable, args, {
    cwd,
    stdio: "inherit",
    shell: false,
    env: process.env,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} fehlgeschlagen (Exit ${result.status}).`);
  log(`BESTANDEN: ${label}`);
}

const repo = findRoot(process.cwd());
const app = path.join(repo, "apps", "pfotentechnik");

const files = {
  layout: path.join(repo, "packages/affiliate-core/src/styles/layout.css"),
  productRoute: path.join(app, "src/pages/produkt/[product].astro"),
  comparisonRoute: path.join(app, "src/pages/vergleiche/[comparison].astro"),
  comparisonCss: path.join(repo, "packages/affiliate-core/src/components/comparison/comparison-system.css"),
  experience: path.join(app, "src/components/product-experience-2/ProductExperience2.astro"),
  hero: path.join(app, "src/components/product-experience-2/ProductHero2.astro"),
  galleryCss: path.join(app, "src/components/product-experience-2/product-gallery-29.css"),
  test: path.join(app, "test/layout-gutter-unification-29.3.2.test.mjs"),
  package: path.join(app, "package.json"),
};

for (const [key, file] of Object.entries(files)) {
  if (key === "test") continue;
  if (!fs.existsSync(file)) {
    throw new Error(`Erwartete Datei fehlt: ${path.relative(repo, file)}`);
  }
}

const packageJson = JSON.parse(read(files.package));
for (const script of ["lint:content", "build"]) {
  if (typeof packageJson.scripts?.[script] !== "string") {
    throw new Error(`Erforderliches npm-Skript fehlt: ${script}`);
  }
}

const trackedFiles = [
  files.layout,
  files.productRoute,
  files.comparisonRoute,
  files.comparisonCss,
  files.experience,
  files.hero,
  files.test,
];

const original = new Map();
for (const file of trackedFiles) {
  original.set(file, fs.existsSync(file) ? read(file) : null);
}

const backupRoot = path.join(
  repo,
  ".patch-backups",
  `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

for (const [file, content] of original) {
  if (content == null) continue;
  const destination = path.join(backupRoot, path.relative(repo, file));
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, content, "utf8");
}
log(`Backup: ${path.relative(repo, backupRoot)}`);

try {
  // 1. Der globale Container besitzt genau einen gemeinsamen mobilen Gutter-Token.
  let layout = read(files.layout);

  if (!layout.includes("--pt-page-gutter:")) {
    const containerResult = replaceRuleBody(
      layout,
      ".container",
      (body) => `\n  --pt-page-gutter: 12px;${body}`
    );
    layout = containerResult.source;
  } else {
    layout = layout.replace(/--pt-page-gutter:\s*[^;]+;/g, "--pt-page-gutter: 12px;");
  }

  for (const selector of [".container.container--product", ".container--product"]) {
    layout = removeStandaloneRules(layout, selector).source;
  }

  // Frühere unvollständige Fassungen derselben Regel entfernen.
  layout = removeStandaloneRules(layout, ".container.container--immersive").source;

  const immersiveRule = `
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

  layout = normalizeBlankLines(layout) +
    "\n/* Gemeinsamer mobiler Layout-Owner für immersive Seitentypen. */\n" +
    immersiveRule.trim() +
    "\n";

  write(files.layout, layout, repo);

  // 2. Produkt und Vergleich verwenden denselben generischen Layout-Owner.
  write(
    files.productRoute,
    ensureMainClass(read(files.productRoute), "container--immersive"),
    repo
  );
  write(
    files.comparisonRoute,
    ensureMainClass(read(files.comparisonRoute), "container--immersive"),
    repo
  );

  // 3. Alle alten Vergleichsgutter werden vollständig auf den globalen Token migriert.
  let comparisonCss = read(files.comparisonCss);

  comparisonCss = comparisonCss
    .replace(/^\s*--comparison-page-gutter\s*:[^;]+;\s*$/gm, "")
    .replace(
      /var\(\s*--comparison-page-gutter\s*(?:,\s*[^)]+)?\)/g,
      "var(--pt-page-gutter, 12px)"
    );

  const detailResult = replaceRuleBody(
    comparisonCss,
    ".comparison-detail",
    (body, index) => {
      if (index > 0) return body;

      let next = body
        .replace(/^\s*--comparison-readable-width\s*:[^;]+;\s*$/gm, "")
        .replace(/^\s*padding-inline\s*:[^;]+;\s*$/gm, "")
        .trim();

      const declarations = [
        "--comparison-readable-width: 76rem;",
        "padding-inline: var(--pt-page-gutter, 12px);",
      ];

      return `\n  ${declarations.join("\n  ")}${next ? `\n  ${next.replace(/\n/g, "\n  ")}` : ""}\n`;
    }
  );
  comparisonCss = detailResult.source;

  const readableSelector = ".comparison-detail > .comparison-content,\n.comparison-detail > #faq";
  if (comparisonCss.includes(readableSelector)) {
    const readableResult = replaceRuleBody(
      comparisonCss,
      readableSelector,
      () => `
  width: min(100%, var(--comparison-readable-width));
  margin-inline: auto;
`
    );
    comparisonCss = readableResult.source;
  } else {
    const insertAfter = comparisonCss.indexOf("}", comparisonCss.indexOf(".comparison-detail"));
    if (insertAfter < 0) throw new Error("Einfügeposition für Vergleichsbreite fehlt.");
    comparisonCss =
      comparisonCss.slice(0, insertAfter + 1) +
      `\n\n${readableSelector} {\n  width: min(100%, var(--comparison-readable-width));\n  margin-inline: auto;\n}` +
      comparisonCss.slice(insertAfter + 1);
  }

  // Alte doppelte Breitenkonstruktionen entfernen, ohne Tabellen-Overflow anzutasten.
  comparisonCss = comparisonCss
    .replace(
      /width:\s*calc\(\s*100%\s*-\s*\(\s*2\s*\*\s*var\(--pt-page-gutter,\s*12px\)\s*\)\s*\)\s*;/g,
      "width: 100%;"
    )
    .replace(/\n{4,}/g, "\n\n\n");

  if (/--comparison-page-gutter/.test(comparisonCss)) {
    throw new Error("Alte Variable --comparison-page-gutter bleibt nach Migration erhalten.");
  }

  write(files.comparisonCss, comparisonCss, repo);

  // 4. Produktinhalte verwenden denselben Token. Die Galerie bleibt davon entkoppelt.
  for (const file of [files.experience, files.hero]) {
    let source = read(file);
    source = source
      .replace(/margin-inline:\s*12px\s*;/g, "margin-inline: var(--pt-page-gutter, 12px);")
      .replace(/padding-inline:\s*12px\s*;/g, "padding-inline: var(--pt-page-gutter, 12px);");
    write(file, source, repo);
  }

  const testSource = `import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repo = path.resolve(app, "../..");
const read = (file) => fs.readFileSync(file, "utf8");

const layout = read(path.join(repo, "packages/affiliate-core/src/styles/layout.css"));
const productRoute = read(path.join(app, "src/pages/produkt/[product].astro"));
const comparisonRoute = read(path.join(app, "src/pages/vergleiche/[comparison].astro"));
const comparisonCss = read(path.join(repo, "packages/affiliate-core/src/components/comparison/comparison-system.css"));
const experience = read(path.join(app, "src/components/product-experience-2/ProductExperience2.astro"));
const hero = read(path.join(app, "src/components/product-experience-2/ProductHero2.astro"));
const galleryCss = read(path.join(app, "src/components/product-experience-2/product-gallery-29.css"));

test("Produkt und Vergleich verwenden denselben generischen Layout-Owner", () => {
  assert.match(productRoute, /mainClass="container--immersive"/);
  assert.match(comparisonRoute, /mainClass="container--immersive"/);
  assert.doesNotMatch(layout, /container--product/);
});

test("globaler mobiler Seitengutter ist eindeutig definiert", () => {
  assert.equal((layout.match(/--pt-page-gutter:\\s*12px/g) || []).length, 1);
  assert.equal((layout.match(/\\.container\\.container--immersive\\s*\\{/g) || []).length, 1);
  assert.match(
    layout,
    /\\.container\\.container--immersive\\s*\\{[\\s\\S]*?padding:\\s*0 0 calc\\(64px \\+ env\\(safe-area-inset-bottom\\)\\)/
  );
});

test("Vergleich besitzt genau einen äußeren Inhaltsgutter", () => {
  assert.doesNotMatch(comparisonCss, /--comparison-page-gutter/);
  assert.match(
    comparisonCss,
    /\\.comparison-detail\\s*\\{[\\s\\S]*?padding-inline:\\s*var\\(--pt-page-gutter, 12px\\)/
  );
  assert.match(
    comparisonCss,
    /\\.comparison-detail > \\.comparison-content,[\\s\\S]*?#faq\\s*\\{[\\s\\S]*?width:\\s*min\\(100%, var\\(--comparison-readable-width\\)\\)[\\s\\S]*?margin-inline:\\s*auto/
  );
  assert.doesNotMatch(
    comparisonCss,
    /width:\\s*calc\\(\\s*100%\\s*-\\s*\\(\\s*2\\s*\\*/
  );
});

test("Produktinhalte verwenden den globalen Gutter", () => {
  assert.match(experience + hero, /var\\(--pt-page-gutter, 12px\\)/);
});

test("Produktgalerie bleibt mobil randlos", () => {
  assert.match(galleryCss, /width:\\s*100dvw/);
  assert.match(galleryCss, /margin-inline:\\s*calc\\(50%\\s*-\\s*50dvw\\)/);
  assert.doesNotMatch(
    hero,
    /\\.px2-hero__media[^}]*?(?:padding-inline|margin-inline):\\s*var\\(--pt-page-gutter/
  );
});

test("keine neue important-Regel", () => {
  assert.doesNotMatch(layout + comparisonCss + experience + hero, /!important/);
});
`;

  write(files.test, testSource, repo);

  run("node", ["--check", files.test], "Syntaxprüfung des Tests", repo);
  run("node", ["--test", files.test], "Layout-Gutter-Test", repo);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "lint:content"], "Content-Lint", repo);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "build"], "Astro-Build", repo);

  log("BESTANDEN: Produkt und Vergleich verwenden denselben mobilen Inhaltsgutter.");
  log("BESTANDEN: Die Produktgalerie bleibt vollständig randlos.");
  log("BESTANDEN: Alte Vergleichsgutter und container--product-Regeln sind entfernt.");
  log("Abgeschlossen.");
} catch (error) {
  for (const [file, content] of original) {
    if (content == null) {
      if (fs.existsSync(file)) fs.rmSync(file, { force: true });
      continue;
    }
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content, "utf8");
  }
  console.error(`[${PATCH}] FEHLER: ${error.message}`);
  console.error(`[${PATCH}] Änderungen wurden zurückgerollt.`);
  process.exit(1);
}

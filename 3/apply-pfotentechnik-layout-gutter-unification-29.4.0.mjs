#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-layout-gutter-unification-29.4.0";
const log = (message) => console.log(`[${PATCH}] ${message}`);

function findRepoRoot(start) {
  let current = path.resolve(start);
  for (let depth = 0; depth < 16; depth += 1) {
    if (fs.existsSync(path.join(current, "apps", "pfotentechnik", "package.json"))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}

function read(file) {
  return fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
}

function normalize(source) {
  return source
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd() + "\n";
}

function write(file, source, repo) {
  const next = normalize(source);
  const current = fs.existsSync(file) ? read(file) : "";
  if (current === next) {
    log(`Bereits aktuell: ${path.relative(repo, file)}`);
    return;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, next, "utf8");
  log(`Geändert: ${path.relative(repo, file)}`);
}

function findClosingBrace(source, openIndex) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  let comment = false;

  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (comment) {
      if (char === "*" && next === "/") {
        comment = false;
        index += 1;
      }
      continue;
    }

    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
      continue;
    }

    if (char === "/" && next === "*") {
      comment = true;
      index += 1;
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

  throw new Error("Nicht geschlossene CSS-Regel.");
}

function normalizeSelector(selector) {
  return selector
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ",")
    .trim();
}

function cssRules(source) {
  const rules = [];
  let cursor = 0;

  while (cursor < source.length) {
    const open = source.indexOf("{", cursor);
    if (open < 0) break;

    let start = open - 1;
    while (start >= 0 && source[start] !== "}" && source[start] !== ";") start -= 1;
    start += 1;

    const selector = source.slice(start, open).trim();
    const close = findClosingBrace(source, open);

    if (selector && !selector.startsWith("@")) {
      rules.push({ start, open, close, selector });
    }

    cursor = close + 1;
  }

  return rules;
}

function replaceExactRule(source, selector, body, { required = true } = {}) {
  const target = normalizeSelector(selector);
  const matches = cssRules(source).filter(
    (rule) => normalizeSelector(rule.selector) === target
  );

  if (required && matches.length === 0) {
    throw new Error(`CSS-Regel fehlt: ${selector}`);
  }
  if (matches.length > 1) {
    throw new Error(`CSS-Regel mehrfach vorhanden: ${selector} (${matches.length})`);
  }
  if (matches.length === 0) return source;

  const rule = matches[0];
  return (
    source.slice(0, rule.start) +
    `${selector} {\n${body.trim()}\n}` +
    source.slice(rule.close + 1)
  );
}

function removeExactRules(source, selectors) {
  const targets = new Set(selectors.map(normalizeSelector));
  const matches = cssRules(source)
    .filter((rule) => targets.has(normalizeSelector(rule.selector)))
    .sort((a, b) => b.start - a.start);

  let output = source;
  for (const rule of matches) {
    let start = rule.start;
    while (start > 0 && output[start - 1] === "\n") start -= 1;
    let end = rule.close + 1;
    while (end < output.length && output[end] === "\n") end += 1;
    output = output.slice(0, start) + "\n" + output.slice(end);
  }
  return output;
}

function setMainClass(source, value) {
  if (/mainClass\s*=\s*["'][^"']*["']/.test(source)) {
    return source.replace(/mainClass\s*=\s*["'][^"']*["']/, `mainClass="${value}"`);
  }

  const start = source.indexOf("<ProjectLayout");
  if (start < 0) throw new Error("ProjectLayout-Aufruf fehlt.");
  const end = source.indexOf(">", start);
  if (end < 0) throw new Error("ProjectLayout-Aufruf ist nicht geschlossen.");

  return source.slice(0, end) + `\n  mainClass="${value}"` + source.slice(end);
}

function countImportant(source) {
  return (source.match(/!important/g) || []).length;
}

function run(command, args, label, cwd) {
  log(`Prüfe: ${label}`);
  const executable =
    process.platform === "win32" && command === "npm" ? "npm.cmd" : command;
  const result = spawnSync(executable, args, {
    cwd,
    stdio: "inherit",
    shell: false,
    env: process.env,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${label} fehlgeschlagen (Exit ${result.status}).`);
  }
  log(`BESTANDEN: ${label}`);
}

const repo = findRepoRoot(process.cwd());
const app = path.join(repo, "apps", "pfotentechnik");

const files = {
  layout: path.join(repo, "packages/affiliate-core/src/styles/layout.css"),
  productRoute: path.join(app, "src/pages/produkt/[product].astro"),
  comparisonRoute: path.join(app, "src/pages/vergleiche/[comparison].astro"),
  comparisonCss: path.join(
    repo,
    "packages/affiliate-core/src/components/comparison/comparison-system.css"
  ),
  experience: path.join(
    app,
    "src/components/product-experience-2/ProductExperience2.astro"
  ),
  hero: path.join(
    app,
    "src/components/product-experience-2/ProductHero2.astro"
  ),
  galleryCss: path.join(
    app,
    "src/components/product-experience-2/product-gallery-29.css"
  ),
  test: path.join(app, "test/layout-gutter-unification-29.4.0.test.mjs"),
};

for (const [key, file] of Object.entries(files)) {
  if (key === "test") continue;
  if (!fs.existsSync(file)) {
    throw new Error(`Erwartete Datei fehlt: ${path.relative(repo, file)}`);
  }
}

const tracked = [
  files.layout,
  files.productRoute,
  files.comparisonRoute,
  files.comparisonCss,
  files.experience,
  files.hero,
  files.test,
];

const originals = new Map(
  tracked.map((file) => [file, fs.existsSync(file) ? read(file) : null])
);

const importantBaseline = new Map([
  [files.layout, countImportant(read(files.layout))],
  [files.comparisonCss, countImportant(read(files.comparisonCss))],
  [files.experience, countImportant(read(files.experience))],
  [files.hero, countImportant(read(files.hero))],
]);

const backupRoot = path.join(
  repo,
  ".patch-backups",
  `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

for (const [file, content] of originals) {
  if (content == null) continue;
  const destination = path.join(backupRoot, path.relative(repo, file));
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, content, "utf8");
}
log(`Backup: ${path.relative(repo, backupRoot)}`);

try {
  /*
   * layout.css wird bewusst kanonisch neu aufgebaut.
   * Die Datei ist klein. Das ist belastbarer als weitere Regel-Anhängsel.
   */
  const layoutSource = read(files.layout);
  const sectionStart = layoutSource.indexOf(".section-title");
  if (sectionStart < 0) throw new Error("Anker .section-title in layout.css fehlt.");

  let layoutTail = layoutSource.slice(sectionStart);
  layoutTail = removeExactRules(layoutTail, [
    ".container.container--product",
    ".container--product",
    ".container.container--immersive",
  ]);

  // Leere, durch frühere Installer erzeugte Media-Blöcke entfernen.
  layoutTail = layoutTail
    .replace(/@media\s*\(max-width:\s*768px\)\s*\{\s*\}/g, "")
    .replace(
      /\/\*\s*Gemeinsamer Seiten-Gutter und generischer immersiver Layout-Owner\.\s*\*\/[\s\S]*?(?=\/\*|$)/g,
      ""
    )
    .replace(
      /\/\*\s*Gemeinsamer mobiler Layout-Owner für immersive Seitentypen\.\s*\*\/[\s\S]*?(?=\/\*|$)/g,
      ""
    );

  const canonicalLayout = `.container {
  --pt-page-gutter: 12px;
  --pt-container-gutter: 24px;
  width: 100%;
  min-width: 0;
  max-width: 1200px;
  margin: 0 auto;
  padding: 70px var(--pt-container-gutter);
}

${layoutTail.trim()}

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

  write(files.layout, canonicalLayout, repo);

  write(
    files.productRoute,
    setMainClass(read(files.productRoute), "container--immersive"),
    repo
  );
  write(
    files.comparisonRoute,
    setMainClass(read(files.comparisonRoute), "container--immersive"),
    repo
  );

  /*
   * Vergleich:
   * - gemeinsame Strukturregel enthält nur Struktur
   * - Gutter gehört ausschließlich .comparison-detail
   * - keine alte lokale Gutter-Variable
   */
  let comparisonCss = read(files.comparisonCss)
    .replace(/^\s*--comparison-page-gutter\s*:[^;]+;\s*$/gm, "")
    .replace(
      /var\(\s*--comparison-page-gutter\s*(?:,\s*[^)]+)?\)/g,
      "var(--pt-page-gutter, 12px)"
    );

  comparisonCss = replaceExactRule(
    comparisonCss,
    `.comparison-detail,
.comparison-shell`,
    `  display: grid;
  width: 100%;
  min-width: 0;
  gap: clamp(3rem, 6vw, 5.5rem);`
  );

  comparisonCss = removeExactRules(comparisonCss, [".comparison-detail"]);

  const groupedRule = cssRules(comparisonCss).find(
    (rule) =>
      normalizeSelector(rule.selector) ===
      normalizeSelector(`.comparison-detail,
.comparison-shell`)
  );
  if (!groupedRule) throw new Error("Gemeinsame Vergleichsstruktur fehlt.");

  const detailRule = `

.comparison-detail {
  --comparison-readable-width: 76rem;
  padding-inline: var(--pt-page-gutter, 12px);
}
`;

  comparisonCss =
    comparisonCss.slice(0, groupedRule.close + 1) +
    detailRule +
    comparisonCss.slice(groupedRule.close + 1);

  const readableSelector = `.comparison-detail > .comparison-content,
.comparison-detail > #faq`;

  comparisonCss = replaceExactRule(
    comparisonCss,
    readableSelector,
    `  width: min(100%, var(--comparison-readable-width));
  margin-inline: auto;`,
    { required: false }
  );

  if (!comparisonCss.includes(readableSelector)) {
    const detail = cssRules(comparisonCss).find(
      (rule) => normalizeSelector(rule.selector) === ".comparison-detail"
    );
    if (!detail) throw new Error("Kanonische .comparison-detail-Regel fehlt.");
    comparisonCss =
      comparisonCss.slice(0, detail.close + 1) +
      `

${readableSelector} {
  width: min(100%, var(--comparison-readable-width));
  margin-inline: auto;
}
` +
      comparisonCss.slice(detail.close + 1);
  }

  comparisonCss = comparisonCss
    .replace(
      /width:\s*calc\(\s*100%\s*-\s*\(\s*2\s*\*\s*var\(--pt-page-gutter,\s*12px\)\s*\)\s*\)\s*;/g,
      "width: 100%;"
    )
    .replace(/--comparison-page-gutter/g, "__INVALID_OLD_GUTTER__");

  if (comparisonCss.includes("__INVALID_OLD_GUTTER__")) {
    throw new Error("Alte Vergleichsgutter-Variable konnte nicht vollständig entfernt werden.");
  }

  write(files.comparisonCss, comparisonCss, repo);

  for (const file of [files.experience, files.hero]) {
    let source = read(file)
      .replace(/margin-inline:\s*12px\s*;/g, "margin-inline: var(--pt-page-gutter, 12px);")
      .replace(/padding-inline:\s*12px\s*;/g, "padding-inline: var(--pt-page-gutter, 12px);");
    write(file, source, repo);
  }

  for (const [file, baseline] of importantBaseline) {
    const current = countImportant(read(file));
    if (current > baseline) {
      throw new Error(
        `Neue !important-Regel in ${path.relative(repo, file)}: ${baseline} → ${current}.`
      );
    }
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

test("beide Seitentypen verwenden denselben Layout-Owner", () => {
  assert.match(productRoute, /mainClass="container--immersive"/);
  assert.match(comparisonRoute, /mainClass="container--immersive"/);
  assert.doesNotMatch(layout, /container--product/);
});

test("layout.css enthält genau einen kanonischen Gutter-Owner", () => {
  assert.equal((layout.match(/--pt-page-gutter:\\s*12px/g) || []).length, 1);
  assert.equal((layout.match(/\\.container\\.container--immersive\\s*\\{/g) || []).length, 1);
  assert.equal((layout.match(/Gemeinsamer mobiler Layout-Owner/g) || []).length, 0);
});

test("Vergleich trennt Struktur und Außenabstand", () => {
  assert.match(
    comparisonCss,
    /\\.comparison-detail,\\s*\\.comparison-shell\\s*\\{\\s*display:\\s*grid;\\s*width:\\s*100%;\\s*min-width:\\s*0;/
  );
  assert.match(
    comparisonCss,
    /\\.comparison-detail\\s*\\{\\s*--comparison-readable-width:\\s*76rem;\\s*padding-inline:\\s*var\\(--pt-page-gutter, 12px\\);\\s*\\}/
  );
  assert.equal(
    (comparisonCss.match(/padding-inline:\\s*var\\(--pt-page-gutter, 12px\\)/g) || []).length,
    1
  );
  assert.doesNotMatch(comparisonCss, /--comparison-page-gutter/);
});

test("lesbare Vergleichsbereiche erzeugen keinen zweiten Gutter", () => {
  assert.match(
    comparisonCss,
    /\\.comparison-detail > \\.comparison-content,\\s*\\.comparison-detail > #faq\\s*\\{\\s*width:\\s*min\\(100%, var\\(--comparison-readable-width\\)\\);\\s*margin-inline:\\s*auto;/
  );
});

test("Produktinhalte verwenden den globalen Token", () => {
  assert.match(experience + hero, /var\\(--pt-page-gutter, 12px\\)/);
});

test("Galerie bleibt vom Seitengutter entkoppelt", () => {
  assert.match(galleryCss, /width:\\s*100dvw/);
  assert.match(galleryCss, /margin-inline:\\s*calc\\(50%\\s*-\\s*50dvw\\)/);
  assert.doesNotMatch(
    hero,
    /\\.px2-hero__media[^}]*?(?:padding-inline|margin-inline):\\s*var\\(--pt-page-gutter/
  );
});
`;

  write(files.test, testSource, repo);

  run("node", ["--check", files.test], "Syntaxprüfung des Tests", repo);
  run("node", ["--test", files.test], "Layout-Gutter-Test", repo);

  // Zweiter Lauf der strukturellen Assertions prüft die idempotente Endform.
  run("node", ["--test", files.test], "Layout-Gutter-Test, zweiter Lauf", repo);

  run(
    "npm",
    ["--workspace", "apps/pfotentechnik", "run", "lint:content"],
    "Content-Lint",
    repo
  );
  run(
    "npm",
    ["--workspace", "apps/pfotentechnik", "run", "build"],
    "Astro-Build",
    repo
  );

  log("BESTANDEN: globaler 12px-Gutter für Produkt und Vergleich.");
  log("BESTANDEN: Produktgalerie bleibt mobil randlos.");
  log("BESTANDEN: alte Produkt- und Vergleichsgutter sind entfernt.");
  log("Abgeschlossen.");
} catch (error) {
  for (const [file, content] of originals) {
    if (content == null) {
      if (fs.existsSync(file)) fs.rmSync(file, { force: true });
    } else {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, content, "utf8");
    }
  }

  console.error(`[${PATCH}] FEHLER: ${error.message}`);
  console.error(`[${PATCH}] Änderungen wurden zurückgerollt.`);
  process.exit(1);
}

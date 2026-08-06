#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const PATCH = "pfotentechnik-layout-engine-31.0.0";
const scriptFile = fileURLToPath(import.meta.url);

function findRoot(start) {
  let dir = path.resolve(start);
  for (;;) {
    if (
      fs.existsSync(path.join(dir, "package.json")) &&
      fs.existsSync(path.join(dir, "apps", "pfotentechnik")) &&
      fs.existsSync(path.join(dir, "packages", "affiliate-core"))
    ) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error(`[${PATCH}] Repository-Wurzel nicht gefunden.`);
    dir = parent;
  }
}

const root = findRoot(process.cwd());
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(root, ".patch-backups", `${PATCH}-${stamp}`);
const files = {
  global: "packages/affiliate-core/src/styles/global.css",
  layout: "packages/affiliate-core/src/styles/page-layout-engine.css",
  system: "packages/affiliate-core/src/components/comparison/comparison-system.css",
  tokens: "packages/affiliate-core/src/components/comparison/comparison-tokens.css",
  shell: "packages/affiliate-core/src/components/comparison/ComparisonShell.astro",
  product: "apps/pfotentechnik/src/pages/produkt/[product].astro",
  comparison: "apps/pfotentechnik/src/pages/vergleiche/[comparison].astro",
  projectLayout: "apps/pfotentechnik/src/layouts/ProjectLayout.astro",
  test: "apps/pfotentechnik/test/pfotentechnik-layout-engine-31.0.0.test.mjs"
};
const abs = Object.fromEntries(Object.entries(files).map(([k,v]) => [k, path.join(root,v)]));
for (const [key,file] of Object.entries(abs)) {
  if (key !== "test" && !fs.existsSync(file)) throw new Error(`[${PATCH}] Datei fehlt: ${files[key]}`);
}

const originals = new Map();
const changed = [];
const read = (file) => fs.readFileSync(file, "utf8");

function backup(file) {
  if (originals.has(file)) return;
  const data = fs.existsSync(file) ? fs.readFileSync(file) : null;
  originals.set(file, data);
  if (data === null) return;
  const target = path.join(backupRoot, path.relative(root,file));
  fs.mkdirSync(path.dirname(target), {recursive:true});
  fs.writeFileSync(target,data);
}
function write(file, content) {
  const old = fs.existsSync(file) ? read(file) : "";
  const next = old.includes("\r\n") ? content.replace(/\r?\n/g,"\r\n") : content.replace(/\r\n/g,"\n");
  if (old === next) return;
  backup(file);
  fs.mkdirSync(path.dirname(file), {recursive:true});
  fs.writeFileSync(file,next,"utf8");
  changed.push(path.relative(root,file));
}
function rollback() {
  for (const [file,data] of [...originals.entries()].reverse()) {
    if (data === null) fs.rmSync(file,{force:true});
    else { fs.mkdirSync(path.dirname(file),{recursive:true}); fs.writeFileSync(file,data); }
  }
}
function run(command,args) {
  console.log(`[${PATCH}] ${command} ${args.join(" ")}`);
  const r=spawnSync(command,args,{cwd:root,stdio:"inherit",shell:process.platform==="win32",env:process.env});
  if (r.error) throw r.error;
  if (r.status!==0) throw new Error(`[${PATCH}] Befehl fehlgeschlagen: ${command} ${args.join(" ")}`);
}
function validateAstro(file) {
  const source = read(file);
  const relative = path.relative(root, file);
  const frontmatter = source.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---(?:\s*[\r\n]+|$)/);
  if (!frontmatter) {
    throw new Error(`[${PATCH}] Astro-Frontmatter fehlt oder ist nicht geschlossen: ${relative}`);
  }

  const template = source.slice(frontmatter[0].length);
  const stack = [];
  const tagPattern = /<\/?([A-Za-z][\w:.-]*)(?:\s[^<>]*?)?\/?\s*>/g;
  let match;
  while ((match = tagPattern.exec(template))) {
    const raw = match[0];
    const name = match[1];
    if (raw.startsWith("</")) {
      const expected = stack.pop();
      if (expected !== name) {
        throw new Error(`[${PATCH}] Unausgeglichene Astro-Struktur in ${relative}: erwartet </${expected ?? "?"}>, gefunden </${name}>.`);
      }
    } else if (!raw.endsWith("/>") && !["area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"].includes(name.toLowerCase())) {
      stack.push(name);
    }
  }
  if (stack.length) {
    throw new Error(`[${PATCH}] Nicht geschlossene Astro-Elemente in ${relative}: ${stack.join(", ")}`);
  }

  if (/pages[\\/]produkt[\\/]\[product\]\.astro$/.test(file) || /pages[\\/]vergleiche[\\/]\[comparison\]\.astro$/.test(file)) {
    if (!/<ProjectLayout\b/.test(template) || !/<div\s+class=(?:"|')[^"']*\bpt-page\b/.test(template)) {
      throw new Error(`[${PATCH}] Erwartete Seitenstruktur fehlt: ${relative}`);
    }
  }
  if (/ComparisonShell\.astro$/.test(file) && !/class=(?:"|')[^"']*\bcomparison-shell\b/.test(template)) {
    throw new Error(`[${PATCH}] ComparisonShell-Struktur fehlt: ${relative}`);
  }
}
function ensureMainClass(source) {
  const re=/\bmainClass\s*=\s*(?:"[^"]*"|'[^']*'|\{[^}]*\})/g;
  let seen=false;
  const replaced=source.replace(re,()=>{ if(seen)return ""; seen=true; return 'mainClass="container--page"'; });
  return seen ? replaced : replaced.replace(/(<ProjectLayout\b[\s\S]*?)(>)/,`$1\n  mainClass="container--page"$2`);
}
function rootClass(source,kind) {
  let next=source;
  for (const name of ["container--product","container--immersive","comparison-detail","product-detail"]) {
    next=next.replace(new RegExp(`(^|\\s)${name}(?=\\s|")`,"g"),"$1");
  }
  return next.replace(/<div\s+class=(["'])([^"']*\bpt-page\b[^"']*)\1([^>]*)>/i,(m,q,classes,tail)=>{
    const cleaned=classes.split(/\s+/).filter(Boolean).filter(x=>!["container--product","container--immersive","comparison-detail","product-detail"].includes(x));
    return `<div class=${q}${[...new Set(["pt-page",`pt-page--${kind}`,...cleaned])].join(" ")}${q}${tail}>`;
  });
}

const layout = `/*
 * PfotenTechnik Layout Engine 31
 * Einziger Owner für Breite, Gutter, Reading Width und Full-Bleed.
 */
.container.container--page {
  --pt-page-gutter: clamp(16px, 4vw, 24px);
  --pt-content-width: 1200px;
  --pt-reading-width: 76rem;
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 0 0 calc(64px + env(safe-area-inset-bottom));
}
.pt-page {
  display: grid;
  width: 100%;
  min-width: 0;
  gap: clamp(2.5rem, 5vw, 4.5rem);
  margin: 0;
}
.pt-page > *,
.pt-page__content,
.pt-page [data-page-content] {
  width: min(calc(100% - 2 * var(--pt-page-gutter)), var(--pt-content-width));
  min-width: 0;
  margin-inline: auto;
}
.pt-page__reading,
.pt-page [data-page-reading],
.pt-page > .comparison-content,
.pt-page > #faq {
  width: min(calc(100% - 2 * var(--pt-page-gutter)), var(--pt-reading-width));
  min-width: 0;
  margin-inline: auto;
}
.pt-page__bleed,
.pt-page [data-page-bleed] {
  width: 100%;
  max-width: none;
  margin-inline: 0;
}
.pt-page > .comparison-shell {
  display: grid;
  width: min(calc(100% - 2 * var(--pt-page-gutter)), var(--pt-content-width));
  min-width: 0;
  gap: clamp(2.5rem, 5vw, 4.5rem);
  margin-inline: auto;
}
.pt-page > .comparison-shell > * {
  width: 100%;
  min-width: 0;
  margin-inline: 0;
}
@media (max-width: 759px) {
  .container.container--page { --pt-page-gutter: 16px; }
  .pt-page--product [data-mobile-gallery-full-bleed] {
    width: 100vw;
    max-width: none;
    margin-inline: calc(50% - 50vw);
  }
}
`;

const tokens = `/*
 * Vergleichskomponenten verwenden ausschließlich globale Theme-Tokens.
 * Aliasse bleiben nur als migrationssichere Komponenten-Schnittstelle.
 */
:root {
  --comparison-text: var(--pt-color-text);
  --comparison-muted: var(--pt-color-text-muted);
  --comparison-accent: var(--pt-color-action-bg);
  --comparison-accent-dark: var(--pt-color-action-bg-hover);
  --comparison-line: var(--pt-color-border);
  --comparison-soft: var(--pt-color-surface-soft);
  --comparison-surface: var(--pt-color-surface);
  --comparison-shadow: var(--pt-shadow-card, 0 14px 38px rgb(0 0 0 / 0.08));
}
`;

function findCssBlocks(source) {
  const blocks = [];
  let depth = 0;
  let selectorStart = 0;
  let blockStart = -1;
  let quote = null;
  let comment = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (comment) {
      if (char === "*" && next === "/") {
        comment = false;
        index += 1;
      }
      continue;
    }
    if (!quote && char === "/" && next === "*") {
      comment = true;
      index += 1;
      continue;
    }
    if (quote) {
      if (char === "\\") index += 1;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === "{") {
      if (depth === 0) blockStart = index;
      depth += 1;
      continue;
    }
    if (char === "}") {
      depth -= 1;
      if (depth === 0 && blockStart >= 0) {
        blocks.push({
          selectorStart,
          blockStart,
          blockEnd: index + 1,
          selector: source.slice(selectorStart, blockStart).trim(),
          body: source.slice(blockStart + 1, index)
        });
        selectorStart = index + 1;
        blockStart = -1;
      }
    }
  }
  return blocks;
}

function replaceCssBlock(source, selectorMatcher, bodyFactory) {
  const blocks = findCssBlocks(source);
  let next = source;
  for (const block of [...blocks].reverse()) {
    if (!selectorMatcher(block.selector)) continue;
    const body = bodyFactory(block.body, block.selector);
    next = `${next.slice(0, block.blockStart + 1)}${body}${next.slice(block.blockEnd - 1)}`;
  }
  return next;
}

function replaceDeclaration(body, property, value) {
  const expression = new RegExp(`(^|\\n)(\\s*)${property.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}\\s*:[^;]+;`, "i");
  if (expression.test(body)) {
    return body.replace(expression, `$1$2${property}: ${value};`);
  }
  return `${body.trimEnd()}\n  ${property}: ${value};\n`;
}

function sanitizeColorValues(source) {
  const replacements = [
    [/#16302b/gi, "var(--pt-color-surface)"],
    [/#18743b/gi, "var(--pt-color-action-bg)"],
    [/#0f5d2d/gi, "var(--pt-color-action-bg-hover)"],
    [/#e5f5e8/gi, "var(--pt-color-surface-soft)"],
    [/#238341/gi, "var(--pt-color-action-bg)"],
    [/#13231e/gi, "var(--pt-color-text)"],
    [/#66766f/gi, "var(--pt-color-text-muted)"],
    [/#dce6e0/gi, "var(--pt-color-border)"],
    [/#f2f8f4/gi, "var(--pt-color-surface-soft)"],
    [/#f8faf9/gi, "var(--pt-color-surface-soft)"],
    [/#eff9f1/gi, "var(--pt-color-surface-soft)"],
    [/#e7eeec/gi, "var(--pt-color-border)"],
    [/rgba?\(\s*24\s*,\s*116\s*,\s*59\s*(?:,\s*[\d.]+\s*)?\)/gi, "var(--pt-color-border)"],
    [/rgba?\(\s*7\s*,\s*31\s*,\s*27\s*(?:,\s*[\d.]+\s*)?\)/gi, "var(--pt-color-surface)"],
    [/#b9efc5/gi, "var(--pt-color-text-muted)"]
  ];
  let next = source;
  for (const [pattern, replacement] of replacements) next = next.replace(pattern, replacement);
  return next;
}


function removeThemeSelectorBlocks(source) {
  const forbidden = /(?:^|[\s,>+~])(?:\.theme-dark\b|\.dark\b|\[data-theme(?:[=\]])?)/i;
  let next = source;
  let changed = true;

  while (changed) {
    changed = false;
    const blocks = findCssBlocks(next);
    for (const block of [...blocks].reverse()) {
      if (!forbidden.test(block.selector)) continue;
      next = `${next.slice(0, block.selectorStart)}${next.slice(block.blockEnd)}`;
      changed = true;
    }
  }
  return next;
}

function systemCss(source) {
  let next = source
    .replace(/@import\s+["']\.\/comparison-tokens\.css["'];?\s*/g, "")
    .replace(/\n?\/\*\s*Layout Engine 31 theme normalization\.[\s\S]*$/m, "");

  next = removeThemeSelectorBlocks(next);
  next = sanitizeColorValues(next);

  next = replaceCssBlock(
    next,
    (selector) => selector.split(",").some((part) => part.trim() === ".comparison-hero"),
    (body) => replaceDeclaration(replaceDeclaration(body, "background", "var(--pt-color-surface)"), "color", "var(--pt-color-text)")
  );
  next = replaceCssBlock(
    next,
    (selector) => selector.trim() === ".comparison-hero__shade",
    () => "\n  display: none;\n"
  );
  next = replaceCssBlock(
    next,
    (selector) => selector.trim() === ".comparison-hero__copy",
    (body) => replaceDeclaration(body, "color", "var(--pt-color-text)")
  );
  next = replaceCssBlock(
    next,
    (selector) => selector.trim() === ".comparison-eyebrow--hero",
    (body) => replaceDeclaration(body, "color", "var(--pt-color-text-muted)")
  );
  next = replaceCssBlock(
    next,
    (selector) => selector.trim() === ".comparison-hero h1",
    (body) => replaceDeclaration(replaceDeclaration(body, "color", "var(--pt-color-text)"), "text-shadow", "none")
  );
  next = replaceCssBlock(
    next,
    (selector) => selector.trim() === ".comparison-hero__copy > p",
    (body) => replaceDeclaration(replaceDeclaration(body, "color", "var(--pt-color-text-muted)"), "text-shadow", "none")
  );
  next = replaceCssBlock(
    next,
    (selector) => selector.trim() === ".comparison-hero__facts div",
    (body) => replaceDeclaration(
      replaceDeclaration(
        replaceDeclaration(body, "border-color", "var(--pt-color-border)"),
        "background",
        "var(--pt-color-surface-raised)"
      ),
      "box-shadow",
      "var(--pt-shadow-card, 0 14px 38px rgb(0 0 0 / 0.08))"
    )
  );
  next = replaceCssBlock(
    next,
    (selector) => selector.trim() === ".comparison-hero__facts dt",
    (body) => replaceDeclaration(body, "color", "var(--pt-color-text-muted)")
  );
  next = replaceCssBlock(
    next,
    (selector) => selector.trim() === ".comparison-hero__facts dd",
    (body) => replaceDeclaration(body, "color", "var(--pt-color-text)")
  );
  next = replaceCssBlock(
    next,
    (selector) => selector.trim() === ".comparison-placeholder",
    (body) => replaceDeclaration(body, "background", "var(--pt-color-surface-soft)")
  );
  next = replaceCssBlock(
    next,
    (selector) => selector.trim() === ".comparison-verdict",
    (body) => replaceDeclaration(
      replaceDeclaration(body, "border-color", "var(--pt-color-border)"),
      "background",
      "var(--pt-color-surface)"
    )
  );
  next = replaceCssBlock(
    next,
    (selector) => selector.trim() === ".comparison-verdict__choices article",
    (body) => replaceDeclaration(body, "background", "var(--pt-color-surface-raised)")
  );
  next = replaceCssBlock(
    next,
    (selector) => selector.trim() === ".comparison-sticky-bar",
    (body) => replaceDeclaration(
      replaceDeclaration(body, "border-color", "var(--pt-color-border)"),
      "background",
      "var(--pt-color-surface-raised)"
    )
  );

  const layoutSelectors = new Set([".comparison-detail", ".comparison-shell"]);
  next = replaceCssBlock(next, (selector) => {
    const parts = selector.split(",").map((part) => part.trim());
    return parts.length > 0 && parts.every((part) => layoutSelectors.has(part));
  }, (body) => {
    const blocked = new Set(["width", "max-width", "margin", "margin-inline", "padding"]);
    const kept = body
      .split(";")
      .map((declaration) => declaration.trim())
      .filter(Boolean)
      .filter((declaration) => !blocked.has(declaration.split(":", 1)[0].trim().toLowerCase()));
    return kept.length ? `\n  ${kept.join(";\n  ")};\n` : "\n";
  });

  const override = `
/* Layout Engine 31 theme normalization. */
.comparison-shell { min-width: 0; }
.comparison-hero,
.recommendation-card,
.comparison-fit-card,
.comparison-table-wrap,
.comparison-verdict,
.comparison-sticky-bar {
  border-color: var(--pt-color-border);
  color: var(--pt-color-text);
  background-color: var(--pt-color-surface);
}
.comparison-table th,
.comparison-table td { border-color: var(--pt-color-border); }
.comparison-table thead th {
  color: var(--pt-color-text);
  background: var(--pt-color-surface-soft);
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
.comparison-button:hover { background: var(--pt-color-action-bg-hover); }
.comparison-button--secondary {
  border-color: var(--pt-color-border);
  color: var(--pt-color-text);
  background: var(--pt-color-surface);
}
`;
  return `@import "./comparison-tokens.css";\n\n${next.trim()}\n${override}`;
}

const testSource = `import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..", "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const blocks = (css) => [...css.matchAll(/([^{}]+)\\{([^{}]*)\\}/g)].map((match) => ({ selector: match[1].trim(), body: match[2] }));

const layout = read("packages/affiliate-core/src/styles/page-layout-engine.css");
const system = read("packages/affiliate-core/src/components/comparison/comparison-system.css");
const tokens = read("packages/affiliate-core/src/components/comparison/comparison-tokens.css");
const product = read("apps/pfotentechnik/src/pages/produkt/[product].astro");
const comparison = read("apps/pfotentechnik/src/pages/vergleiche/[comparison].astro");
const shell = read("packages/affiliate-core/src/components/comparison/ComparisonShell.astro");

test("ein gemeinsamer Layout-Owner", () => {
  assert.match(layout, /\\.container\\.container--page\\s*\\{/);
  assert.match(product, /mainClass="container--page"/);
  assert.match(comparison, /mainClass="container--page"/);
  assert.doesNotMatch(product + "\\n" + comparison + "\\n" + shell, /container--product|container--immersive|comparison-detail|comparison-shell--premium/);
});

test("identische Breite und mobile Gutter", () => {
  assert.match(layout, /--pt-content-width:\\s*1200px/);
  assert.match(layout, /--pt-page-gutter:\\s*16px/);
  assert.match(layout, /\\.pt-page\\s*>\\s*\\*/);
  assert.match(layout, /\\.pt-page\\s*>\\s*\\.comparison-shell/);
  for (const block of blocks(system)) {
    if (block.selector.split(",").some((part) => [".comparison-detail", ".comparison-shell"].includes(part.trim()))) {
      const declarations = Object.fromEntries(
        block.body
          .split(";")
          .map((entry) => entry.trim())
          .filter(Boolean)
          .map((entry) => {
            const separator = entry.indexOf(":");
            return separator < 0
              ? [entry.toLowerCase(), ""]
              : [entry.slice(0, separator).trim().toLowerCase(), entry.slice(separator + 1).trim()];
          })
      );
      assert.ok(!("margin" in declarations), "Root darf keinen eigenen margin-Owner besitzen");
      assert.ok(!("margin-inline" in declarations), "Root darf keinen eigenen margin-inline-Owner besitzen");
      assert.ok(!("padding" in declarations), "Root darf keinen eigenen padding-Owner besitzen");
      if ("width" in declarations) {
        assert.equal(declarations.width, "100%", "Nur neutrale Vollbreite ist erlaubt");
      }
      if ("max-width" in declarations) {
        assert.equal(declarations["max-width"], "100%", "Keine eigene begrenzende Contentbreite erlaubt");
      }
    }
  }
});

test("Produktgalerie bleibt Full-Bleed", () => {
  assert.match(layout, /\\[data-mobile-gallery-full-bleed\\][\\s\\S]*width:\\s*100vw/);
  assert.match(layout, /margin-inline:\\s*calc\\(50%\\s*-\\s*50vw\\)/);
});

test("keine eigene Vergleichspalette", () => {
  const all = system + "\\n" + tokens;
  assert.doesNotMatch(all, /#16302b|#18743b|#0f5d2d|#e5f5e8/i);
  assert.doesNotMatch(tokens, /--comparison-[\\w-]+\\s*:\\s*#/i);
  for (const token of [
    "--pt-color-surface", "--pt-color-surface-soft", "--pt-color-surface-raised",
    "--pt-color-text", "--pt-color-text-muted", "--pt-color-border",
    "--pt-color-action-bg", "--pt-color-action-bg-hover", "--pt-color-action-text"
  ]) assert.ok(all.includes(token), "Token fehlt: " + token);
});

test("Hero ohne grüne oder weiße Sonderfarbwelt", () => {
  assert.match(system, /\\.comparison-hero[\\s\\S]*background:\\s*var\\(--pt-color-surface\\)/);
  assert.match(system, /\\.comparison-hero h1[\\s\\S]*color:\\s*var\\(--pt-color-text\\)/);
  assert.match(system, /\\.comparison-hero__copy\\s*>\\s*p[\\s\\S]*color:\\s*var\\(--pt-color-text-muted\\)/);
  assert.doesNotMatch(system, /rgba?\\(\\s*7\\s*,\\s*31\\s*,\\s*27|#b9efc5/i);
});

test("keine Theme-Sonderselektoren oder neuen important-Regeln", () => {
  const clean = (layout + "\\n" + system + "\\n" + tokens).replace(/\\/\\*[\\s\\S]*?\\*\\//g, "");
  assert.doesNotMatch(clean, /(?:^|[},])\\s*(?:\\.theme-dark\\b|\\.dark\\b|\\[data-theme(?:[=\\]])?)[^{]*\\{/m);
  assert.doesNotMatch(layout, /!important/);
  assert.doesNotMatch(tokens, /!important/);
  const generatedOverride = system.split("/* Layout Engine 31 theme normalization. */").at(-1) ?? "";
  assert.doesNotMatch(generatedOverride, /!important/);
});

`;

try {
  [abs.product,abs.comparison,abs.shell,abs.projectLayout].forEach(validateAstro);
  write(abs.layout,layout);
  write(abs.tokens,tokens);
  write(abs.system,systemCss(read(abs.system)));
  write(abs.product,rootClass(ensureMainClass(read(abs.product)),"product"));
  write(abs.comparison,rootClass(ensureMainClass(read(abs.comparison)),"comparison"));
  write(abs.shell,read(abs.shell)
    .replace(/\s+comparison-shell--premium\b/g,"")
    .replace(/\s+data-dark-mode-ready=(?:"true"|'true')/g,"")
    .replace(/\s+data-comparison-cover-version=(?:"[^"]*"|'[^']*')/g,' data-layout-engine="31.0.0"'));
  write(abs.test,testSource);

  const global=read(abs.global);
  const without=global.replace(/@import\s+["']\.\/page-layout-engine\.css["'];?\s*/g,"").trim();
  const head=without.match(/^(?:\s*@import[^;]+;\s*)+/)?.[0] ?? "";
  const rest=without.slice(head.length).trimStart();
  write(abs.global,`${head.trimEnd()}\n@import "./page-layout-engine.css";${rest?`\n\n${rest}`:""}`);

  run(process.execPath,["--check",scriptFile]);
  run(process.execPath,["--test",abs.test]);
  run("npm",["--workspace","apps/pfotentechnik","run","lint:content"]);
  run("npm",["--workspace","apps/pfotentechnik","run","build"]);
  console.log(`[${PATCH}] Backup: ${path.relative(root,backupRoot)}`);
  console.log(`[${PATCH}] Geändert: ${changed.length}`);
  for (const file of changed) console.log(`- ${file}`);
  console.log(`[${PATCH}] Erfolgreich abgeschlossen.`);
} catch (error) {
  rollback();
  console.error(`[${PATCH}] Fehler. Änderungen wurden zurückgerollt.`);
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode=1;
}

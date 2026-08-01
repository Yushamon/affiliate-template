#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-global-dark-mode-surface-contract-25.8.2";

function findRoot(start) {
  let current = path.resolve(start);

  for (let index = 0; index < 12; index += 1) {
    if (fs.existsSync(path.join(current, "apps", "pfotentechnik", "package.json"))) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  throw new Error("Repository-Wurzel nicht gefunden.");
}

const ROOT = findRoot(process.cwd());
const APP = path.join(ROOT, "apps", "pfotentechnik");
const CORE = path.join(ROOT, "packages", "affiliate-core");
const BACKUP = path.join(
  ROOT,
  ".patch-backups",
  `${NAME}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

const paths = {
  tokens: path.join(APP, "src", "styles", "pfotentechnik-design-tokens.css"),
  home: path.join(CORE, "src", "components", "home", "home.css"),
  autoBlocks: path.join(APP, "src", "components", "AutoContentBlocks.astro"),
  comparisons: path.join(APP, "src", "pages", "vergleiche", "index.astro"),
  manufacturers: path.join(APP, "src", "pages", "hersteller", "index.astro"),
  layout: path.join(APP, "src", "layouts", "ProjectLayout.astro"),
  contract: path.join(APP, "src", "styles", "pfotentechnik-dark-mode-contract.css"),
  test: path.join(APP, "test", "global-dark-mode-surface-contract-25.8.2.test.mjs"),
  package: path.join(APP, "package.json")
};

function backup(target) {
  if (!fs.existsSync(target)) return;

  const destination = path.join(BACKUP, path.relative(ROOT, target));
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(target, destination);
}

function read(target) {
  if (!fs.existsSync(target)) {
    throw new Error(`Datei nicht gefunden: ${path.relative(ROOT, target)}`);
  }

  return fs.readFileSync(target, "utf8");
}

function write(target, content) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
  console.log(`[${NAME}] Geschrieben: ${path.relative(ROOT, target)}`);
}

function replaceRequired(source, search, replacement, label) {
  if (source.includes(replacement)) return source;

  if (!source.includes(search)) {
    throw new Error(`Erwarteter Stand fehlt: ${label}`);
  }

  return source.replace(search, replacement);
}

function replaceLastStyleBlock(source, replacement, label) {
  const start = source.lastIndexOf("<style>");
  const end = source.indexOf("</style>", start);

  if (start < 0 || end < 0) {
    throw new Error(`Style-Block nicht gefunden: ${label}`);
  }

  return `${source.slice(0, start)}<style>\n${replacement.trim()}\n</style>${source.slice(end + "</style>".length)}`;
}

Object.values(paths).forEach(backup);

/*
 * 1. Theme-reactive colors and invariant foregrounds are separate concepts.
 *    The old patch reused --pt-color-surface as text on dark media. Once the
 *    surface token became dark, those headings became dark as well.
 */
let tokens = read(paths.tokens);
const invariantTokens = `
/*
 * Stable foreground and media tokens.
 * These values describe luminance contracts and therefore do not flip with
 * the page theme.
 */
:root {
  --pt-color-text-inverse: #ffffff;
  --pt-color-text-inverse-muted: rgb(255 255 255 / 0.74);
  --pt-color-media-stage: #eef1ed;
}
`;

if (!tokens.includes("Stable foreground and media tokens")) {
  tokens = `${tokens.trimEnd()}\n\n${invariantTokens.trim()}\n`;
}

write(paths.tokens, tokens);

/*
 * 2. Homepage: local variables inherit the active theme. Dark image overlays
 *    keep an invariant light foreground. Cards use semantic surfaces.
 */
let home = read(paths.home);

home = replaceRequired(
  home,
  `:root {
  --home3-text: #0d302b;
  --home3-muted: #627471;
  --home3-accent: #18743b;
  --home3-dark: #0b2b26;
  --home3-line: #dce5e3;
  --home3-soft: #f2f8f4;
  --home3-shadow: 0 18px 55px rgba(20, 32, 26, 0.08);
}`,
  `:root {
  --home3-text: var(--pt-color-text);
  --home3-muted: var(--pt-color-text-muted);
  --home3-accent: var(--pt-color-brand-500);
  --home3-dark: #0b2b26;
  --home3-line: var(--pt-color-border);
  --home3-soft: var(--pt-color-surface-soft);
  --home3-shadow: var(--pt-shadow-md);
}`,
  "Homepage-Farbvariablen"
);

home = home.replaceAll(
  "color: var(--pt-color-surface);",
  "color: var(--pt-color-text-inverse);"
);

home = replaceRequired(
  home,
  `.home3-button--primary {
  color: var(--pt-color-text-inverse);`,
  `.home3-button--primary {
  color: var(--pt-color-on-accent);`,
  "Primärer Hero-Button"
);

home = home
  .replace(/background:\s*#fff(?:fff)?;/gi, "background: var(--pt-color-surface);")
  .replaceAll("background: #f4f6f3;", "background: var(--pt-color-media-stage);")
  .replaceAll("background: #eef1ed;", "background: var(--pt-color-media-stage);");

write(paths.home, home);

/*
 * 3. Auto content blocks: one semantic base palette replaces three diverging
 *    dark-mode implementations. This fixes the white cards with white text.
 */
let autoBlocks = read(paths.autoBlocks);

const autoBlocksCss = `
  .cp-auto-block {
    margin: 52px 0;
    color: var(--pt-color-text);
  }

  .cp-auto-block > header {
    max-width: 780px;
    margin-bottom: 22px;
  }

  .cp-auto-block > header > span {
    display: block;
    margin-bottom: 7px;
    color: var(--pt-color-brand-500);
    font-size: .78rem;
    font-weight: 800;
    letter-spacing: .08em;
    text-transform: uppercase;
  }

  .cp-auto-block h2 {
    margin: 0 0 10px;
    color: var(--pt-color-text);
    font-size: clamp(1.65rem, 3vw, 2.35rem);
    line-height: 1.12;
  }

  .cp-auto-block header p,
  .cp-product-card p {
    color: var(--pt-color-text-muted);
  }

  .cp-auto-block header p {
    margin: 0;
    line-height: 1.65;
  }

  .cp-auto-summary,
  .cp-auto-list {
    padding: clamp(22px, 4vw, 34px);
    border: 1px solid var(--pt-color-border);
    border-radius: 24px;
    background: var(--pt-color-surface-soft);
  }

  .cp-auto-block ul,
  .cp-auto-block ol {
    margin: 0;
    padding-left: 1.25rem;
  }

  .cp-auto-block li + li {
    margin-top: 10px;
  }

  .cp-product-grid,
  .cp-fit-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 16px;
  }

  .cp-product-card,
  .cp-fit-grid article {
    overflow: hidden;
    border: 1px solid var(--pt-color-border);
    border-radius: 20px;
    color: var(--pt-color-text);
    background: var(--pt-color-surface);
  }

  .cp-product-card {
    text-decoration: none;
  }

  .cp-product-card > div,
  .cp-fit-grid article {
    padding: 20px;
  }

  .cp-product-card h3,
  .cp-fit-grid h3 {
    margin: 5px 0 10px;
    color: var(--pt-color-text);
  }

  .cp-product-card p {
    line-height: 1.55;
  }

  .cp-product-card strong {
    color: var(--pt-color-brand-500);
  }

  .cp-table-wrap {
    overflow-x: auto;
    border: 1px solid var(--pt-color-border);
    border-radius: 20px;
  }

  .cp-table-wrap table {
    width: 100%;
    min-width: 680px;
    border-collapse: collapse;
    color: var(--pt-color-text);
    background: var(--pt-color-surface);
  }

  .cp-table-wrap th,
  .cp-table-wrap td {
    padding: 15px 16px;
    border-bottom: 1px solid var(--pt-color-border);
    text-align: left;
    vertical-align: top;
  }

  .cp-table-wrap thead th {
    color: var(--pt-color-text-muted);
    background: var(--pt-color-surface-soft);
    font-size: .82rem;
  }

  .cp-table-wrap a {
    color: var(--pt-color-brand-500);
  }
`;

autoBlocks = replaceLastStyleBlock(
  autoBlocks,
  autoBlocksCss,
  "AutoContentBlocks"
);

write(paths.autoBlocks, autoBlocks);

/*
 * 4. Comparison hub: its old private light palette overrode the global theme.
 */
let comparisons = read(paths.comparisons);
const comparisonCss = `
  .comparison-hub-hero,
  .comparison-hub {
    --accent: var(--pt-color-brand-500);
    --accent-dark: var(--pt-color-brand-600);
    --text: var(--pt-color-text);
    --muted: var(--pt-color-text-muted);
    --border: var(--pt-color-border);
    --surface: var(--pt-color-surface);
    --surface-soft: var(--pt-color-surface-soft);
    box-sizing: border-box;
  }

  .comparison-hub-hero *,
  .comparison-hub * {
    box-sizing: border-box;
  }

  .comparison-hub-hero {
    max-width: 980px;
    margin: 1.5rem auto 3rem;
    padding: clamp(2rem, 5vw, 4.5rem);
    border: 1px solid var(--border);
    border-radius: 1.75rem;
    background:
      radial-gradient(
        circle at top right,
        color-mix(in srgb, var(--accent) 16%, transparent),
        transparent 38%
      ),
      linear-gradient(145deg, var(--surface), var(--surface-soft));
    box-shadow: var(--pt-shadow-md);
    text-align: center;
  }

  .comparison-hub-hero > span,
  .comparison-hub > header > span,
  .comparison-manufacturer-cta span {
    color: var(--accent);
    font-size: 0.76rem;
    font-weight: 900;
    letter-spacing: 0.09em;
    text-transform: uppercase;
  }

  .comparison-hub-hero h1 {
    max-width: 18ch;
    margin: 0.75rem auto 1.25rem;
    color: var(--text);
    font-size: clamp(2.75rem, 6vw, 5rem);
    line-height: 0.98;
    letter-spacing: -0.05em;
  }

  .comparison-hub-hero p,
  .comparison-hub > header p,
  .comparison-card p,
  .comparison-manufacturer-cta p {
    color: var(--muted);
    line-height: 1.7;
  }

  .comparison-hub-hero p {
    max-width: 66ch;
    margin: 0 auto;
  }

  .comparison-hub > header {
    max-width: 800px;
    margin-bottom: 1.5rem;
  }

  .comparison-hub h2 {
    margin: 0.5rem 0 0.75rem;
    color: var(--text);
    font-size: clamp(2rem, 4vw, 3.25rem);
    line-height: 1.08;
    letter-spacing: -0.04em;
  }

  .comparison-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.25rem;
  }

  .comparison-card {
    display: grid;
    padding: 1.4rem;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: start;
    gap: 1rem;
    border: 1px solid var(--border);
    border-radius: 1.2rem;
    color: var(--text);
    background: linear-gradient(145deg, var(--surface), var(--surface-soft));
    box-shadow: var(--pt-shadow-sm);
    text-decoration: none;
    transition: transform 180ms ease, box-shadow 180ms ease;
  }

  .comparison-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--pt-shadow-md);
  }

  .comparison-icon {
    display: grid;
    width: 3rem;
    height: 3rem;
    place-items: center;
    border-radius: 0.9rem;
    background: color-mix(in srgb, var(--accent) 14%, transparent);
    font-size: 1.35rem;
  }

  .comparison-card small {
    color: var(--accent);
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .comparison-card h3 {
    margin: 0.45rem 0 0.65rem;
    color: var(--text);
    font-size: 1.2rem;
    line-height: 1.25;
  }

  .comparison-card p {
    margin: 0 0 1rem;
    font-size: 0.9rem;
  }

  .comparison-card strong {
    color: var(--accent);
    font-size: 0.88rem;
  }

  .comparison-empty {
    padding: 1.5rem;
    border: 1px dashed var(--border);
    border-radius: 1rem;
    color: var(--text);
    background: var(--surface-soft);
  }

  .comparison-manufacturer-cta {
    display: flex;
    margin: 4rem 0;
    padding: clamp(1.5rem, 4vw, 2.5rem);
    align-items: center;
    justify-content: space-between;
    gap: 2rem;
    border: 1px solid var(--border);
    border-radius: 1.4rem;
    background:
      linear-gradient(
        135deg,
        color-mix(in srgb, var(--accent) 14%, var(--surface)),
        var(--surface) 54%
      );
  }

  .comparison-manufacturer-cta p {
    margin: 0;
  }

  .comparison-manufacturer-cta > a {
    display: inline-flex;
    min-height: 3.4rem;
    padding: 0.85rem 1.2rem;
    flex: 0 0 auto;
    align-items: center;
    gap: 0.7rem;
    border-radius: 0.8rem;
    color: var(--pt-color-on-brand);
    background: linear-gradient(135deg, var(--accent), var(--accent-dark));
    font-weight: 850;
    text-decoration: none;
  }

  @media (max-width: 980px) {
    .comparison-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 700px) {
    .comparison-grid {
      grid-template-columns: 1fr;
    }

    .comparison-manufacturer-cta {
      align-items: stretch;
      flex-direction: column;
    }

    .comparison-manufacturer-cta > a {
      justify-content: center;
    }
  }
`;

comparisons = replaceLastStyleBlock(
  comparisons,
  comparisonCss,
  "Vergleichsübersicht"
);

write(paths.comparisons, comparisons);

/*
 * 5. Manufacturer hub: headings, card surfaces and secondary copy use tokens.
 */
let manufacturers = read(paths.manufacturers);

manufacturers = manufacturers.replaceAll(
  "background: #f7f8fa !important;",
  "background: var(--pt-color-media-stage) !important;"
);

const manufacturerCss = `
  .manufacturer-hub-hero {
    max-width: 860px;
    margin: 0 auto 3rem;
    text-align: center;
  }

  .manufacturer-hub-eyebrow {
    display: inline-flex;
    margin-bottom: .6rem;
    color: var(--pt-color-brand-500);
    font-size: .78rem;
    font-weight: 900;
    letter-spacing: .08em;
    text-transform: uppercase;
  }

  .manufacturer-hub-hero h1 {
    margin: 0 0 1rem;
    color: var(--pt-color-text);
    font-size: clamp(2.8rem, 6vw, 4.8rem);
    line-height: 1;
    letter-spacing: -.05em;
  }

  .manufacturer-hub-hero p {
    max-width: 60ch;
    margin: 0 auto;
    color: var(--pt-color-text-muted);
    line-height: 1.75;
  }

  .manufacturer-divider {
    display: grid;
    width: min(34rem, calc(100vw - 3rem));
    margin: 3rem auto;
    grid-template-columns: minmax(2rem, 1fr) auto minmax(2rem, 1fr);
    align-items: center;
    gap: 1rem;
    color: var(--pt-color-brand-500);
  }

  .manufacturer-divider span {
    height: 1px;
    background: currentColor;
    opacity: .3;
  }

  .manufacturer-divider strong {
    font-size: 1.5rem;
  }

  .manufacturer-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
    gap: 1.5rem;
  }

  .manufacturer-card {
    display: flex;
    overflow: hidden;
    flex-direction: column;
    border: 1px solid var(--pt-color-border);
    border-radius: 1.3rem;
    color: var(--pt-color-text);
    background: var(--pt-color-surface);
    box-shadow: var(--pt-shadow-sm);
    text-decoration: none;
    transition: transform .18s ease, box-shadow .18s ease;
  }

  .manufacturer-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--pt-shadow-md);
  }

  .manufacturer-card-image {
    aspect-ratio: 16 / 9;
    overflow: hidden;
    background: var(--pt-color-media-stage);
  }

  .manufacturer-card-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .manufacturer-card-content {
    display: flex;
    padding: 1.4rem;
    flex: 1;
    flex-direction: column;
    color: var(--pt-color-text);
    background: transparent;
  }

  .manufacturer-card-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: .45rem;
    margin-bottom: .7rem;
    color: var(--pt-color-brand-500);
    background: transparent;
    font-size: .72rem;
    font-weight: 900;
    letter-spacing: .08em;
    text-transform: uppercase;
  }

  .manufacturer-card-content h2 {
    margin: 0 0 .8rem;
    color: var(--pt-color-text);
    font-size: 1.7rem;
    line-height: 1.2;
  }

  .manufacturer-card-content p {
    margin: 0;
    color: var(--pt-color-text-muted);
    line-height: 1.65;
  }

  .manufacturer-rating {
    margin-top: 1rem;
    color: var(--pt-color-brand-500);
    font-weight: 800;
  }

  .manufacturer-link {
    margin-top: auto;
    padding-top: 1.4rem;
    color: var(--pt-color-brand-500);
    font-weight: 800;
  }

  @media (max-width: 760px) {
    .manufacturer-grid {
      grid-template-columns: 1fr;
    }
  }
`;

manufacturers = replaceLastStyleBlock(
  manufacturers,
  manufacturerCss,
  "Herstellerübersicht"
);

write(paths.manufacturers, manufacturers);

/*
 * 6. Shell contract: brand names have explicit foreground roles. The header
 *    follows the active page theme; the footer remains an intentionally dark
 *    brand surface in both themes.
 */
const contractCss = `/*
 * PfotenTechnik dark-mode surface contract.
 *
 * Page surfaces react to the active theme. Brand surfaces and media overlays
 * use stable inverse foregrounds instead of borrowing a surface color.
 */

.site-header-v2 .brand-name {
  color: var(--pt-color-text);
}

.footer-v2 .footer-brand-lockup,
.footer-v2 .footer-brand-name {
  color: var(--pt-color-text-inverse);
}

.footer-v2 .footer-brand-v2 p,
.footer-v2 .footer-values,
.footer-v2 .footer-column-v2 a,
.footer-v2 .footer-bottom-v2 {
  color: var(--pt-color-text-inverse-muted);
}
`;

write(paths.contract, contractCss);

let layout = read(paths.layout);
layout = replaceRequired(
  layout,
  `import "../styles/pfotentechnik-ui-system.css";`,
  `import "../styles/pfotentechnik-ui-system.css";
import "../styles/pfotentechnik-dark-mode-contract.css";`,
  "ProjectLayout-Import"
);

write(paths.layout, layout);

/*
 * 7. Regression tests guard against the exact failure mode shown on mobile.
 */
const testSource = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const APP = path.join(ROOT, "apps", "pfotentechnik");
const CORE = path.join(ROOT, "packages", "affiliate-core");

const read = (target) => fs.readFileSync(target, "utf8");

const tokens = read(path.join(APP, "src/styles/pfotentechnik-design-tokens.css"));
const home = read(path.join(CORE, "src/components/home/home.css"));
const autoBlocks = read(path.join(APP, "src/components/AutoContentBlocks.astro"));
const comparisons = read(path.join(APP, "src/pages/vergleiche/index.astro"));
const manufacturers = read(path.join(APP, "src/pages/hersteller/index.astro"));
const layout = read(path.join(APP, "src/layouts/ProjectLayout.astro"));
const contract = read(path.join(APP, "src/styles/pfotentechnik-dark-mode-contract.css"));

test("Inverse Vordergrundfarben sind von Theme-Surfaces getrennt", () => {
  assert.match(tokens, /--pt-color-text-inverse:\\s*#ffffff/);
  assert.match(tokens, /--pt-color-text-inverse-muted:/);
  assert.match(tokens, /--pt-color-media-stage:\\s*#eef1ed/);
});

test("Homepage nutzt Theme-Tokens für Überschriften und Karten", () => {
  assert.match(home, /--home3-text:\\s*var\\(--pt-color-text\\)/);
  assert.match(home, /--home3-line:\\s*var\\(--pt-color-border\\)/);
  assert.match(home, /\\.home3-hero h1[\\s\\S]*?color:\\s*var\\(--pt-color-text-inverse\\)/);
  assert.match(home, /\\.home3-button--primary[\\s\\S]*?color:\\s*var\\(--pt-color-on-accent\\)/);
  assert.doesNotMatch(home, /color:\\s*var\\(--pt-color-surface\\)/);
  assert.doesNotMatch(home, /background:\\s*#fff(?:fff)?;/i);
});

test("AutoContentBlocks besitzen nur noch eine semantische Palette", () => {
  assert.match(autoBlocks, /background:\\s*var\\(--pt-color-surface\\)/);
  assert.match(autoBlocks, /color:\\s*var\\(--pt-color-text\\)/);
  assert.doesNotMatch(autoBlocks, /html\\[data-theme="dark"\\]/);
  assert.doesNotMatch(autoBlocks, /prefers-color-scheme:\\s*dark/);
});

test("Vergleichs- und Hersteller-Hubs erben den aktiven Theme-Kontrakt", () => {
  assert.match(comparisons, /--text:\\s*var\\(--pt-color-text\\)/);
  assert.match(comparisons, /--surface:\\s*var\\(--pt-color-surface\\)/);
  assert.match(manufacturers, /manufacturer-hub-hero h1[\\s\\S]*?color:\\s*var\\(--pt-color-text\\)/);
  assert.match(manufacturers, /manufacturer-card[\\s\\S]*?background:\\s*var\\(--pt-color-surface\\)/);
});

test("Header und Footer verwenden explizite Vordergrundrollen", () => {
  assert.match(layout, /pfotentechnik-dark-mode-contract\\.css/);
  assert.match(contract, /\\.site-header-v2 \\.brand-name[\\s\\S]*?var\\(--pt-color-text\\)/);
  assert.match(contract, /\\.footer-v2 \\.footer-brand-name[\\s\\S]*?var\\(--pt-color-text-inverse\\)/);
  assert.doesNotMatch(contract, /!important/);
});
`;

write(paths.test, testSource);

const pkg = JSON.parse(read(paths.package));
pkg.scripts ??= {};

const newTest = "test/global-dark-mode-surface-contract-25.8.2.test.mjs";
const currentDarkModeCommand =
  pkg.scripts["test:product-dark-mode"] ??
  "node --test test/global-dark-mode-token-bridge-25.8.0.test.mjs test/global-dark-mode-system-theme-25.8.1.test.mjs";

if (!currentDarkModeCommand.includes(newTest)) {
  pkg.scripts["test:product-dark-mode"] = `${currentDarkModeCommand} ${newTest}`;
}

write(paths.package, `${JSON.stringify(pkg, null, 2)}\n`);

execFileSync(
  "npm",
  ["--workspace", "apps/pfotentechnik", "run", "test:product-dark-mode"],
  { cwd: ROOT, stdio: "inherit" }
);

execFileSync(
  "npm",
  ["--workspace", "apps/pfotentechnik", "run", "test:product-ux-cleanup"],
  { cwd: ROOT, stdio: "inherit" }
);

execFileSync(
  "npm",
  ["--workspace", "apps/pfotentechnik", "run", "product-standard-3:release:no-build"],
  { cwd: ROOT, stdio: "inherit" }
);

console.log(`[${NAME}] Fertig.`);
console.log(`[${NAME}] Danach: npm --workspace apps/pfotentechnik run build`);

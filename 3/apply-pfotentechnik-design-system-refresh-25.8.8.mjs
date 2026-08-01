#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-design-system-refresh-25.8.8";
const CHECK_ONLY = process.argv.includes("--check");
const SKIP_BUILD = process.argv.includes("--skip-build");

function findRoot(start) {
  let current = path.resolve(start);
  for (let index = 0; index < 12; index += 1) {
    if (fs.existsSync(path.join(current, "apps", "pfotentechnik", "package.json"))) return current;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}

const ROOT = findRoot(process.cwd());
const APP = path.join(ROOT, "apps", "pfotentechnik");
const BACKUP = path.join(
  ROOT,
  ".patch-backups",
  `${NAME}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

const files = {
  layout: path.join(APP, "src", "layouts", "ProjectLayout.astro"),
  tokens: path.join(APP, "src", "styles", "pfotentechnik-design-tokens.css"),
  test: path.join(APP, "test", "design-system-refresh-25.8.8.test.mjs")
};

const original = new Map();
const planned = new Map();

function relative(target) {
  return path.relative(ROOT, target).split(path.sep).join("/");
}

function read(target) {
  if (!fs.existsSync(target)) throw new Error(`Datei fehlt: ${relative(target)}`);
  const content = fs.readFileSync(target, "utf8");
  if (!original.has(target)) original.set(target, content);
  return content;
}

function plan(target, content) {
  const current = fs.existsSync(target) ? read(target) : "";
  if (current !== content) planned.set(target, content);
}

function replaceAllRequired(source, search, replacement, label) {
  if (!source.includes(search)) {
    if (source.includes(replacement)) return source;
    throw new Error(`Erwarteter Stand fehlt: ${label}`);
  }
  return source.split(search).join(replacement);
}

function backup(target) {
  if (!fs.existsSync(target)) return;
  const destination = path.join(BACKUP, relative(target));
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(target, destination);
}

function run(command, args) {
  console.log(`[${NAME}] Prüfe: ${command} ${args.join(" ")}`);
  execFileSync(command, args, { cwd: ROOT, stdio: "inherit", env: process.env });
}

/* 1. The central token source must be loaded after all compatibility layers. */
let layout = read(files.layout);

const oldImports = `import "../styles/pfotentechnik-design-tokens.css";
import "../styles/pfotentechnik-primitives.css";
import "../styles/pfotentechnik-responsive-resilience.css";
import "../styles/pfotentechnik-visual-density.css";
import "../styles/pfotentechnik.css";
import "../styles/pfotentechnik-design-system.css";
import "../styles/pfotentechnik-ui-system.css";`;

const newImports = `import "../styles/pfotentechnik-primitives.css";
import "../styles/pfotentechnik-responsive-resilience.css";
import "../styles/pfotentechnik-visual-density.css";
import "../styles/pfotentechnik.css";
import "../styles/pfotentechnik-design-system.css";
import "../styles/pfotentechnik-ui-system.css";
/*
 * The semantic token source is deliberately last.
 * Compatibility layers may define aliases, but may not win the cascade.
 */
import "../styles/pfotentechnik-design-tokens.css";`;

if (layout.includes(oldImports)) {
  layout = layout.replace(oldImports, newImports);
} else if (!layout.includes(newImports)) {
  throw new Error("Importreihenfolge in ProjectLayout entspricht keinem erwarteten Stand.");
}
plan(files.layout, layout);

/* 2. Refresh the one authoritative palette. */
let tokens = read(files.tokens);

const replacements = [
  ["--pt-color-brand-700: #1f5f35;", "--pt-color-brand-700: #216e45;", "Brand 700"],
  ["--pt-color-brand-600: #2e7d32;", "--pt-color-brand-600: #2f8f5b;", "Brand 600"],
  ["--pt-color-brand-500: #3f8f50;", "--pt-color-brand-500: #47a66d;", "Brand 500"],
  ["--pt-color-brand-100: #eaf5ed;", "--pt-color-brand-100: #dff3e7;", "Brand 100"],
  ["--pt-color-brand-050: #f4faf5;", "--pt-color-brand-050: #f0f8f3;", "Brand 050"],
  ["--pt-color-text: #17211b;", "--pt-color-text: #132019;", "Light text"],
  ["--pt-color-text-muted: #5f6f65;", "--pt-color-text-muted: #5a6d62;", "Light muted"],
  ["--pt-color-border: #dfe7e1;", "--pt-color-border: #d8e4dc;", "Light border"],
  ["--pt-color-border-strong: #cbd7ce;", "--pt-color-border-strong: #c3d3c8;", "Light strong border"],
  ["--pt-color-surface-soft: #f7faf8;", "--pt-color-surface-soft: #f4f8f5;", "Light soft surface"],
  ["--pt-color-page: #f5f8f6;", "--pt-color-page: #f3f7f4;", "Light page"],

  ["--pt-color-text: #edf5ef;", "--pt-color-text: #f2f8f4;", "Dark text"],
  ["--pt-color-text-muted: #acbcb0;", "--pt-color-text-muted: #b6c7bc;", "Dark muted"],
  ["--pt-color-border: #304238;", "--pt-color-border: #2c4637;", "Dark border"],
  ["--pt-color-border-strong: #405448;", "--pt-color-border-strong: #3d5c49;", "Dark strong border"],
  ["--pt-color-surface: #16221a;", "--pt-color-surface: #14241b;", "Dark surface"],
  ["--pt-color-surface-soft: #1b2a20;", "--pt-color-surface-soft: #192b20;", "Dark soft surface"],
  ["--pt-color-surface-raised: #203126;", "--pt-color-surface-raised: #1f3427;", "Dark raised surface"],
  ["--pt-color-page: #101a14;", "--pt-color-page: #0b1510;", "Dark page"],
  ["--pt-color-brand-100: #203d29;", "--pt-color-brand-100: #183d29;", "Dark brand 100"],
  ["--pt-color-brand-050: #172b1d;", "--pt-color-brand-050: #122c1e;", "Dark brand 050"],

  ["--pt-color-accent-text: #1f5f35;", "--pt-color-accent-text: #216e45;", "Light accent text"],
  ["--pt-color-accent-text: #72e6a6;", "--pt-color-accent-text: #78e7aa;", "Dark accent text"],
  ["--pt-color-action-bg: #2e7d32;", "--pt-color-action-bg: #2f8f5b;", "Action background"],
  ["--pt-color-action-bg-hover: #256b2b;", "--pt-color-action-bg-hover: #26784c;", "Light action hover"],
  ["--pt-color-action-bg-hover: #3f8f50;", "--pt-color-action-bg-hover: #3ea86d;", "Dark action hover"]
];

for (const [search, replacement, label] of replacements) {
  tokens = replaceAllRequired(tokens, search, replacement, label);
}

plan(files.tokens, tokens);

/* 3. Regression checks cover all affected element families through tokens. */
const testSource = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = path.resolve(app, "../..");
const read = (target) => fs.readFileSync(target, "utf8");

const layout = read(path.join(app, "src/layouts/ProjectLayout.astro"));
const tokens = read(path.join(app, "src/styles/pfotentechnik-design-tokens.css"));
const home = read(path.join(root, "packages/affiliate-core/src/components/home/home.css"));
const comparison = read(path.join(app, "src/pages/vergleiche/index.astro"));

const tokenIndex = layout.indexOf('import "../styles/pfotentechnik-design-tokens.css";');
const uiIndex = layout.indexOf('import "../styles/pfotentechnik-ui-system.css";');

test("the authoritative token source loads after every compatibility stylesheet", () => {
  assert.ok(tokenIndex > uiIndex);
  assert.equal(layout.match(/pfotentechnik-design-tokens\\.css/g)?.length, 1);
});

test("the refreshed light and dark palette is present", () => {
  assert.match(tokens, /--pt-color-text:\\s*#132019/);
  assert.match(tokens, /--pt-color-text:\\s*#f2f8f4/);
  assert.match(tokens, /--pt-color-page:\\s*#0b1510/);
  assert.match(tokens, /--pt-color-accent-text:\\s*#78e7aa/);
  assert.match(tokens, /--pt-color-action-bg:\\s*#2f8f5b/);
});

test("homepage titles, tile titles, copy and labels use semantic roles", () => {
  assert.match(home, /--home3-text:\\s*var\\(--pt-color-text\\)/);
  assert.match(home, /--home3-muted:\\s*var\\(--pt-color-text-muted\\)/);
  assert.match(home, /--home3-accent:\\s*var\\(--pt-color-accent-text\\)/);
  assert.match(home, /\\.home3-card-content h3[\\s\\S]*?color:\\s*var\\(--home3-text\\)/);
  assert.match(home, /\\.home3-card-content p[\\s\\S]*?color:\\s*var\\(--home3-muted\\)/);
});

test("comparison overview headings and cards resolve through semantic roles", () => {
  assert.match(comparison, /--comparison-text:\\s*var\\(--pt-color-text\\)/);
  assert.match(comparison, /--comparison-muted:\\s*var\\(--pt-color-text-muted\\)/);
  assert.match(comparison, /--comparison-accent:\\s*var\\(--pt-color-accent-text\\)/);
});

test("no new important declarations are introduced", () => {
  assert.doesNotMatch(tokens, /!important/);
});
`;

plan(files.test, testSource);

const changed = [...planned.keys()];

if (changed.length === 0) {
  console.log(`[${NAME}] Bereits vollständig angewendet.`);
  process.exit(0);
}

console.log(`[${NAME}] Geplante Änderungen:`);
for (const target of changed) console.log(`  schreiben: ${relative(target)}`);

if (CHECK_ONLY) {
  console.log(`[${NAME}] Vorprüfung erfolgreich. Keine Datei wurde verändert.`);
  process.exit(0);
}

for (const target of changed) backup(target);

try {
  for (const [target, content] of planned) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
    console.log(`[${NAME}] Geschrieben: ${relative(target)}`);
  }

  run(process.execPath, ["--test", relative(files.test)]);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "design-system:tokens:audit"]);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "design-system:components:audit"]);

  if (!SKIP_BUILD) {
    run("npm", ["--workspace", "apps/pfotentechnik", "run", "build"]);
  }

  console.log(`[${NAME}] Fertig.`);
} catch (error) {
  console.error(`[${NAME}] Validierung fehlgeschlagen. Änderungen werden zurückgerollt.`);
  for (const target of changed) {
    const backupFile = path.join(BACKUP, relative(target));
    if (fs.existsSync(backupFile)) {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(backupFile, target);
    } else if (!original.has(target) && fs.existsSync(target)) {
      fs.rmSync(target);
    }
  }
  throw error;
}

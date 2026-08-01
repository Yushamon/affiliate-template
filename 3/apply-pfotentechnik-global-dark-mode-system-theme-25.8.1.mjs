#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-global-dark-mode-system-theme-25.8.1";

function findRoot(start) {
  let dir = path.resolve(start);
  for (let index = 0; index < 12; index += 1) {
    if (fs.existsSync(path.join(dir, "apps", "pfotentechnik", "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}

const ROOT = findRoot(process.cwd());
const APP = path.join(ROOT, "apps", "pfotentechnik");
const TOKENS = path.join(APP, "src", "styles", "pfotentechnik-design-tokens.css");
const PACKAGE = path.join(APP, "package.json");
const BACKUP = path.join(ROOT, ".patch-backups", NAME + "-" + new Date().toISOString().replace(/[:.]/g, "-"));

function backup(target) {
  if (!fs.existsSync(target)) return;
  const destination = path.join(BACKUP, path.relative(ROOT, target));
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(target, destination);
}

if (!fs.existsSync(TOKENS)) {
  throw new Error("Design-Token-Datei nicht gefunden: " + path.relative(ROOT, TOKENS));
}

backup(TOKENS);
backup(PACKAGE);

let tokens = fs.readFileSync(TOKENS, "utf8");

const systemTheme = `
/*
 * System theme activation.
 * The current layout does not set a runtime theme class or data-theme
 * attribute, so semantic tokens follow the operating-system preference.
 */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;

    --pt-color-text: #edf5ef;
    --pt-color-text-muted: #acbcb0;
    --pt-color-border: #304238;
    --pt-color-border-strong: #405448;
    --pt-color-surface: #16221a;
    --pt-color-surface-soft: #1b2a20;
    --pt-color-surface-raised: #203126;
    --pt-color-page: #101a14;
    --pt-color-brand-100: #203d29;
    --pt-color-brand-050: #172b1d;
    --pt-color-success-soft: #183b23;
    --pt-color-danger-soft: #43201f;
    --pt-color-warning-soft: #3b2d13;
    --pt-color-on-accent: #07120a;

    --pt-shadow-xs: 0 1px 2px rgb(0 0 0 / 0.2);
    --pt-shadow-sm: 0 5px 18px rgb(0 0 0 / 0.24);
    --pt-shadow-md: 0 12px 34px rgb(0 0 0 / 0.3);
    --pt-shadow-lg: 0 24px 58px rgb(0 0 0 / 0.36);
  }
}
`;

if (!tokens.includes("System theme activation")) {
  tokens = tokens.trimEnd() + "\n\n" + systemTheme.trim() + "\n";
}

fs.writeFileSync(TOKENS, tokens);
console.log("[" + NAME + "] Geändert: " + path.relative(ROOT, TOKENS));

const testPath = path.join(APP, "test", "global-dark-mode-system-theme-25.8.1.test.mjs");
const testSource = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const APP = path.join(ROOT, "apps", "pfotentechnik");
const TOKENS = fs.readFileSync(
  path.join(APP, "src/styles/pfotentechnik-design-tokens.css"),
  "utf8"
);
const LAYOUT = fs.readFileSync(
  path.join(ROOT, "packages/affiliate-core/src/layouts/AffiliateLayout.astro"),
  "utf8"
);

test("Dark Mode folgt zentral der Systempräferenz", () => {
  assert.match(TOKENS, /@media\\s*\\(prefers-color-scheme:\\s*dark\\)/);
  assert.match(TOKENS, /:root:not\\(\\[data-theme="light"\\]\\)/);
  assert.match(TOKENS, /--pt-color-surface:\\s*#16221a/);
  assert.match(TOKENS, /--pt-color-text:\\s*#edf5ef/);
  assert.match(TOKENS, /--pt-color-page:\\s*#101a14/);
});

test("Aktuelles Layout setzt keinen Runtime-Dark-Selektor", () => {
  assert.doesNotMatch(LAYOUT, /<html[^>]+data-theme=/);
  assert.doesNotMatch(LAYOUT, /<html[^>]+class=.*dark/);
});

test("Globale Legacy-Aliasse bleiben an aktive Tokens gebunden", () => {
  assert.match(TOKENS, /--color-text:\\s*var\\(--pt-color-text\\)/);
  assert.match(TOKENS, /--color-surface:\\s*var\\(--pt-color-surface\\)/);
  assert.match(TOKENS, /--color-surface-subtle:\\s*var\\(--pt-color-surface-soft\\)/);
});
`;

fs.writeFileSync(testPath, testSource);
console.log("[" + NAME + "] Geschrieben: " + path.relative(ROOT, testPath));

const pkg = JSON.parse(fs.readFileSync(PACKAGE, "utf8"));
pkg.scripts ??= {};
pkg.scripts["test:product-dark-mode"] =
  "node --test test/global-dark-mode-token-bridge-25.8.0.test.mjs test/global-dark-mode-system-theme-25.8.1.test.mjs";
fs.writeFileSync(PACKAGE, JSON.stringify(pkg, null, 2) + "\n");
console.log("[" + NAME + "] Geändert: " + path.relative(ROOT, PACKAGE));

execFileSync("npm", ["--workspace", "apps/pfotentechnik", "run", "test:product-dark-mode"], {
  cwd: ROOT,
  stdio: "inherit"
});

execFileSync("npm", ["--workspace", "apps/pfotentechnik", "run", "test:product-ux-cleanup"], {
  cwd: ROOT,
  stdio: "inherit"
});

execFileSync("npm", ["--workspace", "apps/pfotentechnik", "run", "product-standard-3:release:no-build"], {
  cwd: ROOT,
  stdio: "inherit"
});

console.log("[" + NAME + "] Fertig.");
console.log("[" + NAME + "] Danach: npm --workspace apps/pfotentechnik run build");

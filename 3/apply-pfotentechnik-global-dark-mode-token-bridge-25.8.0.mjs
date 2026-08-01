#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-global-dark-mode-token-bridge-25.8.0";

function findRoot(start) {
  let dir = path.resolve(start);
  for (let i = 0; i < 12; i += 1) {
    if (fs.existsSync(path.join(dir, "apps", "pfotentechnik", "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}

function replaceCssRule(source, marker, replacement) {
  const start = source.indexOf(marker);
  if (start < 0) throw new Error("CSS-Regel nicht gefunden: " + marker);
  const brace = source.indexOf("{", start);
  let depth = 0;
  for (let i = brace; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    if (source[i] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(0, start) + replacement + source.slice(i + 1);
    }
  }
  throw new Error("CSS-Regel nicht vollständig: " + marker);
}

const ROOT = findRoot(process.cwd());
const APP = path.join(ROOT, "apps", "pfotentechnik");
const backupRoot = path.join(ROOT, ".patch-backups", NAME + "-" + new Date().toISOString().replace(/[:.]/g, "-"));

function backup(file) {
  if (!fs.existsSync(file)) return;
  const target = path.join(backupRoot, path.relative(ROOT, file));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
}

const tokensPath = path.join(APP, "src/styles/pfotentechnik-design-tokens.css");
const experiencePath = path.join(APP, "src/components/product-experience-2/ProductExperience2.astro");
const packagePath = path.join(APP, "package.json");

backup(tokensPath);
backup(experiencePath);
backup(packagePath);

let tokens = fs.readFileSync(tokensPath, "utf8");
const bridge = `
/* Global semantic theme bridge: legacy and current components share one palette. */
:root {
  --pt-color-success-soft: #e2f3e5;
  --pt-color-danger-soft: #fee9e7;
  --pt-color-warning-soft: #fff4d8;
  --pt-color-on-accent: #ffffff;

  --color-primary: var(--pt-color-brand-600);
  --color-primary-strong: var(--pt-color-brand-700);
  --color-primary-soft: var(--pt-color-brand-100);
  --color-text: var(--pt-color-text);
  --color-text-muted: var(--pt-color-text-muted);
  --color-border: var(--pt-color-border);
  --color-border-strong: var(--pt-color-border-strong);
  --color-surface: var(--pt-color-surface);
  --color-surface-subtle: var(--pt-color-surface-soft);
  --color-surface-raised: var(--pt-color-surface-raised);
  --color-page: var(--pt-color-page);
  --color-success: var(--pt-color-success-600);
  --color-success-soft: var(--pt-color-success-soft);
  --color-danger: var(--pt-color-danger-600);
  --color-danger-soft: var(--pt-color-danger-soft);
  --color-warning: var(--pt-color-warning-500);
  --color-warning-soft: var(--pt-color-warning-soft);
  --color-on-accent: var(--pt-color-on-accent);
}

[data-theme="dark"],
.dark {
  --pt-color-success-soft: #183b23;
  --pt-color-danger-soft: #43201f;
  --pt-color-warning-soft: #3b2d13;
  --pt-color-on-accent: #07120a;
}
`;

if (!tokens.includes("Global semantic theme bridge")) {
  tokens = tokens.trimEnd() + "\n\n" + bridge.trim() + "\n";
}
fs.writeFileSync(tokensPath, tokens);
console.log("[" + NAME + "] Geändert: " + path.relative(ROOT, tokensPath));

let experience = fs.readFileSync(experiencePath, "utf8");
const px2 = `  .px2 {
    --px2-surface: var(--pt-color-surface);
    --px2-surface-soft: var(--pt-color-surface-soft);
    --px2-surface-raised: var(--pt-color-surface-raised);
    --px2-text: var(--pt-color-text);
    --px2-muted: var(--pt-color-text-muted);
    --px2-border: var(--pt-color-border);
    --px2-green: var(--pt-color-brand-600);
    --px2-green-strong: var(--pt-color-brand-700);
    --px2-green-soft: var(--pt-color-success-soft);
    --px2-amber: var(--pt-color-warning-500);
    --px2-amber-soft: var(--pt-color-warning-soft);
    --px2-red: var(--pt-color-danger-600);
    --px2-red-soft: var(--pt-color-danger-soft);
    --px2-indigo: var(--pt-color-accent-600);
    --px2-shadow: var(--pt-shadow-sm);
    --px2-on-accent: var(--pt-color-on-accent);
    display: grid;
    gap: clamp(24px, 4vw, 46px);
    width: 100%;
    min-width: 0;
    color: var(--px2-text);
  }`;

experience = replaceCssRule(experience, "  .px2 {", px2);

const darkStart = experience.indexOf('  :global(html[data-theme="dark"]) .px2,');
if (darkStart >= 0) {
  const next = experience.indexOf("  .px2 :global(*)", darkStart);
  if (next < 0) throw new Error("Lokaler Dark-Mode-Block konnte nicht entfernt werden.");
  experience = experience.slice(0, darkStart) + experience.slice(next);
}

fs.writeFileSync(experiencePath, experience);
console.log("[" + NAME + "] Geändert: " + path.relative(ROOT, experiencePath));

const testPath = path.join(APP, "test/global-dark-mode-token-bridge-25.8.0.test.mjs");
fs.writeFileSync(testPath, `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const APP = path.join(ROOT, "apps", "pfotentechnik");
const tokens = fs.readFileSync(path.join(APP, "src/styles/pfotentechnik-design-tokens.css"), "utf8");
const experience = fs.readFileSync(path.join(APP, "src/components/product-experience-2/ProductExperience2.astro"), "utf8");

test("Legacy-Aliasse nutzen globale PfotenTechnik-Tokens", () => {
  assert.match(tokens, /--color-text:\\s*var\\(--pt-color-text\\)/);
  assert.match(tokens, /--color-surface:\\s*var\\(--pt-color-surface\\)/);
  assert.match(tokens, /--color-surface-subtle:\\s*var\\(--pt-color-surface-soft\\)/);
  assert.match(tokens, /--color-border:\\s*var\\(--pt-color-border\\)/);
});

test("Statusflächen besitzen zentrale Dark-Mode-Tokens", () => {
  assert.match(tokens, /--pt-color-success-soft:\\s*#183b23/);
  assert.match(tokens, /--pt-color-danger-soft:\\s*#43201f/);
  assert.match(tokens, /--pt-color-warning-soft:\\s*#3b2d13/);
});

test("Product Experience verwendet keine eigene Farbpalette mehr", () => {
  assert.match(experience, /--px2-surface:\\s*var\\(--pt-color-surface\\)/);
  assert.match(experience, /--px2-text:\\s*var\\(--pt-color-text\\)/);
  assert.match(experience, /--px2-red-soft:\\s*var\\(--pt-color-danger-soft\\)/);
  assert.doesNotMatch(experience, /:global\\(html\\[data-theme="dark"\\]\\) \\.px2/);
  assert.doesNotMatch(experience.split("<style>")[1] ?? "", /--px2-[a-z-]+:\\s*#[0-9a-f]{3,8}/i);
});
`);
console.log("[" + NAME + "] Geschrieben: " + path.relative(ROOT, testPath));

const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
pkg.scripts ??= {};
pkg.scripts["test:product-dark-mode"] = "node --test test/global-dark-mode-token-bridge-25.8.0.test.mjs";
fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + "\n");
console.log("[" + NAME + "] Geändert: " + path.relative(ROOT, packagePath));

execFileSync("npm", ["--workspace", "apps/pfotentechnik", "run", "test:product-dark-mode"], { cwd: ROOT, stdio: "inherit" });
execFileSync("npm", ["--workspace", "apps/pfotentechnik", "run", "test:product-ux-cleanup"], { cwd: ROOT, stdio: "inherit" });
execFileSync("npm", ["--workspace", "apps/pfotentechnik", "run", "product-standard-3:release:no-build"], { cwd: ROOT, stdio: "inherit" });

console.log("[" + NAME + "] Fertig.");
console.log("[" + NAME + "] Danach: npm --workspace apps/pfotentechnik run build");

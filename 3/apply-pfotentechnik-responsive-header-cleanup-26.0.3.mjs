#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-responsive-header-cleanup-26.0.3";
const CHECK_ONLY = process.argv.includes("--check");
const SKIP_BUILD = process.argv.includes("--skip-build");

function findRoot(start) {
  let current = path.resolve(start);
  for (let i = 0; i < 12; i += 1) {
    if (fs.existsSync(path.join(current, "apps", "pfotentechnik", "package.json"))) return current;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}

const ROOT = findRoot(process.cwd());
const APP = path.join(ROOT, "apps", "pfotentechnik");
const HEADER = path.join(ROOT, "packages", "affiliate-core", "src", "components", "Header.astro");
const TEST = path.join(APP, "test", "responsive-header-cleanup-26.0.3.test.mjs");
const BACKUP = path.join(ROOT, ".patch-backups", `${NAME}-${new Date().toISOString().replace(/[:.]/g, "-")}`);
const original = fs.readFileSync(HEADER, "utf8");
let source = original;

function replaceRequired(search, replacement, label) {
  if (source.includes(replacement)) return;
  if (!source.includes(search)) throw new Error(`Erwarteter Header-Stand fehlt: ${label}`);
  source = source.replace(search, replacement);
}

replaceRequired(
`  .site-header-v2 .header-container-v2 {
    position: relative;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
  }`,
`  .site-header-v2 .header-container-v2 {
    position: relative;
    display: grid;
    width: min(100%, var(--pt-content));
    margin-inline: auto;
    padding-inline: clamp(1rem, 3vw, 2rem);
    box-sizing: border-box;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
  }`,
"gemeinsamer Container");

replaceRequired(
`  @media (min-width: 48rem) {
    .site-header-v2 .main-nav-v2 {
      visibility: visible;
      opacity: 1;
      pointer-events: auto;
      transform: none;
    }
  }`,
`  @media (min-width: 48rem) {
    .site-header-v2 .nav-toggle-button {
      display: none;
    }

    .site-header-v2 .main-nav-v2 {
      position: static;
      display: block;
      visibility: visible;
      opacity: 1;
      pointer-events: auto;
      transform: none;
    }
  }`,
"Desktop-Vertrag");

replaceRequired(
`    .site-header-v2 .header-container-v2 {
      grid-template-columns: minmax(0, 1fr) auto;
      gap: var(--pt-space-3);
    }`,
`    .site-header-v2 .header-container-v2 {
      width: 100%;
      padding-inline: 1rem;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: var(--pt-space-3);
    }`,
"Mobile-Padding");

replaceRequired(
`  @media (min-width: 48rem) {
    .site-header-v2,
    .site-header-v2 .header-container-v2,`,
`  @media (min-width: 48rem) {
    .site-header-v2 .nav-toggle-button {
      display: none;
      visibility: hidden;
      pointer-events: none;
    }

    .site-header-v2 .main-nav-v2__desktop {
      display: flex;
    }

    .site-header-v2 .main-nav-v2__mobile {
      display: none;
    }

    .site-header-v2,
    .site-header-v2 .header-container-v2,`,
"abschließender Desktop-Vertrag");

const test = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = path.resolve(app, "../..");
const header = fs.readFileSync(path.join(root, "packages/affiliate-core/src/components/Header.astro"), "utf8");
test("desktop hides the burger and keeps desktop navigation", () => {
  assert.match(header, /@media\\s*\\(min-width:\\s*48rem\\)[\\s\\S]*?\\.site-header-v2 \\.nav-toggle-button\\s*\\{[\\s\\S]*?display:\\s*none/);
  assert.match(header, /\\.site-header-v2 \\.main-nav-v2__desktop\\s*\\{[\\s\\S]*?display:\\s*flex/);
  assert.match(header, /\\.site-header-v2 \\.main-nav-v2__mobile\\s*\\{[\\s\\S]*?display:\\s*none/);
});
test("mobile header has symmetric 16 px padding", () => {
  assert.match(header, /@media\\s*\\(max-width:\\s*47\\.99rem\\)[\\s\\S]*?padding-inline:\\s*1rem/);
});
test("CSS and JS use the same breakpoint", () => {
  assert.match(header, /window\\.matchMedia\\("\\(min-width: 48rem\\)"\\)/);
  assert.match(header, /@media\\s*\\(min-width:\\s*48rem\\)/);
});
test("no important rules", () => assert.doesNotMatch(header, /!important/));
`;

if (source === original && fs.existsSync(TEST)) {
  console.log(`[${NAME}] Bereits vollständig angewendet.`);
  process.exit(0);
}

console.log(`[${NAME}] Geplante Änderungen:`);
console.log("  schreiben: packages/affiliate-core/src/components/Header.astro");
console.log("  schreiben: apps/pfotentechnik/test/responsive-header-cleanup-26.0.3.test.mjs");
if (CHECK_ONLY) {
  console.log(`[${NAME}] Vorprüfung erfolgreich. Keine Datei wurde verändert.`);
  process.exit(0);
}

fs.mkdirSync(path.join(BACKUP, path.dirname(path.relative(ROOT, HEADER))), { recursive: true });
fs.copyFileSync(HEADER, path.join(BACKUP, path.relative(ROOT, HEADER)));
try {
  fs.writeFileSync(HEADER, source);
  fs.mkdirSync(path.dirname(TEST), { recursive: true });
  fs.writeFileSync(TEST, test);
  execFileSync(process.execPath, ["--test", path.relative(ROOT, TEST)], { cwd: ROOT, stdio: "inherit" });
  execFileSync("npm", ["--workspace", "apps/pfotentechnik", "run", "design-system:components:audit"], { cwd: ROOT, stdio: "inherit" });
  if (!SKIP_BUILD) execFileSync("npm", ["--workspace", "apps/pfotentechnik", "run", "build"], { cwd: ROOT, stdio: "inherit" });
  console.log(`[${NAME}] Fertig.`);
} catch (error) {
  console.error(`[${NAME}] Validierung fehlgeschlagen. Änderungen werden zurückgerollt.`);
  fs.copyFileSync(path.join(BACKUP, path.relative(ROOT, HEADER)), HEADER);
  if (fs.existsSync(TEST)) fs.rmSync(TEST);
  throw error;
}

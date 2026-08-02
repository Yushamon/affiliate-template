#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-home-layout-ownership-cleanup-26.0.6";
const CHECK_ONLY = process.argv.includes("--check");
const SKIP_BUILD = process.argv.includes("--skip-build");

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

const files = {
  layout: path.join(CORE, "src", "styles", "layout.css"),
  home: path.join(CORE, "src", "components", "home", "home.css"),
  homePage: path.join(CORE, "src", "components", "home", "HomePage.astro"),
  audit: path.join(APP, "scripts", "design-system", "audit-home-layout-ownership.mjs"),
  test: path.join(APP, "test", "home-layout-ownership-cleanup-26.0.6.test.mjs")
};

const originals = new Map();
const planned = new Map();

function relative(target) {
  return path.relative(ROOT, target).split(path.sep).join("/");
}

function read(target) {
  if (!fs.existsSync(target)) throw new Error(`Datei fehlt: ${relative(target)}`);
  const content = fs.readFileSync(target, "utf8");
  if (!originals.has(target)) originals.set(target, content);
  return content;
}

function plan(target, content) {
  const current = fs.existsSync(target) ? read(target) : "";
  if (current !== content) planned.set(target, content);
}

function backup(target) {
  if (!fs.existsSync(target)) return;

  const destination = path.join(BACKUP, relative(target));
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(target, destination);
}

function run(command, args) {
  console.log(`[${NAME}] Prüfe: ${command} ${args.join(" ")}`);
  execFileSync(command, args, {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env
  });
}

function removeRequired(source, block, label) {
  if (!source.includes(block)) {
    throw new Error(`Erwarteter Stand fehlt: ${label}`);
  }

  return source.replace(block, "");
}

let layout = read(files.layout);
let home = read(files.home);
const homePage = read(files.homePage);

const legacyBlock = `/* PT homepage header-to-hero spacing 4.5.1 */

/*
 * The regular page container needs generous top spacing below the header.
 * The homepage hero does not: it starts directly at the header edge.
 */
.container--home {
  padding-top: 0;
}

@media (max-width: 768px) {

}

@media (max-width: 720px) {
  .container--home .home3-hero {
    margin-top: 0;
  }

  /*
   * Move the complete text group slightly upward while keeping the content
   * bottom-aligned and preserving enough room for both buttons and signals.
   */
  .container--home .home3-hero__content {
    padding-bottom: clamp(2.65rem, 7vw, 3.5rem);
  }
}
/* End PT homepage header-to-hero spacing 4.5.1 */`;

layout = removeRequired(
  layout,
  legacyBlock,
  "Homepage-spezifischer Block in layout.css"
)
  .replace(/@media\s*\(max-width:\s*768px\)\s*\{\s*\}/g, "")
  .replace(/\n{3,}/g, "\n\n")
  .trimEnd() + "\n";

const canonicalBlock = `/* home-layout-ownership-26.0.6:start */
/*
 * Homepage layout belongs to the homepage component stylesheet.
 * Generic layout.css must not know about .container--home or .home3.
 */
.container--home {
  padding-top: 0;
}

@media (max-width: 45rem) {
  .container--home .home3-hero {
    margin-top: 0;
  }

  .container--home .home3-hero__content {
    padding-bottom: clamp(2.65rem, 7vw, 3.5rem);
  }
}
/* home-layout-ownership-26.0.6:end */`;

if (!home.includes("/* home-layout-ownership-26.0.6:start */")) {
  home = `${home.trimEnd()}\n\n${canonicalBlock}\n`;
}

if (!homePage.includes('import "./home.css";')) {
  throw new Error("HomePage.astro importiert die kanonische home.css nicht.");
}

plan(files.layout, layout);
plan(files.home, home);

const audit = `#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const app = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const root = path.resolve(app, "../..");

const layoutPath = path.join(
  root,
  "packages/affiliate-core/src/styles/layout.css"
);
const homePath = path.join(
  root,
  "packages/affiliate-core/src/components/home/home.css"
);
const pagePath = path.join(
  root,
  "packages/affiliate-core/src/components/home/HomePage.astro"
);

const layout = fs.readFileSync(layoutPath, "utf8");
const home = fs.readFileSync(homePath, "utf8");
const page = fs.readFileSync(pagePath, "utf8");
const errors = [];

if (/\\.home3(?:-|\\b)/.test(layout)) {
  errors.push("layout.css enthält weiterhin home3-spezifische Selektoren.");
}

if (/\\.container--home/.test(layout)) {
  errors.push("layout.css enthält weiterhin den Homepage-Container.");
}

if (/@media\\s*\\([^)]*\\)\\s*\\{\\s*\\}/.test(layout)) {
  errors.push("layout.css enthält einen leeren Media-Block.");
}

const required = [
  ["Homepage-Container", /\\.container--home\\s*\\{[\\s\\S]*?padding-top:\\s*0/],
  ["Hero-Abstand", /\\.container--home \\.home3-hero\\s*\\{[\\s\\S]*?margin-top:\\s*0/],
  ["Hero-Innenabstand", /\\.container--home \\.home3-hero__content\\s*\\{[\\s\\S]*?padding-bottom:/],
  ["Kanonischer Import", /import "\\.\\/home\\.css";/]
];

for (const [label, pattern] of required.slice(0, 3)) {
  if (!pattern.test(home)) errors.push(\`home.css fehlt: \${label}.\`);
}

if (!required[3][1].test(page)) {
  errors.push("HomePage.astro importiert home.css nicht.");
}

if (errors.length > 0) {
  console.error("Home-Layout-Ownership-Audit fehlgeschlagen:");
  for (const error of errors) console.error(\`- \${error}\`);
  process.exit(1);
}

console.log("Home-Layout-Ownership-Audit erfolgreich.");
console.log("Generisches Layout: packages/affiliate-core/src/styles/layout.css");
console.log("Homepage-Layout: packages/affiliate-core/src/components/home/home.css");
`;

plan(files.audit, audit);

const test = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = path.resolve(app, "../..");

const layout = fs.readFileSync(
  path.join(root, "packages/affiliate-core/src/styles/layout.css"),
  "utf8"
);
const home = fs.readFileSync(
  path.join(root, "packages/affiliate-core/src/components/home/home.css"),
  "utf8"
);
const page = fs.readFileSync(
  path.join(root, "packages/affiliate-core/src/components/home/HomePage.astro"),
  "utf8"
);

test("generic layout does not own homepage selectors", () => {
  assert.doesNotMatch(layout, /\\.home3(?:-|\\b)/);
  assert.doesNotMatch(layout, /\\.container--home/);
  assert.doesNotMatch(layout, /@media\\s*\\([^)]*\\)\\s*\\{\\s*\\}/);
});

test("homepage stylesheet owns its page spacing", () => {
  assert.match(home, /\\.container--home\\s*\\{/);
  assert.match(home, /\\.container--home \\.home3-hero\\s*\\{/);
  assert.match(home, /\\.container--home \\.home3-hero__content\\s*\\{/);
});

test("homepage component imports the canonical stylesheet", () => {
  assert.match(page, /import "\\.\\/home\\.css";/);
});

test("cleanup introduces no important declarations", () => {
  const migratedBlock = home.match(
    /\\/\\* home-layout-ownership-26\\.0\\.6:start \\*\\/[\\s\\S]*?\\/\\* home-layout-ownership-26\\.0\\.6:end \\*\\//
  )?.[0] ?? "";

  assert.ok(migratedBlock);
  assert.doesNotMatch(migratedBlock, /!important/);
});
`;

plan(files.test, test);

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

  run(process.execPath, [relative(files.audit)]);
  run(process.execPath, ["--test", relative(files.test)]);
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
    } else if (!originals.has(target) && fs.existsSync(target)) {
      fs.rmSync(target);
    }
  }

  throw error;
}

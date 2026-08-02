#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-footer-style-ownership-cleanup-26.0.5";
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
  footer: path.join(CORE, "src", "components", "Footer.astro"),
  shared: path.join(CORE, "src", "styles", "header-footer.css"),
  global: path.join(CORE, "src", "styles", "global.css"),
  audit: path.join(APP, "scripts", "design-system", "audit-footer-style-ownership.mjs"),
  test: path.join(APP, "test", "footer-style-ownership-cleanup-26.0.5.test.mjs")
};

const originals = new Map();
const planned = new Map();
const removals = new Set();

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

function planRemove(target) {
  if (fs.existsSync(target)) {
    read(target);
    removals.add(target);
  }
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

let footer = read(files.footer);
const shared = read(files.shared);
let globalCss = read(files.global);

const forbiddenHeaderSelectors = [
  ".site-header-v2",
  ".header-container-v2",
  ".main-nav-v2",
  ".nav-toggle-button",
  ".logo-v2"
];

const remainingHeaderSelectors = forbiddenHeaderSelectors.filter((selector) =>
  shared.includes(selector)
);

if (remainingHeaderSelectors.length > 0) {
  throw new Error(
    `26.0.4 wurde noch nicht vollständig angewendet. ` +
    `header-footer.css enthält weiterhin: ${remainingHeaderSelectors.join(", ")}`
  );
}

if (!shared.includes(".footer-v2")) {
  throw new Error("header-footer.css enthält keine Footer-Regeln.");
}

if (footer.includes("<style is:global>")) {
  throw new Error(
    "Footer.astro besitzt bereits einen globalen Stilblock. " +
    "Der Repository-Stand muss vor der Migration geprüft werden."
  );
}

const footerCss = shared
  .replace(/^\/\* Header styles live in components\/Header\.astro\. \*\/\s*/m, "")
  .trim();

footer = `${footer.trimEnd()}

<style is:global>
  /* Footer.astro is the sole owner of footer presentation. */
${footerCss
  .split("\n")
  .map((line) => (line ? `  ${line}` : ""))
  .join("\n")}
</style>
`;

globalCss = globalCss
  .replace(/^@import\s+"\.\/header-footer\.css";\s*\n?/m, "")
  .replace(/\n{3,}/g, "\n\n");

if (globalCss.includes("header-footer.css")) {
  throw new Error("Der Import von header-footer.css konnte nicht entfernt werden.");
}

plan(files.footer, footer);
plan(files.global, globalCss);
planRemove(files.shared);

const audit = `#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const app = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const root = path.resolve(app, "../..");

const footerPath = path.join(
  root,
  "packages/affiliate-core/src/components/Footer.astro"
);
const sharedPath = path.join(
  root,
  "packages/affiliate-core/src/styles/header-footer.css"
);
const globalPath = path.join(
  root,
  "packages/affiliate-core/src/styles/global.css"
);

const footer = fs.readFileSync(footerPath, "utf8");
const globalCss = fs.readFileSync(globalPath, "utf8");
const errors = [];

if (fs.existsSync(sharedPath)) {
  errors.push("header-footer.css existiert weiterhin.");
}

if (/header-footer\\.css/.test(globalCss)) {
  errors.push("global.css importiert weiterhin header-footer.css.");
}

const contracts = [
  ["Footer-Stilblock", /<style is:global>[\\s\\S]*?\\.footer-v2\\s*\\{/],
  ["Footer-Grid", /\\.footer-main-v2\\s*\\{[\\s\\S]*?grid-template-columns:/],
  ["Footer-Unterzeile", /\\.footer-bottom-v2\\s*\\{/],
  ["Mobile Footer", /@media\\s*\\(max-width:\\s*520px\\)[\\s\\S]*?\\.footer-main-v2/],
  ["Semantischer Vordergrund", /var\\(--pt-color-on-brand-surface/]
];

for (const [label, pattern] of contracts) {
  if (!pattern.test(footer)) errors.push(\`Footer.astro fehlt: \${label}.\`);
}

if (/\\.site-header-v2|\\.main-nav-v2|\\.nav-toggle-button/.test(footer)) {
  errors.push("Footer.astro enthält Header-Regeln.");
}

if (errors.length > 0) {
  console.error("Footer-Style-Ownership-Audit fehlgeschlagen:");
  for (const error of errors) console.error(\`- \${error}\`);
  process.exit(1);
}

console.log("Footer-Style-Ownership-Audit erfolgreich.");
console.log("Footer-Eigentümer: packages/affiliate-core/src/components/Footer.astro");
console.log("header-footer.css wurde entfernt.");
`;

plan(files.audit, audit);

const test = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = path.resolve(app, "../..");

const footerPath = path.join(
  root,
  "packages/affiliate-core/src/components/Footer.astro"
);
const sharedPath = path.join(
  root,
  "packages/affiliate-core/src/styles/header-footer.css"
);
const globalPath = path.join(
  root,
  "packages/affiliate-core/src/styles/global.css"
);

const footer = fs.readFileSync(footerPath, "utf8");
const globalCss = fs.readFileSync(globalPath, "utf8");

test("Footer.astro owns all footer presentation", () => {
  assert.match(footer, /<style is:global>/);
  assert.match(footer, /\\.footer-v2\\s*\\{/);
  assert.match(footer, /\\.footer-main-v2\\s*\\{/);
  assert.match(footer, /\\.footer-bottom-v2\\s*\\{/);
});

test("the obsolete shared shell stylesheet is gone", () => {
  assert.equal(fs.existsSync(sharedPath), false);
  assert.doesNotMatch(globalCss, /header-footer\\.css/);
});

test("footer remains responsive and semantic", () => {
  assert.match(
    footer,
    /@media\\s*\\(max-width:\\s*520px\\)[\\s\\S]*?\\.footer-main-v2/
  );
  assert.match(footer, /var\\(--pt-color-on-brand-surface/);
  assert.match(footer, /var\\(--pt-color-on-brand-surface-muted/);
});

test("footer does not regain header ownership", () => {
  assert.doesNotMatch(
    footer,
    /\\.site-header-v2|\\.header-container-v2|\\.main-nav-v2|\\.nav-toggle-button/
  );
});
`;

plan(files.test, test);

const changed = [...planned.keys()];
const removed = [...removals];

console.log(`[${NAME}] Geplante Änderungen:`);
for (const target of changed) console.log(`  schreiben: ${relative(target)}`);
for (const target of removed) console.log(`  entfernen: ${relative(target)}`);

if (CHECK_ONLY) {
  console.log(`[${NAME}] Vorprüfung erfolgreich. Keine Datei wurde verändert.`);
  process.exit(0);
}

for (const target of [...changed, ...removed]) backup(target);

try {
  for (const [target, content] of planned) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
    console.log(`[${NAME}] Geschrieben: ${relative(target)}`);
  }

  for (const target of removals) {
    fs.rmSync(target);
    console.log(`[${NAME}] Entfernt: ${relative(target)}`);
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

  for (const target of [...changed, ...removed]) {
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

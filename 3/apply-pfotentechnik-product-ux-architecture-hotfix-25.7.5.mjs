#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-product-ux-architecture-hotfix-25.7.5";
const args = new Set(process.argv.slice(2));
const checkOnly = args.has("--check");
const runBuild = !args.has("--no-build");

function findRoot(start) {
  let dir = path.resolve(start);
  for (let index = 0; index < 14; index += 1) {
    if (fs.existsSync(path.join(dir, "apps", "pfotentechnik", "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}

const ROOT = findRoot(process.cwd());
const MODEL = path.join(
  ROOT,
  "apps",
  "pfotentechnik",
  "src",
  "domain",
  "productExperience",
  "model.ts"
);
const TEST = path.join(
  ROOT,
  "apps",
  "pfotentechnik",
  "test",
  "product-alternative-decision-profile-25.7.5.test.mjs"
);

if (!fs.existsSync(MODEL)) {
  throw new Error("model.ts nicht gefunden.");
}

const original = fs.readFileSync(MODEL, "utf8");
const functionStart = original.indexOf("const toAlternative =");
const functionEnd = original.indexOf("\n};", functionStart);

if (functionStart < 0 || functionEnd < 0) {
  throw new Error("toAlternative konnte nicht sicher gefunden werden.");
}

const block = original.slice(functionStart, functionEnd + 3);
const usesDecisionProfile = /\bdecisionProfile\b/.test(block);
const definesDecisionProfile =
  /const\s+decisionProfile\s*=\s*decisionProfileFor\(data,\s*price\);/.test(block);

if (!usesDecisionProfile) {
  throw new Error("toAlternative verwendet decisionProfile nicht mehr. Patch wird aus Sicherheitsgründen abgebrochen.");
}

let next = original;

if (!definesDecisionProfile) {
  const heroPattern =
    /(const hero = data\.images\?\.comparison \?\? data\.images\?\.thumbnail \?\? data\.images\?\.hero;\n)/;

  const localBlock = next.slice(functionStart, functionEnd + 3);
  if (!heroPattern.test(localBlock)) {
    throw new Error("Einfügeposition für decisionProfile konnte nicht sicher bestimmt werden.");
  }

  const fixedBlock = localBlock.replace(
    heroPattern,
    '$1  const decisionProfile = decisionProfileFor(data, price);\n'
  );

  next =
    next.slice(0, functionStart) +
    fixedBlock +
    next.slice(functionEnd + 3);
}

const updatedStart = next.indexOf("const toAlternative =");
const updatedEnd = next.indexOf("\n};", updatedStart);
const updatedBlock = next.slice(updatedStart, updatedEnd + 3);

if (!/const\s+decisionProfile\s*=\s*decisionProfileFor\(data,\s*price\);/.test(updatedBlock)) {
  throw new Error("decisionProfile ist nach dem Patch nicht lokal definiert.");
}

if (!/\bdecisionProfile,\s*\n/.test(updatedBlock)) {
  throw new Error("decisionProfile wird im Rückgabeobjekt nicht verwendet.");
}

if (checkOnly) {
  console.log(`[${NAME}] Vorprüfung bestanden.`);
  console.log(
    definesDecisionProfile
      ? `[${NAME}] Hotfix ist bereits enthalten.`
      : `[${NAME}] model.ts kann sicher repariert werden.`
  );
  process.exit(0);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(
  ROOT,
  ".patch-backups",
  `${NAME}-${timestamp}`
);

if (next !== original) {
  const backupFile = path.join(
    backupRoot,
    path.relative(ROOT, MODEL)
  );
  fs.mkdirSync(path.dirname(backupFile), { recursive: true });
  fs.copyFileSync(MODEL, backupFile);
  fs.writeFileSync(MODEL, next, "utf8");
  console.log(`[${NAME}] Geändert: ${path.relative(ROOT, MODEL)}`);
  console.log(`[${NAME}] Backup: ${path.relative(ROOT, backupRoot)}`);
} else {
  console.log(`[${NAME}] model.ts ist bereits aktuell.`);
}

const testSource = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const MODEL = path.join(
  ROOT,
  "apps",
  "pfotentechnik",
  "src",
  "domain",
  "productExperience",
  "model.ts"
);

test("toAlternative definiert decisionProfile vor der Rückgabe lokal", () => {
  const source = fs.readFileSync(MODEL, "utf8");
  const start = source.indexOf("const toAlternative =");
  const end = source.indexOf("\\n};", start);
  assert.ok(start >= 0 && end > start);

  const block = source.slice(start, end + 3);
  assert.match(
    block,
    /const\\s+decisionProfile\\s*=\\s*decisionProfileFor\\(data,\\s*price\\);/
  );
  assert.match(block, /\\bdecisionProfile,\\s*\\n/);
});
`;

fs.mkdirSync(path.dirname(TEST), { recursive: true });
fs.writeFileSync(TEST, testSource, "utf8");
console.log(`[${NAME}] Geschrieben: ${path.relative(ROOT, TEST)}`);

execFileSync(
  process.execPath,
  [
    "--experimental-strip-types",
    "--test",
    path.relative(ROOT, TEST)
  ],
  { cwd: ROOT, stdio: "inherit" }
);

if (runBuild) {
  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  execFileSync(
    npm,
    ["--workspace", "apps/pfotentechnik", "run", "build"],
    { cwd: ROOT, stdio: "inherit" }
  );
}

console.log(`[${NAME}] Fertig.`);

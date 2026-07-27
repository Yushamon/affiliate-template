#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const NAME = "pfotentechnik-component-simplification-recovery-12.0.1";
const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");
const NO_BUILD = args.has("--no-build");
const NO_COMMIT = args.has("--no-commit");

const log = (message) => console.log(`[${NAME}] ${message}`);
const fail = (message) => {
  console.error(`[${NAME}] FEHLER: ${message}`);
  process.exit(1);
};

function findRoot(start) {
  let current = path.resolve(start);
  while (true) {
    if (
      fs.existsSync(path.join(current, "package.json")) &&
      fs.existsSync(path.join(current, "apps", "pfotentechnik", "package.json"))
    ) return current;

    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

const root =
  findRoot(process.cwd()) ||
  findRoot(path.dirname(fileURLToPath(import.meta.url)));

if (!root) fail("Repository-Root nicht gefunden.");

const densityFile = path.join(
  root,
  "apps/pfotentechnik/src/styles/pfotentechnik-visual-density.css"
);
const tokenFile = path.join(
  root,
  "apps/pfotentechnik/src/styles/pfotentechnik-design-tokens.css"
);
const reportFile = path.join(
  root,
  "apps/pfotentechnik/reports/design-system/component-simplification-recovery-12.0.1.md"
);

for (const file of [densityFile, tokenFile]) {
  if (!fs.existsSync(file)) fail(`Pflichtdatei fehlt: ${path.relative(root, file)}`);
}

const backupRoot = path.join(
  root,
  ".patch-backups",
  `${NAME}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

const rel = (file) => path.relative(root, file).split(path.sep).join("/");
const ensureDir = (dir) => fs.mkdirSync(dir, { recursive: true });
const read = (file) => fs.readFileSync(file, "utf8");

function backup(file) {
  if (DRY_RUN || !fs.existsSync(file)) return;
  const target = path.join(backupRoot, rel(file));
  ensureDir(path.dirname(target));
  fs.copyFileSync(file, target);
}

function write(file, content) {
  const before = read(file);
  if (before === content) return false;

  if (!DRY_RUN) {
    backup(file);
    fs.writeFileSync(file, content);
  }
  return true;
}

function run(command, commandArgs) {
  return spawnSync(command, commandArgs, {
    cwd: root,
    stdio: "inherit",
    shell: false
  }).status === 0;
}

const tokens = read(tokenFile);
if (!tokens.includes("--pt-radius-pill: 999px;")) {
  fail("Token --pt-radius-pill ist nicht definiert.");
}
if (!tokens.includes("--pt-radius-lg: 1rem;")) {
  fail("Token --pt-radius-lg ist nicht definiert.");
}

let density = read(densityFile);
const markerStart = "/* PT_COMPONENT_SIMPLIFICATION_12_0_0_START */";
const markerEnd = "/* PT_COMPONENT_SIMPLIFICATION_12_0_0_END */";

const start = density.indexOf(markerStart);
const end = density.indexOf(markerEnd);

if (start < 0 || end < 0 || end <= start) {
  fail("12.0.0-Komponentenblock wurde nicht gefunden. 12.0.0 zuerst ausführen.");
}

const blockEnd = end + markerEnd.length;
const beforeBlock = density.slice(0, start);
let block = density.slice(start, blockEnd);
const afterBlock = density.slice(blockEnd);

const pillBefore = (block.match(/border-radius:\s*999px\s*;/g) || []).length;
const lgBefore = (block.match(/border-radius:\s*1rem\s*;/g) || []).length;

block = block
  .replace(
    /border-radius:\s*999px\s*;/g,
    "border-radius: var(--pt-radius-pill);"
  )
  .replace(
    /border-radius:\s*1rem\s*;/g,
    "border-radius: var(--pt-radius-lg);"
  );

density = beforeBlock + block + afterBlock;

const remainingRaw = [
  ...(block.match(/border-radius:\s*999px\s*;/g) || []),
  ...(block.match(/border-radius:\s*1rem\s*;/g) || [])
];

if (remainingRaw.length) {
  fail("Nicht alle nicht tokenisierten Radiuswerte wurden ersetzt.");
}

if (!block.includes("border-radius: var(--pt-radius-pill);")) {
  fail("Pill-Radius-Token wurde nicht eingesetzt.");
}
if (!block.includes("border-radius: var(--pt-radius-lg);")) {
  fail("LG-Radius-Token wurde nicht eingesetzt.");
}

const changed = write(densityFile, density);

const report = `# Component Simplification Recovery 12.0.1

## Ursache

Der Komponenten-Fix 12.0.0 verwendete im bestehenden Density-Layer zwei
direkte Standardwerte, die vom Token-Audit bewusst abgelehnt werden:

- \`border-radius: 999px\`
- \`border-radius: 1rem\`

## Korrektur

- \`999px\` → \`var(--pt-radius-pill)\`
- \`1rem\` → \`var(--pt-radius-lg)\`
- CSS-Dateibudget bleibt unverändert
- Token-Baseline wird nicht verändert
- offener 12.0.0-Stand bleibt vollständig erhalten

## Ersetzungen

- Pill-Radien: ${pillBefore}
- LG-Radien: ${lgBefore}
- Datei geändert: ${changed ? "ja" : "bereits aktuell"}
`;

if (!DRY_RUN) {
  ensureDir(path.dirname(reportFile));
  fs.writeFileSync(reportFile, report);
}

log(`Radiuswerte tokenisiert: pill=${pillBefore}, lg=${lgBefore}`);
log(`Backups: ${rel(backupRoot)}`);

if (DRY_RUN) {
  log("Dry-Run erfolgreich.");
  process.exit(0);
}

for (const check of [
  "design-system:tokens:audit",
  "design-system:density:audit",
  "design-system:check"
]) {
  if (!run("npm", ["--workspace", "apps/pfotentechnik", "run", check])) {
    fail(`${check} fehlgeschlagen.`);
  }
}

if (!NO_BUILD && !run("npm", ["run", "build:pfotentechnik"])) {
  fail("Build fehlgeschlagen.");
}

const visualQaScript = path.join(
  root,
  "apps/pfotentechnik/scripts/design-system/visual-qa.mjs"
);

if (
  fs.existsSync(visualQaScript) &&
  !run("npm", [
    "--workspace",
    "apps/pfotentechnik",
    "run",
    "design-system:visual-qa"
  ])
) fail("Visual-QA fehlgeschlagen.");

if (!NO_COMMIT) {
  const status = spawnSync("git", ["status", "--porcelain"], {
    cwd: root,
    encoding: "utf8"
  });

  if (status.status !== 0) fail("git status fehlgeschlagen.");

  if (status.stdout.trim()) {
    if (!run("git", ["add", "-A"])) fail("git add fehlgeschlagen.");
    if (!run("git", [
      "commit",
      "-m",
      "refactor(pfotentechnik): simplify comparison components"
    ])) fail("Commit fehlgeschlagen.");

    log("12.0.0 und Recovery gemeinsam lokal committed.");
  } else {
    log("Keine offenen Änderungen.");
  }
}

log("Component Simplification Recovery 12.0.1 erfolgreich abgeschlossen.");

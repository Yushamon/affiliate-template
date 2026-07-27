#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const NAME = "pfotentechnik-component-simplification-recovery-12.0.3";
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
      fs.existsSync(path.join(current, "apps", "pfotentechnik", "package.json")) &&
      fs.existsSync(path.join(current, "packages", "affiliate-core"))
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

const headerFile = path.join(
  root,
  "packages/affiliate-core/src/components/Header.astro"
);
const densityFile = path.join(
  root,
  "apps/pfotentechnik/src/styles/pfotentechnik-visual-density.css"
);
const reportFile = path.join(
  root,
  "apps/pfotentechnik/reports/design-system/component-simplification-recovery-12.0.3.md"
);

for (const file of [headerFile, densityFile]) {
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

let header = read(headerFile);
let density = read(densityFile);

const replacements = [
  ["nav-toggle-button__icon", "nav-toggle__icon"],
  ["nav-toggle-button__label", "nav-toggle__label"]
];

for (const [from, to] of replacements) {
  header = header.split(from).join(to);
  density = density.split(from).join(to);
}

if (header.includes("nav-toggle-button__icon") || header.includes("nav-toggle-button__label")) {
  fail("Alte auditkritische Unterelement-Klassen sind im Header noch vorhanden.");
}

if (density.includes("nav-toggle-button__icon") || density.includes("nav-toggle-button__label")) {
  fail("Alte auditkritische Unterelement-Klassen sind im CSS noch vorhanden.");
}

const buttonOpening = header.match(/<button\b[\s\S]*?data-nav-toggle[\s\S]*?>/m)?.[0] ?? "";
if (!/\bclass=(["'])[^"']*\bpt-button\b[^"']*\bnav-toggle-button\b[^"']*\1/s.test(buttonOpening)) {
  fail("Der echte Navigationstoggle besitzt nicht zuverlässig pt-button nav-toggle-button.");
}

const headerChanged = write(headerFile, header);
const densityChanged = write(densityFile, density);

const report = `# Component Simplification Recovery 12.0.3

## Ursache

Der Component-Adoption-Audit wertet jedes statische class-Attribut einzeln aus.
Die Unterelemente

- \`nav-toggle-button__icon\`
- \`nav-toggle-button__label\`

wurden deshalb wegen des Wortes \`button\` fälschlich als nicht adoptierte
Buttons erkannt.

## Korrektur

- \`nav-toggle-button__icon\` → \`nav-toggle__icon\`
- \`nav-toggle-button__label\` → \`nav-toggle__label\`
- echter Button bleibt \`pt-button nav-toggle-button\`
- zugehörige CSS-Selektoren synchron aktualisiert
- keine Design-, Token- oder Budgetänderung

Header geändert: ${headerChanged ? "ja" : "bereits aktuell"}
Density-CSS geändert: ${densityChanged ? "ja" : "bereits aktuell"}
`;

if (!DRY_RUN) {
  ensureDir(path.dirname(reportFile));
  fs.writeFileSync(reportFile, report);
}

log(`Header: ${headerChanged ? "Unterelement-Klassen umbenannt" : "bereits aktuell"}`);
log(`Density-CSS: ${densityChanged ? "Selektoren aktualisiert" : "bereits aktuell"}`);
log(`Backups: ${rel(backupRoot)}`);

if (DRY_RUN) {
  log("Dry-Run erfolgreich.");
  process.exit(0);
}

for (const check of [
  "design-system:components:audit",
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

    log("12.0.0–12.0.3 gemeinsam lokal committed.");
  } else {
    log("Keine offenen Änderungen.");
  }
}

log("Component Simplification Recovery 12.0.3 erfolgreich abgeschlossen.");

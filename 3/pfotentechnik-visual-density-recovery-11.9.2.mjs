#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const NAME = "pfotentechnik-visual-density-recovery-11.9.2";
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
    ) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = findRoot(process.cwd()) || findRoot(scriptDir);

if (!root) fail("Repository-Root nicht gefunden.");

const app = path.join(root, "apps", "pfotentechnik");
const densityFile = path.join(
  app,
  "src",
  "styles",
  "pfotentechnik-visual-density.css"
);
const auditFile = path.join(
  app,
  "scripts",
  "design-system",
  "density-audit.mjs"
);
const reportDir = path.join(app, "reports", "design-system");
const reportFile = path.join(
  reportDir,
  "visual-density-recovery-11.9.2.md"
);
const backupRoot = path.join(
  root,
  ".patch-backups",
  `${NAME}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

function relative(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function ensureDir(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function backup(file) {
  if (DRY_RUN || !fs.existsSync(file)) return;

  const target = path.join(backupRoot, relative(file));
  ensureDir(path.dirname(target));
  fs.copyFileSync(file, target);
}

function write(file, content) {
  const previous = fs.existsSync(file) ? read(file) : null;

  if (previous === content) return false;

  if (!DRY_RUN) {
    if (previous !== null) backup(file);
    ensureDir(path.dirname(file));
    fs.writeFileSync(file, content);
  }

  return true;
}

function run(command, commandArgs) {
  return spawnSync(command, commandArgs, {
    cwd: root,
    stdio: "inherit",
    shell: false,
  }).status === 0;
}

for (const file of [densityFile, auditFile]) {
  if (!fs.existsSync(file)) {
    fail(`Pflichtdatei fehlt: ${relative(file)}. Stufe 11.9.0 zuerst ausführen.`);
  }
}

/* 1. Density-Layer korrigieren */
const densityBefore = read(densityFile);
const rootCountBefore = (densityBefore.match(/:root\s*\{/g) || []).length;

let densityAfter = densityBefore.replace(/:root\s*\{/g, ":where(html) {");

if (
  rootCountBefore === 0 &&
  !/:where\(html\)\s*\{/.test(densityAfter)
) {
  fail("Im Density-Layer wurde weder :root noch :where(html) gefunden.");
}

const densityChanged = write(densityFile, densityAfter);

/* 2. Audit robust und ankerunabhängig erweitern */
const auditBefore = read(auditFile);
let auditAfter = auditBefore;

const guardMarker = "DENSITY_ROOT_BLOCK_GUARD";
const guardCode = `
  // ${guardMarker}
  const densityRootBlocks = css.match(/:root\\\\s*\\\\{/g) || [];
  if (densityRootBlocks.length > 0) {
    errors.push("Visual Density darf keine :root-Blöcke enthalten.");
  }
`;

if (!auditAfter.includes(guardMarker)) {
  const finalErrorBlockPatterns = [
    /\nif\s*\(\s*errors\.length\s*\)\s*\{/,
    /\nif\s*\(\s*errors\.length\s*>\s*0\s*\)\s*\{/,
    /\nif\s*\(\s*errors\.length\s*!==\s*0\s*\)\s*\{/,
  ];

  let inserted = false;

  for (const pattern of finalErrorBlockPatterns) {
    const match = auditAfter.match(pattern);

    if (match && typeof match.index === "number") {
      auditAfter =
        auditAfter.slice(0, match.index) +
        "\n" +
        guardCode +
        auditAfter.slice(match.index);
      inserted = true;
      break;
    }
  }

  if (!inserted) {
    const successLogPatterns = [
      /\nconsole\.log\(["'`]Visual-Density-Audit erfolgreich\./,
      /\nconsole\.log\(["'`]Visual Density Audit erfolgreich\./,
      /\nconsole\.log\(/,
    ];

    for (const pattern of successLogPatterns) {
      const match = auditAfter.match(pattern);

      if (match && typeof match.index === "number") {
        auditAfter =
          auditAfter.slice(0, match.index) +
          "\n" +
          guardCode +
          `
if (errors.length > 0) {
  console.error(errors.join("\\n"));
  process.exit(1);
}
` +
          auditAfter.slice(match.index);
        inserted = true;
        break;
      }
    }
  }

  if (!inserted) {
    auditAfter += `
${guardCode}
if (errors.length > 0) {
  console.error(errors.join("\\n"));
  process.exit(1);
}
`;
  }
}

const auditChanged = write(auditFile, auditAfter);

/* 3. Vorprüfung der tatsächlichen Ergebnisse */
if (/:root\s*\{/.test(densityAfter)) {
  fail("Nach der Korrektur sind weiterhin :root-Blöcke im Density-Layer vorhanden.");
}

if (!auditAfter.includes(guardMarker)) {
  fail("Der neue Density-Root-Guard wurde nicht installiert.");
}

if (
  (auditAfter.match(new RegExp(guardMarker, "g")) || []).length !== 1
) {
  fail("Der Density-Root-Guard wurde mehrfach installiert.");
}

const report = `# PfotenTechnik Visual Density Recovery 11.9.2

## Ursache

Recovery 11.9.1 suchte nach einem exakten Code-Anker im lokal vorhandenen
\`density-audit.mjs\`. Der Wortlaut wich vom erwarteten Stand ab.

## Korrektur

- gefundene \`:root\`-Blöcke im Density-Layer: **${rootCountBefore}**
- Density-Datei geändert: **${densityChanged ? "ja" : "nein"}**
- Audit geändert: **${auditChanged ? "ja" : "nein"}**
- Audit-Guard wird unabhängig vom bisherigen \`!important\`-Block eingefügt
- vorhandener Guard wird erkannt und nicht dupliziert
- CSS-Budget-Baseline bleibt unverändert
`;

if (!DRY_RUN) {
  ensureDir(reportDir);
  fs.writeFileSync(reportFile, report);
}

log(`Gefundene :root-Blöcke: ${rootCountBefore}`);
log(`Density-Datei: ${densityChanged ? "korrigiert" : "bereits korrigiert"}`);
log(`Density-Audit: ${auditChanged ? "erweitert" : "bereits aktuell"}`);
log(`Backups: ${relative(backupRoot)}`);

if (DRY_RUN) {
  log("Dry-Run erfolgreich abgeschlossen.");
  process.exit(0);
}

for (const check of [
  "design-system:density:audit",
  "design-system:check",
]) {
  if (!run("npm", ["--workspace", "apps/pfotentechnik", "run", check])) {
    fail(`${check} fehlgeschlagen.`);
  }
}

if (!NO_BUILD && !run("npm", ["run", "build:pfotentechnik"])) {
  fail("Build fehlgeschlagen.");
}

const visualQaScript = path.join(
  app,
  "scripts",
  "design-system",
  "visual-qa.mjs"
);

if (
  fs.existsSync(visualQaScript) &&
  !run("npm", [
    "--workspace",
    "apps/pfotentechnik",
    "run",
    "design-system:visual-qa",
  ])
) {
  fail("Visual-QA fehlgeschlagen.");
}

if (!NO_COMMIT) {
  const status = spawnSync("git", ["status", "--porcelain"], {
    cwd: root,
    encoding: "utf8",
  });

  if (status.status !== 0) fail("git status fehlgeschlagen.");

  if (status.stdout.trim()) {
    if (!run("git", ["add", "-A"])) fail("git add fehlgeschlagen.");

    if (
      !run("git", [
        "commit",
        "-m",
        "refactor(pfotentechnik): reduce visual density",
      ])
    ) {
      fail("Commit fehlgeschlagen.");
    }

    log("Offener 11.9.0-Stand und Recovery gemeinsam lokal committed.");
  } else {
    log("Keine offenen Änderungen vorhanden.");
  }
}

log("Visual Density Recovery 11.9.2 erfolgreich abgeschlossen.");

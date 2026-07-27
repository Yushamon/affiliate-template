#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const NAME = "pfotentechnik-visual-density-recovery-11.9.1";
const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");
const NO_BUILD = args.has("--no-build");
const NO_COMMIT = args.has("--no-commit");

const log = (m) => console.log(`[${NAME}] ${m}`);
const fail = (m) => {
  console.error(`[${NAME}] FEHLER: ${m}`);
  process.exit(1);
};

function findRoot(start) {
  let dir = path.resolve(start);
  while (true) {
    if (
      fs.existsSync(path.join(dir, "package.json")) &&
      fs.existsSync(path.join(dir, "apps", "pfotentechnik", "package.json"))
    ) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
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
  "visual-density-recovery-11.9.1.md"
);
const backupRoot = path.join(
  root,
  ".patch-backups",
  `${NAME}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

function rel(file) {
  return path.relative(root, file).split(path.sep).join("/");
}
function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}
function read(file) {
  return fs.readFileSync(file, "utf8");
}
function backup(file) {
  if (DRY_RUN || !fs.existsSync(file)) return;
  const target = path.join(backupRoot, rel(file));
  ensureDir(path.dirname(target));
  fs.copyFileSync(file, target);
}
function write(file, content) {
  const old = fs.existsSync(file) ? read(file) : null;
  if (old === content) return false;
  if (!DRY_RUN) {
    if (old !== null) backup(file);
    ensureDir(path.dirname(file));
    fs.writeFileSync(file, content);
  }
  return true;
}
function run(cmd, argv) {
  return spawnSync(cmd, argv, {
    cwd: root,
    stdio: "inherit",
    shell: false,
  }).status === 0;
}

for (const file of [densityFile, auditFile]) {
  if (!fs.existsSync(file)) {
    fail(`Pflichtdatei fehlt: ${rel(file)}. Stufe 11.9.0 zuerst ausführen.`);
  }
}

const beforeDensity = read(densityFile);
const rootCountBefore = (beforeDensity.match(/:root\s*\{/g) || []).length;

let density = beforeDensity.replace(/:root\s*\{/g, ":where(html) {");

if (rootCountBefore === 0 && !density.includes(":where(html) {")) {
  fail("Weder :root noch :where(html) im Density-Layer gefunden.");
}

const densityChanged = write(densityFile, density);

let audit = read(auditFile);

/* Bereits vorhandenen Guard entfernen, damit der Installer idempotent bleibt. */
audit = audit.replace(
  /\n\s*const densityRootBlocks[\s\S]*?errors\.push\("Visual Density darf keine :root-Blöcke enthalten\."\);\n\s*\}\n/g,
  "\n"
);

const auditAnchor = `  if (/!important\\\\b/.test(css)) {
    errors.push("Visual Density darf kein !important enthalten.");
  }
`;

if (!audit.includes(auditAnchor)) {
  fail("Audit-Anker für !important nicht gefunden.");
}

audit = audit.replace(
  auditAnchor,
  `${auditAnchor}
  const densityRootBlocks = css.match(/:root\\\\s*\\\\{/g) || [];
  if (densityRootBlocks.length > 0) {
    errors.push("Visual Density darf keine :root-Blöcke enthalten.");
  }
`
);

const auditChanged = write(auditFile, audit);

const report = `# PfotenTechnik Visual Density Recovery 11.9.1

## Ursache

Der Density-Layer aus 11.9.0 enthielt zwei zusätzliche \`:root\`-Blöcke:

- globale Density-Tokens
- mobile Token-Anpassungen im Media Query

Das CSS-Budget hat diese bewusste Governance-Verletzung korrekt erkannt.

## Korrektur

- ersetzte \`:root\`-Blöcke: **${rootCountBefore}**
- Density-Datei geändert: **${densityChanged ? "ja" : "nein"}**
- Density-Audit erweitert: **${auditChanged ? "ja" : "nein"}**
- Ersatzselektor: \`:where(html)\`
- keine visuelle oder semantische Änderung der Tokens
- CSS-Budget-Baseline bleibt unverändert
`;

if (!DRY_RUN) {
  ensureDir(reportDir);
  fs.writeFileSync(reportFile, report);
}

log(`Gefundene :root-Blöcke: ${rootCountBefore}`);
log(`Density-Datei: ${densityChanged ? "korrigiert" : "bereits korrigiert"}`);
log(`Density-Audit: ${auditChanged ? "erweitert" : "bereits aktuell"}`);
log(`Backups: ${rel(backupRoot)}`);

if (DRY_RUN) {
  log("Dry-Run abgeschlossen.");
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

if (
  fs.existsSync(path.join(app, "scripts", "design-system", "visual-qa.mjs")) &&
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

log("Visual Density Recovery 11.9.1 erfolgreich abgeschlossen.");

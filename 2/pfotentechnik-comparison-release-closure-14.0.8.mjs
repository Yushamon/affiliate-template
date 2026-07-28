#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const NAME = "pfotentechnik-comparison-release-closure-14.0.8";
const args = new Set(process.argv.slice(2));
const CHECK_ONLY = args.has("--check") || args.has("--dry-run");
const COMMIT = args.has("--commit");

const log = (message) => console.log(`[${NAME}] ${message}`);
const fail = (message) => {
  const text = message instanceof Error
    ? message.stack || message.message
    : String(message);
  console.error(`[${NAME}] FEHLER: ${text}`);
  process.exit(1);
};

function findRoot(start) {
  let current = path.resolve(start);

  while (true) {
    if (
      fs.existsSync(path.join(current, "package.json")) &&
      fs.existsSync(path.join(current, "apps", "pfotentechnik", "package.json")) &&
      fs.existsSync(path.join(current, "packages", "affiliate-core"))
    ) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

const root =
  findRoot(process.cwd()) ||
  findRoot(path.dirname(fileURLToPath(import.meta.url)));

if (!root) {
  fail("Repository-Root nicht gefunden. Starte den Installer im affiliate-template-Repository.");
}

const appRoot = path.join(root, "apps", "pfotentechnik");
const reportDir = path.join(appRoot, "reports", "comparison-platform");
const reportFile = path.join(
  reportDir,
  "comparison-release-closure-build-recovery-14.0.8.md"
);

const files = {
  audit: path.join(appRoot, "scripts", "comparison-platform", "audit.mjs"),
  dataAudit: path.join(appRoot, "scripts", "comparison-platform", "data-audit.mjs"),
  coverageAudit: path.join(appRoot, "scripts", "comparison-platform", "coverage-audit.mjs"),
  refactorAudit: path.join(appRoot, "scripts", "comparison-platform", "refactor-audit.mjs"),
  releaseAudit: path.join(appRoot, "scripts", "comparison-platform", "release-closure.mjs"),
  schemaAudit: path.join(appRoot, "scripts", "seo", "audit-comparison-product-schema.mjs"),
  visualAudit: path.join(appRoot, "scripts", "design-system", "visual-qa.mjs"),
  test703: path.join(appRoot, "test", "comparison-release-closure-14.0.3.test.mjs"),
  test704: path.join(appRoot, "test", "comparison-release-closure-14.0.4.test.mjs"),
  test707: path.join(appRoot, "test", "comparison-release-closure-14.0.7.test.mjs")
};

for (const [key, file] of Object.entries(files)) {
  if (key.startsWith("test") && !fs.existsSync(file)) continue;
  if (!fs.existsSync(file)) {
    fail(`Pflichtdatei fehlt (${key}): ${path.relative(root, file)}`);
  }
}

const relative = (file) =>
  path.relative(root, file).split(path.sep).join("/");

function executable(command) {
  if (process.platform !== "win32") return command;
  if (command === "npm") return "npm.cmd";
  if (command === "npx") return "npx.cmd";
  return command;
}

function run(command, commandArgs, label, options = {}) {
  const resolvedCommand = executable(command);
  log(`Prüfung: ${label}`);
  log(`Befehl: ${resolvedCommand} ${commandArgs.join(" ")}`);

  const execution = spawnSync(resolvedCommand, commandArgs, {
    cwd: root,
    stdio: "inherit",
    shell: false,
    env: {
      ...process.env,
      FORCE_COLOR: process.env.FORCE_COLOR || "1"
    }
  });

  if (execution.error) {
    fail(
      `${label} konnte nicht gestartet werden.\n` +
      `Command: ${resolvedCommand}\n` +
      `Code: ${execution.error.code || "unbekannt"}\n` +
      `Nachricht: ${execution.error.message}`
    );
  }

  if (execution.status !== 0 && !options.allowFailure) {
    fail(
      `${label} fehlgeschlagen.\n` +
      `Command: ${resolvedCommand} ${commandArgs.join(" ")}\n` +
      `Exit-Code: ${execution.status}`
    );
  }

  return execution.status === 0;
}

function ensureReportDir() {
  fs.mkdirSync(reportDir, { recursive: true });
}

log(`Plattform: ${process.platform}`);
log(`Node: ${process.version}`);
log(`Repository: ${root}`);

if (CHECK_ONLY) {
  run("npm", ["--version"], "npm-Verfügbarkeit");
  run("node", ["--check", relative(files.releaseAudit)], "Syntaxprüfung Release-Audit");
  log("Check erfolgreich. Es wurde nichts verändert.");
  process.exit(0);
}

/*
 * Der vorherige 14.0.7-Lauf hat alle Daten- und Linkblocker bereits behoben.
 * Dieser Recovery-Lauf prüft den Zustand erneut und setzt ab dem Build fort.
 */
for (const testFile of [files.test707, files.test704, files.test703]) {
  if (!fs.existsSync(testFile)) continue;

  run(
    "node",
    ["--test", relative(testFile)],
    `Regressionstest ${path.basename(testFile)}`
  );
}

run(
  "node",
  [relative(files.refactorAudit)],
  "Comparison-Refactor-Audit"
);
run(
  "node",
  [relative(files.audit), "--strict"],
  "Comparison-Platform-Audit"
);
run(
  "node",
  [relative(files.dataAudit), "--strict"],
  "Comparison-Data-Audit"
);
run(
  "node",
  [relative(files.coverageAudit), "--strict", "--threshold=95"],
  "Comparison-Coverage-Audit"
);

/*
 * Windows kann npm ohne Shell nicht als "npm" starten, weil npm dort über
 * npm.cmd bereitgestellt wird. Deshalb wird auf win32 explizit npm.cmd genutzt.
 */
run(
  "npm",
  ["--version"],
  "npm-Verfügbarkeit"
);
run(
  "npm",
  ["run", "build:pfotentechnik"],
  "PfotenTechnik-Build"
);

run(
  "node",
  [relative(files.schemaAudit)],
  "Comparison-Schema-Audit"
);
run(
  "node",
  [relative(files.visualAudit), "--strict"],
  "Statisches Visual-QA"
);
run(
  "node",
  [relative(files.releaseAudit), "--strict"],
  "24-Seiten-Release-Audit"
);

ensureReportDir();

const releaseReport = path.join(
  reportDir,
  "comparison-release-closure.json"
);
let releaseStatus = "Technische Prüfung ausgeführt.";

if (fs.existsSync(releaseReport)) {
  const report = JSON.parse(fs.readFileSync(releaseReport, "utf8"));
  releaseStatus = [
    `Technisch: ${report.technicalPassed ? "BESTANDEN" : "NICHT BESTANDEN"}`,
    `Visuelle Abnahme: ${report.visualPassed ? "BESTANDEN" : "AUSSTEHEND"}`,
    `Gesamt: ${report.finalPassed ? "ABGESCHLOSSEN" : "NOCH NICHT ABGESCHLOSSEN"}`
  ].join("\n");
}

fs.writeFileSync(
  reportFile,
  [
    "# Comparison Release Closure Build Recovery 14.0.8",
    "",
    `Erstellt: ${new Date().toISOString()}`,
    "",
    `- Plattform: ${process.platform}`,
    `- Node: ${process.version}`,
    `- npm-Executable: ${executable("npm")}`,
    "",
    releaseStatus,
    "",
    "Der technische Build- und Release-Check wurde mit einer Windows-kompatiblen npm-Ausführung abgeschlossen.",
    ""
  ].join("\n"),
  "utf8"
);

if (COMMIT) {
  const status = spawnSync("git", ["status", "--porcelain"], {
    cwd: root,
    encoding: "utf8"
  });

  if (status.error) {
    fail(`git status konnte nicht gestartet werden: ${status.error.message}`);
  }

  if (status.status !== 0) {
    fail(`git status fehlgeschlagen: Exit-Code ${status.status}`);
  }

  if (status.stdout.trim()) {
    run(
      "git",
      ["add", "-A"],
      "git add"
    );
    run(
      "git",
      [
        "commit",
        "-m",
        "fix(pfotentechnik): complete comparison release validation"
      ],
      "lokaler Commit"
    );
  } else {
    log("Keine offenen Änderungen für einen Commit.");
  }
}

log(`Report: ${relative(reportFile)}`);
log("Comparison Release Closure 14.0.8 technisch erfolgreich abgeschlossen.");
log("Der Gesamtstatus bleibt bis zur manuellen 375/414-Light/Dark-Abnahme offen.");

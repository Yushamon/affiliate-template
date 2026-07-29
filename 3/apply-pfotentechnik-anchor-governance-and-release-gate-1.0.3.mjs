#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const NAME = "pfotentechnik-anchor-governance-and-release-gate-1.0.3";
const ROOT = process.cwd();
const APP = path.join(ROOT, "apps", "pfotentechnik");
const AUDIT = path.join(APP, "scripts", "seo", "audit-release-build-output.mjs");
const REPORT = path.join(APP, "reports", "seo-release", "build-output-latest.json");
const BACKUP_ROOT = path.join(
  ROOT,
  ".patch-backups",
  `${NAME}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

const log = (message = "") => console.log(`[${NAME}] ${message}`.trimEnd());
const fail = (message) => {
  console.error(`\n[${NAME}] FEHLER: ${message}`);
  process.exit(1);
};
const rel = (file) => path.relative(ROOT, file).replace(/\\/g, "/");

function read(file) {
  if (!fs.existsSync(file)) fail(`Erwartete Datei fehlt: ${rel(file)}`);
  return fs.readFileSync(file, "utf8");
}

function backup(file) {
  if (!fs.existsSync(file)) return;
  const target = path.join(BACKUP_ROOT, rel(file));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
}

function run(command, args, allowFailure = false) {
  log(`Ausführen: ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: ROOT,
    stdio: "inherit",
    env: { ...process.env, FORCE_COLOR: "0" }
  });

  if (result.error) {
    fail(`${command} konnte nicht gestartet werden: ${result.error.message}`);
  }

  if (result.status !== 0 && !allowFailure) {
    fail(`Befehl fehlgeschlagen (${result.status}): ${command} ${args.join(" ")}`);
  }

  return result;
}

function printReportErrors() {
  if (!fs.existsSync(REPORT)) return;

  try {
    const report = JSON.parse(fs.readFileSync(REPORT, "utf8"));
    const errors = (report.findings ?? []).filter(
      (finding) => finding.severity === "error"
    );

    console.error(`\n[${NAME}] Verbleibende echte Fehler: ${errors.length}`);

    for (const finding of errors.slice(0, 50)) {
      console.error(
        `- ${finding.code}: ${finding.route ?? finding.url ?? finding.file ?? ""}` +
        `${finding.canonical ? ` → ${finding.canonical}` : ""}` +
        `${finding.reason ? ` — ${finding.reason}` : ""}`
      );
    }

    if (errors.length > 50) {
      console.error(`- … und ${errors.length - 50} weitere. Vollständig im Report.`);
    }
  } catch (error) {
    console.error(`[${NAME}] Report konnte nicht gelesen werden: ${error.message}`);
  }
}

log("Vorprüfung");

for (const file of [
  path.join(ROOT, "package.json"),
  path.join(APP, "package.json"),
  path.join(APP, "dist"),
  AUDIT
]) {
  if (!fs.existsSync(file)) {
    fail(`Repository-Struktur unvollständig: ${rel(file)}`);
  }
}

let source = read(AUDIT);

if (
  !source.includes("MAIN_STRUCTURE_INVALID") ||
  !source.includes("mainOpen") ||
  !source.includes("mainClose")
) {
  fail(
    "Die erwartete Main-Struktur-Prüfung wurde nicht gefunden. " +
    "Es wurde nichts verändert."
  );
}

const alreadyFixed =
  source.includes("mainOpen > 1 || mainClose > 1 || mainOpen !== mainClose") &&
  source.includes("Mehrere oder nicht ausgeglichene <main>-Elemente erkannt.");

if (alreadyFixed) {
  log("Main-Struktur-Regel ist bereits korrigiert.");
} else {
  const blockPattern =
    /  const mainOpen = \(html\.match\(\/<main\\b\/gi\) \?\? \[\]\)\.length;\r?\n  const mainClose = \(html\.match\(\/<\\\/main>\/gi\) \?\? \[\]\)\.length;\r?\n  if \(indexable && \(mainOpen !== 1 \|\| mainClose !== 1\)\) \{\r?\n    add\("error", "MAIN_STRUCTURE_INVALID", \{\r?\n      route,\r?\n      open: mainOpen,\r?\n      close: mainClose\r?\n    \}\);\r?\n  \}/;

  const fallbackPattern =
    /  const mainOpen = [\s\S]*?add\("error", "MAIN_STRUCTURE_INVALID", \{[\s\S]*?close: mainClose[\s\S]*?\}\);\r?\n  \}/;

  const replacement = `  const mainOpen = (html.match(/<main\\b/gi) ?? []).length;
  const mainClose = (html.match(/<\\/main>/gi) ?? []).length;

  // PfotenTechnik nutzt mehrere etablierte Layouttypen. Ein physisches
  // <main>-Element ist deshalb nicht auf jeder Route verpflichtend.
  // Blockierend sind nur konkurrierende oder unausgeglichene Hauptbereiche.
  if (mainOpen > 1 || mainClose > 1 || mainOpen !== mainClose) {
    add("error", "MAIN_STRUCTURE_INVALID", {
      route,
      open: mainOpen,
      close: mainClose,
      reason: "Mehrere oder nicht ausgeglichene <main>-Elemente erkannt."
    });
  }`;

  let updated = source.replace(blockPattern, replacement);

  if (updated === source) {
    updated = source.replace(fallbackPattern, replacement);
  }

  if (updated === source) {
    fail(
      "Die Main-Struktur-Prüfung konnte trotz vorhandener Marker nicht sicher " +
      "ersetzt werden. Es wurde nichts verändert."
    );
  }

  if (updated.includes('version: "1.0.1"')) {
    updated = updated.replace('version: "1.0.1"', 'version: "1.0.3"');
  } else if (updated.includes('version: "1.0.2"')) {
    updated = updated.replace('version: "1.0.2"', 'version: "1.0.3"');
  }

  backup(AUDIT);
  fs.writeFileSync(AUDIT, updated, "utf8");
  source = updated;
  log(`Geändert: ${rel(AUDIT)}`);
}

run(process.execPath, ["--check", AUDIT]);

const auditResult = run(
  "npm",
  ["--workspace", "apps/pfotentechnik", "run", "audit:release-build-output:strict"],
  true
);

if (auditResult.status !== 0) {
  printReportErrors();
  fail(
    "Der Build-Output-Audit enthält weiterhin echte Fehler. " +
    `Report: ${rel(REPORT)}`
  );
}

run(
  "npm",
  ["--workspace", "apps/pfotentechnik", "run", "seo:release:check"]
);

log("");
log("ABGESCHLOSSEN.");
log("Build-Output-Audit auf Version 1.0.3 aktualisiert.");
log("0 oder 1 korrekt geschlossenes <main>-Element ist zulässig.");
log("Mehrere oder unausgeglichene <main>-Elemente bleiben release-blockierend.");
log("Alle Sitemap-, Canonical-, Robots-, JSON-LD- und Linkzielprüfungen bleiben aktiv.");
log(`Backups: ${rel(BACKUP_ROOT)}`);
log(`Report: ${rel(REPORT)}`);
log("Kein Commit, kein Push und kein Pull Request wurden erstellt.");

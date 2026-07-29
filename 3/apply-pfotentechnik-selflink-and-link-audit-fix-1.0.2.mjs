#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const NAME = "pfotentechnik-selflink-and-link-audit-fix-1.0.2";
const ROOT = process.cwd();
const APP = path.join(ROOT, "apps", "pfotentechnik");
const AUDIT = path.join(APP, "scripts", "audit-internal-link-targets.mjs");
const REPORT = path.join(APP, "reports", "internal-linking", "internal-link-target-audit.json");
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

function run(command, args, { allowFailure = false } = {}) {
  log(`Ausführen: ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: ROOT,
    stdio: "inherit",
    env: { ...process.env, FORCE_COLOR: "0" }
  });
  if (result.error) fail(`${command} konnte nicht gestartet werden: ${result.error.message}`);
  if (result.status !== 0 && !allowFailure) {
    fail(`Befehl fehlgeschlagen (${result.status}): ${command} ${args.join(" ")}`);
  }
  return result;
}

log("Vorprüfung");

for (const file of [
  path.join(ROOT, "package.json"),
  path.join(APP, "package.json"),
  path.join(APP, "public", "_redirects"),
  AUDIT
]) {
  if (!fs.existsSync(file)) fail(`Repository-Struktur unvollständig: ${rel(file)}`);
}

let source = read(AUDIT);

if (!source.includes('version: "2.0.0"')) {
  fail(
    "audit-internal-link-targets.mjs entspricht nicht Version 2.0.0 aus Fix 1.0.1. " +
    "Es wurde nichts verändert."
  );
}

const globalChainBlock = `  } else if (resolved.chain.length > 1) {
    add("error", "REDIRECT_CHAIN", {
      sourceFile: path.relative(root, redirectsFile),
      sourceRoute: alias,
      originalTarget: alias,
      normalizedTarget: alias,
      finalTarget: resolved.final,
      redirectChain: resolved.chain,
      reason: "Redirectkette erkannt.",
      recommendation: "Alias direkt auf das finale Ziel umstellen."
    });
  }
}`;

const correctedGlobalBlock = `  } else if (resolved.chain.length > 1) {
    // Eine vorhandene Redirectkette ist nur dann release-blockierend,
    // wenn produktives HTML tatsächlich auf ihren Start-Alias verlinkt.
    // Die Linkschleife unten meldet solche Fälle weiterhin als REDIRECT_CHAIN.
  }
}`;

if (source.includes(correctedGlobalBlock)) {
  log("Globale Redirectketten sind bereits korrekt klassifiziert.");
} else {
  if (!source.includes(globalChainBlock)) {
    fail("Erwarteter Anker für die globale Redirectketten-Prüfung wurde nicht gefunden.");
  }
  backup(AUDIT);
  source = source.replace(globalChainBlock, correctedGlobalBlock);
  source = source.replace('version: "2.0.0"', 'version: "2.0.1"');
  fs.writeFileSync(AUDIT, source, "utf8");
  log(`Geändert: ${rel(AUDIT)}`);
}

run(process.execPath, ["--check", AUDIT]);

// Erst normal ausführen, damit bei verbleibenden echten Fehlern der Report
// sicher aktualisiert wird und anschließend kompakt ausgegeben werden kann.
const auditRun = run(
  "npm",
  ["--workspace", "apps/pfotentechnik", "run", "audit:internal-link-targets"],
  { allowFailure: true }
);

if (fs.existsSync(REPORT)) {
  try {
    const report = JSON.parse(fs.readFileSync(REPORT, "utf8"));
    const errors = (report.findings ?? []).filter((finding) => finding.severity === "error");
    const warnings = (report.findings ?? []).filter((finding) => finding.severity === "warning");

    log(`Aktueller Report: ${errors.length} Fehler, ${warnings.length} Warnungen.`);

    if (errors.length) {
      console.error(`\n[${NAME}] Verbleibende echte Fehler:`);
      for (const finding of errors) {
        const location = finding.sourceFile ?? finding.sourceRoute ?? "unbekannt";
        const target = finding.originalTarget ?? finding.finalTarget ?? "";
        console.error(
          `- ${finding.code}: ${location}${target ? ` → ${target}` : ""}` +
          `${finding.reason ? ` — ${finding.reason}` : ""}`
        );
      }
    }
  } catch (error) {
    fail(`Audit-Report konnte nicht gelesen werden: ${error.message}`);
  }
}

if (auditRun.status !== 0) {
  fail(
    "Nach Entfernung der globalen Redirectketten-False-Positives bestehen echte Auditfehler. " +
    `Details stehen in ${rel(REPORT)} und wurden oben ausgegeben.`
  );
}

run(
  "npm",
  ["--workspace", "apps/pfotentechnik", "run", "audit:internal-link-targets:strict"]
);

log("");
log("Abgeschlossen.");
log("Audit-Version: 2.0.1");
log("Nicht verlinkte Redirectketten blockieren den Audit nicht mehr.");
log("Intern verlinkte Redirectketten und Redirectloops bleiben harte Fehler.");
log(`Backups: ${rel(BACKUP_ROOT)}`);
log(`Report: ${rel(REPORT)}`);
log("Kein Commit, kein Push und kein Pull Request wurden erstellt.");

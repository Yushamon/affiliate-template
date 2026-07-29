#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const NAME = "pfotentechnik-selflink-and-link-audit-fix-1.0.3";
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

function run(command, args) {
  log(`Ausführen: ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: ROOT,
    stdio: "inherit",
    env: { ...process.env, FORCE_COLOR: "0" }
  });
  if (result.error) fail(`${command} konnte nicht gestartet werden: ${result.error.message}`);
  if (result.status !== 0) {
    fail(`Befehl fehlgeschlagen (${result.status}): ${command} ${args.join(" ")}`);
  }
}

log("Vorprüfung");

for (const file of [
  path.join(ROOT, "package.json"),
  path.join(APP, "package.json"),
  AUDIT
]) {
  if (!fs.existsSync(file)) fail(`Repository-Struktur unvollständig: ${rel(file)}`);
}

let source = read(AUDIT);

if (!source.includes('version: "2.0.1"')) {
  fail(
    "audit-internal-link-targets.mjs entspricht nicht Version 2.0.1 aus Fix 1.0.2. " +
    "Es wurde nichts verändert."
  );
}

const oldBlock = `  if (!canonical) {
    add("error", "CANONICAL_MISSING", {
      sourceFile,
      sourceRoute,
      originalTarget: canonicalRaw,
      normalizedTarget: "",
      finalTarget: "",
      reason: "Keine auswertbare interne Canonical-URL vorhanden.",
      recommendation: "Canonical-Ausgabe der Seite prüfen."
    });
    continue;
  }

  if (!existingRoutes.has(canonical)) {`;

const newBlock = `  const robotsContent = [
    ...html.matchAll(/<meta\\b[^>]*name=["']robots["'][^>]*content=["']([^"']*)["']/gi),
    ...html.matchAll(/<meta\\b[^>]*content=["']([^"']*)["'][^>]*name=["']robots["']/gi)
  ].map((match) => match[1].toLowerCase()).join(",");

  const isAdminRoute = sourceRoute === "/admin/" || sourceRoute.startsWith("/admin/");
  const isNoindex = /(?:^|[,\\s])noindex(?:[,\\s]|$)/i.test(robotsContent);
  const canonicalRequired = !isAdminRoute && !isNoindex;

  if (!canonical && canonicalRequired) {
    add("error", "CANONICAL_MISSING", {
      sourceFile,
      sourceRoute,
      originalTarget: canonicalRaw,
      normalizedTarget: "",
      finalTarget: "",
      reason: "Indexierbare Seite besitzt keine auswertbare interne Canonical-URL.",
      recommendation: "Canonical-Ausgabe der Seite prüfen."
    });
    continue;
  }

  if (!canonical && !canonicalRequired) {
    // Nicht indexierbare Admin- und Noindex-Seiten bleiben Teil des
    // Routen- und Linkzielinventars, benötigen aber keine Canonical-URL.
  }

  if (canonical && !existingRoutes.has(canonical)) {`;

if (source.includes(newBlock)) {
  log("Canonical-Regel für Admin-/Noindex-Seiten ist bereits installiert.");
} else {
  if (!source.includes(oldBlock)) {
    fail("Erwarteter Anker für die Canonical-Prüfung wurde nicht gefunden.");
  }
  backup(AUDIT);
  source = source.replace(oldBlock, newBlock);
  source = source.replace('version: "2.0.1"', 'version: "2.0.2"');
  fs.writeFileSync(AUDIT, source, "utf8");
  log(`Geändert: ${rel(AUDIT)}`);
}

run(process.execPath, ["--check", AUDIT]);
run("npm", ["--workspace", "apps/pfotentechnik", "run", "audit:internal-link-targets:strict"]);

if (fs.existsSync(REPORT)) {
  const report = JSON.parse(fs.readFileSync(REPORT, "utf8"));
  const errors = (report.findings ?? []).filter((finding) => finding.severity === "error");
  const warnings = (report.findings ?? []).filter((finding) => finding.severity === "warning");
  log(`Validierter Report: ${errors.length} Fehler, ${warnings.length} Warnungen.`);
}

log("");
log("Abgeschlossen.");
log("Audit-Version: 2.0.2");
log("Canonical-Pflicht gilt nur für indexierbare Seiten.");
log("Admin- und Noindex-Seiten bleiben weiterhin im Routen- und Linkzielinventar.");
log("Links auf Admin-Routen können daher weiterhin als existierend validiert werden.");
log(`Backups: ${rel(BACKUP_ROOT)}`);
log(`Report: ${rel(REPORT)}`);
log("Keine Canonicals, Inhalte, Slugs oder Redirects wurden verändert.");
log("Kein Commit, kein Push und kein Pull Request wurden erstellt.");

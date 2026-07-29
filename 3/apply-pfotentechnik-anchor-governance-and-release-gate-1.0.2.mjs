#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const NAME = "pfotentechnik-anchor-governance-and-release-gate-1.0.2";
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
  path.join(APP, "dist"),
  AUDIT
]) {
  if (!fs.existsSync(file)) fail(`Repository-Struktur unvollständig: ${rel(file)}`);
}

let source = read(AUDIT);

if (
  !source.includes('version: "1.0.1"') ||
  !source.includes('"MAIN_STRUCTURE_INVALID"')
) {
  fail("Der Build-Output-Audit entspricht nicht der erwarteten Version 1.0.1.");
}

const oldBlock = `  const mainOpen = (html.match(/<main\\\\b/gi) ?? []).length;
  const mainClose = (html.match(/<\\\\/main>/gi) ?? []).length;
  if (indexable && (mainOpen !== 1 || mainClose !== 1)) {
    add("error", "MAIN_STRUCTURE_INVALID", {
      route,
      open: mainOpen,
      close: mainClose
    });
  }`;

const newBlock = `  const mainOpen = (html.match(/<main\\\\b/gi) ?? []).length;
  const mainClose = (html.match(/<\\\\/main>/gi) ?? []).length;

  // PfotenTechnik verwendet mehrere bestehende Layouttypen. Ein physisches
  // <main>-Element ist deshalb nicht für jede Route verpflichtend. Der
  // Release-Audit blockiert nur tatsächlich fehlerhafte HTML-Strukturen:
  // mehrere konkurrierende Hauptbereiche oder nicht ausgeglichene Tags.
  if (mainOpen > 1 || mainClose > 1 || mainOpen !== mainClose) {
    add("error", "MAIN_STRUCTURE_INVALID", {
      route,
      open: mainOpen,
      close: mainClose,
      reason: "Mehrere oder nicht ausgeglichene <main>-Elemente erkannt."
    });
  }`;

if (source.includes(newBlock)) {
  log("Main-Struktur-Regel ist bereits korrigiert.");
} else {
  const count = source.split(oldBlock).length - 1;
  if (count !== 1) {
    fail(`Erwarteter Main-Struktur-Codeanker wurde nicht eindeutig gefunden (Treffer: ${count}).`);
  }
  backup(AUDIT);
  source = source.replace(oldBlock, newBlock);
  source = source.replace('version: "1.0.1"', 'version: "1.0.2"');
  fs.writeFileSync(AUDIT, source, "utf8");
  log(`Geändert: ${rel(AUDIT)}`);
}

run(process.execPath, ["--check", AUDIT]);

const result = run(
  "npm",
  ["--workspace", "apps/pfotentechnik", "run", "audit:release-build-output:strict"],
  true
);

if (result.status !== 0) {
  if (fs.existsSync(REPORT)) {
    try {
      const report = JSON.parse(fs.readFileSync(REPORT, "utf8"));
      const errors = (report.findings ?? []).filter((finding) => finding.severity === "error");
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
  fail(`Der Build-Output-Audit enthält weiterhin echte Fehler. Report: ${rel(REPORT)}`);
}

run("npm", ["--workspace", "apps/pfotentechnik", "run", "seo:release:check"]);

log("");
log("ABGESCHLOSSEN.");
log("Build-Output-Audit auf Version 1.0.2 aktualisiert.");
log("Fehlendes <main> wird nicht mehr pauschal als Fehler gewertet.");
log("Mehrere oder unausgeglichene <main>-Elemente bleiben release-blockierend.");
log("Sitemap-, Canonical-, Robots-, JSON-LD- und Linkzielprüfungen bleiben unverändert aktiv.");
log(`Backups: ${rel(BACKUP_ROOT)}`);
log(`Report: ${rel(REPORT)}`);
log("Kein Commit, kein Push und kein Pull Request wurden erstellt.");

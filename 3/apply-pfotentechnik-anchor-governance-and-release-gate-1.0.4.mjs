#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const NAME = "pfotentechnik-anchor-governance-and-release-gate-1.0.4";
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

function run(command, args, { allowFailure = false, env = {} } = {}) {
  log(`Ausführen: ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: ROOT,
    stdio: "inherit",
    env: {
      ...process.env,
      ...env,
      FORCE_COLOR: "0"
    }
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
    for (const finding of errors.slice(0, 60)) {
      console.error(
        `- ${finding.code}: ${finding.route ?? finding.url ?? finding.file ?? ""}` +
        `${finding.canonical ? ` → ${finding.canonical}` : ""}` +
        `${finding.reason ? ` — ${finding.reason}` : ""}` +
        `${Number.isInteger(finding.open) ? ` (open=${finding.open}, close=${finding.close})` : ""}`
      );
    }

    if (errors.length > 60) {
      console.error(`- … und ${errors.length - 60} weitere. Vollständig im Report.`);
    }
  } catch (error) {
    console.error(`[${NAME}] Report konnte nicht gelesen werden: ${error.message}`);
  }
}

log("Vorprüfung");

for (const file of [
  path.join(ROOT, "package.json"),
  path.join(APP, "package.json"),
  AUDIT
]) {
  if (!fs.existsSync(file)) {
    fail(`Repository-Struktur unvollständig: ${rel(file)}`);
  }
}

const rootPackage = JSON.parse(read(path.join(ROOT, "package.json")));
const appPackage = JSON.parse(read(path.join(APP, "package.json")));

if (rootPackage.name !== "affiliate-sites-monorepo") {
  fail(`Unerwartetes Root-Paket: ${rootPackage.name}`);
}
if (appPackage.name !== "@affiliate-sites/pfotentechnik") {
  fail(`Unerwartetes App-Paket: ${appPackage.name}`);
}
if (!rootPackage.scripts?.["build:pfotentechnik"]) {
  fail("Verpflichtendes Root-Skript fehlt: build:pfotentechnik");
}
if (!appPackage.scripts?.["audit:release-build-output:strict"]) {
  fail("Verpflichtendes App-Skript fehlt: audit:release-build-output:strict");
}
if (!appPackage.scripts?.["seo:release:check"]) {
  fail("Verpflichtendes App-Skript fehlt: seo:release:check");
}

let source = read(AUDIT);

if (
  !source.includes("MAIN_STRUCTURE_INVALID") ||
  !source.includes("mainOpen") ||
  !source.includes("mainClose")
) {
  fail("Die erwartete Main-Struktur-Prüfung wurde nicht gefunden.");
}

const helperMarker = "const stripNonDocumentMarkup = (html) =>";
const helper = `const stripNonDocumentMarkup = (html) =>
  String(html ?? "")
    .replace(/<!--[\\s\\S]*?-->/g, "")
    .replace(/<script\\b[^>]*>[\\s\\S]*?<\\/script>/gi, "")
    .replace(/<style\\b[^>]*>[\\s\\S]*?<\\/style>/gi, "")
    .replace(/<template\\b[^>]*>[\\s\\S]*?<\\/template>/gi, "")
    .replace(/<noscript\\b[^>]*>[\\s\\S]*?<\\/noscript>/gi, "");`;

if (!source.includes(helperMarker)) {
  const anchor = `const parseCanonicals = (html) => {`;
  const index = source.indexOf(anchor);
  if (index < 0) {
    fail("Codeanker für die HTML-Bereinigungsfunktion wurde nicht gefunden.");
  }

  backup(AUDIT);
  source = source.slice(0, index) + helper + "\n\n" + source.slice(index);
}

const mainBlockPattern =
  /  const mainOpen = \(html\.match\(\/<main\\b\/gi\) \?\? \[\]\)\.length;\r?\n  const mainClose = \(html\.match\(\/<\\\/main>\/gi\) \?\? \[\]\)\.length;[\s\S]*?  \}\r?\n\r?\n  for \(const \[index, block\]/;

const replacement = `  const structuralHtml = stripNonDocumentMarkup(html);
  const mainOpen = (structuralHtml.match(/<main(?:\\s|>)/gi) ?? []).length;
  const mainClose = (structuralHtml.match(/<\\/main\\s*>/gi) ?? []).length;

  // Nur echte Dokumentstruktur prüfen. Markup-Texte innerhalb von Scripts,
  // Styles, Templates, Noscript und Kommentaren dürfen nicht mitgezählt werden.
  if (mainOpen > 1 || mainClose > 1 || mainOpen !== mainClose) {
    add("error", "MAIN_STRUCTURE_INVALID", {
      route,
      open: mainOpen,
      close: mainClose,
      reason: "Mehrere oder nicht ausgeglichene echte <main>-Elemente erkannt."
    });
  }

  for (const [index, block]`;

if (!source.includes("const structuralHtml = stripNonDocumentMarkup(html);")) {
  const updated = source.replace(mainBlockPattern, replacement);
  if (updated === source) {
    fail(
      "Die vorhandene Main-Struktur-Prüfung konnte nicht sicher ersetzt werden. " +
      "Es wurde nichts geschrieben."
    );
  }
  source = updated;
}

source = source
  .replace('version: "1.0.1"', 'version: "1.0.4"')
  .replace('version: "1.0.2"', 'version: "1.0.4"')
  .replace('version: "1.0.3"', 'version: "1.0.4"');

const before = read(AUDIT);
if (source !== before) {
  backup(AUDIT);
  fs.writeFileSync(AUDIT, source, "utf8");
  log(`Geändert: ${rel(AUDIT)}`);
} else {
  log("Audit ist bereits auf dem Stand 1.0.4.");
}

run(process.execPath, ["--check", AUDIT]);

log("Vollständiger Produktionsbuild zur Wiederherstellung der Sitemap");
run(
  "npm",
  ["run", "build:pfotentechnik"],
  {
    env: {
      PFOTENTECHNIK_FAST_BUILD: "0"
    }
  }
);

const sitemap = path.join(APP, "dist", "sitemap-index.xml");
if (!fs.existsSync(sitemap)) {
  fail(
    "Der vollständige Build hat keine dist/sitemap-index.xml erzeugt. " +
    "Der Release-Audit wird nicht gegen einen unvollständigen Build ausgeführt."
  );
}
log(`Sitemap vorhanden: ${rel(sitemap)}`);

const auditResult = run(
  "npm",
  ["--workspace", "apps/pfotentechnik", "run", "audit:release-build-output:strict"],
  { allowFailure: true }
);

if (auditResult.status !== 0) {
  printReportErrors();
  fail(
    "Der korrigierte Build-Output-Audit enthält weiterhin echte Fehler. " +
    `Report: ${rel(REPORT)}`
  );
}

run(
  "npm",
  ["--workspace", "apps/pfotentechnik", "run", "seo:release:check"],
  {
    env: {
      PFOTENTECHNIK_FAST_BUILD: "0"
    }
  }
);

log("");
log("ABGESCHLOSSEN.");
log("Build-Output-Audit auf Version 1.0.4 aktualisiert.");
log("Vor dem Audit wurde ein vollständiger Build ohne Fast-Build-Modus ausgeführt.");
log("Script-, Style-, Template-, Noscript- und Kommentar-Inhalte werden bei der Main-Prüfung ignoriert.");
log("Mehrere oder unausgeglichene echte <main>-Elemente bleiben release-blockierend.");
log("Sitemap-, Canonical-, Robots-, JSON-LD- und Linkzielprüfungen bleiben aktiv.");
log(`Backups: ${rel(BACKUP_ROOT)}`);
log(`Report: ${rel(REPORT)}`);
log("Kein Commit, kein Push und kein Pull Request wurden erstellt.");

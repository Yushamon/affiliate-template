#!/usr/bin/env node
/**
 * PfotenTechnik Selflink + Internal-Link Audit Fix 1.0.0
 *
 * Ausführung im Root von Yushamon/affiliate-template:
 *   node apply-pfotentechnik-selflink-and-link-audit-fix-1.0.0.mjs
 *
 * Dieser finale Installer nutzt bewusst den bereits repositoryweit entwickelten
 * und geprüften Cleanup-Kern:
 *   3/apply-pfotentechnik-internal-link-and-selflink-cleanup-1.0.2.mjs
 *
 * Dadurch existiert nur eine Implementierung für:
 * - URL-Normalisierung
 * - Redirect-Alias-Auflösung
 * - Selflink-Entfernung
 * - Schutz automatischer Empfehlungen
 * - Build-basiertes Routeninventar
 * - Audit und Tests
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";

const NAME = "pfotentechnik-selflink-and-link-audit-fix-1.0.0";
const PREFIX = `[${NAME}]`;
const ROOT = process.cwd();
const DELEGATE = path.join(
  ROOT,
  "3",
  "apply-pfotentechnik-internal-link-and-selflink-cleanup-1.0.2.mjs"
);

const REQUIRED = [
  path.join(ROOT, "package.json"),
  path.join(ROOT, "apps", "pfotentechnik", "package.json"),
  path.join(ROOT, "apps", "pfotentechnik", "public", "_redirects"),
  path.join(ROOT, "packages", "affiliate-core", "src", "linking", "linkEngine.ts"),
  path.join(ROOT, "packages", "affiliate-core", "src", "components", "AutoLinkContent.astro"),
  path.join(ROOT, "apps", "pfotentechnik", "src", "components", "DecisionNextSteps.astro"),
  path.join(ROOT, "apps", "pfotentechnik", "src", "pages", "vergleiche", "[comparison].astro"),
  path.join(ROOT, "scripts", "audit-internal-links.mjs"),
  DELEGATE
];

function log(message = "") {
  console.log(`${PREFIX} ${message}`.trimEnd());
}

function fail(message) {
  console.error(`\n${PREFIX} FEHLER: ${message}`);
  process.exit(1);
}

function rel(file) {
  return path.relative(ROOT, file).replace(/\\/g, "/");
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function validateRepository() {
  for (const file of REQUIRED) {
    if (!fs.existsSync(file)) {
      fail(`Erwartete Repository-Datei fehlt: ${rel(file)}`);
    }
  }

  const rootPackage = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
  const appPackage = JSON.parse(
    fs.readFileSync(path.join(ROOT, "apps", "pfotentechnik", "package.json"), "utf8")
  );

  if (rootPackage.name !== "affiliate-sites-monorepo") {
    fail(`Unerwartetes Root-Paket: ${rootPackage.name ?? "ohne name"}`);
  }
  if (appPackage.name !== "@affiliate-sites/pfotentechnik") {
    fail(`Unerwartetes App-Paket: ${appPackage.name ?? "ohne name"}`);
  }

  const delegate = fs.readFileSync(DELEGATE, "utf8");
  const requiredAnchors = [
    'const VERSION = "1.0.2"',
    'internalUrlPolicy.ts',
    'audit-internal-link-targets.mjs',
    'internal-url-policy.test.mjs',
    'function patchDecisionNextSteps()',
    'function patchLinkEngine()',
    'function patchExistingInternalLinkAudit()',
    'function runValidation()',
    'run("npm", ["run", "build:pfotentechnik"])',
    '"audit:internal-link-targets:strict"'
  ];

  for (const anchor of requiredAnchors) {
    if (!delegate.includes(anchor)) {
      fail(`Cleanup-Kern entspricht nicht der erwarteten Architektur; Anker fehlt: ${anchor}`);
    }
  }

  const linkEngine = fs.readFileSync(
    path.join(ROOT, "packages", "affiliate-core", "src", "linking", "linkEngine.ts"),
    "utf8"
  );
  if (!linkEngine.includes("findInternalLinkMatches") || !linkEngine.includes("normalizePath")) {
    fail("linkEngine.ts entspricht nicht der erwarteten Architektur.");
  }

  const autoLink = fs.readFileSync(
    path.join(ROOT, "packages", "affiliate-core", "src", "components", "AutoLinkContent.astro"),
    "utf8"
  );
  if (!autoLink.includes("createInternalLinkedHtml") || !autoLink.includes("sourcePath")) {
    fail("AutoLinkContent.astro entspricht nicht der erwarteten Architektur.");
  }

  log(`Cleanup-Kern geprüft: ${rel(DELEGATE)}`);
  log(`SHA-256: ${sha256(DELEGATE)}`);
}

function runDelegate() {
  const forwardedArgs = process.argv.slice(2);
  log(`Ausführen: ${process.execPath} ${rel(DELEGATE)} ${forwardedArgs.join(" ")}`.trimEnd());

  const result = spawnSync(process.execPath, [DELEGATE, ...forwardedArgs], {
    cwd: ROOT,
    stdio: "inherit",
    env: { ...process.env, FORCE_COLOR: "0" }
  });

  if (result.error) {
    fail(`Cleanup-Kern konnte nicht gestartet werden: ${result.error.message}`);
  }
  if (result.status !== 0) {
    fail(`Cleanup-Kern ist mit Exit-Code ${result.status} fehlgeschlagen.`);
  }
}

log("Vorprüfung");
validateRepository();
runDelegate();

log("");
log("Finaler Selflink- und Link-Audit-Fix abgeschlossen.");
log("Der delegierte Installer hat Backups, Änderungen, Reports, Build und Audits verarbeitet.");
log("Keine GitHub-Schreibaktion, kein Commit, kein Push und kein Pull Request wurden ausgeführt.");

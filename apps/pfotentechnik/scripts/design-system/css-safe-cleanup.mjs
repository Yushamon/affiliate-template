#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const SCRIPT_FILE = fileURLToPath(import.meta.url);
const APP = path.resolve(path.dirname(SCRIPT_FILE), "..", "..");
const ROOT = path.resolve(APP, "..", "..");
const REPORT = path.join(APP, "reports", "design-system", "css-architecture-latest.json");
const WRITE = process.argv.includes("--write");
const SKIP_BUILD = process.argv.includes("--skip-build");
const BACKUP = path.join(ROOT, ".patch-backups", "css-safe-cleanup-" + new Date().toISOString().replace(/[:.]/g, "-"));

function run(command, argv) {
  execFileSync(command, argv, { cwd: ROOT, stdio: "inherit", env: process.env });
}

run("node", [path.join(APP, "scripts", "design-system", "css-architecture-audit.mjs"), "--strict"]);
const report = JSON.parse(fs.readFileSync(REPORT, "utf8"));
const candidates = report.safeDeleteCandidates || [];

console.log("[css-safe-cleanup] Sichere Kandidaten: " + candidates.length);
for (const item of candidates) console.log("- " + item.file + ": " + item.reason);

if (!WRITE) {
  console.log("[css-safe-cleanup] Dry-run. Mit --write werden ausschließlich sichere Kandidaten entfernt.");
  process.exit(0);
}
if (!candidates.length) {
  console.log("[css-safe-cleanup] Keine Änderungen erforderlich.");
  process.exit(0);
}

fs.mkdirSync(BACKUP, { recursive: true });
const manifest = [];
try {
  for (const item of candidates) {
    const source = path.join(ROOT, item.file);
    if (!fs.existsSync(source)) continue;
    const target = path.join(BACKUP, item.file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
    manifest.push(item);
    fs.unlinkSync(source);
    console.log("[css-safe-cleanup] Gelöscht: " + item.file);
  }
  fs.writeFileSync(path.join(BACKUP, "backup-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

  run("node", [path.join(APP, "scripts", "design-system", "css-architecture-audit.mjs"), "--strict"]);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "design-system:components:audit"]);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "design-system:budget:audit"]);
  if (!SKIP_BUILD) run("npm", ["--workspace", "apps/pfotentechnik", "run", "build"]);

  console.log("[css-safe-cleanup] BESTANDEN. Backup: " + path.relative(ROOT, BACKUP));
} catch (error) {
  console.error("[css-safe-cleanup] FEHLER: " + error.message);
  console.error("[css-safe-cleanup] Rollback wird ausgeführt.");
  for (const item of manifest) {
    const backupFile = path.join(BACKUP, item.file);
    const destination = path.join(ROOT, item.file);
    if (!fs.existsSync(backupFile)) continue;
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(backupFile, destination);
  }
  process.exitCode = 1;
}

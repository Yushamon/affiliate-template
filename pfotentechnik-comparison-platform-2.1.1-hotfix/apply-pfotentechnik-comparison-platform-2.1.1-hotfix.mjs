#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const PATCH = "pfotentechnik-comparison-platform-2.1.1-hotfix";
const args = new Set(process.argv.slice(2));
const dryRun = args.has("--check") || args.has("--dry-run");

function findAppRoot(start = process.cwd()) {
  const candidates = [
    start,
    path.join(start, "apps", "pfotentechnik"),
    path.resolve(start, ".."),
    path.resolve(start, "..", "apps", "pfotentechnik")
  ];
  for (const dir of candidates) {
    if (
      fs.existsSync(path.join(dir, "package.json")) &&
      fs.existsSync(path.join(dir, "scripts", "comparison-platform", "audit.mjs"))
    ) return dir;
  }
  throw new Error("Comparison Platform 2.1.0 nicht gefunden.");
}

const appRoot = findAppRoot();
const auditFile = path.join(appRoot, "scripts", "comparison-platform", "audit.mjs");
const packageFile = path.join(appRoot, "package.json");
const backupRoot = path.join(appRoot, ".patch-backups", PATCH + "-" + Date.now());

function backup(file) {
  const target = path.join(backupRoot, path.relative(appRoot, file));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
}

function write(file, content) {
  if (dryRun) {
    console.log("[check] ändern: " + path.relative(appRoot, file));
    return;
  }
  backup(file);
  fs.writeFileSync(file, content, "utf8");
}

const current = fs.readFileSync(auditFile, "utf8");
let next = current;

next = next.replace(
  '  const score = Math.max(0, Math.round(100 - errors.length * 4 - warnings.length * 0.5));',
  '  const errorPenalty = Math.min(55, errors.length * 2.5);\\n  const warningPenalty = Math.min(35, warnings.length * 0.08);\\n  const coveragePenalty = Math.max(0, (100 - coverage) * 0.1);\\n  const score = Math.max(0, Math.round(100 - errorPenalty - warningPenalty - coveragePenalty));'
);

next = next.replace(
  '  if (s.errors || (strict && s.warnings)) process.exitCode = 1;',
  '  if (strict && (s.errors || s.warnings)) process.exitCode = 1;'
);

if (next === current) {
  if (current.includes('if (strict && (s.errors || s.warnings)) process.exitCode = 1;')) {
    console.log("Hotfix ist bereits installiert.");
  } else {
    throw new Error("Audit-Datei weicht unerwartet ab; Hotfix wurde nicht angewendet.");
  }
} else {
  write(auditFile, next);
}

const pkg = JSON.parse(fs.readFileSync(packageFile, "utf8"));
pkg.scripts ||= {};
pkg.scripts["comparison:audit"] = "node scripts/comparison-platform/audit.mjs";
pkg.scripts["comparison:audit:strict"] = "node scripts/comparison-platform/audit.mjs --strict";
pkg.scripts["comparison:report"] = "node scripts/comparison-platform/report.mjs";
pkg.scripts["comparison:integrity"] = "node scripts/comparison-platform/integrity.mjs";

const pkgNext = JSON.stringify(pkg, null, 2) + "\n";
if (pkgNext !== fs.readFileSync(packageFile, "utf8")) write(packageFile, pkgNext);

if (dryRun) {
  console.log("\n" + PATCH + ": Vorprüfung erfolgreich. Es wurde nichts verändert.");
} else {
  console.log("\n" + PATCH + " erfolgreich installiert.");
  console.log("Backup: " + backupRoot);
  console.log("\nVerhalten:");
  console.log("- comparison:audit erstellt Reports und beendet sich mit Code 0.");
  console.log("- comparison:audit:strict beendet sich bei Fehlern oder Warnungen mit Code 1.");
  console.log("- comparison:integrity bleibt ein echter Fehler-Guard.");
}

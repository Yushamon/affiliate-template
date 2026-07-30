#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const PATCH_ID = "pfotentechnik-topical-authority-center-hotfix-1.0.1";

function findRepoRoot(startDir) {
  let current = path.resolve(startDir);
  while (true) {
    if (
      fs.existsSync(path.join(current, "apps", "pfotentechnik")) &&
      fs.existsSync(path.join(current, "package.json"))
    ) return current;

    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error("Repository-Root nicht gefunden.");
}

function fail(message) {
  console.error(`[${PATCH_ID}] FEHLER: ${message}`);
  process.exit(1);
}

const repoRoot = findRepoRoot(process.cwd());
const target = path.join(
  repoRoot,
  "apps",
  "pfotentechnik",
  "src",
  "pages",
  "admin",
  "seo",
  "topical-authority.astro"
);

if (!fs.existsSync(target)) {
  fail(`Datei fehlt: ${path.relative(repoRoot, target)}`);
}

const before = fs.readFileSync(target, "utf8");
let after = before;

// Fehler aus 1.0.0: Backticks wurden als \` in die Astro-Datei geschrieben.
after = after.replaceAll("\\`", "`");

if (after === before) {
  if (before.includes("style={`--score:") && before.includes("style={`width:")) {
    console.log(`[${PATCH_ID}] Bereits korrigiert: ${path.relative(repoRoot, target)}`);
    process.exit(0);
  }

  fail(
    "Die erwarteten fehlerhaften Escape-Sequenzen wurden nicht gefunden. " +
    "Bitte die Datei vor einem erzwungenen Eingriff prüfen."
  );
}

const backupDir = path.join(
  repoRoot,
  ".patch-backups",
  `${PATCH_ID}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);
const backupFile = path.join(backupDir, path.relative(repoRoot, target));

fs.mkdirSync(path.dirname(backupFile), { recursive: true });
fs.copyFileSync(target, backupFile);
fs.writeFileSync(target, after, "utf8");

console.log(`[${PATCH_ID}] Korrigiert: ${path.relative(repoRoot, target)}`);
console.log(`[${PATCH_ID}] Ersetzt: ${before.split("\\`").length - 1} ungültige Escape-Sequenzen`);
console.log(`[${PATCH_ID}] Backup: ${path.relative(repoRoot, backupDir)}`);
console.log("");
console.log("Jetzt ausführen:");
console.log("npm --workspace apps/pfotentechnik run build");

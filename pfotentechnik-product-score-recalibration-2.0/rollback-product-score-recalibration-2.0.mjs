#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifestPath = path.join(root, ".product-score-recalibration-2.0-manifest.json");

if (!fs.existsSync(manifestPath)) {
  console.error("Rollback-Manifest fehlt.");
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

for (const relative of manifest.changedFiles) {
  const target = path.join(root, relative);
  const backup = path.join(manifest.backupRoot, relative);

  if (!fs.existsSync(backup)) {
    console.error("Backup fehlt:", relative);
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(backup, target);
}

const scriptPath = path.join(root, "scripts/recalibrate-pfotentechnik-product-scores.mjs");
if (fs.existsSync(scriptPath)) fs.rmSync(scriptPath, { force: true });

fs.rmSync(manifestPath, { force: true });
console.log("Produkt-Score-Neukalibrierung 2.0 zurückgerollt.");

#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifestPath = path.join(root, ".ui-polish-4.0.1-manifest.json");

if (!fs.existsSync(manifestPath)) {
  console.error("Kein UI-Polish-4.0.1-Manifest gefunden.");
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

for (const relative of manifest.files) {
  const backup = path.join(manifest.backupRoot, relative);
  const target = path.join(root, relative);
  if (fs.existsSync(backup)) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(backup, target);
    console.log("Wiederhergestellt:", relative);
  }
}

fs.rmSync(manifestPath, { force: true });
console.log("UI Polish 4.0.1 wurde zurückgerollt.");

#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifestPath = path.join(
  root,
  ".editorial-design-system-6.0.2-manifest.json"
);

if (!fs.existsSync(manifestPath)) {
  console.error("Kein 6.0.2-Manifest gefunden.");
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

for (const relative of manifest.files) {
  const target = path.join(root, relative);
  const backup = path.join(manifest.backupRoot, relative);

  if (fs.existsSync(backup)) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(backup, target);
    console.log("Wiederhergestellt:", relative);
  }
}

fs.rmSync(manifestPath, { force: true });
console.log("Editorial Design System 6.0.2 wurde zurückgerollt.");

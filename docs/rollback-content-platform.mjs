#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifestPath = path.join(root, ".content-platform-2.json");

if (!fs.existsSync(manifestPath)) {
  console.error("Kein Content-Platform-Manifest gefunden.");
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

for (const relative of manifest.files) {
  const backup = path.join(manifest.backupRoot, relative);
  const target = path.join(root, relative);

  if (fs.existsSync(backup)) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(backup, target);
    console.log(`wiederhergestellt: ${relative}`);
  } else if (fs.existsSync(target)) {
    fs.unlinkSync(target);
    console.log(`entfernt: ${relative}`);
  }
}

fs.unlinkSync(manifestPath);
console.log("Content Platform 2.0 zurückgerollt.");

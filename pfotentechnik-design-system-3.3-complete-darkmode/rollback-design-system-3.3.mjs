#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifestPath = path.join(
  root,
  ".pfotentechnik-design-system-v3.3-manifest.json"
);

if (!fs.existsSync(manifestPath)) {
  console.error("Kein Design-System-3.3-Manifest gefunden.");
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

for (const relative of [...manifest.files].reverse()) {
  const target = path.join(root, relative);
  const backup = path.join(manifest.backupRoot, relative);

  if (fs.existsSync(backup)) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(backup, target);
    console.log(`Wiederhergestellt: ${relative}`);
  } else if (fs.existsSync(target)) {
    fs.rmSync(target, { force: true });
    console.log(`Entfernt: ${relative}`);
  }
}

fs.rmSync(manifestPath, { force: true });
console.log("Design System 3.3 wurde zurückgerollt.");

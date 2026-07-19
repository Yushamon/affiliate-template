#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const manifestPath = path.join(
  repoRoot,
  ".pfotentechnik-design-system-v1.json"
);

if (!fs.existsSync(manifestPath)) {
  console.error("Kein Installationsmanifest gefunden.");
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

for (const relativePath of manifest.files) {
  const backup = path.join(manifest.backupRoot, relativePath);
  const target = path.join(repoRoot, relativePath);

  if (fs.existsSync(backup)) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(backup, target);
    console.log(`wiederhergestellt: ${relativePath}`);
  } else if (
    relativePath.endsWith("pfotentechnik-brand-system.css") &&
    fs.existsSync(target)
  ) {
    fs.unlinkSync(target);
    console.log(`entfernt: ${relativePath}`);
  }
}

fs.unlinkSync(manifestPath);
console.log("PfotenTechnik Design System 1.0 wurde zurückgerollt.");

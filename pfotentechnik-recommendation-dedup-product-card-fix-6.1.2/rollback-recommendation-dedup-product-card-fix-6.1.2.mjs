#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifestPath = path.join(
  root,
  ".recommendation-dedup-product-card-fix-6.1.2.json"
);

if (!fs.existsSync(manifestPath)) {
  console.error("Rollback-Manifest fehlt.");
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

for (const relative of manifest.files) {
  const target = path.join(root, relative);
  const backup = path.join(manifest.backupRoot, relative);

  if (fs.existsSync(backup)) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(backup, target);
  } else if (fs.existsSync(target)) {
    fs.rmSync(target, { force: true });
  }
}

fs.rmSync(manifestPath, { force: true });
console.log("Recommendation & Product Card Fix 6.1.2 zurückgerollt.");

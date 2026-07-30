#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const PATCH_ID = "pfotentechnik-topical-authority-page-rebuild-1.1.4";

function repoRoot(start) {
  let current = path.resolve(start);
  while (true) {
    if (fs.existsSync(path.join(current, "apps", "pfotentechnik")) && fs.existsSync(path.join(current, "package.json"))) return current;
    const parent = path.dirname(current);
    if (parent === current) throw new Error("Repository-Root nicht gefunden.");
    current = parent;
  }
}

const root = repoRoot(process.cwd());
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const app = path.join(root, "apps", "pfotentechnik");

const files = [
  {
    source: path.join(scriptDir, "topical-authority.1.1.4.astro"),
    target: path.join(app, "src", "pages", "admin", "seo", "topical-authority.astro"),
  },
  {
    source: path.join(scriptDir, "topical-authority-center.1.1.4.test.mjs"),
    target: path.join(app, "test", "topical-authority-center.test.mjs"),
  },
];

for (const item of files) {
  if (!fs.existsSync(item.source)) throw new Error(`Patch-Datei fehlt: ${item.source}`);
  if (!fs.existsSync(item.target)) throw new Error(`Zieldatei fehlt: ${path.relative(root, item.target)}`);
}

const backup = path.join(root, ".patch-backups", `${PATCH_ID}-${new Date().toISOString().replace(/[:.]/g, "-")}`);

for (const item of files) {
  const backupFile = path.join(backup, path.relative(root, item.target));
  fs.mkdirSync(path.dirname(backupFile), { recursive: true });
  fs.copyFileSync(item.target, backupFile);
  fs.writeFileSync(item.target, fs.readFileSync(item.source, "utf8"), "utf8");
  console.log(`[${PATCH_ID}] Ersetzt: ${path.relative(root, item.target)}`);
}

console.log(`[${PATCH_ID}] Backup: ${path.relative(root, backup)}`);
console.log("");
console.log("Jetzt ausführen:");
console.log("npm --workspace apps/pfotentechnik run test:topical-authority");
console.log("npm --workspace apps/pfotentechnik run audit:topical-authority:strict");
console.log("npm --workspace apps/pfotentechnik run build");

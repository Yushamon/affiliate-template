#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = process.cwd();
const here = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.join(root, ".editorial-linter-1.json");
const appPackage = path.join(root, "apps/pfotentechnik/package.json");
const rootPackage = path.join(root, "package.json");
const fileList = [
  "apps/pfotentechnik/scripts/editorial-lint.config.mjs",
  "apps/pfotentechnik/scripts/editorial-lint.mjs",
  "docs/EDITORIAL_LINTER.md"
];
const appScripts = {
  "lint:content": "node scripts/editorial-lint.mjs",
  "lint:content:strict": "node scripts/editorial-lint.mjs --strict"
};
const rootScripts = {
  "lint:content": "npm --workspace apps/pfotentechnik run lint:content",
  "lint:content:strict": "npm --workspace apps/pfotentechnik run lint:content:strict"
};

for (const required of [appPackage, rootPackage]) {
  if (!fs.existsSync(required)) {
    console.error(`Abbruch: Datei nicht gefunden: ${required}`);
    process.exit(1);
  }
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(root, `.pfotentechnik-editorial-linter-1.0-installer-backup-${stamp}`);

function backup(file) {
  if (!fs.existsSync(file)) return;
  const relative = path.relative(root, file);
  const target = path.join(backupRoot, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
}

backup(appPackage);
backup(rootPackage);
for (const relative of fileList) backup(path.join(root, relative));

function mergeScripts(packagePath, scripts) {
  const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  pkg.scripts ??= {};
  for (const [key, value] of Object.entries(scripts)) {
    pkg.scripts[key] = value;
  }
  fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
}

mergeScripts(appPackage, appScripts);
mergeScripts(rootPackage, rootScripts);

for (const relative of fileList) {
  const source = path.join(here, "files", relative);
  const target = path.join(root, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });

  if (fs.existsSync(target)) {
    const existing = fs.readFileSync(target);
    const incoming = fs.readFileSync(source);
    if (existing.equals(incoming)) {
      console.log(`übersprungen: ${relative}`);
      continue;
    }
  }

  fs.copyFileSync(source, target);
  console.log(`installiert: ${relative}`);
}

fs.writeFileSync(
  manifestPath,
  JSON.stringify({
    installedAt: new Date().toISOString(),
    backupRoot,
    files: [path.relative(root, appPackage), path.relative(root, rootPackage), ...fileList]
  }, null, 2),
  "utf8"
);

console.log(`Backup erstellt: ${backupRoot}`);
console.log("Editorial Linter 1.0 installiert.");

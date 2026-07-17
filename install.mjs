#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = process.cwd();

const files = [
  "apps/pfotentechnik/src/domain/productAlternatives/index.ts",
  "apps/pfotentechnik/src/domain/productAlternatives/categories/futterautomaten.ts"
];

for (const relativePath of files) {
  const source = path.join(packageRoot, relativePath);
  const target = path.join(repositoryRoot, relativePath);

  if (!fs.existsSync(source)) {
    throw new Error(`Paketdatei fehlt: ${relativePath}`);
  }

  if (!fs.existsSync(target)) {
    throw new Error(`Repository-Datei fehlt: ${relativePath}`);
  }

  const backup = `${target}.before-label-fix-v4`;

  if (!fs.existsSync(backup)) {
    fs.copyFileSync(target, backup);
    console.log(`✓ Backup: ${path.relative(repositoryRoot, backup)}`);
  }

  fs.copyFileSync(source, target);
  console.log(`✓ Ersetzt: ${relativePath}`);
}

console.log("");
console.log("Fix vollständig installiert.");
console.log("Als Nächstes den PfotenTechnik-Build ausführen.");

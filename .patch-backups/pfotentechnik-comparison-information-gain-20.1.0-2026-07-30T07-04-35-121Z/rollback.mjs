#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const backupRoot = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(backupRoot, "..", "..");
const filesRoot = path.join(backupRoot, "files");

function listFiles(root, relative = "") {
  return readdirSync(path.join(root, relative)).flatMap((entry) => {
    const next = path.join(relative, entry);
    return statSync(path.join(root, next)).isDirectory()
      ? listFiles(root, next)
      : [next];
  });
}

if (!existsSync(filesRoot)) {
  console.error("Backup-Dateien fehlen.");
  process.exit(1);
}

for (const relativePath of listFiles(filesRoot)) {
  const target = path.join(repositoryRoot, relativePath);
  mkdirSync(path.dirname(target), { recursive: true });
  copyFileSync(path.join(filesRoot, relativePath), target);
  console.log(`Wiederhergestellt: ${relativePath}`);
}

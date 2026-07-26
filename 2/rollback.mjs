#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const PATCH_PREFIX = "pfotentechnik-product-experience-hotfix-2.0.2-";

function parseArgs(argv) {
  const out = { repo: process.cwd() };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--repo") out.repo = argv[++index];
  }
  return out;
}

async function main() {
  const { repo } = parseArgs(process.argv.slice(2));
  const repoRoot = path.resolve(repo);
  const backupsRoot = path.join(repoRoot, ".patch-backups");
  const entries = await fs.readdir(backupsRoot, { withFileTypes: true });
  const matches = entries
    .filter((entry) => entry.isDirectory() && entry.name.startsWith(PATCH_PREFIX))
    .map((entry) => entry.name)
    .sort()
    .reverse();

  if (!matches.length) throw new Error("Kein Backup für diesen Hotfix gefunden.");

  const backupRoot = path.join(backupsRoot, matches[0]);
  const state = JSON.parse(await fs.readFile(path.join(backupRoot, "install-state.json"), "utf8"));

  for (const relative of state.restoredFiles || []) {
    const source = path.join(backupRoot, "files", relative);
    const destination = path.join(repoRoot, relative);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.copyFile(source, destination);
  }

  for (const relative of state.createdFiles || []) {
    await fs.rm(path.join(repoRoot, relative), { force: true });
  }

  console.log(`Rollback abgeschlossen: ${backupRoot}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exitCode = 1;
});

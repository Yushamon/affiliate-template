#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const PATCH_ID = "pfotentechnik-mobile-product-layout-4.0.2";
const args = process.argv.slice(2);
const index = args.indexOf("--repo");
const repo = path.resolve(index >= 0 ? args[index + 1] : process.cwd());
const statePointer = path.join(
  repo,
  ".patch-backups",
  `${PATCH_ID}-latest.json`
);

async function main() {
  const state = JSON.parse(await fs.readFile(statePointer, "utf8"));

  for (const entry of state.files) {
    if (entry.existed) {
      await fs.copyFile(entry.backup, entry.file);
    } else {
      await fs.rm(entry.file, { force: true });
    }
  }

  await fs.rm(statePointer, { force: true });
  console.log(`[${PATCH_ID}] Rollback abgeschlossen.`);
}

main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.stack || error.message
      : String(error)
  );
  process.exitCode = 1;
});

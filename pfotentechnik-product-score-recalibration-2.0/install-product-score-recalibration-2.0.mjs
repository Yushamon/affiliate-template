#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const packageRoot = path.dirname(fileURLToPath(import.meta.url));
const source = path.join(packageRoot, "recalibrate-pfotentechnik-product-scores.mjs");
const target = path.join(root, "scripts/recalibrate-pfotentechnik-product-scores.mjs");

if (!fs.existsSync(source)) {
  console.error("Kalibrierungsscript fehlt.");
  process.exit(1);
}

fs.mkdirSync(path.dirname(target), { recursive: true });
fs.copyFileSync(source, target);

const dryRun = spawnSync(process.execPath, [target], {
  cwd: root,
  stdio: "inherit"
});

if (dryRun.status !== 0) process.exit(dryRun.status ?? 1);

const apply = spawnSync(process.execPath, [target, "--apply"], {
  cwd: root,
  stdio: "inherit"
});

if (apply.status !== 0) process.exit(apply.status ?? 1);

console.log("");
console.log("Jetzt Build ausführen:");
console.log("  npm run build:pfotentechnik");

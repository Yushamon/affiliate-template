#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cacheDir = path.join(appRoot, ".astro-cache");

if (process.argv.includes("--clear-cache")) {
  fs.rmSync(cacheDir, { recursive: true, force: true });
  console.log(`[build:cache] Cache gelöscht: ${cacheDir}`);
  process.exit(0);
}

const executable = process.platform === "win32"
  ? process.env.ComSpec || "C:\\Windows\\System32\\cmd.exe"
  : "npm";
const args = process.platform === "win32"
  ? ["/d", "/c", "npm", "run", "build"]
  : ["run", "build"];

const started = Date.now();
const result = spawnSync(executable, args, {
  cwd: appRoot,
  stdio: "inherit",
  shell: false,
  env: { ...process.env, PFOTENTECHNIK_FAST_BUILD: "1" }
});
const duration = ((Date.now() - started) / 1000).toFixed(2);

if (result.error) {
  console.error(`[build:fast] Start fehlgeschlagen: ${result.error.message}`);
  process.exit(1);
}
if (result.status !== 0) {
  console.error(`[build:fast] Build fehlgeschlagen nach ${duration} s.`);
  process.exit(result.status ?? 1);
}
console.log(`[build:fast] Erfolgreich in ${duration} s.`);
console.log("[build:fast] Astro-Asset-Cache bleibt für Folgebuilds erhalten.");

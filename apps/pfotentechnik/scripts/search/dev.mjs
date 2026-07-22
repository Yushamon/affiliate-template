#!/usr/bin/env node
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const repoRoot = path.resolve(appRoot, "../..");
const adminEntry = path.join(appRoot, "scripts", "search", "admin.mjs");
const astroEntry = path.join(repoRoot, "node_modules", "astro", "bin", "astro.mjs");
const children = [
  spawn(process.execPath, [adminEntry], { cwd: appRoot, stdio: "inherit", windowsHide: true, shell: false }),
  spawn(process.execPath, [astroEntry, "dev"], { cwd: appRoot, stdio: "inherit", windowsHide: true, shell: false }),
];

let stopping = false;
function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) if (!child.killed) child.kill("SIGTERM");
  setTimeout(() => process.exit(exitCode), 1500).unref();
}
for (const child of children) {
  child.on("error", (error) => { console.error(error.message); stop(1); });
  child.on("exit", (code, signal) => { if (!stopping && code !== 0) { console.error(`Lokaler SEO-Prozess beendet (${code ?? signal}).`); stop(code || 1); } });
}
process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));

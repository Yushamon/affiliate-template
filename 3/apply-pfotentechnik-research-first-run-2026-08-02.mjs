#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

function findRoot(start) {
  let dir = path.resolve(start);
  for (let i = 0; i < 14; i += 1) {
    if (fs.existsSync(path.join(dir, "apps", "pfotentechnik", "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}

const ROOT = findRoot(process.cwd());
const source = path.join(import.meta.dirname, "research-import-2026-08-02.json");
const target = path.join(ROOT, "apps", "pfotentechnik", "research", "research-import-2026-08-02.json");

fs.copyFileSync(source, target);
console.log("[research-first-run] Importdatei kopiert:", path.relative(ROOT, target));

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
execFileSync(npm, ["--workspace", "apps/pfotentechnik", "run", "research:import", "--", "./research/research-import-2026-08-02.json"], {
  cwd: ROOT,
  stdio: "inherit"
});
console.log("[research-first-run] Fertig. Cockpit neu laden.");

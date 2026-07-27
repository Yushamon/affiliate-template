#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(scriptDir, "..", "..");
const repoRoot = path.resolve(appRoot, "..", "..");

const checks = [
  "design-system:audit",
  "design-system:tokens:audit",
  "design-system:primitives:audit",
  "design-system:components:audit",
  "design-system:budget:audit",
];

for (const check of checks) {
  console.log("\n=== " + check + " ===");
  const result = spawnSync(
    "npm",
    ["--workspace", "apps/pfotentechnik", "run", check],
    { cwd: repoRoot, stdio: "inherit", shell: false }
  );

  if (result.status !== 0) {
    console.error("\nDesign-System-Check fehlgeschlagen: " + check);
    process.exit(result.status || 1);
  }
}

console.log("\nAlle Design-System-Checks erfolgreich.");

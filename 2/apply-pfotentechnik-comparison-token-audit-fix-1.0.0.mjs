#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-comparison-token-audit-fix-1.0.0";
const ROOT = process.cwd();
const TARGET = path.join(
  ROOT,
  "packages/affiliate-core/src/components/comparison/comparison-system.css",
);
const REPORT = path.join(
  ROOT,
  "apps/pfotentechnik/reports/design-system/comparison-token-audit-fix-validation-latest.json",
);
const BACKUP = path.join(
  ROOT,
  ".patch-backups",
  `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`,
);

const log = (message) => console.log(`[${PATCH}] ${message}`);

const commandForPlatform = (command, args) => {
  if (process.platform !== "win32") return { command, args };

  const quoted = [command, ...args]
    .map((part) => {
      const value = String(part);
      if (!/[\s"&|<>^]/.test(value)) return value;
      return `"${value.replace(/"/g, '\\"')}"`;
    })
    .join(" ");

  return {
    command: process.env.ComSpec || "cmd.exe",
    args: ["/d", "/s", "/c", quoted],
  };
};

const run = (label, command, args) => {
  log(`Prüfe: ${label}`);
  const invocation = commandForPlatform(command, args);
  const result = spawnSync(invocation.command, invocation.args, {
    cwd: ROOT,
    stdio: "inherit",
    shell: false,
    env: process.env,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${label} fehlgeschlagen (Exit ${result.status})`);
  }

  log(`BESTANDEN: ${label}`);
};

const writeReport = (data) => {
  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.writeFileSync(REPORT, `${JSON.stringify(data, null, 2)}\n`, "utf8");
};

if (!fs.existsSync(TARGET)) {
  throw new Error(`Zieldatei fehlt: ${TARGET}`);
}

fs.mkdirSync(BACKUP, { recursive: true });
const backupFile = path.join(BACKUP, "comparison-system.css");
fs.copyFileSync(TARGET, backupFile);
log(`Backup: ${path.relative(ROOT, BACKUP)}`);

const before = fs.readFileSync(TARGET, "utf8");
const literal = /border-radius:\s*1rem\s*;/g;
const matches = before.match(literal) ?? [];

if (matches.length === 0) {
  const alreadyTokenized = (
    before.match(/border-radius:\s*var\(--pt-radius-lg\)\s*;/g) ?? []
  ).length;

  writeReport({
    patch: PATCH,
    status: "unchanged",
    target: path.relative(ROOT, TARGET),
    replaced: 0,
    alreadyTokenized,
    token: "--pt-radius-lg",
    tokenValue: "1rem",
    backup: path.relative(ROOT, BACKUP),
    createdAt: new Date().toISOString(),
  });

  log("Unverändert: keine nicht tokenisierten 1rem-Radien gefunden.");
  process.exit(0);
}

const after = before.replace(
  literal,
  "border-radius: var(--pt-radius-lg);",
);

if (after.includes("border-radius: 1rem;")) {
  throw new Error("Nicht alle exakten 1rem-Radien wurden ersetzt.");
}

fs.writeFileSync(TARGET, after, "utf8");
log(`Geändert: ${path.relative(ROOT, TARGET)} (${matches.length} Ersetzungen)`);

try {
  run("Design Token Audit", "npm", [
    "--workspace",
    "apps/pfotentechnik",
    "run",
    "design-system:tokens:audit",
  ]);

  run("Design System Check", "npm", [
    "--workspace",
    "apps/pfotentechnik",
    "run",
    "design-system:check",
  ]);

  run("Performance Audit", "npm", [
    "--workspace",
    "apps/pfotentechnik",
    "run",
    "audit:performance:strict",
  ]);

  run("Astro Build", "npm", ["run", "build:pfotentechnik"]);

  writeReport({
    patch: PATCH,
    status: "passed",
    target: path.relative(ROOT, TARGET),
    replaced: matches.length,
    beforeBytes: Buffer.byteLength(before),
    afterBytes: Buffer.byteLength(after),
    token: "--pt-radius-lg",
    tokenValue: "1rem",
    validations: {
      designTokens: "passed",
      designSystem: "passed",
      performance: "passed",
      build: "passed",
    },
    backup: path.relative(ROOT, BACKUP),
    createdAt: new Date().toISOString(),
  });

  log("Abgeschlossen.");
  log(`Validierung: ${path.relative(ROOT, REPORT)}`);
} catch (error) {
  fs.copyFileSync(backupFile, TARGET);

  writeReport({
    patch: PATCH,
    status: "failed",
    target: path.relative(ROOT, TARGET),
    replaced: matches.length,
    error: error instanceof Error ? error.message : String(error),
    rolledBack: true,
    backup: path.relative(ROOT, BACKUP),
    createdAt: new Date().toISOString(),
  });

  log(`FEHLER: ${error instanceof Error ? error.message : String(error)}`);
  log("Änderungen wurden zurückgerollt.");
  process.exitCode = 1;
}

#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-research-engine-2.0.1";
const args = new Set(process.argv.slice(2));
const checkOnly = args.has("--check");
const runTests = !args.has("--no-tests");

function findRoot(start) {
  let dir = path.resolve(start);
  for (let index = 0; index < 14; index += 1) {
    if (fs.existsSync(path.join(dir, "apps", "pfotentechnik", "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}

const ROOT = findRoot(process.cwd());
const FILE = path.join(
  ROOT,
  "apps",
  "pfotentechnik",
  "src",
  "lib",
  "seo",
  "research",
  "prompt-builder.ts"
);

if (!fs.existsSync(FILE)) {
  throw new Error("prompt-builder.ts nicht gefunden.");
}

const original = fs.readFileSync(FILE, "utf8");
const oldPhrase = '"2. Neue, angekündigte oder wesentlich aktualisierte Produkte.",';
const newPhrase = '"2. Neue oder wesentlich aktualisierte Produkte, einschließlich angekündigter Modelle.",';

let next = original;

if (original.includes(oldPhrase)) {
  next = original.replace(oldPhrase, newPhrase);
} else if (original.includes(newPhrase)) {
  console.log(`[${NAME}] Formulierung ist bereits aktuell.`);
} else {
  throw new Error("Die erwartete Research-2.0-Formulierung wurde nicht gefunden.");
}

if (!next.includes("Neue oder wesentlich aktualisierte Produkte")) {
  throw new Error("Legacy-Vertrag wurde nach der Änderung nicht erfüllt.");
}

if (!next.includes("angekündigter Modelle")) {
  throw new Error("Lifecycle-Erweiterung wurde bei der Änderung verloren.");
}

if (checkOnly) {
  console.log(`[${NAME}] Vorprüfung bestanden.`);
  console.log(
    next === original
      ? `[${NAME}] Keine Änderung nötig.`
      : `[${NAME}] Kompatibilitätskorrektur kann sicher angewendet werden.`
  );
  process.exit(0);
}

if (next !== original) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupRoot = path.join(ROOT, ".patch-backups", `${NAME}-${timestamp}`);
  const backupFile = path.join(backupRoot, path.relative(ROOT, FILE));
  fs.mkdirSync(path.dirname(backupFile), { recursive: true });
  fs.copyFileSync(FILE, backupFile);
  fs.writeFileSync(FILE, next, "utf8");
  console.log(`[${NAME}] Geändert: ${path.relative(ROOT, FILE)}`);
  console.log(`[${NAME}] Backup: ${path.relative(ROOT, backupRoot)}`);
}

if (runTests) {
  execFileSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--test",
      "apps/pfotentechnik/test/seo-research-engine-2.0.0.test.mjs",
      "apps/pfotentechnik/test/seo-research-engine.test.mjs"
    ],
    { cwd: ROOT, stdio: "inherit" }
  );

  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  execFileSync(
    npm,
    ["--workspace", "apps/pfotentechnik", "run", "research:check"],
    { cwd: ROOT, stdio: "inherit" }
  );
}

console.log(`[${NAME}] Fertig.`);

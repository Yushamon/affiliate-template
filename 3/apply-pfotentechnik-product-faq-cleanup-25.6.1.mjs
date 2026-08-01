#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-product-faq-cleanup-25.6.1";

function findRoot(start) {
  let dir = path.resolve(start);
  for (let index = 0; index < 12; index += 1) {
    if (fs.existsSync(path.join(dir, "apps", "pfotentechnik", "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}

const ROOT = findRoot(process.cwd());
const APP = path.join(ROOT, "apps", "pfotentechnik");
const testPath = path.join(APP, "test", "product-faq-cleanup-25.6.0.test.mjs");

if (!fs.existsSync(testPath)) {
  throw new Error("Testdatei nicht gefunden: " + path.relative(ROOT, testPath));
}

let source = fs.readFileSync(testPath, "utf8");

source = source.replace(
  /function faqCount\(source\) \{[\s\S]*?\n\}/,
  `function faqCount(source) {
  const lines = source.split("\\n");
  const start = lines.findIndex((line) => line === "faq:");
  if (start < 0) return 0;

  let count = 0;

  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];

    if (/^[^\\s][A-Za-z0-9_-]*:/.test(line)) break;
    if (/^\\s{2}-\\s+question:/.test(line)) count += 1;
  }

  return count;
}`
);

if (!source.includes('const start = lines.findIndex((line) => line === "faq:");')) {
  throw new Error("faqCount konnte nicht robust ersetzt werden.");
}

fs.writeFileSync(testPath, source);
console.log("[" + NAME + "] Geändert: " + path.relative(ROOT, testPath));

const oldInstaller = path.join(
  ROOT,
  "3",
  "apply-pfotentechnik-product-faq-cleanup-25.6.0.mjs"
);

if (fs.existsSync(oldInstaller)) {
  let installerSource = fs.readFileSync(oldInstaller, "utf8");

  installerSource = installerSource.replace(
    /function faqCount\(source\) \{[\s\S]*?\n\}/,
    `function faqCount(source) {
  const lines = source.split("\\\\n");
  const start = lines.findIndex((line) => line === "faq:");
  if (start < 0) return 0;

  let count = 0;

  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];

    if (/^[^\\\\s][A-Za-z0-9_-]*:/.test(line)) break;
    if (/^\\\\s{2}-\\\\s+question:/.test(line)) count += 1;
  }

  return count;
}`
  );

  fs.writeFileSync(oldInstaller, installerSource);
  console.log("[" + NAME + "] Alter Installer korrigiert: " + path.relative(ROOT, oldInstaller));
}

execFileSync(process.execPath, ["--test", testPath], {
  cwd: ROOT,
  stdio: "inherit"
});

execFileSync(
  "npm",
  ["--workspace", "apps/pfotentechnik", "run", "audit:product-standard-3"],
  {
    cwd: ROOT,
    stdio: "inherit"
  }
);

execFileSync(
  "npm",
  ["--workspace", "apps/pfotentechnik", "run", "product-standard-3:release:no-build"],
  {
    cwd: ROOT,
    stdio: "inherit"
  }
);

console.log("[" + NAME + "] Fertig.");

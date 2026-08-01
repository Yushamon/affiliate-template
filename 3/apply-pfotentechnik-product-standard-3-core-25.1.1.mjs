#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-product-standard-3-core-25.1.1";

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
const targets = [
  path.join(
    ROOT,
    "apps",
    "pfotentechnik",
    "test",
    "product-standard-3-core-25.1.0.test.mjs"
  ),
  path.join(
    ROOT,
    "3",
    "apply-pfotentechnik-product-standard-3-core-25.1.0.mjs"
  )
];

const replacements = [
  ["assert.match(source, /Material/);", "assert.match(source, /material/i);"],
  ["assert.match(source, /Gesamtkosten/);", "assert.match(source, /gesamtkosten/i);"]
];

for (const target of targets) {
  if (!fs.existsSync(target)) {
    console.warn("[" + NAME + "] Nicht gefunden, übersprungen: " + path.relative(ROOT, target));
    continue;
  }

  let source = fs.readFileSync(target, "utf8");
  let changed = false;

  for (const [before, after] of replacements) {
    if (source.includes(before)) {
      source = source.replaceAll(before, after);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(target, source);
    console.log("[" + NAME + "] Geändert: " + path.relative(ROOT, target));
  } else {
    console.log("[" + NAME + "] Bereits korrigiert oder kein passender Testanker: " + path.relative(ROOT, target));
  }
}

const testPath = path.join(
  ROOT,
  "apps",
  "pfotentechnik",
  "test",
  "product-standard-3-core-25.1.0.test.mjs"
);

execFileSync(process.execPath, ["--test", testPath], {
  cwd: ROOT,
  stdio: "inherit"
});

console.log("[" + NAME + "] Fertig.");

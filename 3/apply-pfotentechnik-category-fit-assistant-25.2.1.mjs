#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-category-fit-assistant-25.2.1";

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
    "category-fit-assistant-25.2.0.test.mjs"
  ),
  path.join(
    ROOT,
    "3",
    "apply-pfotentechnik-category-fit-assistant-25.2.0.mjs"
  )
];

const before = "assert.match(tracker, /Tiergröße|Tiergroesse/);";
const after = 'assert.match(tracker, /key:\\s*"petSize"/);';

for (const target of targets) {
  if (!fs.existsSync(target)) {
    console.warn("[" + NAME + "] Nicht gefunden, übersprungen: " + path.relative(ROOT, target));
    continue;
  }

  const source = fs.readFileSync(target, "utf8");

  if (source.includes(before)) {
    fs.writeFileSync(target, source.replaceAll(before, after));
    console.log("[" + NAME + "] Geändert: " + path.relative(ROOT, target));
  } else if (source.includes(after)) {
    console.log("[" + NAME + "] Bereits korrigiert: " + path.relative(ROOT, target));
  } else {
    throw new Error(
      "Erwarteter Testanker nicht gefunden in " + path.relative(ROOT, target)
    );
  }
}

const testPath = path.join(
  ROOT,
  "apps",
  "pfotentechnik",
  "test",
  "category-fit-assistant-25.2.0.test.mjs"
);

execFileSync(process.execPath, ["--test", testPath], {
  cwd: ROOT,
  stdio: "inherit"
});

console.log("[" + NAME + "] Fertig.");

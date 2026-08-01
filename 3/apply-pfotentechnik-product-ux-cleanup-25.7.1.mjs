#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-product-ux-cleanup-25.7.1";

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
const testPath = path.join(APP, "test", "product-ux-cleanup-25.7.0.test.mjs");

if (!fs.existsSync(testPath)) {
  throw new Error("Testdatei nicht gefunden: " + path.relative(ROOT, testPath));
}

let source = fs.readFileSync(testPath, "utf8");

source = source.replace(
  `  assert.match(source, /sourceContext\\.topics/);
  assert.match(source, /candidateContext\\.topics/);`,
  `  assert.match(source, /source\\.topics\\.size/);
  assert.match(source, /candidate\\.topics\\.size/);
  assert.match(source, /hasCompatibleRecommendationTopic\\(sourceContext, candidateContext\\)/);
  assert.match(source, /Number\\.NEGATIVE_INFINITY/);`
);

if (!source.includes("hasCompatibleRecommendationTopic\\(sourceContext, candidateContext\\)")) {
  throw new Error("Test konnte nicht auf die tatsächliche Themenkompatibilitätslogik umgestellt werden.");
}

fs.writeFileSync(testPath, source);
console.log("[" + NAME + "] Geändert: " + path.relative(ROOT, testPath));

const oldInstaller = path.join(
  ROOT,
  "3",
  "apply-pfotentechnik-product-ux-cleanup-25.7.0.mjs"
);

if (fs.existsSync(oldInstaller)) {
  let installerSource = fs.readFileSync(oldInstaller, "utf8");

  installerSource = installerSource.replace(
    `  assert.match(source, /sourceContext\\\\.topics/);
  assert.match(source, /candidateContext\\\\.topics/);`,
    `  assert.match(source, /source\\\\.topics\\\\.size/);
  assert.match(source, /candidate\\\\.topics\\\\.size/);
  assert.match(source, /hasCompatibleRecommendationTopic\\\\(sourceContext, candidateContext\\\\)/);
  assert.match(source, /Number\\\\.NEGATIVE_INFINITY/);`
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
  ["--workspace", "apps/pfotentechnik", "run", "test:product-experience-2"],
  {
    cwd: ROOT,
    stdio: "inherit"
  }
);

execFileSync(
  "npm",
  ["--workspace", "apps/pfotentechnik", "run", "test:decision-journeys"],
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
console.log("[" + NAME + "] Danach:");
console.log("npm --workspace apps/pfotentechnik run build");

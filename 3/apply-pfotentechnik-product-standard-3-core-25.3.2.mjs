#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-product-standard-3-core-25.3.2";

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

const testPath = path.join(
  ROOT,
  "apps",
  "pfotentechnik",
  "test",
  "product-standard-3-core-25.1.0.test.mjs"
);

if (!fs.existsSync(testPath)) {
  throw new Error("Testdatei nicht gefunden: " + path.relative(ROOT, testPath));
}

let testSource = fs.readFileSync(testPath, "utf8");

testSource = testSource.replaceAll(
  'const fit = source.indexOf("<ProductDecisionAssistant");',
  'const fit = source.indexOf("<ProductCategoryFitAssistant");'
);

testSource = testSource.replaceAll(
  '"ProductDecisionAssistant",',
  '"ProductCategoryFitAssistant",'
);

if (!testSource.includes('const fit = source.indexOf("<ProductCategoryFitAssistant");')) {
  throw new Error("Aktueller Category-Fit-Testanker fehlt.");
}

fs.writeFileSync(testPath, testSource);
console.log("[" + NAME + "] Testanker geprüft: " + path.relative(ROOT, testPath));

const legacyInstaller = path.join(
  ROOT,
  "3",
  "apply-pfotentechnik-product-standard-3-core-25.1.0.mjs"
);

if (fs.existsSync(legacyInstaller)) {
  let legacySource = fs.readFileSync(legacyInstaller, "utf8");
  const before = legacySource;

  legacySource = legacySource.replaceAll(
    'const fit = source.indexOf("<ProductDecisionAssistant");',
    'const fit = source.indexOf("<ProductCategoryFitAssistant");'
  );

  legacySource = legacySource.replaceAll(
    '"ProductDecisionAssistant",',
    '"ProductCategoryFitAssistant",'
  );

  if (legacySource !== before) {
    fs.writeFileSync(legacyInstaller, legacySource);
    console.log("[" + NAME + "] Alter Installer aktualisiert: " + path.relative(ROOT, legacyInstaller));
  } else {
    console.log("[" + NAME + "] Alter Installer enthält keinen veralteten Anker, übersprungen.");
  }
}

execFileSync(process.execPath, ["--test", testPath], {
  cwd: ROOT,
  stdio: "inherit"
});

execFileSync(
  "npm",
  ["--workspace", "apps/pfotentechnik", "run", "test:product-standard-3"],
  {
    cwd: ROOT,
    stdio: "inherit"
  }
);

console.log("[" + NAME + "] Fertig.");

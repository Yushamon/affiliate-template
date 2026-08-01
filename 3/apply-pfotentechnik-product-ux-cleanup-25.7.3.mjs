#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-product-ux-cleanup-25.7.3";
const OLD_HEADING = "Was die technischen Daten im Alltag bedeuten";
const NEW_HEADING = "Was die Daten wirklich bedeuten";

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

function updateTextFile(target, required = true) {
  if (!fs.existsSync(target)) {
    if (required) throw new Error("Datei nicht gefunden: " + target);
    return;
  }

  const before = fs.readFileSync(target, "utf8");
  let after = before.replaceAll(OLD_HEADING, NEW_HEADING);

  if (after === before && before.includes(NEW_HEADING)) {
    console.log("[" + NAME + "] Bereits aktuell: " + path.relative(ROOT, target));
    return;
  }

  if (after === before) {
    if (required) {
      throw new Error(
        "Weder alte noch neue Überschrift gefunden in " + path.relative(ROOT, target)
      );
    }
    console.log("[" + NAME + "] Kein Überschriftentest vorhanden, übersprungen: " + path.relative(ROOT, target));
    return;
  }

  fs.writeFileSync(target, after);
  console.log("[" + NAME + "] Geändert: " + path.relative(ROOT, target));
}

const ROOT = findRoot(process.cwd());
const APP = path.join(ROOT, "apps", "pfotentechnik");

const testPath = path.join(
  APP,
  "test",
  "product-standard-3-core-25.1.0.test.mjs"
);

updateTextFile(testPath, true);

const legacyInstallers = [
  "apply-pfotentechnik-product-standard-3-core-25.1.0.mjs",
  "apply-pfotentechnik-product-ux-cleanup-25.7.2.mjs"
];

for (const file of legacyInstallers) {
  updateTextFile(path.join(ROOT, "3", file), false);
}

const updatedTest = fs.readFileSync(testPath, "utf8");
if (!updatedTest.includes(NEW_HEADING)) {
  throw new Error("Neue Überschrift ist nach der Aktualisierung nicht im Test vorhanden.");
}
if (updatedTest.includes(OLD_HEADING)) {
  throw new Error("Alte Überschrift ist weiterhin im Test vorhanden.");
}

execFileSync(
  "npm",
  ["--workspace", "apps/pfotentechnik", "run", "test:product-standard-3"],
  { cwd: ROOT, stdio: "inherit" }
);

execFileSync(
  "npm",
  ["--workspace", "apps/pfotentechnik", "run", "test:product-ux-cleanup"],
  { cwd: ROOT, stdio: "inherit" }
);

execFileSync(
  "npm",
  ["--workspace", "apps/pfotentechnik", "run", "test:decision-journeys"],
  { cwd: ROOT, stdio: "inherit" }
);

execFileSync(
  "npm",
  ["--workspace", "apps/pfotentechnik", "run", "product-standard-3:release:no-build"],
  { cwd: ROOT, stdio: "inherit" }
);

console.log("[" + NAME + "] Fertig.");
console.log("[" + NAME + "] Danach:");
console.log("npm --workspace apps/pfotentechnik run build");

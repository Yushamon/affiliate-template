import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, "..");
const dataAudit = fs.readFileSync(path.join(app, "scripts", "comparison-platform", "data-audit.mjs"), "utf8");
const releaseClosure = fs.readFileSync(path.join(app, "scripts", "comparison-platform", "release-closure.mjs"), "utf8");

test("Comparison-Audits blockieren keine legitimen Bestandserweiterungen", () => {
  for (const source of [dataAudit, releaseClosure]) {
    assert.match(source, /const MIN_EXPECTED_COMPARISONS = 26;/);
    assert.doesNotMatch(source, /const EXPECTED_COMPARISONS = 26;/);
    assert.doesNotMatch(source, /length\s*!==\s*EXPECTED_COMPARISONS/);
    assert.match(source, /length\s*<\s*MIN_EXPECTED_COMPARISONS/);
  }
});

test("Regression-Guard gegen versehentliche Vergleichsverluste bleibt erhalten", () => {
  assert.match(dataAudit, /Mindestbestand unterschritten/);
  assert.match(releaseClosure, /Mindestbestand unterschritten/);
});

test("Reports benennen die Semantik korrekt", () => {
  assert.match(dataAudit, /minimumComparisons: MIN_EXPECTED_COMPARISONS/);
  assert.match(releaseClosure, /minimumComparisons: MIN_EXPECTED_COMPARISONS/);
  assert.doesNotMatch(dataAudit, /expectedComparisons: EXPECTED_COMPARISONS/);
  assert.doesNotMatch(releaseClosure, /expectedComparisons: EXPECTED_COMPARISONS/);
});

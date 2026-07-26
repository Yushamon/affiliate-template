import test from "node:test";
import assert from "node:assert/strict";
import { compareAuditReports } from "../lib/audit-regression.mjs";

const report = (errors = [], duplicates = []) => ({
  products: [{ file: "src/content/products/a.md", slug: "a", errors }],
  duplicateSlugs: duplicates
});

test("bestehende Auditfehler blockieren einen fachfremden Patch nicht", () => {
  const result = compareAuditReports(
    report(["Vergleichsfeld fehlt: material"]),
    report(["Vergleichsfeld fehlt: material"])
  );
  assert.equal(result.hasRegression, false);
  assert.equal(result.beforeIssues, 1);
  assert.equal(result.afterIssues, 1);
});

test("neue Produktfehler werden als Regression erkannt", () => {
  const result = compareAuditReports(
    report([]),
    report(["Pflichtfeld fehlt: rating"])
  );
  assert.equal(result.hasRegression, true);
  assert.equal(result.regressions[0].added, 1);
});

test("neue doppelte Slugs werden als Regression erkannt", () => {
  const result = compareAuditReports(
    report(),
    report([], [{ slug: "a", files: ["a.md", "copy.md"] }])
  );
  assert.equal(result.hasRegression, true);
});

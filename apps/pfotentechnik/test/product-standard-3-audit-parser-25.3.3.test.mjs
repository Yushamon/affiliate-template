import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const APP = path.join(ROOT, "apps", "pfotentechnik");
const AUDIT = path.join(APP, "scripts", "product-standard-3", "audit.mjs");
const REPORT = path.join(APP, "reports", "product-standard-3", "product-standard-3-latest.json");

test("Audit verwendet spezialisierte Zähler für Specs und Evidence", () => {
  const source = fs.readFileSync(AUDIT, "utf8");
  assert.match(source, /countObjectListItems\(fm, "specs"\)/);
  assert.match(source, /countNestedScalarListItems\(fm, "editorial", "evidence"\)/);
});

test("Audit läuft erfolgreich", () => {
  const result = spawnSync(process.execPath, [AUDIT], {
    cwd: ROOT,
    encoding: "utf8"
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test("Pauschale SPECS_THIN- und EVIDENCE_THIN-Findings sind verschwunden", () => {
  const report = JSON.parse(fs.readFileSync(REPORT, "utf8"));
  const findings = report.products.flatMap((product) => product.findings);
  const specsThin = findings.filter((finding) => finding.code === "SPECS_THIN").length;
  const evidenceThin = findings.filter((finding) => finding.code === "EVIDENCE_THIN").length;

  assert.ok(specsThin < report.summary.products, `SPECS_THIN: ${specsThin}/${report.summary.products}`);
  assert.ok(evidenceThin < report.summary.products, `EVIDENCE_THIN: ${evidenceThin}/${report.summary.products}`);
});

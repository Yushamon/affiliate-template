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

test("Audit unterstützt explizite und bestehende Evidenzfelder", () => {
  const source = fs.readFileSync(AUDIT, "utf8");
  assert.match(source, /countEvidenceSignals/);
  assert.match(source, /testStatus/);
  assert.match(source, /assessmentType/);
  assert.match(source, /methodology/);
  assert.match(source, /const evidenceCount = countEvidenceSignals\(fm\)/);
});

test("Audit läuft erfolgreich", () => {
  const result = spawnSync(process.execPath, [AUDIT], {
    cwd: ROOT,
    encoding: "utf8"
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test("Evidenz wird nicht mehr pauschal als dünn gemeldet", () => {
  const report = JSON.parse(fs.readFileSync(REPORT, "utf8"));
  const evidenceThin = report.products
    .flatMap((product) => product.findings)
    .filter((finding) => finding.code === "EVIDENCE_THIN").length;

  assert.ok(
    evidenceThin < report.summary.products / 2,
    `EVIDENCE_THIN weiterhin bei ${evidenceThin} von ${report.summary.products}`
  );
});

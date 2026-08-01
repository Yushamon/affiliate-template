import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const APP = path.join(ROOT, "apps", "pfotentechnik");
const AUDIT = path.join(APP, "scripts", "product-standard-3", "audit.mjs");

test("Audit-Parser zählt verschachtelte Listen anhand ihrer Einrückung", () => {
  const source = fs.readFileSync(AUDIT, "utf8");
  assert.match(source, /const keyIndent = lines\[keyIndex\]/);
  assert.match(source, /indent === keyIndent \+ 2/);
});

test("Evidence und Community behalten ihre Einrückung", () => {
  const source = fs.readFileSync(AUDIT, "utf8");
  assert.match(source, /countListItems\(evidenceBlock, "evidence"\)/);
  assert.match(source, /countListItems\(communityBlock, "positives"\)/);
  assert.match(source, /countListItems\(communityBlock, "negatives"\)/);
});

test("Audit läuft und meldet nicht mehr alle Produkte pauschal als SPECS_THIN", () => {
  const result = spawnSync(process.execPath, [AUDIT], {
    cwd: ROOT,
    encoding: "utf8"
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);

  const report = JSON.parse(fs.readFileSync(
    path.join(APP, "reports", "product-standard-3", "product-standard-3-latest.json"),
    "utf8"
  ));

  const count = report.products
    .flatMap((product) => product.findings)
    .filter((finding) => finding.code === "SPECS_THIN").length;

  assert.ok(count < report.summary.products, `SPECS_THIN weiterhin bei ${count} von ${report.summary.products}`);
});

test("Audit meldet Evidence nicht mehr pauschal für alle Produkte als dünn", () => {
  const report = JSON.parse(fs.readFileSync(
    path.join(APP, "reports", "product-standard-3", "product-standard-3-latest.json"),
    "utf8"
  ));

  const count = report.products
    .flatMap((product) => product.findings)
    .filter((finding) => finding.code === "EVIDENCE_THIN").length;

  assert.ok(count < report.summary.products, `EVIDENCE_THIN weiterhin bei ${count} von ${report.summary.products}`);
});

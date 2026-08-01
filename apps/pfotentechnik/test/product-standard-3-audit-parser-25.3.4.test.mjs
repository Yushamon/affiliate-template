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

test("nestedBlock unterstützt eingerückte Kindschlüssel", () => {
  const source = fs.readFileSync(AUDIT, "utf8");
  assert.match(source, /new RegExp\(\`\^\\\\s\*\$\{key\}:\\\\s\*\$\`\)/);
  assert.match(source, /keyIndent \+ 2/);
});

test("Audit läuft erfolgreich", () => {
  const result = spawnSync(process.execPath, [AUDIT], {
    cwd: ROOT,
    encoding: "utf8"
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test("Specs und Evidence werden nicht mehr pauschal als dünn gemeldet", () => {
  const report = JSON.parse(fs.readFileSync(REPORT, "utf8"));
  const findings = report.products.flatMap((product) => product.findings);
  const specsThin = findings.filter((finding) => finding.code === "SPECS_THIN").length;
  const evidenceThin = findings.filter((finding) => finding.code === "EVIDENCE_THIN").length;

  assert.ok(specsThin < report.summary.products, `SPECS_THIN: ${specsThin}/${report.summary.products}`);
  assert.ok(evidenceThin < report.summary.products, `EVIDENCE_THIN: ${evidenceThin}/${report.summary.products}`);
});

test("Audit erzeugt keine neue pauschale Warnung für alle Produkte", () => {
  const report = JSON.parse(fs.readFileSync(REPORT, "utf8"));
  const counts = new Map();

  for (const finding of report.products.flatMap((product) => product.findings)) {
    if (finding.severity !== "warning") continue;
    counts.set(finding.code, (counts.get(finding.code) ?? 0) + 1);
  }

  for (const [code, count] of counts) {
    assert.ok(count < report.summary.products, `${code}: ${count}/${report.summary.products}`);
  }
});

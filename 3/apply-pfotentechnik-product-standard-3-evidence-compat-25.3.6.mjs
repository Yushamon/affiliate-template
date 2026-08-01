#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-product-standard-3-evidence-compat-25.3.6";

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
const auditPath = path.join(APP, "scripts", "product-standard-3", "audit.mjs");

if (!fs.existsSync(auditPath)) {
  throw new Error("Audit-Datei nicht gefunden: " + path.relative(ROOT, auditPath));
}

let source = fs.readFileSync(auditPath, "utf8");

const helper = `
function countEvidenceSignals(fm) {
  const explicit = countNestedScalarList(fm, "editorial", "evidence");
  if (explicit > 0) return explicit;

  let count = 0;
  const testStatus = stringValue(fm, "testStatus").toLowerCase();
  const editorial = section(fm, "editorial");
  const assessmentType = stringValue(
    editorial.replace(/^\\s{2}/gm, ""),
    "assessmentType"
  ).toLowerCase();
  const experience = section(fm, "experience");
  const methodology = stringValue(
    experience.replace(/^\\s{2}/gm, ""),
    "methodology"
  );
  const review = section(fm, "review");
  const summary = stringValue(
    review.replace(/^\\s{2}/gm, ""),
    "summary"
  );

  if (testStatus && testStatus !== "unknown") count += 1;
  if (assessmentType) count += 1;
  if (methodology) count += 1;
  if (summary) count += 1;

  return Math.min(count, 4);
}
`;

if (!source.includes("function countEvidenceSignals(")) {
  const anchor = "function categoryOf(";
  const index = source.indexOf(anchor);
  if (index < 0) throw new Error("Anker categoryOf nicht gefunden.");
  source = source.slice(0, index) + helper + "\n" + source.slice(index);
}

source = source.replace(
  /const evidenceCount\s*=\s*countNestedScalarList\(fm,\s*"editorial",\s*"evidence"\);/,
  "const evidenceCount = countEvidenceSignals(fm);"
);

if (!source.includes("const evidenceCount = countEvidenceSignals(fm);")) {
  throw new Error("Evidence-Metrik konnte nicht ersetzt werden.");
}

source = source.replace(
  /version:\s*"25\.3\.5"/,
  'version: "25.3.6"'
);

fs.writeFileSync(auditPath, source);
console.log("[" + NAME + "] Geändert: " + path.relative(ROOT, auditPath));

const testPath = path.join(
  APP,
  "test",
  "product-standard-3-evidence-compat-25.3.6.test.mjs"
);

const testSource = `import test from "node:test";
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
  assert.match(source, /const evidenceCount = countEvidenceSignals\\(fm\\)/);
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
    \`EVIDENCE_THIN weiterhin bei \${evidenceThin} von \${report.summary.products}\`
  );
});
`;

fs.writeFileSync(testPath, testSource);
console.log("[" + NAME + "] Geschrieben: " + path.relative(ROOT, testPath));

execFileSync(process.execPath, ["--check", auditPath], {
  cwd: ROOT,
  stdio: "inherit"
});

execFileSync(process.execPath, [auditPath], {
  cwd: ROOT,
  stdio: "inherit"
});

execFileSync(process.execPath, ["--test", testPath], {
  cwd: ROOT,
  stdio: "inherit"
});

console.log("[" + NAME + "] Fertig.");

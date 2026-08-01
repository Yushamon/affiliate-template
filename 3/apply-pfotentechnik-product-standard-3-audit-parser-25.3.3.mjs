#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-product-standard-3-audit-parser-25.3.3";

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
function countObjectListItems(block, key) {
  const section = nestedBlock(block, key);
  if (!section) return 0;
  return (section.match(/^\\s*-\\s+[a-zA-Z0-9_-]+:\\s*/gm) ?? []).length;
}

function countNestedScalarListItems(block, parentKey, childKey) {
  const parent = nestedBlock(block, parentKey);
  if (!parent) return 0;
  const child = nestedBlock(parent, childKey);
  if (!child) return 0;
  return (child.match(/^\\s*-\\s+.+$/gm) ?? []).length;
}
`;

if (!source.includes("function countObjectListItems(")) {
  const anchor = "function severityWeight(";
  const index = source.indexOf(anchor);
  if (index < 0) throw new Error("Helper-Anker severityWeight nicht gefunden.");
  source = source.slice(0, index) + helper + "\n" + source.slice(index);
}

source = source.replace(
  /const specs\s*=\s*countListItems\(fm,\s*"specs"\);/,
  'const specs = countObjectListItems(fm, "specs");'
);

source = source.replace(
  /const evidenceBlock\s*=\s*nestedBlock\(fm,\s*"editorial"\);\s*\n\s*const evidenceCount\s*=\s*countListItems\([^;]+;/,
  'const evidenceBlock = nestedBlock(fm, "editorial");\n  const evidenceCount = countNestedScalarListItems(fm, "editorial", "evidence");'
);

if (!source.includes('const specs = countObjectListItems(fm, "specs");')) {
  throw new Error("Specs-Metrik konnte nicht ersetzt werden.");
}

if (!source.includes('const evidenceCount = countNestedScalarListItems(fm, "editorial", "evidence");')) {
  throw new Error("Evidence-Metrik konnte nicht ersetzt werden.");
}

fs.writeFileSync(auditPath, source);
console.log("[" + NAME + "] Geändert: " + path.relative(ROOT, auditPath));

const testPath = path.join(
  APP,
  "test",
  "product-standard-3-audit-parser-25.3.3.test.mjs"
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

test("Audit verwendet spezialisierte Zähler für Specs und Evidence", () => {
  const source = fs.readFileSync(AUDIT, "utf8");
  assert.match(source, /countObjectListItems\\(fm, "specs"\\)/);
  assert.match(source, /countNestedScalarListItems\\(fm, "editorial", "evidence"\\)/);
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

  assert.ok(specsThin < report.summary.products, \`SPECS_THIN: \${specsThin}/\${report.summary.products}\`);
  assert.ok(evidenceThin < report.summary.products, \`EVIDENCE_THIN: \${evidenceThin}/\${report.summary.products}\`);
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

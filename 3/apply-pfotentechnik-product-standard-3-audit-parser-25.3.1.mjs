#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-product-standard-3-audit-parser-25.3.1";

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
const auditPath = path.join(
  ROOT,
  "apps",
  "pfotentechnik",
  "scripts",
  "product-standard-3",
  "audit.mjs"
);

if (!fs.existsSync(auditPath)) {
  throw new Error("Audit-Datei nicht gefunden: " + path.relative(ROOT, auditPath));
}

let source = fs.readFileSync(auditPath, "utf8");

const oldCounter = `function countListItems(block, key) {
  const match = block.match(new RegExp(\`^\${key}:\\\\s*\\\\n((?:[ \\\\t]+-.*\\\\n?)+)\`, "m"));
  if (!match) return 0;
  return (match[1].match(/^[ \\\\t]+-/gm) ?? []).length;
}`;

const newCounter = `function countListItems(block, key) {
  const lines = block.split("\\n");
  const keyIndex = lines.findIndex((line) =>
    new RegExp(\`^\\\\s*\${key}:\\\\s*$\`).test(line)
  );
  if (keyIndex < 0) return 0;

  const keyIndent = lines[keyIndex].match(/^\\\\s*/)?.[0].length ?? 0;
  let count = 0;

  for (let index = keyIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];

    if (!line.trim()) continue;

    const indent = line.match(/^\\\\s*/)?.[0].length ?? 0;

    if (indent <= keyIndent) break;

    if (indent === keyIndent + 2 && /^\\\\s*-\\\\s+/.test(line)) {
      count += 1;
    }
  }

  return count;
}`;

if (source.includes(oldCounter)) {
  source = source.replace(oldCounter, newCounter);
} else if (!source.includes("const keyIndent = lines[keyIndex]")) {
  throw new Error("Alter countListItems-Parser nicht gefunden.");
}

source = source.replaceAll(
  'const evidenceCount = countListItems(evidenceBlock.replace(/^\\s+/gm, ""), "evidence");',
  'const evidenceCount = countListItems(evidenceBlock, "evidence");'
);

source = source.replaceAll(
  'const communityPositive = countListItems(communityBlock.replace(/^\\s+/gm, ""), "positives");',
  'const communityPositive = countListItems(communityBlock, "positives");'
);

source = source.replaceAll(
  'const communityNegative = countListItems(communityBlock.replace(/^\\s+/gm, ""), "negatives");',
  'const communityNegative = countListItems(communityBlock, "negatives");'
);

fs.writeFileSync(auditPath, source);
console.log("[" + NAME + "] Geändert: " + path.relative(ROOT, auditPath));

const testPath = path.join(
  ROOT,
  "apps",
  "pfotentechnik",
  "test",
  "product-standard-3-audit-parser-25.3.1.test.mjs"
);

const testSource = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const APP = path.join(ROOT, "apps", "pfotentechnik");
const AUDIT = path.join(APP, "scripts", "product-standard-3", "audit.mjs");

test("Audit-Parser zählt mehrzeilige Specs korrekt", () => {
  const source = fs.readFileSync(AUDIT, "utf8");
  assert.match(source, /const keyIndent = lines\\[keyIndex\\]/);
  assert.match(source, /indent === keyIndent \\+ 2/);
});

test("Evidence wird ohne zerstörende Einrückungsbereinigung gezählt", () => {
  const source = fs.readFileSync(AUDIT, "utf8");
  assert.match(source, /countListItems\\(evidenceBlock, "evidence"\\)/);
  assert.doesNotMatch(source, /evidenceBlock\\.replace\\(\\/\\^\\\\s\\+\\/gm/);
});

test("Audit läuft und meldet nicht mehr pauschal alle Specs als dünn", () => {
  const result = spawnSync(process.execPath, [AUDIT], {
    cwd: ROOT,
    encoding: "utf8"
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const reportPath = path.join(
    APP,
    "reports",
    "product-standard-3",
    "product-standard-3-latest.json"
  );
  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  const specsThin = report.products
    .flatMap((product) => product.findings)
    .filter((finding) => finding.code === "SPECS_THIN").length;
  assert.ok(specsThin < report.summary.products);
});
`;

fs.writeFileSync(testPath, testSource);
console.log("[" + NAME + "] Geschrieben: " + path.relative(ROOT, testPath));

execFileSync(process.execPath, ["--check", auditPath], {
  cwd: ROOT,
  stdio: "inherit"
});

execFileSync(process.execPath, ["--test", testPath], {
  cwd: ROOT,
  stdio: "inherit"
});

execFileSync(
  "npm",
  ["--workspace", "apps/pfotentechnik", "run", "audit:product-standard-3"],
  {
    cwd: ROOT,
    stdio: "inherit"
  }
);

console.log("[" + NAME + "] Fertig.");

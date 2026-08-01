#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-product-standard-3-audit-parser-25.3.2";

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

function replaceFunction(source, functionName, replacement) {
  const marker = `function ${functionName}(`;
  const start = source.indexOf(marker);
  if (start < 0) {
    throw new Error(`Funktion ${functionName} nicht gefunden.`);
  }

  const braceStart = source.indexOf("{", start);
  if (braceStart < 0) {
    throw new Error(`Öffnende Klammer für ${functionName} nicht gefunden.`);
  }

  let depth = 0;
  let inString = null;
  let escaped = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let index = braceStart; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (inLineComment) {
      if (char === "\n") inLineComment = false;
      continue;
    }

    if (inBlockComment) {
      if (char === "*" && next === "/") {
        inBlockComment = false;
        index += 1;
      }
      continue;
    }

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === inString) inString = null;
      continue;
    }

    if (char === "/" && next === "/") {
      inLineComment = true;
      index += 1;
      continue;
    }

    if (char === "/" && next === "*") {
      inBlockComment = true;
      index += 1;
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      inString = char;
      continue;
    }

    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(0, start) + replacement + source.slice(index + 1);
      }
    }
  }

  throw new Error(`Schließende Klammer für ${functionName} nicht gefunden.`);
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

const replacement = `function countListItems(block, key) {
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

source = replaceFunction(source, "countListItems", replacement);

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

if (!source.includes('countListItems(evidenceBlock, "evidence")')) {
  source = source.replace(
    /const evidenceCount\s*=\s*countListItems\([^;]+;/,
    'const evidenceCount = countListItems(evidenceBlock, "evidence");'
  );
}

if (!source.includes('countListItems(communityBlock, "positives")')) {
  source = source.replace(
    /const communityPositive\s*=\s*countListItems\([^;]+;/,
    'const communityPositive = countListItems(communityBlock, "positives");'
  );
}

if (!source.includes('countListItems(communityBlock, "negatives")')) {
  source = source.replace(
    /const communityNegative\s*=\s*countListItems\([^;]+;/,
    'const communityNegative = countListItems(communityBlock, "negatives");'
  );
}

fs.writeFileSync(auditPath, source);
console.log("[" + NAME + "] Geändert: " + path.relative(ROOT, auditPath));

const testPath = path.join(
  ROOT,
  "apps",
  "pfotentechnik",
  "test",
  "product-standard-3-audit-parser-25.3.2.test.mjs"
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

test("Audit-Parser zählt verschachtelte Listen anhand ihrer Einrückung", () => {
  const source = fs.readFileSync(AUDIT, "utf8");
  assert.match(source, /const keyIndent = lines\\[keyIndex\\]/);
  assert.match(source, /indent === keyIndent \\+ 2/);
});

test("Evidence und Community behalten ihre Einrückung", () => {
  const source = fs.readFileSync(AUDIT, "utf8");
  assert.match(source, /countListItems\\(evidenceBlock, "evidence"\\)/);
  assert.match(source, /countListItems\\(communityBlock, "positives"\\)/);
  assert.match(source, /countListItems\\(communityBlock, "negatives"\\)/);
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

  assert.ok(count < report.summary.products, \`SPECS_THIN weiterhin bei \${count} von \${report.summary.products}\`);
});

test("Audit meldet Evidence nicht mehr pauschal für alle Produkte als dünn", () => {
  const report = JSON.parse(fs.readFileSync(
    path.join(APP, "reports", "product-standard-3", "product-standard-3-latest.json"),
    "utf8"
  ));

  const count = report.products
    .flatMap((product) => product.findings)
    .filter((finding) => finding.code === "EVIDENCE_THIN").length;

  assert.ok(count < report.summary.products, \`EVIDENCE_THIN weiterhin bei \${count} von \${report.summary.products}\`);
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

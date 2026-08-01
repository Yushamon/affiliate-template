#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-product-standard-3-audit-parser-25.3.4";

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
  if (start < 0) throw new Error(`Funktion ${functionName} nicht gefunden.`);

  const braceStart = source.indexOf("{", start);
  if (braceStart < 0) throw new Error(`Öffnende Klammer für ${functionName} nicht gefunden.`);

  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = braceStart; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (lineComment) {
      if (char === "\n") lineComment = false;
      continue;
    }

    if (blockComment) {
      if (char === "*" && next === "/") {
        blockComment = false;
        index += 1;
      }
      continue;
    }

    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === quote) quote = null;
      continue;
    }

    if (char === "/" && next === "/") {
      lineComment = true;
      index += 1;
      continue;
    }

    if (char === "/" && next === "*") {
      blockComment = true;
      index += 1;
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      quote = char;
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
const APP = path.join(ROOT, "apps", "pfotentechnik");
const auditPath = path.join(APP, "scripts", "product-standard-3", "audit.mjs");

if (!fs.existsSync(auditPath)) {
  throw new Error("Audit-Datei nicht gefunden: " + path.relative(ROOT, auditPath));
}

let source = fs.readFileSync(auditPath, "utf8");

const nestedBlockReplacement = `function nestedBlock(block, key) {
  const lines = block.split("\\n");
  const pattern = new RegExp(\`^\\\\s*\${key}:\\\\s*$\`);
  const start = lines.findIndex((line) => pattern.test(line));
  if (start < 0) return "";

  const keyIndent = lines[start].match(/^\\\\s*/)?.[0].length ?? 0;
  const output = [];

  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];

    if (!line.trim()) {
      output.push("");
      continue;
    }

    const indent = line.match(/^\\\\s*/)?.[0].length ?? 0;
    if (indent <= keyIndent) break;

    const remove = Math.min(indent, keyIndent + 2);
    output.push(line.slice(remove));
  }

  return output.join("\\n");
}`;

source = replaceFunction(source, "nestedBlock", nestedBlockReplacement);

fs.writeFileSync(auditPath, source);
console.log("[" + NAME + "] Geändert: " + path.relative(ROOT, auditPath));

const testPath = path.join(
  APP,
  "test",
  "product-standard-3-audit-parser-25.3.4.test.mjs"
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

test("nestedBlock unterstützt eingerückte Kindschlüssel", () => {
  const source = fs.readFileSync(AUDIT, "utf8");
  assert.match(source, /new RegExp\\(\\\`\\^\\\\\\\\s\\*\\$\\{key\\}:\\\\\\\\s\\*\\$\\\`\\)/);
  assert.match(source, /keyIndent \\+ 2/);
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

  assert.ok(specsThin < report.summary.products, \`SPECS_THIN: \${specsThin}/\${report.summary.products}\`);
  assert.ok(evidenceThin < report.summary.products, \`EVIDENCE_THIN: \${evidenceThin}/\${report.summary.products}\`);
});

test("Audit erzeugt keine neue pauschale Warnung für alle Produkte", () => {
  const report = JSON.parse(fs.readFileSync(REPORT, "utf8"));
  const counts = new Map();

  for (const finding of report.products.flatMap((product) => product.findings)) {
    if (finding.severity !== "warning") continue;
    counts.set(finding.code, (counts.get(finding.code) ?? 0) + 1);
  }

  for (const [code, count] of counts) {
    assert.ok(count < report.summary.products, \`\${code}: \${count}/\${report.summary.products}\`);
  }
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

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../../..");
const productsDir = path.join(root, "apps", "pfotentechnik", "src", "content", "products");
const allowed = new Set(["hands-on", "lab-test", "editorial-review", "unknown"]);

function getFrontmatter(text) {
  if (!text.startsWith("---\n")) return "";
  const end = text.indexOf("\n---", 4);
  return end >= 0 ? text.slice(4, end) : "";
}

function professionalMethodologies(text) {
  const fm = getFrontmatter(text);
  const lines = fm.split("\n");
  const values = [];
  let inExternalEvidence = false;
  let inProfessionalReviews = false;

  for (const line of lines) {
    if (/^externalEvidence:\s*$/.test(line)) {
      inExternalEvidence = true;
      inProfessionalReviews = false;
      continue;
    }
    if (inExternalEvidence && /^[A-Za-z0-9_][A-Za-z0-9_-]*:\s*/.test(line)) {
      inExternalEvidence = false;
      inProfessionalReviews = false;
    }
    if (!inExternalEvidence) continue;

    if (/^  professionalReviews:\s*$/.test(line)) {
      inProfessionalReviews = true;
      continue;
    }
    if (inProfessionalReviews && /^  (userReviews|consensus|note|status|constrained|researchStatus):/.test(line)) {
      inProfessionalReviews = false;
    }
    if (!inProfessionalReviews) continue;

    const m = line.match(/^\s+methodology:\s*["']?([^"'#\n]+?)["']?\s*(?:#.*)?$/);
    if (m) values.push(m[1].trim());
  }
  return values;
}

test("alle External-Evidence-Methodologien entsprechen dem Produktschema", () => {
  const invalid = [];
  for (const filename of fs.readdirSync(productsDir).filter((f) => f.endsWith(".md"))) {
    const text = fs.readFileSync(path.join(productsDir, filename), "utf8");
    for (const value of professionalMethodologies(text)) {
      if (!allowed.has(value)) invalid.push({ filename, value });
    }
  }
  assert.deepEqual(invalid, []);
});

test("redaktionelle Ratings und Scores werden durch den Patch nicht entfernt", () => {
  const missing = [];
  for (const filename of fs.readdirSync(productsDir).filter((f) => f.endsWith(".md"))) {
    const text = fs.readFileSync(path.join(productsDir, filename), "utf8");
    if (!/^rating:\s*[0-9.]+\s*$/m.test(text)) missing.push(filename);
  }
  assert.deepEqual(missing, []);
});

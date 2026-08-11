import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../../..");
const productsDir = path.join(root, "apps", "pfotentechnik", "src", "content", "products");

test("externalEvidence userReviews haben keine null optionals", () => {
  const invalid = [];
  for (const filename of fs.readdirSync(productsDir).filter(f => f.endsWith(".md"))) {
    const text = fs.readFileSync(path.join(productsDir, filename), "utf8");
    const fm = text.startsWith("---\n") ? text.slice(4, text.indexOf("\n---", 4)) : "";
    const lines = fm.split("\n");
    let inExternal = false, inUsers = false;
    for (const line of lines) {
      if (/^externalEvidence:\s*$/.test(line)) { inExternal = true; inUsers = false; continue; }
      if (inExternal && /^[A-Za-z0-9_][A-Za-z0-9_-]*:\s*/.test(line)) { inExternal = false; inUsers = false; }
      if (!inExternal) continue;
      if (/^  userReviews:\s*$/.test(line)) { inUsers = true; continue; }
      if (/^  userReviews:\s*\[\s*\]\s*$/.test(line)) { inUsers = false; continue; }
      if (inUsers && /^  [A-Za-z0-9_][A-Za-z0-9_-]*:\s*/.test(line)) inUsers = false;
      if (inUsers && /^\s{6}(?:rating|reviewCount):\s*(?:null|~)\s*$/.test(line)) invalid.push(filename + ": " + line.trim());
    }
  }
  assert.deepEqual(invalid, []);
});

test("Furbo behält redaktionelle Ratings, lässt unbekannte externe Zahlen weg", () => {
  const text = fs.readFileSync(path.join(productsDir, "furbo-360-hundekamera.md"), "utf8");
  assert.match(text, /^rating:\s*3\.6\s*$/m);
  assert.match(text, /^ratings:\s*\{/m);
  const block = text.match(/externalEvidence:[\s\S]*?\n  consensus:/)?.[0] ?? "";
  assert.match(block, /Trustpilot · Furbo markenweit/);
  assert.doesNotMatch(block, /^\s{6}rating:\s*(?:null|~)\s*$/m);
  assert.doesNotMatch(block, /^\s{6}reviewCount:\s*(?:null|~)\s*$/m);
});

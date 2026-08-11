import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../../..");
const productsDir = path.join(root, "apps", "pfotentechnik", "src", "content", "products");

test("externalEvidence.consensus verwendet keinen Array- oder Null-Platzhalter", () => {
  const invalid = [];
  for (const filename of fs.readdirSync(productsDir).filter((f) => f.endsWith(".md"))) {
    const text = fs.readFileSync(path.join(productsDir, filename), "utf8");
    if (/^  consensus:\s*\[\s*\]\s*$/m.test(text)) invalid.push(filename + ": array");
    if (/^  consensus:\s*(?:null|~)\s*$/m.test(text)) invalid.push(filename + ": null");
    if (/^  consensus:\s*\{\s*\}\s*$/m.test(text)) invalid.push(filename + ": empty-object");
  }
  assert.deepEqual(invalid, []);
});

test("leerer Consensus besitzt kanonische strengths/weaknesses-Struktur", () => {
  const file = path.join(productsDir, "cat-mate-335-pet-fountain.md");
  const text = fs.readFileSync(file, "utf8");
  assert.match(text, /externalEvidence:[\s\S]*?\n  consensus:\n    strengths: \[\]\n    weaknesses: \[\]/);
});

test("PfotenTechnik-Ratings und Scores bleiben erhalten", () => {
  const targets = ["cat-mate-335-pet-fountain.md"];
  for (const filename of targets) {
    const text = fs.readFileSync(path.join(productsDir, filename), "utf8");
    assert.match(text, /^rating:\s*[0-9.]+\s*$/m);
    assert.match(text, /^score:\s*[0-9.]+\s*$/m);
    assert.match(text, /^ratings:\s*$/m);
  }
});

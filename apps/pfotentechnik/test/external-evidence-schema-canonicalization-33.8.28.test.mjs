import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../../..");
const productsDir = path.join(root, "apps", "pfotentechnik", "src", "content", "products");
const allowed = new Set(["hands-on", "lab-test", "editorial-review", "unknown"]);

function fm(text) {
  if (!text.startsWith("---\n")) return "";
  const end = text.indexOf("\n---", 4);
  return end < 0 ? "" : text.slice(4, end);
}

test("professionalReviews verwenden ausschließlich schema-konforme methodology-Werte", () => {
  const invalid = [];
  for (const filename of fs.readdirSync(productsDir).filter(f => f.endsWith(".md"))) {
    const lines = fm(fs.readFileSync(path.join(productsDir, filename), "utf8")).split("\n");
    let inExternal = false;
    let inProfessional = false;
    for (const line of lines) {
      if (/^externalEvidence:\s*$/.test(line)) { inExternal = true; inProfessional = false; continue; }
      if (inExternal && /^[A-Za-z0-9_][A-Za-z0-9_-]*:\s*/.test(line)) { inExternal = false; inProfessional = false; }
      if (!inExternal) continue;
      if (/^  professionalReviews:\s*$/.test(line)) { inProfessional = true; continue; }
      if (/^  professionalReviews:\s*\[\s*\]\s*$/.test(line)) { inProfessional = false; continue; }
      if (inProfessional && /^  [A-Za-z0-9_][A-Za-z0-9_-]*:\s*/.test(line)) inProfessional = false;
      if (!inProfessional) continue;
      const m = line.match(/^\s{6}methodology:\s*["']?([^"']+)["']?\s*$/);
      if (m && !allowed.has(m[1].trim())) invalid.push(filename + ": " + m[1].trim());
    }
  }
  assert.deepEqual(invalid, []);
});

test("externalEvidence.consensus verwendet keine leeren Array/null/Object-Platzhalter", () => {
  const invalid = [];
  for (const filename of fs.readdirSync(productsDir).filter(f => f.endsWith(".md"))) {
    const text = fm(fs.readFileSync(path.join(productsDir, filename), "utf8"));
    if (/^  consensus:\s*\[\s*\]\s*$/m.test(text)) invalid.push(filename + ": []");
    if (/^  consensus:\s*(?:null|~)\s*$/m.test(text)) invalid.push(filename + ": null");
    if (/^  consensus:\s*\{\s*\}\s*$/m.test(text)) invalid.push(filename + ": {}");
  }
  assert.deepEqual(invalid, []);
});

test("Aqara C1 ist schema-konform normalisiert", () => {
  const text = fs.readFileSync(path.join(productsDir, "aqara-smart-pet-feeder-c1.md"), "utf8");
  assert.doesNotMatch(text, /professional-magazine-review-summary/);
  assert.match(text, /methodology:\s*"editorial-review"/);
});

test("Cat Mate 335 besitzt kanonisches leeres consensus-Objekt", () => {
  const text = fs.readFileSync(path.join(productsDir, "cat-mate-335-pet-fountain.md"), "utf8");
  assert.match(text, /externalEvidence:[\s\S]*?\n  consensus:\n    strengths: \[\]\n    weaknesses: \[\]/);
});

test("redaktionelle Ratings und Scores bleiben erhalten", () => {
  for (const filename of ["aqara-smart-pet-feeder-c1.md", "cat-mate-335-pet-fountain.md"]) {
    const text = fs.readFileSync(path.join(productsDir, filename), "utf8");
    assert.match(text, /^rating:\s*[0-9.]+\s*$/m);
    assert.match(text, /^score:\s*[0-9.]+\s*$/m);
    assert.match(text, /^ratings:\s*$/m);
  }
});

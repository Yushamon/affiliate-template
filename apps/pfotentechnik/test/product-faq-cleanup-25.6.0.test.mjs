import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const PRODUCT_DIR = path.join(ROOT, "apps", "pfotentechnik", "src", "content", "products");
const TARGETS = [
  "petlibro-space-smart-feeder.md",
  "weenect-xs.md",
  "weenect-xt.md"
];

function faqCount(source) {
  const lines = source.split("\n");
  const start = lines.findIndex((line) => line === "faq:");
  if (start < 0) return 0;

  let count = 0;

  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];

    if (/^[^\s][A-Za-z0-9_-]*:/.test(line)) break;
    if (/^\s{2}-\s+question:/.test(line)) count += 1;
  }

  return count;
}

test("Alle drei Zielseiten haben höchstens zwölf FAQ", () => {
  for (const file of TARGETS) {
    const source = fs.readFileSync(path.join(PRODUCT_DIR, file), "utf8");
    assert.ok(faqCount(source) <= 12, file);
  }
});

test("FAQ-Blöcke bleiben vorhanden", () => {
  for (const file of TARGETS) {
    const source = fs.readFileSync(path.join(PRODUCT_DIR, file), "utf8");
    assert.match(source, /^faq:\s*$/m, file);
    assert.ok(faqCount(source) >= 8, file);
  }
});

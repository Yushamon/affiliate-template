import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const MODEL = path.join(
  ROOT,
  "apps",
  "pfotentechnik",
  "src",
  "domain",
  "productExperience",
  "model.ts"
);

test("toAlternative definiert decisionProfile vor der Rückgabe lokal", () => {
  const source = fs.readFileSync(MODEL, "utf8");
  const start = source.indexOf("const toAlternative =");
  const end = source.indexOf("\n};", start);
  assert.ok(start >= 0 && end > start);

  const block = source.slice(start, end + 3);
  assert.match(
    block,
    /const\s+decisionProfile\s*=\s*decisionProfileFor\(data,\s*price\);/
  );
  assert.match(block, /\bdecisionProfile,\s*\n/);
});

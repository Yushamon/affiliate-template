import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const target = path.join(
  ROOT,
  "apps",
  "pfotentechnik",
  "src",
  "lib",
  "seo-copilot",
  "finding-ai.ts"
);

test("Finding-AI behandelt fehlende Action-IDs defensiv", () => {
  const source = fs.readFileSync(target, "utf8");
  assert.ok(source.includes("Array.isArray(finding?.aiActionIds)"));
  assert.ok(source.includes("const actionIds ="));
  assert.match(source, /actionIds\s*\.map\(/);
  assert.ok(!/finding\.aiActionIds\s*\.map\(/m.test(source));
});

test("Ungültige Action-IDs werden vor Registry-Zugriff entfernt", () => {
  const source = fs.readFileSync(target, "utf8");
  assert.ok(source.includes('typeof actionId === "string"'));
  assert.ok(source.includes("actionId.trim().length > 0"));
});

test("Normalisierung deckt alte und unvollständige Findings ab", () => {
  const normalize = (finding) =>
    Array.isArray(finding?.aiActionIds)
      ? finding.aiActionIds.filter(
          (actionId) => typeof actionId === "string" && actionId.trim().length > 0
        )
      : [];

  assert.deepEqual(normalize({}), []);
  assert.deepEqual(normalize({ aiActionIds: undefined }), []);
  assert.deepEqual(normalize({ aiActionIds: null }), []);
  assert.deepEqual(normalize({ aiActionIds: [] }), []);
  assert.deepEqual(normalize({ aiActionIds: ["", "valid", null] }), ["valid"]);
});

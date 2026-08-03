import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const FILE = path.join(ROOT, "apps", "pfotentechnik", "src", "pages", "admin", "seo", "topical-authority.astro");

test("Roadmap-Prompts greifen erst nach Initialisierung der Rohdaten zu", () => {
  const source = fs.readFileSync(FILE, "utf8");
  const dataStart = source.indexOf("const data =");
  const dataEnd = source.indexOf("\n};", dataStart);
  const roadmapDeclaration = source.indexOf("const roadmapOpportunities");
  assert.ok(dataStart >= 0 && dataEnd > dataStart);
  assert.ok(roadmapDeclaration > dataEnd);
  const dataBlock = source.slice(dataStart, dataEnd + 3);
  assert.doesNotMatch(dataBlock, /opportunities:\s*roadmapOpportunities/);
  assert.match(dataBlock, /opportunities:\s*Array\.isArray\(loaded\?\.opportunities\)\s*\?\s*loaded\.opportunities\s*:\s*\[\]/);
});

test("Roadmap-Karten verwenden weiterhin die promptfähigen Opportunities", () => {
  const source = fs.readFileSync(FILE, "utf8");
  assert.match(source, /const roadmapOpportunities/);
  assert.match(source, /roadmapOpportunities\.map|roadmapOpportunities\.length/);
  assert.match(source, /ChatGPT-Roadmap kopieren/);
  assert.match(source, /Codex-Umsetzung kopieren/);
});

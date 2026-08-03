import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const FILE = path.join(ROOT, "apps", "pfotentechnik", "src", "pages", "admin", "seo", "topical-authority.astro");

test("Roadmap rendert ausschließlich angereicherte Opportunities", () => {
  const source = fs.readFileSync(FILE, "utf8");
  const roadmap = source.slice(source.indexOf("Strategische Chancen"));
  assert.match(roadmap, /roadmapOpportunities\.length\s*===\s*0/);
  assert.match(roadmap, /roadmapOpportunities\.map\(\(opportunity\)\s*=>/);
  assert.doesNotMatch(roadmap, /data\.opportunities\.map\(\(opportunity\)\s*=>/);
});

test("Fehlende Prompt-Paare können den Build nicht mehr abbrechen", () => {
  const source = fs.readFileSync(FILE, "utf8");
  assert.match(source, /opportunity\.prompts\?\.chatgpt\s*\?\?\s*""/);
  assert.match(source, /opportunity\.prompts\?\.codex\s*\?\?\s*""/);
});

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const APP = path.join(ROOT, "apps", "pfotentechnik");
const read = (file) => fs.readFileSync(file, "utf8");

test("Research Briefing Engine ist vollständig integriert", () => {
  const schema = read(path.join(APP, "src", "lib", "seo", "research", "schema.ts"));
  const prompt = read(path.join(APP, "src", "lib", "seo", "research", "prompt-builder.ts"));
  const growth = read(path.join(APP, "src", "lib", "seo", "research", "growth.ts"));
  const workbench = read(path.join(APP, "src", "components", "admin", "ResearchWorkbench.astro"));

  assert.match(schema, /ResearchImplementationBrief/);
  assert.match(schema, /implementationBrief\?:ResearchImplementationBrief/);
  assert.match(prompt, /IMPLEMENTIERUNGS-BRIEFING/);
  assert.match(prompt, /implementationBrief/);
  assert.match(growth, /buildImplementationBrief/);
  assert.match(growth, /buildResearchImplementationPrompt/);
  assert.match(workbench, /Umsetzungsauftrag kopieren/);
  assert.match(workbench, /data-copy-implementation-prompt/);
  assert.match(workbench, /Fertig, wenn/);
});

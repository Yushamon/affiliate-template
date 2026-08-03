import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(appRoot, relative), "utf8");

test("Topical-Authority-Roadmaps besitzen zentrale Prompt-Erzeugung", () => {
  const source = read("src/lib/seo/topical-authority/roadmap-prompts.ts");

  assert.match(source, /buildTopicalAuthorityRoadmapPrompts/);
  assert.match(source, /buildChatGptPrompt/);
  assert.match(source, /buildCodexPrompt/);
  assert.match(source, /TOPICAL-AUTHORITY-ROADMAP/);
  assert.match(source, /Installer-Patch im Ordner 3/);
  assert.match(source, /Maximal drei einfache naheliegende Verbesserungen/);
});

test("Roadmap-Prompts unterscheiden Konsolidierung, Journey, Expansion und Validierung", () => {
  const source = read("src/lib/seo/topical-authority/roadmap-prompts.ts");

  assert.match(source, /mode: "consolidate"/);
  assert.match(source, /mode: "journey"/);
  assert.match(source, /mode: "expand"/);
  assert.match(source, /mode: "validate"/);
  assert.match(source, /Konsolidieren und schärfen hat Vorrang vor neuen Seiten/);
  assert.match(source, /Go\/No-Go/);
});

test("Topical-Authority-Seite zeigt beide Roadmap-Prompt-Aktionen", () => {
  const page = read("src/pages/admin/seo/topical-authority.astro");

  assert.match(page, /buildTopicalAuthorityRoadmapPrompts/);
  assert.match(page, /roadmapOpportunities/);
  assert.match(page, /ChatGPT-Roadmap kopieren/);
  assert.match(page, /Codex-Umsetzung kopieren/);
  assert.match(page, /data-copy-kind="ChatGPT-Roadmap"/);
  assert.match(page, /data-copy-kind="Codex-Umsetzung"/);
});

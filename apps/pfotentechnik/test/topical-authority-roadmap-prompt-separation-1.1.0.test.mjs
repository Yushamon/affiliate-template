import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(appRoot, relative), "utf8");

test("Roadmap-Prompts sind von generischen Produkt- und Research-Prompts entkoppelt", () => {
  const source = read("src/lib/seo/topical-authority/roadmap-prompts.ts");

  assert.doesNotMatch(source, /buildChatGptPrompt/);
  assert.doesNotMatch(source, /buildCodexPrompt/);
  assert.doesNotMatch(source, /PRODUCT_SCHEMA_PATH|product\.ts/);
  assert.doesNotMatch(source, /Händlerangaben|Nachfolger|Produktdatei/);
  assert.match(source, /sharedRoadmapPrompt/);
  assert.match(source, /Intent-Matrix/);
});

test("Roadmap-Prompt verlangt klare Entscheidung pro Route", () => {
  const source = read("src/lib/seo/topical-authority/roadmap-prompts.ts");

  for (const marker of [
    "aktuelle Nutzer- und Suchintention",
    "Soll-Intent",
    "aktueller Intent-Owner",
    "Kannibalisierungsrisiko",
    "behalten, schärfen, zusammenführen",
    "Abhängigkeiten",
    "objektives Akzeptanzkriterium",
  ]) {
    assert.match(source, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("ChatGPT und Codex erhalten getrennte, passende Arbeitsaufträge", () => {
  const source = read("src/lib/seo/topical-authority/roadmap-prompts.ts");

  assert.match(source, /AUSGABE FÜR CHATGPT/);
  assert.match(source, /Ändere keine Dateien/);
  assert.match(source, /AUSGABE FÜR CODEX/);
  assert.match(source, /Installer-Patch im Ordner 3/);
});

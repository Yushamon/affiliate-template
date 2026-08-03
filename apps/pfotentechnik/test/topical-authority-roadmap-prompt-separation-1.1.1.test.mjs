import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) =>
  fs.readFileSync(path.join(appRoot, relative), "utf8");

test("Roadmap-Prompts sind eigenständig und frei von Produkt-Research-Ballast", () => {
  const source = read("src/lib/seo/topical-authority/roadmap-prompts.ts");

  assert.doesNotMatch(source, /PRODUCT_SCHEMA_PATH|src\/content\/schema\/product\.ts/);
  assert.doesNotMatch(source, /Händlerangaben|Nachfolger|Produktdatei/);
  assert.match(source, /buildSharedRoadmapPrompt/);
  assert.match(source, /buildChatGptPrompt/);
  assert.match(source, /buildCodexPrompt/);
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
    assert.ok(source.includes(marker), `Marker fehlt: ${marker}`);
  }
});

test("Roadmap-Profile decken alle vier Strategien ab", () => {
  const source = read("src/lib/seo/topical-authority/roadmap-prompts.ts");

  for (const mode of ["consolidate", "journey", "expand", "validate"]) {
    assert.match(source, new RegExp(`mode: "${mode}"`));
  }
});

test("ChatGPT und Codex erhalten getrennte Aufgaben", () => {
  const source = read("src/lib/seo/topical-authority/roadmap-prompts.ts");

  assert.match(source, /AUSGABE FÜR CHATGPT/);
  assert.match(source, /Ändere keine Dateien/);
  assert.match(source, /AUSGABE FÜR CODEX/);
  assert.match(source, /Installer-Patch im Ordner 3/);
});

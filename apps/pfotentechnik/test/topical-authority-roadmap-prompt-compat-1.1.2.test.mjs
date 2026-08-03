import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = path.join(
  appRoot,
  "src",
  "lib",
  "seo",
  "topical-authority",
  "roadmap-prompts.ts"
);

test("Roadmap-Prompt erfüllt alte und neue Verträge gleichzeitig", () => {
  const source = fs.readFileSync(file, "utf8");

  for (const marker of [
    "buildTopicalAuthorityRoadmapPrompts",
    "buildChatGptPrompt",
    "buildCodexPrompt",
    "TOPICAL-AUTHORITY-ROADMAP",
    "Installer-Patch im Ordner 3",
    "Maximal drei einfache naheliegende Verbesserungen",
    "Konsolidieren und schärfen hat Vorrang vor neuen Seiten",
    'mode: "consolidate"',
    'mode: "journey"',
    'mode: "expand"',
    'mode: "validate"',
  ]) {
    assert.ok(source.includes(marker), `Marker fehlt: ${marker}`);
  }
});

test("Produkt-Research-Ballast bleibt ausgeschlossen", () => {
  const source = fs.readFileSync(file, "utf8");

  assert.doesNotMatch(source, /PRODUCT_SCHEMA_PATH|src\/content\/schema\/product\.ts/);
  assert.doesNotMatch(source, /Händlerangaben|Nachfolger|Produktdatei/);
});

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pagePath = path.join(appRoot, "src/pages/admin/seo/prices.astro");
const readPage = () => fs.readFile(pagePath, "utf8");

test("Preis-Editor schützt aktive und ungespeicherte Eingaben", async () => {
  const source = await readPage();
  assert.match(source, /PT_SEO_PRICE_EDITOR_STABILITY_1_0_0/);
  assert.match(source, /dirtyEditors\.has\(record\.slug\)/);
  assert.match(source, /editor\.contains\(document\.activeElement\)/);
  assert.match(source, /if \(!options\.force && protectedInteraction\) return false/);
});

test("Preisentwürfe überstehen einen Dev-Reload innerhalb des Tabs", async () => {
  const source = await readPage();
  assert.match(source, /sessionStorage\.setItem\(PRICE_DRAFT_STORAGE_KEY/);
  assert.match(source, /persistedDrafts\[slug\]/);
  assert.match(source, /writeDraftToEditor\(editor, initialDraft\)/);
});

test("Nur erfolgreich gespeicherte Entwürfe werden verworfen", async () => {
  const source = await readPage();
  assert.match(source, /clearPersistedDraft\(slug\)/);
  assert.match(source, /syncEditor\(record, \{ force: true \}\)/);
  assert.match(source, /hasProtectedEditorInteraction/);
  assert.match(source, /if \(!hasProtectedEditorInteraction\(\)\) applyView\(\)/);
});

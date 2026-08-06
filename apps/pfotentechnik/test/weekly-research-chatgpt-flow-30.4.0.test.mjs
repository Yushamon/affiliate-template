import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { buildWeeklyResearchPrompt } from "../src/lib/seo/research/prompt-builder.ts";
import {
  buildResearchChatGptPrompt,
  buildWeeklyGrowthOpportunities
} from "../src/lib/seo/research/growth.ts";

const prompt = buildWeeklyResearchPrompt({
  generatedAt: "2026-08-06T00:00:00.000Z",
  clusters: [],
  products: 74
});

test("Wochenresearch liefert eine direkt importierbare Download-Datei", () => {
  assert.match(prompt, /exakten Namen research-import\.json/);
  assert.match(prompt, /herunterladbaren Dateianhang/);
  assert.match(prompt, /keinen JSON-Block kopieren/);
  assert.match(prompt, /technische Fallback/);
  assert.match(prompt, /nicht zusätzlich in die Chat-Antwort/);
});

test("ChatGPT-Prompt ist Recherche statt Repository-Installer", () => {
  const result = buildResearchChatGptPrompt({
    title: "Modellwechsel prüfen",
    reason: "Ein Nachfolger wurde angekündigt.",
    repositoryMatch: { exists: true, route: "/produkt/modell/" },
    actions: [{ type: "update-product", target: "/produkt/modell/", reason: "Lifecycle prüfen" }],
    evidence: [{ source: "Hersteller", url: "https://example.com/model", note: "Nachfolger angekündigt" }]
  });
  assert.match(result, /aktiviertem Webzugriff/);
  assert.match(result, /keinen Repository-Zugriff/);
  assert.match(result, /Bestätigte Fakten mit Quelle/);
  assert.doesNotMatch(result, /Installer-Patch/);
});

test("Top-5-Chance enthält getrennte ChatGPT- und Codex-Aufträge", () => {
  const [item] = buildWeeklyGrowthOpportunities([{
    id: "finding-a",
    type: "content-refresh",
    title: "Bestehende Seite aktualisieren",
    status: "open",
    priority: 90,
    confidence: 95,
    reason: "Belegter Aktualisierungsbedarf.",
    repositoryMatch: { exists: true, route: "/ratgeber/" },
    actions: [{ type: "update-page", target: "/ratgeber/", reason: "Fakt aktualisieren" }],
    evidence: [{ source: "Primärquelle", url: "https://example.com", note: "Aktuelle Angabe" }]
  }], 1, new Map());
  assert.match(item.chatGptPrompt, /Recherche- und Redaktionspartner/);
  assert.match(item.codexPrompt, /direkt im Repository/);
  assert.equal(item.implementationPrompt, item.codexPrompt);
});

test("Workbench benennt den neuen Ablauf eindeutig", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "src/components/admin/ResearchWorkbench.astro"), "utf8");
  assert.match(source, /ChatGPT-Wochenresearch kopieren/);
  assert.match(source, /ChatGPT liefert <code>research-import\.json<\/code> als Download/);
  assert.match(source, /data-copy-chatgpt-prompt/);
  assert.match(source, /data-copy-codex-prompt/);
  assert.doesNotMatch(source, /data-copy-implementation-prompt/);
});

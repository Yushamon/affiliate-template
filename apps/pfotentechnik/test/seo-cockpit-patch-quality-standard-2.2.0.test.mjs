import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const APP = path.join(ROOT, "apps", "pfotentechnik");
const GROWTH = path.join(APP, "src/lib/seo/research/growth.ts");
const PROMPT_BUILDER = path.join(APP, "src/lib/seo/research/prompt-builder.ts");

test("Kopierter Cockpit-Auftrag enthält den vollständigen Patch-Qualitätsstandard", async () => {
  const module = await import(pathToFileURL(GROWTH).href);
  const prompt = module.buildResearchImplementationPrompt({
    title: "Beispielauftrag",
    reason: "Beispielproblem",
    status: "open",
    actions: [{ type: "update-page", target: "/produkt/beispiel/", reason: "Daten korrigieren" }],
    evidence: [{ source: "Hersteller", url: "https://example.com", note: "Primärquelle" }]
  });

  assert.match(prompt, /PATCH-QUALITÄTSSTANDARD/);
  assert.match(prompt, /teilweise angewendeten Stand/);
  assert.match(prompt, /Beim zweiten Lauf erfolgreich/);
  assert.match(prompt, /Node 24 und Node 26/);
  assert.match(prompt, /Windows, macOS und Linux/);
  assert.match(prompt, /node --check/);
  assert.match(prompt, /Genau einen finalen Installer/);
  assert.match(prompt, /Tests prüfen Verhalten, Datenstruktur und Ergebnis/);
});

test("Research-Prompt verlangt robuste implementationBriefs", () => {
  const source = fs.readFileSync(PROMPT_BUILDER, "utf8");
  assert.match(source, /idempotent, plattformübergreifend und teillauffähig/);
  assert.match(source, /strukturelle Dateiänderungen/);
  assert.match(source, /erfolgreichen zweiten Installerlauf/);
  assert.match(source, /erwartbare Hotfix-Ketten vermeiden/);
});

test("Qualitätsstandard wird zentral nur einmal in den Implementierungs-Prompt eingefügt", () => {
  const source = fs.readFileSync(GROWTH, "utf8");
  assert.equal((source.match(/export const PATCH_QUALITY_STANDARD/g) ?? []).length, 1);
  assert.equal((source.match(/\.\.\.PATCH_QUALITY_STANDARD,/g) ?? []).length, 1);
});

test("Standard verbietet keine RegExp pauschal, verlangt aber Kompilierung und strukturelle Alternativen", () => {
  const source = fs.readFileSync(GROWTH, "utf8");
  assert.match(source, /Unvermeidbare RegExp vor der ersten Dateiänderung kompilieren und testen/);
  assert.match(source, /Strukturelle Bearbeitung bevorzugen/);
});

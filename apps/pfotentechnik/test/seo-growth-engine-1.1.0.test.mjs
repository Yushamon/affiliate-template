import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const APP = path.join(ROOT, "apps", "pfotentechnik");
const GROWTH = path.join(APP, "src", "lib", "seo", "research", "growth.ts");
const WORKBENCH = path.join(APP, "src", "components", "admin", "ResearchWorkbench.astro");

test("Growth Engine nutzt GSC-Signale", () => {
  const source = fs.readFileSync(GROWTH, "utf8");
  assert.match(source, /google-search-report.json/);
  assert.match(source, /gscScore/);
  assert.match(source, /position >= 8 && position <= 20/);
  assert.match(source, /impressions/);
});

test("Bestehende Seiten werden vor großen neuen Clustern bevorzugt", () => {
  const source = fs.readFileSync(GROWTH, "utf8");
  assert.match(source, /if (existing) score += 12/);
  assert.match(source, /strategicNew && !row/);
  assert.match(source, /score -= 24/);
});

test("Top 5 enthalten bevorzugt kurzfristige Hebel", () => {
  const source = fs.readFileSync(GROWTH, "utf8");
  assert.match(source, /shortTerm.slice(0, Math.min(4, limit))/);
  assert.match(source, /strategic.slice/);
});

test("Cockpit zeigt GSC-Kontext und Zeithorizont kompakt", () => {
  const source = fs.readFileSync(WORKBENCH, "utf8");
  assert.match(source, /GSC-Chance/);
  assert.match(source, /Kurzfristiger Wachstumshebel/);
  assert.match(source, /Strategischer Authority-Aufbau/);
});

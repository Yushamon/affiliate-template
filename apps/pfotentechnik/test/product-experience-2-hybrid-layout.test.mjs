import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const component = (...parts) => path.join(appRoot, "src", "components", "product-experience-2", ...parts);

const read = (file) => fs.readFile(file, "utf8");

test("Kaufentscheidung rendert semantische Statuszeichen ohne Listen-Pseudoelemente", async () => {
  const source = await read(component("ProductDecisionAssistant.astro"));
  assert.match(source, /positive:\s*"✓"/);
  assert.match(source, /neutral:\s*"–"/);
  assert.match(source, /negative:\s*"×"/);
  assert.match(source, /className = "decision__reason-mark"/);
  assert.doesNotMatch(source, /data-result-reasons><\/ul>/);
  assert.doesNotMatch(source, /li\[data-kind="neutral"\]::before/);
});

test("Futterfragen bleiben an die Kategorieentscheidung gebunden", async () => {
  const source = await read(component("ProductDecisionAssistant.astro"));
  assert.match(source, /usesFoodQuestions &&/);
  assert.match(source, /data-question="dryFood"/);
  assert.match(source, /data-question="wetFood"/);
});

test("Hybrid-Layout hält nur entscheidende Inhalte als Karten", async () => {
  const hero = await read(component("ProductHero2.astro"));
  const decision = await read(component("ProductDecisionAssistant.astro"));
  const timeline = await read(component("ProductEverydayTimeline.astro"));
  const details = await read(component("ProductDetails2.astro"));
  const alternatives = await read(component("ProductAlternatives2.astro"));
  const trust = await read(component("ProductTrust2.astro"));

  assert.match(hero, /\.px2-hero[\s\S]*border-radius:\s*26px/);
  assert.match(decision, /\.decision[\s\S]*border-radius:\s*24px/);
  assert.match(timeline, /border-top:\s*1px solid var\(--px2-border\)/);
  assert.doesNotMatch(timeline, /\.timeline\s*\{[^}]*border-radius/s);
  assert.match(details, /\.details__decision,[\s\S]*\.details__health/);
  assert.match(details, /\.details__proscons[\s\S]*border-top:/);
  assert.match(alternatives, /article[\s\S]*border-radius:\s*0/);
  assert.match(trust, /article[\s\S]*border-radius:\s*0/);
});

test("Warnungen werden nicht erneut als Nachteile ausgegeben", async () => {
  const source = await read(component("ProductDetails2.astro"));
  assert.match(source, /const warningKeys = new Set/);
  assert.match(source, /uniqueTextItems\(model\.cons, \{ exclude: warnings/);
  assert.match(source, /Weitere Nachteile/);
});

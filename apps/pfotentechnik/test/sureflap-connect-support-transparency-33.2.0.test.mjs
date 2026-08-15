import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(app, "package.json"));
const yaml = require("js-yaml");
const content = path.join(app, "src", "content");

function parse(relative) {
  const file = path.join(content, relative);
  const raw = fs.readFileSync(file, "utf8");
  const match = raw.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(match, `Frontmatter fehlt: ${relative}`);
  return { file, raw, data: yaml.load(match[1], { schema: yaml.JSON_SCHEMA }) };
}

test("SureFlap Connect trennt Hub-Support von Lebensdauer und Cloud", () => {
  const product = parse("products/sureflap-mikrochip-katzenklappe-connect.md");
  const fact = product.data.decisionFacts.find((item) => item.label === "Security-Support des Hubs");
  assert.equal(fact.value, "Zwei Jahre ab Kaufdatum des Hubs dokumentiert");
  assert.match(fact.consequence, /nicht die Lebensdauer/);
  assert.equal(product.data.productStatus, "active");
  assert.doesNotMatch(product.raw, /funktioniert nur zwei Jahre|nach zwei Jahren keine Updates mehr|nach zwei Jahren unsicher/i);
  assert.match(product.raw, /weder ein Funktionsende/);
});

test("FAQ beantwortet die drei Supportfragen aus derselben sichtbaren Datenquelle", () => {
  const product = parse("products/sureflap-mikrochip-katzenklappe-connect.md").data;
  const questions = new Map(product.faq.map((item) => [item.question, item.answer]));
  assert.match(questions.get("Braucht die SureFlap Connect den Hub?"), /App/);
  assert.match(questions.get("Wie lange liefert Sure Petcare Sicherheitsupdates für den Hub?"), /zwei Jahren ab Kaufdatum des Hubs/);
  assert.match(questions.get("Was passiert nach Ablauf des dokumentierten Security-Zeitraums?"), /keine belastbare Prognose/);
  const details = fs.readFileSync(path.join(app, "src/components/product-experience-2/ProductDetails2.astro"), "utf8");
  assert.match(details, /model\.faq\.map/);
});

test("Vergleich stellt Hub und unbekannten Support ohne erfundene Werte dar", () => {
  const comparison = parse("comparisons/katzenklappen-mit-app-und-beuteerkennung.md").data;
  assert.ok(comparison.criteria.some((item) => item.key === "hub_erforderlich"));
  assert.ok(comparison.criteria.some((item) => item.key === "security_support"));
  const sureflap = comparison.items.find((item) => item.slug === "sureflap-mikrochip-katzenklappe-connect");
  assert.match(sureflap.values.security_support, /zwei Jahre ab Kaufdatum des Hubs/);
  for (const item of comparison.items.filter((entry) => entry !== sureflap)) {
    assert.equal(item.values.hub_erforderlich, "Nicht dokumentiert");
    assert.equal(item.values.security_support, "Nicht dokumentiert");
  }
});

test("Journey-Ziele und bestehende Bildreferenzen sind gueltig", () => {
  const product = parse("products/sureflap-mikrochip-katzenklappe-connect.md");
  for (const href of ["/katzenklappen/", "/vergleiche/katzenklappen-mit-app-und-beuteerkennung/"]) {
    assert.ok(product.raw.includes(href));
  }
  for (const image of [product.data.images.hero, product.data.images.thumbnail, product.data.images.comparison, ...product.data.images.gallery].filter(Boolean)) {
    assert.ok(fs.existsSync(path.resolve(path.dirname(product.file), image.src)), `Asset fehlt: ${image.src}`);
  }
  assert.ok(fs.existsSync(path.join(content, "pages/katzenklappen.md")));
  assert.ok(fs.existsSync(path.join(content, "comparisons/katzenklappen-mit-app-und-beuteerkennung.md")));
});

test("Visual-Prompt erzeugt genau zwei belegte Motive in stabiler Reihenfolge", () => {
  const prompt = fs.readFileSync(path.join(app, "research/visual-prompts/sureflap-connect-visual-master-prompt.txt"), "utf8");
  assert.deepEqual([...prompt.matchAll(/^MOTIV (\d+):/gm)].map((match) => Number(match[1])), [1, 2]);
  assert.match(prompt, /genau ein Motiv pro Antwort/);
  assert.match(prompt, /exakt „Weiter“/);
  assert.match(prompt, /Kein Funktionsende nach zwei Jahren suggerieren/);
});

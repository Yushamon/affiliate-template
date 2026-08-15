import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(app, "package.json"));
const yaml = require("js-yaml");
const content = path.join(app, "src", "content");
const target = ["neakasa-m1-lite", "devoko-90l-automatisches-katzenklo", "petlibro-luma-smart-litter-box", "petkit-purobot-max-pro-2"];

function parse(relative) {
  const file = path.join(content, relative);
  const raw = fs.readFileSync(file, "utf8");
  const match = raw.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(match, `Frontmatter fehlt: ${relative}`);
  return { file, raw, data: yaml.load(match[1], { schema: yaml.JSON_SCHEMA }) };
}

test("Luma und PUROBOT sind eindeutige schemafaehige Produktentscheidungen", async () => {
  const scoreModule = await import(pathToFileURL(path.join(app, "src/domain/productScore.ts")).href);
  for (const slug of ["petlibro-luma-smart-litter-box", "petkit-purobot-max-pro-2"]) {
    const { file, data } = parse(`products/${slug}.md`);
    assert.equal(data.slug, slug);
    assert.equal(data.type, "product");
    assert.equal(data.category.key, "automatische-katzentoiletten");
    assert.equal(data.productUrl, `/produkt/${slug}/`);
    assert.ok(data.evidenceSources.length >= 2);
    assert.equal(data.editorial?.testedHandsOn ?? false, false);
    assert.ok(data.decisionJourney.next.includes("/vergleiche/beste-automatische-katzentoiletten/"));
    assert.ok(data.decisionJourney.fallback.includes("/automatische-katzentoiletten/"));
    const score = scoreModule.calculateProductScore(data);
    assert.equal(score.source, "criteria");
    assert.ok(score.criteriaCount >= 5);
    assert.ok(Number.isFinite(score.score));
    assert.ok(fs.existsSync(path.resolve(path.dirname(file), data.images.hero.src)));
  }
});

test("Vergleich besitzt exakt vier existierende Kaufrollen und Sicherheitsreihenfolge", () => {
  const comparison = parse("comparisons/beste-automatische-katzentoiletten.md").data;
  assert.deepEqual(comparison.items.map((item) => item.slug), target);
  assert.deepEqual(comparison.criteria.slice(0, 5).map((item) => item.key), ["bauform", "innenraum", "einstieg", "katzenprofil", "sicherheit"]);
  for (const item of comparison.items) assert.ok(fs.existsSync(path.join(content, "products", `${item.slug}.md`)));
  assert.deepEqual(comparison.decisionJourney.next, target.map((slug) => `/produkt/${slug}/`));
});

test("Hub und Herstellerbeziehungen schliessen die Journey ohne Dubletten", () => {
  const hub = parse("pages/automatische-katzentoiletten.md");
  assert.deepEqual(hub.data.contentPlatform.products, target);
  for (const slug of target) assert.ok(hub.raw.includes(`/produkt/${slug}/`));
  const petlibro = parse("manufacturers/petlibro.md").data;
  const petkit = parse("manufacturers/petkit.md").data;
  assert.equal(petlibro.productSlugs.filter((slug) => slug === "petlibro-luma-smart-litter-box").length, 1);
  assert.equal(petkit.productSlugs.filter((slug) => slug === "petkit-purobot-max-pro-2").length, 1);
});

test("Bildprompts definieren stabile Serien mit exakt fuenf Motiven", () => {
  for (const slug of ["petlibro-luma-smart-litter-box", "petkit-purobot-max-pro-2"]) {
    const prompt = fs.readFileSync(path.join(app, "research", "visual-prompts", `${slug}-visual-master-prompt.txt`), "utf8");
    assert.deepEqual([...prompt.matchAll(/^MOTIV ([1-5]):/gm)].map((match) => Number(match[1])), [1, 2, 3, 4, 5]);
    assert.match(prompt, /genau ein Bild pro Antwort/);
    assert.match(prompt, /ausschließlich „Weiter“/);
  }
});

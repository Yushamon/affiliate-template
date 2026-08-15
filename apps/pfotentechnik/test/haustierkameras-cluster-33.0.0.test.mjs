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
const products = ["petlibro-scout-smart-camera", "furbo-mini-360", "enabot-rola-mini"];

function parse(relative) {
  const file = path.join(content, relative);
  const raw = fs.readFileSync(file, "utf8");
  const match = raw.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(match, `Frontmatter fehlt: ${relative}`);
  return { file, raw, data: yaml.load(match[1], { schema: yaml.JSON_SCHEMA }) };
}

test("Action-Bundle besitzt drei schemafaehige Produktentscheidungen", () => {
  const roles = new Set();
  for (const slug of products) {
    const { file, data } = parse(`products/${slug}.md`);
    assert.equal(data.type, "product");
    assert.equal(data.slug, slug);
    assert.equal(data.category.key, "haustierkameras");
    assert.equal(data.productUrl, `/produkt/${slug}/`);
    assert.equal(data.testStatus, "manufacturer-data");
    assert.equal(data.testStatus, "manufacturer-data");
    assert.ok(data.evidenceSources.length >= 1);
    assert.ok(data.comparisons.includes("beste-haustierkameras"));
    assert.ok(data.decisionJourney.next.includes("/vergleiche/beste-haustierkameras/"));
    assert.ok(data.decisionJourney.fallback.includes("/haustierkameras/"));
    roles.add(data.comparisonData.custom.klasse);
    const imagePath = path.resolve(path.dirname(file), data.images.hero.src);
    assert.ok(fs.existsSync(imagePath), `Bildasset fehlt: ${imagePath}`);
  }
  assert.equal(roles.size, 3);
});

test("Vergleich referenziert nur existierende Bundle-Produkte in Entscheidungsreihenfolge", () => {
  const { data } = parse("comparisons/beste-haustierkameras.md");
  assert.deepEqual(data.items.map((item) => item.slug), products);
  assert.deepEqual(data.criteria.slice(0, 4).map((item) => item.key), ["klasse", "speicher", "abo", "interaktion"]);
  for (const item of data.items) {
    assert.ok(fs.existsSync(path.join(content, "products", `${item.slug}.md`)));
  }
  assert.deepEqual(data.decisionJourney.next, products.map((slug) => `/produkt/${slug}/`));
});

test("Hub und Hersteller schliessen die internen Zielrouten", () => {
  const hub = parse("pages/haustierkameras.md");
  assert.deepEqual(hub.data.contentPlatform.products, products);
  for (const slug of products) assert.ok(hub.raw.includes(`/produkt/${slug}/`));
  assert.ok(hub.raw.includes("/vergleiche/beste-haustierkameras/"));
  const furbo = parse("manufacturers/furbo.md").data;
  const enabot = parse("manufacturers/enabot.md").data;
  assert.ok(furbo.productSlugs.includes("furbo-mini-360"));
  assert.ok(enabot.productSlugs.includes("enabot-rola-mini"));
});

test("Produktionsprompts definieren exakt fuenf Einzelausgaben und stabilen Weiter-Modus", () => {
  for (const slug of products) {
    const prompt = fs.readFileSync(path.join(app, "research", "visual-prompts", `${slug}-visual-master-prompt.txt`), "utf8");
    const motifs = [...prompt.matchAll(/^MOTIV ([1-5]):/gm)].map((match) => Number(match[1]));
    assert.deepEqual(motifs, [1, 2, 3, 4, 5]);
    assert.match(prompt, /Antworte nach jedem erzeugten Bild nur mit dem Bild und stoppe/);
    assert.match(prompt, /Bei der Nachricht „Weiter“/);
  }
});

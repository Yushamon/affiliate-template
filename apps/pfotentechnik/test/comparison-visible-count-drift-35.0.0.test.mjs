import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

const dir = path.resolve(import.meta.dirname, "../src/content/comparisons");
const words = { Zwei: 2, Drei: 3, Vier: 4, Fünf: 5, Sechs: 6, Sieben: 7, Acht: 8, Neun: 9, Zehn: 10, Elf: 11, Zwölf: 12 };
const countPattern = new RegExp(`\\b(${Object.keys(words).join("|")}|(?:[2-9]|1[0-2]))[ \\t]+(?:[^.\\n]{0,24})?(?:Modelle|Produkte|Kameraklassen|Katzenbrunnen|Katzentoiletten|Katzenklappen|Futterautomaten|Kaufrollen|Klassen)\\b`, "gi");

test("sichtbare Vergleichszahlen stimmen mit items.length überein", () => {
  const failures = [];
  for (const name of fs.readdirSync(dir).filter((name) => name.endsWith(".md"))) {
    const source = fs.readFileSync(path.join(dir, name), "utf8");
    const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!match) continue;
    const data = yaml.load(match[1]);
    if (!Array.isArray(data.items) || data.items.length < 2) continue;
    const fields = [data.description, data.seo?.title, data.seo?.description, data.hub?.description, data.tableTitle, data.cardsTitle]
      .filter(Boolean).join("\n");
    const headings = source.split(/\r?\n/).filter((line) => /^#{1,6}\s/.test(line)).join("\n");
    for (const hit of `${fields}\n${headings}`.matchAll(countPattern)) {
      const value = /^\d+$/.test(hit[1]) ? Number(hit[1]) : words[hit[1][0].toUpperCase() + hit[1].slice(1).toLowerCase()];
      if (value !== data.items.length) failures.push(`${name}: "${hit[0]}" = ${value}, items = ${data.items.length}`);
    }
  }
  assert.deepEqual(failures, []);
});

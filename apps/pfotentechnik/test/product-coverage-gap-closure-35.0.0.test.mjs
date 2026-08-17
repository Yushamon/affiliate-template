import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { PRODUCT_COVERAGE } from "../src/lib/seo/topical-authority/product-coverage.data.mjs";

const root = path.resolve(import.meta.dirname, "..");
const comparisons = {
  futterautomaten: "beste-futterautomaten-fuer-katzen.md",
  katzentoiletten: "beste-automatische-katzentoiletten.md",
  "gps-tracker": "beste-gps-tracker-fuer-hunde.md",
  katzenklappen: "beste-mikrochip-katzenklappen.md",
  trinkbrunnen: "beste-trinkbrunnen-fuer-katzen.md",
  haustierkameras: "beste-haustierkameras.md",
};

function frontmatter(file) {
  const source = fs.readFileSync(file, "utf8");
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(match, `Frontmatter fehlt: ${file}`);
  return yaml.load(match[1]);
}

test("redaktionelle Decision Coverage entspricht den Hauptvergleichen", () => {
  for (const [cluster, file] of Object.entries(comparisons)) {
    const data = frontmatter(path.join(root, "src/content/comparisons", file));
    assert.deepEqual(data.items.map((item) => item.slug), PRODUCT_COVERAGE[cluster].decisionProductSlugs, cluster);
    assert.deepEqual(PRODUCT_COVERAGE[cluster].confirmedAGaps, [], `${cluster}: offener A-Gap`);
  }
});

test("neue Produkte sind als vollständige Decision-Seiten vorhanden", () => {
  const slugs = ["petkit-puramax-2", "litter-robot-4", "invoxia-biotracker-2026", "prothelis-area-pets", "pawfit-3", "cat-mate-elite-355w", "catit-pixi-smart-trinkbrunnen", "petsafe-streamside-trinkbrunnen", "reolink-e1-zoom"];
  for (const slug of slugs) {
    const data = frontmatter(path.join(root, "src/content/products", `${slug}.md`));
    assert.equal(data.testStatus, "manufacturer-data", slug);
    assert.equal(data.editorial.testedHandsOn, false, slug);
    assert.equal(data.rating, 0, slug);
    assert.ok(data.comparisons.length > 0, slug);
    assert.ok(data.evidenceSources.length > 0, slug);
  }
});

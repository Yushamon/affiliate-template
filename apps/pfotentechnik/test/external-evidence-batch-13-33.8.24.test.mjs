import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const productDir = path.join(root, "src/content/products");

const full = ["tractive-cat-6-mini", "xiaomi-smart-pet-food-feeder-2"];
const constrained = [
  "wopet-cube-air-ca10",
  "wopet-heritage-view-camera-feeder",
  "wopet-patrol-f07-pro",
  "wopet-pioneer-f01-plus",
  "zeromouse-2-0",
];

const read = slug => fs.readFileSync(path.join(productDir, slug + ".md"), "utf8");

test("vollständige Batch-13-Produkte besitzen Professional Reviews, User Reviews und Consensus", () => {
  for (const slug of full) {
    const s = read(slug);
    assert.match(s, /externalEvidence:/, slug);
    assert.match(s, /professionalReviews:\s*\n\s+- publisher:/, slug);
    assert.match(s, /userReviews:\s*\n\s+- platform:/, slug);
    assert.match(s, /consensus:/, slug);
  }
});

test("schwache Quellenlagen bleiben constrained", () => {
  for (const slug of constrained) {
    const s = read(slug);
    assert.match(s, /externalEvidence:[\s\S]*?constrained:\s*true/, slug);
    assert.match(s, /professionalReviews:\s*\[\]/, slug);
  }
});

test("Xiaomi ergänzt nur den zuvor leeren Professional-Review-Baustein", () => {
  const s = read("xiaomi-smart-pet-food-feeder-2");
  assert.match(s, /publisher:\s*"Ääni & Kuva"/);
  assert.match(s, /platform:\s*"Yandex Reviews"/);
  assert.match(s, /consensus:/);
});

test("PfotenTechnik-Ratings bleiben vorhanden", () => {
  for (const slug of [...full, ...constrained]) {
    const s = read(slug);
    assert.match(s, /^rating:\s*[0-9.]+\s*$/m, slug);
    assert.match(s, /^ratings:/m, slug);
  }
});

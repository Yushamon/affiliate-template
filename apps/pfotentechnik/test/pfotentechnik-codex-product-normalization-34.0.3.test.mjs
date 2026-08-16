import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, "..");
const targets = [
  "cat-mate-elite-355w",
  "catit-pixi-smart-trinkbrunnen",
  "invoxia-biotracker-2026",
  "litter-robot-4",
  "pawfit-3",
  "petkit-puramax-2",
  "petsafe-streamside-trinkbrunnen",
  "prothelis-area-pets",
  "reolink-e1-zoom"
];

for (const slug of targets) {
  test(`${slug}: Lifecycle und Evidence normalisiert`, () => {
    const src = fs.readFileSync(
      path.join(app, "src", "content", "products", `${slug}.md`),
      "utf8"
    );

    assert.match(src, /^productStatus:\s*["']?active["']?\s*$/m);
    assert.match(src, /^editorialStatus:\s*["']?complete["']?\s*$/m);
    assert.match(src, /^recommendationStatus:\s*["']?recommended["']?\s*$/m);
    assert.match(src, /^maintenanceStatus:\s*["']?complete["']?\s*$/m);

    const rating = Number(src.match(/^rating:\s*([0-5](?:\.\d+)?)\s*$/m)?.[1] || 0);
    assert.ok(rating > 0, "rating muss > 0 sein");
    assert.match(src, /^ratings:\s*$/m);
    assert.match(src, /^externalEvidence:\s*$/m);
    assert.match(src, /^\s{2}professionalReviews:\s*$/m);
    assert.match(src, /^\s{2}userReviews:\s*$/m);
    assert.match(src, /^\s{2}consensus:\s*$/m);
    assert.match(src, /^evidenceSources:\s*$/m);
    assert.match(src, /^experience:\s*$/m);
    assert.match(src, /PfotenTechnik behauptet[^\n]*keinen eigenen Praxistest|keinen eigenen Praxistest/i);
  });
}

test("alte fehlerhafte Normalization-Tests sind entfernt", () => {
  for (const name of ["pfotentechnik-codex-product-normalization-34.0.0.test.mjs","pfotentechnik-codex-product-normalization-34.0.1.test.mjs"]) {
    assert.equal(fs.existsSync(path.join(app, "test", name)), false, name);
  }
});

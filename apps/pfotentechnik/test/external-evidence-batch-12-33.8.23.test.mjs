import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const productsDir = path.join(root, "apps", "pfotentechnik", "src", "content", "products");
const complete = ["petlibro-scout-smart-camera","petsafe-healthy-pet-simply-feed","petsafe-mikrochip-katzenklappe","petsafe-smart-feed-2","surefeed-microchip-pet-feeder","sureflap-dualscan-mikrochip-katzenklappe","sureflap-mikrochip-katzenklappe","sureflap-mikrochip-katzenklappe-connect"];
const constrained = ["petsafe-petporte-smart-flap","petwalk-medium-tiertuer"];

const read = slug => fs.readFileSync(path.join(productsDir, slug + ".md"), "utf8");

test("vollständige Batch-12-Produkte besitzen alle Evidence-Bausteine", () => {
  for (const slug of complete) {
    const s = read(slug);
    assert.match(s, /^externalEvidence:\s*$/m, slug);
    assert.match(s, /^  professionalReviews:\s*$/m, slug);
    assert.match(s, /^  userReviews:\s*$/m, slug);
    assert.match(s, /^  consensus:\s*$/m, slug);
  }
});

test("schwache Quellenlagen sind constrained statt künstlich vollständig", () => {
  for (const slug of constrained) {
    const s = read(slug);
    assert.match(s, /^  constrained:\s*true\s*$/m, slug);
    assert.match(s, /^  status:\s*constrained\s*$/m, slug);
  }
});

test("PfotenTechnik-Ratings bleiben vorhanden", () => {
  for (const slug of [...complete, ...constrained]) {
    const s = read(slug);
    assert.match(s, /^rating:\s*[0-9.]+\s*$/m, slug);
    assert.match(s, /^ratings:\s*(?:\{|$)/m, slug);
  }
});

test("PetSafe Microchip dokumentiert Quellenwiderspruch", () => {
  const s = read("petsafe-mikrochip-katzenklappe");
  assert.match(s, /Quellen widersprechen sich substanziell/);
  assert.match(s, /reviewCount:\s*198/);
});

test("Scout nutzt WIRED und Chewy", () => {
  const s = read("petlibro-scout-smart-camera");
  assert.match(s, /publisher: "WIRED"/);
  assert.match(s, /platform: "Chewy"/);
});

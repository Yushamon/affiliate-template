import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
const app = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const read = (slug) => fs.readFileSync(path.join(app,"src/content/products",slug+".md"),"utf8");

test("Aqara, C200, Enabot, Furbo und T20 enthalten externe Evidenz", () => {
  for (const slug of ["aqara-smart-pet-feeder-c1","cat-mate-c200","enabot-ebo-air-2","furbo-360-hundekamera","garmin-alpha-t-20"]) {
    const s=read(slug);
    assert.match(s,/externalEvidence:/);
    assert.match(s,/professionalReviews:/);
    assert.match(s,/userReviews:/);
    assert.match(s,/consensus:/);
  }
});
test("Catit PIXI Vision enthält den fehlenden Professional Review", () => {
  assert.match(read("catit-pixi-vision-smart-feeder"),/publisher: "The Catington Post"/);
});
test("unsichere Quellenlagen bleiben constrained", () => {
  for (const slug of ["cat-mate-335-pet-fountain","devoko-90l-automatisches-katzenklo","garmin-alpha-tt-25","honeyguardian-a305d"]) {
    assert.match(read(slug),/constrained: true/);
  }
});
test("PfotenTechnik-Ratings bleiben vorhanden", () => {
  for (const slug of ["aqara-smart-pet-feeder-c1","cat-mate-c200","catit-pixi-vision-smart-feeder","enabot-ebo-air-2","furbo-360-hundekamera","garmin-alpha-t-20"]) {
    assert.match(read(slug),/^rating:\s*[0-9.]+$/m);
    assert.match(read(slug),/^ratings:\s*(?:\{[^\n]*\})?\s*$/m);
  }
});

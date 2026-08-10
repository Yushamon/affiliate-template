import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const r=(p)=>fs.readFileSync(path.join(app,p),"utf8");

const targets=[
  "src/content/products/petkit-yumshare-dual-hopper.md",
  "src/content/products/catit-pixi-vision-smart-feeder.md",
  "src/content/products/xiaomi-smart-pet-food-feeder-2.md",
  "src/content/products/xiaomi-smart-pet-fountain-2.md"
];

test("Batch 2 befüllt vier Produkte",()=>{
  for(const p of targets) assert.match(r(p),/^externalEvidence:\s*$/m);
});

test("schwache Evidenz wird nicht hochgestuft",()=>{
  assert.match(r(targets[0]),/Nutzerstichprobe ist zu klein/);
  assert.match(r(targets[1]),/fehlt weiterhin ein belastbarer unabhängiger Hands-on-Test/);
  assert.match(r(targets[2]),/nur einer\s+Bewertungsplattform/);
  assert.match(r(targets[3]),/kein Beleg für einen generellen Serienfehler/);
});

test("plattformweite und nicht produktspezifische Werte sind markiert",()=>{
  assert.match(r(targets[1]),/Catit-App insgesamt/);
});

test("redaktionelle PfotenTechnik-Ratings bleiben unverändert",()=>{
  assert.match(r(targets[0]),/^rating: 4\.8$/m);
  assert.match(r(targets[1]),/^rating: 4\.5$/m);
  assert.match(r(targets[2]),/^rating: 4\.6$/m);
  assert.match(r(targets[3]),/^rating: 4\.7$/m);
});

test("Hands-on wird nur dort behauptet wo belegt",()=>{
  assert.doesNotMatch(r(targets[0]),/methodology: "hands-on"/);
  assert.doesNotMatch(r(targets[1]),/methodology: "hands-on"/);
  assert.doesNotMatch(r(targets[2]),/methodology: "hands-on"/);
  assert.match(r(targets[3]),/methodology: "hands-on"/);
});

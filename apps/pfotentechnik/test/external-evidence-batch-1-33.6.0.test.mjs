import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=(p)=>fs.readFileSync(path.join(app,p),"utf8");

const files=[
  "src/content/products/pawsync-smart-pet-feeder.md",
  "src/content/products/petlibro-granary-camera-feeder.md",
  "src/content/products/tractive-dog-6.md",
  "src/content/products/weenect-xs.md"
];

test("Batch 1 enthält strukturierte externe Evidenz",()=>{
  for(const p of files){
    const s=read(p);
    assert.match(s,/^externalEvidence:\s*$/m);
    assert.match(s,/^\s+professionalReviews:\s*$/m);
    assert.match(s,/^\s+userReviews:\s*$/m);
    assert.match(s,/^\s+consensus:\s*$/m);
  }
});

test("keine fremden Ratings werden als PfotenTechnik-Score umgeschrieben",()=>{
  const paw=read(files[0]);
  const pet=read(files[1]);
  const tra=read(files[2]);
  const wee=read(files[3]);
  assert.match(paw,/rating: 4\.6/);
  assert.match(pet,/rating: 4\.6/);
  assert.match(tra,/rating: 4\.6/);
  assert.match(wee,/rating: 4\.6/);
  assert.match(paw,/reviewCount: 139/);
  assert.match(pet,/reviewCount: 49/);
  assert.match(tra,/reviewCount: 58630/);
  assert.match(wee,/reviewCount: 22470/);
});

test("markenweite Trustpilot-Daten sind ausdrücklich gekennzeichnet",()=>{
  assert.match(read(files[2]),/markenweit und nicht DOG-6-spezifisch/);
  assert.match(read(files[3]),/Weenect insgesamt und nicht ausschließlich auf das XS-Modell/);
});

test("professionelle Quellen sind direkt verlinkt",()=>{
  assert.match(read(files[0]),/reviewed\.com\/pets\/content\/pawsync-smart-pet-feeder-review/);
  assert.match(read(files[1]),/tomsguide\.com\/home\/my-cats-tested-this-smart-pet-feeder/);
  assert.match(read(files[2]),/chip\.de\/test\/Tractive-Dog-6-Hundetracker-im-Test/);
  assert.match(read(files[3]),/heise\.de\/bestenlisten\/testbericht\/weenect-xs-2024-im-test/);
});

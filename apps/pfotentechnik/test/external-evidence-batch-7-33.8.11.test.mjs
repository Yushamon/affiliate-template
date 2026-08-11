import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=(slug)=>fs.readFileSync(path.join(app,"src/content/products",slug+".md"),"utf8");

test("Weenect XT besitzt unabhängige Tests und klar markiertes markenweites Nutzersignal",()=>{
  const s=read("weenect-xt");
  assert.ok(s.includes("chip.de/test/Weenect-XT-Hundetracker"));
  assert.ok(s.includes("dogorama.app/de-de/tests"));
  assert.ok(s.includes('scope: "brand-wide"'));
  assert.ok(s.includes("reviewCount: 22470"));
  assert.ok(s.includes("consensus:"));
});

test("Space enthält zwei Hands-on-Reviews und bleibt constrained",()=>{
  const s=read("petlibro-space-smart-feeder");
  assert.ok(s.includes("reviewed.com/pets/content/petlibro-vacuum"));
  assert.ok(s.includes("mic.com/shopping/petlibro-space"));
  assert.ok(s.includes("userReviews: []"));
  assert.ok(s.includes('researchStatus: "constrained"'));
});

test("Glacier dokumentiert Sponsoring und zu kleine Nutzerbasis",()=>{
  const s=read("petlibro-glacier-ultrafiltration");
  assert.ok(s.includes("floppycats.com/pet-water-fountain"));
  assert.ok(s.includes("Review-Gebühr"));
  assert.ok(s.includes("reviewCount: 1"));
  assert.ok(s.includes('researchStatus: "constrained"'));
});

test("vorherige constrained-Fälle bleiben erhalten",()=>{
  for(const slug of ["oneisall-2-in-1-feeder-water","oneisall-7l-dog-water-fountain","cat-mate-shell-fountain"]) {
    assert.ok(read(slug).includes('researchStatus: "constrained"'));
  }
});

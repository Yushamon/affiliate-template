import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=(slug)=>fs.readFileSync(path.join(app,"src/content/products",slug+".md"),"utf8");

test("vier WATCH-Produkte besitzen vollständige Evidence-Bausteine",()=>{
  for(const slug of ["catit-pixi-smart-6-meal-feeder","cat-mate-c300","petlibro-air-automatic-feeder","petlibro-one-rfid-smart-feeder"]) {
    const s=read(slug);
    assert.ok(s.includes("professionalReviews:"));
    assert.ok(s.includes("userReviews:"));
    assert.ok(s.includes("consensus:"));
    assert.ok(s.includes("publisher:"));
    assert.ok(s.includes("platform:"));
    assert.ok(s.includes("finding:"));
  }
});

test("Catit kennzeichnet incentivierte Chewy-Basis",()=>{
  const s=read("catit-pixi-smart-6-meal-feeder");
  assert.ok(s.includes("kostenlos bereitgestelltes Produkt"));
});

test("C300 nutzt Hands-on und große Nutzerbasis",()=>{
  const s=read("cat-mate-c300");
  assert.ok(s.includes("katzen-fieber.de/cat-mate-c300"));
  assert.ok(s.includes("reviewCount: 202"));
});

test("PETLIBRO Air nutzt mehrere unabhängige Signale",()=>{
  const s=read("petlibro-air-automatic-feeder");
  assert.ok(s.includes("catfooddispensersreviews.com/petlibro-air"));
  assert.ok(s.includes("thesprucepets.com/best-cat-bowls"));
  assert.ok(s.includes("reviewCount: 1312"));
});

test("One RFID nutzt WIRED und produktspezifische Nutzerbasis",()=>{
  const s=read("petlibro-one-rfid-smart-feeder");
  assert.ok(s.includes("wired.com/gallery/best-automatic-cat-feeders"));
  assert.ok(s.includes("shop.app/products/7400288813103"));
});

test("zwei Produkte bleiben bewusst partial",()=>{
  for(const slug of ["oneisall-7l-dog-water-fountain","cat-mate-shell-fountain"]) {
    const s=read(slug);
    assert.ok(s.includes("professionalReviews: []"));
    assert.ok(s.includes("userReviews:"));
    assert.ok(s.includes("consensus: []"));
  }
});

test("Oneisall constrained bleibt unangetastet",()=>{
  const s=read("oneisall-2-in-1-feeder-water");
  assert.ok(s.includes('researchStatus: "constrained"'));
});

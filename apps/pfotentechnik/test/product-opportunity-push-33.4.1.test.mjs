import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const r=(p)=>fs.readFileSync(path.join(app,p),"utf8");

test("YumShare nutzt aktuelle konkrete Backup-Angabe",()=>{
  const s=r("src/content/products/petkit-yumshare-solo-2.md");
  assert.ok(s.includes("fünf AAA-Alkaline-Batterien"));
  assert.ok(s.includes("bis zu 14 Tage"));
  assert.ok(!s.includes("widersprüchliche Herstellerangaben zur Backup-Batterie"));
  assert.ok(!s.includes("widersprüchliche Angaben"));
  assert.ok(!s.includes("Batterieart ist auf der aktuellen Produktseite widersprüchlich dokumentiert"));
});

test("Eversweet trennt filterlos von verbrauchsmaterialfrei",()=>{
  const s=r("src/content/products/petkit-eversweet-ultra.md");
  assert.ok(s.includes("ohne klassischen Hauptfilter"));
  assert.ok(s.includes("Vollständig verbrauchsmaterialfrei"));
  assert.ok(s.includes("ungefähr alle 30 Tage"));
});

test("Polar trennt 72-Stunden-Frische und 12-Stunden-Backup",()=>{
  const s=r("src/content/products/petlibro-polar-wet-food-feeder.md");
  assert.ok(s.includes("72-Stunden-Angabe"));
  assert.ok(s.includes("12-Stunden-Batterie-Backup"));
  assert.ok(s.includes("fortgesetzte aktive Kühlung"));
});

test("keine neue Testbehauptung",()=>{
  for(const p of [
    "src/content/products/petkit-yumshare-solo-2.md",
    "src/content/products/petkit-eversweet-ultra.md",
    "src/content/products/petlibro-polar-wet-food-feeder.md"
  ]){
    const s=r(p);
    assert.ok(s.includes("kein eigener") || s.includes("kein eigener Langzeit"));
  }
});

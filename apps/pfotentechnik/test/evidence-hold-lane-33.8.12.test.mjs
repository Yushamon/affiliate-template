import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=(slug)=>fs.readFileSync(path.join(app,"src/content/products",slug+".md"),"utf8");
const queue=fs.readFileSync(path.join(app,"scripts/product-evidence/research-queue.mjs"),"utf8");

test("HoneyGuardian A68 dokumentiert die Evidenzlücke statt Quellen zu erfinden",()=>{
  const s=read("honeyguardian-a68");
  assert.ok(s.includes("professionalReviews: []"));
  assert.ok(s.includes("userReviews: []"));
  assert.ok(s.includes("consensus: []"));
  assert.ok(s.includes('researchStatus: "constrained"'));
  assert.ok(s.includes("kein belastbarer unabhängiger professioneller Produkttest"));
});

test("PAWBBY dokumentiert die unsichere Modellidentität",()=>{
  const s=read("pawbby-smart-pet-feeder");
  assert.ok(s.includes('researchStatus: "constrained"'));
  assert.ok(s.includes("Xiaomi/Mijia XWPF01MG"));
  assert.ok(s.includes("Kamera- und Regionalvarianten"));
});

test("constrained besitzt eine eigene HOLD-Lane",()=>{
  assert.ok(queue.includes('if (ev.researchStatus === "constrained") return "HOLD";'));
  assert.ok(queue.includes("HOLD:2"));
  assert.ok(queue.includes('hold:products.filter((p)=>p.lane==="HOLD").length'));
});

test("aktive WATCH- und NOW-Regeln bleiben getrennt erhalten",()=>{
  assert.ok(queue.includes('return "NOW"'));
  assert.ok(queue.includes('return "WATCH"'));
  assert.ok(queue.includes('return "BACKLOG"'));
});

test("vorherige constrained-Produkte bleiben erhalten",()=>{
  for(const slug of [
    "oneisall-2-in-1-feeder-water",
    "oneisall-7l-dog-water-fountain",
    "cat-mate-shell-fountain",
    "petlibro-space-smart-feeder",
    "petlibro-glacier-ultrafiltration"
  ]) {
    assert.ok(read(slug).includes('researchStatus: "constrained"'), slug);
  }
});

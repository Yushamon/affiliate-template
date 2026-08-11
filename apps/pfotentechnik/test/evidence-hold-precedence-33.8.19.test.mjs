#!/usr/bin/env node
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const queue = path.join(app, "scripts/product-evidence/research-queue.mjs");
const report = path.join(app, "reports/product-evidence/research-queue.json");

const known = [
  "cat-mate-335-pet-fountain",
  "devoko-90l-automatisches-katzenklo",
  "garmin-alpha-tt-25",
  "honeyguardian-a305d",
  "honeyguardian-smart-pet-feeder-s305d",
  "neakasa-m1-lite",
  "oneisall-2-2l-cordless-fountain"
];

const run = (lane) => {
  const r = spawnSync(process.execPath,[queue,"--limit=100","--lane="+lane],{
    cwd:app,encoding:"utf8"
  });
  assert.equal(r.status,0,(r.stderr||"")+"\n"+(r.stdout||""));
  return JSON.parse(fs.readFileSync(report,"utf8"));
};

test("Scanner liest constrained als direktes Kind von externalEvidence", () => {
  const s=fs.readFileSync(queue,"utf8");
  assert.match(s,/const externalEvidenceFlags =/);
  assert.match(s,/trimmed.*constrained/);
  assert.match(s,/ev\.constrained === true/);
});

test("bekannte Produktdateien tragen constrained true", () => {
  for (const slug of known) {
    const file=path.join(app,"src/content/products",slug+".md");
    assert.ok(fs.existsSync(file),slug+" fehlt");
    const raw=fs.readFileSync(file,"utf8");
    assert.match(raw,/externalEvidence:\s*[\s\S]*?\n\s+constrained:\s*true/,slug+" ist nicht constrained");
  }
});

test("BACKLOG enthält keinen bekannten constrained Fall", () => {
  const d=run("BACKLOG");
  const slugs=new Set((d.products||[]).map(p=>p.slug));
  for(const slug of known) assert.ok(!slugs.has(slug),slug+" darf nicht im BACKLOG stehen");
});

test("HOLD enthält alle bekannten constrained Fälle auch ohne Impressionen", () => {
  const d=run("HOLD");
  const slugs=new Set((d.products||[]).map(p=>p.slug));
  for(const slug of known) assert.ok(slugs.has(slug),slug+" muss in HOLD stehen");
});

test("Lane-Zähler melden HOLD separat", () => {
  const d=run("HOLD");
  assert.ok(Number(d.counts?.hold) >= known.length,"HOLD-Zähler ist zu klein");
});

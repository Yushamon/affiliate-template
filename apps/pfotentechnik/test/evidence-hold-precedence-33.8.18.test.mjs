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
  const r = spawnSync(process.execPath,[queue,"--limit=100","--lane="+lane],{cwd:app,encoding:"utf8"});
  assert.equal(r.status,0,r.stderr||r.stdout);
  return JSON.parse(fs.readFileSync(report,"utf8"));
};

test("Queue liest externalEvidence.constrained true", () => {
  const s=fs.readFileSync(queue,"utf8");
  assert.match(s,/explicitConstrained/);
  assert.match(s,/constrained:\\\\s\*\(true\|yes\|1\)/);
});

test("Cat Mate 335 ist im Repository explizit constrained", () => {
  const p=fs.readFileSync(path.join(app,"src/content/products/cat-mate-335-pet-fountain.md"),"utf8");
  assert.match(p,/externalEvidence:\s*[\s\S]*?\n\s+constrained:\s*true/);
});

test("bekannte constrained Fälle fehlen im BACKLOG", () => {
  const d=run("BACKLOG");
  const slugs=new Set((d.products||[]).map(p=>p.slug));
  for(const slug of known) assert.ok(!slugs.has(slug),slug+" darf nicht im BACKLOG stehen");
});

test("bekannte constrained Fälle stehen in HOLD", () => {
  const d=run("HOLD");
  const slugs=new Set((d.products||[]).map(p=>p.slug));
  for(const slug of known) assert.ok(slugs.has(slug),slug+" muss in HOLD stehen");
});

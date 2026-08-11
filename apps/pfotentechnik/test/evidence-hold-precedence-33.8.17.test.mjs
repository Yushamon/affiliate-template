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
const constrainedSlugs = [
  "cat-mate-335-pet-fountain",
  "devoko-90l-automatisches-katzenklo",
  "garmin-alpha-tt-25",
  "honeyguardian-a305d",
  "honeyguardian-smart-pet-feeder-s305d",
  "neakasa-m1-lite",
  "oneisall-2-2l-cordless-fountain"
];

const run = (lane) => {
  const r = spawnSync(process.execPath, [queue, "--limit=100", "--lane="+lane], {cwd:app, encoding:"utf8"});
  assert.equal(r.status, 0, r.stderr || r.stdout);
  return JSON.parse(fs.readFileSync(report,"utf8"));
};

test("evidence() erzeugt ein echtes constrained-Flag aus dem gesamten Frontmatter", () => {
  const s=fs.readFileSync(queue,"utf8");
  assert.match(s, /const constrained = researchStatus === "constrained"/);
  assert.match(s, /raw\.match\(\/\^\\s\*researchStatus:/);
});

test("HOLD hat vor der Prüfung auf fehlende Impressionen Vorrang", () => {
  const s=fs.readFileSync(queue,"utf8");
  const hold=s.indexOf('if (ev.constrained || ev.researchStatus === "constrained") return "HOLD"');
  const backlog=s.indexOf('if (!hasSearch) return "BACKLOG"');
  assert.ok(hold >= 0 && backlog > hold);
});

test("bekannte constrained Fälle stehen nicht im BACKLOG", () => {
  const data=run("BACKLOG");
  const slugs=new Set((data.products||[]).map((p)=>p.slug));
  for(const slug of constrainedSlugs) assert.ok(!slugs.has(slug), slug+" darf nicht im BACKLOG stehen");
});

test("bekannte constrained Fälle stehen auch ohne Impressionen in HOLD", () => {
  const data=run("HOLD");
  const slugs=new Set((data.products||[]).map((p)=>p.slug));
  for(const slug of constrainedSlugs) assert.ok(slugs.has(slug), slug+" muss in HOLD stehen");
});

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

const expectedHold = [
  "cat-mate-335-pet-fountain",
  "devoko-90l-automatisches-katzenklo",
  "garmin-alpha-tt-25",
  "honeyguardian-a305d",
  "honeyguardian-smart-pet-feeder-s305d",
  "neakasa-m1-lite",
  "oneisall-2-2l-cordless-fountain"
];

const run = (lane) => {
  const r = spawnSync(process.execPath, [queue, "--limit=100", "--lane="+lane], {
    cwd: app,
    encoding: "utf8"
  });
  assert.equal(r.status, 0, (r.stderr || "") + "\n" + (r.stdout || ""));
  return JSON.parse(fs.readFileSync(report, "utf8"));
};

test("Queue normalisiert alle drei constrained-Schreibweisen", () => {
  const s = fs.readFileSync(queue, "utf8");
  assert.match(s, /constrained\s*===\s*true/);
  assert.match(s, /status\s*===\s*"constrained"/);
  assert.match(s, /researchStatus\s*===\s*"constrained"/);
});

test("S305D nutzt repositorykonform status constrained", () => {
  const f = path.join(app, "src/content/products/honeyguardian-smart-pet-feeder-s305d.md");
  const raw = fs.readFileSync(f, "utf8");
  assert.match(raw, /externalEvidence:\s*[\s\S]*?\n\s+status:\s*constrained\b/);
});

test("BACKLOG enthält keinen erwarteten HOLD-Fall", () => {
  const d = run("BACKLOG");
  const slugs = new Set((d.products || []).map((p) => p.slug));
  for (const slug of expectedHold) {
    assert.ok(!slugs.has(slug), slug + " darf nicht im BACKLOG stehen");
  }
});

test("HOLD enthält alle erwarteten constrained Fälle", () => {
  const d = run("HOLD");
  const slugs = new Set((d.products || []).map((p) => p.slug));
  for (const slug of expectedHold) {
    assert.ok(slugs.has(slug), slug + " muss in HOLD stehen");
  }
});

test("HOLD bleibt unabhängig von GSC-Impressionen", () => {
  const d = run("HOLD");
  const target = (d.products || []).find((p) => p.slug === "honeyguardian-smart-pet-feeder-s305d");
  assert.ok(target, "S305D fehlt in HOLD");
  assert.equal(target.lane, "HOLD");
});

test("HOLD count ist konsistent", () => {
  const d = run("HOLD");
  assert.equal(Number(d.counts?.hold), (d.productsAll || d.allProducts || d.products || []).filter?.((p) => p.lane === "HOLD")?.length ?? Number(d.counts?.hold));
  assert.ok(Number(d.counts?.hold) >= expectedHold.length);
});

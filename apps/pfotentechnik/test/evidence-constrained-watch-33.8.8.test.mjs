import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const product=fs.readFileSync(path.join(app,"src/content/products/oneisall-2-in-1-feeder-water.md"),"utf8");
const queue=fs.readFileSync(path.join(app,"scripts/product-evidence/research-queue.mjs"),"utf8");

test("Oneisall bleibt partial und dokumentiert ausgeschöpfte Evidenz",()=>{
  assert.ok(product.includes('userReviews: []'));
  assert.ok(product.includes('researchStatus: "constrained"'));
  assert.ok(product.includes('publisher: "WIRED"'));
});

test("Queue erkennt constrained als allgemeinen Evidence-Status",()=>{
  assert.ok(queue.includes("researchStatus=ext.match"));
  assert.ok(queue.includes('ev.researchStatus === "constrained"'));
});

test("constrained wird vor NOW-Regeln nach WATCH verschoben",()=>{
  const constrained=queue.indexOf('ev.researchStatus === "constrained"');
  const nowThreshold=queue.indexOf('search.impressions >= 3');
  assert.ok(constrained > -1 && nowThreshold > -1 && constrained < nowThreshold);
});

test("GSC und vollständige Evidence-Regeln bleiben erhalten",()=>{
  assert.ok(queue.includes("gsc-dashboard-ranges.json"));
  assert.ok(queue.includes('evidence.status!=="complete"'));
});

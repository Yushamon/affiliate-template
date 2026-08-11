import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const s=fs.readFileSync(path.join(app,"scripts/product-evidence/research-queue.mjs"),"utf8");

test("Queue besitzt NOW WATCH BACKLOG",()=>{assert.ok(s.includes("classifyLane"));assert.ok(s.includes('"NOW"'));assert.ok(s.includes('"WATCH"'));assert.ok(s.includes('"BACKLOG"'));});
test("BACKLOG bekommt Score 0",()=>assert.ok(s.includes('const total=lane==="BACKLOG"?0:rawTotal;')));
test("ohne Impressionen ist Confidence 0",()=>{assert.ok(s.includes('i>=1?.35:0;'));assert.ok(!s.includes('i>=1?.35:.2;'));});
test("CLI kann Lane filtern",()=>{assert.ok(s.includes("--lane"));assert.ok(s.includes('laneArg==="ALL"'));});
test("vollständige Evidence-Produkte bleiben ausgeschlossen",()=>assert.ok(s.includes('evidence.status!=="complete"')));
test("nur GSC priorisiert Search",()=>{assert.ok(s.includes("gsc-dashboard-ranges.json"));assert.ok(!s.includes("search-dashboard-ranges.json"));assert.ok(!s.includes("bing-dashboard"));});

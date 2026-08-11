import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=(slug)=>fs.readFileSync(path.join(app,"src/content/products",slug+".md"),"utf8");

test("bewusst partielle Batch-6-Produkte sind constrained",()=>{
  for(const slug of ["oneisall-7l-dog-water-fountain","cat-mate-shell-fountain"]) {
    const s=read(slug);
    assert.ok(s.includes("professionalReviews: []"));
    assert.ok(s.includes("userReviews:"));
    assert.ok(s.includes("consensus: []"));
    assert.ok(s.includes('researchStatus: "constrained"'));
    assert.ok(s.includes('researchCheckedAt: "2026-08-11"'));
  }
});

test("Oneisall 2-in-1 bleibt ebenfalls constrained",()=>{
  assert.ok(read("oneisall-2-in-1-feeder-water").includes('researchStatus: "constrained"'));
});

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=(p)=>fs.readFileSync(path.join(app,p),"utf8");
const xl="src/content/products/tractive-dog-6-xl.md";
const one="src/content/products/oneisall-3-5l-cordless-fountain.md";

test("Batch 3 befüllt die letzten zwei Produkte der ersten Research-Queue",()=>{
  assert.match(read(xl),/^externalEvidence:\s*$/m);
  assert.match(read(one),/^externalEvidence:\s*$/m);
});

test("DOG 6 XL wird nicht fälschlich als hands-on getestet dargestellt",()=>{
  const s=read(xl);
  assert.doesNotMatch(s,/methodology: "hands-on"/);
  assert.match(s,/kein Langzeit- oder Hands-on-Test/);
  assert.match(s,/Plattformwert\s+selbst ist aber nicht produktspezifisch/);
});

test("Oneisall Kooperation ist transparent gekennzeichnet",()=>{
  const s=read(one);
  assert.match(s,/in Kooperation mit Oneisall erstellt und vergütet/);
  assert.match(s,/nicht wie ein vollständig\s+unbeeinflusster redaktioneller Test gewichtet/);
});

test("PfotenTechnik-Ratings bleiben unverändert",()=>{
  assert.match(read(xl),/^rating: 4\.6$/m);
  assert.match(read(one),/^rating: 4\.5$/m);
});

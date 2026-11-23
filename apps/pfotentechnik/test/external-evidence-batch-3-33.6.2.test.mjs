import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import yaml from "js-yaml";
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
  const s=read(xl), data=yaml.load(s.match(/^---\s*\n([\s\S]*?)\n---/)[1]);
  assert.equal(data.testStatus,'manufacturer-data');
  assert.notEqual(data.editorial?.testedHandsOn,true);
  assert.match(s,/kein eigener Praxis- oder Langzeittest/);
  const launch=data.externalEvidence.professionalReviews.find(r=>r.publisher==='The Verge');
  assert.equal(launch.methodology,'editorial-review');
  assert.match(JSON.stringify(launch),/kein Langzeit- oder Hands-on-Test/);
  const measured=data.externalEvidence.professionalReviews.find(r=>r.publisher==='CHIP');
  assert.equal(measured.methodology,'lab-test');
  assert.match(measured.url,/^https:\/\/www\.chip\.de\//);
  assert.match(data.externalEvidence.note,/Kein eigener PfotenTechnik-Praxistest/);
  assert.match(data.externalEvidence.note,/keine Übernahme fremder Noten/);
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

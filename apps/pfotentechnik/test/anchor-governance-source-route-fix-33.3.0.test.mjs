import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const audit=fs.readFileSync(path.join(app,"scripts/audit-anchor-governance.mjs"),"utf8");

test("Anchor Governance validiert Source-Routen",()=>{
  assert.match(audit,/collectContentRoutes\(path\.join\(app, "src\/content\/pages"\), "\/"\)/);
  assert.match(audit,/collectContentRoutes\(path\.join\(app, "src\/content\/comparisons"\), "\/vergleiche\/"\)/);
  assert.match(audit,/walkDist\(dist\)/);
});

test("dist ist nur Zusatzsignal",()=>{
  const sourcePos=audit.indexOf('collectContentRoutes(path.join(app, "src/content/pages")');
  const distPos=audit.indexOf("walkDist(dist)");
  assert.ok(sourcePos>=0 && distPos>sourcePos);
});

test("bestehende Governance-Prüfungen bleiben",()=>{
  for(const code of ["ANCHOR_TARGET_REDIRECT","ANCHOR_TARGET_MISSING","ANCHOR_PRIORITY_INVALID","ANCHOR_OVERLAP_CONFLICT"])
    assert.match(audit,new RegExp(code));
});

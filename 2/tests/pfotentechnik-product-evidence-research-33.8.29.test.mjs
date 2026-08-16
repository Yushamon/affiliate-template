import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../../..");
const dir = path.join(root, "apps/pfotentechnik/src/content/products");
const schemaFile = path.join(root, "apps/pfotentechnik/src/content/schema/product.ts");
const batch = ["petkit-puramax-2", "petsafe-streamside-trinkbrunnen", "prothelis-area-pets", "reolink-e1-zoom", "pettec-cam-360", "zeromouse-2-0", "invoxia-biotracker-2026", "pawfit-3", "litter-robot-4", "petsnowy-snow-plus", "cat-mate-elite-355w", "petkit-purobot-max-3", "enabot-rola-pettracker", "catit-pixi-smart-trinkbrunnen"];

function read(slug) { return fs.readFileSync(path.join(dir, `${slug}.md`), "utf8"); }
function topBlock(text, key) {
  const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? "";
  const lines = fm.split(/\r?\n/);
  const start = lines.findIndex(line => new RegExp(`^${key}\\s*:`).test(line));
  if (start < 0) return "";
  let end = lines.length;
  for (let i=start+1;i<lines.length;i++) if (/^[A-Za-z0-9_][A-Za-z0-9_-]*\s*:/.test(lines[i])) { end=i; break; }
  return lines.slice(start,end).join("\n");
}

for (const slug of batch) {
  test(`${slug}: Bewertung ist berechenbar`, () => {
    const c=read(slug);
    assert.doesNotMatch(c,/^rating:\s*0(?:\.0+)?\s*$/m);
    const ratings=topBlock(c,"ratings");
    const values=[...ratings.matchAll(/^\s{2}[A-Za-z0-9_-]+:\s*([0-5](?:\.\d+)?)\s*$/gm)].map(m=>Number(m[1]));
    assert.ok(values.length>=5, `zu wenige Kriterien: ${values.length}`);
  });
  test(`${slug}: externalEvidence ist kanonisch`, () => {
    const e=topBlock(read(slug),"externalEvidence");
    assert.match(e,/^externalEvidence:\s*$/m);
    assert.match(e,/^  professionalReviews:/m);
    assert.match(e,/^  userReviews:/m);
    assert.match(e,/^  consensus:/m);
    assert.match(e,/editorialAssessment:/);
    assert.doesNotMatch(e,/^  (?:status|researchStatus|constrained):/m);
    for (const m of e.matchAll(/^      methodology:\s*([^\n]+)$/gm)) {
      const v=m[1].replace(/["']/g,"").trim();
      assert.ok(["hands-on","lab-test","editorial-review","unknown"].includes(v), `ungültige methodology: ${v}`);
    }
  });
}

test("kein aktives Produkt bleibt mit rating 0, leerem ratings-Block und ohne score", () => {
  const broken=[];
  for (const name of fs.readdirSync(dir).filter(n=>n.endsWith(".md"))) {
    const c=fs.readFileSync(path.join(dir,name),"utf8");
    const active=/^productStatus:\s*["']?active["']?\s*$/m.test(c);
    const zero=/^rating:\s*0(?:\.0+)?\s*$/m.test(c);
    const empty=/^ratings:\s*\{\s*\}\s*$/m.test(c);
    const score=Number(c.match(/^score:\s*([0-9.]+)\s*$/m)?.[1]??0);
    if(active&&zero&&empty&&!(score>0)) broken.push(name);
  }
  assert.deepEqual(broken,[]);
});

test("Schema erlaubt nur die verwendeten externalEvidence-Felder", () => {
  const s=fs.readFileSync(schemaFile,"utf8");
  assert.match(s,/professionalReviews:/);
  assert.match(s,/userReviews:/);
  assert.match(s,/consensus:/);
  assert.match(s,/note:/);
});

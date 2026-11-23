import {readBeforeEvidence} from '../product-evidence/approved-changes.mjs';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const app=fileURLToPath(new URL('../../',import.meta.url));
export function approvedFreshnessChanges(){
 const dir=path.join(app,'research/product-freshness-36.0');
 if(!fs.existsSync(path.join(dir,'changes.json')))return new Map();
 const records=[...JSON.parse(fs.readFileSync(path.join(dir,'changes.json'))).products,...JSON.parse(fs.readFileSync(path.join(dir,'page-changes.json')))];
 const protectedRoutes=JSON.parse(fs.readFileSync(path.join(app,'research/product-integration-35.8/baseline.json'))).routes;
 return new Map(records.map(r=>{
  assert.match(r.file,/^src\/content\/(products|comparisons|pages)\/[a-z0-9-]+\.md$/);
  const route=r.file.includes('/products/')?`/produkt/${r.slug}/`:r.file.includes('/comparisons/')?`/vergleiche/${path.basename(r.file,'.md')}/`:`/${path.basename(r.file,'.md')}/`;
  assert.ok(!protectedRoutes.includes(route),'36.0 darf 35.5 nicht ausnehmen: '+route);
  assert.equal(createHash('sha256').update(readBeforeEvidence(path.join(app,r.file))).digest('hex'),r.afterSha256,r.file+': Änderung entspricht nicht dem geprüften Umfang');
  return [r.file,r];
 }));
}

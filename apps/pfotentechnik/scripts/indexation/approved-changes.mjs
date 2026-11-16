import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {app,sha} from './scan.mjs';
export function approvedIndexationChanges(){
 const file=path.join(app,'research/indexation-improvements-36.1/changes.json');if(!fs.existsSync(file))return new Map();
 const protectedRoutes=JSON.parse(fs.readFileSync(path.join(app,'research/product-integration-35.8/baseline.json'))).routes;
 return new Map(JSON.parse(fs.readFileSync(file)).changes.filter(r=>r.status==='implemented').map(r=>{
  assert.match(r.file,/^src\/content\/pages\/[a-z0-9-]+\.md$/);assert.equal(r.route,`/${path.basename(r.file,'.md')}/`);assert.ok(!protectedRoutes.includes(r.route));
  for(const target of r.addedTargets)assert.ok(!protectedRoutes.includes(target));
  assert.equal(sha(fs.readFileSync(path.join(app,r.file))),r.afterSha256,r.file+': außerhalb des geprüften 36.1-Umfangs');
  return [r.file,r];
 }));
}

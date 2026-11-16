import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import yaml from 'js-yaml';import {gunzipSync} from 'node:zlib';
import {app,sha} from './scan.mjs';import {changes} from './changes.mjs';
const root=path.join(app,'research/indexation-improvements-36.1'),target=path.join(root,'changes.json'),originalsFile=path.join(root,'originals.json');
const before=JSON.parse(gunzipSync(fs.readFileSync(path.join(root,'baseline.json.gz'))));
const protectedRoutes=new Set(JSON.parse(fs.readFileSync(path.join(app,'research/product-integration-35.8/baseline.json'))).routes);
const previous=fs.existsSync(target)?JSON.parse(fs.readFileSync(target)).changes:[];
const originals=fs.existsSync(originalsFile)?JSON.parse(fs.readFileSync(originalsFile)):{};
const records=[];
for(const c of changes){
 const file=`src/content/pages/${c.slug}.md`,full=path.join(app,file),current=fs.readFileSync(full,'utf8');
 assert.ok(!protectedRoutes.has(`/${c.slug}/`));
 const old=before.sources.find(s=>s.file===file);assert.ok(old,file);originals[file]??=current;assert.equal(sha(originals[file]),old.sha256,file+': Original');
 assert.ok([old.sha256,previous.find(r=>r.file===file)?.afterSha256].includes(sha(current)),file+': parallele Inhaltsänderung; kein Überschreiben');
 let after=originals[file];assert.equal(after.split(c.marker).length,2,c.slug+': eindeutige Einfügestelle');
 if(c.replace){assert.equal(after.split(c.replace.before).length,2);after=after.replace(c.replace.before,c.replace.after)}
 after=after.replace(c.marker,c.addition+'\n\n'+c.marker).replace(/^updatedAt:.*$/m,'updatedAt: "2026-11-16"');
 const parse=s=>yaml.load(s.match(/^---\s*\n([\s\S]*?)\n---/)[1],{schema:yaml.JSON_SCHEMA});const oldData=parse(originals[file]),newData=parse(after);const {updatedAt:a,...x}=oldData,{updatedAt:b,...y}=newData;assert.deepEqual(x,y,file+': nur Inhalt und tatsächliches Änderungsdatum');
 const addedTargets=[...c.addition.matchAll(/\]\((\/[^)]+)\)/g)].map(m=>m[1]);for(const route of addedTargets){assert.ok(!protectedRoutes.has(route));assert.ok(before.pages.some(p=>p.route===route),route+': Ziel muss existieren')}
 records.push({file,route:`/${c.slug}/`,beforeSha256:old.sha256,afterSha256:sha(after),reason:c.reason,addition:c.addition,replacement:c.replace??null,addedTargets,evidence:c.evidence,status:'implemented'});
 if(process.argv.includes('--write'))fs.writeFileSync(full,after);
}
if(process.argv.includes('--write')){fs.writeFileSync(originalsFile,JSON.stringify(originals,null,2)+'\n');fs.writeFileSync(target,JSON.stringify({version:'36.1',changes:records},null,2)+'\n')}
console.log(JSON.stringify({write:process.argv.includes('--write'),files:records.length,contextLinks:records.reduce((n,r)=>n+r.addedTargets.length,0)},null,2));

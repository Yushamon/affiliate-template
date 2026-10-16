import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
import {googleStatus,statusForUrl,compareSnapshots,readCoverage} from '../scripts/seo/indexing-recovery.mjs';
const domain='https://pfotentechnik.de';
const row=(url,status)=>({url:domain+url,status,pageType:'product',prioritized:true});
const snapshot=(rows,hash='same')=>({generatedAt:'2026-10-16',coverage:{sha256:hash},observations:rows,inventory:rows.map(r=>({...r,googleStatus:r.status}))});
test('German and English Google statuses normalize without inventing indexed observations',()=>{
  assert.equal(googleStatus('Gecrawlt\u00a0– zurzeit nicht indexiert'),'crawled-not-indexed');
  assert.equal(googleStatus('Discovered - currently not indexed'),'discovered-not-indexed');
  assert.equal(googleStatus('Indexiert'),'indexed');assert.equal(googleStatus('URL is on Google'),'indexed');
  for(const value of ['HTTP 200','in sitemap','not indexed','Excluded by noindex','unknown','Indexed?'])assert.equal(googleStatus(value),'unknown');
});
test('absence of an export URL or an impression is not an indexing confirmation',()=>{
  assert.equal(statusForUrl(domain+'/a/',[{url:domain+'/b/',status:'indexed',impressions:20}]).status,'unknown');
});
test('www, slash and historical variants never transfer their Google status to the current canonical',()=>{
  const rows=[{url:'https://www.pfotentechnik.de/a',status:'crawled-not-indexed'}];
  assert.equal(statusForUrl(domain+'/a/',rows).status,'unknown');assert.equal(statusForUrl(rows[0].url,rows).status,'crawled-not-indexed');
});
test('conflicting observations remain visible and unknown',()=>{
  const rows=[{url:domain+'/a/',status:'indexed'},{url:domain+'/a/',status:'crawled-not-indexed'}];
  assert.equal(statusForUrl(domain+'/a/',rows).status,'unknown');assert.equal(statusForUrl(domain+'/a/',rows).conflicting,true);
});
test('first snapshot cannot claim improvements',()=>assert.equal(compareSnapshots(null,snapshot([])).available,false));
test('equal export hashes cannot masquerade as a new Google measurement',()=>{
  const a=snapshot([row('/a/','discovered-not-indexed')]);const delta=compareSnapshots(a,a);
  assert.equal(delta.sameCoverageInput,true);assert.deepEqual(delta.changes,[]);
});
test('observed status changes are grouped by type and prioritized URL',()=>{
  const delta=compareSnapshots(snapshot([row('/a/','crawled-not-indexed')],'old'),snapshot([row('/a/','indexed')],'new'));
  assert.equal(delta.changes[0].kind,'observed-status-change');assert.equal(delta.prioritizedChanges.length,1);
  assert.equal(delta.canonicalByPageType.product.after.indexed,1);
});
test('disappearing URL is a missing observation rather than proven deindexing or indexation',()=>{
  const delta=compareSnapshots(snapshot([row('/a/','crawled-not-indexed')]),snapshot([],'new'));
  assert.equal(delta.changes[0].to,'unknown');assert.equal(delta.changes[0].kind,'observation-missing');
  assert.deepEqual(delta.buildChanges.removed,[domain+'/a/']);
});
test('CSV import handles BOM, semicolons, mixed statuses and explicit status-only exports',t=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pt-recovery-import-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  const file=path.join(dir,'coverage.csv'),out=path.join(dir,'coverage.json');
  fs.writeFileSync(file,'\ufeffURL;Status;Zuletzt gecrawlt\n'+domain+'/a/;Indexiert;2026-10-16\n'+domain+'/b/;Gefunden – zurzeit nicht indexiert;\n');
  const importer=new URL('../scripts/seo/import-gsc-coverage.py',import.meta.url).pathname;
  execFileSync('python3',[importer,'--out',out,file]);
  const parsed=readCoverage(out);assert.equal(parsed.rows[0].status,'indexed');assert.equal(parsed.rows[1].status,'discovered-not-indexed');
  assert.equal(parsed.rows[0].lastCrawledRaw,'2026-10-16');assert.equal(parsed.sources[0].count,2);assert.ok(parsed.sources[0].sha256);
  fs.writeFileSync(file,'URL\n'+domain+'/a/\n');
  assert.notEqual(spawnSync('python3',[importer,'--out',out,file]).status,0);
  execFileSync('python3',[importer,'--status','Indexiert','--out',out,file]);assert.equal(readCoverage(out).rows[0].status,'indexed');
});
test('coverage input rejects inconsistent row counts and unexpected hosts',t=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pt-recovery-invalid-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const file=path.join(dir,'input.json');
  fs.writeFileSync(file,JSON.stringify({exports:[{count:2,rows:[{url:domain+'/a/'}]}]}));assert.throws(()=>readCoverage(file),/count/);
  fs.writeFileSync(file,JSON.stringify({exports:[{count:1,rows:[{url:'https://other.example/a/'}]}]}));assert.throws(()=>readCoverage(file),/host/);
});
test('existing 162 exports remain complete and negative; no indexed count is invented',()=>{
  const input=readCoverage(new URL('../reports/google-indexing-fix/coverage-input.json',import.meta.url));
  assert.equal(input.rows.length,162);assert.equal(new Set(input.rows.map(row=>row.url)).size,162);
  assert.equal(input.rows.filter(row=>row.status==='crawled-not-indexed').length,84);
  assert.equal(input.rows.filter(row=>row.status==='discovered-not-indexed').length,78);
  assert.equal(input.rows.filter(row=>row.status==='indexed').length,0);
});

import {isAdvisorStateNavigation} from '../scripts/internal-linking-utils.mjs';
test('link audit recognizes real advisor start/reset navigation without exempting ordinary self-links',()=>{
  const base={sourceRoute:'/kaufberatung/',hasDecisionAdvisor:true,className:'pt-advice-option'};
  for(const world of ['gps','fountain'])assert.ok(isAdvisorStateNavigation({...base,href:'/kaufberatung/?world='+world}));
  assert.ok(isAdvisorStateNavigation({...base,className:'world-back',href:'/kaufberatung/'}));
  for(const patch of [{href:'/kaufberatung/'},{href:'/kaufberatung/?world=invalid'},{href:'/kaufberatung/?world=gps&tracking=1'},{href:'https://elsewhere.example/kaufberatung/?world=gps'},{href:'/kaufberatung/?world=gps',sourceRoute:'/other/'},{href:'/kaufberatung/?world=gps',hasDecisionAdvisor:false}])assert.equal(isAdvisorStateNavigation({...base,...patch}),false);
});

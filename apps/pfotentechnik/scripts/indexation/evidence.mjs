import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {app,sha,origin} from './scan.mjs';
export function parseCsv(source){
 const rows=[];let row=[],value='',quoted=false;
 for(let i=0;i<source.length;i++){const c=source[i];if(c==='"'){if(quoted&&source[i+1]==='"'){value+='"';i++}else quoted=!quoted}else if(c===','&&!quoted){row.push(value);value=''}else if(c==='\n'&&!quoted){row.push(value.replace(/\r$/,''));rows.push(row);row=[];value=''}else value+=c}
 if(value||row.length){row.push(value.replace(/\r$/,''));rows.push(row)}assert.ok(!quoted,'Unterminated CSV quote');
 const [head,...data]=rows;return data.filter(r=>r.some(Boolean)).map(r=>Object.fromEntries(head.map((key,i)=>[key.replace(/^\uFEFF/,''),r[i]??''])));
}
export function loadGscEvidence(){
 const access=JSON.parse(fs.readFileSync(path.join(app,'research/indexation-improvements-36.1/gsc-access.json')));
 const catalog=JSON.parse(fs.readFileSync(path.join(app,'reports/index-migration-forensics-35.3b/coverage-source-catalog.json')));
 const indexation=new Map(),coverageSources=[];
 for(const [directory,status]of [['indexed','indexed'],['crawled','crawled-not-indexed'],['discovered','discovered-not-indexed']]){
  const file=`reports/editorial-quality-recovery-35.4/inputs/${directory}/Tabelle.csv`,raw=fs.readFileSync(path.join(app,file),'utf8'),hash=sha(raw);
  assert.ok(catalog.some(s=>s.sha256===hash),file+': kein verifizierter November-Export');
  coverageSources.push({file,sha256:hash,exportDate:'2026-11-02',status});
  for(const row of parseCsv(raw)){
   const url=row.URL;if(!url)continue;const crawl=row['Zuletzt gecrawlt'];const existing=indexation.get(url);
   indexation.set(url,{status:existing&&existing.status!==status?'unknown':status,observedAt:'2026-11-02',source:file,lastCrawl:crawl&&crawl!=='1970-01-01'&&/^20\d\d-\d\d-\d\d$/.test(crawl)?crawl:null,googleSelectedCanonical:null,sitemapAssociation:null,conflict:!!existing&&existing.status!==status});
  }
 }
 const dashboard=JSON.parse(fs.readFileSync(path.join(app,'src/data/seo/gsc-dashboard-ranges.json'))),manifest=JSON.parse(fs.readFileSync(path.join(app,dashboard.sourceManifest)));
 assert.equal(dashboard.sourceType,'csv-export');
 for(const source of manifest.sources.filter(s=>s.provider==='google'))assert.equal(sha(fs.readFileSync(path.join(app,source.file))),source.sha256,source.file+': Export-Hash');
 const ranges=Object.values(dashboard.ranges),detailed=ranges.filter(r=>r.pages?.length).sort((a,b)=>b.endDate.localeCompare(a.endDate))[0];
 assert.ok(detailed,'Kein belegter Seiten-Performancezeitraum');
 return {access,indexation,coverageSources,performance:{sourceType:dashboard.sourceType,manifest:dashboard.sourceManifest,exportDate:manifest.exportDate,dataUpdatedAt:dashboard.dataUpdatedAt,period:{startDate:detailed.startDate,endDate:detailed.endDate},pages:detailed.pages,queries:detailed.queries,pageQueries:detailed.pageQueries??[],pageQueriesAvailable:!!detailed.coverage?.pageQueries,
  note:'Performance gilt für das volle Exportfenster, nicht als aktueller Indexierungsnachweis. Keine Query-Seiten-Paare; globale Queries werden keiner URL zugeordnet.'}};
}
export const performanceFor=(evidence,route)=>evidence.performance.pages.find(p=>p.page===route)||null;

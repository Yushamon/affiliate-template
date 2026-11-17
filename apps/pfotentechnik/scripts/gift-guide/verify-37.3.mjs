// Read-only build/source proof; writes only this feature's reproducible QA report.
import fs from 'node:fs';import path from 'node:path';import zlib from 'node:zlib';import assert from 'node:assert/strict';import {parse} from 'parse5';
import {app,scanBuild,sourceInventory,sha} from '../indexation/scan.mjs';
import {selectGifts} from '../../src/domain/gift-guide/selection.ts';
const root=path.join(app,'reports/gift-finder-37.3-qa'),baseline=JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(app,'research/gift-guide-37.0/baseline.json.gz')))),scan=scanBuild();
for(const row of baseline.sources)assert.equal(sha(fs.readFileSync(path.join(app,row.file))),row.sha256,`Existing source changed: ${row.file}`);
const oldRoutes=new Set(baseline.pages.map(p=>p.route)),routes=new Set(scan.pages.map(p=>p.route)),route='/ratgeber/technikgeschenke-haustiere/';
assert.deepEqual([...oldRoutes].filter(r=>!routes.has(r)),[]);assert.deepEqual([...routes].filter(r=>!oldRoutes.has(r)),[route]);
const previous=JSON.parse(fs.readFileSync(path.join(app,'reports/gift-guide-37.0-qa/verification.json')));const previousRoutes=new Set([...oldRoutes,...previous.addedRoutes]);assert.deepEqual([...routes].filter(r=>!previousRoutes.has(r)),[]);assert.deepEqual([...previousRoutes].filter(r=>!routes.has(r)),[]);
const page=scan.pages.find(p=>p.route===route);assert.deepEqual(page.canonical,['https://pfotentechnik.de'+route]);assert.equal(page.sitemapIncluded,true);assert.ok(!/noindex/.test(page.robots));assert.deepEqual(page.schemaErrors,[]);assert.equal(page.h1.length,1);
function* walk(n){yield n;for(const c of n.childNodes??[])yield*walk(c)}
const html=fs.readFileSync(path.join(app,'dist',route,'index.html'),'utf8'),nodes=[...walk(parse(html))],attr=n=>Object.fromEntries((n.attrs??[]).map(a=>[a.name,a.value]));
const products=JSON.parse(nodes.find(n=>Object.hasOwn(attr(n),'data-gift-catalog')).childNodes.map(n=>n.value??'').join(''));
const internal=page.links.filter(l=>!l.target.startsWith('/api/'));for(const l of internal)assert.ok(routes.has(l.target)||scan.excluded.some(p=>p.route===l.target),`Broken internal destination ${l.target}`);
// The legacy exact snapshot check also freezes time-dependent price badges.
// Prove links and all other text separately; report the raw drift explicitly.
const experiment=JSON.parse(fs.readFileSync(path.join(app,'research/product-integration-35.8/baseline.json'))),priceBadgeDrift=[];
function* visible(n){yield n;if(['script','style'].includes(n.tagName))return;for(const c of n.childNodes??[])yield*visible(c)}
const normalizePriceBadge=t=>t.replace(/Früherer Anschaffungspreis/g,'Anschaffungspreis').replace(/Veralteter Preisstand/g,'Hinterlegter Preis');
for(const route of experiment.routes){
 const dom=parse(fs.readFileSync(path.join(app,'dist',route,'index.html'),'utf8')),all=[...visible(dom)],actual={text:all.filter(n=>n.nodeName==='#text').map(n=>n.value).join(' ').replace(/\s+/g,' ').trim(),links:all.filter(n=>n.tagName==='a').map(n=>n.attrs?.find(a=>a.name==='href')?.value).filter(Boolean)},old=experiment.snapshots[route];
 assert.deepEqual(actual.links,old.links,route+': protected links');
 if(actual.text!==old.text){assert.equal(normalizePriceBadge(actual.text),old.text,route+': only existing price freshness badges may age');priceBadgeDrift.push(route)}
}
// scanBuild normalizes targets; use the original DOM hrefs for multiplicity.
const exactIncoming={};for(const page of scan.pages){const dom=parse(fs.readFileSync(path.join(app,'dist',page.route,'index.html'),'utf8'));for(const n of visible(dom)){if(n.tagName!=='a')continue;const href=n.attrs?.find(a=>a.name==='href')?.value;if(experiment.routes.includes(href)){const key=page.route+' -> '+href;exactIncoming[key]=(exactIncoming[key]??0)+1}}}
assert.deepEqual(exactIncoming,experiment.incomingLinks,'Protected experiment incoming links');
const protection={protectedPages:experiment.routes.length,protectedIncomingEdges:Object.keys(exactIncoming).length,priceBadgeDrift};assert.equal(protection.protectedPages,20);assert.equal(protection.protectedIncomingEdges,205);
const scenarios=[];for(const animal of ['cat','dog','both'])for(const goal of ['feeding','drinking','outdoors','connection','open'])for(const budget of ['50','150','300','open']){
 const answers={animal,goal,budget,food:'dry',weight:10,subscription:'any'},r=selectGifts(products,answers);scenarios.push({answers,confirmed:r.matches.map(m=>m.product.slug),possible:r.possible.map(m=>m.product.slug),excluded:r.excluded});
}
const sources=sourceInventory().filter(s=>s.collection==='products'),originals=sources.filter(s=>s.data.decisionFacts?.length),facts=originals.reduce((sum,s)=>sum+s.data.decisionFacts.length,0);assert.equal(originals.length,73);assert.equal(facts,437);
const before=JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(app,'research/gift-guide-37.1/baseline.json.gz'))));
assert.equal(products.length,before.catalog.length);
for(const p of products){const old=before.catalog.find(o=>o.slug===p.slug);assert.ok(old);for(const key of ['price','priceLabel','score','offerHref','offerRel','technical','comparison','strengths','weaknesses','tco12']){if(['price','priceLabel','tco12'].includes(key)&&p.price===null){if(key!=='priceLabel')assert.equal(p[key],null);continue}assert.deepEqual(p[key],old[key],`${p.slug}: ${key}`)}}
for(const scenario of scenarios)for(const slug of scenario.confirmed){const p=products.find(p=>p.slug===slug);if(scenario.answers.budget!=='open'&&p.price!==null)assert.ok(p.price<=Number(scenario.answers.budget));for(const species of scenario.answers.animal==='both'?['cat','dog']:[scenario.answers.animal])assert.ok(p.animals.includes(species))}
assert.equal(nodes.filter(n=>n.tagName==='template').length,1);
const htmlAfter=Buffer.byteLength(html),gzipAfter=zlib.gzipSync(html).length;assert.ok(htmlAfter<before.htmlBytes*.6,'Reduce HTML by at least 40%');
const previousPerformance=JSON.parse(fs.readFileSync(path.join(app,'reports/gift-finder-37.3-qa/before.json')));assert.ok(htmlAfter<=previousPerformance.htmlBytes,'Do not increase HTML since 37.1');
const performance={previous37_1:previousPerformance,before:{htmlBytes:before.htmlBytes,gzipBytes:before.gzipBytes,catalogBytes:before.catalogBytes,templates:before.modelTemplates},after:{htmlBytes:htmlAfter,gzipBytes:gzipAfter,catalogBytes:Buffer.byteLength(JSON.stringify(products)),templates:1},htmlReductionPercent:Math.round((1-htmlAfter/before.htmlBytes)*1000)/10,gzipReductionPercent:Math.round((1-gzipAfter/before.gzipBytes)*1000)/10};
const result={version:'37.3',performance,generatedAt:new Date().toISOString(),route,buildPages:391,publicCanonicalPages:scan.pages.length,sitemapPages:scan.sitemap.length,previousPublicPages:previous.publicCanonicalPages,addedRoutes:[],removedRoutes:[],existingSourceFilesUnchanged:baseline.sources.length,productSourcesUnchanged:sources.length,originalDecisionFacts:{products:originals.length,hints:facts,changed:0},protected:{pages:protection.protectedPages,incomingEdges:protection.protectedIncomingEdges,priceBadgeDrift:protection.priceBadgeDrift},changedMainTextSincePreGiftGuideBaseline:scan.pages.filter(p=>baseline.pages.some(b=>b.route===p.route&&b.mainText!==p.mainText)).map(p=>p.route),incomingPages:scan.pages.filter(p=>p.route!==route&&p.links.some(l=>l.target===route)).map(p=>p.route),catalog:{models:products.length,confirmedAvailability:products.filter(p=>p.availabilityConfirmed).length,unknownAvailability:products.filter(p=>!p.availabilityConfirmed).length,categories:Object.fromEntries([...new Set(products.map(p=>p.category))].map(c=>[c,products.filter(p=>p.category===c).length])),slugs:products.map(p=>p.slug)},html:{bytes:Buffer.byteLength(html),gzipBytes:zlib.gzipSync(html).length,canonical:page.canonical,robots:page.robots,h1:page.h1,brokenInternalLinks:0,schemaErrors:page.schemaErrors},scenarios};
fs.mkdirSync(root,{recursive:true});fs.writeFileSync(path.join(root,'verification.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({...result,scenarios:scenarios.length,catalog:{...result.catalog,slugs:undefined}},null,2));

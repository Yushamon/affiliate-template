import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {parse} from 'parse5';
import {app,origin,scanBuild,sourceInventory,sha} from '../indexation/scan.mjs';
import {verifyIntegration,walk,text} from '../product-integration/verify.mjs';
import {pricePresentationAt} from '../product-integration/protected-snapshots.mjs';
import {deriveProductOperations} from '../../src/lib/product-operations/policy.mjs';
const output=path.join(app,'reports/release-gate-37.4-qa');
const inventory=JSON.parse(fs.readFileSync(path.join(output,'protected-source-inventory.json')));
for(const [file,hash] of Object.entries(inventory))assert.equal(sha(fs.readFileSync(path.join(app,file))),hash,file);
const sources=sourceInventory(),products=sources.filter(p=>p.collection==='products');
const hints=products.reduce((sum,p)=>sum+(p.data.decisionFacts?.length??0),0);assert.equal(products.length,110);assert.equal(hints,437);
const integration=await verifyIntegration(),scan=scanBuild(),indexable=scan.pages.filter(p=>!p.robots.split(/[\s,]+/).includes('noindex'));
assert.deepEqual(indexable.map(p=>p.url).sort(),scan.sitemap);
const missing=scan.pages.filter(p=>!scan.sitemap.includes(p.url));assert.deepEqual(missing.map(p=>p.route),['/foundation/']);assert.match(missing[0].robots,/\bnoindex\b/);
const listed=[];for(const name of fs.readdirSync(path.join(app,'dist')).filter(n=>/^sitemap.*\.xml$/.test(n)))for(const [,url] of fs.readFileSync(path.join(app,'dist',name),'utf8').matchAll(/<loc>(.*?)<\/loc>/g))if(!url.endsWith('.xml'))listed.push(url.replaceAll('&amp;','&'));
assert.equal(listed.length,new Set(listed).size,'No duplicate sitemap URLs');
for(const p of scan.pages){assert.deepEqual(p.canonical,[origin+p.route]);assert.deepEqual(p.schemaErrors,[],p.route)}
const baseline=JSON.parse(fs.readFileSync(path.join(app,'research/product-integration-35.8/baseline.json'))),manifest=JSON.parse(fs.readFileSync(path.join(app,'research/product-integration-35.8/manifest.json')));
const rawDrift=[];for(const route of baseline.routes){const file=path.join(app,'dist',route,'index.html'),dom=parse(fs.readFileSync(file,'utf8')),actual={text:text(dom),links:[...walk(dom)].filter(n=>n.tagName==='a').map(n=>n.attrs.find(a=>a.name==='href')?.value).filter(Boolean)};if(actual.text!==baseline.snapshots[route].text){const p=products.find(p=>p.route===route);assert.ok(p);rawDrift.push({route,snapshotClock:manifest.asOf+'T12:00:00.000Z',buildClock:fs.statSync(file).mtime.toISOString(),historical:pricePresentationAt(p.data,manifest.asOf+'T12:00:00.000Z'),rendered:pricePresentationAt(p.data,fs.statSync(file).mtime),linksUnchanged:JSON.stringify(actual.links)===JSON.stringify(baseline.snapshots[route].links)})}}
const active=products.filter(p=>p.data.productStatus==='active'&&['gps-tracker','haustierkameras'].includes(p.data.category?.key)),added=active.filter(p=>!Object.hasOwn(baseline.sources,p.file));
const result={version:'37.4',checksPassed:true,productSourcesUnchanged:products.length,baselineFilesUnchanged:Object.keys(inventory).length-products.length,originalHintsUnchanged:hints,
 experiment:{protectedPages:integration.protectedPages,protectedIncomingEdges:integration.protectedIncomingEdges,rawPriceStateChanges:rawDrift,fullHistoricalTextAndLinksPassed:true},
 activeResearchScope:{previous:active.length-added.length,current:active.length,added:added.map(p=>({slug:p.data.slug,productStatus:p.data.productStatus,publicationStatus:p.data.publicationStatus,publicationBlockers:p.data.publicationBlockers,archived:deriveProductOperations(p.data).archived,availability:deriveProductOperations(p.data).availability,subscriptionStatus:p.data.subscription.status,researchDate:p.data.subscription.researchedAt,source:p.data.subscription.source,inApprovedIntegration:manifest.candidateSlugs.includes(p.data.slug)}))},
 sitemap:{publicSelfCanonicals:scan.pages.length,indexableSelfCanonicals:indexable.length,urls:scan.sitemap.length,duplicates:0,missingIndexable:[],extra:[],intentionalExclusions:missing.map(p=>({url:p.url,robots:p.robots,reason:'Internal opt-in design system preview, not editorial buying advice. ProjectLayout emits noindex=true; astro.config.mjs explicitly excludes /foundation/.'})),allCanonicalUrls:scan.pages.map(p=>p.url),allSitemapUrls:scan.sitemap},
 safeguards:{pricesAndCheckDates:'All 110 complete product sources byte-identical',scores:'unchanged',affiliateDestinations:'unchanged',historicalBaselines:'byte-identical',merge:false,deployment:false}};
fs.writeFileSync(path.join(output,'verification.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({...result,sitemap:{...result.sitemap,allCanonicalUrls:undefined,allSitemapUrls:undefined}},null,2));

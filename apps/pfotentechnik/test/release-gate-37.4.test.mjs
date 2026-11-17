import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {parse} from 'parse5';
import {readProductDocument} from '../src/lib/price-intelligence/frontmatter-price.mjs';
import {pricePresentationAt,protectedSnapshotAt,snapshotNodes,snapshotText} from '../scripts/product-integration/protected-snapshots.mjs';
import {scanBuild,sourceInventory,sha,app,origin} from '../scripts/indexation/scan.mjs';
const oldClock='2026-11-16T12:00:00.000Z',newClock='2026-11-17T12:00:00.000Z';
const priceFixture=async slug=>(await readProductDocument(path.join(app,'src/content/products',slug+'.md'))).data;
const fixtureDom=state=>parse(`<main><p>Geschützter Originaltext</p><article data-merchant="${state.merchant}"><dl class="px2-price__purchase"><dt>${state.label}</dt><dd>${state.price}</dd><small>${state.badge}</small></dl><a href="https://example.com/unchanged">Kaufen</a></article></main>`);
for(const slug of ['pawsync-smart-pet-feeder','petlibro-dockstream-cordless']){
 test(`37.4: ${slug} has deterministic historical/current price states without source edits`,async()=>{
  const data=await priceFixture(slug),before=JSON.stringify(data),historical=pricePresentationAt(data,oldClock)[0],current=pricePresentationAt(data,newClock)[0];
  assert.equal(historical.badge,'Hinterlegter Preis');assert.equal(current.badge,'Veralteter Preisstand');assert.equal(current.price,historical.price);assert.equal(JSON.stringify(data),before);
  const boundary=Date.parse(data.price.checkedAt)+15*86400000;
  assert.equal(pricePresentationAt(data,boundary-1)[0].badge,'Hinterlegter Preis');assert.equal(pricePresentationAt(data,boundary)[0].badge,'Veralteter Preisstand');
  const dom=fixtureDom(current),original=snapshotText(dom),projected=protectedSnapshotAt(dom,{data,snapshotAt:oldClock,renderedAt:newClock});
  assert.deepEqual(projected,protectedSnapshotAt(fixtureDom(historical),{data,snapshotAt:oldClock,renderedAt:oldClock}));assert.equal(snapshotText(dom),original,'Projection must not mutate production DOM');
 });
}
test('37.4: projection rejects false fresh badges, changed amounts, markup and invalid clocks',async()=>{
 const data=await priceFixture('pawsync-smart-pet-feeder'),current=pricePresentationAt(data,newClock)[0],options={data,snapshotAt:oldClock,renderedAt:newClock};
 for(const patch of [{badge:'Hinterlegter Preis'},{price:'1,00 €'},{label:'Passend gemacht'}])assert.throws(()=>protectedSnapshotAt(fixtureDom({...current,...patch}),options));
 const markup=fixtureDom(current),label=[...snapshotNodes(markup)].find(n=>n.tagName==='dt');label.childNodes.push({nodeName:'#text',value:'Unzulässiger Zusatz',parentNode:label});assert.throws(()=>protectedSnapshotAt(markup,options));
 assert.throws(()=>pricePresentationAt(data,'invalid'));
});
test('37.4: the whole historical snapshot still detects changed content and affiliate URLs',async()=>{
 const data=await priceFixture('pawsync-smart-pet-feeder'),current=pricePresentationAt(data,newClock)[0],options={data,snapshotAt:oldClock,renderedAt:newClock},expected=protectedSnapshotAt(fixtureDom(current),options);
 const changedText=fixtureDom(current),node=[...snapshotNodes(changedText)].find(n=>n.nodeName==='#text'&&n.value==='Geschützter Originaltext');node.value='Nicht genehmigte Inhaltsänderung';assert.notDeepEqual(protectedSnapshotAt(changedText,options),expected);
 const changedLink=fixtureDom(current),a=[...snapshotNodes(changedLink)].find(n=>n.tagName==='a');a.attrs.find(a=>a.name==='href').value='https://example.com/replaced-affiliate';assert.notDeepEqual(protectedSnapshotAt(changedLink,options),expected);
});
test('37.4: sitemap equals every indexable public canonical, excluding only noindex foundation',()=>{
 const scan=scanBuild(),indexable=scan.pages.filter(p=>!p.robots.split(/[\s,]+/).includes('noindex'));
 assert.deepEqual(indexable.map(p=>p.url).sort(),scan.sitemap);
 const missing=scan.pages.filter(p=>!scan.sitemap.includes(p.url));assert.deepEqual(missing.map(p=>p.route),['/foundation/']);assert.match(missing[0].robots,/(?:^|,)noindex(?:,|$)/);
 for(const page of scan.pages){assert.deepEqual(page.canonical,[origin+page.route]);assert.deepEqual(page.schemaErrors,[],page.route);if(page.route!=='/foundation/')assert.equal(page.h1.filter(Boolean).length,1,page.route)}
 assert.ok(indexable.some(p=>p.route==='/ratgeber/technikgeschenke-haustiere/'));
 assert.ok(scan.sitemap.every(url=>!['/admin/','/api/','/foundation/'].some(prefix=>new URL(url).pathname.startsWith(prefix))));
});
test('37.4: two post-20 active models come from approved integration, with publication and tariff evidence',()=>{
 const all=sourceInventory().filter(p=>p.collection==='products'),baseline=JSON.parse(fs.readFileSync(path.join(app,'research/product-integration-35.8/baseline.json'))),manifest=JSON.parse(fs.readFileSync(path.join(app,'research/product-integration-35.8/manifest.json')));
 const active=all.filter(p=>p.data.productStatus==='active'&&['gps-tracker','haustierkameras'].includes(p.data.category?.key)),added=active.filter(p=>!Object.hasOwn(baseline.sources,p.file));
 assert.deepEqual(added.map(p=>p.data.slug).sort(),['mova-suretrack-pro','satellai-collar-go']);
 for(const p of added){assert.ok(manifest.candidateSlugs.includes(p.data.slug));assert.equal(p.data.publicationStatus,'published');assert.deepEqual(p.data.publicationBlockers,[]);assert.ok(p.data.evidenceSources.length>0);assert.equal(p.data.subscription.status,'required-subscription');assert.equal(new URL(p.data.subscription.source).protocol,'https:')}
});
test('37.4: historical baselines and all existing product files are byte-identical to the pre-cleanup inventory',()=>{
 const inventory=JSON.parse(fs.readFileSync(path.join(app,'reports/release-gate-37.4-qa/protected-source-inventory.json')));
 for(const [file,hash] of Object.entries(inventory))assert.equal(sha(fs.readFileSync(path.join(app,file))),hash,file);
});

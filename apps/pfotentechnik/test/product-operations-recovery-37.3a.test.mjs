import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import {createHash} from 'node:crypto';
import {readProductDocument,updateProductOffer} from '../src/lib/price-intelligence/frontmatter-price.mjs';
import {setProductCommerceLink,setManualProductPrice,updateProductOperationsState,checkProductPrice} from '../src/lib/price-intelligence/service.mjs';
import {buildOperationsDashboard,deriveProductOperations} from '../src/lib/product-operations/policy.mjs';
import {buildOperationsDashboard as browserDashboard} from '../src/lib/product-operations/display.mjs';
import {resolveCommerceOffers} from '../src/domain/commerceOffers.mjs';
import {commerceCockpitMarkup} from '../src/lib/price-intelligence/commerce-view.mjs';
const hash=s=>createHash('sha256').update(s).digest('hex');
async function fixture(t){const dir=await fs.mkdtemp(path.join(os.tmpdir(),'recovery-373a-')),file=path.join(dir,'product.md');await fs.copyFile(new URL('../src/content/products/petlibro-air-automatic-feeder.md',import.meta.url),file);t.after(()=>fs.rm(dir,{recursive:true,force:true}));return {file,find:()=>readProductDocument(file),slug:'petlibro-air-automatic-feeder'}}
const link=f=>({slug:f.slug,id:'qa-test',action:'add',merchant:'QA Händler',network:'none',officialProductUrl:'https://example.com/product',affiliateUrl:'https://example.com/ref-one',confirmIdentity:true});
test('37.3A: add/edit/remove persist in existing offers, preserve all other product data and appear in commerce CTAs',async t=>{
 const f=await fixture(t),before=await f.find();let saved=await setProductCommerceLink(link(f),f);assert.equal(saved.record.commerceOffers.find(o=>o.id==='qa-test').affiliateUrl,'https://example.com/ref-one');assert.equal(saved.record.commerceOffers.find(o=>o.id==='qa-test').canLink,true);
 saved=await setProductCommerceLink({...link(f),action:'edit',affiliateUrl:'https://example.com/ref-two',expectedHash:saved.record.sourceHash},f);assert.equal((await f.find()).data.offers.find(o=>o.id==='qa-test').affiliate.url,'https://example.com/ref-two');
 await setProductCommerceLink({...link(f),action:'remove',expectedHash:saved.record.sourceHash},f);const after=await f.find();assert.deepEqual(after.data.offers,before.data.offers);for(const key of ['ratings','score','rating','decisionFacts','affiliate','price'])assert.deepEqual(after.data[key],before.data[key],key);assert.equal(after.source.split('\n---\n')[1],before.source.split('\n---\n')[1]);
});
test('37.3A: Amazon and complete Awin links use existing network resolution',async t=>{
 const f=await fixture(t);await setProductCommerceLink({...link(f),merchant:'amazon',network:'partnernet',officialProductUrl:'https://www.amazon.de/dp/B012345678',affiliateUrl:'https://www.amazon.de/dp/B012345678?tag=yusha0f-21'},f);let offers=resolveCommerceOffers((await f.find()).data);assert.match(offers.find(o=>o.id==='qa-test').affiliateUrl,/B012345678/);
 await setProductCommerceLink({...link(f),id:'qa-awin',network:'awin',officialProductUrl:'https://example.com/other',affiliateUrl:'https://www.awin1.com/cread.php?awinmid=77942&awinaffid=2987821&ued=https%3A%2F%2Fexample.com%2Fother'},f);assert.equal((await f.find()).data.offers.filter(o=>o.id.startsWith('qa-')).length,2);
});
test('37.3A: invalid URL, duplicate ID, duplicate product URL, missing identity and stale version do not write',async t=>{
 const f=await fixture(t);await setProductCommerceLink(link(f),f);
 for(const patch of [{affiliateUrl:'http://example.com/invalid',action:'edit'},{id:'bad!'}, {confirmIdentity:false,id:'new',officialProductUrl:'https://example.com/new'}, {id:'duplicate-url'}, {action:'edit',expectedHash:'0'.repeat(64)}]){
  const before=await fs.readFile(f.file,'utf8');await assert.rejects(setProductCommerceLink({...link(f),...patch},f));assert.equal(await fs.readFile(f.file,'utf8'),before);
 }
});
test('37.3A: an affiliate-only metadata save does not reconfirm price or availability',async t=>{
 const f=await fixture(t),before=(await f.find()).data;await setManualProductPrice({slug:f.slug,current:before.price.current,currency:before.price.currency,targetUrl:'https://example.com/new-link',availability:deriveProductOperations(before).availability},f);const after=(await f.find()).data;assert.deepEqual(after.price.checkedAt,before.price.checkedAt);assert.deepEqual(after.availabilityUpdated,before.availabilityUpdated);assert.equal(after.affiliate.url,'https://example.com/new-link');
});
test('37.3A: manual price and stock updates are separate confirmations, with conflict checks',async t=>{
 const f=await fixture(t),before=(await f.find()).data;await setManualProductPrice({slug:f.slug,current:'55,99',currency:'EUR',availability:deriveProductOperations(before).availability},f);const after=(await f.find()).data;assert.equal(after.price.current,55.99);assert.deepEqual(after.availabilityUpdated,before.availabilityUpdated);
 await updateProductOperationsState({slug:f.slug,availability:'out-of-stock'},f);assert.equal((await f.find()).data.availability,'out-of-stock');const source=await fs.readFile(f.file,'utf8');await assert.rejects(setManualProductPrice({slug:f.slug,current:'56,99',expectedHash:'f'.repeat(64)},f));assert.equal(await fs.readFile(f.file,'utf8'),source);
});
test('37.3A: recommendation restriction and care priority persist without score edits',async t=>{
 const f=await fixture(t),before=(await f.find()).data;const result=await updateProductOperationsState({slug:f.slug,recommendationOverride:'limited',maintenancePriority:'high'},f);assert.equal(result.record.recommendationOverride,'limited');assert.equal(result.record.maintenancePriority,'high');assert.deepEqual((await f.find()).data.ratings,before.ratings);await assert.rejects(updateProductOperationsState({slug:f.slug,maintenancePriority:'made-up'},f));
});
test('37.3A: failed commerce checks leave price confirmation and all stored amounts untouched',async t=>{
 const f=await fixture(t),before=(await f.find()).data;const result=await checkProductPrice(f.slug,{find:f.find,checkLegacy:async()=>{throw Error('No exact price found')},refresh:async()=>{throw Error('Provider unreachable')},persist:updateProductOffer});assert.equal(result.ok,false);const after=(await f.find()).data;assert.deepEqual(after.price,before.price);assert.deepEqual(after.availabilityUpdated,before.availabilityUpdated);for(const o of after.offers)assert.ok(o.lastAttemptAt&&o.error);
});
test('37.3A: price age uses last successful confirmation; server and browser metrics stay identical',()=>{
 const d={slug:'x',price:{current:10,checkedAt:'2026-01-01'},priceUpdated:'2026-11-17',availability:'unknown'};assert.ok(deriveProductOperations(d,{now:Date.parse('2026-11-17')}).priceAgeDays>90);
 const rows=[{operations:{maintenanceStatus:'complete'}},{operations:{maintenanceStatus:'archived',archived:true}},{operations:{maintenanceStatus:'required',availability:'unknown'}}];assert.deepEqual(buildOperationsDashboard(rows),browserDashboard(rows));assert.equal(buildOperationsDashboard(rows).maintenanceRate,66.7);
});
test('37.3A: browser offer markup is escaped, disabled until connected, and free of server dependencies',async()=>{
 const html=commerceCockpitMarkup([], 'qa');assert.match(html,/data-link-editor/);assert.match(html,/<button disabled type="submit"/);const view=await fs.readFile(new URL('../src/lib/price-intelligence/commerce-view.mjs',import.meta.url),'utf8'),display=await fs.readFile(new URL('../src/lib/product-operations/display.mjs',import.meta.url),'utf8');assert.ok(!view.includes('policy.mjs'));assert.ok(!display.includes('node:'));const source=await fs.readFile(new URL('../src/pages/admin/seo/prices.astro',import.meta.url),'utf8');assert.match(source,/data-metric-filter/);assert.match(source,/serviceReady/);
});

import {checkDocumentPrice} from '../src/lib/price-intelligence/service.mjs';
import {extractOfferFromHtml} from '../src/lib/price-intelligence/extract-offer.mjs';
import {buildPriceIndex} from '../src/domain/price/engine.ts';
import {selectCommercePrice} from '../src/domain/commerceOffers.mjs';
import {refreshOfficialOffer} from '../src/lib/price-intelligence/commerce-refresh.mjs';
const amazonPage=(extra='')=>`<form id="addToCart" action="/gp/add-to-cart/html"><input name="ASIN" value="B012345678"><input name="items[0.base][customerVisiblePrice][amount]" value="59.99"><input name="items[0.base][customerVisiblePrice][currencyCode]" value="EUR">${extra}</form>`;
const activePurchase='<input name="offeringID.1" value="fixture-exact-offer"><input type="submit" id="add-to-cart-button" name="submit.add-to-cart" value="In den Einkaufswagen">';
test('37.3A addendum: unchanged successful price renews confirmation but not actual change date',async t=>{
 const f=await fixture(t),doc=await f.find();const price=doc.data.price.current;const confirmation='2026-01-01T00:00:00.000Z',changed='2025-12-01T00:00:00.000Z';
 await fs.writeFile(f.file,doc.source.replace(/checkedAt:.*\n/,'checkedAt: "'+confirmation+'"\n  changedAt: "'+changed+'"\n'));
 await checkDocumentPrice(await f.find(),{fetchText:async()=>({resolvedUrl:'https://shop.example.de/product',html:`<script type="application/ld+json">{"@type":"Offer","price":${price},"priceCurrency":"EUR"}</script>`})});const after=(await f.find()).data;assert.equal(after.price.current,price);assert.notEqual(String(after.price.checkedAt),confirmation);assert.equal(after.price.changedAt,changed);
});
test('37.3A addendum: changed confirmed price records both dates, failed fetch renews neither',async t=>{
 const f=await fixture(t);await checkDocumentPrice(await f.find(),{fetchText:async()=>({resolvedUrl:'https://shop.example.de/product',html:'<script type="application/ld+json">{"@type":"Offer","price":999.42,"priceCurrency":"EUR"}</script>'})});const saved=await fs.readFile(f.file,'utf8'),d=(await f.find()).data;assert.equal(d.price.current,999.42);assert.equal(d.price.checkedAt,d.price.changedAt);await assert.rejects(checkDocumentPrice(await f.find(),{fetchText:async()=>{throw Error('failed source')}}));assert.equal(await fs.readFile(f.file,'utf8'),saved);
});
test('37.3A addendum: Amazon stock requires exact current price, offer token and enabled purchase control',()=>{
 const url='https://www.amazon.de/dp/B012345678';assert.equal(extractOfferFromHtml(amazonPage(activePurchase),url).availability,'https://schema.org/InStock');
 for(const fragment of ['',activePurchase.replace('type="submit"','disabled type="submit"'),activePurchase.replace('offeringID.1','unrelated'),activePurchase.replace('In den Einkaufswagen','Jetzt vorbestellen')])assert.equal(extractOfferFromHtml(amazonPage(fragment),url).availability,undefined);
 assert.equal(extractOfferFromHtml(amazonPage(activePurchase).replace('value="B012345678"','value="B099999999"')+'<script type="application/ld+json">{"@type":"Offer","price":59.99,"priceCurrency":"EUR","availability":"InStock"}</script>',url),null);
});
test('37.3A addendum: verified Amazon ordering evidence persists availability, price-only does not invent it',async t=>{
 const f=await fixture(t);await checkDocumentPrice(await f.find(),{fetchText:async()=>({resolvedUrl:'https://www.amazon.de/dp/B012345678',html:amazonPage(activePurchase)})});let d=(await f.find()).data;assert.equal(d.availability,'available');const stock=d.availabilityUpdated;await checkDocumentPrice(await f.find(),{fetchText:async()=>({resolvedUrl:'https://www.amazon.de/dp/B012345678',html:amazonPage()})});d=(await f.find()).data;assert.equal(d.availabilityUpdated,stock);
});
test('37.3A addendum: recent alternative offer is the common price/date in Cockpit and product price index',async t=>{
 const f=await fixture(t),d=(await f.find()).data;const now='2026-11-17T12:00:00.000Z';d.price.checkedAt='2026-01-01';d.price.current=10;d.priceState='available';d.availability='unknown';delete d.availabilityUpdated;
 const alt={id:'recent',merchant:'qa',network:'none',officialProductUrl:'https://example.com/current',affiliate:{provider:'qa',url:'https://example.com/go'},mappingStatus:'verified',verifiedAt:now,evidenceSources:[{source:'QA'}],commerceDataProvider:'manual',price:{current:123.45,currency:'EUR',checkedAt:'2026-11-16T12:00:00.000Z'},priceState:'available',availability:'unknown'};d.offers=[alt];
 const ops=deriveProductOperations(d,{now:Date.parse(now)}),index=buildPriceIndex([{id:d.slug,data:d}],undefined,new Date(now)).bySlug.get(d.slug),choice=selectCommercePrice(d,{now:Date.parse(now)});assert.equal(ops.current,123.45);assert.equal(index.current,123.45);assert.equal(choice.current,123.45);assert.equal(ops.priceUpdated,index.checkedAt);assert.equal(ops.priceAgeDays,1);assert.equal(ops.availability,'unknown');
 d.offers.push({...alt,id:'older',officialProductUrl:'https://example.com/older',price:{...alt.price,current:50,checkedAt:'2026-10-01'}});assert.equal(selectCommercePrice(d,{now:Date.parse(now)}).id,'recent');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import yaml from 'js-yaml';
import {checkAllProductPrices, checkProductPrice, checkDocumentPrice, commerceRefreshEligible} from '../src/lib/price-intelligence/service.mjs';
import {refreshCommerceOffer} from '../src/lib/price-intelligence/commerce-refresh.mjs';
import {readProductDocument} from '../src/lib/price-intelligence/frontmatter-price.mjs';
import {commerceCockpitMarkup} from '../src/lib/price-intelligence/commerce-view.mjs';

const old = '2026-01-01T09:00:00.000Z';
const price = current => ({current, currency:'EUR', checkedAt:old, status:'unknown'});
const merchantOffer = (id, patch = {}) => ({
  id, merchant:'Fixture Händler', network:'none', officialProductUrl:`https://shop.example.de/${id}`,
  affiliate:{provider:'official', url:`https://shop.example.de/${id}?ref=original`},
  mappingStatus:'verified', verifiedAt:old, evidenceSources:[{source:'Fixture identity',url:`https://shop.example.de/${id}`,accessedAt:old,assertion:'Exact product identity',fields:['officialProductUrl'],sourceType:'officialStore'}],
  commerceDataProvider:'structured-html', price:price(49.99), priceState:'available',
  availability:'out-of-stock', availabilityUpdated:old, ...patch
});
const product = (slug, patch = {}) => ({slug, title:slug, productUrl:`/produkt/${slug}/`,
  affiliate:{provider:'original', url:`https://shop.example.de/${slug}`,label:'Original CTA',rel:'sponsored nofollow noopener',target:'_blank'},
  price:price(99.99), priceState:'available', availability:'out-of-stock', availabilityUpdated:old,
  score:83, rating:4.2, ratings:{quality:4}, review:{verdict:'Original editorial verdict'}, ...patch
});
const html = (amount, extra = {}) => `<script type="application/ld+json">${JSON.stringify({'@type':'Offer', price:amount, priceCurrency:'EUR', ...extra})}</script>`;
const stockOnly = '<script type="application/ld+json">{"@type":"Offer","availability":"InStock"}</script>';
const fixture = async (t, data) => {
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'pt-confirmation-'));
  t.after(()=>fs.rm(dir,{recursive:true,force:true}));
  for (const p of data) await fs.writeFile(path.join(dir,p.slug+'.md'),'---\n'+yaml.dump(p)+'---\nOriginal body.\n');
  const find = slug => readProductDocument(path.join(dir,slug+'.md'));
  return {dir,find,list:()=>Promise.all(data.map(p=>find(p.slug)))};
};
const inRun = (value, start, end) => assert.ok(Date.parse(value)>=start&&Date.parse(value)<=end,`Successful confirmation must be in run: ${value}`);

test('global run confirms unchanged main and additional prices, including archived/unavailable products, and survives a fresh process', async t => {
  const originals=[
    product('archived',{maintenanceStatus:'archived',recommendationStatus:'archived',offers:[merchantOffer('unchanged'),merchantOffer('changed'),merchantOffer('failed'),merchantOffer('manual',{commerceDataProvider:'manual'})]}),
    product('unavailable',{availability:'discontinued'}),
    product('locked',{priceAutomation:'editorial',offers:[merchantOffer('locked-extra')]}),
    product('no-source',{affiliate:undefined,priceAutomation:'automatic'})
  ];
  const f=await fixture(t,originals),calls=[];
  const fetchText=async url=>{
    const name=new URL(url).pathname.slice(1);calls.push(name);
    if(name==='failed')throw Error('Fixture timeout');
    return {resolvedUrl:url,html:html(name==='changed'?42.35:name==='unchanged'||name==='locked-extra'?49.99:99.99)};
  };
  const start=Date.now();
  const result=await checkAllProductPrices({}, {listDocuments:f.list,check:slug=>checkProductPrice(slug,{
    find:f.find,checkLegacy:doc=>checkDocumentPrice(doc,{fetchText}),refresh:offer=>refreshCommerceOffer(offer,{fetchText})
  })});
  const end=Date.now();
  assert.equal(result.succeeded,3,JSON.stringify(result.results.map(r=>({slug:r.slug,error:r.error,providers:r.providerResults}))));assert.equal(result.failed,0);assert.equal(result.skipped,1);
  assert.deepEqual(calls,['archived','unchanged','changed','failed','unavailable','locked-extra']);
  for(const slug of ['archived','unavailable']){
    const saved=await f.find(slug);assert.equal(saved.data.price.current,99.99);inRun(saved.data.price.checkedAt,start,end);inRun(saved.data.priceUpdated,start,end);
    for(const key of ['affiliate','score','rating','ratings','review','availability','availabilityUpdated'])assert.deepEqual(saved.data[key],originals.find(p=>p.slug===slug)[key],key);
    if(slug==='archived')assert.equal(saved.data.maintenanceStatus,'archived');
    assert.match(saved.source,/Original body\./);
  }
  const saved=(await f.find('archived')).data;
  for(const id of ['unchanged','changed']){
    const o=saved.offers.find(o=>o.id===id),before=originals[0].offers.find(o=>o.id===id);
    inRun(o.price.checkedAt,start,end);assert.equal(o.price.current,id==='changed'?42.35:49.99);
    assert.deepEqual(o.affiliate,before.affiliate);assert.equal(o.availability,before.availability);assert.equal(o.availabilityUpdated,old);
  }
  for(const id of ['failed','manual']){
    const o=saved.offers.find(o=>o.id===id);
    assert.deepEqual(o.price,originals[0].offers.find(o=>o.id===id).price);assert.equal(o.availabilityUpdated,old);assert.ok(o.error);
  }
  const locked=(await f.find('locked')).data;assert.deepEqual(locked.price,originals[2].price);inRun(locked.offers[0].price.checkedAt,start,end);
  const record=result.results.find(r=>r.slug==='archived').record;
  assert.equal(record.priceUpdated,saved.price.checkedAt);
  const markup=commerceCockpitMarkup(record.commerceOffers,record.slug,record.sourceHash);
  for(const id of ['unchanged','changed'])assert.ok(markup.includes(saved.offers.find(o=>o.id===id).price.checkedAt));
  const serviceUrl=new URL('../src/lib/price-intelligence/service.mjs',import.meta.url).href;
  const reload=JSON.parse(execFileSync(process.execPath,['--experimental-strip-types','--input-type=module','-e',`const {priceAudit}=await import(${JSON.stringify(serviceUrl)});console.log(JSON.stringify(await priceAudit()));`],{env:{...process.env,PFOTENTECHNIK_PRODUCT_FIXTURES:f.dir},encoding:'utf8'}));
  const reloaded=reload.products.find(p=>p.slug==='archived');
  assert.equal(reloaded.priceUpdated,record.priceUpdated);assert.equal(reloaded.current,record.current);
  assert.deepEqual(reloaded.commerceOffers,JSON.parse(JSON.stringify(record.commerceOffers)));
});

test('Shopify offers renew unchanged prices and preserve exact variant and stock rules', async () => {
  const offer=merchantOffer('petlibro',{merchant:'petlibro',network:'awin',program:'petlibro-de',
    officialProductUrl:'https://de.petlibro.com/products/fixture?variant=123',variantId:'123',expectedSku:'EXACT-SKU',commerceDataProvider:'shopify-product'});
  const fetchResource=async url=>({resolvedUrl:url,contentType:'application/json',buffer:Buffer.from(JSON.stringify(url.endsWith('/cart.js')?{currency:'EUR'}:{variants:[{id:123,sku:'EXACT-SKU',price:4999,available:false}]}))});
  const start=Date.now(),result=await refreshCommerceOffer(offer,{fetchResource});
  assert.equal(result.price.current,49.99);inRun(result.price.checkedAt,start,Date.now());assert.equal(result.availability,'out-of-stock');
  assert.deepEqual(result.affiliate,offer.affiliate);
  await assert.rejects(()=>refreshCommerceOffer({...offer,expectedSku:'OTHER'},{fetchResource}),/SKU/);
});

test('failed, ambiguous, unsupported and unmapped sources preserve stored prices and dates independently', async t => {
  const offers=[merchantOffer('ambiguous'),merchantOffer('stock-only'),merchantOffer('unknown-source',{commerceDataProvider:'manual'}),merchantOffer('unmapped',{mappingStatus:'unresolved'}),merchantOffer('success')];
  const f=await fixture(t,[product('failures',{offers})]);
  const fetchText=async url=>({resolvedUrl:url,html:url.endsWith('success')?html(49.99):url.endsWith('stock-only')?stockOnly:html(50)+html(60)});
  const before=await f.find('failures'),start=Date.now();
  const result=await checkProductPrice('failures',{find:f.find,checkLegacy:doc=>checkDocumentPrice(doc,{fetchText}),refresh:offer=>refreshCommerceOffer(offer,{fetchText})});
  assert.equal(result.providerResults.filter(p=>p.ok).length,1,JSON.stringify(result.providerResults));assert.equal(result.ok,true);
  const after=await f.find('failures');assert.deepEqual(after.data.price,before.data.price);assert.equal(after.data.priceUpdated,before.data.priceUpdated);
  for(const o of after.data.offers.filter(o=>o.id!=='success')){
    assert.deepEqual(o.price,offers.find(original=>original.id===o.id).price);assert.equal(o.availabilityUpdated,old);assert.ok(o.error);
  }
  inRun(after.data.offers.at(-1).price.checkedAt,start,Date.now());
  for(const key of ['affiliate','score','ratings','rating','review'])assert.deepEqual(after.data[key],before.data[key]);
});

test('stock/archive state never excludes configured sources; internal product routes are not price sources', () => {
  for(const patch of [{maintenanceStatus:'archived'},{recommendationStatus:'archived'},{availability:'discontinued'},{availability:'out-of-stock'}])assert.equal(commerceRefreshEligible(product('eligible',patch)),true);
  assert.equal(commerceRefreshEligible(product('locked',{priceAutomation:'editorial'})),false);
  assert.equal(commerceRefreshEligible(product('internal-route',{affiliate:undefined})),false);
});

test('another offer at the same merchant cannot suppress an independent main price source', async () => {
  const offer=merchantOffer('variant',{officialProductUrl:'https://shop.example.de/other-product?variant=123',commerceDataProvider:'shopify-product',variantId:'123'});
  const doc={slug:'distinct-sources',file:'memory',data:product('distinct-sources',{offers:[offer]})};
  let legacyCalls=0;
  const result=await checkProductPrice(doc.slug,{find:async()=>doc,checkLegacy:async()=>{legacyCalls++},refresh:async o=>({...o,price:{...o.price,checkedAt:new Date().toISOString()}}),persist:async()=>{}});
  assert.equal(legacyCalls,1);assert.equal(result.providerResults.length,2);
});

test('structured additional offers retain existing identity, currency, freshness and stock restrictions', async () => {
  const {resolveCommerceOffers}=await import('../src/domain/commerceOffers.mjs');
  const offer=merchantOffer('verified',{price:{...price(49.99),checkedAt:new Date().toISOString()},availability:'available'});
  const resolve=o=>resolveCommerceOffers({slug:'direct-source',offers:[o]})[0];
  assert.equal(resolve(offer).current,49.99);assert.equal(resolve(offer).affiliateUrl,offer.affiliate.url);
  assert.equal(resolve({...offer,mappingStatus:'unresolved'}).current,null);
  assert.equal(resolve({...offer,evidenceSources:[]}).canLink,false);
  assert.equal(resolve({...offer,price:{...offer.price,currency:'USD'}}).current,null);
  assert.equal(resolve({...offer,price:price(49.99)}).current,null);
  assert.equal(resolve({...offer,availability:'out-of-stock'}).purchasable,false);
});

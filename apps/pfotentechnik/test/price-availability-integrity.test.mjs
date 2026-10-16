import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import yaml from 'js-yaml';
import {deriveProductOperations, inferInitialAvailability, isAutoRecommendationEligible} from '../src/lib/product-operations/policy.mjs';
import {resolveCommerceOffers} from '../src/domain/commerceOffers.mjs';
import {checkDocumentPrice, checkProductPrice, setManualProductPrice} from '../src/lib/price-intelligence/service.mjs';
import {readProductDocument, updateProductOffer} from '../src/lib/price-intelligence/frontmatter-price.mjs';
import {contentPriceAdapter} from '../src/domain/price/adapters/contentPriceAdapter.ts';
const now = new Date().toISOString();
const product = (patch = {}) => ({slug:'integrity',productStatus:'active',price:{current:129.99,currency:'EUR',status:'unknown',checkedAt:now},priceState:'available',affiliate:{url:'https://www.amazon.de/dp/B012345678?tag=yusha0f-21'},...patch});
const unresolved = {id:'petlibro-de',merchant:'petlibro',network:'awin',program:'petlibro-de',mappingStatus:'unresolved',commerceDataProvider:'shopify-product',price:{current:null,currency:'EUR',status:'unknown'},priceState:'unknown',availability:'unknown',evidenceSources:[]};
async function document(t, data) {
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'pt-integrity-'));
  t.after(()=>fs.rm(dir,{recursive:true,force:true}));
  const file=path.join(dir,'product.md');
  await fs.writeFile(file,'---\n'+yaml.dump(data)+'---\nEditorial text unchanged.\n');
  return readProductDocument(file);
}
const html = (availability, currency='EUR') => `<script type="application/ld+json">${JSON.stringify({'@type':'Product',offers:{'@type':'Offer',price:129.99,priceCurrency:currency,...(availability ? {availability}: {})}})}</script>`;
const fetchText = (availability,currency) => async()=>({html:html(availability,currency),resolvedUrl:'https://www.amazon.de/dp/B012345678'});

test('price and HTTPS link never infer availability; editorial recommendation remains eligible',()=>{
  const ops=deriveProductOperations(product());
  assert.equal(ops.availability,'unknown');assert.equal(ops.priceAvailable,true);assert.equal(ops.purchasable,false);
  assert.equal(ops.availabilityUpdated,undefined);assert.ok(isAutoRecommendationEligible(ops));
  assert.equal(inferInitialAvailability(product()),'unknown');
});
for (const [source,expected] of [['https://schema.org/InStock','available'],['https://schema.org/OutOfStock','out-of-stock'],['https://schema.org/Discontinued','discontinued'],[undefined,'unknown'],['NotAStockValue','unknown']]) {
  test(`retailer stock ${source} persists independently of price`,async t=>{
    const doc=await document(t,product());
    await checkDocumentPrice(doc,{fetchText:fetchText(source)});
    const saved=await readProductDocument(doc.file);
    assert.equal(saved.data.availability,expected);assert.equal(saved.data.price.current,129.99);
    assert.equal(!!saved.data.availabilityUpdated,expected!=='unknown');
  });
}
test('link without price and without stock is not purchasable',()=>{
  const ops=deriveProductOperations(product({price:{current:null,currency:'EUR'}}));
  assert.equal(ops.priceAvailable,false);assert.equal(ops.affiliateAvailable,true);assert.equal(ops.purchasable,false);
});
test('unresolved DE offer cannot expose a price or bypass mapping through a legacy shop link',()=>{
  const data=product({availability:'available',affiliate:{url:'https://de.petlibro.com/products/example'},offers:[{...unresolved,price:{current:99,currency:'EUR',checkedAt:now},priceState:'available'}]});
  const offers=resolveCommerceOffers(data);
  assert.ok(offers.every(o=>!o.purchasable && !o.canLink && o.current===null));
  assert.equal(deriveProductOperations(data).availability,'unknown');
});
test('confirmed Amazon remains available when PETLIBRO is unresolved or fetch fails',async t=>{
  const doc=await document(t,product({availability:'available',availabilityUpdated:now,offers:[unresolved]}));
  const result=await checkProductPrice('integrity',{find:()=>readProductDocument(doc.file),checkLegacy:async()=>{},refresh:async()=>{throw Error('timeout');},persist:updateProductOffer});
  assert.equal(result.record.availability,'available');assert.equal(result.record.purchasable,true);
  const saved=await readProductDocument(doc.file);assert.equal(saved.data.availability,'available');
  assert.equal(saved.data.offers[0].availability,'unknown');assert.match(saved.data.offers[0].error,/timeout/);
});
test('USD price and US InStock never confirm Germany or appear in domestic comparison prices',async t=>{
  const doc=await document(t,product());
  await checkDocumentPrice(doc,{fetchText:fetchText('InStock','USD')});
  const {data}=await readProductDocument(doc.file);
  assert.equal(data.price.current,129.99);assert.equal(data.price.currency,'USD');
  assert.equal(data.availability,'unknown');assert.equal(resolveCommerceOffers(data)[0].current,null);
  assert.equal(contentPriceAdapter.read(data).current,null);
});
test('failed automatic fetch preserves confirmed stock, price, dates, links and editorial review',async t=>{
  const doc=await document(t,product({availability:'available',availabilityUpdated:now,editorial:{lastVerifiedAt:'2026-07-26'}}));
  const before=await fs.readFile(doc.file,'utf8');
  await assert.rejects(()=>checkDocumentPrice(doc,{fetchText:async()=>{throw Error('fetch failed');}}));
  assert.equal(await fs.readFile(doc.file,'utf8'),before);
});
test('successful price-only response preserves a prior manual stock confirmation and its date',async t=>{
  const date='2026-09-01T00:00:00.000Z';
  const doc=await document(t,product({availability:'available',availabilityUpdated:date,editorial:{lastVerifiedAt:'2026-07-26'}}));
  await checkDocumentPrice(doc,{fetchText:fetchText()});
  const saved=await readProductDocument(doc.file);
  assert.equal(saved.data.availability,'available');assert.equal(saved.data.availabilityUpdated,date);
  assert.equal(saved.data.editorial.lastVerifiedAt,'2026-07-26');
});
test('manual stock confirmation is saved without changing editorial date or affiliate target',async t=>{
  const data=product({editorial:{lastVerifiedAt:'2026-07-26'}});const doc=await document(t,data);
  await setManualProductPrice({slug:'integrity',current:'129,99',currency:'EUR',availability:'available'},{find:()=>readProductDocument(doc.file)});
  const saved=await readProductDocument(doc.file);
  assert.equal(saved.data.availability,'available');assert.ok(saved.data.availabilityUpdated);
  assert.equal(saved.data.editorial.lastVerifiedAt,'2026-07-26');assert.equal(saved.data.affiliate.url,data.affiliate.url);
});
test('Granary 2 Vision retains editorial facts and USD history with unknown DE stock',async()=>{
  const {data}=await readProductDocument(new URL('../src/content/products/petlibro-granary-2-vision.md',import.meta.url));
  const ops=deriveProductOperations(data);assert.equal(ops.availability,'unknown');assert.equal(ops.purchasable,false);
  assert.equal(data.price.currency,'USD');assert.equal(data.price.current,129.99);assert.ok(data.affiliate.url);
  assert.equal(data.editorial.lastVerifiedAt,'2026-07-26');assert.equal(data.offers[0].mappingStatus,'unresolved');
});
test('historical automatic positive flags without stock evidence cannot emit InStock',()=>{
  const data=product({availability:'available',availabilityReason:'Bei der automatischen Preisprüfung als verfügbar erkannt.',availabilityUpdated:now});
  assert.equal(deriveProductOperations(data).availability,'unknown');
  assert.ok(resolveCommerceOffers(data).every(o=>!o.purchasable));
});

import {extractOfferFromHtml} from '../src/lib/price-intelligence/extract-offer.mjs';
test('ambiguous multiple seller/variant prices are rejected instead of choosing cheapest',()=>{
  const data=[{'@type':'Offer',price:10,priceCurrency:'EUR',availability:'InStock'},{'@type':'Offer',price:100,priceCurrency:'EUR',availability:'OutOfStock'}];
  assert.equal(extractOfferFromHtml(`<script type="application/ld+json">${JSON.stringify(data)}</script>`),null);
});
test('missing currency and aggregate price ranges cannot invent an EUR product price',()=>{
  for(const offer of [{'@type':'Offer',price:10},{'@type':'AggregateOffer',lowPrice:10,highPrice:100,priceCurrency:'EUR'}])
    assert.equal(extractOfferFromHtml(`<script type="application/ld+json">${JSON.stringify(offer)}</script>`),null);
});
test('foreign shop InStock with an EUR price cannot establish German availability',async t=>{
  const doc=await document(t,product());
  await checkDocumentPrice(doc,{fetchText:async()=>({html:html('InStock'),resolvedUrl:'https://foreign-shop.com/product'})});
  assert.equal((await readProductDocument(doc.file)).data.availability,'unknown');
});
const confirmedOfficial = (patch={}) => ({...unresolved,mappingStatus:'verified',verifiedAt:now,officialProductUrl:'https://de.petlibro.com/products/example?variant=123',variantId:'123',expectedSku:'SKU-123',price:{current:100,currency:'EUR',status:'unknown',checkedAt:now},priceState:'available',availability:'available',availabilityUpdated:now,...patch});
test('confirmed manufacturer offer determines stock independently of unavailable Amazon',()=>{
  const ops=deriveProductOperations(product({availability:'out-of-stock',offers:[confirmedOfficial()]}));
  assert.equal(ops.availability,'available');assert.equal(ops.purchasable,true);assert.equal(ops.availabilityUpdated,now);
});
test('manufacturer-only product retains Awin affiliate readiness and independent stock date',()=>{
  const ops=deriveProductOperations({slug:'official-only',offers:[confirmedOfficial()]});
  assert.equal(ops.availability,'available');assert.equal(ops.affiliateAvailable,true);assert.equal(ops.purchasable,true);
  assert.equal(ops.priceUpdated,undefined);assert.equal(ops.availabilityUpdated,now);
});
test('an offer without a stock check date cannot borrow the legacy price or availability date',()=>{
  const ops=deriveProductOperations(product({availability:'unknown',availabilityUpdated:'2026-01-01',offers:[confirmedOfficial({availabilityUpdated:undefined})]}));
  assert.equal(ops.availability,'available');assert.equal(ops.availabilityUpdated,undefined);
});
test('unknown exact offer does not erase a confirmed legacy offer at the same merchant',()=>{
  const data=product({availability:'available',affiliate:{url:'https://de.petlibro.com/products/example'},offers:[confirmedOfficial({availability:'unknown'})]});
  const resolved=resolveCommerceOffers(data);
  assert.equal(resolved[0].superseded,false);assert.equal(resolved[0].purchasable,true);
  assert.equal(deriveProductOperations(data).availability,'available');
});

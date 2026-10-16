import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {resolveAmazonProductAffiliate} from '../../../packages/affiliate-core/src/affiliate/amazon.ts';
import {resolveCommerceOffers,compareCommerceOffers,commerceDiagnostics} from '../src/domain/commerceOffers.mjs';
import {readProductDocument} from '../src/lib/price-intelligence/frontmatter-price.mjs';
import {commerceCockpitMarkup} from '../src/lib/price-intelligence/commerce-view.mjs';
import {projectConfig} from '../src/project.config.ts';
const tag=projectConfig.affiliate.amazon.trackingId;
const url='https://www.amazon.de/dp/B012345678?th=1&psc=1&linkId=preserve';
const product=(patch={})=>({slug:'amazon-fixture',productStatus:'active',affiliate:{provider:'amazon',url},price:{current:99,currency:'EUR',checkedAt:new Date().toISOString()},priceState:'available',...patch});
for(const availability of ['unknown','unverified','available','out-of-stock','discontinued']){
  test(`Amazon CTA remains visible with ${availability} availability`,()=>{
    const offer=resolveCommerceOffers(product({availability}))[0];assert.ok(offer.canLink);assert.ok(offer.affiliateUrl);
    assert.equal(new URL(offer.affiliateUrl).searchParams.get('tag'),tag);
    assert.equal(offer.ctaLabel,availability==='available'?'Bei Amazon ansehen':'Preis und Verfügbarkeit bei Amazon prüfen');
    if(availability!=='available')assert.equal(offer.purchasable,false);
  });
}
for(const patch of [{price:{current:null,currency:'EUR'},priceState:'unknown'},{price:{current:99,currency:'EUR',checkedAt:'2020-01-01'}},{recommendationStatus:'archived',maintenanceStatus:'archived',productStatus:'discontinued'}]){
  test('missing/stale price and editorial non-recommendation cannot remove neutral Amazon option '+JSON.stringify(patch),()=>{
    const result=compareCommerceOffers(resolveCommerceOffers(product({...patch,availability:'unknown'})));
    assert.equal(result.offers.length,1);assert.equal(result.cheapestId,null);
    assert.match(result.offers[0].ctaLabel,/Preis und Verfügbarkeit/);
  });
}
test('missing tag is added without changing exact ASIN, variant or other tracking parameters',()=>{
  const link=resolveAmazonProductAffiliate(url,tag);
  const parsed=new URL(link.url);assert.equal(parsed.pathname,'/dp/B012345678');
  assert.equal(parsed.searchParams.get('th'),'1');assert.equal(parsed.searchParams.get('psc'),'1');assert.equal(parsed.searchParams.get('linkId'),'preserve');assert.equal(parsed.searchParams.get('tag'),tag);assert.ok(link.missingSourceTag);
});
test('correct affiliate URL is retained and duplicate tags are collapsed',()=>{
  const source=url+'&tag='+tag;assert.equal(resolveAmazonProductAffiliate(source,tag).url,source);
  const fixed=new URL(resolveAmazonProductAffiliate(source+'&tag=other-21',tag).url);assert.deepEqual(fixed.searchParams.getAll('tag'),[tag]);
});
test('missing or invalid configured partner ID fails explicitly even if the source has a tag',()=>{
  for(const value of [undefined,null,'','bad tag']){
    const link=resolveAmazonProductAffiliate(url+'&tag='+tag,value);assert.equal(link.url,null);assert.equal(link.error,'missing-tracking-id');
    const offers=resolveCommerceOffers(product(),{}, {amazonTrackingId:value});
    // undefined explicitly uses the application's configured default; blank/null must fail closed.
    if(value!==undefined){assert.equal(offers[0].canLink,false);assert.equal(offers[0].amazonLink.error,'missing-tracking-id');}
  }
});
test('only trusted HTTPS Amazon product paths can become Amazon options; never create searches',()=>{
  for(const source of ['https://amazon.de.evil.example/dp/B012345678','javascript:alert(1)','http://www.amazon.de/dp/B012345678','https://user:pass@www.amazon.de/dp/B012345678','https://www.amazon.de/s?k=feeder','https://www.amazon.de/s?asin=B012345678','https://www.amazon.de/dp/invalid','https://www.amazon.de:444/dp/B012345678'])assert.equal(resolveAmazonProductAffiliate(source,tag).url,null,source);
});
test('known wrong mapping and broken/unverified short links are diagnosed rather than redirected unchecked',()=>{
  const short='https://amzn.to/example';
  assert.equal(resolveAmazonProductAffiliate(short,tag).url,null);
  assert.equal(resolveAmazonProductAffiliate(short,tag,{[short]:{error:'HTTP 404'}}).url,null);
  assert.equal(resolveAmazonProductAffiliate(short,tag,{[short]:{destination:'https://evil.example/dp/B012345678'}}).url,null);
  const offers=resolveCommerceOffers({offers:[{id:'wrong',merchant:'amazon',network:'partnernet',officialProductUrl:url,mappingStatus:'invalid',availability:'unknown'}]});
  assert.equal(offers[0].canLink,false);
});
test('verified affiliate short URLs retain their existing redirects and configured embedded tag',()=>{
  const short='https://amzn.to/example';const destination=url+'&tag='+tag;
  const link=resolveAmazonProductAffiliate(short,tag,{[short]:{destination}});
  assert.equal(link.url,short);assert.equal(new URL(link.effectiveUrl).searchParams.get('tag'),tag);
  const repaired=resolveAmazonProductAffiliate(short,tag,{[short]:{destination:url}});assert.notEqual(repaired.url,short);assert.equal(new URL(repaired.url).searchParams.get('tag'),tag);
});
test('Amazon and verified Awin options coexist without an unsupported cheapest claim',()=>{
  const official={id:'petlibro',merchant:'petlibro',network:'awin',program:'petlibro-de',mappingStatus:'verified',verifiedAt:'2026-10-16',commerceDataProvider:'manual',officialProductUrl:'https://de.petlibro.com/products/example',price:{current:100,currency:'EUR',checkedAt:new Date().toISOString()},priceState:'available',availability:'available'};
  const options=compareCommerceOffers(resolveCommerceOffers(product({availability:'unknown',offers:[official]})));
  assert.equal(options.offers.length,2);assert.ok(options.offers.some(o=>o.affiliateUrl.includes('awin1')));assert.ok(options.offers.some(o=>o.merchant==='amazon'));assert.equal(options.cheapestId,null);
});
test('existing non-Amazon vendor with stale provider label remains a neutral vendor, not an Amazon link',()=>{
  const options=resolveCommerceOffers(product({availability:'available',affiliate:{provider:'amazon',url:'https://www.mediamarkt.de/de/product/example'}}));
  assert.equal(options[0].amazonLink,null);assert.equal(options[0].affiliateUrl,'https://www.mediamarkt.de/de/product/example');
});
test('PETKIT example has its actual configured-tag Amazon product target and remains unknown stock',async()=>{
  const {data}=await readProductDocument(new URL('../src/content/products/petkit-yumshare-dual-hopper.md',import.meta.url));
  const offer=resolveCommerceOffers(data)[0];assert.equal(data.affiliate.url,'https://amzn.to/3TQJw1G');assert.equal(offer.affiliateUrl,data.affiliate.url);
  assert.equal(offer.amazonLink.asin,'B0DMNN4CSZ');assert.equal(new URL(offer.amazonLink.effectiveUrl).searchParams.get('tag'),tag);
  assert.ok(offer.canLink);assert.equal(offer.availability,'unknown');assert.equal(offer.purchasable,false);
});
test('existing Cockpit distinguishes tag repairs, invalid links, CTA suppression and missing merchant options',()=>{
  const offers=resolveCommerceOffers(product({availability:'unknown'}));const diagnostics=commerceDiagnostics(offers);
  assert.ok(diagnostics.amazonMissingSourceTag);assert.equal(diagnostics.amazonCtaSuppressed,false);
  assert.match(commerceCockpitMarkup(offers),/Tag fehlte im Original/);
  const invalid=resolveCommerceOffers(product({affiliate:{provider:'amazon',url:'https://www.amazon.de/s?k=feeder'}}));
  assert.ok(commerceDiagnostics(invalid).amazonInvalidLink);assert.ok(commerceDiagnostics(invalid).noMerchantOption);assert.match(commerceCockpitMarkup(invalid),/Keine aktive Händleroption/);
});

// Historical snapshots retain every word and link. Only the two price-state
// labels inside an identified purchase <dl> are projected to the snapshot clock,
// after verifying the actual rendered labels and price against the build clock.
import assert from 'node:assert/strict';
import {parse,serialize} from 'parse5';
import {buildPriceIndex} from '../../src/domain/price/engine.ts';
import {resolveCommerceOffers,compareCommerceOffers} from '../../src/domain/commerceOffers.mjs';
import {deriveProductOperations} from '../../src/lib/product-operations/policy.mjs';
export function* snapshotNodes(n){if(!n)return;yield n;if(['script','style'].includes(n.tagName))return;for(const c of n.childNodes??[])yield* snapshotNodes(c)}
export const snapshotText=n=>[...snapshotNodes(n)].filter(n=>n.nodeName==='#text').map(n=>n.value).join(' ').replace(/\s+/g,' ').trim();
const attr=(n,name)=>n.attrs?.find(a=>a.name===name)?.value;
export function pricePresentationAt(data,at){
 const now=new Date(at);assert.ok(Number.isFinite(+now),'An explicit valid price clock is required');
 const price=buildPriceIndex([{id:data.slug,data}],undefined,now).bySlug.get(data.slug);
 const operations=deriveProductOperations(data,{now});
 const offers=compareCommerceOffers(resolveCommerceOffers(data,{}, {now:+now})).offers;
 return offers.flatMap(offer=>{
  const legacyPrice=offers.length===1&&offer.legacy&&offer.verified&&offer.domestic!==false&&(!price?.currency||price.currency===offer.currency)?price?.formattedCurrent:null;
  const displayPrice=offer.formattedPrice||legacyPrice;if(!displayPrice)return [];
  const historical=!offer.formattedPrice&&Boolean(legacyPrice)&&(!operations.priceAvailable||price?.isStale);
  return [{merchant:offer.merchant,price:displayPrice.replace(/\s+/g,' ').trim(),label:historical?'Früherer Anschaffungspreis':offer.variantLabel?.startsWith('Paketangebot:')?'Paketpreis inklusive Jahrespaket':'Anschaffungspreis',badge:historical?(price?.isStale?'Veralteter Preisstand':'Nicht aktuell bestätigt'):'Hinterlegter Preis'}];
 });
}
export function protectedSnapshotAt(dom,{data,snapshotAt,renderedAt}){
 const projected=parse(serialize(dom)),all=[...snapshotNodes(projected)];
 if(data){
  const actual=pricePresentationAt(data,renderedAt),historical=pricePresentationAt(data,snapshotAt);
  const purchases=all.filter(n=>n.tagName==='dl'&&attr(n,'class')==='px2-price__purchase');
  assert.equal(purchases.length,actual.length,`${data.slug}: rendered price count`);
  assert.equal(historical.length,actual.length,`${data.slug}: time must not add/remove a purchase price`);
  for(const [i,dl] of purchases.entries()){
   const parts=[...snapshotNodes(dl)],dt=parts.find(n=>n.tagName==='dt'),dd=parts.find(n=>n.tagName==='dd'),small=parts.find(n=>n.tagName==='small');
   assert.equal(snapshotText(dd),actual[i].price,`${data.slug}: rendered price amount`);
   assert.equal(snapshotText(dt),actual[i].label,`${data.slug}: rendered price label at build clock`);
   assert.equal(snapshotText(small),actual[i].badge,`${data.slug}: rendered freshness at build clock`);
   assert.equal(actual[i].price,historical[i].price,`${data.slug}: amounts cannot be projected`);
   assert.equal(actual[i].merchant,historical[i].merchant,`${data.slug}: merchants cannot be projected`);
   // Only plain labels can vary. Nested markup is rejected; links and all
   // remaining text are still compared to the complete historical snapshot.
   for(const [node,value] of [[dt,historical[i].label],[small,historical[i].badge]]){
    assert.equal(node.childNodes.length,1);assert.equal(node.childNodes[0].nodeName,'#text');
    node.childNodes[0].value=value;
   }
  }
 }
 return {text:snapshotText(projected),links:all.filter(n=>n.tagName==='a').map(n=>attr(n,'href')).filter(Boolean)};
}

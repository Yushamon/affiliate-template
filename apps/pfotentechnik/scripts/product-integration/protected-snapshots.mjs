// Historical snapshots retain editorial text, scores, model assignments and links.
// Price-state labels use the snapshot clock. The owner-authorized 37.3A exception
// also permits current Commerce amounts in alternative cards, validated before
// projecting only those identified plain price nodes to their legacy amounts.
import assert from 'node:assert/strict';
import {parse,serialize} from 'parse5';
import {buildPriceIndex} from '../../src/domain/price/engine.ts';
import {resolveCommerceOffers,compareCommerceOffers} from '../../src/domain/commerceOffers.mjs';
import {parseMoneyValue} from '../../src/domain/price/adapters/contentPriceAdapter.ts';
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
export function projectProtectedSnapshotDom(dom,{data,snapshotAt,renderedAt,products=[]}){
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
 // Only prices inside the known alternative-card price slot are eligible.
 // Every current amount is checked against the same index used by the page;
 // the complete projected snapshot still protects every other character/link.
 const catalog=new Map(products.map(p=>[p.slug,p]));
 const index=buildPriceIndex(products.map(data=>({id:data.slug,data})),undefined,new Date(renderedAt));
 for(const section of all.filter(n=>n.tagName==='section'&&attr(n,'id')==='alternativen')){
  for(const article of [...snapshotNodes(section)].filter(n=>n.tagName==='article')){
   const nodes=[...snapshotNodes(article)],link=nodes.find(n=>n.tagName==='a'),slug=attr(link,'href')?.match(/^\/produkt\/([^/]+)\/$/)?.[1];
   const slot=nodes.find(n=>attr(n,'class')?.split(/\s+/).includes('alternatives__meta'));
   const amount=slot&&[...snapshotNodes(slot)].find(n=>n.tagName==='b');
   if(!amount)continue;
   const source=catalog.get(slug);assert.ok(source,`${slug}: alternative price needs its source`);
   assert.equal(snapshotText(amount),index.bySlug.get(slug)?.formattedCurrent?.replace(/\s+/g,' ').trim(),`${slug}: current alternative price`);
   const legacy=parseMoneyValue(source.price?.current??source.conversion?.currentPrice??source.conversion?.price??source.affiliate?.price);
   assert.ok(legacy,`${slug}: legacy alternative price required`);
   assert.equal(amount.childNodes.length,1);assert.equal(amount.childNodes[0].nodeName,'#text');
   amount.childNodes[0].value=new Intl.NumberFormat('de-DE',{style:'currency',currency:source.price?.currency||'EUR'}).format(legacy);
  }
 }
 return projected;
}

export function protectedSnapshotAt(dom,options){const projected=projectProtectedSnapshotDom(dom,options);return {text:snapshotText(projected),links:[...snapshotNodes(projected)].filter(n=>n.tagName==='a').map(n=>attr(n,'href')).filter(Boolean)}}

// The stronger HTML guard retains all attributes, scripts and markup as well.
// Only exact Commerce-derived fields in the existing fit-assistant JSON may
// differ; model identity and every other JSON property remain byte-protected.
export function protectedHtmlAt(currentHtml,baselineHtml,options){
 const projected=projectProtectedSnapshotDom(parse(currentHtml),options),old=parse(baselineHtml);
 const currentNodes=[...snapshotNodes(projected)],oldNodes=[...snapshotNodes(old)];
 const index=buildPriceIndex(options.products.map(data=>({id:data.slug,data})),undefined,new Date(options.renderedAt));
 for(const marker of ['data-fit-profile','data-fit-alternatives']){
  const node=currentNodes.find(n=>n.tagName==='script'&&attr(n,marker)!==undefined),prior=oldNodes.find(n=>n.tagName==='script'&&attr(n,marker)!==undefined);
  if(!node||!prior)continue;
  const current=JSON.parse(node.childNodes[0].value),historical=JSON.parse(prior.childNodes[0].value);
  const records=Array.isArray(current)?current:[{decisionProfile:current,href:`/produkt/${options.data.slug}/`}];
  const priors=Array.isArray(historical)?historical:[{decisionProfile:historical,href:`/produkt/${options.data.slug}/`}];
  assert.equal(records.length,priors.length,'fit assistant model count');
  for(const [i,record] of records.entries()){
   assert.equal(record.href,priors[i].href,'fit assistant model order');
   const slug=record.href?.match(/^\/produkt\/([^/]+)\/$/)?.[1],price=index.bySlug.get(slug);
   if(record.decisionProfile?.priceTier!==priors[i].decisionProfile?.priceTier){
    assert.equal(record.decisionProfile.priceTier,price?.tier,`${slug}: canonical fit price tier`);
    record.decisionProfile.priceTier=priors[i].decisionProfile.priceTier;
   }
   if(record.priceLabel!==priors[i].priceLabel){assert.equal(record.priceLabel,price?.formattedCurrent,`${slug}: canonical fit price label`);record.priceLabel=priors[i].priceLabel}
  }
  node.childNodes[0].value=JSON.stringify(current).replaceAll('<','\\u003c');
 }
 return {current:serialize(projected),baseline:serialize(old)};
}

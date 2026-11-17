// Live source probes are read-only: they do not confirm prices in product files.
import fs from 'node:fs';import path from 'node:path';
import {app,sourceInventory} from '../indexation/scan.mjs';
import {refreshOfficialOffer} from '../../src/lib/price-intelligence/commerce-refresh.mjs';
import {safeFetchText} from '../../src/lib/price-intelligence/safe-fetch.mjs';
import {extractOfferFromHtml} from '../../src/lib/price-intelligence/extract-offer.mjs';
const products=sourceInventory().filter(p=>p.collection==='products'),results=[];
const petlibro=products.find(p=>p.data.slug==='petlibro-air-automatic-feeder');
const amazon=products.find(p=>/^https:\/\/(?:www\.)?amazon\.de\/(?:dp|gp\/product)\//.test(p.data.affiliate?.url??''));
const verified=products.find(p=>p.data.offers?.some(o=>o.mappingStatus==='verified'&&o.commerceDataProvider==='shopify-product'));
for(const task of [
 {name:'PETLIBRO bestätigte Variante',slug:verified.data.slug,run:()=>refreshOfficialOffer(verified.data.offers.find(o=>o.mappingStatus==='verified'&&o.commerceDataProvider==='shopify-product'))},
 {name:'PETLIBRO offizielle Variante',slug:petlibro.data.slug,run:()=>refreshOfficialOffer(petlibro.data.offers.find(o=>o.commerceDataProvider==='shopify-product'))},
 {name:'Bestehendes Händlerziel (MediaMarkt, trotz altem Provider-Label amazon)',slug:petlibro.data.slug,run:async()=>{const p=await safeFetchText(petlibro.data.affiliate.url);const o=extractOfferFromHtml(p.html,p.resolvedUrl);if(!o)throw Error('Keine belastbare exakte Preis-/Variantenangabe gefunden.');return o}},
 {name:'Amazon exaktes Produktziel',slug:amazon.data.slug,run:async()=>{const p=await safeFetchText(amazon.data.affiliate.url);const o=extractOfferFromHtml(p.html,p.resolvedUrl);if(!o||o.method!=='amazon-buybox')throw Error('Keine belastbare exakte Amazon-Preis-/Bestellangabe gefunden.');return o}}
]){try{results.push({name:task.name,slug:task.slug,ok:true,result:await task.run()})}catch(e){results.push({name:task.name,slug:task.slug,ok:false,error:e.message})}}
fs.writeFileSync(path.join(app,'reports/product-operations-recovery-37.3a-qa/live-source-probes.json'),JSON.stringify({at:new Date().toISOString(),readOnly:true,priceFilesWritten:0,results},null,2)+'\n');console.log(results.map(({name,ok,error})=>({name,ok,error})));

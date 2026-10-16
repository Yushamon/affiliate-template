#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from 'node:child_process';
import { priceAudit, listPriceDocuments } from "../../src/lib/price-intelligence/service.mjs";
import { resolveAmazonProductAffiliate } from '../../../../packages/affiliate-core/src/affiliate/amazon.ts';
import { projectConfig } from '../../src/project.config.ts';
const appRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const documents = await listPriceDocuments();
if (process.argv.includes('--verify-amazon-links')) {
  const file=path.join(appRoot,'src/config/amazon-short-links.json');
  const records=JSON.parse(await fs.readFile(file,'utf8'));
  const urls=[...new Set(documents.flatMap(({data})=>[data.affiliate?.url,...(data.offers??[]).map(o=>o.officialProductUrl)]).filter(url=>/^https:\/\/(amzn.to|amzn.eu)\//.test(url??'')))];
  let next=0;
  await Promise.all(Array.from({length:4},async()=>{
    while(next<urls.length){
      const source=urls[next++];let current=source;
      try {
        for(let hop=0;hop<5;hop++){
          const response=await fetch(current,{method:'HEAD',redirect:'manual',signal:AbortSignal.timeout(15000)});
          const checkedAt=new Date().toISOString();
          if([404,410].includes(response.status)){records[source]={error:`HTTP ${response.status}`,checkedAt};break;}
          const location=response.headers.get('location');
          if(!location)throw Error(`No redirect destination (HTTP ${response.status})`);
          const target=new URL(location,current);
          if(target.protocol!=='https:'||target.username||target.password||target.port)throw Error('Unsafe redirect target');
          if(['amzn.to','amzn.eu'].includes(target.hostname)){current=target.href;continue;}
          const verified=resolveAmazonProductAffiliate(target.href,projectConfig.affiliate.amazon.trackingId);
          if(!verified.url){records[source]={error:verified.error,checkedAt};break;}
          records[source]={destination:target.href,checkedAt};break;
        }
      } catch(error){
        // Transient network/403 errors do not invalidate a previously observed link.
        console.error(`${source}: ${error.message}; previous destination retained.`);
      }
    }
  }));
  await fs.writeFile(file,JSON.stringify(records,null,2)+'\n');
  // A fresh process reloads the validated redirect data used by the shared resolver.
  const run=spawnSync(process.execPath,[fileURLToPath(import.meta.url),...process.argv.slice(2).filter(arg=>arg!=='--verify-amazon-links')],{stdio:'inherit'});
  process.exit(run.status??1);
}
const report = await priceAudit();
await fs.mkdir(path.join(appRoot,"reports"),{recursive:true});
await fs.writeFile(path.join(appRoot,"reports","price-intelligence-audit.json"),JSON.stringify(report,null,2));
console.log(`Price Intelligence: ${report.summary.products} Produkte, ${report.summary.missingPrice} ohne Preis, ${report.summary.stale30} Prüfungen fällig, ${report.summary.missingAffiliate} ohne Affiliate-Ziel.`);
console.log(`Amazon: ${report.summary.amazonLinks} hinterlegte Ziele, ${report.summary.amazonMissingSourceTag} Tag-Reparaturen, ${report.summary.amazonInvalidLink} ungültige Produktziele, ${report.summary.amazonCtaSuppressed} unterdrückte gültige CTAs. ${report.summary.noMerchantOption} Produkte ohne aktive Händleroption.`);
if(process.argv.includes('--amazon-cta')){
  const rows=await Promise.all(report.products.map(async record=>{
    const data=documents.find(doc=>doc.slug===record.slug).data;
    const amazon=record.commerceOffers.filter(offer=>offer.amazonLink);
    const affected=amazon.some(offer=>offer.amazonLink.url && (data.offers?.length
      ? ['out-of-stock','temporarily-unavailable','discontinued'].includes(offer.availability)||data.productStatus==='discontinued'
      : !record.purchasable));
    let renderedAmazonCtaPresent=null;
    try {
      const html=await fs.readFile(path.join(appRoot,'dist/produkt',record.slug,'index.html'),'utf8');
      renderedAmazonCtaPresent=[...html.matchAll(/<a\b[^>]*>/gi)].some(match=>/data-merchant=["']amazon["']/.test(match[0])&&/data-affiliate-link/.test(match[0])&&!/aria-disabled=["']true/.test(match[0]));
    } catch { /* No completed production build available. */ }
    const renderedAmazonCtaSuppressed=amazon.some(offer=>!!offer.amazonLink.url) && renderedAmazonCtaPresent===false;
    return {slug:record.slug,previouslySuppressed:affected,renderedAmazonCtaPresent,renderedAmazonCtaSuppressed,amazonLinkPresent:record.amazonLinkPresent,amazonMissingSourceTag:record.amazonMissingSourceTag,amazonInvalidLink:record.amazonInvalidLink,amazonCtaSuppressed:record.amazonCtaSuppressed,noMerchantOption:record.noMerchantOption,
      offers:record.commerceOffers.map(offer=>({id:offer.id,merchant:offer.merchant,sourceUrl:offer.officialProductUrl,url:offer.affiliateUrl,effectiveUrl:offer.amazonLink?.effectiveUrl,asin:offer.amazonLink?.asin,availability:offer.availability,canLink:offer.canLink,purchasable:offer.purchasable,ctaLabel:offer.ctaLabel,error:offer.amazonLink?.error,missingSourceTag:offer.amazonLink?.missingSourceTag}))};
  }));
  const out=path.join(appRoot,'reports/amazon-cta-hotfix');await fs.mkdir(out,{recursive:true});
  await fs.writeFile(path.join(out,'audit.json'),JSON.stringify({generatedAt:report.generatedAt,summary:{...report.summary,previouslySuppressed:rows.filter(row=>row.previouslySuppressed).length,renderedAmazonCtaSuppressed:rows.filter(row=>row.renderedAmazonCtaSuppressed).length},products:rows},null,2)+'\n');
}
if(process.argv.includes("--strict") && report.summary.missingAffiliate>0) process.exitCode=1;

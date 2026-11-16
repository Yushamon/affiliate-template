import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readProductDocument } from '../../src/lib/price-intelligence/frontmatter-price.mjs';
import { resolveCommerceOffers } from '../../src/domain/commerceOffers.mjs';
const app=fileURLToPath(new URL('../../',import.meta.url));
const changes=JSON.parse(fs.readFileSync(path.join(app,'research/product-freshness-36.0/changes.json')));
const queue=[];for(const p of changes.products){const d=(await readProductDocument(path.join(app,p.file))).data;for(const offer of resolveCommerceOffers(d).filter(o=>o.canLink))queue.push({slug:p.slug,url:offer.affiliateUrl,expectedAsin:d.asin??null})}
const results=[];
async function worker(){while(queue.length){const row=queue.shift(),checkedAt=new Date().toISOString();try{
 const r=await fetch(row.url,{signal:AbortSignal.timeout(18000),headers:{'User-Agent':'Mozilla/5.0'}}),html=await r.text();
 const title=html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g,' ').trim()??null;
 const restricted=r.status===403||r.status===429||/robot check|captcha|automated access|access denied/i.test(title??'');
 results.push({...row,checkedAt,status:r.status,finalUrl:r.url,title,result:restricted?'restricted':r.ok?'reachable':'http-error',identity:'URL-/Variantenprüfung und frühere Modellbelege separat; HTTP 200 allein bestätigt kein Modell und keine Lieferbarkeit.'});
 }catch(e){results.push({...row,checkedAt,status:null,result:'unresolved',error:e.name+': '+e.message})}}}
await Promise.all(Array.from({length:6},worker));results.sort((a,b)=>a.slug.localeCompare(b.slug)||a.url.localeCompare(b.url));
fs.writeFileSync(path.join(app,'research/product-freshness-36.0/merchant-link-receipts.json'),JSON.stringify({readOnly:true,results},null,2)+'\n');console.log(JSON.stringify({links:results.length,results:results.reduce((a,r)=>(a[r.result]=(a[r.result]??0)+1,a),{})}));

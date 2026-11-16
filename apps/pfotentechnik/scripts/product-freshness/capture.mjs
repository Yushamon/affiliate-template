// Read-only source receipts. A successful HTTP response is not an editorial approval.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { parse } from 'parse5';
const app=fileURLToPath(new URL('../../',import.meta.url));
const root=path.join(app,'research/product-freshness-36.0');
const baseline=JSON.parse(fs.readFileSync(path.join(root,'baseline.json')));
const sources=new Map();
for(const p of baseline.products.filter(p=>p.active)){
 const refs=(p.data.evidenceSources??[]).filter(s=>['manufacturer','manual','officialStore'].includes(s.sourceType)||/hersteller|offiziell|support|handbuch|produktseite/i.test(s.source+' '+s.assertion));
 for(const s of refs.slice(0,2)){if(!sources.has(s.url))sources.set(s.url,{url:s.url,slugs:[]});sources.get(s.url).slugs.push(p.slug)}
}
if(fs.existsSync(path.join(root,'source-plan.json')))for(const s of JSON.parse(fs.readFileSync(path.join(root,'source-plan.json')))){
 if(!sources.has(s.url))sources.set(s.url,{url:s.url,slugs:[]});sources.get(s.url).slugs.push(...s.slugs);
}
const out='/tmp/pt360-captures';fs.mkdirSync(out,{recursive:true});
const prior=fs.existsSync(path.join(root,'http-receipts.json'))?JSON.parse(fs.readFileSync(path.join(root,'http-receipts.json'))).receipts:[];
const cached=new Map(prior.map(r=>[r.url,r]));
const receipts=[],queue=[];
for(const s of sources.values()){
 const old=cached.get(s.url);
 if(!process.argv.includes('--refresh')&&old&&(old.error||fs.existsSync(path.join(out,old.id+'.bin'))))receipts.push({...old,slugs:[...new Set(s.slugs)]});else queue.push(s);
}
async function worker(){while(queue.length){const s=queue.shift(),id=createHash('sha256').update(s.url).digest('hex').slice(0,20),checkedAt=new Date().toISOString();try{
 const response=await fetch(s.url,{signal:AbortSignal.timeout(18000),headers:{'User-Agent':'Mozilla/5.0 (compatible; ProductEvidenceAudit/36.0)'}});
 const bytes=Buffer.from(await response.arrayBuffer());
 const contentType=response.headers.get('content-type')??'';
 let title=null,publishedAt=null,modifiedAt=null;
 if(contentType.includes('html')){
  const dom=parse(bytes.toString()),chunks=[];
  function visit(n){if(['script','style','noscript','svg'].includes(n.tagName))return;if(n.tagName==='title')title=n.childNodes?.map(c=>c.value??'').join('');if(n.tagName==='meta'){const a=Object.fromEntries(n.attrs.map(a=>[a.name,a.value]));if(a.property==='article:published_time')publishedAt=a.content;if(a.property==='article:modified_time')modifiedAt=a.content;}if(n.nodeName==='#text')chunks.push(n.value);for(const c of n.childNodes??[])visit(c)}visit(dom);
  fs.writeFileSync(path.join(out,id+'.txt'),chunks.join(' ').replace(/\s+/g,' ').trim());
 }
 fs.writeFileSync(path.join(out,id+'.bin'),bytes);
 receipts.push({...s,id,checkedAt,status:response.status,finalUrl:response.url,contentType,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),title,publishedAt,modifiedAt,editoriallyApproved:false});
 }catch(e){receipts.push({...s,id,checkedAt,status:null,error:e.name+': '+e.message,editoriallyApproved:false})}
 }}
await Promise.all(Array.from({length:8},worker));
receipts.sort((a,b)=>a.url.localeCompare(b.url));
fs.writeFileSync(path.join(root,'http-receipts.json'),JSON.stringify({note:'HTTP capture only; editorial source assessments are recorded separately. Full text stays in /tmp/pt360-captures.',receipts},null,2)+'\n');
console.log(JSON.stringify({sources:receipts.length,ok:receipts.filter(r=>r.status===200).length,restricted:receipts.filter(r=>r.status!==200).length}));

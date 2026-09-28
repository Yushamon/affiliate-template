#!/usr/bin/env node
/** Audit-only extension of the existing SEO and content-quality architecture.
 * Usage: node .../audit-google-signal-integrity.mjs [--live]
 * Writes only reports/google-signal-integrity-35.2. Live mode performs public GETs,
 * four at a time, follows at most five redirects, and caches raw measured signals.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {parse} from 'parse5';
import {collectContentQuality} from '../content-quality/core.mjs';
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const repo=path.resolve(app,'../..'), dist=path.join(app,'dist');
const argValue=name=>{const index=process.argv.indexOf(name);return index>=0?process.argv[index+1]:undefined;};
const out=path.resolve(repo,argValue('--out')??'reports/google-signal-integrity-35.2');
const origin='https://pfotentechnik.de';
fs.mkdirSync(out,{recursive:true});
const read=f=>fs.readFileSync(f,'utf8');
const json=f=>JSON.parse(read(f));
const write=(f,x)=>fs.writeFileSync(path.join(out,f),JSON.stringify(x,null,2)+'\n');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const csv=(f,rows,headers=Object.keys(rows[0]??{url:''}))=>fs.writeFileSync(path.join(out,f),[headers.join(','),...rows.map(r=>headers.map(h=>'"'+String(typeof r[h]==='object'?JSON.stringify(r[h]):r[h]??'').replaceAll('"','""')+'"').join(','))].join('\n')+'\n');
const hash=t=>createHash('sha256').update(t).digest('hex');
const normalizeText=t=>String(t??'').replace(/\s+/g,' ').trim();
function text(n){if(['script','style','template','noscript'].includes(n.tagName))return '';return n.nodeName==='#text'?n.value:(n.childNodes??[]).map(text).join(' ');}
function nodes(n,acc=[]){if(n.tagName)acc.push(n);for(const c of n.childNodes??[])nodes(c,acc);return acc;}
const attrs=n=>Object.fromEntries((n.attrs??[]).map(a=>[a.name,a.value]));
function region(n){for(let p=n.parentNode;p;p=p.parentNode){if(['nav','header','footer'].includes(p.tagName))return 'navigation';if(p.tagName==='main')return 'contextual';}return 'other';}
const abs=(v,base)=>{try{return new URL(v,base).href;}catch{return '';}};
const internal=u=>{try{return ['pfotentechnik.de','www.pfotentechnik.de'].includes(new URL(u).hostname);}catch{return false;}};
const withoutHash=u=>u.split('#')[0];
function schemaObjects(v,a=[]){if(!v||typeof v!=='object')return a;if(v['@type'])a.push(v);for(const x of Object.values(v))if(typeof x==='object')schemaObjects(x,a);return a;}
function parseHtml(html,url){
 const all=nodes(parse(html));const tags=t=>all.filter(n=>n.tagName===t);const meta=tags('meta').map(attrs);
 const schemas=[],errors=[];for(const n of tags('script').filter(n=>attrs(n).type==='application/ld+json'))try{schemas.push(JSON.parse(n.childNodes.map(c=>c.value??'').join('')));}catch(e){errors.push(e.message);}
 const main=tags('main')[0]??tags('body')[0];const mainText=normalizeText(text(main??{}));
 const links=tags('a').map(n=>({href:attrs(n).href,anchor:normalizeText(text(n)),region:region(n),rel:attrs(n).rel??''})).filter(x=>x.href&&!/^(mailto:|tel:|javascript:|data:)/i.test(x.href)).map(x=>({...x,url:abs(x.href,url)}));
 const objects=schemas.flatMap(s=>schemaObjects(s));const schemaUrls=[];
 function refs(x,key=''){if(typeof x==='string'&&['url','@id','item','mainEntityOfPage'].includes(key)&&internal(x))schemaUrls.push(x);else if(x&&typeof x==='object')for(const [k,v]of Object.entries(x))refs(v,k);}schemas.forEach(x=>refs(x));
 return {canonical:tags('link').filter(n=>(attrs(n).rel??'').split(' ').includes('canonical')).map(n=>attrs(n).href),robots:meta.filter(m=>['robots','googlebot','googlebot-news'].includes(m.name?.toLowerCase())).map(m=>({agent:m.name,value:m.content})),description:meta.find(m=>m.name==='description')?.content??'',title:normalizeText(text(tags('title')[0]??{})),h1:tags('h1').map(n=>normalizeText(text(n))),mainText,mainHash:hash(mainText),mainWords:mainText.split(' ').filter(Boolean).length,links,schemas:objects,schemaUrls:[...new Set(schemaUrls)],schemaErrors:errors,images:tags('img').map(attrs),scripts:tags('script').map(attrs).filter(a=>a.src),islands:tags('astro-island').map(attrs),refresh:meta.find(m=>m['http-equiv']?.toLowerCase()==='refresh')?.content??''};
}
const config=json(path.join(app,'scripts/content-quality/config.json'));
const quality=collectContentQuality({appRoot:app,repoRoot:repo,config});
write('content-quality-evidence.json',{findings:quality.findings,conflicts:quality.conflicts,decisions:quality.decisions,searchData:quality.searchData});
const qualityByRoute=new Map(quality.pages.map(p=>[p.route,p]));
const redirects=read(path.join(app,'public/_redirects')).split(/\r?\n/).filter(l=>l.trim()&&!l.startsWith('#')).map(l=>{const [source,target,status]=l.trim().split(/\s+/);return {source:abs(source,origin),target:abs(target,origin),status:Number(status)};}).filter(r=>r.status>=300&&r.status<400);
const redirectMap=new Map(redirects.map(r=>[r.source,r]));
const sitemapEntries=walk(dist).filter(f=>/sitemap.*\.xml$/.test(f)).flatMap(f=>[...read(f).matchAll(/<url>([\s\S]*?)<\/url>/g)].map(m=>({url:m[1].match(/<loc>(.*?)<\/loc>/)?.[1],lastmod:m[1].match(/<lastmod>(.*?)<\/lastmod>/)?.[1]??'',file:path.relative(repo,f)})));
const sitemap=new Map(sitemapEntries.map(s=>[s.url,s]));
const pages=walk(dist).filter(f=>f.endsWith('.html')).map(f=>{
 const rel=path.relative(dist,f);const route=rel==='index.html'?'/':rel.endsWith('/index.html')?'/'+rel.slice(0,-10):'/'+rel.replace(/\.html$/,'/');const url=origin+route;
 const p=parseHtml(read(f),url),q=qualityByRoute.get(route);
 const classification=route==='/404/'?'E_INTENTIONAL_404':redirectMap.has(url)||p.refresh?'B_REDIRECT':p.robots.some(r=>/\bnoindex\b/i.test(r.value))?'C_NOINDEX':p.canonical.length===1&&p.canonical[0]!==url?'D_CANONICAL_ALTERNATIVE':p.canonical.length===1?'A_INDEXABLE_CANONICAL':'G_OTHER';
 return {...p,url,route,file:path.relative(repo,f),pageType:q?.pageType??'unknown',cluster:q?.cluster??'unknown',sourceFile:q?.sourceFile??'',publishedAt:q?.publishedAt??'',updatedAt:q?.updatedAt??'',classification};
});
const indexed=pages.filter(p=>p.classification==='A_INDEXABLE_CANONICAL'),byUrl=new Map(pages.map(p=>[p.url,p]));
const graph=new Map(indexed.map(p=>[p.url,{url:p.url,pageType:p.pageType,cluster:p.cluster,incoming:[],outgoing:[],depth:null}]));
const noncanonicalLinks=[],parameters=[],allHrefParameters=[];
for(const p of pages){
 for(const l of p.links){if(!internal(l.url))continue;const u=new URL(l.url),target=withoutHash(l.url);
  if(u.search)parameters.push({source:p.url,url:target,family:[...u.searchParams.keys()].join('|'),anchor:l.anchor,region:l.region});
  if(p.classification!=='A_INDEXABLE_CANONICAL')continue;
  if(graph.has(target)&&target!==p.url){graph.get(p.url).outgoing.push({...l,target});graph.get(target).incoming.push({source:p.url,anchor:l.anchor,region:l.region,pageType:p.pageType,cluster:p.cluster});}
  const normalized=origin+u.pathname.replace(/\/?$/,'/');
  if(redirectMap.has(target)||((u.origin!==origin||(!u.pathname.endsWith('/')&&!path.posix.extname(u.pathname))||u.search)&&graph.has(normalized)))noncanonicalLinks.push({source:p.url,...l,target,reason:redirectMap.has(target)?'redirect':'variant'});
 }
 const html=read(path.join(repo,p.file));for(const n of nodes(parse(html))){const a=attrs(n);if(a.href){const u=abs(a.href,p.url);if(internal(u)&&new URL(u).search)allHrefParameters.push({source:p.url,tag:n.tagName,url:u,family:[...new URL(u).searchParams.keys()].join('|')});}}
}
if(graph.has(origin+'/')){graph.get(origin+'/').depth=0;const queue=[origin+'/'];for(let i=0;i<queue.length;i++){const g=graph.get(queue[i]);for(const e of g.outgoing){const t=graph.get(e.target);if(t.depth===null){t.depth=g.depth+1;queue.push(e.target);}}}}
const hubRoutes=['/smarte-futterautomaten/','/trinkbrunnen/','/gps-tracker/','/katzenklappen/','/automatische-katzentoiletten/','/haustierkameras/'];
const graphRows=[...graph.values()].map(g=>{
 const incomingSources=[...new Set(g.incoming.map(e=>e.source))],contextualSources=[...new Set(g.incoming.filter(e=>e.region==='contextual').map(e=>e.source))];
 const logicalHubs=hubRoutes.filter(r=>byUrl.get(origin+r)?.cluster===g.cluster);const linkedHubs=logicalHubs.filter(r=>incomingSources.includes(origin+r));
 const classification=g.url===origin+'/'?'STRONG':incomingSources.length===0?'ORPHAN':incomingSources.length===1?'NEAR_ORPHAN':contextualSources.length<=1||g.depth===null||g.depth>3?'WEAK':linkedHubs.length&&contextualSources.length>=2&&g.depth<=2?'STRONG':'NORMAL';
 return {url:g.url,pageType:g.pageType,cluster:g.cluster,classification,incomingLinks:g.incoming.length,uniqueSourcePages:incomingSources.length,contextualSourcePages:contextualSources.length,navigationalLinks:g.incoming.filter(e=>e.region==='navigation').length,outgoingLinks:g.outgoing.length,uniqueOutgoingPages:new Set(g.outgoing.map(e=>e.target)).size,clickDepth:g.depth,logicalHubs,linksFromLogicalHub:linkedHubs,missingLogicalHub:logicalHubs.length>0&&!logicalHubs.includes(new URL(g.url).pathname)&&!linkedHubs.length,fromComparisons:g.incoming.filter(e=>e.pageType==='comparison').length,fromGuides:g.incoming.filter(e=>e.pageType==='guide').length,fromProducts:g.incoming.filter(e=>e.pageType==='product').length,anchorDistribution:Object.fromEntries([...new Set(g.incoming.map(e=>e.anchor))].map(a=>[a,g.incoming.filter(e=>e.anchor===a).length])),incomingSources};
});
const liveFile=path.join(out,'live-evidence.json');const evidenceFile=argValue('--live-evidence')?path.resolve(repo,argValue('--live-evidence')):liveFile;let live=fs.existsSync(evidenceFile)?json(evidenceFile):{};
const requests=new Map();const request=(url,kind)=>{if(!requests.has(url))requests.set(url,kind);};
for(const p of pages)request(p.route==='/404/'?origin+'/404.html':p.url,'generated');
for(const r of redirects)request(r.source,'historical');
for(const p of indexed){request(p.url.replace('https:','http:'),'http-variant');request(p.url.replace(origin,'https://www.pfotentechnik.de'),'www-variant');request(p.url.replace(origin,'http://www.pfotentechnik.de'),'http-www-variant');if(p.route!=='/'){request(p.url.slice(0,-1),'slash-variant');request(p.url.slice(0,-1).replace('https:','http:'),'http-slash-variant');request(p.url.slice(0,-1).replace(origin,'https://www.pfotentechnik.de'),'www-slash-variant');request(p.url.slice(0,-1).replace(origin,'http://www.pfotentechnik.de'),'http-www-slash-variant');}}
for(const p of parameters)request(p.url,'linked-parameter');
for(const r of ['/','/smarte-futterautomaten/','/produkt/furbo-mini-360/','/vergleiche/','/hersteller/petlibro/'])request(origin+r+'?filter-tier=katze','parameter-probe');
for(const r of ['/audit-35-2-nonexistent-20260928/','/produkt/audit-35-2-nonexistent-20260928/','/hersteller/audit-35-2-nonexistent-20260928/'])request(origin+r,'unknown-probe');
for(const r of ['/robots.txt','/sitemap-index.xml','/sitemap-0.xml'])request(origin+r,'directive');
for(const type of [...new Set(indexed.map(p=>p.pageType))]){const p=indexed.find(p=>p.pageType===type);for(const i of p.images.slice(0,2))if(i.src)request(abs(i.src,p.url),'image-sample');}
async function measure(url,kind){
 let current=url;const hops=[],visited=new Set();try{for(let i=0;i<6;i++){
  if(visited.has(current))return {url,kind,hops,error:'REDIRECT_LOOP'};visited.add(current);
  const r=await fetch(current,{redirect:'manual',signal:AbortSignal.timeout(25000),headers:{'User-Agent':'PfotenTechnik-Signal-Audit/35.2'}});const headers=Object.fromEntries(r.headers);const body=await r.text();hops.push({url:current,status:r.status,location:headers.location??'',xRobotsTag:headers['x-robots-tag']??'',link:headers.link??'',contentType:headers['content-type']??''});
  if(r.status>=300&&r.status<400&&headers.location){current=abs(headers.location,current);if(!internal(current))return {url,kind,hops,error:'EXTERNAL_REDIRECT'};continue;}
  const parsed=(headers['content-type']??'').includes('text/html')?parseHtml(body,current):null;
  const signals=parsed?{canonical:parsed.canonical,robots:parsed.robots,title:parsed.title,h1:parsed.h1,description:parsed.description,mainWords:parsed.mainWords,mainHash:parsed.mainHash,schemaUrls:parsed.schemaUrls,schemaErrors:parsed.schemaErrors,schemas:parsed.schemas,images:parsed.images.length,imageDetails:parsed.images,linkDetails:parsed.links.filter(l=>internal(l.url)),links:parsed.links.filter(l=>internal(l.url)).length}:{};
  return {url,kind,measuredAt:new Date().toISOString(),hops,finalUrl:current,status:r.status,headers:{'x-robots-tag':headers['x-robots-tag']??'',link:headers.link??'',server:headers.server??''},...signals,...(kind==='directive'?{body}:{} )};
 }return {url,kind,hops,error:'TOO_MANY_REDIRECTS'};}catch(e){return {url,kind,hops,error:e.message};}
}
if(process.argv.includes('--live')){
 const pending=[...requests].filter(([u])=>!live[u]||live[u].error||(live[u].kind==='generated'&&!live[u].imageDetails));let cursor=0,done=0;
 await Promise.all(Array.from({length:4},async()=>{while(cursor<pending.length){const [url,kind]=pending[cursor++];live[url]=await measure(url,kind);if(++done%40===0){write('live-evidence.json',live);console.log(`Live ${done}/${pending.length}`);}}}));write('live-evidence.json',live);
}
// Probe URLs actually emitted by deployment, not locally regenerated asset hashes.
for(const p of indexed){const l=live[p.url];if(!l)continue;
 const hero=l.imageDetails?.find(i=>i.src);if(hero)request(abs(hero.src,p.url),'deployed-image');
 for(const schema of l.schemas??[])for(const value of (Array.isArray(schema.image)?schema.image:[schema.image]).filter(Boolean))if(typeof value==='string'&&internal(value))request(value,'deployed-schema-image');
}
if(process.argv.includes('--live')){const pending=[...requests].filter(([u])=>!live[u]||live[u].error);let cursor=0;await Promise.all(Array.from({length:4},async()=>{while(cursor<pending.length){const [url,kind]=pending[cursor++];live[url]=await measure(url,kind);}}));write('live-evidence.json',live);}
function liveFor(p){return live[p.route==='/404/'?origin+'/404.html':p.url];}
const schemaExceptions=[];
const matrix=pages.map(p=>{
 const l=liveFor(p),g=graphRows.find(g=>g.url===p.url);const schemaBad=p.schemaUrls.filter(u=>{const target=withoutHash(u);const parsed=new URL(target);return !path.posix.extname(parsed.pathname)&&(!byUrl.has(target)||byUrl.get(target).classification!=='A_INDEXABLE_CANONICAL')&&target!==origin;});
 for(const own of p.schemas.filter(s=>['WebPage','Article','BlogPosting','Product'].includes(s['@type']))){const u=own.url??own.mainEntityOfPage?.['@id'];if(typeof u==='string'&&withoutHash(u)!==p.url)schemaBad.push(u);}
 if(schemaBad.length)schemaExceptions.push({url:p.url,refs:schemaBad});
 return {url:p.url,measuredUrl:l?.url??'',classification:p.classification,pageType:p.pageType,cluster:p.cluster,httpStatus:l?.hops?.[0]?.status??'UNMEASURED',finalStatus:l?.status??'UNMEASURED',redirectHops:l?.hops?.length?l.hops.length-1:null,canonical:p.canonical,liveCanonical:l?.canonical??[],robots:p.robots,xRobotsTag:l?.hops?.[0]?.xRobotsTag??'UNMEASURED',sitemapMembership:sitemap.has(p.url),lastmod:sitemap.get(p.url)?.lastmod??'',h1:p.h1,title:p.title,schemaUrls:p.schemaUrls,schemaUrlExceptions:schemaBad,incomingLinks:g?.incomingLinks??0,incomingSources:g?.uniqueSourcePages??0,outgoingLinks:g?.outgoingLinks??0,clickDepth:g?.clickDepth??null,mainWords:p.mainWords,initialContent:p.mainWords>0,liveMainWords:l?.mainWords??null,liveLocalContentEqual:l?.mainHash===p.mainHash,sourceFile:p.sourceFile};
});
const schemaRows=indexed.filter(p=>p.pageType==='product').map(p=>{
 const product=p.schemas.find(s=>s['@type']==='Product'),warnings=[],invalid=[];
 const visible=normalizeText(p.mainText).toLocaleLowerCase('de');const visibleHas=v=>!v||visible.includes(normalizeText(v).toLocaleLowerCase('de'));
 if(!product)invalid.push('Product missing');if(p.schemaErrors.length)invalid.push('Invalid JSON-LD');
 const reviews=p.schemas.filter(s=>s['@type']==='Review'),offers=p.schemas.filter(s=>s['@type']==='Offer'),aggregates=p.schemas.filter(s=>s['@type']==='AggregateRating');
 if(product&&!visibleHas(product.name))invalid.push('Product name not visible');
 if(product?.url!==p.url)invalid.push('Product URL differs from canonical');
 for(const r of reviews){if(!visibleHas(r.reviewBody))warnings.push('Review body not an exact visible text match');if(r.reviewRating&&!visibleHas(String(r.reviewRating.ratingValue)))invalid.push('Rating value not visible');for(const key of ['positiveNotes','negativeNotes'])for(const n of r[key]?.itemListElement??[])if(!visibleHas(n.name))warnings.push(key+' item not an exact visible text match: '+n.name);}
 for(const o of offers){if(!o.seller?.name||/pfotentechnik/i.test(o.seller.name))invalid.push('Merchant seller missing or publisher');if(!p.links.some(l=>l.url===o.url))warnings.push('Offer URL not visible as anchor');if(!visibleHas(String(o.price))&&!visibleHas(Number(o.price).toFixed(2).replace('.',','))&&!visibleHas(new Intl.NumberFormat('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(o.price))))warnings.push('Offer price requires manual visible-price comparison');}
 for(const r of reviews)for(const n of r.negativeNotes?.itemListElement??[])if(/Lifecycle-Owner/.test(n.name)&&!visibleHas(n.name))invalid.push('negativeNotes contains invisible internal route/lifecycle implementation metadata, not a product disadvantage');
 if(aggregates.length)warnings.push('AggregateRating provenance requires review');
 if(product?.sku===p.route.split('/').filter(Boolean).at(-1))warnings.push('Publisher slug emitted as sku; no manufacturer SKU provenance');
 const score=reviews[0]?.reviewRating?.ratingValue;
 return {url:p.url,classification:invalid.length?'INVALID/MISLEADING':warnings.length?'WARNING':'SEMANTIC_PASS',validJsonLd:p.schemaErrors.length===0,productCount:p.schemas.filter(s=>s['@type']==='Product').length,reviewCount:reviews.length,aggregateRatingCount:aggregates.length,offerCount:offers.length,rating:score??'',ratingVisible:score==null?null:visibleHas(String(score)),editorialLabelVisible:/redaktionell/i.test(p.mainText),brand:product?.brand,manufacturer:product?.manufacturer??null,sku:product?.sku??'',mpn:product?.mpn??'',gtin:product?.gtin??product?.gtin13??'',image:product?.image,positiveNotes:reviews[0]?.positiveNotes??null,negativeNotes:reviews[0]?.negativeNotes??null,offers,warnings,invalid};
});
const redirectRows=[...requests].filter(([,kind])=>['historical','http-variant','www-variant','http-www-variant','slash-variant','http-slash-variant','www-slash-variant','http-www-slash-variant','unknown-probe','parameter-probe'].includes(kind)).map(([url,kind])=>{
 const l=live[url];let current=url,chain=[],seen=new Set();while(redirectMap.has(current)&&!seen.has(current)){seen.add(current);const r=redirectMap.get(current);chain.push(r);current=r.target;}
 return {url,kind,configuredTarget:redirectMap.get(url)?.target??'',configuredHops:chain.length,configuredLoop:redirectMap.has(current),configuredFinal:chain.length?current:'',liveStatus:l?.hops?.[0]?.status??'UNMEASURED',liveHops:l?.hops?.length?l.hops.length-1:null,liveChain:l?.hops??[],finalStatus:l?.status??'',finalUrl:l?.finalUrl??'',finalCanonical:l?.canonical??[],error:l?.error??''};
});
const sitemapRows=sitemapEntries.map(s=>{const p=byUrl.get(s.url),l=live[s.url],g=graphRows.find(g=>g.url===s.url);return {...s,generated:Boolean(p),classification:p?.classification??'MISSING',httpStatus:l?.hops?.[0]?.status??'UNMEASURED',selfCanonical:p?.canonical.length===1&&p.canonical[0]===s.url,liveSelfCanonical:l?.canonical?.length===1&&l.canonical[0]===s.url,noindex:p?.robots.some(r=>/noindex/i.test(r.value))??null,parameterized:!!new URL(s.url).search,reachable:g?.clickDepth!=null,incomingSources:g?.uniqueSourcePages??0};});
const paramRows=[...new Set([...parameters.map(p=>p.url),...[...requests].filter(([,k])=>k==='parameter-probe').map(([u])=>u)])].map(url=>{const l=live[url],sources=parameters.filter(p=>p.url===url),clean=new URL(url);clean.search='';return {url,classification:'F_PARAMETER_FILTER_STATE',families:[...new URL(url).searchParams.keys()],internallyLinked:sources.length>0,sourcePages:[...new Set(sources.map(s=>s.source))],crawlable:'robots allows all',httpStatus:l?.hops?.[0]?.status??'UNMEASURED',canonical:l?.canonical??[],selfCanonical:l?.canonical?.includes(url)??null,robots:l?.robots??[],inSitemap:sitemap.has(url),sameInitialContentAsBase:l?.mainHash&&live[clean.href]?.mainHash?l.mainHash===live[clean.href].mainHash:null,uniqueContent:'client filter state; initial HTML compared separately',googleBenefit:'No deliberate search landing page identified'};});
const gsc=json(path.join(app,'src/data/seo/gsc-dashboard-ranges.json')),bing=json(path.join(app,'src/data/seo/bing-dashboard-ranges.json'));
const gr=gsc.ranges['28d'],br=bing.ranges['28d'];
const correlation=indexed.map(p=>{const g=graphRows.find(g=>g.url===p.url),gm=gr?.pages.find(x=>x.page===p.route),bm=br?.pages.find(x=>x.page===p.route);return {url:p.url,exclusionCategory:'UNAVAILABLE_PERFORMANCE_IS_NOT_INDEX_COVERAGE',googleImpressions:gm?.impressions??0,googleClicks:gm?.clicks??0,bingImpressions:bm?.impressions??0,bingClicks:bm?.clicks??0,pageType:p.pageType,cluster:p.cluster,publishedAt:p.publishedAt,updatedAt:p.updatedAt,ageDays:p.publishedAt?Math.floor((Date.now()-new Date(p.publishedAt))/86400000):null,clickDepth:g.clickDepth,incomingSources:g.uniqueSourcePages,contextualSources:g.contextualSourcePages,authority:g.classification,selfCanonical:p.canonical.length===1&&p.canonical[0]===p.url,sitemap:sitemap.has(p.url),lastmod:sitemap.get(p.url)?.lastmod??'',mainWords:p.mainWords,schemas:p.schemas.map(s=>s['@type']),mainHash:p.mainHash};});
const count=(a,k)=>Object.fromEntries([...new Set(a.map(x=>x[k]))].map(v=>[v,a.filter(x=>x[k]===v).length]));
const indexedMatrix=matrix.filter(p=>p.classification==='A_INDEXABLE_CANONICAL');
const imageInstances=indexed.flatMap(p=>p.images.filter(i=>!('data-lightbox-image' in i)).map(i=>({page:p.url,...i})));const mediaExceptions=imageInstances.filter(i=>!('alt'in i)||!i.width||!i.height||(i.src?.startsWith('/')&&!fs.existsSync(path.join(dist,decodeURIComponent(i.src.split('?')[0])))));
const liveLinkDifferences=indexed.filter(p=>live[p.url]?.linkDetails&&JSON.stringify(p.links.filter(l=>internal(l.url)).map(l=>l.url))!==JSON.stringify(live[p.url].linkDetails.map(l=>l.url))).map(p=>p.url);
write('live-link-differences.json',liveLinkDifferences);
const deployedMedia=Object.values(live).filter(l=>['deployed-image','deployed-schema-image'].includes(l.kind));
write('deployed-media.json',deployedMedia);
const summary={liveLinkDifferences:liveLinkDifferences.length,deployedMediaChecked:deployedMedia.length,deployedMediaFailed:deployedMedia.filter(l=>l.status!==200).length,generatedPages:pages.length,indexableCanonical:indexed.length,sitemapUrls:sitemapEntries.length,classifications:count(pages,'classification'),liveMeasured:Object.keys(live).length,liveExpected:requests.size,liveErrors:Object.values(live).filter(l=>l.error).length,http200:indexedMatrix.filter(p=>p.httpStatus===200).length,selfCanonical:indexed.filter(p=>p.canonical.length===1&&p.canonical[0]===p.url).length,liveSelfCanonical:indexedMatrix.filter(p=>p.liveCanonical.length===1&&p.liveCanonical[0]===p.url).length,sitemapConsistency:indexed.filter(p=>sitemap.has(p.url)).length,schemaUrlConsistency:indexed.length-schemaExceptions.filter(e=>graph.has(e.url)).length,robotsConsistency:indexedMatrix.filter(p=>p.httpStatus===200&&!/noindex|none/i.test(p.xRobotsTag)&&!(live[p.url]?.robots??[]).some(r=>/noindex|none/i.test(r.value))).length,internalCanonicalLinkExceptions:noncanonicalLinks.length,internalCanonicalLinkSources:new Set(noncanonicalLinks.map(x=>x.source)).size,internalDocumentLinkOccurrences:indexed.flatMap(p=>p.links.filter(l=>internal(l.url)&&!path.posix.extname(new URL(l.url).pathname))).length,redirectChains:redirectRows.filter(r=>r.liveHops>1).length,redirectLoops:redirectRows.filter(r=>r.configuredLoop||r.error==='REDIRECT_LOOP').length,conflictingCanonical:indexedMatrix.filter(p=>p.liveCanonical.length&&JSON.stringify(p.canonical)!==JSON.stringify(p.liveCanonical)).length,parameterLinkOccurrences:parameters.length,parameterHrefOccurrences:allHrefParameters.length,trueOrphans:graphRows.filter(g=>g.classification==='ORPHAN').length,nearOrphans:graphRows.filter(g=>g.classification==='NEAR_ORPHAN').length,depthOver3:graphRows.filter(g=>g.clickDepth>3).length,unreachable:graphRows.filter(g=>g.clickDepth===null).length,missingHubLinks:graphRows.filter(g=>g.missingLogicalHub).length,authorityClasses:count(graphRows,'classification'),schemaSemantics:count(schemaRows,'classification'),initialHtmlPresent:indexed.filter(p=>p.title&&p.h1.length&&p.description&&p.mainWords&&p.schemas.length).length,images:imageInstances.length,mediaExceptions:mediaExceptions.length,lastmodPresent:sitemapEntries.filter(s=>s.lastmod).length,lastmodFuture:sitemapEntries.filter(s=>s.lastmod&&new Date(s.lastmod)>new Date()).length,localLiveMainMismatch:indexedMatrix.filter(p=>p.liveMainWords!==null&&!p.liveLocalContentEqual).length};
write('audit.json',{schemaVersion:1,generatedAt:new Date().toISOString(),summary,scope:{local:'fresh full production build',live:'public ordinary user-agent GET; not verified Googlebot IP',gscGeneratedAt:gsc.generatedAt,bingGeneratedAt:bing.generatedAt,gscRange:{start:gr?.startDate,end:gr?.endDate},bingRange:{start:br?.startDate,end:br?.endDate}},exceptions:{noncanonicalLinks,schemaExceptions,mediaExceptions,allHrefParameters,sitemapMissing:indexed.filter(p=>!sitemap.has(p.url)).map(p=>p.url),sitemapDuplicates:sitemapEntries.filter((s,i)=>sitemapEntries.findIndex(t=>t.url===s.url)!==i),initialHtmlMissing:indexed.filter(p=>!(p.title&&p.h1.length&&p.description&&p.mainWords&&p.schemas.length)).map(p=>p.url),liveErrors:Object.values(live).filter(l=>l.error),soft404Candidates:indexedMatrix.filter(p=>p.httpStatus===200&&(!p.liveMainWords||p.liveMainWords<30)),quality:quality.findings},graphRules:'Exclude self links. ORPHAN=zero unique incoming canonical sources; NEAR_ORPHAN=one; WEAK=<=1 contextual source or depth null/>3; STRONG=homepage or >=2 contextual sources plus logical hub link and depth<=2; otherwise NORMAL. Structural triage, not ranking scores. Contextual means <main> outside nav/header/footer, not proof of prose placement.'});
csv('url-signal-matrix.csv',matrix);csv('internal-authority-graph.csv',graphRows);csv('sitemap-integrity.csv',sitemapRows);csv('redirect-integrity.csv',redirectRows);csv('parameter-surface.csv',paramRows);csv('structured-data-audit.csv',schemaRows);csv('gsc-correlation.csv',correlation);
write('graph-evidence.json',{nodes:graphRows,edges:[...graph.values()].flatMap(g=>g.outgoing.map(e=>({source:g.url,...e})))});
write('product-visible-evidence.json',indexed.filter(p=>p.pageType==='product').map(p=>({url:p.url,mainText:p.mainText,schemas:p.schemas,externalLinks:p.links.filter(l=>!internal(l.url))})));
write('render-evidence.json',indexed.map(p=>({url:p.url,type:p.pageType,title:p.title,description:p.description,h1:p.h1,words:p.mainWords,schemas:p.schemas.map(s=>s['@type']),scripts:p.scripts,islands:p.islands,images:p.images.slice(0,3),productExperienceInHtml:/erfahrung|praxis|alltag|einordnung/i.test(p.mainText)})));
const reviewedFile=path.join(out,'reviewed-findings.json');if(fs.existsSync(reviewedFile)){const audit=json(path.join(out,'audit.json'));Object.assign(audit,json(reviewedFile));write('audit.json',audit);}
console.log(JSON.stringify(summary,null,2));

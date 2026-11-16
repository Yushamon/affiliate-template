import fs from 'node:fs';import path from 'node:path';import {gunzipSync} from 'node:zlib';
import {app,origin,scanBuild,sourceInventory} from './scan.mjs';
import {loadGscEvidence,performanceFor} from './evidence.mjs';
const normalize=s=>String(s??'').toLowerCase().replaceAll('ä','ae').replaceAll('ö','oe').replaceAll('ü','ue').replaceAll('ß','ss').replace(/[^a-z0-9]+/g,' ').trim();
const stop=new Set('der die das und oder fuer mit von im in am an zu zum zur ist sind ein eine einer einem einen auf bei als auch nicht nur werden wird des den dem sich es du dein deine durch nach vor aus kann koennen mehr beim ueber ohne bis sowie laut hersteller'.split(' '));
const tokens=s=>normalize(s).split(' ').filter(w=>w.length>2&&!stop.has(w));
export function contentSimilarity(pages){
 const frequency=new Map();for(const p of pages)for(const block of new Set(p.blocks.map(normalize)))frequency.set(block,(frequency.get(block)??0)+1);
 const docs=pages.map(p=>tokens(p.blocks.filter(b=>(frequency.get(normalize(b))??0)<5).join(' '))),df=new Map();
 for(const d of docs)for(const w of new Set(d))df.set(w,(df.get(w)??0)+1);
 const vectors=docs.map(d=>{const counts=new Map();for(const w of d)counts.set(w,(counts.get(w)??0)+1);const v=new Map([...counts].map(([w,c])=>[w,(1+Math.log(c))*Math.log(1+pages.length/(df.get(w)??1))]));return {v,norm:Math.sqrt([...v.values()].reduce((n,x)=>n+x*x,0))}});
 const pairs=[];
 for(let i=0;i<pages.length;i++)for(let j=i+1;j<pages.length;j++){
  if(pages[i].type!==pages[j].type&&pages[i].cluster!==pages[j].cluster)continue;
  const a=vectors[i],b=vectors[j];if(!a.norm||!b.norm)continue;let dot=0;for(const [w,v]of a.v)dot+=v*(b.v.get(w)??0);const similarity=dot/(a.norm*b.norm);
  if(similarity>=.5)pairs.push({a:pages[i].route,b:pages[j].route,similarity:Math.round(similarity*1000)/1000,sameType:pages[i].type===pages[j].type,sameCluster:pages[i].cluster===pages[j].cluster,sharedBlocks:pages[i].blocks.filter(block=>(frequency.get(normalize(block))??0)<5&&pages[j].blocks.some(other=>normalize(block)===normalize(other))).slice(0,3)});
 }
 return {pairs:pairs.sort((a,b)=>b.similarity-a.similarity),frequency,docs};
}
export function robotsBlocks(text,route){
 const groups=[];let agents=[],rules=[],inRules=false;
 for(const raw of String(text??'').split(/\r?\n/)){const line=raw.replace(/#.*/,'').trim(),m=line.match(/^([^:]+):\s*(.*)$/);if(!m)continue;const key=m[1].trim().toLowerCase(),value=m[2].trim();
  if(key==='user-agent'){if(inRules){groups.push({agents,rules});agents=[];rules=[];inRules=false}agents.push(value.toLowerCase())}
  else if(['allow','disallow'].includes(key)&&agents.length){inRules=true;if(value)rules.push({allow:key==='allow',pattern:value})}
 }if(agents.length)groups.push({agents,rules});
 const google=groups.filter(g=>g.agents.some(a=>a!=='*'&&'googlebot'.includes(a))),selected=google.length?google:groups.filter(g=>g.agents.includes('*'));
 const matches=selected.flatMap(g=>g.rules).filter(r=>{const pattern=r.pattern.split('*').map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('.*').replace(/\\\$$/,'$');return new RegExp('^'+pattern).test(route)}).sort((a,b)=>b.pattern.replaceAll('*','').length-a.pattern.replaceAll('*','').length||Number(b.allow)-Number(a.allow));
 return matches.length?!matches[0].allow:false;
}
const summarize=pages=>({canonicals:pages.length,sitemap:pages.filter(p=>p.sitemapIncluded).length,contextualEdges:pages.reduce((n,p)=>n+p.links.filter(l=>l.contextual&&l.target!==p.route).length,0),zeroContextManufacturers:pages.filter(p=>p.type==='manufacturer'&&!p.contextualSources.length).length,zeroContextProducts:pages.filter(p=>p.type==='product'&&!p.contextualSources.length).length,productsWithoutHistoricallyIndexedContext:pages.filter(p=>p.type==='product'&&!p.historicallyIndexedContextSources?.length).length,unreachable:pages.filter(p=>p.clickDepth===null).length,technicalIssues:pages.reduce((n,p)=>n+(p.technicalIssues?.length??0),0)});
export function buildIndexationModel({baselineOnly=false}={}){
 const root=path.join(app,'research/indexation-improvements-36.1'),baseline=JSON.parse(gunzipSync(fs.readFileSync(path.join(root,'baseline.json.gz')))),snapshot=baselineOnly?baseline:scanBuild(),gsc=loadGscEvidence();
 const live=JSON.parse(fs.readFileSync(path.join(root,'production-http.json'))),http=new Map(live.results.map(r=>[r.url,r]));
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'changes.json')));
 const protectedRoutes=JSON.parse(fs.readFileSync(path.join(app,'research/product-integration-35.8/baseline.json'))).routes;
 const sources=new Map(sourceInventory().map(s=>[s.route,s]));
 const enrich=pages=>pages.map(p=>({...p,indexation:gsc.indexation.get(p.url)??{status:'unknown',observedAt:null,source:null,lastCrawl:null,googleSelectedCanonical:null,sitemapAssociation:null},historicallyIndexedContextSources:p.contextualSources.filter(route=>gsc.indexation.get(origin+route)?.status==='indexed'),protected:protectedRoutes.includes(p.route)}));
 const before=enrich(baseline.pages),pages=enrich(snapshot.pages),known=new Set([...snapshot.pages.map(p=>p.route),...snapshot.excluded.map(p=>p.route)]),sitemap=new Set(snapshot.sitemap);
 const broken=[];for(const p of pages)for(const l of p.links){if(l.target.startsWith('/admin/'))continue;const file=path.join(app,'dist','.'+l.target,l.target.endsWith('/')?'index.html':'');if(!known.has(l.target)&&!fs.existsSync(file))broken.push({source:p.route,target:l.target,href:l.href,anchor:l.anchor})}
 const similarity=contentSimilarity(pages),verdicts=new Map();
 for(const p of pages.filter(p=>p.type==='product')){const d=sources.get(p.route)?.data;const key=normalize((d?.review?.verdict??'')+' '+(d?.recommendation??''));if(key){const list=verdicts.get(key)??[];list.push(p.route);verdicts.set(key,list)}}
 const duplicateVerdicts=[...verdicts.values()].filter(v=>v.length>1);
 for(const p of pages){
  const data=sources.get(p.route)?.data??{},receipt=http.get(p.url);
  const intent=p.type==='product'?`Für welches Tier und welchen Einsatz eignet sich ${p.title}, und welche dokumentierten Grenzen und Kosten sind zu beachten?`:p.type==='manufacturer'?`Welche Geräte, Dienste und Supportbedingungen bietet ${p.title}, und wie unterscheiden sie sich von anderen Anbietern?`:p.type==='comparison'?`Welche der unter „${p.title}“ verglichenen Lösungen passt zu den genannten Anforderungen?`:p.title;
  const issues=[];
  if(p.canonical.length!==1||p.canonical[0]!==p.url)issues.push('BUILD_CANONICAL');
  if(!p.mainText)issues.push('EMPTY_SERVER_RENDERED_MAIN');
  if(p.schemaErrors.length)issues.push('INVALID_JSON_LD');
  const intentionallyNoindex=p.declaredNoindex||p.route==='/foundation/';
  if(/noindex/i.test(p.robots)&&!intentionallyNoindex)issues.push('UNEXPECTED_BUILD_NOINDEX');
  if(!/noindex/i.test(p.robots)&&p.declaredSitemap!==false&&!p.sitemapIncluded)issues.push('MISSING_BUILD_SITEMAP_ENTRY');
  if(/noindex/i.test(p.robots)&&p.sitemapIncluded)issues.push('NOINDEX_IN_SITEMAP');
  if(robotsBlocks(snapshot.robots,p.route))issues.push('ROBOTS_DISALLOW');
  if(!receipt)issues.push('HTTP_NOT_CHECKED');else{
   if(receipt.error)issues.push('HTTP_PROBE_ERROR');
   if(receipt.initialStatus!==200)issues.push('CANONICAL_HTTP_STATUS');
   if(receipt.finalUrl!==p.url||receipt.redirects)issues.push('CANONICAL_REDIRECT');
   if(receipt.canonical.length!==1||receipt.canonical[0]!==p.url)issues.push('PRODUCTION_CANONICAL');
   if(!intentionallyNoindex&&/noindex/i.test(receipt.robots+','+receipt.chain.at(-1)?.xRobotsTag))issues.push('PRODUCTION_NOINDEX');
   if(receipt.mainCharacters===0)issues.push('PRODUCTION_EMPTY_MAIN');
   if(receipt.schemaErrors.length)issues.push('PRODUCTION_INVALID_JSON_LD');
  }
  issues.push(...broken.filter(l=>l.source===p.route).map(()=> 'BROKEN_INTERNAL_TARGET'));
  p.technicalIssues=[...new Set(issues)];p.http=receipt?{checkedAt:receipt.checkedAt,status:receipt.initialStatus,finalStatus:receipt.finalStatus,redirects:receipt.redirects,chain:receipt.chain,canonical:receipt.canonical,robots:receipt.robots,xRobotsTag:receipt.chain.at(-1)?.xRobotsTag,mainCharacters:receipt.mainCharacters,schemaErrors:receipt.schemaErrors}:null;
  p.performance=performanceFor(gsc,p.route);p.performancePeriod=gsc.performance.period;p.pageQueries=null;
  p.valueReview={question:intent,headings:p.headings,productSpecifications:p.type==='product'?(data.specs??[]):undefined,verdict:p.type==='product'?data.review?.verdict??null:undefined,recommendation:data.recommendation??null,
   specificBlocks:p.blocks.filter(b=>(similarity.frequency.get(normalize(b))??0)===1).slice(0,4),repeatedBlocks:p.blocks.filter(b=>(similarity.frequency.get(normalize(b))??0)>=5),
   overlaps:similarity.pairs.filter(pair=>pair.a===p.route||pair.b===p.route).slice(0,3),duplicateVerdictWith:duplicateVerdicts.find(group=>group.includes(p.route))?.filter(url=>url!==p.route)??[],
   interpretation:'Titel, Abschnitte und spezifische Datenauszüge sind Prüfbelege, keine automatische Bestätigung eigenständiger Suchintention. Ähnlichkeit ist kein Indexierungsgrund.'};
  p.actions=manifest.changes.filter(c=>c.route===p.route||c.addedTargets.includes(p.route)).map(c=>({source:c.route,reason:c.reason,status:c.status,links:c.addedTargets}));
  p.suggestions=[];
  if(p.technicalIssues.length)p.suggestions.push({priority:1,kind:'technical-review',reason:p.technicalIssues.join(', '),automatic:false});
  if(p.protected)p.suggestions.push({priority:9,kind:'experiment-locked',reason:'35.5: Inhalt und eingehende Linkzugänge vollständig eingefroren.',automatic:false});
  else if(p.type==='product'&&!p.historicallyIndexedContextSources.length)p.suggestions.push({priority:3,kind:'context-link-review',reason:'Kein Kontextzugang aus einer im Export vom 02.11. als indexiert belegten Seite. Thematische Eignung einzeln prüfen; kein Nachweis einer Indexierungsursache.',automatic:false});
  if(p.valueReview.overlaps.some(pair=>pair.similarity>=.75))p.suggestions.push({priority:4,kind:'intent-review',reason:'Hohe Textähnlichkeit; unterschiedliche Varianten und Suchintention vor jeder Zusammenlegung manuell abgleichen.',automatic:false});
  if(p.indexation.status==='unknown')p.suggestions.push({priority:4,kind:'current-indexation-evidence',reason:'Kein exakter historischer URL-Beleg. Aktuelle URL Inspection erst nach autorisierter Einrichtung und unter Kontingentkontrolle.',automatic:false});
 }
 const groups=key=>Object.fromEntries([...new Set(pages.map(p=>key==='indexation'?p.indexation.status:p[key]))].sort().map(k=>[k,{pages:pages.filter(p=>(key==='indexation'?p.indexation.status:p[key])===k).length,zeroContext:pages.filter(p=>(key==='indexation'?p.indexation.status:p[key])===k&&!p.contextualSources.length).length,technicalIssues:pages.filter(p=>(key==='indexation'?p.indexation.status:p[key])===k&&p.technicalIssues.length).length}]));
 const addedContext=[];for(const p of pages){const old=before.find(b=>b.route===p.route),oldCounts=new Map();for(const l of old?.links.filter(l=>l.contextual)??[]){const k=JSON.stringify([l.target,l.anchor]);oldCounts.set(k,(oldCounts.get(k)??0)+1)}for(const l of p.links.filter(l=>l.contextual)){const k=JSON.stringify([l.target,l.anchor]),count=oldCounts.get(k)??0;if(count)oldCounts.set(k,count-1);else addedContext.push({source:p.route,target:l.target,anchor:l.anchor,sourceHistoricallyIndexed:gsc.indexation.get(p.url)?.status==='indexed'})}}
 return {version:'36.1',asOf:'2026-11-16',phase:baselineOnly?'before-build':'after-build',gsc:{...gsc,indexation:undefined,performance:{...gsc.performance,pages:undefined}},baselineSummary:summarize(before),summary:summarize(pages),byType:groups('type'),byIndexation:groups('indexation'),byCluster:groups('cluster'),pages,addedContext,brokenInternalLinks:broken,similarity:{method:'TF-IDF cosine on contextual paragraph/list/definition/table text, excluding identical blocks repeated in >=5 documents and a fixed stopword list; same type or cluster; review threshold .50, no automatic consolidation.',pairs:similarity.pairs},duplicateVerdicts,changes:manifest.changes,excluded:snapshot.excluded,liveHttp:{startedAt:live.startedAt,finishedAt:live.finishedAt,requests:live.results.length,errors:live.results.filter(r=>r.error).length,redirectCases:live.results.filter(r=>/^http:|^https:\/\/www\./.test(r.url))}};
}

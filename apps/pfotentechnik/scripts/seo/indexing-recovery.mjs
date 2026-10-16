import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {collectContentQuality, textSimilarity} from '../content-quality/core.mjs';

export const STATUS = ['indexed','crawled-not-indexed','discovered-not-indexed','unknown'];
export function googleStatus(value) {
  const text=String(value??'').normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
  if((text.includes('gecrawlt')||text.includes('crawled')) && (text.includes('nicht indexiert')||text.includes('not indexed'))) return 'crawled-not-indexed';
  if((text.includes('gefunden')||text.includes('discovered')) && (text.includes('nicht indexiert')||text.includes('not indexed'))) return 'discovered-not-indexed';
  if(['indexed','indexiert','url is on google','url ist auf google','indexed, though blocked by robots.txt'].includes(text)) return 'indexed';
  return 'unknown';
}
export function readCoverage(input) {
  if(!input) return {rows:[],sources:[],sha256:null};
  const raw=fs.readFileSync(input,'utf8');const data=JSON.parse(raw);
  if(!Array.isArray(data.exports)) throw Error('Coverage input needs exports[]; use import-gsc-coverage.py.');
  const rows=data.exports.flatMap(item=>{
    if(!Array.isArray(item.rows) || item.count != null && item.count!==item.rows.length)throw Error('Coverage export count/rows mismatch.');
    return item.rows.map(row=>{
      const url=new URL(row.url);
      if(!['https:','http:'].includes(url.protocol)||!['pfotentechnik.de','www.pfotentechnik.de'].includes(url.hostname))throw Error('Unexpected GSC URL host/protocol.');
      return {...row,url:url.href,googleStatus:row.googleStatus??item.googleStatus,status:googleStatus(row.googleStatus??item.googleStatus),source:row.source??item.file};
    });
  });
  return {rows,sources:data.exports.map(({rows,...meta})=>meta),sha256:crypto.createHash('sha256').update(raw).digest('hex')};
}
export function statusForUrl(url, rows) {
  const observations=rows.filter(row=>row.url===url);
  const values=new Set(observations.map(row=>row.status));
  return {status:values.size===1?[...values][0]:'unknown',conflicting:values.size>1,observations};
}
export function compareSnapshots(previous,current) {
  if(!previous) return {available:false,reason:'Erster Snapshot; kein früherer vergleichbarer Statusbestand angegeben.'};
  const before=new Map(previous.observations.map(row=>[row.url,row]));
  const after=new Map(current.observations.map(row=>[row.url,row]));
  const urls=[...new Set([...before.keys(),...after.keys()])].sort();
  const changes=urls.flatMap(url=>{
    const a=before.get(url),b=after.get(url);
    if(a?.status===b?.status)return [];
    return [{url,from:a?.status??'unknown',to:b?.status??'unknown',pageType:b?.pageType??a?.pageType??'unknown',prioritized:!!(a?.prioritized||b?.prioritized),kind:!b||b.status==='unknown'?'observation-missing':!a||a.status==='unknown'?'new-observation':'observed-status-change'}];
  });
  const count=rows=>Object.fromEntries(STATUS.map(status=>[status,rows.filter(row=>(row.status??row.googleStatus)===status).length]));
  const groups=[...new Set([...previous.observations,...current.observations].map(row=>row.pageType))];
  return {available:true,sameCoverageInput:previous.coverage.sha256===current.coverage.sha256,previousGeneratedAt:previous.generatedAt,
    notice:'Fehlender Eintrag ist unbekannt, kein Beweis einer Deindexierung oder Indexierung. Gleiches Export-Hash ist keine neue Google-Messung.',
    before:count(previous.observations),after:count(current.observations),
    currentCanonicalBefore:count(previous.inventory??[]),currentCanonicalAfter:count(current.inventory??[]),
    buildChanges:{added:(current.inventory??[]).filter(row=>!(previous.inventory??[]).some(old=>old.url===row.url)).map(row=>row.url),removed:(previous.inventory??[]).filter(row=>!(current.inventory??[]).some(next=>next.url===row.url)).map(row=>row.url)},
    structuralChanges:(current.inventory??[]).flatMap(row=>{const old=(previous.inventory??[]).find(item=>item.url===row.url);return old && ['canonical','robots','inSitemap','incomingLinks','incomingMeaningful','clickDepth'].some(key=>old[key]!==row[key]) ? [{url:row.url,before:Object.fromEntries(['canonical','robots','inSitemap','incomingLinks','incomingMeaningful','clickDepth'].map(key=>[key,old[key]])),after:Object.fromEntries(['canonical','robots','inSitemap','incomingLinks','incomingMeaningful','clickDepth'].map(key=>[key,row[key]]))}] : [];}),
    canonicalByPageType:Object.fromEntries([...new Set([...(previous.inventory??[]),...(current.inventory??[])].map(row=>row.pageType))].map(type=>[type,{before:count((previous.inventory??[]).filter(row=>row.pageType===type)),after:count((current.inventory??[]).filter(row=>row.pageType===type))}])),
    byPageType:Object.fromEntries(groups.map(type=>[type,{before:count(previous.observations.filter(r=>r.pageType===type)),after:count(current.observations.filter(r=>r.pageType===type))}])),changes,prioritizedChanges:changes.filter(row=>row.prioritized)};
}
const csvCell=value=>'"'+String(value??'').replaceAll('"','""')+'"';
const writeCsv=(file,headers,rows)=>fs.writeFileSync(file,[headers.map(csvCell).join(','),...rows.map(row=>headers.map(key=>csvCell(typeof row[key]==='object'?JSON.stringify(row[key]):row[key])).join(','))].join('\n')+'\n');
const groupCount=(rows,key)=>Object.fromEntries([...new Set(rows.map(row=>row[key]))].sort().map(value=>[value,rows.filter(row=>row[key]===value).length]));
const depthMap=(pages,edges)=>{
  const depths=new Map([['/',0]]),queue=['/'];
  for(let i=0;i<queue.length;i++) for(const target of edges.get(queue[i])??[]) if(!depths.has(target)){depths.set(target,depths.get(queue[i])+1);queue.push(target);}
  return depths;
};
export async function writeRecoveryReport({appRoot,repoRoot,outputRoot,pages,redirects,resolveRedirect,normalizeRoute,input,previous,observedAt}) {
  if(observedAt && !Number.isFinite(Date.parse(observedAt)))throw Error('Invalid --observed-at date.');
  const coverage=readCoverage(input);
  const content=collectContentQuality({appRoot,repoRoot,config:JSON.parse(fs.readFileSync(path.join(appRoot,'scripts/content-quality/config.json'),'utf8'))});
  const contentByRoute=new Map(content.pages.map(row=>[row.route,row]));
  const priorityConfig=JSON.parse(fs.readFileSync(fileURLToPath(new URL('./indexing-recovery-priorities.json',import.meta.url)),'utf8'));
  const priorityByRoute=new Map(priorityConfig.map(row=>[row.route,row]));
  const categories=new Set(['/smarte-futterautomaten/','/automatische-katzentoiletten/','/haustierkameras/','/gps-tracker/','/katzenklappen/','/trinkbrunnen/']);
  const classify=page=>page.route.startsWith('/produkt/')?'product':page.route.startsWith('/hersteller/')&&page.route!=='/hersteller/'?'manufacturer':page.route.startsWith('/vergleiche/')&&page.route!=='/vergleiche/'?'comparison':categories.has(page.route)?'category':/guide/.test(contentByRoute.get(page.route)?.pageType??'')?'guide':'other';
  // Sitemap membership is recorded independently; exclusion alone is not an indexing instruction.
  const indexable=pages.filter(page=>!page.noindex && !['/404/','/500/'].includes(page.route) && !page.route.startsWith('/admin/'));
  const byRoute=new Map(indexable.map(page=>[page.route,page]));
  const incoming=new Map(indexable.map(page=>[page.route,new Set()]));
  const meaningfulIncoming=new Map(indexable.map(page=>[page.route,new Set()]));
  const allEdges=new Map(),mainEdges=new Map();
  const contextualIncoming=new Map(indexable.map(page=>[page.route,new Set()]));
  const brokenLinks=[],redirectLinks=[];
  for(const page of indexable){
    const targets=(links,meaningful)=>{
      const result=[];
      for(const link of links){
        const resolved=resolveRedirect(link,redirects);const target=resolved.target;
        if(!pages.some(p=>p.route===target) && !path.posix.extname(target))brokenLinks.push({source:page.route,target:link,meaningful});
        if(!byRoute.has(target)||target===page.route)continue;
        result.push(target);(meaningful?meaningfulIncoming:incoming).get(target).add(page.route);
        if(!meaningful && resolved.chain.length)redirectLinks.push({source:page.route,target:link,resolved:target});
      }
      return result;
    };
    for(const link of page.contentLinks??[]){const target=resolveRedirect(link,redirects).target;if(byRoute.has(target)&&target!==page.route)contextualIncoming.get(target).add(page.route);}
    allEdges.set(page.route,targets(page.fullLinks,false));mainEdges.set(page.route,targets(page.meaningfulLinks,true));
  }
  const depths=depthMap(indexable,allEdges),mainDepths=depthMap(indexable,mainEdges);
  const gsc=JSON.parse(fs.readFileSync(path.join(appRoot,'src/data/seo/gsc-dashboard-ranges.json'),'utf8'));
  const bing=JSON.parse(fs.readFileSync(path.join(appRoot,'src/data/seo/bing-dashboard-ranges.json'),'utf8'));
  const metrics=(route,key)=>(gsc.ranges?.[key]?.pages??[]).find(row=>row.page===route)??null;
  const candidates=[];
  const editorial=indexable.filter(page=>!['product','manufacturer','other'].includes(classify(page)));
  for(let i=0;i<editorial.length;i++)for(let j=i+1;j<editorial.length;j++){
    const a=contentByRoute.get(editorial[i].route),b=contentByRoute.get(editorial[j].route);
    if(!a||!b||a.cluster!==b.cluster)continue;
    const score=textSimilarity(a.mainText,b.mainText);
    if(score>=0.22)candidates.push({a:a.route,b:b.route,score,method:'existing textSimilarity on rendered main content; includes shared components; manual review required'});
  }
  candidates.sort((a,b)=>b.score-a.score);
  const inventory=indexable.map(page=>{
    const fresh=contentByRoute.get(page.route);
    const url='https://pfotentechnik.de'+page.route;
    const status=statusForUrl(url,coverage.rows);
    return {url,route:page.route,pageType:classify(page),detailedPageType:fresh?.pageType??page.role,cluster:fresh?.cluster??'unknown',
      title:page.title,h1Count:page.h1s.length,primaryIntent:fresh?.searchIntent?.primary??page.primaryIntent,intentSubject:page.h1s[0]??page.title,
      canonical:page.canonical,robots:page.robots||'(keine Meta-Robots-Anweisung)',noindex:page.noindex,inSitemap:page.inSitemap,
      incomingLinks:incoming.get(page.route).size,incomingSources:[...incoming.get(page.route)].sort(),incomingMeaningful:meaningfulIncoming.get(page.route).size,contextualIncoming:contextualIncoming.get(page.route).size,
      clickDepth:depths.get(page.route)??null,meaningfulClickDepth:mainDepths.get(page.route)??null,
      sourceFile:fresh?.sourceFile??null,headings:fresh?.headings??[],quality:fresh?.quality??null,
      overlaps:candidates.filter(pair=>pair.a===page.route||pair.b===page.route).slice(0,3).map(pair=>({route:pair.a===page.route?pair.b:pair.a,score:pair.score,assessment:'candidate; no duplicate or Google cannibalization proven'})),
      googleStatus:status.status,googleStatusConflicting:status.conflicting,googleObservations:status.observations,
      gsc28d:metrics(page.route,'28d'),gsc3m:metrics(page.route,'3m'),prioritized:priorityByRoute.has(page.route)};
  }).sort((a,b)=>a.url.localeCompare(b.url));
  for(const item of priorityConfig)if(!byRoute.has(item.route))throw Error(`Prioritized URL not in current indexable inventory: ${item.route}`);
  const canonicalIssues=inventory.filter(row=>row.canonical!==row.url).map(row=>({url:row.url,canonical:row.canonical}));
  const sitemapIssues=inventory.filter(row=>!row.inSitemap).map(row=>({url:row.url,issue:'No sitemap entry; review intent, not an indexing block'}));
  const observations=[...new Set([...inventory.map(row=>row.url),...coverage.rows.map(row=>row.url)])].sort().map(url=>{
    const page=inventory.find(row=>row.url===url),route=normalizeRoute(url),resolved=resolveRedirect(route,redirects);
    const currentTarget=byRoute.get(resolved.target);
    return {url,...statusForUrl(url,coverage.rows),pageType:page?.pageType??(currentTarget?classify(currentTarget):'outside-build'),prioritized:!!page?.prioritized,inCurrentInventory:!!page,targetUrl:currentTarget?'https://pfotentechnik.de'+resolved.target:null};
  });
  const counts=rows=>Object.fromEntries(STATUS.map(status=>[status,rows.filter(row=>(row.status??row.googleStatus)===status).length]));
  const snapshot={schemaVersion:1,generatedAt:new Date().toISOString(),coverage:{sha256:coverage.sha256,sources:coverage.sources,observedAt:observedAt??null,notice:'Export-Status ist eine datierte Beobachtung; kein Live-Indexstatus. Ohne exportierte Indexiert-/Inspection-Belege sind alle übrigen URLs unbekannt. Performance-Impressionen sind separate historische Signale.'},
    summary:{generatedHtml:pages.length,currentInventory:inventory.length,byPageType:groupCount(inventory,'pageType'),byCluster:groupCount(inventory,'cluster'),exactExportUrls:new Set(coverage.rows.map(row=>row.url)).size,exportCounts:counts(observations.filter(row=>row.observations.length)),currentCanonicalCounts:counts(inventory),orphanUrls:inventory.filter(row=>row.route!=='/'&&row.incomingLinks===0).map(row=>row.url),unreachable:inventory.filter(row=>row.clickDepth===null).map(row=>row.url),canonicalIssues,sitemapIssues,brokenLinks,redirectLinks,
      duplicateFindings:content.findings.filter(f=>/CONTENT_(EXACT|NEAR)_DUPLICATE/.test(f.code)),statusConflicts:observations.filter(row=>row.conflicting).map(row=>row.url)},
    searchSignals:{google:{generatedAt:gsc.generatedAt,range:gsc.ranges['28d'].startDate+' / '+gsc.ranges['28d'].endDate,metrics:gsc.ranges['28d'].metrics.current},bing:{generatedAt:bing.generatedAt,range:bing.ranges['28d'].startDate+' / '+bing.ranges['28d'].endDate,metrics:bing.ranges['28d'].metrics.current}},observations,inventory};
  const comparison=compareSnapshots(previous?JSON.parse(fs.readFileSync(previous,'utf8')):null,snapshot);
  fs.mkdirSync(outputRoot,{recursive:true});
  const write=(file,data)=>fs.writeFileSync(path.join(outputRoot,file),JSON.stringify(data,null,2)+'\n');
  write('snapshot.json',snapshot);write('status-changes.json',comparison);write('overlap-candidates.json',candidates);
  const priorities=priorityConfig.map((config,index)=>({rank:index+1,...config,...inventory.find(row=>row.route===config.route)}));
  write('prioritized-urls.json',priorities);
  writeCsv(path.join(outputRoot,'url-inventory.csv'),['url','pageType','cluster','primaryIntent','intentSubject','canonical','robots','inSitemap','incomingLinks','incomingMeaningful','contextualIncoming','clickDepth','meaningfulClickDepth','googleStatus','googleStatusConflicting','overlaps'],inventory);
  writeCsv(path.join(outputRoot,'google-observations.csv'),['url','status','pageType','prioritized','inCurrentInventory','targetUrl','conflicting','observations'],observations);
  write('excluded-build-pages.json',pages.filter(page=>!byRoute.has(page.route)).map(({route,canonical,robots,noindex,inSitemap})=>({route,canonical,robots,noindex,inSitemap})));
  fs.writeFileSync(path.join(outputRoot,'prioritized-urls.md'),'# Priorisierte URLs\n\n20 bewusst ausgewählte Prüfziele; keine automatischen Indexierungsanträge. Status ausschließlich aus exakten Export-URLs. Klicktiefe enthält Footer; Hauptinhalt = eingehende Quellseiten ohne globale Kopf-/Fußnavigation.\n\n| Rang | URL / Status | Begründung | Interne Signale | Nächste Maßnahme |\n| --- | --- | --- | --- | --- |\n'+priorities.map(row=>`| ${row.rank} | ${row.url}<br>${row.googleStatus} | ${row.reason} | Tiefe ${row.clickDepth}, ${row.incomingLinks} Links (${row.contextualIncoming} im Hauptinhalt); GSC 28d ${row.gsc28d?.impressions??'kein Zeilensignal'} / 3m ${row.gsc3m?.impressions??'kein Zeilensignal'} Impr. | ${row.action} |`).join('\n')+'\n');
  console.log(JSON.stringify({...snapshot.summary,brokenLinks:brokenLinks.length,redirectLinks:redirectLinks.length,prioritized:priorities.length,statusComparison:comparison.available,outputRoot},null,2));
  if(canonicalIssues.length||brokenLinks.length)process.exitCode=1;
  return snapshot;
}

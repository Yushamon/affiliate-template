#!/usr/bin/env node
// Read-only analysis of existing dashboard interfaces and Git snapshots.
// Run after audit-production-baseline.mjs --out /tmp/pf347-baseline.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { normalizeUrl, normalizeQuery, mergeMetricRows, summarizeMetrics } from '../../src/lib/search/normalizer.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const app = 'apps/pfotentechnik';
const out = path.join(root, 'reports/seo-cockpit/visibility-34.7-evidence');
fs.mkdirSync(out, { recursive: true });
const read = p => JSON.parse(fs.readFileSync(path.resolve(root, p), 'utf8'));
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 100 * 1024 * 1024 });
const hash = s => createHash('sha256').update(s).digest('hex');
const write = (name, data) => fs.writeFileSync(path.join(out, name), JSON.stringify(data, null, 2) + '\n');
const snapshots = [];
for (const engine of ['gsc', 'bing']) {
  const file = `${app}/src/data/seo/${engine}-dashboard-ranges.json`;
  const seen = new Set();
  for (const commit of ['WORKTREE', ...git('log', '--format=%H', '--', file).trim().split('\n')]) {
    const raw = commit === 'WORKTREE' ? fs.readFileSync(path.join(root, file), 'utf8') : git('show', `${commit}:${file}`);
    const sha256 = hash(raw);
    if (seen.has(sha256)) continue;
    seen.add(sha256);
    const data = JSON.parse(raw);
    snapshots.push({ engine, commit, file, sha256, generatedAt: data.generatedAt, data });
  }
}
snapshots.sort((a,b) => a.generatedAt.localeCompare(b.generatedAt));
write('source-manifest.json', snapshots.map(({data,...s}) => ({...s, windows: Object.fromEntries(Object.entries(data.ranges).map(([k,r]) => [k,{start:r.startDate,end:r.endDate,partial:r.partial,metrics:r.metrics.current}]))})));
const latest = engine => snapshots.filter(s => s.engine === engine).at(-1).data;
const google = latest('gsc'), bing = latest('bing');
// These commits rewrote dashboard URLs without fetching new GSC data.
// Keep their provenance, but use the original payload with the same generatedAt.
const excludedSnapshots = snapshots.filter(s => /^(3dc0987|dc73a31)/.test(s.commit));
write('data-integrity.json', {excluded:excludedSnapshots.map(({data,...s})=>({...s,reason:'git diff changes page identities while generatedAt stays unchanged; original snapshot retained'})),policy:'Do not treat maintenance replacements in stored exports as search observations.'});
const googleSnapshots = snapshots.filter(s => s.engine === 'gsc' && !excludedSnapshots.includes(s));
const metrics = rows => { const m = summarizeMetrics(rows); return {...m, position:m.impressions ? m.position : null}; };
const dailyMap = new Map();
const revisions = [];
for (const s of googleSnapshots) {
  for (const row of s.data.ranges['3m'].trend || []) {
    const old = dailyMap.get(row.date);
    if (old && (old.impressions !== row.impressions || old.clicks !== row.clicks)) revisions.push({date:row.date,old:{impressions:old.impressions,clicks:old.clicks},new:{impressions:row.impressions,clicks:row.clicks},snapshot:s.generatedAt});
    dailyMap.set(row.date, {...row, source:s.commit, generatedAt:s.generatedAt});
  }
}
const daily = [...dailyMap.values()].sort((a,b) => a.date.localeCompare(b.date));
const starts = ['2026-07-13','2026-07-20','2026-07-27','2026-08-03','2026-08-10','2026-08-17','2026-08-24','2026-08-31'];
const plus = (date,n) => new Date(Date.parse(date+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);
const weekly = starts.map(start => {
  const end = plus(start,6), availableEnd = end > google.ranges['3m'].endDate ? google.ranges['3m'].endDate : end;
  const rows = daily.filter(r=>r.date>=start && r.date<=availableEnd);
  const match = googleSnapshots.flatMap(s=>Object.values(s.data.ranges).filter(r=>r.startDate===start && r.endDate===end).map(r=>({s,r}))).at(-1);
  const pages = match ? mergeMetricRows(match.r.pages,'page').filter(p=>p.impressions>0) : null;
  return {start,end,availableEnd,...metrics(rows),dailyRows:rows.length,calendarDays:(Date.parse(availableEnd)-Date.parse(start))/86400000+1,
    activeQueries:match ? match.r.queries.filter(q=>q.impressions>0).length : null,
    activeUrls:pages?.length ?? null, urlsWithImpressions:pages?.length ?? null,
    urlsTop10:pages?.filter(p=>p.position>0&&p.position<=10).length ?? null,
    urlsTop20:pages?.filter(p=>p.position>0&&p.position<=20).length ?? null,
    dimensionsSource:match?.s.commit ?? null,
    note:'Property totals from latest observed daily rows; missing dates inside covered range contribute no observed impressions. URL/query counts only from exact matching window; disclosed rows are lower bounds. Final week incomplete.'};
});
write('timeline.json',{daily,weekly,revisions});
const baseline = read('/tmp/pf347-baseline/internal-link-graph.json');
const inventory = read(`${app}/reports/content-quality/content-inventory.json`);
const nodeMap = new Map(baseline.nodes.map(n=>[n.route,n]));
const invMap = new Map(inventory.pages.map(n=>[n.route,n]));
const redirects = new Map();
for (const line of fs.readFileSync(path.join(root,app,'public/_redirects'),'utf8').split('\n')) {
  const [from,to,status] = line.trim().split(/\s+/);
  if (from?.startsWith('/') && ['301','308'].includes(status)) redirects.set(normalizeUrl(from),normalizeUrl(to));
}
const observations = new Map();
const queriesByPage = new Map();
const queryOwners = new Map();
for (const s of googleSnapshots) for (const [range,r] of Object.entries(s.data.ranges)) {
  if (!['7d','28d','3m'].includes(range)) continue;
  for (const row of mergeMetricRows(r.pages,'page')) {
    if (!observations.has(row.page)) observations.set(row.page,[]);
    observations.get(row.page).push({...row,start:r.startDate,end:r.endDate,snapshot:s.generatedAt,commit:s.commit,range});
  }
  for (const q of r.pageQueries || []) {
    const route = normalizeUrl(q.page), key = normalizeQuery(q.query).key;
    if (!queriesByPage.has(route)) queriesByPage.set(route,new Set());
    queriesByPage.get(route).add(key);
    if (!queryOwners.has(key)) queryOwners.set(key,[]);
    queryOwners.get(key).push({...q,page:route,start:r.startDate,end:r.endDate,range,snapshot:s.generatedAt});
  }
}
const currentPages = new Map(mergeMetricRows(google.ranges['28d'].pages,'page').map(p=>[p.page,p]));
const contextPages = new Map(mergeMetricRows(google.ranges['3m'].pages,'page').map(p=>[p.page,p]));
const sources = new Map();
for (const collection of ['pages','products','comparisons','manufacturers']) {
  const dir = path.join(root,app,'src/content',collection);
  for (const name of fs.readdirSync(dir).filter(n=>/\.mdx?$/.test(n))) {
    const file = path.join(dir,name), text = fs.readFileSync(file,'utf8');
    const slug = text.match(/^slug:\s*["']?([^\s"']+)/m)?.[1];
    if (!slug) continue;
    const route = collection==='products' ? `/produkt/${slug}/` : collection==='comparisons' ? `/vergleiche/${slug}/` : collection==='manufacturers' ? `/hersteller/${slug}/` : `/${slug}/`;
    sources.set(route,path.relative(root,file));
  }
}
const historyCache = new Map();
function contentHistory(route) {
  const file = sources.get(route);
  if (!file) return {source:null,lastGitChange:null,firstGitAddition:null,lastMajorContentChange:null};
  if (historyCache.has(file)) return historyCache.get(file);
  const last = git('log','-1','--format=%aI %h','--',file).trim();
  const first = git('log','--diff-filter=A','--format=%aI %h','--',file).trim().split('\n').at(-1);
  const changes = git('log','--format=COMMIT %aI %h','--numstat','--',file).split('COMMIT ').slice(1);
  let major=null;
  for (const change of changes) {
    const lines=change.trim().split('\n'), nums=lines.find(l=>/^\d+\t\d+\t/.test(l));
    if (!nums) continue;
    const [a,d]=nums.split('\t').map(Number);
    if (a+d>=40) {major={commitDate:lines[0],added:a,deleted:d,definition:'>=40 added+deleted source lines; mechanical edits included; not proof of semantic rewrite'};break;}
  }
  const result={source:file,lastGitChange:last,firstGitAddition:first,lastMajorContentChange:major};historyCache.set(file,result);return result;
}
const cohort=[];
for (const [route,obs] of observations) {
  const selected = obs.some(o=>o.position>0&&(o.position<=10||(o.position<=20&&o.impressions>=2))||o.clicks>0);
  const repeated = new Set(obs.filter(o=>o.impressions>0).map(o=>o.end)).size>1 && (queriesByPage.get(route)?.size||0)>0;
  if (!selected&&!repeated) continue;
  const target=redirects.get(route)||route, n=nodeMap.get(target), inv=invMap.get(target);
  const best=obs.filter(o=>o.impressions>0&&o.position>0).sort((a,b)=>a.position-b.position)[0];
  const context=contextPages.get(route)||null;
  cohort.push({url:'https://pfotentechnik.de'+route,route,currentTarget:target,pageType:n?.pageType||inv?.pageType||'unknown',cluster:inv?.cluster||'unknown',
    contextWindow:{start:google.ranges['3m'].startDate,end:google.ranges['3m'].endDate},metrics:context,
    bestObservedWindowAverage:best?.position??null,bestObservation:best,
    current28d:currentPages.get(route)||null,queryCountDisclosed:queriesByPage.get(route)?.size||0,
    incomingLinks:n?.incomingMeaningful??null,crawlDepth:n?.depth??null,
    relevantHubs:baseline.edges.filter(([a,b])=>b===target&&/hub|index/.test(nodeMap.get(a)?.pageType||'')).map(([a])=>a),
    canonical:inv?.canonical||null,inSitemap:inv?.inSitemap??false,indexability:redirects.has(route)?'301_TO_INDEXABLE_TARGET':inv?.indexable?'INDEXABLE':'UNKNOWN',
    publishedAt:inv?.publishedAt||null,updatedAt:inv?.updatedAt||null,...contentHistory(target),
    possibleCannibalization:[...queryOwners].filter(([q,os])=>os.some(o=>o.page===route)&&new Set(os.map(o=>o.page)).size>1).map(([q])=>q),decision:'NO CHANGE'});
}
cohort.sort((a,b)=>(b.metrics?.clicks||0)-(a.metrics?.clicks||0)||(b.metrics?.impressions||0)-(a.metrics?.impressions||0));
write('cohort.json',cohort);
const overlaps=[];
for (const [query,obs] of queryOwners) {
  const urls=[...new Set(obs.map(o=>o.page))]; if(urls.length<2) continue;
  const unique=new Map(); for(const o of obs) unique.set([o.start,o.end,o.page].join('|'),o);
  const windows=[...unique.values()];
  const currentOwners=[...new Set(urls.map(u=>redirects.get(u)||u))];
  const disjoint=[];
  for(const w of [...new Map(windows.filter(w=>w.range==='7d').map(w=>[w.start,{start:w.start,end:w.end}])).values()].sort((a,b)=>a.start.localeCompare(b.start))) {
    if(disjoint.length && w.start<=disjoint.at(-1).end)continue;
    const owners=windows.filter(o=>o.range==='7d'&&o.start===w.start).sort((a,b)=>b.impressions-a.impressions);
    disjoint.push({...w,owners,dominant:owners[0]?.page,dominantImpressions:owners[0]?.impressions});
  }
  overlaps.push({query,urls,currentOwners,status:currentOwners.length===1?'NO EVIDENCE':'POSSIBLE',reason:currentOwners.length===1?'Historical migration aliases resolve to the same current owner; not competing current pages.':'Multiple disclosed URL owners; repeated harmful switching not established. Overlapping cumulative windows are not independent evidence.',disjoint7dWindows:disjoint,observations:windows});
}
write('query-url-analysis.json',{confirmed:[],possible:overlaps.filter(o=>o.status==='POSSIBLE'),noEvidence:overlaps.filter(o=>o.status==='NO EVIDENCE'),decision:'NO CONTENT CHANGE; same-product alias redirect separately justified by Git and live HTTP',limitation:'No date×query×URL export; disjoint 7d window observations support overlap screening, not a claim of harmful daily URL switching.'});
const comparison = {};
for (const range of ['28d','3m']) {
  const g=google.ranges[range],b=bing.ranges[range];
  const gp=new Map(mergeMetricRows(g.pages,'page').map(p=>[p.page,p]));
  const bp=new Map(mergeMetricRows(b.pages,'page').map(p=>[p.page,p]));
  const gq=new Map(g.queries.map(q=>[normalizeQuery(q.query).key,q]));
  const bq=new Map(b.queries.map(q=>[normalizeQuery(q.query).key,q]));
  comparison[range]={start:g.startDate,end:g.endDate,google:g.metrics.current,bing:b.metrics.current,
    overlap:[...gp.keys()].filter(p=>bp.has(p)),googleOnly:[...gp.keys()].filter(p=>!bp.has(p)),bingOnly:[...bp.keys()].filter(p=>!gp.has(p)),
    urlRows:[...new Set([...gp.keys(),...bp.keys()])].map(p=>({url:p,google:gp.get(p)||null,bing:bp.get(p)||null})),
    queryOverlap:[...gq.keys()].filter(q=>bq.has(q)),queryGoogleOnly:[...gq.keys()].filter(q=>!bq.has(q)),queryBingOnly:[...bq.keys()].filter(q=>!gq.has(q)),
    bingPageQueriesAvailable:Boolean(b.pageQueries?.length),conversionEvidence:null,
    caveat:'Only means observed in this export. Missing row is not proof of no impressions. Bing 3m contains only four periodic observations; no July control.'};
}
write('google-vs-bing.json',comparison);
const hostHistory=[];
for(const s of googleSnapshots) for(const [range,r] of Object.entries(s.data.ranges)) {
  if(!['7d','28d','3m'].includes(range))continue;
  const rows=r.pages.filter(p=>p.page.startsWith('https://www.pfotentechnik.de'));
  if(rows.length)hostHistory.push({commit:s.commit,generatedAt:s.generatedAt,range,start:r.startDate,end:r.endDate,rows,metrics:metrics(rows)});
}
write('historical-www.json',{observations:hostHistory,currentHostAttribution:'UNKNOWN: normalized away after 2026-07-22',doNotSumOverlappingWindows:true});
const reportSources=[];
const relevant=/seo-rebaseline|seo-baseline|seo-trinkbrunnen|seo-recovery|seo-signal|seo-cockpit|quality-operations|seo-release|url-consistency|internal-link|content-quality|search\/|seo-platform/;
for(const file of git('ls-files','*.json','*.md').trim().split('\n').filter(p=>p.includes('reports/')&&relevant.test(p))) {
  const raw=fs.readFileSync(path.join(root,file),'utf8');let data;try{data=JSON.parse(raw);}catch{}
  reportSources.push({file,sha256:hash(raw),bytes:Buffer.byteLength(raw),generatedAt:data?.generatedAt||null,summary:data?.summary||data?.indexability||null});
}
write('report-inventory.json',reportSources);
const changes=[];
for(const block of git('log','--since=2026-07-20T00:00:00+02:00','--until=2026-08-05T23:59:59+02:00','--format=COMMIT %h|%aI|%cI|%s','--name-only','--',`${app}/src`,`${app}/public`,`${app}/astro.config.mjs`,'packages/affiliate-core/src').split('COMMIT ').slice(1)) {
  const [head,...rest]=block.trim().split('\n');const [commit,date,committerDate,subject]=head.split('|');
  const files=rest.filter(Boolean).filter(f=>!/(generated\/|data\/seo\/|pages\/admin\/|lib\/seo|lib\/search|styles\/seo-admin|components\/admin\/)/.test(f));
  if(!files.length)continue;
  const areas=[];
  if(files.some(f=>/_redirects/.test(f)))areas.push('URL migration / redirects');
  if(files.some(f=>/astro.config|robots.txt|layouts\//.test(f)))areas.push('global configuration / head / rendering');
  if(files.some(f=>/content\//.test(f)))areas.push('content inventory / semantic edits');
  if(files.some(f=>/comparison|Comparison|vergleiche/.test(f)))areas.push('comparison templates');
  if(files.some(f=>/Product|product-experience/.test(f)))areas.push('product templates');
  if(files.some(f=>/navigation|Header|Breadcrumb|linking/.test(f)))areas.push('internal navigation / breadcrumbs');
  if(!areas.length)areas.push('presentation / other public code');
  const critical=git('show',commit,'--format=','--unified=0','--',...files);
  const seoLines=critical.split('\n').filter(l=>/^[+-][^+-]/.test(l)&&/canonical|noindex|nofollow|robots|sitemap|trailingSlash|site:|og:url|application\/ld\+json|client:only|loading=|location\./i.test(l));
  changes.push({date,committerDate,commit,subject,areas,files,seoLines:seoLines.slice(0,60),diffSha256:hash(critical),
    potentialSeoEffect:areas.includes('URL migration / redirects')?'URL ownership and recrawl/consolidation can change':areas.includes('global configuration / head / rendering')?'Inspect global serving and consolidation contracts':'Possible semantic/link/layout changes; no outage demonstrated',
    probability:areas.includes('URL migration / redirects')?'MEDIUM':areas.includes('presentation / other public code')?'LOW':'LOW',
    evidence:`git show ${commit}; commit timestamp is not deployment or Google recrawl timestamp`,causality:'UNPROVEN'});
}
write('change-correlation.json',changes);
const expansion=[];
for(const day of ['2026-07-13','2026-07-19','2026-07-24','2026-07-25','2026-07-27','2026-08-05','2026-09-07']) {
  const rev=git('rev-list','-1',`--before=${day}T23:59:59+02:00`,'HEAD').trim();
  const files=git('ls-tree','-r','--name-only',rev,`${app}/src/content`).trim().split('\n').filter(f=>/\.mdx?$/.test(f));
  expansion.push({date:day,commit:rev,sourceDocuments:files.length,collections:Object.fromEntries(['pages','products','comparisons','manufacturers'].map(c=>[c,files.filter(f=>f.includes(`/content/${c}/`)).length])),caveat:'Source documents, not deployed/indexed URL count; collection moves can preserve document count.'});
}
write('content-expansion.json',expansion);
write('analysis-summary.json',{asOf:'2026-09-07',dataEnd:google.ranges['3m'].endDate,weekly,cohortUrls:cohort.length,top10:cohort.filter(c=>c.bestObservedWindowAverage<=10).length,top20:cohort.filter(c=>c.bestObservedWindowAverage<=20).length,baseline:{indexability:baseline.indexability,graph:baseline.graph,schema:baseline.schema},queryOverlaps:overlaps.length,engines:Object.fromEntries(Object.entries(comparison).map(([k,v])=>[k,{overlap:v.overlap.length,googleOnly:v.googleOnly.length,bingOnly:v.bingOnly.length,queryOverlap:v.queryOverlap.length}])),sourceSnapshots:snapshots.length,commitsReviewed:changes.length,expansion});
console.log(JSON.stringify({cohort:cohort.length,top10:cohort.filter(c=>c.bestObservedWindowAverage<=10).length,weekly,queryOverlaps:overlaps.length,changes:changes.length},null,2));

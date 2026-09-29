import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';
const root=process.cwd(),out=root+'/reports/editorial-leakage-35.3';
const read=f=>JSON.parse(fs.readFileSync(out+'/'+f));const before=read('before.json'),after=read('after.json'),edits=read('edits.json');
const norm=s=>String(s).replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/<[^>]+>/g,' ').replace(/[^\p{L}\p{N}]+/gu,' ').trim().toLowerCase();
const pageType=p=>p.pageType==='other'&&p.source.includes('/src/content/pages/')&&!['/affiliate-hinweis/','/datenschutz/','/impressum/','/kontakt/','/so-bewerten-wir/','/redaktion/'].includes(p.route)?'guides':p.pageType;
for(const set of [before,after]){for(const p of set.pages)p.pageType=pageType(p);for(const c of set.candidates)c.pageType=set.pages.find(p=>p.url===c.url).pageType;}
function classification(c){
 const term=c.pattern.toLowerCase(),t=c.context;
 if (/platzhalter|bildslot|^\*\*/i.test(term))return 'PUBLICATION_ARTIFACT';
 if (term==='render')return 'FALSE_POSITIVE'; // German word störender, ASCII word-boundary artifact.
 if (term==='consensus')return 'REVIEW_REQUIRED'; // Reader-useful source agreement vs internal consensus object; no automatic rewriting.
 if (/^(?:cornerstone|information gain|cluster\w*|repository|externalevidence|evidencesources|reviewcount|constrained|research-constrained|frontmatter|content registry|pfotentechnik-datei|intent\w*|evaluations\w*|owner|unknown|batch|audit)$/.test(term))return 'CONFIRMED_INTERNAL_LEAK';
 if(term==='evidence'&&!t.includes('PETKIT YumShare Dual-hopper 2 Review: Fit, Tradeoffs, and Evidence'))return 'CONFIRMED_INTERNAL_LEAK';
 if(term==='route'&&t.includes('Evaluations-Intent'))return 'CONFIRMED_INTERNAL_LEAK';
 if(term==='status'&&t==='Audit-Status')return 'CONFIRMED_INTERNAL_LEAK';
 if(term==='dieser vergleich besitzt die konkrete modellentscheidung')return 'CONFIRMED_INTERNAL_LEAK';
 return 'LEGITIMATE_PUBLIC_USAGE';
}
const sharedSource=c=>/^(?:Cornerstone zu Technik)/.test(c.context)?'pages/gps-tracker.md':/^Cornerstone-Ratgeber zu Gerätekategorien/.test(c.context)?'pages/smarte-haustiertechnik.md':/^Cornerstone fuer automatische/.test(c.context)?'pages/automatische-katzentoiletten.md':/^Cornerstone für Katzenklappen/.test(c.context)?'pages/katzenklappen.md':/^Cornerstone für Haustierkameras/.test(c.context)?'pages/haustierkameras.md':/^Zentraler Cluster-Hub/.test(c.context)?'pages/smarte-futterautomaten.md':/Platzhalter|Bildslot/.test(c.context)?'products/furbo-360-katzenkamera.md':null;
function classify(c,phase){
 c={...c,classification:classification(c),phase};const shared=sharedSource(c);
 c.source=shared?'apps/pfotentechnik/src/content/'+shared:c.source;
 if(c.context.includes('Content Registry'))c.source='apps/pfotentechnik/src/pages/wissen.astro';
 if(c.pattern.startsWith('**'))c.source='apps/pfotentechnik/src/domain/guideExperience/model.ts';
 c.rootCause=['CONFIRMED_INTERNAL_LEAK','PUBLICATION_ARTIFACT'].includes(c.classification)?shared&&!shared.startsWith('products/')||c.pattern.startsWith('**')?'SYSTEMIC':'CONTENT_LEVEL':'';
 c.reason=c.classification==='REVIEW_REQUIRED'?'Consensus may denote ordinary agreement across sources; no confirmed workflow value and no edit.':c.classification==='FALSE_POSITIVE'?'ASCII word boundary matches render inside störender.':c.classification==='LEGITIMATE_PUBLIC_USAGE'?'Context describes a product/model, operation, care, external citation or commercial disclosure.':c.rootCause==='SYSTEMIC'?'Public description reused by shared discovery components, or Markdown table cells copied into plain-text summaries.':'Public wording directly contains production terminology or an observable publication artifact.';
 const relevant=edits.filter(e=>e.source===c.source);
 const nc=norm(c.context);
 c.replacement=relevant.filter(e=>{const n=norm(e.before);return n&& (nc.includes(n)||n.includes(nc))}).map(e=>e.after).join(' | ');
 if(phase==='before'&&['CONFIRMED_INTERNAL_LEAK','PUBLICATION_ARTIFACT'].includes(c.classification)){const bp=before.pages.find(p=>p.url===c.url),ap=after.pages.find(p=>p.url===c.url);const index=bp.surfaces.findIndex(s=>s.text===c.context&&s.location===c.location);c.replacement=ap.surfaces[index]?.text??c.replacement;}
 c.changed=phase==='before'&&['CONFIRMED_INTERNAL_LEAK','PUBLICATION_ARTIFACT'].includes(c.classification)&&!after.pages.find(p=>p.url===c.url)?.surfaces.some(s=>s.text===c.context)?'YES':'NO';
 c.severity=['CONFIRMED_INTERNAL_LEAK','PUBLICATION_ARTIFACT'].includes(c.classification)?c.rootCause==='SYSTEMIC'&&!c.pattern.startsWith('**')?'P1':'P2':'NO_CHANGE';
 return c;
}
const publicBefore=before.candidates.map(c=>classify(c,'before')),publicAfter=after.candidates.map(c=>classify(c,'after'));
const confirmed=publicBefore.filter(c=>c.classification==='CONFIRMED_INTERNAL_LEAK'),artifacts=publicBefore.filter(c=>c.classification==='PUBLICATION_ARTIFACT'),reviews=publicAfter.filter(c=>c.classification==='REVIEW_REQUIRED');
const rows=read('before-source.json');
// Source hits are inventoried separately. Only complete source phrases corroborated by rendered text count as public.
const sourceRows=rows.map(r=>{
 const n=norm(r.context.replace(/^\s*(?:[-*]\s+)?[\w.]+:\s*/,''));
 const related=publicBefore.filter(c=>c.source===r.source&&norm(c.pattern)===norm(r.pattern));
 const matches=related.filter(c=>n.length>15&&(norm(c.context).includes(n)||n.includes(norm(c.context))||r.context.split('|').some(cell=>norm(cell)===norm(c.context))));
 const key=r.context.match(/^\s*(?:-\s*)?([A-Za-z][\w.-]*):/);const keyHit=key&&norm(key[1])===norm(r.pattern);
 const syntax=/^#{2,6}\s*$|^\*\*/.test(r.pattern)&&!matches.length;
 const code=/\.(?:ts|tsx|js|astro|json)$/.test(r.source)&&!matches.length;
 const internal=keyHit||code||/^\s*(?:# |\/\/|import |export |\* |const |type |interface )/.test(r.context)||/\b(?:status|state|consensus|evidence):\s*(?:unknown|complete|partial|constrained)\b/.test(r.context);
 const chosen=matches[0]??(!internal&&!syntax?related[0]:undefined);
 const cls=internal?'INTERNAL_ONLY':syntax?'FALSE_POSITIVE':chosen?.classification??'INTERNAL_ONLY';
 return {...r,url:chosen?.url??'',pageType:'source-inventory',surface:chosen?.surface??'INTERNAL_ONLY',classification:cls,rootCause:chosen?.rootCause??'',changed:matches.some(c=>c.changed==='YES')?'YES':'NO',reason:internal?'Internal key, enum, code or comment; not reader text.':syntax?'Valid Markdown source syntax; only literal rendered syntax is a publication artifact.':chosen?'Public term occurrence corroborated separately in rendered candidate inventory; source line is discovery evidence.':'No corresponding public term occurrence from this source; non-rendered content/configuration retained.'};
});
// Do not create thousands of ambiguous review tasks from ordinary YAML/data field syntax.
// Retain raw source inventory separately; the candidate report contains confirmed public hits and high-confidence internal hits.
const internalSource=sourceRows.filter(r=>r.classification==='INTERNAL_ONLY'||r.classification==='FALSE_POSITIVE');
const csv=(name,rows,headers)=>fs.writeFileSync(out+'/'+name,[headers.join(','),...rows.map(r=>headers.map(h=>'"'+String(r[h]??'').replaceAll('"','""')+'"').join(','))].join('\n')+'\n');
const headers=['source','url','pageType','surface','location','pattern','context','classification','rootCause','severity','changed','replacement','reason'];
csv('candidate-occurrences.csv',[...publicBefore,...internalSource],headers);csv('confirmed-leaks.csv',confirmed,headers);csv('review-required.csv',reviews,headers);csv('publication-artifacts.csv',artifacts,headers);
csv('source-inventory.csv',sourceRows,['source','line','pattern','context','surface','classification','url','changed','reason']);
const validation=before.pages.map(b=>{const a=after.pages.find(p=>p.url===b.url),hits=publicBefore.filter(c=>c.url===b.url),remaining=publicAfter.filter(c=>c.url===b.url&&['CONFIRMED_INTERNAL_LEAK','PUBLICATION_ARTIFACT'].includes(c.classification));
 return {url:b.url,pageType:b.pageType,rendered:'YES',candidates:hits.length,confirmedBefore:hits.filter(c=>c.classification==='CONFIRMED_INTERNAL_LEAK').length,artifactsBefore:hits.filter(c=>c.classification==='PUBLICATION_ARTIFACT').length,confirmedAfter:remaining.filter(c=>c.classification==='CONFIRMED_INTERNAL_LEAK').length,artifactsAfter:remaining.filter(c=>c.classification==='PUBLICATION_ARTIFACT').length,canonicalUnchanged:JSON.stringify(a.canonical)===JSON.stringify(b.canonical),robotsUnchanged:JSON.stringify(a.robots)===JSON.stringify(b.robots),oldFragmentTargetsPreserved:b.ids.every(id=>a.ids.includes(id)),documentDestinationsUnchanged:JSON.stringify(a.links.map(l=>l.split('#')[0]))===JSON.stringify(b.links.map(l=>l.split('#')[0])),titleUnchanged:JSON.stringify(a.surfaces.filter(s=>s.location==='body:title'))===JSON.stringify(b.surfaces.filter(s=>s.location==='body:title')),result:remaining.length?'FAIL':'PASS'};});
csv('rendered-validation.csv',validation,Object.keys(validation[0]));
const types=['guides','hubs','comparisons','products','manufacturers','other'];
const byType=types.map(type=>{const pages=before.pages.filter(p=>p.pageType===type),cs=publicBefore.filter(c=>c.pageType===type);return {type,pagesScanned:pages.length,pagesWithCandidates:new Set(cs.map(c=>c.url)).size,confirmedLeaks:cs.filter(c=>c.classification==='CONFIRMED_INTERNAL_LEAK').length,reviewRequired:cs.filter(c=>c.classification==='REVIEW_REQUIRED').length,legitimateUses:cs.filter(c=>c.classification==='LEGITIMATE_PUBLIC_USAGE').length,falsePositives:cs.filter(c=>c.classification==='FALSE_POSITIVE').length,publicationArtifacts:cs.filter(c=>c.classification==='PUBLICATION_ARTIFACT').length};});
const systemic=publicBefore.filter(c=>c.rootCause==='SYSTEMIC');
byType.push({type:'shared UI/components (overlaps page rows)',pagesScanned:before.pages.length,pagesWithCandidates:new Set(systemic.map(c=>c.url)).size,confirmedLeaks:systemic.filter(c=>c.classification==='CONFIRMED_INTERNAL_LEAK').length,reviewRequired:0,legitimateUses:0,publicationArtifacts:systemic.filter(c=>c.classification==='PUBLICATION_ARTIFACT').length});
const summary={publicPagesScanned:260,publicErrorPagesScanned:1,renderedPagesScanned:261,generatedPagesInventoried:375,internalPagesExcluded:114,sourceFilesInspected:before.sourceFiles,candidates:publicBefore.length,confirmedLeaks:confirmed.length,confirmedPages:new Set(confirmed.map(c=>c.url)).size,uniqueConfirmedContexts:new Set(confirmed.map(c=>c.context)).size,reviewRequired:reviews.length,legitimateUses:publicBefore.filter(c=>c.classification==='LEGITIMATE_PUBLIC_USAGE').length,falsePositives:publicBefore.filter(c=>c.classification==='FALSE_POSITIVE').length,publicationArtifacts:artifacts.length,artifactPages:new Set(artifacts.map(c=>c.url)).size,internalSourceOccurrences:internalSource.filter(r=>r.classification==='INTERNAL_ONLY').length,sourceSyntaxFalsePositives:internalSource.filter(r=>r.classification==='FALSE_POSITIVE').length,sourceOccurrences:sourceRows.length,productionFilesChanged:new Set(edits.map(e=>e.source)).size,confirmedRemaining:publicAfter.filter(c=>c.classification==='CONFIRMED_INTERNAL_LEAK').length,artifactsRemaining:publicAfter.filter(c=>c.classification==='PUBLICATION_ARTIFACT').length,systemicRemaining:publicAfter.filter(c=>c.rootCause==='SYSTEMIC').length};
fs.writeFileSync(out+'/classification.json',JSON.stringify({summary,byType,validation,remaining:publicAfter.filter(c=>['CONFIRMED_INTERNAL_LEAK','PUBLICATION_ARTIFACT'].includes(c.classification))},null,2)+'\n');
console.log(JSON.stringify({summary,byType,unchangedValidationExceptions:validation.filter(v=>!v.canonicalUnchanged||!v.robotsUnchanged||!v.oldFragmentTargetsPreserved||!v.documentDestinationsUnchanged),confirmedNotChanged:confirmed.filter(c=>c.changed==='NO'),artifactsNotChanged:artifacts.filter(c=>c.changed==='NO')},null,2));

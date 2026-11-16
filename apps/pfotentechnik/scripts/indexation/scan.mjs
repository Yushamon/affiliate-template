import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {parse} from 'parse5';
import yaml from 'js-yaml';
export const app=fileURLToPath(new URL('../../',import.meta.url));
export const origin='https://pfotentechnik.de';
export const sha=value=>createHash('sha256').update(value).digest('hex');
export const attrs=node=>Object.fromEntries((node?.attrs??[]).map(a=>[a.name,a.value]));
export function* walk(node){if(!node)return;yield node;for(const c of node.childNodes??[])yield*walk(c)}
const hidden=n=>['script','style','template','noscript','button','svg'].includes(n.tagName)||'hidden'in attrs(n)||attrs(n)['aria-hidden']==='true';
export const visibleText=n=>!n||hidden(n)?'':n.nodeName==='#text'?n.value:(n.childNodes??[]).map(visibleText).join(' ').replace(/\s+/g,' ').trim();
const ancestors=n=>{const result=[];for(let p=n;p;p=p.parentNode)result.push(p);return result};
const automated=n=>['nav','footer'].includes(n.tagName)||/related-articles|next-steps|decision-journey|breadcrumbs|site-footer|site-header|px2-alternatives|internal-link-module|pt-discovery|sticky-cta|editorial-transparency|px2-price|product-card|comparison-card/.test((attrs(n).class??'')+' '+(attrs(n).id??''));
export function sourceInventory(){
 const rows=[];
 for(const collection of ['products','manufacturers','comparisons','pages','reviews']){
  const dir=path.join(app,'src/content',collection);if(!fs.existsSync(dir))continue;
  for(const name of fs.readdirSync(dir).filter(f=>/\.mdx?$/.test(f))){
   const file=path.join(dir,name),source=fs.readFileSync(file,'utf8'),match=source.match(/^---\s*\n([\s\S]*?)\n---/);if(!match)continue;
   const data=yaml.load(match[1],{schema:yaml.JSON_SCHEMA});
   const route=typeof data.seo?.canonical==='string'?new URL(data.seo.canonical,origin).pathname:typeof data.productUrl==='string'?new URL(data.productUrl,origin).pathname:`/${collection==='products'?'produkt/':collection==='manufacturers'?'hersteller/':collection==='comparisons'?'vergleiche/':''}${data.slug}/`;
   rows.push({file:path.relative(app,file),route,collection,data,body:source.slice(match[0].length),sha256:sha(source)});
  }
 }
 return rows;
}
export function inspectHtml(html,route){
 const doc=parse(html),nodes=[...walk(doc)],main=nodes.find(n=>n.tagName==='main'),mainNodes=[...walk(main)],mainSet=new Set(mainNodes);
 const links=nodes.filter(n=>n.tagName==='a'&&attrs(n).href&&!ancestors(n).some(hidden)).flatMap(n=>{
  const a=attrs(n);let url;try{url=new URL(a.href,origin+route)}catch{return []}
  if(url.origin!==origin||!['http:','https:'].includes(url.protocol))return [];
  const parents=ancestors(n),inMain=mainSet.has(n),isAutomated=parents.some(automated);
  return [{target:url.pathname,hash:url.hash,href:a.href,anchor:visibleText(n),contextual:inMain&&!isAutomated&&parents.some(p=>['p','li','td','dd'].includes(p.tagName)),inMain,automated:!inMain||isAutomated}];
 });
 const blocks=mainNodes.filter(n=>['p','li','dd','td'].includes(n.tagName)&&!ancestors(n).some(hidden)&&!ancestors(n).some(automated)&&!(n.tagName==='li'&&[...walk(n)].some(c=>c!==n&&['li','p'].includes(c.tagName)))).map(visibleText).filter(Boolean);
 const schemas=[],schemaErrors=[];
 for(const n of nodes.filter(n=>n.tagName==='script'&&attrs(n).type==='application/ld+json')){try{schemas.push(JSON.parse(n.childNodes.map(c=>c.value??'').join('')))}catch(e){schemaErrors.push(e.message)}}
 const robots=nodes.filter(n=>n.tagName==='meta'&&['robots','googlebot'].includes(attrs(n).name?.toLowerCase())).map(n=>attrs(n).content??'').join(',');
 const canonical=nodes.filter(n=>n.tagName==='link'&&attrs(n).rel?.split(/\s/).includes('canonical')).map(n=>attrs(n).href);
 return {htmlSha256:sha(html),canonical,robots,mainText:visibleText(main),blocks,links,schemas,schemaErrors,title:visibleText(nodes.find(n=>n.tagName==='title')),h1:mainNodes.filter(n=>n.tagName==='h1').map(visibleText),headings:mainNodes.filter(n=>/^h[23]$/.test(n.tagName)).map(visibleText),textSha256:sha(visibleText(doc)),outgoingLinks:links.map(l=>l.href)};
}
export function scanBuild(dist=path.join(app,'dist')){
 const sources=sourceInventory(),sourceMap=new Map(sources.map(s=>[s.route,s]));
 const sitemap=new Set();for(const file of fs.readdirSync(dist).filter(f=>/^sitemap.*\.xml$/.test(f)))for(const m of fs.readFileSync(path.join(dist,file),'utf8').matchAll(/<loc>(.*?)<\/loc>/g))if(!m[1].endsWith('.xml'))sitemap.add(m[1].replaceAll('&amp;','&'));
 const pages=[],excluded=[];
 function visit(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory()){if(entry.name!=='_astro'&&!(dir===dist&&entry.name==='admin'))visit(file);continue}if(!entry.name.endsWith('.html'))continue;
  const relative=path.relative(dist,file).split(path.sep).join('/'),route=relative==='index.html'?'/':relative.endsWith('/index.html')?'/'+relative.slice(0,-10):'/'+relative;
  const html=fs.readFileSync(file,'utf8'),signals=inspectHtml(html,route),source=sourceMap.get(route);
  if(signals.canonical.length===0||signals.canonical[0]!==origin+route||['/404.html','/500.html'].includes(route)){excluded.push({route,canonical:signals.canonical,robots:signals.robots,htmlSha256:signals.htmlSha256});continue;}
  const d=source?.data??{};
  const type=source?.collection==='products'?'product':source?.collection==='manufacturers'?'manufacturer':source?.collection==='comparisons'?'comparison':d.type==='hub'?'hub':source?'guide':route==='/'?'homepage':route.includes('/berater/')?'advisor':'utility';
  const cluster=d.category?.key??d.hub?.sections?.find(s=>!['produkte','hersteller','ratgeber','wissen'].includes(s))??d.tags?.find(t=>['gps-tracker','trinkbrunnen','futterautomaten','katzenklappen','haustierkameras','automatische-katzentoiletten'].includes(t))??'other';
  pages.push({route,url:origin+route,type,cluster,title:d.title??signals.h1[0]??signals.title,source:source?.file??null,sourceSha256:source?.sha256??null,description:d.description??null,declaredCanonical:d.seo?.canonical??null,declaredNoindex:d.seo?.noindex??false,declaredSitemap:d.seo?.sitemap??null,sitemapIncluded:sitemap.has(origin+route),...signals});
 }}visit(dist);
 pages.sort((a,b)=>a.route.localeCompare(b.route));
 const byRoute=new Map(pages.map(p=>[p.route,p]));
 for(const p of pages){
  const incoming=pages.flatMap(from=>from.links.filter(l=>l.target===p.route).map(l=>({source:from.route,anchor:l.anchor,contextual:l.contextual})));
  p.incoming=incoming;p.incomingSources=[...new Set(incoming.map(l=>l.source))];p.contextualSources=[...new Set(incoming.filter(l=>l.contextual&&l.source!==p.route).map(l=>l.source))];
 }
 const depth=new Map([['/',0]]),queue=['/'];for(let i=0;i<queue.length;i++){const current=queue[i];for(const l of byRoute.get(current)?.links??[]){if(byRoute.has(l.target)&&!depth.has(l.target)){depth.set(l.target,depth.get(current)+1);queue.push(l.target)}}}
 for(const p of pages)p.clickDepth=depth.get(p.route)??null;
 return {pages,excluded,sitemap:[...sitemap].sort(),robots:fs.existsSync(path.join(dist,'robots.txt'))?fs.readFileSync(path.join(dist,'robots.txt'),'utf8'):null};
}

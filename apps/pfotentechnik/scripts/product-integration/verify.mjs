import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { parse } from 'parse5';
import { readProductDocument } from '../../src/lib/price-intelligence/frontmatter-price.mjs';
import { resolveCommerceOffers } from '../../src/domain/commerceOffers.mjs';
import { isPublishedProduct } from '../../src/domain/productPublication.mjs';
const app=fileURLToPath(new URL('../../',import.meta.url));
export const walk=function*(node){yield node;if(['script','style'].includes(node.tagName))return;for(const child of node.childNodes??[])yield*walk(child)};
export const text=node=>[...walk(node)].filter(n=>n.nodeName==='#text').map(n=>n.value).join(' ').replace(/\s+/g,' ').trim();
const attr=(node,name)=>node.attrs?.find(a=>a.name===name)?.value;
export async function verifyIntegration(dist=path.join(app,'dist')){
 const manifest=JSON.parse(fs.readFileSync(path.join(app,'research/product-integration-35.8/manifest.json')));
 const baseline=JSON.parse(fs.readFileSync(path.join(app,'research/product-integration-35.8/baseline.json')));
 const allowed=new Set(['tractive-dog-6','invoxia-biotracker-2026','petlibro-granary-2-vision'].map(s=>`src/content/products/${s}.md`));
 let unchangedSources=0;for(const [file,hash] of Object.entries(baseline.sources)){if(allowed.has(file))continue;assert.equal(createHash('sha256').update(fs.readFileSync(path.join(app,file))).digest('hex'),hash,`${file}: unbeabsichtigte Inhaltsänderung`);unchangedSources++}
 const incoming={},snapshots={},htmlByRoute=new Map();
 function visit(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,item.name);if(item.isDirectory()){visit(file);continue}if(item.name!=='index.html')continue;const route='/'+path.relative(dist,path.dirname(file)).split(path.sep).filter(Boolean).join('/')+'/';if(route.startsWith('/admin/'))continue;const dom=parse(fs.readFileSync(file,'utf8')),nodes=[...walk(dom)];htmlByRoute.set(route,{dom,nodes});const links=nodes.filter(n=>n.tagName==='a').map(n=>attr(n,'href')).filter(Boolean);for(const target of links)if(baseline.routes.includes(target)){const key=route+' -> '+target;incoming[key]=(incoming[key]??0)+1}if(baseline.routes.includes(route))snapshots[route]={text:text(dom),links};}}
 visit(dist);
 for(const route of baseline.routes)assert.deepEqual(snapshots[route],baseline.snapshots[route],`${route}: Experiment-/Kontrollseite verändert`);
 assert.deepEqual(incoming,baseline.incomingLinks,'Linkzugänge des Experiments 35.5 verändert');
 const products=[],comparisons={};
 for(const slug of [...manifest.candidateSlugs,'tractive-dog-6','invoxia-biotracker-2026','petlibro-granary-2-vision']){
  const doc=await readProductDocument(path.join(app,'src/content/products',slug+'.md')),d=doc.data,published=isPublishedProduct(d),route=`/produkt/${slug}/`;
  assert.equal(htmlByRoute.has(route),published,`${slug}: Veröffentlichungssperre`);
  if(!published){assert.ok(!fs.existsSync(path.join(dist,'admin/seo/products',slug,'preview/index.html')),'QA-Vorschau im regulären Build');assert.equal(d.seo.noindex,true)}
  const offers=resolveCommerceOffers(d);assert.ok(offers.some(o=>o.currency==='EUR'&&o.current>0&&o.canLink),`${slug}: kein aktuelles EUR-Angebot mit CTA`);
  const broken=[];if(published){const {nodes}=htmlByRoute.get(route);for(const a of nodes.filter(n=>n.tagName==='a')){const href=attr(a,'href');if(!href?.startsWith('/')||href.startsWith('//'))continue;const target=href.split(/[?#]/)[0];if(target&&!fs.existsSync(path.join(dist,'.'+target,target.endsWith('/')?'index.html':'')))broken.push(href)}assert.deepEqual(broken,[],`${slug}: defekte interne Links`);const canonical=nodes.find(n=>n.tagName==='link'&&attr(n,'rel')==='canonical');assert.equal(attr(canonical,'href'),`https://pfotentechnik.de${route}`);}
  for(const comparison of manifest.candidateSlugs.includes(slug)&&published?d.comparisons:[]){const built=htmlByRoute.get(`/vergleiche/${comparison}/`);assert.ok(built,comparison);const links=built.nodes.filter(n=>n.tagName==='a').map(n=>attr(n,'href'));assert.ok(links.includes(route),`${slug}: fehlt im Vergleich`);const visible=built.nodes.filter(n=>attr(n,'data-picker-card')).map(n=>attr(n,'data-picker-card'));
   assert.ok(visible.includes(slug),`${slug}: fehlt in sichtbarer Produktauswahl`);
   comparisons[comparison]={newProducts:[...(comparisons[comparison]?.newProducts??[]),slug],visibleProducts:[...new Set(visible)]};
  }
  products.push({slug,published,blockers:d.publicationBlockers??[],offers:offers.map(o=>({merchant:o.merchant,current:o.current,currency:o.currency,availability:o.availability,affiliateUrl:o.affiliateUrl,canLink:o.canLink}))});
 }
 for(const [slug,result] of Object.entries(comparisons))assert.ok(result.visibleProducts.length>=10,`${slug}: weniger als zehn sichtbare Produkte`);
 const renderedDecisionFacts = Object.fromEntries(['tractive-cat-6-mini','tractive-dog-6','tractive-dog-6-xl'].map(slug=>{const {nodes}=htmlByRoute.get(`/produkt/${slug}/`);const section=nodes.find(n=>n.tagName==='section'&&attr(n,'class')==='decision-facts');const rows=[...walk(section)].filter(n=>n.tagName==='dt').map(n=>text(n));const consequences=[...walk(section)].filter(n=>n.tagName==='dd').map(n=>text(n));return [slug,rows.map((fact,i)=>({fact,consequence:consequences[i]}))]}));
 return {renderedDecisionFacts,protectedPages:baseline.routes.length,protectedIncomingEdges:Object.keys(incoming).length,unchangedSources,products,comparisons};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const result=await verifyIntegration();fs.writeFileSync(path.join(app,'reports/product-integration-35.8/verification.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({protectedPages:result.protectedPages,protectedIncomingEdges:result.protectedIncomingEdges,products:result.products.length,comparisons:result.comparisons},null,2));}

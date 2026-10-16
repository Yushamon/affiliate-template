import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readProductFiles,readProductDocument} from '../../src/lib/price-intelligence/frontmatter-price.mjs';
import {resolveCommerceOffers} from '../../src/domain/commerceOffers.mjs';
const app=fileURLToPath(new URL('../../',import.meta.url));
const errors=[];let products=0,offers=0,reviews=0;
const reviewBaseline = new Map(JSON.parse(await fs.readFile(path.join(app,'reports/google-indexing-fix/after/product-signals.json'),'utf8')).map(record=>[record.slug,record.afterReview]));
const walk=(node,visit)=>{if(!node||typeof node!=='object')return;visit(node);for(const value of Object.values(node)) if(value&&typeof value==='object') Array.isArray(value)?value.forEach(v=>walk(v,visit)):walk(value,visit);};
for(const file of await readProductFiles(path.join(app,'src/content/products'))) {
  const {data}=await readProductDocument(file);
  const html=await fs.readFile(path.join(app,'dist/produkt',data.slug,'index.html'),'utf8');
  const schemas=[...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
  let product;
  for(const schema of schemas) walk(schema,n=>{if(n['@type']==='Product' && n.sku===data.slug)product=n;if(n['@type']==='Review')reviews++;});
  if(!product){errors.push(`${data.slug}: Product missing`);continue;}
  products++;
  if(reviewBaseline.has(data.slug) && Boolean(product.review)!==reviewBaseline.get(data.slug)) errors.push(`${data.slug}: deployed review policy changed`);
  const actual=product.offers ? Array.isArray(product.offers)?product.offers:[product.offers] : [];
  const expected=resolveCommerceOffers(data).filter(o=>o.purchasable&&o.fresh&&o.current!=null);
  if(actual.length!==expected.length)errors.push(`${data.slug}: ${actual.length} offers, expected ${expected.length}`);
  for(const item of actual) {
    offers++;
    if(item['@type']!=='Offer'||item.availability!=='https://schema.org/InStock'||!expected.some(o=>o.current===item.price&&o.currency===item.priceCurrency&&o.destination===item.url))errors.push(`${data.slug}: unsafe price/stock/merchant schema`);
  }
  if(data.slug==='petlibro-granary-2-vision' && (actual.length||html.includes('129,99')||!html.includes('Deutsche Verfügbarkeit nicht bestätigt') || !html.includes('data-availability="unknown"'))) errors.push(`${data.slug}: regression in visible price/availability`);
}
const comparisons=await fs.readdir(path.join(app,'dist/vergleiche'),{withFileTypes:true});
let comparisonPages=0;
for(const entry of comparisons.filter(e=>e.isDirectory())){
  const html=await fs.readFile(path.join(app,'dist/vergleiche',entry.name,'index.html'),'utf8');comparisonPages++;
  if(/129,99\s*(?:&nbsp;|\u00a0| )?\$/.test(html))errors.push(`${entry.name}: foreign Granary price in comparison`);
}
const result={products,offers,reviews,comparisonPages,errors};
await fs.writeFile(path.join(app,'reports/price-availability-integrity/rendered-audit.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
if(errors.length)process.exitCode=1;

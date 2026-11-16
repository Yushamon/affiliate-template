// One-time immutable baseline captured from the completed 36.0 production build.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {parse} from 'parse5';
import {readProductDocument} from '../../src/lib/price-intelligence/frontmatter-price.mjs';
import {buildDecisionFacts} from '../../src/domain/productExperience/consequences.ts';
import {walk,text} from '../product-integration/verify.mjs';
const app=fileURLToPath(new URL('../../',import.meta.url));
export function renderedFacts(slug){
 const file=path.join(app,'dist/produkt',slug,'index.html');
 if(!fs.existsSync(file))return null;
 const section=[...walk(parse(fs.readFileSync(file,'utf8')))].find(n=>n.tagName==='section'&&n.attrs?.some(a=>a.name==='class'&&a.value==='decision-facts'));
 if(!section)return [];
 const nodes=[...walk(section)],dd=nodes.filter(n=>n.tagName==='dd').map(text);
 return nodes.filter(n=>n.tagName==='dt').map((n,i)=>({label:text(n.childNodes.find(c=>c.tagName==='span')),value:text(n.childNodes.find(c=>c.tagName==='strong')),consequence:dd[i]}));
}
if(process.argv.includes('--capture')){
 const target=path.join(app,'research/decision-consequences-35.9/baseline.json');
 if(fs.existsSync(target))throw Error('Baseline exists; never replace the before evidence.');
 const products=[];
 for(const file of fs.readdirSync(path.join(app,'src/content/products')).filter(f=>f.endsWith('.md')).sort()){
  const raw=fs.readFileSync(path.join(app,'src/content/products',file));
  const {data}=await readProductDocument(path.join(app,'src/content/products',file));
  products.push({slug:data.slug,title:data.title,data,sourceSha256:createHash('sha256').update(raw).digest('hex'),generated:buildDecisionFacts(data,data.specs??[]),rendered:renderedFacts(data.slug)});
 }
 fs.writeFileSync(target,JSON.stringify({phase:'after-36.0-before-35.9',products},null,2)+'\n');
 console.log({products:products.length,rendered:products.filter(p=>p.rendered!==null).length});
}

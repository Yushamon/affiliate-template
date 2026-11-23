import {readBeforeEvidence} from '../product-evidence/approved-changes.mjs';
// Apply only the individually researched decisions, never rewrite the product collection.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { decisions } from './decisions.mjs';
import { atomicWriteFile } from '../../src/lib/admin/atomic-file.mjs';
const app=fileURLToPath(new URL('../../',import.meta.url));
const root=path.join(app,'research/product-freshness-36.0');
const baseline=JSON.parse(fs.readFileSync(path.join(root,'baseline.json')));
const protectedSlugs=new Set(JSON.parse(fs.readFileSync(path.join(app,'research/product-integration-35.8/baseline.json'))).routes);
const hash=s=>createHash('sha256').update(s).digest('hex');
export function replaceBlock(frontmatter,key,value){
 const lines=frontmatter.split('\n'),start=lines.findIndex(l=>l.startsWith(key+':'));
 const block=yaml.dump({[key]:value},{noRefs:true,lineWidth:110,quotingType:'"'}).trimEnd().split('\n');
 if(start<0)return [...lines,...block].join('\n');
 let end=start+1;while(end<lines.length&&(!lines[end].trim()||/^\s/.test(lines[end])))end++;
 lines.splice(start,end-start,...block);return lines.join('\n');
}
export async function applyDecisions(write=false){
 const records=[];
 const originals=fs.existsSync(path.join(root,'originals.json'))?JSON.parse(fs.readFileSync(path.join(root,'originals.json'))):{};
 const previous=fs.existsSync(path.join(root,'changes.json'))?JSON.parse(fs.readFileSync(path.join(root,'changes.json'))):null;
 if(write)for(const decision of decisions(baseline)){const file=path.join(app,'src/content/products',decision.slug+'.md');assert.equal(fs.readFileSync(file,'utf8'),readBeforeEvidence(file,'utf8'),decision.slug+': spätere Evidenzänderung darf nicht überschrieben werden');}
 for(const decision of decisions(baseline)){
  const p=baseline.products.find(p=>p.slug===decision.slug);assert.ok(p,decision.slug);
  assert.ok(!protectedSlugs.has(`/produkt/${p.slug}/`),'35.5: '+p.slug);
  const file=path.join(app,p.file),current=readBeforeEvidence(file,'utf8');
  if(write)assert.equal(fs.readFileSync(file,'utf8'),current,p.slug+': spätere Evidenzänderung darf nicht überschrieben werden');
  const oldRecord=previous?.products.find(r=>r.slug===p.slug);
  assert.ok(hash(current)===p.sha256||hash(current)===oldRecord?.afterSha256,p.slug+': Ausgangsdatei inzwischen geändert');
  const before=originals[p.file]??current;assert.equal(hash(before),p.sha256,p.slug+': gesichertes Original stimmt nicht');
  originals[p.file]=before;
  const m=before.match(/^---\n([\s\S]*?)\n---\n/);assert.ok(m);
  let frontmatter=m[1],body=before.slice(m[0].length);const bodyChanges=[];
  const patch={...decision.patch,updatedAt:'2026-11-16'};
  for(const forbidden of ['decisionFacts','seo','slug','productUrl','affiliate','price','offers','publishedAt','publicationStatus','publicationBlockers'])assert.ok(!(forbidden in patch),forbidden);
  for(const [key,value]of Object.entries(patch))frontmatter=replaceBlock(frontmatter,key,value);
  for(const [oldText,newText]of decision.replacements??[]){assert.ok(body.includes(oldText),p.slug+': Originalaussage fehlt: '+oldText);body=body.replace(oldText,newText);bodyChanges.push({before:oldText,after:newText})}
  if(decision.section){body=body.trimEnd()+'\n\n## Recherche-Update vom 16. November 2026\n\n'+decision.section+'\n';bodyChanges.push({before:null,after:decision.section})}
  const after=`---\n${frontmatter}\n---\n${body}`,parsed=yaml.load(frontmatter);
  for(const key of ['decisionFacts','seo','slug','productUrl','affiliate','price','offers','publishedAt','publicationStatus','publicationBlockers'])assert.deepEqual(parsed[key],p.data[key],p.slug+'.'+key);
  const changedFields=Object.fromEntries(Object.entries(patch).filter(([key,v])=>JSON.stringify(p.data[key])!==JSON.stringify(v)).map(([key,v])=>[key,{before:p.data[key]??null,after:v}]));
  records.push({slug:p.slug,file:p.file,beforeSha256:p.sha256,afterSha256:hash(after),reason:decision.reason,sources:decision.sources,changedFields,bodyChanges});
  if(write)await atomicWriteFile(file,after,'utf8');
 }
 const result={version:'36.0',checkedAt:'2026-11-16',products:records};
 if(write){fs.writeFileSync(path.join(root,'changes.json'),JSON.stringify(result,null,2)+'\n');fs.writeFileSync(path.join(root,'originals.json'),JSON.stringify(originals,null,2)+'\n')}
 return result;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const r=await applyDecisions(process.argv.includes('--write'));console.log(JSON.stringify({write:process.argv.includes('--write'),products:r.products.map(p=>({slug:p.slug,fields:Object.keys(p.changedFields)}))},null,2))}

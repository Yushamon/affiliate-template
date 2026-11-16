import {execFileSync} from 'node:child_process';
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {app,sha} from './scan.mjs';
// Existing experiment 35.5 already distinguishes Astro's deduplicated image
// aliases from changes in the rendered page. Here every alias is tied to bytes.
export function imageAliasNormalizer(){
 const evidence=[],cache=new Map(),repo=path.resolve(app,'../..');
 const identityFile=path.join(app,'research/indexation-improvements-36.1/image-identity-baseline.json');
 const identities=fs.existsSync(identityFile)?JSON.parse(fs.readFileSync(identityFile)).images:{};
 const ledger=JSON.parse(fs.readFileSync(path.join(app,'reports/indexation-gap-analysis-35.5/build-image-alias-evidence.json')));
 const sourcePairs=[...ledger.identicalSourcePairs.map(pair=>({...pair,files:[pair.hero,pair.comparison]})),...(ledger.identicalSourceGroups??[])].filter(pair=>pair.files.every(file=>fs.existsSync(path.join(repo,file))&&sha(fs.readFileSync(path.join(repo,file)))===pair.originalSha256));
 let imageSources;
 const frozenPair=(hash,prefix)=>{
  if(!imageSources){
   imageSources=new Map();
   const visit=dir=>{if(!fs.existsSync(dir))return;for(const item of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,item.name);if(item.isDirectory())visit(file);else if(/^(?:hero|comparison|thumbnail|gallery-\d+)\.webp$/.test(item.name)){const key=sha(fs.readFileSync(file)),files=imageSources.get(key)??[];files.push(path.relative(repo,file));imageSources.set(key,files)}}};
   visit(path.join(app,'src/assets/images'));visit(path.join(app,'public/images'));
  }
  const candidates=imageSources.get(hash)??[],files=[];
  for(const relative of candidates){let old;try{old=execFileSync('git',['show','7f017989:'+relative],{cwd:repo,stdio:['ignore','pipe','ignore']})}catch{continue}if(sha(old)===hash)files.push(relative)}
  return files.length>=2&&files.some(file=>path.basename(file)===prefix+'.webp')?{originalSha256:hash,files,baselineCommit:'7f017989'}:null;
 };
 const resolve=url=>{
  if(cache.has(url))return cache.get(url);
  const name=path.basename(url),direct=path.join(app,'dist',url),assetCache=path.join(app,'.astro-cache/assets',name);
  let file=fs.existsSync(direct)?direct:fs.existsSync(assetCache)?assetCache:null,basis=file===assetCache?'prior-transform-cache':'current-build';
  if(!file&&identities[url]){const record=identities[url];assert.match(record.sha256,/^[a-f0-9]{64}$/);evidence.push({...record,basis:'archived-verified-image-identity'});cache.set(url,record.sha256);return record.sha256;}
  if(!file){
   const match=name.match(/^(?:hero|comparison|thumbnail|gallery-\d+)\.([A-Za-z0-9_-]{8})\.webp$/);assert.ok(match,'Vorher-Bild muss im Cache belegbar sein: '+url);
   const alias=fs.readdirSync(path.join(app,'dist/_astro')).find(n=>n.endsWith(`.${match[1]}.webp`));assert.ok(alias,'Kein inhaltsgleicher Astro-Quellalias: '+url);
   file=path.join(app,'dist/_astro',alias);const hash=sha(fs.readFileSync(file));
   const pair=sourcePairs.find(p=>p.originalSha256===hash&&p.files.some(file=>path.basename(file)===name.split('.')[0]+'.webp'))??frozenPair(hash,name.split('.')[0]);assert.ok(pair,'Raw-Alias nicht durch bestehende 35.5-Quellpaarbelege gedeckt: '+url);
   basis='immutable-source-pair-sha-and-identical-astro-source-id';evidence.push({url,resolvedAs:'/_astro/'+alias,sha256:hash,basis,sourcePair:pair});
  }
  const hash=sha(fs.readFileSync(file));if(identities[url])assert.equal(hash,identities[url].sha256,'Bildbytes unter bestehendem Assetnamen verändert: '+url);if(!evidence.some(e=>e.url===url))evidence.push({url,sha256:hash,basis});cache.set(url,hash);return hash;
 };
 const normalize=html=>html.replace(/\/_astro\/(?:hero|comparison|thumbnail|gallery-\d+)\.[A-Za-z0-9_-]+\.webp/g,url=>'/_astro/CONTENT-'+resolve(url)+'.webp');
 return {normalize,evidence};
}

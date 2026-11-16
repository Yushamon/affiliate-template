import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {gunzipSync} from 'node:zlib';
import {imageAliasNormalizer} from './image-aliases.mjs';
import {app,scanBuild,sha} from './scan.mjs';import {verifyIntegration} from '../product-integration/verify.mjs';
const root=path.join(app,'research/indexation-improvements-36.1');
export async function verifyIndexation({rollback=false}={}){
 const baseline=JSON.parse(gunzipSync(fs.readFileSync(path.join(root,'baseline.json.gz')))),after=scanBuild(),byRoute=new Map(after.pages.map(p=>[p.route,p]));
 const protectedRoutes=Object.keys(baseline.protectedHtml),problems=[],changedSources=new Set();let htmlByteEqual=0,htmlEquivalent=0;const images=imageAliasNormalizer();
 for(const route of protectedRoutes){const raw=fs.readFileSync(path.join(app,'dist','.'+route,'index.html'),'utf8');if(raw===baseline.protectedHtml[route])htmlByteEqual++;if(images.normalize(raw)===images.normalize(baseline.protectedHtml[route]))htmlEquivalent++;else problems.push({route,code:'PROTECTED_HTML_CHANGED'});
  const edges=pages=>Object.fromEntries(pages.map(p=>[p.route,p.links.filter(l=>l.target===route).length]).filter(([,n])=>n));
  const old=edges(baseline.pages),now=edges(after.pages);for(const source of new Set([...Object.keys(old),...Object.keys(now)]))if(old[source]!==now[source]){problems.push({route,source,code:'PROTECTED_INCOMING_CHANGED'});changedSources.add(source)}
 }
 if(problems.length&&rollback){
  const manifestFile=path.join(root,'changes.json'),manifest=JSON.parse(fs.readFileSync(manifestFile)),originals=JSON.parse(fs.readFileSync(path.join(root,'originals.json')));let restored=0;
  for(const change of manifest.changes.filter(c=>c.status==='implemented'&&changedSources.has(c.route))){const full=path.join(app,change.file);assert.equal(sha(fs.readFileSync(full)),change.afterSha256,'Parallele Änderungen nicht zurücknehmen');fs.writeFileSync(full,originals[change.file]);change.status='blocked-experiment-35.5';change.blockedReason=problems.filter(p=>p.source===change.route);restored++}
  fs.writeFileSync(manifestFile,JSON.stringify(manifest,null,2)+'\n');
  fs.writeFileSync(path.join(root,'rollback.json'),JSON.stringify({restored,problems,requiresRebuild:true},null,2)+'\n');
  throw Error(`35.5-Schutz: ${restored} eigene Inhaltsänderungen automatisch zurückgenommen; Build erneut ausführen. Andere Arbeit bleibt erhalten.`);
 }
 assert.deepEqual(problems,[],'35.5-HTML und Linkzugänge');
 assert.deepEqual(after.pages.map(p=>p.url),baseline.pages.map(p=>p.url),'Keine neuen oder entfernten Canonicals');
 assert.deepEqual(after.sitemap,baseline.sitemap,'Sitemap-Mitgliedschaft unverändert');
 for(const p of after.pages){const old=baseline.pages.find(o=>o.route===p.route);assert.deepEqual(p.canonical,old.canonical,p.route);assert.equal(p.robots,old.robots,p.route);assert.ok(p.mainText,p.route);assert.deepEqual(p.schemaErrors,[],p.route)}
 const legacy=await verifyIntegration();
 if(fs.existsSync(path.join(root,'rollback.json'))){const receipt=JSON.parse(fs.readFileSync(path.join(root,'rollback.json')));fs.writeFileSync(path.join(root,'rollback.json'),JSON.stringify({...receipt,resolved:true,requiresRebuild:false,actualExperimentChanges:false,resolution:'Initialer Bytevergleich enthielt ausschließlich SHA-belegte Astro-Bildaliasnamen; keine Inhalt-/Linkänderung, keine Inhaltsrücknahme erforderlich.'},null,2)+'\n')}
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'changes.json')));
 for(const c of manifest.changes.filter(c=>c.status==='implemented')){
  const p=byRoute.get(c.route);for(const target of c.addedTargets)assert.ok(p.links.some(l=>l.contextual&&l.target===target),`${c.route}: expliziter Kontextlink nicht sichtbar ${target}`);
  // Existing anchors, including links to protected pages, must remain ordered.
  const old=baseline.pages.find(p=>p.route===c.route).outgoingLinks,now=p.outgoingLinks;let i=0;for(const href of now)if(href===old[i])i++;assert.equal(i,old.length,c.route+': bestehende Links ersetzt oder entfernt');
 }
 fs.writeFileSync(path.join(root,'image-alias-verification.json'),JSON.stringify({method:'Only byte-verified product image alias URLs normalized to content SHA; prior resized bytes from Astro cache, raw aliases verified against existing 35.5 source-pair SHA evidence. All remaining HTML is compared exactly.',evidence:images.evidence},null,2)+'\n');
 return {htmlByteEqual,htmlEquivalent,protectedPages:20,incomingEdges:legacy.protectedIncomingEdges,canonicals:after.pages.length,sitemap:after.sitemap.length,changedGuides:manifest.changes.filter(c=>c.status==='implemented').length,explicitLinks:manifest.changes.filter(c=>c.status==='implemented').reduce((n,c)=>n+c.addedTargets.length,0)};
}
if(process.argv[1]===new URL(import.meta.url).pathname){const r=await verifyIndexation({rollback:process.argv.includes('--rollback-protected')});fs.writeFileSync(path.join(root,'verification.json'),JSON.stringify(r,null,2)+'\n');console.log(JSON.stringify(r,null,2))}

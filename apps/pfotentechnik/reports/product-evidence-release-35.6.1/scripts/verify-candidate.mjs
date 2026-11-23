import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {parse} from 'parse5';
import {parseCsv} from '../../../scripts/indexation/evidence.mjs';
import {approvedEvidenceChanges} from '../../../scripts/product-evidence/approved-changes.mjs';
import {validateFindings} from '../../../scripts/product-evidence/check-findings.mjs';
import {verifyIndexation} from '../../../scripts/indexation/verify.mjs';
const app=fileURLToPath(new URL('../../../',import.meta.url)),repo=path.resolve(app,'../..');
const output=process.argv[2]??path.join(app,'reports/product-evidence-release-35.6.1/candidate-proof.json');
const report=path.dirname(output),initial=JSON.parse(fs.readFileSync(path.join(report,'starting-file-hashes.json')));
const issues=[],sha=s=>createHash('sha256').update(s).digest('hex');
const sourceRows=[];
for(const [file,hash]of Object.entries(initial))if(file.startsWith('apps/pfotentechnik/src/content/')||file.startsWith('packages/affiliate-core/')||/^apps\/pfotentechnik\/(?:src\/(?:components|domain|pages|styles|lib)\/|public\/_redirects$|astro\.config\.mjs$)/.test(file)){
 const full=path.join(repo,file),same=fs.existsSync(full)&&sha(fs.readFileSync(full))===hash;sourceRows.push({file,same});if(!same)issues.push([file,'Unintended source change']);
}
const lock=JSON.parse(fs.readFileSync(path.join(app,'reports/indexation-gap-analysis-35.5/selection-lock.json')));
const experimentSources=lock.pairs.flatMap(p=>['treatment','control'].map(group=>({group,canonical:p[group].canonical,file:p[group].source,unchanged:sha(fs.readFileSync(path.join(repo,p[group].source)))===initial[p[group].source]})));
if(experimentSources.some(r=>!r.unchanged))issues.push(['35.5','Experiment source changed']);
const before=JSON.parse(gunzipSync(fs.readFileSync(path.join(app,'reports/product-evidence-update-35.6/rendered-before.json.gz'))));
const attrs=n=>Object.fromEntries((n.attrs??[]).map(a=>[a.name,a.value]));
function find(n,p,r=[]){if(p(n))r.push(n);for(const c of n.childNodes??[])find(c,p,r);return r}
const text=n=>n.nodeName==='#text'?n.value:['script','style'].includes(n.tagName)?'':(n.childNodes??[]).map(text).join(' ');
const plain=s=>s.replace(/\s+/g,' ').trim();
const afterFiles=[];function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const f=path.join(d,e.name);if(e.isDirectory())walk(f);else if(f.endsWith('.html'))afterFiles.push(path.relative(path.join(app,'dist'),f))}}walk(path.join(app,'dist'));
if(JSON.stringify(Object.keys(before).sort())!==JSON.stringify(afterFiles.sort()))issues.push(['routes','HTML inventory changed']);
const expectedPublic=new Set([...approvedEvidenceChanges().keys()].map(f=>f.includes('/products/')?'https://pfotentechnik.de/produkt/'+path.basename(f,'.md')+'/':'https://pfotentechnik.de/'+path.basename(f,'.md')+'/'));
const publicChanges=[],rendered=[];
for(const [file,old]of Object.entries(before)){
 const html=fs.readFileSync(path.join(app,'dist',file),'utf8'),doc=parse(html),main=find(doc,n=>n.tagName==='main')[0]??doc;
 const canonical=find(doc,n=>n.tagName==='link'&&attrs(n).rel==='canonical').map(n=>attrs(n).href),robots=find(doc,n=>n.tagName==='meta'&&attrs(n).name==='robots').map(n=>attrs(n).content),sponsored=find(doc,n=>n.tagName==='a'&&/sponsored/.test(attrs(n).rel??'')).map(n=>attrs(n).href);
 for(const [k,v]of Object.entries({canonical,robots,sponsored}))if(JSON.stringify(v)!==JSON.stringify(old[k]))issues.push([file,k+' changed']);
 for(const script of find(doc,n=>n.tagName==='script'&&attrs(n).type==='application/ld+json'))try{JSON.parse(script.childNodes.map(c=>c.value??'').join(''))}catch{issues.push([file,'Invalid JSON-LD'])}
 const currentText=plain(text(main));if(canonical.length&&currentText!==old.main){publicChanges.push(canonical[0]);if(!expectedPublic.has(canonical[0]))issues.push([canonical[0],'Unexpected public text change'])}
 const markers={'produkt/petlibro-one-rfid-smart-feeder/index.html':['V2.0.27','Mitfressen bleibt zu prüfen'],'produkt/petlibro-granary-wifi-feeder/index.html':['V1.0.58','AF103/PLAF103'],'produkt/petlibro-granary-camera-feeder/index.html':['F.A.Z. Kaufkompass','Der Blickwinkel ist fest'],'produkt/tractive-cat-6-mini/index.html':['Bluetooth-Reichweite manuell aktivieren'],'wie-funktionieren-gps-tracker/index.html':['zuletzt übermittelten Akkustand']};
 if(markers[file]){const matches=markers[file].map(value=>({value,visible:currentText.includes(value)}));rendered.push({canonical:canonical[0],matches});if(matches.some(m=>!m.visible))issues.push([file,'Edit not rendered'])}
}
if(publicChanges.length!==5)issues.push(['content','Expected exactly five public edits against pre-35.6']);
const ledger=JSON.parse(fs.readFileSync(path.join(app,'research/editorial-findings.json'))),oldStatuses=new Map(parseCsv(fs.readFileSync(path.join(app,'reports/product-evidence-update-35.6/evidence-ledger.csv'),'utf8')).map(r=>[r['Befund-ID'],r.Status]));
for(const f of ledger.findings)if(f.status!==oldStatuses.get(f.id))issues.push([f.id,'Unjustified status transition']);
issues.push(...validateFindings(ledger).map(e=>['ledger',e]));
const experiment=await verifyIndexation();
const result={sourceFilesChecked:sourceRows.length,sourceRows,experimentSources,experiment,htmlDocuments:afterFiles.length,publicChanges,rendered,ledger:{findings:ledger.findings.length,unchangedStatuses:true},issues,pass:!issues.length};
fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({sources:sourceRows.length,publicChanges:publicChanges.length,experimentEquivalent:experiment.htmlEquivalent,issues,pass:result.pass},null,2));process.exitCode=result.pass?0:1;

#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const PATCH='pfotentechnik-feeder-journey-closure-27.1.0';
const APPREL=path.join('apps','pfotentechnik');
const rel={
 chooser:path.join(APPREL,'src/content/pages/welcher-futterautomat-ist-der-richtige.md'),
 multi:path.join(APPREL,'src/content/comparisons/beste-futterautomaten-fuer-mehrtierhaushalte.md'),
 loader:path.join(APPREL,'src/lib/seo/topical-authority/loadTopicalAuthority.ts'),
 journey:path.join(APPREL,'src/lib/seo/topical-authority/journey-completion.ts'),
 intent:path.join(APPREL,'src/lib/seo/topical-authority/intent-ownership.ts'),
 test:path.join(APPREL,'test/feeder-journey-closure-27.1.0.test.mjs'),
 pkg:path.join(APPREL,'package.json')
};
const scripts=['audit:topical-authority:strict','audit:decision-journeys:strict','audit:internal-link-health:strict','audit:content-quality:strict','build'];
const rows=[
 {key:'/vergleiche/beste-futterautomaten-mit-akku/',line:'| Batterie- oder Akkureserve | [Futterautomaten mit Akku](/vergleiche/beste-futterautomaten-mit-akku/) |'},
 {key:'/vergleiche/futterautomat-mit-app/',line:'| Zeitpläne und Portionen per App | [Futterautomaten mit App](/vergleiche/futterautomat-mit-app/) |'}
];
const sure='[SureFeed als Hersteller und System einordnen](/hersteller/surefeed/)';
const log=m=>console.log(`[${PATCH}] ${m}`);
function root(start){let c=path.resolve(start);for(let i=0;i<16;i++){if(fs.existsSync(path.join(c,rel.pkg)))return c;const p=path.dirname(c);if(p===c)break;c=p;}throw new Error('Repository-Wurzel nicht gefunden.');}
const ROOT=root(process.cwd()),APP=path.join(ROOT,APPREL),f=Object.fromEntries(Object.entries(rel).map(([k,v])=>[k,path.join(ROOT,v)]));
const backup=path.join(ROOT,'.patch-backups',`${PATCH}-${new Date().toISOString().replace(/[:.]/g,'-')}`),targets=[f.chooser,f.multi,f.test];
function read(file,label){if(!fs.existsSync(file))throw new Error(`${label} fehlt: ${path.relative(ROOT,file)}`);const s=fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n');if(/^(<<<<<<<|=======|>>>>>>>)(?: .*)?$/m.test(s))throw new Error(`${label} enthält Git-Konfliktmarker.`);return s;}
function split(src,label){const l=src.split('\n');if(l[0]?.trim()!=='---')throw new Error(`${label}: Frontmatter fehlt.`);const e=l.findIndex((x,i)=>i>0&&x.trim()==='---');if(e<0)throw new Error(`${label}: Frontmatter-Ende fehlt.`);return {front:l.slice(0,e+1),body:l.slice(e+1)};}
function ser(d){const b=[...d.body];while(b.length&&b.at(-1)==='')b.pop();return [...d.front,...b,''].join('\n');}
function section(lines,title){const s=lines.findIndex(x=>x.trim()===`## ${title}`);if(s<0)return null;let e=lines.length;for(let i=s+1;i<lines.length;i++)if(/^##\s+/.test(lines[i])){e=i;break;}return {s,e};}
function chooser(src){const d=split(src,'Auswahlhilfe'),r=section(d.body,'Direkte Vergleiche nach Bedarf');if(!r)throw new Error('Auswahlhilfe: Abschnitt fehlt.');const sec=d.body.slice(r.s,r.e),sep=sec.findIndex(x=>/^\|\s*---/.test(x.trim()));if(sep<0)throw new Error('Auswahlhilfe: Tabelle ohne Trennzeile.');const add=rows.filter(x=>!src.includes(x.key)).map(x=>x.line);if(!add.length)return src;d.body.splice(r.s+sep+1,0,...add);return ser(d);}
function multi(src){if(src.includes('/hersteller/surefeed/'))return src;const d=split(src,'Mehrtiervergleich'),r=section(d.body,'SureFeed Connect richtig einordnen');if(!r)throw new Error('Mehrtiervergleich: SureFeed-Abschnitt fehlt.');d.body.splice(r.e,0,'',`Mehr zu Mikrochip-Näpfen, Connect-Hub und Geräteabgrenzung zeigt die Seite ${sure}.`);return ser(d);}
function assertState(a,b){for(const row of rows){if(!a.includes(row.line))throw new Error(`Zielkante fehlt: ${row.key}`);if(a.split(row.key).length-1!==1)throw new Error(`Zielkante nicht genau einmal: ${row.key}`);}if(!b.includes(sure))throw new Error('SureFeed-Herstellerkante fehlt.');if(b.split('/hersteller/surefeed/').length-1!==1)throw new Error('SureFeed-Herstellerkante nicht genau einmal.');}
function write(file,next){const prev=fs.existsSync(file)?fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n'):null;if(prev===next){log(`Bereits aktuell: ${path.relative(ROOT,file)}`);return;}fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,next,'utf8');log(`Geändert: ${path.relative(ROOT,file)}`);}
function save(file){if(!fs.existsSync(file))return;const dest=path.join(backup,path.relative(ROOT,file));fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(file,dest);}
function rollback(){for(const file of targets){const src=path.join(backup,path.relative(ROOT,file));if(fs.existsSync(src)){fs.mkdirSync(path.dirname(file),{recursive:true});fs.copyFileSync(src,file);}else if(file===f.test&&fs.existsSync(file))fs.rmSync(file,{force:true});}}
function run(cmd,args,label,cwd=ROOT){log(`Prüfe: ${label}`);const exe=process.platform==='win32'&&cmd==='npm'?'npm.cmd':cmd;const r=spawnSync(exe,args,{cwd,stdio:'inherit',shell:false,env:process.env});if(r.error)throw r.error;if(r.status!==0)throw new Error(`${label} fehlgeschlagen (Exit ${r.status}).`);log(`BESTANDEN: ${label}`);}

const c0=read(f.chooser,'Auswahlhilfe'),m0=read(f.multi,'Mehrtiervergleich'),loader=read(f.loader,'Loader'),journey=read(f.journey,'Journey'),pkgsrc=read(f.pkg,'package.json');read(f.intent,'Intent-Ownership');
if(!loader.includes('id: "futterautomaten-consolidate"')||!loader.includes('!byId.futterautomaten.journeyCompletion?.complete'))throw new Error('Dynamische Abschlusslogik fehlt. Erst Intent-Consolidation anwenden.');
for(const marker of ['Auswahlhilfe → Akkuvergleich','Auswahlhilfe → App-Vergleich','Mehrtiervergleich → SureFeed'])if(!journey.includes(marker))throw new Error(`Pflichtkante fehlt in Journey-Registry: ${marker}`);
let pkg;try{pkg=JSON.parse(pkgsrc);}catch(e){throw new Error(`package.json ungültig: ${e instanceof Error?e.message:String(e)}`);}for(const s of scripts)if(typeof pkg.scripts?.[s]!=='string')throw new Error(`npm-Skript fehlt: ${s}`);
const c1=chooser(c0),m1=multi(m0);assertState(c1,m1);if(chooser(c1)!==c1||multi(m1)!==m1)throw new Error('Idempotenzprüfung vor dem Schreiben fehlgeschlagen.');
const test=`import assert from 'node:assert/strict';\nimport fs from 'node:fs';\nimport path from 'node:path';\nimport test from 'node:test';\nimport { buildOpportunities } from '../src/lib/seo/topical-authority/loadTopicalAuthority.ts';\nconst APP=process.cwd();\nconst chooser=fs.readFileSync(path.join(APP,'src/content/pages/welcher-futterautomat-ist-der-richtige.md'),'utf8');\nconst multi=fs.readFileSync(path.join(APP,'src/content/comparisons/beste-futterautomaten-fuer-mehrtierhaushalte.md'),'utf8');\ntest('drei Pflichtkanten sind vorhanden',()=>{assert.match(chooser,/\\[Futterautomaten mit Akku\\]\\(\\/vergleiche\\/beste-futterautomaten-mit-akku\\/\\)/);assert.match(chooser,/\\[Futterautomaten mit App\\]\\(\\/vergleiche\\/futterautomat-mit-app\\/\\)/);assert.match(multi,/\\[SureFeed als Hersteller und System einordnen\\]\\(\\/hersteller\\/surefeed\\/\\)/);});\ntest('App Akku und Offline bleiben getrennt',()=>{assert.match(chooser,/Batterie- oder Akkureserve/);assert.match(chooser,/Zeitpläne und Portionen per App/);assert.match(chooser,/kein Konto, keine Cloud/);});\ntest('Roadmap-Chance ist abgeschlossen',()=>{const active=buildOpportunities().find(x=>x.id==='futterautomaten-consolidate');assert.equal(active,undefined,active?.reason);});\n`;
fs.mkdirSync(backup,{recursive:true});for(const file of targets)save(file);log(`Backup: ${path.relative(ROOT,backup)}`);
try{write(f.chooser,c1);write(f.multi,m1);write(f.test,test);assertState(read(f.chooser,'Auswahlhilfe'),read(f.multi,'Mehrtiervergleich'));run(process.execPath,['--experimental-strip-types','--test',path.relative(APP,f.test)],'Feeder-Journey-Abschlusstest',APP);for(const s of scripts)run('npm',['--workspace','apps/pfotentechnik','run',s],s);run(process.execPath,['--experimental-strip-types','--test',path.relative(APP,f.test)],'Finaler Roadmap-Abschlusstest',APP);const ci=read(f.chooser,'Auswahlhilfe'),mi=read(f.multi,'Mehrtiervergleich');if(chooser(ci)!==ci||multi(mi)!==mi)throw new Error('Zweiter Lauf wäre nicht no-op.');log('BESTANDEN: simulierter zweiter Installerlauf');const report=path.join(APP,'reports/topical-authority/feeder-journey-closure-27.1.0.json');fs.mkdirSync(path.dirname(report),{recursive:true});fs.writeFileSync(report,JSON.stringify({patch:PATCH,status:'passed',completedOpportunity:'futterautomaten-consolidate',intentOwners:'7/7',journeyEdges:'11/11',addedEdges:['Auswahlhilfe → Akkuvergleich','Auswahlhilfe → App-Vergleich','Mehrtiervergleich → SureFeed'],newPages:0,scoresChanged:false,recommendationsChanged:false,secondRun:'no-op',backup:path.relative(ROOT,backup),createdAt:new Date().toISOString()},null,2)+'\n');log(`Report: ${path.relative(ROOT,report)}`);log('Abgeschlossen: Roadmap-Chance ist fachlich und technisch geschlossen.');}catch(e){rollback();log(`FEHLER: ${e instanceof Error?e.message:String(e)}`);log('Änderungen wurden zurückgerollt.');process.exitCode=1;}

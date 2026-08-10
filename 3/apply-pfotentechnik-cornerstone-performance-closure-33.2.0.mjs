#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-cornerstone-performance-closure-33.2.0";
const log = (m) => console.log(`[${PATCH}] ${m}`);

function root(start=process.cwd()) {
  let cur=path.resolve(start);
  for(let i=0;i<16;i+=1){
    if(fs.existsSync(path.join(cur,"package.json"))&&fs.existsSync(path.join(cur,"apps","pfotentechnik","package.json"))) return cur;
    const p=path.dirname(cur); if(p===cur) break; cur=p;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}

const repo=root();
const app=path.join(repo,"apps","pfotentechnik");
const contentFile=path.join(app,"src","content","pages","smarte-futterautomaten.md");
const testFile=path.join(app,"test","cornerstone-performance-closure-33.2.0.test.mjs");
if(!fs.existsSync(contentFile)) throw new Error("smarte-futterautomaten.md fehlt.");

const read=(f)=>fs.readFileSync(f,"utf8").replace(/\r\n/g,"\n");
const originals=new Map([[contentFile,read(contentFile)],[testFile,fs.existsSync(testFile)?read(testFile):null]]);
const backup=path.join(repo,".patch-backups",`${PATCH}-${new Date().toISOString().replace(/[:.]/g,"-")}`);

for(const [file,content] of originals){
  if(content==null) continue;
  const dst=path.join(backup,path.relative(repo,file));
  fs.mkdirSync(path.dirname(dst),{recursive:true});
  fs.writeFileSync(dst,content,"utf8");
}
log(`Backup: ${path.relative(repo,backup)}`);

const write=(f,s)=>{fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,s.replace(/\r\n/g,"\n").trimEnd()+"\n","utf8");log(`Geändert: ${path.relative(repo,f)}`);};
const run=(cmd,args,label)=>{
  log(`Prüfe: ${label}`);
  const exe=process.platform==="win32"&&cmd==="npm"?"npm.cmd":cmd;
  const r=spawnSync(exe,args,{cwd:repo,stdio:"inherit",shell:false,env:process.env});
  if(r.error) throw r.error;
  if(r.status!==0) throw new Error(`${label} fehlgeschlagen (Exit ${r.status}).`);
  log(`BESTANDEN: ${label}`);
};

try{
  let content=read(contentFile);
  const block=`  - type: "products"
    eyebrow: "Modelle vergleichen"
    title: "Ausgewählte smarte Futterautomaten"
    text: "Die Auswahl zeigt unterschiedliche Bauarten und Einsatzgebiete. Prüfe die Detailseite für Futterart, Tiergröße, Portionierung, Stromversorgung und App-Funktionen."
    productFilter: "futterautomat"
    productLimit: 6
`;

  if(content.includes(block)) content=content.replace(block,"");
  else if(content.includes('title: "Ausgewählte smarte Futterautomaten"')) throw new Error("Premium-Produktblock weicht vom erwarteten main-Stand ab.");

  for(const key of [
    "petlibro-granary-wifi-feeder",
    "petlibro-granary-camera-feeder",
    "petkit-yumshare-dual-hopper",
    "petkit-fresh-element-solo",
    "xiaomi-smart-pet-food-feeder-2",
    "cat-mate-c500"
  ]) if(!content.includes(`  - "${key}"`)) throw new Error(`Vergleichsprodukt fehlt: ${key}`);

  if(!content.includes("comparisonRecommendation:")) throw new Error("comparisonRecommendation fehlt.");
  if(!content.includes("## Auswahlhilfe: Welcher Futterautomat passt zu dir?")) throw new Error("Auswahlhilfe fehlt.");
  write(contentFile,content);

  const test=`import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const content=fs.readFileSync(path.join(app,"src/content/pages/smarte-futterautomaten.md"),"utf8");

test("keine doppelte Premium-Produktliste",()=>{
  assert.doesNotMatch(content,/title:\\s*"Ausgewählte smarte Futterautomaten"/);
});
test("Sechs-Modell-Vergleich bleibt erhalten",()=>{
  for(const key of ["petlibro-granary-wifi-feeder","petlibro-granary-camera-feeder","petkit-yumshare-dual-hopper","petkit-fresh-element-solo","xiaomi-smart-pet-food-feeder-2","cat-mate-c500"]) assert.match(content,new RegExp(key));
  assert.match(content,/comparisonRecommendation:/);
});
test("Entscheidungscontent bleibt erhalten",()=>{
  assert.match(content,/type:\\s*"quickFacts"/);
  assert.match(content,/type:\\s*"scenarios"/);
  assert.match(content,/type:\\s*"decision"/);
  assert.match(content,/## Auswahlhilfe: Welcher Futterautomat passt zu dir\\?/);
});
`;
  write(testFile,test);

  run("node",["--check",testFile],"Syntaxprüfung Regressionstest");
  run("node",["--test",testFile],"Cornerstone-Dedup-Test");
  run("npm",["--workspace","apps/pfotentechnik","run","build"],"Astro-Build");
  run("npm",["--workspace","apps/pfotentechnik","run","audit:performance:strict"],"Performance-Budget");
  log("Abgeschlossen.");
}catch(error){
  for(const [file,content] of originals){
    if(content==null){if(fs.existsSync(file))fs.rmSync(file,{force:true});}
    else{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,content,"utf8");}
  }
  console.error(`[${PATCH}] FEHLER: ${error instanceof Error?error.message:String(error)}`);
  console.error(`[${PATCH}] Änderungen wurden zurückgerollt.`);
  process.exit(1);
}

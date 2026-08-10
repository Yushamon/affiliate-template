#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH="pfotentechnik-cornerstone-performance-closure-33.2.2";
const log=(m)=>console.log(`[${PATCH}] ${m}`);

function findRoot(start=process.cwd()){
  let cur=path.resolve(start);
  for(let i=0;i<16;i++){
    if(fs.existsSync(path.join(cur,"package.json"))&&fs.existsSync(path.join(cur,"apps","pfotentechnik","package.json"))) return cur;
    const p=path.dirname(cur); if(p===cur) break; cur=p;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}

const repo=findRoot();
const app=path.join(repo,"apps","pfotentechnik");
const file=path.join(app,"src","content","pages","smarte-futterautomaten.md");
const testFile=path.join(app,"test","cornerstone-performance-closure-33.2.2.test.mjs");
if(!fs.existsSync(file)) throw new Error("smarte-futterautomaten.md fehlt.");

const read=(f)=>fs.readFileSync(f,"utf8").replace(/\r\n/g,"\n");
const originals=new Map([[file,read(file)],[testFile,fs.existsSync(testFile)?read(testFile):null]]);
const backup=path.join(repo,".patch-backups",`${PATCH}-${new Date().toISOString().replace(/[:.]/g,"-")}`);

for(const [f,c] of originals){
  if(c==null) continue;
  const d=path.join(backup,path.relative(repo,f));
  fs.mkdirSync(path.dirname(d),{recursive:true});
  fs.writeFileSync(d,c,"utf8");
}
log(`Backup: ${path.relative(repo,backup)}`);

const run=(cmd,args,label)=>{
  log(`Prüfe: ${label}`);
  const exe=process.platform==="win32"&&cmd==="npm"?"npm.cmd":cmd;
  const r=spawnSync(exe,args,{cwd:repo,stdio:"inherit",shell:false,env:process.env});
  if(r.error) throw r.error;
  if(r.status!==0) throw new Error(`${label} fehlgeschlagen (Exit ${r.status}).`);
  log(`BESTANDEN: ${label}`);
};

const remove=(src,block,marker,label)=>{
  if(src.includes(block)){log(`Entferne: ${label}`);return src.replace(block,"");}
  if(!src.includes(marker)){log(`Bereits entfernt: ${label}`);return src;}
  throw new Error(`${label}: Ausgangsstruktur weicht ab.`);
};

try{
  let src=read(file);

  const answer=`  - type: "answer"
    eyebrow: "Kurzantwort"
    title: "Welcher smarte Futterautomat passt zu dir?"
    text: "Wähle zuerst nach Futterart und Tier: Für Trockenfutter ist ein Vorratsautomat mit lokal gespeichertem Zeitplan, zuverlässiger Portionierung und Batterie-Backup meist die beste Basis. Eine App erleichtert Planung und Kontrolle. Eine Kamera lohnt sich nur, wenn du den Futterplatz aus der Ferne sehen möchtest. Für Nassfutter brauchst du ein geschlossenes Fachsystem mit geeigneter Kühlung – keinen klassischen Trockenfutterspender."
    href: "#auswahlhilfe"
    cta: "Zur Auswahlhilfe"
`;

  const products=`  - type: "products"
    eyebrow: "Modelle vergleichen"
    title: "Ausgewählte smarte Futterautomaten"
    text: "Die Auswahl zeigt unterschiedliche Bauarten und Einsatzgebiete. Prüfe die Detailseite für Futterart, Tiergröße, Portionierung, Stromversorgung und App-Funktionen."
    productFilter: "futterautomat"
    productLimit: 6
`;

  const checks=`  - type: "checks"
    eyebrow: "Vor dem Kauf prüfen"
    title: "Die wichtigsten Qualitätsmerkmale"
    items:
      - "Passende Krokettengröße und ausreichend großer Futterkanal"
      - "Abnehmbarer, gut zugänglicher Napf und reinigbare Kontaktteile"
      - "Lokal gespeicherte Zeitpläne bei WLAN-Ausfall"
      - "Batterie-Backup oder andere sinnvolle Notstromlösung"
      - "Nachvollziehbare Portionseinstellung und Testmöglichkeit"
      - "Dichter Deckel und wirksamer Schutz vor selbstständigem Öffnen"
      - "App ohne zwingendes Abo für die Kernfunktionen"
      - "Passende Napfhöhe, Stabilität und Kapazität für das Tier"
`;

  src=remove(src,answer,'title: "Welcher smarte Futterautomat passt zu dir?"',"redundante Premium-Kurzantwort");
  src=remove(src,products,'title: "Ausgewählte smarte Futterautomaten"',"doppelte Produktkarten");
  src=remove(src,checks,'title: "Die wichtigsten Qualitätsmerkmale"',"doppelte Qualitätscheckliste");

  for(const signal of [
    "## Das Wichtigste in 30 Sekunden",
    "## Auswahlhilfe: Welcher Futterautomat passt zu dir?",
    "comparisonRecommendation:",
    "### 6. Reinigung",
    "### 7. Sicherheit",
    "### 8. App, Datenschutz und Folgekosten",
    "### 10. Ersatzteile und langfristige Nutzung",
    "## Portionen richtig kalibrieren",
    "## So richtest du einen Futterautomaten sicher ein"
  ]) if(!src.includes(signal)) throw new Error(`Redaktioneller Inhalt fehlt: ${signal}`);

  for(const key of [
    "petlibro-granary-wifi-feeder",
    "petlibro-granary-camera-feeder",
    "petkit-yumshare-dual-hopper",
    "petkit-fresh-element-solo",
    "xiaomi-smart-pet-food-feeder-2",
    "cat-mate-c500"
  ]) if(!src.includes(`  - "${key}"`)) throw new Error(`Vergleichsprodukt fehlt: ${key}`);

  fs.writeFileSync(file,src.trimEnd()+"\n","utf8");
  log(`Geändert: ${path.relative(repo,file)}`);

  const test=`import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const content=fs.readFileSync(path.join(app,"src/content/pages/smarte-futterautomaten.md"),"utf8");

test("redundante Premium-Blöcke entfernt",()=>{
  assert.doesNotMatch(content,/title:\\s*"Welcher smarte Futterautomat passt zu dir\\?"/);
  assert.doesNotMatch(content,/title:\\s*"Ausgewählte smarte Futterautomaten"/);
  assert.doesNotMatch(content,/title:\\s*"Die wichtigsten Qualitätsmerkmale"/);
});

test("redaktionelle Kurzantwort bleibt im Haupttext",()=>{
  assert.match(content,/## Das Wichtigste in 30 Sekunden/);
  assert.match(content,/Für viele Haushalte ist ein Trockenfutterautomat mit lokal gespeichertem Zeitplan und Batterie-Backup/);
  assert.match(content,/## Auswahlhilfe: Welcher Futterautomat passt zu dir\\?/);
});

test("wesentliche Premium-Entscheidungsblöcke bleiben",()=>{
  for(const type of ["quickFacts","scenarios","decision","mistakes"])
    assert.match(content,new RegExp('type: "'+type+'"'));
});

test("Vergleich und Qualitätsinhalt bleiben",()=>{
  assert.match(content,/comparisonRecommendation:/);
  assert.match(content,/### 6\\. Reinigung/);
  assert.match(content,/### 7\\. Sicherheit/);
  assert.match(content,/### 8\\. App, Datenschutz und Folgekosten/);
  assert.match(content,/### 10\\. Ersatzteile und langfristige Nutzung/);
  assert.match(content,/## Portionen richtig kalibrieren/);
});
`;
  fs.mkdirSync(path.dirname(testFile),{recursive:true});
  fs.writeFileSync(testFile,test,"utf8");
  log(`Geändert: ${path.relative(repo,testFile)}`);

  run("node",["--check",testFile],"Syntaxprüfung Regressionstest");
  run("node",["--test",testFile],"Cornerstone-Verdichtungs-Test");
  run("npm",["--workspace","apps/pfotentechnik","run","build"],"Astro-Build");
  run("npm",["--workspace","apps/pfotentechnik","run","audit:performance:strict"],"Performance-Budget");
  log("Abgeschlossen.");
}catch(error){
  for(const [f,c] of originals){
    if(c==null){if(fs.existsSync(f))fs.rmSync(f,{force:true});}
    else{fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,c,"utf8");}
  }
  console.error(`[${PATCH}] FEHLER: ${error instanceof Error?error.message:String(error)}`);
  console.error(`[${PATCH}] Änderungen wurden zurückgerollt.`);
  process.exit(1);
}

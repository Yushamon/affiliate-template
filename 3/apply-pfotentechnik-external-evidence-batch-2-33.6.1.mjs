#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH="pfotentechnik-external-evidence-batch-2-33.6.1";
const log=(m)=>console.log(`[${PATCH}] ${m}`);

function findRoot(start=process.cwd()){
  let cur=path.resolve(start);
  for(let i=0;i<16;i++){
    if(fs.existsSync(path.join(cur,"apps","pfotentechnik","package.json"))) return cur;
    const parent=path.dirname(cur);
    if(parent===cur) break;
    cur=parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}

const repo=findRoot();
const app=path.join(repo,"apps","pfotentechnik");
const productsDir=path.join(app,"src/content/products");
const files={
  yum:path.join(productsDir,"petkit-yumshare-dual-hopper.md"),
  catit:path.join(productsDir,"catit-pixi-vision-smart-feeder.md"),
  xiaomiFeeder:path.join(productsDir,"xiaomi-smart-pet-food-feeder-2.md"),
  xiaomiFountain:path.join(productsDir,"xiaomi-smart-pet-fountain-2.md"),
};
const testFile=path.join(app,"test","external-evidence-batch-2-33.6.1.test.mjs");
const read=(f)=>fs.readFileSync(f,"utf8").replace(/\r\n/g,"\n");

for(const f of Object.values(files)){
  if(!fs.existsSync(f)) throw new Error(`Erwartete Datei fehlt: ${path.relative(repo,f)}`);
}

const originals=new Map([...Object.values(files),testFile].map(f=>[f,fs.existsSync(f)?read(f):null]));
const backup=path.join(repo,".patch-backups",`${PATCH}-${new Date().toISOString().replace(/[:.]/g,"-")}`);
for(const [f,c] of originals){
  if(c==null) continue;
  const dst=path.join(backup,path.relative(repo,f));
  fs.mkdirSync(path.dirname(dst),{recursive:true});
  fs.writeFileSync(dst,c,"utf8");
}
log(`Backup: ${path.relative(repo,backup)}`);

function insertEvidence(src, block, label){
  if(/^externalEvidence:\s*$/m.test(src)){
    log(`Übersprungen: ${label} hat bereits externalEvidence.`);
    return src;
  }
  const anchor="\ndecision:\n";
  const count=src.split(anchor).length-1;
  if(count!==1) throw new Error(`${label}: decision-Anker ${count===0?"fehlt":`ist ${count}x vorhanden`}.`);
  log(`Befülle: ${label}`);
  return src.replace(anchor,`\n${block}\ndecision:\n`);
}

function updateDate(src,label){
  if(/^updatedAt:\s*"2026-08-10"\s*$/m.test(src)) return src;
  if(!/^updatedAt:\s*["']?[^"'\n]+["']?\s*$/m.test(src)) throw new Error(`${label}: updatedAt fehlt.`);
  return src.replace(/^updatedAt:\s*["']?[^"'\n]+["']?\s*$/m,'updatedAt: "2026-08-10"');
}

function run(cmd,args,label){
  log(`Prüfe: ${label}`);
  const exe=process.platform==="win32"&&cmd==="npm"?"npm.cmd":cmd;
  const r=spawnSync(exe,args,{cwd:repo,stdio:"inherit",shell:false,env:process.env});
  if(r.error) throw r.error;
  if(r.status!==0) throw new Error(`${label} fehlgeschlagen (Exit ${r.status}).`);
  log(`BESTANDEN: ${label}`);
}

try{
  let s=read(files.yum);
  s=updateDate(s,"YumShare Dual-Hopper 2");
  s=insertEvidence(s,`externalEvidence:
  professionalReviews:
    - publisher: "Pet Product Compass"
      title: "PETKIT YumShare Dual-hopper 2 Review: Fit, Tradeoffs, and Evidence"
      url: "https://petproductcompass.com/reviews/petkit-yumshare-dual-hopper-2/"
      publishedAt: "2026-07-17"
      checkedAt: "2026-08-10"
      methodology: "editorial-review"
      positives:
        - "Die zwei getrennten Vorratskammern werden als klarer funktionaler Mehrwert eingeordnet."
        - "Dual-Band-WLAN, Kamera und individuelle Mahlzeitenprotokolle sind für Mehrkatzenhaushalte praktisch."
      negatives:
        - "Die Quelle weist ausdrücklich darauf hin, dass keine physische Zugangskontrolle je Katze vorhanden ist."
        - "Zuverlässigkeit, Portionierungsgenauigkeit, App-Qualität und Langzeit-Haltbarkeit wurden dort nicht praktisch getestet."
      findings:
        - "Die Review ist eine Quellenanalyse und kein Hands-on-Test; diese Grenze wird transparent dokumentiert."
  userReviews:
    - platform: "Chewy"
      url: "https://www.chewy.com/petkit-yumshare-dual-hopper-2/product-reviews/3842854"
      checkedAt: "2026-08-10"
      rating: 5
      scale: 5
      reviewCount: 2
      recurringPositives:
        - "Beide sichtbaren Bewertungen sind positiv."
        - "App, Kamera und einfache Einrichtung werden positiv erwähnt."
      recurringCriticism: []
  consensus:
    strengths:
      - finding: "Zwei Futterkammern plus Kamera sind der klarste belegte Nutzen."
        sourceCount: 2
        confidence: "medium"
    weaknesses:
      - finding: "Die derzeitige Nutzerstichprobe ist zu klein für belastbare Aussagen zu Langzeit-Zuverlässigkeit."
        sourceCount: 2
        confidence: "high"
        assessment: "Chewy weist nur zwei Bewertungen aus; die redaktionelle Quelle hat selbst keinen Hands-on-Test durchgeführt."
    editorialAssessment: >-
      Die externe Evidenz bestätigt vor allem das Produktkonzept, nicht die Langzeitqualität. Die sehr kleine
      Nutzerstichprobe wird deshalb nicht als breiter Nutzerkonsens dargestellt.
  note: >-
    Chewy weist zum Abrufdatum nur zwei Bewertungen aus. Die 5,0/5 werden deshalb nicht als belastbare
    produktspezifische Durchschnittserfahrung interpretiert.`,
  "PETKIT YumShare Dual-Hopper 2");
  fs.writeFileSync(files.yum,s.trimEnd()+"\n","utf8");

  s=read(files.catit);
  s=updateDate(s,"Catit PIXI Vision");
  s=insertEvidence(s,`externalEvidence:
  professionalReviews: []
  userReviews:
    - platform: "Chewy"
      url: "https://www.chewy.com/catit-pixi-vision-smart-cat-feeder/product-reviews/2085086"
      checkedAt: "2026-08-10"
      rating: 4.1
      scale: 5
      reviewCount: 8
      recurringPositives:
        - "Portionskontrolle und Kamera werden in mehreren positiven Rezensionen hervorgehoben."
        - "Nach erfolgreicher Einrichtung funktioniert die automatische Fütterung laut mehreren Nutzern gut."
      recurringCriticism:
        - "Mehrere Rezensionen nennen Schwierigkeiten bei WLAN-, App- oder Smartphone-Einrichtung."
        - "Einzelne Nutzer kritisieren die starke Abhängigkeit vom Smartphone."
    - platform: "Apple App Store · Catit App gesamt"
      url: "https://apps.apple.com/us/app/catit/id1549148066"
      checkedAt: "2026-08-10"
      rating: 2.1
      scale: 5
      reviewCount: 88
      recurringPositives:
        - "Einzelne Bewertungen bestätigen, dass Zeitpläne grundsätzlich funktionieren."
      recurringCriticism:
        - "Die App-Bewertung ist insgesamt schwach und enthält Kritik an Flexibilität und Bedienung."
  consensus:
    strengths:
      - finding: "Kamera und Portionssteuerung werden von den produktspezifischen Nutzern überwiegend positiv beschrieben."
        sourceCount: 1
        confidence: "medium"
    weaknesses:
      - finding: "Einrichtung und App sind der am klarsten erkennbare Reibungspunkt."
        sourceCount: 2
        confidence: "medium"
        assessment: "Chewy enthält produktspezifische Kritik; der App-Store-Wert betrifft die Catit-App insgesamt und nicht nur den PIXI Vision."
    editorialAssessment: >-
      Für den PIXI Vision fehlt weiterhin ein belastbarer unabhängiger Hands-on-Test. Die Nutzerbasis ist klein,
      zeigt aber einen plausiblen Kontrast zwischen guter Hardwarefunktion und teils schwieriger App-Einrichtung.
  note: >-
    Die App-Store-Bewertung gilt für die Catit-App insgesamt. Sie ist kein produktspezifischer Score des PIXI Vision.`,
  "Catit PIXI Vision Smart Feeder");
  fs.writeFileSync(files.catit,s.trimEnd()+"\n","utf8");

  s=read(files.xiaomiFeeder);
  s=updateDate(s,"Xiaomi Smart Pet Food Feeder 2");
  s=insertEvidence(s,`externalEvidence:
  professionalReviews: []
  userReviews:
    - platform: "Yandex Reviews"
      url: "https://reviews.yandex.ru/product/umnaia-kormushka-dlia-zhivotnykh-xiaomi-smart-pet-food-feeder-2-mjwsq02--5124113032"
      checkedAt: "2026-08-10"
      rating: 4.6
      scale: 5
      reviewCount: 148
      recurringPositives:
        - "Wiegenapf, Automatisierung und große Kapazität werden wiederholt positiv genannt."
        - "Mehrere Nutzer beschreiben den Alltag mit festen Fütterungszeiten als deutlich bequemer."
      recurringCriticism:
        - "Einzelne Rezensionen berichten von Kalibrierungs- oder Anzeigeabweichungen am Wiegenapf."
        - "Einzelne Nutzer nennen Verbindungs- oder Regionsprobleme bei der Einrichtung."
        - "Es gibt vereinzelte Fehlerberichte, die jedoch keinen Serienfehler belegen."
  consensus:
    strengths:
      - finding: "Automatisierung und Gewichtserfassung sind die am häufigsten positiv beschriebenen Funktionen."
        sourceCount: 1
        confidence: "medium"
    weaknesses:
      - finding: "Kalibrierung und regionale App-/Verbindungsfragen bleiben ein realistischer Reibungspunkt."
        sourceCount: 1
        confidence: "low"
    editorialAssessment: >-
      Die Nutzerbasis ist deutlich größer als bei mehreren neuen Smart-Feedern, stammt aber aus nur einer
      Bewertungsplattform. Deshalb wird daraus kein quellenübergreifender Hoch-Konfidenz-Konsens abgeleitet.
  note: >-
    Yandex weist zum Abrufdatum 251 Bewertungen und 148 schriftliche Rezensionen aus. Im Feld reviewCount wird
    die Zahl der schriftlichen Rezensionen dokumentiert; ein unabhängiger professioneller Hands-on-Test wurde
    für diesen Batch nicht als belastbar genug gefunden.`,
  "Xiaomi Smart Pet Food Feeder 2");
  fs.writeFileSync(files.xiaomiFeeder,s.trimEnd()+"\n","utf8");

  s=read(files.xiaomiFountain);
  s=updateDate(s,"Xiaomi Smart Pet Fountain 2");
  s=insertEvidence(s,`externalEvidence:
  professionalReviews:
    - publisher: "TecMundo"
      title: "Xiaomi Smart Pet Fountain 2 não bate a clássica tigelinha [Review]"
      url: "https://www.tecmundo.com.br/produto/408089-xiaomi-smart-pet-fountain-2-nao-bate-a-classica-tigelinha-review.htm"
      publishedAt: "2025-10-27"
      checkedAt: "2026-08-10"
      methodology: "hands-on"
      positives:
        - "Der Brunnen wurde zwei Wochen praktisch getestet."
        - "Kabellose Nutzung und die drei Betriebsmodi wurden als klare Vorteile beschrieben."
        - "Der Näherungssensor wurde als sinnvollster der drei Modi hervorgehoben."
      negatives:
        - "Der Test stellt den Preis beziehungsweise die laufenden Kosten als wesentlichen Nachteil heraus."
  userReviews:
    - platform: "Galaxus · gekaufte Produktbewertungen"
      url: "https://www.galaxus.de/de/productrating/einer-der-besten-trinkbrunnen-8770031"
      checkedAt: "2026-08-10"
      recurringPositives:
        - "Leise Arbeitsweise, einfache Reinigung und kabellose Nutzung werden positiv hervorgehoben."
        - "Der verbesserte Aufbau gegenüber dem Vorgänger wird in einer weiteren gekauften Bewertung positiv beschrieben."
      recurringCriticism:
        - "Filterkosten werden als Nachteil genannt."
        - "Eine weitere Langzeitbewertung berichtet nach etwa sechs Monaten über Undichtigkeit und Hygieneprobleme."
    - platform: "Galaxus · Langzeitbewertung"
      url: "https://www.galaxus.de/de/productrating/guter-brunnen-und-besseres-design-als-die-version-1-8973075"
      checkedAt: "2026-08-10"
      recurringPositives:
        - "Befüllung, Akkubetrieb und Bedienung wurden gegenüber dem Vorgänger als verbessert beschrieben."
      recurringCriticism:
        - "Der konkrete Nutzer berichtet nach rund sechs Monaten über leichte Undichtigkeit."
        - "Trotz Wasser- und Filterwechsel wurden grünliche Ablagerungen beschrieben."
  consensus:
    strengths:
      - finding: "Kabellose Platzierung und flexible Wasserausgabemodi sind gut belegte Vorteile."
        sourceCount: 3
        confidence: "high"
      - finding: "Reinigung und Handhabung werden überwiegend positiv beschrieben."
        sourceCount: 2
        confidence: "medium"
    weaknesses:
      - finding: "Filterkosten sind ein wiederkehrender Nachteil."
        sourceCount: 2
        confidence: "medium"
      - finding: "Es existiert ein konkreter Langzeitbericht über Undichtigkeit und Hygieneprobleme, aber kein Beleg für einen generellen Serienfehler."
        sourceCount: 1
        confidence: "low"
    editorialAssessment: >-
      Der zweiwöchige Hands-on-Test bestätigt die zentralen Komfortvorteile. Der negative sechsmonatige
      Nutzerbericht ist als Gegenbeleg relevant, reicht allein aber nicht für eine allgemeine Haltbarkeitsaussage.
  note: >-
    Die Galaxus-Einträge sind einzelne gekaufte Produktbewertungen und kein repräsentativer Plattformdurchschnitt.`,
  "Xiaomi Smart Pet Fountain 2");
  fs.writeFileSync(files.xiaomiFountain,s.trimEnd()+"\n","utf8");

  const test=`import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const r=(p)=>fs.readFileSync(path.join(app,p),"utf8");

const targets=[
  "src/content/products/petkit-yumshare-dual-hopper.md",
  "src/content/products/catit-pixi-vision-smart-feeder.md",
  "src/content/products/xiaomi-smart-pet-food-feeder-2.md",
  "src/content/products/xiaomi-smart-pet-fountain-2.md"
];

test("Batch 2 befüllt vier Produkte",()=>{
  for(const p of targets) assert.match(r(p),/^externalEvidence:\\s*$/m);
});

test("schwache Evidenz wird nicht hochgestuft",()=>{
  assert.match(r(targets[0]),/Nutzerstichprobe ist zu klein/);
  assert.match(r(targets[1]),/fehlt weiterhin ein belastbarer unabhängiger Hands-on-Test/);
  assert.match(r(targets[2]),/nur einer\\s+Bewertungsplattform/);
  assert.match(r(targets[3]),/kein Beleg für einen generellen Serienfehler/);
});

test("plattformweite und nicht produktspezifische Werte sind markiert",()=>{
  assert.match(r(targets[1]),/Catit-App insgesamt/);
});

test("redaktionelle PfotenTechnik-Ratings bleiben unverändert",()=>{
  assert.match(r(targets[0]),/^rating: 4\\.8$/m);
  assert.match(r(targets[1]),/^rating: 4\\.5$/m);
  assert.match(r(targets[2]),/^rating: 4\\.6$/m);
  assert.match(r(targets[3]),/^rating: 4\\.7$/m);
});

test("Hands-on wird nur dort behauptet wo belegt",()=>{
  assert.doesNotMatch(r(targets[0]),/methodology: "hands-on"/);
  assert.doesNotMatch(r(targets[1]),/methodology: "hands-on"/);
  assert.doesNotMatch(r(targets[2]),/methodology: "hands-on"/);
  assert.match(r(targets[3]),/methodology: "hands-on"/);
});
`;
  fs.mkdirSync(path.dirname(testFile),{recursive:true});
  fs.writeFileSync(testFile,test,"utf8");
  log(`Geschrieben: ${path.relative(repo,testFile)}`);

  run("node",["--check",testFile],"Syntaxprüfung Regressionstest");
  run("node",["--test",testFile],"Evidence-Batch-2 Regressionstest");
  run("npm",["--workspace","apps/pfotentechnik","run","build"],"Astro-Build");
  run("npm",["--workspace","apps/pfotentechnik","run","audit:product-evidence"],"Evidence-Audit");
  run("npm",["--workspace","apps/pfotentechnik","run","audit:products:strict"],"Produktdaten-Audit");
  run("npm",["--workspace","apps/pfotentechnik","run","audit:content-quality:strict"],"Content-Quality");

  log("Abgeschlossen. Vier weitere Produkte besitzen externe Evidenz; schwache Quellenlagen bleiben ausdrücklich niedrig gewichtet.");
}catch(error){
  for(const [f,c] of originals){
    if(c==null){
      if(fs.existsSync(f)) fs.rmSync(f,{force:true});
    }else{
      fs.mkdirSync(path.dirname(f),{recursive:true});
      fs.writeFileSync(f,c,"utf8");
    }
  }
  console.error(`[${PATCH}] FEHLER: ${error instanceof Error?error.message:String(error)}`);
  console.error(`[${PATCH}] Änderungen wurden zurückgerollt.`);
  process.exit(1);
}

#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH="pfotentechnik-external-evidence-batch-1-33.6.0";
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
  pawsync:path.join(productsDir,"pawsync-smart-pet-feeder.md"),
  petlibro:path.join(productsDir,"petlibro-granary-camera-feeder.md"),
  tractive:path.join(productsDir,"tractive-dog-6.md"),
  weenect:path.join(productsDir,"weenect-xs.md"),
};
const testFile=path.join(app,"test","external-evidence-batch-1-33.6.0.test.mjs");
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
  const n=src.split(anchor).length-1;
  if(n!==1) throw new Error(`${label}: decision-Anker ${n===0?"fehlt":`ist ${n}x vorhanden`}.`);
  log(`Befülle: ${label}`);
  return src.replace(anchor,`\n${block}\ndecision:\n`);
}

function replaceUpdatedAt(src, date, label){
  if(new RegExp(`^updatedAt:\\s*["']?${date}["']?\\s*$`,"m").test(src)) return src;
  if(!/^updatedAt:\s*["']?[^"'\n]+["']?\s*$/m.test(src)) throw new Error(`${label}: updatedAt fehlt.`);
  return src.replace(/^updatedAt:\s*["']?[^"'\n]+["']?\s*$/m,`updatedAt: "${date}"`);
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
  let s=read(files.pawsync);
  s=replaceUpdatedAt(s,"2026-08-10","PawSync");
  s=insertEvidence(s,`externalEvidence:
  professionalReviews:
    - publisher: "Reviewed"
      title: "PawSync Smart Pet Feeder Review"
      url: "https://www.reviewed.com/pets/content/pawsync-smart-pet-feeder-review"
      publishedAt: "2024-10-17"
      checkedAt: "2026-08-10"
      methodology: "hands-on"
      positives:
        - "Im zweiwöchigen Praxistest wurden Mahlzeiten pünktlich und in der gewählten Menge ausgegeben."
        - "Im Test traten keine Futterblockaden auf."
        - "Einrichtung und App wurden als unkompliziert beschrieben."
      negatives:
        - "Der Vorratsbehälter ist kleiner als bei mehreren teureren Vergleichsmodellen."
        - "Die verfügbaren Portionsschritte können für sehr kleine Einzelmahlzeiten zu grob sein."
      findings:
        - "Reviewed kontrollierte die ausgegebene Futtermenge zusätzlich mit einer Küchenwaage."
  userReviews:
    - platform: "Chewy"
      url: "https://www.chewy.com/pawsync-36-liter-stainless-steel-bowl/product-reviews/1453158"
      checkedAt: "2026-08-10"
      rating: 4.5
      scale: 5
      reviewCount: 139
      recurringPositives:
        - "Fütterungsplan und Portionierung werden überwiegend positiv bewertet."
        - "Die integrierte Waage und die einfache Einrichtung werden wiederholt gelobt."
        - "Mehrere Nutzer berichten von zuverlässigem Betrieb im Alltag."
      recurringCriticism:
        - "Einzelne Nutzer empfinden die kleinste Portion für kleine oder häufige Mahlzeiten als zu groß."
        - "In einzelnen Rezensionen werden Support und Ersatzteilversorgung kritisiert."
  consensus:
    strengths:
      - finding: "Zeitgesteuerte Fütterung und Gewichtskontrolle funktionieren in den ausgewerteten Quellen insgesamt zuverlässig."
        sourceCount: 2
        confidence: "high"
        assessment: "Der unabhängige Praxistest und die größere Chewy-Bewertungsbasis zeigen in dieselbe Richtung."
      - finding: "Einrichtung und App gelten überwiegend als unkompliziert."
        sourceCount: 2
        confidence: "medium"
    weaknesses:
      - finding: "Die kleinste verfügbare Portionsstufe kann für sehr kleine, häufige Mahlzeiten zu grob sein."
        sourceCount: 2
        confidence: "medium"
    editorialAssessment: >-
      Die externe Evidenz stärkt vor allem die Aussagen zu zuverlässiger Zeitsteuerung und Gewichtskontrolle.
      Die Nutzerbewertungen werden getrennt vom redaktionellen PfotenTechnik-Score dargestellt.
  note: >-
    Externe Bewertungen werden als Quellenbeleg verwendet und nicht mit der redaktionellen PfotenTechnik-Note verrechnet.`,
    "PawSync Smart Pet Feeder");
  fs.writeFileSync(files.pawsync,s.trimEnd()+"\n","utf8");

  s=read(files.petlibro);
  s=replaceUpdatedAt(s,"2026-08-10","PETLIBRO Granary Camera");
  s=insertEvidence(s,`externalEvidence:
  professionalReviews:
    - publisher: "Tom's Guide"
      title: "My cats tested this smart pet feeder for a month"
      url: "https://www.tomsguide.com/home/my-cats-tested-this-smart-pet-feeder-for-a-month-and-now-i-cant-stop-watching-them"
      checkedAt: "2026-08-10"
      methodology: "hands-on"
      positives:
        - "Der Feeder wurde einen Monat mit zwei Katzen genutzt."
        - "Kamera, Futterplanung und Fernkontrolle wurden als praktisch und zuverlässig beschrieben."
        - "Lokale Videospeicherung per microSD ergänzt die Cloudoption."
      negatives:
        - "Das Batterie-Backup verwendet nicht wiederaufladbare D-Batterien."
      findings:
        - "Der Test hebt den Nutzen der Kamera besonders in einem Mehrkatzenhaushalt mit unterschiedlichen Futterbedürfnissen hervor."
    - publisher: "Cats.com"
      title: "Petlibro Granary Automatic Pet Feeder with Camera Review"
      url: "https://cats.com/petlibro-granary-automatic-feeder-with-camera-review"
      checkedAt: "2026-08-10"
      methodology: "hands-on"
      positives:
        - "Flexible Mahlzeitenplanung und App-Steuerung wurden positiv bewertet."
        - "Kamera, Zwei-Wege-Audio und Napfüberwachung funktionierten im Test überzeugend."
        - "Der Feeder wurde insgesamt als leistungsstark eingeordnet."
      negatives:
        - "Der Preis liegt über vielen einfachen Futterautomaten."
  userReviews:
    - platform: "Best Buy"
      url: "https://www.bestbuy.com/site/reviews/petlibro-granary-wifi-stainless-steel-5l-automatic-dog-and-cat-feeder-with-camera-monitoring-black/11300635"
      checkedAt: "2026-08-10"
      rating: 4.4
      scale: 5
      reviewCount: 49
      recurringPositives:
        - "Kameraüberwachung wird besonders häufig positiv genannt."
        - "Fütterungsplan und App-Funktionen werden überwiegend positiv bewertet."
      recurringCriticism:
        - "Einzelne Nutzer berichten von Problemen bei der Futterausgabe."
    - platform: "Chewy"
      url: "https://www.chewy.com/petlibro-granary-automatic-camera-cat/product-reviews/1042774"
      checkedAt: "2026-08-10"
      rating: 4.5
      scale: 5
      reviewCount: 11
      recurringPositives:
        - "Die Gesamtbewertung ist positiv, die Stichprobe aber klein."
      recurringCriticism:
        - "Einzelne Rezensionen berichten über zeitweise Probleme mit der Videofunktion oder viele Bewegungsbenachrichtigungen."
  consensus:
    strengths:
      - finding: "Kamera und App sind der am klarsten bestätigte Mehrwert des Granary Camera Feeders."
        sourceCount: 4
        confidence: "high"
        assessment: "Zwei Hands-on-Reviews und zwei Händler-Bewertungsquellen stützen diesen Punkt."
      - finding: "Zeitpläne und Fernkontrolle funktionieren in den unabhängigen Tests überzeugend."
        sourceCount: 2
        confidence: "high"
    weaknesses:
      - finding: "Bei Kamera- und Futterausgabe gibt es vereinzelte Nutzerberichte über technische Unzuverlässigkeit."
        sourceCount: 2
        confidence: "medium"
        assessment: "Die Kritik stammt aus Nutzerquellen und ist nicht als genereller Serienfehler belegt."
    editorialAssessment: >-
      Die unabhängigen Tests bestätigen den Nutzen von Kamera, App und Zeitsteuerung. Nutzerkritik zu einzelnen
      Kamera- oder Ausgabefehlern bleibt ein Beobachtungspunkt, aber kein Beleg für einen generellen Defekt.
  note: >-
    Händlerbewertungen sind Momentaufnahmen zum Abrufdatum. Die beiden Händler-Scores werden nicht gemittelt und
    nicht in den redaktionellen PfotenTechnik-Score eingerechnet.`,
    "PETLIBRO Granary Camera Feeder");
  fs.writeFileSync(files.petlibro,s.trimEnd()+"\n","utf8");

  s=read(files.tractive);
  s=replaceUpdatedAt(s,"2026-08-10","Tractive DOG 6");
  s=insertEvidence(s,`externalEvidence:
  professionalReviews:
    - publisher: "heise bestenlisten"
      title: "Tractive Dog 6 im Test"
      url: "https://www.heise.de/bestenlisten/testbericht/gps-tracker-tractive-dog-6-im-test/yzmc5t8"
      publishedAt: "2025-06-13"
      checkedAt: "2026-08-10"
      methodology: "hands-on"
      positives:
        - "Präzise Ortung und einfache, funktionsreiche App."
        - "Im Test waren nach knapp fünf Tagen mit kurzen Live-Sequenzen noch 46 Prozent Akkuladung vorhanden."
        - "IP68 und verbesserte Akkulaufzeit wurden positiv bewertet."
      negatives:
        - "Abo-Pflicht."
        - "Gelegentliche Standortungenauigkeiten."
        - "Hohe Gesamtkosten über längere Nutzung."
    - publisher: "CHIP"
      title: "Tractive DOG 6 Hundetracker im Test"
      url: "https://www.chip.de/test/Tractive-Dog-6-Hundetracker-im-Test_186573405.html"
      publishedAt: "2026-02-11"
      checkedAt: "2026-08-10"
      methodology: "lab-test"
      positives:
        - "CHIP bewertet Tracking, Genauigkeit, Ausstattung und App sehr stark."
        - "Der Tracker erreichte im Testurteil die Note 1,2."
      negatives:
        - "Der Akku wurde schwächer bewertet als Tracking und Ausstattung."
        - "Premium-Abo und laufende Nutzungskosten bleiben Nachteile."
    - publisher: "TreeLine Review"
      title: "Tractive Dog 6 GPS Tracker Review"
      url: "https://www.treelinereview.com/gearreviews/tractive-dog-6-gps-tracker-review"
      publishedAt: "2026-07-11"
      checkedAt: "2026-08-10"
      methodology: "hands-on"
      positives:
        - "Schnelle Verbindung, schnelles Live-Tracking und eine gut bedienbare App."
        - "Im konkreten Test hielt der Akku bei der dortigen Nutzung bis zu 25 Tage."
      negatives:
        - "Die tatsächliche Laufzeit hängt stark von Aktivität, WLAN-Nähe und Live-Nutzung ab."
  userReviews:
    - platform: "Trustpilot · Tractive gesamt"
      url: "https://www.trustpilot.com/review/tractive.com"
      checkedAt: "2026-08-10"
      rating: 4.7
      scale: 5
      reviewCount: 58630
      recurringPositives:
        - "Ortung, App und das Sicherheitsgefühl werden häufig positiv beschrieben."
        - "Viele Bewertungen loben Live-Tracking und Gesundheitsfunktionen."
      recurringCriticism:
        - "Ein Teil der Bewertungen kritisiert GPS-Abweichungen oder verzögerte Meldungen."
        - "Es gibt einzelne Beschwerden über Akkuprobleme und Support."
  consensus:
    strengths:
      - finding: "Ortungsgenauigkeit, Live-Tracking und App gehören zu den am stärksten bestätigten Qualitäten des DOG 6."
        sourceCount: 4
        confidence: "high"
      - finding: "Die reale Akkulaufzeit kann bei moderater Nutzung deutlich besser ausfallen als bei intensiver Live-Ortung."
        sourceCount: 3
        confidence: "high"
    weaknesses:
      - finding: "Das Pflichtabo und die laufenden Kosten sind ein konsistenter Nachteil."
        sourceCount: 3
        confidence: "high"
      - finding: "GPS-Genauigkeit und Akkulaufzeit bleiben abhängig von Empfang, Aktivität und Nutzungsprofil."
        sourceCount: 3
        confidence: "high"
    editorialAssessment: >-
      Drei unabhängige Tests stützen die sehr gute Einordnung von Ortung und Bedienung. Der Trustpilot-Wert ist
      markenweit und nicht DOG-6-spezifisch; er dient nur als breites Nutzersignal.
  note: >-
    Die Trustpilot-Bewertung umfasst Tractive als Marke und verschiedene Tracker-Generationen. Sie wird deshalb
    nicht als produktspezifische Bewertung des DOG 6 behandelt.`,
    "Tractive DOG 6");
  fs.writeFileSync(files.tractive,s.trimEnd()+"\n","utf8");

  s=read(files.weenect);
  s=replaceUpdatedAt(s,"2026-08-10","Weenect XS");
  s=insertEvidence(s,`externalEvidence:
  professionalReviews:
    - publisher: "heise bestenlisten"
      title: "Weenect XS (2024) im Test"
      url: "https://www.heise.de/bestenlisten/testbericht/weenect-xs-2024-im-test/yvp0n9f"
      publishedAt: "2025-01-29"
      checkedAt: "2026-08-10"
      methodology: "hands-on"
      positives:
        - "Deutlich verbesserte Ortungsgenauigkeit in Stadt und Land."
        - "Kompaktes, leichtes und wasserdichtes Gehäuse."
        - "Im Alltagstest wurden gut sieben Tage Akkulaufzeit erreicht."
      negatives:
        - "Monatliche Gebühren für die Mobilfunk-SIM."
        - "Echtzeit-Tracking erhöht den Akkuverbrauch deutlich."
  userReviews:
    - platform: "Trustpilot · Weenect gesamt"
      url: "https://de.trustpilot.com/review/weenect.com"
      checkedAt: "2026-08-10"
      rating: 4.6
      scale: 5
      reviewCount: 22470
      recurringPositives:
        - "App, Ortung und Kundenservice werden häufig positiv bewertet."
        - "Viele Nutzer beschreiben das Tracking als hilfreich und einfach bedienbar."
      recurringCriticism:
        - "Einzelne Nutzer berichten über Verbindungsabbrüche oder kurze Akkulaufzeit bei schwierigen Empfangsbedingungen."
        - "Es gibt vereinzelte Kritik an Software und Supportabläufen."
  consensus:
    strengths:
      - finding: "Geringes Gewicht und praxistaugliche Ortung sind die am stärksten bestätigten Vorteile."
        sourceCount: 2
        confidence: "high"
      - finding: "Die App wird insgesamt als gut nutzbar beschrieben."
        sourceCount: 2
        confidence: "medium"
    weaknesses:
      - finding: "Abo-Kosten und höherer Akkuverbrauch bei intensiver Ortung bleiben die klarsten Gegenargumente."
        sourceCount: 2
        confidence: "high"
    editorialAssessment: >-
      Der unabhängige Praxistest bestätigt die starke Ortungsleistung und die alltagstaugliche Laufzeit. Die
      Trustpilot-Bewertung ist markenweit und wird nur ergänzend als Nutzersignal verwendet.
  note: >-
    Der Trustpilot-Score bezieht sich auf Weenect insgesamt und nicht ausschließlich auf das XS-Modell.`,
    "Weenect XS");
  fs.writeFileSync(files.weenect,s.trimEnd()+"\n","utf8");

  const test=`import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=(p)=>fs.readFileSync(path.join(app,p),"utf8");

const files=[
  "src/content/products/pawsync-smart-pet-feeder.md",
  "src/content/products/petlibro-granary-camera-feeder.md",
  "src/content/products/tractive-dog-6.md",
  "src/content/products/weenect-xs.md"
];

test("Batch 1 enthält strukturierte externe Evidenz",()=>{
  for(const p of files){
    const s=read(p);
    assert.match(s,/^externalEvidence:\\s*$/m);
    assert.match(s,/^\\s+professionalReviews:\\s*$/m);
    assert.match(s,/^\\s+userReviews:\\s*$/m);
    assert.match(s,/^\\s+consensus:\\s*$/m);
  }
});

test("keine fremden Ratings werden als PfotenTechnik-Score umgeschrieben",()=>{
  const paw=read(files[0]);
  const pet=read(files[1]);
  const tra=read(files[2]);
  const wee=read(files[3]);
  assert.match(paw,/rating: 4\\.6/);
  assert.match(pet,/rating: 4\\.6/);
  assert.match(tra,/rating: 4\\.6/);
  assert.match(wee,/rating: 4\\.6/);
  assert.match(paw,/reviewCount: 139/);
  assert.match(pet,/reviewCount: 49/);
  assert.match(tra,/reviewCount: 58630/);
  assert.match(wee,/reviewCount: 22470/);
});

test("markenweite Trustpilot-Daten sind ausdrücklich gekennzeichnet",()=>{
  assert.match(read(files[2]),/markenweit und nicht DOG-6-spezifisch/);
  assert.match(read(files[3]),/Weenect insgesamt und nicht ausschließlich auf das XS-Modell/);
});

test("professionelle Quellen sind direkt verlinkt",()=>{
  assert.match(read(files[0]),/reviewed\\.com\\/pets\\/content\\/pawsync-smart-pet-feeder-review/);
  assert.match(read(files[1]),/tomsguide\\.com\\/home\\/my-cats-tested-this-smart-pet-feeder/);
  assert.match(read(files[2]),/chip\\.de\\/test\\/Tractive-Dog-6-Hundetracker-im-Test/);
  assert.match(read(files[3]),/heise\\.de\\/bestenlisten\\/testbericht\\/weenect-xs-2024-im-test/);
});
`;
  fs.mkdirSync(path.dirname(testFile),{recursive:true});
  fs.writeFileSync(testFile,test,"utf8");
  log(`Geschrieben: ${path.relative(repo,testFile)}`);

  run("node",["--check",testFile],"Syntaxprüfung Regressionstest");
  run("node",["--test",testFile],"Evidence-Batch Regressionstest");
  run("npm",["--workspace","apps/pfotentechnik","run","build"],"Astro-Build");
  run("npm",["--workspace","apps/pfotentechnik","run","audit:product-evidence"],"Evidence-Audit");
  run("npm",["--workspace","apps/pfotentechnik","run","audit:products:strict"],"Produktdaten-Audit");
  run("npm",["--workspace","apps/pfotentechnik","run","audit:content-quality:strict"],"Content-Quality");

  log("Abgeschlossen. Vier Produkte besitzen jetzt echte externe Evidenzquellen; redaktionelle Scores blieben unverändert.");
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

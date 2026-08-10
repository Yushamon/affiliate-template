#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH="pfotentechnik-product-opportunity-push-33.4.1";
const log=(m)=>console.log(`[${PATCH}] ${m}`);

function findRoot(start=process.cwd()){
  let cur=path.resolve(start);
  for(let i=0;i<16;i++){
    if(fs.existsSync(path.join(cur,"package.json")) &&
       fs.existsSync(path.join(cur,"apps","pfotentechnik","package.json"))) return cur;
    const parent=path.dirname(cur);
    if(parent===cur) break;
    cur=parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}

const repo=findRoot();
const app=path.join(repo,"apps","pfotentechnik");
const files={
  yum:path.join(app,"src/content/products/petkit-yumshare-solo-2.md"),
  ultra:path.join(app,"src/content/products/petkit-eversweet-ultra.md"),
  polar:path.join(app,"src/content/products/petlibro-polar-wet-food-feeder.md"),
};
const testFile=path.join(app,"test","product-opportunity-push-33.4.1.test.mjs");
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

function replaceOnce(src,from,to,label){
  if(src.includes(to)){log(`Bereits vorhanden: ${label}`);return src;}
  const count=src.split(from).length-1;
  if(count!==1) throw new Error(`${label}: Ausgangsanker ${count===0?"fehlt":`ist ${count}x vorhanden`}.`);
  log(`Ändere: ${label}`);
  return src.replace(from,to);
}

function replaceAllRequired(src,from,to,label,min=1){
  const count=src.split(from).length-1;
  if(count===0 && src.includes(to)){log(`Bereits vorhanden: ${label}`);return src;}
  if(count<min) throw new Error(`${label}: Erwartet mindestens ${min} Fundstelle(n), gefunden ${count}.`);
  log(`Ändere ${count}x: ${label}`);
  return src.split(from).join(to);
}

function run(cmd,args,label){
  log(`Prüfe: ${label}`);
  const exe=process.platform==="win32" && cmd==="npm" ? "npm.cmd" : cmd;
  const r=spawnSync(exe,args,{cwd:repo,stdio:"inherit",shell:false,env:process.env});
  if(r.error) throw r.error;
  if(r.status!==0) throw new Error(`${label} fehlgeschlagen (Exit ${r.status}).`);
  log(`BESTANDEN: ${label}`);
}

try {
  // 1) YumShare Solo 2: current manufacturer page now gives a concrete battery type.
  let s=read(files.yum);
  s=replaceOnce(
    s,
    'updatedAt: "2026-08-06"',
    'updatedAt: "2026-08-10"',
    "YumShare Aktualisierungsdatum"
  );
  s=replaceOnce(
    s,
    '  title: "PETKIT YumShare Solo 2: Kamera-Futterautomat im Check"\n  description: >-\n    PETKIT YumShare Solo 2 mit 1080p-Kamera, 3-Liter-Tank und Dual-Band-WLAN: Mahlzeiten, App, Batterie-Backup und\n    Grenzen der Tiererkennung im Datencheck.',
    '  title: "PETKIT YumShare Solo 2: Kamera, App & Backup im Check"\n  description: >-\n    PETKIT YumShare Solo 2 P572 mit 1080p-Kamera, 3-Liter-Tank, Dual-Band-WLAN und bis zu 14 Tagen Backup:\n    Mahlzeiten, App, Batteriebetrieb und Grenzen der Tiererkennung.',
    "YumShare SEO-Snippet"
  );
  s=replaceAllRequired(
    s,
    '    - PETKIT macht auf der aktuellen Produktseite widersprüchliche Angaben zur Art der Backup-Batterien',
    '    - für das Backup werden laut aktueller PETKIT-Produktseite fünf AAA-Alkaline-Batterien benötigt',
    "YumShare Batterie-Hinweis attention"
  );
  s=replaceAllRequired(
    s,
    '    Batterieart, kostenlose Video-Historie und AI-Zuordnung sollten wegen regionaler beziehungsweise widersprüchlicher\n    Herstellerangaben vor dem Kauf nochmals geprüft werden.',
    '    Video-Historie, AI-Zuordnung und der regionale App-Funktionsumfang sollten vor dem Kauf geprüft werden. Die aktuelle\n    PETKIT-Produktseite nennt für das Backup fünf AAA-Alkaline-Batterien und wirbt mit bis zu 14 Tagen Reserve.',
    "YumShare Verdict Batteriepräzisierung"
  );
  s=replaceAllRequired(
    s,
    '  - widersprüchliche Herstellerangaben zur Backup-Batterie',
    '  - fünf AAA-Alkaline-Batterien für den Backup-Betrieb erforderlich',
    "YumShare Weakness Backup"
  );
  s=replaceAllRequired(
    s,
    '    value: Hersteller wirbt mit bis zu 14 Tagen; Batterieart ist auf der aktuellen Produktseite widersprüchlich dokumentiert',
    '    value: laut aktueller PETKIT-Produktseite bis zu 14 Tage mit fünf AAA-Alkaline-Batterien',
    "YumShare Specs Backup",
    1
  );
  s=replaceOnce(
    s,
    '  - question: Welche Batterien benötigt der YumShare Solo 2?\n    answer: >-\n      Die aktuelle PETKIT-Produktseite enthält widersprüchliche Angaben zur Batterieart. Deshalb sollte vor dem Kauf die\n      regionale Anleitung für das Modell P572 geprüft werden.',
    '  - question: Welche Batterien benötigt der YumShare Solo 2?\n    answer: >-\n      Die aktuelle PETKIT-Produktseite nennt fünf AAA-Alkaline-Batterien für die Backup-Stromversorgung. PETKIT wirbt mit\n      bis zu 14 Tagen Reserve; die Kamera ist im Batteriebetrieb deaktiviert.',
    "YumShare FAQ Backup"
  );
  s=replaceAllRequired(
    s,
    'stromreserve: vorhanden; Batterieart auf aktueller Herstellerseite widersprüchlich',
    'stromreserve: bis zu 14 Tage laut Hersteller; fünf AAA-Alkaline-Batterien',
    "YumShare ComparisonData Stromreserve"
  );
  s=replaceAllRequired(
    s,
    'batterie_backup: Hersteller wirbt mit bis zu 14 Tagen; Batterieart ist auf der aktuellen Produktseite widersprüchlich dokumentiert',
    'batterie_backup: laut aktueller PETKIT-Produktseite bis zu 14 Tage mit fünf AAA-Alkaline-Batterien',
    "YumShare ComparisonData Batterie"
  );
  s=replaceAllRequired(
    s,
    'value: "Hersteller wirbt mit bis zu 14 Tagen; Batterieart ist auf der aktuellen Produktseite widersprüchlich dokumentiert"',
    'value: "Laut aktueller PETKIT-Produktseite bis zu 14 Tage mit fünf AAA-Alkaline-Batterien"',
    "YumShare DecisionFact Batterie"
  );
  s=replaceOnce(
    s,
    'Zur Backup-Stromversorgung macht die aktuelle Produktseite widersprüchliche Angaben. Gleichzeitig wirbt PETKIT mit bis zu 14 Tagen Backup und weist darauf hin, dass die Kamera im Batteriebetrieb deaktiviert ist. Die regionale Anleitung für Modell P572 sollte deshalb vor dem Kauf geprüft werden.',
    'Für die Backup-Stromversorgung nennt die aktuelle PETKIT-Produktseite fünf AAA-Alkaline-Batterien und wirbt mit bis zu 14 Tagen Reserve. Im Batteriebetrieb ist die Kamera laut Hersteller deaktiviert; die lokale Futterausgabe bleibt damit klar von den Kamera- und Cloudfunktionen zu trennen.',
    "YumShare Body Backup"
  );
  s=replaceOnce(
    s,
    'Der PETKIT YumShare Solo 2 ist ein gut ausgestatteter Kamera-Futterautomat für Trockenfutter. Dual-Band-WLAN, flexible Zeitpläne und der Edelstahl-Napf sind klare Vorteile. Die wichtigsten Grenzen sind die fehlende Zugangskontrolle, mögliche Abo-Funktionen und widersprüchliche Herstellerangaben zur Backup-Batterie.',
    'Der PETKIT YumShare Solo 2 ist ein gut ausgestatteter Kamera-Futterautomat für Trockenfutter. Dual-Band-WLAN, flexible Zeitpläne und der Edelstahl-Napf sind klare Vorteile. Die wichtigsten Grenzen sind die fehlende Zugangskontrolle, mögliche Abo-Funktionen und die deaktivierte Kamera im Batteriebetrieb.',
    "YumShare Fazit Backup"
  );
  fs.writeFileSync(files.yum,s.trimEnd()+"\n","utf8");

  // 2) Eversweet Ultra: make the no-filter / Cube-C distinction visible in snippet and verdict.
  s=read(files.ultra);
  s=replaceOnce(
    s,
    'updatedAt: "2026-07-23"',
    'updatedAt: "2026-08-10"',
    "Eversweet Aktualisierungsdatum"
  );
  s=replaceOnce(
    s,
    '  title: PETKIT Eversweet Ultra im Check\n  description: PETKIT Eversweet Ultra mit 5 l Frischwasser, 1,8 l Abwasser, OneWay-System, AI-Kamera, Mehrtier-Erkennung und App.',
    '  title: "PETKIT Eversweet Ultra: filterloses OneWay-System im Check"\n  description: >-\n    PETKIT Eversweet Ultra mit 5 l Frischwasser, 1,8 l Abwasser, OneWay-System ohne klassischen Hauptfilter,\n    AI-Kamera und Cube C: Nutzen, Reinigung und Folgekosten.',
    "Eversweet SEO-Snippet"
  );
  s=replaceOnce(
    s,
    '    Ein technisch ungewöhnliches und durchdachtes Trinksystem für Mehrtierhaushalte. Trennung der Wasserwege, Kamera und\n    automatische Spülung bieten echten Zusatznutzen. Hoher Preis, Größe, Cloud-Abhängigkeit und noch begrenzte\n    Langzeiterfahrung verhindern jedoch eine uneingeschränkte Empfehlung.',
    '    Ein technisch ungewöhnliches Trinksystem für Mehrtierhaushalte. Der entscheidende Unterschied zu klassischen\n    Trinkbrunnen ist die Trennung von Frisch- und gebrauchtem Wasser: Ein klassischer Hauptfilter entfällt. Cube C bleibt\n    jedoch als Bauteil eingesetzt; PETKIT empfiehlt den Austausch ungefähr alle 30 Tage, macht ihn für den Betrieb aber\n    nicht zwingend. Hoher Preis, Größe, Cloud-Abhängigkeit und begrenzte Langzeiterfahrung bleiben die wichtigsten Grenzen.',
    "Eversweet Verdict Filter/Folgekosten"
  );
  s=replaceOnce(
    s,
    '  - question: Benötigt der PETKIT Eversweet Ultra einen Filter?\n    answer: >-\n      Er verwendet keinen klassischen Hauptfilter, weil gebrauchtes Wasser nicht in den Frischwassertank zurückgeführt\n      wird. Cube C sitzt jedoch als strukturelles Hygieneelement im Auslauf und muss eingesetzt bleiben.',
    '  - question: Ist der PETKIT Eversweet Ultra wirklich filterlos?\n    answer: >-\n      Er benötigt keinen klassischen Hauptfilter, weil gebrauchtes Wasser nicht in den Frischwassertank zurückgeführt\n      wird. Vollständig verbrauchsmaterialfrei ist das System trotzdem nicht: Cube C bleibt als Bauteil eingesetzt.\n      PETKIT empfiehlt einen Austausch ungefähr alle 30 Tage, der Brunnen funktioniert laut Hersteller aber auch darüber hinaus.',
    "Eversweet Filter-FAQ"
  );
  fs.writeFileSync(files.ultra,s.trimEnd()+"\n","utf8");

  // 3) Polar: sharpen the power-failure and 72h claims instead of adding speculative community claims.
  s=read(files.polar);
  s=replaceOnce(
    s,
    '  title: "PETLIBRO Polar Wet Food Feeder: Kühlung im Check"\n  description: >-\n    PETLIBRO Polar Wet Food Feeder PLAF109 mit aktiver Kühlung: drei 200-ml-Fächer, App, Edelstahl-Schale und Grenzen\n    des 12-Stunden-Ausfallschutzes.',
    '  title: "PETLIBRO Polar Wet Food Feeder: Kühlung & Stromausfall im Check"\n  description: >-\n    PETLIBRO Polar PLAF109 mit aktiver Kühlung, drei 200-ml-Fächern und App: Was die 72-Stunden-Angabe bedeutet und\n    was das 12-Stunden-Batterie-Backup bei Stromausfall tatsächlich absichert.',
    "Polar SEO-Snippet"
  );
  s=replaceOnce(
    s,
    '    Der PETLIBRO Polar ist technisch deutlich überzeugender als ein einfacher Fachautomat mit Kühlakkus. Seine Grenzen\n    bleiben die vollständige Abhängigkeit der aktiven Kühlung vom Netzstrom, nur drei Mahlzeiten und die\n    App-Abhängigkeit für spontane Öffnungen.',
    '    Der PETLIBRO Polar ist technisch deutlich überzeugender als ein einfacher Fachautomat mit Kühlakkus. Wichtig ist die\n    Trennung zweier Versprechen: PETLIBRO nennt bis zu 72 Stunden Frische unter definierten Bedingungen, während das\n    Batterie-Backup bei Stromausfall den Fütterungsplan bis zu 12 Stunden weiterführt. Eine fortgesetzte aktive Kühlung\n    im Batteriebetrieb ist damit nicht belegt. Dazu kommen nur drei Mahlzeiten und die App-Abhängigkeit für spontane Öffnungen.',
    "Polar Verdict Stromausfall"
  );
  s=replaceOnce(
    s,
    '  - question: Wie lange kühlt der PETLIBRO Polar Nassfutter?\n    answer: >-\n      PETLIBRO nennt bis zu 72 Stunden. Das ist eine Herstellerangabe unter definierten Bedingungen und keine pauschale\n      Haltbarkeitsgarantie für jedes Futter und jede Raumtemperatur.',
    '  - question: Bedeutet die 72-Stunden-Angabe, dass Nassfutter immer drei Tage sicher bleibt?\n    answer: >-\n      Nein. PETLIBRO nennt bis zu 72 Stunden Frische als Herstellerangabe für den vorgesehenen Betrieb. Das ist keine\n      pauschale Haltbarkeitsgarantie für jedes Futter, jede Raumtemperatur oder einen Stromausfall. Futterreste sollten\n      nach dem Fütterungsplan entfernt und die Schale gereinigt werden.',
    "Polar 72h-FAQ"
  );
  fs.writeFileSync(files.polar,s.trimEnd()+"\n","utf8");

  const test=`import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const r=(p)=>fs.readFileSync(path.join(app,p),"utf8");

test("YumShare nutzt aktuelle konkrete Backup-Angabe",()=>{
  const s=r("src/content/products/petkit-yumshare-solo-2.md");
  assert.ok(s.includes("fünf AAA-Alkaline-Batterien"));
  assert.ok(s.includes("bis zu 14 Tage"));
  assert.ok(!s.includes("widersprüchliche Herstellerangaben zur Backup-Batterie"));
  assert.ok(!s.includes("widersprüchliche Angaben"));
  assert.ok(!s.includes("Batterieart ist auf der aktuellen Produktseite widersprüchlich dokumentiert"));
});

test("Eversweet trennt filterlos von verbrauchsmaterialfrei",()=>{
  const s=r("src/content/products/petkit-eversweet-ultra.md");
  assert.ok(s.includes("ohne klassischen Hauptfilter"));
  assert.ok(s.includes("Vollständig verbrauchsmaterialfrei"));
  assert.ok(s.includes("ungefähr alle 30 Tage"));
});

test("Polar trennt 72-Stunden-Frische und 12-Stunden-Backup",()=>{
  const s=r("src/content/products/petlibro-polar-wet-food-feeder.md");
  assert.ok(s.includes("72-Stunden-Angabe"));
  assert.ok(s.includes("12-Stunden-Batterie-Backup"));
  assert.ok(s.includes("fortgesetzte aktive Kühlung"));
});

test("keine neue Testbehauptung",()=>{
  for(const p of [
    "src/content/products/petkit-yumshare-solo-2.md",
    "src/content/products/petkit-eversweet-ultra.md",
    "src/content/products/petlibro-polar-wet-food-feeder.md"
  ]){
    const s=r(p);
    assert.ok(s.includes("kein eigener") || s.includes("kein eigener Langzeit"));
  }
});
`;

  fs.mkdirSync(path.dirname(testFile),{recursive:true});
  fs.writeFileSync(testFile,test,"utf8");
  log(`Geschrieben: ${path.relative(repo,testFile)}`);

  run("node",["--check",testFile],"Syntaxprüfung Regressionstest");
  run("node",["--test",testFile],"Product-Opportunity Regressionstest");
  run("npm",["--workspace","apps/pfotentechnik","run","build"],"Astro-Build");
  run("npm",["--workspace","apps/pfotentechnik","run","audit:products:strict"],"Produktdaten-Audit");
  run("npm",["--workspace","apps/pfotentechnik","run","audit:content-quality:strict"],"Content-Quality");
  run("npm",["--workspace","apps/pfotentechnik","run","audit:internal-link-targets:strict"],"Interne Linkziele");

  log("Abgeschlossen. Drei bestehende Produktseiten wurden aktualisiert; keine neue URL angelegt.");
} catch(error) {
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

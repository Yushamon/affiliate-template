#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH="pfotentechnik-seo-recovery-query-match-33.3.1";
const log=(m)=>console.log(`[${PATCH}] ${m}`);

function findRoot(start=process.cwd()){
  let cur=path.resolve(start);
  for(let i=0;i<16;i++){
    if(fs.existsSync(path.join(cur,"package.json"))&&fs.existsSync(path.join(cur,"apps","pfotentechnik","package.json"))) return cur;
    const p=path.dirname(cur); if(p===cur) break; cur=p;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}
const repo=findRoot(), app=path.join(repo,"apps","pfotentechnik");
const files={
  multi:path.join(app,"src/content/pages/trinkbrunnen-fuer-mehrere-katzen.md"),
  filter:path.join(app,"src/content/pages/katzentrinkbrunnen-ohne-filter.md"),
  water:path.join(app,"src/content/pages/katzenwasser-taeglich-wechseln.md"),
  offline:path.join(app,"src/content/comparisons/beste-futterautomaten-ohne-wlan.md"),
};
const testFile=path.join(app,"test","seo-recovery-query-match-33.3.1.test.mjs");
const read=(f)=>fs.readFileSync(f,"utf8").replace(/\r\n/g,"\n");
for(const f of Object.values(files)) if(!fs.existsSync(f)) throw new Error(`Erwartete Datei fehlt: ${path.relative(repo,f)}`);
const originals=new Map([...Object.values(files),testFile].map(f=>[f,fs.existsSync(f)?read(f):null]));
const backup=path.join(repo,".patch-backups",`${PATCH}-${new Date().toISOString().replace(/[:.]/g,"-")}`);
for(const [f,c] of originals){if(c==null)continue;const d=path.join(backup,path.relative(repo,f));fs.mkdirSync(path.dirname(d),{recursive:true});fs.writeFileSync(d,c,"utf8");}
log(`Backup: ${path.relative(repo,backup)}`);

const replaceOnce=(src,from,to,label)=>{
  if(src.includes(to)){log(`Bereits vorhanden: ${label}`);return src;}
  const n=src.split(from).length-1;
  if(n!==1) throw new Error(`${label}: erwartete Ausgangsstruktur ${n===0?"fehlt":`ist ${n}x vorhanden`}.`);
  log(`Ändere: ${label}`); return src.replace(from,to);
};
const run=(cmd,args,label)=>{
  log(`Prüfe: ${label}`);
  const exe=process.platform==="win32"&&cmd==="npm"?"npm.cmd":cmd;
  const r=spawnSync(exe,args,{cwd:repo,stdio:"inherit",shell:false,env:process.env});
  if(r.error) throw r.error;
  if(r.status!==0) throw new Error(`${label} fehlgeschlagen (Exit ${r.status}).`);
  log(`BESTANDEN: ${label}`);
};

try{
  let s=read(files.multi);
  s=replaceOnce(s,
    'seo:\n  title: "Trinkbrunnen für 2 Katzen: Größe, Anzahl & RFID"\n  description: "Für zwei Katzen reichen nicht nur ein großer Tank: drei getrennte Wasserstellen, Hygiene, RFID-Grenzen und passende Katzenbrunnen."',
    'seo:\n  title: "Wie viele Wasserstellen für 2 Katzen? Trinkbrunnen & Näpfe"\n  description: "Für zwei Katzen sind mehrere getrennte Wasserstellen sinnvoll. So planst du Anzahl, Standorte, Trinkbrunnen, Näpfe und Tankgröße im Mehrkatzenhaushalt."',
    "Query-näherer SEO-Titel Mehrkatzen");
  s=replaceOnce(s,
`## Kurzantwort

Für mehrere Katzen ist nicht der größte Tank automatisch die beste Lösung. Wichtiger sind **mehrere räumlich getrennte Wasserstellen**, gute Zugänglichkeit und eine Bauform, die sich trotz höherer Nutzung schnell reinigen lässt. Ein Brunnen darf nicht zur einzigen Ressource werden.`,
`## Kurzantwort

Für **zwei Katzen sind drei räumlich getrennte Wasserstellen ein sinnvoller Planungswert**: eine Stelle pro Katze plus eine zusätzliche Ausweichmöglichkeit. Das müssen nicht drei Trinkbrunnen sein. Ein Brunnen kann mit gut platzierten Wassernäpfen kombiniert werden. Entscheidend ist, dass keine Katze den einzigen Zugang blockieren kann.

| Haushalt | Sinnvoller Ausgangspunkt | Praktische Umsetzung |
| --- | --- | --- |
| 1 Katze | 2 Wasserstellen | z. B. 1 Brunnen + 1 Napf |
| 2 Katzen | 3 Wasserstellen | z. B. 1 Brunnen + 2 Näpfe |
| 3 Katzen | 4 Wasserstellen | auf mehrere Räume verteilen |
| 4 Katzen | 5 Wasserstellen | mehrere unabhängige Standorte |

Die Tabelle ist eine **Planungshilfe, keine starre medizinische Regel**. Wohnungsgrundriss, soziale Konflikte und individuelle Vorlieben können zusätzliche Stellen sinnvoll machen. Mehrere Gefäße direkt nebeneinander zählen praktisch nicht als getrennte Ausweichorte.`,
    "Direktantwort und Anzahl-Tabelle");
  fs.writeFileSync(files.multi,s.trimEnd()+"\n","utf8");

  s=read(files.filter);
  s=replaceOnce(s,
`## Nachteile und Grenzen

Haare gelangen schneller zur Pumpe.`,
`## Filterlos heißt nicht automatisch verbrauchsmaterialfrei

Der Verzicht auf Wechselkartuschen beseitigt nur **eine** laufende Verbrauchsposition. Je nach Konstruktion können weiterhin Pumpen, Vorfilter oder Siebe, Dichtungen, Reinigungsbürsten oder andere Verschleißteile ersetzt werden müssen. Vor dem Kauf lohnt deshalb der Blick in Ersatzteilshop und Anleitung: Welche Teile sind vorgesehen, was kosten sie und lässt sich die Pumpe separat ersetzen?

Ein günstiger Brunnen ohne Filter kann langfristig unattraktiv sein, wenn eine verschlissene Pumpe nur zusammen mit dem ganzen Gerät ersetzt werden kann. Umgekehrt kann ein gut zerlegbares System trotz einzelner Ersatzteile wirtschaftlicher und hygienisch einfacher zu betreiben sein.

## Nachteile und Grenzen

Haare gelangen schneller zur Pumpe.`,
    "Verbrauchsmaterial-Abschnitt");
  fs.writeFileSync(files.filter,s.trimEnd()+"\n","utf8");

  s=read(files.water);
  s=replaceOnce(s,
`## Warum Nachfüllen nicht dasselbe wie Wechseln ist`,
`## Wasserwechsel auf einen Blick

| Situation | Sinnvoller Rhythmus |
| --- | --- |
| Wassernapf | mindestens täglich vollständig erneuern |
| Sichtbare Haare, Futterreste, Geruch oder Trübung | sofort wechseln und Gefäß reinigen |
| Warmes Wetter oder starke Verschmutzung | zusätzlich zur täglichen Routine kontrollieren und bei Bedarf wechseln |
| Trinkbrunnen | täglich kontrollieren; regelmäßig vollständig entleeren und nach Herstellerangaben reinigen |
| Nur Wasser nachgefüllt | ersetzt keinen vollständigen Wasserwechsel |

## Warum Nachfüllen nicht dasselbe wie Wechseln ist`,
    "Kompakte Wasserwechsel-Tabelle");
  fs.writeFileSync(files.water,s.trimEnd()+"\n","utf8");

  s=read(files.offline);
  const start="## Lokale Zeitsteuerung reicht für viele Routinen";
  const end="## Quellen";
  const firstSources=s.indexOf(end);
  const redundant=s.indexOf(start);
  if(redundant!==-1){
    // Der lange zweite Erklärblock beginnt erst nach den bereits vorhandenen Quellen/Weiterführenden Links.
    // Wir entfernen ihn bis EOF, weil die Kernintention oben bereits vollständig beantwortet wird.
    s=s.slice(0,redundant).trimEnd()+"\n";
    log("Entferne: redundanten zweiten Offline-Erklärblock");
  } else {
    log("Bereits entfernt: redundanter zweiter Offline-Erklärblock");
  }
  for(const marker of ["## Schnellentscheidung in 30 Sekunden","## Drei unterschiedliche Offline-Konzepte","## Offline bedeutet nicht ausfallsicher","## SureFeed Connect richtig einordnen","## Quellen","## Weiterführende Links"])
    if(!s.includes(marker)) throw new Error(`Offline-Vergleich: Kernabschnitt fehlt nach Verdichtung: ${marker}`);
  fs.writeFileSync(files.offline,s.trimEnd()+"\n","utf8");

  const test=`import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const r=(p)=>fs.readFileSync(path.join(app,p),"utf8");

test("Mehrkatzen-Seite beantwortet Anzahl direkt",()=>{
  const s=r("src/content/pages/trinkbrunnen-fuer-mehrere-katzen.md");
  assert.match(s,/zwei Katzen sind drei räumlich getrennte Wasserstellen/);
  assert.match(s,/\\| 2 Katzen \\| 3 Wasserstellen \\|/);
  assert.match(s,/Wie viele Wasserstellen für 2 Katzen\\?/);
});
test("Filterlos-Seite trennt Filterkosten von Verschleißteilen",()=>{
  const s=r("src/content/pages/katzentrinkbrunnen-ohne-filter.md");
  assert.match(s,/Filterlos heißt nicht automatisch verbrauchsmaterialfrei/);
  assert.match(s,/Pumpen, Vorfilter oder Siebe, Dichtungen/);
});
test("Wasserwechsel-Seite enthält kompakte Antworttabelle",()=>{
  const s=r("src/content/pages/katzenwasser-taeglich-wechseln.md");
  assert.match(s,/Wasserwechsel auf einen Blick/);
  assert.match(s,/Wassernapf \\| mindestens täglich vollständig erneuern/);
});
test("Offline-Vergleich bleibt fokussiert und behält Kernentscheidung",()=>{
  const s=r("src/content/comparisons/beste-futterautomaten-ohne-wlan.md");
  assert.doesNotMatch(s,/## Lokale Zeitsteuerung reicht für viele Routinen/);
  for(const m of ["## Schnellentscheidung in 30 Sekunden","## Drei unterschiedliche Offline-Konzepte","## Offline bedeutet nicht ausfallsicher","## SureFeed Connect richtig einordnen","## Quellen"])
    assert.ok(s.includes(m), "Kernabschnitt fehlt: " + m);
});
`;
  fs.mkdirSync(path.dirname(testFile),{recursive:true}); fs.writeFileSync(testFile,test,"utf8");
  log(`Geschrieben: ${path.relative(repo,testFile)}`);

  run("node",["--check",testFile],"Syntaxprüfung Regressionstest");
  run("node",["--test",testFile],"SEO-Recovery Regressionstest");
  run("npm",["--workspace","apps/pfotentechnik","run","build"],"Astro-Build");
  run("npm",["--workspace","apps/pfotentechnik","run","audit:content-quality:strict"],"Content-Quality");
  run("npm",["--workspace","apps/pfotentechnik","run","audit:internal-link-targets:strict"],"Interne Linkziele");
  log("Abgeschlossen. Vier bestehende URLs wurden query-näher verdichtet; keine neue Seite angelegt.");
}catch(error){
  for(const [f,c] of originals){
    if(c==null){if(fs.existsSync(f))fs.rmSync(f,{force:true});}
    else{fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,c,"utf8");}
  }
  console.error(`[${PATCH}] FEHLER: ${error instanceof Error?error.message:String(error)}`);
  console.error(`[${PATCH}] Änderungen wurden zurückgerollt.`);
  process.exit(1);
}

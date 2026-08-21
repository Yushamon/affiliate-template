import fs from "node:fs";
import path from "node:path";
const TAG="[pfotentechnik-petlibro-dockstream-rfid-evidence-intent-32.8.3]";
const file=path.join(process.cwd(),"apps/pfotentechnik/src/content/products/petlibro-dockstream-rfid-smart.md");
if(!fs.existsSync(file)){console.error(`${TAG} FEHLER: Datei fehlt.`);process.exit(1)}
let s=fs.readFileSync(file,"utf8"), original=s;
const log=x=>console.log(`${TAG} ${x}`);
const fail=x=>{console.error(`${TAG} FEHLER: ${x}`);process.exit(1)};
function rep(label,a,b){
 if(s.includes(b)){log(`${label}: bereits aktuell.`);return}
 const n=s.split(a).length-1;if(n!==1)fail(`${label}: Ausgangsmuster kommt ${n}× vor.`);
 s=s.replace(a,b);log(`${label}: aktualisiert.`);
}
rep("updatedAt",'updatedAt: "2026-07-16"','updatedAt: "2026-08-21"');
rep("SEO-Title","  title: PETLIBRO Dockstream RFID Smart im Check","  title: PETLIBRO Dockstream RFID Smart: RFID-Trinktracking im Check");
rep("SEO-Description","  description: PETLIBRO Dockstream RFID Smart mit 3 Litern, RFID-Tierzuordnung, App, Edelstahl-Trinkfläche und 2,4-GHz-WLAN.","  description: PETLIBRO Dockstream RFID Smart PLWF305: Trinktracking pro Katze, 3-Liter-Tank und App. Was RFID kann und wo Halsbandpflicht und Zuverlässigkeit stören.");
rep("User-Evidence",'        - "Einzelne Nutzer berichten von Zuverlässigkeits- oder Erkennungsproblemen."','        - "Neben Lob für leisen Betrieb und individuelles Monitoring berichten einzelne Nutzer über Probleme mit Erkennung, Wasserstand oder Zuverlässigkeit; die 33 Chewy-Bewertungen ergeben 3,5 von 5 Punkten."');
rep("Consensus Stärke",'      - finding: "Individuelles RFID-Trinktracking ist der klare Mehrwert gegenüber normalen Smart-Fountains."\n        sourceCount: 2\n        confidence: "high"','      - finding: "Individuelles RFID-Trinktracking ist der klare Mehrwert gegenüber normalen Smart-Fountains und wird auch in Nutzerbewertungen als nützliches Monitoring hervorgehoben."\n        sourceCount: 2\n        confidence: "high"');
rep("Consensus Schwäche",'      - finding: "Das System ist vom RFID-Anhänger und korrekter Erkennung abhängig."\n        sourceCount: 1\n        confidence: "medium"','      - finding: "Das System ist vom RFID-Anhänger und korrekter Erkennung abhängig; Nutzerbewertungen liefern zusätzlich ein begrenztes Risikosignal zu Erkennung, Wasserstand und Zuverlässigkeit."\n        sourceCount: 2\n        confidence: "medium"');
rep("Consensus Assessment","      Das Monitoring-Konzept ist stark; Zuverlässigkeit und Tag-Akzeptanz bleiben wichtige Prüfpunkte.","      Das Monitoring-Konzept ist stark, erhöht aber die technische Abhängigkeit von RFID-Erkennung, Kalibrierung, App und WLAN. Die gemischten Nutzerbewertungen sind kein Beleg für einen generellen Defekt, machen Rückgabemöglichkeit und Garantie aber kaufrelevant.");
rep("Decision Attention","    - nur 2,4-GHz-WLAN und kabelgebundener Betrieb","    - nur 2,4-GHz-WLAN und kabelgebundener Betrieb\n    - Einrichtung und zuverlässige Messung hängen zusätzlich von korrekter Aufstellung und Kalibrierung ab");
rep("Weaknesses","  - Filterwechsel etwa alle zwei Wochen","  - Filterwechsel etwa alle zwei Wochen\n  - gemischte Nutzerberichte zu Erkennung, Wasserstand und Zuverlässigkeit");
rep("Verdict",'  verdict: >-\n    Die sinnvollste Dockstream-Variante für echte Mehrtierauswertung, sofern Halsband und proprietärer RFID-Anhänger\n    akzeptiert werden.','  verdict: >-\n    Der Dockstream RFID Smart ist vor allem interessant, wenn in einem Mehrkatzenhaushalt wirklich erkennbar sein soll,\n    welches Tier wie viel trinkt. Dafür bietet die RFID-Zuordnung einen seltenen Mehrwert. Wer lediglich einen leisen,\n    pflegeleichten Trinkbrunnen sucht, kauft sich dagegen zusätzliche technische Abhängigkeiten ein. Gemischte\n    Nutzerberichte zu Erkennung und Zuverlässigkeit sprechen dafür, Rückgabemöglichkeit und Garantie mitzuwerten.');
const oldBody=`## Proprietäres RFID-System

Die Zuordnung funktioniert ausschließlich über PETLIBRO-Halsbandanhänger. Implantierte Mikrochips und fremde RFID-Tags werden nicht gelesen. Das Halsband ist deshalb keine optionale Ergänzung, sondern Voraussetzung.`;
const newBody=`## Proprietäres RFID-System

Die Zuordnung funktioniert ausschließlich über PETLIBRO-Halsbandanhänger. Implantierte Mikrochips und fremde RFID-Tags werden nicht gelesen. Das Halsband ist deshalb keine optionale Ergänzung, sondern Voraussetzung.

Gerade in einem Mehrkatzenhaushalt ist das der entscheidende Unterschied zu einem normalen Smart-Brunnen: Statt nur den Gesamtverbrauch zu sehen, lassen sich Trinkereignisse einzelnen Tieren zuordnen. Mehr zur Auswahl nach Tierzahl findest du im Ratgeber [Trinkbrunnen für mehrere Katzen](/trinkbrunnen-fuer-mehrere-katzen/).

## Was die Smart-Funktionen im Alltag verlangen

Das zusätzliche Monitoring bringt auch mehr Fehlerquellen mit. RFID-Erkennung, Aufstellung und Kalibrierung, App und WLAN müssen zusammenspielen. Die vorhandenen Nutzerbewertungen sind gemischt: Neben Lob für leisen Betrieb und tierbezogene Daten gibt es einzelne Berichte über Erkennungs-, Wasserstands- oder Zuverlässigkeitsprobleme. Das ist kein Beleg für einen generellen Serienfehler, macht eine gute Rückgabemöglichkeit aber relevanter als bei einem einfachen Trinkbrunnen.`;
rep("Intent-/Link-Block",oldBody,newBody);
for(const x of["RFID-Trinktracking im Check","/trinkbrunnen-fuer-mehrere-katzen/","Rückgabemöglichkeit"])if(!s.includes(x))fail(`Sicherheitscheck: ${x}`);
if(s===original){log("Keine Änderung nötig.");process.exit(0)}
const tmp=file+`.tmp-${process.pid}`;fs.writeFileSync(tmp,s,"utf8");fs.renameSync(tmp,file);
log("Produktdatei aktualisiert. Keine .bak-Datei angelegt.");
console.log(`
Jetzt prüfen:
  npm --workspace apps/pfotentechnik run audit:product-evidence
  npm --workspace apps/pfotentechnik run audit:products
  git diff -- apps/pfotentechnik/src/content/products/petlibro-dockstream-rfid-smart.md
`);

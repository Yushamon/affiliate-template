#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const PATCH='pfotentechnik-external-evidence-batch-9-33.8.15';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const app=path.join(root,'apps/pfotentechnik');
const productDir=path.join(app,'src/content/products');
const queueFile=path.join(app,'scripts/product-evidence/research-queue.mjs');
const backupDir=path.join(root,'.patch-backups',`${PATCH}-${new Date().toISOString().replace(/[:.]/g,'-')}`);
fs.mkdirSync(backupDir,{recursive:true});

const blocks={
'imipaw-3l-automatic-cat-feeder':`externalEvidence:
  professionalReviews:
    - publisher: "The Spruce Pets"
      title: "The 10 Best Automatic Cat Feeders Tested With Real Cats"
      url: "https://www.thesprucepets.com/best-automatic-cat-feeders-4175145"
      checkedAt: "2026-08-11"
      methodology: "comparative-hands-on-testing"
      positives:
        - "IMIPAW wird nach einem Vergleichstest mit realen Katzen als weitere empfehlenswerte Budget-Option geführt."
      negatives:
        - "Die Quelle trennt die zahlreichen ähnlich benannten 3-Liter-Varianten nicht vollständig."
      findings:
        - "Die unabhängige Quelle stützt die grundsätzliche Alltagstauglichkeit der IMIPAW-Automatenklasse."
  userReviews:
    - platform: "Chewy"
      url: "https://www.chewy.com/imipaw-automatic-programmable-cat-dog/product-reviews/2480022"
      checkedAt: "2026-08-11"
      rating: 4.5
      scale: 5
      reviewCount: 110
      recurringPositives:
        - "Wiederkehrend genannt werden einfache Programmierung, pünktliche Ausgabe und ein gutes Preis-Leistungs-Verhältnis."
      recurringCriticism:
        - "Einige Katzen können einzelne Kroketten aus dem Ausgabeschacht angeln; die Portionsmenge muss mit dem eigenen Futter kalibriert werden."
  consensus:
    strengths:
      - finding: "Einfache lokale Zeitplanung und zuverlässige Grundfunktion sind die wiederkehrenden Stärken."
        sourceCount: 2
        confidence: "medium"
    weaknesses:
      - finding: "Portionsmenge und Manipulationssicherheit hängen vom Futter und vom Verhalten der Katze ab."
        sourceCount: 2
        confidence: "medium"
    editorialAssessment: >-
      Unabhängiger Vergleichstest und eine größere produktspezifische Käuferbasis stützen die Budget-Einordnung.
      Wegen ähnlich benannter IMIPAW-3L-Varianten bleiben Hardwaredetails vorsichtig.`,

'litter-robot-5-pro':`externalEvidence:
  professionalReviews:
    - publisher: "Cats.com"
      title: "Litter-Robot 5 Pro Review: We Tested It"
      url: "https://cats.com/litter-robot-5-pro-review"
      checkedAt: "2026-08-11"
      methodology: "three-week-hands-on-test-with-two-cats"
      positives:
        - "Reinigungsleistung, Geruchskontrolle, Verarbeitung und Einrichtung werden im mehrwöchigen Test sehr positiv bewertet."
      negatives:
        - "Hoher Preis und ein für ältere Katzen teils anspruchsvoller Einstieg bleiben Nachteile."
      findings:
        - "Das konkrete 5-Pro-Modell wurde rund drei Wochen parallel zu Litter-Robot 5 und EVO getestet."
    - publisher: "Good Housekeeping"
      title: "Is the Litter-Robot 5 Pro Worth It? I Reviewed It With My Cat"
      url: "https://www.goodhousekeeping.com/home-products/a69733299/litter-robot-5-review/"
      checkedAt: "2026-08-11"
      methodology: "independent-editorial-home-test"
      positives:
        - "Komfort, automatische Reinigung und Monitoring-Funktionen werden positiv eingeordnet."
      negatives:
        - "Preis und Eingewöhnung einer vorsichtigen Katze werden als Kaufhürden beschrieben."
      findings:
        - "Das konkrete 5-Pro-Modell wurde im Haushalt mit einer älteren Katze eingesetzt."
  userReviews:
    - platform: "Whisker"
      url: "https://www.whisker.com/litter-robot-5-pro"
      checkedAt: "2026-08-11"
      rating: 4.4
      scale: 5
      reviewCount: 70
      recurringPositives:
        - "Viele Käufer loben Komfort, Geruchskontrolle und automatische Reinigung."
      recurringCriticism:
        - "Ein Teil der Rückmeldungen betrifft Software-, Kamera- oder Verbindungsprobleme."
  consensus:
    strengths:
      - finding: "Reinigungskomfort, Geruchskontrolle und Monitoring sind die am besten gestützten Stärken."
        sourceCount: 3
        confidence: "high"
    weaknesses:
      - finding: "Hoher Preis sowie noch nicht durchgehend reife Software- und Kamera-Funktionen sind die wiederkehrenden Gegenargumente."
        sourceCount: 3
        confidence: "high"
    editorialAssessment: >-
      Für das Litter-Robot 5 Pro liegt belastbare produktspezifische Evidenz vor. Die mechanische Grundfunktion ist stärker gestützt als einzelne AI-Funktionen.`,

'neakasa-m1-plus':`externalEvidence:
  professionalReviews:
    - publisher: "heise bestenlisten"
      title: "Selbstreinigendes Katzenklo Neakasa M1 Plus im Test: offen, smart und mit App"
      url: "https://www.heise.de/bestenlisten/testbericht/selbstreinigendes-katzenklo-neakasa-m1-plus-im-test-offen-smart-und-mit-app/m3dcek4"
      checkedAt: "2026-08-11"
      methodology: "hands-on-editorial-test"
      positives:
        - "Die Selbstreinigung arbeitet im Test zuverlässig; offene Bauform und App werden als Vorteile eingeordnet."
      negatives:
        - "Der obere Rand wird im Betrieb als hygienische Schwachstelle beschrieben."
      findings:
        - "Heise testet ausdrücklich das M1-Plus-Modell."
  userReviews:
    - platform: "Rakuten"
      url: "https://review.rakuten.co.jp/item/1/387047_10000133/1.1/"
      checkedAt: "2026-08-11"
      rating: 4.47
      scale: 5
      reviewCount: 62
      recurringPositives:
        - "Viele Käufer beschreiben eine deutliche Entlastung bei der täglichen Reinigung und gute Akzeptanz."
      recurringCriticism:
        - "Einzelne Rückmeldungen nennen Größe, Streuverteilung und Geruch als Nachteile."
    - platform: "Rentio"
      url: "https://www.rentio.jp/products/ps0122gj/reviews"
      checkedAt: "2026-08-11"
      rating: 2.0
      scale: 5
      reviewCount: 2
      recurringPositives: []
      recurringCriticism:
        - "Beide Produktbewertungen kritisieren Größe beziehungsweise Streuverteilung und Staub."
  consensus:
    strengths:
      - finding: "Die offene Bauform und zuverlässige automatische Reinigung sind die am besten gestützten Stärken."
        sourceCount: 3
        confidence: "high"
    weaknesses:
      - finding: "Große Stellfläche, Streuverteilung und Reinigungsbedarf an Randbereichen bleiben reale Gegenpunkte."
        sourceCount: 3
        confidence: "medium"
    editorialAssessment: >-
      Professioneller Test und Nutzerquellen stimmen beim Nutzen der offenen Bauform überein; bei Sauberkeit und Streuverteilung fallen Nutzerberichte gemischter aus.`,

'honeyguardian-smart-pet-feeder-s305d':`externalEvidence:
  status: constrained
  userReviews:
    - platform: "Desertcart"
      url: "https://www.desertcart.in/products/638972209-honeyguaridan-5l-automatic-cat-feeder-for-two-cats-2-4g"
      checkedAt: "2026-08-11"
      rating: 4.0
      scale: 5
      reviewCount: 5
      recurringPositives:
        - "Einzelne Käufer beschreiben Einrichtung und Futterausgabe als einfach und zuverlässig."
      recurringCriticism:
        - "Mindestens ein Bericht beschreibt wiederholte Offline-Ausfälle in der App bei zwei Geräten."
  note: >-
    Die Nutzerbasis ist klein. Eine belastbare unabhängige professionelle Review des exakt als S305D identifizierten Modells wurde nicht gefunden. Kein Consensus.`,

'neakasa-m1-lite':`externalEvidence:
  status: constrained
  userReviews:
    - platform: "Chewy"
      url: "https://www.chewy.com/neakasa-m1-lite-open-top-self/product-reviews/2049302"
      checkedAt: "2026-08-11"
      rating: 3.9
      scale: 5
      reviewCount: 35
      recurringPositives:
        - "Offene Bauform, einfache Inbetriebnahme und automatische Reinigung werden wiederholt positiv erwähnt."
      recurringCriticism:
        - "Mehrere Käufer berichten von Geruch, anhaftendem Abfall am Rand und höherem Reinigungsaufwand als erwartet."
    - platform: "Best Buy"
      url: "https://www.bestbuy.com/site/reviews/neakasa-m1-lite-open-top-self-cleaning-cat-litter-box-white/6632926"
      checkedAt: "2026-08-11"
      rating: 5.0
      scale: 5
      reviewCount: 4
      recurringPositives:
        - "Die kleine Stichprobe lobt leisen Betrieb, einfache Einrichtung und schnelle Akzeptanz."
      recurringCriticism:
        - "Die Stichprobe ist sehr klein und mehrere Reviews sind als incentiviert gekennzeichnet."
  note: >-
    Für das exakt als M1 Lite bezeichnete Modell wurde keine ausreichend belastbare unabhängige Hands-on-Review gefunden. Nutzerquellen allein reichen nicht für einen professionell gestützten Consensus.`,

'oneisall-2-2l-cordless-fountain':`externalEvidence:
  status: constrained
  userReviews:
    - platform: "Desertcart"
      url: "https://www.desertcart.ae/products/772556800-oneisall-wireless-cat-water-fountain-for-drinking-2-2l-20db"
      checkedAt: "2026-08-11"
      rating: null
      scale: 5
      reviewCount: null
      recurringPositives:
        - "Mehrere Käufer loben sehr leisen Betrieb, einfache Reinigung, Sensorbetrieb und kabellose Nutzung."
      recurringCriticism:
        - "Einzelne Berichte nennen Probleme mit Pumpenleistung, Filterteilen oder kürzerer Akkulaufzeit als erwartet."
  note: >-
    Keine belastbare unabhängige professionelle Review des exakt identifizierten 2,2-Liter-Modells gefunden. Händler-Nutzerberichte reichen nicht für einen Consensus.`
};

function backup(file){const rel=path.relative(root,file),dest=path.join(backupDir,rel);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(file,dest);}
function add(slug,block){const file=path.join(productDir,slug+'.md');if(!fs.existsSync(file))throw new Error('Fehlt: '+file);let raw=fs.readFileSync(file,'utf8');if(/^externalEvidence:\s*$/m.test(raw)){console.log(`[${PATCH}] Bereits vorhanden: ${slug}`);return false;}if(!/^ratings:\s*(?:\{|$)/m.test(raw))throw new Error('ratings fehlt: '+slug);const i=raw.indexOf('\ndecision:');if(i<0)throw new Error('decision fehlt: '+slug);backup(file);raw=raw.slice(0,i)+'\n'+block+'\n'+raw.slice(i+1);fs.writeFileSync(file,raw);console.log(`[${PATCH}] Evidence ergänzt: ${slug}`);return true;}
function hardenQueue(){if(!fs.existsSync(queueFile))return;let raw=fs.readFileSync(queueFile,'utf8'),orig=raw;if(!raw.includes('if (ev.constrained) return "HOLD";')){raw=raw.replace('const classifyLane = (search, ctx, ev) => {\n  const hasSearch','const classifyLane = (search, ctx, ev) => {\n  if (ev.constrained) return "HOLD";\n  const hasSearch');}if(raw!==orig){backup(queueFile);fs.writeFileSync(queueFile,raw);console.log(`[${PATCH}] HOLD-Regel gehärtet`);}else console.log(`[${PATCH}] HOLD-Regel bereits vorhanden oder lokale Version abweichend`);}
function run(label,cmd,args){console.log(`[${PATCH}] Prüfe: ${label}`);const r=spawnSync(cmd,args,{cwd:root,stdio:'inherit'});if(r.status!==0)throw new Error(`${label} fehlgeschlagen (Exit ${r.status})`);console.log(`[${PATCH}] BESTANDEN: ${label}`);}

let changed=0;for(const [slug,block] of Object.entries(blocks))if(add(slug,block))changed++;
hardenQueue();
run('Evidence-Audit','npm',['--workspace','apps/pfotentechnik','run','audit:product-evidence']);
run('BACKLOG-Queue','npm',['--workspace','apps/pfotentechnik','run','product-evidence:research','--','--limit=10','--lane=BACKLOG']);
console.log(`[${PATCH}] Abgeschlossen. Geändert: ${changed}`);
console.log(`[${PATCH}] Vollständig: IMIPAW 3L, Litter-Robot 5 Pro, Neakasa M1 Plus.`);
console.log(`[${PATCH}] Constrained: HoneyGuardian S305D, Neakasa M1 Lite, oneisall 2,2L.`);
console.log(`[${PATCH}] Bereits constrained und nicht erneut angefasst: Cat Mate 335, Devoko 90L, Garmin Alpha TT25, HoneyGuardian A305D.`);
console.log(`[${PATCH}] Backup: ${path.relative(root,backupDir)}`);

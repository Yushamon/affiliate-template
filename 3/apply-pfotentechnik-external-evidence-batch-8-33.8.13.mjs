#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-external-evidence-batch-8-33.8.13";
const root = process.cwd();
const app = path.join(root, "apps", "pfotentechnik");
const productDir = path.join(app, "src", "content", "products");
const backupDir = path.join(root, ".patch-backups", `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`);

if (!fs.existsSync(productDir)) {
  throw new Error(`[${PATCH}] Produktverzeichnis nicht gefunden: ${productDir}`);
}

fs.mkdirSync(backupDir, { recursive: true });

const changed = [];
const skipped = [];
const originals = new Map();

function fileFor(slug) {
  return path.join(productDir, `${slug}.md`);
}
function read(slug) {
  const f = fileFor(slug);
  if (!fs.existsSync(f)) throw new Error(`[${PATCH}] Datei fehlt: ${path.relative(root, f)}`);
  return fs.readFileSync(f, "utf8");
}
function saveOriginal(slug, raw) {
  if (originals.has(slug)) return;
  originals.set(slug, raw);
  fs.writeFileSync(path.join(backupDir, `${slug}.md`), raw);
}
function write(slug, raw) {
  const f = fileFor(slug);
  fs.writeFileSync(f, raw);
  changed.push(slug);
  console.log(`[${PATCH}] Evidence aktualisiert: ${slug}`);
}
function insertBeforeDecision(raw, block) {
  if (!/^decision:\s*$/m.test(raw)) throw new Error("decision:-Anker fehlt");
  return raw.replace(/^decision:\s*$/m, `${block}\ndecision:`);
}
function replaceProfessionalEmpty(raw, block) {
  if (!/externalEvidence:\s*\n\s+professionalReviews:\s*\[\]\s*\n/m.test(raw)) {
    throw new Error("professionalReviews: [] nicht gefunden");
  }
  return raw.replace(
    /externalEvidence:\s*\n\s+professionalReviews:\s*\[\]\s*\n/m,
    `externalEvidence:\n${block}\n`
  );
}
function ensureMissingEvidence(slug, block) {
  const raw = read(slug);
  if (/^externalEvidence:\s*$/m.test(raw)) {
    skipped.push(`${slug}: externalEvidence existiert bereits`);
    console.log(`[${PATCH}] Übersprungen, externalEvidence bereits vorhanden: ${slug}`);
    return;
  }
  saveOriginal(slug, raw);
  write(slug, insertBeforeDecision(raw, block));
}
function updateCatitVision() {
  const slug = "catit-pixi-vision-smart-feeder";
  const raw = read(slug);
  if (/publisher:\s*"The Catington Post"/.test(raw)) {
    skipped.push(`${slug}: Professional Review bereits vorhanden`);
    console.log(`[${PATCH}] Bereits aktualisiert: ${slug}`);
    return;
  }
  saveOriginal(slug, raw);
  const professional = `  professionalReviews:
    - publisher: "The Catington Post"
      title: "Review: Catit PIXI Smart Products Make Life Easier (and Cuter!) for Cat Parents"
      url: "https://catingtonpost.com/review-catit-pixi-smart-products/"
      checkedAt: "2026-08-11"
      methodology: "hands-on-editorial-review"
      positives:
        - "Der Autor beschreibt eine einfache Einrichtung des PIXI Vision über die Catit-App."
        - "Kameraqualität und Nachtsicht werden im praktischen Einsatz ausdrücklich positiv bewertet."
        - "Der Feeder wird im Vergleich zu anderen selbst genutzten Smart Feedern als funktionsreich und zuverlässig eingeordnet."
      negatives:
        - "Die Quelle liefert nur eine einzelne Hands-on-Perspektive und keine belastbare Langzeitstichprobe."
      findings:
        - "Die Quelle beschreibt persönlichen Einsatz mit einer älteren Katze und bewertet insbesondere Einrichtung, Kamera, Nachtsicht und Alltagskomfort."`;
  write(slug, replaceProfessionalEmpty(raw, professional));
}

const blocks = {
  "aqara-smart-pet-feeder-c1": `externalEvidence:
  professionalReviews:
    - publisher: "c't Magazin · via Testberichte-Aggregation"
      title: "Aqara Smart Pet Feeder C1"
      url: "https://www.testbericht.de/produkte/aqara-smart-pet-feeder-c1"
      checkedAt: "2026-08-11"
      methodology: "professional-magazine-review-summary"
      positives:
        - "Die zusammengefasste c't-Einordnung beschreibt den C1 als eleganten und zuverlässigen Trockenfutterautomaten."
        - "Die Einbindung in das Aqara-Smart-Home wird als zentrale Stärke hervorgehoben."
      negatives:
        - "Die öffentlich zugängliche Zusammenfassung ersetzt nicht den vollständigen Originaltest und begrenzt die Detailtiefe."
      findings:
        - "Die Fachmagazin-Einordnung stützt die bestehende Bewertung der Smart-Home-Integration und Zuverlässigkeit, ohne einen eigenen PfotenTechnik-Test zu implizieren."
  userReviews:
    - platform: "Alza"
      url: "https://www.alza.de/bewertungen/aqara-smart-pet-feeder-c1-7597970.htm"
      checkedAt: "2026-08-11"
      rating: 4.0
      scale: 5
      reviewCount: 9
      recurringPositives:
        - "Verifizierte Käufer nennen zuverlässige Futterausgabe und gute Smart-Home-Integration."
        - "Mehrere Rückmeldungen loben die Alltagstauglichkeit für regelmäßige Fütterungen."
      recurringCriticism:
        - "Die fehlende echte Napfwaage beziehungsweise Verbrauchsmessung wird kritisiert."
        - "Einzelne Nutzer nennen Grenzen bei HomeKit/Home-Assistant- beziehungsweise Offline-Szenarien."
  consensus:
    strengths:
      - finding: "Zuverlässige Futterausgabe und die Integration in das Aqara-Ökosystem sind die am klarsten wiederkehrenden Stärken."
        sourceCount: 2
        confidence: "medium"
    weaknesses:
      - finding: "Der Mehrwert hängt stark vom vorhandenen Aqara-Setup ab; eine echte Gewichtsmessung des gefressenen Futters fehlt."
        sourceCount: 2
        confidence: "medium"
    editorialAssessment: >-
      Professionelle und verifizierte Nutzersignale stützen die Smart-Home-Stärken des C1. Die professionelle Quelle
      ist öffentlich nur als Testzusammenfassung zugänglich, daher bleibt die Confidence bewusst unter high.
  note: >-
    Herstellerangaben werden nicht als unabhängige Bewertung gezählt. Redaktioneller PfotenTechnik-Score und ratings bleiben unverändert.`,

  "cat-mate-c200": `externalEvidence:
  professionalReviews:
    - publisher: "Reviewed"
      title: "Cat Mate C200 Wet Food Automatic Feeder Review"
      url: "https://www.reviewed.com/pets/content/cat-mate-c200-review-automatic-cat-feeder-wet-food"
      checkedAt: "2026-08-11"
      methodology: "hands-on-editorial-review"
      positives:
        - "Im persönlichen Einsatz löste der C200 zuverlässig die zeitversetzte Nassfutter-Fütterung."
        - "Die geschlossene Konstruktion wird als schwer von der Katze vorzeitig zu öffnen beschrieben."
      negatives:
        - "Der mechanische Timer ist nur grob einstellbar und läuft hörbar tickend."
        - "Der Kühlakku hält laut Hands-on-Erfahrung nur einige Stunden und ist keine Lösung für lange Nassfutter-Zeiträume."
      findings:
        - "Der Review basiert auf konkreter Nutzung mit einer Katze und bewertet Timer, Kühlung, Einbruchsicherheit und Alltagstauglichkeit."
    - publisher: "The Spruce Pets"
      title: "The Best Automatic Cat Feeders Tested With Real Cats"
      url: "https://www.thesprucepets.com/best-automatic-cat-feeders-4175145"
      checkedAt: "2026-08-11"
      methodology: "comparative-lab-and-home-testing"
      positives:
        - "Der C200 wird als besonders portable Lösung für Nass- oder Trockenfutter eingeordnet."
        - "Batteriebetrieb, geringes Gewicht und die Möglichkeit für Kühlakkus werden positiv bewertet."
      negatives:
        - "Der Timer ist weniger präzise als bei moderneren automatischen Futterautomaten."
      findings:
        - "Die Vergleichsredaktion testete automatische Futterautomaten im Labor und anschließend in Haushalten mit echten Tieren."
  userReviews:
    - platform: "Chewy"
      url: "https://www.chewy.com/cat-mate-c200-2-bowl-automatic-dog/product-reviews/103147"
      checkedAt: "2026-08-11"
      rating: 4.0
      scale: 5
      reviewCount: 387
      recurringPositives:
        - "Viele Nutzer beschreiben den C200 als einfache und zuverlässige Lösung für zeitgesteuerte Mahlzeiten."
        - "Besonders häufig wird die Eignung für Nassfutter und frühe Morgenfütterungen positiv erwähnt."
      recurringCriticism:
        - "Kritik betrifft die begrenzte Präzision des mechanischen Timers und die einfache Konstruktion."
  consensus:
    strengths:
      - finding: "Der C200 ist besonders stark, wenn eine einfache, batteriebetriebene und appfreie Lösung für ein bis zwei zeitversetzte Mahlzeiten gesucht wird."
        sourceCount: 3
        confidence: "high"
    weaknesses:
      - finding: "Timerpräzision und Kühlleistung setzen klare Grenzen; für lange Abwesenheiten mit Nassfutter ist das Konzept nicht gedacht."
        sourceCount: 3
        confidence: "high"
    editorialAssessment: >-
      Zwei unabhängige Hands-on-/Vergleichsquellen und eine große produktspezifische Nutzerbasis ergeben für den C200
      eine vergleichsweise belastbare externe Evidenz.
  note: >-
    Externe Nutzerbewertungen werden nicht in den PfotenTechnik-Score eingerechnet.`,

  "cat-mate-335-pet-fountain": `externalEvidence:
  constrained: true
  professionalReviews: []
  userReviews: []
  consensus: []
  constraintReason: >-
    Für das konkrete Modell Cat Mate Pet Fountain 335 ließ sich im aktuellen Recherchelauf keine ausreichend belastbare
    Kombination aus unabhängigem professionellem Review und produktspezifischer Nutzerbasis verifizieren.
  note: >-
    Die Lücke wird bewusst dokumentiert. Händlertexte, Herstellerangaben oder Bewertungen anderer Cat-Mate-Brunnen
    werden nicht auf das Modell 335 übertragen.`,

  "devoko-90l-automatisches-katzenklo": `externalEvidence:
  constrained: true
  professionalReviews: []
  userReviews:
    - platform: "Desertcart · weitergereichte Marketplace-Bewertungen"
      url: "https://www.desertcart.in/products/765634740-90l-self-cleaning-cat-litter-tray-app-control-6-safety-sensors-easy-clean-litter-robot-extra-large-litter-boxes-for-multiple-cats-anti-pinch-smart-robot-automatic-cat-litter-tray-for-multi-cats"
      checkedAt: "2026-08-11"
      rating: 4.4
      scale: 5
      reviewCount: 290
      recurringPositives:
        - "Positive Berichte nennen weniger tägliches Schaufeln, große Nutzfläche und funktionierende Sicherheitssensoren."
        - "Mehrere Nutzer beschreiben die automatische Reinigung als deutliche Alltagserleichterung."
      recurringCriticism:
        - "Ein ausführlicher Langzeitbericht nennt wiederkehrende WLAN-Abbrüche, schwache App-Nutzung und Geruchsprobleme nach mehreren Monaten."
        - "Die Herkunft und Moderation der weitergereichten Marketplace-Bewertungen ist nicht so transparent wie bei einer direkten Händlerplattform."
  consensus: []
  constraintReason: >-
    Eine große Nutzerstichprobe ist auffindbar, aber keine belastbare unabhängige professionelle Review-Quelle des
    konkreten Devoko-90L-Modells. Deshalb wird kein Consensus konstruiert.
  note: >-
    Die Nutzerquelle wird als eingeschränkt belastbar markiert; keine Hersteller- oder Marketplace-Aussage wird als
    professioneller Test ausgegeben.`,

  "enabot-ebo-air-2": `externalEvidence:
  professionalReviews:
    - publisher: "Digital Camera World"
      title: "Enabot Ebo Air 2 review: a companion robot that can keep an eye on your home, pets, and people"
      url: "https://www.digitalcameraworld.com/cameras/security-cameras/enabot-ebo-air-2-review"
      checkedAt: "2026-08-11"
      methodology: "hands-on-editorial-review"
      positives:
        - "Der mobile Fernzugriff und die Perspektive auf Bodenhöhe werden als praktisch für Haustiere und Heimüberwachung bewertet."
        - "Video- und Interaktionsfunktionen machen den EBO Air 2 zu mehr als einer stationären Kamera."
      negatives:
        - "Der Review beschreibt das Gerät eher als ferngesteuerten Kamera-Roboter als als wirklich autonomen Companion."
        - "Die Patrol-Funktion wird als weniger nützlich eingeordnet."
      findings:
        - "Die Quelle bewertet das konkrete Air-2-Modell im praktischen Einsatz und trennt klar zwischen Fernsteuerung und Autonomie."
  userReviews:
    - platform: "Chewy"
      url: "https://www.chewy.com/enabot-ebo-air-2-pet-camera/dp/1771910"
      checkedAt: "2026-08-11"
      rating: 4.3
      scale: 5
      reviewCount: 8
      recurringPositives:
        - "Nutzer loben die klare Kamera, Fernsteuerung und die Interaktion mit Katzen."
        - "Laser- und Bewegungsfunktionen werden als unterhaltsam für Tiere beschrieben."
      recurringCriticism:
        - "Die produktspezifische Stichprobe ist noch klein und eignet sich nicht für starke Langzeitaussagen."
  consensus:
    strengths:
      - finding: "Mobile Kamera, Fernsteuerung und direkte Interaktion mit Haustieren sind die klaren Stärken des EBO Air 2."
        sourceCount: 2
        confidence: "medium"
    weaknesses:
      - finding: "Der Air 2 ist stärker als ferngesteuerte mobile Kamera denn als autonomer Haushaltsroboter; die Nutzerbasis ist noch klein."
        sourceCount: 2
        confidence: "medium"
    editorialAssessment: >-
      Ein belastbarer Hands-on-Review und produktspezifische Käuferberichte stützen die Kernfunktionen. Für Aussagen zur
      Langzeitzuverlässigkeit bleibt die Datenbasis noch zu klein.
  note: >-
    Bewertungen des EBO Air 2 Plus oder EBO X werden nicht auf den EBO Air 2 übertragen.`,

  "furbo-360-hundekamera": `externalEvidence:
  professionalReviews:
    - publisher: "WIRED"
      title: "Review: Furbo 360 Dog Camera"
      url: "https://www.wired.com/review/furbo-360-dog-camera/"
      checkedAt: "2026-08-11"
      methodology: "hands-on-editorial-review"
      positives:
        - "360-Grad-Drehung und Auto Dog Tracking erweitern die Abdeckung gegenüber dem Vorgänger deutlich."
        - "1080p-Bild und Farbnachtsicht werden als klar und praktisch beschrieben."
      negatives:
        - "Die App wird als ausbaufähig bewertet."
        - "Mehrere erweiterte Funktionen liegen hinter dem optionalen Dog-Nanny-Abonnement."
      findings:
        - "WIRED bewertete das konkrete 360-Modell mit 9/10 und beschreibt praktische Nutzung mit Hunden."
    - publisher: "Digital Camera World"
      title: "Furbo 360 Dog camera review"
      url: "https://www.digitalcameraworld.com/reviews/furbo-360-dog-camera-review"
      checkedAt: "2026-08-11"
      methodology: "hands-on-editorial-review"
      positives:
        - "Bild, Audio, App-Bedienung und Funktionsumfang werden insgesamt positiv bewertet."
        - "Der Leckerliwerfer ist im passenden Größenbereich praktisch und unterhaltsam."
      negatives:
        - "Die Kamera kann nicht vertikal neigen."
        - "Rotation kann hörbar sein und die Leckerliausgabe ist je nach Form und Größe ungleichmäßig."
      findings:
        - "Der praktische Test nennt klare Grenzen bei Rotation, Treat-Tossing und Preis trotz insgesamt starker Bewertung."
  userReviews:
    - platform: "Trustpilot · Furbo markenweit"
      url: "https://www.trustpilot.com/review/furbo.com"
      checkedAt: "2026-08-11"
      rating: null
      scale: 5
      reviewCount: null
      recurringPositives:
        - "Aktuelle markenweite Rezensionen nennen 360-Ansicht, Treat-Tossing und das beruhigende Fernmonitoring positiv."
      recurringCriticism:
        - "Kritik betrifft Software, Support und den wahrgenommenen Wert des Furbo-Nanny-Abonnements."
  consensus:
    strengths:
      - finding: "360-Grad-Abdeckung, brauchbare Bildqualität und Treat-Tossing sind über unabhängige Tests hinweg die zentralen Stärken."
        sourceCount: 2
        confidence: "high"
    weaknesses:
      - finding: "Abo-Abhängigkeit für Premiumfunktionen, fehlende vertikale Neigung und gelegentlich ungleichmäßige Leckerliausgabe sind wiederkehrende Grenzen."
        sourceCount: 3
        confidence: "medium"
    editorialAssessment: >-
      Die professionelle Evidenz ist stark. Das Nutzersignal ist bewusst nur markenweit gekennzeichnet und wird nicht
      als produktspezifischer Sterne-Score ausgegeben.
  note: >-
    Trustpilot wird ausschließlich als markenweites Erfahrungssignal genutzt. Die externe Evidenz verändert den
    redaktionellen PfotenTechnik-Score nicht.`,

  "garmin-alpha-t-20": `externalEvidence:
  professionalReviews:
    - publisher: "Treeline Review"
      title: "Best GPS Dog Collars of 2026"
      url: "https://www.treelinereview.com/gearreviews/best-gps-dog-collars"
      checkedAt: "2026-08-11"
      methodology: "comparative-hands-on-testing"
      positives:
        - "Im Vergleichstest hatte der Alpha T 20 die schnellste Verbindungsaufnahme der getesteten GPS-Halsbänder."
        - "Dynamische Aktualisierung und Off-grid-Funk machen das Modell besonders für weit laufende Arbeits- und Jagdhunde interessant."
      negatives:
        - "Das Halsband wird als relativ sperrig beschrieben."
        - "Für die vollständige Nutzung ist ein separates kompatibles Garmin-Handgerät nötig."
      findings:
        - "Der Test bewertet Verbindungsgeschwindigkeit, Laufzeit und Nutzung im Gelände mit einem Alpha-10-Handgerät."
  userReviews:
    - platform: "LivingActive"
      url: "https://www.livingactive.de/garmin-alpha-t-20-k-gps-hundehalsband"
      checkedAt: "2026-08-11"
      rating: 4.95
      scale: 5
      reviewCount: 9
      recurringPositives:
        - "Käufer loben Verarbeitung, einfache Nutzung und Reichweite gegenüber älteren Garmin-Systemen."
      recurringCriticism:
        - "Die Stichprobe ist klein und überwiegend sehr positiv, weshalb sie nur ergänzend gewertet wird."
    - platform: "Varuste.net · verifizierte Käufer"
      url: "https://varuste.net/en/tahdet.php?_id=125253"
      checkedAt: "2026-08-11"
      rating: null
      scale: 5
      reviewCount: 18
      recurringPositives:
        - "Mehrere verifizierte Käufer berichten von zuverlässigem Einsatz in unterschiedlichem Gelände."
      recurringCriticism:
        - "Einzelne Käufer berichten von deutlich geringerer realer Reichweite als der maximal beworbenen Distanz."
  consensus:
    strengths:
      - finding: "Schnelle Positionsupdates und robuste Off-grid-Ortung sind die stärksten wiederkehrenden Argumente für den Alpha T 20."
        sourceCount: 3
        confidence: "high"
    weaknesses:
      - finding: "Das System ist teuer und auf ein separates Garmin-Handgerät angewiesen; reale Funkreichweite kann im Gelände deutlich unter dem Maximalwert liegen."
        sourceCount: 3
        confidence: "high"
    editorialAssessment: >-
      Hands-on-Vergleich und zwei Käuferquellen liefern ein belastbares Bild für den Einsatz mit Arbeits- und Jagdhunden.
      Die maximale Herstellerreichweite wird ausdrücklich nicht als garantierte Praxisreichweite übernommen.
  note: >-
    Nutzerbewertungen und professionelle Tests bleiben vom redaktionellen PfotenTechnik-Score getrennt.`,

  "garmin-alpha-tt-25": `externalEvidence:
  constrained: true
  professionalReviews:
    - publisher: "Chien-de-chasse.net"
      title: "Test Garmin Alpha TT 25"
      url: "https://www.chien-de-chasse.net/test-garmin-alpha-tt-25-gps-collier-de-suivi-et-dentrainement-pour-chiens"
      checkedAt: "2026-08-11"
      methodology: "hands-on-editorial-review"
      positives:
        - "Der Test beschreibt präzise GPS-Ortung, schnelle Aktualisierung und robuste Verarbeitung im Gelände."
        - "Akkulaufzeit und Trainingsoptionen werden für Arbeits- und Jagdhunde positiv bewertet."
      negatives:
        - "Preis und notwendiges kompatibles Handgerät machen das System für normale Alltagsspaziergänge überdimensioniert."
      findings:
        - "Die Quelle ordnet das TT 25 ausdrücklich als spezialisiertes Arbeits- und Jagdhundewerkzeug ein."
  userReviews:
    - platform: "Chewy"
      url: "https://www.chewy.com/garmin-alpha-tt-25-gps-tracker/product-reviews/929070"
      checkedAt: "2026-08-11"
      rating: 5.0
      scale: 5
      reviewCount: 1
      recurringPositives:
        - "Die einzige verfügbare Chewy-Rezension bestätigt vollständigen Lieferumfang und einfache Kopplung."
      recurringCriticism: []
  consensus: []
  constraintReason: >-
    Ein professioneller Test ist vorhanden, die direkt produktspezifische Nutzerbasis ist mit nur einer Bewertung aber
    zu klein für einen belastbaren Consensus.
  note: >-
    Bewertungen verwandter Garmin-Modelle werden nicht auf das TT 25 übertragen.`,

  "honeyguardian-a305d": `externalEvidence:
  constrained: true
  professionalReviews: []
  userReviews: []
  consensus: []
  constraintReason: >-
    Für die konkrete Modellbezeichnung HoneyGuardian A305D konnte im aktuellen Recherchelauf keine hinreichend sichere
    unabhängige Review- und Nutzerquellenkombination verifiziert werden. Ähnliche HoneyGuardian-Modelle und Marketplace-
    Varianten werden nicht gleichgesetzt.
  note: >-
    Die Modellidentität hat Vorrang vor Vollständigkeit. Der Block bleibt bewusst leer, bis eine direkte belastbare Quelle vorliegt.`
};

const order = [
  "aqara-smart-pet-feeder-c1",
  "cat-mate-c200",
  "cat-mate-335-pet-fountain",
  "devoko-90l-automatisches-katzenklo",
  "enabot-ebo-air-2",
  "furbo-360-hundekamera",
  "garmin-alpha-t-20",
  "garmin-alpha-tt-25",
  "honeyguardian-a305d"
];

try {
  for (const slug of order) ensureMissingEvidence(slug, blocks[slug]);
  updateCatitVision();

  const testFile = path.join(app, "test", "external-evidence-batch-8-33.8.13.test.mjs");
  const test = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
const app = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const read = (slug) => fs.readFileSync(path.join(app,"src/content/products",slug+".md"),"utf8");

test("Aqara, C200, Enabot, Furbo und T20 enthalten externe Evidenz", () => {
  for (const slug of ["aqara-smart-pet-feeder-c1","cat-mate-c200","enabot-ebo-air-2","furbo-360-hundekamera","garmin-alpha-t-20"]) {
    const s=read(slug);
    assert.match(s,/externalEvidence:/);
    assert.match(s,/professionalReviews:/);
    assert.match(s,/userReviews:/);
    assert.match(s,/consensus:/);
  }
});
test("Catit PIXI Vision enthält den fehlenden Professional Review", () => {
  assert.match(read("catit-pixi-vision-smart-feeder"),/publisher: "The Catington Post"/);
});
test("unsichere Quellenlagen bleiben constrained", () => {
  for (const slug of ["cat-mate-335-pet-fountain","devoko-90l-automatisches-katzenklo","garmin-alpha-tt-25","honeyguardian-a305d"]) {
    assert.match(read(slug),/constrained: true/);
  }
});
test("PfotenTechnik-Ratings bleiben vorhanden", () => {
  for (const slug of ["aqara-smart-pet-feeder-c1","cat-mate-c200","catit-pixi-vision-smart-feeder","enabot-ebo-air-2","furbo-360-hundekamera","garmin-alpha-t-20"]) {
    assert.match(read(slug),/^rating:\\s*[0-9.]+$/m);
    assert.match(read(slug),/^ratings:\\s*$/m);
  }
});
`;
  fs.writeFileSync(testFile, test);

  const run = (label, cmd, args, cwd=root) => {
    console.log(`[${PATCH}] Prüfe: ${label}`);
    const r = spawnSync(cmd,args,{cwd,stdio:"inherit",shell:false});
    if (r.status !== 0) throw new Error(`${label} fehlgeschlagen (Exit ${r.status})`);
    console.log(`[${PATCH}] BESTANDEN: ${label}`);
  };

  run("Test-Syntax", process.execPath, ["--check", testFile]);
  run("Batch-Test", process.execPath, ["--test", testFile]);

  const auditScript = path.join(app,"scripts","product-evidence","audit.mjs");
  if (fs.existsSync(auditScript)) {
    run("Evidence-Audit", process.execPath, [auditScript]);
  }

  const queueScript = path.join(app,"scripts","product-evidence","research-queue.mjs");
  if (fs.existsSync(queueScript)) {
    run("NOW-Queue", process.execPath, [queueScript,"--limit=10","--lane=NOW"]);
    run("WATCH-Queue", process.execPath, [queueScript,"--limit=10","--lane=WATCH"]);
    run("HOLD-Queue", process.execPath, [queueScript,"--limit=10","--lane=HOLD"]);
    run("BACKLOG-Queue", process.execPath, [queueScript,"--limit=10","--lane=BACKLOG"]);
  }

  console.log(`[${PATCH}] Abgeschlossen. Geändert: ${changed.length}; übersprungen: ${skipped.length}.`);
  console.log(`[${PATCH}] Vollständig angelegt/ergänzt: Aqara C1, Cat Mate C200, Catit PIXI Vision, Enabot EBO Air 2, Furbo 360, Garmin Alpha T20.`);
  console.log(`[${PATCH}] Bewusst constrained: Cat Mate 335, Devoko 90L, Garmin Alpha TT25, HoneyGuardian A305D.`);
  console.log(`[${PATCH}] Backup: ${path.relative(root, backupDir)}`);
} catch (err) {
  console.error(`[${PATCH}] FEHLER: ${err.message}`);
  for (const [slug, raw] of originals) fs.writeFileSync(fileFor(slug), raw);
  console.error(`[${PATCH}] Änderungen an Produkt-MDs wurden zurückgerollt.`);
  process.exit(1);
}

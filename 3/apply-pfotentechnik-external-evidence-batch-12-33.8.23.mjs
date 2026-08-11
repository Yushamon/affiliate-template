#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-external-evidence-batch-12-33.8.23";
const root = process.cwd();
const app = path.join(root, "apps", "pfotentechnik");
const productsDir = path.join(app, "src", "content", "products");
const testDir = path.join(app, "test");
const backupRoot = path.join(root, ".patch-backups");
const stamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
const backupDir = path.join(backupRoot, `${PATCH}-${stamp}`);

const products = {
  "petlibro-scout-smart-camera": `externalEvidence:
  professionalReviews:
    - publisher: "WIRED"
      title: "Petlibro Scout Smart Camera: Filled With Both Features and Kinks"
      url: "https://www.wired.com/review/petlibro-scout-smart-camera/"
      checkedAt: "2026-08-11"
      methodology: "hands-on-editorial-review"
      positives:
        - "Der Hands-on-Test lobt das klare 1080p-Bild, die intuitive App, flexible Montage und die automatische Schwenk- und Neigefunktion."
        - "Die Kamera kann mehrere Haustiere unterscheiden und Aufnahmen nach Tier und Aktivität organisieren."
      negatives:
        - "Die entscheidenden AI-Funktionen liegen hinter einem vergleichsweise teuren Abonnement."
        - "Im Test traten mehrtägige Ausfälle bei Tracking, Aktivitätsprotokoll und gespeicherten Clips auf."
        - "WIRED kritisiert die Cloud-Abhängigkeit und unklare Datenschutzaspekte."
      findings:
        - "Der Test lief zunächst ohne, anschließend mit bezahltem AI-Abo und dokumentiert konkrete Funktionsausfälle nach dem Upgrade."
  userReviews:
    - platform: "Chewy"
      url: "https://www.chewy.com/petlibro-scout-smart-pet-camera-ai/product-reviews/2289534"
      checkedAt: "2026-08-11"
      rating: 4.3
      scale: 5
      reviewCount: 22
      recurringPositives:
        - "Käufer loben Bildqualität, einfache Bedienung und den Live-Zugriff von unterwegs."
      recurringCriticism:
        - "Mehrere Rückmeldungen beschreiben unzuverlässige Bewegungs- beziehungsweise Ereigniserkennung und Lücken in der Video-Historie."
  consensus:
    strengths:
      - finding: "Bildqualität, Live-Zugriff und die übersichtliche App sind die am besten gestützten Stärken."
        sourceCount: 2
        confidence: "high"
    weaknesses:
      - finding: "AI-Mehrwert und Ereigniserkennung sind weniger zuverlässig als die Basiskamera; der volle Funktionsumfang ist zudem abonnementabhängig."
        sourceCount: 2
        confidence: "high"
    editorialAssessment: >-
      Professioneller Hands-on-Test und produktspezifische Nutzerberichte stimmen beim guten Kamerabild überein,
      zeigen aber zugleich Schwächen bei Tracking, Historie und AI-Zuverlässigkeit. Langzeitzuverlässigkeit bleibt offen.
  note: >-
    Die externe Evidenz bezieht sich auf die PETLIBRO Scout Smart Camera; Aussagen zu anderen PETLIBRO-Kameras
    wurden nicht übertragen.`,

  "petsafe-healthy-pet-simply-feed": `externalEvidence:
  professionalReviews:
    - publisher: "KittyClysm"
      title: "PetSafe Healthy Pet Simply Feed Automatic Cat & Dog Feeder Review"
      url: "https://kittyclysm.com/petsafe-healthy-pet-simply-feed-automatic-feeder-review/"
      checkedAt: "2026-08-11"
      methodology: "owner-hands-on-review"
      positives:
        - "Der Autor berichtet nach mehr als einem Monat Nutzung von zuverlässiger automatischer Fütterung und guter Eignung für mehrere kleine Mahlzeiten."
        - "Die feine Portionierung und der große Vorrat werden als alltagstauglich beschrieben."
      negatives:
        - "Die Programmierung wird als wenig intuitiv beschrieben."
        - "Noch kleinere Portionsschritte wären für einzelne Katzen wünschenswert."
  userReviews:
    - platform: "Chewy"
      url: "https://www.chewy.com/petsafe-healthy-pet-simply-feed/product-reviews/126449"
      checkedAt: "2026-08-11"
      rating: 4.0
      scale: 5
      reviewCount: 487
      recurringPositives:
        - "Wiederkehrend gelobt werden zuverlässige Zeitpläne, große Kapazität und lange Nutzungsdauer."
        - "Viele Käufer schätzen, dass das Gerät ohne App funktioniert."
      recurringCriticism:
        - "Programmierung und kleine Anzeige werden wiederholt als umständlich beschrieben."
        - "Einzelne Tiere können den Mechanismus manipulieren; ungeeignetes oder zu großes Futter kann den Auslass blockieren."
  consensus:
    strengths:
      - finding: "Zuverlässige Zeitpläne, große Kapazität und flexible Portionierung sind über Hands-on- und Nutzerquellen gut gestützt."
        sourceCount: 2
        confidence: "high"
    weaknesses:
      - finding: "Die Bedienoberfläche ist weniger intuitiv als bei App-Feedern und der Futtertyp muss zum Ausgabemechanismus passen."
        sourceCount: 2
        confidence: "high"
    editorialAssessment: >-
      Die große Nutzerbasis und ein modellbezogener Hands-on-Bericht stützen die Kernfunktion deutlich.
      Kritik konzentriert sich auf Programmierung, Geräusch, Manipulationsversuche einzelner Tiere und Futterkompatibilität.`,

  "petsafe-mikrochip-katzenklappe": `externalEvidence:
  professionalReviews:
    - publisher: "Haus & Garten Test"
      title: "PetSafe Microchip Cat Flap"
      url: "https://www.testbericht.de/produkte/petsafe-microchip-cat-flap"
      checkedAt: "2026-08-11"
      methodology: "independent-comparative-test-reported-by-testbericht.de"
      positives:
        - "Der dokumentierte Test bewertet Anlernen, Zugangskontrolle und Bedienung sehr positiv."
        - "Die Klappe erreichte laut Testbericht.de in Haus & Garten Test 01/2026 Platz 1 von 3."
      negatives:
        - "Die Fachtest-Zusammenfassung bildet keine belastbare Langzeitbeobachtung ab."
      findings:
        - "Die positive Fachtest-Einordnung steht im deutlichen Kontrast zu einem Teil der neueren Nutzerberichte."
  userReviews:
    - platform: "Zooplus"
      url: "https://www.zooplus.com/feedback/shop/cats/cat_flaps_nets/microchip_cat_flaps/663246"
      checkedAt: "2026-08-11"
      rating: 3.0
      scale: 5
      reviewCount: 198
      recurringPositives:
        - "Ein Teil der Nutzer berichtet von einfacher Einrichtung und zuverlässiger Abwehr fremder Katzen."
      recurringCriticism:
        - "Wiederkehrend genannt werden ausbleibendes Entriegeln, Probleme bei der Chiperkennung und mechanische Verriegelungsfehler."
        - "Mehrere neuere Berichte kritisieren Batterieverbrauch und nachlassende Zuverlässigkeit."
  consensus:
    strengths:
      - finding: "Wenn Chiperkennung und Verriegelung korrekt arbeiten, erfüllt die Klappe den vorgesehenen selektiven Zutritt."
        sourceCount: 2
        confidence: "medium"
    weaknesses:
      - finding: "Die Langzeit- und Nutzererfahrung ist deutlich gemischter als die Fachtest-Einordnung; Entriegelung und Chiperkennung sind die zentralen Risikopunkte."
        sourceCount: 2
        confidence: "high"
    editorialAssessment: >-
      Die Quellen widersprechen sich substanziell: Der Fachtest bewertet Funktion und Bedienung sehr gut,
      während die deutlich größere Nutzerbasis zahlreiche Ausfälle der Kernfunktion meldet. Dieser Widerspruch darf
      nicht zu einem pauschal positiven Urteil geglättet werden.
  note: >-
    Die professionelle Quelle ist über Testbericht.de dokumentiert; die Originalausgabe von Haus & Garten Test
    wurde nicht als frei zugängliche Vollquelle ausgewertet.`,

  "petsafe-petporte-smart-flap": `externalEvidence:
  professionalReviews:
    - publisher: "Tailster"
      title: "PetSafe Petporte Smart Flap Microchip Cat Flap Review"
      url: "https://content.tailster.com/petsafe-petporte-smart-flap-review/"
      checkedAt: "2026-08-11"
      methodology: "editorial-product-review"
      positives:
        - "Der Review bewertet Verarbeitung, Einrichtung sowie die Wahl zwischen Netz- und Batteriebetrieb positiv."
        - "Die flexible Vier-Wege-Steuerung und die hohe Zahl speicherbarer Chips werden als Pluspunkte genannt."
      negatives:
        - "Die einzelne Scan-/Verriegelungslösung wird gegenüber sichereren Dual-Scan-Systemen als Schwäche bewertet."
        - "Der Review nennt gelegentliches Nicht-Einrasten der Klappe und den nicht abschaltbaren Signalton als Nachteile."
  userReviews: []
  consensus:
    strengths:
      - finding: "Netzbetrieb mit Backup-Option, solide Verarbeitung und grundlegende Mikrochip-Zugangskontrolle sind plausibel und im Review konkret beschrieben."
        sourceCount: 1
        confidence: "medium"
    weaknesses:
      - finding: "Für Sicherheit gegen besonders geschickte Eindringlinge ist die ältere Single-Scan-Konstruktion schwächer als moderne Dual-Scan-Lösungen."
        sourceCount: 1
        confidence: "medium"
    editorialAssessment: >-
      Es liegt ein konkreter unabhängiger Modellreview vor, aber keine ausreichend belastbare aktuelle,
      produktspezifische Nutzerbasis mit sauber erfassbarem Rating und Review-Count. Deshalb bleibt die Evidenz bewusst unvollständig.
  status: constrained
  constrained: true
  note: >-
    Kein belastbarer produktspezifischer User-Review-Datensatz mit Rating, Skala und Review-Anzahl gefunden; kein künstlicher Consensus aus Händlertexten.`,

  "petsafe-smart-feed-2": `externalEvidence:
  professionalReviews:
    - publisher: "Tom's Guide"
      title: "PetSafe Smart Feed 2.0 review: The perfect feeder for busy pet parents"
      url: "https://www.tomsguide.com/reviews/petsafe-smart-feed"
      checkedAt: "2026-08-11"
      methodology: "hands-on-editorial-review"
      positives:
        - "Tom's Guide lobt einfache Bedienung, anpassbare Fütterungen und den großen Futterbehälter."
      negatives:
        - "Im Test war nicht jedes Trockenfutter mit dem Ausgabemechanismus kompatibel."
  userReviews:
    - platform: "Chewy"
      url: "https://www.chewy.com/petsafe-smart-feed-20-wifi-enabled/product-reviews/218595"
      checkedAt: "2026-08-11"
      rating: 3.9
      scale: 5
      reviewCount: 145
      recurringPositives:
        - "Viele Nutzer loben planbare Fütterungen, Fernsteuerung, Benachrichtigungen und große Kapazität."
        - "Mehrere Langzeitberichte nennen mehrjährige Nutzung."
      recurringCriticism:
        - "Wiederkehrend werden WLAN-Verbindungsprobleme, Neustarts und einzelne Ausgabefehler genannt."
        - "Die Ausgabe in den Edelstahlnapf wird als deutlich hörbar beschrieben."
  consensus:
    strengths:
      - finding: "App-Zeitpläne, Fernfütterung und große Kapazität sind über Review und Nutzerbasis gut belegt."
        sourceCount: 2
        confidence: "high"
    weaknesses:
      - finding: "WLAN-Stabilität und Futterkompatibilität sind die wichtigsten wiederkehrenden Einschränkungen."
        sourceCount: 2
        confidence: "high"
    editorialAssessment: >-
      Professioneller Test und große produktspezifische Nutzerbasis bestätigen den Komfortgewinn, zeigen aber,
      dass das Gerät nicht als ausfallsichere Lösung ohne Kontrolle betrachtet werden sollte.`,

  "petwalk-medium-tiertuer": `externalEvidence:
  professionalReviews: []
  userReviews: []
  status: constrained
  constrained: true
  note: >-
    Am 2026-08-11 wurde keine ausreichend belastbare unabhängige professionelle Review und keine produktspezifische
    Nutzerquelle mit sauber erfassbarem Rating, Skala und Review-Anzahl für die konkrete petWALK Medium Tiertür gefunden.
    Herstellerangaben werden deshalb nicht als externe Evidenz umgedeutet; ein Consensus wird bewusst nicht erzeugt.`,

  "surefeed-microchip-pet-feeder": `externalEvidence:
  professionalReviews:
    - publisher: "Tech Advisor"
      title: "Sure Petcare Microchip Pet Feeder review"
      url: "https://www.techadvisor.com/article/720358/sure-petcare-microchip-pet-feeder-review.html"
      checkedAt: "2026-08-11"
      methodology: "hands-on-editorial-review"
      positives:
        - "Der Review bewertet die selektive Futterfreigabe für Mehrtierhaushalte als best-in-class."
        - "Das Gerät wird besonders für getrennte Diäten und Schutz vor Futterdiebstahl empfohlen."
      negatives:
        - "Der hohe Preis wird ausdrücklich als wesentlicher Nachteil genannt."
  userReviews:
    - platform: "Zooplus"
      url: "https://www.zooplus.com/feedback/shop/cats/cat_bowls_feeders/feeders/479556?page=1"
      checkedAt: "2026-08-11"
      rating: 4.3
      scale: 5
      reviewCount: 1726
      recurringPositives:
        - "Viele Nutzer bestätigen den Nutzen bei Futterdiebstahl und unterschiedlichen Diäten."
      recurringCriticism:
        - "Einzelne geschickte Zweittiere können seitlich oder von hinten an Futter gelangen."
        - "Manche Katzen benötigen längere Eingewöhnung; Zubehör zur stärkeren Abschirmung kostet extra."
  consensus:
    strengths:
      - finding: "Die selektive Futterfreigabe löst das Problem unterschiedlicher Diäten in Mehrtierhaushalten nachweislich gut."
        sourceCount: 2
        confidence: "high"
    weaknesses:
      - finding: "Der hohe Preis und mögliche Umgehung durch sehr geschickte Zweittiere sind die wichtigsten Grenzen."
        sourceCount: 2
        confidence: "high"
    editorialAssessment: >-
      Der unabhängige Review und eine sehr große Nutzerbasis stützen den Kernnutzen deutlich. Das Produkt ersetzt
      dennoch keine vollständige räumliche Trennung, wenn ein zweites Tier den offenen Zugang mechanisch ausnutzt.`,

  "sureflap-dualscan-mikrochip-katzenklappe": `externalEvidence:
  professionalReviews:
    - publisher: "Tailster"
      title: "Sureflap Dual Scan Microchip Cat Flap Review"
      url: "https://content.tailster.com/sureflap-dualscan-microchip-cat-flap-review/"
      checkedAt: "2026-08-11"
      methodology: "editorial-product-review"
      positives:
        - "Der Review hebt selektive Ein- und Ausgangsrechte sowie die höhere Sicherheit gegenüber der Standard-Version hervor."
        - "Programmierung, Verarbeitung und Preis-Leistung werden positiv bewertet."
      negatives:
        - "Die Öffnung kann für große Katzen knapp sein."
        - "Verzögerte Entriegelung und das Klickgeräusch können einzelne Katzen stören."
  userReviews:
    - platform: "Zooplus"
      url: "https://www.zooplus.ie/feedback/shop/cats/cat_flaps_nets/microchip_cat_flaps/408870"
      checkedAt: "2026-08-11"
      rating: 4.8
      scale: 5
      reviewCount: 158
      recurringPositives:
        - "Die Mehrzahl der Nutzer bewertet Funktion und Einrichtung sehr positiv."
      recurringCriticism:
        - "Einzelne besonders geschickte Katzen können mechanische Sperren überwinden."
  consensus:
    strengths:
      - finding: "Selektive Ein- und Ausgangsrechte und die gegenüber der Standardklappe erhöhte Zutrittskontrolle sind gut gestützt."
        sourceCount: 2
        confidence: "high"
    weaknesses:
      - finding: "Größe, Entriegelungsgeräusch und mechanische Umgehung durch einzelne Tiere bleiben reale Grenzen."
        sourceCount: 2
        confidence: "medium"
    editorialAssessment: >-
      Professioneller Modellreview und produktspezifische Nutzerbasis ergeben insgesamt ein konsistentes positives Bild,
      ohne die mechanischen Grenzen elektronischer Katzenklappen zu überdecken.`,

  "sureflap-mikrochip-katzenklappe": `externalEvidence:
  professionalReviews:
    - publisher: "Tailster"
      title: "Sureflap Microchip Cat Flap Review"
      url: "https://content.tailster.com/sureflap-review/"
      checkedAt: "2026-08-11"
      methodology: "editorial-product-review"
      positives:
        - "Der Review lobt einfache Programmierung, solide Konstruktion und guten Alltagsnutzen."
      negatives:
        - "Sicherheitsniveau und Funktionsumfang liegen unter der DualScan-Version."
        - "Klickgeräusch, Magnetwiderstand und begrenzte Größe können einzelne Katzen stören."
  userReviews:
    - platform: "Zooplus"
      url: "https://www.zooplus.com/feedback/shop/cats/cat_flaps_nets/microchip_cat_flaps/138712"
      checkedAt: "2026-08-11"
      rating: 4.2
      scale: 5
      reviewCount: 2305
      recurringPositives:
        - "Sehr viele Nutzer bestätigen einfache Nutzung und wirksame Abwehr fremder Katzen."
      recurringCriticism:
        - "Neuere Berichte nennen gelegentliche Chiperkennungsprobleme, Batterieverschleiß, Zugluft und Feuchtigkeit."
  consensus:
    strengths:
      - finding: "Die einfache Mikrochip-Zugangskontrolle ist über professionellen Review und große Nutzerbasis breit gestützt."
        sourceCount: 2
        confidence: "high"
    weaknesses:
      - finding: "Langfristig treten bei einem Teil der Nutzer Probleme mit Erkennung, Batteriebedarf oder Witterungseinfluss auf."
        sourceCount: 2
        confidence: "medium"
    editorialAssessment: >-
      Die sehr große Nutzerbasis stützt den Grundnutzen, zeigt aber zugleich, dass Zuverlässigkeit und Witterungseinfluss
      stärker variieren als ein reiner Funktionscheck vermuten lässt.`,

  "sureflap-mikrochip-katzenklappe-connect": `externalEvidence:
  professionalReviews:
    - publisher: "Expert Reviews"
      title: "Sureflap Microchip Cat Flap Connect review: Keep tabs on tabbies"
      url: "https://www.expertreviews.co.uk/archived/sureflap-microchip-cat-flap-connect-review"
      checkedAt: "2026-08-11"
      methodology: "hands-on-editorial-review"
      positives:
        - "Der Review lobt App, Bewegungsprotokolle und Verarbeitungsqualität."
      negatives:
        - "Klappe plus notwendiger Hub werden als teuer bewertet."
        - "Aktivitätsstatistiken werden unvollständig, wenn Katzen alternative Ein- oder Ausgänge nutzen."
  userReviews:
    - platform: "Zooplus"
      url: "https://www.zooplus.com/feedback/shop/cats/cat_flaps_nets/sureflap/704236"
      checkedAt: "2026-08-11"
      rating: 3.9
      scale: 5
      reviewCount: 86
      recurringPositives:
        - "Viele Nutzer loben die Mikrochip-Zugangskontrolle und die zusätzliche Transparenz durch die App."
      recurringCriticism:
        - "Ein Teil der Nutzer meldet Funktionsausfälle, Installationsprobleme und unzureichende Dämmung."
  consensus:
    strengths:
      - finding: "App-Protokolle und Fernfunktionen erweitern die bewährte Mikrochip-Zugangskontrolle sinnvoll."
        sourceCount: 2
        confidence: "high"
    weaknesses:
      - finding: "Preis, Hub-Abhängigkeit und lückenhafte Aktivitätsdaten bei alternativen Wegen begrenzen den Mehrwert."
        sourceCount: 2
        confidence: "high"
    editorialAssessment: >-
      Professioneller Test und Nutzerberichte stützen den Smart-Mehrwert, zeigen aber klar, dass die Daten nur den
      tatsächlichen Durchgang durch diese eine Klappe abbilden und die Installation energetisch relevant sein kann.`
};

function run(cmd, args, cwd = root) {
  const r = spawnSync(cmd, args, { cwd, stdio: "inherit", shell: false });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(" ")} fehlgeschlagen (Exit ${r.status})`);
}

function backup(file) {
  const rel = path.relative(root, file);
  const target = path.join(backupDir, rel);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
}

function frontmatter(text) {
  if (!text.startsWith("---")) throw new Error("Frontmatter fehlt");
  const end = text.indexOf("\n---", 3);
  if (end < 0) throw new Error("Frontmatter-Ende fehlt");
  return { fm: text.slice(0, end + 1), rest: text.slice(end + 1) };
}

function insertEvidence(text, block) {
  const { fm, rest } = frontmatter(text);
  if (/^externalEvidence:\s*$/m.test(fm)) {
    throw new Error("externalEvidence ist bereits vorhanden; Batch 12 ersetzt oder doppelt vorhandene Evidenz nicht.");
  }

  const anchors = [
    /^decision:\s*$/m,
    /^review:\s*$/m,
    /^strengths:\s*$/m,
    /^weaknesses:\s*$/m,
    /^experience:\s*$/m,
    /^alternatives:\s*$/m,
    /^comparisons:\s*$/m,
    /^comparisonFilters:\s*$/m,
    /^specs:\s*$/m,
    /^features:\s*$/m,
    /^metadata:\s*$/m
  ];

  let idx = -1;
  for (const rx of anchors) {
    const m = rx.exec(fm);
    if (m && (idx < 0 || m.index < idx)) idx = m.index;
  }
  if (idx < 0) idx = fm.length;

  const before = fm.slice(0, idx).replace(/\s+$/, "");
  const after = fm.slice(idx).replace(/^\s+/, "");
  const merged = `${before}\n${block}\n${after}`;
  return merged + rest;
}

fs.mkdirSync(backupDir, { recursive: true });

const snapshots = new Map();
const changed = [];
try {
  for (const [slug, block] of Object.entries(products)) {
    const file = path.join(productsDir, `${slug}.md`);
    if (!fs.existsSync(file)) throw new Error(`Erwartete Produktdatei fehlt: ${path.relative(root, file)}`);

    const old = fs.readFileSync(file, "utf8");
    snapshots.set(file, old);

    const rating = old.match(/^rating:\s*[0-9.]+\s*$/m)?.[0] ?? null;
    const ratingsBlock = old.match(/^ratings:\s*(?:\{[^\n]*\}|\n(?:[ \t]+[^\n]+\n?)*)/m)?.[0] ?? null;

    backup(file);
    const next = insertEvidence(old, block);

    if (rating && !next.includes(rating)) throw new Error(`${slug}: rating wurde verändert`);
    if (ratingsBlock && !next.includes(ratingsBlock)) throw new Error(`${slug}: ratings wurden verändert`);

    fs.writeFileSync(file, next, "utf8");
    changed.push(slug);
    console.log(`[${PATCH}] Evidence ergänzt: ${slug}`);
  }

  const testFile = path.join(testDir, `external-evidence-batch-12-33.8.23.test.mjs`);
  const testSource = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const productsDir = path.join(root, "apps", "pfotentechnik", "src", "content", "products");
const complete = ${JSON.stringify([
    "petlibro-scout-smart-camera",
    "petsafe-healthy-pet-simply-feed",
    "petsafe-mikrochip-katzenklappe",
    "petsafe-smart-feed-2",
    "surefeed-microchip-pet-feeder",
    "sureflap-dualscan-mikrochip-katzenklappe",
    "sureflap-mikrochip-katzenklappe",
    "sureflap-mikrochip-katzenklappe-connect"
  ])};
const constrained = ${JSON.stringify([
    "petsafe-petporte-smart-flap",
    "petwalk-medium-tiertuer"
  ])};

const read = slug => fs.readFileSync(path.join(productsDir, slug + ".md"), "utf8");

test("vollständige Batch-12-Produkte besitzen alle Evidence-Bausteine", () => {
  for (const slug of complete) {
    const s = read(slug);
    assert.match(s, /^externalEvidence:\\s*$/m, slug);
    assert.match(s, /^  professionalReviews:\\s*$/m, slug);
    assert.match(s, /^  userReviews:\\s*$/m, slug);
    assert.match(s, /^  consensus:\\s*$/m, slug);
  }
});

test("schwache Quellenlagen sind constrained statt künstlich vollständig", () => {
  for (const slug of constrained) {
    const s = read(slug);
    assert.match(s, /^  constrained:\\s*true\\s*$/m, slug);
    assert.match(s, /^  status:\\s*constrained\\s*$/m, slug);
  }
});

test("PfotenTechnik-Ratings bleiben vorhanden", () => {
  for (const slug of [...complete, ...constrained]) {
    const s = read(slug);
    assert.match(s, /^rating:\\s*[0-9.]+\\s*$/m, slug);
    assert.match(s, /^ratings:\\s*(?:\\{|$)/m, slug);
  }
});

test("PetSafe Microchip dokumentiert Quellenwiderspruch", () => {
  const s = read("petsafe-mikrochip-katzenklappe");
  assert.match(s, /Quellen widersprechen sich substanziell/);
  assert.match(s, /reviewCount:\\s*198/);
});

test("Scout nutzt WIRED und Chewy", () => {
  const s = read("petlibro-scout-smart-camera");
  assert.match(s, /publisher: "WIRED"/);
  assert.match(s, /platform: "Chewy"/);
});
`;
  fs.writeFileSync(testFile, testSource, "utf8");
  console.log(`[${PATCH}] Regressionstest geschrieben: ${path.relative(root, testFile)}`);

  console.log(`[${PATCH}] Prüfe: Test-Syntax`);
  run(process.execPath, ["--check", testFile]);
  console.log(`[${PATCH}] BESTANDEN: Test-Syntax`);

  console.log(`[${PATCH}] Prüfe: Batch-Test`);
  run(process.execPath, ["--test", testFile]);
  console.log(`[${PATCH}] BESTANDEN: Batch-Test`);

  console.log(`[${PATCH}] Prüfe: Evidence-Audit`);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "audit:product-evidence"]);
  console.log(`[${PATCH}] BESTANDEN: Evidence-Audit`);

  console.log(`[${PATCH}] Prüfe: BACKLOG-Queue`);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "product-evidence:research", "--", "--limit=10", "--lane=BACKLOG"]);
  console.log(`[${PATCH}] BESTANDEN: BACKLOG-Queue`);

  console.log(`[${PATCH}] Prüfe: HOLD-Queue`);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "product-evidence:research", "--", "--limit=100", "--lane=HOLD"]);
  console.log(`[${PATCH}] BESTANDEN: HOLD-Queue`);

  console.log(`[${PATCH}] Abgeschlossen. Geändert: ${changed.length}; übersprungen: 0.`);
  console.log(`[${PATCH}] Vollständig: Scout, Healthy Pet Simply Feed, PetSafe Microchip, Smart Feed 2.0, SureFeed, DualScan, SureFlap Standard, SureFlap Connect.`);
  console.log(`[${PATCH}] Constrained: Petporte Smart Flap, petWALK Medium.`);
  console.log(`[${PATCH}] Backup: ${path.relative(root, backupDir)}`);
} catch (error) {
  for (const [file, old] of snapshots) {
    try { fs.writeFileSync(file, old, "utf8"); } catch {}
  }
  console.error(`[${PATCH}] FEHLER: ${error.message}`);
  console.error(`[${PATCH}] Änderungen an Produkt-MDs wurden zurückgerollt.`);
  process.exit(1);
}

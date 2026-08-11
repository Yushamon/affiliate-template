#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-external-evidence-batch-11-33.8.22";
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const app = path.join(root, "apps/pfotentechnik");
const productsDir = path.join(app, "src/content/products");
const testDir = path.join(app, "test");
const backupDir = path.join(root, ".patch-backups", `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`);

const targets = {
  "petkit-fresh-element-solo": `externalEvidence:
  constrained: true
  status: constrained
  userReviews:
    - platform: "Chewy"
      url: "https://www.chewy.com/petkit-fresh-element-solo-automatic/product-reviews/1554398"
      checkedAt: "2026-08-11"
      rating: 4.6
      scale: 5
      reviewCount: 24
      recurringPositives:
        - "Käufer loben wiederholt die zuverlässige zeitgesteuerte Ausgabe, die kompakte Bauform und die einfache App-Nutzung."
        - "Mehrere Bewertungen heben die gute Verarbeitung und die praktische Portionierung für kleine regelmäßige Mahlzeiten hervor."
      recurringCriticism:
        - "Einzelne Käufer nennen die Ersteinrichtung als umständlich."
        - "Mehrfach wird kritisiert, dass Netzadapter beziehungsweise Batterien nicht vollständig mitgeliefert werden und die Backup-Laufzeit begrenzt ist."
  note: >-
    Für das exakt als Fresh Element Solo identifizierte Modell wurde keine hinreichend belastbare unabhängige
    professionelle Hands-on-Review gefunden. Die große Händler-Stichprobe erlaubt ein Nutzersignal, aber keinen
    belastbaren Quellenkonsens. Deshalb bleibt die Evidenz constrained.`,

  "petkit-purobot-max-pro-2": `externalEvidence:
  professionalReviews:
    - publisher: "Tom's Guide"
      title: "I thought it was weird spying on my cats with this new robotic litter box - but it does more than just record them"
      url: "https://www.tomsguide.com/home/smart-home/i-thought-it-was-weird-spying-on-my-cats-with-this-new-robotic-litter-box-but-it-does-more-than-just-record-them"
      checkedAt: "2026-08-11"
      methodology: "hands-on-editorial-review"
      positives:
        - "Der Praxistest hebt die interne Kamera, Nutzungs- und Gewichtsprotokolle sowie die starke Geruchskontrolle hervor."
        - "Die Basisfunktionen zur Überwachung werden als nützlich eingeordnet, besonders wenn Veränderungen im Toilettenverhalten beobachtet werden sollen."
      negatives:
        - "Der Innenraum wird als eher knapp für größere Katzen beschrieben."
        - "Der 8-Liter-Abfallbehälter fällt im Vergleich zu größeren Konkurrenzsystemen klein aus."
      findings:
        - "Die Review basiert auf praktischer Nutzung mit mehreren Katzen und trennt kostenlose Basisfunktionen von kostenpflichtiger Video-Historie."
  userReviews:
    - platform: "Chewy"
      url: "https://www.chewy.com/petkit-purobot-max-pro-2-automatic/product-reviews/2481702"
      checkedAt: "2026-08-11"
      rating: 4.1
      scale: 5
      reviewCount: 7
      recurringPositives:
        - "Die frühe Käuferbasis lobt Geruchskontrolle, Kamera beziehungsweise App und die automatische Reinigung."
        - "Mehrere Nutzer heben den leichter zugänglichen Reinigungsaufbau gegenüber anderen Robotertoiletten hervor."
      recurringCriticism:
        - "Einzelne Nutzer berichten von ausbleibenden automatischen Reinigungszyklen und nötiger manueller Auslösung."
        - "Es gibt widersprüchliche Erfahrungen zur Katzenakzeptanz, Innenraumgröße und Sicherheit während der Rotation."
  consensus:
    strengths:
      - finding: "Kamera, App-Protokolle und Geruchskontrolle sind die am klarsten wiederkehrenden Stärken."
        sourceCount: 2
        confidence: "medium"
    weaknesses:
      - finding: "Innenraumgröße, kleiner Abfallbehälter und einzelne Automatik- beziehungsweise Akzeptanzprobleme begrenzen die Alltagstauglichkeit."
        sourceCount: 2
        confidence: "medium"
    editorialAssessment: >-
      Professioneller Praxistest und produktspezifische Käuferberichte stützen die Kernstärken. Die Nutzerbasis ist
      noch klein, daher sind Aussagen zur Langzeitzuverlässigkeit nur mit mittlerer bis niedriger Sicherheit möglich.
    contradictions:
      - "Tom's Guide bewertet die Überwachungsfunktionen sehr positiv; einzelne Chewy-Nutzer empfinden Teile der Analyse als weniger aussagekräftig und berichten von Automatikproblemen."`,

  "petlibro-air-wifi-feeder": `externalEvidence:
  constrained: true
  status: constrained
  professionalReviews:
    - publisher: "The Spruce Pets"
      title: "The 10 Best Automatic Cat Feeders Tested With Real Cats"
      url: "https://www.thesprucepets.com/best-automatic-cat-feeders-4175145"
      checkedAt: "2026-08-11"
      methodology: "lab-and-at-home-product-testing"
      positives:
        - "Der AIR WiFi wurde nach Labor- und Heimtests wegen langer Akkulaufzeit, kompakter Bauform, nützlicher App und zuverlässiger Ausgabe sehr positiv bewertet."
        - "Die kabellose Aufstellung und die einfache Verwaltung mehrerer Geräte beziehungsweise Nutzer werden als klare Vorteile genannt."
      negatives:
        - "Die Futterkapazität ist relativ klein."
        - "Ein vollständiger Ladevorgang dauert laut Test rund acht Stunden; Kamera und zusätzliche Komfortfunktionen fehlen."
      findings:
        - "The Spruce Pets beschreibt einen strukturierten Test von 24 Futterautomaten mit Aufbau, Portionierung, Software, Reinigung und anschließendem Einsatz in realen Haushalten."
  userReviews:
    - platform: "PetSmart"
      url: "https://www.petsmart.com/cat/bowls-and-feeders/food-and-water-bowls/catit-design-fresh-and-clear-pet-feeder-and-fountain-replacement-pump-5122580.html"
      checkedAt: "2026-08-11"
      reviewCount: 1
      recurringPositives: []
      recurringCriticism:
        - "Die produktspezifische Nutzerbasis ist mit nur einer sichtbaren Bewertung zu klein für wiederkehrende Muster."
  note: >-
    Der unabhängige Praxistest ist belastbar, die öffentlich auffindbare produktspezifische Nutzerbasis jedoch zu klein,
    um einen Consensus aus professioneller und Nutzer-Evidenz zu bilden. Deshalb bleibt die Evidenz constrained.`,

  "petlibro-capsule-dog-fountain": `externalEvidence:
  professionalReviews:
    - publisher: "WIRED"
      title: "The Best Cat Water Fountains of 2026: Petlibro, Petkit, Oneisall"
      url: "https://www.wired.com/gallery/the-best-cat-water-fountains/"
      checkedAt: "2026-08-11"
      methodology: "hands-on-home-testing"
      positives:
        - "WIRED lobt den großen 8-Liter-Tank, den leisen Betrieb und den wirksamen Spritzschutz im Alltag mit zwei Hunden."
        - "Die transparente Seitenwand erleichtert die Kontrolle des Wasserstands."
      negatives:
        - "Der empfohlene Filterwechsel etwa alle zwei Wochen verursacht laufende Kosten."
        - "Der Kunststoffkörper wird hygienisch kritischer eingeordnet als Glas oder Edelstahl."
      findings:
        - "Die Quelle beschreibt die Capsule Dog Fountain als im Haushalt praktisch eingesetztes Produkt und nennt konkrete Wartungs- und Materialnachteile."
  userReviews:
    - platform: "Chewy"
      url: "https://www.chewy.com/petlibro-ultra-quiet-dog-water/dp/1311790"
      checkedAt: "2026-08-11"
      rating: 4.4
      scale: 5
      reviewCount: 264
      recurringPositives:
        - "Käufer loben wiederholt die große Wasserkapazität, den sehr leisen Betrieb und die einfache Reinigung."
        - "Viele Berichte nennen den Spritzschutz und die gute Akzeptanz durch Hunde als praktische Vorteile."
      recurringCriticism:
        - "Wiederkehrend werden der häufige Reinigungs- und Filterwechsel sowie die Folgekosten kritisiert."
        - "Einzelne Nutzer berichten über Pumpen- beziehungsweise Haltbarkeitsprobleme; der gefüllte Behälter wird als unhandlich beschrieben."
  consensus:
    strengths:
      - finding: "Großer Tank, leiser Betrieb und geringe Spritzneigung werden von professioneller Review und Käufern übereinstimmend bestätigt."
        sourceCount: 2
        confidence: "high"
    weaknesses:
      - finding: "Regelmäßige Reinigung und kurze Filterintervalle erzeugen spürbaren Wartungsaufwand und Folgekosten."
        sourceCount: 2
        confidence: "high"
      - finding: "Der Kunststoffaufbau ist pflegeintensiver als eine vollständig metallische Lösung."
        sourceCount: 2
        confidence: "medium"
    editorialAssessment: >-
      Die Quellen stimmen bei den wichtigsten Alltagsstärken und beim Wartungsaufwand deutlich überein. Für die
      Langzeithaltbarkeit der Pumpe sind die Käuferberichte gemischt.
    contradictions:
      - "Viele Käufer bewerten die Reinigung als einfach, während andere den häufigen Wartungsrhythmus und das Handling des gefüllten Tanks als belastend empfinden."`,

  "petlibro-dockstream-2-smart": `externalEvidence:
  professionalReviews:
    - publisher: "PETBOOK"
      title: "Petlibro Trinkbrunnen Dockstream 2 im Praxistest"
      url: "https://www.petbook.de/katzen/katzenzubehoer/petlibro-dockstream-2-test"
      checkedAt: "2026-08-11"
      methodology: "hands-on-editorial-review"
      positives:
        - "Der Praxistest bewertet den Betrieb als sehr leise und die Trinkstatistik sowie Wartungserinnerungen als praktisch."
        - "Drei Liter Volumen und der grundsätzlich einfache Reinigungsaufbau werden positiv eingeordnet."
      negatives:
        - "Die App-Benutzerführung wird als ausbaufähig beschrieben."
        - "Ein Teil weitergehender Funktionen ist an ein Abo gebunden; auch das Lade- beziehungsweise Basisdesign wird kritisiert."
      findings:
        - "PETBOOK testete den Dockstream 2 mit einer Katze im Alltag und dokumentierte Einrichtung, App, Lautstärke und Pflege."
  userReviews:
    - platform: "Chewy"
      url: "https://www.chewy.com/petlibro-dockstream-2-smart-stainless/product-reviews/2460566"
      checkedAt: "2026-08-11"
      rating: 4.4
      scale: 5
      reviewCount: 115
      recurringPositives:
        - "Käufer loben häufig den leisen Betrieb, die leichte Reinigung und die Trinkmengen-Erfassung."
        - "Der getrennte beziehungsweise pumpenarme Aufbau wird als hygienisch und wartungsfreundlich wahrgenommen."
      recurringCriticism:
        - "Wiederkehrend werden WLAN-Verbindungsprobleme, Resets und unzuverlässige Smart-Anzeigen genannt."
        - "Einzelne Berichte kritisieren Support- und Garantieabwicklung."
  consensus:
    strengths:
      - finding: "Leiser Betrieb, einfache Reinigung und nützliche Trinkstatistiken werden über beide Quellen hinweg bestätigt."
        sourceCount: 2
        confidence: "high"
    weaknesses:
      - finding: "App- und Verbindungsqualität sind der deutlichste wiederkehrende Schwachpunkt."
        sourceCount: 2
        confidence: "medium"
    editorialAssessment: >-
      Die externe Evidenz ist für Alltag, Reinigung und Smart-Funktionen belastbar. Aussagen zur mehrjährigen
      Haltbarkeit bleiben trotz größerer Nutzerbasis vorsichtig.
    contradictions:
      - "Professioneller Test bewertet die App grundsätzlich als hilfreich, während ein Teil der Käufer von Verbindungs- und Zuverlässigkeitsproblemen berichtet."`,

  "petlibro-dockstream-2-smart-cordless": `externalEvidence:
  professionalReviews:
    - publisher: "Cats.com"
      title: "Petlibro Dockstream 2 Smart Cordless Water Fountain Review"
      url: "https://cats.com/petlibro-dockstream-2-smart-cordless-water-fountain-review"
      checkedAt: "2026-08-11"
      methodology: "multi-week-hands-on-home-test"
      positives:
        - "Der mehrwöchige Test lobt die sehr leise Arbeitsweise, den pumpenfreien Aufbau, die einfache Demontage und die App-basierte Trinküberwachung."
        - "Die kabellose Version behält Smart-Funktionen und bietet flexible Aufstellung."
      negatives:
        - "Im Akkubetrieb läuft Wasser nur bei erkannter Annäherung; die Testkatzen ignorierten diesen Modus teilweise."
        - "Der Preis ist hoch und der Wasserbehälter bleibt überwiegend aus Kunststoff."
      findings:
        - "Cats.com testete das konkrete Dockstream-2-Cordless-Modell mehrere Wochen mit eigenen Katzen und verglich es mit früheren Dockstream-Versionen."
  userReviews:
    - platform: "Chewy"
      url: "https://www.chewy.com/petlibro-dockstream-2-stainless-steel/product-reviews/2460542"
      checkedAt: "2026-08-11"
      recurringPositives:
        - "Nutzer loben den sehr leisen Betrieb, die einfache Reinigung und die Trinkmengen-Anzeige."
      recurringCriticism:
        - "Mehrere Berichte nennen WLAN-Abbrüche, fehlerhafte Batterieanzeigen oder Probleme der Smart-Funktionen."
        - "Die Erfahrungen mit Support und Zuverlässigkeit sind nicht einheitlich."
  consensus:
    strengths:
      - finding: "Leiser Betrieb, einfache Reinigung und flexible kabellose Aufstellung sind die konsistentesten Stärken."
        sourceCount: 2
        confidence: "high"
    weaknesses:
      - finding: "Der Sensormodus ist nicht für jede Katze ideal und Smart-Konnektivität kann im Alltag störanfällig sein."
        sourceCount: 2
        confidence: "medium"
    editorialAssessment: >-
      Hands-on-Test und produktspezifische Nutzerberichte liefern ein schlüssiges Bild. Die größte Unsicherheit betrifft
      die langfristige Zuverlässigkeit der Smart-Funktionen.
    contradictions:
      - "Cats.com bewertet den Cordless-Modus technisch positiv, beobachtet aber geringe Akzeptanz bei den eigenen Katzen; Nutzerberichte konzentrieren sich stärker auf Konnektivität und Batterieanzeigen."`,

  "petlibro-dockstream-cordless": `externalEvidence:
  professionalReviews:
    - publisher: "Cats.com"
      title: "Petlibro Dockstream Battery-Operated Water Fountain for Cats Review"
      url: "https://cats.com/petlibro-dockstream-water-fountain-review"
      checkedAt: "2026-08-11"
      methodology: "three-week-hands-on-home-test"
      positives:
        - "Der dreiwöchige Test bestätigt den Nutzen der kabellosen Aufstellung und eine für zwei Katzen ausreichende Kapazität."
        - "Die Grundfunktion als leiser gefilterter Brunnen wird positiv bewertet."
      negatives:
        - "Zum Laden beziehungsweise Bedienen muss der Wasserbehälter teilweise angehoben werden, was mit gefülltem Tank unpraktisch ist."
        - "Im Akkubetrieb arbeitet der Brunnen nur sensorgesteuert und nicht kontinuierlich."
      findings:
        - "Die Quelle testete die konkrete batteriebetriebene Dockstream-Version mit zwei Katzen und dokumentierte Handhabung, Laufmodi und Reinigung."
  userReviews:
    - platform: "Chewy"
      url: "https://www.chewy.com/petlibro-dockstream-battery-operated/product-reviews/842446"
      checkedAt: "2026-08-11"
      rating: 4.3
      scale: 5
      reviewCount: 1173
      recurringPositives:
        - "Sehr viele Käufer loben die kabellose Aufstellung, den leisen Betrieb und die leichte Reinigung."
        - "Die Wasserqualität und die gute Tierakzeptanz werden häufig positiv erwähnt."
      recurringCriticism:
        - "Wiederkehrend werden Ladezustandsanzeigen, Sensorerkennung und langfristige Pumpen- beziehungsweise Akkuzuverlässigkeit kritisiert."
        - "Bei einzelnen hellen Katzen wird berichtet, dass der Bewegungssensor nicht immer zuverlässig auslöst."
  consensus:
    strengths:
      - finding: "Kabellose Flexibilität, leiser Betrieb und unkomplizierte Reinigung sind über Test und große Nutzerbasis hinweg gut belegt."
        sourceCount: 2
        confidence: "high"
    weaknesses:
      - finding: "Sensorbetrieb und Lade- beziehungsweise Langzeitzuverlässigkeit sind die wiederkehrenden Schwachstellen."
        sourceCount: 2
        confidence: "high"
    editorialAssessment: >-
      Die große Nutzerbasis stützt die im Praxistest beobachteten Stärken. Gleichzeitig zeigen die Käuferberichte,
      dass Sensor- und Haltbarkeitsprobleme nicht nur Einzelfälle sind.
    contradictions:
      - "Der professionelle Test bewertet den Sensorbetrieb als funktional, während einzelne Käufer von Erkennungsproblemen bei bestimmten Katzen berichten."`,

  "petlibro-granary-2-vision": `externalEvidence:
  constrained: true
  status: constrained
  note: >-
    Für das exakt als PETLIBRO Granary 2 Vision identifizierte Modell wurde bei der Recherche am 2026-08-11 keine
    belastbare unabhängige professionelle Review mit eindeutig geprüfter Modellidentität und keine ausreichend große
    produktspezifische Nutzerquelle gefunden. Reviews älterer Granary-Camera-Modelle werden nicht übertragen. Kein
    Consensus wird konstruiert.`,

  "petlibro-granary-dual-feeder": `externalEvidence:
  constrained: true
  status: constrained
  userReviews:
    - platform: "PetSmart"
      url: "https://www.petsmart.com/cat/bowls-and-feeders/food-and-water-bowls/catit-design-fresh-and-clear-pet-feeder-and-fountain-replacement-pump-5122580.html"
      checkedAt: "2026-08-11"
      reviewCount: 3
      recurringPositives: []
      recurringCriticism:
        - "Die sichtbare produktspezifische Stichprobe ist zu klein, um wiederkehrende Muster belastbar abzuleiten."
  note: >-
    The Spruce Pets hat einen PETLIBRO Granary Feeder für zwei Katzen praktisch getestet, die dort beschriebene
    Variante ist jedoch nicht eindeutig als WiFi Dual Food Tray Feeder identifiziert. Diese Review wird deshalb nicht
    als professioneller Beleg für das konkrete Modell übernommen. Die Nutzerbasis ist ebenfalls zu klein. Constrained.`,

  "petlibro-granary-wifi-feeder": `externalEvidence:
  professionalReviews:
    - publisher: "FurryAdvisor"
      title: "PETLIBRO Granary WiFi Feeder Review: PLAF103 Limits & Verdict"
      url: "https://furryadvisor.com/product-review/petlibro-cat-feeder-review/"
      checkedAt: "2026-08-11"
      methodology: "independent-documentation-based-editorial-assessment"
      positives:
        - "Die Analyse bestätigt die klar dokumentierte Modellidentität PLAF103, App-Zeitpläne, Dual-Band-WLAN und den großen 5-Liter-Vorrat."
        - "Gespeicherte Zeitpläne und Batterie-Backup werden als sinnvolle Ausfallsicherheit eingeordnet."
      negatives:
        - "Die Quelle hat Portionierungsgenauigkeit, App-Stabilität, Jam-Häufigkeit und Langzeithaltbarkeit nicht physisch getestet."
        - "Im reinen Batteriebetrieb sind App- beziehungsweise WLAN-Funktionen eingeschränkt."
      findings:
        - "Die Quelle kennzeichnet transparent, dass es sich um eine dokumentationsbasierte und nicht um eine Hands-on-Review handelt."
  userReviews:
    - platform: "Best Buy"
      url: "https://www.bestbuy.com/site/reviews/petlibro-granary-wifi-stainless-steel-5l-automatic-dog-and-cat-feeder-with-voice-recorder-black/12358573?page=2"
      checkedAt: "2026-08-11"
      rating: 4.4
      scale: 5
      reviewCount: 38
      recurringPositives:
        - "Käufer loben vor allem die zuverlässige Futterausgabe, einfache Bedienung und insgesamt gute Verarbeitungsqualität."
      recurringCriticism:
        - "Konnektivitätsprobleme werden wiederholt genannt, insbesondere bei größerer Entfernung zum Router."
  consensus:
    strengths:
      - finding: "Der Granary WiFi bietet eine gut dokumentierte Kombination aus 5-Liter-Vorrat, Zeitplänen und App-Steuerung; Nutzer bestätigen überwiegend die zuverlässige Kernfunktion."
        sourceCount: 2
        confidence: "medium"
    weaknesses:
      - finding: "Netzwerk- und App-Abhängigkeit bleiben die am klarsten belegte praktische Schwäche."
        sourceCount: 2
        confidence: "medium"
    editorialAssessment: >-
      Die Nutzerbasis ist brauchbar, die unabhängige professionelle Quelle jedoch research-led statt hands-on. Der
      Consensus ist deshalb auf klar belegte Kernfunktionen und wiederkehrende Konnektivitätskritik begrenzt.
    contradictions:
      - "Die Dokumentationsanalyse kann keine reale App-Stabilität messen; die Käuferberichte zeigen hierzu sowohl problemlose Nutzung als auch Verbindungsprobleme."`
};

const expectedComplete = new Set([
  "petkit-purobot-max-pro-2",
  "petlibro-capsule-dog-fountain",
  "petlibro-dockstream-2-smart",
  "petlibro-dockstream-2-smart-cordless",
  "petlibro-dockstream-cordless",
  "petlibro-granary-wifi-feeder"
]);

const expectedConstrained = new Set([
  "petkit-fresh-element-solo",
  "petlibro-air-wifi-feeder",
  "petlibro-granary-2-vision",
  "petlibro-granary-dual-feeder"
]);

function die(message) {
  console.error(`[${PATCH}] FEHLER: ${message}`);
  process.exit(1);
}

function run(label, cmd, args, cwd = root) {
  console.log(`[${PATCH}] Prüfe: ${label}`);
  const r = spawnSync(cmd, args, { cwd, stdio: "inherit" });
  if (r.status !== 0) die(`${label} fehlgeschlagen (Exit ${r.status ?? "?"})`);
  console.log(`[${PATCH}] BESTANDEN: ${label}`);
}

function frontmatterEnd(raw) {
  if (!raw.startsWith("---")) return -1;
  return raw.indexOf("\n---", 3);
}

function insertExternalEvidence(raw, block) {
  const fmEnd = frontmatterEnd(raw);
  if (fmEnd < 0) throw new Error("Frontmatter-Ende nicht gefunden");
  const fm = raw.slice(0, fmEnd);
  if (/^externalEvidence:\s*$/m.test(fm)) return { raw, changed: false, reason: "externalEvidence bereits vorhanden" };

  const preferredAnchors = [
    /^decision:\s*$/m,
    /^review:\s*$/m,
    /^strengths:\s*$/m,
    /^experience:\s*$/m,
    /^alternatives:\s*$/m
  ];

  let idx = -1;
  for (const re of preferredAnchors) {
    const m = fm.match(re);
    if (m) {
      idx = m.index;
      break;
    }
  }

  if (idx < 0) idx = fm.length;
  const before = fm.slice(0, idx).replace(/\s*$/, "\n");
  const after = fm.slice(idx).replace(/^\s*/, "");
  const nextFm = `${before}${block.trim()}\n${after ? after : ""}`.replace(/\n{3,}/g, "\n\n");
  return { raw: `${nextFm}${raw.slice(fmEnd)}`, changed: true };
}

fs.mkdirSync(backupDir, { recursive: true });
fs.mkdirSync(testDir, { recursive: true });

const changed = [];
const skipped = [];

try {
  for (const [slug, evidenceBlock] of Object.entries(targets)) {
    const file = path.join(productsDir, `${slug}.md`);
    if (!fs.existsSync(file)) die(`Produktdatei fehlt: ${path.relative(root, file)}`);

    const raw = fs.readFileSync(file, "utf8");
    const originalRating = raw.match(/^rating:\s*.+$/m)?.[0] || null;
    const originalRatings = raw.match(/^ratings:\s*(?:\{.*\})?\s*$/m)?.[0] || null;

    const result = insertExternalEvidence(raw, evidenceBlock);
    if (!result.changed) {
      skipped.push(`${slug}: ${result.reason}`);
      console.log(`[${PATCH}] Übersprungen: ${slug} (${result.reason})`);
      continue;
    }

    const targetBackup = path.join(backupDir, "apps/pfotentechnik/src/content/products", `${slug}.md`);
    fs.mkdirSync(path.dirname(targetBackup), { recursive: true });
    fs.copyFileSync(file, targetBackup);
    fs.writeFileSync(file, result.raw);

    const after = fs.readFileSync(file, "utf8");
    if (originalRating && !after.includes(originalRating)) throw new Error(`${slug}: rating wurde verändert`);
    if (originalRatings && !after.includes(originalRatings)) throw new Error(`${slug}: ratings-Kopf wurde verändert`);

    changed.push(slug);
    console.log(`[${PATCH}] Evidence ergänzt: ${slug}`);
  }

  const testFile = path.join(testDir, "external-evidence-batch-11-33.8.22.test.mjs");
  const testContent = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(app, "src/content/products");
const read = (slug) => fs.readFileSync(path.join(dir, slug + ".md"), "utf8");

const complete = ${JSON.stringify([...expectedComplete])};
const constrained = ${JSON.stringify([...expectedConstrained])};
const all = [...complete, ...constrained];

test("Batch-11-Produkte besitzen externalEvidence", () => {
  for (const slug of all) assert.match(read(slug), /^externalEvidence:\\s*$/m, slug);
});

test("vollständige Batch-11-Produkte besitzen Professional Reviews, User Reviews und Consensus", () => {
  for (const slug of complete) {
    const s = read(slug);
    assert.match(s, /externalEvidence:[\\s\\S]*?professionalReviews:/, slug + " professionalReviews");
    assert.match(s, /externalEvidence:[\\s\\S]*?userReviews:/, slug + " userReviews");
    assert.match(s, /externalEvidence:[\\s\\S]*?consensus:/, slug + " consensus");
  }
});

test("schwache Quellenlagen sind constrained statt künstlich vollständig", () => {
  for (const slug of constrained) {
    const s = read(slug);
    assert.match(s, /externalEvidence:[\\s\\S]*?constrained:\\s*true/, slug);
  }
});

test("PfotenTechnik-Ratings bleiben vorhanden", () => {
  for (const slug of all) {
    const s = read(slug);
    assert.match(s, /^rating:\\s*[0-9.]+\\s*$/m, slug + " rating");
    assert.ok(/^ratings:\\s*$/m.test(s) || /^ratings:\\s*\\{.*\\}\\s*$/m.test(s), slug + " ratings");
  }
});
`;
  fs.writeFileSync(testFile, testContent);
  console.log(`[${PATCH}] Regressionstest geschrieben: ${path.relative(root, testFile)}`);

  run("Test-Syntax", process.execPath, ["--check", testFile]);
  run("Batch-Test", process.execPath, ["--test", testFile]);
  run("Evidence-Audit", "npm", ["--workspace", "apps/pfotentechnik", "run", "audit:product-evidence"]);
  run("BACKLOG-Queue", "npm", ["--workspace", "apps/pfotentechnik", "run", "product-evidence:research", "--", "--limit=10", "--lane=BACKLOG"]);
  run("HOLD-Queue", "npm", ["--workspace", "apps/pfotentechnik", "run", "product-evidence:research", "--", "--limit=100", "--lane=HOLD"]);

  console.log(`[${PATCH}] Abgeschlossen. Geändert: ${changed.length}; übersprungen: ${skipped.length}.`);
  console.log(`[${PATCH}] Vollständig: ${[...expectedComplete].join(", ")}.`);
  console.log(`[${PATCH}] Constrained: ${[...expectedConstrained].join(", ")}.`);
  console.log(`[${PATCH}] Backup: ${path.relative(root, backupDir)}`);
} catch (error) {
  console.error(`[${PATCH}] FEHLER: ${error?.stack || error}`);
  for (const slug of changed) {
    const backup = path.join(backupDir, "apps/pfotentechnik/src/content/products", `${slug}.md`);
    const target = path.join(productsDir, `${slug}.md`);
    if (fs.existsSync(backup)) fs.copyFileSync(backup, target);
  }
  console.error(`[${PATCH}] Änderungen an Produkt-MDs wurden zurückgerollt.`);
  process.exit(1);
}

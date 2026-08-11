#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PATCH = "pfotentechnik-external-evidence-batch-10-33.8.21";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = path.join(root, "apps/pfotentechnik");
const productDir = path.join(app, "src/content/products");
const backupRoot = path.join(root, ".patch-backups");
const stamp = new Date().toISOString().replace(/[:.]/g,"-");
const backupDir = path.join(backupRoot, `${PATCH}-${stamp}`);

const blocks = {
  "oneisall-3-2l-cordless-fountain": "externalEvidence:\n  status: constrained\n  constrained: true\n  note: >-\n    Für die exakt als oneisall 3,2L Cordless Cat Fountain identifizierte Variante wurde am 11.08.2026\n    keine ausreichend belastbare Kombination aus unabhängigem Professional Review und produktspezifischer\n    Nutzerbasis gefunden. Markenweite oneisall-Bewertungen werden nicht auf dieses Modell übertragen.\n",
  "oneisall-5l-automatic-cat-feeder": "externalEvidence:\n  professionalReviews:\n    - publisher: \"Catster\"\n      title: \"Oneisall Review 2026: Our Vet's Expert Opinion\"\n      url: \"https://www.catster.com/lifestyle/oneisall-review/\"\n      checkedAt: \"2026-08-11\"\n      methodology: \"hands-on-editorial-review\"\n      positives:\n        - \"Der konkrete 5-Liter-Futterautomat wird für einfache Einrichtung, unkomplizierte Wartung und praxistaugliches Design gelobt.\"\n        - \"Die Redaktion bewertet Bedienbarkeit, Qualität, Design und Nutzwert sehr positiv.\"\n      negatives:\n        - \"Das Gehäuse wird optisch als vergleichsweise klobig beschrieben.\"\n      findings:\n        - \"Catster behandelt ausdrücklich den Oneisall 5L Automatic Cat Feeder und beschreibt praktische Nutzung statt nur Herstellerdaten.\"\n  userReviews:\n    - platform: \"Trustpilot / oneisall.com\"\n      url: \"https://www.trustpilot.com/review/oneisall.com\"\n      checkedAt: \"2026-08-11\"\n      rating: 4.9\n      scale: 5\n      reviewCount: 552\n      scope: \"brand-wide\"\n      recurringPositives:\n        - \"Markenweit werden Bedienbarkeit, Produktqualität und schneller Support häufig positiv genannt.\"\n        - \"Einzelne Futterautomaten-Nutzer berichten über zuverlässige Ausgabe und einfache App-Bedienung.\"\n      recurringCriticism:\n        - \"Die Plattformbasis ist markenweit und darf nicht als produktspezifischer 5-Liter-Score interpretiert werden.\"\n  consensus:\n    strengths:\n      - finding: \"Einfache Einrichtung und unkomplizierte tägliche Bedienung sind das belastbarste wiederkehrende Signal.\"\n        sourceCount: 2\n        confidence: \"medium\"\n    weaknesses:\n      - finding: \"Für Langzeitzuverlässigkeit des exakt abgegrenzten 5-Liter-Modells ist die unabhängige Datenbasis noch begrenzt.\"\n        sourceCount: 2\n        confidence: \"low\"\n    editorialAssessment: >-\n      Der konkrete Catster-Review stützt die Alltagstauglichkeit. Das Trustpilot-Signal bleibt ausdrücklich markenweit\n      und dient nur als ergänzender Kontext, nicht als produktspezifische Sternebewertung.\n",
  "onlycat-mikrochip-katzenklappe": "externalEvidence:\n  professionalReviews:\n    - publisher: \"That Cat Flap Company\"\n      title: \"OnlyCat Review: The AI Microchip Cat Flap That Stops Prey at the Door\"\n      url: \"https://thatcatflapcompany.co.uk/blog/onlycat-microchip-cat-flap-with-prey-detection-review\"\n      checkedAt: \"2026-08-11\"\n      methodology: \"editorial-product-review-commercial-installer\"\n      positives:\n        - \"Die Beuteerkennung wird als klarer Differenzierungsfaktor gegenüber klassischen Mikrochip-Klappen eingeordnet.\"\n        - \"App-Steuerung, Kamera und beidseitige Mikrochip-Erkennung werden als zusammenhängendes System bewertet.\"\n      negatives:\n        - \"Der hohe Anschaffungspreis wird als wesentliche Hürde genannt.\"\n        - \"Die Quelle ist ein kommerzieller Katzenklappen-Anbieter und daher nicht als vollständig interessenfreie Testinstanz zu behandeln.\"\n      findings:\n        - \"Die Quelle behandelt das konkrete OnlyCat-System und trennt dessen Funktionsumfang von klassischen Mikrochip-Katzenklappen.\"\n  userReviews:\n    - platform: \"Trustpilot\"\n      url: \"https://www.trustpilot.com/review/onlycat.com\"\n      checkedAt: \"2026-08-11\"\n      rating: 4.8\n      scale: 5\n      reviewCount: 292\n      recurringPositives:\n        - \"Viele Nutzer berichten, dass Beute zuverlässig am Eintritt gehindert wird.\"\n        - \"Support und App-Steuerung werden häufig positiv beschrieben.\"\n      recurringCriticism:\n        - \"Einzelne Nutzer kritisieren die relativ kleine Öffnung, schwierigen Einbau oder WLAN-/Software-Themen.\"\n        - \"Der hohe Preis wird wiederholt als Nachteil genannt.\"\n  consensus:\n    strengths:\n      - finding: \"Die Beuteerkennung ist in den verfügbaren externen Signalen der klarste und wiederkehrend bestätigte Nutzwert.\"\n        sourceCount: 2\n        confidence: \"medium\"\n    weaknesses:\n      - finding: \"Preis, Passform der Öffnung und Einbauaufwand sind die wiederkehrenden Gegenargumente.\"\n        sourceCount: 2\n        confidence: \"medium\"\n    editorialAssessment: >-\n      Die Nutzerbasis ist für ein junges Nischenprodukt ungewöhnlich groß. Die professionelle Quelle ist jedoch kommerziell\n      geprägt; deshalb bleibt die Gesamt-Confidence trotz konsistenter Nutzerberichte bei medium.\n",
  "paj-pet-finder-4g-mini": "externalEvidence:\n  professionalReviews:\n    - publisher: \"gpstracker-tests.de\"\n      title: \"PAJ PET Finder 4G Mini Test 2026\"\n      url: \"https://gpstracker-tests.de/test/paj-pet-finder-4g-mini/\"\n      checkedAt: \"2026-08-11\"\n      methodology: \"editorial-comparison-test\"\n      positives:\n        - \"Ortungsgenauigkeit, kompakte Bauform und Preis-Leistungs-Verhältnis werden positiv bewertet.\"\n        - \"Das integrierte LED-Licht wird als praktischer Zusatznutzen hervorgehoben.\"\n      negatives:\n        - \"Die Nutzung bleibt an ein Mobilfunk-/Abo-Modell gebunden.\"\n        - \"Die Quelle arbeitet mit Affiliate-Links; ihre Wertung wird deshalb nicht als neutrale Messinstanz behandelt.\"\n      findings:\n        - \"Der Test behandelt das konkrete PET Finder 4G Mini Modell und nennt mess- bzw. vergleichbare Kriterien.\"\n  userReviews:\n    - platform: \"Trustpilot / PAJ GPS\"\n      url: \"https://de.trustpilot.com/review/paj-gps.com\"\n      checkedAt: \"2026-08-11\"\n      rating: 4.7\n      scale: 5\n      reviewCount: 417\n      scope: \"brand-wide\"\n      recurringPositives:\n        - \"Markenweit werden einfache Bedienung, zuverlässige Ortung und schneller Support häufig genannt.\"\n        - \"Einzelne Tiertracker-Nutzer beschreiben genaue Ortung und eine hilfreiche App.\"\n      recurringCriticism:\n        - \"Einzelne Nutzer berichten über defekte Geräte, Erstverbindungsprobleme oder unerwartetes Energiesparverhalten.\"\n        - \"Die Plattformbasis ist markenweit und nicht ausschließlich dem PET Finder 4G Mini zuzuordnen.\"\n  consensus:\n    strengths:\n      - finding: \"Einfache Bedienung und brauchbare Ortungsleistung sind die konsistentesten externen Signale.\"\n        sourceCount: 2\n        confidence: \"medium\"\n    weaknesses:\n      - finding: \"Abo-Abhängigkeit und vereinzelte Hardware- beziehungsweise Verbindungsprobleme bleiben relevante Gegenpunkte.\"\n        sourceCount: 2\n        confidence: \"medium\"\n    editorialAssessment: >-\n      Der konkrete redaktionelle Test wird durch eine große, aber markenweite Nutzerbasis ergänzt. Die Markenbewertungen\n      werden ausdrücklich nicht als produktspezifischer Score übernommen.\n",
  "petkit-eversweet-3-pro-uvc": "externalEvidence:\n  status: constrained\n  constrained: true\n  userReviews:\n    - platform: \"Petco\"\n      url: \"https://www.petco.com/product/petkit-eversweet-3-pro-%28uvc%29-pet-water-fountain-for-dogs-pearl-white-4634140\"\n      checkedAt: \"2026-08-11\"\n      reviewCount: 37\n      recurringPositives:\n        - \"Leiser Betrieb und einfache Reinigung werden mehrfach positiv genannt.\"\n      recurringCriticism:\n        - \"Einzelne Nutzer berichten über Bluetooth-/App-Verbindungsprobleme.\"\n  note: >-\n    Für den exakt abgegrenzten Eversweet 3 Pro UVC wurde keine ausreichend belastbare unabhängige professionelle\n    Review gefunden. Herstellerblog und Händlerbewertungen reichen nicht für einen vollständigen Consensus.\n",
  "petkit-eversweet-5-mini": "externalEvidence:\n  status: constrained\n  constrained: true\n  userReviews:\n    - platform: \"Trustpilot / PETKIT\"\n      url: \"https://www.trustpilot.com/review/petkit.com\"\n      checkedAt: \"2026-08-11\"\n      scope: \"brand-wide-with-product-mention\"\n      recurringPositives: []\n      recurringCriticism:\n        - \"Ein konkreter Eversweet-5-Mini-Bericht beschreibt einen Komplettausfall und unbefriedigende Support-Abwicklung nach Händlerkauf.\"\n  note: >-\n    Es liegt ein konkretes Nutzersignal zum Eversweet 5 Mini vor, aber keine belastbare unabhängige professionelle\n    Review und keine ausreichend große produktspezifische Nutzerbasis. Kein Consensus.\n",
  "petkit-eversweet-max-2-uvc": "externalEvidence:\n  professionalReviews:\n    - publisher: \"PetTech AI\"\n      title: \"PETKIT EverSweet Max 2 Review (2026): Is Cordless Convenience Worth the Premium?\"\n      url: \"https://pettechai.com/petkit-eversweet-max-2-review/\"\n      checkedAt: \"2026-08-11\"\n      methodology: \"research-led-editorial-review\"\n      positives:\n        - \"Kabellose Platzierung, drahtlose UVC-Pumpe und vereinfachte Reinigung werden als zentrale Vorteile eingeordnet.\"\n      negatives:\n        - \"Die Quelle weist darauf hin, dass App- und Gesundheitsdaten nicht mit individueller Tiererkennung verwechselt werden dürfen.\"\n      findings:\n        - \"Die Analyse trennt Alltagskomfort, Wartung und Smart-Funktionen und behauptet keinen eigenen Langzeittest.\"\n  userReviews:\n    - platform: \"Chewy\"\n      url: \"https://www.chewy.com/petkit-eversweet-max-2-cordless-uvc/dp/3491590\"\n      checkedAt: \"2026-08-11\"\n      rating: 3.8\n      scale: 5\n      reviewCount: 22\n      recurringPositives:\n        - \"Leiser Betrieb, Filtration, Kapazität und einfache Reinigung werden wiederholt gelobt.\"\n      recurringCriticism:\n        - \"Einzelne Nutzer kritisieren die App beziehungsweise Verbindungsprobleme.\"\n        - \"Nicht jede Katze akzeptiert den Brunnen.\"\n  consensus:\n    strengths:\n      - finding: \"Leiser Betrieb und leichte Reinigung sind die stabilsten wiederkehrenden Stärken.\"\n        sourceCount: 2\n        confidence: \"medium\"\n    weaknesses:\n      - finding: \"App-Verbindung und individuelle Akzeptanz durch das Tier bleiben die wichtigsten Unsicherheiten.\"\n        sourceCount: 2\n        confidence: \"medium\"\n    editorialAssessment: >-\n      Die Kombination aus research-led Review und produktspezifischen Chewy-Bewertungen reicht für eine vorsichtige\n      externe Einordnung, nicht für Aussagen zur langfristigen Ausfallrate.\n",
  "petkit-eversweet-solo-2-fountain": "externalEvidence:\n  professionalReviews:\n    - publisher: \"AvailPet\"\n      title: \"Petkit Eversweet Solo 2 Review 2026\"\n      url: \"https://availpet.com/petkit-eversweet-solo-2-review/\"\n      checkedAt: \"2026-08-11\"\n      methodology: \"hands-on-editorial-review-with-veterinary-review\"\n      positives:\n        - \"Sehr leiser Betrieb, einfache Reinigung und App-Hinweise zum Wasserstand werden positiv bewertet.\"\n        - \"Die drei Betriebsmodi werden als praktisch eingeordnet.\"\n      negatives:\n        - \"Der fehlende USB-Netzadapter wird kritisiert.\"\n        - \"Bluetooth statt WLAN und die kleine Kapazitätssteigerung gegenüber dem Solo SE begrenzen den Mehrwert.\"\n      findings:\n        - \"Die Quelle beschreibt das konkrete Solo-2-Modell und grenzt es ausdrücklich gegen Solo SE und 3 Pro ab.\"\n  userReviews:\n    - platform: \"Wayfair\"\n      url: \"https://www.wayfair.com/pet/pdp/petkit-eversweet-solo-2-pekt1173.html\"\n      checkedAt: \"2026-08-11\"\n      rating: 4.6\n      scale: 5\n      reviewCount: 18\n      recurringPositives:\n        - \"Leiser Betrieb, einfache Reinigung und gefälliges Design werden häufig genannt.\"\n      recurringCriticism:\n        - \"Einzelne Nutzer wünschen zusätzliche Funktionen; die Stichprobe bleibt relativ klein.\"\n  consensus:\n    strengths:\n      - finding: \"Leiser Betrieb und einfache Reinigung werden von professioneller und Nutzerseite konsistent bestätigt.\"\n        sourceCount: 2\n        confidence: \"medium\"\n    weaknesses:\n      - finding: \"Der Smart-Mehrwert bleibt begrenzt, wenn Bluetooth-App und Zusatzmodi nicht benötigt werden.\"\n        sourceCount: 2\n        confidence: \"medium\"\n    editorialAssessment: >-\n      Modellidentität und Kernaussagen sind ausreichend klar. Die Nutzerbasis ist kleiner als bei älteren PETKIT-Brunnen,\n      daher keine starken Langzeitaussagen.\n",
  "petkit-eversweet-solo-se": "externalEvidence:\n  professionalReviews:\n    - publisher: \"AvailPet\"\n      title: \"Petkit Eversweet Solo SE Review 2026\"\n      url: \"https://availpet.com/petkit-eversweet-solo-se-review/\"\n      checkedAt: \"2026-08-11\"\n      methodology: \"editorial-product-review-with-veterinary-review\"\n      positives:\n        - \"Leiser Betrieb, einfache Reinigung und die kabellose Pumpe werden positiv bewertet.\"\n      negatives:\n        - \"Das Gerät selbst ist nicht akkubetrieben; nur die Pumpe kommt ohne Kabel im Wasser aus.\"\n        - \"Die Kunststoffkonstruktion und geringe Kapazität begrenzen den Premium-Anspruch.\"\n      findings:\n        - \"Die Quelle grenzt Solo SE ausdrücklich von Solo 2 und höher positionierten PETKIT-Modellen ab.\"\n  userReviews:\n    - platform: \"Chewy\"\n      url: \"https://www.chewy.com/petkit-eversweet-solo-se-plastic-dog/product-reviews/1185182\"\n      checkedAt: \"2026-08-11\"\n      rating: 4.3\n      scale: 5\n      reviewCount: 95\n      recurringPositives:\n        - \"Sehr leiser Betrieb und unkomplizierte Reinigung werden häufig gelobt.\"\n        - \"Die kabellose Pumpe erleichtert das Herausnehmen des Wasserbehälters.\"\n      recurringCriticism:\n        - \"Einige Nutzer missverstehen 'wireless pump' als vollständig kabellosen Brunnen.\"\n        - \"Tierakzeptanz ist individuell; einzelne Katzen ignorieren den Brunnen.\"\n  consensus:\n    strengths:\n      - finding: \"Sehr leiser Betrieb und einfache Reinigung sind über unabhängige Review- und Nutzerquellen hinweg konsistent.\"\n        sourceCount: 2\n        confidence: \"high\"\n    weaknesses:\n      - finding: \"Die Bezeichnung der kabellosen Pumpe kann zu falschen Erwartungen an einen Akkubetrieb des gesamten Brunnens führen.\"\n        sourceCount: 2\n        confidence: \"medium\"\n    editorialAssessment: >-\n      Für die Kernfragen Lautstärke, Reinigung und Stromkonzept liegt eine vergleichsweise gute externe Evidenz vor.\n",
  "petkit-fresh-element-infinity": "externalEvidence:\n  status: constrained\n  constrained: true\n  professionalReviews:\n    - publisher: \"PetTech AI\"\n      title: \"PETKIT Fresh Element Infinity Review 2025\"\n      url: \"https://pettechai.com/petkit-fresh-element-infinity-review-2025/\"\n      checkedAt: \"2026-08-11\"\n      methodology: \"research-led-editorial-review\"\n      positives:\n        - \"Anti-Jam-Konzept, versiegelter Futterbehälter und Edelstahl-Napf werden als zentrale Stärken eingeordnet.\"\n      negatives:\n        - \"Funktionsumfang unterscheidet sich je nach 3L-, 5L- und Kamera-Variante.\"\n      findings:\n        - \"Die Quelle warnt indirekt vor Variantengleichsetzung, da einzelne Funktionen nur in bestimmten Ausführungen vorhanden sind.\"\n  note: >-\n    Es existieren unabhängige redaktionelle Einordnungen, aber keine ausreichend belastbare produktspezifische\n    Nutzerbasis für die konkrete im Repository geführte Infinity-Variante. Deshalb kein Consensus.\n"
};

function log(msg){ console.log(`[${PATCH}] ${msg}`); }

function replaceOrInsert(raw, block) {
  if (/^externalEvidence:\s*$/m.test(raw)) return raw;
  const marker = /^decision:\s*/m;
  if (marker.test(raw)) return raw.replace(marker, block.trimEnd() + "\n" + raw.match(marker)[0]);
  const end = raw.lastIndexOf("\n---");
  if (end >= 0) return raw.slice(0,end) + "\n" + block.trimEnd() + raw.slice(end);
  throw new Error("Kein sicherer Einfügepunkt gefunden");
}

fs.mkdirSync(backupDir,{recursive:true});
let changed = 0;
let skipped = 0;

for (const [slug, block] of Object.entries(blocks)) {
  const file = path.join(productDir, `${slug}.md`);
  if (!fs.existsSync(file)) throw new Error(`Produktdatei fehlt: ${path.relative(root,file)}`);
  const raw = fs.readFileSync(file,"utf8");
  if (/^externalEvidence:\s*$/m.test(raw)) {
    log(`Übersprungen, externalEvidence bereits vorhanden: ${slug}`);
    skipped++;
    continue;
  }
  const backup = path.join(backupDir, `${slug}.md`);
  fs.writeFileSync(backup, raw);
  const next = replaceOrInsert(raw, block);
  if (!/^rating:\s*[0-9.]+\s*$/m.test(next) && /^rating:\s*[0-9.]+\s*$/m.test(raw)) {
    throw new Error(`Top-Level rating verloren: ${slug}`);
  }
  if (/^ratings:\s*$/m.test(raw) && !/^ratings:\s*$/m.test(next)) {
    throw new Error(`ratings-Block verloren: ${slug}`);
  }
  fs.writeFileSync(file,next);
  changed++;
  log(`Evidence ergänzt: ${slug}`);
}

const testDir = path.join(app,"test");
fs.mkdirSync(testDir,{recursive:true});
const testFile = path.join(testDir,"external-evidence-batch-10-33.8.21.test.mjs");
const complete = [
  "oneisall-5l-automatic-cat-feeder",
  "onlycat-mikrochip-katzenklappe",
  "paj-pet-finder-4g-mini",
  "petkit-eversweet-max-2-uvc",
  "petkit-eversweet-solo-2-fountain",
  "petkit-eversweet-solo-se"
];
const constrained = [
  "oneisall-3-2l-cordless-fountain",
  "petkit-eversweet-3-pro-uvc",
  "petkit-eversweet-5-mini",
  "petkit-fresh-element-infinity"
];
const test = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
const app = path.resolve(path.dirname(new URL(import.meta.url).pathname),"..");
const p = (slug) => fs.readFileSync(path.join(app,"src/content/products",slug+".md"),"utf8");

test("vollständige Batch-10-Produkte besitzen alle Evidence-Bausteine",()=> {
  for (const slug of ${JSON.stringify(complete)}) {
    const s=p(slug);
    assert.match(s,/^externalEvidence:\\s*$/m,slug);
    assert.match(s,/^\\s+professionalReviews:\\s*$/m,slug);
    assert.match(s,/^\\s+userReviews:\\s*$/m,slug);
    assert.match(s,/^\\s+consensus:\\s*$/m,slug);
  }
});

test("schwache Quellenlagen sind constrained statt künstlich vollständig",()=> {
  for (const slug of ${JSON.stringify(constrained)}) {
    const s=p(slug);
    assert.match(s,/externalEvidence:\\s*[\\s\\S]*?\\n\\s+constrained:\\s*true/,slug);
  }
});

test("PfotenTechnik-Ratings bleiben erhalten",()=> {
  for (const slug of Object.keys(${JSON.stringify(blocks)})) {
    const s=p(slug);
    assert.match(s,/^rating:\\s*[0-9.]+\\s*$/m,slug);
  }
});
`;
fs.writeFileSync(testFile,test);

const run = async (cmd,args,label) => {
  const { spawnSync } = await import("node:child_process");
  log(`Prüfe: ${label}`);
  const r=spawnSync(cmd,args,{cwd:root,stdio:"inherit"});
  if(r.status!==0) throw new Error(`${label} fehlgeschlagen (Exit ${r.status})`);
  log(`BESTANDEN: ${label}`);
};

try {
  await run(process.execPath,["--check",testFile],"Test-Syntax");
  await run(process.execPath,["--test",testFile],"Batch-Test");
  await run("npm",["--workspace","apps/pfotentechnik","run","audit:product-evidence"],"Evidence-Audit");
  await run("npm",["--workspace","apps/pfotentechnik","run","product-evidence:research","--","--limit=10","--lane=BACKLOG"],"BACKLOG-Queue");
  await run("npm",["--workspace","apps/pfotentechnik","run","product-evidence:research","--","--limit=100","--lane=HOLD"],"HOLD-Queue");
} catch (err) {
  for (const slug of Object.keys(blocks)) {
    const backup=path.join(backupDir,`${slug}.md`);
    if(fs.existsSync(backup)) fs.copyFileSync(backup,path.join(productDir,`${slug}.md`));
  }
  log(`FEHLER: ${err.message}`);
  log("Änderungen an Produkt-MDs wurden zurückgerollt.");
  process.exit(1);
}

log(`Abgeschlossen. Geändert: ${changed}; übersprungen: ${skipped}.`);
log("Vollständig: oneisall 5L, OnlyCat, PAJ PET Finder 4G Mini, PETKIT Max 2 UVC, Solo 2, Solo SE.");
log("Constrained: oneisall 3,2L, PETKIT 3 Pro UVC, PETKIT 5 Mini, Fresh Element Infinity.");
log(`Backup: ${path.relative(root,backupDir)}`);

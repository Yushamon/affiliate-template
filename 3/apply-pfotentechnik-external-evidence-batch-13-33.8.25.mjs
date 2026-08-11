#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-external-evidence-batch-13-33.8.25";
const root = process.cwd();
const productDir = path.join(root, "apps/pfotentechnik/src/content/products");
const testDir = path.join(root, "apps/pfotentechnik/test");
const backupDir = path.join(root, ".patch-backups", `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`);

const targets = {
  "tractive-cat-6-mini": {
    mode: "insert",
    evidence: `externalEvidence:
  professionalReviews:
    - publisher: "GPS-Tracker-Tests.de"
      title: "Tractive CAT 6 Mini im Test 2026: App-Sieger für Katzen"
      url: "https://gpstracker-tests.de/test/tractive-cat-mini/"
      checkedAt: "2026-08-11"
      methodology: "14-day-hands-on-editorial-test"
      positives:
        - "Der Test bewertet Ortungsgenauigkeit, App-Bedienung und Tragekomfort besonders stark."
        - "Live-Modus, Revierdarstellung sowie Ton- und Lichtfunktion werden als praktische Stärken eingeordnet."
      negatives:
        - "Die laufenden Abo-Kosten werden als wesentlicher Nachteil bewertet."
        - "Gesundheitsfunktionen werden ausdrücklich nicht als medizinische Diagnostik eingeordnet."
      findings:
        - "Die Quelle beschreibt einen 14-tägigen Alltagstest des konkreten CAT-6-Mini-Modells."
  userReviews:
    - platform: "Trustpilot / Tractive"
      url: "https://www.trustpilot.com/review/tractive.com"
      checkedAt: "2026-08-11"
      rating: 4.7
      scale: 5
      reviewCount: 58082
      recurringPositives:
        - "Produktspezifische CAT-6-Mini-Berichte loben die Ortung und den praktischen Überblick über Freigänge."
        - "Mehrere aktuelle Berichte beschreiben die Passform als unauffällig und die App als hilfreich."
      recurringCriticism:
        - "Einzelne CAT-6-Mini-Berichte kritisieren, dass sich der Sicherheitsverschluss beziehungsweise das Halsband im Freigang lösen kann."
        - "Die tatsächliche Akkulaufzeit kann bei aktiver Nutzung deutlich unter dem Hersteller-Maximum liegen."
  consensus:
    strengths:
      - finding: "Ortung, App und die katzenspezifische Bauform sind die am klarsten gestützten Stärken des CAT 6 Mini."
        sourceCount: 2
        confidence: "medium"
    weaknesses:
      - finding: "Abo-Kosten und das sicherheitsbedingt lösbare Halsband bleiben reale Trade-offs."
        sourceCount: 2
        confidence: "medium"
    editorialAssessment: >-
      Ein produktspezifischer Hands-on-Test und aktuelle CAT-6-Mini-Erfahrungsberichte stützen die Kernfunktionen.
      Der Trustpilot-Gesamtscore ist allerdings markenweit und wird nicht als produktspezifische Durchschnittsnote interpretiert.
  note: >-
    Der Trustpilot-Ratingwert und die Review-Anzahl beziehen sich auf das Tractive-Unternehmensprofil.
    Für die inhaltlichen Muster wurden nur eindeutig als CAT 6 Mini erkennbare aktuelle Berichte herangezogen.
`
  },

  "wopet-cube-air-ca10": {
    mode: "insert",
    evidence: `externalEvidence:
  status: constrained
  constrained: true
  professionalReviews: []
  userReviews:
    - platform: "WOPET Produktbewertungen"
      url: "https://wopet.com/product/wopet-cube-air-wifi-pet-feeder/"
      checkedAt: "2026-08-11"
      rating: 4.85
      scale: 5
      reviewCount: 20
      recurringPositives:
        - "App-Steuerung, Zeitpläne und die 4-Liter-Kapazität werden wiederholt positiv beschrieben."
        - "Mehrere Nutzer nennen Einrichtung und planmäßige Futterausgabe als unkompliziert."
      recurringCriticism:
        - "Einzelne Berichte nennen Probleme bei WLAN-Einrichtung oder App-Kopplung."
        - "Die Bewertungen liegen auf der Herstellerseite und sind deshalb keine unabhängige Nutzerplattform."
  note: >-
    Für das konkrete Modell CA10 wurde keine belastbare unabhängige professionelle Review gefunden.
    Die vorhandenen Nutzerbewertungen werden nur als herstellergehostetes Nutzersignal dokumentiert; kein Consensus.
`
  },

  "wopet-heritage-view-camera-feeder": {
    mode: "insert",
    evidence: `externalEvidence:
  status: constrained
  constrained: true
  professionalReviews: []
  userReviews:
    - platform: "WOPET Produktbewertungen"
      url: "https://wopet.com/shop/all/product/wopet-heritage-view-pet-feeder-with-camera-app-control/"
      checkedAt: "2026-08-11"
      rating: 4.8
      scale: 5
      reviewCount: 5
      recurringPositives:
        - "Kamera, App-Steuerung und planmäßige Fütterung werden von mehreren Käufern positiv beschrieben."
        - "Mehrere Berichte nennen die Einrichtung und Reinigung als unkompliziert."
      recurringCriticism:
        - "Ein Nutzer weist darauf hin, dass standfeste Platzierung bei sehr aktiven Katzen wichtig ist."
        - "Die Stichprobe ist klein und liegt direkt auf der Herstellerseite."
  note: >-
    Ein unabhängiger K9-Magazine-Hands-on-Test existiert für die Heritage-View-Dual-Bowl-Variante.
    Da die vorhandene PfotenTechnik-Datei keine eindeutige Modellnummer beziehungsweise Dual-Bowl-Identität festlegt,
    wird dieser Test nicht auf das hier geführte Produkt übertragen. Deshalb bleibt Professional Reviews leer und die Evidence constrained.
`
  },

  "wopet-patrol-f07-pro": {
    mode: "insert",
    evidence: `externalEvidence:
  status: constrained
  constrained: true
  professionalReviews: []
  userReviews:
    - platform: "WOPET Produktbewertungen"
      url: "https://wopet.com/product/wopet-patrol-automatic-cat-dog-feeder-wifi-15-meal-6l/"
      checkedAt: "2026-08-11"
      rating: 4.8
      scale: 5
      reviewCount: 50
      recurringPositives:
        - "App-Fütterung, Zeitpläne und flexible Portionssteuerung werden wiederholt positiv beschrieben."
        - "Mehrere Käufer berichten von zuverlässiger planmäßiger Ausgabe im Alltag."
      recurringCriticism:
        - "Einzelne Berichte nennen Verbindungs- oder Einrichtungsprobleme und Defekte bei einzelnen Geräten."
        - "Die Bewertungen werden vom Hersteller gehostet und sind keine unabhängige Review-Plattform."
  note: >-
    Für das konkrete F07-Pro-Modell wurde keine belastbare unabhängige professionelle Review gefunden.
    Herstellerangaben bestätigen Modellidentität und Funktionen, zählen aber nicht als unabhängiger Review; kein Consensus.
`
  },

  "wopet-pioneer-f01-plus": {
    mode: "insert",
    evidence: `externalEvidence:
  status: constrained
  constrained: true
  professionalReviews: []
  userReviews:
    - platform: "WOPET Produktbewertungen"
      url: "https://test.wopet.com/product/wopet-sprite-automatic-cat-dog-feeder-4-meal-7l/"
      checkedAt: "2026-08-11"
      rating: 5
      scale: 5
      reviewCount: 9
      recurringPositives:
        - "Die kleine Nutzerstichprobe bewertet die grundlegende automatische Futterausgabe positiv."
      recurringCriticism:
        - "Die Stichprobe ist klein und wird direkt vom Hersteller gehostet."
  note: >-
    Die WOPET-Supportseite identifiziert das Produkt ausdrücklich als Pioneer F01 Plus.
    Eine belastbare unabhängige professionelle Review des konkreten Modells wurde nicht gefunden; kein Consensus.
`
  },

  "zeromouse-2-0": {
    mode: "insert",
    evidence: `externalEvidence:
  status: constrained
  constrained: true
  professionalReviews: []
  userReviews:
    - platform: "Trustpilot / ZeroMOUSE"
      url: "https://de.trustpilot.com/review/zeromouse.com"
      checkedAt: "2026-08-11"
      rating: 4.2
      scale: 5
      reviewCount: 1583
      recurringPositives:
        - "Viele aktuelle, ausdrücklich auf ZeroMOUSE 2.0 bezogene Berichte beschreiben erfolgreich blockierte Beuteversuche."
        - "Installation und Alltagsnutzen werden häufig positiv bewertet, wenn WLAN, Stromversorgung und Positionierung passen."
      recurringCriticism:
        - "Mehrere aktuelle Berichte nennen Fehl- oder Unklar-Erkennungen, Verzögerungen und App-/Verbindungsprobleme."
        - "Einzelne Nutzer berichten von Kompatibilitätsproblemen mit bestimmten Katzenklappen oder Installationssituationen."
  note: >-
    Der Trustpilot-Gesamtscore umfasst das Unternehmensprofil und ist nicht ausschließlich ein ZeroMOUSE-2.0-Produktmittel.
    Für die Muster wurden aktuelle, ausdrücklich auf ZeroMOUSE 2.0 beziehungsweise dessen Beuteerkennung bezogene Berichte betrachtet.
    Eine belastbare unabhängige professionelle Review wurde nicht gefunden; deshalb kein Consensus.
`
  },

  "xiaomi-smart-pet-food-feeder-2": {
    mode: "replace-empty-professional",
    evidence: `  professionalReviews:
    - publisher: "Ääni & Kuva"
      title: "TESTISSÄ: Xiaomi Smart Pet Food Feeder 2"
      url: "https://www.lbaanijakuva.fi/test/6-lemmikin-juoma-ja-ruoka-automaattia/xiaomi-smart-pet-food-feeder-2"
      checkedAt: "2026-08-11"
      methodology: "editorial-product-test"
      positives:
        - "Der Test hebt Fütterungsplanung, integrierte Waage, Protokollierung und einfache Reinigung positiv hervor."
        - "Der Batteriebetrieb als Reserve bei Stromausfall wird als praktische Absicherung bewertet."
      negatives:
        - "Als konkreter Nachteil wird das nicht standardkonforme Netzteil genannt."
      findings:
        - "Die Quelle testet ausdrücklich den Xiaomi Smart Pet Food Feeder 2 und nicht den Vorgänger."
`
  },
};

function run(label, cmd, args) {
  console.log(`[${PATCH}] Prüfe: ${label}`);
  const result = spawnSync(cmd, args, { cwd: root, stdio: "inherit", shell: false });
  if (result.status !== 0) throw new Error(`${label} fehlgeschlagen (Exit ${result.status})`);
  console.log(`[${PATCH}] BESTANDEN: ${label}`);
}

function snapshotRatings(source) {
  const rating = source.match(/^rating:\s*[0-9.]+\s*$/m)?.[0] ?? null;
  const ratingsStart = source.search(/^ratings:\s*(?:\{.*\})?\s*$/m);
  if (ratingsStart < 0) return { rating, ratings: null };
  const after = source.slice(ratingsStart);
  const lines = after.split("\n");
  const first = lines[0];
  if (first.includes("{")) return { rating, ratings: first };
  const captured = [first];
  for (let i = 1; i < lines.length; i++) {
    if (/^\S/.test(lines[i]) && lines[i].trim() !== "") break;
    captured.push(lines[i]);
  }
  return { rating, ratings: captured.join("\n") };
}

function insertEvidence(source, block) {
  if (/^externalEvidence:\s*$/m.test(source)) {
    throw new Error("externalEvidence existiert bereits; kein blindes Überschreiben erlaubt.");
  }
  const marker = /^decision:\s*$/m;
  if (!marker.test(source)) throw new Error("Einfügemarker decision: fehlt.");
  return source.replace(marker, `${block}decision:`);
}

function replaceEmptyProfessional(source, block) {
  if (!/^externalEvidence:\s*$/m.test(source)) throw new Error("externalEvidence fehlt bei Xiaomi.");
  const needle = /^  professionalReviews:\s*\[\]\s*$/m;
  if (!needle.test(source)) throw new Error("Xiaomi professionalReviews ist nicht leer; Abbruch statt Überschreiben.");
  return source.replace(needle, block.trimEnd());
}

fs.mkdirSync(backupDir, { recursive: true });
fs.mkdirSync(testDir, { recursive: true });

const changed = [];
const beforeRatings = {};

try {
  for (const [slug, cfg] of Object.entries(targets)) {
    const file = path.join(productDir, `${slug}.md`);
    if (!fs.existsSync(file)) throw new Error(`Produktdatei fehlt: ${path.relative(root, file)}`);

    const source = fs.readFileSync(file, "utf8");
    beforeRatings[slug] = snapshotRatings(source);
    fs.copyFileSync(file, path.join(backupDir, `${slug}.md`));

    let next;
    if (cfg.mode === "insert") next = insertEvidence(source, cfg.evidence);
    else if (cfg.mode === "replace-empty-professional") next = replaceEmptyProfessional(source, cfg.evidence);
    else throw new Error(`Unbekannter Modus: ${cfg.mode}`);

    fs.writeFileSync(file, next);
    changed.push(file);
    console.log(`[${PATCH}] Evidence ergänzt: ${slug}`);
  }

  const testFile = path.join(testDir, `external-evidence-batch-13-33.8.25.test.mjs`);
  const testSource = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const productDir = path.join(root, "apps/pfotentechnik/src/content/products");

const full = ["tractive-cat-6-mini", "xiaomi-smart-pet-food-feeder-2"];
const constrained = [
  "wopet-cube-air-ca10",
  "wopet-heritage-view-camera-feeder",
  "wopet-patrol-f07-pro",
  "wopet-pioneer-f01-plus",
  "zeromouse-2-0",
];

const read = slug => fs.readFileSync(path.join(productDir, slug + ".md"), "utf8");

test("vollständige Batch-13-Produkte besitzen Professional Reviews, User Reviews und Consensus", () => {
  for (const slug of full) {
    const s = read(slug);
    assert.match(s, /externalEvidence:/, slug);
    assert.match(s, /professionalReviews:\\s*\\n\\s+- publisher:/, slug);
    assert.match(s, /userReviews:\\s*\\n\\s+- platform:/, slug);
    assert.match(s, /consensus:/, slug);
  }
});

test("schwache Quellenlagen bleiben constrained", () => {
  for (const slug of constrained) {
    const s = read(slug);
    assert.match(s, /externalEvidence:[\\s\\S]*?constrained:\\s*true/, slug);
    assert.match(s, /professionalReviews:\\s*\\[\\]/, slug);
  }
});

test("Xiaomi ergänzt nur den zuvor leeren Professional-Review-Baustein", () => {
  const s = read("xiaomi-smart-pet-food-feeder-2");
  assert.match(s, /publisher:\\s*"Ääni & Kuva"/);
  assert.match(s, /platform:\\s*"Yandex Reviews"/);
  assert.match(s, /consensus:/);
});

test("PfotenTechnik-Ratings bleiben vorhanden", () => {
  for (const slug of [...full, ...constrained]) {
    const s = read(slug);
    assert.match(s, /^rating:\\s*[0-9.]+\\s*$/m, slug);
    assert.match(s, /^ratings:/m, slug);
  }
});
`;
  fs.writeFileSync(testFile, testSource);
  console.log(`[${PATCH}] Regressionstest geschrieben: ${path.relative(root, testFile)}`);

  run("Test-Syntax", process.execPath, ["--check", testFile]);
  run("Batch-Test", process.execPath, ["--test", testFile]);
  run("Evidence-Audit", "npm", ["--workspace", "apps/pfotentechnik", "run", "audit:product-evidence"]);
  run("BACKLOG-Queue", "npm", ["--workspace", "apps/pfotentechnik", "run", "product-evidence:research", "--", "--limit=10", "--lane=BACKLOG"]);
  run("HOLD-Queue", "npm", ["--workspace", "apps/pfotentechnik", "run", "product-evidence:research", "--", "--limit=100", "--lane=HOLD"]);

  for (const [slug] of Object.entries(targets)) {
    const file = path.join(productDir, `${slug}.md`);
    const after = fs.readFileSync(file, "utf8");
    const snap = snapshotRatings(after);
    const before = beforeRatings[slug];
    if (before.rating !== snap.rating || before.ratings !== snap.ratings) {
      throw new Error(`Rating-Regression bei ${slug}: rating/ratings wurden verändert.`);
    }
  }

  console.log(`[${PATCH}] Abgeschlossen. Geändert: ${changed.length}.`);
  console.log(`[${PATCH}] Vollständig: tractive-cat-6-mini; Xiaomi Professional Review ergänzt.`);
  console.log(`[${PATCH}] Constrained: vier WOPET-Modelle und zeromouse-2-0.`);
  console.log(`[${PATCH}] Backup: ${path.relative(root, backupDir)}`);
} catch (err) {
  console.error(`[${PATCH}] FEHLER: ${err.message}`);
  for (const file of changed) {
    const slug = path.basename(file, ".md");
    const backup = path.join(backupDir, `${slug}.md`);
    if (fs.existsSync(backup)) fs.copyFileSync(backup, file);
  }
  console.error(`[${PATCH}] Änderungen an Produkt-MDs wurden zurückgerollt.`);
  process.exit(1);
}

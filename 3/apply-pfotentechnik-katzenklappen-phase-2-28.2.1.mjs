#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-katzenklappen-phase-2-28.2.1";
const ROOT = process.cwd();
const APP = path.join(ROOT, "apps", "pfotentechnik");
const rel = (...parts) => path.join(APP, ...parts);

const targets = {
  hub: rel("src", "content", "pages", "katzenklappen.md"),
  comparison: rel("src", "content", "comparisons", "beste-mikrochip-katzenklappen.md"),
  manufacturer: rel("src", "content", "manufacturers", "petsafe.md"),
  product: rel("src", "content", "products", "petsafe-petporte-smart-flap.md"),
  audit: rel("research", "katzenklappen-phase-2-web-audit-2026-08-04.json"),
  prompt: rel("research", "visual-prompts", "petsafe-petporte-smart-flap-master-prompt.txt"),
  test: rel("test", "katzenklappen-phase-2-28.2.0.test.mjs"),
};

for (const key of ["hub", "comparison", "manufacturer"]) {
  if (!fs.existsSync(targets[key])) {
    throw new Error(`[${PATCH}] Erwartete Datei fehlt: ${path.relative(ROOT, targets[key])}`);
  }
}

const backupRoot = path.join(
  ROOT,
  ".patch-backups",
  `${PATCH}-${new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-")}`,
);

const changed = [];

function ensureDir(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
}

function backup(file) {
  if (!fs.existsSync(file)) return;
  const relative = path.relative(ROOT, file);
  const destination = path.join(backupRoot, relative);
  ensureDir(destination);
  fs.copyFileSync(file, destination);
}

function writeIfChanged(file, content) {
  const normalized = content.endsWith("\n") ? content : `${content}\n`;
  const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
  if (current === normalized) return false;
  backup(file);
  ensureDir(file);
  const temp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temp, normalized, "utf8");
  fs.renameSync(temp, file);
  changed.push(path.relative(ROOT, file));
  return true;
}

function replaceOnce(content, before, after, label) {
  if (content.includes(after)) return content;
  const index = content.indexOf(before);
  if (index < 0) {
    throw new Error(`[${PATCH}] Struktur nicht erkannt (${label}).`);
  }
  if (content.indexOf(before, index + before.length) >= 0) {
    throw new Error(`[${PATCH}] Mehrdeutige Struktur (${label}).`);
  }
  return content.slice(0, index) + after + content.slice(index + before.length);
}

function insertAfter(content, anchor, addition, label) {
  if (content.includes(addition.trim())) return content;
  const index = content.indexOf(anchor);
  if (index < 0) throw new Error(`[${PATCH}] Anker fehlt (${label}).`);
  return content.slice(0, index + anchor.length) + addition + content.slice(index + anchor.length);
}

const productContent = `---
type: product
title: "PetSafe Petporte smart flap"
slug: "petsafe-petporte-smart-flap"
description: "Netzbetriebene Mikrochip-Katzenklappe mit selektivem Eingang, Nachtmodus und größerem 160 × 160 mm Durchgang; deutsche Verfügbarkeit und Chipgrenzen geprüft."
manufacturer:
  key: petsafe
  name: PetSafe
  slug: petsafe
category:
  key: "katzenklappen"
  label: "Katzenklappen"
  path: "/katzenklappen/"
publishedAt: "2026-08-04"
updatedAt: "2026-08-04"
productStatus: active
editorialStatus: "required"
recommendationStatus: "limited"
maintenanceStatus: "current"
price:
  currency: "EUR"
  status: "known"
  amount: 165.99
  checkedAt: "2026-08-04T18:00:00.000Z"
  source:
    id: "petsafe-de-petporte"
    label: "PetSafe Deutschland"
    type: "manufacturer"
priceState: "known"
priceUpdated: "2026-08-04T18:00:00.000Z"
affiliateAvailable: false
availability: "available"
availabilityReason: "Im deutschen PetSafe-Shop bestellbar; Lieferfenster auf der Herstellerseite angezeigt."
availabilityUpdated: "2026-08-04T18:00:00.000Z"
decision:
  bestFor:
    - katze
    - mikrochip
    - lokaler-betrieb
    - netzbetrieb
    - groesserer-durchgang
    - nachtmodus
  attention:
    - Netzanschluss am Einbauort erforderlich
    - Unterstützt nicht alle Mikrochip-Nummernformate
    - Metalltüren vor dem endgültigen Einbau auf RFID-Funktion testen
    - Kein individueller Ausgang pro Tier
    - Keine App und keine integrierte Beuteerkennung
review:
  summary: "Lokale Mikrochip-Katzenklappe mit 160 × 160 mm Öffnung, Netzbetrieb und optionalem Nachtmodus."
  verdict: "Eine sachliche Alternative für größere Katzen und Haushalte mit verfügbarem Netzanschluss. Die Chipkompatibilität und mögliche Störungen an Metalltüren müssen vor dem Einbau geprüft werden."
strengths:
  - "160 × 160 mm Klappenöffnung"
  - "Bis zu 25 Katzen speicherbar"
  - "Netzbetrieb ohne regelmäßigen Batteriewechsel"
  - "Optionaler Nachtmodus"
  - "Einbau in Holz, Glas, PVC, uPVC und nach Funktionstest auch Metall"
weaknesses:
  - "Netzanschluss und Kabelweg erforderlich"
  - "Bestimmte Chipnummern sind laut Hersteller nicht kompatibel"
  - "Keine App-Funktionen"
  - "Keine individuellen Ein- und Ausgangsrechte je Tier"
specs:
  - label: "Produkt"
    value: "PetSafe Petporte smart flap"
  - label: "Klappenöffnung"
    value: "160 × 160 mm"
  - label: "Ausschnitt"
    value: "180 × 171 mm"
  - label: "Glasausschnitt"
    value: "212 mm"
  - label: "Rahmen"
    value: "232 × 232 × 158,6 mm"
  - label: "Maximale Schulterbreite"
    value: "150 mm"
  - label: "Speicher"
    value: "Bis zu 25 Katzen"
  - label: "Stromversorgung"
    value: "EU-Netzanschluss"
  - label: "Zugang"
    value: "Selektiver Eingang per kompatiblem Mikrochip"
  - label: "Nachtmodus"
    value: "Optional"
  - label: "Einbau"
    value: "Holz, Glas, PVC, uPVC, Wand; Metall nur nach Funktionstest"
decisionFacts:
  - label: "Durchgang"
    value: "160 × 160 mm"
    consequence: "Die größere Öffnung kann für kräftigere Katzen geeigneter sein als 142 × 120 mm, muss aber weiterhin an Schulterbreite und Körperbau geprüft werden."
  - label: "Netzbetrieb"
    value: "EU-Stromanschluss"
    consequence: "Es entfällt der regelmäßige Batteriewechsel, dafür müssen Steckdose und sicherer Kabelweg am Einbauort vorhanden sein."
  - label: "Chipgrenzen"
    value: "Nicht alle Nummernformate kompatibel"
    consequence: "Chips mit 10 Ziffern oder Buchstaben sowie bestimmte 977- und 98514-Nummern sind laut Hersteller ausgeschlossen."
  - label: "Metalltür"
    value: "Vor Einbau testen"
    consequence: "Metall kann den RFID-Leser stören. Der Hersteller verlangt einen Funktionstest vor dem endgültigen Ausschnitt."
  - label: "Nachtmodus"
    value: "Optional"
    consequence: "Die Katze kann nachts im Haus gehalten werden, ohne dass eine App benötigt wird."
faq:
  - question: "Braucht die Petporte smart flap Batterien?"
    answer: "Nein. Die deutsche Ausführung wird mit EU-Netzanschluss betrieben."
  - question: "Wie groß ist die Öffnung?"
    answer: "Die Klappenöffnung misst laut PetSafe 160 × 160 mm. Die maximale angegebene Schulterbreite beträgt 150 mm."
  - question: "Funktioniert die Klappe mit jedem Mikrochip?"
    answer: "Nein. PetSafe nennt konkrete ausgeschlossene Nummernformate. Die Chipnummer sollte vor dem Kauf geprüft werden."
  - question: "Kann sie in eine Metalltür eingebaut werden?"
    answer: "Grundsätzlich nennt PetSafe Metalltüren als Einbauoption, verlangt aber einen Funktionstest vor dem endgültigen Einbau, weil Metall den RFID-Leser stören kann."
  - question: "Hat die Petporte smart flap eine App?"
    answer: "Nein. Mikrochip-Erkennung und Nachtmodus arbeiten lokal ohne App."
metadata:
  version: 1.0.0
  normalizedAt: "2026-08-04"
  policy: "Herstellerdaten; keine eigene Praxistest- oder Langzeitbehauptung"
layout: product
testStatus: manufacturer-data
recommendation: "Prüfenswert für größere Katzen und Haushalte mit Netzanschluss, wenn lokaler Mikrochip-Zugang und Nachtmodus ausreichen."
images:
  hero:
    src: ../../assets/images/cat-flaps/microchip-comparison.svg
    alt: Redaktioneller Platzhalter für die PetSafe Petporte smart flap
  thumbnail:
    src: ../../assets/images/cat-flaps/microchip-comparison.svg
    alt: Redaktioneller Platzhalter für die PetSafe Petporte smart flap
  comparison:
    src: ../../assets/images/cat-flaps/microchip-comparison.svg
    alt: PetSafe Petporte smart flap im Mikrochip-Vergleich
  gallery: []
comparisons:
  - "beste-mikrochip-katzenklappen"
comparisonData:
  version: 1
  custom:
    zugang: "Selektiver Eingang"
    richtungsrechte: "Gesamtregel und Nachtmodus"
    app: "Nein"
    strom: "EU-Netzanschluss"
    einbau: "Holz, Glas, PVC, uPVC, Wand; Metall nach Test"
    durchgang: "160 × 160 mm"
    produktrolle: "Netzbetriebene Mikrochip-Klappe"
editorial:
  assessmentType: "data-review"
  evidence:
    - "manufacturer-documentation"
    - "technical-specifications"
  testedHandsOn: false
  lastVerifiedAt: "2026-08-04"
  note: "Aufnahme anhand der deutschen PetSafe-Produktseite; kein eigener Praxistest."
evidenceSources:
  - source: "PetSafe Deutschland – Petporte smart flap"
    url: "https://www.petsafe.com/de/p/mikrochip-katzenklappe-petporte-smart-flap/100ML/"
    accessedAt: "2026-08-04"
    assertion: "Preis, Verfügbarkeit, Öffnung, Ausschnitt, Netzbetrieb, Nachtmodus, Speicher, Chipgrenzen und Metalltür-Hinweis."
    fields: ["price", "availability", "specs", "decisionFacts", "faq"]
---

## Kurz eingeordnet

Die PetSafe Petporte smart flap ist eine netzbetriebene Mikrochip-Katzenklappe. Sie hält nicht eingelernte Tiere draußen, speichert bis zu 25 Katzen und bietet einen optionalen Nachtmodus. Eine App gehört nicht zum System.

Mit **160 × 160 mm** ist der Durchgang größer als bei den kleinen SureFlap-Katzenklappen. Das kann für kräftigere Tiere relevant sein, ersetzt aber nicht den Abgleich mit der maximal angegebenen Schulterbreite von 150 mm.

## Vor dem Einbau prüfen

Die Klappe benötigt einen Netzanschluss. Bei Metalltüren soll die vollständig montierte und programmierte Klappe laut Hersteller vor dem Ausschnitt direkt am geplanten Einbauort getestet werden. Bestimmte Mikrochip-Nummernformate sind ausgeschlossen.

Die herstellerübergreifende Auswahl steht im [Vergleich der Mikrochip-Katzenklappen](/vergleiche/beste-mikrochip-katzenklappen/). Einbaufragen nach Material und Ausschnitt behandelt der [Einbauratgeber](/katzenklappe-einbauen/).
`;

writeIfChanged(targets.product, productContent);

let comparison = fs.readFileSync(targets.comparison, "utf8");
comparison = replaceOnce(
  comparison,
  'description: "Sechs belegte Mikrochip-Türen nach Zugangslogik, Richtungsrechten, App-Abhängigkeit, Strom, Einbau und Produktrolle vergleichen."',
  'description: "Sieben belegte Mikrochip-Türen nach Zugangslogik, Richtungsrechten, App-Abhängigkeit, Strom, Einbau und Produktrolle vergleichen."',
  "Vergleichsbeschreibung",
);
comparison = replaceOnce(
  comparison,
  'seo: { title: "Mikrochip-Katzenklappen: 6 Systeme im Vergleich",',
  'seo: { title: "Mikrochip-Katzenklappen: 7 Systeme im Vergleich",',
  "SEO-Titel",
);
const petporteItem = `  - slug: "petsafe-petporte-smart-flap"
    type: "product"
    label: "PetSafe Petporte"
    recommendation: "Netzbetriebene Option mit größerem 160 × 160 mm Durchgang und Nachtmodus; Chipformat und Metalltür vor Einbau prüfen."
    values:
      zugang: "Selektiver Eingang"
      richtungsrechte: "Gesamtregel und Nachtmodus"
      app: "Nein"
      strom: "EU-Netzanschluss"
      einbau: "Holz, Glas, PVC, uPVC, Wand; Metall nach Test"
      durchgang: "160 × 160 mm"
      rolle: "Netzbetriebene Klappe"
`;
comparison = insertAfter(
  comparison,
  `  - slug: "petsafe-mikrochip-katzenklappe"
    type: "product"
    label: "PetSafe Mikrochip"
    recommendation: "Lokale Alternative mit Speicher für bis zu 40 Katzen; Chipformat vorher prüfen."
    values:
      zugang: "15-stelliger FDX-B-Chip"
      richtungsrechte: "Selektiver Eingang"
      app: "Nein"
      strom: "Batterie"
      einbau: "Adapter je Material"
      durchgang: "Schablone prüfen"
      rolle: "Standardklappe"
`,
  petporteItem,
  "Petporte-Vergleichseintrag",
);
comparison = replaceOnce(
  comparison,
  '  text: "Für einfachen lokalen Eingang reichen Standardmodelle. DualScan löst individuelle Ausgangsrechte ohne App; Connect ergänzt Fernfunktionen. OnlyCat adressiert Beute als Komplettsystem, petWALK Dämmung und motorisierte Öffnung."',
  '  text: "Für einfachen lokalen Eingang reichen Standardmodelle. Petporte ergänzt eine netzbetriebene Option mit größerem Durchgang und Nachtmodus. DualScan löst individuelle Ausgangsrechte ohne App; Connect ergänzt Fernfunktionen. OnlyCat adressiert Beute als Komplettsystem, petWALK Dämmung und motorisierte Öffnung."',
  "Vergleichsempfehlung",
);
writeIfChanged(targets.comparison, comparison);

let hub = fs.readFileSync(targets.hub, "utf8");
hub = replaceOnce(
  hub,
  '  products: ["sureflap-mikrochip-katzenklappe", "sureflap-dualscan-mikrochip-katzenklappe", "sureflap-mikrochip-katzenklappe-connect", "petsafe-mikrochip-katzenklappe", "onlycat-mikrochip-katzenklappe", "petwalk-medium-tiertuer", "zeromouse-2-0"]',
  '  products: ["sureflap-mikrochip-katzenklappe", "sureflap-dualscan-mikrochip-katzenklappe", "sureflap-mikrochip-katzenklappe-connect", "petsafe-mikrochip-katzenklappe", "petsafe-petporte-smart-flap", "onlycat-mikrochip-katzenklappe", "petwalk-medium-tiertuer", "zeromouse-2-0"]',
  "Hub-Produktliste",
);
hub = insertAfter(
  hub,
  'Eine einfache Mikrochip-Klappe soll fremde Tiere aussperren. DualScan-Modelle regeln zusätzlich, welche Katze hinaus darf. Vernetzte Komplettsysteme ergänzen Fernsteuerung, Ereignisse oder Beuteerkennung. Motorisierte Tiertüren adressieren darüber hinaus Dämmung und Gebäudeintegration. ZeroMOUSE bleibt als Nachrüstung einer vorhandenen Klappe eine fünfte, aber nicht direkt vergleichbare Rolle.',
  '\n\nNetzbetriebene Mikrochip-Klappen bilden eine zusätzliche Betriebsvariante: Sie vermeiden regelmäßige Batteriewechsel, benötigen dafür aber Steckdose und sicheren Kabelweg. Die [PetSafe Petporte smart flap](/produkt/petsafe-petporte-smart-flap/) ergänzt diesen Fall mit größerem Durchgang und lokalem Nachtmodus.',
  "Hub-Netzbetrieb",
);
writeIfChanged(targets.hub, hub);

let manufacturer = fs.readFileSync(targets.manufacturer, "utf8");
manufacturer = replaceOnce(
  manufacturer,
  '  - "petsafe-mikrochip-katzenklappe"\n\nfeaturedProductSlugs:',
  '  - "petsafe-mikrochip-katzenklappe"\n  - "petsafe-petporte-smart-flap"\n\nfeaturedProductSlugs:',
  "Hersteller-Produktliste",
);
manufacturer = replaceOnce(
  manufacturer,
  '      - "petsafe-mikrochip-katzenklappe"\n\nalternativeManufacturerSlugs:',
  '      - "petsafe-mikrochip-katzenklappe"\n      - "petsafe-petporte-smart-flap"\n\nalternativeManufacturerSlugs:',
  "Hersteller-Serie",
);
manufacturer = insertAfter(
  manufacturer,
  '  - label: "PetSafe Mikrochip-Katzenklappe Deutschland"\n    url: "https://www.petsafe.com/de/p/mikrochip-katzenklappe/PPA19-16145/"\n    description: "Deutsche Produkt-, Verfügbarkeits- und Einbauinformationen; geprüft am 04.08.2026."\n',
  '  - label: "PetSafe Petporte smart flap Deutschland"\n    url: "https://www.petsafe.com/de/p/mikrochip-katzenklappe-petporte-smart-flap/100ML/"\n    description: "Deutsche Produkt-, Preis-, Verfügbarkeits-, Maß- und Kompatibilitätsinformationen; geprüft am 04.08.2026."\n',
  "Herstellerquelle",
);
manufacturer = replaceOnce(
  manufacturer,
  'Im Katzenklappen-Cluster bleibt der Marken-Intent hier; die konkrete Prüfung liegt bei der [PetSafe Mikrochip Katzenklappe](/produkt/petsafe-mikrochip-katzenklappe/) und der herstellerübergreifende Intent beim [Mikrochip-Vergleich](/vergleiche/beste-mikrochip-katzenklappen/).',
  'Im Katzenklappen-Cluster bleibt der Markenüberblick hier. Für batteriebetriebenen Standardzugang führt die [PetSafe Mikrochip Katzenklappe](/produkt/petsafe-mikrochip-katzenklappe/) weiter; die [Petporte smart flap](/produkt/petsafe-petporte-smart-flap/) deckt Netzbetrieb, größeren Durchgang und Nachtmodus ab. Der herstellerübergreifende Vergleich liegt beim [Mikrochip-Vergleich](/vergleiche/beste-mikrochip-katzenklappen/).',
  "Hersteller-Body",
);
writeIfChanged(targets.manufacturer, manufacturer);

const audit = {
  version: 1,
  updatedAt: "2026-08-04T18:00:00.000Z",
  scope: "katzenklappen-phase-2",
  repositoryBase: "2b57f4f1cc2c2c39477c44edf4d6533b57f67218",
  finding: {
    id: "petsafe-petporte-smart-flap",
    decision: "create-product-and-integrate",
    reason: "Eigenständige deutsche Produktverfügbarkeit, Netzbetrieb, größerer Durchgang, Nachtmodus und dokumentierte Chip-/Metalltür-Grenzen.",
    duplicateOfExisting: false,
  },
  evidence: [
    {
      source: "PetSafe Deutschland",
      url: "https://www.petsafe.com/de/p/mikrochip-katzenklappe-petporte-smart-flap/100ML/",
      accessedAt: "2026-08-04",
      facts: [
        "Preis 165,99 EUR",
        "im deutschen Shop bestellbar",
        "EU-Netzanschluss",
        "bis zu 25 Katzen",
        "optionaler Nachtmodus",
        "Klappenöffnung 160 × 160 mm",
        "Ausschnitt 180 × 171 mm",
        "Glasausschnitt 212 mm",
        "Metalltür vor Einbau testen",
        "bestimmte Chipnummern ausgeschlossen",
      ],
    },
  ],
};
writeIfChanged(targets.audit, JSON.stringify(audit, null, 2));

const visualPrompt = `Du erstellst den vollständigen Bildsatz für die PfotenTechnik-Produktseite zur PetSafe Petporte smart flap.

Nutze die deutsche Herstellerseite als strikte visuelle Produktreferenz:
https://www.petsafe.com/de/p/mikrochip-katzenklappe-petporte-smart-flap/100ML/

Regeln:
- jedes Motiv als eigenständiges Bild, keine Collage und kein Kontaktbogen
- beginne mit Bild 1
- nach "weiter" exakt das nächste noch offene Motiv erzeugen
- kein Motiv wiederholen
- Produktform, transparente Klappe, Antennen-/Lesereinheit, Netzanschluss und Proportionen nicht erfinden
- keine App darstellen, da das Produkt keine App besitzt
- keine erfundenen Displays, LEDs, Maße, Logos oder Zubehörteile
- mobile first, Produkt bei 375 px Breite klar erkennbar
- realistische Premium-Produktfotografie, keine Händlerkomposition kopieren

1. petsafe-petporte-smart-flap-01-hero.webp
   Hero in realistischer Dreiviertelansicht mit sichtbarer Gehäusetiefe und transparenter Klappe.

2. petsafe-petporte-smart-flap-02-thumbnail.webp
   Freigestellte kompakte Frontansicht.

3. petsafe-petporte-smart-flap-03-front.webp
   Exakte frontale Produktansicht.

4. petsafe-petporte-smart-flap-04-angle.webp
   45-Grad-Ansicht mit Netzanschluss und Lesereinheit, soweit auf Referenzen sichtbar.

5. petsafe-petporte-smart-flap-05-detail.webp
   Kaufentscheidendes Detail der Mikrochip-Lesezone oder Verriegelung ohne erfundene Bauteile.

6. petsafe-petporte-smart-flap-06-usage.webp
   Reale Nutzung mit Katze, Produkt bleibt vollständig erkennbar.

7. petsafe-petporte-smart-flap-07-installation.webp
   Glaubwürdiger Einbau in eine geeignete Tür, Kabelweg sicher und unaufdringlich.

8. petsafe-petporte-smart-flap-08-night-mode.webp
   Ruhige nächtliche Wohnsituation, Nachtmodus nur über Situation darstellen, keine erfundene Oberfläche.

9. petsafe-petporte-smart-flap-09-glass.webp
   Einbau in Glas mit korrekter runder Ausschnittlogik, ohne erfundene Adapterform.

10. petsafe-petporte-smart-flap-10-size.webp
    Redaktionelle Maßgrafik mit ausschließlich belegten Werten: Öffnung 160 × 160 mm, Rahmen 232 × 232 × 158,6 mm, Ausschnitt 180 × 171 mm, Glasausschnitt 212 mm.
`;
writeIfChanged(targets.prompt, visualPrompt);

const testContent = `import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

test("Petporte besitzt eigenständige belegte Produktdaten", () => {
  const product = read("src/content/products/petsafe-petporte-smart-flap.md");
  assert.match(product, /slug: "petsafe-petporte-smart-flap"/);
  assert.match(product, /160 × 160 mm/);
  assert.match(product, /EU-Netzanschluss/);
  assert.match(product, /Bis zu 25 Katzen/);
  assert.match(product, /Metalltür/);
  assert.doesNotMatch(product, /^rating:/m);
  assert.doesNotMatch(product, /eigener Praxistest/i);
});

test("Mikrochip-Vergleich integriert Petporte als siebtes System", () => {
  const comparison = read("src/content/comparisons/beste-mikrochip-katzenklappen.md");
  assert.match(comparison, /7 Systeme im Vergleich/);
  assert.match(comparison, /slug: "petsafe-petporte-smart-flap"/);
  assert.match(comparison, /Netzbetriebene Klappe/);
});

test("Hub und Hersteller verlinken die neue Produktrolle", () => {
  const hub = read("src/content/pages/katzenklappen.md");
  const manufacturer = read("src/content/manufacturers/petsafe.md");
  for (const content of [hub, manufacturer]) {
    assert.match(content, /\\/produkt\\/petsafe-petporte-smart-flap\\//);
  }
});

test("Web-Audit und Visual-Prompt sind vorhanden", () => {
  const audit = JSON.parse(read("research/katzenklappen-phase-2-web-audit-2026-08-04.json"));
  assert.equal(audit.finding.decision, "create-product-and-integrate");
  const prompt = read("research/visual-prompts/petsafe-petporte-smart-flap-master-prompt.txt");
  assert.match(prompt, /nach "weiter" exakt das nächste/);
  assert.match(prompt, /keine App darstellen/);
});
`;
writeIfChanged(targets.test, testContent);

const generatedTestCheck = spawnSync(process.execPath, ["--check", path.relative(ROOT, targets.test)], {
  cwd: ROOT,
  encoding: "utf8",
});
if (generatedTestCheck.status !== 0) {
  process.stderr.write(generatedTestCheck.stderr || generatedTestCheck.stdout);
  process.exit(generatedTestCheck.status || 1);
}

const check = spawnSync(process.execPath, ["--check", process.argv[1]], {
  cwd: ROOT,
  encoding: "utf8",
});
if (check.status !== 0) {
  process.stderr.write(check.stderr || check.stdout);
  process.exit(check.status || 1);
}

const tests = spawnSync(
  process.execPath,
  ["--test", "test/katzenklappen-phase-2-28.2.0.test.mjs"],
  { cwd: APP, stdio: "inherit" },
);
if (tests.status !== 0) process.exit(tests.status || 1);

console.log(`[${PATCH}] Geändert: ${changed.length}`);
for (const file of changed) console.log(`  - ${file}`);
if (changed.length) console.log(`[${PATCH}] Backups: ${path.relative(ROOT, backupRoot)}`);
console.log(`[${PATCH}] Danach projektübliche Audits und den vollständigen Build ausführen.`);

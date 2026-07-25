import fs from "node:fs";
import path from "node:path";

const PATCH = "pfotentechnik-comparison-structure-fix-2.4.0";
const root = process.cwd();
const app = path.join(root, "apps", "pfotentechnik");
const backupRoot = path.join(
  root,
  ".patch-backups",
  `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

const changed = [];
const backups = new Map();

function fail(message) {
  throw new Error(`[${PATCH}] ${message}`);
}

function read(file) {
  if (!fs.existsSync(file)) {
    fail(`Datei fehlt: ${path.relative(root, file)}`);
  }
  return fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
}

function backup(file, content) {
  if (backups.has(file)) return;
  const target = path.join(backupRoot, path.relative(root, file));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, "utf8");
  backups.set(file, target);
}

function write(file, content) {
  const old = read(file);
  if (old === content) return false;
  backup(file, old);
  fs.writeFileSync(file, content, "utf8");
  changed.push(path.relative(root, file));
  return true;
}

function restoreAll() {
  for (const [file, target] of backups) {
    fs.copyFileSync(target, file);
  }
}

function normalizeManufacturer(rel, slug, name) {
  const file = path.join(app, rel);
  let text = read(file);

  const replacement = `manufacturer:
  key: "${slug}"
  name: "${name}"
  slug: "${slug}"
`;

  const inline = /^manufacturer:\s*\{[^\n]*\}\s*\n/m;
  const block = /^manufacturer:\s*\n(?:(?: {2}|\t)[^\n]*\n)*/m;

  if (inline.test(text)) {
    text = text.replace(inline, replacement);
  } else if (block.test(text)) {
    text = text.replace(block, replacement);
  } else {
    const category = /^category:/m;
    if (!category.test(text)) {
      fail(`${rel}: Weder manufacturer noch category gefunden.`);
    }
    text = text.replace(category, `${replacement}category:`);
  }

  write(file, text);
}

function replaceComparisonItems(rel, itemsYaml) {
  const file = path.join(app, rel);
  let text = read(file);

  const rx = /^items:\s*\n[\s\S]*?(?=^criteria:\s*$)/m;
  if (!rx.test(text)) {
    fail(`${rel}: items-/criteria-Block nicht gefunden.`);
  }

  text = text.replace(rx, `items:\n${itemsYaml}\n`);
  write(file, text);
}

function replaceProductSlug(rel, fromSlug, toSlug) {
  const file = path.join(app, rel);
  let text = read(file);

  if (text.includes(`slug: "${toSlug}"`) || text.includes(`slug: '${toSlug}'`)) {
    console.log(`[${PATCH}] ${rel}: Zielslug bereits vorhanden.`);
    return;
  }

  const rx = new RegExp(`slug:\\s*["']?${fromSlug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']?`);
  if (!rx.test(text)) {
    fail(`${rel}: Produktslug ${fromSlug} nicht gefunden.`);
  }

  text = text.replace(rx, `slug: "${toSlug}"`);
  write(file, text);
}

function ensureCatitManufacturer() {
  const file = path.join(app, "src", "content", "manufacturers", "catit.md");
  if (fs.existsSync(file)) {
    console.log(`[${PATCH}] Hersteller Catit bereits vorhanden.`);
    return;
  }

  const content = `---
title: "Catit"
slug: "catit"
type: "manufacturer"
layout: "manufacturer"
description: "Catit im Überblick: Futterautomaten, Trinkbrunnen und vernetzte Katzenprodukte mit Fokus auf Mahlzeitenplanung, Hygiene und Alltagstauglichkeit."
key: "catit"
name: "Catit"
recommendation: "Catit ist besonders für Katzenhaushalte interessant, die zwischen zeitgesteuerten Futterautomaten, Nassfutterlösungen und Trinkbrunnen wählen möchten. App-, Kühl- und Reinigungsfunktionen sollten immer modellbezogen geprüft werden."
summary: "Catit bietet ein breites Sortiment an Katzenprodukten. Im Bereich smarter Haustiertechnik gehören vor allem Futterautomaten und Trinkbrunnen dazu. Die redaktionelle Einordnung trennt dabei klar zwischen App-Komfort, tatsächlicher Kühlleistung, lokaler Bedienung und laufendem Pflegeaufwand."
publishedAt: "2026-07-25"
updatedAt: "2026-07-25"
author:
  name: "PfotenTechnik Redaktion"
  role: "Redaktion"
tags:
  - "hersteller"
  - "catit"
  - "futterautomaten"
  - "trinkbrunnen"
  - "katzen"
hub:
  sections:
    - "hersteller"
  title: "Catit"
  description: "Futterautomaten und Trinkbrunnen für Katzen im Überblick."
  icon: "🏭"
  order: 60
seo:
  title: "Catit Erfahrungen: Futterautomaten und Trinkbrunnen"
  description: "Catit Futterautomaten und Trinkbrunnen nach App, Futterart, Reinigung, Kühlung und Alltagstauglichkeit eingeordnet."
  canonical: "/hersteller/catit/"
  sitemap: true
  priority: 0.7
  changefreq: "monthly"
website: "https://www.catit.com"
images:
  hero:
    src: "../../assets/images/products/catit-pixi-smart-6-meal-feeder/hero.webp"
    alt: "Catit PIXI Smart 6-Meal Feeder als Vertreter smarter Catit-Produkte"
  gallery: []
productCategories:
  - "Futterautomaten"
  - "Trinkbrunnen"
productAreas:
  - "Zeitgesteuerte Futterautomaten"
  - "Nassfutterautomaten"
  - "Smarte Trinkbrunnen"
focus:
  - "Katzenprodukte"
  - "Mahlzeitenplanung"
  - "App-Steuerung"
  - "Hygiene"
suitableFor:
  - "Katzenhaushalte"
  - "Mehrere kleine Mahlzeiten"
  - "Nass- und Trockenfutter je nach Modell"
attention:
  - "Nicht jedes Modell besitzt aktive Kühlung"
  - "App-Funktionen unterscheiden sich je nach Produkt"
  - "Reinigung und Ersatzteile modellbezogen prüfen"
strengths:
  - "Breites Katzenprodukt-Sortiment"
  - "Modelle für unterschiedliche Futterarten"
  - "Lokale Bedienung bei ausgewählten Geräten"
weaknesses:
  - "Funktionsumfang ist zwischen Modellen nicht einheitlich"
  - "Kühlakkus ersetzen keine aktive Kühlung"
profile:
  company: "Catit ist eine auf Katzenprodukte spezialisierte Marke."
  appEcosystem: "App-Unterstützung ist modellabhängig und muss je Produkt geprüft werden."
  replacementParts: "Ersatzteile und Zubehör sind modell- und regionsabhängig."
  filterSupply: "Für Trinkbrunnen werden modellabhängige Filter benötigt."
  warranty: "Garantiebedingungen unterscheiden sich nach Produkt und Verkaufsregion."
  competitorComparison: "Catit konkurriert bei Futterautomaten unter anderem mit PETLIBRO, PETKIT, Cat Mate und Sure Petcare."
productSlugs:
  - "catit-pixi-smart-6-meal-feeder"
  - "catit-pixi-vision-smart-feeder"
featuredProductSlugs:
  - "catit-pixi-smart-6-meal-feeder"
series: []
alternativeManufacturerSlugs:
  - "petlibro"
  - "petkit"
sources:
  - label: "Offizielle Catit-Website"
    url: "https://www.catit.com"
    description: "Herstellerinformationen zu Sortiment und Produkten."
faq:
  - question: "Welche smarten Produkte bietet Catit an?"
    answer: "Zum Sortiment gehören je nach Markt unter anderem zeitgesteuerte Futterautomaten, Modelle mit App-Funktionen und Trinkbrunnen."
  - question: "Sind Catit-Futterautomaten für Nassfutter geeignet?"
    answer: "Das hängt vom Modell ab. Der PIXI Smart 6-Meal Feeder kann vorbereitete Fächer für Nassfutter nutzen, besitzt aber keine aktive Kompressorkühlung."
  - question: "Brauchen Catit-Produkte eine App?"
    answer: "Nicht zwingend bei jedem Modell. Einige Geräte bieten zusätzlich lokale Bedienelemente; der genaue Funktionsumfang muss produktbezogen geprüft werden."
---

Catit deckt verschiedene Aufgaben in Katzenhaushalten ab. Entscheidend ist weniger die Marke allein als die konkrete Technik des jeweiligen Modells: Futterart, Kühlung, lokale Bedienung, App-Abhängigkeit und Reinigungsaufwand.
`;

  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, "utf8");
  changed.push(path.relative(root, file));
}

try {
  if (!fs.existsSync(path.join(app, "package.json"))) {
    fail("Bitte im Root von affiliate-template ausführen.");
  }

  const manufacturerFixes = [
    ["src/content/products/petsafe-freshfeed-refrigerated-feeder.md", "petsafe", "PetSafe"],
    ["src/content/products/petlibro-granary-camera-feeder.md", "petlibro", "PETLIBRO"],
    ["src/content/products/tractive-dog-6.md", "tractive", "Tractive"],
    ["src/content/products/tractive-dog-6-xl.md", "tractive", "Tractive"],
    ["src/content/products/tractive-cat-6-mini.md", "tractive", "Tractive"],
    ["src/content/products/weenect-xs.md", "weenect", "Weenect"],
    ["src/content/products/weenect-xt.md", "weenect", "Weenect"],
    ["src/content/products/oneisall-3-5l-cordless-fountain.md", "oneisall", "oneisall"],
    ["src/content/products/petkit-eversweet-solo-2-fountain.md", "petkit", "PETKIT"]
  ];

  for (const [rel, slug, name] of manufacturerFixes) {
    normalizeManufacturer(rel, slug, name);
  }

  ensureCatitManufacturer();

  replaceProductSlug(
    "src/content/comparisons/beste-futterautomaten-ohne-wlan.md",
    "imipaw-3l",
    "imipaw-3l-automatic-cat-feeder"
  );

  replaceComparisonItems(
    "src/content/comparisons/gps-tracker-mit-langer-akkulaufzeit.md",
`  - slug: "tractive-dog-6-xl"
    label: "Tractive DOG 6 XL"
    type: "product"
    recommendation: "Längste Mobilfunk-Maximalangabe mit bis zu sechs Wochen für Hunde ab 20 kg."
  - slug: "weenect-xt"
    label: "Weenect XT"
    type: "product"
    recommendation: "Robuste Hundeoption mit bis zu drei Wochen im Energiesparmodus."
  - slug: "tractive-dog-6"
    label: "Tractive DOG 6"
    type: "product"
    recommendation: "Gute Balance aus 39 g und bis zu zwei Wochen."
  - slug: "paj-pet-finder-4g-mini"
    label: "PAJ PET Finder 4G Mini"
    type: "product"
    recommendation: "Bis zu zehn Tage im Sparmodus, aber deutlich weniger bei aktivem Tracking."
  - slug: "tractive-cat-6-mini"
    label: "Tractive CAT 6 Mini"
    type: "product"
    recommendation: "Katzenspezifisch mit bis zu sieben Tagen."
  - slug: "weenect-xs"
    label: "Weenect XS"
    type: "product"
    recommendation: "27-g-Kleinformat mit bis zu sieben Tagen, rund zwei Tagen im Dauertracking."
  - slug: "garmin-alpha-t-20"
    label: "Garmin Alpha T 20"
    type: "product"
    recommendation: "Bis 68 Stunden, optional 136 Stunden, als VHF-System mit Handgerät."`
  );

  replaceComparisonItems(
    "src/content/comparisons/gps-tracker-ohne-abo.md",
`  - slug: "garmin-alpha-t-20"
    label: "Garmin Alpha T 20"
    type: "product"
    recommendation: "Beste reine Ortungslösung ohne Mobilfunkabo für kompatible Alpha-Systeme."
  - slug: "garmin-alpha-tt-25"
    label: "Garmin Alpha TT 25"
    type: "product"
    recommendation: "Nur bei zusätzlich bewusst benötigten Trainingsfunktionen."`
  );

  replaceComparisonItems(
    "src/content/comparisons/kleine-gps-tracker-fuer-katzen.md",
`  - slug: "weenect-xs"
    label: "Weenect XS"
    type: "product"
    recommendation: "Leichtester reiner Gerätewert mit 27 g für Katzen ab 3 kg."
  - slug: "tractive-cat-6-mini"
    label: "Tractive CAT 6 Mini"
    type: "product"
    recommendation: "31 g als Komplettsystem inklusive Sicherheitshalsband für Katzen von 3 bis 8 kg."
  - slug: "paj-pet-finder-4g-mini"
    label: "PAJ PET Finder 4G Mini"
    type: "product"
    recommendation: "33-g-Gerät; Katzen-Passform und sichere Halterung besonders kritisch prüfen."`
  );

  console.log("");
  console.log(`[${PATCH}] Erfolgreich.`);
  console.log(`[${PATCH}] Geänderte/erstellte Dateien: ${changed.length}`);
  for (const file of changed) console.log(`- ${file}`);
  console.log(`[${PATCH}] Backups: ${path.relative(root, backupRoot)}`);
  console.log("");
  console.log("Validierung:");
  console.log("npm --workspace apps/pfotentechnik run comparison:audit");
  console.log("npm --workspace apps/pfotentechnik run lint:content");
  console.log("npm run build:pfotentechnik");
} catch (error) {
  restoreAll();
  console.error(`[${PATCH}] Fehlgeschlagen; vorhandene Dateien wurden zurückgesetzt.`);
  console.error(error?.stack || error);
  process.exit(1);
}

import fs from "node:fs";
import path from "node:path";

const PATCH = "pfotentechnik-comparison-final-structure-hotfix-2.4.1";
const root = process.cwd();
const app = path.join(root, "apps", "pfotentechnik");
const backupRoot = path.join(
  root,
  ".patch-backups",
  `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

const backups = new Map();
const changed = [];

function fail(message) {
  throw new Error(`[${PATCH}] ${message}`);
}

function read(file) {
  if (!fs.existsSync(file)) fail(`Datei fehlt: ${path.relative(root, file)}`);
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
  for (const [file, backupFile] of backups) {
    fs.copyFileSync(backupFile, file);
  }
}

function normalizeGarminManufacturer() {
  const rel = "src/content/products/garmin-alpha-tt-25.md";
  const file = path.join(app, rel);
  let text = read(file);

  const desired = `manufacturer:
  key: "garmin"
  name: "Garmin"
  slug: "garmin"
`;

  const inline = /^manufacturer:\s*\{[^\n]*\}\s*\n/m;
  const block = /^manufacturer:\s*\n(?:(?: {2}|\t)[^\n]*\n)*/m;

  if (inline.test(text)) {
    text = text.replace(inline, desired);
  } else if (block.test(text)) {
    text = text.replace(block, desired);
  } else if (/^category:/m.test(text)) {
    text = text.replace(/^category:/m, `${desired}category:`);
  } else {
    fail(`${rel}: manufacturer/category nicht gefunden.`);
  }

  write(file, text);
}

function ensurePetSafeManufacturer() {
  const rel = "src/content/manufacturers/petsafe.md";
  const file = path.join(app, rel);

  if (fs.existsSync(file)) {
    console.log(`[${PATCH}] ${rel} existiert bereits; keine Änderung.`);
    return;
  }

  const content = `---
title: "PetSafe"
slug: "petsafe"
type: "manufacturer"
layout: "manufacturer"

description: "PetSafe im Überblick: Futterautomaten, Trinksysteme und vernetzte Haustierprodukte mit Fokus auf Alltagstauglichkeit, Versorgung und Sicherheit."

key: "petsafe"
name: "PetSafe"

recommendation: "PetSafe ist besonders für Tierhalter interessant, die etablierte Futter- und Trinklösungen mit klarer Alltagsausrichtung suchen. App-, Kühl-, Strom- und Ersatzteilfragen sollten jedoch immer für das konkrete Modell geprüft werden."

summary: "PetSafe bietet ein breites Sortiment für Hunde und Katzen. Im Bereich smarter Haustiertechnik gehören Futterautomaten, Trinksysteme und vernetzte Produkte dazu. Die redaktionelle Bewertung trennt zwischen Herstellerangaben, tatsächlichem Funktionsumfang und offenen Punkten wie regionaler Verfügbarkeit oder Langzeiterfahrung."

publishedAt: "2026-07-25"
updatedAt: "2026-07-25"

author:
  name: "PfotenTechnik Redaktion"
  role: "Redaktion für smarte Haustiertechnik"

tags:
  - "hersteller"
  - "petsafe"
  - "futterautomaten"
  - "trinksysteme"
  - "hunde"
  - "katzen"

hub:
  sections:
    - "hersteller"
  title: "PetSafe"
  description: "Futterautomaten und Versorgungstechnik für Hunde und Katzen."
  icon: "🏭"
  order: 55
  featured: false

seo:
  title: "PetSafe Erfahrungen: Modelle, Funktionen und Unterschiede"
  description: "PetSafe Futterautomaten und Versorgungstechnik nach Futterart, App, Stromversorgung, Reinigung und Alltagstauglichkeit eingeordnet."
  canonical: "/hersteller/petsafe/"
  noindex: false
  sitemap: true
  priority: 0.7
  changefreq: "monthly"

website: "https://www.petsafe.com"

images:
  hero:
    src: "../../assets/images/products/petsafe-freshfeed-refrigerated-feeder/hero.webp"
    alt: "PetSafe FreshFeed Refrigerated Pet Feeder als Beispiel moderner PetSafe-Fütterungstechnik"
  gallery: []

productCategories:
  - "Futterautomaten"
  - "Trinksysteme"

productAreas:
  - "Trockenfutterautomaten"
  - "Nassfutterautomaten"
  - "Aktiv gekühlte Futterautomaten"
  - "Trinklösungen"

focus:
  - "Alltagstaugliche Fütterung"
  - "Zeitgesteuerte Mahlzeiten"
  - "App-Steuerung bei ausgewählten Modellen"
  - "Versorgung von Hund und Katze"

suitableFor:
  - "Hunde- und Katzenhaushalte"
  - "Feste Fütterungszeiten"
  - "Nass- oder Trockenfutter je nach Modell"
  - "Tierhalter mit Fokus auf etablierte Systeme"

attention:
  - "Funktionsumfang unterscheidet sich stark je Modell"
  - "Nicht jedes Produkt ist in Deutschland gleich gut verfügbar"
  - "App- und Stromabhängigkeit modellbezogen prüfen"
  - "Herstellerangaben ersetzen keinen Langzeittest"

strengths:
  - "Breites Sortiment"
  - "Lösungen für Hunde und Katzen"
  - "Mehrere Fütterungskonzepte"
  - "Etablierte Marke"

weaknesses:
  - "Regionale Verfügbarkeit kann variieren"
  - "Nicht alle Modelle bieten denselben Smart-Home-Umfang"
  - "Neue Produkte haben teils wenig Langzeiterfahrung"

profile:
  company: "PetSafe ist eine international vertriebene Marke für Produkte rund um Versorgung, Sicherheit und Alltag mit Haustieren."
  appEcosystem: "App-Funktionen sind modellabhängig und müssen für jedes Produkt einzeln geprüft werden."
  replacementParts: "Ersatzteile und Zubehör sind modell- und regionsabhängig verfügbar."
  filterSupply: "Filterbedarf betrifft nur passende Trinksysteme und ist modellabhängig."
  warranty: "Garantiebedingungen unterscheiden sich nach Produkt und Verkaufsregion."
  competitorComparison: "PetSafe konkurriert bei Futterautomaten unter anderem mit PETLIBRO, PETKIT, Cat Mate und Sure Petcare."

productSlugs:
  - "petsafe-freshfeed-refrigerated-feeder"
  - "petsafe-healthy-pet-simply-feed"

featuredProductSlugs:
  - "petsafe-freshfeed-refrigerated-feeder"

series: []

alternativeManufacturerSlugs:
  - "petlibro"
  - "petkit"
  - "sure-petcare"

sources:
  - label: "Offizielle PetSafe-Website"
    url: "https://www.petsafe.com"
    description: "Herstellerinformationen zu Sortiment, Produktfunktionen und Support."

faq:
  - question: "Welche smarten Produkte bietet PetSafe an?"
    answer: "Je nach Markt gehören dazu zeitgesteuerte Futterautomaten, aktiv gekühlte Futterlösungen und weitere vernetzte Versorgungsprodukte."
  - question: "Sind PetSafe-Futterautomaten für Nassfutter geeignet?"
    answer: "Das hängt vom Modell ab. Der FreshFeed Refrigerated Pet Feeder ist speziell für gekühlte Nass- und Frischfuttermahlzeiten ausgelegt."
  - question: "Brauchen PetSafe-Produkte eine App?"
    answer: "Nicht jedes Produkt. App-Unterstützung und lokale Bedienung unterscheiden sich je nach Modell."
---

PetSafe deckt unterschiedliche Anforderungen in Hunde- und Katzenhaushalten ab. Entscheidend ist das konkrete Produkt: Futterart, Kühlung, Stromversorgung, App-Abhängigkeit, Reinigung und regionale Verfügbarkeit sollten immer getrennt bewertet werden.
`;

  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, "utf8");
  changed.push(path.relative(root, file));
}

try {
  if (!fs.existsSync(path.join(app, "package.json"))) {
    fail("Bitte im Root von affiliate-template ausführen.");
  }

  normalizeGarminManufacturer();
  ensurePetSafeManufacturer();

  console.log("");
  console.log(`[${PATCH}] Erfolgreich.`);
  console.log(`[${PATCH}] Geänderte/erstellte Dateien: ${changed.length}`);
  for (const file of changed) console.log(`- ${file}`);
  console.log(`[${PATCH}] Backups: ${path.relative(root, backupRoot)}`);
  console.log("");
  console.log("Validierung:");
  console.log("npm --workspace apps/pfotentechnik run comparison:audit");
  console.log("npm --workspace apps/pfotentechnik run audit:products:strict");
  console.log("npm --workspace apps/pfotentechnik run lint:content");
  console.log("npm run build:pfotentechnik");
} catch (error) {
  restoreAll();
  console.error(`[${PATCH}] Fehlgeschlagen; vorhandene Dateien wurden zurückgesetzt.`);
  console.error(error?.stack || error);
  process.exit(1);
}

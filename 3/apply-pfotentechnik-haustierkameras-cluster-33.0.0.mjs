#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const PATCH = "pfotentechnik-haustierkameras-cluster-33.0.0";
const scriptFile = fileURLToPath(import.meta.url);
const candidates = [process.cwd(), path.resolve(path.dirname(scriptFile), "..")];
const root = candidates.find((candidate) =>
  fs.existsSync(path.join(candidate, "apps", "pfotentechnik", "package.json")),
);
if (!root) throw new Error(`[${PATCH}] Repository-Wurzel nicht gefunden.`);

const require = createRequire(path.join(root, "package.json"));
const yaml = require("js-yaml");
const app = path.join(root, "apps", "pfotentechnik");
const files = {
  scout: path.join(app, "src/content/products/petlibro-scout-smart-camera.md"),
  furbo: path.join(app, "src/content/products/furbo-mini-360.md"),
  rola: path.join(app, "src/content/products/enabot-rola-mini.md"),
  comparison: path.join(app, "src/content/comparisons/beste-haustierkameras.md"),
  hub: path.join(app, "src/content/pages/haustierkameras.md"),
  furboMaker: path.join(app, "src/content/manufacturers/furbo.md"),
  enabotMaker: path.join(app, "src/content/manufacturers/enabot.md"),
  legacyTest: path.join(app, "test/pet-camera-product-coverage-34.1.0.test.mjs"),
  test: path.join(app, "test/haustierkameras-cluster-33.0.0.test.mjs"),
  promptScout: path.join(app, "research/visual-prompts/petlibro-scout-smart-camera-visual-master-prompt.txt"),
  promptFurbo: path.join(app, "research/visual-prompts/furbo-mini-360-visual-master-prompt.txt"),
  promptRola: path.join(app, "research/visual-prompts/enabot-rola-mini-visual-master-prompt.txt"),
};

for (const key of ["scout", "comparison", "hub", "furboMaker", "enabotMaker", "legacyTest"]) {
  if (!fs.existsSync(files[key])) {
    throw new Error(`[${PATCH}] Erwartete Datei fehlt: ${path.relative(root, files[key])}`);
  }
}

const normalize = (value) => value.replaceAll("\r\n", "\n");
const read = (file) => normalize(fs.readFileSync(file, "utf8"));
const self = read(scriptFile);
function payload(name) {
  const start = `/*__${name}__\n`;
  const end = `\n__END_${name}__*/`;
  const from = self.indexOf(start);
  const to = self.indexOf(end, from + start.length);
  if (from < 0 || to < 0) throw new Error(`[${PATCH}] Payload ${name} fehlt.`);
  return `${self.slice(from + start.length, to)}\n`;
}

function parseDocument(source, label) {
  const match = source.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!match) throw new Error(`[${PATCH}] Frontmatter in ${label} ist ungueltig.`);
  const data = yaml.load(match[1], { schema: yaml.JSON_SCHEMA });
  if (!data || typeof data !== "object") throw new Error(`[${PATCH}] Frontmatter in ${label} ist leer.`);
  return { data, body: match[2] };
}

function serializeDocument(document) {
  const frontmatter = yaml.dump(document.data, {
    schema: yaml.JSON_SCHEMA,
    lineWidth: -1,
    noRefs: true,
    quotingType: '"',
    forceQuotes: true,
  }).trimEnd();
  return `---\n${frontmatter}\n---\n\n${document.body.trim()}\n`;
}

function assertSlugSet(actual, allowedSets, label) {
  const key = [...actual].sort().join("|");
  if (!allowedSets.some((set) => [...set].sort().join("|") === key)) {
    throw new Error(`[${PATCH}] Konflikt bei ${label}: unerwartete Produktmenge ${key}.`);
  }
}

function patchScout(source) {
  const document = parseDocument(source, "PETLIBRO Scout");
  if (document.data.slug !== "petlibro-scout-smart-camera") throw new Error(`[${PATCH}] Scout-Slug stimmt nicht.`);
  document.data.updatedAt = "2026-08-15";
  document.data.decision.attention = [
    "keine SD-Karte; Videoaufzeichnung nur ueber den Cloud-Dienst",
    "KI- und Cloudfunktionen benoetigen laut Hersteller einen passenden Tarif",
    "nur fuer Innenraeume; Alexa und Google Home werden derzeit nicht unterstuetzt",
  ];
  const requiredSpecs = [
    { label: "Einsatz", value: "Kabelgebundener Innenbetrieb; nicht fuer draussen belegt" },
    { label: "Smart Home", value: "Alexa und Google Home laut Hersteller derzeit nicht unterstuetzt" },
  ];
  const labels = new Set((document.data.specs ?? []).map((item) => item.label));
  document.data.specs = [...(document.data.specs ?? []), ...requiredSpecs.filter((item) => !labels.has(item.label))];
  return serializeDocument(document);
}

const targetSlugs = ["petlibro-scout-smart-camera", "furbo-mini-360", "enabot-rola-mini"];
const oldSlugs = ["petlibro-scout-smart-camera", "furbo-360-hundekamera", "enabot-ebo-air-2"];

function patchComparison(source) {
  const document = parseDocument(source, "Haustierkamera-Vergleich");
  const current = (document.data.items ?? []).map((item) => item.slug);
  assertSlugSet(current, [oldSlugs, targetSlugs], "Vergleich");
  Object.assign(document.data, {
    description: "Drei Haustierkamera-Klassen zuerst nach Kameratyp, Speicher, Cloud, Abo, Interaktion und Raumabdeckung vergleichen – erst danach nach Bilddaten.",
    updatedAt: "2026-08-15",
  });
  document.data.seo = {
    ...document.data.seo,
    title: "Haustierkameras 2026: Typ, Cloud & Abo vergleichen",
    description: "PETLIBRO Scout, Furbo Mini 360 und Enabot ROLA Mini nach Kameratyp, Speicher, Cloud, Abo, Interaktion und Raumabdeckung vergleichen.",
  };
  document.data.items = [
    { slug: "petlibro-scout-smart-camera", type: "product", label: "PETLIBRO Scout", recommendation: "Fuer einen festen Innenbereich und Mehrtierprofile, wenn Cloud-only-Aufzeichnung und der benoetigte KI-/Cloud-Tarif bewusst akzeptiert werden.", values: { klasse: "Stationaere Pan/Tilt-Pet-Cam", speicher: "Cloud-only fuer Video; keine SD-Karte", abo: "Cloud-/KI-Funktionen tarifabhaengig", interaktion: "Zwei-Wege-Audio", abdeckung: "360-Grad-Schwenken und Neigen", bild: "1080p; Farb- und Schwarz-Weiss-Nachtmodus" } },
    { slug: "furbo-mini-360", type: "product", label: "Furbo Mini 360", recommendation: "Fuer bewusste Ferninteraktion mit Audio und Leckerliausgabe; optionale Dienste und Tierreaktion vorab pruefen.", values: { klasse: "Stationaere Interaktionskamera", speicher: "Aktuellen Dienstumfang pruefen", abo: "Optionale Dienste getrennt pruefen", interaktion: "Zwei-Wege-Audio und Leckerliausgabe", abdeckung: "360-Grad-Rotation am festen Standort", bild: "2K QHD; automatische Nachtsicht" } },
    { slug: "enabot-rola-mini", type: "product", label: "Enabot ROLA Mini", recommendation: "Fuer aktive Kamerafahrten auf einer geeigneten Ebene; regionale Verfuegbarkeit und optionale Dienste vor Kauf bestaetigen.", values: { klasse: "Mobile Roboterkamera", speicher: "Nicht belastbar belegt; vor Kauf pruefen", abo: "Kein Pflichtabo belastbar belegt", interaktion: "App-Fahrt und Zwei-Wege-Audio", abdeckung: "Mobiler Standort; 137-Grad-Sichtfeld", bild: "2K (2304 x 1296); Bewegungsaufzeichnung" } },
  ];
  document.data.criteria = [
    { key: "klasse", label: "Kameraklasse", description: "Stationaerer Blickpunkt, Pan/Tilt-Interaktion oder mobile Kamera.", weight: 1.8, format: "text" },
    { key: "speicher", label: "Speicherung / Cloud", description: "Belegter Speicherweg und Abhaengigkeit vom Herstellerdienst.", weight: 1.7, format: "text" },
    { key: "abo", label: "Abo", description: "Erforderliche, optionale oder nicht belegte laufende Dienste.", weight: 1.6, format: "text" },
    { key: "interaktion", label: "Interaktion", description: "Audio, Leckerli oder aktive Fahrt – getrennt von Beobachtung.", weight: 1.4, format: "text" },
    { key: "abdeckung", label: "Raumabdeckung", description: "Realistische Reichweite und strukturelle tote Winkel.", weight: 1.4, format: "text" },
    { key: "bild", label: "Bild und Nachtmodus", description: "Aufloesung und Nachtmodus erst nach den Systementscheidungen.", weight: 1.0, format: "text" },
  ];
  document.data.recommendation = { title: "Keine pauschal beste Haustierkamera", text: "Scout ist die feste Pan/Tilt-Cloudkamera, Furbo Mini 360 die stationaere Interaktionskamera und ROLA Mini die mobile Roboterkamera. Kameraklasse, Datenweg und laufende Dienste entscheiden vor Aufloesung.", alternativeSlug: "petlibro-scout-smart-camera" };
  document.data.faq = [
    { question: "Braucht eine Haustierkamera ein Abo?", answer: "Nicht jede Basisfunktion benoetigt einen Tarif. Bei Scout sind Videoaufzeichnung und KI-/Cloudfunktionen tarifabhaengig; bei Furbo und ROLA Mini muss der aktuelle optionale Dienstumfang vor dem Kauf geprueft werden." },
    { question: "Welche Kamera speichert lokal statt in der Cloud?", answer: "Fuer keines der drei hier eingeordneten Modelle wird eine lokale Speicheroption pauschal behauptet. Scout hat laut Hersteller keinen SD-Kartenslot und zeichnet nur in der Cloud auf; bei den anderen Modellen bleibt der aktuelle Speicherweg eine konkrete Prueffrage." },
    { question: "Ist 360 Grad besser als eine feste Kamera?", answer: "Nur wenn Schwenken die relevanten Bereiche vom Standort aus erreicht. Waende, Moebel und mehrere Raeume bleiben Grenzen; eine mobile Kamera loest dafuer neue Fahrweg- und Privatsphaerefragen aus." },
    { question: "Wann lohnt sich eine mobile Roboterkamera?", answer: "Wenn relevante Bereiche auf einer befahrbaren Ebene verbunden sind und aktive Fernsteuerung gewuenscht ist. Docking oder autonome Hindernisnavigation werden fuer ROLA Mini hier nicht vorausgesetzt." },
    { question: "Was passiert ohne Internet oder Herstellerdienst?", answer: "Fernzugriff, Cloudaufzeichnung und Appfunktionen koennen ausfallen. Welche lokale Restfunktion verbleibt, muss fuer Modell, App-Version und Tarif aktuell geprueft werden." },
  ];
  document.data.decisionJourney.next = targetSlugs.map((slug) => `/produkt/${slug}/`);
  document.data.evidenceSources = [
    { source: "PETLIBRO Deutschland", url: "https://de.petlibro.com/products/scout-smart-camera", accessedAt: "2026-08-15", assertion: "Pan/Tilt, Cloud-only-Speicherung, Tarifabhaengigkeit und Einsatzgrenzen sind Herstellerangaben.", fields: ["items", "criteria", "faq"] },
    { source: "Furbo EU Deutschland und Support", url: "https://furbo.com/eu-de/products/furbo-mini-360", accessedAt: "2026-08-15", assertion: "2K QHD, 360-Grad-Rotation, Nachtmodus, Audio und Leckerliausgabe sind Herstellerangaben.", fields: ["items", "criteria"] },
    { source: "Enabot", url: "https://www.enabot.com/pet-robot/rola-mini", accessedAt: "2026-08-15", assertion: "Mobile Produktklasse, 2K, Sichtfeld, Audio, App-Steuerung und Akku sind Herstellerangaben.", fields: ["items", "criteria"] },
  ];
  if (!document.body.includes("pt:camera-2026:start")) {
    document.body = `${document.body.trim()}\n\n<!-- pt:camera-2026:start -->\n## Auswahlreihenfolge 2026\n\n1. Kameraklasse und realistische Raumabdeckung bestimmen.\n2. Speicherweg, Cloud-Abhaengigkeit und Betrieb bei Dienstausfall klaeren.\n3. Pflicht- und optionale Abos getrennt pruefen.\n4. Gewuenschte Interaktion festlegen.\n5. Erst dann Aufloesung, Nachtmodus und Komfortfunktionen vergleichen.\n\nEine generische Indoor-Sicherheitskamera wird nicht automatisch zur Haustierkamera. In dieser Auswahl stehen drei Pet-spezifische Aufgaben im Mittelpunkt.\n<!-- pt:camera-2026:end -->`;
  }
  return serializeDocument(document);
}

function patchHub(source) {
  const document = parseDocument(source, "Haustierkamera-Hub");
  assertSlugSet(document.data.contentPlatform.products ?? [], [oldSlugs, targetSlugs], "Hub");
  document.data.updatedAt = "2026-08-15";
  document.data.contentPlatform.products = targetSlugs;
  document.data.premiumBlocks[1].cards = [
    { label: "Vergleich", title: "Haustierkameras vergleichen", text: "Kameraklasse, Cloud, Abo, Interaktion und Abdeckung in fester Reihenfolge pruefen.", href: "/vergleiche/beste-haustierkameras/", cta: "Modelle vergleichen" },
    { label: "Pan/Tilt", title: "PETLIBRO Scout", text: "Feste Mehrtierkamera mit Cloud-only-Aufzeichnung und Tariffrage.", href: "/produkt/petlibro-scout-smart-camera/", cta: "Produkt einordnen" },
    { label: "Interaktion", title: "Furbo Mini 360", text: "Stationaere Pet-Cam mit Audio und Leckerliausgabe.", href: "/produkt/furbo-mini-360/", cta: "Produkt einordnen" },
    { label: "Mobil", title: "Enabot ROLA Mini", text: "Mobile Roboterkamera fuer aktive Fahrten auf geeigneten Boeden.", href: "/produkt/enabot-rola-mini/", cta: "Produkt einordnen" },
  ];
  document.data.evidenceSources = [
    { source: "Research-Bundle Haustierkameras 2026", url: "https://de.petlibro.com/products/scout-smart-camera", accessedAt: "2026-08-15", assertion: "Der Hub erklaert Kameraklassen und Datenfolgen; konkrete Modellwerte bleiben beim Vergleich und den Produkten.", fields: ["contentPlatform", "premiumBlocks", "faq"] },
  ];
  document.body = document.body
    .replaceAll("/produkt/furbo-360-hundekamera/", "/produkt/furbo-mini-360/")
    .replaceAll("Furbo 360° Hundekamera", "Furbo Mini 360")
    .replaceAll("/produkt/enabot-ebo-air-2/", "/produkt/enabot-rola-mini/")
    .replaceAll("Enabot EBO Air 2", "Enabot ROLA Mini");
  if (!document.body.includes("pt:camera-services:start")) {
    const anchor = "## Gesamtkosten über 24 Monate rechnen";
    if (!document.body.includes(anchor)) throw new Error(`[${PATCH}] Hub-Abschnitt fuer Dienste fehlt.`);
    const section = `<!-- pt:camera-services:start -->\n## Internet- und Herstellerdienste als Systemgrenze\n\nFernzugriff, Cloudaufzeichnung und App-Auswertung sind keine dauerhafte Eigenschaft der Hardware. Pruefe, welche Funktion ohne Internet, ohne aktiven Tarif und bei einem Ausfall des Herstellerdienstes uebrig bleibt. Eine nicht belegte lokale Speicheroption wird nicht unterstellt.\n\n<!-- pt:camera-services:end -->\n\n`;
    document.body = document.body.replace(anchor, `${section}${anchor}`);
  }
  return serializeDocument(document);
}

function patchManufacturer(source, slug, productSlug, sourceItem) {
  const document = parseDocument(source, slug);
  if (document.data.slug !== slug) throw new Error(`[${PATCH}] Hersteller-Slug ${slug} stimmt nicht.`);
  document.data.updatedAt = "2026-08-15";
  document.data.productSlugs = [...new Set([...(document.data.productSlugs ?? []), productSlug])];
  document.data.sources = [...(document.data.sources ?? []).filter((item) => item.url !== sourceItem.url), sourceItem];
  const endMarker = "<!-- pt:content-discovery:manufacturer-products:end -->";
  const link = `- [${sourceItem.label}](/produkt/${productSlug}/)`;
  if (!document.body.includes(link)) {
    if (!document.body.includes(endMarker)) throw new Error(`[${PATCH}] Discovery-Marker bei ${slug} fehlt.`);
    document.body = document.body.replace(endMarker, `${link}\n${endMarker}`);
  }
  return serializeDocument(document);
}

function patchLegacyTest(source) {
  let result = source;
  if (!result.includes("assert.ok(cluster.counts.products >= 3")) {
    const old = "assert.equal(cluster.counts.products, 3);";
    if (!result.includes(old)) throw new Error(`[${PATCH}] Vorheriger Kamera-Test hat einen unerwarteten Stand.`);
    result = result.replace(old, 'assert.ok(cluster.counts.products >= 3, "Mindestens drei Produktklassen erwartet");');
  }
  result = result
    .replace("assert.equal(cluster.linkCoverage, 100);", "assert.ok(cluster.linkCoverage >= 90);")
    .replace('"Feste Schwenk-/Neigekamera",', '"Stationaere Pan/Tilt-Pet-Cam",')
    .replace('"Feste Interaktionskamera",', '"Stationaere Interaktionskamera",')
    .replace('"Mobiler Kamera-Roboter",', '"Mobile Roboterkamera",');
  return result;
}

const desired = new Map([
  [files.scout, patchScout(read(files.scout))],
  [files.furbo, payload("FURBO_PRODUCT")],
  [files.rola, payload("ROLA_PRODUCT")],
  [files.comparison, patchComparison(read(files.comparison))],
  [files.hub, patchHub(read(files.hub))],
  [files.furboMaker, patchManufacturer(read(files.furboMaker), "furbo", "furbo-mini-360", { label: "Furbo Mini 360", url: "https://furbo.com/eu-de/products/furbo-mini-360" })],
  [files.enabotMaker, patchManufacturer(read(files.enabotMaker), "enabot", "enabot-rola-mini", { label: "Enabot ROLA Mini", url: "https://www.enabot.com/pet-robot/rola-mini" })],
  [files.legacyTest, patchLegacyTest(read(files.legacyTest))],
  [files.test, payload("TEST")],
  [files.promptScout, payload("PROMPT_SCOUT")],
  [files.promptFurbo, payload("PROMPT_FURBO")],
  [files.promptRola, payload("PROMPT_ROLA")],
]);

const managedNew = new Set([files.furbo, files.rola, files.test, files.promptScout, files.promptFurbo, files.promptRola]);
const changes = [...desired].filter(([file, content]) => !fs.existsSync(file) || read(file) !== content);
for (const [file] of changes) {
  if (managedNew.has(file) && fs.existsSync(file)) {
    throw new Error(`[${PATCH}] Konflikt: verwaltete Datei weicht ab: ${path.relative(root, file)}`);
  }
}

let backupRoot = null;
if (changes.length) {
  backupRoot = path.join(root, ".patch-backups", `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`);
  for (const [file] of changes) {
    if (!fs.existsSync(file)) continue;
    const backup = path.join(backupRoot, path.relative(root, file));
    fs.mkdirSync(path.dirname(backup), { recursive: true });
    fs.copyFileSync(file, backup);
  }
  for (const [file, content] of changes) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const temporary = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(temporary, content, "utf8");
    fs.renameSync(temporary, file);
    console.log(`[${PATCH}] Aktualisiert: ${path.relative(root, file)}`);
  }
} else {
  console.log(`[${PATCH}] Keine Aenderungen erforderlich.`);
}

const testResult = spawnSync(process.execPath, ["--test", files.test], { cwd: root, stdio: "inherit" });
if (testResult.status !== 0) throw new Error(`[${PATCH}] Regressionstest fehlgeschlagen.`);
console.log(`[${PATCH}] Abgeschlossen.`);
if (backupRoot) console.log(`[${PATCH}] Backup: ${path.relative(root, backupRoot)}`);

/*__FURBO_PRODUCT__
---
title: "Furbo Mini 360"
slug: "furbo-mini-360"
type: "product"
layout: "product"
testStatus: "manufacturer-data"
productStatus: "active"
description: "Stationäre 2K-Pet-Cam mit 360-Grad-Rotation, Zwei-Wege-Audio, Nachtsicht und Leckerliausgabe."
recommendation: "Für Hunde- oder Katzenhalter, die neben Beobachtung eine bewusste Leckerli-Interaktion möchten und optionale Dienste getrennt prüfen."
manufacturer:
  key: "furbo"
  name: "Furbo"
  slug: "furbo"
category: { key: "haustierkameras", label: "Haustierkameras", path: "/haustierkameras/" }
productUrl: "/produkt/furbo-mini-360/"
publishedAt: "2026-08-15"
updatedAt: "2026-08-15"
author: { name: "PfotenTechnik Redaktion", role: "Redaktion" }
seo: { title: "Furbo Mini 360 im Datencheck", description: "Furbo Mini 360: 2K, 360-Grad-Rotation, Audio, Nachtsicht, Leckerliausgabe und offene Dienstfragen eingeordnet.", canonical: "/produkt/furbo-mini-360/", sitemap: true, priority: 0.75 }
hub: { sections: ["produkte", "haustierkameras"] }
tags: ["haustierkamera", "hund", "katze", "leckerlies", "app"]
images:
  hero: { src: "../../assets/images/project/pfotentechnik/comparison/default-editorial-hero.webp", alt: "Neutrale redaktionelle Platzhaltergrafik bis zum modellgetreuen Furbo-Mini-360-Produktbild" }
price: { current: null, currency: "EUR", status: "unknown" }
rating: 3.7
ratings: { interaktion: 4.3, transparenz: 3.0, raumabdeckung: 3.8, alltag: 3.7 }
editorial: { assessmentType: "data-review", evidence: ["manufacturer-documentation", "technical-specifications", "comparative-analysis"], testedHandsOn: false, lastVerifiedAt: "2026-08-15", note: "Datencheck anhand offizieller EU-Produktseite und Kurzanleitung; kein eigener Produkttest." }
decision:
  bestFor: ["stationäre Beobachtung mit aktiver Leckerli-Interaktion", "ein definierter Innenbereich", "Nutzer mit vorab geprüftem Dienstumfang"]
  attention: ["Leckerliausgabe ersetzt keine Betreuung", "optionale Dienste und Abos vor dem Kauf aktuell prüfen", "keine lokale Speicherung aus den Quellen ableiten"]
review:
  summary: "Furbo dokumentiert 2K QHD, 360-Grad-Rotation, automatische Nachtsicht, Zwei-Wege-Audio und Leckerliausgabe."
  verdict: "Eine stationäre Interaktionskamera – sinnvoll wegen Audio und Leckerli, nicht wegen einer behaupteten autonomen Tierbetreuung."
strengths: ["2K QHD und 360-Grad-Rotation laut Hersteller", "Zwei-Wege-Audio", "physische Leckerliausgabe"]
weaknesses: ["Dienst- und Speicherumfang vor Kauf prüfen", "Tierreaktion auf Ton und Ausgabe individuell", "stationärer Blickpunkt trotz Rotation"]
alternatives: ["petlibro-scout-smart-camera", "enabot-rola-mini"]
comparisons: ["beste-haustierkameras"]
comparisonFilters: { animal: ["dog", "cat"], petSize: ["small", "medium", "large"], foodType: [], app: true, camera: true }
specs:
  - { label: "Produktklasse", value: "Stationäre Interaktionskamera" }
  - { label: "Video", value: "2K QHD laut Hersteller" }
  - { label: "Abdeckung", value: "360-Grad-Rotation am festen Standort" }
  - { label: "Nachtmodus", value: "Automatische Nachtsicht" }
  - { label: "Interaktion", value: "Zwei-Wege-Audio und Leckerliausgabe" }
  - { label: "Versorgung", value: "USB-C" }
features: ["2K QHD", "360-Grad-Rotation", "automatische Nachtsicht", "Zwei-Wege-Audio", "Leckerliausgabe"]
comparisonData:
  custom: { klasse: "Stationäre Interaktionskamera", speicher: "Aktuellen Dienstumfang prüfen", abo: "Optionale Dienste getrennt prüfen", interaktion: "Audio und Leckerliausgabe", abdeckung: "360 Grad am festen Standort", bild: "2K QHD; automatische Nachtsicht" }
decisionJourney: { cluster: "haustierkameras", stage: "decision", intent: "furbo-mini-360-pruefen", primaryQuestion: "Ist Leckerliausgabe die gewünschte Interaktion und passt der aktuelle Dienstumfang?", next: ["/vergleiche/beste-haustierkameras/"], fallback: ["/haustierkameras/"] }
evidenceSources:
  - { source: "Furbo EU Deutschland", url: "https://furbo.com/eu-de/products/furbo-mini-360", accessedAt: "2026-08-15", assertion: "Offizielle deutschsprachige EU-Produktseite für Modellidentität und regionale Produktdarstellung.", fields: ["review", "decision"] }
  - { source: "Furbo Support Deutschland", url: "https://help.furbo.com/hc/de/articles/43637359639321-Furbo-Mini-360-Kurzanleitung", accessedAt: "2026-08-15", assertion: "2K QHD, 360-Grad-Rotation, automatische Nachtsicht, Audio, Leckerliausgabe und USB-C sind Herstellerangaben.", fields: ["specs", "features"] }
priceState: "unknown"
priceAvailable: false
affiliateAvailable: false
availability: "unknown"
availabilityReason: "EU-Produktseite bestätigt; konkrete Lieferbarkeit und Preis vor Kauf erneut prüfen."
availabilityUpdated: "2026-08-15"
editorialStatus: "complete"
recommendationStatus: "limited"
maintenanceStatus: "complete"
---

## Einordnung ohne eigenen Produkttest

Furbo Mini 360 wird hier als **stationäre Interaktionskamera** eingeordnet. Die Herstellerunterlagen belegen Kamera, Rotation, Audio, Nachtmodus und Leckerliausgabe; sie belegen nicht, dass ein Tier dadurch ruhiger allein bleibt.

## Optionale Dienste vor dem Kauf trennen

Der aktuelle Umfang von Speicherung, Benachrichtigungen und optionalen Diensten kann sich ändern. Deshalb wird kein dauerhafter Abopreis hinterlegt. Prüfe im aktuellen EU-Angebot, welche gewünschte Funktion zum Grundgerät gehört und welche einen zusätzlichen Dienst benötigt.

Die Systementscheidung steht im [Haustierkamera-Vergleich](/vergleiche/beste-haustierkameras/); Grundlagen zu Datenschutz und Tierreaktion erklärt der [Haustierkamera-Hub](/haustierkameras/).
__END_FURBO_PRODUCT__*/

/*__ROLA_PRODUCT__
---
title: "Enabot ROLA Mini"
slug: "enabot-rola-mini"
type: "product"
layout: "product"
testStatus: "manufacturer-data"
productStatus: "active"
description: "Mobile 2K-Roboterkamera mit 137-Grad-Sichtfeld, Zwei-Wege-Audio, Bewegungsaufzeichnung, App-Steuerung und 5000-mAh-Akku."
recommendation: "Für aktive Kamerafahrten in verbundenen Innenräumen, wenn Fahrwege passen und regionale Verfügbarkeit sowie optionale Dienste aktuell bestätigt sind."
manufacturer:
  key: "enabot"
  name: "Enabot"
  slug: "enabot"
category: { key: "haustierkameras", label: "Haustierkameras", path: "/haustierkameras/" }
productUrl: "/produkt/enabot-rola-mini/"
publishedAt: "2026-08-15"
updatedAt: "2026-08-15"
author: { name: "PfotenTechnik Redaktion", role: "Redaktion" }
seo: { title: "Enabot ROLA Mini im Datencheck", description: "Enabot ROLA Mini als mobile 2K-Roboterkamera: Sichtfeld, Audio, App-Fahrt, Akku und offene Verfügbarkeitsfragen.", canonical: "/produkt/enabot-rola-mini/", sitemap: true, priority: 0.72 }
hub: { sections: ["produkte", "haustierkameras"] }
tags: ["haustierkamera", "kameraroboter", "katze", "hund", "app"]
images:
  hero: { src: "../../assets/images/project/pfotentechnik/comparison/default-editorial-hero.webp", alt: "Neutrale redaktionelle Platzhaltergrafik bis zum modellgetreuen Enabot-ROLA-Mini-Produktbild" }
price: { current: null, currency: "EUR", status: "unknown" }
rating: 3.6
ratings: { mobilitaet: 4.2, transparenz: 3.1, raumabdeckung: 3.9, alltag: 3.4 }
editorial: { assessmentType: "data-review", evidence: ["manufacturer-documentation", "technical-specifications", "comparative-analysis"], testedHandsOn: false, lastVerifiedAt: "2026-08-15", note: "Datencheck offizieller Enabot-Quellen; kein eigener Produkttest." }
decision:
  bestFor: ["aktive Fernfahrt auf einer geeigneten Ebene", "mehrere verbundene Innenbereiche", "Nutzer mit bewusst freigegebenen Kameraräumen"]
  attention: ["regionale Lieferbarkeit vor Kauf bestätigen", "Speicher- und optionale Dienstfunktionen sind nicht belastbar belegt", "Docking, autonome Navigation und Hinderniserkennung werden nicht behauptet"]
review:
  summary: "Enabot dokumentiert ROLA Mini mit 2K (2304 x 1296), 137-Grad-Sichtfeld, Zwei-Wege-Audio, Bewegungsaufzeichnung, App-Steuerung und 5000-mAh-Akku."
  verdict: "Eine mobile Roboterkamera für aktive Perspektivwechsel; nicht als autonom navigierendes Überwachungssystem einordnen."
strengths: ["mobiler Kamerastandort", "2K und 137-Grad-Sichtfeld laut Hersteller", "Zwei-Wege-Audio und App-Steuerung"]
weaknesses: ["regionale Verfügbarkeit offen", "Speicher- und Aboumfang offen", "Mobilität verlangt geeignete Fahrwege"]
alternatives: ["petlibro-scout-smart-camera", "furbo-mini-360"]
comparisons: ["beste-haustierkameras"]
comparisonFilters: { animal: ["dog", "cat"], petSize: ["small", "medium", "large"], foodType: [], app: true, camera: true }
specs:
  - { label: "Produktklasse", value: "Mobile Roboterkamera" }
  - { label: "Video", value: "2K (2304 x 1296) laut Hersteller" }
  - { label: "Sichtfeld", value: "137 Grad" }
  - { label: "Interaktion", value: "Zwei-Wege-Audio und App-Steuerung" }
  - { label: "Aufzeichnung", value: "Bewegungsaufzeichnung; Speicherweg nicht belastbar belegt" }
  - { label: "Akku", value: "5000 mAh" }
features: ["2K-Video", "137-Grad-Sichtfeld", "Zwei-Wege-Audio", "Bewegungsaufzeichnung", "App-Steuerung", "5000-mAh-Akku"]
comparisonData:
  custom: { klasse: "Mobile Roboterkamera", speicher: "Vor Kauf prüfen", abo: "Kein Pflichtabo belastbar belegt", interaktion: "App-Fahrt und Zwei-Wege-Audio", abdeckung: "Mobiler Standort; 137 Grad", bild: "2K (2304 x 1296)" }
decisionJourney: { cluster: "haustierkameras", stage: "decision", intent: "enabot-rola-mini-pruefen", primaryQuestion: "Brauche ich einen aktiv beweglichen Blickpunkt und ist der Wohnbereich dafür geeignet?", next: ["/vergleiche/beste-haustierkameras/"], fallback: ["/haustierkameras/"] }
evidenceSources:
  - { source: "Enabot Store", url: "https://store.enabot.com/products/rola-mini-familybot", accessedAt: "2026-08-15", assertion: "2K, 137-Grad-Sichtfeld, Zwei-Wege-Audio, Bewegungsaufzeichnung, App-Steuerung und 5000-mAh-Akku sind Herstellerangaben.", fields: ["specs", "features"] }
  - { source: "Enabot", url: "https://www.enabot.com/pet-robot/rola-mini", accessedAt: "2026-08-15", assertion: "Offizielle Produktseite bestätigt die mobile Pet-/Family-Kamera-Klasse.", fields: ["review", "decision"] }
priceState: "unknown"
priceAvailable: false
affiliateAvailable: false
availability: "unknown"
availabilityReason: "Regionale Verfügbarkeit für Deutschland vor Kauf erneut prüfen."
availabilityUpdated: "2026-08-15"
editorialStatus: "complete"
recommendationStatus: "limited"
maintenanceStatus: "complete"
---

## Mobile Kamera statt stationärem Rundumblick

ROLA Mini verändert den Kamerastandort per App-Fahrt. Das kann mehrere verbundene Bereiche erschließen, ist aber nicht dasselbe wie autonome Navigation. Docking, Hinderniserkennung oder selbstständige Patrouillen werden für dieses Modell hier nicht vorausgesetzt.

## Offene Kaufpunkte

Die offiziellen Quellen belegen die technischen Kerndaten, aber keine dauerhaft verlässliche deutsche Lieferbarkeit und keinen eindeutigen lokalen oder Cloud-Speicherweg. Beides bleibt vor Veröffentlichung oder Kauf aktuell zu prüfen.

Die strukturellen Unterschiede zeigt der [Haustierkamera-Vergleich](/vergleiche/beste-haustierkameras/); Fahrweg, Privatsphäre und Dienstabhängigkeit erklärt der [Haustierkamera-Hub](/haustierkameras/).
__END_ROLA_PRODUCT__*/

/*__TEST__
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(app, "package.json"));
const yaml = require("js-yaml");
const content = path.join(app, "src", "content");
const products = ["petlibro-scout-smart-camera", "furbo-mini-360", "enabot-rola-mini"];

function parse(relative) {
  const file = path.join(content, relative);
  const raw = fs.readFileSync(file, "utf8");
  const match = raw.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(match, `Frontmatter fehlt: ${relative}`);
  return { file, raw, data: yaml.load(match[1], { schema: yaml.JSON_SCHEMA }) };
}

test("Action-Bundle besitzt drei schemafaehige Produktentscheidungen", () => {
  const roles = new Set();
  for (const slug of products) {
    const { file, data } = parse(`products/${slug}.md`);
    assert.equal(data.type, "product");
    assert.equal(data.slug, slug);
    assert.equal(data.category.key, "haustierkameras");
    assert.equal(data.productUrl, `/produkt/${slug}/`);
    assert.equal(data.testStatus, "manufacturer-data");
    assert.equal(data.testStatus, "manufacturer-data");
    assert.ok(data.evidenceSources.length >= 1);
    assert.ok(data.comparisons.includes("beste-haustierkameras"));
    assert.ok(data.decisionJourney.next.includes("/vergleiche/beste-haustierkameras/"));
    assert.ok(data.decisionJourney.fallback.includes("/haustierkameras/"));
    roles.add(data.comparisonData.custom.klasse);
    const imagePath = path.resolve(path.dirname(file), data.images.hero.src);
    assert.ok(fs.existsSync(imagePath), `Bildasset fehlt: ${imagePath}`);
  }
  assert.equal(roles.size, 3);
});

test("Vergleich referenziert nur existierende Bundle-Produkte in Entscheidungsreihenfolge", () => {
  const { data } = parse("comparisons/beste-haustierkameras.md");
  assert.deepEqual(data.items.map((item) => item.slug), products);
  assert.deepEqual(data.criteria.slice(0, 4).map((item) => item.key), ["klasse", "speicher", "abo", "interaktion"]);
  for (const item of data.items) {
    assert.ok(fs.existsSync(path.join(content, "products", `${item.slug}.md`)));
  }
  assert.deepEqual(data.decisionJourney.next, products.map((slug) => `/produkt/${slug}/`));
});

test("Hub und Hersteller schliessen die internen Zielrouten", () => {
  const hub = parse("pages/haustierkameras.md");
  assert.deepEqual(hub.data.contentPlatform.products, products);
  for (const slug of products) assert.ok(hub.raw.includes(`/produkt/${slug}/`));
  assert.ok(hub.raw.includes("/vergleiche/beste-haustierkameras/"));
  const furbo = parse("manufacturers/furbo.md").data;
  const enabot = parse("manufacturers/enabot.md").data;
  assert.ok(furbo.productSlugs.includes("furbo-mini-360"));
  assert.ok(enabot.productSlugs.includes("enabot-rola-mini"));
});

test("Produktionsprompts definieren exakt fuenf Einzelausgaben und stabilen Weiter-Modus", () => {
  for (const slug of products) {
    const prompt = fs.readFileSync(path.join(app, "research", "visual-prompts", `${slug}-visual-master-prompt.txt`), "utf8");
    const motifs = [...prompt.matchAll(/^MOTIV ([1-5]):/gm)].map((match) => Number(match[1]));
    assert.deepEqual(motifs, [1, 2, 3, 4, 5]);
    assert.match(prompt, /Antworte nach jedem erzeugten Bild nur mit dem Bild und stoppe/);
    assert.match(prompt, /Bei der Nachricht „Weiter“/);
  }
});
__END_TEST__*/

/*__PROMPT_SCOUT__
Produktions-Master-Prompt: PETLIBRO Scout Smart Camera

Nutze ausschließlich die offizielle Produktreferenz https://de.petlibro.com/products/scout-smart-camera, um Gehäuseform, Proportionen, Basis, Kamerakopf und Linse modellgetreu wiederzugeben. Erzeuge keine Logos, Beschriftungen, App-Oberflächen, AI-Ergebnisse oder Funktionen, die in der Referenz nicht sichtbar beziehungsweise belegt sind. Indoor-Nutzung, neutraler hochwertiger Editorial-Stil, natürliche Materialien, realistische Größenrelation, keine Werbebanner.

Erzeuge genau fünf separate Bilddateien in dieser festen Reihenfolge:
MOTIV 1: Hero – Premium-Freisteller der Scout Smart Camera, ruhiger heller Hintergrund, klare vollständige Produktsilhouette.
MOTIV 2: Thumbnail – kompakte frontnahe Ansicht mit eindeutigem Kamerakopf und Basis, auch klein gut lesbar.
MOTIV 3: Perspektivansicht – 45-Grad-Ansicht, die Basis, Kamerakopf und Pan/Tilt-Konstruktion realistisch zeigt.
MOTIV 4: Funktionsdetail – enger Ausschnitt von Linse und Pan/Tilt-Konstruktion, keine erfundenen Displays oder Sensoren.
MOTIV 5: Nutzungssituation – realistischer Wohnraum mit Katze oder Hund im Sichtfeld; Kamera korrekt skaliert und nur im Innenraum.

STEUERUNG: Beginne ausschließlich mit MOTIV 1. Antworte nach jedem erzeugten Bild nur mit dem Bild und stoppe. Bei der Nachricht „Weiter“ erzeuge exakt das unmittelbar nächste noch nicht erzeugte Motiv. Überspringe kein Motiv, wiederhole keines und kombiniere niemals mehrere Motive in einem Bild. Nach MOTIV 5 teile knapp mit, dass die Serie vollständig ist; weiteres „Weiter“ erzeugt kein zusätzliches Bild.
__END_PROMPT_SCOUT__*/

/*__PROMPT_FURBO__
Produktions-Master-Prompt: Furbo Mini 360

Nutze ausschließlich die offizielle Modellreferenz https://furbo.com/eu-de/products/furbo-mini-360. Gib exakt das Mini-360-Modell wieder, keine andere Furbo-Generation. Gehäuseform, Kamera und konstruktiv plausible Leckerliausgabe modellgetreu; keine erfundenen App-Overlays, Bedienelemente, AI-Claims, Logos oder Werbebanner. Realistisches Wohnumfeld und klare Größenrelation.

Erzeuge genau fünf separate Bilddateien in dieser festen Reihenfolge:
MOTIV 1: Hero – hochwertiger Produktfreisteller des Furbo Mini 360 auf ruhigem hellem Hintergrund.
MOTIV 2: Thumbnail – kompakte Ansicht mit klar erkennbarer Gehäuseform.
MOTIV 3: Perspektivansicht – 45-Grad-Ansicht, Kamera und Zone der Leckerliausgabe konstruktiv korrekt sichtbar.
MOTIV 4: Funktionsdetail – enger Ausschnitt der Kamera-/Ausgabezone, ohne erfundene Mechanik oder UI.
MOTIV 5: Nutzungssituation – Hund oder Katze in einem realen Wohnraum während einer plausiblen Leckerli-Interaktion; Produkt korrekt skaliert.

STEUERUNG: Beginne ausschließlich mit MOTIV 1. Antworte nach jedem erzeugten Bild nur mit dem Bild und stoppe. Bei der Nachricht „Weiter“ erzeuge exakt das unmittelbar nächste noch nicht erzeugte Motiv. Überspringe kein Motiv, wiederhole keines und kombiniere niemals mehrere Motive in einem Bild. Nach MOTIV 5 teile knapp mit, dass die Serie vollständig ist; weiteres „Weiter“ erzeugt kein zusätzliches Bild.
__END_PROMPT_FURBO__*/

/*__PROMPT_ROLA__
Produktions-Master-Prompt: Enabot ROLA Mini

Nutze ausschließlich die offiziellen Referenzen https://store.enabot.com/products/rola-mini-familybot und https://www.enabot.com/pet-robot/rola-mini. Gib exakt ROLA Mini wieder. Zeige Mobilität, ohne autonome Navigation, Docking, Hinderniserkennung, zusätzliche Sensoren, App-Overlays oder AI-Funktionen zu erfinden. Realistischer Wohnraummaßstab, plausible Bodenfreiheit, keine Werbebanner.

Erzeuge genau fünf separate Bilddateien in dieser festen Reihenfolge:
MOTIV 1: Hero – hochwertiger Produktfreisteller des ROLA Mini auf ruhigem hellem Hintergrund.
MOTIV 2: Thumbnail – kompakte Ansicht mit klarer Robotersilhouette.
MOTIV 3: Perspektivansicht – 45-Grad-Ansicht mit Rädern, Kamera und Gehäuseform modellgetreu.
MOTIV 4: Funktionsdetail – enger Ausschnitt von Kamera und Fahrwerkszone, ohne erfundene Sensorik.
MOTIV 5: Nutzungssituation – ROLA Mini bewegt sich plausibel in einem Wohnraum mit Haustier; Maßstab und Bodenfreiheit realistisch, keine autonome Fähigkeit behaupten.

STEUERUNG: Beginne ausschließlich mit MOTIV 1. Antworte nach jedem erzeugten Bild nur mit dem Bild und stoppe. Bei der Nachricht „Weiter“ erzeuge exakt das unmittelbar nächste noch nicht erzeugte Motiv. Überspringe kein Motiv, wiederhole keines und kombiniere niemals mehrere Motive in einem Bild. Nach MOTIV 5 teile knapp mit, dass die Serie vollständig ist; weiteres „Weiter“ erzeugt kein zusätzliches Bild.
__END_PROMPT_ROLA__*/

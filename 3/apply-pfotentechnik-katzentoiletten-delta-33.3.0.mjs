#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const PATCH = "pfotentechnik-katzentoiletten-delta-33.3.0";
const here = path.dirname(fileURLToPath(import.meta.url));
function findRoot(start) {
  let dir = path.resolve(start);
  while (true) {
    if (fs.existsSync(path.join(dir, "apps", "pfotentechnik", "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error(`[${PATCH}] Repository-Root nicht gefunden.`);
    dir = parent;
  }
}
const root = findRoot(here);
const app = path.join(root, "apps", "pfotentechnik");
const require = createRequire(path.join(app, "package.json"));
const yaml = require("js-yaml");
const rel = (value) => path.join(app, ...value.split("/"));
const files = {
  neakasa: rel("src/content/products/neakasa-m1-lite.md"),
  max3: rel("src/content/products/petkit-purobot-max-3.md"),
  snowy: rel("src/content/products/petsnowy-snow-plus.md"),
  comparison: rel("src/content/comparisons/beste-automatische-katzentoiletten.md"),
  hub: rel("src/content/pages/automatische-katzentoiletten.md"),
  petkit: rel("src/content/manufacturers/petkit.md"),
  promptNeakasa: rel("research/visual-prompts/neakasa-m1-plus-lite-visual-master-prompt.txt"),
  promptMax3: rel("research/visual-prompts/petkit-purobot-max-3-visual-master-prompt.txt"),
  promptSnowy: rel("research/visual-prompts/petsnowy-snow-plus-visual-master-prompt.txt"),
  test: rel("test/katzentoiletten-research-delta-33.3.0.test.mjs"),
};
function parse(source, label) {
  const match = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?([\s\S]*)$/);
  if (!match) throw new Error(`[${PATCH}] Frontmatter fehlt: ${label}`);
  return { data: yaml.load(match[1], { schema: yaml.JSON_SCHEMA }), body: match[2].trim() };
}
function dump(doc) {
  return `---\n${yaml.dump(doc.data, { schema: yaml.JSON_SCHEMA, noRefs: true, lineWidth: 120, quotingType: '"', forceQuotes: false })}---\n\n${doc.body.trim()}\n`;
}
function marker(body, id, content) {
  const start = `<!-- ${id}:start -->`, end = `<!-- ${id}:end -->`;
  const block = `${start}\n${content.trim()}\n${end}`;
  if (body.includes(start) && body.includes(end)) {
    return body.replace(new RegExp(`${start.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${end.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`), block);
  }
  return `${body.trim()}\n\n${block}`;
}
function baseProduct({ title, slug, manufacturer, description, recommendation, tags, specs, strengths, weaknesses, custom, evidence, body, availability = "unknown", availabilityReason }) {
  return dump({ data: {
    title, slug, type: "product", layout: "product", testStatus: "manufacturer-data", productStatus: "active",
    description, recommendation,
    manufacturer: { key: manufacturer.toLowerCase().replace(/\s+/g, "-"), name: manufacturer, slug: manufacturer.toLowerCase().replace(/\s+/g, "-") },
    category: { key: "automatische-katzentoiletten", label: "Automatische Katzentoiletten", path: "/automatische-katzentoiletten/" },
    productUrl: `/produkt/${slug}/`, publishedAt: "2026-08-15", updatedAt: "2026-08-15",
    author: { name: "PfotenTechnik Redaktion", role: "Redaktion" },
    seo: { title: `${title} im Datencheck`, description, canonical: `/produkt/${slug}/`, sitemap: true, priority: 0.8 },
    hub: { sections: ["produkte", "automatische-katzentoiletten"] }, tags,
    images: { hero: { src: "../../assets/images/project/pfotentechnik/comparison/default-editorial-hero.webp", alt: `Neutrale redaktionelle Darstellung: ${title}` }, gallery: [] },
    price: { current: null, currency: "EUR", status: "unknown", checkedAt: "2026-08-15", source: { id: "manufacturer", label: "Hersteller", type: "manufacturer" } },
    priceAutomation: "editorial", priceState: "unknown", priceAvailable: false, affiliateAvailable: false,
    availability, availabilityReason, availabilityUpdated: "2026-08-15",
    editorialStatus: "required", recommendationStatus: "limited", maintenanceStatus: "required",
    rating: 0, ratings: {},
    externalEvidence: { status: "constrained", note: "Aktuell liegen nur Herstellerdaten vor; kein eigener Praxistest und keine belastbare unabhängige Langzeitevidenz." },
    decision: { bestFor: [recommendation], attention: weaknesses },
    review: { summary: description, verdict: "Datenbasierte Einordnung ohne eigene Praxiserfahrung; Passform, Sicherheitsgrenzen und Folgekosten vor dem Kauf prüfen." },
    strengths, weaknesses, specs, features: strengths, useCase: recommendation,
    comparisonData: { version: 1, custom }, comparisonFilters: { animal: ["cat"], petSize: ["small", "medium", "large"], foodType: [] },
    alternatives: [], comparisons: ["beste-automatische-katzentoiletten"],
    decisionJourney: { cluster: "automatische-katzentoiletten", stage: "decision", intent: `${slug}-pruefen`, primaryQuestion: `Passt ${title} zu Katze, Streu, Stellplatz und Wartungsroutine?`, next: ["/vergleiche/beste-automatische-katzentoiletten/"], fallback: ["/automatische-katzentoiletten/"] },
    faq: [
      { question: `Wurde ${title} von PfotenTechnik selbst getestet?`, answer: "Nein. Die Einordnung basiert auf den verlinkten Herstellerquellen und behauptet keinen eigenen Praxistest." },
      { question: "Ersetzen App- und Nutzungsdaten eine tierärztliche Diagnose?", answer: "Nein. Nutzungs- oder Gewichtstrends können Auffälligkeiten zeigen, diagnostizieren aber keine Erkrankung." },
    ],
    editorial: { assessmentType: "data-review", evidence: ["manufacturer-documentation", "technical-specifications", "comparative-analysis"], testedHandsOn: false, lastVerifiedAt: "2026-08-15", note: "Herstellerdaten redaktionell eingeordnet; kein eigener Produkttest." },
    evidenceSources: evidence,
  }, body });
}

function updateNeakasa(source) {
  const doc = parse(source, "Neakasa");
  if (doc.data.slug !== "neakasa-m1-lite") throw new Error(`[${PATCH}] Unerwarteter Neakasa-Slug.`);
  Object.assign(doc.data, {
    title: "Neakasa M1 Plus Lite", updatedAt: "2026-08-15",
    description: "Aktuelle offene M1-Plus-Lite-Generation mit automatischer Siebung, App, 7,17-Liter-Streukapazität, 11,23-Liter-Abfallbehälter und dokumentiertem Bereich von 1 bis 15 kg.",
    recommendation: "Für Katzen, die eine offene Toilette bevorzugen, wenn der 35,2-cm-Einstieg passt und klumpende, siebfähige Streu verwendet wird.",
    images: { hero: { src: "../../assets/images/project/pfotentechnik/comparison/default-editorial-hero.webp", alt: "Neutrale redaktionelle Darstellung der offenen Neakasa M1 Plus Lite" }, gallery: [] },
    price: { current: null, currency: "EUR", status: "unknown", checkedAt: "2026-08-15", source: { id: "neakasa-eu", label: "Neakasa EU", type: "manufacturer" } },
    priceAutomation: "editorial", priceState: "unknown", priceAvailable: false, availability: "unknown", availabilityReason: "Preis und Lieferstatus werden nicht als dauerhafte redaktionelle Angabe gespeichert.", availabilityUpdated: "2026-08-15",
  });
  doc.data.seo = { ...doc.data.seo, title: "Neakasa M1 Plus Lite im Check", description: "M1 Plus Lite: offene Bauform, 35,2-cm-Einstieg, Abdichtung, Sensorik, Streu und App konservativ eingeordnet." };
  doc.data.decision = {
    bestFor: ["Katzen von 1 bis 15 kg laut Hersteller", "Katzen, die offene Systeme besser akzeptieren", "Haushalte mit kompatibler klumpender Streu"],
    attention: ["Unter 1 kg nur Kitten-Modus ohne Automatik", "35,2 cm Einstiegshöhe", "Keine Holzpellets oder nicht klumpende Streu", "Die offiziellen Neakasa-Seiten verwenden M1 Plus Lite und M1 Lite Plus; diese Route ist der gemeinsame Lifecycle-Owner", "Sensorzahl ist in offiziellen Darstellungen nicht vollständig konsistent"],
  };
  doc.data.strengths = ["Offene Bauform", "11,23-Liter-Abfallbehälter", "Bristle Seal und Composite-Sealing-Ring laut Hersteller", "Überarbeiteter, 30 Prozent stärkerer Silikonliner laut Hersteller"];
  doc.data.weaknesses = doc.data.decision.attention;
  doc.data.specs = [
    { label: "Aktuelle Modellbezeichnung", value: "M1 Plus Lite; Neakasa verwendet zusätzlich M1 Lite Plus" },
    { label: "Katzengewicht", value: "1 bis 15 kg; unter 1 kg Kitten-Modus ohne Automatik" },
    { label: "Einstieg", value: "352 mm" }, { label: "Abfallbehälter", value: "11,23 Liter" },
    { label: "Streukapazität", value: "7,17 Liter" }, { label: "Eigengewicht", value: "10,35 kg" },
    { label: "Sensorik", value: "Aktuelle Lifecycle-Dokumentation nennt ein 6-Array-Infrarotsystem; eine offizielle Vergleichstabelle ist dazu nicht konsistent" },
    { label: "Abdichtung", value: "Bristle Seal, Composite-Sealing-Ring und überarbeiteter Silikonliner laut Hersteller" },
    { label: "Streu", value: "Schnell klumpende, siebfähige Bentonit-/Mineralstreu; keine Holzpellets, Zeitung oder nicht klumpende Streu" },
    { label: "Siebgrenze", value: "Bis 3 mm Durchmesser und 10 mm Länge laut Hersteller" },
    { label: "Offline", value: "Grundbetrieb mit gespeicherten Einstellungen; ohne Netz keine Aktualisierung der App-Daten" },
  ];
  doc.data.comparisonData = { version: 1, custom: { bauform: "Offenes Siebsystem", einstieg: "35,2 cm", katzenprofil: "1-15 kg; unter 1 kg manuell", sicherheit: "IR-Array; Quellenabweichung transparent", mechanische_sicherheit: "Keine separate mechanische Anti-Pinch-Struktur dokumentiert", streu: "Klumpend/siebfähig; keine Holzpellets", geruch: "Bristle Seal und Composite-Sealing-Ring; Herstellerangabe", abfall: "11,23 l", tracking: "Offene Bauform; Streumatte separat", appdaten: "App; offline keine neuen Daten", kamera: "Keine Kamera dokumentiert", folgekosten: "Streu, Beutel, optional Matte/Stufe" } };
  doc.data.evidenceSources = [
    { source: "Neakasa EU", url: "https://eu.neakasa.com/products/m1-lite-self-cleaning-cat-litter-box", accessedAt: "2026-08-15", assertion: "Aktuelle EU-Modellidentität, Maße, Kapazitäten, Abdichtung und Streugrenzen sind Herstellerangaben.", fields: ["title", "specs", "decision"] },
    { source: "Neakasa Lifecycle-Vergleich", url: "https://neakasa.com/blogs/all/neakasa-m1-vs-m1-lite", accessedAt: "2026-08-15", assertion: "Plus-Generation, Sensorik und Dichtungsänderungen sind Herstellerangaben; Abweichungen werden nicht aufgelöst durch Schätzung.", fields: ["specs", "weaknesses"] },
  ];
  doc.body = marker(doc.body, "pt:neakasa-plus-lifecycle", `## Aktuelle Plus-Generation statt neuer Route\n\nDiese Seite bleibt unter der bestehenden URL der Intent-Owner. Neakasa verwendet aktuell sowohl **M1 Plus Lite** als auch **M1 Lite Plus**. Die Bezeichnungen werden deshalb nicht in zwei vermeintlich getrennte Produkte aufgespalten.\n\nDie Plus-Generation ergänzt laut Hersteller Bristle Seal, Composite-Sealing-Ring und einen stärkeren Silikonliner. Prozentuale Leckschutz-Aussagen sind Marketingclaims, kein eigener Dichtigkeitstest. Bei der Infrarotsensorik widersprechen sich offizielle Darstellungen; dokumentiert wird daher der Quellenkonflikt statt einer erfundenen Eindeutigkeit.\n\nFür die Auswahl sind der hohe Einstieg, das Mindestgewicht und die Streufreigabe wichtiger als die App. Der [Kaufcheck](/automatische-katzentoiletten/) erklärt die Systemgrenzen, der [Vergleich](/vergleiche/beste-automatische-katzentoiletten/) ordnet offene und geschlossene Alternativen ein.`);
  return dump(doc);
}

const max3 = baseProduct({
  title: "PETKIT PUROBOT MAX 3", slug: "petkit-purobot-max-3", manufacturer: "petkit",
  description: "Geschlossene automatische Katzentoilette P9906 mit 20,4-cm-Einstieg, 76-Liter-Zylinder, 7-Liter-Abfallfach, 12 Sensoren und zusätzlicher mechanischer Anti-Pinch-Struktur.",
  recommendation: "Für Katzen von 1,5 bis 10 kg, wenn niedriger Einstieg und eine Kombination aus elektronischer und mechanischer Sicherheitsarchitektur wichtiger sind als eine Kamera.",
  tags: ["automatische-katzentoilette", "petkit", "katze", "app", "sicherheit"],
  specs: [
    { label: "Modell", value: "P9906" }, { label: "Abmessungen", value: "620 × 538 × 552 mm" },
    { label: "Einstieg", value: "204 mm; Öffnung 267 × 273 mm laut Herstellervergleich" }, { label: "Eigengewicht", value: "10 kg" },
    { label: "Katzengewicht", value: "1,5 bis 10 kg; Hersteller nennt zusätzlich 6+ Monate" }, { label: "Zylinder", value: "76 Liter" },
    { label: "Abfallfach", value: "7 Liter; bis 15 Tage bei einer Katze ist eine Hersteller-Maximalangabe" },
    { label: "Sicherheit", value: "12 Sensoren plus mechanisch dauerhaft offene Eingangsstruktur laut Hersteller; keine Sicherheitsgarantie" },
    { label: "WLAN", value: "2,4 GHz" }, { label: "Strom", value: "12 V / 2 A, 24 W" },
    { label: "Streu", value: "Klumpende Ton-, Tofu- oder Mischstreu; zwei Filter, Partikel bis 12 mm Länge/3 mm Durchmesser" },
    { label: "Kamera", value: "Keine Kamera dokumentiert; Funktionen des MAX PRO 2 werden nicht übertragen" },
  ],
  strengths: ["20,4-cm-Einstieg", "12 Sensoren laut Hersteller", "Mechanische Anti-Pinch-Struktur zusätzlich zur Sensorik", "76-Liter-Zylinder"],
  weaknesses: ["Nur für 1,5 bis 10 kg und laut Hersteller ab 6 Monaten", "Geschlossene Bauform muss akzeptiert werden", "N50/N60-Geruchszubehör verursacht Folgekosten", "Monitoringdaten sind keine Diagnose"],
  custom: { bauform: "Geschlossene 76-l-Siebtrommel", einstieg: "20,4 cm", katzenprofil: "1,5-10 kg; 6+ Monate", sicherheit: "12 Sensoren", mechanische_sicherheit: "Mechanisch dauerhaft offene Eingangsstruktur; Herstellerangabe", streu: "Klumpende Ton-/Tofu-/Mischstreu", geruch: "OdorVoid-Zubehör; Herstellerclaim", abfall: "7 l", tracking: "Nicht separat dokumentiert", appdaten: "Nutzung/Gewicht; keine Diagnose", kamera: "Keine Kamera dokumentiert", folgekosten: "Beutel und optional N50/N60" },
  evidence: [
    { source: "PETKIT", url: "https://www.petkit.com/products/purobot-max-3-automatic-cat-litter-box", accessedAt: "2026-08-15", assertion: "Modell, Maße, Gewicht, Einstieg, Kapazität, Sensorik, mechanische Struktur, WLAN und Streu sind Herstellerangaben.", fields: ["specs", "decision", "comparisonData"] },
    { source: "PETKIT Produktvorstellung", url: "https://www.petkit.com/blogs/blog/introducing-purobot-max-3-wider-entry-for-every-cat-continuous-freshness-for-every-home", accessedAt: "2026-08-15", assertion: "Positionierung und Sicherheitsarchitektur sind Herstellerangaben.", fields: ["strengths", "review"] },
  ],
  body: `## Eigenständige Rolle neben MAX PRO 2\n\nDer MAX 3 ist kein umbenannter MAX PRO 2. Seine Kaufrolle liegt beim niedrigeren Einstieg und der mechanischen Eingangsstruktur. Kamera- oder Video-Funktionen des MAX PRO 2 werden nicht übertragen. PETKITs Angabe eines 43 Prozent größeren Eingangs bezieht sich auf den PuraMax 2 und bleibt ein Herstellervergleich.\n\nDie zwölf Sensoren ergänzen laut PETKIT eine mechanische Konstruktion, die den Eingang unabhängig von reiner Sensorerkennung offen hält. Daraus folgt keine absolute Sicherheitsgarantie. Nutzungs- und Gewichtsdaten können Trends zeigen, diagnostizieren aber keine Erkrankung.\n\nSiehe [Kaufcheck](/automatische-katzentoiletten/) und [Direktvergleich](/vergleiche/beste-automatische-katzentoiletten/).`,
});

const snowy = baseProduct({
  title: "PetSnowy SNOW+ (SNOW)", slug: "petsnowy-snow-plus", manufacturer: "petsnowy",
  description: "Deutlich geschlossene selbstreinigende Katzentoilette mit gebogenem Ein-/Ausstiegsweg, Anti-Tracking-Konzept und 10-Liter-Abfallfach mit automatischer Versiegelung.",
  recommendation: "Für Haushalte, die eine geschlossene Kabine und Streu-Rückhaltung priorisieren, sofern die Katze enge Systeme akzeptiert und Versand sowie Verbrauchsmaterialien verfügbar sind.",
  tags: ["automatische-katzentoilette", "petsnowy", "geschlossen", "anti-tracking", "katze"],
  specs: [
    { label: "Modellbezeichnung", value: "PetSnowy SNOW; im Markt auch als SNOW+ geführt" },
    { label: "Bauform", value: "Geschlossene Kabine mit gebogenem Ein-/Ausstiegsweg" },
    { label: "Abfallfach", value: "10 Liter, automatisch versiegelt laut Hersteller" },
    { label: "Geruch", value: "TiO₂-Geruchssystem; 90,5 Prozent Ammoniakreduktion ist ausschließlich ein Herstellerclaim" },
    { label: "Sicherheit", value: "Sieben Schutzebenen laut Hersteller; kein eigener Sicherheitstest" },
    { label: "Wartung", value: "Magnetisch-modularer Aufbau; proprietäre Liner und Deodorizer berücksichtigen" },
    { label: "Deutschland/EU", value: "Aktuelle regionale Lieferbarkeit vor Checkout prüfen; deutsche Seite zeigt keine belastbare dauerhafte EU-Verfügbarkeit" },
  ],
  strengths: ["Geschlossene Kabine", "Gebogener Anti-Tracking-Weg", "10-Liter-Abfallfach", "Automatische Beutelversiegelung laut Hersteller"],
  weaknesses: ["Akzeptanz der geschlossenen Kabine ist individuell", "Proprietäre Liner und Deodorizer erzeugen Folgekosten", "Geruchs-Prozentwerte sind nicht unabhängig verifiziert", "EU-/Deutschland-Verfügbarkeit bleibt offen"],
  custom: { bauform: "Geschlossene Kabine mit gebogenem Weg", einstieg: "Nicht belastbar dokumentiert", katzenprofil: "Passform vor Kauf prüfen", sicherheit: "7 Schutzebenen; Herstellerangabe", mechanische_sicherheit: "Nicht separat dokumentiert", streu: "Kompatibilität vor Kauf anhand aktueller Anleitung prüfen", geruch: "TiO₂-System; Prozentwert Herstellerclaim", abfall: "10 l, automatische Versiegelung", tracking: "Gebogener Anti-Tracking-Weg", appdaten: "Hersteller-App; Umfang prüfen", kamera: "Keine Kamera dokumentiert", folgekosten: "Proprietäre Liner/Deodorizer" },
  evidence: [
    { source: "PetSnowy Deutschland", url: "https://petsnowy.com/de/products/petsnowy-snow-self-cleaning-litter-box", accessedAt: "2026-08-15", assertion: "Kabine, Weg, Abfallfach, Geruchssystem und Sicherheitsclaims sind Herstellerangaben.", fields: ["specs", "decision", "comparisonData"] },
    { source: "PetSnowy Shipping", url: "https://petsnowy.com/pages/shipping", accessedAt: "2026-08-15", assertion: "Regionale Lieferbarkeit muss beim Checkout neu geprüft werden und wird nicht statisch behauptet.", fields: ["availability", "weaknesses"] },
  ],
  body: `## Geschlossenes System als eigene Kaufrolle\n\nPetSnowy ergänzt den Vergleich nicht durch möglichst viele Smart-Funktionen, sondern durch die stark geschlossene Kabine und den gebogenen Weg, der Streuaustrag reduzieren soll. Ob die Katze diesen engeren Zugang akzeptiert, ist ein vorrangiges Ausschlusskriterium.\n\nDie beworbene Ammoniakreduktion und die sieben Schutzebenen sind Herstellerclaims. Laufende Kosten für passende Liner und Deodorizer gehören in die Kaufentscheidung. Eine dauerhafte Deutschland-Verfügbarkeit oder ein statischer Preis wird nicht behauptet.\n\nSiehe [Kaufcheck](/automatische-katzentoiletten/) und [Direktvergleich](/vergleiche/beste-automatische-katzentoiletten/).`,
  availability: "unknown", availabilityReason: "Deutschland-/EU-Lieferbarkeit muss im aktuellen Checkout geprüft werden.",
});

function updateComparison(source) {
  const doc = parse(source, "Katzentoiletten-Vergleich");
  const allowed = new Set(["neakasa-m1-lite", "devoko-90l-automatisches-katzenklo", "petlibro-luma-smart-litter-box", "petkit-purobot-max-pro-2", "petkit-purobot-max-3", "petsnowy-snow-plus"]);
  if ((doc.data.items ?? []).some((item) => !allowed.has(item.slug))) throw new Error(`[${PATCH}] Unerwartete Vergleichsprodukte; Nutzeränderung wird geschützt.`);
  const prior = new Map(doc.data.items.map((item) => [item.slug, item]));
  const roles = {
    "neakasa-m1-lite": ["Offene Zugänglichkeit", "Offen; 35,2 cm Einstieg", "IR-Sensorik; Quellenabweichung", "Keine separate mechanische Struktur dokumentiert", "Offene Bauform", "Keine Kamera"],
    "devoko-90l-automatisches-katzenklo": ["Preisorientierte geschlossene Option", "Geschlossen; ca. 23 cm", "Sensorangaben teils widersprüchlich", "Nicht belastbar dokumentiert", "Nicht separat dokumentiert", "Keine Kamera dokumentiert"],
    "petlibro-luma-smart-litter-box": ["Teiloffenes Kamera-Monitoring", "Teiloffen; 34 cm mit Stufe", "Kamera, IR, Gewicht; Herstellerangabe", "Einklemmschutz laut Hersteller", "Nicht separat dokumentiert", "1080p-Kamera; Cloud-Aufzeichnung"],
    "petkit-purobot-max-pro-2": ["Geschlossenes Kamera-Monitoring", "Geschlossen; 25,5 cm", "12 Sensoren; Herstellerangabe", "Anti-Pinch laut Hersteller", "Nicht separat dokumentiert", "1080p-Kamera; Cloud"],
    "petkit-purobot-max-3": ["Niedriger Einstieg und Sicherheitsarchitektur", "Geschlossen; 20,4 cm", "12 Sensoren; Herstellerangabe", "Mechanisch offener Eingang", "Nicht separat dokumentiert", "Keine Kamera dokumentiert"],
    "petsnowy-snow-plus": ["Geschlossene Kabine und Anti-Tracking", "Geschlossen; Maß offen", "7 Schutzebenen; Herstellerclaim", "Nicht separat dokumentiert", "Gebogener Ein-/Ausstiegsweg", "Keine Kamera dokumentiert"],
  };
  doc.data.items = Object.entries(roles).map(([slug, value]) => {
    const item = prior.get(slug) ?? { slug, type: "product", recommendation: value[0], values: {} };
    item.label = slug === "neakasa-m1-lite" ? "Neakasa M1 Plus Lite" : slug === "petkit-purobot-max-3" ? "PETKIT PUROBOT MAX 3" : slug === "petsnowy-snow-plus" ? "PetSnowy SNOW+" : item.label;
    item.recommendation = value[0];
    item.values = { ...(item.values ?? {}), kaufrolle: value[0], bauform_einstieg: value[1], elektronische_sicherheit: value[2], mechanische_sicherheit: value[3], tracking: value[4], kamera: value[5] };
    return item;
  });
  const extra = [
    ["kaufrolle", "Eigenständige Kaufrolle"], ["bauform_einstieg", "Bauform / Einstieg"], ["elektronische_sicherheit", "Elektronische Sicherheit"],
    ["mechanische_sicherheit", "Mechanische Sicherheit"], ["tracking", "Streu-Tracking"], ["kamera", "Kamera / Monitoring"],
  ];
  const criteria = new Map((doc.data.criteria ?? []).map((item) => [item.key, item]));
  for (const [key, label] of extra) criteria.set(key, { key, label, format: "text", fallback: "Nicht ausgewiesen" });
  doc.data.criteria = [...criteria.values()];
  doc.data.updatedAt = "2026-08-15";
  doc.data.recommendation = { title: "Ausschlusskriterien vor Smart-Funktionen", text: "Neakasa priorisiert offene Zugänglichkeit, MAX 3 den niedrigen Einstieg plus mechanische Struktur, PetSnowy geschlossene Streurückhaltung und MAX PRO 2 Kamera-Monitoring. Mehr Sensoren oder App-Funktionen ergeben keinen automatischen Gesamtsieg.", alternativeSlug: "neakasa-m1-lite" };
  doc.data.decisionJourney = { ...(doc.data.decisionJourney ?? {}), next: Object.keys(roles).map((slug) => `/produkt/${slug}/`) };
  doc.body = marker(doc.body, "pt:litter-delta-33-3", `## Sechs unterschiedliche Kaufrollen\n\nDie Matrix ist keine lineare Rangliste. **Neakasa M1 Plus Lite** steht für offene Zugänglichkeit, **PETKIT MAX 3** für einen niedrigeren Einstieg und zusätzliche mechanische Sicherheitsarchitektur, **PetSnowy SNOW+** für geschlossene Streurückhaltung und **MAX PRO 2** für Kamera-Monitoring.\n\nElektronische Sensorik und mechanische Konstruktion werden getrennt ausgewiesen. App-, Gewichts- und Toilettendaten bleiben Monitoring und keine Diagnose. Proprietäre Beutel, Filter oder Deodorizer zählen zu den Folgekosten.`);
  return dump(doc);
}

function updateHub(source) {
  const doc = parse(source, "Katzentoiletten-Hub");
  const products = new Set(doc.data.contentPlatform?.products ?? []);
  products.add("petkit-purobot-max-3"); products.add("petsnowy-snow-plus");
  doc.data.contentPlatform.products = [...products]; doc.data.updatedAt = "2026-08-15";
  doc.body = marker(doc.body, "pt:litter-delta-33-3", `## Eingang, Sicherheitsprinzip und Streuaustrag getrennt prüfen\n\nEin großer Eingang ist nicht automatisch ein großer nutzbarer Innenraum. Offene Systeme erleichtern Sicht- und Fluchtweg, geschlossene Kabinen können Geruch und Streuaustrag besser abschirmen, müssen aber zur Akzeptanz und Körpergröße passen.\n\nElektronische Sensorik reagiert auf erkannte Zustände; mechanische Anti-Pinch-Konstruktionen können eine zusätzliche, anders arbeitende Schutzebene bilden. Beides bleibt ohne eigenen Test eine Herstellerangabe und keine Sicherheitsgarantie.\n\n[PETKIT PUROBOT MAX 3](/produkt/petkit-purobot-max-3/) setzt auf niedrigen Einstieg plus mechanische Struktur. [PetSnowy SNOW+](/produkt/petsnowy-snow-plus/) priorisiert eine geschlossene Anti-Tracking-Führung. Das aktualisierte [Neakasa M1 Plus Lite](/produkt/neakasa-m1-lite/) bleibt die offene Alternative. Der [Vergleich](/vergleiche/beste-automatische-katzentoiletten/) stellt die Rollen gegenüber.\n\nMonitoring zeigt Nutzungstrends, keine Diagnosen. Bei Beuteln, Filtern, Deodorizern und proprietären Linern zählen Verfügbarkeit und Drei-Jahres-Kosten zur Entscheidung.`);
  return dump(doc);
}

function updatePetkit(source) {
  const doc = parse(source, "PETKIT");
  const slugs = new Set(doc.data.productSlugs ?? []); slugs.add("petkit-purobot-max-3"); doc.data.productSlugs = [...slugs]; doc.data.updatedAt = "2026-08-15";
  doc.body = marker(doc.body, "pt:max3-product", `## Automatische Katzentoiletten\n\nDer [PUROBOT MAX 3](/produkt/petkit-purobot-max-3/) ergänzt den Bestand als eigenständiges Modell mit 20,4-cm-Einstieg und mechanischer Anti-Pinch-Struktur. Er wird nicht mit den Kamera-Funktionen des MAX PRO 2 vermischt.`);
  return dump(doc);
}

function prompt(name, motifs, guard) {
  return `MASTER-PROMPT: ${name}\n\nErzeuge fotorealistische, redaktionelle Produktvisualisierungen ohne Logos, erfundene Anzeigen oder abweichende Modellteile. ${guard}\n\nFeste Motivfolge:\n${motifs.map((m, i) => `${i + 1}. ${m}`).join("\n")}\n\nREGEL: Pro Antwort genau ein Bild aus der festen Reihenfolge erzeugen und danach stoppen. Erst wenn der Nutzer exakt „Weiter“ schreibt, das unmittelbar nächste Motiv erzeugen. Nichts überspringen, nichts wiederholen; Produktgeometrie, Farbe und Details über die Serie identisch halten.\n`;
}
const prompts = {
  [files.promptNeakasa]: prompt("Neakasa M1 Plus Lite", ["Premium Hero", "Thumbnail", "offene Perspektivansicht", "Sensor- und Sicherheitsdetail", "Bristle Seal, Composite-Sealing-Ring und Leckschutz", "reale Nutzung durch eine größere Hauskatze"], "Nur die aktuelle Plus-Generation darstellen; keine alte M1-Lite-Fotografie übernehmen."),
  [files.promptMax3]: prompt("PETKIT PUROBOT MAX 3 P9906", ["Premium Hero", "Thumbnail", "Perspektivansicht", "20,4-cm-Einstieg", "mechanische Anti-Pinch-Struktur", "7-Liter-Abfallbehälter", "reale Nutzung"], "Keine Kamera und keine Bauteile des MAX PRO 2, Ultra oder PuraMax 2 darstellen."),
  [files.promptSnowy]: prompt("PetSnowy SNOW+ / SNOW", ["Premium Hero", "Thumbnail", "Perspektivansicht", "geschlossener Ein-/Ausstiegsweg", "Anti-Tracking-Führung", "selbstverschließender Abfallbehälter", "reale Nutzung"], "Geschlossene Kabine und gebogenen Weg konsistent darstellen; keine unbelegten Displays."),
};

const test = `import assert from "node:assert/strict";\nimport fs from "node:fs";\nimport path from "node:path";\nimport test from "node:test";\nimport { createRequire } from "node:module";\nimport { fileURLToPath } from "node:url";\nconst app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");\nconst yaml = createRequire(path.join(app, "package.json"))("js-yaml");\nconst load = (kind, slug) => { const source = fs.readFileSync(path.join(app, "src/content", kind, slug + ".md"), "utf8"); const m = source.match(/^---\\s*\\r?\\n([\\s\\S]*?)\\r?\\n---/); assert.ok(m); return { source, data: yaml.load(m[1], { schema: yaml.JSON_SCHEMA }) }; };\ntest("Neakasa route owns current Plus lifecycle", () => { const p = load("products", "neakasa-m1-lite"); assert.equal(p.data.title, "Neakasa M1 Plus Lite"); assert.equal(fs.existsSync(path.join(app, "src/content/products/neakasa-m1-lite-plus.md")), false); assert.match(p.source, /Bristle Seal/); assert.match(p.data.images.hero.src, /default-editorial-hero/); });\ntest("MAX 3 and SNOW+ are distinct conservative products", () => { const max = load("products", "petkit-purobot-max-3"); const snow = load("products", "petsnowy-snow-plus"); assert.equal(max.data.rating, 0); assert.match(max.source, /Keine Kamera dokumentiert/); assert.doesNotMatch(max.source, /1080p/); assert.match(snow.source, /Herstellerclaim/); assert.equal(snow.data.availability, "unknown"); });\ntest("comparison references existing products and valid assets", () => { const c = load("comparisons", "beste-automatische-katzentoiletten"); for (const item of c.data.items) assert.ok(fs.existsSync(path.join(app, "src/content/products", item.slug + ".md")), item.slug); for (const slug of ["petkit-purobot-max-3", "petsnowy-snow-plus"]) assert.ok(c.data.items.some((i) => i.slug === slug)); for (const slug of ["neakasa-m1-lite", "petkit-purobot-max-3", "petsnowy-snow-plus"]) { const p = load("products", slug); const image = path.resolve(path.join(app, "src/content/products"), p.data.images.hero.src); assert.ok(fs.existsSync(image), image); } });\n`;

const desired = new Map([
  [files.neakasa, updateNeakasa(fs.readFileSync(files.neakasa, "utf8"))], [files.max3, max3], [files.snowy, snowy],
  [files.comparison, updateComparison(fs.readFileSync(files.comparison, "utf8"))], [files.hub, updateHub(fs.readFileSync(files.hub, "utf8"))],
  [files.petkit, updatePetkit(fs.readFileSync(files.petkit, "utf8"))], ...Object.entries(prompts), [files.test, test],
]);
const managedNew = new Set([files.max3, files.snowy, files.promptNeakasa, files.promptMax3, files.promptSnowy, files.test]);
const changes = [...desired].filter(([file, content]) => !fs.existsSync(file) || fs.readFileSync(file, "utf8") !== content);
for (const [file, content] of changes) {
  if (managedNew.has(file) && fs.existsSync(file) && !fs.readFileSync(file, "utf8").includes("33.3.0") && fs.readFileSync(file, "utf8") !== content) throw new Error(`[${PATCH}] Konflikt mit bestehender Datei: ${path.relative(root, file)}`);
}
let backupRoot = null;
if (changes.length) {
  backupRoot = path.join(root, ".patch-backups", `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`);
  for (const [file, content] of changes) {
    if (fs.existsSync(file)) { const backup = path.join(backupRoot, path.relative(root, file)); fs.mkdirSync(path.dirname(backup), { recursive: true }); fs.copyFileSync(file, backup); }
    fs.mkdirSync(path.dirname(file), { recursive: true }); const temp = `${file}.${crypto.randomUUID()}.tmp`; fs.writeFileSync(temp, content, "utf8"); fs.renameSync(temp, file);
  }
}
for (const file of [files.neakasa, files.max3, files.snowy, files.comparison, files.hub]) parse(fs.readFileSync(file, "utf8"), path.relative(root, file));
console.log(`[${PATCH}] ${changes.length ? `${changes.length} Datei(en) installiert; Backup: ${backupRoot}` : "Zielzustand bereits vorhanden (no-op)."}`);

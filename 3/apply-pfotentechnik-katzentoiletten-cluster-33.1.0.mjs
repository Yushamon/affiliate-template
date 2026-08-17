#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const PATCH = "pfotentechnik-katzentoiletten-cluster-33.1.0";
const scriptFile = fileURLToPath(import.meta.url);
const root = [process.cwd(), path.resolve(path.dirname(scriptFile), "..")].find((candidate) =>
  fs.existsSync(path.join(candidate, "apps", "pfotentechnik", "package.json")),
);
if (!root) throw new Error(`[${PATCH}] Repository-Wurzel nicht gefunden.`);

const require = createRequire(path.join(root, "package.json"));
const yaml = require("js-yaml");
const app = path.join(root, "apps", "pfotentechnik");
const files = {
  luma: path.join(app, "src/content/products/petlibro-luma-smart-litter-box.md"),
  purobot: path.join(app, "src/content/products/petkit-purobot-max-pro-2.md"),
  comparison: path.join(app, "src/content/comparisons/beste-automatische-katzentoiletten.md"),
  hub: path.join(app, "src/content/pages/automatische-katzentoiletten.md"),
  petlibro: path.join(app, "src/content/manufacturers/petlibro.md"),
  legacyTest: path.join(app, "test/automatic-litter-box-product-coverage-34.0.0.test.mjs"),
  promptLuma: path.join(app, "research/visual-prompts/petlibro-luma-smart-litter-box-visual-master-prompt.txt"),
  promptPurobot: path.join(app, "research/visual-prompts/petkit-purobot-max-pro-2-visual-master-prompt.txt"),
  test: path.join(app, "test/katzentoiletten-cluster-33.1.0.test.mjs"),
};

for (const key of ["purobot", "comparison", "hub", "petlibro", "legacyTest"]) {
  if (!fs.existsSync(files[key])) throw new Error(`[${PATCH}] Erwartete Datei fehlt: ${path.relative(root, files[key])}`);
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
  return { data, body: match[2].trim() };
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

const targetSlugs = [
  "neakasa-m1-lite",
  "devoko-90l-automatisches-katzenklo",
  "petlibro-luma-smart-litter-box",
  "petkit-purobot-max-pro-2",
];
const baselineSlugs = [
  "litter-robot-5-pro",
  "petkit-purobot-max-pro-2",
  "neakasa-m1-plus",
  "neakasa-m1-lite",
  "devoko-90l-automatisches-katzenklo",
];

function sameSet(actual, expected) {
  return [...actual].sort().join("|") === [...expected].sort().join("|");
}

function patchPurobot(source) {
  const document = parseDocument(source, "PUROBOT MAX PRO 2");
  const data = document.data;
  if (data.slug !== "petkit-purobot-max-pro-2") throw new Error(`[${PATCH}] PUROBOT-Slug stimmt nicht.`);
  data.updatedAt = "2026-08-15";
  data.description = "Geschlossene automatische Katzentoilette mit 76-l-Trommel, 25,5-cm-Einstieg, AI-Kamera, Mehrkatzenprofilen, 12 Sicherheitssensoren und Offline-Grundbetrieb.";
  data.recommendation = "Fuer Katzen von 1,5 bis 10 kg und datenorientierte Mehrkatzenhaushalte, wenn geschlossener Innenraum, Kamera-Cloud und laufende Zubehoerkosten bewusst akzeptiert werden.";
  data.rating = 3.3;
  data.decision = {
    bestFor: ["Katzen von 1,5 bis 10 kg", "Mehrkatzenhaushalte mit gewuenschter Gesichts- und Gewichtszuordnung", "Nutzer, die Kamera und Cloudspeicherung bewusst konfigurieren"],
    attention: ["unter 1,5 kg beziehungsweise bei Kitten Automatik und Zeitreinigung im Kitten Protection Mode deaktivieren", "Kameradaten werden laut Hersteller verschluesselt in der Cloud gespeichert", "Nutzungs-, Gewichts- und pH-Trends sind keine Diagnose; pH-Funktion benoetigt das passende PETKIT-Zubehoer"],
  };
  data.review = {
    summary: "PETKIT dokumentiert 76 l Trommelraum, 8 l Abfallfach, 25,5 cm Einstieg, 12 Sensoren, Anti-Pinch, AI-Kamera, Mehrkatzen-Erkennung und Offline-Betrieb nach Voreinstellung.",
    verdict: "Eine monitoringorientierte geschlossene Premium-Toilette; Passform, Kitten-Grenze, Cloud-Datenschutz und Wartung entscheiden vor den AI-Funktionen.",
  };
  data.strengths = ["AI-Kamera plus Gewichtssensoren fuer Mehrkatzenprofile laut Hersteller", "12 Sensoren und Anti-Pinch-Konstruktion laut Hersteller", "voreingestellter Grundbetrieb funktioniert bei Netzverlust weiter"];
  data.weaknesses = ["geschlossener Innenraum und 25,5 cm Einstieg muessen zur Katze passen", "Kamera- und Nutzungsdaten liegen in der Hersteller-Cloud", "8-l-Abfallfach und passende Beutel erzeugen Wartungs- und Folgekosten"];
  data.alternatives = ["petlibro-luma-smart-litter-box", "neakasa-m1-lite", "devoko-90l-automatisches-katzenklo"];
  data.specs = [
    { label: "Systemtyp", value: "Geschlossene rotierende Siebtrommel" },
    { label: "Abmessungen", value: "657 x 538 x 603 mm" },
    { label: "Trommelraum", value: "76 Liter" },
    { label: "Einstieg", value: "255 mm hoch; Oeffnung 267 x 273 mm" },
    { label: "Produktgewicht", value: "ca. 11 kg" },
    { label: "Katzengewicht", value: "1,5 bis 10 kg; unter 1,5 kg nicht fuer Automatik empfohlen" },
    { label: "Sicherheit", value: "12 Sensoren und Anti-Pinch-Konstruktion laut Hersteller" },
    { label: "Streu", value: "Klumpende Bentonit-, Tofu- oder Mischstreu; Partikel bis 12 mm" },
    { label: "Abfallfach", value: "8 Liter; bis 17 Tage ist eine Hersteller-Maximalangabe fuer eine Katze" },
    { label: "Kamera", value: "1080p, fest, 210-Grad-Sichtfeld, Mikrofon" },
    { label: "Mehrkatzen-Erkennung", value: "Gesichts- und Gewichtserkennung laut Hersteller" },
    { label: "Offline-Verhalten", value: "Voreinstellungen laufen weiter; App-Nutzungsdaten werden ohne Netz nicht aktualisiert" },
    { label: "WLAN", value: "2,4 und 5 GHz" },
    { label: "Strom", value: "12 V / 2 A, 24 W" },
    { label: "Garantie", value: "24 Monate im offiziellen EU-Shop" },
  ];
  data.comparisonData = { version: 1, custom: {
    bauform: "Geschlossene 76-l-Trommel", innenraum: "76 l Trommelraum; Oeffnung 267 x 273 mm", einstieg: "25,5 cm", katzenprofil: "1,5-10 kg; Kitten Protection Mode", sicherheit: "12 Sensoren + Anti-Pinch; Herstellerangabe", mehrkatzen: "Gesicht + Gewicht; aehnliche Gewichte laut Hersteller unterscheidbar", streu: "Klumpend: Bentonit, Tofu, Mischstreu; <=12 mm", wartung: "Abnehmbare Teile; 8-l-Abfallfach", geruch: "Mehrstufig; Herstellerangabe", appdaten: "AI-Kamera, Cloud, Trends; offline keine neuen App-Daten", folgekosten: "Streu, Beutel, Geruchszubehoer, optionale Cloud-/Care+-Dienste", platz: "657 x 538 x 603 mm; ca. 11 kg" }, };
  data.evidenceSources = [
    { source: "PETKIT EU", url: "https://www.petkit-eu.com/en-de/products/purobot-max-pro-2-automatic-cat-litter-box", accessedAt: "2026-08-15", assertion: "EU-Verfuegbarkeit, 24-Monats-Garantie, Masse, Einstieg, Gewicht, Katzengewicht, Sicherheit, Streu und Kamera sind Herstellerangaben.", fields: ["specs", "decision", "comparisonData"] },
    { source: "PETKIT", url: "https://www.petkit.com/products/purobot-max-pro-2-automatic-cat-litter-box-with-ai-camera", accessedAt: "2026-08-15", assertion: "Offline-Verhalten, Datenschutzkontrollen, Mehrkatzen-Erkennung, Kitten-Modus und Zubehoerabhaengigkeiten sind Herstellerangaben.", fields: ["specs", "decision", "weaknesses"] },
  ];
  if (!document.body.includes("pt:purobot-2026:start")) {
    document.body += `\n\n<!-- pt:purobot-2026:start -->\n+## Sicherheits-, Offline- und Datenschutzentscheidung\n+\n+PETKIT nennt **1,5 kg** als Mindestgewicht und empfiehlt das Modell nicht fuer kleinere Katzen oder Kitten. Im Kitten Protection Mode bleiben automatische und zeitgesteuerte Reinigung aus. Die zwoelf Sensoren und die Anti-Pinch-Konstruktion sind Herstellerangaben, kein eigener Sicherheitstest.\n+\n+Nach der Einrichtung arbeitet das Geraet bei einem Netzverlust mit den gespeicherten Einstellungen weiter. Neue Nutzungsdaten erreichen die App dann nicht. Kamera-Arbeitszeiten lassen sich konfigurieren oder abschalten; gespeicherte Daten liegen laut PETKIT verschluesselt in der Cloud.\n+\n+Gewicht, Toilettenhaeufigkeit, Bilddaten und optionale Urin-pH-Werte koennen Auffaelligkeiten sichtbar machen. Sie diagnostizieren keine Erkrankung; die pH-Funktion setzt das dafuer vorgesehene PETKIT-Zubehoer voraus.\n+\n+Der [Vergleich automatischer Katzentoiletten](/vergleiche/beste-automatische-katzentoiletten/) ordnet diese Datenrolle gegen offene und weniger monitoringorientierte Systeme ein. Grundlagen stehen im [Kaufcheck](/automatische-katzentoiletten/).\n+<!-- pt:purobot-2026:end -->`;
  }
  return serializeDocument(document);
}

function patchComparison(source) {
  const document = parseDocument(source, "Katzentoiletten-Vergleich");
  const current = (document.data.items ?? []).map((item) => item.slug);
  if (!sameSet(current, baselineSlugs) && !sameSet(current, targetSlugs)) {
    throw new Error(`[${PATCH}] Unerwartete Produktmenge im Katzentoiletten-Vergleich.`);
  }
  const data = document.data;
  data.description = "Vier automatische Katzentoiletten zuerst nach Bauform, Innenraum, Einstieg, Katzengewicht, Sicherheit, Streu, Wartung, Mehrkatzenlogik und Folgekosten vergleichen.";
  data.updatedAt = "2026-08-15";
  data.hub = { ...data.hub, description: "Vier eigenstaendige Kaufrollen mit Sicherheits- und Ausschlusslogik statt Gesamtrangliste." };
  data.seo = { ...data.seo, title: "Automatische Katzentoiletten 2026: Sicherheit & Passform", description: "Neakasa M1 Lite, Devoko 90L, PETLIBRO Luma und PETKIT PUROBOT nach Bauform, Einstieg, Sicherheit, Streu, Daten und Folgekosten vergleichen." };
  data.tableTitle = "Passform, Sicherheit und Betrieb direkt vergleichen";
  data.items = [
    { slug: "neakasa-m1-lite", type: "product", label: "Neakasa M1 Lite", recommendation: "Wenn offene Bauform und freier Fluchtweg wichtiger sind und der 35,2-cm-Einstieg zur Katze passt.", values: { bauform: "Open Top; automatische Siebung", innenraum: "Offen; 7,17 l Streukapazitaet", einstieg: "35,2 cm", katzenprofil: "ca. 1-15 kg; darunter Automatik aus", sicherheit: "IR-Sensorik und Stopp; Details uneinheitlich", mehrkatzen: "App-Profile; Unterscheidung bei aehnlichem Gewicht pruefen", streu: "Klumpend, siebfaehig; keine Holzpellets", wartung: "11,23-l-Abfallfach; Lite ohne Matte", geruch: "OdorSeal laut Hersteller; offene Bauform", appdaten: "Nutzung, Fuellstand, Fernsteuerung", folgekosten: "Streu, Beutel, optional Stufe/Matte", platz: "525 x 591 x 513 mm; oben Freiraum" } },
    { slug: "devoko-90l-automatisches-katzenklo", type: "product", label: "Devoko 90L", recommendation: "Preisorientierte geschlossene Option mit 23-cm-Einstieg und grossem Innenraum; Modellvariante und Dokumentation vor Kauf abgleichen.", values: { bauform: "Geschlossene rotierende Siebung", innenraum: "90 l laut oeffentlichen Produktdaten", einstieg: "ca. 23 cm", katzenprofil: "ca. 1,5-10 kg", sicherheit: "IR, Gewicht, Radar; Sensorzahl widerspruechlich", mehrkatzen: "Gewicht und Nutzung; keine belegte Individualerkennung", streu: "Verschiedene klumpende Streusorten", wartung: "8,5-l-Abfallfach; modulare Reinigung", geruch: "Neutralisator; Ersatzbedarf einplanen", appdaten: "2,4 GHz; Gewicht, Nutzung, Fernreinigung", folgekosten: "Streu, Beutel, Geruchsneutralisator", platz: "Aussenmasse je nach Quelle uneinheitlich" } },
    { slug: "petlibro-luma-smart-litter-box", type: "product", label: "PETLIBRO Luma", recommendation: "Fuer 1-10 kg, mehrere Katzen und 34-cm-Einstieg, wenn Kamera, Cloud-only-Aufzeichnung und Filter-/Beutelkosten bewusst passen.", values: { bauform: "Teiloffenes automatisches Siebsystem", innenraum: "44,2-cm-Eingang; Nutzraum nicht separat beziffert", einstieg: "34 cm; Stufe enthalten", katzenprofil: "1-10 kg; unter 1 kg/6 Monaten manuell", sicherheit: "Kamera, IR, Gewicht + Einklemmschutz; Herstellerangabe", mehrkatzen: "Profile fuer bis zu 10 Katzen", streu: "Klumpend, Tofu, Mischstreu; keine Kristall-/Kieferstreu", wartung: "11-l-Schublade; Filter und Einlagen", geruch: "Ventilator + Aktivkohlefilter; Herstellerangabe", appdaten: "1080p, Cloud-only-Aufzeichnung; AI tarifabhaengig", folgekosten: "Beutel, Aktivkohlefilter, optional Video Cloud AI", platz: "592 x 573 x 714 mm; harter Boden" } },
    { slug: "petkit-purobot-max-pro-2", type: "product", label: "PETKIT PUROBOT MAX PRO 2", recommendation: "Fuer 1,5-10 kg und datenorientierte Mehrkatzenhaushalte, wenn geschlossener Innenraum, Kamera-Cloud und 25,5-cm-Einstieg passen.", values: { bauform: "Geschlossene 76-l-Siebtrommel", innenraum: "76 l; Oeffnung 267 x 273 mm", einstieg: "25,5 cm", katzenprofil: "1,5-10 kg; Kitten Protection Mode", sicherheit: "12 Sensoren + Anti-Pinch; Herstellerangabe", mehrkatzen: "Gesichts- und Gewichtserkennung", streu: "Bentonit, Tofu, Mischstreu; bis 12 mm", wartung: "8-l-Abfallfach; abnehmbare Teile", geruch: "Mehrstufig; Herstellerangabe", appdaten: "1080p-Kamera, Cloud, Trends; Grundbetrieb offline", folgekosten: "Beutel, Geruchszubehoer, optionale Dienste", platz: "657 x 538 x 603 mm; ca. 11 kg" } },
  ];
  data.criteria = [
    { key: "bauform", label: "Bauform / Reinigung", description: "Offenes oder geschlossenes Siebsystem.", weight: 1.7, format: "text" },
    { key: "innenraum", label: "Nutzbarer Innenraum", description: "Nutzraum und Oeffnung statt Marketing-Aussenvolumen.", weight: 1.8, format: "text" },
    { key: "einstieg", label: "Einstiegshoehe", description: "Relevant fuer kleine, alte und eingeschraenkte Katzen.", weight: 1.8, format: "text" },
    { key: "katzenprofil", label: "Groesse / Gewicht", description: "Herstellergrenzen fuer den Automatikbetrieb.", weight: 2.0, format: "text" },
    { key: "sicherheit", label: "Sicherheitskonzept", description: "Erkennung und Stopp laut Hersteller; kein eigener Sicherheitstest.", weight: 2.0, format: "text" },
    { key: "mehrkatzen", label: "Mehrkatzenhaushalt", description: "Profile, Unterscheidung und Kapazitaetsgrenzen.", weight: 1.4, format: "text" },
    { key: "streu", label: "Streukompatibilitaet", description: "Konkrete geeignete und ausgeschlossene Streuarten.", weight: 1.6, format: "text" },
    { key: "wartung", label: "Wartung / Abfallfach", description: "Demontage, Behaelter und reale Entleerung.", weight: 1.5, format: "text" },
    { key: "geruch", label: "Geruchskontrolle", description: "Konstruktion und Verbrauchsmaterial getrennt bewerten.", weight: 1.1, format: "text" },
    { key: "appdaten", label: "App / Monitoring", description: "Daten, Cloud und Offline-Verhalten; keine Diagnose.", weight: 1.3, format: "text" },
    { key: "folgekosten", label: "Laufende Kosten", description: "Beutel, Filter, Deodorizer und optionale Dienste.", weight: 1.4, format: "text" },
    { key: "platz", label: "Platzbedarf", description: "Aussenmass, Freiraum und harter Standplatz.", weight: 1.4, format: "text" },
  ];
  data.recommendation = { title: "Keine Rangliste: Ausschlusskriterien entscheiden", text: "M1 Lite priorisiert offene Zugänglichkeit, Devoko niedrigen Einstieg und Preis, Luma Mehrkatzen-Kamera mit teiloffenem Zugang und PUROBOT geschlossene Datenprofile. Unpassendes Gewicht, Einstieg, Innenraum oder Streu schliessen ein Modell vor Smartfunktionen aus.", alternativeSlug: "neakasa-m1-lite" };
  data.faq = [
    { question: "Ab welchem Gewicht ist die Automatik geeignet?", answer: "Die Grenze ist produktspezifisch: Luma ab etwa 1 kg, PUROBOT und Devoko ab etwa 1,5 kg, M1 Lite ab etwa 1 kg. Unterhalb der Grenze bleibt die automatische und zeitgesteuerte Reinigung aus." },
    { question: "Sind automatische Katzentoiletten fuer Kitten geeignet?", answer: "Nur im manuellen Betrieb nach Herstelleranleitung. Kitten- oder Schutzmodus bedeutet nicht, dass die automatische Rotation fuer eine zu leichte Katze freigegeben ist." },
    { question: "Funktionieren sie ohne WLAN?", answer: "Der PUROBOT arbeitet nach der Einrichtung mit gespeicherten Einstellungen weiter, aktualisiert ohne Netz aber keine App-Daten. Bei den anderen Modellen muss der konkrete Offline-Umfang vor Kauf geprueft werden." },
    { question: "Erkennen Kamera und App Krankheiten?", answer: "Nein. Gewicht, Besuchsfrequenz, Bilder oder Ausscheidungstrends koennen Auffaelligkeiten zeigen, ersetzen aber keine tiermedizinische Diagnose." },
    { question: "Welche Streu funktioniert?", answer: "Nicht universal: Luma und PUROBOT erlauben belegte klumpende Varianten inklusive Tofu/Mischstreu, schliessen aber bestimmte nicht klumpende oder sehr feine Sorten aus. M1 Lite braucht siebfaehige Klumpstreu und keine Holzpellets; Devoko bleibt weniger praezise dokumentiert." },
  ];
  data.decisionJourney.next = targetSlugs.map((slug) => `/produkt/${slug}/`);
  data.evidenceSources = [
    { source: "PETLIBRO Deutschland", url: "https://de.petlibro.com/products/luma-intelligente-selbstreinigende-katzentoilette-exclusive", accessedAt: "2026-08-15", assertion: "Luma-Daten zu Gewicht, Kitten, Sicherheit, Streu, Abmessungen, Kamera, Cloud und Wartung sind Herstellerangaben.", fields: ["items", "criteria", "faq"] },
    { source: "PETKIT EU", url: "https://www.petkit-eu.com/en-de/products/purobot-max-pro-2-automatic-cat-litter-box", accessedAt: "2026-08-15", assertion: "PUROBOT-Daten zu Gewicht, Sicherheit, Streu, Abmessungen und EU-Verfuegbarkeit sind Herstellerangaben.", fields: ["items", "criteria", "faq"] },
  ];
  document.body = payload("COMPARISON_BODY").trim();
  return serializeDocument(document);
}

function patchHub(source) {
  const document = parseDocument(source, "Katzentoiletten-Hub");
  const current = document.data.contentPlatform?.products ?? [];
  if (!sameSet(current, baselineSlugs) && !sameSet(current, targetSlugs)) throw new Error(`[${PATCH}] Unerwartete Produktmenge im Katzentoiletten-Hub.`);
  document.data.updatedAt = "2026-08-15";
  document.data.description = "Cornerstone fuer automatische Katzentoiletten: Funktion, Bauform, Innenraum, Einstieg, Sicherheit, Streu, Wartung, Daten und laufende Kosten vor der Modellwahl klaeren.";
  document.data.contentPlatform.products = targetSlugs;
  document.data.contentPlatform.summary = ["Bauform, Innenraum, Einstieg und Mindestgewicht sind Ausschlusskriterien.", "Sicherheitsfunktionen bleiben Herstellerangaben und ersetzen keine Kontrolle.", "Monitoring zeigt Trends, nicht Diagnosen; Cloud und Folgekosten vor Kauf pruefen."];
  document.data.contentPlatform.checklist = ["Katzengewicht und Alter pruefen", "Einstieg und nutzbaren Innenraum beurteilen", "Streu-Freigabe lesen", "Sicherheits- und Offline-Verhalten verstehen", "Beutel, Filter und Dienste einrechnen"];
  document.data.contentPlatform.mistakes = ["Aussenvolumen mit Nutzraum verwechseln", "Kitten-Modus als Automatikfreigabe lesen", "jede Klumpstreu als kompatibel annehmen", "Monitoring als Diagnose behandeln", "Wartung und Verbrauchsmaterial unterschätzen"];
  document.data.evidenceSources = [
    { source: "PETLIBRO und PETKIT Primärquellen", url: "https://de.petlibro.com/products/luma-intelligente-selbstreinigende-katzentoilette-exclusive", accessedAt: "2026-08-15", assertion: "Der Hub verwendet Produktgrenzen nur als Beispiele; die konkrete Modellentscheidung liegt im Vergleich.", fields: ["contentPlatform", "decisionJourney"] },
  ];
  document.body = payload("HUB_BODY").trim();
  return serializeDocument(document);
}

function patchPetlibro(source) {
  let result = source;
  if (!/^\s+-\s+"petlibro-luma-smart-litter-box"\s*$/m.test(result)) {
    const start = result.indexOf("productSlugs:\n");
    const end = result.indexOf("\nprofile:\n", start);
    if (start < 0 || end < 0) throw new Error(`[${PATCH}] PETLIBRO productSlugs nicht eindeutig gefunden.`);
    result = `${result.slice(0, end)}\n  - "petlibro-luma-smart-litter-box"${result.slice(end)}`;
  }
  const marker = "<!-- pt:content-discovery:manufacturer-products:end -->";
  const link = "- [PETLIBRO Luma Smart Self-Cleaning Litter Box](/produkt/petlibro-luma-smart-litter-box/)";
  if (!result.includes(link)) {
    if (!result.includes(marker)) throw new Error(`[${PATCH}] PETLIBRO Discovery-Marker fehlt.`);
    result = result.replace(marker, `${link}\n${marker}`);
  }
  return result;
}

function patchLegacyTest(source) {
  if (source.includes('const parsed = yaml.load(match[1]')) return source;
  if (!source.includes('assert.match(comparison, /Lite ist vor allem eine Lieferumfangsvariante/);')) {
    throw new Error(`[${PATCH}] Vorheriger Katzentoiletten-Test hat einen unerwarteten Stand.`);
  }
  let result = source.replace(
    'import { fileURLToPath, pathToFileURL } from "node:url";',
    'import { createRequire } from "node:module";\nimport { fileURLToPath, pathToFileURL } from "node:url";',
  );
  result = result.replace(
    'const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");',
    'const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");\nconst require = createRequire(path.join(appRoot, "package.json"));\nconst yaml = require("js-yaml");',
  );
  const start = result.indexOf('test("Vergleich grenzt M1-Lieferumfang und Devoko-Datenlage ab"');
  if (start < 0) throw new Error(`[${PATCH}] Legacy-Testblock fehlt.`);
  result = `${result.slice(0, start)}test("Vergleich trennt M1-Variante und Devoko-Datenlage strukturell", () => {\n  const comparison = fs.readFileSync(\n    path.join(appRoot, "src/content/comparisons/beste-automatische-katzentoiletten.md"),\n    "utf8",\n  );\n  const match = comparison.match(/^---\\s*\\r?\\n([\\s\\S]*?)\\r?\\n---/);\n  assert.ok(match, "Vergleichs-Frontmatter fehlt");\n  const parsed = yaml.load(match[1], { schema: yaml.JSON_SCHEMA });\n  const slugs = parsed.items.map((item) => item.slug);\n  assert.ok(slugs.includes("neakasa-m1-lite"));\n  assert.equal(slugs.includes("neakasa-m1-plus"), false);\n  const devoko = parsed.items.find((item) => item.slug === "devoko-90l-automatisches-katzenklo");\n  assert.ok(devoko);\n  assert.match(devoko.values.sicherheit, /widerspruechlich/);\n  assert.match(devoko.values.platz, /uneinheitlich/);\n});\n`;
  return result;
}

const desired = new Map([
  [files.luma, payload("LUMA_PRODUCT")],
  [files.purobot, patchPurobot(read(files.purobot))],
  [files.comparison, patchComparison(read(files.comparison))],
  [files.hub, patchHub(read(files.hub))],
  [files.petlibro, patchPetlibro(read(files.petlibro))],
  [files.legacyTest, patchLegacyTest(read(files.legacyTest))],
  [files.promptLuma, payload("PROMPT_LUMA")],
  [files.promptPurobot, payload("PROMPT_PUROBOT")],
  [files.test, payload("TEST")],
]);

const managedNew = new Set([files.luma, files.promptLuma, files.promptPurobot, files.test]);
const changes = [...desired].filter(([file, content]) => !fs.existsSync(file) || read(file) !== content);
for (const [file] of changes) {
  if (managedNew.has(file) && fs.existsSync(file)) throw new Error(`[${PATCH}] Konflikt: verwaltete Datei weicht ab: ${path.relative(root, file)}`);
}

let backupRoot = null;
if (changes.length) {
  backupRoot = path.join(root, ".patch-backups", `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`);
  const staged = [];
  for (const [file, content] of changes) {
    if (fs.existsSync(file)) {
      const backup = path.join(backupRoot, path.relative(root, file));
      fs.mkdirSync(path.dirname(backup), { recursive: true });
      fs.copyFileSync(file, backup);
    }
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const temporary = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(temporary, content, "utf8");
    staged.push([file, temporary]);
  }
  for (const [file, temporary] of staged) {
    fs.renameSync(temporary, file);
    console.log(`[${PATCH}] Aktualisiert: ${path.relative(root, file)}`);
  }
} else {
  console.log(`[${PATCH}] Keine Aenderungen erforderlich.`);
}

const testResult = spawnSync(process.execPath, ["--experimental-strip-types", "--test", files.test], { cwd: root, stdio: "inherit" });
if (testResult.status !== 0) throw new Error(`[${PATCH}] Regressionstest fehlgeschlagen.`);
console.log(`[${PATCH}] Abgeschlossen.`);
if (backupRoot) console.log(`[${PATCH}] Backup: ${path.relative(root, backupRoot)}`);

/*__LUMA_PRODUCT__
---
title: "PETLIBRO Luma Smart Self-Cleaning Litter Box"
slug: "petlibro-luma-smart-litter-box"
type: "product"
layout: "product"
testStatus: "manufacturer-data"
productStatus: "active"
description: "Teiloffene automatische Katzentoilette mit 34-cm-Einstieg, 11-l-Abfallfach, Mehrkatzenprofilen, Kamera, Cloud-Aufzeichnung und dreifacher Sicherheitsprüfung."
recommendation: "Für erwachsene Katzen von 1 bis 10 kg und Mehrkatzenhaushalte, wenn 34 cm Einstieg, harter Stellplatz, Kamera-Cloud und laufende Filter-/Beutelkosten passen."
manufacturer:
  key: "petlibro"
  name: "PETLIBRO"
  slug: "petlibro"
category: { key: "automatische-katzentoiletten", label: "Automatische Katzentoiletten", path: "/automatische-katzentoiletten/" }
productUrl: "/produkt/petlibro-luma-smart-litter-box/"
publishedAt: "2026-08-15"
updatedAt: "2026-08-15"
author: { name: "PfotenTechnik Redaktion", role: "Redaktion" }
seo: { title: "PETLIBRO Luma im Datencheck", description: "PETLIBRO Luma nach Einstieg, Katzengewicht, Sicherheit, Streu, Abfallfach, Kamera, Cloud und Folgekosten eingeordnet.", canonical: "/produkt/petlibro-luma-smart-litter-box/", sitemap: true, priority: 0.8 }
hub: { sections: ["produkte", "automatische-katzentoiletten"] }
tags: ["automatische-katzentoilette", "katze", "mehrkatzenhaushalt", "kamera", "app"]
images:
  hero: { src: "../../assets/images/project/pfotentechnik/comparison/default-editorial-hero.webp", alt: "Neutrale redaktionelle Platzhaltergrafik bis zum modellgetreuen PETLIBRO-Luma-Produktbild" }
price: { current: null, currency: "EUR", status: "unknown" }
rating: 3.5
ratings: { datenlage: 4.1, passform: 3.8, wartung: 3.7, folgekosten: 3.0, datenschutz: 2.9 }
editorial: { assessmentType: "data-review", evidence: ["manufacturer-documentation", "technical-specifications", "comparative-analysis"], testedHandsOn: false, lastVerifiedAt: "2026-08-15", note: "Datencheck offizieller PETLIBRO-Quellen; Sicherheits- und Geruchsclaims sind Herstellerangaben, kein eigener Produkttest." }
decision:
  bestFor: ["erwachsene Katzen von 1 bis 10 kg", "Mehrkatzenprofile für bis zu 10 Katzen", "Haushalte mit hartem ebenem Stellplatz und bewusst gewählter Kamera-Cloud"]
  attention: ["unter 6 Monaten, unter 1 kg sowie bei trächtigen oder säugenden Katzen automatische Reinigung ausschalten", "34 cm Einstieg kann trotz mitgelieferter Stufe für eingeschränkte Katzen ungeeignet sein", "Videoaufzeichnung ist Cloud-only; AI-Analyse und Aufzeichnung benötigen einen passenden Tarif"]
review:
  summary: "PETLIBRO dokumentiert ein automatisches Siebsystem, 11-l-Abfallfach, 34-cm-Einstieg, drei Prüfpfade vor der Rotation, Mehrkatzenprofile, Kamera und App."
  verdict: "Datenreiches Mehrkatzensystem mit klaren Gewichts-, Streu- und Cloudgrenzen; praktische Akzeptanz und Langzeitzuverlässigkeit sind nicht selbst getestet."
strengths: ["Profile für bis zu 10 Katzen laut Hersteller", "11-l-Abfallfach und zwei Streufilter", "Kamera, Infrarot- und Gewichtserkennung prüfen vor der Rotation laut Hersteller"]
weaknesses: ["34-cm-Einstieg und großes Gehäuse", "Cloud-only-Video und tarifabhängige AI-Aufzeichnung", "Aktivkohlefilter und Einlagen als laufende Verbrauchsmaterialien"]
alternatives: ["neakasa-m1-lite", "devoko-90l-automatisches-katzenklo", "petkit-purobot-max-pro-2"]
comparisons: ["beste-automatische-katzentoiletten"]
comparisonFilters: { animal: ["cat"], petSize: ["small", "medium", "large"], foodType: [], app: true, camera: true }
specs:
  - { label: "Systemtyp", value: "Teiloffene automatische Siebung nach Nutzung oder Zeitplan" }
  - { label: "Abmessungen", value: "592 x 573 x 714 mm" }
  - { label: "Einstieg", value: "34 cm hoch; 442 mm breit; Stufe enthalten" }
  - { label: "Produktgewicht", value: "15 kg" }
  - { label: "Katzengewicht", value: "1 bis 10 kg für Automatik; bis zu 10 Katzenprofile" }
  - { label: "Kitten-/Schutzgrenze", value: "Unter 6 Monaten, unter 1 kg sowie trächtig/säugend nur manuell reinigen" }
  - { label: "Sicherheit", value: "Kamera, Infrarot, Gewichtssensoren und Einklemmschutz laut Hersteller" }
  - { label: "Abfallfach", value: "11 Liter; bis 7 Tage bei 2 Katzen ist eine Hersteller-Maximalangabe" }
  - { label: "Streu", value: "Klumpende, Tofu- und Mischstreu; keine Kristall-, Kiefern- oder ultrafeine Streu" }
  - { label: "Geruch", value: "Ventilator mit Aktivkohlefilter; Wechsel etwa alle 3 Monate empfohlen" }
  - { label: "Kamera/Speicher", value: "1080p; Livestream kostenlos, Aufzeichnung Cloud-only und tarifabhängig; keine SD-Karte" }
  - { label: "WLAN", value: "2,4 und 5 GHz; iOS und Android" }
  - { label: "Geräusch", value: "35 bis 47 dB je nach Lüfterstufe laut Hersteller" }
  - { label: "Strom", value: "Netzbetrieb; 12 V / 5 A Ausgang" }
  - { label: "Garantie", value: "Produktbezogene regionale Bedingungen vor Kauf prüfen" }
features: ["Selbstreinigung", "Mehrtierprofile", "1080p-Kamera", "App", "Cloud-Aufzeichnung", "Gewichtssensorik", "Aktivkohlefilter"]
comparisonData:
  version: 1
  custom: { bauform: "Teiloffenes automatisches Siebsystem", innenraum: "442-mm-Eingang; Nutzraum nicht separat beziffert", einstieg: "34 cm; Stufe enthalten", katzenprofil: "1-10 kg; unter 1 kg/6 Monaten manuell", sicherheit: "Kamera + IR + Gewicht + Einklemmschutz; Herstellerangabe", mehrkatzen: "Profile für bis zu 10 Katzen", streu: "Klumpend, Tofu, Mischstreu; Ausschlüsse dokumentiert", wartung: "11-l-Schublade; Filter und Einlagen", geruch: "Ventilator + Aktivkohlefilter", appdaten: "1080p, Cloud-only-Aufzeichnung; AI tarifabhängig", folgekosten: "Beutel, Aktivkohlefilter, optional Video Cloud AI", platz: "592 x 573 x 714 mm; harter Boden" }
decisionJourney: { cluster: "automatische-katzentoiletten", stage: "decision", intent: "petlibro-luma-pruefen", primaryQuestion: "Passen 34 cm Einstieg, Gewichtsgrenze, Streu, Kamera-Cloud und Verbrauchsmaterial zu Katze und Haushalt?", next: ["/vergleiche/beste-automatische-katzentoiletten/"], fallback: ["/automatische-katzentoiletten/"] }
evidenceSources:
  - { source: "PETLIBRO Deutschland – Luma", url: "https://de.petlibro.com/products/luma-intelligente-selbstreinigende-katzentoilette-exclusive", accessedAt: "2026-08-15", assertion: "Abmessungen, Einstieg, Gewicht, Katzenprofile, Sicherheit, Streu, Abfallfach, Kamera, Cloud, Geräusch, Strom und Lieferumfang sind Herstellerangaben.", fields: ["specs", "decision", "comparisonData"] }
  - { source: "PETLIBRO Deutschland – Luma Einführung", url: "https://de.petlibro.com/pages/introducing-luma", accessedAt: "2026-08-15", assertion: "Reinigungsverzögerung, Filterwechsel, Gewichtsmessgrenze und fehlende Smart-Home-Integration sind Herstellerangaben.", fields: ["specs", "weaknesses"] }
priceState: "unknown"
priceAvailable: false
affiliateAvailable: false
availability: "unknown"
availabilityReason: "Deutsche Herstellerseite bestätigt das Produkt; Preis und konkrete Lieferbarkeit vor Kauf erneut prüfen."
availabilityUpdated: "2026-08-15"
editorialStatus: "complete"
recommendationStatus: "limited"
maintenanceStatus: "complete"
---

## Herstellerfunktion, praktische Bedeutung und offene Erfahrung

PETLIBRO beschreibt, dass Kamera, Infrarot- und Gewichtssensoren vor der Rotation prüfen und das Gerät bei erkannter Annäherung stoppt. Das ist die dokumentierte Sicherheitsarchitektur – kein eigener Belastungs- oder Langzeittest. Praktisch bedeutet sie außerdem: Luma muss hart und eben stehen; Teppich kann Gewichtsmessung und Sicherheitsprüfung beeinträchtigen.

## Passform vor Kamera

Das Gehäuse ist 71,4 cm hoch, der Einstieg liegt 34 cm über dem Boden. Die mitgelieferte Stufe kann helfen, macht den Zugang aber nicht automatisch seniorengerecht. Unter 1 kg, unter sechs Monaten sowie bei trächtigen oder säugenden Katzen bleibt die Automatik aus.

## Streu, Wartung und laufende Kosten

Die zwei Filtereinsätze trennen feine Klumpstreu beziehungsweise Tofu- und Mischstreu. Kristall-, Kiefern- und sehr feine Grassamen-/Maniokstreu sind ausgeschlossen. Regelmäßig anfallen können Abfalleinlagen und der Aktivkohlefilter; PETLIBRO empfiehlt dessen Wechsel ungefähr alle drei Monate.

## Monitoring ist keine Diagnose

Profile, Gewicht, Toilettenbesuche, Bilder und AI-Auswertung können Veränderungen sichtbar machen. Sie beweisen keine Erkrankung. Livestreaming ist laut Hersteller kostenlos; Videoaufzeichnung und AI-Analyse benötigen Cloud und passenden Tarif, eine SD-Karte wird nicht unterstützt.

Die vier Einsatzrollen stehen im [Vergleich automatischer Katzentoiletten](/vergleiche/beste-automatische-katzentoiletten/). Den allgemeinen Sicherheits- und Platzcheck erklärt der [Hub](/automatische-katzentoiletten/).
__END_LUMA_PRODUCT__*/

/*__COMPARISON_BODY__
Dieser Vergleich besitzt die konkrete Modellentscheidung. Das Prüfprinzip lautet: erst Katze und Mechanik, danach Komfort.

## Sicherheits- und Ausschlusslogik

1. Gewicht, Alter und Beweglichkeit der Katze gegen die Herstellergrenze prüfen.
2. Einstieg, Öffnung und real nutzbaren Innenraum beurteilen.
3. Streu-Freigabe und Siebgrenzen bestätigen.
4. Erst dann Sensorik, App, Kamera und Geruchsfunktionen vergleichen.

Kitten-Modus bedeutet bei Luma, PUROBOT und M1 Lite nicht, dass eine zu leichte Katze mit aktiver Automatik reinigen darf. Allgemein gilt: Betritt oder nähert sich eine Katze während eines Zyklus, muss das Gerät nach Herstellerlogik stoppen. Bei Sensorfehlern, unebenem Stand, ungewöhnlichem Geräusch oder Stromproblem bleibt die Automatik aus, bis Ursache und Anleitung geklärt sind.

## Vier unterschiedliche Kaufrollen

- [Neakasa M1 Lite](/produkt/neakasa-m1-lite/) hält Sicht- und Fluchtweg offen, verlangt aber einen hohen Einstieg.
- [Devoko 90L](/produkt/devoko-90l-automatisches-katzenklo/) verbindet niedrigeren Einstieg und großen dokumentierten Innenraum mit schwächerer Datenkonsistenz.
- [PETLIBRO Luma](/produkt/petlibro-luma-smart-litter-box/) kombiniert teiloffenen Zugang und bis zu zehn Profile mit Cloud-only-Video.
- [PETKIT PUROBOT MAX PRO 2](/produkt/petkit-purobot-max-pro-2/) priorisiert geschlossene Mehrkatzen-Erkennung, Kamera- und Gewichtstrends.

Litter-Robot 5/5 Pro bleibt außerhalb der deutschen Empfehlung, solange Kauf, Versand und App-Kompatibilität laut Whisker regional eingeschränkt sind. M1 Plus bleibt als Produktseite erhalten, ist gegenüber M1 Lite aber vor allem eine Lieferumfangsvariante und keine zusätzliche Systemrolle.

## Streu und Mehrkatzenbetrieb

„Klumpend“ genügt nicht als Freigabe. Tofu, Mischstreu, Bentonit, feine Körnung und Pellets werden modellbezogen behandelt. Mehrkatzenfähigkeit hängt zusätzlich von zuverlässiger Zuordnung, Abfallfach, Reinigungsfrequenz und ausreichenden alternativen Toiletten ab. Herstellerangaben zur Erkennung ähnlich schwerer Katzen sind kein unabhängiger Zuverlässigkeitsnachweis.

## Daten, Ausfall und Folgekosten

Monitoring zeigt Nutzung, Gewicht oder Bilddaten – keine Diagnose. Beim PUROBOT läuft der voreingestellte Grundbetrieb ohne Netz weiter, während App-Daten ausbleiben. Für Luma sind Aufzeichnung und AI an Cloud und Tarif gebunden. In die Folgekosten gehören Beutel, Filter, Deodorizer, Streu und optionale Dienste; dynamische Preise werden nicht dauerhaft festgeschrieben.

Grundlagen, Gewöhnungsplan und Situationen gegen eine automatische Toilette stehen im [Hub zu automatischen Katzentoiletten](/automatische-katzentoiletten/).
__END_COMPARISON_BODY__*/

/*__HUB_BODY__
## Wie selbstreinigende Katzentoiletten funktionieren

Nach dem Toilettenbesuch trennt ein Sieb Klumpen von sauberer Streu und befördert Abfall in ein Fach. Der Ablauf kann rotieren, kippen oder sieben. „Selbstreinigend“ ersetzt weder tägliche Sichtkontrolle noch regelmäßige Demontage und Grundreinigung.

## Offen oder geschlossen?

Offene Systeme lassen Kopf, Rücken und Fluchtweg frei, brauchen aber Raum nach oben und können Geruch oder Streu weniger abschirmen. Geschlossene Trommeln fassen Abfall kompakter, verlangen jedoch passende Öffnung und ausreichenden Innenraum. Außenliter oder Gehäusegröße sagen nicht automatisch, wie viel Bewegungsraum die Katze hat.

## Größe und Einstieg richtig beurteilen

Miss Einstiegshöhe, Eingangsöffnung, nutzbaren Innenraum, Außenmaß und Freiraum zur Reinigung getrennt. Kleine, alte oder bewegungseingeschränkte Katzen können an 25 bis 35 cm hohen Einstiegen scheitern. Eine Stufe hilft nur, wenn sie stabil steht und die Katze sie freiwillig nutzt.

## Sicherheit, Kitten und Stromausfall

Mindestgewicht und Altersgrenze sind Ausschlusskriterien. Kitten- oder Schutzmodus deaktiviert bei zu leichten Katzen die Automatik; er ist keine Freigabe für automatische Rotation. Sensorzahl allein beweist keine Sicherheit. Relevant sind Erkennung vor dem Zyklus, sofortiger Stopp bei Annäherung, Einklemmschutz und ein sicherer Zustand bei Fehlern.

Nach Strom- oder Netzausfall muss die konkrete Anleitung gelten. Eine App-Verbindung darf nie Voraussetzung dafür sein, eine Katze aus einem unsicheren Zustand zu befreien.

## Mehrkatzenhaushalt

Profile und Gewichtserkennung lösen nicht jedes Mehrkatzenproblem. Ähnlich schwere Katzen können je nach System schwerer unterscheidbar sein. Abfallfach und Reinigungsintervall verkürzen sich mit jeder zusätzlichen Katze. Außerdem sollte während der Gewöhnung mindestens eine vertraute Alternative verfügbar bleiben.

## Streu, Wartung und Geruch

Prüfe Freigaben für Bentonit, Tofu, Mischstreu, Pellets, Kristallstreu sowie maximale Körnung. Nicht passende Streu kann Sieb, Sensoren und Abfallweg stören. Geruchskontrolle entsteht aus schneller Entfernung, dichtem Fach, Lüftung oder Filter – und erfordert trotzdem Reinigung sowie gegebenenfalls neue Filter oder Deodorizer.

## App, Monitoring und Datenschutz

Gewicht, Häufigkeit, Dauer, Fotos oder Ausscheidungstrends können Auffälligkeiten zeigen. Sie diagnostizieren keine Krankheit. Prüfe, welche Daten lokal oder in der Cloud liegen, welche Funktionen ohne Netz weiterlaufen und welche Aufzeichnung ein Abo benötigt.

## Laufende Kosten

`Gesamtkosten = Gerät + Streu + Beutel + Filter/Deodorizer + optionale App-/Cloud-Dienste + Ersatzteile`

Herstellerintervalle wie „bis zu 7 oder 17 Tage“ sind Maximalangaben und verkürzen sich bei mehreren Katzen. Dynamische Tarife gehören in den aktuellen Checkout, nicht als dauerhaftes Preisversprechen in den Ratgeber.

## Wann ist eine automatische Toilette keine gute Wahl?

- Gewicht oder Alter liegt außerhalb des Automatikbereichs.
- Die Katze meidet Einstieg, Enge, Geräusch oder Bewegung.
- Passende Streu kann nicht verwendet werden.
- Sensoren stehen nicht stabil oder der Stellplatz ist ungeeignet.
- Regelmäßige Kontrolle und Grundreinigung sind nicht gesichert.
- Kamera- oder Cloudverarbeitung widerspricht den eigenen Datenschutzanforderungen.

## Nächste Entscheidung

Der [Vergleich automatischer Katzentoiletten](/vergleiche/beste-automatische-katzentoiletten/) ordnet vier unterschiedliche Kaufrollen ein: [Neakasa M1 Lite](/produkt/neakasa-m1-lite/), [Devoko 90L](/produkt/devoko-90l-automatisches-katzenklo/), [PETLIBRO Luma](/produkt/petlibro-luma-smart-litter-box/) und [PETKIT PUROBOT MAX PRO 2](/produkt/petkit-purobot-max-pro-2/).

Zur Eingewöhnung das alte Klo zunächst behalten, das neue Gerät ausgeschaltet anbieten und automatische Zyklen erst nach freiwilliger Nutzung unter Beobachtung aktivieren.
__END_HUB_BODY__*/

/*__PROMPT_LUMA__
Produktions-Master-Prompt: PETLIBRO Luma Smart Self-Cleaning Litter Box

Nutze ausschließlich die offizielle Referenz https://de.petlibro.com/products/luma-intelligente-selbstreinigende-katzentoilette-exclusive. Produktform, Proportionen, 44,2-cm-Einlass, Gehäuse, Sockel und Stufe müssen exakt Luma entsprechen. Keine erfundenen Sensoren, Displays, App-Overlays, medizinischen Claims, Logos oder Werbetexte. Helle realistische Editorial-Produktfotografie, mobile Lesbarkeit, gleichbleibende Produktidentität in allen Bildern.

Erzeuge genau fünf separate Bilddateien in dieser Reihenfolge:
MOTIV 1: Premium Hero – vollständiges Luma-Gerät als hochwertiger Freisteller.
MOTIV 2: Thumbnail – kompakte frontnahe Ansicht mit klarer Produktsilhouette.
MOTIV 3: Perspektivansicht – 45-Grad-Ansicht mit Einlass, Gehäuse, Sockel und Stufe.
MOTIV 4: Funktionsdetail – offener Einstieg, sichtbarer Sensor-/Kamerabereich und Abfallfach, nur konstruktiv belegte Teile.
MOTIV 5: Nutzungssituation – Katze in plausibler Größenrelation beim Ein- oder Ausstieg auf hartem, ebenem Wohnraumboden.

STEUERUNG: Beginne nur mit MOTIV 1. Erzeuge genau ein Bild pro Antwort, antworte danach nur mit dem Bild und stoppe. Wenn der Nutzer ausschließlich „Weiter“ schreibt, erzeuge exakt das nächste noch nicht erzeugte Motiv. Nichts überspringen, nichts wiederholen, keine Motive kombinieren. Nach MOTIV 5 knapp „Serie vollständig“ melden; weiteres „Weiter“ erzeugt kein Bild.
__END_PROMPT_LUMA__*/

/*__PROMPT_PUROBOT__
Produktions-Master-Prompt: PETKIT PUROBOT MAX PRO 2

Nutze ausschließlich die offizielle EU-Referenz https://www.petkit-eu.com/en-de/products/purobot-max-pro-2-automatic-cat-litter-box. Gib exakt MAX PRO 2 wieder, keine andere PUROBOT-/PURAMAX-Generation. Eingang, Trommelkörper, Sockel und sichtbare feste Kamera modellgetreu; keine erfundenen Sensorpositionen, Warnanzeigen, App-Overlays, medizinischen Claims, Logos oder Werbetexte. Realistische Editorial-Produktfotografie und unveränderte Produktidentität.

Erzeuge genau fünf separate Bilddateien in dieser Reihenfolge:
MOTIV 1: Premium Hero – vollständiger PUROBOT MAX PRO 2 als hochwertiger Freisteller.
MOTIV 2: Thumbnail – kompakte Ansicht mit klarer Gehäuse- und Eingangsform.
MOTIV 3: Perspektivansicht – 45-Grad-Ansicht mit Eingang, Trommelkörper und Sockel.
MOTIV 4: Funktionsdetail – feste AI-Kamera und Eingangs-/Anti-Pinch-Geometrie, ohne erfundene Sensorpunkte.
MOTIV 5: Nutzungssituation – Katze in plausibler Größen- und Einstiegsrelation im Wohnraum.

STEUERUNG: Beginne nur mit MOTIV 1. Erzeuge genau ein Bild pro Antwort, antworte danach nur mit dem Bild und stoppe. Wenn der Nutzer ausschließlich „Weiter“ schreibt, erzeuge exakt das nächste noch nicht erzeugte Motiv. Nichts überspringen, nichts wiederholen, keine Motive kombinieren. Nach MOTIV 5 knapp „Serie vollständig“ melden; weiteres „Weiter“ erzeugt kein Bild.
__END_PROMPT_PUROBOT__*/

/*__TEST__
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(app, "package.json"));
const yaml = require("js-yaml");
const content = path.join(app, "src", "content");
const target = ["neakasa-m1-lite", "devoko-90l-automatisches-katzenklo", "petlibro-luma-smart-litter-box", "petkit-purobot-max-pro-2"];

function parse(relative) {
  const file = path.join(content, relative);
  const raw = fs.readFileSync(file, "utf8");
  const match = raw.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(match, `Frontmatter fehlt: ${relative}`);
  return { file, raw, data: yaml.load(match[1], { schema: yaml.JSON_SCHEMA }) };
}

test("Luma und PUROBOT sind eindeutige schemafaehige Produktentscheidungen", async () => {
  const scoreModule = await import(pathToFileURL(path.join(app, "src/domain/productScore.ts")).href);
  for (const slug of ["petlibro-luma-smart-litter-box", "petkit-purobot-max-pro-2"]) {
    const { file, data } = parse(`products/${slug}.md`);
    assert.equal(data.slug, slug);
    assert.equal(data.type, "product");
    assert.equal(data.category.key, "automatische-katzentoiletten");
    assert.equal(data.productUrl, `/produkt/${slug}/`);
    assert.ok(data.evidenceSources.length >= 2);
    assert.equal(data.editorial?.testedHandsOn ?? false, false);
    assert.ok(data.decisionJourney.next.includes("/vergleiche/beste-automatische-katzentoiletten/"));
    assert.ok(data.decisionJourney.fallback.includes("/automatische-katzentoiletten/"));
    const score = scoreModule.calculateProductScore(data);
    assert.equal(score.source, "criteria");
    assert.ok(score.criteriaCount >= 5);
    assert.ok(Number.isFinite(score.score));
    assert.ok(fs.existsSync(path.resolve(path.dirname(file), data.images.hero.src)));
  }
});

test("Vergleich besitzt exakt vier existierende Kaufrollen und Sicherheitsreihenfolge", () => {
  const comparison = parse("comparisons/beste-automatische-katzentoiletten.md").data;
  assert.deepEqual(comparison.items.map((item) => item.slug), target);
  assert.deepEqual(comparison.criteria.slice(0, 5).map((item) => item.key), ["bauform", "innenraum", "einstieg", "katzenprofil", "sicherheit"]);
  for (const item of comparison.items) assert.ok(fs.existsSync(path.join(content, "products", `${item.slug}.md`)));
  assert.deepEqual(comparison.decisionJourney.next, target.map((slug) => `/produkt/${slug}/`));
});

test("Hub und Herstellerbeziehungen schliessen die Journey ohne Dubletten", () => {
  const hub = parse("pages/automatische-katzentoiletten.md");
  assert.deepEqual(hub.data.contentPlatform.products, target);
  for (const slug of target) assert.ok(hub.raw.includes(`/produkt/${slug}/`));
  const petlibro = parse("manufacturers/petlibro.md").data;
  const petkit = parse("manufacturers/petkit.md").data;
  assert.equal(petlibro.productSlugs.filter((slug) => slug === "petlibro-luma-smart-litter-box").length, 1);
  assert.equal(petkit.productSlugs.filter((slug) => slug === "petkit-purobot-max-pro-2").length, 1);
});

test("Bildprompts definieren stabile Serien mit exakt fuenf Motiven", () => {
  for (const slug of ["petlibro-luma-smart-litter-box", "petkit-purobot-max-pro-2"]) {
    const prompt = fs.readFileSync(path.join(app, "research", "visual-prompts", `${slug}-visual-master-prompt.txt`), "utf8");
    assert.deepEqual([...prompt.matchAll(/^MOTIV ([1-5]):/gm)].map((match) => Number(match[1])), [1, 2, 3, 4, 5]);
    assert.match(prompt, /genau ein Bild pro Antwort/);
    assert.match(prompt, /ausschließlich „Weiter“/);
  }
});
__END_TEST__*/

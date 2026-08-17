#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const PATCH = "pfotentechnik-rola-pettracker-33.4.0";
function rootFrom(start) { let dir = path.resolve(start); while (true) { if (fs.existsSync(path.join(dir, "apps", "pfotentechnik", "package.json"))) return dir; const p = path.dirname(dir); if (p === dir) throw new Error(`[${PATCH}] Root nicht gefunden.`); dir = p; } }
const root = rootFrom(path.dirname(fileURLToPath(import.meta.url))), app = path.join(root, "apps", "pfotentechnik");
const yaml = createRequire(path.join(app, "package.json"))("js-yaml");
const at = (p) => path.join(app, ...p.split("/"));
const files = { product: at("src/content/products/enabot-rola-pettracker.md"), dogs: at("src/content/comparisons/beste-gps-tracker-fuer-hunde.md"), cats: at("src/content/comparisons/beste-gps-tracker-fuer-katzen.md"), hub: at("src/content/pages/gps-tracker.md"), maker: at("src/content/manufacturers/enabot.md"), prompt: at("research/visual-prompts/enabot-rola-pettracker-visual-master-prompt.txt"), test: at("test/enabot-rola-pettracker-33.4.0.test.mjs") };
function parse(source, label) { const m = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?([\s\S]*)$/); if (!m) throw new Error(`[${PATCH}] Frontmatter fehlt: ${label}`); return { data: yaml.load(m[1], { schema: yaml.JSON_SCHEMA }), body: m[2].trim() }; }
function dump(doc) { return `---\n${yaml.dump(doc.data, { schema: yaml.JSON_SCHEMA, noRefs: true, lineWidth: 120, quotingType: '"', forceQuotes: true })}---\n\n${doc.body.trim()}\n`; }
function section(body, id, content) { const a = `<!-- ${id}:start -->`, b = `<!-- ${id}:end -->`, block = `${a}\n${content.trim()}\n${b}`; if (body.includes(a) && body.includes(b)) { const esc = (v) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); return body.replace(new RegExp(`${esc(a)}[\\s\\S]*?${esc(b)}`), block); } return `${body.trim()}\n\n${block}`; }

const product = dump({ data: {
  title: "Enabot ROLA PetTracker", slug: "enabot-rola-pettracker", type: "product", layout: "product", testStatus: "manufacturer-data", productStatus: "active",
  description: "GPS-Tracker-Hybrid mit 480p-Live-Kamera, Zwei-Wege-Audio, virtueller Zone und 70-g-Gerätegewicht für Hunde und Katzen ab 4 kg laut Enabot.",
  recommendation: "Sonderlösung für größere Hunde und einzelne große Katzen, wenn Live-Bild und Audio den Gewicht-, Größen- und Akku-Nachteil rechtfertigen.",
  manufacturer: { key: "enabot", name: "Enabot", slug: "enabot" }, category: { key: "gps-tracker", label: "GPS-Tracker", path: "/gps-tracker/" },
  productUrl: "/produkt/enabot-rola-pettracker/", publishedAt: "2026-08-15", updatedAt: "2026-08-15", author: { name: "PfotenTechnik Redaktion", role: "Redaktion" },
  seo: { title: "Enabot ROLA PetTracker: GPS plus Kamera", description: "ROLA PetTracker mit 70 g, 480p-Kamera, Audio, GPS/AGPS und 3-5 Tagen Herstellerakku; Grenzen für Katzen sichtbar eingeordnet.", canonical: "/produkt/enabot-rola-pettracker/", sitemap: true, priority: 0.8 },
  hub: { sections: ["produkte", "gps-tracker"] }, tags: ["gps-tracker", "kamera", "hund", "katze", "enabot", "audio"],
  images: { hero: { src: "../../assets/images/project/pfotentechnik/comparison/default-editorial-hero.webp", alt: "Neutrale redaktionelle Darstellung eines GPS-Trackers mit integrierter Kamera" }, gallery: [] },
  price: { current: null, currency: "EUR", status: "unknown", checkedAt: "2026-08-15", source: { id: "enabot-de", label: "Enabot Deutschland", type: "editorial" } }, priceAutomation: "editorial", priceState: "unknown", priceAvailable: false, affiliateAvailable: false,
  availability: "out-of-stock", availabilityReason: "Der offizielle deutsche Enabot-Shop zeigte das Modell am 15.08.2026 als nicht auf Lager; daraus folgt keine Einstellung.", availabilityUpdated: "2026-08-15",
  editorialStatus: "required", recommendationStatus: "limited", maintenanceStatus: "required", rating: 0, ratings: {},
  externalEvidence: { status: "constrained", note: "Nur Herstellerdaten; kein eigener Praxistest und keine unabhängige Langzeitevidenz." },
  decision: { bestFor: ["Hunde ab 4 kg, wenn Live-Bild und Zwei-Wege-Audio konkret benötigt werden", "Große Katzen nur nach strenger Komfort- und Sicherheitsprüfung", "Nutzer, die GPS/LBS und Bildpositionierung kombinieren wollen"], attention: ["70 g Gerätegewicht", "Herstellerempfehlung ab 4 kg", "480p und 89,8° Sichtfeld", "Keine Nachtsicht dokumentiert", "Kameranutzung kann die Akkulaufzeit verkürzen", "Keine IP-Schutzklasse dokumentiert", "Kamera wird bei hoher Temperatur stufenweise deaktiviert"] },
  review: { summary: "ROLA kombiniert Ortung, Live-Kamera und Audio, bezahlt diese Zusatzklasse aber mit 70 g Gewicht und begrenzter 480p-Bildqualität.", verdict: "Kein Allround-Sieger, sondern ein klar begrenzter Kamera-Sonderfall für ausreichend große Tiere." },
  strengths: ["GPS und AGPS", "480p-Live-Kamera", "Zwei-Wege-Audio", "Virtuelle Zone von 50 bis 150 m laut Hersteller", "32 GB interner Speicher"],
  weaknesses: ["70 g relativ schwer", "Nicht für kleine Katzen", "Keine Nachtsicht", "Keine IP-Schutzklasse dokumentiert", "3 bis 5 Tage sind ein Herstellerwert und kameranutzungsabhängig"],
  features: ["GPS", "AGPS", "LBS", "480p-Kamera", "Zwei-Wege-Audio", "virtuelle Zone", "Aktivitätsdaten", "ROLA-App"], useCase: "GPS-Tracker mit Live-Bild und Audio für Tiere ab 4 kg",
  specs: [
    { label: "Abmessungen", value: "62 × 37,5 × 27,1 mm" }, { label: "Gewicht", value: "70 g" }, { label: "Herstellerempfehlung", value: "Hunde und Katzen ab 4 kg" },
    { label: "Akku", value: "1500 mAh; 3 bis 5 Tage laut Hersteller" }, { label: "Kamera", value: "480p, 89,8° Sichtfeld, Sechsachsen-Stabilisierung" },
    { label: "Nachtsicht", value: "Nicht unterstützt" }, { label: "Ortung", value: "GPS + AGPS, ergänzend LBS sowie Ton-/Licht-/Bildpositionierung" },
    { label: "Funk", value: "2,4-GHz-WLAN, Bluetooth 4.2, Nano-SIM" }, { label: "Speicher", value: "32 GB ROM, 1 GB RAM; MP4" },
    { label: "Übertragung", value: "Nano-SIM/Mobilfunk zur ROLA-App; 2,4-GHz-WLAN und Bluetooth 4.2 für Gerätefunktionen" },
    { label: "Reichweite", value: "Keine feste Distanzangabe; abhängig von unterstützter Mobilfunk-, Satelliten- und Dienstabdeckung" },
    { label: "Abo", value: "Nano-SIM und Mobilfunkdienst erforderlich; konkreten Tarif vor Kauf prüfen" },
    { label: "Geeignet für", value: "Hunde und Katzen ab 4 kg laut Hersteller; 70-g-Komfort individuell prüfen" },
    { label: "Befestigung", value: "Halsbandbefestigung; sicheren Sitz und Scheuern unter Aufsicht prüfen" },
    { label: "App", value: "ROLA-App für iOS und Android laut Hersteller" }, { label: "WLAN", value: "2,4 GHz" },
    { label: "Bluetooth", value: "Bluetooth 4.2" }, { label: "Material", value: "Nicht ausgewiesen" },
    { label: "Temperaturschutz", value: "Warnung über 45 °C; Kamera ab über 55 °C aus, bis unter 40 °C erreicht sind; Tracker bleibt laut FAQ aktiv" },
    { label: "Wasserschutz", value: "Keine IP-Schutzklasse dokumentiert" },
  ],
  gps: { animal: ["dog", "cat"], minimumPetWeightKg: 4, deviceWeightGrams: 70, weightBasis: "device", subscriptionRequired: true, includedServiceMonths: 0, transmission: "other", batteryMaxDays: 5, batteryCondition: "Herstellerwert; Kamera und Funknutzung können verkürzen", liveTracking: true, virtualFence: true, activityTracking: true, attachmentType: "collar-attachment" },
  comparisonData: { version: 1, custom: { einsatzgebiet: "Ortung plus Live-Bild", hundegroesse: "Ab 4 kg; 70 g Komfort prüfen", ortung: "GPS + AGPS/LBS", abo: "Nano-SIM/Mobilfunkdienst erforderlich; Tarif prüfen", gewicht: "70 g", mindestgewicht: "4 kg", kamera: "480p; 89,8°", nachtsicht: "Nein", akkulaufzeit: "3-5 Tage laut Hersteller", geofencing: "50-150 m", audio: "Zwei-Wege-Audio", groesse: "62 × 37,5 × 27,1 mm" } },
  comparisonFilters: { animal: ["dog", "cat"], petSize: ["medium", "large"], foodType: [] }, alternatives: ["tractive-dog-6", "weenect-xs"], comparisons: ["beste-gps-tracker-fuer-hunde"],
  decisionJourney: { cluster: "gps-tracker", stage: "decision", intent: "gps-tracker-mit-kamera-pruefen", primaryQuestion: "Rechtfertigen Live-Bild und Audio 70 g Gewicht, begrenzte Auflösung und kürzere Laufzeit?", next: ["/vergleiche/beste-gps-tracker-fuer-hunde/"], fallback: ["/gps-tracker/"] },
  faq: [
    { question: "Ist der ROLA PetTracker für kleine Katzen geeignet?", answer: "Nein. Enabot nennt Tiere ab 4 kg; zusätzlich sind 70 g für einen Tiertracker relativ schwer. Auch bei einer großen Katze müssen Sicherheitsbefestigung und Komfort individuell geprüft werden." },
    { question: "Hat der Tracker Nachtsicht?", answer: "Nein. Die aktuelle offizielle Spezifikation führt Nachtsicht als nicht unterstützt." },
    { question: "Wie lange hält der Akku?", answer: "Enabot nennt 3 bis 5 Tage. Kamera, Audio, Ortungsintervalle, Netzqualität und Temperatur können die reale Laufzeit verändern." },
    { question: "Ist der Tracker wasserdicht?", answer: "Enabot beschreibt Alltagsschutz, nennt aber keine belastbare IP-Schutzklasse. Deshalb wird keine IP-Einstufung erfunden." },
  ],
  editorial: { assessmentType: "data-review", evidence: ["manufacturer-documentation", "technical-specifications", "comparative-analysis"], testedHandsOn: false, lastVerifiedAt: "2026-08-15", note: "Herstellerdaten; kein eigener Produkttest." },
  evidenceSources: [{ source: "Enabot Deutschland", url: "https://de.store.enabot.com/products/rola-pettracker-gps-tracker-for-pets", accessedAt: "2026-08-15", assertion: "Maße, Gewicht, Kamera, Funk, Akku, Tiergrenze, Nachtsicht und thermische Schutzlogik sind Herstellerangaben.", fields: ["specs", "decision", "gps", "comparisonData"] }],
}, body: `## Kamera-Hybrid statt leichter Allrounder\n\nROLA verbindet GPS-Ortung mit Live-Bild und Zwei-Wege-Audio. Diese Sonderfunktion macht das Gerät nicht automatisch zum besseren Tracker: **70 g**, die Empfehlung ab **4 kg**, 480p und fehlende Nachtsicht sind zentrale Entscheidungsgrenzen.\n\nBei hohen Temperaturen schaltet Enabot Kamerafunktionen stufenweise ab; dies ist Schutzlogik, keine Garantie für jede Umgebung. Eine IP-Schutzklasse wird nicht ergänzt.\n\nDer [GPS-Grundlagenhub](/gps-tracker/) erklärt den Zielkonflikt. Im [Hundevergleich](/vergleiche/beste-gps-tracker-fuer-hunde/) erscheint ROLA als Kamera-Sonderfall, nicht als Testsieger. Für Katzen erfolgt wegen Gewicht und Mindestgröße keine Aufnahme in die Hauptmatrix.` });

function dogs(source) {
  const doc = parse(source, "Hundevergleich");
  const existing = (doc.data.items ?? []).find((i) => i.slug === "enabot-rola-pettracker");
  const item = existing ?? { slug: "enabot-rola-pettracker", type: "product", values: {}, overrides: {} };
  item.label = "Kamera-Sonderfall"; item.recommendation = "Für Tiere ab 4 kg, wenn Live-Bild und Audio wichtiger sind als geringes Gewicht und lange Laufzeit.";
  item.values = { ...(item.values ?? {}), einsatzgebiet: "Ortung plus Live-Bild", hundegroesse: "Ab 4 kg; 70-g-Gerät", ortung: "GPS + AGPS/LBS", abo: "Nano-SIM/Mobilfunkdienst; Tarif prüfen", gewicht: "70 g", mindestgewicht: "4 kg", kamera: "480p, 89,8°", nachtsicht: "Nein", akkulaufzeit: "3-5 Tage Herstellerwert", geofencing: "50-150 m", audio: "Zwei-Wege-Audio", groesse: "62 × 37,5 × 27,1 mm" };
  if (!existing) doc.data.items.push(item);
  const extras = [["gewicht", "Gerätegewicht"], ["mindestgewicht", "Tier-Mindestgewicht"], ["kamera", "Kamera"], ["nachtsicht", "Nachtsicht"], ["akkulaufzeit", "Akkulaufzeit"], ["geofencing", "Geofencing"], ["audio", "Audio"], ["groesse", "Abmessungen"]];
  const map = new Map(doc.data.criteria.map((c) => [c.key, c])); for (const [key, label] of extras) map.set(key, { key, label, format: "auto", fallback: "Nicht ausgewiesen" }); doc.data.criteria = [...map.values()];
  doc.data.updatedAt = "2026-08-15";
  doc.body = section(doc.body, "pt:rola-special-case", `## Sonderfall: Ortung mit Live-Bild\n\nDer [Enabot ROLA PetTracker](/produkt/enabot-rola-pettracker/) ergänzt die Matrix für Nutzer, die zusätzlich ein Live-Bild und Zwei-Wege-Audio benötigen. Er wird nicht zum Testsieger: 70 g, die Grenze ab 4 kg, 480p, fehlende Nachtsicht und eine Herstellerlaufzeit von 3 bis 5 Tagen sind klare Zielkonflikte.`);
  return dump(doc);
}
function cats(source) {
  const doc = parse(source, "Katzenvergleich");
  doc.data.items = (doc.data.items ?? []).filter((i) => i.slug !== "enabot-rola-pettracker"); doc.data.updatedAt = "2026-08-15";
  doc.body = section(doc.body, "pt:rola-cat-decision", `## Warum ROLA nicht in der Hauptmatrix steht\n\nDer [Enabot ROLA PetTracker](/produkt/enabot-rola-pettracker/) bietet zwar Kamera und Audio, wiegt aber 70 g und ist laut Hersteller erst ab 4 kg vorgesehen. Damit ist er kein kleiner oder leichter Katzentracker. Er bleibt ein Sonderfall für einzelne große Katzen nach strenger Prüfung von Komfort und Sicherheitsbefestigung.`);
  return dump(doc);
}
function hub(source) { const doc = parse(source, "GPS-Hub"); const products = new Set(doc.data.contentPlatform?.products ?? []); products.add("enabot-rola-pettracker"); doc.data.contentPlatform.products = [...products]; doc.data.updatedAt = "2026-08-15"; doc.body = section(doc.body, "pt:rola-hybrid", `## GPS-Tracker mit integrierter Kamera\n\nKamera-Hybride wie der [Enabot ROLA PetTracker](/produkt/enabot-rola-pettracker/) können Live-Bild und Audio ergänzen. Dafür steigen Gewicht, Gehäusegröße und Energiebedarf; 480p ersetzt keine detailreiche Überwachung und fehlende Nachtsicht begrenzt den Nutzen im Dunkeln. Der Gerätetyp ist deshalb eine Sonderlösung, kein automatisches Upgrade.`); return dump(doc); }
function maker(source) { const doc = parse(source, "Enabot"); const slugs = new Set(doc.data.productSlugs ?? []); slugs.add("enabot-rola-pettracker"); doc.data.productSlugs = [...slugs]; doc.data.productCategories = [...new Set([...(doc.data.productCategories ?? []), "GPS-Tracker mit Kamera"])]; doc.data.updatedAt = "2026-08-15"; doc.body = section(doc.body, "pt:rola-product", `## ROLA PetTracker\n\nDer [ROLA PetTracker](/produkt/enabot-rola-pettracker/) ergänzt Enabots Kameraprodukte um GPS/AGPS, Live-Bild und Audio. Die 70-g-Grenze trennt ihn redaktionell von leichten Katzentrackern.`); return dump(doc); }

const prompt = `MASTER-PROMPT: Enabot ROLA PetTracker\n\nFotorealistische redaktionelle Produktserie desselben kompakten GPS-Kamera-Trackers. Keine erfundenen Logos, IP-Symbole, Nachtsicht-LEDs oder Gesundheitsanzeigen. Das Gerät nur an einem mittelgroßen bis großen Hund oder im neutralen Größenvergleich zeigen, niemals an einer kleinen Katze.\n\nFeste Motivfolge:\n1. Premium Hero\n2. Thumbnail\n3. Perspektivansicht\n4. Kamera und Halsbandbefestigung\n5. Größenvergleich am ausreichend großen Tier\n6. App-Kontext mit GPS und Live-Bild ohne erfundene Messwerte\n\nPro Antwort genau ein Bild erzeugen und stoppen. Nur auf exakt „Weiter“ das nächste Motiv erzeugen. Nicht überspringen oder wiederholen; Modell, Farbe und Geometrie bleiben identisch.\n`;
const test = `import assert from "node:assert/strict"; import fs from "node:fs"; import path from "node:path"; import test from "node:test"; import { createRequire } from "node:module"; import { fileURLToPath } from "node:url"; const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),".."); const yaml=createRequire(path.join(app,"package.json"))("js-yaml"); const load=(kind,slug)=>{const source=fs.readFileSync(path.join(app,"src/content",kind,slug+".md"),"utf8"),m=source.match(/^---\\s*\\r?\\n([\\s\\S]*?)\\r?\\n---/);assert.ok(m);return{source,data:yaml.load(m[1],{schema:yaml.JSON_SCHEMA})}}; test("ROLA models verified limits",()=>{const p=load("products","enabot-rola-pettracker");assert.equal(p.data.gps.deviceWeightGrams,70);assert.equal(p.data.gps.minimumPetWeightKg,4);assert.match(p.source,/Keine Nachtsicht|Nicht unterstützt/);assert.doesNotMatch(p.source,/IP6[78]/);assert.ok(fs.existsSync(path.resolve(path.dirname(path.join(app,"src/content/products/x.md")),p.data.images.hero.src)))}); test("dog matrix includes special case but cat matrix excludes it",()=>{const d=load("comparisons","beste-gps-tracker-fuer-hunde"),c=load("comparisons","beste-gps-tracker-fuer-katzen");assert.ok(d.data.items.some(i=>i.slug==="enabot-rola-pettracker"));assert.equal(c.data.items.some(i=>i.slug==="enabot-rola-pettracker"),false);assert.match(c.source,/70 g/)}); test("journey links are present",()=>{for(const [kind,slug] of [["products","enabot-rola-pettracker"],["pages","gps-tracker"],["comparisons","beste-gps-tracker-fuer-hunde"]]){const x=load(kind,slug);assert.match(x.source,/enabot-rola-pettracker/)}});\n`;
const desired = new Map([[files.product, product], [files.dogs, dogs(fs.readFileSync(files.dogs,"utf8"))], [files.cats, cats(fs.readFileSync(files.cats,"utf8"))], [files.hub, hub(fs.readFileSync(files.hub,"utf8"))], [files.maker, maker(fs.readFileSync(files.maker,"utf8"))], [files.prompt, prompt], [files.test, test]]);
const identity = (file, source) => file === files.product ? /slug:\s*["']?enabot-rola-pettracker/.test(source) : file === files.prompt ? source.includes("MASTER-PROMPT: Enabot ROLA") : file === files.test && source.includes("ROLA models verified limits");
const managed = new Set([files.product, files.prompt, files.test]); const changes=[...desired].filter(([f,c])=>!fs.existsSync(f)||fs.readFileSync(f,"utf8")!==c);
for(const [f,c] of changes) if(managed.has(f)&&fs.existsSync(f)&&!identity(f,fs.readFileSync(f,"utf8"))&&fs.readFileSync(f,"utf8")!==c) throw new Error(`[${PATCH}] Konflikt: ${path.relative(root,f)}`);
let backup=null; if(changes.length){backup=path.join(root,".patch-backups",`${PATCH}-${new Date().toISOString().replace(/[:.]/g,"-")}`);for(const[f,c]of changes){if(fs.existsSync(f)){const b=path.join(backup,path.relative(root,f));fs.mkdirSync(path.dirname(b),{recursive:true});fs.copyFileSync(f,b)}fs.mkdirSync(path.dirname(f),{recursive:true});const t=`${f}.${crypto.randomUUID()}.tmp`;fs.writeFileSync(t,c,"utf8");fs.renameSync(t,f)}}
for(const f of [files.product,files.dogs,files.cats,files.hub,files.maker])parse(fs.readFileSync(f,"utf8"),path.relative(root,f));console.log(`[${PATCH}] ${changes.length?`${changes.length} Datei(en) installiert; Backup: ${backup}`:"Zielzustand bereits vorhanden (no-op)."}`);

#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const PATCH = "pfotentechnik-seo-week3-authority-links-11.0.0";
const CHECK = process.argv.includes("--check");
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function findRepoRoot(start) {
  let current = path.resolve(start);
  for (let i = 0; i < 12; i += 1) {
    if (
      fs.existsSync(path.join(current, "apps", "pfotentechnik")) &&
      fs.existsSync(path.join(current, "package.json"))
    ) return current;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error("Repository-Root mit apps/pfotentechnik nicht gefunden.");
}

const root = findRepoRoot(process.cwd());
const app = path.join(root, "apps", "pfotentechnik");
const changed = new Map();
const deleted = new Map();

const normalizeText = (value) =>
  String(value)
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n");

const rel = (file) => path.relative(root, file).replaceAll("\\", "/");

function read(file) {
  if (!fs.existsSync(file)) throw new Error(`Datei fehlt: ${rel(file)}`);
  return normalizeText(fs.readFileSync(file, "utf8"));
}

function stage(file, content) {
  const next = normalizeText(content);
  const old = fs.existsSync(file) ? read(file) : null;
  if (old !== next) changed.set(file, { old, next });
}

function stageDelete(file) {
  if (fs.existsSync(file)) deleted.set(file, read(file));
}

function setTopLevelScalar(text, key, value) {
  const rx = new RegExp(`^${key}:.*$`, "m");
  if (!rx.test(text)) return text;
  return text.replace(rx, `${key}: ${JSON.stringify(value)}`);
}

function splitDocument(text) {
  const normalized = normalizeText(text);
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new Error("Markdown-Frontmatter konnte nicht getrennt werden.");
  return { frontmatter: match[1], body: match[2] };
}

function joinDocument(frontmatter, body) {
  return `---\n${frontmatter.trimEnd()}\n---\n\n${body.trim()}\n`;
}

function insertSection(text, heading, section, preferredMarkers = []) {
  if (text.includes(heading)) return text;
  const { frontmatter, body } = splitDocument(text);
  let position = -1;
  for (const marker of preferredMarkers) {
    position = body.indexOf(marker);
    if (position >= 0) break;
  }
  const nextBody = position >= 0
    ? `${body.slice(0, position).trimEnd()}\n\n${section.trim()}\n\n${body.slice(position).trimStart()}`
    : `${body.trimEnd()}\n\n${section.trim()}\n`;
  return joinDocument(frontmatter, nextBody);
}

function walk(directory) {
  const result = [];
  if (!fs.existsSync(directory)) return result;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (full.includes(`${path.sep}data${path.sep}seo`)) continue;
      result.push(...walk(full));
    } else {
      if (/\.bak(?:\.|$)/i.test(entry.name)) continue;
      if (/\.(?:md|mdx|astro|ts|tsx|js|mjs|json|ya?ml)$/i.test(entry.name)) {
        result.push(full);
      }
    }
  }
  return result;
}

const files = {
  redirects: path.join(app, "public", "_redirects"),
  legacyOffline: path.join(app, "src", "content", "pages", "beste-futterautomaten-ohne-wlan.md"),
  legacyCamera: path.join(app, "src", "content", "pages", "beste-futterautomaten-mit-kamera.md"),
  holiday: path.join(app, "src", "content", "pages", "futterautomat-im-urlaub.md"),
  mechanics: path.join(app, "src", "content", "pages", "wie-funktioniert-ein-futterautomat.md"),
  chooser: path.join(app, "src", "content", "pages", "welcher-futterautomat-ist-der-richtige.md"),
  cameraGuide: path.join(app, "src", "content", "pages", "futterautomat-mit-kamera.md"),
  wetGuide: path.join(app, "src", "content", "pages", "futterautomat-nassfutter.md"),
  petkit: path.join(app, "src", "content", "manufacturers", "petkit.md"),
  yumshare: path.join(app, "src", "content", "products", "petkit-yumshare-solo-2.md"),
  audit: path.join(app, "scripts", "seo", "audit-week3-authority-links.mjs")
};

const redirects = [
  ["/beste-futterautomaten-ohne-wlan", "/vergleiche/beste-futterautomaten-ohne-wlan/"],
  ["/beste-futterautomaten-ohne-wlan/", "/vergleiche/beste-futterautomaten-ohne-wlan/"],
  ["/beste-futterautomaten-mit-kamera", "/vergleiche/beste-futterautomaten-mit-kamera/"],
  ["/beste-futterautomaten-mit-kamera/", "/vergleiche/beste-futterautomaten-mit-kamera/"]
];

{
  let text = fs.existsSync(files.redirects) ? read(files.redirects) : "";
  const kept = text
    .split("\n")
    .filter((line) =>
      !line.trim().startsWith("/beste-futterautomaten-ohne-wlan") &&
      !line.trim().startsWith("/beste-futterautomaten-mit-kamera")
    );
  while (kept.length && !kept.at(-1).trim()) kept.pop();
  kept.push("", "# pfotentechnik: weitere kanonische Comparison-Routen");
  for (const [source, target] of redirects) {
    kept.push(`${source} ${target} 301`);
  }
  stage(files.redirects, `${kept.join("\n")}\n`);
}

stageDelete(files.legacyOffline);
stageDelete(files.legacyCamera);

// Produktive interne Altlinks auf die kanonischen Comparisons umstellen.
for (const file of walk(path.join(app, "src"))) {
  if (file === files.legacyOffline || file === files.legacyCamera) continue;
  let text = read(file);
  const original = text;
  text = text.replace(
    /(?<!\/vergleiche)\/beste-futterautomaten-ohne-wlan\/?/g,
    "/vergleiche/beste-futterautomaten-ohne-wlan/"
  );
  text = text.replace(
    /(?<!\/vergleiche)\/beste-futterautomaten-mit-kamera\/?/g,
    "/vergleiche/beste-futterautomaten-mit-kamera/"
  );
  if (text !== original) stage(file, text);
}

const sections = {
  holiday: `## Technik passend zur Abwesenheit auswählen

Für feste Abläufe ohne Cloud lohnt der [Vergleich der Futterautomaten ohne WLAN](/vergleiche/beste-futterautomaten-ohne-wlan/). Wer den Futterplatz zusätzlich sehen muss, findet im [Vergleich der Kamera-Futterautomaten](/vergleiche/beste-futterautomaten-mit-kamera/) die passendere Produktauswahl. Bei vorbereitetem Nassfutter ist der aktiv gekühlte [PETLIBRO Polar](/produkt/petlibro-polar-wet-food-feeder/) ein technisches Gegenmodell zu einfachen Fächern mit Kühlakkus. Keine dieser Lösungen ersetzt die Betreuung vor Ort.`,
  mechanics: `## Vom Funktionsprinzip zum passenden Vergleich

Nach der technischen Einordnung sollte die Auswahl nach dem eigentlichen Problem erfolgen: [Offline-Modelle ohne WLAN vergleichen](/vergleiche/beste-futterautomaten-ohne-wlan/), [Kamera-Futterautomaten vergleichen](/vergleiche/beste-futterautomaten-mit-kamera/) oder [Lösungen für zwei Katzen vergleichen](/vergleiche/beste-futterautomaten-fuer-zwei-katzen/). So werden Timer, Kamera und Zugangskontrolle nicht als austauschbare Funktionen behandelt.`,
  chooser: `## Direkte Vergleiche nach Bedarf

| Bedarf | Passender Vergleich |
|---|---|
| Katze und unterschiedliche Futterarten | [Futterautomaten für Katzen](/vergleiche/beste-futterautomaten-fuer-katzen/) |
| kleine bis mittelgroße Hunde | [Futterautomaten für Hunde](/vergleiche/beste-futterautomaten-fuer-hunde/) |
| zwei Katzen oder Futterneid | [Futterautomaten für zwei Katzen](/vergleiche/beste-futterautomaten-fuer-zwei-katzen/) |
| vorbereitetes Nassfutter | [Nassfutterautomaten](/vergleiche/beste-futterautomaten-fuer-nassfutter/) |
| kein Konto, keine Cloud | [Futterautomaten ohne WLAN](/vergleiche/beste-futterautomaten-ohne-wlan/) |
| Livebild und Video | [Futterautomaten mit Kamera](/vergleiche/beste-futterautomaten-mit-kamera/) |

Der Vergleich folgt erst nach der Entscheidung über Futterart, Tiergröße und Zugang. Dadurch konkurriert keine Funktionsliste mit einer ungeeigneten Bauart.`,
  camera: `## PETKIT YumShare Solo 2 einordnen

Der [PETKIT YumShare Solo 2](/produkt/petkit-yumshare-solo-2/) ist ein Ein-Kammer-Kameraautomat mit 3-Liter-Vorrat und Dual-Band-WLAN. Er eignet sich für Livebild und geplante Trockenfutterportionen, trennt aber keine Tiere am Napf. Der [direkte Kamera-Vergleich](/vergleiche/beste-futterautomaten-mit-kamera/) stellt ihn einfacheren und komplexeren Kamera-Konzepten gegenüber.`,
  wet: `## Aktive Kühlung als eigenes System

Der [PETLIBRO Polar](/produkt/petlibro-polar-wet-food-feeder/) arbeitet mit thermoelektrischer Aktivkühlung und drei vorbereiteten Fächern. Damit ist er konstruktiv anders einzuordnen als Timer-Schalen mit Kühlakkus. Im [Nassfutterautomaten-Vergleich](/vergleiche/beste-futterautomaten-fuer-nassfutter/) werden beide Prinzipien getrennt bewertet.`,
  petkit: `## Wichtige PETKIT-Modelle im Detail

Der [PETKIT YumShare Solo 2](/produkt/petkit-yumshare-solo-2/) kombiniert Trockenfutter-Zeitpläne mit Kamera und Zwei-Wege-Audio. Der [YumShare Dual-Hopper](/produkt/petkit-yumshare-dual-hopper/) ergänzt zwei getrennte Vorräte, aber keine physische Tiertrennung. Bei Trinksystemen ist der [PETKIT Eversweet Ultra](/produkt/petkit-eversweet-ultra/) die spezialisierte Lösung mit getrenntem Frisch- und Abwasser sowie Kamera-Auswertung.`
};

{
  let text = read(files.holiday);
  text = setTopLevelScalar(text, "updatedAt", "2026-07-25");
  text = insertSection(text, "## Technik passend zur Abwesenheit auswählen", sections.holiday, [
    "## Methodik unserer Einordnung",
    "## Quellen"
  ]);
  stage(files.holiday, text);
}
{
  let text = read(files.mechanics);
  text = setTopLevelScalar(text, "updatedAt", "2026-07-25");
  text = insertSection(text, "## Vom Funktionsprinzip zum passenden Vergleich", sections.mechanics, [
    "## Methodik unserer Einordnung",
    "## Quellen"
  ]);
  stage(files.mechanics, text);
}
{
  let text = read(files.chooser);
  text = setTopLevelScalar(text, "updatedAt", "2026-07-25");
  text = insertSection(text, "## Direkte Vergleiche nach Bedarf", sections.chooser, [
    "## Schritt 1:",
    "## Methodik",
    "## Quellen"
  ]);
  stage(files.chooser, text);
}
{
  let text = read(files.cameraGuide);
  text = setTopLevelScalar(text, "updatedAt", "2026-07-25");
  text = insertSection(text, "## PETKIT YumShare Solo 2 einordnen", sections.camera, [
    "## Methodik",
    "## Quellen",
    "## Fazit"
  ]);
  stage(files.cameraGuide, text);
}
{
  let text = read(files.wetGuide);
  text = setTopLevelScalar(text, "updatedAt", "2026-07-25");
  text = insertSection(text, "## Aktive Kühlung als eigenes System", sections.wet, [
    "## Methodik",
    "## Quellen",
    "## Fazit"
  ]);
  stage(files.wetGuide, text);
}
{
  let text = read(files.petkit);
  text = setTopLevelScalar(text, "updatedAt", "2026-07-25");
  text = insertSection(text, "## Wichtige PETKIT-Modelle im Detail", sections.petkit, [
    "## Unsere Einschätzung",
    "## Methodik",
    "## Quellen"
  ]);
  stage(files.petkit, text);
}

// Recherchierte Opportunity-Produktseite vollständig konsolidieren.
stage(files.yumshare, "---\ntitle: \"PETKIT YumShare Solo 2\"\nslug: \"petkit-yumshare-solo-2\"\ntype: \"product\"\nlayout: \"product\"\ntestStatus: \"editorial-review\"\nproductStatus: \"active\"\ndescription: \"Kamera-Futterautomat mit 3-Liter-Tank, 1080p-Video, Zwei-Wege-Audio, Dual-Band-WLAN und bis zu zehn geplanten Trockenfuttermahlzeiten.\"\nrecommendation: \"Premium-Kameraautomat für Katzen und kleine Hunde, wenn Livebild, App-Zeitpläne und flexible Trockenfutterportionen gemeinsam benötigt werden. Wer keine Kamera nutzt, bekommt dieselbe Kernaufgabe mit einfacheren Modellen günstiger und datensparsamer.\"\nmanufacturer:\n  key: \"petkit\"\n  name: \"PETKIT\"\n  slug: \"petkit\"\ncategory:\n  key: \"futterautomaten\"\n  label: \"Futterautomaten\"\n  path: \"/smarte-futterautomaten/\"\nproductUrl: \"/produkt/petkit-yumshare-solo-2/\"\npublishedAt: \"2026-07-12\"\nupdatedAt: \"2026-07-25\"\nauthor:\n  name: \"PfotenTechnik Redaktion\"\n  role: \"Redaktion\"\nseo:\n  title: \"PETKIT YumShare Solo 2 im Check: Kamera und App\"\n  description: \"PETKIT YumShare Solo 2 mit 1080p-Kamera, 3-Liter-Tank, 2,4-/5-GHz-WLAN, 1–10 Mahlzeiten und den Grenzen von AI-Erkennung und Batterie-Backup.\"\n  canonical: \"/produkt/petkit-yumshare-solo-2/\"\n  sitemap: true\n  priority: 0.9\n  changefreq: \"monthly\"\nhub:\n  sections:\n    - \"produkte\"\n    - \"futterautomaten\"\ntags:\n  - \"kamera\"\n  - \"app\"\n  - \"premium\"\n  - \"trockenfutter\"\n  - \"katze\"\n  - \"kleiner-hund\"\n  - \"dual-band-wlan\"\nimages:\n  hero:\n    src: \"../../assets/images/products/petkit-yumshare-solo-2/hero.webp\"\n    alt: \"PETKIT YumShare Solo 2 mit Kamera und Edelstahl-Futternapf\"\n  thumbnail:\n    src: \"../../assets/images/products/petkit-yumshare-solo-2/thumbnail.webp\"\n    alt: \"PETKIT YumShare Solo 2 als kompakte Produktansicht\"\n  comparison:\n    src: \"../../assets/images/products/petkit-yumshare-solo-2/comparison.webp\"\n    alt: \"PETKIT YumShare Solo 2 im Kamera-Futterautomaten-Vergleich\"\n  gallery:\n    - src: \"../../assets/images/products/petkit-yumshare-solo-2/gallery-1.webp\"\n      alt: \"Kamera und Futterauslass des PETKIT YumShare Solo 2\"\n    - src: \"../../assets/images/products/petkit-yumshare-solo-2/gallery-2.webp\"\n      alt: \"Drei-Liter-Futterbehälter des PETKIT YumShare Solo 2\"\n    - src: \"../../assets/images/products/petkit-yumshare-solo-2/gallery-3.webp\"\n      alt: \"PETKIT YumShare Solo 2 an einem Katzenfutterplatz\"\naffiliate:\n  provider: \"amazon\"\n  label: \"Aktuellen Preis prüfen\"\n  url: \"https://amzn.to/4fM0YNrc\"\nrating: 4.1\nscore: 82\nratings:\n  verarbeitung: 4.15\n  bedienung: 4.2\n  app: 4.2\n  zuverlässigkeit: 4.0\n  preisleistung: 3.85\n  reinigung: 4.0\n  kamera: 4.2\ndecision:\n  bestFor:\n    - \"Katzen und kleine Hunde mit Trockenfutter\"\n    - \"Haushalte mit echtem Bedarf an Livebild und Zwei-Wege-Audio\"\n    - \"bis zu zehn geplante Mahlzeiten pro Tag\"\n    - \"Nutzer mit 2,4- oder 5-GHz-WLAN\"\n  attention:\n    - \"nur für Trockenfutter und geeignete gefriergetrocknete Stücke\"\n    - \"Kamera, Fernzugriff und AI-Funktionen benötigen Netzwerk und App\"\n    - \"Video-Wiedergabe und erweiterte Cloudfunktionen können ein Abo erfordern\"\n    - \"AI-Erkennung ist kein sicherer Nachweis der aufgenommenen Futtermenge\"\n    - \"PETKIT macht auf der aktuellen Produktseite widersprüchliche Angaben zur Art der Backup-Batterien\"\n    - \"Kamera ist im Batteriebetrieb laut Hersteller deaktiviert\"\nreview:\n  summary: \"Der YumShare Solo 2 P572 kombiniert einen 3-Liter-Trockenfuttertank mit 1080p-Kamera, Zwei-Wege-Audio, App-Steuerung und bis zu zehn geplanten Mahlzeiten.\"\n  verdict: \"Eine starke Kamera-Lösung für Haushalte, die das Livebild tatsächlich nutzen. Die Kernfunktion ist gut dokumentiert; Batterieart, kostenlose Video-Historie und AI-Zuordnung sollten wegen regionaler beziehungsweise widersprüchlicher Herstellerangaben vor dem Kauf nochmals geprüft werden.\"\nstrengths:\n  - \"1080p-Kamera mit Livebild\"\n  - \"Zwei-Wege-Audio und persönlicher Mahlzeitenruf\"\n  - \"2,4- und 5-GHz-WLAN\"\n  - \"bis zu zehn Mahlzeiten täglich\"\n  - \"3 Liter beziehungsweise zwölf Cups Kapazität\"\n  - \"Edelstahlnapf aus 304er Edelstahl\"\n  - \"Zeitpläne laufen laut Hersteller bei WLAN-Ausfall weiter\"\n  - \"Trockenfutter bis 12 mm und gefriergetrocknete Stücke bis 9 mm laut Hersteller\"\nweaknesses:\n  - \"nicht für Nassfutter\"\n  - \"Kamera und Fernfunktionen bleiben cloud- und appabhängig\"\n  - \"AI-Zuordnung ersetzt keine physische Zugangskontrolle\"\n  - \"Video-Wiedergabe kann ein Abonnement benötigen\"\n  - \"widersprüchliche Herstellerangaben zur Backup-Batterie\"\n  - \"Kamera im Batteriebetrieb deaktiviert\"\nexperience:\n  summary: \"Die redaktionelle Einordnung trennt die mechanische Futterausgabe von Kamera- und Cloudfunktionen. Ein Livebild kann Aktivität am Napf zeigen, beweist aber nicht, wie viel welches Tier tatsächlich gefressen hat.\"\n  methodology: \"Datencheck anhand der aktuellen offiziellen PETKIT-Produktseite, PETKIT-Feederübersicht und des offiziellen Manual-Downloadbereichs; kein eigener Langzeit-, Kamera-, AI- oder Portionierungstest.\"\n  maintenance: \"Edelstahlnapf regelmäßig reinigen, Behälter trocken halten und Futterweg auf Krümel beziehungsweise Fettbelag prüfen. Nach jedem Futterwechsel mehrere Portionen nachwiegen.\"\nalternatives:\n  - \"petlibro-granary-camera-feeder\"\n  - \"petkit-yumshare-dual-hopper\"\n  - \"catit-pixi-vision-smart-feeder\"\ncomparisons:\n  - \"beste-futterautomaten-mit-kamera\"\n  - \"beste-futterautomaten-fuer-katzen\"\n  - \"beste-futterautomaten-fuer-hunde\"\ncomparisonFilters:\n  animal: [\"dog\", \"cat\"]\n  petSize: [\"small\"]\n  foodType: [\"dry\"]\n  app: true\n  camera: true\n  backupPower: true\n  access: \"open\"\n  priceTier: \"premium\"\npriceCategory: \"premium\"\nuseCase: \"Trockenfutter-Zeitpläne mit zusätzlicher Video- und Audiokontrolle\"\ncapacity: \"3 Liter beziehungsweise 12 Cups\"\nexpandable: \"Optionale PETKIT-Cloud- und Videoangebote abhängig von Region und Tarif\"\nfeatures:\n  - \"1080p-HD-Kamera\"\n  - \"Zwei-Wege-Audio\"\n  - \"AI-gestützte Ereigniserfassung\"\n  - \"2,4- und 5-GHz-WLAN\"\n  - \"bis zu zehn Mahlzeiten pro Tag\"\n  - \"Edelstahlnapf\"\nspecs:\n  - label: \"Modell\"\n    value: \"P572\"\n  - label: \"Futterart\"\n    value: \"Trockenfutter; Kroketten bis 12 mm und gefriergetrocknete Stücke bis 9 mm laut Hersteller\"\n  - label: \"Kapazität\"\n    value: \"3 Liter beziehungsweise 12 Cups\"\n  - label: \"Mahlzeiten\"\n    value: \"1 bis 10 geplante Mahlzeiten pro Tag\"\n  - label: \"Portionen\"\n    value: \"1 bis 5 Portionen pro Mahlzeit; Herstellerdarstellung ungefähr 10 bis 50 g\"\n  - label: \"Kamera\"\n    value: \"1080p-HD-Kamera mit Ereigniserfassung\"\n  - label: \"Audio\"\n    value: \"Zwei-Wege-Audio und persönlicher Mahlzeitenruf\"\n  - label: \"App\"\n    value: \"PETKIT-App\"\n  - label: \"WLAN\"\n    value: \"2,4 und 5 GHz\"\n  - label: \"Offline-Verhalten\"\n    value: \"Gespeicherte Mahlzeiten laufen laut Hersteller bei WLAN-Ausfall weiter\"\n  - label: \"Stromversorgung\"\n    value: \"6-V-Netzteil; Backup-Stromversorgung vorhanden\"\n  - label: \"Batterie-Backup\"\n    value: \"Hersteller wirbt mit bis zu 14 Tagen; Batterieart ist auf der aktuellen Produktseite widersprüchlich dokumentiert\"\n  - label: \"Batteriemodus\"\n    value: \"Kamera laut Hersteller deaktiviert\"\n  - label: \"Napf\"\n    value: \"Edelstahl 304\"\n  - label: \"Material\"\n    value: \"ABS, Edelstahl 304 und Silikon\"\n  - label: \"Abmessungen\"\n    value: \"186 × 300 × 383 mm laut aktueller PETKIT-Vergleichstabelle\"\n  - label: \"Gewicht\"\n    value: \"offizielle PETKIT-Seiten nennen rund 1,7 bis 1,8 kg\"\n  - label: \"Geeignet für\"\n    value: \"Katzen und kleine Hunde\"\nfaq:\n  - question: \"Ist der PETKIT YumShare Solo 2 ein eigener Produkttest?\"\n    answer: \"Nein. Die Seite ist eine redaktionelle Einordnung offizieller Produktdaten und behauptet keinen eigenen Langzeit- oder Kameratest.\"\n  - question: \"Ist der YumShare Solo 2 für Nassfutter geeignet?\"\n    answer: \"Nein. Das Gerät ist für Trockenfutter und laut Hersteller für passende gefriergetrocknete Stücke ausgelegt.\"\n  - question: \"Welche Krokettengröße passt?\"\n    answer: \"PETKIT nennt bis zu 12 mm für Trockenfutter und bis zu 9 mm für gefriergetrocknete Stücke.\"\n  - question: \"Wie viele Mahlzeiten lassen sich planen?\"\n    answer: \"Laut aktueller Produktseite sind bis zu zehn Mahlzeiten pro Tag möglich.\"\n  - question: \"Unterstützt der YumShare Solo 2 5-GHz-WLAN?\"\n    answer: \"Ja. PETKIT nennt 2,4- und 5-GHz-WLAN.\"\n  - question: \"Läuft der Zeitplan ohne WLAN weiter?\"\n    answer: \"PETKIT gibt an, dass gespeicherte Mahlzeiten bei einem WLAN-Ausfall weiterlaufen. Livebild und Fernfunktionen stehen dann nicht zur Verfügung.\"\n  - question: \"Funktioniert die Kamera im Batteriebetrieb?\"\n    answer: \"Nein. PETKIT weist darauf hin, dass die Kamera im Backup-Betrieb deaktiviert ist.\"\n  - question: \"Welche Batterien benötigt der YumShare Solo 2?\"\n    answer: \"Die aktuelle PETKIT-Produktseite enthält widersprüchliche Angaben zur Batterieart. Deshalb sollte vor dem Kauf die regionale Anleitung für das Modell P572 geprüft werden.\"\n  - question: \"Erkennt die Kamera sicher, welches Tier gefressen hat?\"\n    answer: \"Nein. AI-Erkennung kann Ereignisse und Tiere einordnen, ersetzt aber weder Mikrochip-Zugang noch eine sichere Messung der aufgenommenen Menge.\"\n  - question: \"Braucht man ein Video-Abo?\"\n    answer: \"Livebild und Grundfunktionen sind vom jeweiligen App-Angebot zu trennen. PETKIT weist darauf hin, dass Video-Wiedergabe beziehungsweise erweiterte Historien ein Abonnement benötigen können.\"\ncomparisonData:\n  version: 1\n  general:\n    animal:\n      - \"dog\"\n      - \"cat\"\n    petSize:\n      - \"small\"\n    foodType:\n      - \"dry\"\n  editorial:\n    rating: 4.1\n    score: 82\n    productStatus: \"active\"\n  custom:\n    modell: \"P572\"\n    kamera: \"1080p-HD\"\n    kapazitaet: \"3 Liter\"\n    mahlzeiten: \"1 bis 10 täglich\"\n    wlan: \"2,4 und 5 GHz\"\n    offline: \"gespeicherte Pläne laufen laut Hersteller weiter\"\n    stromreserve: \"vorhanden; Batterieart auf aktueller Herstellerseite widersprüchlich\"\n    wichtigstegrenze: \"Kamera und AI liefern keinen sicheren Fressnachweis\"\n---\n\nDer **PETKIT YumShare Solo 2** ist ein Trockenfutterautomat mit Kamera. Er kombiniert einen 3-Liter-Vorrat, bis zu zehn geplante Mahlzeiten und Livebild in der PETKIT-App.\n\n## Kurzurteil\n\nDer Solo 2 passt vor allem, wenn du regelmäßig prüfen möchtest, ob dein Tier am Futterplatz erscheint. Für reine Zeitpläne ist ein Modell ohne Kamera meist günstiger, einfacher und datensparsamer.\n\n## Futter und Portionierung\n\nPETKIT nennt Trockenfutter bis 12 mm und gefriergetrocknete Stücke bis 9 mm. Eine Portion ist keine verlässliche Grammkonstante. Form, Dichte und Bruchanteil des Futters verändern die reale Ausgabe.\n\nFür die Einrichtung sollten mindestens zehn Ausgaben aufgefangen, gemeinsam gewogen und anschließend auf eine durchschnittliche Portion umgerechnet werden.\n\n## Was die Kamera leistet\n\nDie 1080p-Kamera bietet Livebild, Ereigniserfassung und Zwei-Wege-Audio. Sie kann zeigen, dass ein Tier am Futterplatz war. Sie beweist jedoch nicht:\n\n- welche Grammmenge tatsächlich aufgenommen wurde,\n- ob ein anderes Tier später gefressen hat,\n- ob das Tier erbrochen hat,\n- ob eine gesundheitliche Ursache hinter verändertem Fressverhalten steckt.\n\n## WLAN, Offline-Zeitplan und Batterie\n\nDer Solo 2 unterstützt laut PETKIT 2,4- und 5-GHz-WLAN. Gespeicherte Mahlzeiten sollen bei einem WLAN-Ausfall weiterlaufen.\n\nZur Backup-Stromversorgung macht die aktuelle Produktseite widersprüchliche Angaben. Gleichzeitig wirbt PETKIT mit bis zu 14 Tagen Backup und weist darauf hin, dass die Kamera im Batteriebetrieb deaktiviert ist. Die regionale Anleitung für Modell P572 sollte deshalb vor dem Kauf geprüft werden.\n\n## Solo 2 oder Dual-Hopper 2?\n\nDer Solo 2 besitzt einen Futterbehälter. Der [PETKIT YumShare Dual-Hopper](/produkt/petkit-yumshare-dual-hopper/) trennt zwei Vorräte, schützt die ausgegebene Portion aber ebenfalls nicht vor einem anderen Tier.\n\nDer [Vergleich der Kamera-Futterautomaten](/vergleiche/beste-futterautomaten-mit-kamera/) stellt den Solo 2 weiteren Kamera-Konzepten gegenüber.\n\n## Methodik und Quellen\n\nDiese Seite ist ein Datencheck und kein eigener Langzeittest.\n\n- [PETKIT: YumShare Solo 2 mit Kamera](https://www.petkit.com/products/yumshare-solo-2-automatic-feeder-with-camera)\n- [PETKIT: Übersicht automatischer Futterautomaten](https://www.petkit.com/collections/automatic-pet-feeder)\n- [PETKIT: Offizielle Manual-Downloads](https://www.petkit.com/pages/manual-downloads)\n\n## Fazit\n\nDer PETKIT YumShare Solo 2 ist ein gut ausgestatteter Kamera-Futterautomat für Trockenfutter. Dual-Band-WLAN, flexible Zeitpläne und der Edelstahl-Napf sind klare Vorteile. Die wichtigsten Grenzen sind die fehlende Zugangskontrolle, mögliche Abo-Funktionen und widersprüchliche Herstellerangaben zur Backup-Batterie.\n");

const auditSource = `#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, "../..");
const contentRoot = path.join(app, "src", "content");
const checks = [];

const normalize = (value) => String(value).replace(/^\\uFEFF/, "").replace(/\\r\\n?/g, "\\n");
const read = (file) => normalize(fs.readFileSync(file, "utf8"));
const check = (name, ok, detail = "") => checks.push({ name, ok, detail });

function walk(directory) {
  const result = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...walk(full));
    else if (/\\.(?:md|mdx)$/i.test(entry.name) && !/\\.bak(?:\\.|$)/i.test(entry.name)) result.push(full);
  }
  return result;
}

const productionFiles = walk(contentRoot);
const corpus = productionFiles
  .map((file) => ({ file, text: read(file) }));

function inbound(target, ownSuffix = "") {
  return corpus.filter(({ file, text }) =>
    (!ownSuffix || !file.replaceAll("\\\\", "/").endsWith(ownSuffix)) &&
    text.includes(target)
  );
}

const redirectsFile = path.join(app, "public", "_redirects");
const redirects = read(redirectsFile);
for (const [source, target] of ${JSON.stringify(redirects)}) {
  check(\`Redirect \${source}\`, redirects.includes(\`\${source} \${target} 301\`));
}

check(
  "Legacy Offline-Seite entfernt",
  !fs.existsSync(path.join(contentRoot, "pages", "beste-futterautomaten-ohne-wlan.md"))
);
check(
  "Legacy Kamera-Seite entfernt",
  !fs.existsSync(path.join(contentRoot, "pages", "beste-futterautomaten-mit-kamera.md"))
);

const oldOffline = corpus.filter(({ text }) =>
  /(?<!\\/vergleiche)\\/beste-futterautomaten-ohne-wlan\\/?/.test(text)
);
const oldCamera = corpus.filter(({ text }) =>
  /(?<!\\/vergleiche)\\/beste-futterautomaten-mit-kamera\\/?/.test(text)
);
check("Keine produktiven Offline-Altlinks", oldOffline.length === 0, String(oldOffline.length));
check("Keine produktiven Kamera-Altlinks", oldCamera.length === 0, String(oldCamera.length));

const targets = [
  ["/vergleiche/beste-futterautomaten-ohne-wlan/", 3, "Offline-Comparison"],
  ["/vergleiche/beste-futterautomaten-mit-kamera/", 3, "Kamera-Comparison"],
  ["/vergleiche/beste-futterautomaten-fuer-zwei-katzen/", 2, "Zwei-Katzen-Comparison"],
  ["/produkt/petlibro-polar-wet-food-feeder/", 2, "PETLIBRO Polar"],
  ["/produkt/petkit-yumshare-solo-2/", 2, "YumShare Solo 2"],
  ["/vergleiche/beste-trinkbrunnen-fuer-hunde/", 4, "Hunde-Trinkbrunnen"]
];

for (const [target, minimum, label] of targets) {
  const sources = inbound(target, target.includes("/produkt/")
    ? \`products/\${target.split("/").filter(Boolean).at(-1)}.md\`
    : "");
  check(\`Inbound \${label}\`, sources.length >= minimum, \`\${sources.length}/\${minimum}\`);
}

const yumshareFile = path.join(contentRoot, "products", "petkit-yumshare-solo-2.md");
const yumshare = read(yumshareFile);
check("YumShare kein Test-Claim", !/seo:\\n[\\s\\S]*?title:\\s*["']?[^\\n]*\\bTest\\b/i.test(yumshare));
check("YumShare aktiv", yumshare.includes('productStatus: "active"'));
check("YumShare Dual-Band", yumshare.includes("2,4 und 5 GHz"));
check("YumShare Maße", yumshare.includes("186 × 300 × 383 mm"));
check("YumShare Datenlücke transparent", yumshare.includes("widersprüchlich"));

const failed = checks.filter((entry) => !entry.ok);
for (const entry of checks) {
  console.log(\`\${entry.ok ? "OK" : "FEHLER"}  \${entry.name}\${entry.detail ? \` (\${entry.detail})\` : ""}\`);
}
if (failed.length) {
  console.error(\`\\n\${failed.length} Prüfung(en) fehlgeschlagen.\`);
  process.exit(1);
}
console.log("\\nWoche-3-Authority-Audit erfolgreich.");
`;

stage(files.audit, auditSource);

console.log(`[${PATCH}] Repository: ${root}`);
console.log(`[${PATCH}] Ändern/erstellen: ${changed.size}`);
console.log(`[${PATCH}] Entfernen: ${deleted.size}`);

if (CHECK) {
  for (const file of changed.keys()) console.log(`ÄNDERN: ${rel(file)}`);
  for (const file of deleted.keys()) console.log(`ENTFERNEN: ${rel(file)}`);
  console.log(`[${PATCH}] Vorprüfung erfolgreich. Es wurde nichts verändert.`);
  process.exit(0);
}

const backupRoot = path.join(
  root,
  ".patch-backups",
  `${PATCH}-${new Date().toISOString().replaceAll(":", "-")}`
);

function backupFile(file, content) {
  const target = path.join(backupRoot, rel(file));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, "utf8");
}

try {
  for (const [file, state] of changed) {
    if (state.old !== null) backupFile(file, state.old);
  }
  for (const [file, old] of deleted) backupFile(file, old);

  for (const [file, state] of changed) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, state.next, "utf8");
    console.log(`GEÄNDERT: ${rel(file)}`);
  }
  for (const file of deleted.keys()) {
    fs.unlinkSync(file);
    console.log(`ENTFERNT: ${rel(file)}`);
  }

  const auditUrl = pathToFileURL(files.audit).href;
  await import(`${auditUrl}?t=${Date.now()}`);

  console.log(`[${PATCH}] Erfolgreich angewendet.`);
  console.log(`[${PATCH}] Backup: ${backupRoot}`);
  console.log("Nächster Schritt: npm run build:pfotentechnik");
} catch (error) {
  console.error(`[${PATCH}] Fehler: ${error.message}`);
  for (const [file, state] of changed) {
    if (state.old === null) {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    } else {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, state.old, "utf8");
    }
  }
  for (const [file, old] of deleted) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, old, "utf8");
  }
  console.error(`[${PATCH}] Alle Änderungen wurden zurückgesetzt.`);
  process.exit(1);
}

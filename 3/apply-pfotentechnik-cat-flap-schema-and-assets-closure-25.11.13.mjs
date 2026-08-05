#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-cat-flap-schema-and-assets-closure-25.11.13";

function log(message) {
  console.log(`[${PATCH}] ${message}`);
}

function findRoot(start) {
  let current = path.resolve(start);
  for (let depth = 0; depth < 16; depth += 1) {
    if (fs.existsSync(path.join(current, "apps", "pfotentechnik", "package.json"))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}

function hasConflictMarkers(source) {
  return /^(<<<<<<<|=======|>>>>>>>)(?: .*)?$/m.test(source);
}

function splitMarkdown(source, label) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  if (lines[0]?.trim() !== "---") {
    throw new Error(`${label}: Frontmatter-Start fehlt.`);
  }
  const end = lines.findIndex((line, index) => index > 0 && line.trim() === "---");
  if (end < 0) throw new Error(`${label}: Frontmatter-Ende fehlt.`);
  return { frontmatter: lines.slice(1, end), body: lines.slice(end + 1) };
}

function keyOf(line) {
  if (!line || /^\s/.test(line)) return null;
  const match = line.match(/^([A-Za-z][A-Za-z0-9_-]*):(?:\s|$)/);
  return match?.[1] ?? null;
}

function rangeOf(lines, key) {
  const start = lines.findIndex((line) => keyOf(line) === key);
  if (start < 0) return null;
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (keyOf(lines[index])) {
      end = index;
      break;
    }
  }
  return { start, end };
}

function setScalar(lines, key, value, beforeKey = null) {
  const range = rangeOf(lines, key);
  if (range) {
    return [...lines.slice(0, range.start), `${key}: ${value}`, ...lines.slice(range.end)];
  }
  if (beforeKey) {
    const before = rangeOf(lines, beforeKey);
    if (before) {
      return [...lines.slice(0, before.start), `${key}: ${value}`, ...lines.slice(before.start)];
    }
  }
  return [...lines, `${key}: ${value}`];
}

function serialize(frontmatter, body) {
  const clean = [...body];
  while (clean.length && clean.at(-1) === "") clean.pop();
  return ["---", ...frontmatter, "---", ...clean, ""].join("\n");
}

function resolveContentAsset(markdownFile, sourcePath) {
  return path.resolve(path.dirname(markdownFile), sourcePath);
}

function replaceMissingImageSources(source, markdownFile, fallbackSource) {
  const imageSourcePattern = /src:\s*"([^"]+)"/g;
  const missing = new Set();

  for (const match of source.matchAll(imageSourcePattern)) {
    const sourcePath = match[1];
    if (/^(?:https?:|data:|\/)/.test(sourcePath)) continue;

    const absolute = resolveContentAsset(markdownFile, sourcePath);
    if (!fs.existsSync(absolute)) missing.add(sourcePath);
  }

  let next = source;
  for (const sourcePath of missing) {
    next = next.split(`src: "${sourcePath}"`).join(`src: "${fallbackSource}"`);
  }

  return { source: next, missing: [...missing] };
}

function writeIfChanged(file, content) {
  const normalized = content.replace(/\r\n/g, "\n").replace(/\s+$/u, "") + "\n";
  const current = fs.existsSync(file)
    ? fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n")
    : null;
  if (current === normalized) {
    log(`Bereits aktuell: ${path.relative(ROOT, file)}`);
    return false;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, normalized, "utf8");
  log(`Geändert: ${path.relative(ROOT, file)}`);
  return true;
}

function run(command, args, label, cwd = ROOT) {
  log(`Prüfe: ${label}`);
  const executable =
    process.platform === "win32" && command === "npm" ? "npm.cmd" : command;
  const result = spawnSync(executable, args, {
    cwd,
    stdio: "inherit",
    shell: false,
    env: process.env,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${label} fehlgeschlagen (Exit ${result.status}).`);
  }
  log(`BESTANDEN: ${label}`);
}

const ROOT = findRoot(process.cwd());
const APP = path.join(ROOT, "apps", "pfotentechnik");
const FILES = {
  connect: path.join(APP, "src/content/products/sureflap-mikrochip-katzenklappe-connect.md"),
  standard: path.join(APP, "src/content/products/sureflap-mikrochip-katzenklappe.md"),
  dualscan: path.join(APP, "src/content/products/sureflap-dualscan-mikrochip-katzenklappe.md"),
  petporte: path.join(APP, "src/content/products/petsafe-petporte-smart-flap.md"),
  petsafeMicrochip: path.join(APP, "src/content/products/petsafe-mikrochip-katzenklappe.md"),
  fallbackImage: path.join(APP, "src/assets/images/cat-flaps/microchip-comparison.svg"),
  package: path.join(APP, "package.json"),
  test: path.join(APP, "test/cat-flap-schema-and-assets-closure-25.11.13.test.mjs"),
};

const CONNECT_CONTENT = "---\ntitle: \"SureFlap Mikrochip Katzenklappe Connect\"\nslug: \"sureflap-mikrochip-katzenklappe-connect\"\ntype: \"product\"\nlayout: \"product\"\n\ndescription: \"App-fähige Mikrochip-Katzenklappe mit individuellen Ein- und Ausgangsrechten, Aktivitätsprotokollen und Fernfunktionen über den Sure Petcare Hub.\"\nrecommendation: \"Geeignet für Mehrkatzenhaushalte, die individuelle Ein- und Ausgangsrechte sowie App-Funktionen benötigen. Für rein lokalen Betrieb ohne Hub sind Standard oder DualScan einfacher.\"\n\nmanufacturer:\n  key: \"surefeed\"\n  name: \"Sure Petcare\"\n  slug: \"surefeed\"\n\ncategory:\n  key: \"katzenklappen\"\n  label: \"Katzenklappen\"\n  path: \"/katzenklappen/\"\n\npublishedAt: \"2026-08-04\"\nupdatedAt: \"2026-08-05\"\n\nauthor:\n  name: \"PfotenTechnik Redaktion\"\n  role: \"Redaktion\"\n\ntags:\n  - \"Katzenklappe\"\n  - \"Mikrochip\"\n  - \"App\"\n  - \"Hub\"\n  - \"individuelle Ausgangsrechte\"\n\nseo:\n  title: \"SureFlap Connect Katzenklappe: Hub, App & Grenzen\"\n  description: \"SureFlap Connect im Datencheck: Mikrochipzugang, individuelle Rechte, App, Hub-Abhängigkeit, Maße, Batteriebetrieb und Einbau.\"\n  canonical: \"/produkt/sureflap-mikrochip-katzenklappe-connect/\"\n  sitemap: true\n  noindex: false\n  priority: 0.8\n  changefreq: \"monthly\"\n\nimages:\n  hero:\n    src: \"../../assets/images/cat-flaps/microchip-comparison.svg\"\n    alt: \"Redaktionelle Darstellung der SureFlap Mikrochip Katzenklappe Connect\"\n  thumbnail:\n    src: \"../../assets/images/cat-flaps/microchip-comparison.svg\"\n    alt: \"SureFlap Mikrochip Katzenklappe Connect\"\n  comparison:\n    src: \"../../assets/images/cat-flaps/microchip-comparison.svg\"\n    alt: \"SureFlap Connect im Vergleich der Mikrochip-Katzenklappen\"\n  gallery: []\n\nprice:\n  current: null\n  currency: \"EUR\"\n  status: \"unknown\"\n  checkedAt: \"2026-08-05\"\n  source:\n    id: \"surepetcare-de-connect\"\n    label: \"Sure Petcare Deutschland\"\n    type: \"merchant\"\n    url: \"https://www.surepetcare.com/de-de/haustierklappen/mikrochip-katzenklappe-connect\"\n\npriceState: \"unknown\"\npriceAvailable: false\naffiliateAvailable: false\n\navailability: \"unknown\"\navailabilityReason: \"Preis, Hub-Bundle und Lieferbarkeit müssen unmittelbar vor dem Kauf im deutschen Hersteller-Shop geprüft werden.\"\navailabilityUpdated: \"2026-08-05\"\n\nproductStatus: \"active\"\neditorialStatus: \"complete\"\nrecommendationStatus: \"limited\"\nmaintenanceStatus: \"recommended\"\n\ntestStatus: \"manufacturer-data\"\nrating: 0\n\neditorial:\n  assessmentType: \"data-review\"\n  evidence:\n    - \"manufacturer-documentation\"\n    - \"technical-specifications\"\n    - \"comparative-analysis\"\n  testedHandsOn: false\n  lastVerifiedAt: \"2026-08-05\"\n  note: \"Bewertung auf Basis von Herstellerunterlagen und Vergleichsdaten; keine eigene Nutzungserfahrung.\"\n\ndecision:\n  bestFor:\n    - \"Mehrkatzenhaushalte mit individuellen Ein- und Ausgangsrechten\"\n    - \"App-Benachrichtigungen und Aktivitätsprotokolle\"\n    - \"Fernverriegelung und zeitgesteuerte Sperren\"\n    - \"Haushalte mit vorhandenem Sure Petcare Hub oder passendem Bundle\"\n  attention:\n    - \"App-Funktionen benötigen den Sure Petcare Hub\"\n    - \"Gerät, Hub und Bundle vor dem Kauf eindeutig unterscheiden\"\n    - \"Durchgang von 142 × 120 mm vor dem Kauf prüfen\"\n    - \"Vier AA-Batterien sind erforderlich\"\n    - \"Cloud- und Netzwerkfunktionen ergänzen, ersetzen aber nicht die lokale Klappenfunktion\"\n\nreview:\n  summary: \"Die Connect-Version verbindet die lokale Mikrochip-Erkennung mit individuellen Richtungsrechten und App-Funktionen. Der zentrale Unterschied zu DualScan ist die Hub- und App-Anbindung.\"\n  verdict: \"Sinnvoll, wenn Fernfunktionen und Aktivitätsdaten tatsächlich genutzt werden. Für rein lokale Zutrittsregeln ist DualScan meist einfacher und weniger systemabhängig.\"\n\nstrengths:\n  - \"Individuelle Ein- und Ausgangsrechte je Tier\"\n  - \"App-Benachrichtigungen und Aktivitätsprotokolle\"\n  - \"Fernverriegelung und zeitgesteuerte Sperren\"\n  - \"Lokale Mikrochip-Erkennung bleibt an der Klappe\"\n  - \"Für Mehrkatzenhaushalte geeignet\"\n\nweaknesses:\n  - \"App-Funktionen benötigen einen Sure Petcare Hub\"\n  - \"Höhere System- und Gesamtkosten als bei lokalen Modellen\"\n  - \"Vier AA-Batterien erforderlich\"\n  - \"Netzwerk- und Cloudfunktionen schaffen zusätzliche Abhängigkeiten\"\n  - \"Durchgang kann für große Katzen zu knapp sein\"\n\nexperience:\n  summary: \"Datenreview der lokalen Mikrochip-Funktion, Hub-Abhängigkeit, App-Funktionen, Maße und Einbaugrenzen.\"\n  methodology: \"Offizielle Herstellerangaben und Vergleichsdaten, geprüft am 05.08.2026.\"\n  maintenance: \"Sensorbereich und Klappe sauber halten, Batteriestand prüfen und Hub-Verbindung nach Router- oder Netzwerkänderungen kontrollieren.\"\n\nalternatives:\n  - \"sureflap-mikrochip-katzenklappe\"\n  - \"sureflap-dualscan-mikrochip-katzenklappe\"\n  - \"petsafe-petporte-smart-flap\"\n\ncomparisons:\n  - \"beste-mikrochip-katzenklappen\"\n\ncomparisonFilters:\n  animal:\n    - \"cat\"\n  petSize:\n    - \"small\"\n  foodType: []\n  app: true\n  access: \"microchip\"\n  priceTier: \"premium\"\n\nfeatures:\n  - \"Mikrochip-Zugang\"\n  - \"Individuelle Ein- und Ausgangsrechte\"\n  - \"App-Steuerung\"\n  - \"Aktivitätsprotokolle\"\n  - \"Fernverriegelung\"\n  - \"Zeitgesteuerte Sperren\"\n  - \"Hub-Anbindung\"\n  - \"Batteriebetrieb\"\n\nuseCase: \"Vernetzte Zutrittssteuerung mit App\"\n\nspecs:\n  - label: \"Klappenöffnung\"\n    value: \"142 × 120 mm\"\n  - label: \"Tür-/Wandausschnitt\"\n    value: \"165 × 171 mm\"\n  - label: \"Glasausschnitt\"\n    value: \"212 mm\"\n  - label: \"Stromversorgung\"\n    value: \"4 AA-Batterien\"\n  - label: \"Batterielaufzeit\"\n    value: \"Bis zu 6 Monate laut Hersteller\"\n  - label: \"Zugangssteuerung\"\n    value: \"Individuelle Ein- und Ausgangsrechte\"\n  - label: \"App\"\n    value: \"Sure Petcare App\"\n  - label: \"Hub\"\n    value: \"Für App-Funktionen erforderlich\"\n  - label: \"Einbau\"\n    value: \"Tür, Glas und Wand mit passendem Zubehör\"\n\ndecisionFacts:\n  - label: \"Lokale Funktion\"\n    value: \"Mikrochip-Erkennung an der Klappe\"\n    consequence: \"Die grundlegende Zutrittsprüfung findet lokal statt.\"\n  - label: \"App-Abhängigkeit\"\n    value: \"Hub erforderlich\"\n    consequence: \"Benachrichtigungen, Fernfunktionen und Aktivitätsdaten benötigen Hub, Netzwerk und Internetverbindung.\"\n  - label: \"Produktumfang\"\n    value: \"Gerät, Hub oder Bundle unterscheiden\"\n    consequence: \"Vor dem Kauf muss geprüft werden, ob der Hub enthalten, separat vorhanden oder zusätzlich erforderlich ist.\"\n  - label: \"Richtungsrechte\"\n    value: \"Individuell je Tier\"\n    consequence: \"Einzelne Katzen können unterschiedliche Ein- und Ausgangsrechte erhalten.\"\n  - label: \"Durchgang\"\n    value: \"142 × 120 mm\"\n    consequence: \"Der engste Durchgangspunkt sollte mit dem Körperbau der Katze abgeglichen werden.\"\n  - label: \"Bewertungsstatus\"\n    value: \"Herstellerdaten\"\n    consequence: \"Es liegt kein eigener Praxistest vor; Langzeitzuverlässigkeit wird nicht als eigene Erfahrung bewertet.\"\n\ncomparisonData:\n  version: 1\n  custom:\n    zugang: \"Mikrochip oder kompatibler RFID-Anhänger\"\n    richtungsrechte: \"Individuelle Ein- und Ausgangsrechte\"\n    app: \"Ja, über Sure Petcare Hub\"\n    strom: \"4 AA-Batterien\"\n    einbau: \"Tür, Glas und Wand mit passendem Zubehör\"\n    durchgang: \"142 × 120 mm\"\n    produktrolle: \"Vernetzte Mikrochip-Katzenklappe\"\n\nfaq:\n  - question: \"Braucht die SureFlap Connect Katzenklappe einen Hub?\"\n    answer: \"Ja, für App-Funktionen, Benachrichtigungen, Aktivitätsdaten und Fernsteuerung wird der Sure Petcare Hub benötigt.\"\n  - question: \"Funktioniert die Mikrochip-Erkennung ohne Internet?\"\n    answer: \"Die grundlegende Mikrochip-Erkennung arbeitet lokal an der Klappe. Vernetzte Funktionen benötigen Hub und Internet.\"\n  - question: \"Was unterscheidet Connect von DualScan?\"\n    answer: \"DualScan bietet individuelle Richtungsrechte ohne App. Connect ergänzt Hub, App, Aktivitätsdaten und Fernfunktionen.\"\n  - question: \"Wie groß ist der Durchgang?\"\n    answer: \"Der engste Durchgangspunkt misst 142 × 120 mm.\"\n  - question: \"Sind Hub und Katzenklappe immer gemeinsam erhältlich?\"\n    answer: \"Nein. Gerät, Hub und Bundle müssen beim konkreten Angebot geprüft werden.\"\n  - question: \"Wurde die Klappe selbst getestet?\"\n    answer: \"Nein. Die Einordnung basiert auf Herstellerunterlagen und technischen Vergleichsdaten.\"\n\nevidenceSources:\n  - source: \"Sure Petcare Deutschland – Mikrochip Katzenklappe Connect\"\n    url: \"https://www.surepetcare.com/de-de/haustierklappen/mikrochip-katzenklappe-connect\"\n    accessedAt: \"2026-08-05\"\n    assertion: \"Mikrochipzugang, App- und Hub-Abhängigkeit, individuelle Rechte, Maße, Batteriebetrieb und Einbau.\"\n    fields:\n      - \"decision\"\n      - \"review\"\n      - \"specs\"\n      - \"decisionFacts\"\n      - \"faq\"\n---\n\n## Kurz eingeordnet\n\nDie SureFlap Mikrochip Katzenklappe Connect verbindet lokale Mikrochip-Erkennung mit individuellen Ein- und Ausgangsrechten sowie App-Funktionen. Für Benachrichtigungen, Aktivitätsdaten und Fernsteuerung ist der Sure Petcare Hub erforderlich.\n\n## Standard, DualScan oder Connect?\n\nDie Standardversion steuert vor allem den Eintritt und hält fremde Tiere draußen. DualScan ergänzt individuelle Ausgangsrechte ohne App. Connect richtet sich an Haushalte, die zusätzlich Fernfunktionen und Aktivitätsdaten nutzen möchten.\n\n## Vor dem Kauf prüfen\n\nEntscheidend ist, ob das konkrete Angebot nur die Klappe, nur den Hub oder ein Bundle enthält. Außerdem sollte der Durchgang von 142 × 120 mm mit dem Körperbau der Katze abgeglichen werden.\n\nDie drei Produktklassen ordnet der [Vergleich der Mikrochip-Katzenklappen](/vergleiche/beste-mikrochip-katzenklappen/) ein.\n";

const DUALSCAN_CONTENT = "---\ntitle: \"SureFlap DualScan Mikrochip Katzenklappe\"\nslug: \"sureflap-dualscan-mikrochip-katzenklappe\"\ntype: \"product\"\nlayout: \"product\"\ndescription: \"Lokale Mikrochip-Katzenklappe mit individuellen Ausgangsrechten für bis zu 32 Tiere. Ohne App oder Hub, mit 142 × 120 mm Durchgang und Batteriebetrieb.\"\nrecommendation: \"Passend für Mehrkatzenhaushalte, wenn einzelne Tiere hinausdürfen und andere im Haus bleiben sollen. Für App-Steuerung und Aktivitätsdaten ist die Connect-Version geeigneter.\"\nmanufacturer:\n  key: \"surefeed\"\n  name: \"Sure Petcare\"\n  slug: \"surefeed\"\ncategory:\n  key: \"katzenklappen\"\n  label: \"Katzenklappen\"\n  path: \"/katzenklappen/\"\npublishedAt: \"2026-08-04\"\nupdatedAt: \"2026-08-05\"\ntestStatus: \"manufacturer-data\"\nproductStatus: \"active\"\neditorialStatus: \"complete\"\nrecommendationStatus: \"limited\"\nmaintenanceStatus: \"recommended\"\nrating: 0\nprice:\n  current: null\n  currency: \"EUR\"\n  status: \"unknown\"\n  checkedAt: \"2026-08-05\"\n  source:\n    id: \"surepetcare-de-dualscan\"\n    label: \"Sure Petcare Deutschland\"\n    type: \"merchant\"\n    url: \"https://www.surepetcare.com/de-de/haustierklappen/dualscan-mikrochip-katzenklappe\"\npriceState: \"unknown\"\npriceAvailable: false\naffiliateAvailable: false\navailability: \"temporarily-unavailable\"\navailabilityReason: \"Im deutschen Hersteller-Shop gelistet, bei der Prüfung am 05.08.2026 jedoch als nicht vorrätig markiert.\"\navailabilityUpdated: \"2026-08-05\"\nimages:\n  hero:\n    src: \"../../assets/images/cat-flaps/microchip-comparison.svg\"\n    alt: \"Redaktionelle Darstellung der SureFlap DualScan Mikrochip Katzenklappe\"\n  thumbnail:\n    src: \"../../assets/images/cat-flaps/microchip-comparison.svg\"\n    alt: \"SureFlap DualScan Mikrochip Katzenklappe\"\n  comparison:\n    src: \"../../assets/images/cat-flaps/microchip-comparison.svg\"\n    alt: \"SureFlap DualScan im Vergleich der Mikrochip-Katzenklappen\"\n  gallery: []\ndecision:\n  bestFor:\n    - \"Mehrkatzenhaushalte mit unterschiedlichen Ausgangsrechten\"\n    - \"Lokaler Betrieb ohne WLAN, App oder Hub\"\n    - \"Bis zu 32 gespeicherte Tiere oder Mikrochipnummern\"\n  attention:\n    - \"Durchgang von 142 × 120 mm vor dem Kauf prüfen\"\n    - \"Vier AA-Batterien sind erforderlich und nicht enthalten\"\n    - \"Keine App, Fernsteuerung oder Aktivitätsprotokolle\"\n    - \"Zum Prüfzeitpunkt nicht vorrätig\"\nreview:\n  summary: \"DualScan ergänzt den lokalen Mikrochip-Zugang um individuelle Ausgangsrechte. Damit lässt sich pro Tier festlegen, wer das Haus verlassen darf.\"\n  verdict: \"Eine klare Speziallösung für Mehrkatzenhaushalte mit unterschiedlichen Ausgangsregeln. Weniger passend, wenn App-Steuerung oder Aktivitätsdaten erwartet werden.\"\nstrengths:\n  - \"Individuelle Ausgangsrechte je Tier\"\n  - \"Bis zu 32 Tiere beziehungsweise Mikrochipnummern speicherbar\"\n  - \"Kein WLAN, Konto oder Hub erforderlich\"\n  - \"Sicherheitsmodus für entlaufene Wohnungskatzen\"\n  - \"Manueller 4-Wege-Verschluss\"\nweaknesses:\n  - \"Keine App oder Fernsteuerung\"\n  - \"Keine Aktivitätsprotokolle\"\n  - \"Vier AA-Batterien erforderlich\"\n  - \"Zum Prüfzeitpunkt nicht vorrätig\"\neditorial:\n  assessmentType: \"data-review\"\n  evidence:\n    - \"manufacturer-documentation\"\n    - \"technical-specifications\"\n  testedHandsOn: false\n  lastVerifiedAt: \"2026-08-05\"\n  note: \"Bewertung auf Basis der deutschen Herstellerseite; keine eigene Nutzungserfahrung.\"\nfeatures:\n  - \"Mikrochip-Zugang\"\n  - \"Individuelle Ausgangsrechte\"\n  - \"Sicherheitsmodus\"\n  - \"Manueller 4-Wege-Verschluss\"\n  - \"Batteriebetrieb\"\nuseCase: \"Individuelle Ausgangsrechte ohne App\"\nspecs:\n  - label: \"Klappenöffnung\"\n    value: \"142 × 120 mm\"\n  - label: \"Tür-/Wandausschnitt\"\n    value: \"165 × 171 mm\"\n  - label: \"Glasausschnitt\"\n    value: \"212 mm ideal; bis 260 mm mit Montageadapter\"\n  - label: \"Tunneltiefe\"\n    value: \"70 mm\"\n  - label: \"Speicher\"\n    value: \"Bis zu 32 Tiere beziehungsweise Mikrochipnummern\"\n  - label: \"Stromversorgung\"\n    value: \"4 AA-Batterien, nicht enthalten\"\n  - label: \"Batterielaufzeit\"\n    value: \"Bis zu 12 Monate laut Hersteller\"\n  - label: \"App und Hub\"\n    value: \"Nicht erforderlich und nicht unterstützt\"\ndecisionFacts:\n  - label: \"DualScan-Funktion\"\n    value: \"Individuelle Ausgangsrechte\"\n    consequence: \"Für jedes gespeicherte Tier kann festgelegt werden, ob es das Haus verlassen darf.\"\n  - label: \"Sicherheitsmodus\"\n    value: \"Rückkehr bleibt möglich\"\n    consequence: \"Eine als Wohnungskatze konfigurierte Katze kann wieder hinein, falls sie unbeabsichtigt nach draußen gelangt.\"\n  - label: \"Systemabhängigkeit\"\n    value: \"Vollständig lokal\"\n    consequence: \"Mikrochip-Erkennung und Verriegelung benötigen weder WLAN noch App, Konto oder Hub.\"\n  - label: \"Verfügbarkeit\"\n    value: \"Temporär nicht vorrätig\"\n    consequence: \"Das Modell wird weiterhin geführt, war im deutschen Shop zum Prüfzeitpunkt jedoch nicht auf Lager.\"\nalternatives:\n  - \"sureflap-mikrochip-katzenklappe\"\n  - \"sureflap-mikrochip-katzenklappe-connect\"\n  - \"petsafe-petporte-smart-flap\"\ncomparisons:\n  - \"beste-mikrochip-katzenklappen\"\ncomparisonFilters:\n  animal:\n    - \"cat\"\n  petSize:\n    - \"small\"\n  foodType: []\n  app: false\n  access: \"microchip\"\n  priceTier: \"midrange\"\nfaq:\n  - question: \"Was unterscheidet DualScan von der normalen SureFlap Katzenklappe?\"\n    answer: \"Die Standardklappe steuert nur den Eintritt. DualScan kann zusätzlich für jedes gespeicherte Tier individuelle Ausgangsrechte vergeben.\"\n  - question: \"Braucht DualScan WLAN oder einen Hub?\"\n    answer: \"Nein. Mikrochip-Erkennung und Verriegelung arbeiten vollständig lokal.\"\n  - question: \"Wie viele Tiere können gespeichert werden?\"\n    answer: \"Die Klappe speichert laut Hersteller bis zu 32 Tiere beziehungsweise Mikrochipnummern.\"\n  - question: \"Welche Batterien werden benötigt?\"\n    answer: \"Vier AA-Batterien. Sie sind nicht enthalten.\"\n  - question: \"Wie groß ist der Durchgang?\"\n    answer: \"Der engste Durchgangspunkt misst 142 × 120 mm.\"\nevidenceSources:\n  - source: \"Sure Petcare Deutschland – DualScan Mikrochip Katzenklappe\"\n    url: \"https://www.surepetcare.com/de-de/haustierklappen/dualscan-mikrochip-katzenklappe\"\n    accessedAt: \"2026-08-05\"\n    assertion: \"Ausgangsrechte, Speicher, Batteriebetrieb, Maße, Einbau, Sicherheitsmodus und Verfügbarkeit.\"\n    fields:\n      - \"availability\"\n      - \"decision\"\n      - \"review\"\n      - \"specs\"\n      - \"faq\"\n---\n\n## Kurz eingeordnet\n\nDie SureFlap DualScan Mikrochip Katzenklappe erweitert den selektiven Eingang um individuelle Ausgangsrechte. So kann eine Katze hinausdürfen, während eine andere im Haus bleibt.\n\nSie arbeitet lokal ohne App und Hub. Für Fernsteuerung und Aktivitätsdaten ist die Connect-Version vorgesehen.\n\n## Vor dem Kauf prüfen\n\nDer Durchgang misst 142 × 120 mm. Für Glas und Wand können Montageadapter oder Tunnelverlängerungen nötig sein. Der deutsche Hersteller-Shop führt das Modell weiterhin, kennzeichnet es derzeit aber als nicht vorrätig.\n\nDie Unterschiede zu Standard- und Connect-Modell zeigt der [Vergleich der Mikrochip-Katzenklappen](/vergleiche/beste-mikrochip-katzenklappen/).\n";

for (const [label, file] of Object.entries(FILES)) {
  if (label === "test") continue;
  if (!fs.existsSync(file)) {
    throw new Error(`${label}: Datei fehlt: ${path.relative(ROOT, file)}`);
  }
  if (label === "fallbackImage") continue;
  const source = fs.readFileSync(file, "utf8");
  if (hasConflictMarkers(source)) {
    throw new Error(`${label}: ungelöste Git-Konfliktmarker.`);
  }
}

let packageJson;
try {
  packageJson = JSON.parse(fs.readFileSync(FILES.package, "utf8"));
} catch (error) {
  throw new Error(`package.json ist ungültig.`);
}

for (const script of ["lint:content", "audit:products:strict", "build"]) {
  if (typeof packageJson.scripts?.[script] !== "string") {
    throw new Error(`Erforderliches npm-Skript fehlt: ${script}`);
  }
}

const standardDoc = splitMarkdown(
  fs.readFileSync(FILES.standard, "utf8"),
  "SureFlap Standard",
);
let standardFm = [...standardDoc.frontmatter];
standardFm = setScalar(
  standardFm,
  "testStatus",
  '"manufacturer-data"',
  "productStatus",
);
standardFm = setScalar(standardFm, "rating", "0", "editorial");
const STANDARD_CONTENT = serialize(standardFm, standardDoc.body);

if (!STANDARD_CONTENT.includes('testStatus: "manufacturer-data"')) {
  throw new Error("SureFlap Standard: gültiger testStatus fehlt im Zielzustand.");
}
if (!STANDARD_CONTENT.includes("rating: 0")) {
  throw new Error("SureFlap Standard: neutraler rating-Wert fehlt im Zielzustand.");
}

const PETSAFE_FALLBACK_SOURCE =
  "../../assets/images/cat-flaps/microchip-comparison.svg";
const petsafeRepair = replaceMissingImageSources(
  fs.readFileSync(FILES.petsafeMicrochip, "utf8").replace(/\r\n/g, "\n"),
  FILES.petsafeMicrochip,
  PETSAFE_FALLBACK_SOURCE,
);
const PETSAFE_MICROCHIP_CONTENT = petsafeRepair.source;

if (petsafeRepair.missing.length) {
  log(
    `PetSafe Mikrochip: fehlende Assets werden ersetzt: ${petsafeRepair.missing.join(", ")}`,
  );
}

const TARGETS = [
  FILES.connect,
  FILES.standard,
  FILES.dualscan,
  FILES.petsafeMicrochip,
  FILES.test,
];
const BACKUP = path.join(
  ROOT,
  ".patch-backups",
  `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`,
);

fs.mkdirSync(BACKUP, { recursive: true });
for (const file of TARGETS) {
  if (!fs.existsSync(file)) continue;
  const destination = path.join(BACKUP, path.relative(ROOT, file));
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(file, destination);
}
log(`Backup: ${path.relative(ROOT, BACKUP)}`);

const rollback = () => {
  for (const file of TARGETS) {
    const backup = path.join(BACKUP, path.relative(ROOT, file));
    if (fs.existsSync(backup)) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.copyFileSync(backup, file);
    } else if (file === FILES.test && fs.existsSync(file)) {
      fs.rmSync(file, { force: true });
    }
  }
};

try {
  writeIfChanged(FILES.connect, CONNECT_CONTENT);
  writeIfChanged(FILES.standard, STANDARD_CONTENT);
  writeIfChanged(FILES.dualscan, DUALSCAN_CONTENT);
  writeIfChanged(FILES.petsafeMicrochip, PETSAFE_MICROCHIP_CONTENT);

  const testSource = `import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const read = (slug) =>
  fs.readFileSync(path.join(process.cwd(), "src/content/products", slug + ".md"), "utf8");

const connect = read("sureflap-mikrochip-katzenklappe-connect");
const standard = read("sureflap-mikrochip-katzenklappe");
const dualscan = read("sureflap-dualscan-mikrochip-katzenklappe");
const petporte = read("petsafe-petporte-smart-flap");
const petsafeMicrochip = read("petsafe-mikrochip-katzenklappe");

test("Connect besitzt alle Pflichtfelder und gültige Statuswerte", () => {
  for (const marker of [
    /^title:/m,
    /^slug:/m,
    /^description:/m,
    /^recommendation:/m,
    /^manufacturer:/m,
    /^category:/m,
    /^images:/m,
    /^rating: 0$/m,
    /^decision:/m,
    /^review:/m,
    /^testStatus: "manufacturer-data"$/m,
    /^productStatus: "active"$/m,
  ]) assert.match(connect, marker);
  assert.doesNotMatch(connect, /^score:/m);
});

test("Standard besitzt gültigen Prüfstatus und neutralen Rating-Platzhalter", () => {
  assert.match(standard, /^testStatus: "manufacturer-data"$/m);
  assert.match(standard, /^rating: 0$/m);
  assert.doesNotMatch(standard, /^score:/m);
});

test("alle vier Katzenklappen-Dateien besitzen Frontmatter", () => {
  for (const source of [connect, standard, dualscan, petporte]) {
    const lines = source
      .replaceAll(String.fromCharCode(13), "")
      .split(String.fromCharCode(10));

    assert.equal(lines[0], "---");
    assert.equal(lines.slice(1).includes("---"), true);
  }
});

test("Produktklassen bleiben klar getrennt", () => {
  assert.match(connect, /Hub/);
  assert.match(connect, /App/);
  assert.match(dualscan, /Ausgangsrechte|welche Katze wieder hinaus darf/i);
  assert.match(standard, /ohne App oder Hub/i);
});

test("DualScan besitzt alle Pflichtfelder und gültige Statuswerte", () => {
  for (const marker of [
    /^title:/m,
    /^slug:/m,
    /^description:/m,
    /^recommendation:/m,
    /^manufacturer:/m,
    /^category:/m,
    /^images:/m,
    /^rating: 0$/m,
    /^decision:/m,
    /^review:/m,
    /^testStatus: "manufacturer-data"$/m,
    /^productStatus: "active"$/m,
  ]) assert.match(dualscan, marker);
  assert.doesNotMatch(dualscan, /^score:/m);
});

test("PetSafe Mikrochip referenziert nur vorhandene lokale Bildassets", () => {
  const imagePattern = /src:\s*"([^"]+)"/g;
  for (const match of petsafeMicrochip.matchAll(imagePattern)) {
    const sourcePath = match[1];
    if (
      sourcePath.startsWith("http://") ||
      sourcePath.startsWith("https://") ||
      sourcePath.startsWith("data:") ||
      sourcePath.startsWith("/")
    ) continue;
    const absolute = path.resolve(
      process.cwd(),
      "src/content/products",
      sourcePath,
    );
    assert.equal(
      fs.existsSync(absolute),
      true,
      "Fehlendes PetSafe-Bild: " + sourcePath,
    );
  }
});
`;

  writeIfChanged(FILES.test, testSource);

  run(
    process.execPath,
    ["--check", path.relative(APP, FILES.test)],
    "Syntaxprüfung des generierten Familientests",
    APP,
  );

  run(
    process.execPath,
    ["--test", path.relative(APP, FILES.test)],
    "SureFlap-Familien-Test",
    APP,
  );
  run(
    "npm",
    ["--workspace", "apps/pfotentechnik", "run", "lint:content"],
    "Content-Lint",
  );
  run(
    "npm",
    ["--workspace", "apps/pfotentechnik", "run", "audit:products:strict"],
    "Produkt-Audit",
  );
  run(
    "npm",
    ["--workspace", "apps/pfotentechnik", "run", "build"],
    "Astro-Build",
  );

  const connectInstalled = fs.readFileSync(FILES.connect, "utf8").replace(/\r\n/g, "\n");
  const connectExpected =
    CONNECT_CONTENT.replace(/\r\n/g, "\n").replace(/\s+$/u, "") + "\n";
  if (connectInstalled !== connectExpected) {
    throw new Error("Idempotenzprüfung für Connect fehlgeschlagen.");
  }

  const standardInstalled = fs.readFileSync(FILES.standard, "utf8").replace(/\r\n/g, "\n");
  const standardExpected =
    STANDARD_CONTENT.replace(/\r\n/g, "\n").replace(/\s+$/u, "") + "\n";
  if (standardInstalled !== standardExpected) {
    throw new Error("Idempotenzprüfung für Standard fehlgeschlagen.");
  }

  const dualscanInstalled = fs.readFileSync(FILES.dualscan, "utf8").replace(/\r\n/g, "\n");
  const dualscanExpected =
    DUALSCAN_CONTENT.replace(/\r\n/g, "\n").replace(/\s+$/u, "") + "\n";
  if (dualscanInstalled !== dualscanExpected) {
    throw new Error("Idempotenzprüfung für DualScan fehlgeschlagen.");
  }

  const petsafeInstalled = fs
    .readFileSync(FILES.petsafeMicrochip, "utf8")
    .replace(/\r\n/g, "\n");
  const petsafeExpected =
    PETSAFE_MICROCHIP_CONTENT.replace(/\r\n/g, "\n").replace(/\s+$/u, "") + "\n";
  if (petsafeInstalled !== petsafeExpected) {
    throw new Error("Idempotenzprüfung für PetSafe Mikrochip fehlgeschlagen.");
  }

  const remainingRepair = replaceMissingImageSources(
    petsafeInstalled,
    FILES.petsafeMicrochip,
    PETSAFE_FALLBACK_SOURCE,
  );
  if (remainingRepair.missing.length !== 0) {
    throw new Error(
      "PetSafe Mikrochip besitzt weiterhin fehlende Assets: " +
        remainingRepair.missing.join(", "),
    );
  }

  log("BESTANDEN: zweiter Lauf wäre ohne Änderungen.");
  log("Abgeschlossen: SureFlap-Produktfamilie und Astro-Build sind geschlossen.");
} catch (error) {
  rollback();
  log(`FEHLER: ${error instanceof Error ? error.message : String(error)}`);
  log("Änderungen wurden zurückgerollt.");
  process.exitCode = 1;
}

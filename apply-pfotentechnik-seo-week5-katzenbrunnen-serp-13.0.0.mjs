#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const PATCH = "pfotentechnik-seo-week5-katzenbrunnen-serp-13.0.0";
const CHECK = process.argv.includes("--check");

function findRepoRoot(start) {
  let current = path.resolve(start);
  for (let index = 0; index < 12; index += 1) {
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

function splitDocument(text) {
  const match = normalizeText(text).match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new Error("Markdown-Frontmatter konnte nicht getrennt werden.");
  return { frontmatter: match[1], body: match[2] };
}

function joinDocument(frontmatter, body) {
  return `---\n${frontmatter.trimEnd()}\n---\n\n${body.trim()}\n`;
}

function topLevelBlockRange(lines, key) {
  const start = lines.findIndex((line) => line.startsWith(`${key}:`));
  if (start < 0) return null;
  let end = start + 1;
  while (
    end < lines.length &&
    (lines[end].startsWith(" ") || lines[end].trim() === "")
  ) {
    end += 1;
  }
  return { start, end };
}

function setTopLevelScalar(text, key, value) {
  const { frontmatter, body } = splitDocument(text);
  const lines = frontmatter.split("\n");
  const index = lines.findIndex((line) => line.startsWith(`${key}:`));
  if (index < 0) throw new Error(`Top-Level-Feld ${key} nicht gefunden.`);
  lines[index] = `${key}: ${JSON.stringify(value)}`;
  return joinDocument(lines.join("\n"), body);
}

function setSeo(text, data) {
  const { frontmatter, body } = splitDocument(text);
  const lines = frontmatter.split("\n");
  const range = topLevelBlockRange(lines, "seo");
  if (!range) throw new Error("SEO-Block nicht gefunden.");

  const replacement = [
    "seo:",
    `  title: ${JSON.stringify(data.title)}`,
    `  description: ${JSON.stringify(data.description)}`,
    `  canonical: ${JSON.stringify(data.canonical)}`,
    "  sitemap: true",
    `  priority: ${data.priority}`,
    `  changefreq: ${JSON.stringify(data.changefreq)}`
  ];

  lines.splice(range.start, range.end - range.start, ...replacement);
  return joinDocument(lines.join("\n"), body);
}

function ensureLinkingPriority(text, priority = "high") {
  const { frontmatter, body } = splitDocument(text);
  const lines = frontmatter.split("\n");
  const range = topLevelBlockRange(lines, "linking");
  if (!range) return text;

  const block = lines.slice(range.start, range.end);
  const priorityIndex = block.findIndex((line) => /^\s+priority:/.test(line));
  if (priorityIndex >= 0) {
    block[priorityIndex] = `  priority: ${JSON.stringify(priority)}`;
  } else {
    while (block.length > 1 && block.at(-1).trim() === "") block.pop();
    block.push(`  priority: ${JSON.stringify(priority)}`);
  }

  lines.splice(range.start, range.end - range.start, ...block);
  return joinDocument(lines.join("\n"), body);
}

function insertBodySection(text, heading, section, preferredMarkers = []) {
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

function ensureCardLink(text, title, href, cta) {
  if (text.includes(`href: ${JSON.stringify(href)}`)) return text;

  const titleNeedle = `title: ${JSON.stringify(title)}`;
  const titlePosition = text.indexOf(titleNeedle);
  if (titlePosition < 0) return text;

  const blockStart = text.lastIndexOf("\n      - ", titlePosition);
  const nextCard = text.indexOf("\n      - ", titlePosition + titleNeedle.length);
  const nextBlock = text.indexOf("\n  - type:", titlePosition + titleNeedle.length);
  const candidates = [nextCard, nextBlock, text.length].filter((value) => value >= 0);
  const blockEnd = Math.min(...candidates);
  const start = blockStart >= 0 ? blockStart : titlePosition;
  const block = text.slice(start, blockEnd);
  const lines = block.split("\n");
  const textIndex = lines.findIndex((line) => /^\s+text:/.test(line));
  if (textIndex < 0) return text;
  const indent = lines[textIndex].match(/^\s*/)?.[0] ?? "";
  lines.splice(
    textIndex + 1,
    0,
    `${indent}href: ${JSON.stringify(href)}`,
    `${indent}cta: ${JSON.stringify(cta)}`
  );
  return text.slice(0, start) + lines.join("\n") + text.slice(blockEnd);
}

const files = {
  hub: path.join(app, "src/content/pages/trinkbrunnen.md"),
  multi: path.join(app, "src/content/pages/trinkbrunnen-fuer-mehrere-katzen.md"),
  waterCount: path.join(app, "src/content/pages/wie-viele-wasserstellen-katze.md"),
  cleaning: path.join(app, "src/content/pages/katzentrinkbrunnen-richtig-reinigen.md"),
  biofilm: path.join(app, "src/content/pages/biofilm-im-katzentrinkbrunnen.md"),
  calc: path.join(app, "src/content/pages/kalk-katzentrinkbrunnen-entfernen.md"),
  filter: path.join(app, "src/content/pages/filter-im-katzentrinkbrunnen-wechseln.md"),
  noise: path.join(app, "src/content/pages/katzentrinkbrunnen-laut-pumpe.md"),
  material: path.join(app, "src/content/pages/katzentrinkbrunnen-material-edelstahl-keramik-kunststoff.md"),
  comparison: path.join(app, "src/content/comparisons/beste-trinkbrunnen-fuer-katzen.md"),
  packageJson: path.join(app, "package.json"),
  audit: path.join(app, "scripts/seo/audit-week5-katzenbrunnen-serp.mjs")
};

const configs = [
  {
    file: files.multi,
    title: "Trinkbrunnen für zwei oder mehr Katzen",
    seoTitle: "Trinkbrunnen für 2 Katzen: Größe, Anzahl & RFID",
    seoDescription: "Für zwei Katzen reichen nicht nur ein großer Tank: drei getrennte Wasserstellen, Hygiene, RFID-Grenzen und passende Katzenbrunnen.",
    canonical: "/trinkbrunnen-fuer-mehrere-katzen/",
    priority: 0.85,
    sectionHeading: "## Modelle nach Mehrkatzen-Szenario",
    section: `## Modelle nach Mehrkatzen-Szenario

Der [Katzenbrunnen-Vergleich](/vergleiche/beste-trinkbrunnen-fuer-katzen/) trennt einfache Netzmodelle, Akku-Brunnen, Edelstahl und Mehrkatzen-Tracking. Ein Tracking-System kann Ereignisse zuordnen, ersetzt aber keine räumlich getrennten Trinkorte. Die konkrete Anzahl erklärt [Wie viele Wasserstellen braucht eine Katze?](/wie-viele-wasserstellen-katze/).`
  },
  {
    file: files.waterCount,
    title: "Wie viele Wasserstellen braucht eine Katze?",
    seoTitle: "Wie viele Wassernäpfe braucht eine Katze? Klare Regel",
    seoDescription: "Eine Katze: zwei Wasserstellen. Zwei Katzen: drei. So verteilst du Wassernäpfe und Katzenbrunnen sinnvoll über Räume und Etagen.",
    canonical: "/wie-viele-wasserstellen-katze/",
    priority: 0.85,
    sectionHeading: "## Trinkbrunnen als eine von mehreren Wasserstellen",
    section: `## Trinkbrunnen als eine von mehreren Wasserstellen

Ein Brunnen zählt als **eine** Wasserstelle, selbst wenn er mehrere Auslässe besitzt. Für zwei Katzen bleibt deshalb die Ausgangsregel drei räumlich getrennte Orte. Der Ratgeber [Trinkbrunnen für mehrere Katzen](/trinkbrunnen-fuer-mehrere-katzen/) erklärt soziale Zugänge; der [Katzenbrunnen-Vergleich](/vergleiche/beste-trinkbrunnen-fuer-katzen/) hilft bei der Auswahl eines ergänzenden Geräts.`
  },
  {
    file: files.cleaning,
    title: "Katzentrinkbrunnen reinigen: Pumpe, Tank und Filter",
    seoTitle: "Katzentrinkbrunnen reinigen: 7 Schritte für Pumpe & Tank",
    seoDescription: "Katzenbrunnen richtig reinigen: Wasser wechseln, Filter entnehmen, Tank, Dichtungen, Auslauf, Pumpe und Rotorraum gründlich säubern.",
    canonical: "/katzentrinkbrunnen-richtig-reinigen/",
    priority: 0.85,
    sectionHeading: "## Probleme gezielt vertiefen",
    section: `## Probleme gezielt vertiefen

- Glitschiger Belag: [Biofilm im Katzenbrunnen entfernen](/biofilm-im-katzentrinkbrunnen/)
- Weiße Ablagerungen: [Katzenbrunnen sicher entkalken](/kalk-katzentrinkbrunnen-entfernen/)
- Schwacher Durchfluss: [Filterintervall und Warnzeichen](/filter-im-katzentrinkbrunnen-wechseln/)
- Brummen oder Rattern: [Laute Pumpe systematisch prüfen](/katzentrinkbrunnen-laut-pumpe/)
- Neuanschaffung: [Sechs Katzenbrunnen vergleichen](/vergleiche/beste-trinkbrunnen-fuer-katzen/)`
  },
  {
    file: files.biofilm,
    title: "Schleim im Katzentrinkbrunnen: Biofilm entfernen",
    seoTitle: "Schleim im Katzenbrunnen: Biofilm sicher entfernen",
    seoDescription: "Glitschigen Biofilm im Katzenbrunnen erkennen und entfernen: Tank, Pumpe, Rotor, Leitungen und Filter mechanisch richtig reinigen.",
    canonical: "/biofilm-im-katzentrinkbrunnen/",
    priority: 0.85,
    sectionHeading: "## Biofilm, Kalk und Filter nicht verwechseln",
    section: `## Biofilm, Kalk und Filter nicht verwechseln

Biofilm ist glitschig, Kalk eher hell und krustig. Die [Entkalkungs-Anleitung](/kalk-katzentrinkbrunnen-entfernen/) behandelt mineralische Ablagerungen; der [Filter-Ratgeber](/filter-im-katzentrinkbrunnen-wechseln/) erklärt laufende Wechselteile. Den vollständigen Reinigungsablauf zeigt [Katzentrinkbrunnen richtig reinigen](/katzentrinkbrunnen-richtig-reinigen/). Modelle mit gut zugänglichem Wasserweg stehen im [Katzenbrunnen-Vergleich](/vergleiche/beste-trinkbrunnen-fuer-katzen/).`
  },
  {
    file: files.calc,
    title: "Katzenbrunnen entkalken: Kalk sicher entfernen",
    seoTitle: "Katzenbrunnen entkalken: Kalk sicher entfernen",
    seoDescription: "Kalk im Katzenbrunnen materialschonend entfernen: Pumpe, Rotor, Tank und Edelstahl reinigen, gründlich spülen und Schäden vermeiden.",
    canonical: "/kalk-katzentrinkbrunnen-entfernen/",
    priority: 0.8,
    sectionHeading: "## Wenn Kalk weitere Probleme verursacht",
    section: `## Wenn Kalk weitere Probleme verursacht

Kalk am Rotor kann Durchfluss und Geräusch verändern. Prüfe deshalb zusätzlich die Anleitung [Katzenbrunnen laut: Pumpe kontrollieren](/katzentrinkbrunnen-laut-pumpe/). Glitschige Schichten werden separat als [Biofilm](/biofilm-im-katzentrinkbrunnen/) behandelt. Der vollständige Pflegeablauf steht unter [Katzentrinkbrunnen richtig reinigen](/katzentrinkbrunnen-richtig-reinigen/); gut zerlegbare Modelle zeigt der [Katzenbrunnen-Vergleich](/vergleiche/beste-trinkbrunnen-fuer-katzen/).`
  },
  {
    file: files.filter,
    title: "Katzenbrunnen-Filter wechseln: Intervalle und Warnzeichen",
    seoTitle: "Katzenbrunnen-Filter wechseln: alle 2–4 Wochen?",
    seoDescription: "Katzenbrunnen-Filter meist alle zwei bis vier Wochen wechseln. Tierzahl, Haare, Geruch, Wasserhärte und Durchfluss können das Intervall verkürzen.",
    canonical: "/filter-im-katzentrinkbrunnen-wechseln/",
    priority: 0.8,
    sectionHeading: "## Filterkosten vor dem Modellvergleich prüfen",
    section: `## Filterkosten vor dem Modellvergleich prüfen

Im [Katzenbrunnen-Vergleich](/vergleiche/beste-trinkbrunnen-fuer-katzen/) werden Filter und Folgekosten als eigenes Kriterium geführt. Ein neuer Filter ersetzt weder die [vollständige Reinigung](/katzentrinkbrunnen-richtig-reinigen/) noch das mechanische Entfernen von [Biofilm](/biofilm-im-katzentrinkbrunnen/).`
  },
  {
    file: files.noise,
    title: "Katzenbrunnen laut? Pumpe in 6 Schritten prüfen",
    seoTitle: "Katzenbrunnen laut? Pumpe in 6 Schritten prüfen",
    seoDescription: "Katzenbrunnen brummt oder rattert? Wasserstand, Luft, Filter, Haare, Kalk, Rotor und Untergrund in der richtigen Reihenfolge prüfen.",
    canonical: "/katzentrinkbrunnen-laut-pumpe/",
    priority: 0.8,
    sectionHeading: "## Geräuschursache gezielt eingrenzen",
    section: `## Geräuschursache gezielt eingrenzen

Ein zugesetzter Filter wird im [Filter-Ratgeber](/filter-im-katzentrinkbrunnen-wechseln/) eingeordnet, mineralische Ablagerungen unter [Katzenbrunnen entkalken](/kalk-katzentrinkbrunnen-entfernen/). Für den Rotorraum hilft die [vollständige Reinigungsanleitung](/katzentrinkbrunnen-richtig-reinigen/). Leise Herstellerangaben und Bauformen lassen sich im [Katzenbrunnen-Vergleich](/vergleiche/beste-trinkbrunnen-fuer-katzen/) gegenüberstellen.`
  },
  {
    file: files.material,
    title: "Katzenbrunnen: Edelstahl, Keramik oder Kunststoff?",
    seoTitle: "Katzenbrunnen: Edelstahl, Keramik oder Kunststoff?",
    seoDescription: "Edelstahl, Keramik und Kunststoff bei Katzenbrunnen vergleichen: Hygiene, Kratzer, Gewicht, Bruchrisiko, Geräusch und Reinigung.",
    canonical: "/katzentrinkbrunnen-material-edelstahl-keramik-kunststoff/",
    priority: 0.8,
    sectionHeading: "## Material im konkreten Modell prüfen",
    section: `## Material im konkreten Modell prüfen

Die Produktbezeichnung sagt nicht immer, welche Flächen tatsächlich aus Edelstahl bestehen. Der [Katzenbrunnen-Vergleich](/vergleiche/beste-trinkbrunnen-fuer-katzen/) nennt deshalb Tank und Trinkfläche getrennt. Unabhängig vom Material bleiben [vollständige Reinigung](/katzentrinkbrunnen-richtig-reinigen/) und zugängliche Pumpenteile entscheidend.`
  }
];

for (const config of configs) {
  let text = read(config.file);
  text = setTopLevelScalar(text, "title", config.title);
  text = setTopLevelScalar(text, "updatedAt", "2026-07-25");
  text = setSeo(text, {
    title: config.seoTitle,
    description: config.seoDescription,
    canonical: config.canonical,
    priority: config.priority,
    changefreq: "yearly"
  });
  text = ensureLinkingPriority(text, "high");
  text = insertBodySection(
    text,
    config.sectionHeading,
    config.section,
    ["## Quellen", "**Quellen:**", "## Fazit"]
  );
  stage(config.file, text);
}

// Hub als sichtbaren Cluster-Einstieg ausbauen.
{
  let text = read(files.hub);
  text = setTopLevelScalar(
    text,
    "seoTitle",
    "Trinkbrunnen für Katzen & Hunde: Auswahl und Vergleich"
  );
  text = setTopLevelScalar(
    text,
    "seoDescription",
    "Trinkbrunnen auswählen und vergleichen: Katzenbrunnen, Hundebrunnen, Reinigung, Filter, Material, Lautstärke, Akku und Mehrtierhaushalt."
  );
  text = setTopLevelScalar(text, "updatedAt", "2026-07-25");

  text = ensureCardLink(
    text,
    "Der gesamte Wasserweg zählt",
    "/katzentrinkbrunnen-richtig-reinigen/",
    "Reinigung im Detail"
  );
  text = ensureCardLink(
    text,
    "Pumpe, Wasserstand und Untergrund prüfen",
    "/katzentrinkbrunnen-laut-pumpe/",
    "Geräusche beheben"
  );
  text = ensureCardLink(
    text,
    "Mehrere Wasserstellen beibehalten",
    "/trinkbrunnen-fuer-mehrere-katzen/",
    "Mehrkatzen-Haushalt planen"
  );

  const section = `## Katzenbrunnen gezielt auswählen und pflegen

| Frage | Passender Einstieg |
|---|---|
| Welche Modelle passen zu Katzen? | [Sechs Katzenbrunnen im Vergleich](/vergleiche/beste-trinkbrunnen-fuer-katzen/) |
| Wie viele Trinkorte sind nötig? | [Wasserstellen für Katzen planen](/wie-viele-wasserstellen-katze/) |
| Was gilt bei zwei oder mehr Katzen? | [Trinkbrunnen im Mehrkatzenhaushalt](/trinkbrunnen-fuer-mehrere-katzen/) |
| Wie wird der Brunnen hygienisch sauber? | [Katzenbrunnen vollständig reinigen](/katzentrinkbrunnen-richtig-reinigen/) |
| Was ist der glitschige Belag? | [Biofilm erkennen und entfernen](/biofilm-im-katzentrinkbrunnen/) |
| Warum ist die Pumpe plötzlich laut? | [Geräuschursachen systematisch prüfen](/katzentrinkbrunnen-laut-pumpe/) |
| Wie oft muss der Filter neu? | [Filterintervalle und Warnzeichen](/filter-im-katzentrinkbrunnen-wechseln/) |
| Welches Material ist sinnvoll? | [Edelstahl, Keramik und Kunststoff](/katzentrinkbrunnen-material-edelstahl-keramik-kunststoff/) |`;

  text = insertBodySection(
    text,
    "## Katzenbrunnen gezielt auswählen und pflegen",
    section,
    ["## Auswahlhilfe:", "## Für Katzen", "## Fazit"]
  );
  stage(files.hub, text);
}

// Vergleich bewusst vollständig ersetzen.
stage(files.comparison, "---\ntitle: \"Beste Trinkbrunnen für Katzen\"\nslug: \"beste-trinkbrunnen-fuer-katzen\"\ntype: \"comparison\"\nlayout: \"comparison\"\ndescription: \"Sechs Katzenbrunnen nach Trinkfläche, Material, Reinigung, Filter, Lautstärke, Stromversorgung und Mehrkatzen-Eignung vergleichen.\"\npublishedAt: \"2026-07-24\"\nupdatedAt: \"2026-07-25\"\nauthor:\n  name: \"PfotenTechnik Redaktion\"\n  role: \"Redaktion\"\ntags:\n  - \"Trinkbrunnen\"\n  - \"Katze\"\n  - \"Katzenbrunnen\"\n  - \"Vergleich\"\n  - \"Kaufberatung\"\nhub:\n  sections:\n    - \"vergleiche\"\n    - \"trinkbrunnen\"\n  title: \"Beste Trinkbrunnen für Katzen\"\n  description: \"Sechs klar unterscheidbare Katzenbrunnen nach Reinigung, Material, Betrieb und Einsatzgebiet.\"\n  icon: \"🐈\"\n  featured: true\n  order: 20\nseo:\n  title: \"Katzenbrunnen im Vergleich: 6 Modelle für Katzen\"\n  description: \"Sechs Katzenbrunnen vergleichen: leise Netzmodelle, Akku, Edelstahl, UVC, Mehrkatzen-Tracking, Filterkosten und Reinigungsaufwand.\"\n  canonical: \"/vergleiche/beste-trinkbrunnen-fuer-katzen/\"\n  sitemap: true\n  priority: 0.9\n  changefreq: \"monthly\"\ncomparisonType: \"use-case\"\ngroup: \"Trinkbrunnen\"\nicon: \"🐈\"\nitems:\n  - slug: \"petkit-eversweet-solo-2-fountain\"\n    label: \"PETKIT Eversweet Solo 2\"\n    type: \"product\"\n    recommendation: \"Ausgewogene Gesamtwahl für eine oder zwei Katzen, wenn leiser Netzbetrieb, kompakte zwei Liter und ein vollständig zerlegbarer Aufbau wichtiger sind als Akku oder App-Tracking.\"\n    values:\n      kapazitaet: \"2 Liter\"\n      material: \"BPA-freies ABS und Silikon\"\n      lautstaerke: \"Herstellerangabe bis 25 dB\"\n      filter: \"Mehrstufig mit Aktivkohle und Ionenaustauscher\"\n      reinigung: \"Vollständig zerlegbar; von Hand reinigen\"\n      stromversorgung: \"Dauerhafter Netzbetrieb\"\n      eignung: \"Eine bis zwei Katzen; kleiner Haushalt\"\n  - slug: \"oneisall-3-2l-cordless-fountain\"\n    label: \"oneisall 3,2L Cordless Cat Fountain\"\n    type: \"product\"\n    recommendation: \"Starke kabellose Preis-Leistungs-Option für ein bis zwei Katzen, wenn flexible Aufstellung, 3,2 Liter Reserve und eine Edelstahl-Trinkfläche wichtiger sind als App-Auswertung.\"\n    values:\n      kapazitaet: \"3,2 Liter\"\n      material: \"ABS-Tank mit Trinkfläche aus Edelstahl 304\"\n      lautstaerke: \"Herstellerangabe ungefähr 20 dB\"\n      filter: \"Fünfstufig\"\n      reinigung: \"Tank, Trinkfläche, Pumpe und Filterkammer getrennt reinigen\"\n      stromversorgung: \"4.000-mAh-Akku\"\n      eignung: \"Eine bis zwei Katzen; Standort ohne Steckdose\"\n  - slug: \"petkit-eversweet-max-2-uvc\"\n    label: \"PETKIT Eversweet Max 2 UVC\"\n    type: \"product\"\n    recommendation: \"Premiumoption für Katzenhalter, die Akku- und Netzbetrieb, UVC-Pumpe, App-Status und spülmaschinengeeignete Wasserteile kombinieren möchten.\"\n    values:\n      kapazitaet: \"3 Liter\"\n      material: \"Edelstahl-Trinkfläche\"\n      lautstaerke: \"Keine belastbare Herstellerangabe\"\n      filter: \"Modellgebundener PETKIT-Filter\"\n      reinigung: \"Wasserführende Teile laut Hersteller spülmaschinengeeignet\"\n      stromversorgung: \"Akku- und Netzbetrieb\"\n      eignung: \"Eine bis zwei Katzen; Premium- und App-Nutzung\"\n  - slug: \"petkit-eversweet-ultra\"\n    label: \"PETKIT Eversweet Ultra\"\n    type: \"product\"\n    recommendation: \"Spezialisierte Mehrkatzen-Lösung, wenn getrenntes Frisch- und Abwasser sowie kameraunterstützte Trinkereignisse wichtiger sind als kompakte Bauform und niedriger Preis.\"\n    values:\n      kapazitaet: \"5 Liter Frischwasser plus 1,8 Liter Abwasser\"\n      material: \"ABS, Polypropylen, PPO und Edelstahl 304\"\n      lautstaerke: \"Herstellerangabe bis etwa 26 dB im Normalbetrieb\"\n      filter: \"Kein klassischer Hauptfilter; Cube C bleibt erforderlich\"\n      reinigung: \"Trinkschale, Auslauf und magnetisches Sieb laut PETKIT spülmaschinengeeignet\"\n      stromversorgung: \"Netzbetrieb mit 12 V/2 A\"\n      eignung: \"Mehrkatzenhaushalt mit individuellem Trinktracking\"\n  - slug: \"petlibro-stainless-steel-fountain\"\n    label: \"PETLIBRO Stainless Steel Fountain 3L\"\n    type: \"product\"\n    recommendation: \"Einfache Edelstahloption für Katzenhalter, denen ein robuster, spülmaschinengeeigneter Tank wichtiger ist als Akku, App oder Tiererkennung.\"\n    values:\n      kapazitaet: \"3 Liter\"\n      material: \"Tank und Trinkfläche aus Edelstahl 304\"\n      lautstaerke: \"Keine belastbare Herstellerangabe\"\n      filter: \"Modellgebundener PETLIBRO-Filter\"\n      reinigung: \"Edelstahltank laut Hersteller spülmaschinengeeignet\"\n      stromversorgung: \"Netzbetrieb\"\n      eignung: \"Eine bis zwei Katzen; Fokus auf Edelstahl\"\n  - slug: \"cat-mate-335-pet-fountain\"\n    label: \"Cat Mate Pet Fountain 335\"\n    type: \"product\"\n    recommendation: \"Einfache Offline-Alternative, wenn mehrere Trinkhöhen, lange Kabelreichweite und verfügbare Ersatzteile wichtiger sind als Edelstahl, Akku oder App.\"\n    values:\n      kapazitaet: \"Rund 2 Liter\"\n      material: \"BPA- und BHT-freier Kunststoff\"\n      lautstaerke: \"Keine belastbare Herstellerangabe\"\n      filter: \"Polymer-Aktivkohlefilter\"\n      reinigung: \"Monatlich, bei hartem Wasser häufiger; Pumpe separat reinigen\"\n      stromversorgung: \"Niedervolt-Netzbetrieb mit 3-m-Kabel\"\n      eignung: \"Eine oder mehrere Katzen mit unterschiedlichen Trinkhöhen\"\ncriteria:\n  - key: \"reinigung\"\n    label: \"Reinigung\"\n    description: \"Zerlegbarkeit, Pumpenzugang und Spülmaschineneignung.\"\n    weight: 1.5\n  - key: \"eignung\"\n    label: \"Einsatzgebiet\"\n    description: \"Passung zu Tierzahl, Standort und gewünschter Trinkfläche.\"\n    weight: 1.4\n  - key: \"material\"\n    label: \"Material\"\n    description: \"Material der tatsächlich wasserberührenden Flächen.\"\n    weight: 1.2\n  - key: \"stromversorgung\"\n    label: \"Stromversorgung\"\n    description: \"Netz, Akku und daraus folgende Platzierungsfreiheit.\"\n    weight: 1.0\n  - key: \"filter\"\n    label: \"Filter und Folgekosten\"\n    description: \"Filteraufbau, Wechselteile und laufende Kosten.\"\n    weight: 1.0\n  - key: \"lautstaerke\"\n    label: \"Lautstärke\"\n    description: \"Dokumentierte Herstellerangabe und praktische Einflussfaktoren.\"\n    weight: 0.8\n  - key: \"kapazitaet\"\n    label: \"Kapazität\"\n    description: \"Nutzbare Wasserreserve ohne Hygieneversprechen.\"\n    weight: 0.8\nautomaticRecommendations:\n  enabled: false\nrecommendation:\n  winnerSlug: \"petkit-eversweet-solo-2-fountain\"\n  alternativeSlug: \"oneisall-3-2l-cordless-fountain\"\n  title: \"PETKIT Solo 2 für den einfachen Alltag, oneisall 3,2L für kabellose Aufstellung\"\n  text: \"Für viele Katzenhaushalte ist der PETKIT Eversweet Solo 2 die ausgewogenste einfache Lösung. Der oneisall 3,2L ist flexibler ohne Steckdose. Für Mehrkatzen-Tracking ist der Eversweet Ultra spezialisiert; Edelstahl-Fokus bietet PETLIBRO.\"\ntableTitle: \"6 Katzenbrunnen direkt verglichen\"\ncardsTitle: \"Empfehlungen nach Haushalt und Standort\"\nfaq:\n  - question: \"Welcher Katzenbrunnen ist für die meisten Haushalte geeignet?\"\n    answer: \"Ein leiser, vollständig zerlegbarer Brunnen mit gut zugänglicher Pumpe ist meist sinnvoller als ein besonders funktionsreiches Modell. Im aktuellen Vergleich ist der PETKIT Eversweet Solo 2 die ausgewogene Netzlösung.\"\n  - question: \"Welcher Katzenbrunnen funktioniert ohne Steckdose?\"\n    answer: \"Ein Akkumodell wie der oneisall 3,2L lässt sich flexibler aufstellen. Akkulaufzeit hängt jedoch vom Betriebsmodus ab; ein zusätzlicher normaler Wassernapf bleibt nötig.\"\n  - question: \"Ist Edelstahl besser als Kunststoff?\"\n    answer: \"Edelstahl ist robust und häufig leicht zu reinigen. Entscheidend bleiben aber Pumpe, Filterkammer, Dichtungen und alle weiteren wasserberührenden Kunststoffteile.\"\n  - question: \"Wie groß sollte ein Katzenbrunnen sein?\"\n    answer: \"Zwei bis drei Liter sind für viele Haushalte praktikabel. Ein größerer Tank reduziert das Nachfüllen, verlängert aber nicht automatisch die hygienische Standzeit.\"\n  - question: \"Welcher Brunnen eignet sich für mehrere Katzen?\"\n    answer: \"Mehrkatzenhaushalte brauchen mehrere getrennte Wasserstellen. Ein großes Modell oder ein Tracking-System wie der PETKIT Eversweet Ultra kann ergänzen, ersetzt aber keine weiteren Näpfe.\"\n  - question: \"Wie leise muss ein Katzenbrunnen sein?\"\n    answer: \"Dezibelwerte sind nur ein Hinweis. Wasserstand, Rotorverschmutzung, Untergrund und freier Wasserfall beeinflussen die wahrgenommene Lautstärke stark.\"\n  - question: \"Wie oft muss ein Katzenbrunnen gereinigt werden?\"\n    answer: \"Als Ausgangspunkt sollte das Wasser täglich kontrolliert und der Brunnen mindestens wöchentlich vollständig zerlegt werden. Mehrere Tiere oder sichtbarer Belag erfordern kürzere Intervalle.\"\n  - question: \"Wie oft muss der Filter gewechselt werden?\"\n    answer: \"Viele Hersteller nennen zwei bis vier Wochen. Tierzahl, Haare, Wasserhärte, Geruch und Durchfluss können einen früheren Wechsel nötig machen.\"\n  - question: \"Ist UVC wichtiger als Reinigung?\"\n    answer: \"Nein. UVC kann nur einen Teil des vorbeiströmenden Wassers beeinflussen. Biofilm und Ablagerungen müssen weiterhin mechanisch entfernt werden.\"\n  - question: \"Ersetzt ein Katzenbrunnen mehrere Wassernäpfe?\"\n    answer: \"Nein. Ein Brunnen ist eine Wasserstelle. Stromausfall, Defekt, Reinigung oder soziale Blockade dürfen nicht den gesamten Zugang zu Wasser verhindern.\"\n---\n\nEin **Katzenbrunnen** muss zum Haushalt passen, nicht nur zur Funktionsliste. Für eine Katze ist ein leises, gut zerlegbares Netzmodell oft sinnvoller als ein großes Tracking-System. Mehrere Katzen benötigen weiterhin räumlich getrennte Wasserstellen.\n\n## Schnellentscheidung\n\n- **PETKIT Eversweet Solo 2:** ausgewogene, kompakte Netzlösung.\n- **oneisall 3,2L Cordless:** flexible Akkuoption.\n- **PETKIT Eversweet Max 2 UVC:** Premiumlösung mit Akku, App und UVC-Pumpe.\n- **PETKIT Eversweet Ultra:** spezialisiertes Mehrkatzen-Tracking.\n- **PETLIBRO Edelstahl 3L:** einfacher Edelstahlfokus.\n- **Cat Mate 335:** unkomplizierte Offline-Lösung mit mehreren Trinkhöhen.\n\n## Welches Modell passt zu welchem Haushalt?\n\n| Situation | Passende Richtung |\n|---|---|\n| eine Katze, fester Standort | PETKIT Eversweet Solo 2 |\n| Standort ohne Steckdose | oneisall 3,2L Cordless |\n| App, Akku und UVC gewünscht | PETKIT Eversweet Max 2 UVC |\n| mehrere Katzen mit Trinktracking | PETKIT Eversweet Ultra |\n| möglichst viel Edelstahl | PETLIBRO Stainless Steel 3L |\n| einfache Technik und Ersatzteile | Cat Mate 335 |\n\n## Reinigung ist das wichtigste Vergleichskriterium\n\nEin Filter, UVC oder automatisches Spülen ersetzt die mechanische Reinigung nicht. Vor dem Kauf sollte geprüft werden, ob sich folgende Bereiche erreichen lassen:\n\n- Pumpe und Rotorraum,\n- Unterseite der Trinkfläche,\n- Filterkammer und Auslauf,\n- Dichtungen und Kabeldurchführung,\n- stehendes Restwasser in Kanälen.\n\nDer Ratgeber [Katzentrinkbrunnen richtig reinigen](/katzentrinkbrunnen-richtig-reinigen/) zeigt den vollständigen Ablauf.\n\n## Mehrere Katzen brauchen mehrere Orte\n\nAuch ein großer Brunnen bleibt eine Wasserstelle. Für zwei Katzen sind drei räumlich getrennte Trinkorte ein sinnvoller Ausgangspunkt. Der Ratgeber [Wie viele Wasserstellen braucht eine Katze?](/wie-viele-wasserstellen-katze/) erklärt die Verteilung; [Trinkbrunnen für mehrere Katzen](/trinkbrunnen-fuer-mehrere-katzen/) ordnet Tankgröße und Tracking ein.\n\n## Material, Filter und Geräusch\n\n[Edelstahl, Keramik und Kunststoff](/katzentrinkbrunnen-material-edelstahl-keramik-kunststoff/) haben unterschiedliche Vor- und Nachteile. Ein glatter Tank ist hilfreich, doch Pumpe und Filter bleiben häufig aus Kunststoff.\n\nFür laufende Pflege helfen:\n\n- [Filter im Katzenbrunnen wechseln](/filter-im-katzentrinkbrunnen-wechseln/)\n- [Biofilm im Katzenbrunnen entfernen](/biofilm-im-katzentrinkbrunnen/)\n- [Katzenbrunnen entkalken](/kalk-katzentrinkbrunnen-entfernen/)\n- [Laute Pumpe prüfen](/katzentrinkbrunnen-laut-pumpe/)\n\n## Methodik\n\nDie sechs Modelle wurden bewusst nach klar unterscheidbaren Einsatzgebieten kuratiert. Reinigung und Alltagseignung werden stärker gewichtet als App, Beleuchtung oder reine Tankgröße. Nicht dokumentierte Herstellerangaben werden nicht geschätzt.\n\n## Fazit\n\nDer PETKIT Eversweet Solo 2 ist die ausgewogenste einfache Gesamtwahl im aktuellen Bestand. Wer kabellos aufstellen muss, schaut zuerst auf den oneisall 3,2L. Für Mehrkatzen-Tracking ist der Eversweet Ultra spezialisiert. Unabhängig vom Modell bleiben mehrere Wasserstellen, regelmäßiger Wasserwechsel und vollständige Reinigung entscheidend.\n");

// npm-Audit-Befehl ergänzen.
{
  const packageData = JSON.parse(read(files.packageJson));
  packageData.scripts ??= {};
  packageData.scripts["audit:cat-fountain-serp"] =
    "node scripts/seo/audit-week5-katzenbrunnen-serp.mjs";
  stage(files.packageJson, `${JSON.stringify(packageData, null, 2)}\n`);
}

const auditSource = `#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, "../..");
const content = path.join(app, "src", "content");
const checks = [];

const normalize = (value) =>
  String(value).replace(/^\\uFEFF/, "").replace(/\\r\\n?/g, "\\n");
const read = (file) => normalize(fs.readFileSync(file, "utf8"));
const check = (name, ok, detail = "") => checks.push({ name, ok, detail });

function splitDocument(text) {
  const match = normalize(text).match(/^---\\n([\\s\\S]*?)\\n---\\n?([\\s\\S]*)$/);
  if (!match) return null;
  return { frontmatter: match[1], body: match[2] };
}

function topLevelScalar(frontmatter, key) {
  const match = frontmatter.match(new RegExp(\`^\${key}:\\\\s*["']?([^\\\\n"']+)["']?$\`, "m"));
  return match?.[1]?.trim();
}

function seoValue(frontmatter, key) {
  const lines = frontmatter.split("\\n");
  const start = lines.findIndex((line) => line === "seo:");
  if (start < 0) return undefined;

  let end = start + 1;
  while (
    end < lines.length &&
    (lines[end].startsWith(" ") || lines[end].trim() === "")
  ) {
    end += 1;
  }

  const block = lines.slice(start + 1, end).join("\\n");
  const match = block.match(
    new RegExp(
      \`^  \${key}:\\\\s*(?:"([^"]*)"|'([^']*)'|([^\\\\n]+))$\`,
      "m"
    )
  );

  return (match?.[1] ?? match?.[2] ?? match?.[3])?.trim();
}

const pageSlugs = [
  "trinkbrunnen-fuer-mehrere-katzen",
  "wie-viele-wasserstellen-katze",
  "katzentrinkbrunnen-richtig-reinigen",
  "biofilm-im-katzentrinkbrunnen",
  "kalk-katzentrinkbrunnen-entfernen",
  "filter-im-katzentrinkbrunnen-wechseln",
  "katzentrinkbrunnen-laut-pumpe",
  "katzentrinkbrunnen-material-edelstahl-keramik-kunststoff"
];

for (const slug of pageSlugs) {
  const file = path.join(content, "pages", \`\${slug}.md\`);
  check(\`\${slug}: Datei vorhanden\`, fs.existsSync(file));
  if (!fs.existsSync(file)) continue;
  const parsed = splitDocument(read(file));
  check(\`\${slug}: Frontmatter parsebar\`, Boolean(parsed));
  if (!parsed) continue;

  const seoTitle = seoValue(parsed.frontmatter, "title") ?? "";
  const seoDescription = seoValue(parsed.frontmatter, "description") ?? "";
  check(
    \`\${slug}: SEO-Title 35–65 Zeichen\`,
    seoTitle.length >= 35 && seoTitle.length <= 65,
    String(seoTitle.length)
  );
  check(
    \`\${slug}: Description 110–170 Zeichen\`,
    seoDescription.length >= 110 && seoDescription.length <= 170,
    String(seoDescription.length)
  );
  check(
    \`\${slug}: Vergleich verlinkt\`,
    parsed.body.includes("/vergleiche/beste-trinkbrunnen-fuer-katzen/")
  );
  check(
    \`\${slug}: hohe Linkpriorität\`,
    /^  priority:\\s*["']high["']$/m.test(parsed.frontmatter)
  );
}

const comparisonFile = path.join(
  content,
  "comparisons",
  "beste-trinkbrunnen-fuer-katzen.md"
);
const comparison = read(comparisonFile);
const slugs = [
  ...comparison.matchAll(/^  - slug:\\s*["']([^"']+)["']/gm)
].map((match) => match[1]);

const expectedSlugs = [
  "petkit-eversweet-solo-2-fountain",
  "oneisall-3-2l-cordless-fountain",
  "petkit-eversweet-max-2-uvc",
  "petkit-eversweet-ultra",
  "petlibro-stainless-steel-fountain",
  "cat-mate-335-pet-fountain"
];

check("Comparison hat genau 6 Modelle", slugs.length === 6, String(slugs.length));
check("Comparison-Slugs eindeutig", new Set(slugs).size === slugs.length);
check(
  "Comparison enthält erwartete Modelle",
  expectedSlugs.every((slug) => slugs.includes(slug))
);
check("Comparison ohne Großhund-Modell", !comparison.includes("oneisall-7l-dog-water-fountain"));
check(
  "Comparison ohne Nicht-dokumentiert-Chips",
  !/value:\\s*["']Nicht dokumentiert["']/i.test(comparison) &&
    !/^\\s+overrides:\\s*$/m.test(comparison)
);
check(
  "Comparison automatische Erweiterung deaktiviert",
  /automaticRecommendations:\\n\\s+enabled:\\s+false/.test(comparison)
);
check(
  "Comparison-Snippet nennt 6 Modelle",
  comparison.includes("Katzenbrunnen im Vergleich: 6 Modelle für Katzen")
);

const hub = read(path.join(content, "pages", "trinkbrunnen.md"));
check(
  "Hub verlinkt Katzen-Comparison",
  hub.includes("/vergleiche/beste-trinkbrunnen-fuer-katzen/")
);
check(
  "Hub enthält Problemlöser-Tabelle",
  hub.includes("## Katzenbrunnen gezielt auswählen und pflegen")
);
check(
  "Hub verlinkt Mehrkatzen-Ratgeber",
  hub.includes("/trinkbrunnen-fuer-mehrere-katzen/")
);
check(
  "Hub verlinkt Reinigung",
  hub.includes("/katzentrinkbrunnen-richtig-reinigen/")
);

const pageDirectory = path.join(content, "pages");
const inboundSources = fs.readdirSync(pageDirectory)
  .filter((name) => name.endsWith(".md"))
  .filter((name) =>
    read(path.join(pageDirectory, name))
      .includes("/vergleiche/beste-trinkbrunnen-fuer-katzen/")
  );
check(
  "Mindestens 9 Page-Inbounds zur Katzen-Comparison",
  inboundSources.length >= 9,
  String(inboundSources.length)
);

const packageData = JSON.parse(read(path.join(app, "package.json")));
check(
  "npm-Audit-Befehl vorhanden",
  packageData.scripts?.["audit:cat-fountain-serp"] ===
    "node scripts/seo/audit-week5-katzenbrunnen-serp.mjs"
);

const failed = checks.filter((entry) => !entry.ok);
for (const entry of checks) {
  console.log(
    \`\${entry.ok ? "OK" : "FEHLER"}  \${entry.name}\${entry.detail ? \` (\${entry.detail})\` : ""}\`
  );
}

if (failed.length) {
  console.error(\`\\n\${failed.length} Katzenbrunnen-SEO-Prüfung(en) fehlgeschlagen.\`);
  process.exit(1);
}

console.log("\\nWoche-5-Katzenbrunnen-Audit erfolgreich.");
`;

stage(files.audit, auditSource);

console.log(`[${PATCH}] Repository: ${root}`);
console.log(`[${PATCH}] Ändern/erstellen: ${changed.size}`);

if (CHECK) {
  for (const file of changed.keys()) console.log(`ÄNDERN: ${rel(file)}`);
  console.log(`[${PATCH}] Vorprüfung erfolgreich. Es wurde nichts verändert.`);
  process.exit(0);
}

const backupRoot = path.join(
  root,
  ".patch-backups",
  `${PATCH}-${new Date().toISOString().replaceAll(":", "-")}`
);

try {
  for (const [file, state] of changed) {
    if (state.old !== null) {
      const backup = path.join(backupRoot, rel(file));
      fs.mkdirSync(path.dirname(backup), { recursive: true });
      fs.writeFileSync(backup, state.old, "utf8");
    }
  }

  for (const [file, state] of changed) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, state.next, "utf8");
    console.log(`GEÄNDERT: ${rel(file)}`);
  }

  const auditUrl = pathToFileURL(files.audit).href;
  await import(`${auditUrl}?t=${Date.now()}`);

  console.log(`[${PATCH}] Erfolgreich angewendet.`);
  console.log(`[${PATCH}] Backup: ${backupRoot}`);
  console.log("Nächster Schritt: npm run build:pfotentechnik");
  console.log("Danach: npm --prefix apps/pfotentechnik run audit:cat-fountain-serp");
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

  console.error(`[${PATCH}] Alle Änderungen wurden zurückgesetzt.`);
  process.exit(1);
}

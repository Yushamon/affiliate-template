#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-sureflap-cat-flap-connect-25.11.0";
const SLUG = "sureflap-mikrochip-katzenklappe-connect";
const PRODUCT_SOURCE =
  "https://www.surepetcare.com/de-de/haustierklappen/mikrochip-katzenklappe-connect";
const MANUAL_SOURCE =
  "https://www.surepetcare.com/en-gb/pdf?country=81";
const CHECKED_DATE = "2026-08-02";
const CHECKED_AT = "2026-08-02T14:00:00.000Z";

function findRoot(start) {
  let directory = path.resolve(start);

  for (let index = 0; index < 12; index += 1) {
    if (
      fs.existsSync(
        path.join(directory, "apps", "pfotentechnik", "package.json")
      )
    ) {
      return directory;
    }

    const parent = path.dirname(directory);
    if (parent === directory) break;
    directory = parent;
  }

  throw new Error("Repository-Wurzel nicht gefunden.");
}

function log(message) {
  console.log(`[${NAME}] ${message}`);
}

function backup(root, backupRoot, target) {
  if (!fs.existsSync(target)) return;

  const destination = path.join(
    backupRoot,
    path.relative(root, target)
  );

  fs.mkdirSync(path.dirname(destination), {
    recursive: true
  });

  fs.copyFileSync(target, destination);
}

function splitDocument(source) {
  const lines = source.split(/\r?\n/);

  if (lines[0]?.trim() !== "---") {
    throw new Error("Frontmatter-Start fehlt.");
  }

  const end = lines.findIndex(
    (line, index) =>
      index > 0 && line.trim() === "---"
  );

  if (end < 0) {
    throw new Error("Frontmatter-Ende fehlt.");
  }

  return {
    frontmatter: lines.slice(1, end),
    body: lines.slice(end + 1)
  };
}

function serializeDocument(frontmatter, body) {
  const nextBody = [...body];

  while (
    nextBody.length > 0 &&
    !nextBody[nextBody.length - 1].trim()
  ) {
    nextBody.pop();
  }

  return [
    "---",
    ...frontmatter,
    "---",
    ...nextBody,
    ""
  ].join("\n");
}

function headingSections(lines) {
  const sections = [];
  let current = {
    heading: null,
    lines: []
  };

  for (const line of lines) {
    if (line.startsWith("## ")) {
      sections.push(current);
      current = {
        heading: line.slice(3).trim(),
        lines: [line]
      };
    } else {
      current.lines.push(line);
    }
  }

  sections.push(current);
  return sections;
}

function upsertSection(
  body,
  heading,
  contentLines,
  beforeHeadings = []
) {
  const sections = headingSections(body);
  const replacement = {
    heading,
    lines: [
      `## ${heading}`,
      "",
      ...contentLines,
      ""
    ]
  };

  const existingIndex = sections.findIndex(
    (section) => section.heading === heading
  );

  if (existingIndex >= 0) {
    sections[existingIndex] = replacement;
    return sections.flatMap(
      (section) => section.lines
    );
  }

  const insertionIndex = sections.findIndex(
    (section) =>
      section.heading &&
      beforeHeadings.includes(section.heading)
  );

  if (insertionIndex >= 0) {
    sections.splice(
      insertionIndex,
      0,
      replacement
    );
  } else {
    sections.push(replacement);
  }

  return sections.flatMap(
    (section) => section.lines
  );
}

function quoteWindowsArgument(value) {
  const text = String(value);

  if (!/[\s"&|<>^()]/.test(text)) {
    return text;
  }

  return `"${text
    .replaceAll("^", "^^")
    .replaceAll("%", "%%")
    .replaceAll('"', '\\"')}"`;
}

function runNpm(root, args) {
  if (process.platform === "win32") {
    const commandInterpreter =
      process.env.ComSpec ||
      "C:\\Windows\\System32\\cmd.exe";

    const command = [
      "npm",
      ...args
    ]
      .map(quoteWindowsArgument)
      .join(" ");

    execFileSync(
      commandInterpreter,
      ["/d", "/s", "/c", command],
      {
        cwd: root,
        stdio: "inherit",
        windowsHide: true
      }
    );

    return;
  }

  execFileSync(
    "npm",
    args,
    {
      cwd: root,
      stdio: "inherit"
    }
  );
}

function assertIncludes(
  source,
  markers,
  label
) {
  for (const marker of markers) {
    if (!source.includes(marker)) {
      throw new Error(
        `${label}: erwarteter Inhalt fehlt: ${marker}`
      );
    }
  }
}

const ROOT = findRoot(process.cwd());
const APP = path.join(
  ROOT,
  "apps",
  "pfotentechnik"
);

const PRODUCT = path.join(
  APP,
  "src",
  "content",
  "products",
  `${SLUG}.md`
);

const MANUFACTURER = path.join(
  APP,
  "src",
  "content",
  "manufacturers",
  "surefeed.md"
);

const PACKAGE = path.join(
  APP,
  "package.json"
);

const TEST = path.join(
  APP,
  "test",
  "sureflap-cat-flap-connect-25.11.0.test.mjs"
);

const BACKUP = path.join(
  ROOT,
  ".patch-backups",
  `${NAME}-${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}`
);

for (const target of [
  MANUFACTURER,
  PACKAGE
]) {
  if (!fs.existsSync(target)) {
    throw new Error(
      `Erwartete Datei fehlt: ${path.relative(ROOT, target)}`
    );
  }
}

const packageJson = JSON.parse(
  fs.readFileSync(PACKAGE, "utf8")
);

const requiredScripts = [
  "audit:products:strict",
  "audit:product-standard-3",
  "audit:internal-link-targets:strict",
  "build"
];

for (const script of requiredScripts) {
  if (!packageJson.scripts?.[script]) {
    throw new Error(
      `package.json: erforderliches npm-Skript fehlt: ${script}`
    );
  }
}

const productContent = `---
type: product
title: "SureFlap Mikrochip Katzenklappe Connect"
slug: "${SLUG}"
description: "App-fähige Mikrochip-Katzenklappe mit DualScan-Zutrittsregeln, Fernverriegelung und Aktivitätsmeldungen über den zusätzlich erforderlichen Sure Petcare Hub."
manufacturer:
  name: "SureFlap"
  slug: "surefeed"
category:
  key: "katzenklappen"
  label: "Katzenklappen"
publishedAt: "${CHECKED_DATE}"
updatedAt: "${CHECKED_DATE}"
productStatus: "active"
editorialStatus: "research"
recommendationStatus: "pending"
maintenanceStatus: "current"
price:
  currency: "EUR"
  status: "unknown"
  checkedAt: "${CHECKED_AT}"
  source:
    id: "sure-petcare-de"
    label: "Sure Petcare Deutschland"
    type: "manual"
priceState: "unknown"
priceUpdated: "${CHECKED_AT}"
affiliateAvailable: false
availability: "unknown"
availabilityReason: "Einzelgerät und Bundle mit Hub werden getrennt angeboten; die Herstellerseite zeigt zugleich widersprüchliche Kaufsignale. Aktuellen Preis und Lieferstatus prüfen."
availabilityUpdated: "${CHECKED_AT}"
decision:
  bestFor:
    - katze
    - mehrere-tiere
    - mikrochip
    - app
    - zugangskontrolle
    - fernverriegelung
    - sperrzeiten
    - aktivitaetsprotokoll
  attention:
    - Sure Petcare Hub für App-Verbindung und Fernfunktionen erforderlich
    - Einzelgerät und Bundle mit Hub sind getrennte Kaufvarianten
    - Öffnungsmaß von 142 × 120 mm vor dem Kauf mit der Katze abgleichen
    - Glas- und Wandeinbau können zusätzliches Montagezubehör erfordern
    - Preis und Lieferbarkeit aktuell prüfen
review:
  summary: "Mikrochip-Katzenklappe mit individuellen Ein- und Austrittsrechten; App-Steuerung und Aktivitätsprotokolle funktionieren nur über den Sure Petcare Hub."
  verdict: "Eine technisch umfassende Zugangslösung für Mehrkatzenhaushalte, wenn individuelle DualScan-Regeln, Fernverriegelung und Aktivitätsmeldungen benötigt werden. Eine redaktionelle Kaufempfehlung und ein Score bleiben bis zur vollständigen Vergleichsbewertung offen."
strengths:
  - "DualScan-Technologie mit individuellen Ein- und Austrittsrechten pro Tier"
  - "Fernverriegelung, Sperrzeiten und Berechtigungsverwaltung über die Sure Petcare App"
  - "Push-Mitteilungen und Statistiken zu Kommen, Gehen sowie Innen- und Außenstatus"
  - "Einbau in Türen, Glas und Wände möglich"
weaknesses:
  - "Sure Petcare Hub für sämtliche App- und Fernfunktionen erforderlich"
  - "Hub ist beim Einzelgerät nicht enthalten"
  - "Glas- und Wandeinbau können Adapter beziehungsweise Tunnelverlängerungen benötigen"
  - "Hersteller nennt rund sechs Monate Batterielaufzeit statt Netzbetrieb"
specs:
  - label: "Modellkennung"
    value: "iDSCF"
  - label: "Klappenöffnung"
    value: "142 × 120 mm, engster Durchgangspunkt"
  - label: "Ausschnitt Tür oder Wand"
    value: "165 × 171 mm"
  - label: "Glasausschnitt"
    value: "Rund 212 mm ideal; laut Hersteller bis 260 mm möglich"
  - label: "Außenrahmen"
    value: "210 × 210 mm"
  - label: "Tunneltiefe"
    value: "70 mm"
  - label: "Stromversorgung"
    value: "4 AA-Batterien, nicht enthalten"
  - label: "Herstellerangabe Batterielaufzeit"
    value: "Bis zu 6 Monate"
  - label: "Hub"
    value: "Sure Petcare Hub für App-Verbindung erforderlich; beim Einzelgerät separat"
  - label: "App-Funktionen"
    value: "Aktivitätsmeldungen, Innen-/Außenstatus, Statistiken, Fernverriegelung, Sperrzeiten und Haushaltsberechtigungen"
  - label: "Zutrittssteuerung"
    value: "DualScan mit individuellen Ein- und Austrittsrechten"
  - label: "Mikrochip"
    value: "Kompatibel mit gängigen Mikrochips; RFID-Halsbandanhänger als Alternative"
  - label: "Einbauarten"
    value: "Türen, Glas und Wände"
decisionFacts:
  - label: "Hub und App"
    value: "Sure Petcare Hub erforderlich"
    consequence: "Die Klappe kann Tiere per Mikrochip erkennen; Fernverriegelung, Push-Mitteilungen, Statistiken und App-geänderte Zutrittsregeln benötigen zusätzlich den mit dem Router verbundenen Hub."
  - label: "Kaufvariante"
    value: "Einzelgerät oder Bundle"
    consequence: "Wer bereits einen kompatiblen Sure Petcare Hub besitzt, kann das Einzelgerät wählen. Beim ersten Connect-Produkt müssen Bundle oder separater Hub eingeplant werden."
  - label: "Öffnungsmaß"
    value: "142 × 120 mm"
    consequence: "Das ist der engste Durchgangspunkt. Die Körpergröße der Katze sollte vor Bestellung und Einbau praktisch abgeglichen werden."
  - label: "DualScan"
    value: "Ein- und Austritt je Tier"
    consequence: "Für jedes eingelernte Tier lassen sich unterschiedliche Richtungen freigeben oder sperren; das ist mehr als eine reine Fremdtierabwehr."
  - label: "Batteriebetrieb"
    value: "4 AA, bis zu 6 Monate"
    consequence: "Es wird kein Stromanschluss an der Klappe benötigt, Batteriezustand und regelmäßiger Wechsel bleiben aber Teil des Betriebs."
  - label: "Einbau"
    value: "Tür, Glas oder Wand"
    consequence: "Türen benötigen laut Hersteller kein zusätzliches Montagezubehör; Glas und Wand können Adapter oder Tunnelverlängerungen erfordern."
  - label: "Preis und Verfügbarkeit"
    value: "Aktuell prüfen"
    consequence: "Einzelgerät und Hub-Bundle werden getrennt angeboten und können unterschiedliche Bestände haben. Deshalb wird kein statischer Preis im Fließtext festgeschrieben."
evidence:
  manufacturerDocumentation:
    - "Sure Petcare Produktseite: Funktionen, Maße, Batterie, Hub-Abhängigkeit und Montage"
    - "Sure Petcare Handbuchübersicht: Modellkennung iDSCF"
  technicalDocumentation:
    - "Öffnung 142 × 120 mm"
    - "Tür-/Wandausschnitt 165 × 171 mm"
    - "Glasausschnitt 212 bis 260 mm"
  comparisonAnalysis:
    - "Abgrenzung Einzelgerät, Hub und Bundle"
    - "Abgrenzung lokaler Mikrochipfunktion von App- und Fernfunktionen"
faq:
  - question: "Braucht die SureFlap Mikrochip Katzenklappe Connect immer einen Hub?"
    answer: "Für die Verbindung mit der Sure Petcare App, Fernverriegelung, Push-Mitteilungen, Statistiken und App-Änderungen an Zutrittsregeln ist ein Sure Petcare Hub erforderlich. Wer bereits einen kompatiblen Hub besitzt, kann das Einzelgerät verwenden."
  - question: "Ist der Hub beim Einzelgerät enthalten?"
    answer: "Nein. Sure Petcare bietet das Einzelgerät und ein Bundle mit Hub getrennt an."
  - question: "Wie groß ist die Öffnung für die Katze?"
    answer: "Der engste Durchgangspunkt misst laut Hersteller 142 mm in der Breite und 120 mm in der Höhe."
  - question: "Kann die Katzenklappe in Glas eingebaut werden?"
    answer: "Ja. Der Hersteller nennt einen runden Glasausschnitt von idealerweise 212 mm und unterstützt mit Montageadapter Öffnungen bis 260 mm."
  - question: "Kann die Katzenklappe in eine Wand eingebaut werden?"
    answer: "Ja. Je nach Wandstärke können Montageadapter und Tunnelverlängerungen erforderlich sein."
  - question: "Welche Batterien werden benötigt?"
    answer: "Die Klappe verwendet vier AA-Batterien. Sure Petcare nennt eine Batterielebensdauer von bis zu sechs Monaten; die Batterien sind nicht enthalten."
  - question: "Was bedeutet DualScan?"
    answer: "DualScan erlaubt individuelle Ein- und Austrittsberechtigungen für jedes eingelernte Tier. So kann eine Katze beispielsweise hinein-, aber vorübergehend nicht hinausgehen."
  - question: "Welche Aktivitäten zeigt die App?"
    answer: "Die App kann Push-Mitteilungen und Statistiken zum Kommen und Gehen sowie zum Innen- oder Außenstatus der Tiere anzeigen."
  - question: "Kann die Klappe aus der Ferne verriegelt werden?"
    answer: "Ja, bei Verbindung über den Sure Petcare Hub lässt sie sich per App ver- und entriegeln; außerdem können automatische Sperrzeiten festgelegt werden."
  - question: "Funktioniert die Klappe ohne Mikrochip?"
    answer: "Als Alternative kann ein kompatibler SureFlap-RFID-Halsbandanhänger verwendet werden."
metadata:
  version: 1.0.0
  normalizedAt: "${CHECKED_DATE}"
  policy: "Nur belegte Herstellerangaben; kein Editorial Score, keine Kaufempfehlung und kein statischer Preis vor vollständiger Vergleichsbewertung"
---

## Kurz eingeordnet

Die SureFlap Mikrochip Katzenklappe Connect verbindet individuelle Mikrochip-Zutrittsregeln mit App-Funktionen. Die lokale Tiererkennung gehört zur Klappe. Für Fernverriegelung, Aktivitätsmeldungen, Statistiken und Änderungen per App ist zusätzlich der Sure Petcare Hub erforderlich.

## Modell, Hub und Bundle

Die Handbuchübersicht führt das Modell unter der Kennung **iDSCF**. Sure Petcare verkauft das Einzelgerät und ein Bundle mit Hub getrennt. Wer bereits einen kompatiblen Sure Petcare Hub besitzt, kann die Katzenklappe separat verwenden. Beim ersten Connect-Produkt müssen Hub oder Bundle in Kosten und Einrichtung eingeplant werden.

## Öffnungsmaß und Einbau

Die Klappenöffnung misst **142 × 120 mm** und ist der engste Durchgangspunkt für die Katze. Für den Einbau in Tür oder Wand nennt der Hersteller einen rechteckigen Ausschnitt von 165 × 171 mm. In Glas ist ein runder Ausschnitt von 212 mm ideal; mit Montageadapter werden laut Hersteller Öffnungen bis 260 mm unterstützt.

Der Einbau ist in Türen, Glas und Wände möglich. Bei einer normalen Tür ist laut Sure Petcare kein zusätzliches Montagezubehör nötig. Für Glas oder Wand können Montageadapter und bei dicken Wänden Tunnelverlängerungen erforderlich sein.

## App, DualScan und Aktivitätsdaten

Über DualScan lassen sich für jedes Tier getrennte Ein- und Austrittsberechtigungen festlegen. Mit Hub und App sind zusätzlich Fernverriegelung, automatische Sperrzeiten, Push-Mitteilungen, Aktivitätsstatistiken und der Innen- beziehungsweise Außenstatus verfügbar.

Diese Daten helfen dabei, Routinen und unerwartete Veränderungen zu erkennen. Sie ersetzen keine tierärztliche Beurteilung.

## Batterie

Die Katzenklappe wird mit vier AA-Batterien betrieben. Sure Petcare nennt eine Batterielebensdauer von bis zu sechs Monaten. Batterien sind nicht enthalten.

## Preis und Verfügbarkeit

Einzelgerät und Bundle mit Hub werden getrennt angeboten. Da die Herstellerseite gleichzeitig unterschiedliche beziehungsweise widersprüchliche Kaufsignale zeigt und Händlerbestände abweichen können, wird hier kein statischer Preis genannt. Preis und Lieferbarkeit gelten als **aktuell zu prüfen**.

## Quellenlage

Die technischen Angaben wurden am 2. August 2026 mit der [deutschen Sure-Petcare-Produktseite](${PRODUCT_SOURCE}) und der [Sure-Petcare-Handbuchübersicht](${MANUAL_SOURCE}) abgeglichen. Ein Editorial Score und eine redaktionelle Kaufempfehlung bleiben bis zur vollständigen Vergleichsbewertung offen.
`;

const originalProduct = fs.existsSync(PRODUCT)
  ? fs.readFileSync(PRODUCT, "utf8")
  : null;

if (originalProduct === null) {
  fs.writeFileSync(PRODUCT, productContent);
  log(`Geschrieben: ${path.relative(ROOT, PRODUCT)}`);
} else if (originalProduct === productContent) {
  log(`Bereits aktuell: ${path.relative(ROOT, PRODUCT)}`);
} else {
  const requiredExistingMarkers = [
    "Modellkennung",
    "iDSCF",
    "142 × 120 mm",
    "Sure Petcare Hub",
    "DualScan",
    PRODUCT_SOURCE,
    MANUAL_SOURCE
  ];

  const isCompatiblePartial = requiredExistingMarkers.some(
    (marker) => originalProduct.includes(marker)
  );

  if (!isCompatiblePartial) {
    throw new Error(
      "Zielprodukt existiert bereits mit einem widersprüchlichen Inhalt. Automatisches Überschreiben abgebrochen."
    );
  }

  backup(ROOT, BACKUP, PRODUCT);
  fs.writeFileSync(PRODUCT, productContent);
  log(`Teilstand vereinheitlicht: ${path.relative(ROOT, PRODUCT)}`);
}

const originalManufacturer = fs.readFileSync(
  MANUFACTURER,
  "utf8"
);

const manufacturerDocument =
  splitDocument(originalManufacturer);

let manufacturerBody = [
  ...manufacturerDocument.body
];

manufacturerBody = upsertSection(
  manufacturerBody,
  "Markenarchitektur: Sure Petcare, SureFlap und SureFeed",
  [
    "**Sure Petcare** ist die übergreifende Marke und Plattform für die vernetzten Haustierprodukte sowie die gemeinsame App. Das Unternehmen dahinter ist SureFlap Ltd., das laut eigener Anbieterkennzeichnung unter dem Namen Sure Petcare auftritt.",
    "",
    "**SureFlap** bezeichnet vor allem die Katzen- und Haustierklappen des Herstellers. **SureFeed** wird für Fütterungsprodukte wie Mikrochip-Futterautomaten verwendet. Beide Produktlinien können bei Connect-Modellen denselben Sure Petcare Hub und dieselbe Sure Petcare App nutzen.",
    "",
    "PfotenTechnik bündelt die Produkte deshalb weiterhin auf dieser Herstellerseite, statt getrennte und inhaltlich weitgehend doppelte Herstellerprofile für SureFeed und SureFlap anzulegen."
  ],
  ["Produkte", "Quellen"]
);

manufacturerBody = upsertSection(
  manufacturerBody,
  "Katzenklappen und Zugangskontrolle",
  [
    "Mit der SureFlap Mikrochip Katzenklappe Connect erweitert sich das Herstellerprofil über Fütterungsprodukte hinaus um app-gestützte Zugangskontrolle. Die Produktlinie kombiniert Mikrochip-Erkennung, individuelle DualScan-Regeln und optionale Fernfunktionen über den Sure Petcare Hub.",
    "",
    `[SureFlap Mikrochip Katzenklappe Connect ansehen](/produkt/${SLUG}/)`
  ],
  ["Produkte", "Quellen"]
);

const nextManufacturer = serializeDocument(
  manufacturerDocument.frontmatter,
  manufacturerBody
);

if (nextManufacturer !== originalManufacturer) {
  backup(ROOT, BACKUP, MANUFACTURER);
  fs.writeFileSync(
    MANUFACTURER,
    nextManufacturer
  );
  log(`Geändert: ${path.relative(ROOT, MANUFACTURER)}`);
} else {
  log(`Bereits aktuell: ${path.relative(ROOT, MANUFACTURER)}`);
}

const testSource = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.."
);

const APP = path.join(
  ROOT,
  "apps",
  "pfotentechnik"
);

const PRODUCT = path.join(
  APP,
  "src/content/products/${SLUG}.md"
);

const MANUFACTURER = path.join(
  APP,
  "src/content/manufacturers/surefeed.md"
);

const product = fs.readFileSync(
  PRODUCT,
  "utf8"
);

const manufacturer = fs.readFileSync(
  MANUFACTURER,
  "utf8"
);

test("Produktseite enthält Modellkennung und Öffnungsmaße", () => {
  assert.match(product, /Modellkennung/);
  assert.match(product, /iDSCF/);
  assert.match(product, /142 × 120 mm/);
  assert.match(product, /165 × 171 mm/);
  assert.match(product, /212 mm/);
});

test("Hub-Abhängigkeit und Bundle-Abgrenzung sind eindeutig", () => {
  assert.match(product, /Sure Petcare Hub für App-Verbindung/);
  assert.match(product, /Einzelgerät und Bundle mit Hub/);
  assert.match(product, /bereits einen kompatiblen Sure Petcare Hub/);
});

test("Batterie, App-Funktionen und DualScan sind belegt", () => {
  assert.match(product, /4 AA-Batterien/);
  assert.match(product, /bis zu sechs Monaten/i);
  assert.match(product, /Fernverriegelung/);
  assert.match(product, /automatische Sperrzeiten/);
  assert.match(product, /Aktivitätsstatistiken/);
  assert.match(product, /DualScan/);
});

test("Einbauarten sind widerspruchsfrei beschrieben", () => {
  assert.match(product, /Türen, Glas und Wände/);
  assert.match(product, /Montageadapter/);
  assert.match(product, /Tunnelverlängerungen/);
});

test("Preis, Verfügbarkeit, Score und Empfehlung werden nicht erfunden", () => {
  assert.match(product, /^priceState: "unknown"$/m);
  assert.match(product, /^availability: "unknown"$/m);
  assert.doesNotMatch(product, /^score:/m);
  assert.doesNotMatch(product, /^recommendation:/m);

  const priceSection =
    product.match(
      /## Preis und Verfügbarkeit[\\s\\S]*?(?=\\n## |$)/
    )?.[0] ?? "";

  assert.doesNotMatch(
    priceSection,
    /\\b(?:160|254)[,.]\\d{2}\\s*€/
  );
});

test("Herstellerseite erklärt die Markenarchitektur zentral", () => {
  assert.match(
    manufacturer,
    /Markenarchitektur: Sure Petcare, SureFlap und SureFeed/
  );
  assert.match(
    manufacturer,
    /SureFlap Ltd/
  );
  assert.match(
    manufacturer,
    /gemeinsame App/
  );
  assert.match(
    manufacturer,
    /statt getrennte.*Herstellerprofile/s
  );
  assert.match(
    manufacturer,
    /\\/produkt\\/${SLUG}\\//
  );
});

test("Primärquellen sind dokumentiert", () => {
  assert.match(
    product,
    /surepetcare\\.com\\/de-de\\/haustierklappen\\/mikrochip-katzenklappe-connect/
  );
  assert.match(
    product,
    /surepetcare\\.com\\/en-gb\\/pdf\\?country=81/
  );
});
`;

if (
  !fs.existsSync(TEST) ||
  fs.readFileSync(TEST, "utf8") !== testSource
) {
  backup(ROOT, BACKUP, TEST);
  fs.writeFileSync(TEST, testSource);
  log(`Geschrieben: ${path.relative(ROOT, TEST)}`);
} else {
  log(`Bereits aktuell: ${path.relative(ROOT, TEST)}`);
}

packageJson.scripts ??= {};

packageJson.scripts[
  "test:sureflap-cat-flap-connect"
] =
  "node --test test/sureflap-cat-flap-connect-25.11.0.test.mjs";

const nextPackage = JSON.stringify(
  packageJson,
  null,
  2
) + "\n";

const currentPackage =
  fs.readFileSync(PACKAGE, "utf8");

if (nextPackage !== currentPackage) {
  backup(ROOT, BACKUP, PACKAGE);
  fs.writeFileSync(PACKAGE, nextPackage);
  log(`Geändert: ${path.relative(ROOT, PACKAGE)}`);
} else {
  log(`Bereits aktuell: ${path.relative(ROOT, PACKAGE)}`);
}

const finalProduct =
  fs.readFileSync(PRODUCT, "utf8");

const finalManufacturer =
  fs.readFileSync(MANUFACTURER, "utf8");

assertIncludes(
  finalProduct,
  [
    "iDSCF",
    "142 × 120 mm",
    "4 AA-Batterien",
    "DualScan",
    "Türen, Glas und Wände",
    'priceState: "unknown"',
    'availability: "unknown"',
    PRODUCT_SOURCE,
    MANUAL_SOURCE
  ],
  "Produktseite"
);

assertIncludes(
  finalManufacturer,
  [
    "Markenarchitektur: Sure Petcare, SureFlap und SureFeed",
    "SureFlap Ltd.",
    `/produkt/${SLUG}/`
  ],
  "Herstellerseite"
);

execFileSync(
  process.execPath,
  [
    "--check",
    fileURLToPath(import.meta.url)
  ],
  {
    cwd: ROOT,
    stdio: "inherit",
    windowsHide: true
  }
);

log("Fachliche Ergebnisvalidierung bestanden.");

runNpm(
  ROOT,
  [
    "--workspace",
    "apps/pfotentechnik",
    "run",
    "test:sureflap-cat-flap-connect"
  ]
);

runNpm(
  ROOT,
  [
    "--workspace",
    "apps/pfotentechnik",
    "run",
    "audit:products:strict"
  ]
);

runNpm(
  ROOT,
  [
    "--workspace",
    "apps/pfotentechnik",
    "run",
    "audit:product-standard-3"
  ]
);

runNpm(
  ROOT,
  [
    "--workspace",
    "apps/pfotentechnik",
    "run",
    "audit:internal-link-targets:strict"
  ]
);

runNpm(
  ROOT,
  [
    "--workspace",
    "apps/pfotentechnik",
    "run",
    "build"
  ]
);

log(
  "Tests, Audits und vollständiger Build erfolgreich."
);
log("Fertig.");

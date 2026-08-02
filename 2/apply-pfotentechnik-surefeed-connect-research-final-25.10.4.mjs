#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-surefeed-connect-research-final-25.10.4";
const SLUG = "surefeed-microchip-pet-feeder-connect";
const SOURCE_URL = "https://www.surepetcare.com/de-de/futterautomat/microchip-pet-feeder-connect";
const CHECKED_AT = "2026-08-02T13:00:00.000Z";
const CHECKED_DATE = "2026-08-02";

function findRoot(start) {
  let directory = path.resolve(start);

  for (let index = 0; index < 12; index += 1) {
    if (fs.existsSync(path.join(directory, "apps", "pfotentechnik", "package.json"))) {
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

  const destination = path.join(backupRoot, path.relative(root, target));
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(target, destination);
}

function splitMarkdownDocument(source) {
  const lines = source.split(/\r?\n/);

  if (lines[0]?.trim() !== "---") {
    throw new Error("Frontmatter-Start fehlt.");
  }

  const closingIndex = lines.findIndex(
    (line, index) => index > 0 && line.trim() === "---"
  );

  if (closingIndex < 0) {
    throw new Error("Frontmatter-Ende fehlt.");
  }

  return {
    frontmatterLines: lines.slice(1, closingIndex),
    bodyLines: lines.slice(closingIndex + 1)
  };
}

function topLevelKey(line) {
  if (!line || /^\s/.test(line)) return null;
  const separator = line.indexOf(":");
  if (separator <= 0) return null;
  const key = line.slice(0, separator).trim();
  return /^[A-Za-z0-9_-]+$/.test(key) ? key : null;
}

function findTopLevelRange(lines, key) {
  const start = lines.findIndex((line) => topLevelKey(line) === key);
  if (start < 0) return null;

  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (topLevelKey(lines[index])) {
      end = index;
      break;
    }
  }

  return { start, end };
}

function readTopLevelScalar(lines, key) {
  const range = findTopLevelRange(lines, key);
  if (!range) return undefined;

  const line = lines[range.start];
  const separator = line.indexOf(":");
  return line.slice(separator + 1).trim();
}

function setTopLevelScalar(lines, key, rawValue) {
  const range = findTopLevelRange(lines, key);
  const nextLine = `${key}: ${rawValue}`;

  if (!range) {
    return [...lines, nextLine];
  }

  return [
    ...lines.slice(0, range.start),
    nextLine,
    ...lines.slice(range.end)
  ];
}

function replaceTopLevelBlock(lines, key, blockLines) {
  const range = findTopLevelRange(lines, key);

  if (!range) {
    return [...lines, ...blockLines];
  }

  return [
    ...lines.slice(0, range.start),
    ...blockLines,
    ...lines.slice(range.end)
  ];
}

function normalizeBodyHeadingSections(bodyLines) {
  const sections = [];
  let current = { heading: null, lines: [] };

  for (const line of bodyLines) {
    if (line.startsWith("## ")) {
      sections.push(current);
      current = { heading: line.slice(3).trim(), lines: [line] };
    } else {
      current.lines.push(line);
    }
  }

  sections.push(current);
  return sections;
}

function upsertBodySection(bodyLines, heading, paragraphLines, beforeHeadings = []) {
  const sections = normalizeBodyHeadingSections(bodyLines);
  const replacement = {
    heading,
    lines: [`## ${heading}`, "", ...paragraphLines, ""]
  };

  const existingIndex = sections.findIndex((section) => section.heading === heading);

  if (existingIndex >= 0) {
    sections[existingIndex] = replacement;
    return sections.flatMap((section) => section.lines);
  }

  const insertIndex = sections.findIndex(
    (section) => section.heading && beforeHeadings.includes(section.heading)
  );

  if (insertIndex >= 0) {
    sections.splice(insertIndex, 0, replacement);
  } else {
    sections.push(replacement);
  }

  return sections.flatMap((section) => section.lines);
}

function trimBlankLines(lines) {
  let start = 0;
  let end = lines.length;

  while (start < end && !lines[start].trim()) start += 1;
  while (end > start && !lines[end - 1].trim()) end -= 1;

  return lines.slice(start, end);
}

function serializeDocument(frontmatterLines, bodyLines) {
  return [
    "---",
    ...frontmatterLines,
    "---",
    ...trimBlankLines(bodyLines),
    ""
  ].join("\n");
}

function itemBounds(lines, slug) {
  const start = lines.findIndex((line) => line.trim() === `- slug: ${slug}`);
  if (start < 0) return null;

  const baseIndent = lines[start].match(/^\s*/)?.[0].length ?? 0;
  let end = lines.length;

  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    const indent = line.match(/^\s*/)?.[0].length ?? 0;

    if (
      line.trim().startsWith("- slug:") &&
      indent === baseIndent
    ) {
      end = index;
      break;
    }

    if (line.trim() && indent < baseIndent) {
      end = index;
      break;
    }
  }

  return { start, end, baseIndent };
}

function upsertComparisonItemRecommendation(frontmatterLines) {
  const bounds = itemBounds(frontmatterLines, SLUG);
  if (!bounds) return { lines: frontmatterLines, found: false };

  const fieldIndent = " ".repeat(bounds.baseIndent + 2);
  const valueIndent = " ".repeat(bounds.baseIndent + 4);

  let recommendationStart = -1;
  for (let index = bounds.start + 1; index < bounds.end; index += 1) {
    if (frontmatterLines[index].startsWith(`${fieldIndent}recommendation:`)) {
      recommendationStart = index;
      break;
    }
  }

  const replacement = [
    `${fieldIndent}recommendation: >-`,
    `${valueIndent}Mikrochipgesteuerter Einzelnapf für getrennte Rationen und Fressprotokolle. Die App-Auswertung`,
    `${valueIndent}benötigt einen Sure Petcare Hub. Wer noch keinen kompatiblen Hub besitzt, braucht das Bundle oder`,
    `${valueIndent}einen separat erhältlichen Hub. Preis und Lieferbarkeit deshalb aktuell beim Anbieter prüfen.`
  ];

  if (recommendationStart >= 0) {
    let recommendationEnd = recommendationStart + 1;

    while (recommendationEnd < bounds.end) {
      const line = frontmatterLines[recommendationEnd];
      if (line.startsWith(fieldIndent) && !line.startsWith(valueIndent)) break;
      recommendationEnd += 1;
    }

    return {
      found: true,
      lines: [
        ...frontmatterLines.slice(0, recommendationStart),
        ...replacement,
        ...frontmatterLines.slice(recommendationEnd)
      ]
    };
  }

  let insertionIndex = bounds.start + 1;
  for (let index = bounds.start + 1; index < bounds.end; index += 1) {
    if (
      frontmatterLines[index].startsWith(`${fieldIndent}label:`) ||
      frontmatterLines[index].startsWith(`${fieldIndent}type:`)
    ) {
      insertionIndex = index + 1;
    }
  }

  return {
    found: true,
    lines: [
      ...frontmatterLines.slice(0, insertionIndex),
      ...replacement,
      ...frontmatterLines.slice(insertionIndex)
    ]
  };
}

function quoteWindowsArgument(value) {
  const text = String(value);
  if (!/[\s"&|<>^()]/.test(text)) return text;

  return `"${text
    .replaceAll("^", "^^")
    .replaceAll("%", "%%")
    .replaceAll('"', '\\"')}"`;
}

function runNpm(root, args) {
  if (process.platform === "win32") {
    const commandInterpreter =
      process.env.ComSpec || "C:\\Windows\\System32\\cmd.exe";
    const command = ["npm", ...args].map(quoteWindowsArgument).join(" ");

    execFileSync(commandInterpreter, ["/d", "/s", "/c", command], {
      cwd: root,
      stdio: "inherit",
      windowsHide: true
    });
    return;
  }

  execFileSync("npm", args, {
    cwd: root,
    stdio: "inherit"
  });
}

function assertIncludes(source, markers, label) {
  for (const marker of markers) {
    if (!source.includes(marker)) {
      throw new Error(`${label}: erwarteter Inhalt fehlt: ${marker}`);
    }
  }
}

const ROOT = findRoot(process.cwd());
const APP = path.join(ROOT, "apps", "pfotentechnik");
const PRODUCT = path.join(
  APP,
  "src",
  "content",
  "products",
  `${SLUG}.md`
);
const COMPARISON_DIR = path.join(
  APP,
  "src",
  "content",
  "comparisons"
);
const PACKAGE = path.join(APP, "package.json");
const TEST = path.join(
  APP,
  "test",
  "surefeed-connect-research-final-25.10.4.test.mjs"
);
const BACKUP = path.join(
  ROOT,
  ".patch-backups",
  `${NAME}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

if (!fs.existsSync(PRODUCT)) {
  throw new Error(`Produktdatei fehlt: ${path.relative(ROOT, PRODUCT)}`);
}
if (!fs.existsSync(COMPARISON_DIR)) {
  throw new Error(`Vergleichsverzeichnis fehlt: ${path.relative(ROOT, COMPARISON_DIR)}`);
}
if (!fs.existsSync(PACKAGE)) {
  throw new Error(`package.json fehlt: ${path.relative(ROOT, PACKAGE)}`);
}

const packageJsonBefore = JSON.parse(fs.readFileSync(PACKAGE, "utf8"));
const availableScripts = packageJsonBefore.scripts ?? {};

const requiredExistingScripts = [
  "audit:products:strict",
  "comparison:data:audit:strict",
  "product-standard-3:release:no-build",
  "build"
];

for (const script of requiredExistingScripts) {
  if (!availableScripts[script]) {
    throw new Error(`package.json: erforderliches npm-Skript fehlt: ${script}`);
  }
}

const originalProduct = fs.readFileSync(PRODUCT, "utf8");
const productDocument = splitMarkdownDocument(originalProduct);

const originalScore = readTopLevelScalar(productDocument.frontmatterLines, "score");
const originalRecommendation = readTopLevelScalar(
  productDocument.frontmatterLines,
  "recommendation"
);

if (originalScore === undefined) {
  throw new Error("Produktdatensatz enthält keinen Editorial Score.");
}
if (originalRecommendation === undefined) {
  throw new Error("Produktdatensatz enthält keine redaktionelle Empfehlung.");
}

let productFrontmatter = [...productDocument.frontmatterLines];

productFrontmatter = setTopLevelScalar(
  productFrontmatter,
  "updatedAt",
  `"${CHECKED_DATE}"`
);

productFrontmatter = replaceTopLevelBlock(
  productFrontmatter,
  "price",
  [
    "price:",
    '  currency: "EUR"',
    '  status: "unknown"',
    `  checkedAt: "${CHECKED_AT}"`,
    "  source:",
    '    id: "sure-petcare-de"',
    '    label: "Sure Petcare Deutschland"',
    '    type: "manufacturer"'
  ]
);

productFrontmatter = setTopLevelScalar(
  productFrontmatter,
  "priceState",
  '"unknown"'
);
productFrontmatter = setTopLevelScalar(
  productFrontmatter,
  "priceUpdated",
  `"${CHECKED_AT}"`
);
productFrontmatter = setTopLevelScalar(
  productFrontmatter,
  "availability",
  '"unknown"'
);
productFrontmatter = setTopLevelScalar(
  productFrontmatter,
  "availabilityReason",
  '"Einzelgerät, Hub und Bundle haben getrennte Kaufsignale; Hersteller- und Händlerbestand können abweichen. Aktuellen Preis und Lieferstatus prüfen."'
);
productFrontmatter = setTopLevelScalar(
  productFrontmatter,
  "availabilityUpdated",
  `"${CHECKED_AT}"`
);

productFrontmatter = replaceTopLevelBlock(
  productFrontmatter,
  "decision",
  [
    "decision:",
    "  bestFor:",
    "    - katze",
    "    - mehrere-tiere",
    "    - app",
    "    - portionierung",
    "    - nassfutter",
    "    - trockenfutter",
    "    - premium",
    "    - chip-erkennung",
    "    - batteriebetrieb",
    "  attention:",
    "    - Sure Petcare Hub für App-Verbindung und Fressprotokolle erforderlich",
    "    - Einzelgerät und Bundle sind getrennte Kaufvarianten",
    "    - Keine zeitgesteuerte Vorratsausgabe",
    "    - Preis und Lieferbarkeit aktuell prüfen"
  ]
);

productFrontmatter = replaceTopLevelBlock(
  productFrontmatter,
  "specs",
  [
    "specs:",
    "  - label: Futterart",
    "    value: Nass- und Trockenfutter",
    "  - label: App-Verbindung",
    "    value: Ausschließlich über einen Sure Petcare Hub",
    "  - label: Hub und Bundle",
    "    value: Vorhandener kompatibler Hub nutzbar; sonst Bundle oder separater Hub erforderlich",
    "  - label: App-Auswertung",
    "    value: Fressmenge, Häufigkeit, Dauer und Tageszeiten; Push-Mitteilungen bei Fressereignissen",
    "  - label: Portionierung",
    "    value: Manuelles Befüllen mit integrierter Waage und LED-Anzeige auf 1 Gramm genau",
    "  - label: Zugang",
    "    value: Mikrochip oder kompatibler RFID-Halsbandanhänger",
    "  - label: Kapazität",
    "    value: 400 ml",
    "  - label: Stromversorgung",
    "    value: 4 C-Batterien",
    "  - label: Automatische Futterausgabe",
    "    value: Nein",
    "  - label: Kamera",
    "    value: Nein",
    "  - label: Geeignet für",
    "    value: Katzen und kleine Hunde mit individuell geschützter Ration"
  ]
);

productFrontmatter = replaceTopLevelBlock(
  productFrontmatter,
  "decisionFacts",
  [
    "decisionFacts:",
    '  - label: "Hub und App"',
    '    value: "Sure Petcare Hub erforderlich"',
    '    consequence: "Mikrochipzugang und Portionswaage arbeiten am Gerät; App-Protokolle, Push-Mitteilungen und die Auswertung der Fressgewohnheiten benötigen zusätzlich den mit dem Router verbundenen Hub."',
    '  - label: "Kaufvariante"',
    '    value: "Einzelgerät oder Bundle"',
    '    consequence: "Wer bereits einen kompatiblen Sure Petcare Hub besitzt, kann das Einzelgerät verwenden. Beim ersten Connect-Produkt müssen Bundle oder separater Hub in Preis und Einrichtung eingeplant werden."',
    '  - label: "App-Auswertung"',
    '    value: "Menge, Häufigkeit, Dauer und Tageszeit"',
    '    consequence: "Die App dokumentiert individuelle Fressereignisse und kann Veränderungen sichtbar machen; sie ersetzt keine tierärztliche Bewertung auffälliger Fressmuster."',
    '  - label: "Portionierung"',
    '    value: "Auf 1 Gramm genau"',
    '    consequence: "Die integrierte Waage und LED-Anzeige helfen beim manuellen Befüllen einer festgelegten Portion; das Gerät gibt Futter nicht zeitgesteuert aus."',
    '  - label: "Futterart und Volumen"',
    '    value: "Nass- und Trockenfutter, 400 ml"',
    '    consequence: "Der geschützte Napf eignet sich für individuelle Rationen, besitzt aber keinen gekühlten Vorrat und keine automatische Nachfüllung."',
    '  - label: "Preis und Verfügbarkeit"',
    '    value: "Aktuell prüfen"',
    '    consequence: "Einzelgerät, Hub und Bundle werden getrennt angeboten. Hersteller- und Händlerbestand können voneinander abweichen; ein dauerhaft statischer Preis wäre deshalb irreführend."'
  ]
);

let productBody = [...productDocument.bodyLines];

productBody = upsertBodySection(
  productBody,
  "Gerät, Hub und Bundle",
  [
    "Mikrochipzugang und integrierte Portionswaage gehören zum Gerät. Für die Verbindung mit der Sure Petcare App ist zusätzlich ein **Sure Petcare Hub** nötig, der am Router angeschlossen wird. Bis zu zehn kompatible SureFeed- und SureFlap-Connect-Geräte können einen Hub gemeinsam nutzen.",
    "",
    "Wer bereits einen kompatiblen Hub besitzt, kann das Einzelgerät verwenden. Beim ersten Sure-Petcare-Connect-Produkt müssen entweder das Bundle aus Futterautomat und Hub oder ein separat erhältlicher Hub eingeplant werden."
  ],
  ["App-Funktionen und gemessene Fressdaten", "Preis und Verfügbarkeit", "Quellenlage", "Quellen"]
);

productBody = upsertBodySection(
  productBody,
  "App-Funktionen und gemessene Fressdaten",
  [
    "Die integrierte Waage und LED-Portionsanzeige helfen beim manuellen Befüllen auf **1 Gramm genau**. Über die App lassen sich Fressmenge, Häufigkeit, Dauer und Tageszeiten des registrierten Tieres verfolgen; außerdem kann das System Push-Mitteilungen bei Fressereignissen senden und Statistiken als PDF bereitstellen.",
    "",
    "Das ist eine dokumentierte Verlaufshilfe, aber kein medizinischer Befund. Der Connect-Napf schützt eine manuell eingefüllte Portion und ist kein zeitgesteuerter Vorratsautomat."
  ],
  ["Preis und Verfügbarkeit", "Quellenlage", "Quellen"]
);

productBody = upsertBodySection(
  productBody,
  "Preis und Verfügbarkeit",
  [
    "Die deutsche Herstellerseite führt Einzelgerät, separaten Hub und Bundle mit unterschiedlichen Preisen und Kaufsignalen. Gleichzeitig erscheint auf derselben Seite ein allgemeiner Hinweis auf fehlenden Bestand, während einzelne Varianten weiterhin als kaufbar dargestellt werden.",
    "",
    "Deshalb wird im redaktionellen Fließtext kein fester Preis gespeichert. Preis und Lieferbarkeit gelten als **aktuell zu prüfen**, getrennt nach Einzelgerät, Hub, Bundle und Händlerangebot."
  ],
  ["Quellenlage", "Quellen"]
);

productBody = upsertBodySection(
  productBody,
  "Quellenlage",
  [
    `Die technischen und systembezogenen Angaben wurden am 2. August 2026 mit der [deutschen Herstellerseite zum SureFeed Mikrochip Futterautomat Connect](${SOURCE_URL}) abgeglichen. Editorial Score und redaktionelle Empfehlung wurden durch diesen Datenabgleich nicht verändert.`
  ],
  ["Quellen"]
);

const finalProduct = serializeDocument(productFrontmatter, productBody);
const finalProductDocument = splitMarkdownDocument(finalProduct);

if (
  readTopLevelScalar(finalProductDocument.frontmatterLines, "score") !== originalScore
) {
  throw new Error("Editorial Score würde verändert. Patch abgebrochen.");
}

if (
  readTopLevelScalar(
    finalProductDocument.frontmatterLines,
    "recommendation"
  ) !== originalRecommendation
) {
  throw new Error("Redaktionelle Produktempfehlung würde verändert. Patch abgebrochen.");
}

assertIncludes(
  finalProduct,
  [
    "Sure Petcare Hub für App-Verbindung und Fressprotokolle erforderlich",
    "Einzelgerät und Bundle sind getrennte Kaufvarianten",
    'priceState: "unknown"',
    'availability: "unknown"',
    "Fressmenge, Häufigkeit, Dauer und Tageszeiten",
    "1 Gramm genau",
    "400 ml",
    SOURCE_URL
  ],
  "Produktdatensatz"
);

if (finalProduct !== originalProduct) {
  backup(ROOT, BACKUP, PRODUCT);
  fs.writeFileSync(PRODUCT, finalProduct);
  log(`Geändert: ${path.relative(ROOT, PRODUCT)}`);
} else {
  log(`Bereits aktuell: ${path.relative(ROOT, PRODUCT)}`);
}

const comparisonFiles = fs
  .readdirSync(COMPARISON_DIR)
  .filter((file) => file.endsWith(".md"))
  .sort((left, right) => left.localeCompare(right, "de"));

const relevantComparisons = [];

for (const file of comparisonFiles) {
  const target = path.join(COMPARISON_DIR, file);
  const original = fs.readFileSync(target, "utf8");

  if (!original.includes(`slug: ${SLUG}`)) continue;

  relevantComparisons.push(target);

  const document = splitMarkdownDocument(original);
  const updatedItem = upsertComparisonItemRecommendation(
    document.frontmatterLines
  );

  if (!updatedItem.found) {
    throw new Error(`${file}: SureFeed-Eintrag konnte nicht strukturell gelesen werden.`);
  }

  let body = upsertBodySection(
    document.bodyLines,
    "SureFeed Connect richtig einordnen",
    [
      "Der **SureFeed Mikrochip Futterautomat Connect** ist kein zeitgesteuerter Vorratsautomat, sondern ein geschützter Einzelnapf mit Mikrochip- oder RFID-Zugang und integrierter Portionswaage.",
      "",
      "Für App-Protokolle zu Fressmenge, Häufigkeit, Dauer und Tageszeiten wird ein **Sure Petcare Hub** benötigt. Ein vorhandener kompatibler Hub kann weiterverwendet werden; andernfalls sind Bundle oder separater Hub nötig. Preis und Lieferbarkeit werden nicht statisch genannt, weil Einzelgerät, Hub, Bundle und Händlerbestand voneinander abweichen können."
    ],
    ["Fazit", "Quellen"]
  );

  const next = serializeDocument(updatedItem.lines, body);

  assertIncludes(
    next,
    [
      "SureFeed Connect richtig einordnen",
      "Sure Petcare Hub",
      "Bundle oder separater Hub",
      "Preis und Lieferbarkeit werden nicht statisch genannt"
    ],
    file
  );

  if (next !== original) {
    backup(ROOT, BACKUP, target);
    fs.writeFileSync(target, next);
    log(`Geändert: ${path.relative(ROOT, target)}`);
  } else {
    log(`Bereits aktuell: ${path.relative(ROOT, target)}`);
  }
}

if (relevantComparisons.length === 0) {
  throw new Error("Keine Vergleiche mit SureFeed Connect gefunden.");
}

const testSource = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const APP = path.join(ROOT, "apps", "pfotentechnik");
const PRODUCT = path.join(
  APP,
  "src/content/products/${SLUG}.md"
);
const COMPARISONS = path.join(
  APP,
  "src/content/comparisons"
);

const product = fs.readFileSync(PRODUCT, "utf8");

const scalar = (key) => {
  const line = product
    .split(/\\r?\\n/)
    .find((entry) => entry.startsWith(key + ":"));
  return line?.slice(line.indexOf(":") + 1).trim();
};

test("Hub-Abhängigkeit und Bundle-Abgrenzung sind eindeutig", () => {
  assert.match(product, /Sure Petcare Hub für App-Verbindung und Fressprotokolle erforderlich/);
  assert.match(product, /Einzelgerät und Bundle sind getrennte Kaufvarianten/);
  assert.match(product, /Bis zu zehn kompatible SureFeed- und SureFlap-Connect-Geräte/);
});

test("Preis und Verfügbarkeit bleiben dynamische Zustände", () => {
  assert.equal(scalar("priceState"), '"unknown"');
  assert.equal(scalar("availability"), '"unknown"');

  const priceBlock =
    product.match(/^price:\\n([\\s\\S]*?)(?=^[A-Za-z0-9_-]+:)/m)?.[1] ?? "";

  assert.doesNotMatch(priceBlock, /^\\s+(current|amount|value):/m);

  const section =
    product.match(/## Preis und Verfügbarkeit[\\s\\S]*?(?=\\n## |$)/)?.[0] ?? "";

  assert.match(section, /kein fester Preis gespeichert/);
  assert.doesNotMatch(section, /\\b(?:210|305)[,.]00\\s*€/);
});

test("App-Funktionen und gemessene Fressdaten sind konkret", () => {
  assert.match(product, /Fressmenge, Häufigkeit, Dauer und Tageszeiten/);
  assert.match(product, /1 Gramm genau/);
  assert.match(product, /Statistiken als PDF/);
  assert.match(product, /kein zeitgesteuerter Vorratsautomat/);
});

test("Editorial Score und Produktempfehlung bleiben vorhanden", () => {
  assert.ok(scalar("score"));
  assert.ok(scalar("recommendation"));
});

test("Herstellerquelle ist dokumentiert", () => {
  assert.match(
    product,
    /surepetcare\\.com\\/de-de\\/futterautomat\\/microchip-pet-feeder-connect/
  );
});

test("Alle relevanten Vergleiche verwenden dieselbe Abgrenzung", () => {
  const relevant = fs
    .readdirSync(COMPARISONS)
    .filter((file) => file.endsWith(".md"))
    .map((file) => ({
      file,
      source: fs.readFileSync(path.join(COMPARISONS, file), "utf8")
    }))
    .filter((entry) => entry.source.includes("slug: ${SLUG}"));

  assert.ok(relevant.length > 0);

  for (const entry of relevant) {
    assert.match(entry.source, /## SureFeed Connect richtig einordnen/, entry.file);
    assert.match(entry.source, /Sure Petcare Hub/, entry.file);
    assert.match(entry.source, /Bundle oder separater Hub/, entry.file);
    assert.match(
      entry.source,
      /Preis und Lieferbarkeit werden nicht statisch genannt/,
      entry.file
    );
  }
});
`;

if (!fs.existsSync(TEST) || fs.readFileSync(TEST, "utf8") !== testSource) {
  backup(ROOT, BACKUP, TEST);
  fs.writeFileSync(TEST, testSource);
  log(`Geschrieben: ${path.relative(ROOT, TEST)}`);
} else {
  log(`Bereits aktuell: ${path.relative(ROOT, TEST)}`);
}

const packageJson = JSON.parse(fs.readFileSync(PACKAGE, "utf8"));
packageJson.scripts ??= {};
packageJson.scripts["test:surefeed-connect-research"] =
  "node --test test/surefeed-connect-research-final-25.10.4.test.mjs";

const nextPackageJson = JSON.stringify(packageJson, null, 2) + "\n";
const currentPackageJson = fs.readFileSync(PACKAGE, "utf8");

if (nextPackageJson !== currentPackageJson) {
  backup(ROOT, BACKUP, PACKAGE);
  fs.writeFileSync(PACKAGE, nextPackageJson);
  log(`Geändert: ${path.relative(ROOT, PACKAGE)}`);
} else {
  log(`Bereits aktuell: ${path.relative(ROOT, PACKAGE)}`);
}

const finalPackageJson = JSON.parse(fs.readFileSync(PACKAGE, "utf8"));
const scriptsAfter = finalPackageJson.scripts ?? {};

for (const script of [
  "test:surefeed-connect-research",
  ...requiredExistingScripts
]) {
  if (!scriptsAfter[script]) {
    throw new Error(`Ergebnisvalidierung: npm-Skript fehlt: ${script}`);
  }
}

const writtenProduct = fs.readFileSync(PRODUCT, "utf8");
const writtenDocument = splitMarkdownDocument(writtenProduct);

if (
  readTopLevelScalar(writtenDocument.frontmatterLines, "score") !== originalScore ||
  readTopLevelScalar(
    writtenDocument.frontmatterLines,
    "recommendation"
  ) !== originalRecommendation
) {
  throw new Error("Ergebnisvalidierung: Score oder Produktempfehlung wurden verändert.");
}

for (const target of relevantComparisons) {
  const source = fs.readFileSync(target, "utf8");
  assertIncludes(
    source,
    [
      "SureFeed Connect richtig einordnen",
      "Sure Petcare Hub",
      "Bundle oder separater Hub",
      "Preis und Lieferbarkeit werden nicht statisch genannt"
    ],
    path.basename(target)
  );
}

execFileSync(
  process.execPath,
  ["--check", fileURLToPath(import.meta.url)],
  {
    cwd: ROOT,
    stdio: "inherit",
    windowsHide: true
  }
);

log(`Fachliche Ergebnisvalidierung bestanden.`);
log(`Relevante Vergleiche: ${relevantComparisons.length}`);
log(
  `npm-Ausführung: ${
    process.platform === "win32"
      ? "cmd.exe /d /s /c npm"
      : "npm"
  }`
);

runNpm(ROOT, [
  "--workspace",
  "apps/pfotentechnik",
  "run",
  "test:surefeed-connect-research"
]);

runNpm(ROOT, [
  "--workspace",
  "apps/pfotentechnik",
  "run",
  "audit:products:strict"
]);

runNpm(ROOT, [
  "--workspace",
  "apps/pfotentechnik",
  "run",
  "comparison:data:audit:strict"
]);

runNpm(ROOT, [
  "--workspace",
  "apps/pfotentechnik",
  "run",
  "product-standard-3:release:no-build"
]);

runNpm(ROOT, [
  "--workspace",
  "apps/pfotentechnik",
  "run",
  "build"
]);

log("Alle Tests, Audits und der vollständige Build sind erfolgreich.");
log("Fertig.");

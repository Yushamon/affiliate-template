#!/usr/bin/env node

/**
 * PfotenTechnik Trinkbrunnen-Vergleiche V1
 *
 * Liest die vorhandenen Produkt-Markdowns und erzeugt daraus:
 * - beste-trinkbrunnen-fuer-katzen.md
 * - beste-trinkbrunnen-fuer-hunde.md
 *
 * Es werden keine Produkt-Slugs geraten.
 */

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const appRoot = path.resolve(process.cwd(), "apps/pfotentechnik");
const productsDir = path.join(appRoot, "src/content/products");
const comparisonsDir = path.join(appRoot, "src/content/comparisons");
const reportsDir = path.join(appRoot, "reports");

const writeFiles = process.argv.includes("--write");
const force = process.argv.includes("--force");

const productFiles = await walk(productsDir);
const products = [];

for (const file of productFiles) {
  const source = await fs.readFile(file, "utf8");
  const frontmatter = splitFrontmatter(source, file);
  const product = parseProduct(frontmatter, source, file);

  if (isWaterFountain(product)) products.push(product);
}

if (products.length < 2) {
  console.error(`Nur ${products.length} Trinkbrunnen-Produkte gefunden. Mindestens zwei sind erforderlich.`);
  console.error("Geprüfter Ordner:", productsDir);
  process.exit(1);
}

const cats = selectAudience(products, "cat");
const dogs = selectAudience(products, "dog");

await fs.mkdir(reportsDir, { recursive: true });
const report = createReport(products, cats, dogs);
await fs.writeFile(path.join(reportsDir, "trinkbrunnen-comparison-generation.md"), report, "utf8");

const outputs = [
  {
    filename: "beste-trinkbrunnen-fuer-katzen.md",
    content: createComparison({ audience: "cat", products: cats })
  },
  {
    filename: "beste-trinkbrunnen-fuer-hunde.md",
    content: createComparison({ audience: "dog", products: dogs })
  }
];

for (const output of outputs) {
  const destination = path.join(comparisonsDir, output.filename);

  if (!writeFiles) {
    console.log(`\n===== ${output.filename} =====\n`);
    console.log(output.content);
    continue;
  }

  if (!force && await exists(destination)) {
    console.error(`Datei existiert bereits: ${destination}`);
    console.error("Zum bewussten Überschreiben --force ergänzen.");
    process.exitCode = 1;
    continue;
  }

  await fs.mkdir(comparisonsDir, { recursive: true });
  await fs.writeFile(destination, output.content, "utf8");
  const now = new Date();
  await fs.utimes(destination, now, now);
  console.log(`Erstellt: ${destination}`);
}

console.log(`\nGefundene Trinkbrunnen-Produkte: ${products.length}`);
console.log(`Katzenvergleich: ${cats.length}`);
console.log(`Hundevergleich: ${dogs.length}`);
console.log(`Bericht: ${path.join(reportsDir, "trinkbrunnen-comparison-generation.md")}`);

function createComparison({ audience, products }) {
  if (products.length < 2) {
    throw new Error(`Für ${audience} wurden weniger als zwei geeignete Produkte gefunden.`);
  }

  const isCat = audience === "cat";
  const animalSingular = isCat ? "Katze" : "Hund";
  const animalPlural = isCat ? "Katzen" : "Hunde";
  const icon = isCat ? "🐈" : "🐕";
  const slug = `beste-trinkbrunnen-fuer-${isCat ? "katzen" : "hunde"}`;
  const winner = [...products].sort((a, b) => b.rating - a.rating)[0];
  const alternative = [...products].sort((a, b) => b.rating - a.rating)[1];
  const currentDate = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());

  const items = products.map((product) => {
    const values = criterionValues(product);
    const valuePairs = Object.entries(values)
      .filter(([, value]) => value)
      .map(([key, value]) => `${key}: ${yamlQuote(value)}`)
      .join(", ");

    return [
      `  - slug: ${yamlQuote(product.slug)}`,
      `    label: ${yamlQuote(product.title)}`,
      `    type: "product"`,
      `    recommendation: ${yamlQuote(product.recommendation)}`,
      `    values: { ${valuePairs} }`
    ].join("\n");
  }).join("\n");

  return `---
title: "Beste Trinkbrunnen für ${animalPlural}"
slug: "${slug}"
type: "comparison"
layout: "comparison"
description: "Trinkbrunnen für ${animalPlural} nach Kapazität, Material, Lautstärke, Filter, Reinigung und Alltagseignung vergleichen."
publishedAt: "${currentDate}"
updatedAt: "${currentDate}"
author:
  name: "PfotenTechnik Redaktion"
  role: "Redaktion"
tags:
  - "Trinkbrunnen"
  - "${animalSingular}"
  - "Vergleich"
  - "Kaufberatung"
hub:
  sections:
    - "vergleiche"
    - "trinkbrunnen"
  title: "Beste Trinkbrunnen für ${animalPlural}"
  description: "Material, Reinigung, Filter, Kapazität und Geräusch verständlich gegenübergestellt."
  icon: "${icon}"
  featured: true
  order: ${isCat ? 20 : 21}
seo:
  title: "Beste Trinkbrunnen für ${animalPlural} im Vergleich"
  description: "Trinkbrunnen für ${animalPlural} vergleichen: Kapazität, Material, Filter, Lautstärke, Reinigung und Eignung verständlich eingeordnet."
  canonical: "/vergleiche/${slug}/"
  sitemap: true
  priority: 0.8
  changefreq: "monthly"
comparisonType: "use-case"
group: "Trinkbrunnen"
icon: "${icon}"
items:
${items}
criteria:
  - key: "kapazitaet"
    label: "Kapazität"
    description: "Wasservolumen des Behälters."
  - key: "material"
    label: "Material"
    description: "Material der Trinkfläche und wasserführenden Teile."
  - key: "lautstaerke"
    label: "Lautstärke"
    description: "Herstellerangabe oder nachvollziehbare Einordnung des Betriebsgeräuschs."
  - key: "filter"
    label: "Filter"
    description: "Filteraufbau und erforderliche Wechselteile."
  - key: "reinigung"
    label: "Reinigung"
    description: "Zerlegbarkeit und Eignung einzelner Teile für die Spülmaschine."
  - key: "stromversorgung"
    label: "Stromversorgung"
    description: "Netzbetrieb, USB oder Akku, soweit belegt."
  - key: "eignung"
    label: "Eignung für ${animalPlural}"
    description: "Bauform, Trinkhöhe und Kapazität passend zum Einsatzzweck."
recommendation:
  winnerSlug: "${winner.slug}"
  alternativeSlug: "${alternative.slug}"
  title: ${yamlQuote(`${winner.title} ist die stärkste Gesamtoption im vorhandenen Sortiment`)}
  text: ${yamlQuote(`Die beste Wahl hängt trotzdem von ${isCat ? "Trinkverhalten, Schnurrhaarfreundlichkeit" : "Körpergröße, Trinkhöhe"}, Materialwunsch und Reinigungsaufwand ab. Der Vergleich bewertet nur belegte Produktdaten und die dokumentierte Alltagseignung.`)}
tableTitle: "${products.length} Trinkbrunnen für ${animalPlural} verglichen"
cardsTitle: "Empfehlungen nach Einsatzzweck"
faq:
  - question: "Wie groß sollte ein Trinkbrunnen für ${animalPlural} sein?"
    answer: ${yamlQuote(isCat ? "Für eine Katze reicht häufig ein kompakter Behälter, sofern täglich kontrolliert und nachgefüllt wird. Bei mehreren Katzen sind größere Reserven sinnvoll, ersetzen aber keine regelmäßige Reinigung." : "Die passende Größe hängt von Körpergewicht, Anzahl der Hunde, Umgebungstemperatur und Trinkverhalten ab. Große Hunde benötigen meist eine größere, standfeste Trinkfläche und mehr Reserve.")}
  - question: "Ist Edelstahl besser als Kunststoff?"
    answer: "Edelstahl ist robust und meist leicht zu reinigen. Kunststoff kann leichter und günstiger sein. Entscheidend sind glatte Oberflächen, vollständige Zerlegbarkeit und verfügbare Ersatzteile."
  - question: "Wie oft muss ein Trinkbrunnen gereinigt werden?"
    answer: "Wasser sollte regelmäßig erneuert und der Brunnen abhängig von Nutzung, Material und Verschmutzung mehrmals pro Woche kontrolliert werden. Pumpe und schwer zugängliche Stellen brauchen besondere Aufmerksamkeit."
  - question: "Wie oft muss der Filter gewechselt werden?"
    answer: "Das hängt von Filtertyp, Wasserqualität, Tierzahl und Herstellerangabe ab. Ein Filter ersetzt weder Wasserwechsel noch gründliche Reinigung."
  - question: "Sind Trinkbrunnen wirklich leise?"
    answer: "Das Betriebsgeräusch hängt von Pumpe, Wasserstand, Untergrund und Verschmutzung ab. Auch ein leiser Brunnen kann bei niedrigem Wasserstand oder verschmutzter Pumpe deutlich hörbar werden."
---

Trinkbrunnen unterscheiden sich nicht nur durch ihr Fassungsvermögen. Material, Trinkfläche, Pumpenzugang, Filterkosten und Reinigungsaufwand entscheiden darüber, ob ein Modell im Alltag tatsächlich funktioniert.

## Worauf es bei Trinkbrunnen für ${animalPlural} ankommt

${isCat ? "Für Katzen sind eine gut zugängliche, möglichst breite Trinkfläche und ein ruhiger Wasserfluss häufig wichtiger als spektakuläre Zusatzfunktionen. In Mehrkatzenhaushalten zählen zusätzlich Kapazität, Standfestigkeit und einfache tägliche Kontrolle." : "Für Hunde zählen vor allem eine ausreichend große Trinkfläche, gute Standfestigkeit und eine zur Körpergröße passende Höhe. Bei großen oder mehreren Hunden ist die nutzbare Wassermenge wichtiger als eine möglichst kompakte Bauform."}

## Material und Hygiene

Edelstahl kann die Reinigung erleichtern, ist aber kein Selbstläufer. Auch Pumpengehäuse, Kabeldurchführung, Dichtungen und Filterkammer müssen erreichbar sein. Kunststoffteile sollten glatt, geruchsneutral und ohne schwer zugängliche Spalten ausgeführt sein.

## Filter und laufende Kosten

Filter binden je nach Aufbau Haare, Partikel oder Gerüche. Sie machen belastetes Wasser aber nicht automatisch hygienisch sicher. Prüfe vor dem Kauf, ob Ersatzfilter dauerhaft verfügbar sind und welche Wechselintervalle der Hersteller tatsächlich nennt.

## Lautstärke realistisch einordnen

Herstellerangaben zur Lautstärke sind nur bedingt vergleichbar. Wasserstand, Resonanz des Untergrunds und Verschmutzung der Pumpe verändern das Geräusch. Eine weiche, ebene Unterlage und regelmäßige Pumpenpflege sind oft wichtiger als ein einzelner Dezibelwert.

## Methodik und Transparenz

Die Einordnung basiert auf den im Repository vorhandenen Produktdaten, Herstellerangaben und redaktionell dokumentierten Eigenschaften. Fehlende technische Angaben werden als „Keine Angabe“ dargestellt und nicht aus Teilbewertungen abgeleitet. Es werden keine statischen Preise angezeigt.

Vertiefend: [Trinkbrunnen für Hunde und Katzen](/trinkbrunnen/), [Trinkbrunnen für Katzen sinnvoll?](/trinkbrunnen-fuer-katzen-sinnvoll/), [Wasserstelle für Katzen richtig platzieren](/wasserstelle-katze-richtiger-standort/) und [Trinkbrunnen richtig reinigen](/trinkbrunnen-richtig-reinigen/).
`;
}

function criterionValues(product) {
  return {
    kapazitaet: findValue(product, ["kapazität", "kapazitaet", "fassungsvermögen", "fassungsvermoegen", "volumen"]) || product.capacity,
    material: findValue(product, ["material", "trinkfläche", "trinkflaeche", "edelstahl"]),
    lautstaerke: findValue(product, ["lautstärke", "lautstaerke", "geräusch", "geraeusch", "betriebsgeräusch", "betriebsgeraeusch"]),
    filter: findValue(product, ["filter", "filtersystem", "filtertyp"]),
    reinigung: findValue(product, ["reinigung", "spülmaschinengeeignet", "spuelmaschinengeeignet", "zerlegbar"]),
    stromversorgung: findValue(product, ["stromversorgung", "netzteil", "usb", "akku", "kabellos"]),
    eignung: product.audienceText
  };
}

function findValue(product, candidates) {
  for (const spec of product.specs) {
    const label = normalize(spec.label);
    if (candidates.some((candidate) => label.includes(normalize(candidate)))) return spec.value;
  }

  const evidence = [...product.features, ...product.strengths].join(" | ");
  for (const candidate of candidates) {
    const pattern = new RegExp(`[^|.]*${escapeRegExp(candidate)}[^|.]*`, "i");
    const match = evidence.match(pattern);
    if (match) return match[0].trim();
  }

  return undefined;
}

function selectAudience(products, audience) {
  const opposite = audience === "cat" ? "dog" : "cat";
  const explicit = products.filter((product) => product.audiences.has(audience));
  const shared = products.filter((product) =>
    !product.audiences.has(opposite) || product.audiences.has(audience)
  );
  const selected = explicit.length >= 2 ? shared : products;
  return [...selected].sort((a, b) => b.rating - a.rating || a.title.localeCompare(b.title, "de"));
}

function isWaterFountain(product) {
  const evidence = normalize([
    product.categoryKey,
    product.categoryLabel,
    product.categoryPath,
    product.title,
    product.useCase,
    ...product.tags,
    ...product.features
  ].join(" "));
  return evidence.includes("trinkbrunnen") || evidence.includes("wasserbrunnen") || evidence.includes("petfountain");
}

function parseProduct(frontmatter, source, file) {
  const category = getInlineObject(frontmatter, "category");
  const tags = getInlineArray(frontmatter, "tags");
  const decision = getInlineObject(frontmatter, "decision");
  const bestFor = parseInlineArrayValue(decision.bestFor);
  const evidence = normalize([
    frontmatter,
    source,
    ...tags,
    ...bestFor
  ].join(" "));

  const audiences = new Set();
  if (/katze|katzen|cat/.test(evidence)) audiences.add("cat");
  if (/hund|hunde|dog/.test(evidence)) audiences.add("dog");

  return {
    file,
    slug:
      getScalar(frontmatter, "slug") ??
      path.basename(file).replace(/\.mdx?$/i, ""),
    title:
      getScalar(frontmatter, "title") ??
      path.basename(file),
    recommendation:
      getScalar(frontmatter, "recommendation") ??
      "Trinkbrunnen mit dokumentierten Stärken für einen konkreten Einsatzzweck.",
    rating: Number(getScalar(frontmatter, "rating") ?? 0),
    categoryKey: category.key ?? "",
    categoryLabel: category.label ?? "",
    categoryPath: category.path ?? "",
    useCase: getScalar(frontmatter, "useCase") ?? "",
    capacity: getScalar(frontmatter, "capacity"),
    tags,
    features: getInlineArray(frontmatter, "features"),
    strengths: getInlineArray(frontmatter, "strengths"),
    specs: getSpecs(frontmatter),
    audiences,
    audienceText:
      audiences.size === 2
        ? "Für Hunde und Katzen eingeordnet"
        : audiences.has("cat")
          ? "Für Katzen eingeordnet"
          : audiences.has("dog")
            ? "Für Hunde eingeordnet"
            : "Allgemeine Haustier-Eignung; Größe prüfen"
  };
}

function getInlineObject(frontmatter, key) {
  const scalar = getScalar(frontmatter, key);
  if (!scalar?.startsWith("{") || !scalar.endsWith("}")) {
    return {};
  }

  const body = scalar.slice(1, -1);
  const result = {};

  for (const part of splitTopLevel(body, ",")) {
    const separator = part.indexOf(":");
    if (separator === -1) continue;

    const field = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    result[field] = stripQuotes(value);
  }

  return result;
}

function getInlineArray(frontmatter, key) {
  const scalar = getScalar(frontmatter, key);

  if (scalar?.startsWith("[") && scalar.endsWith("]")) {
    return parseInlineArrayValue(scalar);
  }

  return getList(frontmatter, key);
}

function parseInlineArrayValue(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];

  const trimmed = value.trim();
  if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) {
    return trimmed ? [stripQuotes(trimmed)] : [];
  }

  return splitTopLevel(trimmed.slice(1, -1), ",")
    .map((item) => stripQuotes(item.trim()))
    .filter(Boolean);
}

function splitTopLevel(value, separator) {
  const result = [];
  let current = "";
  let quote = null;
  let squareDepth = 0;
  let curlyDepth = 0;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];

    if (quote) {
      current += character;
      if (
        character === quote &&
        value[index - 1] !== "\\"
      ) {
        quote = null;
      }
      continue;
    }

    if (character === '"' || character === "'") {
      quote = character;
      current += character;
      continue;
    }

    if (character === "[") squareDepth += 1;
    if (character === "]") squareDepth -= 1;
    if (character === "{") curlyDepth += 1;
    if (character === "}") curlyDepth -= 1;

    if (
      character === separator &&
      squareDepth === 0 &&
      curlyDepth === 0
    ) {
      result.push(current.trim());
      current = "";
      continue;
    }

    current += character;
  }

  if (current.trim()) result.push(current.trim());
  return result;
}

function createReport(all, cats, dogs) {
  const rows = all.map((product) => {
    const values = criterionValues(product);
    const missing = Object.entries(values).filter(([, value]) => !value).map(([key]) => key);
    return `| ${escapeTable(product.title)} | ${[...product.audiences].join(", ") || "allgemein"} | ${missing.join(", ") || "–"} |`;
  }).join("\n");

  return `# Trinkbrunnen-Vergleich: Generierungsbericht\n\n` +
    `- Gefundene Produkte: ${all.length}\n` +
    `- Katzenvergleich: ${cats.length}\n` +
    `- Hundevergleich: ${dogs.length}\n\n` +
    `| Produkt | erkannte Zielgruppe | fehlende Vergleichswerte |\n|---|---|---|\n${rows}\n`;
}

async function walk(directory) {
  const result = [];
  const entries = await fs.readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await walk(full));
    else if (/\.mdx?$/i.test(entry.name)) result.push(full);
  }
  return result;
}

function splitFrontmatter(source, file) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) throw new Error(`Kein Frontmatter: ${file}`);
  return match[1];
}

function getScalar(fm, key) {
  const match = fm.match(new RegExp(`^${escapeRegExp(key)}\\s*:\\s*(.+?)\\s*$`, "m"));
  return match ? stripQuotes(match[1]) : undefined;
}

function getBlock(fm, key) {
  const lines = fm.split(/\r?\n/);
  const start = lines.findIndex((line) => new RegExp(`^${escapeRegExp(key)}\\s*:\\s*$`).test(line));
  if (start < 0) return "";
  const result = [];
  for (let i = start + 1; i < lines.length; i++) {
    if (/^\S/.test(lines[i]) && lines[i].trim()) break;
    result.push(lines[i]);
  }
  return result.join("\n");
}

function getList(fm, key) {
  return [...getBlock(fm, key).matchAll(/^\s*-\s*(.+?)\s*$/gm)].map((match) => stripQuotes(match[1]));
}

function getNestedScalar(fm, parent, child) {
  const block = getBlock(fm, parent);
  const match = block.match(new RegExp(`^\\s{2,}${escapeRegExp(child)}\\s*:\\s*(.+?)\\s*$`, "m"));
  return match ? stripQuotes(match[1]) : undefined;
}

function getNestedList(fm, parent, child) {
  const block = getBlock(fm, parent);
  const lines = block.split(/\r?\n/);
  const start = lines.findIndex((line) => new RegExp(`^\\s{2,}${escapeRegExp(child)}\\s*:\\s*$`).test(line));
  if (start < 0) return [];
  const values = [];
  for (let i = start + 1; i < lines.length; i++) {
    if (/^\s{2,}\w[\w-]*\s*:/.test(lines[i])) break;
    const item = lines[i].match(/^\s*-\s*(.+?)\s*$/);
    if (item) values.push(stripQuotes(item[1]));
  }
  return values;
}

function getSpecs(frontmatter) {
  const block = getBlock(frontmatter, "specs");
  const specs = [];

  for (const match of block.matchAll(
    /^\s*-\s*\{\s*label\s*:\s*([^,]+),\s*value\s*:\s*(.+?)\s*\}\s*$/gm
  )) {
    specs.push({
      label: stripQuotes(match[1].trim()),
      value: stripQuotes(match[2].trim())
    });
  }

  if (specs.length > 0) return specs;

  const lines = block.split(/\r?\n/);
  let current;

  for (const line of lines) {
    const label = line.match(
      /^\s*-\s*label\s*:\s*(.+?)\s*$/
    );

    if (label) {
      if (
        current?.label &&
        current?.value !== undefined
      ) {
        specs.push(current);
      }

      current = {
        label: stripQuotes(label[1])
      };
      continue;
    }

    const value = line.match(
      /^\s*value\s*:\s*(.+?)\s*$/
    );

    if (value && current) {
      current.value = stripQuotes(value[1]);
    }
  }

  if (
    current?.label &&
    current?.value !== undefined
  ) {
    specs.push(current);
  }

  return specs;
}

function normalize(value) {
  return String(value || "").toLocaleLowerCase("de")
    .replaceAll("ä", "ae").replaceAll("ö", "oe").replaceAll("ü", "ue").replaceAll("ß", "ss")
    .replace(/[^a-z0-9]+/g, " ");
}

function yamlQuote(value) {
  return JSON.stringify(String(value));
}

function stripQuotes(value) {
  return String(value).trim().replace(/^(["'])(.*)\1$/, "$2");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeTable(value) {
  return String(value).replaceAll("|", "\\|");
}

async function exists(file) {
  try { await fs.access(file); return true; } catch { return false; }
}

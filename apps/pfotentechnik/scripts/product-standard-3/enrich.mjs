#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const WRITE = process.argv.includes("--write");

function findRoot(start) {
  let dir = path.resolve(start);
  for (let index = 0; index < 12; index += 1) {
    if (fs.existsSync(path.join(dir, "apps", "pfotentechnik", "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}

const ROOT = findRoot(process.cwd());
const APP = path.join(ROOT, "apps", "pfotentechnik");
const PRODUCT_ROOT = path.join(APP, "src", "content", "products");
const REPORT_DIR = path.join(APP, "reports", "product-standard-3");
const REPORT_JSON = path.join(REPORT_DIR, "product-standard-3-enrichment-latest.json");
const REPORT_MD = path.join(REPORT_DIR, "product-standard-3-enrichment-latest.md");

function walk(directory, output = []) {
  if (!fs.existsSync(directory)) return output;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(full, output);
    else if (entry.isFile() && /\.mdx?$/i.test(entry.name)) output.push(full);
  }
  return output;
}

function frontmatterRange(source) {
  const match = source.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return null;
  return {
    body: match[1],
    start: match.index ?? 0,
    end: (match.index ?? 0) + match[0].length
  };
}

function unquote(value) {
  const trimmed = String(value ?? "").trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) return trimmed.slice(1, -1);
  return trimmed;
}

function yamlQuote(value) {
  return JSON.stringify(String(value));
}

function normalize(value) {
  return String(value ?? "")
    .toLocaleLowerCase("de-DE")
    .replaceAll("ä", "ae")
    .replaceAll("ö", "oe")
    .replaceAll("ü", "ue")
    .replaceAll("ß", "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function extractListBlock(frontmatter, key) {
  const lines = frontmatter.split("\n");
  const start = lines.findIndex((line) => new RegExp(`^${key}:\\s*$`).test(line));
  if (start < 0) return "";
  const output = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^[^\s]/.test(line)) break;
    output.push(line);
  }
  return output.join("\n");
}

function parseSpecs(frontmatter) {
  const block = extractListBlock(frontmatter, "specs");
  if (!block) return [];

  const lines = block.split("\n");
  const items = [];
  let current = null;

  for (const line of lines) {
    const itemStart = line.match(/^\s*-\s*label:\s*(.+?)\s*$/);
    if (itemStart) {
      if (current?.label && current?.value) items.push(current);
      current = { label: unquote(itemStart[1]), value: "" };
      continue;
    }

    if (!current) continue;

    const valueMatch = line.match(/^\s+value:\s*(.+?)\s*$/);
    if (valueMatch) {
      current.value = unquote(valueMatch[1]);
      continue;
    }

    const inlineMatch = line.match(/^\s*-\s*\{\s*label:\s*([^,]+),\s*value:\s*([^}]+)\}\s*$/);
    if (inlineMatch) {
      if (current?.label && current?.value) items.push(current);
      current = null;
      items.push({ label: unquote(inlineMatch[1]), value: unquote(inlineMatch[2]) });
    }
  }

  if (current?.label && current?.value) items.push(current);
  return items;
}

function consequenceFor(label, value) {
  const key = normalize(label);
  const normalizedValue = normalize(value);

  if (key.includes("kapazitaet") || key.includes("volumen")) {
    return "Die tatsächliche Reichweite hängt von Verbrauch, Portionsgröße und Anzahl der Tiere ab.";
  }

  if (key.includes("app") || key.includes("wlan") || key.includes("wifi")) {
    if (/(ja|vorhanden|app|wlan|wifi)/.test(normalizedValue)) {
      return "Fernsteuerung und Statusmeldungen sind möglich; dafür werden Konto, Netz und App-Stabilität wichtiger.";
    }
    if (/(nein|ohne|nicht vorhanden)/.test(normalizedValue)) {
      return "Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN.";
    }
  }

  if (key.includes("kamera")) {
    if (/(ja|vorhanden|integriert)/.test(normalizedValue)) {
      return "Du kannst zusätzlich kontrollieren, was am Gerät oder beim Tier tatsächlich passiert.";
    }
    if (/(nein|ohne)/.test(normalizedValue)) {
      return "Die Kontrolle beschränkt sich auf Statusmeldungen, Protokolle oder die direkte Sichtprüfung.";
    }
  }

  if (key.includes("akku") || key.includes("batterie") || key.includes("stromversorgung")) {
    return "Die Stromversorgung bestimmt, wie flexibel das Gerät steht und wie es sich bei Stromausfall verhält.";
  }

  if (key.includes("material")) {
    if (normalizedValue.includes("edelstahl")) {
      return "Edelstahl nimmt Gerüche meist weniger stark an und lässt sich in der Regel leichter hygienisch reinigen.";
    }
    if (normalizedValue.includes("keramik")) {
      return "Keramik ist schwer und standfest, kann bei Stößen aber beschädigt werden.";
    }
    if (normalizedValue.includes("kunststoff")) {
      return "Kunststoff ist leicht, sollte wegen Kratzern und möglicher Geruchsaufnahme regelmäßig kontrolliert werden.";
    }
  }

  if (key.includes("gewicht")) {
    return "Das Gewicht beeinflusst je nach Produkt Tragekomfort, Standfestigkeit oder Handhabung.";
  }

  if (key.includes("abmess") || key.includes("groesse") || key.includes("durchgang")) {
    return "Die Maße müssen sowohl zum verfügbaren Platz als auch zur Körpergröße des Tieres passen.";
  }

  if (key.includes("filter")) {
    return "Filter funktionieren nur bei regelmäßigem Wechsel und verursachen laufende Folgekosten.";
  }

  if (key.includes("laut") || key.includes("geraeusch")) {
    return "Geräusche können bei schreckhaften Tieren und in Schlafräumen kaufentscheidend sein.";
  }

  if (key.includes("portion")) {
    return "Wichtiger als die Zahl der Stufen ist, wie gleichmäßig die tatsächliche Menge ausgegeben wird.";
  }

  if (key.includes("abo") || key.includes("monat") || key.includes("laufende kosten")) {
    return "Für den realen Preisvergleich zählen die Gesamtkosten über mehrere Jahre.";
  }

  if (key.includes("schutz") || key.includes("wasserdicht") || key === "ip" || key.startsWith("ip ")) {
    return "Die Schutzklasse ist bei Regen, Reinigung und dauerhaftem Außeneinsatz relevant.";
  }

  if (key.includes("chip") || key.includes("mikrochip")) {
    return "Die Chip-Erkennung kann den Zugang einzelnen Tieren zuordnen, ersetzt aber keine Prüfung von Kompatibilität und Einbau.";
  }

  return null;
}

function buildFacts(specs) {
  const output = [];
  const seen = new Set();

  for (const spec of specs) {
    const consequence = consequenceFor(spec.label, spec.value);
    if (!consequence) continue;
    const key = normalize(spec.label);
    if (seen.has(key)) continue;
    seen.add(key);
    output.push({ ...spec, consequence });
    if (output.length >= 6) break;
  }

  return output;
}

function renderFacts(facts) {
  const lines = ["decisionFacts:"];
  for (const fact of facts) {
    lines.push(`  - label: ${yamlQuote(fact.label)}`);
    lines.push(`    value: ${yamlQuote(fact.value)}`);
    lines.push(`    consequence: ${yamlQuote(fact.consequence)}`);
  }
  return lines.join("\n");
}

function insertFacts(source, range, facts) {
  const block = renderFacts(facts);
  const frontmatter = range.body.replace(/\s+$/, "");
  const updatedFrontmatter = `${frontmatter}\n${block}`;
  return `---\n${updatedFrontmatter}\n---${source.slice(range.end)}`;
}

const products = [];
let changed = 0;
let eligible = 0;
let alreadyPresent = 0;
let noSafeFacts = 0;

for (const file of walk(PRODUCT_ROOT).sort()) {
  const source = fs.readFileSync(file, "utf8");
  const range = frontmatterRange(source);
  const relative = path.relative(ROOT, file).replaceAll(path.sep, "/");
  const slug = path.basename(file).replace(/\.mdx?$/i, "");

  if (!range) {
    products.push({ slug, file: relative, status: "invalid-frontmatter", facts: [] });
    continue;
  }

  if (/^decisionFacts:\s*$/m.test(range.body)) {
    alreadyPresent += 1;
    products.push({ slug, file: relative, status: "already-present", facts: [] });
    continue;
  }

  const specs = parseSpecs(range.body);
  const facts = buildFacts(specs);

  if (!facts.length) {
    noSafeFacts += 1;
    products.push({ slug, file: relative, status: "no-safe-facts", facts: [] });
    continue;
  }

  eligible += 1;
  products.push({ slug, file: relative, status: WRITE ? "written" : "preview", facts });

  if (WRITE) {
    fs.writeFileSync(file, insertFacts(source, range, facts));
    changed += 1;
  }
}

const editorialTasks = products
  .filter((product) => product.status !== "invalid-frontmatter")
  .map((product) => ({
    slug: product.slug,
    file: product.file,
    tasks: [
      "Community-Muster nur nach Mehrquellen-Auswertung ergänzen.",
      "Typische Fehlkäufe nur mit konkreter fachlicher Begründung ergänzen.",
      "Eigener Praxistest nur nach tatsächlicher Durchführung kennzeichnen."
    ]
  }));

const report = {
  version: "25.4.0",
  generatedAt: new Date().toISOString(),
  mode: WRITE ? "write" : "preview",
  summary: {
    products: products.length,
    eligible,
    changed,
    alreadyPresent,
    noSafeFacts,
    invalidFrontmatter: products.filter((product) => product.status === "invalid-frontmatter").length
  },
  products,
  editorialTasks
};

fs.mkdirSync(REPORT_DIR, { recursive: true });
fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2) + "\n");

const previewRows = products
  .filter((product) => ["preview", "written"].includes(product.status))
  .map((product) => `| ${product.slug} | ${product.facts.length} | ${product.status} |`);

const markdown = [
  "# Product Standard 3 Enrichment",
  "",
  `- Modus: ${report.mode}`,
  `- Produkte: ${report.summary.products}`,
  `- sicher anreicherbar: ${report.summary.eligible}`,
  `- geschrieben: ${report.summary.changed}`,
  `- bereits vorhanden: ${report.summary.alreadyPresent}`,
  `- keine sicheren Ableitungen: ${report.summary.noSafeFacts}`,
  "",
  "## Decision-Facts-Vorschau",
  "",
  "| Produkt | Facts | Status |",
  "|---|---:|---|",
  ...(previewRows.length ? previewRows : ["| – | 0 | keine Änderungen |"]),
  "",
  "## Bewusst nicht automatisiert",
  "",
  "- Community-Erfahrungen",
  "- angebliche Praxistests",
  "- typische Fehlkäufe",
  "- konkrete Messwerte oder Reichweiten",
  "",
  "Diese Inhalte benötigen eine echte redaktionelle Prüfung und werden nur als Aufgaben dokumentiert.",
  ""
].join("\n");

fs.writeFileSync(REPORT_MD, markdown);

console.log(`[product-standard-3-enricher] Modus: ${report.mode}`);
console.log(`[product-standard-3-enricher] Produkte: ${report.summary.products}`);
console.log(`[product-standard-3-enricher] Sicher anreicherbar: ${report.summary.eligible}`);
console.log(`[product-standard-3-enricher] Geschrieben: ${report.summary.changed}`);
console.log(`[product-standard-3-enricher] Bereits vorhanden: ${report.summary.alreadyPresent}`);
console.log(`[product-standard-3-enricher] Keine sicheren Facts: ${report.summary.noSafeFacts}`);
console.log(`[product-standard-3-enricher] Report: ${path.relative(ROOT, REPORT_MD)}`);

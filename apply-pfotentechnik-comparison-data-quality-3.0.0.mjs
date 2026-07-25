import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";

const require = createRequire(import.meta.url);
const yaml = require("js-yaml");

const PATCH = "pfotentechnik-comparison-data-quality-3.0.0";
const root = process.cwd();
const app = path.join(root, "apps", "pfotentechnik");
const comparisonDir = path.join(app, "src", "content", "comparisons");
const productDir = path.join(app, "src", "content", "products");
const reportCandidates = [
  path.join(app, "reports", "comparison-platform", "comparison-audit.json"),
  path.join(app, "reports", "comparison-audit.json")
];
const backupRoot = path.join(
  root,
  ".patch-backups",
  `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

const backups = new Map();
const changed = [];
const stats = {
  comparisonsTouched: 0,
  valuesFilledFromData: 0,
  valuesMarkedNotDisclosed: 0,
  heroImagesAdded: 0,
  faqsAdded: 0
};

function fail(message) {
  throw new Error(`[${PATCH}] ${message}`);
}

function read(file) {
  if (!fs.existsSync(file)) fail(`Datei fehlt: ${path.relative(root, file)}`);
  return fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
}

function backup(file, content) {
  if (backups.has(file)) return;
  const target = path.join(backupRoot, path.relative(root, file));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, "utf8");
  backups.set(file, target);
}

function write(file, content) {
  const old = read(file);
  if (old === content) return false;
  backup(file, old);
  fs.writeFileSync(file, content, "utf8");
  changed.push(path.relative(root, file));
  return true;
}

function restoreAll() {
  for (const [file, backupFile] of backups) {
    fs.copyFileSync(backupFile, file);
  }
}

function parseMarkdown(file) {
  const text = read(file);
  const match = text.match(/^---\n([\s\S]*?)\n---(?:\n|$)([\s\S]*)$/);
  if (!match) fail(`${path.relative(root, file)}: Frontmatter nicht erkannt.`);
  const data = yaml.load(match[1]) || {};
  return { text, data, body: match[2] || "" };
}

function dumpMarkdown(data, body) {
  const fm = yaml.dump(data, {
    noRefs: true,
    lineWidth: 120,
    sortKeys: false,
    quotingType: '"',
    forceQuotes: false
  }).trimEnd();
  return `---\n${fm}\n---\n${body.replace(/^\n+/, "")}`;
}

function listMarkdown(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => /\.(md|mdx)$/i.test(name))
    .map((name) => path.join(dir, name));
}

function slugOf(file, data) {
  return String(data.slug || path.basename(file).replace(/\.(md|mdx)$/i, ""));
}

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "");
}

function humanize(value) {
  if (Array.isArray(value)) return value.map(humanize).join(", ");
  if (typeof value === "boolean") return value ? "Ja" : "Nein";
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return String(value);
  if (typeof value === "object") return null;
  return String(value);
}

const aliases = new Map([
  ["kapazitat", ["kapazitat", "fassungsvermogen", "volumen", "behalter", "tankvolumen"]],
  ["volumen", ["volumen", "kapazitat", "fassungsvermogen", "tankvolumen"]],
  ["mahlzeiten", ["mahlzeiten", "futterungen", "facher", "anzahlmahlzeiten"]],
  ["portionen", ["portionen", "portionsgrosse", "portionsbereich", "portionierung"]],
  ["futterart", ["futterart", "foodtype", "nassfutter", "trockenfutter"]],
  ["stromversorgung", ["stromversorgung", "strom", "netzbetrieb", "batterie", "akku"]],
  ["batterie", ["batterie", "batteriebackup", "stromversorgung"]],
  ["akku", ["akku", "akkulaufzeit", "stromversorgung"]],
  ["akkulaufzeit", ["akkulaufzeit", "batterielaufzeit", "batterymaxdays"]],
  ["app", ["app", "appsteuerung", "steuerung"]],
  ["wlan", ["wlan", "wifi", "app"]],
  ["kamera", ["kamera", "camera", "video"]],
  ["audio", ["audio", "mikrofon", "lautsprecher", "zweiwegeaudio"]],
  ["gewicht", ["gewicht", "deviceweightgrams", "weight"]],
  ["abmessungen", ["abmessungen", "masse", "grosse", "dimensions"]],
  ["wasserschutz", ["wasserschutz", "waterproofrating", "ipklasse"]],
  ["eignung", ["eignung", "geeignetfur", "animal", "petsize"]],
  ["geeignetfur", ["geeignetfur", "eignung", "animal", "petsize"]],
  ["tiertrennung", ["tiertrennung", "rfid", "mikrochip", "zugangskontrolle"]],
  ["rfid", ["rfid", "mikrochip", "tiertrennung"]],
  ["reinigung", ["reinigung", "hygiene", "spulmaschinengeeignet"]],
  ["material", ["material", "napfmaterial", "edelstahl"]],
  ["napf", ["napf", "napfmaterial", "edelstahl"]],
  ["lautstarke", ["lautstarke", "gerausch", "db"]],
  ["filter", ["filter", "filtersystem", "filterkosten"]],
  ["abo", ["abo", "subscriptionrequired", "abonnement"]],
  ["reichweite", ["reichweite", "range"]],
  ["ubertragung", ["ubertragung", "transmission"]],
  ["befestigung", ["befestigung", "attachmenttype"]],
  ["livetracking", ["livetracking"]],
  ["virtuellerzaun", ["virtuellerzaun", "virtualfence"]],
  ["aktivitat", ["aktivitat", "activitytracking"]],
  ["preis", ["preis", "preiskategorie", "pricecategory", "pricetier"]],
  ["score", ["score"]],
  ["bewertung", ["bewertung", "rating"]],
  ["status", ["status", "productstatus"]],
  ["kuehlung", ["kuehlung", "kuehlprinzip"]],
  ["kuhlung", ["kuhlung", "kuehlung", "kuehlprinzip"]],
  ["steuerung", ["steuerung", "app", "bedienung"]],
  ["hygiene", ["hygiene", "reinigung"]],
  ["wichtigstegrenze", ["wichtigstegrenze", "grenze", "attention"]]
]);

function candidateKeys(criterionKey) {
  const n = normalize(criterionKey);
  const candidates = new Set([n]);
  for (const [canonical, values] of aliases) {
    const normalizedValues = values.map(normalize);
    if (canonical === n || normalizedValues.includes(n)) {
      candidates.add(canonical);
      normalizedValues.forEach((v) => candidates.add(v));
    }
  }
  return candidates;
}

function flattenObject(obj, out = new Map(), prefix = "") {
  if (!obj || typeof obj !== "object") return out;
  for (const [key, value] of Object.entries(obj)) {
    const normalizedKey = normalize(key);
    const fullKey = normalize(prefix ? `${prefix}-${key}` : key);
    if (value && typeof value === "object" && !Array.isArray(value)) {
      flattenObject(value, out, prefix ? `${prefix}-${key}` : key);
    } else {
      const rendered = humanize(value);
      if (rendered) {
        if (!out.has(normalizedKey)) out.set(normalizedKey, rendered);
        if (!out.has(fullKey)) out.set(fullKey, rendered);
      }
    }
  }
  return out;
}

function productValueIndex(product) {
  const map = new Map();

  const specs = Array.isArray(product.specs) ? product.specs : [];
  for (const spec of specs) {
    const key = normalize(spec?.label);
    const value = humanize(spec?.value);
    if (key && value && !map.has(key)) map.set(key, value);
  }

  flattenObject(product.comparisonData, map);
  flattenObject(product.gps, map);

  const directFields = {
    preis: product.price,
    preiskategorie: product.priceCategory,
    pricecategory: product.priceCategory,
    bewertung: product.rating,
    rating: product.rating,
    score: product.score,
    status: product.productStatus,
    productstatus: product.productStatus,
    kapazitat: product.capacity,
    einsatz: product.useCase,
    features: product.features,
    staerken: product.strengths,
    schwachen: product.weaknesses
  };

  for (const [key, value] of Object.entries(directFields)) {
    const rendered = humanize(value);
    if (rendered && !map.has(normalize(key))) map.set(normalize(key), rendered);
  }

  return map;
}

function deriveValue(product, criterion) {
  const index = productValueIndex(product);
  const candidates = candidateKeys(criterion.key);

  for (const key of candidates) {
    if (index.has(key)) return { value: index.get(key), source: "data" };
  }

  const labelCandidates = candidateKeys(criterion.label || "");
  for (const key of labelCandidates) {
    if (index.has(key)) return { value: index.get(key), source: "data" };
  }

  return {
    value: "Nicht in den geprüften Produktdaten ausgewiesen",
    source: "undisclosed"
  };
}

function pickHero(product) {
  return product?.images?.comparison || product?.images?.hero || product?.images?.thumbnail || null;
}

function faqTemplates(comparison) {
  const title = comparison.title || "diesem Vergleich";
  const group = comparison.group || "Produkte";
  return [
    {
      question: `Wie wurden die Produkte in „${title}“ verglichen?`,
      answer: `Die Tabelle nutzt einheitliche Kriterien und übernimmt belegte Werte aus den vorhandenen Produktdaten. Nicht ausgewiesene Angaben werden ausdrücklich als solche gekennzeichnet.`
    },
    {
      question: `Was bedeutet „nicht ausgewiesen“ in der Vergleichstabelle?`,
      answer: `Für dieses Kriterium liegt in den geprüften Produkt- oder Herstellerdaten kein belastbarer Wert vor. Die Angabe wird deshalb nicht geschätzt oder erfunden.`
    },
    {
      question: `Ist der Vergleich für alle ${group} vollständig?`,
      answer: `Der Vergleich bildet die redaktionell ausgewählten und aktuell gepflegten Modelle ab. Produktstatus, Verfügbarkeit und technische Angaben können sich ändern.`
    }
  ];
}

function loadAuditReport() {
  const file = reportCandidates.find(fs.existsSync);
  if (!file) return null;
  try {
    return JSON.parse(read(file));
  } catch {
    return null;
  }
}

try {
  if (!fs.existsSync(path.join(app, "package.json"))) {
    fail("Bitte im Root von affiliate-template ausführen.");
  }

  const productBySlug = new Map();
  for (const file of listMarkdown(productDir)) {
    const { data } = parseMarkdown(file);
    productBySlug.set(slugOf(file, data), data);
  }

  const audit = loadAuditReport();
  const warningFiles = new Set(
    (audit?.issues || [])
      .filter((x) => ["VALUE_MISSING", "HERO_IMAGE_MISSING", "FAQ_THIN"].includes(x.code))
      .map((x) => String(x.file || "").replace(/\\/g, "/"))
  );

  for (const file of listMarkdown(comparisonDir)) {
    const rel = path.relative(app, file).replace(/\\/g, "/");
    const parsed = parseMarkdown(file);
    const comparison = parsed.data;
    let touched = false;

    if (warningFiles.size && !warningFiles.has(rel)) {
      continue;
    }

    const criteria = Array.isArray(comparison.criteria) ? comparison.criteria : [];
    const items = Array.isArray(comparison.items) ? comparison.items : [];

    for (const item of items) {
      if (!item || !item.slug || item.type !== "product") continue;
      const product = productBySlug.get(item.slug);
      if (!product) continue;

      const values = {
        ...(item.overrides && typeof item.overrides === "object" ? item.overrides : {}),
        ...(item.values && typeof item.values === "object" ? item.values : {})
      };

      let itemChanged = false;
      for (const criterion of criteria) {
        if (!criterion?.key || Object.prototype.hasOwnProperty.call(values, criterion.key)) continue;
        const derived = deriveValue(product, criterion);
        values[criterion.key] = derived.value;
        itemChanged = true;
        if (derived.source === "data") stats.valuesFilledFromData++;
        else stats.valuesMarkedNotDisclosed++;
      }

      if (itemChanged) {
        item.values = values;
        if (item.overrides) delete item.overrides;
        touched = true;
      }
    }

    if (!comparison.heroImage && items.length) {
      const firstProduct = productBySlug.get(items.find((x) => x?.type === "product" && x.slug)?.slug);
      const hero = pickHero(firstProduct);
      if (hero?.src) {
        comparison.heroImage = {
          src: hero.src,
          alt: `${comparison.title || "Produktvergleich"} – redaktionelles Vergleichsbild`
        };
        stats.heroImagesAdded++;
        touched = true;
      }
    }

    const faq = Array.isArray(comparison.faq) ? comparison.faq : [];
    if (faq.length < 3) {
      const templates = faqTemplates(comparison);
      const existingQuestions = new Set(faq.map((x) => normalize(x?.question)));
      for (const entry of templates) {
        if (faq.length >= 3) break;
        if (existingQuestions.has(normalize(entry.question))) continue;
        faq.push(entry);
        existingQuestions.add(normalize(entry.question));
        stats.faqsAdded++;
      }
      comparison.faq = faq;
      touched = true;
    }

    if (touched) {
      write(file, dumpMarkdown(comparison, parsed.body));
      stats.comparisonsTouched++;
    }
  }

  console.log("");
  console.log(`[${PATCH}] Erfolgreich.`);
  console.log(`Vergleiche geändert: ${stats.comparisonsTouched}`);
  console.log(`Werte aus vorhandenen Daten ergänzt: ${stats.valuesFilledFromData}`);
  console.log(`Transparente Nicht-ausgewiesen-Werte ergänzt: ${stats.valuesMarkedNotDisclosed}`);
  console.log(`Hero-Bilder ergänzt: ${stats.heroImagesAdded}`);
  console.log(`FAQ-Einträge ergänzt: ${stats.faqsAdded}`);
  console.log(`Backups: ${path.relative(root, backupRoot)}`);
  console.log("");
  console.log("Validierung:");
  console.log("npm --workspace apps/pfotentechnik run comparison:audit");
  console.log("npm --workspace apps/pfotentechnik run audit:products:strict");
  console.log("npm --workspace apps/pfotentechnik run lint:content");
  console.log("npm run build:pfotentechnik");
} catch (error) {
  restoreAll();
  console.error(`[${PATCH}] Fehlgeschlagen; vorhandene Dateien wurden zurückgesetzt.`);
  console.error(error?.stack || error);
  process.exit(1);
}

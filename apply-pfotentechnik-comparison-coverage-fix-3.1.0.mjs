import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const yaml = require("js-yaml");

const PATCH = "pfotentechnik-comparison-coverage-fix-3.1.0";
const root = process.cwd();
const app = path.join(root, "apps", "pfotentechnik");
const comparisonDir = path.join(app, "src", "content", "comparisons");
const productDir = path.join(app, "src", "content", "products");
const backupRoot = path.join(
  root,
  ".patch-backups",
  `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

const assignments = {
  "oneisall-2-in-1-feeder-water": [
    "beste-futterautomaten-fuer-katzen",
    "beste-futterautomaten-fuer-hunde",
    "smarte-futterautomaten"
  ],
  "petkit-eversweet-3-pro-uvc": [
    "beste-katzentrinkbrunnen",
    "katzentrinkbrunnen",
    "trinkbrunnen-fuer-katzen",
    "beste-trinkbrunnen-fuer-katzen"
  ],
  "petkit-yumshare-solo-2": [
    "beste-futterautomaten-mit-kamera",
    "futterautomat-mit-kamera",
    "beste-futterautomaten-fuer-katzen",
    "beste-futterautomaten-fuer-hunde"
  ],
  "petlibro-air-wifi-feeder": [
    "beste-futterautomaten-mit-app",
    "futterautomat-mit-app",
    "beste-futterautomaten-fuer-katzen",
    "beste-futterautomaten-fuer-hunde"
  ]
};

const backups = new Map();
const changed = [];

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
  for (const [file, backupFile] of backups) fs.copyFileSync(backupFile, file);
}

function parseMarkdown(file) {
  const text = read(file);
  const match = text.match(/^---\n([\s\S]*?)\n---(?:\n|$)([\s\S]*)$/);
  if (!match) fail(`${path.relative(root, file)}: Frontmatter nicht erkannt.`);
  return {
    data: yaml.load(match[1]) || {},
    body: match[2] || ""
  };
}

function dumpMarkdown(data, body) {
  const frontmatter = yaml.dump(data, {
    noRefs: true,
    lineWidth: 120,
    sortKeys: false,
    quotingType: '"',
    forceQuotes: false
  }).trimEnd();
  return `---\n${frontmatter}\n---\n${body.replace(/^\n+/, "")}`;
}

function markdownFiles(dir) {
  return fs.readdirSync(dir)
    .filter((name) => /\.(md|mdx)$/i.test(name))
    .map((name) => path.join(dir, name));
}

function fileSlug(file, data) {
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

function render(value) {
  if (Array.isArray(value)) return value.map(render).filter(Boolean).join(", ");
  if (typeof value === "boolean") return value ? "Ja" : "Nein";
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "object") return null;
  return String(value);
}

function flatten(obj, map = new Map()) {
  if (!obj || typeof obj !== "object") return map;
  for (const [key, value] of Object.entries(obj)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      flatten(value, map);
    } else {
      const rendered = render(value);
      if (rendered && !map.has(normalize(key))) map.set(normalize(key), rendered);
    }
  }
  return map;
}

function buildProductIndex(product) {
  const map = new Map();

  for (const spec of Array.isArray(product.specs) ? product.specs : []) {
    const key = normalize(spec?.label);
    const value = render(spec?.value);
    if (key && value && !map.has(key)) map.set(key, value);
  }

  flatten(product.comparisonData, map);
  flatten(product.gps, map);

  const direct = {
    rating: product.rating,
    bewertung: product.rating,
    score: product.score,
    preis: product.price,
    pricecategory: product.priceCategory,
    preiskategorie: product.priceCategory,
    capacity: product.capacity,
    kapazitat: product.capacity,
    usecase: product.useCase,
    einsatz: product.useCase,
    features: product.features,
    productstatus: product.productStatus
  };

  for (const [key, value] of Object.entries(direct)) {
    const rendered = render(value);
    if (rendered && !map.has(normalize(key))) map.set(normalize(key), rendered);
  }

  return map;
}

const aliases = {
  kapazitat: ["kapazitat", "capacity", "fassungsvermogen", "volumen"],
  mahlzeiten: ["mahlzeiten", "facher", "futterungen"],
  futterart: ["futterart", "foodtype"],
  app: ["app", "steuerung", "appsteuerung"],
  kamera: ["kamera", "camera", "video"],
  stromversorgung: ["stromversorgung", "strom", "akku", "batterie"],
  reinigung: ["reinigung", "hygiene"],
  material: ["material", "napf", "napfmaterial"],
  filter: ["filter", "filtersystem"],
  lautstarke: ["lautstarke", "gerausch"],
  wasserschutz: ["wasserschutz", "waterproofrating", "ipklasse"],
  geeignetfur: ["geeignetfur", "eignung", "animal", "petsize"],
  tiertrennung: ["tiertrennung", "rfid", "mikrochip"],
  preis: ["preis", "pricecategory", "preiskategorie"],
  bewertung: ["bewertung", "rating"],
  score: ["score"]
};

function deriveValue(product, criterion) {
  const index = buildProductIndex(product);
  const keys = new Set([
    normalize(criterion?.key),
    normalize(criterion?.label)
  ]);

  for (const key of [...keys]) {
    for (const candidate of aliases[key] || []) keys.add(normalize(candidate));
  }

  for (const key of keys) {
    if (index.has(key)) return index.get(key);
  }

  return "Nicht in den geprüften Produktdaten ausgewiesen";
}

try {
  if (!fs.existsSync(path.join(app, "package.json"))) {
    fail("Bitte im Root von affiliate-template ausführen.");
  }

  const products = new Map();
  for (const file of markdownFiles(productDir)) {
    const parsed = parseMarkdown(file);
    products.set(fileSlug(file, parsed.data), parsed.data);
  }

  const comparisons = markdownFiles(comparisonDir).map((file) => {
    const parsed = parseMarkdown(file);
    return {
      file,
      slug: fileSlug(file, parsed.data),
      data: parsed.data,
      body: parsed.body
    };
  });

  const added = [];

  for (const [productSlug, candidates] of Object.entries(assignments)) {
    const product = products.get(productSlug);
    if (!product) fail(`Produkt fehlt: ${productSlug}`);

    let target = null;
    for (const candidate of candidates) {
      target = comparisons.find((comparison) => comparison.slug === candidate);
      if (target) break;
    }

    if (!target) {
      fail(
        `Keine passende Vergleichsseite für ${productSlug} gefunden. Geprüft: ${candidates.join(", ")}`
      );
    }

    target.data.items = Array.isArray(target.data.items) ? target.data.items : [];

    if (target.data.items.some((item) => item?.slug === productSlug)) {
      console.log(`[${PATCH}] ${productSlug} ist bereits in ${target.slug}.`);
      continue;
    }

    const values = {};
    for (const criterion of Array.isArray(target.data.criteria) ? target.data.criteria : []) {
      if (!criterion?.key) continue;
      values[criterion.key] = deriveValue(product, criterion);
    }

    target.data.items.push({
      type: "product",
      slug: productSlug,
      values
    });

    added.push(`${productSlug} -> ${target.slug}`);
  }

  for (const comparison of comparisons) {
    if (!added.some((entry) => entry.endsWith(`-> ${comparison.slug}`))) continue;
    write(comparison.file, dumpMarkdown(comparison.data, comparison.body));
  }

  console.log("");
  console.log(`[${PATCH}] Erfolgreich.`);
  console.log(`Zuordnungen: ${added.length}`);
  for (const entry of added) console.log(`- ${entry}`);
  console.log(`Backups: ${path.relative(root, backupRoot)}`);
  console.log("");
  console.log("Validierung:");
  console.log("npm --workspace apps/pfotentechnik run comparison:audit");
  console.log("npm --workspace apps/pfotentechnik run audit:products:strict");
  console.log("npm run build:pfotentechnik");
} catch (error) {
  restoreAll();
  console.error(`[${PATCH}] Fehlgeschlagen; vorhandene Dateien wurden zurückgesetzt.`);
  console.error(error?.stack || error);
  process.exit(1);
}

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";

const require = createRequire(import.meta.url);
const yaml = require("js-yaml");

const PATCH = "pfotentechnik-product-metadata-4.0.1";
const root = process.cwd();
const app = path.join(root, "apps", "pfotentechnik");
const productDir = path.join(app, "src", "content", "products");
const manufacturerDir = path.join(app, "src", "content", "manufacturers");
const assetsRoot = path.join(app, "src", "assets", "images", "products");
const reportsDir = path.join(app, "reports");
const backupRoot = path.join(
  root,
  ".patch-backups",
  `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

const UNKNOWN_PATTERNS = [
  /^nicht (?:vom hersteller )?(?:konkret )?ausgewiesen$/i,
  /^vom hersteller nicht veröffentlicht$/i,
  /^nicht dokumentiert$/i,
  /^unbekannt$/i,
  /^keine angabe$/i,
  /^keine herstellerangabe$/i,
  /^offen$/i,
  /^n\/a$/i
];

const SPEC_GROUPS = [
  ["Kapazität", "kapazitaet", "fassungsvermögen", "fassungsvermoegen", "volumen"],
  ["Futterart", "food type"],
  ["Stromversorgung", "betrieb", "laden"],
  ["Geeignet für", "geeignet fuer", "zielgruppe"],
  ["Portionierung", "portionsgröße", "portionsgroesse", "mahlzeiten"],
  ["App-Steuerung", "app steuerung", "app"],
  ["Kamera", "camera"],
  ["Napf", "napfmaterial"],
  ["Reinigung", "spülmaschinengeeignet", "spuelmaschinengeeignet"],
  ["WLAN", "wifi", "wi-fi"],
  ["Batterie", "notstrom", "backup"],
  ["Maße", "masse", "abmessungen"],
  ["Gewicht"],
  ["Lautstärke", "lautstaerke", "geräusch", "geraeusch"],
  ["Filter", "filtertyp"],
  ["Akku", "akkulaufzeit", "kabellos"],
  ["UV", "uvc"],
  ["Trinkhöhe", "trinkhoehe"],
  ["Wasserfluss", "durchfluss"],
  ["Ersatzfilter", "kompatible ersatzfilter"],
  ["Ortung", "satellitensysteme"],
  ["Übertragung", "uebertragung", "funksystem"],
  ["Reichweite", "funkreichweite"],
  ["Abo", "abonnement"],
  ["Befestigung", "halsband"],
  ["Bluetooth"],
  ["Wasserschutz", "wasserdicht", "ip-schutz"],
  ["Material", "gehäuse", "gehaeuse"]
];

const backups = new Map();
const changedFiles = [];
const log = [];
const stats = {
  productsScanned: 0,
  productsChanged: 0,
  duplicateUnknownSpecsRemoved: 0,
  unknownSpecsResolved: 0,
  specsDerivedFromExistingFields: 0,
  galleryReferencesRecovered: 0,
  comparisonDataNormalized: 0,
  manufacturerReferencesRepaired: 0
};

function fail(message) {
  throw new Error(`[${PATCH}] ${message}`);
}

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slugify(value) {
  return normalize(value).replace(/\s+/g, "-");
}

function isUnknown(value) {
  const text = String(value ?? "").trim();
  return !text || UNKNOWN_PATTERNS.some((pattern) => pattern.test(text));
}

function render(value) {
  if (Array.isArray(value)) return value.map(render).filter(Boolean).join(", ");
  if (typeof value === "boolean") return value ? "Ja" : "Nein";
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "object") return null;
  return String(value).trim();
}

function read(file) {
  if (!fs.existsSync(file)) fail(`Datei fehlt: ${path.relative(root, file)}`);
  return fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
}

function parseMarkdown(file) {
  const source = read(file);
  const match = source.match(/^---\n([\s\S]*?)\n---(?:\n|$)([\s\S]*)$/);
  if (!match) fail(`${path.relative(root, file)}: Frontmatter nicht erkannt.`);
  return { source, data: yaml.load(match[1]) || {}, body: match[2] || "" };
}

function dumpMarkdown(data, body) {
  return `---\n${yaml.dump(data, {
    noRefs: true,
    lineWidth: 120,
    sortKeys: false,
    quotingType: '"'
  }).trimEnd()}\n---\n${body.replace(/^\n+/, "")}`;
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
  changedFiles.push(path.relative(root, file));
  return true;
}

function rollback() {
  for (const [file, backupFile] of backups) fs.copyFileSync(backupFile, file);
}

function markdownFiles(dir) {
  return fs.readdirSync(dir)
    .filter((name) => /\.(md|mdx)$/i.test(name))
    .map((name) => path.join(dir, name));
}

function groupFor(label) {
  const normalized = normalize(label);
  return SPEC_GROUPS.find((group) =>
    group.map(normalize).some((alias) =>
      normalized === alias || normalized.includes(alias) || alias.includes(normalized)
    )
  ) || [normalized];
}

function sameSpecGroup(a, b) {
  const left = groupFor(a).map(normalize);
  const right = groupFor(b).map(normalize);
  return left.some((item) => right.includes(item));
}

function evidence(data, body) {
  return normalize([
    data.description,
    data.recommendation,
    data.review?.summary,
    data.review?.verdict,
    data.experience?.summary,
    data.experience?.methodology,
    data.experience?.maintenance,
    ...(data.tags || []),
    ...(data.strengths || []),
    ...(data.weaknesses || []),
    ...(data.decision?.bestFor || []),
    ...(data.decision?.attention || []),
    ...(data.specs || []).map((spec) => `${spec?.label || ""} ${spec?.value || ""}`),
    body
  ].filter(Boolean).join(" "));
}

function explicitNo(label, text) {
  const key = normalize(groupFor(label)[0]);
  const phrases = {
    "app steuerung": ["keine app", "ohne app", "app nein", "keine app steuerung"],
    "kamera": ["keine kamera", "ohne kamera", "kamera nein"],
    "wlan": ["kein wlan", "ohne wlan", "wlan nein", "kein wifi", "ohne wifi"],
    "uv": ["kein uv", "ohne uv", "uv nein", "kein uvc", "ohne uvc"],
    "akku": ["kein akkubetrieb", "ohne akkubetrieb", "nicht kabellos", "akku nein"],
    "abo": ["kein abo", "ohne abo", "abo nein", "abonnement nein"],
    "bluetooth": ["kein bluetooth", "ohne bluetooth", "bluetooth nein"]
  };
  return (phrases[key] || []).some((phrase) => text.includes(normalize(phrase)))
    ? "Nein"
    : null;
}

function deriveExistingValue(data, label) {
  const sources = [
    ["Kapazität", data.capacity],
    ["Geeignet für", data.decision?.bestFor],
    ["Reinigung", data.experience?.maintenance],
    ["Bewertung", data.rating],
    ["Score", data.score],
    ["Produktstatus", data.productStatus]
  ];

  for (const [sourceLabel, sourceValue] of sources) {
    if (!sameSpecGroup(label, sourceLabel)) continue;
    const value = render(sourceValue);
    if (value) return value;
  }

  for (const [key, value] of Object.entries(data.comparisonData?.custom || {})) {
    if (!sameSpecGroup(label, key)) continue;
    const rendered = render(value);
    if (rendered) return rendered;
  }
  return null;
}

function normalizeSpecs(data, body, slug) {
  const text = evidence(data, body);
  const output = [];

  for (const spec of Array.isArray(data.specs) ? data.specs : []) {
    if (!spec?.label) continue;

    const confirmedDuplicate = output.find(
      (item) => sameSpecGroup(item.label, spec.label) && !isUnknown(item.value)
    );

    if (isUnknown(spec.value) && confirmedDuplicate) {
      stats.duplicateUnknownSpecsRemoved++;
      continue;
    }

    if (!isUnknown(spec.value)) {
      const unknownIndex = output.findIndex(
        (item) => sameSpecGroup(item.label, spec.label) && isUnknown(item.value)
      );
      if (unknownIndex >= 0) {
        output.splice(unknownIndex, 1);
        stats.duplicateUnknownSpecsRemoved++;
      }
      output.push(spec);
      continue;
    }

    const resolved = explicitNo(spec.label, text) || deriveExistingValue(data, spec.label);
    if (resolved && !isUnknown(resolved)) {
      output.push({ ...spec, value: resolved });
      stats.unknownSpecsResolved++;
      log.push(`${slug}: ${spec.label} aus bestehenden Daten bestätigt`);
    } else {
      output.push(spec);
    }
  }

  data.specs = output;
}

function hasSpec(data, aliases) {
  return (data.specs || []).some((spec) =>
    aliases.some((alias) => sameSpecGroup(spec?.label, alias))
  );
}

function addDerivedSpecs(data, body, slug) {
  const candidates = [
    ["Geeignet für", ["Geeignet für"], render(data.decision?.bestFor)],
    ["Reinigung", ["Reinigung"], render(data.experience?.maintenance)],
    ["Kapazität", ["Kapazität"], render(data.capacity)]
  ];

  for (const [label, aliases, value] of candidates) {
    if (!value || isUnknown(value) || hasSpec(data, aliases)) continue;
    data.specs.push({ label, value });
    stats.specsDerivedFromExistingFields++;
    log.push(`${slug}: ${label} aus bestehendem Metadatenfeld ergänzt`);
  }

  const text = evidence(data, body);
  for (const label of ["App-Steuerung", "Kamera", "WLAN", "UV", "Akku", "Abo", "Bluetooth"]) {
    if (hasSpec(data, [label])) continue;
    const value = explicitNo(label, text);
    if (!value) continue;
    data.specs.push({ label, value });
    stats.specsDerivedFromExistingFields++;
  }
}

function recoverGallery(data, slug) {
  const dir = path.join(assetsRoot, slug);
  if (!fs.existsSync(dir)) return;

  data.images = data.images && typeof data.images === "object" ? data.images : {};
  const gallery = Array.isArray(data.images.gallery) ? data.images.gallery : [];
  const known = new Set(gallery.map((item) => item?.src).filter(Boolean));
  const title = data.title || slug;

  for (const filename of fs.readdirSync(dir)
    .filter((name) => /^gallery-\d+\.(webp|png|jpe?g)$/i.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))) {
    const src = `../../assets/images/products/${slug}/${filename}`;
    if (known.has(src)) continue;
    gallery.push({ src, alt: `${title} – weitere Produktansicht` });
    known.add(src);
    stats.galleryReferencesRecovered++;
  }

  if (gallery.length) data.images.gallery = gallery;
}

function manufacturerIndex() {
  const index = new Map();

  for (const file of markdownFiles(manufacturerDir)) {
    const { data } = parseMarkdown(file);
    const slug = String(data.slug || path.basename(file).replace(/\.(md|mdx)$/i, ""));
    const name = String(data.name || data.title || slug);
    const record = { slug, name, key: String(data.key || slug) };

    for (const alias of [slug, name, record.key, path.basename(file).replace(/\.(md|mdx)$/i, "")]) {
      index.set(normalize(alias), record);
      index.set(slugify(alias), record);
    }
  }

  return index;
}

function repairManufacturer(data, slug, index) {
  const current = data.manufacturer;
  const candidates = [];

  if (typeof current === "string") candidates.push(current);
  if (current && typeof current === "object") {
    candidates.push(current.slug, current.key, current.name);
  }

  let match = null;
  for (const candidate of candidates.filter(Boolean)) {
    match = index.get(normalize(candidate)) || index.get(slugify(candidate));
    if (match) break;
  }

  if (!match) return;

  const normalized = {
    key: match.key,
    name: match.name,
    slug: match.slug
  };

  if (JSON.stringify(current) !== JSON.stringify(normalized)) {
    data.manufacturer = normalized;
    stats.manufacturerReferencesRepaired++;
    log.push(`${slug}: Herstellerreferenz auf ${match.slug} normalisiert`);
  }
}

function normalizeComparisonData(data) {
  const before = JSON.stringify(data.comparisonData || null);
  const general = {
    animal: Array.isArray(data.comparisonFilters?.animal) ? data.comparisonFilters.animal : [],
    petSize: Array.isArray(data.comparisonFilters?.petSize) ? data.comparisonFilters.petSize : [],
    foodType: Array.isArray(data.comparisonFilters?.foodType) ? data.comparisonFilters.foodType : []
  };

  const custom = { ...(data.comparisonData?.custom || {}) };
  for (const spec of data.specs || []) {
    if (!spec?.label || isUnknown(spec.value)) continue;
    const key = slugify(spec.label).replace(/-/g, "_");
    if (!(key in custom)) custom[key] = spec.value;
  }

  data.comparisonData = {
    ...(data.comparisonData || {}),
    general: { ...(data.comparisonData?.general || {}), ...general },
    editorial: {
      ...(data.comparisonData?.editorial || {}),
      rating: data.rating,
      score: data.score,
      productStatus: data.productStatus
    },
    custom
  };

  if (JSON.stringify(data.comparisonData) !== before) {
    stats.comparisonDataNormalized++;
  }
}

function run(command, args, { blocking = true } = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    shell: process.platform === "win32"
  });
  process.stdout.write(result.stdout || "");
  process.stderr.write(result.stderr || "");
  if (blocking && result.status !== 0) {
    fail(`${command} ${args.join(" ")} ist fehlgeschlagen.`);
  }
  return result.status === 0;
}

try {
  if (!fs.existsSync(path.join(app, "package.json"))) {
    fail("Bitte im Root von affiliate-template ausführen.");
  }

  const manufacturers = manufacturerIndex();

  for (const file of markdownFiles(productDir)) {
    stats.productsScanned++;
    const parsed = parseMarkdown(file);
    const data = parsed.data;
    const slug = String(data.slug || path.basename(file).replace(/\.(md|mdx)$/i, ""));
    const before = JSON.stringify(data);

    repairManufacturer(data, slug, manufacturers);
    normalizeSpecs(data, parsed.body, slug);
    addDerivedSpecs(data, parsed.body, slug);
    recoverGallery(data, slug);
    normalizeComparisonData(data);

    data.metadata = {
      ...(data.metadata || {}),
      version: "4.0.1",
      normalizedAt: new Date().toISOString().slice(0, 10),
      policy: "Nur vorhandene Produkt-, Hersteller- und redaktionelle Daten; keine geschätzten technischen Werte"
    };

    if (JSON.stringify(data) !== before) {
      write(file, dumpMarkdown(data, parsed.body));
      stats.productsChanged++;
    }
  }

  fs.mkdirSync(reportsDir, { recursive: true });
  const reportPath = path.join(reportsDir, "product-metadata-4.0.1-report.json");
  fs.writeFileSync(reportPath, JSON.stringify({
    patch: PATCH,
    generatedAt: new Date().toISOString(),
    stats,
    changedFiles,
    log
  }, null, 2));

  console.log(`\n[${PATCH}] Normalisierung abgeschlossen.`);
  console.log(JSON.stringify(stats, null, 2));
  console.log(`Backups: ${path.relative(root, backupRoot)}`);

  console.log("\nBlockierende Validierungen:");
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "audit:products:strict"]);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "comparison:audit"]);
  run("npm", ["run", "build:pfotentechnik"]);

  console.log("\nRedaktioneller Lint (bestehende Warnungen sind nicht blockierend):");
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "lint:content"], { blocking: false });

  console.log(`\n[${PATCH}] Fertig.`);
  console.log(`Bericht: ${path.relative(root, reportPath)}`);
} catch (error) {
  rollback();
  console.error(`\n[${PATCH}] Fehlgeschlagen. Geänderte Produktdateien wurden zurückgesetzt.`);
  console.error(error?.stack || error);
  process.exit(1);
}

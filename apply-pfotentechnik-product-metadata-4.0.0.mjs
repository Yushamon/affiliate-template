import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";

const require = createRequire(import.meta.url);
const yaml = require("js-yaml");

const PATCH = "pfotentechnik-product-metadata-4.0.0";
const root = process.cwd();
const app = path.join(root, "apps", "pfotentechnik");
const productDir = path.join(app, "src", "content", "products");
const assetsRoot = path.join(app, "src", "assets", "images", "products");
const reportsDir = path.join(app, "reports");
const backupRoot = path.join(
  root,
  ".patch-backups",
  `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

const UNKNOWN = [
  /^nicht (?:vom hersteller )?(?:konkret )?ausgewiesen$/i,
  /^vom hersteller nicht veröffentlicht$/i,
  /^nicht dokumentiert$/i,
  /^unbekannt$/i,
  /^keine angabe$/i,
  /^keine herstellerangabe$/i,
  /^offen$/i,
  /^n\/a$/i
];

const GROUPS = {
  capacity: ["kapazität", "kapazitaet", "fassungsvermögen", "fassungsvermoegen", "volumen"],
  foodType: ["futterart", "food type"],
  power: ["stromversorgung", "betrieb", "laden"],
  suitability: ["geeignet für", "geeignet fuer", "zielgruppe"],
  portioning: ["portionierung", "portionsgröße", "portionsgroesse", "mahlzeiten"],
  app: ["app", "app-steuerung", "app steuerung"],
  camera: ["kamera", "camera"],
  bowl: ["napf", "napfmaterial"],
  cleaning: ["reinigung", "spülmaschinengeeignet", "spuelmaschinengeeignet"],
  wifi: ["wlan", "wifi", "wi-fi"],
  battery: ["batterie", "notstrom", "backup"],
  dimensions: ["maße", "masse", "abmessungen"],
  weight: ["gewicht"],
  noise: ["lautstärke", "lautstaerke", "geräusch", "geraeusch"],
  filter: ["filter", "filtertyp"],
  cordless: ["akku", "akkulaufzeit", "kabellos"],
  uv: ["uv", "uvc"],
  drinkingHeight: ["trinkhöhe", "trinkhoehe"],
  waterFlow: ["wasserfluss", "durchfluss"],
  replacementFilter: ["ersatzfilter", "kompatible ersatzfilter"],
  tracking: ["ortung", "satellitensysteme"],
  transmission: ["übertragung", "uebertragung", "funksystem"],
  range: ["reichweite", "funkreichweite"],
  subscription: ["abo", "abonnement"],
  batteryLife: ["akkulaufzeit", "akku"],
  attachment: ["befestigung", "halsband"],
  bluetooth: ["bluetooth"],
  waterProtection: ["wasserschutz", "wasserdicht", "ip-schutz"],
  material: ["material", "gehäuse", "gehaeuse"]
};

const backups = new Map();
const changedFiles = [];
const changes = [];
const stats = {
  productsScanned: 0,
  productsChanged: 0,
  duplicateSpecsRemoved: 0,
  unknownSpecsResolved: 0,
  specsAddedFromExistingData: 0,
  imagesRecovered: 0,
  galleryImagesRecovered: 0,
  comparisonDataNormalized: 0,
  metadataProvenanceAdded: 0
};

function fail(message) {
  throw new Error(`[${PATCH}] ${message}`);
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
  const frontmatter = yaml.dump(data, {
    noRefs: true,
    lineWidth: 120,
    sortKeys: false,
    quotingType: '"',
    forceQuotes: false
  }).trimEnd();
  return `---\n${frontmatter}\n---\n${body.replace(/^\n+/, "")}`;
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

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function isUnknown(value) {
  const text = String(value ?? "").trim();
  return !text || UNKNOWN.some((pattern) => pattern.test(text));
}

function render(value) {
  if (Array.isArray(value)) return value.map(render).filter(Boolean).join(", ");
  if (typeof value === "boolean") return value ? "Ja" : "Nein";
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return String(value);
  if (typeof value === "object") return null;
  return String(value).trim();
}

function aliasesFor(label) {
  const n = normalize(label);
  for (const aliases of Object.values(GROUPS)) {
    const normalized = aliases.map(normalize);
    if (normalized.some((alias) => n === alias || n.includes(alias) || alias.includes(n))) {
      return normalized;
    }
  }
  return [n];
}

function sameGroup(a, b) {
  const aa = aliasesFor(a);
  const bb = aliasesFor(b);
  return aa.some((x) => bb.includes(x));
}

function evidenceText(data, body) {
  const parts = [
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
    ...(data.specs || []).map((s) => `${s?.label || ""}: ${s?.value || ""}`),
    body
  ];
  return normalize(parts.filter(Boolean).join(" "));
}

function explicitNegative(label, evidence) {
  const checks = {
    app: [
      "keine app", "kein app", "ohne app", "app nein", "nicht app fahig",
      "keine app steuerung", "ohne app steuerung"
    ],
    camera: ["keine kamera", "kein kamera", "ohne kamera", "kamera nein"],
    wifi: ["kein wlan", "keine wlan", "ohne wlan", "wlan nein", "kein wifi", "ohne wifi"],
    uv: ["kein uv", "keine uv", "ohne uv", "uv nein", "kein uvc", "ohne uvc"],
    cordless: [
      "kein akkubetrieb", "ohne akkubetrieb", "nicht kabellos", "kabelgebunden",
      "netzbetrieb", "akku nein"
    ],
    subscription: ["kein abo", "ohne abo", "abo nein", "abonnement nein"],
    bluetooth: ["kein bluetooth", "ohne bluetooth", "bluetooth nein"]
  };

  const group = Object.entries(GROUPS).find(([, aliases]) =>
    aliases.map(normalize).some((alias) => normalize(label).includes(alias))
  )?.[0];

  if (!group || !checks[group]) return null;
  return checks[group].some((phrase) => evidence.includes(normalize(phrase))) ? "Nein" : null;
}

function valueFromExistingData(data, label) {
  const n = normalize(label);

  const candidates = [
    ["Kapazität", data.capacity],
    ["Geeignet für", data.decision?.bestFor],
    ["Reinigung", data.experience?.maintenance],
    ["Bewertung", data.rating],
    ["Score", data.score],
    ["Produktstatus", data.productStatus]
  ];

  for (const [candidateLabel, value] of candidates) {
    if (!sameGroup(n, candidateLabel)) continue;
    const rendered = render(value);
    if (rendered) return rendered;
  }

  const custom = data.comparisonData?.custom;
  if (custom && typeof custom === "object") {
    for (const [key, value] of Object.entries(custom)) {
      if (!sameGroup(n, key)) continue;
      const rendered = render(value);
      if (rendered) return rendered;
    }
  }

  return null;
}

function cleanSpecs(data, body, slug) {
  const specs = Array.isArray(data.specs) ? data.specs.filter(Boolean) : [];
  const evidence = evidenceText(data, body);
  const result = [];

  for (const spec of specs) {
    if (!spec?.label) continue;

    const existingConfirmed = result.find(
      (other) => sameGroup(other.label, spec.label) && !isUnknown(other.value)
    );

    if (isUnknown(spec.value) && existingConfirmed) {
      stats.duplicateSpecsRemoved++;
      changes.push(`${slug}: unbekanntes Duplikat „${spec.label}“ entfernt`);
      continue;
    }

    if (!isUnknown(spec.value)) {
      const earlierUnknownIndex = result.findIndex(
        (other) => sameGroup(other.label, spec.label) && isUnknown(other.value)
      );
      if (earlierUnknownIndex >= 0) {
        result.splice(earlierUnknownIndex, 1);
        stats.duplicateSpecsRemoved++;
      }
      result.push(spec);
      continue;
    }

    const negative = explicitNegative(spec.label, evidence);
    const recovered = negative || valueFromExistingData(data, spec.label);
    if (recovered && !isUnknown(recovered)) {
      result.push({ ...spec, value: recovered });
      stats.unknownSpecsResolved++;
      changes.push(`${slug}: „${spec.label}“ aus bestehenden Produktdaten bestätigt`);
    } else {
      result.push(spec);
    }
  }

  data.specs = result;
}

function hasSpec(data, aliases) {
  return (data.specs || []).some((spec) => {
    const label = normalize(spec?.label);
    return aliases.map(normalize).some((alias) => label === alias || label.includes(alias));
  });
}

function addDerivedSpecs(data, body, slug) {
  const candidates = [
    {
      label: "Geeignet für",
      aliases: GROUPS.suitability,
      value: () => render(data.decision?.bestFor)
    },
    {
      label: "Reinigung",
      aliases: GROUPS.cleaning,
      value: () => render(data.experience?.maintenance)
    },
    {
      label: "Kapazität",
      aliases: GROUPS.capacity,
      value: () => render(data.capacity)
    }
  ];

  for (const candidate of candidates) {
    if (hasSpec(data, candidate.aliases)) continue;
    const value = candidate.value();
    if (!value || isUnknown(value)) continue;
    data.specs.push({ label: candidate.label, value });
    stats.specsAddedFromExistingData++;
    changes.push(`${slug}: Spec „${candidate.label}“ aus bestehendem Feld ergänzt`);
  }

  const evidence = evidenceText(data, body);
  const negativeCandidates = [
    ["App", GROUPS.app],
    ["Kamera", GROUPS.camera],
    ["WLAN", GROUPS.wifi],
    ["UV", GROUPS.uv],
    ["Akku", GROUPS.cordless],
    ["Abo", GROUPS.subscription],
    ["Bluetooth", GROUPS.bluetooth]
  ];

  for (const [label, aliases] of negativeCandidates) {
    if (hasSpec(data, aliases)) continue;
    const negative = explicitNegative(label, evidence);
    if (!negative) continue;
    data.specs.push({ label, value: negative });
    stats.specsAddedFromExistingData++;
    changes.push(`${slug}: explizit belegtes „${label}: Nein“ ergänzt`);
  }
}

function findAsset(slug, names) {
  const dir = path.join(assetsRoot, slug);
  if (!fs.existsSync(dir)) return null;
  for (const name of names) {
    const file = path.join(dir, name);
    if (fs.existsSync(file)) {
      return `../../assets/images/products/${slug}/${name}`.replace(/\\/g, "/");
    }
  }
  return null;
}

function recoverImages(data, slug) {
  data.images = data.images && typeof data.images === "object" ? data.images : {};
  const title = data.title || slug;

  if (!data.images.hero) {
    const src = findAsset(slug, ["hero.webp", "hero.jpg", "hero.png"]);
    if (src) {
      data.images.hero = { src, alt: `${title} – Produktansicht` };
      stats.imagesRecovered++;
    }
  }

  if (!data.images.thumbnail) {
    const src = findAsset(slug, ["thumbnail.webp", "thumbnail.jpg", "thumbnail.png"]);
    if (src) {
      data.images.thumbnail = { src, alt: `${title} als Thumbnail` };
      stats.imagesRecovered++;
    }
  }

  if (!data.images.comparison) {
    const src = findAsset(slug, ["comparison.webp", "comparison.jpg", "comparison.png"]);
    if (src) {
      data.images.comparison = { src, alt: `${title} im Vergleich` };
      stats.imagesRecovered++;
    }
  }

  const gallery = Array.isArray(data.images.gallery) ? data.images.gallery : [];
  const known = new Set(gallery.map((item) => item?.src).filter(Boolean));
  const dir = path.join(assetsRoot, slug);

  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir)
      .filter((name) => /^gallery-\d+\.(webp|jpg|jpeg|png)$/i.test(name))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    for (const file of files) {
      const src = `../../assets/images/products/${slug}/${file}`;
      if (known.has(src)) continue;
      gallery.push({ src, alt: `${title} – weitere Produktansicht` });
      known.add(src);
      stats.galleryImagesRecovered++;
    }
  }

  if (gallery.length) data.images.gallery = gallery;
}

function normalizeComparisonData(data) {
  const before = JSON.stringify(data.comparisonData || null);
  const animal = Array.isArray(data.comparisonFilters?.animal)
    ? data.comparisonFilters.animal
    : [];
  const petSize = Array.isArray(data.comparisonFilters?.petSize)
    ? data.comparisonFilters.petSize
    : [];
  const foodType = Array.isArray(data.comparisonFilters?.foodType)
    ? data.comparisonFilters.foodType
    : [];

  data.comparisonData = data.comparisonData && typeof data.comparisonData === "object"
    ? data.comparisonData
    : {};
  data.comparisonData.general = {
    ...(data.comparisonData.general || {}),
    animal,
    petSize,
    foodType
  };
  data.comparisonData.editorial = {
    ...(data.comparisonData.editorial || {}),
    rating: data.rating,
    score: data.score,
    productStatus: data.productStatus
  };

  const custom = { ...(data.comparisonData.custom || {}) };
  for (const spec of data.specs || []) {
    if (!spec?.label || isUnknown(spec.value)) continue;
    const key = normalize(spec.label).replace(/\s+/g, "_");
    if (!(key in custom)) custom[key] = spec.value;
  }
  data.comparisonData.custom = custom;

  if (JSON.stringify(data.comparisonData) !== before) stats.comparisonDataNormalized++;
}

function addProvenance(data) {
  if (data.metadata?.version === "4.0") return;
  data.metadata = {
    ...(data.metadata || {}),
    version: "4.0",
    normalizedAt: new Date().toISOString().slice(0, 10),
    policy: "Nur vorhandene Produkt-, Hersteller- und redaktionelle Daten; keine geschätzten technischen Werte"
  };
  stats.metadataProvenanceAdded++;
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    shell: process.platform === "win32"
  });
  process.stdout.write(result.stdout || "");
  process.stderr.write(result.stderr || "");
  return result.status === 0;
}

try {
  if (!fs.existsSync(path.join(app, "package.json"))) {
    fail("Bitte im Root des Repositorys affiliate-template ausführen.");
  }

  const files = fs.readdirSync(productDir)
    .filter((name) => /\.(md|mdx)$/i.test(name))
    .map((name) => path.join(productDir, name));

  for (const file of files) {
    stats.productsScanned++;
    const parsed = parseMarkdown(file);
    const data = parsed.data;
    const slug = String(data.slug || path.basename(file).replace(/\.(md|mdx)$/i, ""));
    const before = JSON.stringify(data);

    cleanSpecs(data, parsed.body, slug);
    addDerivedSpecs(data, parsed.body, slug);
    recoverImages(data, slug);
    normalizeComparisonData(data);
    addProvenance(data);

    if (JSON.stringify(data) !== before) {
      write(file, dumpMarkdown(data, parsed.body));
      stats.productsChanged++;
    }
  }

  fs.mkdirSync(reportsDir, { recursive: true });
  const report = {
    patch: PATCH,
    generatedAt: new Date().toISOString(),
    stats,
    changedFiles,
    changes
  };
  const reportPath = path.join(reportsDir, "product-metadata-4.0-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");

  console.log("");
  console.log(`[${PATCH}] Produkt-Metadaten normalisiert.`);
  console.log(`Produkte geprüft: ${stats.productsScanned}`);
  console.log(`Produkte geändert: ${stats.productsChanged}`);
  console.log(`Unbekannte Duplikate entfernt: ${stats.duplicateSpecsRemoved}`);
  console.log(`Unbekannte Werte aus vorhandenen Daten bestätigt: ${stats.unknownSpecsResolved}`);
  console.log(`Specs aus bestehenden Feldern ergänzt: ${stats.specsAddedFromExistingData}`);
  console.log(`Bildreferenzen wiederhergestellt: ${stats.imagesRecovered}`);
  console.log(`Galeriebilder wiederhergestellt: ${stats.galleryImagesRecovered}`);
  console.log(`ComparisonData normalisiert: ${stats.comparisonDataNormalized}`);
  console.log(`Backups: ${path.relative(root, backupRoot)}`);
  console.log("");

  console.log("Validierung läuft ...");
  const auditOk = run("npm", ["--workspace", "apps/pfotentechnik", "run", "audit:products:strict"]);
  const comparisonOk = run("npm", ["--workspace", "apps/pfotentechnik", "run", "comparison:audit"]);
  const lintOk = run("npm", ["--workspace", "apps/pfotentechnik", "run", "lint:content"]);
  const buildOk = run("npm", ["run", "build:pfotentechnik"]);

  if (!auditOk || !comparisonOk || !lintOk || !buildOk) {
    fail("Mindestens eine Validierung ist fehlgeschlagen.");
  }

  console.log("");
  console.log(`[${PATCH}] Fertig. Alle Validierungen waren erfolgreich.`);
  console.log(`Bericht: ${path.relative(root, reportPath)}`);
} catch (error) {
  rollback();
  console.error("");
  console.error(`[${PATCH}] Fehlgeschlagen. Alle geänderten Produktdateien wurden zurückgesetzt.`);
  console.error(error?.stack || error);
  process.exit(1);
}

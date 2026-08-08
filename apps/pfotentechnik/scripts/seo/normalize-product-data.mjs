#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const PRODUCTS_DIR = path.join(APP_ROOT, "src/content/products");
const COMPARISONS_DIR = path.join(APP_ROOT, "src/content/comparisons");
const REPORT_DIR = path.join(APP_ROOT, "reports/product-data-normalizer");
const writeMode = process.argv.includes("--write");
const checkMode = process.argv.includes("--check") || !writeMode;
const backupRoot = process.env.PT_PRODUCT_NORMALIZER_BACKUP_ROOT || "";

const UNKNOWN = [
  /^nicht (?:vom hersteller )?(?:konkret )?ausgewiesen$/i,
  /^vom hersteller nicht veröffentlicht$/i,
  /^nicht dokumentiert$/i,
  /^unbekannt$/i,
  /^keine angabe$/i,
  /^offen$/i,
  /^n\/a$/i
];

const walk = (dir) =>
  fs.existsSync(dir)
    ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) return walk(full);
        return entry.isFile() && /\.mdx?$/i.test(entry.name) ? [full] : [];
      })
    : [];

const read = (file) => fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
const quote = (value) => JSON.stringify(String(value ?? ""));
const unquote = (value) => {
  const text = String(value || "").trim().replace(/,$/, "");
  if (
    (text.startsWith('"') && text.endsWith('"')) ||
    (text.startsWith("'") && text.endsWith("'"))
  ) return text.slice(1, -1);
  return text;
};

const splitDocument = (source) => {
  if (!source.startsWith("---\n")) throw new Error("Frontmatter fehlt");
  const end = source.indexOf("\n---", 4);
  if (end < 0) throw new Error("Frontmatter nicht geschlossen");
  return { frontmatter: source.slice(4, end), body: source.slice(end + 4) };
};

const joinDocument = ({ frontmatter, body }) =>
  `---\n${frontmatter.replace(/\n+$/, "")}\n---${body}`;

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const topScalar = (frontmatter, key) => {
  const match = frontmatter.match(new RegExp(`^${escapeRegex(key)}:\\s*(.+)$`, "m"));
  if (!match) return "";
  const raw = match[1].trim();
  if (raw.startsWith("{") || raw.startsWith("[")) return "";
  return unquote(raw);
};

const findSection = (frontmatter, key) => {
  const lines = frontmatter.split("\n");
  const start = lines.findIndex(
    (line) => line === `${key}:` || line.startsWith(`${key}: `)
  );
  if (start < 0) return null;
  if (lines[start] !== `${key}:`) return { lines, start, end: start + 1, inline: true };

  let end = start + 1;
  while (end < lines.length && (!lines[end] || /^[ \t]/.test(lines[end]))) end += 1;
  return { lines, start, end, inline: false };
};

const sectionText = (frontmatter, key) => {
  const section = findSection(frontmatter, key);
  return section ? section.lines.slice(section.start, section.end).join("\n") : "";
};

const replaceSection = (frontmatter, key, replacementLines) => {
  const section = findSection(frontmatter, key);
  const lines = frontmatter.split("\n");
  if (!section) {
    lines.push(...replacementLines);
    return lines.join("\n");
  }
  lines.splice(section.start, section.end - section.start, ...replacementLines);
  return lines.join("\n");
};

const insertBefore = (frontmatter, keys, newLines) => {
  const lines = frontmatter.split("\n");
  let index = -1;
  for (const key of keys) {
    index = lines.findIndex((line) => line === `${key}:` || line.startsWith(`${key}: `));
    if (index >= 0) break;
  }
  if (index < 0) lines.push(...newLines);
  else lines.splice(index, 0, ...newLines);
  return lines.join("\n");
};

const parseStringArray = (frontmatter, key) => {
  const section = findSection(frontmatter, key);
  if (!section) return [];
  const first = section.lines[section.start];

  if (section.inline) {
    const raw = first.slice(first.indexOf(":") + 1).trim();
    if (!raw.startsWith("[") || !raw.endsWith("]")) return [];
    const inner = raw.slice(1, -1).trim();
    return inner ? inner.split(",").map((value) => unquote(value.trim())).filter(Boolean) : [];
  }

  return section.lines
    .slice(section.start + 1, section.end)
    .map((line) => unquote(line.match(/^\s*-\s+(.+?)\s*$/)?.[1] || ""))
    .filter(Boolean);
};

const setStringArray = (frontmatter, key, values) =>
  replaceSection(frontmatter, key, [
    `${key}:`,
    ...[...new Set(values)].map((value) => `  - ${quote(value)}`)
  ]);

const isKnown = (value) => {
  const text = String(value || "").trim();
  return Boolean(text) && !UNKNOWN.some((pattern) => pattern.test(text));
};

const normalizeLabel = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const hasCapacitySpec = (frontmatter) => {
  const block = sectionText(frontmatter, "specs");
  const labels = [...block.matchAll(/(?:^|\n)\s*-\s*(?:\{\s*)?label:\s*["']?([^"',}\n]+)/g)]
    .map((match) => normalizeLabel(match[1]));
  return labels.some(
    (label) => label.includes("kapazitat") || label.includes("fassungsvermogen")
  );
};

const appendCapacitySpec = (frontmatter, value) => {
  const section = findSection(frontmatter, "specs");
  const item = [
    '  - label: "Kapazität"',
    `    value: ${quote(value)}`
  ];

  if (!section) {
    return insertBefore(
      frontmatter,
      ["faq", "useCase", "capacity", "features", "comparisonData"],
      ["specs:", ...item]
    );
  }

  if (section.inline && section.lines[section.start].trim() === "specs: []") {
    return replaceSection(frontmatter, "specs", ["specs:", ...item]);
  }
  if (section.inline) return frontmatter;

  const lines = frontmatter.split("\n");
  lines.splice(section.end, 0, ...item);
  return lines.join("\n");
};

const imageSrc = (imagesBlock, role) => {
  const escaped = escapeRegex(role);
  let match = imagesBlock.match(
    new RegExp(`(?:^|\\n)\\s{2}${escaped}:\\s*\\{[^\\n}]*?src:\\s*["']?([^"',}\\n]+)`, "i")
  );
  if (match) return unquote(match[1]);

  match = imagesBlock.match(
    new RegExp(
      `(?:^|\\n)\\s{2}${escaped}:\\s*\\n(?:\\s{4}[^\\n]*\\n)*?\\s{4}src:\\s*["']?([^"'\\n]+)`,
      "i"
    )
  );
  return match ? unquote(match[1]) : "";
};

const allImageSrcs = (imagesBlock) =>
  [...String(imagesBlock || "").matchAll(/\bsrc:\s*["']?([^"',}\n]+)["']?/g)]
    .map((match) => unquote(match[1]));

const resolveImage = (productFile, src) => path.resolve(path.dirname(productFile), src);
const relativeImage = (productFile, absolute) =>
  path.relative(path.dirname(productFile), absolute).replaceAll("\\", "/");

const replacementForMissingImage = (productFile, src) => {
  const requested = resolveImage(productFile, src);
  if (fs.existsSync(requested)) return "";

  const directory = path.dirname(requested);
  if (!fs.existsSync(directory)) return "";
  const names = fs.readdirSync(directory);
  const base = path.basename(requested);

  const exactCaseInsensitive = names.filter(
    (name) => name.toLowerCase() === base.toLowerCase()
  );
  if (exactCaseInsensitive.length === 1) {
    return relativeImage(productFile, path.join(directory, exactCaseInsensitive[0]));
  }

  const stem = path.basename(requested, path.extname(requested)).toLowerCase();
  const webp = names.filter(
    (name) =>
      path.extname(name).toLowerCase() === ".webp" &&
      path.basename(name, path.extname(name)).toLowerCase() === stem
  );

  return webp.length === 1
    ? relativeImage(productFile, path.join(directory, webp[0]))
    : "";
};

const repairImageReferences = (frontmatter, productFile) => {
  const section = findSection(frontmatter, "images");
  if (!section || section.inline) return { frontmatter, repairs: [] };

  const lines = frontmatter.split("\n");
  const repairs = [];

  for (let index = section.start + 1; index < section.end; index += 1) {
    const match = lines[index].match(/^(.*\bsrc:\s*)(["']?)([^"',}\n]+)\2(.*)$/);
    if (!match) continue;
    const current = match[3].trim();
    const replacement = replacementForMissingImage(productFile, current);
    if (!replacement) continue;
    lines[index] = `${match[1]}${quote(replacement)}${match[4]}`;
    repairs.push({ from: current, to: replacement });
  }

  return { frontmatter: lines.join("\n"), repairs };
};

const imageDirectory = (frontmatter, productFile) => {
  const hero = imageSrc(sectionText(frontmatter, "images"), "hero");
  const slug = topScalar(frontmatter, "slug") || path.basename(productFile).replace(/\.mdx?$/i, "");
  return hero
    ? path.dirname(resolveImage(productFile, hero))
    : path.join(APP_ROOT, "src/assets/images/products", slug);
};

const ensureImageRole = (frontmatter, productFile, title, role, filename, alt) => {
  const section = findSection(frontmatter, "images");
  if (!section || section.inline) return { frontmatter, changed: false, missing: true };
  if (imageSrc(sectionText(frontmatter, "images"), role)) {
    return { frontmatter, changed: false, missing: false };
  }

  const asset = path.join(imageDirectory(frontmatter, productFile), filename);
  if (!fs.existsSync(asset)) return { frontmatter, changed: false, missing: true };

  const lines = frontmatter.split("\n");
  const currentSection = findSection(frontmatter, "images");
  lines.splice(
    currentSection.end,
    0,
    `  ${role}:`,
    `    src: ${quote(relativeImage(productFile, asset))}`,
    `    alt: ${quote(alt)}`
  );
  return { frontmatter: lines.join("\n"), changed: true, missing: false };
};

const ensureGallery = (frontmatter, productFile, title) => {
  const section = findSection(frontmatter, "images");
  if (!section || section.inline) return { frontmatter, added: 0, available: 0 };

  const directory = imageDirectory(frontmatter, productFile);
  if (!fs.existsSync(directory)) return { frontmatter, added: 0, available: 0 };

  const available = fs.readdirSync(directory)
    .filter((name) => /^gallery-\d+\.webp$/i.test(name))
    .sort((a, b) => Number(a.match(/\d+/)?.[0] || 0) - Number(b.match(/\d+/)?.[0] || 0));

  const existing = new Set(allImageSrcs(sectionText(frontmatter, "images")));
  const missing = available
    .map((name) => ({
      name,
      src: relativeImage(productFile, path.join(directory, name))
    }))
    .filter((item) => !existing.has(item.src));

  if (!missing.length) return { frontmatter, added: 0, available: available.length };

  const lines = frontmatter.split("\n");
  const current = findSection(frontmatter, "images");
  const imageLines = lines.slice(current.start, current.end);
  const entries = missing.flatMap((item, index) => [
    `    - src: ${quote(item.src)}`,
    `      alt: ${quote(`${title}, weitere Produktansicht ${index + 1}`)}`
  ]);

  let galleryIndex = imageLines.findIndex((line) => /^\s{2}gallery:\s*\[\s*\]\s*$/.test(line));
  if (galleryIndex >= 0) {
    imageLines.splice(galleryIndex, 1, "  gallery:", ...entries);
  } else {
    galleryIndex = imageLines.findIndex((line) => /^\s{2}gallery:\s*$/.test(line));
    if (galleryIndex >= 0) {
      let insertAt = galleryIndex + 1;
      while (
        insertAt < imageLines.length &&
        !/^\s{2}[A-Za-z0-9_-]+:\s*/.test(imageLines[insertAt])
      ) insertAt += 1;
      imageLines.splice(insertAt, 0, ...entries);
    } else {
      imageLines.push("  gallery:", ...entries);
    }
  }

  lines.splice(current.start, current.end - current.start, ...imageLines);
  return { frontmatter: lines.join("\n"), added: missing.length, available: available.length };
};

const comparisonMembership = new Map();
for (const comparisonFile of walk(COMPARISONS_DIR)) {
  let document;
  try {
    document = splitDocument(read(comparisonFile));
  } catch {
    continue;
  }

  const comparisonSlug =
    topScalar(document.frontmatter, "slug") ||
    path.basename(comparisonFile).replace(/\.mdx?$/i, "");
  const items = findSection(document.frontmatter, "items");
  if (!items || items.inline) continue;

  const block = items.lines.slice(items.start + 1, items.end).join("\n");
  for (const match of block.matchAll(/^\s{2}-\s+slug:\s*["']?([^"'\n]+)["']?\s*$/gm)) {
    const productSlug = unquote(match[1]);
    const values = comparisonMembership.get(productSlug) || new Set();
    values.add(comparisonSlug);
    comparisonMembership.set(productSlug, values);
  }
}

const plans = [];
const missingAssets = [];
const staleComparisonRelations = [];

for (const productFile of walk(PRODUCTS_DIR)) {
  const source = read(productFile);
  let document;
  try {
    document = splitDocument(source);
  } catch (error) {
    plans.push({ file: productFile, changed: false, actions: [], error: String(error) });
    continue;
  }

  let frontmatter = document.frontmatter;
  const slug = topScalar(frontmatter, "slug") || path.basename(productFile).replace(/\.mdx?$/i, "");
  const title = topScalar(frontmatter, "title") || slug;
  const actions = [];

  const repaired = repairImageReferences(frontmatter, productFile);
  frontmatter = repaired.frontmatter;
  for (const repair of repaired.repairs) {
    actions.push({ type: "repair-image-reference", detail: `${repair.from} -> ${repair.to}` });
  }

  for (const [role, filename, alt] of [
    ["thumbnail", "thumbnail.webp", `${title} als kompakte Produktansicht`],
    ["comparison", "comparison.webp", `${title} im Produktvergleich`]
  ]) {
    const result = ensureImageRole(frontmatter, productFile, title, role, filename, alt);
    frontmatter = result.frontmatter;
    if (result.changed) actions.push({ type: `add-${role}-image`, detail: filename });
    else if (result.missing) missingAssets.push({ slug, role, expected: filename });
  }

  const gallery = ensureGallery(frontmatter, productFile, title);
  frontmatter = gallery.frontmatter;
  if (gallery.added) {
    actions.push({ type: "add-gallery-images", detail: `${gallery.added} vorhandene WebP-Datei(en)` });
  }
  if (gallery.available < 2) {
    missingAssets.push({
      slug,
      role: "gallery",
      expected: "gallery-1.webp + gallery-2.webp",
      available: gallery.available
    });
  }

  const capacity = topScalar(frontmatter, "capacity");
  if (isKnown(capacity) && !hasCapacitySpec(frontmatter)) {
    const next = appendCapacitySpec(frontmatter, capacity);
    if (next !== frontmatter) {
      frontmatter = next;
      actions.push({ type: "normalize-capacity-spec", detail: capacity });
    }
  }

  const expectedComparisons = [...(comparisonMembership.get(slug) || [])].sort();
  const currentComparisons = parseStringArray(frontmatter, "comparisons");
  const missingComparisons = expectedComparisons.filter(
    (comparison) => !currentComparisons.includes(comparison)
  );

  if (missingComparisons.length) {
    frontmatter = setStringArray(
      frontmatter,
      "comparisons",
      [...currentComparisons, ...missingComparisons]
    );
    actions.push({
      type: "sync-comparison-relations",
      detail: missingComparisons.join(", ")
    });
  }

  const stale = currentComparisons.filter(
    (comparison) => !expectedComparisons.includes(comparison)
  );
  if (stale.length) staleComparisonRelations.push({ slug, comparisons: stale });

  const expectedRoute = `/produkt/${slug}/`;
  const productUrl = topScalar(frontmatter, "productUrl");
  if (!productUrl) {
    frontmatter = insertBefore(
      frontmatter,
      ["publishedAt", "updatedAt", "author", "seo", "hub", "tags", "images"],
      [`productUrl: ${quote(expectedRoute)}`]
    );
    actions.push({ type: "add-product-url", detail: expectedRoute });
  } else if (productUrl !== expectedRoute) {
    frontmatter = frontmatter.replace(
      /^productUrl:\s*.+$/m,
      `productUrl: ${quote(expectedRoute)}`
    );
    actions.push({
      type: "repair-product-url",
      detail: `${productUrl} -> ${expectedRoute}`
    });
  }

  const nextSource = joinDocument({ frontmatter, body: document.body });
  plans.push({
    file: productFile,
    slug,
    title,
    source,
    nextSource,
    changed: nextSource !== source,
    actions
  });
}

const changedPlans = plans.filter((plan) => plan.changed);
const parseErrors = plans.filter((plan) => plan.error);
const actionCounts = {};
for (const plan of changedPlans) {
  for (const action of plan.actions) {
    actionCounts[action.type] = (actionCounts[action.type] || 0) + 1;
  }
}

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  mode: writeMode ? "write" : "check",
  summary: {
    products: plans.length,
    changedProducts: changedPlans.length,
    actions: changedPlans.reduce((sum, plan) => sum + plan.actions.length, 0),
    missingAssets: missingAssets.length,
    staleComparisonRelations: staleComparisonRelations.length,
    errors: parseErrors.length
  },
  actionCounts,
  changedProducts: changedPlans.map((plan) => ({
    slug: plan.slug,
    file: path.relative(APP_ROOT, plan.file).replaceAll("\\", "/"),
    actions: plan.actions
  })),
  missingAssets,
  staleComparisonRelations,
  errors: parseErrors.map((plan) => ({ file: plan.file, error: plan.error }))
};

fs.mkdirSync(REPORT_DIR, { recursive: true });
fs.writeFileSync(
  path.join(REPORT_DIR, "normalizer-latest.json"),
  JSON.stringify(report, null, 2) + "\n",
  "utf8"
);
fs.writeFileSync(
  path.join(REPORT_DIR, "normalizer-latest.md"),
  [
    "# Product Data Normalizer",
    "",
    `- Modus: ${report.mode}`,
    `- Produkte: ${report.summary.products}`,
    `- Änderungsbedarf: ${report.summary.changedProducts}`,
    `- Sichere Aktionen: ${report.summary.actions}`,
    `- Fehlende Bildassets: ${report.summary.missingAssets}`,
    `- Alte Vergleichsrelationen (nur Report): ${report.summary.staleComparisonRelations}`,
    `- Parserfehler: ${report.summary.errors}`,
    "",
    "## Auto-Fixes",
    "",
    ...(Object.keys(actionCounts).length
      ? Object.entries(actionCounts).map(([key, value]) => `- ${key}: ${value}`)
      : ["Keine."]),
    "",
    "## Fehlende Bildassets",
    "",
    ...(missingAssets.length
      ? missingAssets.map((item) => `- ${item.slug}: ${item.role} (${item.expected})`)
      : ["Keine."]),
    ""
  ].join("\n"),
  "utf8"
);

if (parseErrors.length) {
  console.error(`Product Data Normalizer: ${parseErrors.length} Parserfehler.`);
  process.exitCode = 1;
} else if (checkMode && changedPlans.length) {
  console.error(
    `Product Data Normalizer nicht synchron: ${changedPlans.length} Produktdatei(en).`
  );
  console.error("Ausführen: npm run product:data:normalize");
  process.exitCode = 1;
} else if (writeMode) {
  for (const plan of changedPlans) {
    if (backupRoot) {
      const backupFile = path.join(backupRoot, path.relative(APP_ROOT, plan.file));
      fs.mkdirSync(path.dirname(backupFile), { recursive: true });
      if (!fs.existsSync(backupFile)) fs.copyFileSync(plan.file, backupFile);
    }
    fs.writeFileSync(plan.file, plan.nextSource, "utf8");
  }

  console.log(
    `Product Data Normalizer: ${changedPlans.length} Produktdatei(en), ` +
    `${report.summary.actions} sichere Aktion(en).`
  );
  if (missingAssets.length) {
    console.warn(
      `${missingAssets.length} Bildasset-Anforderung(en) bleiben offen; es wurden keine Bilder erfunden.`
    );
  }
  if (staleComparisonRelations.length) {
    console.warn(
      `${staleComparisonRelations.length} alte Vergleichsrelation(en) nur gemeldet, nicht gelöscht.`
    );
  }
} else {
  console.log(
    `Product Data Normalizer aktuell: ${plans.length} Produkte, keine sicheren Änderungen offen.`
  );
  if (missingAssets.length) {
    console.warn(
      `${missingAssets.length} Bildasset-Anforderung(en) bleiben als Finding offen.`
    );
  }
}

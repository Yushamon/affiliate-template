#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

const PATCH = "pfotentechnik-katzenklappen-product-md-normalization-30.2.0";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const APP = path.join(ROOT, "apps", "pfotentechnik");
const PRODUCTS = path.join(APP, "src", "content", "products");
const PACKAGE = path.join(APP, "package.json");
const TEST = path.join(APP, "test", "katzenklappen-product-md-normalization-30.2.0.test.mjs");
const BACKUP = path.join(
  ROOT,
  ".patch-backups",
  `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

const log = (message) => console.log(`[${PATCH}] ${message}`);
const quote = (value) => JSON.stringify(String(value));

function splitDocument(source, file) {
  const match = String(source).replace(/^\uFEFF/, "").match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error(`${file}: gültiges YAML-Frontmatter fehlt.`);
  return {
    frontmatter: match[1],
    body: source.slice(match[0].length)
  };
}

function backup(file) {
  const target = path.join(BACKUP, path.relative(ROOT, file));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
}

function topLevelRange(lines, key) {
  const start = lines.findIndex((line) => new RegExp(`^${key}:\\s*`).test(line));
  if (start < 0) return null;

  // Inline-Wert endet auf derselben Zeile. Mehrzeiliger Block umfasst
  // eingerückte Folgezeilen und Leerzeilen bis zum nächsten Top-Level-Key.
  if (!new RegExp(`^${key}:\\s*(?:#.*)?$`).test(lines[start])) {
    return { start, end: start + 1 };
  }

  let end = start + 1;
  while (
    end < lines.length &&
    (/^\s+/.test(lines[end]) || !lines[end].trim())
  ) {
    end += 1;
  }
  return { start, end };
}

function replaceTopLevelBlock(frontmatter, key, block, anchors = []) {
  const lines = frontmatter.split(/\r?\n/);
  const range = topLevelRange(lines, key);
  const replacement = block.split("\n");

  if (range) {
    lines.splice(range.start, range.end - range.start, ...replacement);
    return lines.join("\n").replace(/\n{3,}/g, "\n\n");
  }

  const defaultAnchors = [
    "price:",
    "affiliate:",
    "rating:",
    "score:",
    "priceState:",
    "editorial:",
    "ratings:"
  ];
  const candidates = anchors.length ? anchors : defaultAnchors;
  let insertAt = lines.findIndex((line) =>
    candidates.some((anchor) => line.trim().startsWith(anchor))
  );
  if (insertAt < 0) insertAt = lines.length;
  lines.splice(insertAt, 0, ...replacement, "");
  return lines.join("\n").replace(/\n{3,}/g, "\n\n");
}

function removeTopLevelBlock(frontmatter, key) {
  const lines = frontmatter.split(/\r?\n/);
  const range = topLevelRange(lines, key);
  if (!range) return frontmatter;
  lines.splice(range.start, range.end - range.start);
  return lines.join("\n").replace(/\n{3,}/g, "\n\n");
}

function normalizeHttpsUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol === "http:") parsed.protocol = "https:";
    return parsed.protocol === "https:" ? parsed.href : null;
  } catch {
    return null;
  }
}

function inferProvider(url, source = {}) {
  const id = String(source.id || "").trim();
  if (id) return id.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  try {
    return new URL(url).hostname
      .replace(/^www\./, "")
      .split(".")[0]
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");
  } catch {
    return "merchant";
  }
}

function renderManufacturer(manufacturer) {
  const name = String(manufacturer?.name || manufacturer || "").trim();
  const slug = String(manufacturer?.slug || manufacturer?.key || "").trim();
  const key = String(manufacturer?.key || slug).trim();
  if (!name || !slug || !key) {
    throw new Error("Herstellername, Hersteller-Slug oder Hersteller-Key fehlt.");
  }
  return [
    "manufacturer:",
    `  key: ${quote(key)}`,
    `  name: ${quote(name)}`,
    `  slug: ${quote(slug)}`
  ].join("\n");
}

function renderCategory(category) {
  const key = String(category?.key || category || "").trim();
  const label = String(category?.label || "Katzenklappen").trim();
  const route = String(category?.path || "/katzenklappen/").trim();
  return [
    "category:",
    `  key: ${quote(key)}`,
    `  label: ${quote(label)}`,
    `  path: ${quote(route)}`
  ].join("\n");
}

function renderPrice(price) {
  const source = price?.source && typeof price.source === "object"
    ? { ...price.source }
    : {};
  delete source.url;

  const lines = [
    "price:",
    `  current: ${price?.current == null ? "null" : Number(price.current)}`,
    `  currency: ${quote(price?.currency || "EUR")}`,
    `  status: ${quote(price?.status || "unknown")}`
  ];

  if (price?.comparisonText) {
    lines.push(`  comparisonText: ${quote(price.comparisonText)}`);
  }
  if (price?.checkedAt) {
    lines.push(`  checkedAt: ${quote(price.checkedAt)}`);
  }
  if (source.id || source.label) {
    lines.push("  source:");
    if (source.id) lines.push(`    id: ${quote(source.id)}`);
    if (source.label) lines.push(`    label: ${quote(source.label)}`);
    lines.push(`    type: ${quote(source.type || "merchant")}`);
  }
  return lines.join("\n");
}

function renderAffiliate(affiliate) {
  return [
    "affiliate:",
    `  provider: ${quote(affiliate.provider)}`,
    `  label: ${quote(affiliate.label)}`,
    `  url: ${quote(affiliate.url)}`,
    `  rel: ${quote(affiliate.rel)}`,
    `  target: ${quote(affiliate.target)}`
  ].join("\n");
}

function renderScalar(key, value) {
  if (typeof value === "boolean") return `${key}: ${value ? "true" : "false"}`;
  return `${key}: ${quote(value)}`;
}

function replaceOperationScalars(frontmatter, values) {
  const keys = [
    "priceState",
    "priceUpdated",
    "priceAvailable",
    "affiliateAvailable",
    "availability",
    "availabilityReason",
    "availabilityUpdated",
    "editorialStatus",
    "recommendationStatus",
    "maintenanceStatus"
  ];

  let lines = frontmatter.split(/\r?\n/);
  lines = lines.filter((line) => {
    const match = line.match(/^([A-Za-z][A-Za-z0-9]*):/);
    return !match || !keys.includes(match[1]);
  });

  const block = keys
    .filter((key) => values[key] !== undefined && values[key] !== null && values[key] !== "")
    .map((key) => renderScalar(key, values[key]));

  let insertAt = lines.findIndex((line) =>
    ["editorial:", "rating:", "score:", "ratings:"].includes(line.trim())
  );
  if (insertAt < 0) insertAt = lines.length;
  lines.splice(insertAt, 0, ...block, "");
  return lines.join("\n").replace(/\n{3,}/g, "\n\n");
}

function buildOperationValues(data) {
  const current = Number(data?.price?.current);
  const priceAvailable = Number.isFinite(current) && current > 0;
  const affiliateAvailable = Boolean(normalizeHttpsUrl(data?.affiliate?.url));
  const availability = String(data?.availability || "unknown");
  const unavailable = [
    "temporarily-unavailable",
    "out-of-stock",
    "discontinued"
  ].includes(availability);

  const priceState = priceAvailable
    ? (data.priceState === "stale" ? "stale" : "available")
    : (data.priceState === "removed" ? "removed" : "unknown");

  let maintenanceStatus = data.maintenanceStatus;
  if (availability === "discontinued" || maintenanceStatus === "archived") {
    maintenanceStatus = "archived";
  } else if (unavailable) {
    maintenanceStatus = "complete";
  } else if (!priceAvailable || !affiliateAvailable || availability === "unknown") {
    maintenanceStatus = "required";
  } else {
    maintenanceStatus = "complete";
  }

  let recommendationStatus = data.recommendationStatus;
  if (maintenanceStatus === "archived") recommendationStatus = "archived";
  else if (!priceAvailable || !affiliateAvailable || availability !== "available") {
    recommendationStatus = "limited";
  } else if (!["recommended", "limited"].includes(recommendationStatus)) {
    recommendationStatus = "recommended";
  }

  return {
    priceState,
    ...(data.priceUpdated || data.price?.checkedAt
      ? { priceUpdated: data.priceUpdated || data.price.checkedAt }
      : {}),
    priceAvailable,
    affiliateAvailable,
    availability,
    ...(data.availabilityReason
      ? { availabilityReason: data.availabilityReason }
      : {}),
    ...(data.availabilityUpdated
      ? { availabilityUpdated: data.availabilityUpdated }
      : {}),
    editorialStatus: data.editorialStatus || "complete",
    recommendationStatus,
    maintenanceStatus
  };
}

function normalizeProduct(file) {
  const source = fs.readFileSync(file, "utf8");
  const document = splitDocument(source, file);
  const data = yaml.load(document.frontmatter) || {};
  const categoryKey = String(data?.category?.key || data?.category || "").trim();

  if (categoryKey !== "katzenklappen") return false;

  const merchantUrl = normalizeHttpsUrl(
    data?.affiliate?.url ||
    data?.price?.affiliateUrl ||
    data?.price?.source?.url
  );

  const price = {
    ...(data.price || {}),
    source: {
      ...(data.price?.source || {})
    }
  };
  delete price.affiliateUrl;
  if (price.source) delete price.source.url;

  const affiliate = merchantUrl
    ? {
        ...(data.affiliate || {}),
        provider:
          data.affiliate?.provider ||
          inferProvider(merchantUrl, price.source),
        label:
          data.affiliate?.label ||
          "Aktuellen Preis prüfen",
        url: merchantUrl,
        rel:
          data.affiliate?.rel ||
          "sponsored nofollow noopener",
        target:
          data.affiliate?.target === "_self" ? "_self" : "_blank"
      }
    : null;

  let frontmatter = document.frontmatter;
  frontmatter = replaceTopLevelBlock(
    frontmatter,
    "manufacturer",
    renderManufacturer(data.manufacturer),
    ["category:", "publishedAt:"]
  );
  frontmatter = replaceTopLevelBlock(
    frontmatter,
    "category",
    renderCategory(data.category),
    ["productUrl:", "publishedAt:"]
  );
  frontmatter = replaceTopLevelBlock(
    frontmatter,
    "price",
    renderPrice(price),
    ["affiliate:", "priceState:", "editorial:", "rating:"]
  );

  if (affiliate) {
    frontmatter = replaceTopLevelBlock(
      frontmatter,
      "affiliate",
      renderAffiliate(affiliate),
      ["priceState:", "editorial:", "rating:"]
    );
  } else {
    frontmatter = removeTopLevelBlock(frontmatter, "affiliate");
  }

  const normalizedData = yaml.load(frontmatter) || {};
  const operationValues = buildOperationValues(normalizedData);
  frontmatter = replaceOperationScalars(frontmatter, operationValues);

  // Ergebnis muss als YAML lesbar sein und die kanonische Struktur besitzen.
  const finalData = yaml.load(frontmatter) || {};
  if (finalData.category?.key !== "katzenklappen") {
    throw new Error(`${path.basename(file)}: Kategorie ging bei Migration verloren.`);
  }
  if (!finalData.manufacturer?.name || !finalData.manufacturer?.slug) {
    throw new Error(`${path.basename(file)}: Herstellerobjekt ist unvollständig.`);
  }
  if (finalData.price?.source?.url || finalData.price?.affiliateUrl) {
    throw new Error(`${path.basename(file)}: Händler-URL blieb im price-Block.`);
  }
  if (merchantUrl && finalData.affiliate?.url !== merchantUrl) {
    throw new Error(`${path.basename(file)}: Händler-URL wurde nicht nach affiliate.url migriert.`);
  }

  const next = `---\n${frontmatter.replace(/\s+$/, "")}\n---\n${document.body}`;
  if (next === source) {
    log(`Bereits aktuell: ${path.relative(ROOT, file)}`);
    return false;
  }

  backup(file);
  fs.writeFileSync(file, next);
  log(`Normalisiert: ${path.relative(ROOT, file)}`);
  return true;
}

function writeTest() {
  const content = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const PRODUCTS = path.join(ROOT, "apps/pfotentechnik/src/content/products");

function split(source, file) {
  const match = source.match(/^---\\\\r?\\\\n([\\\\s\\\\S]*?)\\\\r?\\\\n---(?:\\\\r?\\\\n|$)/);
  assert.ok(match, \`\${file}: Frontmatter fehlt\`);
  return yaml.load(match[1]) || {};
}

test("Katzenklappen verwenden den kanonischen Preis- und Affiliate-Standard", () => {
  const files = fs.readdirSync(PRODUCTS)
    .filter((name) => /\\\\.mdx?$/.test(name))
    .map((name) => path.join(PRODUCTS, name));

  const catFlaps = files
    .map((file) => ({ file, data: split(fs.readFileSync(file, "utf8"), file) }))
    .filter(({ data }) => (data.category?.key || data.category) === "katzenklappen");

  assert.ok(catFlaps.length >= 3, "Keine belastbare Katzenklappen-Stichprobe gefunden.");

  for (const { file, data } of catFlaps) {
    assert.equal(typeof data.manufacturer, "object", \`\${file}: manufacturer muss Objekt sein\`);
    assert.ok(data.manufacturer.name, \`\${file}: manufacturer.name fehlt\`);
    assert.ok(data.manufacturer.slug, \`\${file}: manufacturer.slug fehlt\`);
    assert.equal(typeof data.category, "object", \`\${file}: category muss Objekt sein\`);
    assert.equal(data.category.key, "katzenklappen");
    assert.equal(data.price?.affiliateUrl, undefined, \`\${file}: price.affiliateUrl ist veraltet\`);
    assert.equal(data.price?.source?.url, undefined, \`\${file}: price.source.url ist veraltet\`);

    if (data.affiliate?.url) {
      assert.match(data.affiliate.url, /^https:\\/\\//);
      assert.ok(data.affiliate.provider, \`\${file}: affiliate.provider fehlt\`);
      assert.ok(data.affiliate.label, \`\${file}: affiliate.label fehlt\`);
      assert.equal(data.affiliateAvailable, true, \`\${file}: affiliateAvailable nicht synchron\`);
    }
  }
});
`;
  const current = fs.existsSync(TEST) ? fs.readFileSync(TEST, "utf8") : null;
  if (current !== content) {
    if (fs.existsSync(TEST)) backup(TEST);
    fs.mkdirSync(path.dirname(TEST), { recursive: true });
    fs.writeFileSync(TEST, content);
    log(`Geschrieben: ${path.relative(ROOT, TEST)}`);
  }
}

function patchPackage() {
  const data = JSON.parse(fs.readFileSync(PACKAGE, "utf8"));
  data.scripts ||= {};
  data.scripts["test:katzenklappen-md-normalization"] =
    "node --test test/katzenklappen-product-md-normalization-30.2.0.test.mjs";
  const next = JSON.stringify(data, null, 2) + "\n";
  const current = fs.readFileSync(PACKAGE, "utf8");
  if (next !== current) {
    backup(PACKAGE);
    fs.writeFileSync(PACKAGE, next);
    log(`Geändert: ${path.relative(ROOT, PACKAGE)}`);
  }
}

function run(command, args) {
  log(`Prüfe: ${command} ${args.join(" ")}`);
  execFileSync(command, args, {
    cwd: ROOT,
    stdio: "inherit",
    windowsHide: true
  });
}

if (!fs.existsSync(PRODUCTS)) {
  throw new Error(`Produktverzeichnis fehlt: ${path.relative(ROOT, PRODUCTS)}`);
}
if (!fs.existsSync(PACKAGE)) {
  throw new Error(`package.json fehlt: ${path.relative(ROOT, PACKAGE)}`);
}

const files = fs.readdirSync(PRODUCTS)
  .filter((name) => /\.mdx?$/.test(name))
  .map((name) => path.join(PRODUCTS, name));

let changed = 0;
for (const file of files) {
  if (normalizeProduct(file)) changed += 1;
}

writeTest();
patchPackage();

run(process.execPath, ["--check", fileURLToPath(import.meta.url)]);
run("npm", [
  "--workspace",
  "apps/pfotentechnik",
  "run",
  "test:katzenklappen-md-normalization"
]);
run("npm", [
  "--workspace",
  "apps/pfotentechnik",
  "run",
  "test:seo-cockpit-product-operations"
]);
run("npm", [
  "--workspace",
  "apps/pfotentechnik",
  "run",
  "build"
]);

log(`${changed} Katzenklappen-MDs geändert. Migration und Build erfolgreich.`);

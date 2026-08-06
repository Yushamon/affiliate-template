import fs from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import { atomicWriteFile } from "../admin/atomic-file.mjs";
import {
  AVAILABILITY_VALUES,
  PRICE_STATE_VALUES,
  createKeyedSerialExecutor,
  deriveProductOperations,
  operationFieldsFrom
} from "../product-operations/policy.mjs";

const quote = (value) => JSON.stringify(String(value));
const runSerially = createKeyedSerialExecutor();
const OPERATION_KEYS = new Set([
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
]);

export function splitFrontmatter(source, file = "Produktdatei") {
  const match = String(source).replace(/^\uFEFF/, "").match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error(`${file}: gültiges YAML-Frontmatter fehlt.`);
  return { yaml: match[1], body: source.slice(match[0].length), prefix: source.slice(0, match.index || 0) };
}

function replaceTopLevelBlock(frontmatter, key, block) {
  const lines = frontmatter.split(/\r?\n/);
  const start = lines.findIndex((line) => new RegExp(`^${key}:\\s*`).test(line));
  if (start >= 0) {
    let end = start + 1;
    while (end < lines.length && (/^\s+/.test(lines[end]) || !lines[end].trim())) end += 1;
    lines.splice(start, end - start, ...block.split("\n"));
    return lines.join("\n");
  }

  const anchorsByKey = {
    price: ["affiliate:", "conversion:", "editorial:", "rating:", "score:"],
    affiliate: ["conversion:", "editorial:", "rating:", "score:", "ratings:"]
  };
  const anchors = anchorsByKey[key] ?? ["editorial:", "rating:", "score:"];
  let insertAt = lines.findIndex((line) => anchors.includes(line.trim()));
  if (insertAt < 0) insertAt = lines.length;
  lines.splice(insertAt, 0, ...block.split("\n"), "");
  return lines.join("\n");
}

function removeTopLevelBlock(frontmatter, key) {
  const lines = frontmatter.split(/\r?\n/);
  const start = lines.findIndex((line) => new RegExp(`^${key}:\\s*`).test(line));
  if (start < 0) return frontmatter;
  let end = start + 1;
  while (end < lines.length && (/^\s+/.test(lines[end]) || !lines[end].trim())) end += 1;
  lines.splice(start, end - start);
  return lines.join("\n").replace(/\n{3,}/g, "\n\n");
}

function renderOperationScalar(key, value) {
  if (typeof value === "boolean") return `${key}: ${value ? "true" : "false"}`;
  return `${key}: ${quote(value)}`;
}

export function replaceProductOperations(frontmatter, fields) {
  const lines = frontmatter
    .split(/\r?\n/)
    .filter((line) => {
      const match = line.match(/^([A-Za-z][A-Za-z0-9]*):/);
      return !match || !OPERATION_KEYS.has(match[1]);
    });

  const block = [];
  const ordered = [
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

  for (const key of ordered) {
    const value = fields[key];
    if (value !== undefined && value !== null && value !== "") block.push(renderOperationScalar(key, value));
  }

  let insertAt = lines.findIndex((line) => ["editorial:", "rating:", "score:", "ratings:"].includes(line.trim()));
  if (insertAt < 0) insertAt = lines.length;
  lines.splice(insertAt, 0, ...block, "");
  return lines.join("\n").replace(/\n{3,}/g, "\n\n");
}

const normalizeHttpsUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return undefined;
  const parsed = new URL(raw);
  if (parsed.protocol !== "https:") {
    throw new Error("Für Preis- und CTA-Ziele sind nur HTTPS-URLs erlaubt.");
  }
  return parsed.href;
};

const inferProvider = (url, sourceLabel) => {
  const label = String(sourceLabel || "").trim();
  if (label && !/^manuell im seo cockpit$/i.test(label)) {
    return label.toLocaleLowerCase("de-DE").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || undefined;
  }
  try {
    return new URL(url).hostname.replace(/^www\./, "").split(".")[0] || undefined;
  } catch {
    return undefined;
  }
};

export function renderPriceBlock(price) {
  const source = price.source ?? {};
  const lines = [
    "price:",
    `  current: ${price.current == null ? "null" : Number(price.current)}`,
    `  currency: ${quote(price.currency || "EUR")}`,
    `  status: ${quote(price.status || "unknown")}`
  ];
  if (price.range && typeof price.range === "object") {
    lines.push("  range:");
    if (Number.isFinite(Number(price.range.min))) lines.push(`    min: ${Number(price.range.min)}`);
    if (Number.isFinite(Number(price.range.max))) lines.push(`    max: ${Number(price.range.max)}`);
    if (Number.isFinite(Number(price.range.sampleSize))) lines.push(`    sampleSize: ${Number(price.range.sampleSize)}`);
    if (price.range.generatedAt) lines.push(`    generatedAt: ${quote(price.range.generatedAt)}`);
    lines.push(`    source: ${quote(price.range.source || "category-engine")}`);
  }
  if (price.comparisonText) lines.push(`  comparisonText: ${quote(price.comparisonText)}`);
  if (price.checkedAt) lines.push(`  checkedAt: ${quote(price.checkedAt)}`);
  if (source.id || source.label) {
    lines.push("  source:");
    if (source.id) lines.push(`    id: ${quote(source.id)}`);
    if (source.label) lines.push(`    label: ${quote(source.label)}`);
    lines.push(`    type: ${quote(source.type || "merchant")}`);
  }
  return lines.join("\n");
}

export function renderAffiliateBlock(affiliate) {
  if (!affiliate?.url) throw new Error("Affiliate- beziehungsweise Händler-URL fehlt.");
  const lines = ["affiliate:"];
  if (affiliate.provider) lines.push(`  provider: ${quote(affiliate.provider)}`);
  lines.push(`  label: ${quote(affiliate.label || "Preis und Verfügbarkeit prüfen")}`);
  lines.push(`  url: ${quote(affiliate.url)}`);
  if (affiliate.rel) lines.push(`  rel: ${quote(affiliate.rel)}`);
  if (affiliate.target) lines.push(`  target: ${quote(affiliate.target)}`);
  return lines.join("\n");
}

export function renderManufacturerBlock(manufacturer) {
  const name = String(manufacturer?.name || "").trim();
  const slug = String(manufacturer?.slug || manufacturer?.key || "").trim();
  const key = String(manufacturer?.key || slug).trim();
  if (!name || !slug || !key) throw new Error("Herstellername, Hersteller-Slug und Hersteller-Key sind erforderlich.");
  return [
    "manufacturer:",
    `  key: ${quote(key)}`,
    `  name: ${quote(name)}`,
    `  slug: ${quote(slug)}`
  ].join("\n");
}

const canonicalUrlFrom = (data, preferred) => normalizeHttpsUrl(
  preferred ??
  data?.affiliate?.url ??
  data?.price?.affiliateUrl ??
  data?.price?.source?.url
);

const canonicalAffiliateFrom = (data, url, sourceLabel) => ({
  ...(data?.affiliate ?? {}),
  provider: data?.affiliate?.provider || inferProvider(url, sourceLabel),
  label: data?.affiliate?.label || "Preis und Verfügbarkeit prüfen",
  url,
  rel: data?.affiliate?.rel || "sponsored nofollow noopener",
  target: data?.affiliate?.target === "_self" ? "_self" : "_blank"
});

const cleanPrice = (price) => {
  const next = { ...(price ?? {}) };
  delete next.affiliateUrl;
  if (next.source && typeof next.source === "object") {
    next.source = { ...next.source };
    delete next.source.url;
  }
  return next;
};

const sourceFromParts = (parts, nextYaml) => `---\n${nextYaml.replace(/\s+$/, "")}\n---\n${parts.body}`;

async function persistedDocument(file) {
  const source = await fs.readFile(file, "utf8");
  const { yaml: frontmatter } = splitFrontmatter(source, file);
  const data = yaml.load(frontmatter) ?? {};
  return { file, source, data, slug: String(data.slug || path.basename(file).replace(/\.mdx?$/, "")) };
}

async function persistMutation(file, mutate) {
  return runSerially(path.resolve(file), async () => {
    const source = await fs.readFile(file, "utf8");
    const parts = splitFrontmatter(source, file);
    const originalData = yaml.load(parts.yaml) ?? {};
    const result = await mutate({ data: structuredClone(originalData), frontmatter: parts.yaml });
    let nextYaml = result.frontmatter ?? parts.yaml;

    if (result.price !== undefined) {
      nextYaml = replaceTopLevelBlock(nextYaml, "price", renderPriceBlock(cleanPrice(result.price)));
    }
    if (result.removeAffiliate) {
      nextYaml = removeTopLevelBlock(nextYaml, "affiliate");
    } else if (result.affiliate?.url) {
      nextYaml = replaceTopLevelBlock(nextYaml, "affiliate", renderAffiliateBlock(result.affiliate));
    }
    if (result.manufacturer) {
      nextYaml = replaceTopLevelBlock(nextYaml, "manufacturer", renderManufacturerBlock(result.manufacturer));
    }

    const parsedBeforeOperations = yaml.load(nextYaml) ?? {};
    const fields = result.operationFields ?? operationFieldsFrom(parsedBeforeOperations, { now: result.now });
    nextYaml = replaceProductOperations(nextYaml, fields);
    yaml.load(nextYaml);

    const next = sourceFromParts(parts, nextYaml);
    await atomicWriteFile(file, next, "utf8");
    return persistedDocument(file);
  });
}

export function canonicalizeProductPriceUrlSource(source, file = "Produktdatei") {
  const parts = splitFrontmatter(source, file);
  const data = yaml.load(parts.yaml) ?? {};
  const hasDuplicatePriceUrl = Boolean(data?.price?.affiliateUrl || data?.price?.source?.url);
  const canonicalUrl = canonicalUrlFrom(data);

  if (!canonicalUrl || (!hasDuplicatePriceUrl && data?.affiliate?.url === canonicalUrl)) {
    return source;
  }

  const sourceLabel = data?.price?.source?.label;
  let nextYaml = parts.yaml;
  if (data.price) {
    nextYaml = replaceTopLevelBlock(nextYaml, "price", renderPriceBlock(cleanPrice(data.price)));
  }
  nextYaml = replaceTopLevelBlock(
    nextYaml,
    "affiliate",
    renderAffiliateBlock(canonicalAffiliateFrom(data, canonicalUrl, sourceLabel))
  );
  const nextData = yaml.load(nextYaml) ?? {};
  nextYaml = replaceProductOperations(nextYaml, operationFieldsFrom(nextData));
  yaml.load(nextYaml);
  return sourceFromParts(parts, nextYaml);
}

export async function updateProductPrice(file, price, options = {}) {
  const now = options.now ?? price?.checkedAt ?? new Date().toISOString();
  return persistMutation(file, async ({ data, frontmatter }) => {
    const incomingPrice = cleanPrice(price);
    const normalizedPrice = cleanPrice({
      ...(data.price ?? {}),
      ...incomingPrice,
      source: incomingPrice.source ?? data.price?.source
    });
    const canonicalUrl = options.removeAffiliate
      ? undefined
      : canonicalUrlFrom(data, options.affiliateUrl ?? price?.affiliateUrl);
    const affiliate = options.removeAffiliate
      ? undefined
      : options.syncAffiliateUrl && canonicalUrl
        ? canonicalAffiliateFrom(data, canonicalUrl, normalizedPrice?.source?.label)
        : data.affiliate;

    const operationPatch = options.operations ?? {};
    const nextData = {
      ...data,
      ...operationPatch,
      price: normalizedPrice,
      ...(affiliate ? { affiliate } : {}),
      priceState: PRICE_STATE_VALUES.includes(operationPatch.priceState)
        ? operationPatch.priceState
        : normalizedPrice.current == null
          ? "unknown"
          : "available",
      priceUpdated: normalizedPrice.checkedAt ?? now,
      ...(operationPatch.availability
        ? { availabilityUpdated: operationPatch.availabilityUpdated ?? now }
        : {})
    };
    if (options.removeAffiliate) delete nextData.affiliate;
    const operationFields = operationFieldsFrom(nextData, { now });

    return { frontmatter, price: normalizedPrice, affiliate, removeAffiliate: options.removeAffiliate, operationFields, now };
  });
}

export async function updateProductOperations(file, patch = {}) {
  const now = patch.now ?? new Date().toISOString();
  return persistMutation(file, async ({ data, frontmatter }) => {
    const nextData = { ...data };
    let price = cleanPrice(data.price ?? { current: null, currency: "EUR", status: "unknown" });
    let manufacturer;

    if (patch.manufacturer !== undefined) {
      const name = String(patch.manufacturer?.name || "").trim().slice(0, 120);
      const slug = String(patch.manufacturer?.slug || patch.manufacturer?.key || "").trim().toLocaleLowerCase("de-DE");
      const key = String(patch.manufacturer?.key || slug).trim().toLocaleLowerCase("de-DE");
      if (!name) throw new Error("Herstellername fehlt.");
      if (!/^[a-z0-9][a-z0-9-]*$/.test(slug) || !/^[a-z0-9][a-z0-9-]*$/.test(key)) {
        throw new Error("Hersteller-Slug und Hersteller-Key dürfen nur Kleinbuchstaben, Zahlen und Bindestriche enthalten.");
      }
      manufacturer = { key, name, slug };
      nextData.manufacturer = manufacturer;
    }

    // PT_AFFILIATE_ONLY_UPDATE_2_0_1: CTA-Ziel unabhängig vom Preis pflegen.
    const hasAffiliatePatch = Object.prototype.hasOwnProperty.call(patch, "affiliateUrl");
    const patchedAffiliateUrl = hasAffiliatePatch ? normalizeHttpsUrl(patch.affiliateUrl) : undefined;
    let affiliate = data.affiliate;
    let removeAffiliate = false;

    if (hasAffiliatePatch) {
      if (patchedAffiliateUrl) {
        affiliate = canonicalAffiliateFrom(data, patchedAffiliateUrl, patch.sourceLabel || data.price?.source?.label);
        nextData.affiliate = affiliate;
      } else {
        affiliate = undefined;
        removeAffiliate = true;
        delete nextData.affiliate;
      }
    }

    if (patch.sourceLabel !== undefined) {
      const sourceLabel = String(patch.sourceLabel || "").trim().slice(0, 120);
      if (sourceLabel) {
        price = {
          ...price,
          source: {
            ...(price.source ?? {}),
            id: price.source?.id || "manual",
            label: sourceLabel,
            type: price.source?.type || "manual"
          }
        };
      }
    }

    if (patch.comparisonText !== undefined) {
      const comparisonText = String(patch.comparisonText || "").trim().slice(0, 360);
      price = { ...price };
      if (comparisonText) price.comparisonText = comparisonText;
      else delete price.comparisonText;
    }

    if (patch.priceState !== undefined) {
      if (!PRICE_STATE_VALUES.includes(patch.priceState)) throw new Error("Unbekannter Preisstatus.");
      nextData.priceState = patch.priceState;
      nextData.priceUpdated = now;
      if (["removed", "unknown"].includes(patch.priceState)) {
        price = { ...price, current: null };
        delete price.checkedAt;
      }
    }

    if (patch.availability !== undefined) {
      if (!AVAILABILITY_VALUES.includes(patch.availability)) throw new Error("Unbekannter Verfügbarkeitsstatus.");
      nextData.availability = patch.availability;
      nextData.availabilityUpdated = now;
      nextData.availabilityReason = String(patch.availabilityReason || "").trim().slice(0, 500) || undefined;
      if (!["out-of-stock", "discontinued"].includes(patch.availability)) {
        if (nextData.maintenanceStatus === "archived") delete nextData.maintenanceStatus;
        if (nextData.recommendationStatus === "archived") delete nextData.recommendationStatus;
        if (nextData.editorialStatus === "archived") delete nextData.editorialStatus;
      }
    }

    if (patch.archive === true) {
      nextData.maintenanceStatus = "archived";
      nextData.recommendationStatus = "archived";
      nextData.editorialStatus = "archived";
    } else if (patch.archive === false) {
      delete nextData.maintenanceStatus;
      delete nextData.recommendationStatus;
      delete nextData.editorialStatus;
    }

    const operationData = { ...nextData, price };
    if (affiliate) operationData.affiliate = affiliate;
    else delete operationData.affiliate;
    const operationFields = operationFieldsFrom(operationData, { now });

    return {
      frontmatter,
      price,
      ...(hasAffiliatePatch ? { affiliate, removeAffiliate } : {}),
      ...(manufacturer ? { manufacturer } : {}),
      operationFields,
      now
    };
  });
}

export async function migrateProductOperations(file, options = {}) {
  const now = options.now ?? new Date().toISOString();
  return persistMutation(file, async ({ data, frontmatter }) => ({
    frontmatter,
    operationFields: operationFieldsFrom(data, { now }),
    now
  }));
}

export async function readProductFiles(productsDir) {
  const entries = await fs.readdir(productsDir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isFile() && /\.mdx?$/.test(entry.name)) files.push(path.join(productsDir, entry.name));
  }
  return files.sort();
}

export async function readProductDocument(file) {
  return persistedDocument(file);
}

export function operationsForDocument(document, options = {}) {
  return deriveProductOperations(document?.data ?? {}, options);
}

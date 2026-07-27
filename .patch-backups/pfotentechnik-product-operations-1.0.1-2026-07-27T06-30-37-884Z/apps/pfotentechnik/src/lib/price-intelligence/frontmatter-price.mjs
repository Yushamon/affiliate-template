import fs from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import { atomicWriteFile } from "../admin/atomic-file.mjs";

const quote = (value) => JSON.stringify(String(value));

export function splitFrontmatter(source, file = "Produktdatei") {
  const match = String(source).replace(/^\uFEFF/, "").match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error(`${file}: gültiges YAML-Frontmatter fehlt.`);
  return { yaml: match[1], body: source.slice(match[0].length), prefix: source.slice(0, match.index || 0) };
}

function replaceTopLevelBlock(frontmatter, key, block) {
  const lines = frontmatter.split(/\r?\n/);
  const start = lines.findIndex((line) => new RegExp(`^${key}:\\s*(?:#.*)?$`).test(line));
  if (start >= 0) {
    let end = start + 1;
    while (end < lines.length && (/^\s+/.test(lines[end]) || !lines[end].trim())) end += 1;
    lines.splice(start, end - start, ...block.split("\n"));
    return lines.join("\n");
  }

  const anchorsByKey = {
    price: ["affiliate:", "conversion:", "rating:", "score:"],
    affiliate: ["conversion:", "rating:", "score:", "ratings:"]
  };
  const anchors = anchorsByKey[key] ?? ["rating:", "score:"];
  let insertAt = lines.findIndex((line) => anchors.includes(line.trim()));
  if (insertAt < 0) insertAt = lines.length;
  lines.splice(insertAt, 0, ...block.split("\n"), "");
  return lines.join("\n");
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
  yaml.load(nextYaml);
  return `---\n${nextYaml.replace(/\s+$/, "")}\n---\n${parts.body}`;
}

export async function updateProductPrice(file, price, options = {}) {
  const source = await fs.readFile(file, "utf8");
  const parts = splitFrontmatter(source, file);
  const data = yaml.load(parts.yaml) ?? {};
  const canonicalUrl = canonicalUrlFrom(data, options.affiliateUrl ?? price?.affiliateUrl);
  const normalizedPrice = cleanPrice(price);

  let nextYaml = replaceTopLevelBlock(parts.yaml, "price", renderPriceBlock(normalizedPrice));
  if (options.syncAffiliateUrl && canonicalUrl) {
    nextYaml = replaceTopLevelBlock(
      nextYaml,
      "affiliate",
      renderAffiliateBlock(
        canonicalAffiliateFrom(
          data,
          canonicalUrl,
          normalizedPrice?.source?.label
        )
      )
    );
  }

  yaml.load(nextYaml);
  const next = `---\n${nextYaml.replace(/\s+$/, "")}\n---\n${parts.body}`;
  await atomicWriteFile(file, next, "utf8");
  return next;
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
  const source = await fs.readFile(file, "utf8");
  const { yaml: frontmatter } = splitFrontmatter(source, file);
  const data = yaml.load(frontmatter) ?? {};
  return { file, source, data, slug: String(data.slug || path.basename(file).replace(/\.mdx?$/, "")) };
}

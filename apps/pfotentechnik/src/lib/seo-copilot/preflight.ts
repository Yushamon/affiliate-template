import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { compareProductIdentity } from "./identity.ts";
import { PRODUCT_IMAGE_ROLES } from "./config.ts";
import type { ProductCandidate, ProductPreflightResult } from "./types";

const APP_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const PRODUCT_DIR = path.join(APP_ROOT, "src", "content", "products");
const MANUFACTURER_DIR = path.join(APP_ROOT, "src", "content", "manufacturers");
const COMPARISON_DIR = path.join(APP_ROOT, "src", "content", "comparisons");
const IMAGE_ROOTS = [
  path.join(APP_ROOT, "src", "assets", "images", "products"),
  path.join(APP_ROOT, "public", "images", "products"),
];
const PRODUCT_SCHEMA_FILE = path.join(APP_ROOT, "src", "content", "schema", "product.ts");
const BASE_SCHEMA_FILE = path.join(APP_ROOT, "src", "content", "schema", "base.ts");

const frontmatter = (source: string) => source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/m)?.[1] ?? "";
const scalar = (source: string, field: string) =>
  frontmatter(source).match(new RegExp(`^${field}:\\s*[\"']?([^\\r\\n\"']+)[\"']?\\s*$`, "m"))?.[1]?.trim();
const inlineValue = (source: string, object: string, field: string) =>
  frontmatter(source).match(new RegExp(`^${object}:\\s*\\{[^\\r\\n]*?${field}:\\s*[\"']([^\"']+)[\"']`, "m"))?.[1]?.trim();

const schemaProperties = (source: string, startToken: string, indent: number) => {
  const start = source.indexOf(startToken);
  if (start < 0) return [];
  const body = source.slice(start + startToken.length);
  const expression = new RegExp(`^ {${indent}}([A-Za-z][A-Za-z0-9]*):`, "gm");
  const matches = [...body.matchAll(expression)];
  return matches.map((match, index) => {
    const segment = body.slice(match.index, matches[index + 1]?.index ?? body.length);
    return {
      key: match[1],
      optional: /\.optional\s*\(\s*\)/m.test(segment) || /\.default\s*\(/m.test(segment),
    };
  });
};

export const detectProductSchema = () => {
  const productSource = fs.readFileSync(PRODUCT_SCHEMA_FILE, "utf8");
  const baseSource = fs.readFileSync(BASE_SCHEMA_FILE, "utf8");
  const base = schemaProperties(baseSource, "baseContentSchema = z.object({", 2);
  const product = schemaProperties(productSource, "baseContentSchema.extend({", 4);
  const merged = new Map(base.map((item) => [item.key, item]));
  product.forEach((item) => merged.set(item.key, item));
  const fingerprint = createHash("sha256").update(baseSource).update(productSource).digest("hex").slice(0, 16);
  return {
    detected: product.length > 0 && base.length > 0,
    version: `sha256:${fingerprint}`,
    path: path.relative(path.resolve(APP_ROOT, "../.."), PRODUCT_SCHEMA_FILE).replace(/\\/g, "/"),
    fields: [...merged.values()],
    requiredFields: [...merged.values()].filter((item) => !item.optional).map((item) => item.key),
  };
};

export const assertSafeProductSlug = (slug: string) => {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug ?? "")) throw new Error("Ungültiger Produkt-Slug.");
  const target = path.resolve(PRODUCT_DIR, `${slug}.md`);
  if (path.dirname(target) !== path.resolve(PRODUCT_DIR)) throw new Error("Produktpfad liegt außerhalb der Collection.");
  return target;
};

export const loadRepositoryProducts = () =>
  fs
    .readdirSync(PRODUCT_DIR)
    .filter((name) => name.endsWith(".md"))
    .map((name) => {
      const source = fs.readFileSync(path.join(PRODUCT_DIR, name), "utf8");
      return {
        slug: scalar(source, "slug") || path.basename(name, ".md"),
        name: scalar(source, "title") || path.basename(name, ".md"),
        brand: inlineValue(source, "manufacturer", "name") || "",
        manufacturerSlug: inlineValue(source, "manufacturer", "slug") || "",
        aliases: [] as string[],
        modelNumbers: [
          ...new Set(
            [...source.matchAll(/\b[A-Z]{1,8}[- ]?\d{2,8}[A-Z0-9-]*\b/g)].map((match) => match[0]),
          ),
        ].slice(0, 20),
        source,
      };
    });

const hasManufacturer = (slug: string) => fs.existsSync(path.join(MANUFACTURER_DIR, `${slug}.md`));
const comparisonSlugs = () =>
  fs.readdirSync(COMPARISON_DIR).filter((file) => file.endsWith(".md")).map((file) => path.basename(file, ".md"));

const imageState = (slug: string) => {
  const files = IMAGE_ROOTS.flatMap((root) => {
    const directory = path.join(root, slug);
    return fs.existsSync(directory) ? fs.readdirSync(directory).map((name) => path.join(directory, name)) : [];
  });
  const roles = Object.fromEntries(
    PRODUCT_IMAGE_ROLES.map((role) => [role, files.some((file) => path.basename(file).toLowerCase() === `${role}.webp`)]),
  );
  return { files, roles };
};

export const runProductPreflight = (
  candidate: Pick<
    ProductCandidate,
    "id" | "name" | "brand" | "manufacturer" | "aliases" | "modelNumbers" | "category" | "sources" | "missingData"
  > & {
    slug: string;
    manufacturerSlug?: string;
    productData?: Record<string, unknown>;
    successorOf?: string;
  },
  now = new Date(),
): ProductPreflightResult => {
  const schema = detectProductSchema();
  const target = assertSafeProductSlug(candidate.slug);
  const blockers: string[] = [];
  const warnings: string[] = [];
  if (!schema.detected) blockers.push("Produktschema konnte nicht aus dem Repository gelesen werden.");
  if (fs.existsSync(target)) blockers.push("Produktdatei existiert bereits.");

  const existingProducts = loadRepositoryProducts();
  const possibleDuplicates = existingProducts
    .map((existing) => ({
      slug: existing.slug,
      ...compareProductIdentity(
        {
          name: candidate.name,
          brand: candidate.brand,
          aliases: candidate.aliases,
          modelNumbers: candidate.modelNumbers,
          successorOf: candidate.successorOf,
        },
        existing,
      ),
    }))
    .filter((result) => result.relationship !== "separate" && result.confidence >= 0.5)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 10);
  if (possibleDuplicates.some((item) => ["identical", "alias"].includes(item.relationship) && item.confidence >= 0.9)) {
    blockers.push("Produkt ist wahrscheinlich bereits vorhanden oder ein Alias.");
  } else if (possibleDuplicates.length) {
    warnings.push("Mögliche Variante, Nachfolgerbeziehung oder Namensüberschneidung muss redaktionell geprüft werden.");
  }

  const primarySources = candidate.sources.filter((source) =>
    ["manufacturer", "manual", "datasheet", "press-release", "app-store"].includes(source.sourceType),
  );
  if (!primarySources.length) blockers.push("Keine belastbare Primärquelle vorhanden.");
  if (candidate.sources.length < 2) blockers.push("Weniger als zwei unabhängige Quellenbelege vorhanden.");

  const manufacturerSlug = candidate.manufacturerSlug || candidate.brand.toLocaleLowerCase("de").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!manufacturerSlug || !hasManufacturer(manufacturerSlug)) {
    blockers.push("Herstellerdatei fehlt oder Herstelleridentität ist nicht eindeutig.");
  }

  const productData = candidate.productData ?? {};
  const missingFields = schema.requiredFields.filter((field) => productData[field] === undefined);
  if (missingFields.length) blockers.push(`Pflichtfelder fehlen: ${missingFields.join(", ")}.`);
  if (candidate.missingData.length) warnings.push(`Offene Produktdaten: ${candidate.missingData.join(", ")}.`);

  const images = imageState(candidate.slug);
  if (!images.roles.hero) blockers.push("Freigegebenes hero.webp fehlt im erwarteten Produktbildpfad.");
  const missingImageRoles = PRODUCT_IMAGE_ROLES.filter((role) => !images.roles[role]);
  if (missingImageRoles.length) warnings.push(`Bildrollen fehlen: ${missingImageRoles.join(", ")}.`);

  const comparisons = comparisonSlugs();
  const categoryText = `${candidate.category} ${candidate.name}`.toLocaleLowerCase("de");
  const recommendedComparisons = comparisons.filter((slug) => {
    if (/gps|tracker/.test(categoryText)) return /gps|tracker/.test(slug);
    if (/trink|brunnen|fountain|wasser/.test(categoryText)) return /trink|brunnen/.test(slug);
    if (/futter|feeder/.test(categoryText)) return /futter/.test(slug);
    return false;
  });
  if (!recommendedComparisons.length) warnings.push("Keine vorhandene Vergleichsseite lässt sich sicher aus der Kategorie ableiten.");

  return {
    passed: blockers.length === 0,
    blockers,
    warnings,
    existingProduct: fs.existsSync(target) ? candidate.slug : undefined,
    possibleDuplicates,
    requiredFields: schema.requiredFields,
    missingFields,
    schemaVersion: schema.version,
    schemaPath: schema.path,
    targetPaths: [
      path.relative(path.resolve(APP_ROOT, "../.."), target).replace(/\\/g, "/"),
      ...IMAGE_ROOTS.map((root) =>
        path.relative(path.resolve(APP_ROOT, "../.."), path.join(root, candidate.slug)).replace(/\\/g, "/"),
      ),
    ],
    recommendedComparisons,
    checkedAt: now.toISOString(),
  };
};

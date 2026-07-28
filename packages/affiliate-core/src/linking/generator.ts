import type { InternalLinkDefinition, InternalLinkDictionary } from "./types.ts";

export interface LinkableProduct {
  name: string;
  productUrl?: string;
  aliases?: string[];
}

export interface LinkableManufacturer {
  name?: string;
  title?: string;
  slug?: string;
  aliases?: string[];
}

export interface LinkableDecisionRule {
  title: string;
  slug?: string;
  keywords?: string[];
}

export interface LinkGeneratorInput {
  products?: Record<string, LinkableProduct>;
  manufacturers?: Record<string, LinkableManufacturer>;
  decisionRules?: Record<string, LinkableDecisionRule>;
  manualLinks?: InternalLinkDictionary;
  blockedAnchors?: Iterable<string>;
}

const normalizePath = (href: string) => {
  if (!href) return "/";
  if (/^(?:https?:|mailto:)/.test(href)) return href;
  const path = href.startsWith("/") ? href : `/${href}`;
  return path.endsWith("/") ? path : `${path}/`;
};

const normalizeTerm = (value: string) =>
  value.toLocaleLowerCase("de-DE").normalize("NFKD").replace(/\p{Diacritic}/gu, "")
    .replace(/ß/g, "ss").replace(/[^\p{L}\p{N}]+/gu, " ").trim();

const uniqueAliases = (values: Array<string | undefined>, blocked = new Set<string>()) =>
  [...new Set(values.filter((value): value is string => Boolean(value?.trim())).map((value) => value.trim()))]
    .filter((value) => !blocked.has(normalizeTerm(value)));

const createDefinition = (definition: InternalLinkDefinition): InternalLinkDefinition => ({
  maxOccurrences: 1,
  preventNestedLinks: true,
  ...definition,
  anchorAliases: uniqueAliases([
    ...(definition.anchorAliases ?? []),
    ...(definition.keywords ?? [])
  ]),
  keywords: undefined,
  href: normalizePath(definition.href)
});

export const generateInternalLinkDictionary = ({
  products = {},
  manufacturers = {},
  decisionRules = {},
  manualLinks = {},
  blockedAnchors = []
}: LinkGeneratorInput): InternalLinkDictionary => {
  const blocked = new Set([...blockedAnchors].map(normalizeTerm));
  const result: InternalLinkDictionary = {};

  for (const [key, definition] of Object.entries(manualLinks)) {
    result[key] = createDefinition({
      ...definition,
      anchorAliases: uniqueAliases([
        ...(definition.anchorAliases ?? []),
        ...(definition.keywords ?? [])
      ], blocked)
    });
  }

  for (const [key, manufacturer] of Object.entries(manufacturers)) {
    const name = manufacturer.name ?? manufacturer.title ?? key;
    result[`manufacturer:${key}`] = createDefinition({
      id: `manufacturer:${key}`,
      anchorAliases: uniqueAliases([name, ...(manufacturer.aliases ?? [])], blocked),
      href: `/hersteller/${manufacturer.slug ?? key}/`,
      priority: "normal",
      title: name,
      group: "manufacturer",
      intentTerms: ["Hersteller", "Marke"]
    });
  }

  for (const [key, product] of Object.entries(products)) {
    result[`product:${key}`] = createDefinition({
      id: `product:${key}`,
      anchorAliases: uniqueAliases([product.name, ...(product.aliases ?? [])], blocked),
      href: product.productUrl ?? `/produkt/${key}/`,
      priority: "high",
      title: product.name,
      group: "product",
      intentTerms: ["Modell", "Produkt", "Testbericht"]
    });
  }

  for (const [key, rule] of Object.entries(decisionRules)) {
    const slug = rule.slug ?? key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
    result[`comparison:${key}`] = createDefinition({
      id: `comparison:${key}`,
      anchorAliases: uniqueAliases([rule.title, ...(rule.keywords ?? [])], blocked),
      href: `/vergleiche/${slug}/`,
      priority: "high",
      title: rule.title,
      group: "comparison",
      intentTerms: ["Vergleich", "beste Modelle", "Kaufentscheidung"]
    });
  }

  return result;
};

export const generateInternalLinkDefinitions = (input: LinkGeneratorInput) =>
  Object.values(generateInternalLinkDictionary(input));

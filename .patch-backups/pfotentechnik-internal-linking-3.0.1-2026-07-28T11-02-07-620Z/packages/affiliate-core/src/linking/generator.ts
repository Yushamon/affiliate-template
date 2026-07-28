import type {
  InternalLinkDefinition,
  InternalLinkDictionary
} from "./types";

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
}

const normalizePath = (href: string) => {
  if (!href) {
    return "/";
  }

  if (
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:")
  ) {
    return href;
  }

  const normalizedHref = href.startsWith("/")
    ? href
    : `/${href}`;

  return normalizedHref.endsWith("/")
    ? normalizedHref
    : `${normalizedHref}/`;
};

const uniqueKeywords = (keywords: Array<string | undefined>) =>
  Array.from(
    new Set(
      keywords
        .filter((keyword): keyword is string => Boolean(keyword?.trim()))
        .map((keyword) => keyword.trim())
    )
  );

const createDefinition = (
  definition: InternalLinkDefinition
): InternalLinkDefinition => ({
  maxOccurrences: 1,
  preventNestedLinks: true,
  ...definition,
  keywords: uniqueKeywords(definition.keywords),
  href: normalizePath(definition.href)
});

const createProductLinks = (
  products: Record<string, LinkableProduct>
): InternalLinkDictionary =>
  Object.fromEntries(
    Object.entries(products).map(([productKey, product]) => [
      `product:${productKey}`,
      createDefinition({
        id: `product:${productKey}`,
        keywords: uniqueKeywords([
          product.name,
          ...(product.aliases ?? [])
        ]),
        href: product.productUrl ?? `/produkt/${productKey}/`,
        priority: "high",
        title: product.name,
        group: "product"
      })
    ])
  );

const createManufacturerLinks = (
  manufacturers: Record<string, LinkableManufacturer>
): InternalLinkDictionary =>
  Object.fromEntries(
    Object.entries(manufacturers).map(
      ([manufacturerKey, manufacturer]) => {
        const manufacturerName =
          manufacturer.name ??
          manufacturer.title ??
          manufacturerKey;

        return [
          `manufacturer:${manufacturerKey}`,
          createDefinition({
            id: `manufacturer:${manufacturerKey}`,
            keywords: uniqueKeywords([
              manufacturerName,
              ...(manufacturer.aliases ?? [])
            ]),
            href: `/hersteller/${
              manufacturer.slug ?? manufacturerKey
            }/`,
            priority: "high",
            title: manufacturerName,
            group: "manufacturer"
          })
        ];
      }
    )
  );

const createDecisionLinks = (
  decisionRules: Record<string, LinkableDecisionRule>
): InternalLinkDictionary =>
  Object.fromEntries(
    Object.entries(decisionRules).map(([decisionKey, rule]) => {
      const fallbackSlug = decisionKey
        .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
        .toLowerCase();

      return [
        `decision:${decisionKey}`,
        createDefinition({
          id: `decision:${decisionKey}`,
          keywords: uniqueKeywords([
            rule.title,
            ...(rule.keywords ?? [])
          ]),
          href: `/${rule.slug ?? fallbackSlug}/`,
          priority: "normal",
          title: rule.title,
          group: "decision"
        })
      ];
    })
  );

export const generateInternalLinkDictionary = ({
  products = {},
  manufacturers = {},
  decisionRules = {},
  manualLinks = {}
}: LinkGeneratorInput): InternalLinkDictionary => ({
  ...manualLinks,
  ...createManufacturerLinks(manufacturers),
  ...createProductLinks(products),
  ...createDecisionLinks(decisionRules)
});

export const generateInternalLinkDefinitions = (
  input: LinkGeneratorInput
): InternalLinkDefinition[] =>
  Object.values(generateInternalLinkDictionary(input));
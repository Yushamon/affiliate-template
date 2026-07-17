import type { CollectionEntry } from "astro:content";
import type {
  InternalLinkDefinition,
  LinkPriority
} from "@affiliate-core/linking/types";

type PageEntry = CollectionEntry<"pages">;
type ProductEntry = CollectionEntry<"products">;
type ComparisonEntry = CollectionEntry<"comparisons">;
type ManufacturerEntry = CollectionEntry<"manufacturers">;

export type InternalLinkCollections = {
  pages: PageEntry[];
  products?: ProductEntry[];
  comparisons?: ComparisonEntry[];
  manufacturers?: ManufacturerEntry[];
};

const normalizePath = (path: string) => {
  const withLeadingSlash = path.startsWith("/")
    ? path
    : `/${path}`;

  return withLeadingSlash.endsWith("/")
    ? withLeadingSlash
    : `${withLeadingSlash}/`;
};

const uniqueStrings = (
  values: Array<string | undefined | null>
) =>
  Array.from(
    new Set(
      values
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value))
    )
  );

const titleWithoutYear = (title: string) =>
  title
    .replace(/\b20\d{2}\b/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

const titleWithoutSuffix = (title: string) =>
  title
    .replace(
      /\s*(?:im Test|im Vergleich|Testbericht|Vergleich und Kaufberatung|Kaufberatung)\s*$/i,
      ""
    )
    .trim();

const buildTitleKeywords = (
  title: string,
  extra: string[] = []
) =>
  uniqueStrings([
    title,
    titleWithoutYear(title),
    titleWithoutSuffix(title),
    titleWithoutSuffix(titleWithoutYear(title)),
    ...extra
  ]).filter((keyword) => keyword.length >= 4);

const toPriority = (
  value?: LinkPriority
): LinkPriority => value ?? "normal";

const pageDefinition = (
  page: PageEntry
): InternalLinkDefinition | null => {
  const linking = page.data.linking;

  if (!linking) {
    return null;
  }

  return {
    id: `page:${page.data.slug}`,
    keywords: uniqueStrings(linking.keywords),
    href: normalizePath(page.data.slug),
    title: page.data.title,
    group: "knowledge",
    priority: toPriority(linking.priority),
    maxOccurrences: 1,
    contexts: uniqueStrings(
      linking.contexts.length > 0
        ? linking.contexts
        : [
            page.data.linkContext,
            page.data.category,
            ...(page.data.tags ?? []),
            ...(page.data.hub?.sections ?? [])
          ]
    ),
    preventNestedLinks: true
  };
};

const productDefinition = (
  product: ProductEntry
): InternalLinkDefinition => ({
  id: `product:${product.data.slug}`,
  keywords: buildTitleKeywords(product.data.title),
  href: normalizePath(
    product.data.productUrl ??
      `/produkt/${product.data.slug}/`
  ),
  title: product.data.title,
  group: "product",
  priority: "low",
  maxOccurrences: 1,
  contexts: uniqueStrings([
    product.data.category.key,
    product.data.category.label,
    ...(product.data.tags ?? []),
    ...(product.data.hub?.sections ?? [])
  ]),
  preventNestedLinks: true
});

const comparisonDefinition = (
  comparison: ComparisonEntry
): InternalLinkDefinition => ({
  id: `comparison:${comparison.data.slug}`,
  keywords: buildTitleKeywords(comparison.data.title, [
    comparison.data.seo?.title
  ].filter((value): value is string => Boolean(value))),
  href: normalizePath(
    `/vergleiche/${comparison.data.slug}/`
  ),
  title: comparison.data.title,
  group: "comparison",
  priority: "high",
  maxOccurrences: 1,
  contexts: uniqueStrings([
    ...(comparison.data.tags ?? []),
    ...(comparison.data.hub?.sections ?? []),
    "vergleich",
    "kaufberatung"
  ]),
  preventNestedLinks: true
});

const manufacturerDefinition = (
  manufacturer: ManufacturerEntry
): InternalLinkDefinition => ({
  id: `manufacturer:${manufacturer.data.slug}`,
  keywords: uniqueStrings([
    manufacturer.data.name,
    manufacturer.data.title
  ]),
  href: normalizePath(
    `/hersteller/${manufacturer.data.slug}/`
  ),
  title: manufacturer.data.name,
  group: "manufacturer",
  priority: "normal",
  maxOccurrences: 1,
  contexts: uniqueStrings([
    ...(manufacturer.data.tags ?? []),
    ...(manufacturer.data.hub?.sections ?? []),
    ...(manufacturer.data.productCategories ?? []),
    "hersteller",
    "produkt"
  ]),
  preventNestedLinks: true
});

const dedupeDefinitions = (
  definitions: InternalLinkDefinition[]
) => {
  const seen = new Set<string>();

  return definitions.filter((definition) => {
    const key = `${definition.href}|${definition.keywords.join("|")}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

/**
 * Baut eine projektweite, konservative Linkliste:
 *
 * - Seiten: nur explizit gepflegte linking.keywords
 * - Vergleiche: exakter Titel und bereinigte Titelvarianten
 * - Produkte: exakter Produktname
 * - Hersteller: exakter Herstellername
 *
 * Generische Tags werden bewusst nicht als Anchor-Texte verwendet.
 */
export const getInternalLinkDefinitions = ({
  pages,
  products = [],
  comparisons = [],
  manufacturers = []
}: InternalLinkCollections): InternalLinkDefinition[] =>
  dedupeDefinitions([
    ...pages
      .map(pageDefinition)
      .filter(
        (
          definition
        ): definition is InternalLinkDefinition =>
          definition !== null
      ),
    ...comparisons.map(comparisonDefinition),
    ...manufacturers.map(manufacturerDefinition),
    ...products.map(productDefinition)
  ]);

/**
 * Rückwärtskompatibilität für bestehende Aufrufer.
 */
export const getPageInternalLinkDefinitions = (
  pages: PageEntry[]
): InternalLinkDefinition[] =>
  getInternalLinkDefinitions({ pages });

export const getSourceContexts = (
  data: {
    linkContext?: string;
    category?: string | {
      key?: string;
      label?: string;
    };
    tags?: string[];
    linking?: {
      contexts?: string[];
    };
    hub?: {
      sections?: string[];
    };
  }
) =>
  uniqueStrings([
    data.linkContext,
    typeof data.category === "string"
      ? data.category
      : data.category?.key,
    typeof data.category === "object"
      ? data.category?.label
      : undefined,
    ...(data.tags ?? []),
    ...(data.linking?.contexts ?? []),
    ...(data.hub?.sections ?? [])
  ]);

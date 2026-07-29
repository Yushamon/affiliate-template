import type { CollectionEntry } from "astro:content";
import type {
  InternalLinkDefinition,
  InternalLinkGroup,
  LinkPriority
} from "@affiliate-core/linking/types";
import { applyAnchorGovernance } from "./anchorGovernance";
import {
  blockedAnchors,
  detectLinkIntents,
  detectLinkTopics,
  linkTaxonomy,
  normalizeTaxonomyPath,
  sanitizeAnchorAliases,
  taxonomyEntriesForHref
} from "./linkTaxonomy";

type PageEntry = CollectionEntry<"pages">;
type ProductEntry = CollectionEntry<"products">;
type ComparisonEntry = CollectionEntry<"comparisons">;
type ManufacturerEntry = CollectionEntry<"manufacturers">;

type AliasAware = { aliases?: string[] };

export type InternalLinkCollections = {
  pages: PageEntry[];
  products?: ProductEntry[];
  comparisons?: ComparisonEntry[];
  manufacturers?: ManufacturerEntry[];
};

const normalizePath = normalizeTaxonomyPath;

const uniqueStrings = (values: Array<string | undefined | null>) =>
  Array.from(new Map(
    values
      .map((value) => value?.trim())
      .filter((value): value is string => Boolean(value))
      .map((value) => [value.toLocaleLowerCase("de-DE"), value])
  ).values());

const toPriority = (value?: LinkPriority): LinkPriority => value ?? "normal";

const taxonomyDefinition = (
  entry: (typeof linkTaxonomy)[number]
): InternalLinkDefinition | null => {
  if (!entry.href || entry.anchorAliases.length === 0) return null;
  return {
    id: entry.id,
    anchorAliases: sanitizeAnchorAliases(entry.anchorAliases),
    href: normalizePath(entry.href),
    title: entry.title,
    group: entry.targetGroup,
    priority: entry.priority,
    maxOccurrences: 1,
    contextTerms: uniqueStrings([...entry.contextTerms, ...entry.topics]),
    intentTerms: uniqueStrings(entry.intentTerms ?? []),
    topics: entry.topics,
    exclusiveAnchors: entry.exclusiveAnchors ?? [],
    preventNestedLinks: true
  };
};

const pageDefinition = (page: PageEntry): InternalLinkDefinition | null => {
  const href = normalizePath(page.data.slug);
  const taxonomyEntries = taxonomyEntriesForHref(href);
  const linking = page.data.linking;
  if (!linking && taxonomyEntries.length === 0) return null;

  const taxonomyAliases = taxonomyEntries.flatMap((entry) => entry.anchorAliases);
  const anchors = sanitizeAnchorAliases([
    ...taxonomyAliases,
    ...(linking?.keywords ?? [])
  ]);
  if (anchors.length === 0) return null;

  const taxonomyTopics = taxonomyEntries.flatMap((entry) => entry.topics);
  const group: InternalLinkGroup = taxonomyEntries.some((entry) => entry.cornerstone)
    ? "hub"
    : "knowledge";

  return {
    id: taxonomyEntries[0]?.id ?? `page:${page.data.slug}`,
    anchorAliases: anchors,
    href,
    title: page.data.title,
    group,
    priority: toPriority(linking?.priority ?? taxonomyEntries[0]?.priority),
    maxOccurrences: linking?.maxOccurrences ?? 1,
    contextTerms: uniqueStrings([
      ...taxonomyEntries.flatMap((entry) => entry.contextTerms),
      ...(linking?.contexts ?? []),
      page.data.linkContext,
      typeof page.data.category === "string" ? page.data.category : undefined,
      ...(page.data.tags ?? []),
      ...(page.data.hub?.sections ?? []),
      ...taxonomyTopics
    ]),
    intentTerms: uniqueStrings([
      ...taxonomyEntries.flatMap((entry) => entry.intentTerms ?? []),
      page.data.contentPlatform?.intent
    ]),
    topics: uniqueStrings([
      ...taxonomyTopics,
      ...detectLinkTopics([
        page.data.title,
        page.data.description,
        page.data.linkContext,
        ...(page.data.tags ?? []),
        ...(linking?.contexts ?? [])
      ])
    ]),
    exclusiveAnchors: taxonomyEntries.flatMap((entry) => entry.exclusiveAnchors ?? []),
    preventNestedLinks: true
  };
};

const productDefinition = (product: ProductEntry): InternalLinkDefinition => {
  const aliases = (product.data as typeof product.data & AliasAware).aliases ?? [];
  return {
    id: `product:${product.data.slug}`,
    anchorAliases: sanitizeAnchorAliases([product.data.title, ...aliases]),
    href: normalizePath(product.data.productUrl ?? `/produkt/${product.data.slug}/`),
    title: product.data.title,
    group: "product",
    priority: "normal",
    maxOccurrences: 1,
    contextTerms: uniqueStrings([
      product.data.category.key,
      product.data.category.label,
      product.data.manufacturer.name,
      ...(product.data.tags ?? []),
      ...(product.data.hub?.sections ?? [])
    ]),
    intentTerms: ["Modell", "Produkt", "Testbericht"],
    topics: detectLinkTopics([
      product.data.title,
      product.data.category.key,
      product.data.category.label,
      ...(product.data.tags ?? []),
      ...(product.data.features ?? [])
    ]),
    preventNestedLinks: true
  };
};

const comparisonDefinition = (
  comparison: ComparisonEntry
): InternalLinkDefinition => {
  const aliases = (comparison.data as typeof comparison.data & AliasAware).aliases ?? [];
  return {
    id: `comparison:${comparison.data.slug}`,
    anchorAliases: sanitizeAnchorAliases([
      comparison.data.title,
      comparison.data.seo?.title,
      ...aliases
    ].filter((value): value is string => Boolean(value))),
    href: normalizePath(`/vergleiche/${comparison.data.slug}/`),
    title: comparison.data.title,
    group: "comparison",
    priority: "high",
    maxOccurrences: 1,
    contextTerms: uniqueStrings([
      ...(comparison.data.tags ?? []),
      ...(comparison.data.hub?.sections ?? []),
      "Modelle",
      "Kaufentscheidung"
    ]),
    intentTerms: ["vergleichen", "beste Modelle", "Testsieger", "Kaufentscheidung"],
    topics: detectLinkTopics([
      comparison.data.title,
      comparison.data.description,
      ...(comparison.data.tags ?? []),
      ...(comparison.data.hub?.sections ?? [])
    ]),
    preventNestedLinks: true
  };
};

const manufacturerDefinition = (
  manufacturer: ManufacturerEntry
): InternalLinkDefinition => {
  const aliases = (manufacturer.data as typeof manufacturer.data & AliasAware).aliases ?? [];
  return {
    id: `manufacturer:${manufacturer.data.slug}`,
    anchorAliases: sanitizeAnchorAliases([manufacturer.data.name, ...aliases]),
    href: normalizePath(`/hersteller/${manufacturer.data.slug}/`),
    title: manufacturer.data.name,
    group: "manufacturer",
    priority: "normal",
    maxOccurrences: 1,
    contextTerms: uniqueStrings([
      ...(manufacturer.data.tags ?? []),
      ...(manufacturer.data.hub?.sections ?? []),
      ...(manufacturer.data.productCategories ?? []),
      ...(manufacturer.data.productAreas ?? [])
    ]),
    intentTerms: ["Hersteller", "Marke", "Anbieter"],
    topics: detectLinkTopics([
      manufacturer.data.name,
      ...(manufacturer.data.tags ?? []),
      ...(manufacturer.data.productCategories ?? []),
      ...(manufacturer.data.productAreas ?? [])
    ]),
    preventNestedLinks: true
  };
};

const mergeDefinitions = (definitions: InternalLinkDefinition[]) => {
  const byId = new Map<string, InternalLinkDefinition>();
  for (const definition of definitions) {
    const current = byId.get(definition.id);
    if (!current) {
      byId.set(definition.id, definition);
      continue;
    }
    byId.set(definition.id, {
      ...current,
      ...definition,
      anchorAliases: sanitizeAnchorAliases([
        ...(current.anchorAliases ?? []),
        ...(definition.anchorAliases ?? [])
      ]),
      contextTerms: uniqueStrings([
        ...(current.contextTerms ?? []),
        ...(definition.contextTerms ?? [])
      ]),
      intentTerms: uniqueStrings([
        ...(current.intentTerms ?? []),
        ...(definition.intentTerms ?? [])
      ]),
      topics: uniqueStrings([...(current.topics ?? []), ...(definition.topics ?? [])]),
      exclusiveAnchors: uniqueStrings([
        ...(current.exclusiveAnchors ?? []),
        ...(definition.exclusiveAnchors ?? [])
      ])
    });
  }
  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id, "de"));
};

let cachedCollections: InternalLinkCollections | undefined;
let cachedDefinitions: InternalLinkDefinition[] | undefined;

export const getInternalLinkDefinitions = ({
  pages,
  products = [],
  comparisons = [],
  manufacturers = []
}: InternalLinkCollections): InternalLinkDefinition[] => {
  if (
    import.meta.env.PROD &&
    cachedDefinitions &&
    cachedCollections?.pages === pages &&
    cachedCollections.products === products &&
    cachedCollections.comparisons === comparisons &&
    cachedCollections.manufacturers === manufacturers
  ) {
    return cachedDefinitions;
  }

  const definitions = applyAnchorGovernance(
    mergeDefinitions([
      ...linkTaxonomy.map(taxonomyDefinition).filter((value): value is InternalLinkDefinition => Boolean(value)),
      ...pages.map(pageDefinition).filter((value): value is InternalLinkDefinition => Boolean(value)),
      ...comparisons.map(comparisonDefinition),
      ...manufacturers.map(manufacturerDefinition),
      ...products.map(productDefinition)
    ]).filter((definition) => (definition.anchorAliases?.length ?? 0) > 0)
  );

  if (import.meta.env.PROD) {
    cachedCollections = { pages, products, comparisons, manufacturers };
    cachedDefinitions = definitions;
  }

  return definitions;
};

export const getPageInternalLinkDefinitions = (pages: PageEntry[]) =>
  getInternalLinkDefinitions({ pages });

export const getBlockedAnchors = () => blockedAnchors;

export const getSourceContexts = (data: {
  title?: string;
  description?: string;
  linkContext?: string;
  category?: string | { key?: string; label?: string };
  tags?: string[];
  linking?: { contexts?: string[] };
  hub?: { sections?: string[] };
  contentPlatform?: { cluster?: string; intent?: string };
}) => {
  const explicit = uniqueStrings([
    data.linkContext,
    typeof data.category === "string" ? data.category : data.category?.key,
    typeof data.category === "object" ? data.category?.label : undefined,
    ...(data.tags ?? []),
    ...(data.linking?.contexts ?? []),
    ...(data.hub?.sections ?? []),
    data.contentPlatform?.cluster,
    data.contentPlatform?.intent
  ]);
  return uniqueStrings([
    ...explicit,
    ...detectLinkTopics([data.title, data.description, ...explicit]),
    ...detectLinkIntents([data.title, data.description, ...explicit])
  ]);
};

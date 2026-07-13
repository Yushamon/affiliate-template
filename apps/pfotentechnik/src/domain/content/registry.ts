import {
  getCollection,
  type CollectionEntry
} from "astro:content";
import type { ImageMetadata } from "astro";

export type PageEntry =
  CollectionEntry<"pages">;

export type ProductEntry =
  CollectionEntry<"products">;

export type ManufacturerEntry =
  CollectionEntry<"manufacturers">;

export type ComparisonEntry =
  CollectionEntry<"comparisons">;

export type ContentEntry =
  | PageEntry
  | ProductEntry
  | ManufacturerEntry
  | ComparisonEntry;

export type HubContentEntry = {
  id: string;
  title: string;
  description: string;
  slug: string;
  href: string;
  type:
    | "page"
    | "knowledge"
    | "product"
    | "manufacturer"
    | "comparison";
  layout: string;
  tags: string[];
  sections: string[];
  order: number;
  featured: boolean;
  hubTitle: string;
  hubDescription: string;
  icon?: string;
  image?: ImageMetadata;
  rating?: number;
  collection:
    | "pages"
    | "products"
    | "manufacturers"
    | "comparisons";
  entry: ContentEntry;
};

export type NavigationItem = {
  label: string;
  href: string;
  order: number;
};

const normalizePath = (
  path: string
) => {
  if (!path) {
    return "/";
  }

  const withLeadingSlash =
    path.startsWith("/")
      ? path
      : `/${path}`;

  return withLeadingSlash.endsWith("/")
    ? withLeadingSlash
    : `${withLeadingSlash}/`;
};

const getPageHref = (
  entry: PageEntry
) =>
  normalizePath(
    entry.data.slug
  );

const getProductHref = (
  entry: ProductEntry
) =>
  normalizePath(
    entry.data.productUrl ??
      `/produkt/${entry.data.slug}/`
  );

const getManufacturerHref = (
  entry: ManufacturerEntry
) =>
  normalizePath(
    `/hersteller/${entry.data.slug}`
  );

const getComparisonHref = (
  entry: ComparisonEntry
) =>
  normalizePath(
    `/vergleiche/${entry.data.slug}`
  );

const getProductImage = (
  entry: ProductEntry
) =>
  entry.data.images.thumbnail?.src ??
  entry.data.images.comparison?.src ??
  entry.data.images.hero.src;

const getManufacturerImage = (
  entry: ManufacturerEntry
) =>
  entry.data.images.hero.src;

const getComparisonImage = (
  entry: ComparisonEntry
) =>
  entry.data.heroImage?.src;

const mapPageEntry = (
  entry: PageEntry
): HubContentEntry => ({
  id: entry.id,
  title: entry.data.title,
  description:
    entry.data.description,
  slug: entry.data.slug,
  href: getPageHref(entry),
  type: entry.data.type,
  layout: entry.data.layout,
  tags: entry.data.tags,
  sections:
    entry.data.hub?.sections ?? [],
  order:
    entry.data.hub?.order ??
    entry.data.hubPriority ??
    100,
  featured:
    entry.data.hub?.featured ??
    false,
  hubTitle:
    entry.data.hub?.title ??
    entry.data.title,
  hubDescription:
    entry.data.hub?.description ??
    entry.data.description,
  icon:
    entry.data.hub?.icon,
  collection: "pages",
  entry
});

const mapProductEntry = (
  entry: ProductEntry
): HubContentEntry => ({
  id: entry.id,
  title: entry.data.title,
  description:
    entry.data.description,
  slug: entry.data.slug,
  href: getProductHref(entry),
  type: "product",
  layout: "product",
  tags: entry.data.tags,
  sections:
    entry.data.hub?.sections ?? [],
  order:
    entry.data.hub?.order ??
    100,
  featured:
    entry.data.hub?.featured ??
    false,
  hubTitle:
    entry.data.hub?.title ??
    entry.data.title,
  hubDescription:
    entry.data.hub?.description ??
    entry.data.description,
  icon:
    entry.data.hub?.icon,
  image:
    getProductImage(entry),
  rating:
    entry.data.rating,
  collection: "products",
  entry
});

const mapManufacturerEntry = (
  entry: ManufacturerEntry
): HubContentEntry => ({
  id: entry.id,
  title: entry.data.title,
  description:
    entry.data.description,
  slug: entry.data.slug,
  href:
    getManufacturerHref(entry),
  type: "manufacturer",
  layout: "manufacturer",
  tags: entry.data.tags,
  sections:
    entry.data.hub?.sections ?? [],
  order:
    entry.data.hub?.order ??
    100,
  featured:
    entry.data.hub?.featured ??
    false,
  hubTitle:
    entry.data.hub?.title ??
    entry.data.name,
  hubDescription:
    entry.data.hub?.description ??
    entry.data.summary,
  icon:
    entry.data.hub?.icon,
  image:
    getManufacturerImage(entry),
  rating:
    entry.data.rating,
  collection:
    "manufacturers",
  entry
});

const mapComparisonEntry = (
  entry: ComparisonEntry
): HubContentEntry => ({
  id: entry.id,
  title: entry.data.title,
  description:
    entry.data.description,
  slug: entry.data.slug,
  href:
    getComparisonHref(entry),
  type: "comparison",
  layout: "comparison",
  tags: entry.data.tags,
  sections:
    entry.data.hub?.sections ?? [],
  order:
    entry.data.hub?.order ??
    100,
  featured:
    entry.data.hub?.featured ??
    false,
  hubTitle:
    entry.data.hub?.title ??
    entry.data.title,
  hubDescription:
    entry.data.hub?.description ??
    entry.data.description,
  icon:
    entry.data.hub?.icon ??
    entry.data.icon,
  image:
    getComparisonImage(entry),
  collection:
    "comparisons",
  entry
});

export const getPages =
  async (): Promise<
    PageEntry[]
  > =>
    getCollection("pages");

export const getProducts =
  async (): Promise<
    ProductEntry[]
  > =>
    getCollection("products");

export const getManufacturers =
  async (): Promise<
    ManufacturerEntry[]
  > =>
    getCollection(
      "manufacturers"
    );

export const getComparisons =
  async (): Promise<
    ComparisonEntry[]
  > =>
    getCollection(
      "comparisons"
    );

export const getAllContent =
  async (): Promise<
    HubContentEntry[]
  > => {
    const [
      pages,
      products,
      manufacturers,
      comparisons
    ] = await Promise.all([
      getPages(),
      getProducts(),
      getManufacturers(),
      getComparisons()
    ]);

    return [
      ...pages.map(
        mapPageEntry
      ),
      ...products.map(
        mapProductEntry
      ),
      ...manufacturers.map(
        mapManufacturerEntry
      ),
      ...comparisons.map(
        mapComparisonEntry
      )
    ];
  };

export const sortHubEntries = (
  entries: HubContentEntry[]
) =>
  [...entries].sort(
    (a, b) =>
      Number(b.featured) -
        Number(a.featured) ||
      a.order - b.order ||
      a.hubTitle.localeCompare(
        b.hubTitle,
        "de"
      )
  );

export const getContentByHub =
  async (
    section: string
  ): Promise<
    HubContentEntry[]
  > => {
    const normalizedSection =
      section
        .trim()
        .toLowerCase();

    const content =
      await getAllContent();

    return sortHubEntries(
      content.filter((entry) =>
        entry.sections.some(
          (entrySection) =>
            entrySection
              .trim()
              .toLowerCase() ===
            normalizedSection
        )
      )
    );
  };

export const getContentByTag =
  async (
    tag: string
  ): Promise<
    HubContentEntry[]
  > => {
    const normalizedTag =
      tag
        .trim()
        .toLowerCase();

    const content =
      await getAllContent();

    return sortHubEntries(
      content.filter((entry) =>
        entry.tags.some(
          (entryTag) =>
            entryTag
              .trim()
              .toLowerCase() ===
            normalizedTag
        )
      )
    );
  };

export const getContentByType =
  async (
    type:
      HubContentEntry["type"]
  ): Promise<
    HubContentEntry[]
  > => {
    const content =
      await getAllContent();

    return sortHubEntries(
      content.filter(
        (entry) =>
          entry.type === type
      )
    );
  };

export const getContentEntryBySlug =
  async (
    slug: string
  ): Promise<
    HubContentEntry | undefined
  > => {
    const normalizedSlug =
      slug
        .replace(
          /^\/|\/$/g,
          ""
        )
        .trim()
        .toLowerCase();

    const content =
      await getAllContent();

    return content.find(
      (entry) =>
        entry.slug
          .replace(
            /^\/|\/$/g,
            ""
          )
          .trim()
          .toLowerCase() ===
        normalizedSlug
    );
  };

export const getNavigationItems =
  async (): Promise<NavigationItem[]> => {
    const [
      pages,
      products,
      manufacturers
    ] = await Promise.all([
      getPages(),
      getProducts(),
      getManufacturers()
    ]);

    const content = [
      ...pages.map(mapPageEntry),
      ...products.map(mapProductEntry),
      ...manufacturers.map(
        mapManufacturerEntry
      )
    ];
    const items = content
      .map((item) => {
        const navigation =
          item.entry.data.navigation;

        if (!navigation?.show) {
          return null;
        }

        const section =
          navigation.section?.trim();

        const href = section
          ? normalizePath(section)
          : item.href;

        return {
          label:
            navigation.label ??
            item.hubTitle,
          href,
          order: navigation.order
        };
      })
      .filter(
        (item): item is NavigationItem =>
          item !== null
      )
      .sort(
        (a, b) =>
          a.order - b.order ||
          a.label.localeCompare(b.label, "de")
      );

    return items.filter(
      (item, index) =>
        items.findIndex(
          (candidate) =>
            candidate.href === item.href
        ) === index
    );
  };

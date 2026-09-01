import type { ComparisonEntry, ManufacturerEntry, ProductEntry } from "../content/registry";
import { resolveProductMedia } from "../mediaResolver.mjs";
import { toEditorialScore } from "@affiliate-core/utils/editorialScore";

const priceFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2
});

const text = (value: unknown) => String(value ?? "").trim();
const list = <T>(value: T[] | undefined | null): T[] => Array.isArray(value) ? value : [];
const productHref = (product: ProductEntry) => product.data.productUrl ?? `/produkt/${product.data.slug}/`;
const isCurrentProduct = (product: ProductEntry) =>
  product.data.productStatus !== "discontinued" &&
  product.data.recommendationStatus !== "archived";

const comparisonProductSlugs = (comparison: ComparisonEntry) =>
  list<any>(comparison.data.items).map((item) => typeof item === "string" ? item : text(item?.slug)).filter(Boolean);

const differenceLabels = [
  "Kamera",
  "App-Steuerung",
  "WLAN",
  "Kapazität",
  "Stromversorgung",
  "Futterart",
  "Zugangskontrolle",
  "Material"
];

export type ManufacturerExperienceModel = ReturnType<typeof buildManufacturerExperienceModel>;

export const buildManufacturerExperienceModel = ({
  entry,
  products,
  comparisons,
  manufacturers
}: {
  entry: ManufacturerEntry;
  products: ProductEntry[];
  comparisons: ComparisonEntry[];
  manufacturers: ManufacturerEntry[];
}) => {
  const manufacturer = entry.data;
  const declaredOrder = new Map(manufacturer.productSlugs.map((slug, index) => [slug, index]));
  const portfolio = products
    .filter((product) =>
      manufacturer.productSlugs.includes(product.data.slug) ||
      product.data.manufacturer.slug === manufacturer.slug ||
      product.data.manufacturer.key === manufacturer.key
    )
    .sort((a, b) =>
      (declaredOrder.get(a.data.slug) ?? Number.MAX_SAFE_INTEGER) -
      (declaredOrder.get(b.data.slug) ?? Number.MAX_SAFE_INTEGER)
    );
  const currentPortfolio = portfolio.filter(isCurrentProduct);
  const selectionPool = currentPortfolio.length ? currentPortfolio : portfolio;

  const familyMap = new Map<string, { label: string; href?: string; products: ProductEntry[] }>();
  for (const product of portfolio) {
    const label = text(product.data.category?.label) || "Weitere Haustiertechnik";
    const key = text(product.data.category?.key) || label.toLocaleLowerCase("de");
    const current = familyMap.get(key) ?? { label, href: product.data.category?.path, products: [] };
    current.products.push(product);
    current.href ||= product.data.category?.path;
    familyMap.set(key, current);
  }

  const families = [...familyMap.entries()].map(([key, family]) => {
    const best = [...family.products].sort((a, b) =>
      Number(isCurrentProduct(b)) - Number(isCurrentProduct(a)) ||
      Number(b.data.score ?? toEditorialScore(b.data.rating, 5)) - Number(a.data.score ?? toEditorialScore(a.data.rating, 5))
    )[0];
    return {
      key,
      label: family.label,
      href: family.href,
      orientation: best?.data.recommendation ?? `${family.label} von ${manufacturer.name}`,
      products: family.products.map((product) => ({
        slug: product.data.slug,
        title: product.data.title,
        href: productHref(product),
        current: isCurrentProduct(product)
      }))
    };
  }).sort((a, b) => b.products.length - a.products.length || a.label.localeCompare(b.label, "de"));

  const ranked = [...selectionPool].sort((a, b) => {
    const evidenceA = a.data.externalEvidence?.status === "verified" ? 8 : a.data.externalEvidence ? 3 : 0;
    const evidenceB = b.data.externalEvidence?.status === "verified" ? 8 : b.data.externalEvidence ? 3 : 0;
    return Number(b.data.score ?? toEditorialScore(b.data.rating, 5)) + evidenceB -
      (Number(a.data.score ?? toEditorialScore(a.data.rating, 5)) + evidenceA);
  });
  const selectedEntries: ProductEntry[] = [];
  const selectedFamilies = new Set<string>();
  for (const product of ranked) {
    const family = text(product.data.category?.key) || text(product.data.category?.label);
    if (selectedFamilies.has(family)) continue;
    selectedEntries.push(product);
    selectedFamilies.add(family);
    if (selectedEntries.length >= Math.min(5, Math.max(3, families.length))) break;
  }
  for (const product of ranked) {
    if (selectedEntries.includes(product)) continue;
    selectedEntries.push(product);
    if (selectedEntries.length >= Math.min(5, Math.max(3, selectionPool.length))) break;
  }

  const selectedProducts = selectedEntries.map((product) => {
    const currentPrice = product.data.price?.current;
    return {
      slug: product.data.slug,
      title: product.data.title,
      manufacturer: product.data.manufacturer.name,
      href: productHref(product),
      role: product.data.decision?.bestFor?.[0] ?? product.data.useCase?.[0] ?? product.data.recommendation,
      recommendation: product.data.recommendation,
      score: product.data.score ?? toEditorialScore(product.data.rating, 5),
      price: typeof currentPrice === "number" && product.data.priceState === "available"
        ? priceFormatter.format(currentPrice)
        : undefined,
      image: resolveProductMedia(product.data.images)
    };
  });

  const ownSlugs = new Set(portfolio.map((product) => product.data.slug));
  const relevantComparisons = comparisons
    .map((comparison) => {
      const slugs = comparisonProductSlugs(comparison);
      const ownCount = slugs.filter((slug) => ownSlugs.has(slug)).length;
      return { comparison, ownCount, total: slugs.length };
    })
    .filter(({ ownCount }) => ownCount > 0)
    .sort((a, b) => b.ownCount - a.ownCount || b.total - a.total)
    .slice(0, 3)
    .map(({ comparison, ownCount, total }) => ({
      title: comparison.data.title,
      text: comparison.data.description,
      href: `/vergleiche/${comparison.data.slug}/`,
      ownCount,
      total
    }));

  const startPaths = families.slice(0, 5).map((family) => ({
    label: family.label,
    title: family.products.length === 1 ? family.products[0].title : `${family.products.length} Modelle einordnen`,
    text: family.orientation,
    href: family.href ?? family.products[0]?.href,
    cta: family.href ? `${family.label} verstehen` : "Produktcheck öffnen"
  })).filter((path) => Boolean(path.href));

  const specsByProduct = new Map(portfolio.map((product) => [
    product.data.slug,
    new Map(list<any>(product.data.specs).map((spec) => [text(spec.label), text(spec.value)]))
  ]));
  const differences = differenceLabels.flatMap((label) => {
    const groups = new Map<string, string[]>();
    for (const product of portfolio) {
      const value = specsByProduct.get(product.data.slug)?.get(label);
      if (!value || /nicht (?:ausgewiesen|bekannt|angegeben)/i.test(value)) continue;
      const names = groups.get(value) ?? [];
      names.push(product.data.title);
      groups.set(value, names);
    }
    if (groups.size < 2 || groups.size > 6) return [];
    return [{ label, values: [...groups].map(([value, names]) => ({ value, products: names.slice(0, 3) })) }];
  }).slice(0, 3);

  const alternatives = manufacturer.alternativeManufacturerSlugs.flatMap((slug) => {
    const alternative = manufacturers.find((candidate) => candidate.data.slug === slug);
    return alternative ? [{
      name: alternative.data.name,
      text: alternative.data.description,
      href: `/hersteller/${alternative.data.slug}/`
    }] : [];
  }).slice(0, 3);

  return {
    slug: manufacturer.slug,
    name: manufacturer.name,
    orientation: manufacturer.description,
    recommendation: manufacturer.recommendation,
    summary: manufacturer.summary,
    heroImage: manufacturer.images.hero,
    website: manufacturer.website,
    productCount: portfolio.length,
    categoryCount: families.length,
    focus: manufacturer.focus.slice(0, 3),
    suitableFor: manufacturer.suitableFor,
    attention: manufacturer.attention,
    strengths: manufacturer.strengths,
    weaknesses: manufacturer.weaknesses,
    profile: manufacturer.profile,
    series: manufacturer.series,
    experience: manufacturer.experience,
    sources: manufacturer.sources,
    families,
    startPaths,
    selectedProducts,
    differences,
    relevantComparisons,
    alternatives
  };
};

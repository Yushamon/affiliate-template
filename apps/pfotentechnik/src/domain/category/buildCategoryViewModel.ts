import type { PageEntry, ProductEntry, ComparisonEntry } from "../content/registry";
import { resolveProductMedia } from "../comparison/mediaResolver.mjs";
import { toEditorialScore } from "@affiliate-core/utils/editorialScore";
import { categoryEditorialConfig, isCategoryHubSlug } from "./categoryConfig";
import type { CategoryExperienceModel } from "./model";

const priceFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2
});

const compactMarkdown = (source: string) => source
  .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
  .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
  .replace(/^#{3,6}\s+(.+)$/gm, "$1.")
  .replace(/^\|.*$/gm, "")
  .replace(/^\s*[-*]\s+/gm, "• ")
  .replace(/^\s*\d+\.\s+/gm, "")
  .replace(/[*_`>]/g, "")
  .replace(/\n{3,}/g, "\n\n")
  .trim();

const extractEvidenceSections = (body: string, headings: string[]) => {
  const sections = new Map<string, string>();
  const matches = [...body.matchAll(/^##\s+(.+)$/gm)];
  for (const [index, match] of matches.entries()) {
    const start = (match.index ?? 0) + match[0].length;
    const end = matches[index + 1]?.index ?? body.length;
    sections.set(match[1].trim(), body.slice(start, end));
  }

  return headings.flatMap((title) => {
    const source = sections.get(title);
    if (!source) return [];
    const paragraphs = compactMarkdown(source)
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .slice(0, 2)
      .map((paragraph) => paragraph.length > 620 ? `${paragraph.slice(0, 617).trimEnd()}…` : paragraph);
    return paragraphs.length ? [{ title, paragraphs }] : [];
  });
};

export const buildCategoryViewModel = ({
  page,
  pages,
  products,
  comparisons
}: {
  page: PageEntry;
  pages: PageEntry[];
  products: ProductEntry[];
  comparisons: ComparisonEntry[];
}): CategoryExperienceModel | undefined => {
  if (!isCategoryHubSlug(page.data.slug)) return undefined;

  const config = categoryEditorialConfig[page.data.slug];
  const productBySlug = new Map(products.map((product) => [product.data.slug, product]));
  const pageBySlug = new Map(pages.map((entry) => [entry.data.slug, entry]));
  const comparisonBySlug = new Map(comparisons.map((entry) => [entry.data.slug, entry]));

  const selectedProducts = config.products.flatMap(({ slug, role }) => {
    const product = productBySlug.get(slug);
    if (!product || product.data.productStatus === "discontinued" || product.data.recommendationStatus === "archived") return [];

    const media = resolveProductMedia(product.data.images);
    const currentPrice = product.data.price.current;

    return [{
      slug,
      role,
      title: product.data.title,
      manufacturer: product.data.manufacturer.name,
      reason: product.data.recommendation,
      suitability: product.data.decision.bestFor[0] ?? product.data.useCase,
      href: product.data.productUrl ?? `/produkt/${slug}/`,
      score: product.data.score ?? toEditorialScore(product.data.rating, 5),
      price: typeof currentPrice === "number" && product.data.priceState === "available"
        ? priceFormatter.format(currentPrice)
        : undefined,
      image: media
    }];
  });

  const comparisonModels = config.comparisons.flatMap(({ slug, question, why }) => {
    const comparison = comparisonBySlug.get(slug);
    if (!comparison) return [];
    return [{
      title: comparison.data.title,
      question,
      text: why,
      href: `/vergleiche/${slug}/`,
      itemCount: comparison.data.items.length
    }];
  });

  const guides = config.guides.flatMap((slug) => {
    const guide = pageBySlug.get(slug);
    if (!guide) return [];
    return [{
      title: guide.data.hub?.title ?? guide.data.title,
      text: guide.data.hub?.description ?? guide.data.description,
      href: `/${slug}/`
    }];
  });

  const heroImage = page.data.heroImage ?? selectedProducts[0]?.image;

  return {
    slug: page.data.slug,
    eyebrow: config.eyebrow,
    title: page.data.title,
    orientation: page.data.description,
    cue: config.cue,
    heroImage,
    heroAlt: page.data.heroImage?.alt ?? (selectedProducts[0]
      ? `${selectedProducts[0].title} als Beispiel für ${page.data.categoryLabel ?? page.data.title}`
      : page.data.title),
    requirements: config.requirements,
    paths: config.paths,
    comparisons: comparisonModels,
    products: selectedProducts,
    guides,
    evidenceIntro: config.evidenceIntro,
    evidenceSections: extractEvidenceSections(page.body ?? "", config.evidenceHeadings),
    closing: config.closing
  };
};

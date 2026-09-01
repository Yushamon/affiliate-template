import type { AssembledContentPage } from "../contentPlatform";
import type { ComparisonEntry, PageEntry, ProductEntry } from "../content/registry";
import { resolveProductMedia } from "../mediaResolver.mjs";
import { getBestComparison } from "../recommendationLinks";
import { toEditorialScore } from "@affiliate-core/utils/editorialScore";

export type GuideKind = "problem" | "buying" | "how-to" | "explanation";
export type GuideExperienceModel = ReturnType<typeof buildGuideExperienceModel>;

const categoryHubs = new Set([
  "/smarte-futterautomaten/",
  "/trinkbrunnen/",
  "/gps-tracker/",
  "/katzenklappen/",
  "/haustierkameras/",
  "/automatische-katzentoiletten/"
]);
const categorySlugs = new Set([...categoryHubs].map((href) => href.split("/").filter(Boolean)[0]));
const text = (value: unknown) => String(value ?? "").replace(/\s+/g, " ").trim();
const list = <T>(value: T[] | undefined | null): T[] => Array.isArray(value) ? value : [];
const stripMarkdown = (value: string) => text(value
  .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
  .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
  .replace(/[*_`>#]/g, ""));
const trimAnswer = (value: string, max = 480) => value.length <= max ? value : `${value.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;

const firstBodyParagraph = (body: string) => {
  const blocks = body.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
  const paragraph = blocks.find((block) =>
    !block.startsWith("#") &&
    !block.startsWith("|") &&
    !/^[-*]\s/.test(block) &&
    !/^\d+\.\s/.test(block) &&
    !block.startsWith("![")
  );
  return trimAnswer(stripMarkdown(paragraph ?? ""));
};

const classifyGuide = (page: PageEntry): GuideKind => {
  const intent = page.data.contentPlatform?.intent;
  const subject = `${page.data.slug} ${page.data.title}`.toLocaleLowerCase("de");
  if (
    intent === "troubleshooting" ||
    intent === "health-guide" ||
    /\b(frisst nicht|durchfall|müde|trinkt (?:zu wenig|viel|plötzlich)|warnzeichen|entlaufen)\b/.test(subject)
  ) return "problem";
  if (
    intent === "how-to" ||
    /\b(reinigen|einrichten|befestigen|einbauen|wechseln|gewöhnen|messen|entfernen)\b/.test(subject)
  ) return "how-to";
  if (
    /\b(oder|vs\.?|unterschied|wie funktioniert|wie funktionieren|reichweite|wie genau|warum .* abo|datenschutz)\b/.test(subject) ||
    intent === "informational"
  ) return "explanation";
  return "buying";
};

const labels: Record<GuideKind, { eyebrow: string; summary: string; action: string }> = {
  problem: { eyebrow: "Ratgeber · Problem einordnen", summary: "Was jetzt wichtig ist", action: "Zur Einordnung" },
  buying: { eyebrow: "Ratgeber · Auswahl treffen", summary: "Die Entscheidung in Kürze", action: "Zur Entscheidung" },
  "how-to": { eyebrow: "Ratgeber · Schritt für Schritt", summary: "Zuerst prüfen", action: "Zur Anleitung" },
  explanation: { eyebrow: "Ratgeber · Technik verstehen", summary: "Der entscheidende Unterschied", action: "Zur Erklärung" }
};

const extractQuickItems = (page: PageEntry, assembled: AssembledContentPage) => {
  if (assembled.summary.length) return assembled.summary.slice(0, 5);
  const blocks = list<any>(page.data.premiumBlocks);
  const quick = blocks.find((block) => block.type === "quickFacts" || block.type === "checklist" || block.type === "checks");
  const fromCards = list<any>(quick?.cards).map((card) => [card.label, card.title ?? card.value].filter(Boolean).join(": "));
  if (fromCards.length) return fromCards.slice(0, 5);
  const fromItems = list<string>(quick?.items).map(text).filter(Boolean);
  if (fromItems.length) return fromItems.slice(0, 5);
  const firstTable = (page.body ?? "").match(/(?:^\|.+\|\n){3,}/m)?.[0];
  if (firstTable) {
    return firstTable.split("\n").slice(2).map((row) => row.split("|").map(text).filter(Boolean).slice(0, 2).join(": ")).filter(Boolean).slice(0, 5);
  }
  const bullets = [...(page.body ?? "").matchAll(/^[-*]\s+(.+)$/gm)].map((match) => stripMarkdown(match[1]));
  return bullets.slice(0, 5);
};

export const buildGuideExperienceModel = ({
  page,
  pages,
  products,
  comparisons,
  assembled
}: {
  page: PageEntry;
  pages: PageEntry[];
  products: ProductEntry[];
  comparisons: ComparisonEntry[];
  assembled: AssembledContentPage;
}) => {
  const kind = classifyGuide(page);
  const copy = labels[kind];
  const answerBlock = list<any>(page.data.premiumBlocks).find((block) => block.type === "answer");
  const answer = trimAnswer(stripMarkdown(answerBlock?.text ?? firstBodyParagraph(page.body ?? "") ?? page.data.description));
  const quickItems = extractQuickItems(page, assembled);
  const categoryHref = assembled.categoryPath && categoryHubs.has(assembled.categoryPath) ? assembled.categoryPath : undefined;
  const bestComparison = getBestComparison(page.data as any, comparisons as any) as ComparisonEntry | undefined;

  const candidateProductSlugs = assembled.comparisonProducts;
  const sourceTags = new Set(page.data.tags.map((tag) => tag.toLocaleLowerCase("de")));
  const productCandidates = products
    .filter((product) => product.data.productStatus !== "discontinued" && product.data.recommendationStatus !== "archived")
    .map((product) => ({
      product,
      explicit: candidateProductSlugs.includes(product.data.slug),
      relevance: product.data.tags.filter((tag) => sourceTags.has(tag.toLocaleLowerCase("de"))).length +
        (product.data.category?.key === assembled.category ? 4 : 0)
    }))
    .filter(({ explicit, relevance }) => explicit || relevance >= 4)
    .sort((a, b) => Number(b.explicit) - Number(a.explicit) || b.relevance - a.relevance || Number(b.product.data.score ?? 0) - Number(a.product.data.score ?? 0));
  const selectedProducts = kind === "buying" ? productCandidates.slice(0, 3).map(({ product }) => ({
    slug: product.data.slug,
    title: product.data.title,
    manufacturer: product.data.manufacturer.name,
    href: product.data.productUrl ?? `/produkt/${product.data.slug}/`,
    role: product.data.decision?.bestFor?.[0] ?? product.data.recommendation,
    recommendation: product.data.recommendation,
    score: product.data.score ?? toEditorialScore(product.data.rating, 5),
    image: resolveProductMedia(product.data.images)
  })) : [];

  const pageTokens = new Set([
    ...page.data.tags,
    page.data.contentPlatform?.cluster,
    assembled.category
  ].filter(Boolean).map((value) => text(value).toLocaleLowerCase("de")));
  const relatedGuides = pages
    .filter((candidate) => candidate.data.slug !== page.data.slug && !categorySlugs.has(candidate.data.slug))
    .map((candidate) => {
      const candidateTokens = new Set([
        ...candidate.data.tags,
        candidate.data.contentPlatform?.cluster,
        candidate.data.category
      ].filter(Boolean).map((value) => text(value).toLocaleLowerCase("de")));
      const overlap = [...pageTokens].filter((token) => candidateTokens.has(token)).length;
      return { candidate, overlap };
    })
    .filter(({ overlap }) => overlap > 0)
    .sort((a, b) => b.overlap - a.overlap || Number(b.candidate.data.hubPriority ?? 0) - Number(a.candidate.data.hubPriority ?? 0))
    .slice(0, 2)
    .map(({ candidate }) => ({
      kind: "guide" as const,
      eyebrow: "Weiterführender Ratgeber",
      title: candidate.data.title,
      text: candidate.data.description,
      href: `/${candidate.data.slug}/`,
      label: "Ratgeber lesen"
    }));

  const comparisonStep = bestComparison ? {
    kind: "comparison" as const,
    eyebrow: "Passender Vergleich",
    title: bestComparison.data.title,
    text: bestComparison.data.description,
    href: `/vergleiche/${bestComparison.data.slug}/`,
    label: "Vergleich öffnen"
  } : undefined;
  const categoryStep = categoryHref ? {
    kind: "category" as const,
    eyebrow: "Produktwelt",
    title: assembled.categoryLabel,
    text: "Ordne Anforderungen und verfügbare Entscheidungswege in der passenden Produktwelt ein.",
    href: categoryHref,
    label: "Produktwelt öffnen"
  } : undefined;
  const nextSteps = (
    kind === "buying" || kind === "explanation"
      ? [comparisonStep, categoryStep, ...relatedGuides]
      : [...relatedGuides, categoryStep, comparisonStep]
  ).filter(Boolean).slice(0, 3);

  const supportingBlocks = list<any>(page.data.premiumBlocks)
    .filter((block) => !["answer", "quickFacts", "checklist", "checks", "products"].includes(block.type))
    .map((block) => ({
      title: text(block.title || block.eyebrow || "Zusätzliche Einordnung"),
      text: text(block.text),
      items: list<string>(block.items).map(text).filter(Boolean),
      cards: list<any>(block.cards).map((card) => ({
        title: text(card.title || card.label),
        text: text(card.text || card.value),
        href: text(card.href),
        cta: text(card.cta || "Mehr erfahren")
      })).filter((card) => card.title || card.text)
    }))
    .filter((block) => block.title || block.text || block.items.length || block.cards.length);

  return {
    slug: page.data.slug,
    kind,
    eyebrow: copy.eyebrow,
    summaryTitle: copy.summary,
    actionLabel: copy.action,
    title: page.data.title,
    description: page.data.description,
    answer,
    heroImage: page.data.heroImage,
    quickItems,
    selectedProducts,
    nextSteps,
    supportingBlocks,
    categoryLabel: assembled.categoryLabel
  };
};

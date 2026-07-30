import type { PageContentData } from "../../content/schema/page";

export type AutoContentBlock =
  | "summary"
  | "recommendation"
  | "comparison"
  | "fit"
  | "checklist"
  | "mistakes";

export type AssembledClosingCta = {
  title: string;
  text: string;
  productKey: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
};

export type AssembledContentPage = {
  category: string;
  categoryLabel: string;
  categoryPath?: string;
  themeColor:
    | "teal"
    | "amber"
    | "blue"
    | "green"
    | "rose"
    | "neutral";
  decisionKey?: string;
  comparisonProducts: string[];
  blocks: AutoContentBlock[];
  summary: string[];
  suitableFor: string[];
  notSuitableFor: string[];
  checklist: string[];
  mistakes: string[];
  faq: NonNullable<PageContentData["faq"]>;
  closingCta?: AssembledClosingCta;
};

const clusterDefaults: Record<
  string,
  { category: string; label: string; path?: string }
> = {
  "smart-feeders": {
    category: "futterautomaten",
    label: "Smarte Futterautomaten",
    path: "/smarte-futterautomaten/"
  },
  "water-fountains": {
    category: "trinkbrunnen",
    label: "Trinkbrunnen",
    path: "/trinkbrunnen/"
  },
  "dog-feeding": {
    category: "hundeernaehrung",
    label: "Hundeernährung",
    path: "/hundeernaehrung/"
  },
  "cat-feeding": {
    category: "katzenernaehrung",
    label: "Katzenernährung",
    path: "/katzenernaehrung/"
  },
  "dog-health": {
    category: "hundegesundheit",
    label: "Hundegesundheit"
  },
  "cat-health": {
    category: "katzengesundheit",
    label: "Katzengesundheit"
  }
};

const intentBlocks: Record<string, AutoContentBlock[]> = {
  informational: ["summary"],
  "buying-guide": [
    "summary",
    "recommendation",
    "comparison",
    "fit",
    "checklist",
    "mistakes"
  ],
  "comparison-support": [
    "summary",
    "comparison",
    "fit",
    "checklist"
  ],
  troubleshooting: ["summary", "checklist", "mistakes"],
  "how-to": ["summary", "checklist", "mistakes"],
  "health-guide": ["summary", "checklist"]
};

const intentThemes: Record<
  string,
  AssembledContentPage["themeColor"]
> = {
  informational: "neutral",
  "buying-guide": "teal",
  "comparison-support": "blue",
  troubleshooting: "amber",
  "how-to": "green",
  "health-guide": "rose"
};

const unique = (items: string[] = []) =>
  items.filter(
    (item, index, allItems) =>
      Boolean(item) && allItems.indexOf(item) === index
  );

export const assembleContentPage = (
  page: PageContentData
): AssembledContentPage => {
  const platform = page.contentPlatform;
  const cluster = platform?.cluster ?? page.category ?? "wissen";
  const intent = platform?.intent ?? "informational";
  const clusterDefault = clusterDefaults[cluster];

  const category =
    page.category ?? clusterDefault?.category ?? cluster;
  const categoryLabel =
    page.categoryLabel ?? clusterDefault?.label ?? "Ratgeber";
  const categoryPath =
    page.categoryPath ?? clusterDefault?.path;

  const platformProducts = platform?.products ?? [];
  const comparisonProducts = unique(
    page.comparisonProducts?.length
      ? page.comparisonProducts
      : platformProducts
  );

  const decisionSetting = platform?.decision ?? "auto";
  const decisionKey =
    decisionSetting === "off"
      ? undefined
      : decisionSetting !== "auto"
        ? decisionSetting
        : page.decisionKey;

  const blocks = platform?.blocks?.length
    ? platform.blocks
    : intentBlocks[intent] ?? ["summary"];

  const faq =
    platform?.faqMode === "none"
      ? []
      : page.faq ?? [];

  const ctaConfig = platform?.cta;
  const ctaProductKey =
    ctaConfig?.productKey ??
    platformProducts[0] ??
    comparisonProducts[0];

  const closingCta =
    page.closingCta ??
    (ctaConfig?.mode !== "off" && ctaProductKey
      ? {
          title:
            ctaConfig?.title ?? "Passendes Modell gefunden?",
          text:
            ctaConfig?.text ??
            "Prüfe vor dem Kauf noch einmal Ausstattung, Preis und aktuelle Verfügbarkeit.",
          productKey: ctaProductKey,
          primaryLabel: "Preis und Verfügbarkeit prüfen",
          secondaryHref: `/produkt/${ctaProductKey}/`,
          secondaryLabel: "Produkttest lesen"
        }
      : undefined);

  return {
    category,
    categoryLabel,
    categoryPath,
    themeColor:
      page.themeColor ??
      platform?.theme ??
      intentThemes[intent] ??
      "neutral",
    decisionKey,
    comparisonProducts,
    blocks,
    summary: platform?.summary ?? [],
    suitableFor: platform?.suitableFor ?? [],
    notSuitableFor: platform?.notSuitableFor ?? [],
    checklist: platform?.checklist ?? [],
    mistakes: platform?.mistakes ?? [],
    faq,
    closingCta
  };
};

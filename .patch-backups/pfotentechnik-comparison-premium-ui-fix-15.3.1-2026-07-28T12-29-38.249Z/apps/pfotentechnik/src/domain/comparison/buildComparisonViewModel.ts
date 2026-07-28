import type { CollectionEntry } from "astro:content";
import type { ImageMetadata } from "astro";
import defaultEditorialComparisonHeroImage from "../../assets/images/project/pfotentechnik/comparison/default-editorial-hero.webp";
import { buildAutomaticRecommendations } from "./recommendationEngine";
import { resolveComparisonValue } from "./comparisonDataPlatform";
import type {
  ComparisonFilter,
  ComparisonProduct,
  ComparisonRow,
  ComparisonViewModel
} from "@affiliate-core/comparison/model";

import { buildPriceIndex } from "../price/engine";
import type { ProductPriceInsight } from "../price/types";
import { deriveProductOperations } from "../../lib/product-operations/policy.mjs";

type ComparisonEntry = CollectionEntry<"comparisons">;
type ProductEntry = CollectionEntry<"products">;
type ManufacturerEntry = CollectionEntry<"manufacturers">;

const editorialComparisonHeroes = import.meta.glob<ImageMetadata>(
  "../../assets/images/project/pfotentechnik/comparison/*-editorial-hero.webp",
  { eager: true, import: "default" }
);

const resolveComparisonHeroImage = (slug: string): ImageMetadata => {
  const expectedSuffix = `/${slug}-editorial-hero.webp`;
  const match = Object.entries(editorialComparisonHeroes).find(([path]) =>
    path.endsWith(expectedSuffix)
  );
  return match?.[1] ?? defaultEditorialComparisonHeroImage;
};

type BuildInput = {
  comparison: ComparisonEntry;
  products: ProductEntry[];
  manufacturers: ManufacturerEntry[];
};

const normalizeKey = (value: string) =>
  value
    .toLocaleLowerCase("de")
    .replaceAll("ä", "ae")
    .replaceAll("ö", "oe")
    .replaceAll("ü", "ue")
    .replaceAll("ß", "ss")
    .replace(/[^a-z0-9]/g, "");

const criterionAliases: Record<string, string[]> = {
  portionierung: ["portionierung", "ausgabemenge"],
  krokettengroesse: ["krokettengroesse", "futterart"],
  napf: ["napf", "schale"],
  kapazitaet: ["kapazitaet"],
  material: ["material"],
  lautstaerke: ["lautstaerke"],
  filter: ["filter"],
  stromversorgung: ["stromversorgung", "akku"],
  eignung: ["geeignete-tiere", "geeignetetiere"],
  app: ["app", "appsteuerung"],
  kamera: ["kamera", "videokamera", "ueberwachung"],
  notstrom: ["notstrom", "stromversorgung", "backup"],
  futterart: ["futterart"],
  zugang: ["zugang", "besonderheit", "mikrochip"],
  reinigung: ["reinigung"],
  ortung: ["ortung", "satellitensysteme"],
  uebertragung: ["uebertragung", "mobilfunk", "funksystem"],
  reichweite: ["reichweite", "funkreichweite"],
  abo: ["abo", "abonnement", "laufende-kosten"],
  akkulaufzeit: ["akkulaufzeit", "akku"],
  gewicht: ["gewicht"],
  abmessungen: ["abmessungen", "masse", "groesse"],
  wasserschutz: ["wasserschutz", "wasserdicht", "ip-schutz"],
  befestigung: ["befestigung", "halsband"],
  ausfallsicherheit: [
    "ausfallsicherheit",
    "zuverlaessigkeit",
    "stromversorgung"
  ]
};

const addValue = (
  values: Record<string, string[]>,
  key: string,
  value: string
) => {
  const current = values[key] ?? [];

  if (!current.includes(value)) {
    values[key] = [...current, value];
  }
};

const collectEvidence = (product: ProductEntry): string =>
  [
    product.data.title,
    product.data.recommendation,
    product.data.useCase ?? "",
    product.data.capacity ?? "",
    ...product.data.features,
    ...product.data.strengths,
    ...product.data.weaknesses,
    ...product.data.decision.bestFor,
    ...product.data.decision.attention,
    ...product.data.specs.map(
      (spec) => `${spec.label}: ${String(spec.value)}`
    )
  ]
    .join(" ")
    .toLocaleLowerCase("de");

const inferFallbackFilters = (
  product: ProductEntry
): Record<string, string[]> => {
  const values: Record<string, string[]> = {};
  const evidence = collectEvidence(product);

  if (/trockenfutter|kroketten|dry food/.test(evidence)) {
    addValue(values, "futterart", "trockenfutter");
  }

  if (/nassfutter|wet food|kuehl|gekuehlt|kühl/.test(evidence)) {
    addValue(values, "futterart", "nassfutter");
  }

  if (/ohne app|keine app|nicht per app/.test(evidence)) {
    addValue(values, "app", "ohne-app");
  } else if (/app|wlan|wi-fi|wifi/.test(evidence)) {
    addValue(values, "app", "mit-app");
  }

  if (/ohne kamera|keine kamera/.test(evidence)) {
    addValue(values, "kamera", "ohne-kamera");
  } else if (/kamera|video|ueberwachung|überwachung/.test(evidence)) {
    addValue(values, "kamera", "mit-kamera");
  }

  if (/mikrochip|chip-erkennung|chipzugang/.test(evidence)) {
    addValue(values, "zugang", "mikrochip");
  } else {
    addValue(values, "zugang", "freier-zugang");
  }

  if (/notstrom|backup|batteriebetrieb|batteriebackup|doppelte stromversorgung/.test(evidence)) {
    addValue(values, "strombackup", "mit-backup");
  } else if (/netzteil|netzbetrieb|stromanschluss/.test(evidence)) {
    addValue(values, "strombackup", "ohne-backup");
  }

  if (product.data.priceCategory) {
    addValue(values, "preisklasse", product.data.priceCategory);
  }

  if (product.data.category.key === "gps-tracker") {
    const getSpec = (label: RegExp) =>
      product.data.specs.find((spec) => label.test(spec.label))?.value;
    const suitability = String(getSpec(/geeignet/i) ?? "").toLocaleLowerCase("de");
    const subscription = String(getSpec(/abo/i) ?? "").toLocaleLowerCase("de");
    const transmission = String(getSpec(/übertragung|uebertragung/i) ?? "").toLocaleLowerCase("de");
    const weight = Number.parseFloat(String(getSpec(/gewicht/i) ?? "").replace(",", "."));

    if (/katze/.test(suitability)) addValue(values, "tier", "katze");
    if (/hund/.test(suitability)) addValue(values, "tier", "hund");
    addValue(
      values,
      "abo",
      /nicht erforderlich/.test(subscription) ? "ohne-abo" : "mit-abo"
    );
    addValue(
      values,
      "system",
      /vhf/.test(transmission) ? "vhf" : "mobilfunk"
    );
    if (Number.isFinite(weight)) {
      addValue(values, "gewicht", weight <= 35 ? "bis-35-g" : "ueber-35-g");
    }
  }

  return values;
};

const getStructuredFilters = (
  product: ProductEntry
): Record<string, string[]> => {
  const source = product.data.comparisonFilters;
  const values: Record<string, string[]> = {};

  const foodTypes = source?.foodType ?? [];

  (source?.animal ?? []).forEach((animal) => {
    addValue(values, "tier", animal === "dog" ? "hund" : "katze");
  });

  (source?.petSize ?? []).forEach((size) => {
    addValue(
      values,
      "tiergroesse",
      size === "small" ? "klein" : size === "medium" ? "mittel" : "gross"
    );
  });

  const gps = product.data.gps;

  if (gps) {
    gps.animal.forEach((animal) =>
      addValue(values, "tier", animal === "dog" ? "hund" : "katze")
    );
    addValue(
      values,
      "abo",
      gps.subscriptionRequired ? "mit-abo" : "ohne-abo"
    );
    addValue(
      values,
      "system",
      gps.transmission === "vhf" ? "vhf" : "mobilfunk"
    );

    const comparableWeight =
      gps.deviceWeightGrams ?? gps.totalWeightGrams;

    if (typeof comparableWeight === "number") {
      addValue(
        values,
        "gewicht",
        comparableWeight <= 35 ? "bis-35-g" : "ueber-35-g"
      );
    }
  }

  foodTypes.forEach((foodType) => {
    addValue(
      values,
      "futterart",
      foodType === "dry" ? "trockenfutter" : "nassfutter"
    );
  });

  if (typeof source?.app === "boolean") {
    addValue(values, "app", source.app ? "mit-app" : "ohne-app");
  }

  if (typeof source?.camera === "boolean") {
    addValue(
      values,
      "kamera",
      source.camera ? "mit-kamera" : "ohne-kamera"
    );
  }

  if (source?.access) {
    addValue(
      values,
      "zugang",
      source.access === "microchip"
        ? "mikrochip"
        : "freier-zugang"
    );
  }

  if (typeof source?.backupPower === "boolean") {
    addValue(
      values,
      "strombackup",
      source.backupPower ? "mit-backup" : "ohne-backup"
    );
  }

  if (source?.priceTier) {
    addValue(values, "preisklasse", source.priceTier);
  }

  return values;
};

const mergeFilterValues = (
  primary: Record<string, string[]>,
  fallback: Record<string, string[]>
) => {
  const result = { ...fallback };

  Object.entries(primary).forEach(([key, values]) => {
    if (values.length > 0) {
      result[key] = values;
    }
  });

  return result;
};


const toComparisonAffiliate = (
  insight: ProductPriceInsight | undefined,
  affiliate?: ComparisonProduct["affiliate"]
): ComparisonProduct["affiliate"] => {
  if (affiliate?.url) return affiliate;
  if (!insight?.affiliateUrl) return undefined;
  const source = insight.source?.label || "Händler";
  return {
    provider: insight.source?.id,
    label: `Preis bei ${source} prüfen`,
    url: insight.affiliateUrl,
    rel: "sponsored nofollow noopener",
    target: "_blank"
  };
};

const toComparisonPrice = (
  insight: ProductPriceInsight | undefined,
  affiliate?: ComparisonProduct["affiliate"]
): ComparisonProduct["price"] => {
  const resolvedAffiliate = toComparisonAffiliate(insight, affiliate);
  const snapshot = insight?.current != null
    ? {
        amount: insight.current,
        currency: insight.currency,
        fetchedAt: insight.checkedAt,
        assessment: insight.assessment,
        assessmentLabel: insight.assessmentLabel,
        rangeLabel: insight.formattedRange ?? undefined,
        comparisonText: insight.generatedComparisonText,
        sourceLabel: insight.source?.label
      }
    : null;

  if (snapshot && resolvedAffiliate) return { kind: "live", link: resolvedAffiliate, snapshot };
  if (snapshot) return { kind: "value-only", snapshot };
  if (resolvedAffiliate) return { kind: "link-only", link: resolvedAffiliate };
  return { kind: "hidden" };
};

export function buildComparisonViewModel({
  comparison,
  products,
  manufacturers
}: BuildInput): ComparisonViewModel {
  const data = comparison.data;

  const productBySlug = new Map(
    products.map((product) => [product.data.slug, product])
  );

  const manufacturerBySlug = new Map(
    manufacturers.map((manufacturer) => [
      manufacturer.data.slug,
      manufacturer
    ])
  );

  const priceIndex = buildPriceIndex(products);
  const recommendationEligible = (slug?: string) => {
    if (!slug) return false;
    const product = productBySlug.get(slug);
    return Boolean(product && deriveProductOperations(product.data).autoRecommendationEligible);
  };

  const explicitItems = data.items.filter(
    (item, index, source) =>
      source.findIndex(
        (candidate) =>
          candidate.type === item.type &&
          candidate.slug === item.slug
      ) === index
  );

  const explicitSlugs = new Set(
    data.items.map((item) => item.slug)
  );

  // Kuratierte Vergleichslisten sind autoritativ. Automatische
  // Produktzuordnung dient nur als Fallback, wenn keine items gepflegt sind.
  const automaticItems = explicitItems.length === 0
    ? products
      .filter((product) =>
        product.data.comparisons.includes(data.slug)
      )
      .map((product) => ({
        slug: product.data.slug,
        label: product.data.title,
        type: "product" as const,
        recommendation: product.data.recommendation,
        values: {}
      }))
    : [];

  const items = [...explicitItems, ...automaticItems];

  const automaticRecommendation = buildAutomaticRecommendations({
    comparison,
    products,
    itemSlugs: items
      .filter((item) => item.type === "product")
      .map((item) => item.slug)
  });
  const eligibleItemSlugs = items
    .filter((item) =>
      item.type === "product" &&
      recommendationEligible(item.slug)
    )
    .map((item) => item.slug);

  const winnerCandidate =
    automaticRecommendation.winnerSlug ??
    data.recommendation.winnerSlug;
  const alternativeCandidate =
    automaticRecommendation.alternativeSlug ??
    data.recommendation.alternativeSlug;

  const resolvedWinnerSlug =
    winnerCandidate && eligibleItemSlugs.includes(winnerCandidate)
      ? winnerCandidate
      : eligibleItemSlugs[0];

  const resolvedAlternativeSlug =
    alternativeCandidate &&
    alternativeCandidate !== resolvedWinnerSlug &&
    eligibleItemSlugs.includes(alternativeCandidate)
      ? alternativeCandidate
      : eligibleItemSlugs.find((slug) => slug !== resolvedWinnerSlug);

  const getCriterionValue = (
    item: (typeof items)[number],
    criterion: (typeof data.criteria)[number]
  ): string =>
    resolveComparisonValue({
      product: productBySlug.get(item.slug),
      item,
      criterion
    });

  const rawRows = data.criteria.map((criterion) => ({
    criterion: {
      key: criterion.key,
      label: criterion.label,
      description: criterion.description
    },
    cells: items.map((item) => ({
      productSlug: item.slug,
      value: getCriterionValue(item, criterion)
    }))
  }));

  const rowCandidates = rawRows.map((row) => {
    const resolvedCells = row.cells.filter(
      (cell) =>
        Boolean(cell.value) &&
        cell.value !== "–"
    );
    const normalizedValues = new Set(
      resolvedCells.map((cell) =>
        cell.value.trim().toLocaleLowerCase("de")
      )
    );

    return {
      ...row,
      resolvedCount: resolvedCells.length,
      coverage:
        row.cells.length > 0
          ? resolvedCells.length / row.cells.length
          : 0,
      hasDifferences: normalizedValues.size > 1
    };
  });

  /*
   * Release Closure 14.0:
   * Nur vollständig belegte Kriterien werden öffentlich ausgespielt.
   * Unvollständige Quellkriterien bleiben im Audit sichtbar, erzeugen aber
   * keine "Keine Angabe"-Wüsten in Desktop-Tabelle oder Mobile Cards.
   */
  const rows: ComparisonRow[] = rowCandidates
    .filter((row) =>
      row.cells.length >= 2 &&
      row.resolvedCount === row.cells.length
    )
    .map(({ resolvedCount: _resolvedCount, coverage: _coverage, ...row }) => row);


  const filterValuesBySlug = new Map<
    string,
    Record<string, string[]>
  >();

  items.forEach((item) => {
    const product = productBySlug.get(item.slug);

    if (!product) {
      filterValuesBySlug.set(item.slug, {});
      return;
    }

    filterValuesBySlug.set(
      item.slug,
      mergeFilterValues(
        getStructuredFilters(product),
        inferFallbackFilters(product)
      )
    );
  });

  const hasUsefulFilterCoverage = (key: string) => {
    const productsWithValue = items.filter((item) => {
      const values = filterValuesBySlug.get(item.slug)?.[key] ?? [];
      return values.length > 0;
    }).length;

    return productsWithValue >= 2 &&
      productsWithValue / Math.max(items.length, 1) >= 0.5;
  };

  const isGpsComparison = items.length > 0 && items.every((item) =>
    productBySlug.get(item.slug)?.data.category.key === "gps-tracker"
  );

  const filterDefinitions: ComparisonFilter[] = isGpsComparison ? [
    {
      key: "tier",
      label: "Tier",
      options: [
        { value: "hund", label: "Hund" },
        { value: "katze", label: "Katze" }
      ]
    },
    {
      key: "abo",
      label: "Laufender Dienst",
      options: [
        { value: "mit-abo", label: "Abo erforderlich" },
        { value: "ohne-abo", label: "Ohne Mobilfunkabo" }
      ]
    },
    {
      key: "system",
      label: "Übertragung",
      options: [
        { value: "mobilfunk", label: "Mobilfunk und App" },
        { value: "vhf", label: "VHF und Handgerät" }
      ]
    },
    {
      key: "gewicht",
      label: "Gerätegewicht",
      options: [
        { value: "bis-35-g", label: "Bis 35 g" },
        { value: "ueber-35-g", label: "Über 35 g" }
      ]
    }
  ] : [
    ...(hasUsefulFilterCoverage("tier")
      ? [{
          key: "tier",
          label: "Tier",
          options: [
            { value: "hund", label: "Hund" },
            { value: "katze", label: "Katze" }
          ]
        }]
      : []),
    ...(hasUsefulFilterCoverage("tiergroesse")
      ? [{
          key: "tiergroesse",
          label: "Tiergröße",
          options: [
            { value: "klein", label: "Klein" },
            { value: "mittel", label: "Mittel" },
            { value: "gross", label: "Groß" }
          ]
        }]
      : []),
    {
      key: "futterart",
      label: "Futterart",
      options: [
        { value: "trockenfutter", label: "Trockenfutter" },
        { value: "nassfutter", label: "Nassfutter" }
      ]
    },
    {
      key: "app",
      label: "Steuerung",
      options: [
        { value: "mit-app", label: "Mit App oder WLAN" },
        { value: "ohne-app", label: "Ohne App" }
      ]
    },
    {
      key: "kamera",
      label: "Kamera",
      options: [
        { value: "mit-kamera", label: "Mit Kamera" },
        { value: "ohne-kamera", label: "Ohne Kamera" }
      ]
    },
    {
      key: "zugang",
      label: "Zugang",
      options: [
        { value: "mikrochip", label: "Mikrochipgesteuert" },
        { value: "freier-zugang", label: "Freier Zugang" }
      ]
    },
    {
      key: "strombackup",
      label: "Stromversorgung",
      options: [
        { value: "mit-backup", label: "Mit Batterie-Backup" },
        { value: "ohne-backup", label: "Nur Netzbetrieb" }
      ]
    },
    {
      key: "preisklasse",
      label: "Preisklasse",
      options: [
        { value: "budget", label: "Budget" },
        { value: "midrange", label: "Mittelklasse" },
        { value: "premium", label: "Premium" }
      ]
    }
  ];

  const filters = filterDefinitions
    .map((filter) => {
      const options = filter.options.filter((option) =>
        Array.from(filterValuesBySlug.values()).some(
          (values) =>
            values[filter.key]?.includes(option.value)
        )
      );

      return {
        ...filter,
        options
      };
    })
    .filter((filter) => filter.options.length >= 2)
    .slice(0, 4);

  const views = items
    .map((item, index): ComparisonProduct | null => {
      if (item.type === "manufacturer") {
        const manufacturer = manufacturerBySlug.get(item.slug);
        if (!manufacturer) return null;

        return {
          slug: item.slug,
          title: manufacturer.data.name,
          href: `/hersteller/${item.slug}/`,
          image:
            manufacturer.data.images.logo ??
            manufacturer.data.images.hero,
          recommendation:
            item.recommendation ??
            manufacturer.data.recommendation,
          rating: manufacturer.data.rating,
          badge:
            item.slug === resolvedWinnerSlug
              ? "Top-Empfehlung"
              : undefined,
          strengths: [],
          attention: [],
          price: { kind: "hidden" },
          filterValues:
            filterValuesBySlug.get(item.slug) ?? {}
        };
      }

      const product = productBySlug.get(item.slug);
      if (!product) return null;

      const productOperations = deriveProductOperations(product.data);
      const affiliate = productOperations.purchasable && product.data.affiliate
        ? {
            provider: product.data.affiliate.provider,
            label: product.data.affiliate.label,
            url: product.data.affiliate.url,
            rel: product.data.affiliate.rel,
            target: product.data.affiliate.target
          }
        : undefined;
      const priceInsight = priceIndex.bySlug.get(item.slug);

      return {
        slug: item.slug,
        title: product.data.title,
        manufacturer: product.data.manufacturer.name,
        href: `/produkt/${item.slug}/`,
        image:
          product.data.images.comparison ??
          product.data.images.thumbnail ??
          product.data.images.hero,
        recommendation:
          item.recommendation ??
          product.data.recommendation,
        rating:
          product.data.score ??
          Math.round(product.data.rating * 20),
        badge:
            item.slug === resolvedWinnerSlug
              ? "Top-Empfehlung"
              : item.slug === resolvedAlternativeSlug
                ? "Preis-Leistung"
                : index === 1
                  ? "Gute Alternative"
                  : undefined,
        strengths: product.data.strengths,
        attention:
          product.data.decision.attention.length
            ? product.data.decision.attention
            : product.data.weaknesses,
        affiliate,
        price: toComparisonPrice(priceInsight, affiliate),
        filterValues:
          filterValuesBySlug.get(item.slug) ?? {}
      };
    })
    .filter(
      (item): item is ComparisonProduct => item !== null
    );

  const winner = views.find(
    (product) =>
      product.slug === resolvedWinnerSlug
  );

  const alternative = views.find(
    (product) =>
      product.slug === resolvedAlternativeSlug
  );

  const scenarioRecommendations = automaticRecommendation.scenarios
    .map((scenario) => {
      const scenarioWinner = views.find(
        (product) => product.slug === scenario.winnerSlug
      );
      if (!scenarioWinner) return null;

      return {
        key: scenario.key,
        label: scenario.label,
        score: scenario.score,
        reason: scenario.reason,
        winner: scenarioWinner,
        alternative: views.find(
          (product) => product.slug === scenario.alternativeSlug
        )
      };
    })
    .filter((scenario): scenario is NonNullable<typeof scenario> =>
      scenario !== null
    );

  const recommendations = [
    winner,
    alternative,
    ...views.filter(
      (product) =>
        product.slug !== winner?.slug &&
        product.slug !== alternative?.slug
    )
  ]
    .filter(
      (product): product is ComparisonProduct =>
        Boolean(product)
    )
    .slice(0, 4);

  return {
    title: data.title,
    description: data.description,
    eyebrow: `${data.icon ?? "↔"} Vergleich`,
    heroImage: {
      src: resolveComparisonHeroImage(data.slug),
      alt: data.heroImage?.alt ?? "Katze und Hund mit moderner Technik für den Haustieralltag."
    
    },
    facts: [
      { label: "Modelle", value: String(views.length) },
      ...(rows.length > 0
        ? [{ label: "Kriterien", value: String(rows.length) }]
        : [{
            label: "Datenstand",
            value: new Intl.DateTimeFormat("de-DE", {
              month: "2-digit",
              year: "numeric",
              timeZone: "UTC"
            }).format(
              new Date(`${data.updatedAt ?? data.publishedAt}T00:00:00Z`)
            )
          }]),
      { label: "Einordnung", value: "Unabhängig" }
    ],
    products: views,
    recommendationProducts: recommendations,
    rows,
    filters,
    initialVisibleProducts: 5,
    scenarioRecommendations,
    verdict: {
      title: automaticRecommendation.title,
      text: automaticRecommendation.text,
      winner,
      alternative
    }
  };
}

import type { CollectionEntry } from "astro:content";
import petTechHeroImage from "../../assets/images/project/pfotentechnik/pet-tech-hero.webp";
import { buildAutomaticRecommendations } from "./recommendationEngine";
import type {
  ComparisonFilter,
  ComparisonProduct,
  ComparisonRow,
  ComparisonViewModel
} from "@affiliate-core/comparison/model";

type ComparisonEntry = CollectionEntry<"comparisons">;
type ProductEntry = CollectionEntry<"products">;
type ManufacturerEntry = CollectionEntry<"manufacturers">;

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

  const explicitSlugs = new Set(
    data.items.map((item) => item.slug)
  );

  const automaticItems = products
    .filter(
      (product) =>
        product.data.comparisons.includes(data.slug) &&
        !explicitSlugs.has(product.data.slug)
    )
    .map((product) => ({
      slug: product.data.slug,
      label: product.data.title,
      type: "product" as const,
      recommendation: product.data.recommendation,
      values: {}
    }));

  const items = [...data.items, ...automaticItems];

  const automaticRecommendation = buildAutomaticRecommendations({
    comparison,
    products,
    itemSlugs: items
      .filter((item) => item.type === "product")
      .map((item) => item.slug)
  });
  const resolvedWinnerSlug =
    automaticRecommendation.winnerSlug ??
    data.recommendation.winnerSlug;
  const resolvedAlternativeSlug =
    automaticRecommendation.alternativeSlug ??
    data.recommendation.alternativeSlug;

  const getCriterionValue = (
    item: (typeof items)[number],
    criterionKey: string,
    criterionLabel: string
  ): string => {
    const normalized = normalizeKey(criterionKey);

    const override = Object.entries(item.values ?? {}).find(
      ([key]) => normalizeKey(key) === normalized
    )?.[1];

    if (override !== undefined) {
      return typeof override === "boolean"
        ? override
          ? "Ja"
          : "Nein"
        : String(override);
    }

    const product = productBySlug.get(item.slug);
    if (!product) return "–";

    const candidates = new Set([
      normalized,
      normalizeKey(criterionLabel),
      ...(criterionAliases[normalized] ?? [])
    ]);

    if (normalized === "napf") {
      const evidence = [
        ...product.data.specs.map(
          (spec) => `${spec.label}: ${String(spec.value)}`
        ),
        ...product.data.strengths
      ].find((value) => /napf|schale/i.test(value));

      return evidence?.replace(
        /^(Besonderheit|Napf):\s*/i,
        ""
      ) ?? "–";
    }

    if (normalized === "portionierung") {
      const evidence = product.data.features.find(
        (value) => /mahlzeit|portion/i.test(value)
      );

      if (evidence) return evidence;
    }

    const spec = product.data.specs.find((candidate) =>
      candidates.has(normalizeKey(candidate.label))
    );

    if (spec) {
      return typeof spec.value === "boolean"
        ? spec.value
          ? "Ja"
          : "Nein"
        : String(spec.value);
    }

    return "–";
  };

  const rawRows = data.criteria.map((criterion) => ({
    criterion: {
      key: criterion.key,
      label: criterion.label,
      description: criterion.description
    },
    cells: items.map((item) => ({
      productSlug: item.slug,
      value: getCriterionValue(
        item,
        criterion.key,
        criterion.label
      )
    }))
  }));

  const rows: ComparisonRow[] = rawRows.map((row) => {
    const normalizedValues = new Set(
      row.cells.map((cell) =>
        cell.value && cell.value !== "–"
          ? cell.value.trim().toLocaleLowerCase("de")
          : "keine-angabe"
      )
    );

    return {
      ...row,
      hasDifferences: normalizedValues.size > 1
    };
  });

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

      const affiliate = product.data.affiliate
        ? {
            provider: product.data.affiliate.provider,
            label: product.data.affiliate.label,
            url: product.data.affiliate.url,
            rel: product.data.affiliate.rel,
            target: product.data.affiliate.target
          }
        : undefined;

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
              ? "Gute Alternative"
              : index === 1
                ? "Preis-Leistung"
                : undefined,
        strengths: product.data.strengths,
        attention:
          product.data.decision.attention.length
            ? product.data.decision.attention
            : product.data.weaknesses,
        affiliate,
        price: affiliate
          ? { kind: "link-only", link: affiliate }
          : { kind: "hidden" },
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
    heroImage: data.heroImage ?? {
      src: petTechHeroImage,
      alt: "Katze und Hund mit moderner Technik für den Haustieralltag."
    },
    facts: [
      { label: "Modelle", value: String(views.length) },
      { label: "Kriterien", value: String(data.criteria.length) },
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

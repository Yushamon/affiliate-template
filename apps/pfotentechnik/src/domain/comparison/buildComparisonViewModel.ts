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
import { calculateProductScore } from "../productScore.ts";
import type { ProductPriceInsight } from "../price/types";
import { deriveProductOperations } from "../../lib/product-operations/policy.mjs";
import { selectComparisonFinalists } from "./finalistSelection.mjs";
import { resolveComparisonProductImage } from "../mediaResolver.mjs";

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

  if (
    /ohne app|keine app|nicht per app|app nicht verfügbar|app nicht verfuegbar|keine app-steuerung|ohne app-steuerung/.test(evidence)
  ) {
    addValue(values, "app", "ohne-app");
  } else if (
    /app-steuerung|appsteuerung|per app|über die app|ueber die app|mit app|app-gesteuert|app gesteuert|steuerung via app|steuerung über app|steuerung ueber app/.test(evidence)
  ) {
    addValue(values, "app", "mit-app");
  }

  if (
    /ohne kamera|keine kamera|kamera fehlt|keine kamerafunktion|ohne kamerafunktion/.test(evidence)
  ) {
    addValue(values, "kamera", "ohne-kamera");
  } else if (
    /mit kamera|integrierte kamera|eingebaute kamera|videokamera|kamera[: ]|2k-kamera|2k kamera|1080p-kamera|1080p kamera|4k-kamera|4k kamera/.test(evidence)
  ) {
    addValue(values, "kamera", "mit-kamera");
  }

  if (/mikrochip|chip-erkennung|chipzugang/.test(evidence)) {
    addValue(values, "zugang", "mikrochip");
  } else if (
    /freier zugang|offener zugang|ohne mikrochip|keine zugangskontrolle|ohne zugangskontrolle/.test(evidence)
  ) {
    addValue(values, "zugang", "freier-zugang");
  }

  if (/notstrom|backup|batteriebetrieb|batteriebackup|doppelte stromversorgung/.test(evidence)) {
    addValue(values, "strombackup", "mit-backup");
  } else if (
    /nur netzbetrieb|ausschliesslich netzbetrieb|ausschließlich netzbetrieb|kein batterie-backup|kein batteriebackup|ohne batterie-backup|ohne batteriebackup|kein notstrom|ohne notstrom/.test(evidence)
  ) {
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

    /*
     * GPS Evidence Guard 32.6.13
     *
     * Fehlende oder unklare Angaben dürfen nicht als positives Gegenstück
     * interpretiert werden. Nur explizit belegte Aussagen erzeugen
     * Filterwerte.
     */
    if (
      /nicht erforderlich|kein abo|ohne abo|abo-frei|abofrei/.test(subscription)
    ) {
      addValue(values, "abo", "ohne-abo");
    } else if (
      /abo erforderlich|abonnement erforderlich|subscription required|monatlich|jahresabo|laufende gebuehr|laufende gebühr/.test(subscription)
    ) {
      addValue(values, "abo", "mit-abo");
    }

    if (/vhf/.test(transmission)) {
      addValue(values, "system", "vhf");
    } else if (
      /mobilfunk|lte|4g|5g|sim|cellular/.test(transmission)
    ) {
      addValue(values, "system", "mobilfunk");
    }

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
    explicitItems.map((item) => item.slug)
  );

  /*
   * Global Backlink Union 32.6.7
   *
   * Mitgliedschaft und technische Selection-Reife sind getrennt:
   *
   * - items[] bleibt die kuratierte Basis
   * - product.comparisons[] ist eine explizite redaktionelle Zuordnung
   * - explizite Backlinks dürfen für jeden Vergleich ergänzen
   * - Registry-Modi steuern nur spätere technische Selection Rules
   * - keine Volltext-Heuristik entscheidet über Mitgliedschaft
   *
   * visible = curated items[] ∪ explicit product.comparisons[]
   */
  const backlinkItems = products
    .filter((product) =>
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

  const items = [...explicitItems, ...backlinkItems];

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

  /* The backlink union expands the comparison field. Finalist selection below
   * is data-driven; legacy winner/alternative slugs are compatibility fallbacks
   * only when a sparse dataset cannot produce finalists. */
  const eligibleExplicitSlugs = explicitItems
    .filter((item) =>
      item.type === "product" &&
      recommendationEligible(item.slug)
    )
    .map((item) => item.slug);

  /*
   * Automatic Winner Resolution 32.6.21 / 33.2.2
   *
   * The finalist selector is the production default. Legacy winnerSlug and
   * alternativeSlug values remain only as a last-resort compatibility path.
   *
   * Spezialintents erhalten vorher Hard Gates. Ein Produkt kann also nicht
   * nur wegen eines hohen Basisscores einen Vergleich gewinnen, dessen
   * Kernanforderung es nach strukturierten Produktdaten nicht erfüllt.
   */
  const comparisonSlug = data.slug.toLocaleLowerCase("de");

  const matchesHardIntent = (product: ProductEntry): boolean => {
    const filters = product.data.comparisonFilters;
    const gps = product.data.gps;

    if (/mit-kamera/.test(comparisonSlug)) {
      return filters?.camera === true;
    }

    if (/ohne-abo/.test(comparisonSlug)) {
      return gps ? gps.subscriptionRequired === false : true;
    }

    if (/mit-akku|akkulaufzeit/.test(comparisonSlug)) {
      if (gps) return typeof gps.batteryMaxDays === "number";
      return filters?.backupPower === true;
    }

    if (/nassfutter/.test(comparisonSlug)) {
      return (filters?.foodType ?? []).includes("wet");
    }

    if (/ohne-wlan/.test(comparisonSlug)) {
      return filters?.app === false;
    }

    if (/fuer-katzen|für-katzen|katzen/.test(comparisonSlug)) {
      const animals = filters?.animal ?? gps?.animal ?? [];
      if (animals.length > 0 && !animals.includes("cat")) return false;
    }

    if (/fuer-hunde|für-hunde|hunde/.test(comparisonSlug)) {
      const animals = filters?.animal ?? gps?.animal ?? [];
      if (animals.length > 0 && !animals.includes("dog")) return false;
    }

    return true;
  };

  const scoreCandidates = eligibleItemSlugs
    .map((slug) => productBySlug.get(slug))
    .filter((product): product is ProductEntry => Boolean(product))
    .filter(matchesHardIntent)
    .map((product) => ({
      slug: product.data.slug,
      scoreResult: calculateProductScore(product.data)
    }))
    .filter((candidate) =>
      candidate.scoreResult.score !== null &&
      candidate.scoreResult.source !== "unrated"
    )
    .sort((a, b) => {
      const scoreDelta =
        (b.scoreResult.score ?? 0) - (a.scoreResult.score ?? 0);
      if (scoreDelta !== 0) return scoreDelta;

      const evidenceRank = (source: string) =>
        source === "score" ? 3 :
        source === "criteria" ? 2 :
        source === "rating" ? 1 : 0;

      const evidenceDelta =
        evidenceRank(b.scoreResult.source) -
        evidenceRank(a.scoreResult.source);
      if (evidenceDelta !== 0) return evidenceDelta;

      return b.scoreResult.criteriaCount - a.scoreResult.criteriaCount;
    });

  /*
   * 33.2.2 finalist policy: choose the deep A/B pair from the eligible
   * comparison field using score, documentation quality and capability
   * diversity. The complete field remains available to the Explorer/table.
   */
  const finalistSelection = selectComparisonFinalists({
    candidates: eligibleItemSlugs
      .map((slug) => productBySlug.get(slug))
      .filter((product): product is ProductEntry => Boolean(product))
      .map((product) => ({
        slug: product.data.slug,
        title: product.data.title,
        href: product.data.productUrl,
        score: product.data.score,
        rating: product.data.rating,
        recommendation: product.data.recommendation,
        useCase: product.data.useCase,
        features: product.data.features,
        strengths: product.data.strengths,
        attention: product.data.decision.attention,
        bestFor: product.data.decision.bestFor,
        failureModes: product.data.failureModes,
        comparisonFilters: product.data.comparisonFilters,
        testStatus: product.data.testStatus,
        productStatus: product.data.productStatus,
        evidence: product.data.editorial?.evidence
      }))
  });

  const scoreWinner =
    scoreCandidates[0] &&
    (scoreCandidates[0].scoreResult.score ?? 0) >= 60
      ? scoreCandidates[0]
      : undefined;

  const scoreAlternative = scoreCandidates.find(
    (candidate) => candidate.slug !== scoreWinner?.slug
  );

  // Automatic finalist resolution is the production default. Legacy
  // recommendation slugs remain a last-resort fallback for sparse datasets.
  const selectionSlugs = finalistSelection.finalists.map((candidate) => candidate.slug);
  const winnerCandidate =
    selectionSlugs[0] ??
    (automaticRecommendation.enabled ? automaticRecommendation.winnerSlug : undefined) ??
    scoreWinner?.slug ??
    data.recommendation.winnerSlug;

  const alternativeCandidate =
    selectionSlugs[1] ??
    (automaticRecommendation.enabled ? automaticRecommendation.alternativeSlug : undefined) ??
    scoreAlternative?.slug ??
    data.recommendation.alternativeSlug;

  const resolvedWinnerSlug =
    winnerCandidate && eligibleItemSlugs.includes(winnerCandidate)
      ? winnerCandidate
      : undefined;

  const resolvedAlternativeSlug =
    alternativeCandidate &&
    alternativeCandidate !== resolvedWinnerSlug &&
    eligibleItemSlugs.includes(alternativeCandidate)
      ? alternativeCandidate
      : undefined;

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
    const isResolved = (cell: (typeof row.cells)[number]) =>
      Boolean(cell.value) &&
      cell.value !== "–";

    const resolvedCells = row.cells.filter(isResolved);
    const curatedCells = row.cells.filter((cell) =>
      explicitSlugs.has(cell.productSlug)
    );
    const resolvedCuratedCells = curatedCells.filter(isResolved);

    const normalizedValues = new Set(
      resolvedCells.map((cell) =>
        cell.value.trim().toLocaleLowerCase("de")
      )
    );

    return {
      ...row,
      resolvedCount: resolvedCells.length,
      curatedCount: curatedCells.length,
      resolvedCuratedCount: resolvedCuratedCells.length,
      coverage:
        row.cells.length > 0
          ? resolvedCells.length / row.cells.length
          : 0,
      hasDifferences: normalizedValues.size > 1
    };
  });

  /*
   * Curated Row Guard 32.6.9
   *
   * Die globale Backlink-Union darf eine bestehende Vergleichsmatrix
   * erweitern, aber keine bisher vollständig belegte kuratierte Zeile
   * verschwinden lassen, nur weil ein neu ergänztes Produkt für dieses
   * Kriterium noch keinen belastbaren Wert besitzt.
   *
   * Bei kuratierten items[] entscheidet daher deren Datenabdeckung über die
   * Sichtbarkeit einer Zeile. Nur wenn ein Vergleich gar keine kuratierten
   * Produkt-Items besitzt, bleibt die bisherige Vollabdeckungsregel aktiv.
   */
  const rows: ComparisonRow[] = rowCandidates
    .filter((row) => {
      if (row.cells.length < 2) return false;

      if (row.curatedCount >= 2) {
        return row.resolvedCuratedCount === row.curatedCount;
      }

      return row.resolvedCount === row.cells.length;
    })
    .map(({
      resolvedCount: _resolvedCount,
      curatedCount: _curatedCount,
      resolvedCuratedCount: _resolvedCuratedCount,
      coverage: _coverage,
      ...row
    }) => row);


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

  /*
   * Filter Coverage Gate 32.6.15
   *
   * Ein Filter ist nur dann hilfreich, wenn er im konkreten Vergleich
   * ausreichend belegt ist. Das gilt einheitlich für alle Filterfamilien,
   * nicht nur für Tier und Tiergröße.
   *
   * Mindestabdeckung:
   * - mindestens zwei sichtbare Produkte mit belastbarem Wert
   * - mindestens 50 % der sichtbaren Produkte abgedeckt
   *
   * Fehlt die Abdeckung, bleibt das Produkt sichtbar; lediglich der
   * unzuverlässige Filter wird nicht angeboten.
   */
  const coveredFilter = (
    key: string,
    label: string,
    options: ComparisonFilter["options"]
  ): ComparisonFilter[] =>
    hasUsefulFilterCoverage(key)
      ? [{ key, label, options }]
      : [];

  const filterDefinitions: ComparisonFilter[] = isGpsComparison
    ? [
        ...coveredFilter("tier", "Tier", [
          { value: "hund", label: "Hund" },
          { value: "katze", label: "Katze" }
        ]),
        ...coveredFilter("abo", "Laufender Dienst", [
          { value: "mit-abo", label: "Abo erforderlich" },
          { value: "ohne-abo", label: "Ohne Mobilfunkabo" }
        ]),
        ...coveredFilter("system", "Übertragung", [
          { value: "mobilfunk", label: "Mobilfunk und App" },
          { value: "vhf", label: "VHF und Handgerät" }
        ]),
        ...coveredFilter("gewicht", "Gerätegewicht", [
          { value: "bis-35-g", label: "Bis 35 g" },
          { value: "ueber-35-g", label: "Über 35 g" }
        ])
      ]
    : [
        ...coveredFilter("tier", "Tier", [
          { value: "hund", label: "Hund" },
          { value: "katze", label: "Katze" }
        ]),
        ...coveredFilter("tiergroesse", "Tiergröße", [
          { value: "klein", label: "Klein" },
          { value: "mittel", label: "Mittel" },
          { value: "gross", label: "Groß" }
        ]),
        ...coveredFilter("futterart", "Futterart", [
          { value: "trockenfutter", label: "Trockenfutter" },
          { value: "nassfutter", label: "Nassfutter" }
        ]),
        ...coveredFilter("app", "Steuerung", [
          { value: "mit-app", label: "Mit App" },
          { value: "ohne-app", label: "Ohne App" }
        ]),
        ...coveredFilter("kamera", "Kamera", [
          { value: "mit-kamera", label: "Mit Kamera" },
          { value: "ohne-kamera", label: "Ohne Kamera" }
        ]),
        ...coveredFilter("zugang", "Zugang", [
          { value: "mikrochip", label: "Mikrochipgesteuert" },
          { value: "freier-zugang", label: "Freier Zugang" }
        ]),
        ...coveredFilter("strombackup", "Stromversorgung", [
          { value: "mit-backup", label: "Mit Batterie-Backup" },
          { value: "ohne-backup", label: "Nur Netzbetrieb" }
        ]),
        ...coveredFilter("preisklasse", "Preisklasse", [
          { value: "budget", label: "Budget" },
          { value: "midrange", label: "Mittelklasse" },
          { value: "premium", label: "Premium" }
        ])
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
        image: resolveComparisonProductImage(product.data.images),
        recommendation:
          item.recommendation ??
          product.data.recommendation,
        rating:
          calculateProductScore(product.data).score ?? 0,
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

  const relevantAlternatives = finalistSelection.alternatives
    .map((candidate) => views.find((product) => product.slug === candidate.slug))
    .filter((product): product is ComparisonProduct => Boolean(product));
  const technicalCandidates = finalistSelection.technical
    .map((candidate) => views.find((product) => product.slug === candidate.slug))
    .filter((product): product is ComparisonProduct => Boolean(product));

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
    relevantAlternatives,
    technicalCandidates,
    selectionReasons: finalistSelection.selectionReasons,
    alternativeReasons: finalistSelection.alternativeReasons,
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

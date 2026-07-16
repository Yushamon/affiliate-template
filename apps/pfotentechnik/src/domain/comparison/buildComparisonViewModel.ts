import type { CollectionEntry } from "astro:content";
import petTechHeroImage from "../../assets/images/project/pfotentechnik/pet-tech-hero.webp";
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

const normalizeFilterValue = (value: string) =>
  value.trim().toLocaleLowerCase("de");

const criterionAliases: Record<string, string[]> = {
  portionierung: ["portionierung", "ausgabemenge"],
  krokettengroesse: ["krokettengroesse", "futterart"],
  napf: ["napf", "schale"],
  kapazitaet: ["kapazitaet"],
  app: ["app", "appsteuerung"],
  notstrom: ["notstrom", "stromversorgung"],
  futterart: ["futterart"],
  zugang: ["zugang", "besonderheit"],
  reinigung: ["reinigung"],
  ausfallsicherheit: [
    "ausfallsicherheit",
    "zuverlaessigkeit",
    "stromversorgung"
  ]
};

const automaticFilterKeys = new Set([
  "app",
  "futterart",
  "zugang",
  "notstrom",
  "ausfallsicherheit",
  "krokettengroesse"
]);

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

  const rows: ComparisonRow[] = data.criteria.map(
    (criterion) => ({
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
    })
  );

  const filterRows = rows.filter((row) =>
    automaticFilterKeys.has(normalizeKey(row.criterion.key))
  );

  const filters: ComparisonFilter[] = filterRows
    .map((row) => {
      const distinct = Array.from(
        new Map(
          row.cells
            .map((cell) => cell.value)
            .filter((value) => value && value !== "–")
            .map((value) => [
              normalizeFilterValue(value),
              value
            ])
        ).entries()
      );

      if (distinct.length < 2 || distinct.length > 6) {
        return null;
      }

      return {
        key: normalizeKey(row.criterion.key),
        label: row.criterion.label,
        options: distinct.map(([value, label]) => ({
          value,
          label
        }))
      };
    })
    .filter(
      (filter): filter is ComparisonFilter =>
        filter !== null
    )
    .slice(0, 4);

  const filterValuesBySlug = new Map<
    string,
    Record<string, string[]>
  >();

  items.forEach((item) => {
    const values: Record<string, string[]> = {};

    filters.forEach((filter) => {
      const row = rows.find(
        (candidate) =>
          normalizeKey(candidate.criterion.key) === filter.key
      );

      const cell = row?.cells.find(
        (candidate) => candidate.productSlug === item.slug
      );

      values[filter.key] =
        cell?.value && cell.value !== "–"
          ? [normalizeFilterValue(cell.value)]
          : [];
    });

    filterValuesBySlug.set(item.slug, values);
  });

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
            item.slug === data.recommendation.winnerSlug
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
        rating: product.data.rating,
        badge:
          item.slug === data.recommendation.winnerSlug
            ? "Top-Empfehlung"
            : item.slug === data.recommendation.alternativeSlug
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
      product.slug === data.recommendation.winnerSlug
  );

  const alternative = views.find(
    (product) =>
      product.slug === data.recommendation.alternativeSlug
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
    verdict: {
      title: data.recommendation.title,
      text: data.recommendation.text,
      winner,
      alternative
    }
  };
}

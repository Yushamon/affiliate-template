import type { CollectionEntry } from "astro:content";
import type { HomeEditorialCard, HomeImage, HomepageModel } from "@affiliate-core/home/model";
import petTechHeroImage from "../../assets/images/project/pfotentechnik/pet-tech-hero.webp";
import guideImage from "../../assets/images/project/pfotentechnik/guide.webp";
import { resolveProductMedia } from "../mediaResolver.mjs";

type ProductEntry = CollectionEntry<"products">;
type ComparisonEntry = CollectionEntry<"comparisons">;
type PageEntry = CollectionEntry<"pages">;

type HomeConfig = {
  hero: {
    eyebrow: string;
    imageAlt: string;
  };
  categories: {
    items: Array<{
      code: string;
      title: string;
      text: string;
      href: string;
      productCategory?: string;
      productUseCase?: string;
    }>;
  };
  values: {
    methodologyAction: {
      label: string;
      href: string;
    };
  };
};

type BuildInput = {
  home: HomeConfig;
  transparency: string;
  products: ProductEntry[];
  comparisons: ComparisonEntry[];
  pages: PageEntry[];
};

const sortProducts = (products: ProductEntry[]) =>
  [...products].sort((a, b) =>
    Number(b.data.hub?.featured ?? false) -
      Number(a.data.hub?.featured ?? false) ||
    (a.data.hub?.order ?? 100) -
      (b.data.hub?.order ?? 100) ||
    (b.data.score ?? b.data.rating * 20) -
      (a.data.score ?? a.data.rating * 20)
  );

const selectDiverseProducts = (
  products: ProductEntry[],
  limit: number
) => {
  const selected: ProductEntry[] = [];
  const selectedSlugs = new Set<string>();
  const selectedCategories = new Set<string>();

  for (const product of products) {
    const category = product.data.category.key;
    if (selectedCategories.has(category)) continue;

    selected.push(product);
    selectedSlugs.add(product.data.slug);
    selectedCategories.add(category);

    if (selected.length === limit) return selected;
  }

  for (const product of products) {
    if (selectedSlugs.has(product.data.slug)) continue;
    selected.push(product);
    if (selected.length === limit) break;
  }

  return selected;
};

const sortComparisons = (comparisons: ComparisonEntry[]) =>
  [...comparisons].sort((a, b) =>
    Number(b.data.hub?.featured ?? false) -
      Number(a.data.hub?.featured ?? false) ||
    (a.data.hub?.order ?? 100) -
      (b.data.hub?.order ?? 100) ||
    (b.data.updatedAt ?? "").localeCompare(
      a.data.updatedAt ?? ""
    )
  );


const decisionComparisonDefinitions = [
  {
    slug: "beste-futterautomaten-fuer-katzen",
    label: "Katzen · Futterautomaten",
    title: "Futterautomaten für Katzen",
    fallbackText:
      "Modelle nach Futterart, Portionierung, App, Zugang und Alltagseignung vergleichen."
  },
  {
    slug: "beste-futterautomaten-fuer-nassfutter",
    label: "Nassfutter · Futterautomaten",
    title: "Futterautomaten für Nassfutter",
    fallbackText:
      "Aktive Kühlung, Kühlakkus, Mahlzeitenzahl, Hygiene und Ausfallsicherheit vergleichen."
  },
  {
    slug: "beste-gps-tracker-fuer-katzen",
    label: "Katzen · GPS-Tracker",
    title: "GPS-Tracker für Katzen",
    fallbackText:
      "Gewicht, Ortungsintervall, Akkulaufzeit, Abo und Sicherheitszonen vergleichen."
  },
  {
    slug: "beste-mikrochip-katzenklappen",
    label: "Katzen · Zugang",
    title: "Mikrochip-Katzenklappen",
    fallbackText:
      "Mikrochip-Zugang, Einbau, Richtungssteuerung und Alltagstauglichkeit vergleichen."
  }
] as const;

const getComparisonItemCount = (
  comparison: ComparisonEntry,
  products: ProductEntry[]
) => {
  const slugs = new Set(
    comparison.data.items.map((item) => item.slug)
  );

  for (const product of products) {
    if (
      (product.data.comparisons ?? []).includes(
        comparison.data.slug
      )
    ) {
      slugs.add(product.data.slug);
    }
  }

  return slugs.size;
};

const sortPages = (pages: PageEntry[]) =>
  [...pages].sort((a, b) =>
    (b.data.hubPriority ?? 0) -
      (a.data.hubPriority ?? 0) ||
    (b.data.updatedAt ?? "").localeCompare(
      a.data.updatedAt ?? ""
    )
  );

export function buildHomepageModel({
  home,
  transparency,
  products,
  comparisons,
  pages
}: BuildInput): HomepageModel {
  const sortedProducts = sortProducts(products);
  const featuredProducts = selectDiverseProducts(sortedProducts, 1);
  const sortedComparisons = sortComparisons(comparisons);
  const sortedPages = sortPages(pages);

  const categoryImageByKey = new Map<string, HomeImage>();

  for (const product of sortedProducts) {
    const image =
      product.data.images.comparison ??
      product.data.images.thumbnail ??
      product.data.images.hero;

    if (!categoryImageByKey.has(product.data.category.key)) {
      categoryImageByKey.set(product.data.category.key, image);
    }

    if (
      product.data.useCase &&
      !categoryImageByKey.has(product.data.useCase)
    ) {
      categoryImageByKey.set(product.data.useCase, image);
    }

    for (const tag of product.data.tags) {
      if (!categoryImageByKey.has(tag)) {
        categoryImageByKey.set(tag, image);
      }
    }
  }

  const categories = home.categories.items
    .map((category) => {
      const matchingProducts = products.filter((product) =>
        category.productCategory
          ? product.data.category.key ===
              category.productCategory ||
            product.data.category.path?.includes(
              category.productCategory
            )
          : category.productUseCase
            ? product.data.useCase ===
                category.productUseCase ||
              product.data.tags.includes(
                category.productUseCase
              )
            : false
      );

      if (!matchingProducts.length) return null;

      const imageKey =
        category.productCategory ??
        category.productUseCase ??
        "";

      return {
        code: category.code,
        title: category.title,
        text: category.text,
        href: category.href,
        count: matchingProducts.length,
        image: categoryImageByKey.get(imageKey)
      };
    })
    .filter(
      (
        category
      ): category is NonNullable<typeof category> =>
        Boolean(category)
    );

  const guideCards: HomeEditorialCard[] =
    sortedPages.slice(0, 4).map((entry) => ({
      href: `/${entry.data.slug}/`,
      label: "Ratgeber",
      title: entry.data.title,
      text: entry.data.description,
      image: entry.data.heroImage ?? {
        src: guideImage,
        alt: ""
      },
      action: "Ratgeber lesen"
    }));

  const decisionComparisons =
    decisionComparisonDefinitions
      .map((definition) => {
        const entry = sortedComparisons.find(
          (comparison) =>
            comparison.data.slug === definition.slug
        );

        if (!entry) return null;

        return {
          href: `/vergleiche/${entry.data.slug}/`,
          label: definition.label,
          title:
            entry.data.hub?.title ??
            definition.title,
          text:
            entry.data.hub?.description ??
            entry.data.description ??
            definition.fallbackText,
          image: entry.data.heroImage ?? {
            src: petTechHeroImage,
            alt: ""
          },
          itemCount: getComparisonItemCount(
            entry,
            products
          )
        };
      })
      .filter(
        (
          item
        ): item is NonNullable<typeof item> =>
          Boolean(item)
      );

  return {
    hero: {
      eyebrow: "Herstellerunabhängig recherchiert",
      title:
        "Unabhängige Orientierung für smarte Haustiertechnik",
      text:
        "Vergleiche, Produktchecks und fundierte Ratgeber für Hunde und Katzen.",
      image: {
        src: petTechHeroImage,
        alt: home.hero.imageAlt
      },
      primaryAction: {
        label: "Vergleiche entdecken",
        href: "/vergleiche/"
      },
      secondaryAction: {
        label: "Ratgeber lesen",
        href: "/wissen/"
      },
      signals: [
        "Herstellerunabhängig",
        "Technisch recherchiert",
        "Regelmäßig aktualisiert"
      ],
      stats: [
        {
          value: String(products.length),
          label: "Produkte eingeordnet"
        },
        {
          value: String(comparisons.length),
          label: "Vergleiche"
        },
        {
          value: String(pages.length),
          label: "Ratgeber"
        }
      ]
    },
    decisionComparisons,
    categories,
    guides: guideCards,
    products: featuredProducts.map(
      (product) => ({
        href: `/produkt/${product.data.slug}/`,
        title: product.data.title,
        manufacturer: product.data.manufacturer.name,
        image:
          resolveProductMedia(product.data.images) ??
          product.data.images.hero,
        useCase: product.data.useCase,
        constraint:
          product.data.decision.attention[0] ??
          product.data.weaknesses[0],
        category: product.data.category.path
          ? {
              label: product.data.category.label,
              href: product.data.category.path
            }
          : undefined
      })
    ),
    methods: [
      {
        number: "01",
        title: "Passung prüfen",
        text:
          "Tier, Haushalt und Nutzung bestimmen, wann eine Funktion wirklich passt."
      },
      {
        number: "02",
        title: "Grenzen benennen",
        text:
          "Ausfälle, Abhängigkeiten und Ausschlüsse bleiben Teil der Empfehlung."
      },
      {
        number: "03",
        title: "Evidenz trennen",
        text:
          "Herstellerangaben, externe Erfahrungen und redaktionelle Schlüsse werden getrennt."
      },
      {
        number: "04",
        title: "Inhalte aktualisieren",
        text:
          "Produktdaten und Empfehlungen werden bei relevanten Änderungen erneut geprüft."
      }
    ],
    methodologyAction: home.values.methodologyAction,
    useCases: [
      {
        title: "Fütterung zuverlässig planen",
        text:
          "Portionierung, Futterart, Zeitpläne und Ausfallsicherheit passend zum Alltag wählen.",
        href: "/smarte-futterautomaten/",
        icon: "bowl"
      },
      {
        title: "Trinken und Filteraufwand einordnen",
        text:
          "Material, Reinigung, Volumen und laufende Filterkosten realistisch vergleichen.",
        href: "/trinkbrunnen/",
        icon: "drop"
      },
      {
        title: "Freigang besser absichern",
        text:
          "Ortung, Gewicht, Akkulaufzeit, Netzabdeckung und Abokosten gemeinsam betrachten.",
        href: "/gps-tracker/",
        icon: "location"
      },
      {
        title: "Zugang gezielt kontrollieren",
        text:
          "Mikrochip, Einbau, Richtungssteuerung und App-Abhängigkeit vor der Auswahl klären.",
        href: "/katzenklappen/",
        icon: "door"
      },
      {
        title: "Tiere zu Hause im Blick behalten",
        text:
          "Kameraart, Datenschutz, Interaktion und laufende Cloudkosten bewusst abwägen.",
        href: "/haustierkameras/",
        icon: "camera"
      },
      {
        title: "Katzenklo-Routinen automatisieren",
        text:
          "Sicherheit, Größe, Streuverbrauch, Reinigung und Folgekosten zusammen prüfen.",
        href: "/automatische-katzentoiletten/",
        icon: "litter"
      }
    ],
    transparency
  };
}

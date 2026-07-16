import type { CollectionEntry } from "astro:content";
import type {
  HomeEditorialCard,
  HomeImage,
  HomepageModel
} from "@affiliate-core/home/model";
import petTechHeroImage from "../../assets/images/project/pfotentechnik/pet-tech-hero.webp";
import guideImage from "../../assets/images/project/pfotentechnik/guide.webp";

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
  intents: {
    items: Array<{
      label: string;
      href: string;
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
  products: ProductEntry[];
  comparisons: ComparisonEntry[];
  pages: PageEntry[];
};

const formatUpdatedAt = (value?: string) => {
  if (!value) return undefined;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;

  return `Aktualisiert am ${new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium"
  }).format(date)}`;
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
  products,
  comparisons,
  pages
}: BuildInput): HomepageModel {
  const sortedProducts = sortProducts(products);
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

  const comparisonCards: HomeEditorialCard[] =
    sortedComparisons.slice(0, 4).map((entry) => ({
      href: `/vergleiche/${entry.data.slug}/`,
      label: "Vergleich",
      title: entry.data.hub?.title ?? entry.data.title,
      text:
        entry.data.hub?.description ??
        entry.data.description,
      image: entry.data.heroImage ?? {
        src: petTechHeroImage,
        alt: ""
      },
      meta: formatUpdatedAt(entry.data.updatedAt),
      action: "Vergleich öffnen"
    }));

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
      meta: formatUpdatedAt(entry.data.updatedAt),
      action: "Ratgeber lesen"
    }));

  const recentItems = [
    ...sortedComparisons.map((entry) => ({
      href: `/vergleiche/${entry.data.slug}/`,
      label: "Vergleich",
      title: entry.data.title,
      text: entry.data.description,
      image: entry.data.heroImage ?? {
        src: petTechHeroImage,
        alt: ""
      },
      updatedAt: entry.data.updatedAt,
      meta: formatUpdatedAt(entry.data.updatedAt),
      action: "Aktualisierung ansehen"
    })),
    ...sortedPages.map((entry) => ({
      href: `/${entry.data.slug}/`,
      label: "Ratgeber",
      title: entry.data.title,
      text: entry.data.description,
      image: entry.data.heroImage ?? {
        src: guideImage,
        alt: ""
      },
      updatedAt: entry.data.updatedAt,
      meta: formatUpdatedAt(entry.data.updatedAt),
      action: "Aktualisierung ansehen"
    }))
  ]
    .sort((a, b) =>
      (b.updatedAt ?? "").localeCompare(
        a.updatedAt ?? ""
      )
    )
    .filter(
      (item, index, items) =>
        items.findIndex(
          (candidate) => candidate.href === item.href
        ) === index
    )
    .slice(0, 3)
    .map(({ updatedAt: _updatedAt, ...item }) => item);

  return {
    hero: {
      eyebrow: "Unabhängiges Fachportal für Haustiertechnik",
      title:
        "Unabhängige Orientierung für smarte Haustiertechnik",
      text:
        "Vergleiche, Produkttests und fundierte Ratgeber für Hunde und Katzen.",
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
        "Herstellerunabhängig eingeordnet",
        "Technisch nachvollziehbar recherchiert",
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
    decisionLinks: home.intents.items.slice(0, 6),
    categories,
    comparisons: comparisonCards,
    guides: guideCards,
    products: sortedProducts.slice(0, 3).map(
      (product) => ({
        href: `/produkt/${product.data.slug}/`,
        title: product.data.title,
        manufacturer: product.data.manufacturer.name,
        recommendation: product.data.recommendation,
        rating: product.data.rating,
        image:
          product.data.images.thumbnail ??
          product.data.images.hero
      })
    ),
    recentlyUpdated: recentItems,
    methods: [
      {
        number: "01",
        title: "Quellen prüfen",
        text:
          "Herstellerseiten, Bedienungsanleitungen und dokumentierte technische Angaben bilden die Grundlage."
      },
      {
        number: "02",
        title: "Unterschiede einordnen",
        text:
          "Funktionen werden nach Einsatzzweck, Tier und Alltagssituation bewertet."
      },
      {
        number: "03",
        title: "Grenzen benennen",
        text:
          "Fehlende oder widersprüchliche Angaben werden sichtbar gemacht statt geraten."
      },
      {
        number: "04",
        title: "Inhalte aktualisieren",
        text:
          "Produktdaten und Empfehlungen werden bei relevanten Änderungen erneut geprüft."
      }
    ],
    methodologyAction: home.values.methodologyAction,
    topicGroups: [
      {
        title: "Für Katzen",
        links: [
          {
            label: "Futterautomaten für Katzen",
            href: "/futterautomat-katze/"
          },
          {
            label: "Trinkbrunnen für Katzen",
            href: "/trinkbrunnen/#katzen"
          },
          {
            label: "Für mehrere Katzen",
            href: "/futterautomat-fuer-zwei-katzen/"
          },
          {
            label: "Nassfutterautomaten",
            href: "/futterautomat-nassfutter/"
          }
        ]
      },
      {
        title: "Für Hunde",
        links: [
          {
            label: "Futterautomaten für Hunde",
            href: "/futterautomat-hund/"
          },
          {
            label: "Trinkbrunnen für Hunde",
            href: "/trinkbrunnen/#hunde"
          },
          {
            label: "Hund frisst nicht",
            href: "/hund-frisst-nicht/"
          },
          {
            label: "Hund trinkt zu wenig",
            href: "/hund-trinkt-zu-wenig/"
          }
        ]
      },
      {
        title: "Orientierung",
        links: [
          {
            label: "Alle Vergleiche",
            href: "/vergleiche/"
          },
          {
            label: "Alle Ratgeber",
            href: "/wissen/"
          },
          {
            label: "Herstellerübersicht",
            href: "/hersteller/"
          },
          home.values.methodologyAction
        ]
      }
    ]
  };
}

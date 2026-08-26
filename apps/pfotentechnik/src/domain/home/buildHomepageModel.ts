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

const getProductAction = (product: ProductEntry) => {
  const isHandsOn =
    product.data.editorial?.testedHandsOn === true ||
    product.data.testStatus === "hands-on" ||
    product.data.testStatus === "long-term-test";

  return isHandsOn ? "Praxistest lesen" : "Produktcheck lesen";
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
    slug: "beste-futterautomaten-fuer-hunde",
    label: "Hunde · Futterautomaten",
    title: "Futterautomaten für Hunde",
    fallbackText:
      "Kapazität, Napfgröße, Portionierung und Ausfallsicherheit direkt gegenüberstellen."
  },
  {
    slug: "beste-futterautomaten-fuer-nassfutter",
    label: "Nassfutter · Futterautomaten",
    title: "Futterautomaten für Nassfutter",
    fallbackText:
      "Aktive Kühlung, Kühlakkus, Mahlzeitenzahl, Hygiene und Ausfallsicherheit vergleichen."
  },
  {
    slug: "beste-trinkbrunnen-fuer-katzen",
    label: "Katzen · Trinkbrunnen",
    title: "Trinkbrunnen für Katzen",
    fallbackText:
      "Material, Filter, Reinigung, Lautstärke und Trinkfläche sinnvoll vergleichen."
  },
  {
    slug: "beste-trinkbrunnen-fuer-hunde",
    label: "Hunde · Trinkbrunnen",
    title: "Trinkbrunnen für Hunde",
    fallbackText:
      "Kapazität, Standfestigkeit, Trinkhöhe und Reinigung für Hunde einordnen."
  },
  {
    slug: "beste-gps-tracker-fuer-katzen",
    label: "Katzen · GPS-Tracker",
    title: "GPS-Tracker für Katzen",
    fallbackText:
      "Gewicht, Ortungsintervall, Akkulaufzeit, Abo und Sicherheitszonen vergleichen."
  },
  {
    slug: "beste-gps-tracker-fuer-hunde",
    label: "Hunde · GPS-Tracker",
    title: "GPS-Tracker für Hunde",
    fallbackText:
      "Ortung, Robustheit, Akkulaufzeit, Größe und laufende Kosten vergleichen."
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
  products,
  comparisons,
  pages
}: BuildInput): HomepageModel {
  const sortedProducts = sortProducts(products);
  const featuredProducts = selectDiverseProducts(
    sortedProducts,
    3
  );
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
          ),
          updatedLabel:
            formatUpdatedAt(entry.data.updatedAt)
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
    decisionLinks: home.intents.items.slice(0, 6),
    decisionComparisons,
    categories,
    comparisons: comparisonCards,
    guides: guideCards,
    products: featuredProducts.map(
      (product, index) => ({
        href: `/produkt/${product.data.slug}/`,
        title: product.data.title,
        manufacturer: product.data.manufacturer.name,
        recommendation: product.data.recommendation,
        rating:
          product.data.score ??
          Math.round(product.data.rating * 20),
        image:
          product.data.images.thumbnail ??
          product.data.images.hero,
        action: getProductAction(product),
        badge:
          index === 0
            ? "Redaktionelle Empfehlung"
            : index === 1
              ? "Starke Alternative"
              : "Für besondere Anforderungen"
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
    faq: [
      {
        question: "Wie entstehen die Empfehlungen auf PfotenTechnik?",
        answer:
          "Wir vergleichen dokumentierte technische Daten, Bedienungsanleitungen, Herstellerangaben und den konkreten Einsatzzweck. Fehlende Angaben werden nicht aus Bewertungen oder ähnlichen Produkten abgeleitet."
      },
      {
        question: "Testet PfotenTechnik jedes Produkt selbst?",
        answer:
          "Nicht jede Einordnung basiert auf einem eigenen Langzeittest. Die jeweilige Produktseite macht kenntlich, worauf die Bewertung beruht. Unbelegte Praxiserfahrungen werden nicht behauptet."
      },
      {
        question: "Beeinflussen Affiliate-Links die Bewertung?",
        answer:
          "Nein. Affiliate-Links können die Finanzierung der Seite unterstützen. Die Reihenfolge, Bewertung und redaktionelle Einordnung sollen davon unabhängig bleiben."
      },
      {
        question: "Warum fehlen bei manchen Produkten einzelne Angaben?",
        answer:
          "Hersteller veröffentlichen technische Daten nicht immer vollständig oder eindeutig. In solchen Fällen zeigen wir lieber eine fehlende Angabe, statt einen Wert zu schätzen."
      },
      {
        question: "Wie aktuell sind Vergleiche und Ratgeber?",
        answer:
          "Inhalte werden bei relevanten Produktänderungen, neuen Modellen oder fachlichen Ergänzungen überarbeitet. Das Aktualisierungsdatum steht auf der jeweiligen Seite."
      }
    ],
    topicGroups: [
      {
        title: "Produktwelten",
        links: [
          {
            label: "Futterautomaten",
            href: "/smarte-futterautomaten/"
          },
          {
            label: "Trinkbrunnen",
            href: "/trinkbrunnen/"
          },
          {
            label: "GPS-Tracker",
            href: "/gps-tracker/"
          },
          {
            label: "Alle Produktwelten",
            href: "/kaufberatung/"
          }
        ]
      },
      {
        title: "Zugang, Kamera & Hygiene",
        links: [
          {
            label: "Katzenklappen",
            href: "/katzenklappen/"
          },
          {
            label: "Haustierkameras",
            href: "/haustierkameras/"
          },
          {
            label: "Automatische Katzentoiletten",
            href: "/automatische-katzentoiletten/"
          },
          {
            label: "Für mehrere Katzen",
            href: "/vergleiche/beste-futterautomaten-fuer-zwei-katzen/"
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

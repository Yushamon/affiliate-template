import type { CollectionEntry } from "astro:content";
import type { HomeCard, HomeImage, HomepageModel } from "@affiliate-core/home/model";
import petTechHeroImage from "../../assets/images/project/pfotentechnik/pet-tech-hero.webp";

type Product = CollectionEntry<"products">;
type Comparison = CollectionEntry<"comparisons">;
type Page = CollectionEntry<"pages">;
type Manufacturer = CollectionEntry<"manufacturers">;

type HomeConfig = {
  hero: { eyebrow: string; imageAlt: string };
  categories: { items: Array<{ code: string; title: string; text: string; href: string; productCategory?: string; productUseCase?: string }> };
  intents: { items: Array<{ label: string; href: string }> };
  values: { methodologyAction: { label: string; href: string } };
};

type Input = {
  home: HomeConfig;
  products: Product[];
  comparisons: Comparison[];
  pages: Page[];
  manufacturers: Manufacturer[];
};

const dateMeta = (value?: string) => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return `Aktualisiert am ${new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(date)}`;
};

const sortContent = <T extends { data: { hubPriority?: number; updatedAt?: string; hub?: { featured?: boolean; order?: number } } }>(items: T[]) =>
  [...items].sort((a, b) =>
    Number(b.data.hub?.featured ?? false) - Number(a.data.hub?.featured ?? false) ||
    (a.data.hub?.order ?? 100) - (b.data.hub?.order ?? 100) ||
    (b.data.hubPriority ?? 0) - (a.data.hubPriority ?? 0) ||
    (b.data.updatedAt ?? "").localeCompare(a.data.updatedAt ?? "")
  );

export function buildHomepageModel({ home, products, comparisons, pages }: Input): HomepageModel {
  const sortedProducts = [...products].sort((a, b) =>
    Number(b.data.hub?.featured ?? false) - Number(a.data.hub?.featured ?? false) ||
    (a.data.hub?.order ?? 100) - (b.data.hub?.order ?? 100) ||
    (b.data.score ?? b.data.rating * 20) - (a.data.score ?? a.data.rating * 20)
  );

  const sortedComparisons = sortContent(comparisons);
  const sortedPages = sortContent(pages);

  const categoryImages = new Map<string, HomeImage>();
  for (const product of sortedProducts) {
    const image = product.data.images.comparison ?? product.data.images.thumbnail ?? product.data.images.hero;
    if (!categoryImages.has(product.data.category.key)) categoryImages.set(product.data.category.key, image);
    if (product.data.useCase && !categoryImages.has(product.data.useCase)) categoryImages.set(product.data.useCase, image);
    for (const tag of product.data.tags) if (!categoryImages.has(tag)) categoryImages.set(tag, image);
  }

  const categories = home.categories.items.map((category) => {
    const matching = products.filter((product) =>
      category.productCategory
        ? product.data.category.key === category.productCategory || product.data.category.path?.includes(category.productCategory)
        : category.productUseCase
          ? product.data.useCase === category.productUseCase || product.data.tags.includes(category.productUseCase)
          : false
    );
    if (!matching.length) return null;
    const key = category.productCategory ?? category.productUseCase ?? "";
    return {
      code: category.code,
      title: category.title,
      text: category.text,
      href: category.href,
      count: matching.length,
      label: "Produktwelt",
      action: "Bereich öffnen",
      image: categoryImages.get(key)
    };
  }).filter((item): item is NonNullable<typeof item> => Boolean(item));

  const comparisonCards: HomeCard[] = sortedComparisons.slice(0, 4).map((entry) => ({
    href: `/vergleiche/${entry.data.slug}/`,
    label: "Vergleich",
    title: entry.data.hub?.title ?? entry.data.title,
    text: entry.data.hub?.description ?? entry.data.description,
    image: entry.data.heroImage ?? { src: petTechHeroImage, alt: "" },
    meta: dateMeta(entry.data.updatedAt),
    action: "Vergleich öffnen"
  }));

  const guideCards: HomeCard[] = sortedPages.slice(0, 4).map((entry) => ({
    href: `/${entry.data.slug}/`,
    label: "Ratgeber",
    title: entry.data.hubTitle ?? entry.data.title,
    text: entry.data.hubDescription ?? entry.data.description,
    image: entry.data.heroImage ?? { src: petTechHeroImage, alt: "" },
    meta: dateMeta(entry.data.updatedAt),
    action: "Ratgeber lesen"
  }));

  const recentPool = [
    ...sortedComparisons.map((entry) => ({
      href: `/vergleiche/${entry.data.slug}/`, label: "Vergleich", title: entry.data.title,
      text: entry.data.description, image: entry.data.heroImage ?? { src: petTechHeroImage, alt: "" },
      updatedAt: entry.data.updatedAt, meta: dateMeta(entry.data.updatedAt), action: "Aktualisierung ansehen"
    })),
    ...sortedPages.map((entry) => ({
      href: `/${entry.data.slug}/`, label: "Ratgeber", title: entry.data.title,
      text: entry.data.description, image: entry.data.heroImage ?? { src: petTechHeroImage, alt: "" },
      updatedAt: entry.data.updatedAt, meta: dateMeta(entry.data.updatedAt), action: "Aktualisierung ansehen"
    }))
  ];

  const recentlyUpdated = recentPool
    .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""))
    .filter((item, index, list) => list.findIndex((candidate) => candidate.href === item.href) === index)
    .slice(0, 3)
    .map(({ updatedAt: _updatedAt, ...item }) => item);

  return {
    hero: {
      eyebrow: home.hero.eyebrow,
      title: "Unabhängige Orientierung für smarte Haustiertechnik",
      text: "Vergleiche, Produkttests und fundierte Ratgeber für Hunde und Katzen.",
      image: { src: petTechHeroImage, alt: home.hero.imageAlt },
      primaryAction: { label: "Vergleiche entdecken", href: "/vergleiche/" },
      secondaryAction: { label: "Ratgeber lesen", href: "/wissen/" },
      signals: ["Herstellerunabhängig eingeordnet", "Technisch nachvollziehbar recherchiert", "Regelmäßig aktualisiert"],
      stats: [
        { value: String(products.length), label: "Produkte eingeordnet" },
        { value: String(comparisons.length), label: "Vergleiche" },
        { value: String(pages.length), label: "Ratgeber" }
      ]
    },
    categories,
    comparisons: comparisonCards,
    guides: guideCards,
    recentlyUpdated,
    products: sortedProducts.slice(0, 3).map((product) => ({
      href: `/produkt/${product.data.slug}/`,
      title: product.data.title,
      manufacturer: product.data.manufacturer.name,
      recommendation: product.data.recommendation,
      rating: product.data.rating,
      image: product.data.images.thumbnail ?? product.data.images.hero
    })),
    decisions: home.intents.items.slice(0, 6),
    methods: [
      { number: "01", title: "Quellen prüfen", text: "Herstellerseiten, Bedienungsanleitungen und dokumentierte technische Angaben bilden die Grundlage." },
      { number: "02", title: "Unterschiede einordnen", text: "Funktionen werden nach Einsatzzweck, Tier und Alltagssituation bewertet." },
      { number: "03", title: "Grenzen benennen", text: "Fehlende oder widersprüchliche Angaben werden sichtbar gemacht statt geraten." },
      { number: "04", title: "Inhalte aktualisieren", text: "Produktdaten und Empfehlungen werden bei relevanten Änderungen erneut geprüft." }
    ],
    methodologyAction: home.values.methodologyAction,
    topicGroups: [
      { title: "Für Katzen", links: [
        { label: "Futterautomaten für Katzen", href: "/futterautomat-katze/" },
        { label: "Trinkbrunnen für Katzen", href: "/trinkbrunnen/#katzen" },
        { label: "Für mehrere Katzen", href: "/futterautomat-fuer-zwei-katzen/" },
        { label: "Nassfutterautomaten", href: "/futterautomat-nassfutter/" }
      ]},
      { title: "Für Hunde", links: [
        { label: "Futterautomaten für Hunde", href: "/futterautomat-hund/" },
        { label: "Trinkbrunnen für Hunde", href: "/trinkbrunnen/#hunde" },
        { label: "Hund frisst nicht", href: "/hund-frisst-nicht/" },
        { label: "Hund trinkt zu wenig", href: "/hund-trinkt-zu-wenig/" }
      ]},
      { title: "Orientierung", links: [
        { label: "Alle Vergleiche", href: "/vergleiche/" },
        { label: "Alle Ratgeber", href: "/wissen/" },
        { label: "Herstellerübersicht", href: "/hersteller/" },
        home.values.methodologyAction
      ]}
    ]
  };
}

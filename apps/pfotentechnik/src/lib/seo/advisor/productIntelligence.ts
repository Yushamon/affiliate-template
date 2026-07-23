import { getCollection } from "astro:content";

export type ProductDiscovery = {
  slug: string;
  name: string;
  manufacturerKey: string;
  manufacturerName: string;
  sourceUrls: string[];
  knownData: string[];
  series?: string;
  relationship: "series-member" | "unclassified";
  siblingSlugs: string[];
  comparisonSuggestions: string[];
};

export type ProductHealth = {
  slug: string;
  title: string;
  manufacturer: string;
  category: string;
  score: number;
  status: "gesund" | "prüfen" | "kritisch";
  checks: Array<{ label: string; ok: boolean; points: number; evidence: string }>;
  gaps: string[];
};

export type ProductCoverageGap = {
  id: string;
  slug: string;
  title: string;
  kind: "kein-vergleich" | "keine-herstellerseite" | "keine-kategorie" | "großer-hund-ohne-vergleich";
  evidence: string;
  recommendation: string;
};

export type ProductIntelligence = {
  generatedAt: string;
  discoveries: ProductDiscovery[];
  health: ProductHealth[];
  coverageGaps: ProductCoverageGap[];
  provider: { configured: boolean; name?: string; fallback: string };
};

const imageCount = (images: { hero?: unknown; thumbnail?: unknown; comparison?: unknown; gallery?: unknown[] }): number =>
  Number(Boolean(images?.hero)) + Number(Boolean(images?.thumbnail)) + Number(Boolean(images?.comparison)) + (images?.gallery?.length ?? 0);

const ageDays = (date: string | Date | undefined): number | undefined => {
  if (!date) return undefined;
  const parsed = date instanceof Date ? date.getTime() : Date.parse(date);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor((Date.now() - parsed) / 86_400_000)) : undefined;
};

export const loadProductIntelligence = async (): Promise<ProductIntelligence> => {
  const [products, manufacturers, comparisons] = await Promise.all([
    getCollection("products"),
    getCollection("manufacturers"),
    getCollection("comparisons"),
  ]);
  const productBySlug = new Map(products.map((entry) => [entry.data.slug, entry]));
  const manufacturerBySlug = new Map(manufacturers.map((entry) => [entry.data.slug, entry]));
  const comparisonSlugs = new Set(comparisons.map((entry) => entry.data.slug));
  const discoveries: ProductDiscovery[] = [];

  for (const manufacturer of manufacturers) {
    const sourceUrls = manufacturer.data.sources.flatMap((source) => source.url ? [source.url] : []);
    const seriesBySlug = new Map(
      manufacturer.data.series.flatMap((series) => series.productSlugs.map((slug) => [slug, series] as const)),
    );
    for (const slug of manufacturer.data.productSlugs) {
      if (productBySlug.has(slug)) continue;
      const series = seriesBySlug.get(slug);
      const topicText = `${slug} ${series?.name ?? ""} ${series?.description ?? ""} ${manufacturer.data.productCategories.join(" ")} ${manufacturer.data.productAreas.join(" ")}`.toLocaleLowerCase("de");
      const comparisonSuggestions = comparisons
        .filter((comparison) => {
          if (/gps|tracker/.test(topicText)) return /gps|tracker/.test(comparison.data.slug);
          if (/trink|brunnen|fountain|wasser/.test(topicText)) return /trink|brunnen/.test(comparison.data.slug);
          if (/futter|feeder/.test(topicText)) return /futter/.test(comparison.data.slug);
          return false;
        })
        .map((comparison) => comparison.data.slug);
      discoveries.push({
        slug,
        name: series?.productSlugs.length === 1 ? series.name : slug,
        manufacturerKey: manufacturer.data.key,
        manufacturerName: manufacturer.data.name,
        sourceUrls,
        knownData: [
          `Herstellerzuordnung: ${manufacturer.data.name}`,
          ...(series ? [`Serie: ${series.name}`, series.description ? `Serienbeschreibung: ${series.description}` : "", ...series.suitableFor.map((item) => `Geeignet laut Herstellerseite: ${item}`)].filter(Boolean) : []),
        ],
        series: series?.name,
        relationship: series ? "series-member" : "unclassified",
        siblingSlugs: series?.productSlugs.filter((candidate) => candidate !== slug) ?? [],
        comparisonSuggestions,
      });
    }
  }

  const health: ProductHealth[] = products.map((entry) => {
    const data = entry.data;
    const body = entry.body ?? "";
    const images = imageCount(data.images);
    const manufacturerExists = manufacturerBySlug.has(data.manufacturer.slug);
    const linkedComparisons = data.comparisons.filter((slug) => comparisonSlugs.has(slug));
    const hasSources = /https?:\/\//i.test(body) || Boolean(data.editorial?.evidence.includes("manufacturer-documentation"));
    const updated = ageDays(data.updatedAt);
    const canonicalValid = data.seo?.canonical === `/produkt/${data.slug}/`;
    const checks = [
      { label: "Schema", ok: true, points: 15, evidence: "Astro-Collection validiert" },
      { label: "Bilder", ok: images >= 6, points: 15, evidence: `${images}/6 vorgesehene Bildrollen belegt` },
      { label: "Quellen", ok: hasSources, points: 15, evidence: hasSources ? "Quelle oder Herstellerdokumentation ausgewiesen" : "Keine Quelle erkannt" },
      { label: "Vergleiche", ok: linkedComparisons.length > 0, points: 15, evidence: `${linkedComparisons.length} gültige Vergleichszuordnung(en)` },
      { label: "Hersteller", ok: manufacturerExists, points: 12, evidence: manufacturerExists ? "Herstellerseite vorhanden" : "Herstellerseite fehlt" },
      { label: "Interne Links", ok: /]\(\/(?:vergleiche|hersteller|produkt)\//i.test(body), points: 10, evidence: "Kontextuelle Money-Page-Verlinkung im Inhalt" },
      { label: "Aktualität", ok: updated !== undefined && updated <= 365, points: 8, evidence: updated === undefined ? "Datum fehlt" : `${updated} Tage seit Aktualisierung` },
      { label: "Technik", ok: canonicalValid && data.productStatus !== "unknown", points: 10, evidence: canonicalValid ? `Status: ${data.productStatus}` : "Canonical passt nicht zum Slug" },
    ];
    const score = checks.reduce((sum, check) => sum + (check.ok ? check.points : 0), 0);
    return {
      slug: data.slug,
      title: data.title,
      manufacturer: data.manufacturer.name,
      category: data.category.label,
      score,
      status: score >= 85 ? "gesund" : score >= 65 ? "prüfen" : "kritisch",
      checks,
      gaps: checks.filter((check) => !check.ok).map((check) => check.label),
    };
  }).sort((a, b) => a.score - b.score || a.title.localeCompare(b.title, "de"));

  const coverageGaps: ProductCoverageGap[] = products.flatMap((entry) => {
    const data = entry.data;
    const gaps: ProductCoverageGap[] = [];
    if (!data.comparisons.length) gaps.push({ id: `comparison|${data.slug}`, slug: data.slug, title: data.title, kind: "kein-vergleich", evidence: "Frontmatter enthält keine Vergleichszuordnung.", recommendation: "Passende bestehende Vergleiche fachlich prüfen; nicht automatisch zuordnen." });
    if (!manufacturerBySlug.has(data.manufacturer.slug)) gaps.push({ id: `manufacturer|${data.slug}`, slug: data.slug, title: data.title, kind: "keine-herstellerseite", evidence: `Hersteller-Slug „${data.manufacturer.slug}“ hat keine Collection-Seite.`, recommendation: "Herstelleridentität prüfen und nur mit belastbaren Quellen eine Herstellerseite planen." });
    if (!data.category.key || !data.category.label) gaps.push({ id: `category|${data.slug}`, slug: data.slug, title: data.title, kind: "keine-kategorie", evidence: "Kategorie ist nicht vollständig gepflegt.", recommendation: "Vorhandene Kategorieterminologie übernehmen." });
    const largeDog = data.comparisonFilters.largeDogFit === "technical-fit";
    const inLargeDogComparison = data.comparisons.some((slug) => /grosse-hunde|große-hunde/i.test(slug));
    if (largeDog && !inLargeDogComparison) gaps.push({ id: `large-dog|${data.slug}`, slug: data.slug, title: data.title, kind: "großer-hund-ohne-vergleich", evidence: "Das strukturierte Eignungsfeld lautet „technical-fit“, aber kein Großhunde-Vergleich ist zugeordnet.", recommendation: "Nur bei passender Geräteart und Suchintention in einen bestehenden Großhunde-Vergleich aufnehmen." });
    return gaps;
  });

  return {
    generatedAt: new Date().toISOString(),
    discoveries,
    health,
    coverageGaps,
    provider: {
      configured: Boolean(import.meta.env.IMAGE_PROVIDER),
      name: import.meta.env.IMAGE_PROVIDER || undefined,
      fallback: "Promptpaket erzeugen, Dateien in den sicheren Importordner legen, anschließend lokal in WebP konvertieren und paketieren.",
    },
  };
};

export const buildProductMarkdownPrompt = (product: ProductDiscovery): string => [
  "Arbeite im Repository Yushamon/affiliate-template.",
  "Projektpfad: apps/pfotentechnik.",
  `Zieldatei: apps/pfotentechnik/src/content/products/${product.slug}.md`,
  `Produkt: ${product.name}`,
  `Hersteller: ${product.manufacturerName} (${product.manufacturerKey})`,
  `productKey/Slug: ${product.slug}`,
  "Bekannte Daten aus der vorhandenen Hersteller-Collection:",
  ...product.knownData.map((item) => `- ${item}`),
  "Offene Daten: Kategorie, technischer Status, Maße, Gewicht, Stromversorgung, Konnektivität, Ausstattung, Tier-Eignung, Preis-/Abo-Modell und konkrete Produktquellen müssen aus offiziellen Herstellerquellen belegt werden.",
  "Vorhandene Herstellerquellen:",
  ...(product.sourceUrls.length ? product.sourceUrls.map((url) => `- ${url}`) : ["- Keine produktspezifische URL hinterlegt; zuerst offizielle Quelle recherchieren."]),
  "Vergleichsvorschläge ausschließlich gegen vorhandene Vergleichsseiten und deren Kriterien prüfen.",
  ...(product.comparisonSuggestions.length ? product.comparisonSuggestions.map((slug) => `- Vergleichskandidat: ${slug}`) : ["- Kein belastbarer Vergleichskandidat automatisch ableitbar."]),
  `Bildpfade: ../../assets/images/products/${product.slug}/{hero,thumbnail,comparison,gallery-1,gallery-2,gallery-3}.webp`,
  "Erstelle zunächst einen redaktionellen Draft. Keine unbekannten Werte erfinden und keine bestehende Datei überschreiben.",
  "Validierung: npm run build:pfotentechnik && npm --workspace apps/pfotentechnik run audit:products:strict",
].join("\n");

export const buildProductImagePrompts = (product: ProductDiscovery) => {
  const base = `Premium-redaktionelle, markenneutrale Produktvisualisierung für ${product.name} von ${product.manufacturerName}; keine Logos, keine erfundenen Bedienelemente oder technischen Details, helle ruhige Fläche, natürliche Haustierumgebung, zugänglich, ohne Text im Bild`;
  return [
    ["hero", `${base}; breite Hero-Komposition mit Gerätetyp im Nutzungskontext, 16:9, 1600×900`],
    ["thumbnail", `${base}; klarer quadratischer Ausschnitt mit ruhiger Silhouette, 1:1, 800×800`],
    ["comparison", `${base}; sachliche Seitenansicht mit viel negativem Raum für Vergleichskontext, 16:9, 1600×900`],
    ["gallery-1", `${base}; Detailansicht von Reinigung und Material, nur soweit durch offizielle Quellen belegt, 16:9, 1600×900`],
    ["gallery-2", `${base}; realistische Nutzung mit passender Tierart und sicherer Körperhaltung, 16:9, 1600×900`],
    ["gallery-3", `${base}; Zubehör oder App-Kontext nur soweit offiziell belegt, keine lesbaren UI-Daten, 16:9, 1600×900`],
  ].map(([role, prompt]) => ({ role, prompt, target: `apps/pfotentechnik/src/assets/images/products/${product.slug}/${role}.webp` }));
};

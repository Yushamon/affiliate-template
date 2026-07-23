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
  status: "vollständig" | "optimierung" | "wichtig" | "kritisch";
  checks: Array<{
    id: string;
    group: "Grunddaten" | "Technische Daten" | "Redaktion" | "SEO" | "Visuals";
    label: string;
    ok: boolean;
    severity: "kritisch" | "wichtig" | "optimierung";
    points: number;
    evidence: string;
  }>;
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

const confirmedValue = (value: unknown): boolean => {
  if (value === true || (typeof value === "number" && Number.isFinite(value))) return true;
  if (Array.isArray(value)) return value.some(confirmedValue);
  if (typeof value !== "string") return false;
  const normalized = value.trim();
  return Boolean(normalized) && !/nicht (?:vom hersteller )?(?:ausgewiesen|angegeben|bestätigt)|unbekannt|keine angabe|unknown/i.test(normalized);
};

const specValue = (specs: Array<{ label: string; value: string | number | boolean }>, patterns: RegExp[]) =>
  specs.find((spec) => patterns.some((pattern) => pattern.test(spec.label)))?.value;

const bodyHasSection = (body: string, pattern: RegExp) =>
  new RegExp(`(?:^|\\n)#{1,3}\\s+[^\\n]*${pattern.source}`, pattern.flags.includes("i") ? "i" : "").test(body);

type RawHealthCheck = {
  id: string;
  group: ProductHealth["checks"][number]["group"];
  label: string;
  ok: boolean;
  severity: ProductHealth["checks"][number]["severity"];
  evidence: string;
};

const withPoints = (checks: RawHealthCheck[]) => {
  const totalWeight = checks.reduce((sum, check) => sum + (check.severity === "kritisch" ? 3 : check.severity === "wichtig" ? 2 : 1), 0);
  return checks.map((check) => ({
    ...check,
    points: Number((((check.severity === "kritisch" ? 3 : check.severity === "wichtig" ? 2 : 1) / totalWeight) * 100).toFixed(2)),
  }));
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
    const updated = ageDays(data.updatedAt);
    const canonicalValid = data.seo?.canonical === `/produkt/${data.slug}/`;
    const specs = data.specs ?? [];
    const hasSources = bodyHasSection(body, /quellen/i) && /https?:\/\//i.test(body);
    const hasManufacturerLink = new RegExp(`\\]\\(\\/hersteller\\/${data.manufacturer.slug}\\/?\\)`, "i").test(body);
    const hasGuideLink = /]\(\/(?!produkt\/|vergleiche\/|hersteller\/)[^)]+\)/i.test(body);
    const appValue = specValue(specs, [/^app$/i, /app.unterstützung/i]);
    const cameraValue = specValue(specs, [/kamera/i]);
    const audioValue = specValue(specs, [/mikrofon/i, /lautsprecher/i, /audio/i]);
    const cloudValue = specValue(specs, [/cloud/i, /abo/i]);
    const rawChecks: RawHealthCheck[] = [
      { id: "schema", group: "Grunddaten", label: "Collection-Schema", ok: true, severity: "kritisch", evidence: "Astro-Collection wurde erfolgreich geladen." },
      { id: "identity", group: "Grunddaten", label: "Titel und Slug", ok: confirmedValue(data.title) && confirmedValue(data.slug), severity: "kritisch", evidence: `${data.title} · ${data.slug}` },
      { id: "manufacturer", group: "Grunddaten", label: "Hersteller", ok: manufacturerExists, severity: "kritisch", evidence: manufacturerExists ? "Herstellerseite vorhanden." : "Herstellerseite fehlt." },
      { id: "category", group: "Grunddaten", label: "Kategorie und Produkttyp", ok: confirmedValue(data.category.key) && confirmedValue(data.category.label), severity: "kritisch", evidence: `${data.category.key} · ${data.category.label}` },
      { id: "audience", group: "Grunddaten", label: "Tierart und Tiergröße", ok: data.comparisonFilters.animal.length > 0 && (data.comparisonFilters.petSize.length > 0 || Boolean(data.gps?.animal.length)), severity: "wichtig", evidence: `${data.comparisonFilters.animal.join(", ") || data.gps?.animal.join(", ") || "Tierart fehlt"} · ${data.comparisonFilters.petSize.join(", ") || "Tiergröße fehlt"}` },
      { id: "summary", group: "Grunddaten", label: "Kurzbeschreibung", ok: confirmedValue(data.description) && confirmedValue(data.recommendation), severity: "wichtig", evidence: "Description und Empfehlung geprüft." },
      { id: "availability", group: "Grunddaten", label: "Produkt- und Verfügbarkeitsstatus", ok: data.productStatus !== "unknown" && Boolean(data.affiliate?.label || data.productUrl), severity: "wichtig", evidence: `Status: ${data.productStatus}; ${data.affiliate?.label || data.productUrl || "kein Verfügbarkeitshinweis"}` },
      { id: "capacity", group: "Technische Daten", label: "Kapazität", ok: confirmedValue(data.capacity) || confirmedValue(specValue(specs, [/kapazität/i, /volumen/i])), severity: "wichtig", evidence: String(data.capacity || specValue(specs, [/kapazität/i, /volumen/i]) || "Fehlt") },
      { id: "portions", group: "Technische Daten", label: "Portionsgrößen und Portionierung", ok: confirmedValue(specValue(specs, [/portion/i, /mahlzeit/i])) || Boolean(data.comparisonFilters.portionGrams || data.comparisonFilters.portionMl), severity: "wichtig", evidence: String(specValue(specs, [/portion/i, /mahlzeit/i]) || "Keine bestätigte Portionsangabe") },
      { id: "dimensions", group: "Technische Daten", label: "Maße", ok: confirmedValue(specValue(specs, [/maße/i, /abmessung/i])), severity: "wichtig", evidence: String(specValue(specs, [/maße/i, /abmessung/i]) || "Fehlt") },
      { id: "weight", group: "Technische Daten", label: "Gewicht", ok: confirmedValue(specValue(specs, [/gewicht/i])) || Boolean(data.gps?.deviceWeightGrams), severity: "wichtig", evidence: String(specValue(specs, [/gewicht/i]) || data.gps?.deviceWeightGrams || "Fehlt") },
      { id: "power", group: "Technische Daten", label: "Stromversorgung", ok: confirmedValue(specValue(specs, [/stromversorgung/i, /netzbetrieb/i, /usb/i])), severity: "wichtig", evidence: String(specValue(specs, [/stromversorgung/i, /netzbetrieb/i, /usb/i]) || "Fehlt") },
      { id: "backup-power", group: "Technische Daten", label: "Akku, Batterie oder Notstrom", ok: confirmedValue(specValue(specs, [/akku/i, /batterie/i, /notstrom/i])) || data.comparisonFilters.backupPower !== undefined || Boolean(data.gps?.batteryMaxDays), severity: "optimierung", evidence: String(specValue(specs, [/akku/i, /batterie/i, /notstrom/i]) ?? data.comparisonFilters.backupPower ?? data.gps?.batteryMaxDays ?? "Fehlt") },
      { id: "wifi", group: "Technische Daten", label: "WLAN und Funk", ok: confirmedValue(specValue(specs, [/wlan/i, /wi.fi/i, /funk/i, /übertragung/i])) || Boolean(data.gps?.transmission), severity: "optimierung", evidence: String(specValue(specs, [/wlan/i, /wi.fi/i, /funk/i, /übertragung/i]) || data.gps?.transmission || "Fehlt") },
      { id: "app", group: "Technische Daten", label: "App-Unterstützung", ok: confirmedValue(appValue) || data.comparisonFilters.app !== undefined, severity: "wichtig", evidence: String(appValue ?? data.comparisonFilters.app ?? "Fehlt") },
      { id: "camera", group: "Technische Daten", label: "Kamera", ok: confirmedValue(cameraValue) || data.comparisonFilters.camera !== undefined, severity: "optimierung", evidence: String(cameraValue ?? data.comparisonFilters.camera ?? "Fehlt") },
      { id: "audio", group: "Technische Daten", label: "Mikrofon und Lautsprecher", ok: confirmedValue(audioValue) || !confirmedValue(cameraValue), severity: "optimierung", evidence: String(audioValue || (!confirmedValue(cameraValue) ? "Für Produkt ohne bestätigte Kamera nicht relevant." : "Fehlt")) },
      { id: "cloud", group: "Technische Daten", label: "Cloud- und Abo-Abhängigkeit", ok: confirmedValue(cloudValue) || /cloud|abo|lokale speicherung|offline/i.test(body), severity: "wichtig", evidence: String(cloudValue || "Im Fließtext prüfen") },
      { id: "offline", group: "Technische Daten", label: "Offline-Funktion", ok: /offline|ohne (?:wlan|cloud)|lokale speicherung|funktioniert.*ausfall/i.test(body), severity: "optimierung", evidence: /offline|ohne (?:wlan|cloud)|lokale speicherung|funktioniert.*ausfall/i.test(body) ? "Im Inhalt eingeordnet." : "Fehlt" },
      { id: "material", group: "Technische Daten", label: "Material", ok: confirmedValue(specValue(specs, [/material/i, /edelstahl/i, /kunststoff/i, /keramik/i])), severity: "wichtig", evidence: String(specValue(specs, [/material/i, /edelstahl/i, /kunststoff/i, /keramik/i]) || "Fehlt") },
      { id: "cleaning", group: "Technische Daten", label: "Reinigung", ok: confirmedValue(specValue(specs, [/reinigung/i, /spülmaschine/i])) && /reinig/i.test(body), severity: "wichtig", evidence: String(specValue(specs, [/reinigung/i, /spülmaschine/i]) || "Fehlt") },
      { id: "compatibility", group: "Technische Daten", label: "Futter- oder Einsatzkompatibilität", ok: confirmedValue(specValue(specs, [/futterart/i, /krokette/i, /geeignet/i, /kompat/i])) || data.comparisonFilters.foodType.length > 0 || Boolean(data.gps), severity: "wichtig", evidence: String(specValue(specs, [/futterart/i, /krokette/i, /geeignet/i, /kompat/i]) || data.comparisonFilters.foodType.join(", ") || (data.gps ? "GPS-Eignungsdaten" : "Fehlt")) },
      { id: "strengths", group: "Redaktion", label: "Stärken", ok: data.strengths.length >= 3, severity: "wichtig", evidence: `${data.strengths.length} Einträge` },
      { id: "weaknesses", group: "Redaktion", label: "Schwächen", ok: data.weaknesses.length >= 2, severity: "wichtig", evidence: `${data.weaknesses.length} Einträge` },
      { id: "best-for", group: "Redaktion", label: "Zielgruppe", ok: data.decision.bestFor.length >= 2, severity: "wichtig", evidence: `${data.decision.bestFor.length} Best-for-Einträge` },
      { id: "attention", group: "Redaktion", label: "Ungeeignete Fälle und Aufmerksamkeit", ok: data.decision.attention.length >= 2, severity: "wichtig", evidence: `${data.decision.attention.length} Attention-Einträge` },
      { id: "buying-criteria", group: "Redaktion", label: "Kaufkriterien", ok: /kauf|entscheidung|geeignet|achte auf/i.test(body), severity: "optimierung", evidence: /kauf|entscheidung|geeignet|achte auf/i.test(body) ? "Im Inhalt erkannt." : "Fehlt" },
      { id: "alternatives", group: "Redaktion", label: "Alternativen", ok: data.alternatives.length >= 1, severity: "wichtig", evidence: `${data.alternatives.length} Alternative(n)` },
      { id: "verdict", group: "Redaktion", label: "Fazit und Einordnung", ok: confirmedValue(data.review.summary) && confirmedValue(data.review.verdict), severity: "wichtig", evidence: "Review-Zusammenfassung und Verdict vorhanden." },
      { id: "faq", group: "Redaktion", label: "FAQ", ok: data.faq.length >= 3, severity: "optimierung", evidence: `${data.faq.length} FAQ-Einträge` },
      { id: "cta", group: "Redaktion", label: "CTA und Verfügbarkeitshinweis", ok: Boolean(data.affiliate?.url) && confirmedValue(data.affiliate?.label), severity: "wichtig", evidence: data.affiliate?.label || "Affiliate- oder Verfügbarkeits-CTA fehlt." },
      { id: "sources", group: "Redaktion", label: "Nachvollziehbare Quellen", ok: hasSources, severity: "kritisch", evidence: hasSources ? "Sichtbarer Quellenabschnitt mit URL." : "Quellenabschnitt oder konkrete URLs fehlen." },
      { id: "freshness", group: "Redaktion", label: "Aktualisierungsdatum", ok: updated !== undefined && updated <= 365, severity: "wichtig", evidence: updated === undefined ? "Datum fehlt." : `${updated} Tage seit Aktualisierung` },
      { id: "transparency", group: "Redaktion", label: "Transparenz und Methodik", ok: Boolean(data.editorial) && /kein eigener|redaktionell|herstellerdaten|methodik|datenbasis/i.test(`${data.editorial?.note ?? ""} ${data.experience?.methodology ?? ""} ${body}`), severity: "wichtig", evidence: data.editorial?.assessmentType || "Fehlt" },
      { id: "meta-title", group: "SEO", label: "Meta Title", ok: confirmedValue(data.seo?.title), severity: "wichtig", evidence: data.seo?.title || "Fehlt" },
      { id: "meta-description", group: "SEO", label: "Meta Description", ok: confirmedValue(data.seo?.description), severity: "wichtig", evidence: data.seo?.description || "Fehlt" },
      { id: "canonical", group: "SEO", label: "Canonical", ok: canonicalValid, severity: "kritisch", evidence: data.seo?.canonical || "Fehlt" },
      { id: "structured-data", group: "SEO", label: "Strukturierte Produktdaten", ok: true, severity: "kritisch", evidence: "Produkt-Collection und Produktlayout liefern strukturierte Daten." },
      { id: "internal-links", group: "SEO", label: "Interne Links", ok: /]\(\/(?:vergleiche|hersteller|produkt)\//i.test(body), severity: "wichtig", evidence: "Kontextuelle Money-Page-Verlinkung im Inhalt." },
      { id: "comparisons", group: "SEO", label: "Vergleichszuordnung", ok: linkedComparisons.length > 0, severity: "wichtig", evidence: `${linkedComparisons.length} gültige Vergleichszuordnung(en)` },
      { id: "manufacturer-link", group: "SEO", label: "Herstellerlink", ok: hasManufacturerLink, severity: "optimierung", evidence: hasManufacturerLink ? "Kontextueller Herstellerlink vorhanden." : "Fehlt" },
      { id: "guide-links", group: "SEO", label: "Ratgeberlinks", ok: hasGuideLink, severity: "optimierung", evidence: hasGuideLink ? "Mindestens ein Ratgeberlink erkannt." : "Fehlt" },
      { id: "hero", group: "Visuals", label: "hero.webp", ok: Boolean(data.images.hero), severity: "kritisch", evidence: data.images.hero ? "Vorhanden" : "Fehlt" },
      { id: "thumbnail", group: "Visuals", label: "thumbnail.webp", ok: Boolean(data.images.thumbnail), severity: "wichtig", evidence: data.images.thumbnail ? "Vorhanden" : "Fehlt" },
      { id: "comparison-image", group: "Visuals", label: "comparison.webp", ok: Boolean(data.images.comparison), severity: "wichtig", evidence: data.images.comparison ? "Vorhanden" : "Fehlt" },
      { id: "gallery-1", group: "Visuals", label: "gallery-1.webp", ok: data.images.gallery.length >= 1, severity: "optimierung", evidence: `${data.images.gallery.length} Galeriebilder` },
      { id: "gallery-2", group: "Visuals", label: "gallery-2.webp", ok: data.images.gallery.length >= 2, severity: "optimierung", evidence: `${data.images.gallery.length} Galeriebilder` },
      { id: "gallery-3", group: "Visuals", label: "gallery-3.webp", ok: data.images.gallery.length >= 3, severity: "optimierung", evidence: `${data.images.gallery.length} Galeriebilder` },
    ];
    const weightedChecks = withPoints(rawChecks);
    const missing = weightedChecks.filter((check) => !check.ok);
    const checks = weightedChecks;
    const score = Math.round(checks.reduce((sum, check) => sum + (check.ok ? check.points : 0), 0));
    return {
      slug: data.slug,
      title: data.title,
      manufacturer: data.manufacturer.name,
      category: data.category.label,
      score,
      status: score >= 95 ? "vollständig" : score >= 85 ? "optimierung" : score >= 65 ? "wichtig" : "kritisch",
      checks,
      gaps: missing.map((check) => check.label),
    };
  }).sort((a, b) => a.score - b.score || a.title.localeCompare(b.title, "de"));

  const coverageGaps: ProductCoverageGap[] = products.flatMap((entry) => {
    const data = entry.data;
    const gaps: ProductCoverageGap[] = [];
    const addGap = (gap: ProductCoverageGap) => gaps.push(gap);
    if (!data.comparisons.length) addGap({ id: `comparison|${data.slug}`, slug: data.slug, title: data.title, kind: "kein-vergleich", evidence: "Frontmatter enthält keine Vergleichszuordnung.", recommendation: "Passende bestehende Vergleiche fachlich prüfen; nicht automatisch zuordnen." });
    if (!manufacturerBySlug.has(data.manufacturer.slug)) addGap({ id: `manufacturer|${data.slug}`, slug: data.slug, title: data.title, kind: "keine-herstellerseite", evidence: `Hersteller-Slug „${data.manufacturer.slug}“ hat keine Collection-Seite.`, recommendation: "Herstelleridentität prüfen und nur mit belastbaren Quellen eine Herstellerseite planen." });
    if (!data.category.key || !data.category.label) addGap({ id: `category|${data.slug}`, slug: data.slug, title: data.title, kind: "keine-kategorie", evidence: "Kategorie ist nicht vollständig gepflegt.", recommendation: "Vorhandene Kategorieterminologie übernehmen." });
    const largeDog = data.comparisonFilters.largeDogFit === "technical-fit";
    const inLargeDogComparison = data.comparisons.some((slug) => /grosse-hunde|große-hunde/i.test(slug));
    if (largeDog && !inLargeDogComparison) addGap({ id: `large-dog|${data.slug}`, slug: data.slug, title: data.title, kind: "großer-hund-ohne-vergleich", evidence: "Das strukturierte Eignungsfeld lautet „technical-fit“, aber kein Großhunde-Vergleich ist zugeordnet.", recommendation: "Nur bei passender Geräteart und Suchintention in einen bestehenden Großhunde-Vergleich aufnehmen." });
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

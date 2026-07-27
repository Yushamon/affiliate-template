import { contentPriceAdapter } from "./adapters/contentPriceAdapter.ts";
import type {
  CategoryPriceRange,
  PriceAdapter,
  PriceAssessment,
  PriceTier,
  ProductPriceInsight,
  ProductPriceSnapshot
} from "./types.ts";

const DAY_MS = 86_400_000;

const moneyFormatter = (currency: string) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  });

const quantile = (sorted: number[], percentile: number): number => {
  if (!sorted.length) return 0;
  if (sorted.length === 1) return sorted[0];
  const index = (sorted.length - 1) * percentile;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
};

const roundPrice = (value: number): number => {
  const step = value >= 200 ? 10 : value >= 80 ? 5 : 1;
  return Math.round(value / step) * step;
};

const buildRange = (
  categoryKey: string,
  snapshots: ProductPriceSnapshot[],
  generatedAt: string
): CategoryPriceRange | null => {
  const generatedAtMs = Date.parse(generatedAt);
  const fresh = snapshots
    .filter((item) => item.current != null && item.current > 0)
    .filter((item) => {
      const checkedAt = item.checkedAt ? Date.parse(item.checkedAt) : Number.NaN;
      return Number.isFinite(checkedAt) && generatedAtMs - checkedAt <= 30 * DAY_MS;
    });
  const currencyCounts = fresh.reduce((counts, item) => {
    counts.set(item.currency, (counts.get(item.currency) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());
  const currency = [...currencyCounts.entries()]
    .sort((left, right) => right[1] - left[1])[0]?.[0] ?? "EUR";
  const valid = fresh
    .filter((item) => item.currency === currency)
    .map((item) => item.current as number)
    .sort((a, b) => a - b);

  if (valid.length < 2) return null;
  const min = valid.length >= 5 ? quantile(valid, 0.1) : valid[0];
  const max = valid.length >= 5 ? quantile(valid, 0.9) : valid[valid.length - 1];

  const roundedMin = roundPrice(min);
  const roundedMax = roundPrice(max);
  const lowThreshold = roundPrice(quantile(valid, 0.33));
  const highThreshold = roundPrice(quantile(valid, 0.67));
  return {
    categoryKey,
    currency,
    min: roundedMin,
    max: roundedMax,
    lowThreshold,
    highThreshold,
    median: roundPrice(quantile(valid, 0.5)),
    bands: {
      budget: { min: roundedMin, max: lowThreshold },
      midrange: { min: lowThreshold, max: highThreshold },
      premium: { min: highThreshold, max: roundedMax }
    },
    sampleSize: valid.length,
    generatedAt,
    source: "category-engine"
  };
};

const assessmentFor = (
  snapshot: ProductPriceSnapshot,
  range: CategoryPriceRange | null
): PriceAssessment => {
  if (snapshot.current != null && range) {
    if (snapshot.current <= range.lowThreshold) return "cheap";
    if (snapshot.current <= range.highThreshold) return "fair";
    return "expensive";
  }
  return snapshot.status;
};

const tierFor = (
  snapshot: ProductPriceSnapshot,
  assessment: PriceAssessment
): PriceTier => {
  if (assessment === "cheap") return "budget";
  if (assessment === "fair") return "midrange";
  if (assessment === "expensive") return "premium";
  return snapshot.explicitTier && snapshot.explicitTier !== "unknown"
    ? snapshot.explicitTier
    : "unknown";
};

const labels: Record<PriceAssessment, string> = {
  cheap: "günstig",
  fair: "fair",
  expensive: "eher teuer",
  unknown: "noch nicht belastbar eingeordnet"
};

const comparisonText = (
  assessment: PriceAssessment,
  range: CategoryPriceRange | null,
  explicit?: string
): string => {
  if (explicit) return explicit;
  if (!range) {
    return "Für eine belastbare Einordnung fehlen noch genügend aktuell geprüfte Vergleichspreise in dieser Kategorie.";
  }
  if (assessment === "cheap") {
    return "Der Preis liegt im unteren Drittel vergleichbarer Produkte derselben Kategorie.";
  }
  if (assessment === "fair") {
    return "Der Preis liegt im typischen Mittelfeld vergleichbarer Produkte derselben Kategorie.";
  }
  if (assessment === "expensive") {
    return "Der Preis liegt im oberen Drittel vergleichbarer Produkte derselben Kategorie.";
  }
  return `Die typische Spanne basiert auf ${range.sampleSize} aktuell hinterlegten Vergleichspreisen derselben Kategorie.`;
};

const freshness = (checkedAt?: string, now = Date.now()) => {
  if (!checkedAt) return { isStale: true, freshnessDays: null };
  const timestamp = Date.parse(checkedAt);
  if (!Number.isFinite(timestamp)) return { isStale: true, freshnessDays: null };
  const days = Math.max(0, Math.floor((now - timestamp) / DAY_MS));
  return { isStale: days > 14, freshnessDays: days };
};

export type PriceIndex = {
  generatedAt: string;
  bySlug: Map<string, ProductPriceInsight>;
  ranges: Map<string, CategoryPriceRange>;
  products: ProductPriceInsight[];
};

export const buildPriceIndex = <TProduct>(
  products: TProduct[],
  adapters: PriceAdapter<TProduct>[] = [contentPriceAdapter as PriceAdapter<TProduct>],
  now = new Date()
): PriceIndex => {
  const generatedAt = now.toISOString();
  const snapshots = products
    .map((product) => {
      for (const adapter of adapters) {
        if (!adapter.supports(product)) continue;
        const snapshot = adapter.read(product);
        if (snapshot) return snapshot;
      }
      return null;
    })
    .filter((item): item is ProductPriceSnapshot => Boolean(item));

  const grouped = new Map<string, ProductPriceSnapshot[]>();
  for (const snapshot of snapshots) {
    const values = grouped.get(snapshot.categoryKey) ?? [];
    values.push(snapshot);
    grouped.set(snapshot.categoryKey, values);
  }

  const ranges = new Map<string, CategoryPriceRange>();
  for (const [categoryKey, values] of grouped) {
    const range = buildRange(categoryKey, values, generatedAt);
    if (range) ranges.set(categoryKey, range);
  }

  const insights = snapshots.map((snapshot): ProductPriceInsight => {
    const range = ranges.get(snapshot.categoryKey) ?? null;
    const assessment = assessmentFor(snapshot, range);
    const formatter = moneyFormatter(snapshot.currency);
    const currentFreshness = freshness(snapshot.checkedAt, now.getTime());

    return {
      ...snapshot,
      range,
      assessment,
      assessmentLabel: labels[assessment],
      tier: tierFor(snapshot, assessment),
      formattedCurrent: snapshot.current == null ? null : formatter.format(snapshot.current),
      formattedRange: range
        ? (() => {
            const band = assessment === "cheap"
              ? range.bands.budget
              : assessment === "fair"
                ? range.bands.midrange
                : assessment === "expensive"
                  ? range.bands.premium
                  : { min: range.min, max: range.max };
            return `${formatter.format(band.min)}–${formatter.format(band.max)}`;
          })()
        : null,
      generatedComparisonText: comparisonText(assessment, range, snapshot.comparisonText),
      ...currentFreshness
    };
  });

  return {
    generatedAt,
    bySlug: new Map(insights.map((item) => [item.slug, item])),
    ranges,
    products: insights
  };
};


export { priceTierDistance } from "./tier.ts";

import type {
  PriceAdapter,
  PriceAssessment,
  PriceSource,
  PriceTier,
  ProductPriceSnapshot
} from "../types.ts";

const assessmentValues = new Set<PriceAssessment>([
  "cheap",
  "fair",
  "expensive",
  "unknown"
]);

const tierValues = new Set<PriceTier>([
  "budget",
  "midrange",
  "premium",
  "unknown"
]);

const text = (value: unknown): string =>
  typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();

export const parseMoneyValue = (value: unknown): number | null => {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  const raw = text(value);
  if (!raw) return null;

  const normalized = raw
    .replace(/\s/g, "")
    .replace(/[^0-9,.-]/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const normalizeDate = (value: unknown): string | undefined => {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

const categoryKey = (data: any): string =>
  text(data?.category?.key ?? data?.category?.label ?? data?.category)
    .toLocaleLowerCase("de-DE")
    .replace(/\s+/g, "-");

const sourceFrom = (data: any, raw: any, affiliateUrl?: string): PriceSource | undefined => {
  const configured = raw?.source;
  if (configured && typeof configured === "object") {
    const id = text(configured.id ?? configured.provider ?? configured.name);
    const label = text(configured.label ?? configured.name ?? configured.provider ?? id);
    if (id || label) {
      return {
        id: id || label.toLocaleLowerCase("de-DE").replace(/[^a-z0-9]+/g, "-"),
        label: label || id,
        type: ["merchant", "affiliate", "editorial"].includes(text(configured.type))
          ? configured.type
          : "unknown",
        url: text(configured.url) || affiliateUrl || undefined
      };
    }
  }

  const provider = text(data?.affiliate?.provider);
  if (provider || affiliateUrl) {
    return {
      id: provider || "affiliate",
      label: provider ? provider.charAt(0).toUpperCase() + provider.slice(1) : "Affiliate-Händler",
      type: "affiliate",
      url: affiliateUrl
    };
  }

  return undefined;
};

export const contentPriceAdapter: PriceAdapter<any> = {
  id: "content",
  supports: () => true,
  read(product) {
    const data = product?.data ?? product ?? {};
    const raw = data.price ?? {};
    const slug = text(data.slug ?? product?.slug ?? product?.id).replace(/\.mdx?$/i, "");
    if (!slug) return null;

    const current = parseMoneyValue(
      raw.current ??
        data.conversion?.currentPrice ??
        data.conversion?.price ??
        data.affiliate?.price
    );
    const affiliateUrl = text(raw.affiliateUrl ?? data.affiliate?.url ?? data.productUrl) || undefined;
    const configuredStatus = text(raw.status) as PriceAssessment;
    const configuredTier = text(
      data.comparisonFilters?.priceTier ?? data.priceCategory ?? raw.tier
    ) as PriceTier;

    return {
      slug,
      categoryKey: categoryKey(data) || "unbekannt",
      current,
      currency: text(raw.currency) || "EUR",
      status: assessmentValues.has(configuredStatus) ? configuredStatus : "unknown",
      comparisonText: text(raw.comparisonText) || undefined,
      checkedAt: normalizeDate(raw.checkedAt),
      affiliateUrl,
      source: sourceFrom(data, raw, affiliateUrl),
      explicitTier: tierValues.has(configuredTier) ? configuredTier : "unknown"
    };
  }
};

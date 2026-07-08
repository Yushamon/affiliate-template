import {
  buildAmazonAffiliateUrl,
  buildAmazonSearchAffiliateUrl,
  extractAmazonAsin,
  normalizeAmazonAsin
} from "./amazon.ts";
import type {
  AffiliateConfig,
  ProductAffiliateData,
  ResolvedMerchantLink
} from "./types.ts";

const AMAZON_LINK_META = {
  merchant: "amazon",
  label: "Aktuellen Preis prüfen",
  rel: "sponsored nofollow noopener",
  target: "_blank"
} as const;

export function resolveAmazonLink(
  product: ProductAffiliateData,
  config: AffiliateConfig
): ResolvedMerchantLink | null {
  const amazonInput = product.merchantLinks?.amazon;
  const trackingId = config.amazon?.trackingId?.trim();

  if (!amazonInput || !trackingId) return null;

  const asin =
    normalizeAmazonAsin(amazonInput.asin) ??
    (amazonInput.url ? extractAmazonAsin(amazonInput.url) : null);

  if (asin) {
    return {
      ...AMAZON_LINK_META,
      url: buildAmazonAffiliateUrl(asin, trackingId)
    };
  }

  const searchQuery = [
    amazonInput.searchQuery,
    product.name,
    product.brand && product.name
      ? `${product.brand} ${product.name}`
      : undefined
  ].find((value) => value?.trim())?.trim();

  if (!searchQuery) return null;

  return {
    ...AMAZON_LINK_META,
    url: buildAmazonSearchAffiliateUrl(searchQuery, trackingId)
  };
}

export function getPrimaryAffiliateLink(
  product: ProductAffiliateData,
  config: AffiliateConfig
): ResolvedMerchantLink {
  const amazonLink = resolveAmazonLink(product, config);
  if (amazonLink) return amazonLink;

  const legacyAffiliateUrl = product.affiliateUrl?.trim();

  if (legacyAffiliateUrl) {
    return {
      ...AMAZON_LINK_META,
      url: legacyAffiliateUrl
    };
  }

  return {
    merchant: "internal",
    url: product.productUrl?.trim() ?? "",
    label: "Zum Testbericht"
  };
}

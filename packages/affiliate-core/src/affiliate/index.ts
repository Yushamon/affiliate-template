export type {
  AffiliateConfig,
  AmazonAffiliateOptions,
  MerchantKey,
  MerchantLinkInput,
  ProductAffiliateData,
  ResolvedMerchantLink
} from "./types.ts";

export {
  DEFAULT_AMAZON_MARKETPLACE,
  DEFAULT_AMAZON_TRACKING_ID,
  buildAmazonAffiliateUrl,
  buildAmazonSearchAffiliateUrl,
  createAmazonAffiliateUrl,
  extractAmazonAsin,
  normalizeAmazonAsin,
  resolveAmazonAffiliateUrl
} from "./amazon.ts";

export {
  getPrimaryAffiliateLink,
  resolveAmazonLink
} from "./affiliateEngine.ts";

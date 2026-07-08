export type MerchantKey = "amazon";

export interface MerchantLinkInput {
  asin?: string;
  url?: string;
  searchQuery?: string;
}

export interface ResolvedMerchantLink {
  merchant: "amazon" | "internal";
  url: string;
  label: string;
  rel?: string;
  target?: string;
}

export interface AffiliateConfig {
  amazon?: {
    trackingId?: string;
  };
}

export interface ProductAffiliateData {
  name?: string;
  brand?: string;
  productUrl?: string;
  affiliateUrl?: string;
  merchantLinks?: {
    amazon?: MerchantLinkInput;
  };
}

export interface AmazonAffiliateOptions {
  trackingId?: string;
  marketplace?: string;
}

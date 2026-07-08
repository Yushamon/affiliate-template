import type {
  AmazonAffiliateOptions,
  ProductAffiliateData
} from "./types.ts";

export const DEFAULT_AMAZON_TRACKING_ID = "yusha0f-21";
export const DEFAULT_AMAZON_MARKETPLACE = "www.amazon.de";

const ASIN_PATTERN = /^[A-Z0-9]{10}$/i;
const AMAZON_HOST_PATTERN =
  /^(?:[a-z0-9-]+\.)*amazon\.(?:de|com|co\.uk|fr|it|es|nl|pl|se|com\.be|ca|com\.au|co\.jp|in|com\.mx|com\.br)$/i;

const ASIN_PATH_PATTERNS = [
  /\/(?:[^/]+\/)?dp\/([A-Z0-9]{10})(?:[/?]|$)/i,
  /\/gp\/product\/([A-Z0-9]{10})(?:[/?]|$)/i,
  /\/gp\/aw\/d\/([A-Z0-9]{10})(?:[/?]|$)/i,
  /\/gp\/offer-listing\/([A-Z0-9]{10})(?:[/?]|$)/i,
  /\/exec\/obidos\/ASIN\/([A-Z0-9]{10})(?:[/?]|$)/i
];

export function normalizeAmazonAsin(value?: string | null) {
  if (!value) return null;

  const normalized = value.trim().toUpperCase();

  return ASIN_PATTERN.test(normalized) ? normalized : null;
}

function decodeUrlValue(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function parseAmazonUrl(value: string) {
  const decoded = decodeUrlValue(value.trim());
  const withProtocol = /^https?:\/\//i.test(decoded)
    ? decoded
    : /^(?:[a-z0-9-]+\.)*amazon\./i.test(decoded)
      ? `https://${decoded}`
      : decoded;

  try {
    const url = new URL(withProtocol);

    return AMAZON_HOST_PATTERN.test(url.hostname) ? url : null;
  } catch {
    return null;
  }
}

export function extractAmazonAsin(input: string): string | null {
  const directAsin = normalizeAmazonAsin(input);
  if (directAsin) return directAsin;

  const url = parseAmazonUrl(input);
  if (!url) return null;

  const path = decodeUrlValue(url.pathname);

  for (const pattern of ASIN_PATH_PATTERNS) {
    const match = path.match(pattern);
    const asin = normalizeAmazonAsin(match?.[1]);

    if (asin) return asin;
  }

  for (const key of ["asin", "ASIN", "creativeASIN", "pd_rd_i"]) {
    const asin = normalizeAmazonAsin(url.searchParams.get(key));

    if (asin) return asin;
  }

  return null;
}

export function buildAmazonAffiliateUrl(
  asin: string,
  trackingId: string
): string {
  const normalizedAsin = normalizeAmazonAsin(asin);
  const normalizedTrackingId = trackingId.trim();

  if (!normalizedAsin || !normalizedTrackingId) return "";

  const url = new URL(
    `https://${DEFAULT_AMAZON_MARKETPLACE}/dp/${normalizedAsin}`
  );
  url.searchParams.set("tag", normalizedTrackingId);

  return url.toString();
}

export function buildAmazonSearchAffiliateUrl(
  query: string,
  trackingId: string
): string {
  const normalizedQuery = query.trim();
  const normalizedTrackingId = trackingId.trim();

  if (!normalizedQuery || !normalizedTrackingId) return "";

  const url = new URL(`https://${DEFAULT_AMAZON_MARKETPLACE}/s`);
  url.searchParams.set("k", normalizedQuery);
  url.searchParams.set("tag", normalizedTrackingId);

  return url.toString();
}

function normalizeMarketplace(value?: string) {
  const candidate = (value ?? DEFAULT_AMAZON_MARKETPLACE)
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/$/, "");

  return AMAZON_HOST_PATTERN.test(candidate)
    ? candidate
    : DEFAULT_AMAZON_MARKETPLACE;
}

export function createAmazonAffiliateUrl(
  asin: string,
  options: AmazonAffiliateOptions = {}
) {
  const trackingId =
    options.trackingId?.trim() || DEFAULT_AMAZON_TRACKING_ID;
  const normalizedAsin = normalizeAmazonAsin(asin);
  if (!normalizedAsin) return null;

  const marketplace = normalizeMarketplace(options.marketplace);
  const url = new URL(`https://${marketplace}/dp/${normalizedAsin}`);
  url.searchParams.set("tag", trackingId);

  return url.toString();
}

export function resolveAmazonAffiliateUrl(
  source: ProductAffiliateData & {
    asin?: string | null;
    amazonUrl?: string | null;
  },
  options: AmazonAffiliateOptions = {}
) {
  const asin =
    normalizeAmazonAsin(source.asin) ??
    (source.amazonUrl ? extractAmazonAsin(source.amazonUrl) : null) ??
    (source.affiliateUrl ? extractAmazonAsin(source.affiliateUrl) : null);

  if (asin) {
    return createAmazonAffiliateUrl(asin, options) ?? "";
  }

  return source.affiliateUrl?.trim() ?? "";
}

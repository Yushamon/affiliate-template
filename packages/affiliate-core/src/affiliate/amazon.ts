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

export function addAmazonTrackingId(
  input: string,
  trackingId: string
): string {
  const source = input.trim();
  const normalizedTrackingId = trackingId.trim();

  if (!source || !normalizedTrackingId) return source;

  const url = parseAmazonUrl(source);
  if (!url) return source;

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

/** Product CTA validation; a link is independent of stock, price and editorial rank. */
export function resolveAmazonProductAffiliate(
  input: string | null | undefined,
  trackingId: string | null | undefined,
  shortLinks: Record<string, { destination?: string; error?: string }> = {}
) {
  const source = String(input ?? '').trim();
  let url: URL;
  try { url = new URL(source); } catch { return { isAmazon: false, url: null, effectiveUrl: null, asin: null, error: 'invalid-url', missingSourceTag: false }; }
  const short = ['amzn.to', 'amzn.eu'].includes(url.hostname);
  const isAmazon = short || AMAZON_HOST_PATTERN.test(url.hostname);
  const failure = (error: string) => ({ isAmazon, url: null, effectiveUrl: null, asin: null, error, missingSourceTag: false });
  if (!isAmazon) return failure('not-amazon');
  if (url.protocol !== 'https:' || url.username || url.password || url.port) return failure('invalid-amazon-url');
  const tag = String(trackingId ?? '').trim();
  if (!/^[a-z0-9][a-z0-9_-]*-\d+$/i.test(tag)) return failure('missing-tracking-id');
  if (short) {
    if (!/^\/(?:d\/)?[a-z0-9_-]+\/?$/i.test(url.pathname)) return failure('invalid-amazon-product-url');
    const record = shortLinks[source];
    if (!record?.destination) return failure(record?.error || 'amazon-short-link-needs-verification');
    const destination = resolveAmazonProductAffiliate(record.destination, tag);
    if (!destination.url || !destination.asin) return failure('invalid-amazon-short-link-destination');
    const originalTag = new URL(record.destination).searchParams.get('tag');
    // Preserve a verified, already affiliated short link. If its embedded tag is
    // wrong/missing, use its observed exact destination with only the tag repaired.
    return { ...destination, url: originalTag === tag ? source : destination.url, missingSourceTag: !originalTag };
  }
  const asin = ASIN_PATH_PATTERNS.map(pattern => decodeUrlValue(url.pathname).match(pattern)?.[1]).find(Boolean);
  if (!asin) return failure('invalid-amazon-product-url');
  const missingSourceTag = !url.searchParams.get('tag');
  if (url.searchParams.getAll('tag').length !== 1 || url.searchParams.get('tag') !== tag) url.searchParams.set('tag', tag);
  return { isAmazon: true, url: url.href, effectiveUrl: url.href, asin: asin.toUpperCase(), error: null, missingSourceTag };
}

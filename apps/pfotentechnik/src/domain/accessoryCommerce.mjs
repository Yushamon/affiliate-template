import {
  buildAmazonAffiliateUrl,
  extractAmazonAsin
} from '../../../../packages/affiliate-core/src/affiliate/amazon.ts';

export const ACCESSORY_COMMERCE_STATUS = Object.freeze({
  AFFILIATE_READY: 'AFFILIATE_READY',
  PURCHASABLE_NON_AFFILIATE: 'PURCHASABLE_NON_AFFILIATE',
  COMPATIBILITY_UNRESOLVED: 'COMPATIBILITY_UNRESOLVED',
  MERCHANT_UNSUPPORTED: 'MERCHANT_UNSUPPORTED',
  OFFER_UNAVAILABLE: 'OFFER_UNAVAILABLE',
  UNKNOWN: 'UNKNOWN'
});

export const COST_INPUT_OFFER_MISMATCH = 'COST_INPUT_OFFER_MISMATCH';

const exactCompatibility = (compatibility, productSlug) =>
  compatibility?.status === 'known' &&
  Array.isArray(compatibility.value) &&
  compatibility.value.includes(productSlug);

export function identifyAccessoryMerchant(url) {
  if (!url) return null;
  try {
    const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    if (hostname === 'amazon.de' || hostname.endsWith('.amazon.de')) return 'amazon';
    return hostname || null;
  } catch {
    return null;
  }
}

export function isDirectAmazonProductUrl(url) {
  return Boolean(url && extractAmazonAsin(url));
}

/**
 * Internal-only accessory decision. It does not mutate product offers and is not
 * imported by a renderer. `candidatePackSize` is the pack on the commerce
 * destination; `costInputPackSize` is the pack used by the existing calculation.
 */
export function classifyAccessoryOffer({
  offer,
  productSlug,
  compatibility,
  exactProductIdentity = false,
  candidatePackSize,
  costInputPackSize,
  merchant: explicitMerchant,
  supportedMerchants = ['amazon'],
  affiliateMechanismAvailable = false,
  trackingId = ''
}) {
  const url = offer?.price?.source?.url ?? offer?.affiliate?.url ?? null;
  const merchant = explicitMerchant ?? identifyAccessoryMerchant(url);
  const conflicts = [];

  if (!offer || !productSlug || !compatibility) {
    return { status: ACCESSORY_COMMERCE_STATUS.UNKNOWN, merchant, conflicts, affiliateUrl: null };
  }
  if (offer.priceState !== 'available' || offer.availability !== 'available') {
    return { status: ACCESSORY_COMMERCE_STATUS.OFFER_UNAVAILABLE, merchant, conflicts, affiliateUrl: null };
  }
  if (!exactCompatibility(compatibility, productSlug) || !exactProductIdentity) {
    return { status: ACCESSORY_COMMERCE_STATUS.COMPATIBILITY_UNRESOLVED, merchant, conflicts, affiliateUrl: null };
  }
  if (candidatePackSize != null && costInputPackSize != null && candidatePackSize !== costInputPackSize) {
    conflicts.push(COST_INPUT_OFFER_MISMATCH);
    return { status: ACCESSORY_COMMERCE_STATUS.COMPATIBILITY_UNRESOLVED, merchant, conflicts, affiliateUrl: null };
  }
  if (!merchant) {
    return { status: ACCESSORY_COMMERCE_STATUS.UNKNOWN, merchant, conflicts, affiliateUrl: null };
  }
  if (!supportedMerchants.includes(merchant)) {
    return { status: ACCESSORY_COMMERCE_STATUS.MERCHANT_UNSUPPORTED, merchant, conflicts, affiliateUrl: null };
  }
  if (merchant !== 'amazon' || !isDirectAmazonProductUrl(url) || !affiliateMechanismAvailable || !trackingId.trim()) {
    return { status: ACCESSORY_COMMERCE_STATUS.PURCHASABLE_NON_AFFILIATE, merchant, conflicts, affiliateUrl: null };
  }

  const asin = extractAmazonAsin(url);
  return {
    status: ACCESSORY_COMMERCE_STATUS.AFFILIATE_READY,
    merchant,
    asin,
    conflicts,
    affiliateUrl: buildAmazonAffiliateUrl(asin, trackingId)
  };
}


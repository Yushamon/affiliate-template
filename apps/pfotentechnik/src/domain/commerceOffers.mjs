import { buildNetworkLink, httpsDestination, AFFILIATE_REL } from '../../../../packages/affiliate-core/src/affiliate/networks.mjs';
import { addAmazonTrackingId, DEFAULT_AMAZON_TRACKING_ID } from '../../../../packages/affiliate-core/src/affiliate/amazon.ts';
import { affiliatePrograms } from '../config/affiliate-programs.mjs';
import { ageInDays, formatPrice } from '../lib/product-operations/policy.mjs';

export function legacyCommerceOffer(data) {
  const url = httpsDestination(data.affiliate?.url ?? data.price?.affiliateUrl);
  if (!url) return null;
  const amazon = /(^|\.)amazon\.de$/.test(new URL(url).hostname);
  return {
    id: 'legacy', legacy: true, merchant: amazon ? 'amazon' : new URL(url).hostname,
    network: amazon ? 'partnernet' : 'none', label: amazon ? 'Amazon' : data.price?.source?.label || 'Händler',
    officialProductUrl: url, mappingStatus: 'verified', price: data.price,
    priceState: data.priceState, availability: data.availability ?? 'unknown',
    commerceDataProvider: 'structured-html', affiliate: data.affiliate ?? {url},
    // Do not infer variant, shipping or cross-merchant comparability from a legacy price.
    comparisonKey: data.offers?.find(o => o.id === 'legacy-metadata')?.comparisonKey
  };
}

export function resolveCommerceOffers(data, context = {}, {now = Date.now(), programs = affiliatePrograms} = {}) {
  const legacy = legacyCommerceOffer(data);
  const raw = [...(legacy ? [legacy] : []), ...(data.offers ?? []).filter(o => o.id !== 'legacy-metadata')];
  return raw.map(offer => {
    const program = programs[offer.program];
    const destination = httpsDestination(offer.officialProductUrl, program?.hosts ?? []);
    const verified = offer.mappingStatus === 'verified' && !!destination && (offer.legacy || (!!offer.verifiedAt && program?.merchant === offer.merchant && program?.network === offer.network));
    const tracking = { product: data.slug, placement: 'product-commerce', pageType: 'product', ...context };
    const affiliateUrl = !verified ? null : offer.legacy
      ? addAmazonTrackingId(offer.affiliate.url, DEFAULT_AMAZON_TRACKING_ID)
      : buildNetworkLink(program, destination, tracking);
    const age = ageInDays(offer.price?.checkedAt, now);
    const future = new Date(offer.price?.checkedAt).getTime() > now + 60000;
    const fresh = age != null && age <= 14 && !future && offer.priceState === 'available' && !offer.error;
    const current = fresh && Number.isFinite(offer.price?.current) && offer.price.current > 0 ? offer.price.current : null;
    const blocked = ['out-of-stock','discontinued','temporarily-unavailable'].includes(offer.availability);
    // A verified manufacturer destination is useful even when stock/price is unknown.
    const canLink = !!affiliateUrl && (offer.legacy ? offer.availability === 'available' : !blocked) && data.productStatus !== 'discontinued';
    return {...offer, label: offer.label ?? program?.label ?? offer.merchant, destination,
      affiliateUrl, affiliateReady: !!affiliateUrl, canLink, fresh, ageDays: age, current,
      currency: offer.price?.currency ?? 'EUR', formattedPrice: current == null ? null : formatPrice(current, offer.price?.currency),
      status: !verified ? offer.mappingStatus : offer.error ? 'error' : !affiliateUrl ? 'not-configured' : fresh ? 'fresh' : 'price-unknown-or-stale',
      rel: AFFILIATE_REL, target: '_blank', tracking};
  });
}

export function compareCommerceOffers(offers) {
  const visible = offers.filter(o => o.canLink);
  const comparable = visible.filter(o => o.current != null && o.fresh && o.availability === 'available' && o.comparisonKey && Number.isFinite(o.shipping));
  // Only advertise a cheapest known offer when every displayed offer is comparable.
  const canCompare = comparable.length > 1 && comparable.length === visible.length && comparable.every(o => o.comparisonKey === comparable[0].comparisonKey && o.currency === comparable[0].currency);
  if (!canCompare) return {offers: visible, cheapestId: null, saving: null};
  const sorted = [...visible].sort((a,b)=>(a.current+a.shipping)-(b.current+b.shipping));
  const difference = Math.round(((sorted[1].current+sorted[1].shipping)-(sorted[0].current+sorted[0].shipping))*100)/100;
  return {offers: sorted, cheapestId: difference > 0 ? sorted[0].id : null, saving: difference > 0 ? difference : null};
}

import { buildNetworkLink, httpsDestination, AFFILIATE_REL } from '../../../../packages/affiliate-core/src/affiliate/networks.mjs';
import { resolveAmazonProductAffiliate } from '../../../../packages/affiliate-core/src/affiliate/amazon.ts';
import { projectConfig } from '../project.config.ts';
import amazonShortLinks from '../config/amazon-short-links.json' with { type: 'json' };
import { affiliatePrograms } from '../config/affiliate-programs.mjs';
import { ageInDays, formatPrice, inferInitialAvailability } from '../lib/product-operations/policy.mjs';

export function legacyCommerceOffer(data) {
  const rawUrl = data.affiliate?.url ?? data.price?.affiliateUrl;
  const url = httpsDestination(rawUrl);
  if (!url) return rawUrl ? {id:'legacy',legacy:true,merchant:data.affiliate?.provider === 'amazon' ? 'amazon' : 'unknown',label:'Ungültiges Händlerziel',network:'none',mappingStatus:'invalid',officialProductUrl:rawUrl,affiliate:{...data.affiliate,url:rawUrl},availability:'unknown',price:data.price} : null;
  const amazon = resolveAmazonProductAffiliate(url, projectConfig.affiliate.amazon.trackingId, amazonShortLinks).isAmazon;
  const unresolvedMapping = !amazon && (data.offers ?? []).some(offer =>
    offer.mappingStatus !== 'verified' && (offer.merchant === new URL(url).hostname.split('.').slice(-2, -1)[0] ||
      offer.officialProductUrl && new URL(offer.officialProductUrl).hostname === new URL(url).hostname));
  return {
    id: 'legacy', legacy: true, merchant: amazon ? 'amazon' : new URL(url).hostname,
    network: amazon ? 'partnernet' : 'none', label: amazon ? 'Amazon' : data.price?.source?.label || 'Händler',
    officialProductUrl: url, mappingStatus: unresolvedMapping ? 'unresolved' : 'verified', price: data.price,
    priceState: data.priceState, availability: inferInitialAvailability(data), availabilityUpdated: data.availabilityUpdated,
    commerceDataProvider: 'structured-html', affiliate: data.affiliate ?? {url},
    // Do not infer variant, shipping or cross-merchant comparability from a legacy price.
    comparisonKey: data.price?.comparisonKey, shipping: data.price?.shipping, variantLabel: data.price?.variantLabel
  };
}

export function resolveCommerceOffers(data, context = {}, {now = Date.now(), programs = affiliatePrograms, amazonTrackingId = projectConfig.affiliate.amazon.trackingId, shortLinks = amazonShortLinks} = {}) {
  const legacy = legacyCommerceOffer(data);
  const raw = [...(legacy ? [legacy] : []), ...(data.offers ?? [])];
  return raw.map(offer => {
    const program = programs[offer.program];
    const destination = httpsDestination(offer.officialProductUrl, program?.hosts ?? []);
    const variantMatches = offer.commerceDataProvider !== 'shopify-product' || (destination && !!offer.variantId && new URL(destination).searchParams.get('variant') === offer.variantId);
    const verified = variantMatches && offer.mappingStatus === 'verified' && !!destination && (offer.legacy || (!!offer.verifiedAt && program?.merchant === offer.merchant && program?.network === offer.network));
    const tracking = { product: data.slug, placement: 'product-commerce', pageType: 'product', ...context };
    let amazonLink = resolveAmazonProductAffiliate(offer.legacy ? offer.affiliate.url : offer.officialProductUrl, amazonTrackingId, shortLinks);
    const amazon = offer.merchant === 'amazon' || amazonLink.isAmazon;
    if (amazon && offer.mappingStatus === 'invalid') amazonLink = {...amazonLink, url:null, error:'invalid-product-mapping'};
    const affiliateUrl = amazon ? offer.mappingStatus === 'invalid' ? null : amazonLink.url
      : !verified ? null : offer.legacy ? offer.affiliate.url : buildNetworkLink(program, destination, tracking);
    const age = ageInDays(offer.price?.checkedAt, now);
    const future = new Date(offer.price?.checkedAt).getTime() > now + 60000;
    const domestic = (offer.price?.currency ?? 'EUR') === 'EUR';
    const fresh = age != null && age <= 14 && !future && offer.priceState === 'available' && !offer.error;
    const current = verified && domestic && fresh && Number.isFinite(offer.price?.current) && offer.price.current > 0 ? offer.price.current : null;
    const blocked = ['out-of-stock','discontinued','temporarily-unavailable'].includes(offer.availability);
    // The variant-verified offer replaces a generic legacy link to the same shop in public output.
    // Keep the original record intact for maintenance and preserve every Amazon offer.
    const superseded = offer.legacy && raw.some(other => !other.legacy && other.mappingStatus === 'verified' &&
      (offer.availability !== 'available' || other.availability !== 'unknown') &&
      other.officialProductUrl && destination && new URL(other.officialProductUrl).hostname === new URL(destination).hostname);
    // A verified manufacturer destination is useful even when stock/price is unknown.
    const canLink = !!affiliateUrl && (amazon || (!superseded && !blocked && data.productStatus !== 'discontinued'));
    const purchasable = canLink && domestic && offer.availability === 'available' && data.productStatus !== 'discontinued' && offer.mappingStatus !== 'invalid';
    return {...offer, label: offer.label ?? program?.label ?? offer.merchant, destination,
      affiliateUrl, affiliateReady: !!affiliateUrl, amazonLink: amazon ? amazonLink : null,
      ctaLabel: amazon ? (offer.availability === 'available' ? 'Bei Amazon ansehen' : 'Preis und Verfügbarkeit bei Amazon prüfen') : `Bei ${offer.label ?? program?.label ?? offer.merchant} ansehen`,
      verified, domestic, superseded, canLink, purchasable, fresh, ageDays: age, current,
      currency: offer.price?.currency ?? 'EUR', formattedPrice: current == null ? null : formatPrice(current, offer.price?.currency),
      status: !verified ? offer.mappingStatus : offer.error ? 'error' : !affiliateUrl ? 'not-configured' : fresh ? 'fresh' : 'price-unknown-or-stale',
      rel: AFFILIATE_REL, target: '_blank', tracking};
  });
}

export function compareCommerceOffers(offers) {
  const hasConfiguredOffers = offers.some(o => !o.legacy);
  const visible = offers.filter(o => o.canLink);
  const comparable = visible.filter(o => o.current != null && o.fresh && o.availability === 'available' && o.comparisonKey && Number.isFinite(o.shipping));
  // Only advertise a cheapest known offer when every displayed offer is comparable.
  const canCompare = comparable.length > 1 && comparable.length === visible.length && comparable.every(o => o.comparisonKey === comparable[0].comparisonKey && o.currency === comparable[0].currency);
  if (!canCompare) return {offers: visible, cheapestId: null, saving: null, hasConfiguredOffers};
  const sorted = [...visible].sort((a,b)=>(a.current+a.shipping)-(b.current+b.shipping));
  const difference = Math.round(((sorted[1].current+sorted[1].shipping)-(sorted[0].current+sorted[0].shipping))*100)/100;
  return {offers: sorted, cheapestId: difference > 0 ? sorted[0].id : null, saving: difference > 0 ? difference : null, hasConfiguredOffers};
}

export function commerceDiagnostics(offers) {
  const amazon = offers.filter(offer => offer.amazonLink);
  return {
    amazonLinkPresent: amazon.length > 0,
    amazonMissingSourceTag: amazon.some(offer => offer.amazonLink.missingSourceTag),
    amazonInvalidLink: amazon.some(offer => !!offer.amazonLink.error),
    amazonCtaSuppressed: amazon.some(offer => !!offer.amazonLink.url && !offer.canLink),
    noMerchantOption: !offers.some(offer => offer.canLink)
  };
}

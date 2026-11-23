import { fetchPublicResource } from '../admin/public-fetch.mjs';
import { affiliatePrograms } from '../../config/affiliate-programs.mjs';
import { httpsDestination } from '../../../../../packages/affiliate-core/src/affiliate/networks.mjs';
import { safeFetchText } from './safe-fetch.mjs';
import { extractOfferFromHtml } from './extract-offer.mjs';
import { availabilityFromOffer } from '../product-operations/policy.mjs';

// Main and additional HTML offers share the same price and stock evidence rules.
export async function fetchStructuredPrice(targetUrl, {fetchText = safeFetchText} = {}) {
  const fetched = await fetchText(targetUrl);
  const offer = extractOfferFromHtml(fetched.html, fetched.resolvedUrl);
  if (!offer) throw new Error('Auf der Händlerseite wurde kein belastbarer strukturierter Preis gefunden.');
  const merchant = new URL(fetched.resolvedUrl);
  const germanMarket = merchant.hostname.endsWith('.de') || merchant.hostname.startsWith('de.') || /^\/de(?:[-/]|$)/.test(merchant.pathname);
  return { ...offer, checkedAt: new Date().toISOString(),
    sourceLabel: merchant.hostname.replace(/^www\./, ''),
    detectedAvailability: germanMarket && offer.currency === 'EUR' ? availabilityFromOffer(offer.availability) ?? 'unknown' : 'unknown' };
}

export async function refreshCommerceOffer(offer, options = {}) {
  if (offer.commerceDataProvider === 'shopify-product') return refreshOfficialOffer(offer, options);
  const destination = httpsDestination(offer.officialProductUrl);
  if (offer.mappingStatus !== 'verified' || !destination) throw new Error('Offizielle Produkt-URL unresolved.');
  if (offer.commerceDataProvider !== 'structured-html') throw new Error('Automatische Preisquelle nicht konfiguriert; redaktionelle Pflege möglich.');
  const result = await fetchStructuredPrice(destination, options);
  return { ...offer,
    price: { ...offer.price, current: result.current, currency: result.currency, status: 'unknown', checkedAt: result.checkedAt,
      changedAt: result.current !== offer.price?.current || result.currency !== offer.price?.currency ? result.checkedAt : offer.price?.changedAt,
      source: {id: result.sourceLabel, label: result.sourceLabel, type: 'merchant'} },
    priceState: 'available', lastAttemptAt: result.checkedAt, error: undefined,
    ...(result.detectedAvailability !== 'unknown' ? {availability: result.detectedAvailability, availabilityUpdated: result.checkedAt} : {}) };
}

export function extractShopifyVariant(product, offer, currency) {
  if (currency !== 'EUR') throw new Error('Händlerwährung ist nicht als EUR bestätigt.');
  const variant = product?.variants?.find(v => String(v.id) === offer.variantId);
  if (!variant || !offer.expectedSku || variant.sku !== offer.expectedSku) throw new Error('Produktvariante/SKU stimmt nicht mit der verifizierten Zuordnung überein.');
  if (!Number.isSafeInteger(variant.price) || variant.price <= 0 || typeof variant.available !== 'boolean') throw new Error('Keine belastbaren Variantendaten.');
  return {current: variant.price / 100, currency, availability: variant.available ? 'available' : 'out-of-stock'};
}

export async function refreshOfficialOffer(offer, {fetchResource = fetchPublicResource} = {}) {
  const program = affiliatePrograms[offer.program];
  const destination = httpsDestination(offer.officialProductUrl, program?.hosts ?? []);
  if (!program?.enabled) throw new Error('Affiliate-Programm nicht konfiguriert.');
  if (offer.mappingStatus !== 'verified' || !destination) throw new Error('Offizielle Produkt-URL unresolved.');
  if (offer.commerceDataProvider !== 'shopify-product') throw new Error('Automatische Preisquelle nicht konfiguriert; redaktionelle Pflege möglich.');
  const url = new URL(destination);
  if (url.searchParams.get('variant') !== offer.variantId) throw new Error('Ziel-URL und Preisquelle müssen dieselbe Varianten-ID verwenden.');
  if (url.hostname !== 'de.petlibro.com' || !/^\/products\/[^/]+$/.test(url.pathname)) throw new Error('Nicht unterstützte offizielle Produktdatenquelle.');
  const fetchJson = async href => {
    const result = await fetchResource(href, {label:'Commerce-Quelle', accept:'application/json,text/javascript', maxBytes:1_000_000, timeoutMs:15000, maxRedirects:2});
    if (new URL(result.resolvedUrl).hostname !== url.hostname || !/json|javascript/i.test(result.contentType)) throw new Error('Produktdatenquelle hat ein unerwartetes Ziel oder Format.');
    return JSON.parse(result.buffer.toString('utf8'));
  };
  const [product, cart] = await Promise.all([fetchJson(`${url.origin}${url.pathname}.js`), fetchJson(`${url.origin}/cart.js`)]);
  const result = extractShopifyVariant(product, offer, cart.currency);
  const checkedAt = new Date().toISOString();
  return {...offer, price: {current:result.current, currency:result.currency, changedAt:result.current!==offer.price?.current||result.currency!==offer.price?.currency?checkedAt:offer.price?.changedAt, status:'unknown', checkedAt,
    source:{id:'petlibro-official',label:'PETLIBRO',type:'merchant',url:destination}},
    availability:result.availability, availabilityUpdated:checkedAt, priceState:'available', lastAttemptAt:checkedAt, error:undefined};
}

// Shared isolation used by both single-product and global refresh, injectable for tests.
export async function refreshCommerceTasks(tasks) {
  const results = [];
  for (const task of tasks) {
    try { results.push({id:task.id, provider:task.provider, ok:true, value:await task.run()}); }
    catch (error) { results.push({id:task.id,provider:task.provider,ok:false,error:error instanceof Error ? error.message : String(error)}); }
  }
  return results;
}

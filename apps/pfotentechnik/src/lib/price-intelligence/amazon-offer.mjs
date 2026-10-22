import { parse } from 'parse5';

const attr = (node, name) => node.attrs?.find(attribute => attribute.name === name)?.value;
const descendants = function* (node) {
  yield node;
  for (const child of node.childNodes ?? []) yield* descendants(child);
};
const hidden = node => {
  for (let current = node; current; current = current.parentNode) {
    if (attr(current, 'hidden') !== undefined || attr(current, 'aria-hidden') === 'true' ||
      /(?:^|\s)(?:aok-hidden|a-hidden)(?:\s|$)/.test(attr(current, 'class') ?? '') ||
      /display\s*:\s*none|visibility\s*:\s*hidden/i.test(attr(current, 'style') ?? '')) return true;
  }
  return false;
};

// Read only the primary purchase form, never recommendations, used offers or list prices.
export function extractAmazonOffer(html, pageUrl) {
  let url;
  try { url = new URL(pageUrl); } catch { return null; }
  if (!/^(?:www\.)?amazon\.de$/.test(url.hostname)) return null;
  const asin = url.pathname.match(/\/(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})(?:\/|$)/i)?.[1];
  if (!asin) return null;
  const nodes = [...descendants(parse(html))];
  const forms = nodes.filter(node => node.tagName === 'form' && attr(node, 'id') === 'addToCart' && !hidden(node));
  if (forms.length !== 1) return null;
  const formNodes = [...descendants(forms[0])];
  const input = name => {
    const matches = formNodes.filter(node => node.tagName === 'input' && attr(node, 'name') === name);
    return matches.length === 1 ? attr(matches[0], 'value') : undefined;
  };
  if (input('ASIN')?.toUpperCase() !== asin.toUpperCase()) return null;
  const amount = input('items[0.base][customerVisiblePrice][amount]');
  const currency = input('items[0.base][customerVisiblePrice][currencyCode]');
  if (!/^\d+(?:\.\d{1,2})?$/.test(amount ?? '') || !(Number(amount) > 0) || currency !== 'EUR') return null;
  // Amazon stock and purchase buttons do not determine whether a price can be updated.
  return { current: Number(amount), currency, availability: undefined, method: 'amazon-buybox', pageUrl };
}

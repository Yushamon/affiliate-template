const decode = (value = "") => String(value)
  .replaceAll("&quot;", '"')
  .replaceAll("&#39;", "'")
  .replaceAll("&amp;", "&")
  .replaceAll("&lt;", "<")
  .replaceAll("&gt;", ">");

const parseAmount = (value) => {
  if (typeof value === "number") return Number.isFinite(value) && value > 0 ? value : null;
  const normalized = String(value ?? "").trim().replace(/\s/g, "").replace(/[^0-9,.-]/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", ".");
  const number = Number.parseFloat(normalized);
  return Number.isFinite(number) && number > 0 ? number : null;
};

const typeList = (node) => Array.isArray(node?.["@type"]) ? node["@type"] : [node?.["@type"]].filter(Boolean);
const isOffer = (node) => typeList(node).some((type) => ["Offer"].includes(String(type)));

function visit(node, offers, trail = []) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) { node.forEach((item, index) => visit(item, offers, [...trail, index])); return; }
  if (isOffer(node)) {
    const price = parseAmount(node.price ?? node.lowPrice ?? node.highPrice ?? node.priceSpecification?.price);
    const currency = String(node.priceCurrency ?? node.priceSpecification?.priceCurrency ?? "").toUpperCase();
    if (price != null && /^[A-Z]{3}$/.test(currency)) offers.push({ price, currency, availability: node.availability, source: "json-ld", trail });
  }
  for (const [key, value] of Object.entries(node)) visit(value, offers, [...trail, key]);
}

const metaValue = (html, keys) => {
  for (const key of keys) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const patterns = [
      new RegExp(`<meta[^>]+(?:property|name|itemprop)=["']${escaped}["'][^>]+content=["']([^"']+)["']`, "i"),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name|itemprop)=["']${escaped}["']`, "i")
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) return decode(match[1]);
    }
  }
  return "";
};

export function extractOfferFromHtml(html, pageUrl = "") {
  const offers = [];
  for (const match of String(html).matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { visit(JSON.parse(decode(match[1]).trim()), offers); } catch { /* malformed retailer data */ }
  }
  if (offers.length) {
    // Multiple models, variants or sellers must not silently select the cheapest.
    const distinct = new Set(offers.map(offer => JSON.stringify([offer.price, offer.currency, offer.availability ?? null])));
    if (distinct.size !== 1) return null;
    const selected = offers[0];
    return { current: selected.price, currency: selected.currency, method: selected.source, availability: selected.availability, pageUrl };
  }

  const amount = parseAmount(metaValue(html, ["product:price:amount", "og:price:amount", "price", "priceAmount"]));
  const currency = metaValue(html, ["product:price:currency", "og:price:currency", "priceCurrency"]) || "";
  if (amount != null && /^[A-Z]{3}$/.test(currency.toUpperCase())) return { current: amount, currency: currency.toUpperCase(), method: "meta", pageUrl };

  const itemprop = String(html).match(/itemprop=["']price["'][^>]+(?:content|value)=["']([^"']+)["']/i)
    ?? String(html).match(/(?:content|value)=["']([^"']+)["'][^>]+itemprop=["']price["']/i);
  const itemAmount = parseAmount(itemprop?.[1]);
  if (itemAmount != null && /^[A-Z]{3}$/.test(currency.toUpperCase())) return { current: itemAmount, currency: currency.toUpperCase(), method: "itemprop", pageUrl };

  return null;
}

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
const isOffer = (node) => typeList(node).some((type) => ["Offer", "AggregateOffer"].includes(String(type)));

function visit(node, offers, trail = []) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) { node.forEach((item, index) => visit(item, offers, [...trail, index])); return; }
  if (isOffer(node)) {
    const price = parseAmount(node.price ?? node.lowPrice ?? node.highPrice ?? node.priceSpecification?.price);
    const currency = String(node.priceCurrency ?? node.priceSpecification?.priceCurrency ?? "EUR").toUpperCase();
    if (price != null) offers.push({ price, currency, availability: node.availability, source: "json-ld", trail });
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
    const selected = offers.sort((a, b) => a.price - b.price)[0];
    return { current: selected.price, currency: selected.currency, method: selected.source, availability: selected.availability, pageUrl };
  }

  const amount = parseAmount(metaValue(html, ["product:price:amount", "og:price:amount", "price", "priceAmount"]));
  const currency = metaValue(html, ["product:price:currency", "og:price:currency", "priceCurrency"]) || "EUR";
  if (amount != null) return { current: amount, currency: currency.toUpperCase(), method: "meta", pageUrl };

  const itemprop = String(html).match(/itemprop=["']price["'][^>]+(?:content|value)=["']([^"']+)["']/i)
    ?? String(html).match(/(?:content|value)=["']([^"']+)["'][^>]+itemprop=["']price["']/i);
  const itemAmount = parseAmount(itemprop?.[1]);
  if (itemAmount != null) return { current: itemAmount, currency: "EUR", method: "itemprop", pageUrl };

  return null;
}

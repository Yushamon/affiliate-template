const GENERIC = new Set([
  "smart", "smarter", "automatic", "automatisch", "pet", "haustier", "futterautomat",
  "feeder", "trinkbrunnen", "water", "fountain", "gps", "tracker", "fuer", "fur", "mit",
  "ohne", "hund", "hunde", "katze", "katzen", "neu", "modell", "version"
]);

export const normalizeIdentityText = (value) => String(value || "")
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/ß/g, "ss")
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const tokens = (value, manufacturer = "") => {
  const manufacturerTokens = new Set(normalizeIdentityText(manufacturer).split(" ").filter(Boolean));
  return [...new Set(normalizeIdentityText(value).split(" ").filter((token) => token && !GENERIC.has(token) && !manufacturerTokens.has(token)))];
};

const scoreDocument = (identity, document) => {
  const detectedTitle = normalizeIdentityText(identity.title);
  const contentTitle = normalizeIdentityText(document.data?.title);
  const detectedManufacturer = normalizeIdentityText(identity.manufacturer);
  const contentManufacturer = normalizeIdentityText(document.data?.manufacturer?.name ?? document.data?.manufacturer);
  let score = 0;
  const reasons = [];

  if (detectedTitle && contentTitle && detectedTitle === contentTitle) {
    score += 1_000;
    reasons.push("exact-title");
  } else if (detectedTitle && contentTitle && (detectedTitle.includes(contentTitle) || contentTitle.includes(detectedTitle))) {
    score += 600;
    reasons.push("contained-title");
  }

  const contentTokens = tokens(contentTitle, contentManufacturer);
  const detectedTokens = new Set(tokens(detectedTitle, detectedManufacturer));
  if (contentTokens.length) {
    const hits = contentTokens.filter((token) => detectedTokens.has(token)).length;
    const coverage = hits / contentTokens.length;
    score += Math.round(coverage * 400);
    if (coverage > 0) reasons.push(`token-coverage:${coverage.toFixed(2)}`);
  }

  if (detectedManufacturer && contentManufacturer && (
    detectedManufacturer === contentManufacturer ||
    detectedManufacturer.includes(contentManufacturer) ||
    contentManufacturer.includes(detectedManufacturer)
  )) {
    score += 100;
    reasons.push("manufacturer");
  }

  return { document, score, reasons };
};

export function matchProductDocument(identity, documents, requestedSlug) {
  const requested = normalizeIdentityText(requestedSlug).replace(/\s+/g, "-");
  if (requested) {
    const document = documents.find((item) => item.slug === requested);
    return document ? { document, method: "explicit-slug", confidence: 1, reasons: ["explicit-slug"] } : null;
  }

  const ranked = documents
    .map((document) => scoreDocument(identity, document))
    .sort((left, right) => right.score - left.score);
  const best = ranked[0];
  const second = ranked[1];
  if (!best || best.score < 350) return null;
  if (second && best.score - second.score < 40 && best.score < 900) return null;
  return {
    document: best.document,
    method: "detected-product",
    confidence: Math.min(1, best.score / 1_100),
    reasons: best.reasons
  };
}

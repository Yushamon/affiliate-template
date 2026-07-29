import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  asStringArray,
  normalizeSlug,
  parseFrontmatter,
  stripMarkdown,
  walkFiles
} from "../internal-linking-utils.mjs";

const STOP_WORDS = new Set([
  "aber", "alle", "als", "auch", "bei", "beste", "besten", "das", "dass", "dem", "den", "der", "die",
  "ein", "eine", "einem", "einen", "einer", "es", "für", "fuer", "im", "in", "ist", "mit", "oder",
  "ohne", "sich", "und", "von", "vor", "was", "welche", "welcher", "wie", "zu", "zum", "zur"
]);

const COLLECTIONS = [
  { name: "pages", dir: "src/content/pages", route: (slug) => `/${slug}/` },
  { name: "products", dir: "src/content/products", route: (slug) => `/produkt/${slug}/` },
  { name: "comparisons", dir: "src/content/comparisons", route: (slug) => `/vergleiche/${slug}/` },
  { name: "manufacturers", dir: "src/content/manufacturers", route: (slug) => `/hersteller/${slug}/` }
];

const LEGAL_ROUTES = new Set(["/impressum/", "/datenschutz/", "/kontakt/", "/affiliate-hinweis/"]);
const HUB_ROUTES = new Map([
  ["/smarte-haustiertechnik/", "category-hub"],
  ["/smarte-futterautomaten/", "category-hub"],
  ["/trinkbrunnen/", "category-hub"],
  ["/gps-tracker/", "category-hub"],
  ["/futterautomat-und-ernaehrung/", "category-hub"],
  ["/wissen/", "knowledge-hub"],
  ["/vergleiche/", "comparison-index"],
  ["/hersteller/", "manufacturer-index"]
]);
const MEDICAL_TERMS = /\b(?:durchfall|frisst nicht|trinkt (?:zu wenig|viel|plötzlich)|nieren|müde|uebergewicht|übergewicht|warnzeichen|tierarzt|tierärzt)\b/i;
const HOW_TO_TERMS = /\b(?:anleitung|entfernen|gewöhnen|messen|pflegen|reinigen|richtig|wechseln|wie funktioniert|wie lange|wie viele|woran erkennt|warum)\b/i;
const COMMERCIAL_TERMS = /\b(?:kaufberatung|entscheidung|geeignet|sinnvoll|unterschied|welcher|welche|oder)\b/i;

export const normalizeRoute = (value = "") => {
  try {
    const url = new URL(String(value), "https://pfotentechnik.de/");
    let pathname = decodeURI(url.pathname).replace(/\\/g, "/").replace(/\/{2,}/g, "/");
    return pathname === "/" ? "/" : pathname.replace(/\/+$/, "") + "/";
  } catch {
    return "";
  }
};

export const normalizeText = (value = "") => String(value)
  .toLocaleLowerCase("de-DE")
  .normalize("NFKD")
  .replace(/\p{Diacritic}/gu, "")
  .replace(/ß/g, "ss")
  .replace(/[^a-z0-9]+/g, " ")
  .replace(/\s+/g, " ")
  .trim();

export const textTokens = (value = "") => [...new Set(
  normalizeText(value).split(" ").filter((token) => token.length > 2 && !STOP_WORDS.has(token))
)];

export const jaccard = (left = [], right = []) => {
  const a = new Set(left);
  const b = new Set(right);
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const value of a) if (b.has(value)) intersection += 1;
  return intersection / new Set([...a, ...b]).size;
};

const ngrams = (value, size = 5) => {
  const words = normalizeText(value).split(" ").filter(Boolean);
  if (words.length < size) return new Set(words.length ? [words.join(" ")] : []);
  return new Set(words.slice(0, words.length - size + 1).map((_, index) => words.slice(index, index + size).join(" ")));
};

export const textSimilarity = (left = "", right = "") => {
  const tokenScore = jaccard(textTokens(left), textTokens(right));
  const gramScore = jaccard([...ngrams(left)], [...ngrams(right)]);
  return Number((tokenScore * 0.38 + gramScore * 0.62).toFixed(4));
};

const decodeHtml = (value = "") => String(value)
  .replace(/&nbsp;|&#160;/gi, " ")
  .replace(/&amp;/gi, "&")
  .replace(/&lt;/gi, "<")
  .replace(/&gt;/gi, ">")
  .replace(/&quot;|&#34;/gi, "\"")
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));

const stripMarkup = (html = "") => decodeHtml(String(html)
  .replace(/<!--[\s\S]*?-->/g, " ")
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
  .replace(/<template\b[^>]*>[\s\S]*?<\/template>/gi, " ")
  .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, " ")
  .replace(/<[^>]+>/g, " "))
  .replace(/\s+/g, " ")
  .trim();

const tagValues = (html, tag) => [...String(html).matchAll(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi"))]
  .map((match) => stripMarkup(match[1]))
  .filter(Boolean);

const metaValue = (html, key, attribute = "name") => {
  const tags = [...String(html).matchAll(/<meta\b[^>]*>/gi)].map((match) => match[0]);
  const target = tags.find((tag) => new RegExp(`${attribute}=["']${key}["']`, "i").test(tag));
  return decodeHtml(target?.match(/\bcontent=["']([^"']*)["']/i)?.[1] ?? "");
};

const canonicalValue = (html) => {
  const tag = [...String(html).matchAll(/<link\b[^>]*>/gi)]
    .map((match) => match[0])
    .find((item) => /\brel=["'][^"']*canonical/i.test(item));
  return decodeHtml(tag?.match(/\bhref=["']([^"']+)["']/i)?.[1] ?? "");
};

const internalLinks = (html) => [...String(html).matchAll(/<a\b[^>]*\bhref=["']([^"'#]+)[^"']*["'][^>]*>/gi)]
  .map((match) => normalizeRoute(match[1]))
  .filter((route) => route && !/^\/(?:admin|api)\//.test(route));

const routeForDistFile = (dist, file) => {
  const relative = path.relative(dist, file).replace(/\\/g, "/");
  if (relative === "index.html") return "/";
  if (relative.endsWith("/index.html")) return normalizeRoute("/" + relative.slice(0, -11));
  if (relative.endsWith(".html")) return normalizeRoute("/" + relative.slice(0, -5));
  return "";
};

const authorFromRaw = (raw = "") => raw.match(/\bauthor:\s*\{[^}]*\bname:\s*["']([^"']+)["']/i)?.[1]
  ?? raw.match(/^\s*name:\s*["']?([^"'\r\n]+)["']?\s*$/mi)?.[1]
  ?? "";

const inlineValue = (raw = "", key = "") => raw.match(new RegExp(`\\b${key}:\\s*["']?([^,"'}\\]\\r\\n]+)`, "i"))?.[1]?.trim() ?? "";

const sourceDocuments = (appRoot, repoRoot) => {
  const output = [];
  for (const collection of COLLECTIONS) {
    const directory = path.join(appRoot, collection.dir);
    for (const file of walkFiles(directory).filter((item) => /\.(md|mdx)$/i.test(item))) {
      const raw = fs.readFileSync(file, "utf8");
      const parsed = parseFrontmatter(raw);
      const slug = normalizeSlug(parsed.data.slug || path.basename(file, path.extname(file)));
      if (!slug) continue;
      const route = normalizeRoute(parsed.data.route || parsed.data.productUrl || collection.route(slug));
      output.push({
        route,
        collection: collection.name,
        sourceFile: path.relative(repoRoot, file).replace(/\\/g, "/"),
        data: parsed.data,
        rawFrontmatter: parsed.raw,
        markdownBody: parsed.body,
        sourceText: stripMarkdown(parsed.body),
        explicitIntent: inlineValue(parsed.raw, "intent"),
        author: authorFromRaw(parsed.raw)
      });
    }
  }
  return output;
};

const sitemapRoutes = (dist) => {
  const routes = new Set();
  if (!fs.existsSync(dist)) return routes;
  for (const file of walkFiles(dist).filter((item) => /sitemap.*\.xml$/i.test(item))) {
    const xml = fs.readFileSync(file, "utf8");
    for (const match of xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)) {
      if (!/sitemap.*\.xml/i.test(match[1])) routes.add(normalizeRoute(match[1]));
    }
  }
  return routes;
};

export const readRedirects = (appRoot) => {
  const redirects = new Map();
  const file = path.join(appRoot, "public/_redirects");
  if (!fs.existsSync(file)) return redirects;
  for (const rawLine of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const [from, to, status] = line.split(/\s+/);
    if (!/^30[178]$/.test(status ?? "")) continue;
    redirects.set(normalizeRoute(from), normalizeRoute(to));
  }
  return redirects;
};

const inferPageType = (route, source, title, text) => {
  if (route === "/") return "homepage";
  if (/^\/(?:admin|api)\//.test(route)) return "technical";
  if (LEGAL_ROUTES.has(route)) return "legal";
  if (HUB_ROUTES.has(route)) return HUB_ROUTES.get(route);
  if (route.startsWith("/produkt/")) return "product";
  if (route.startsWith("/hersteller/")) return "manufacturer";
  if (route.startsWith("/vergleiche/")) return "comparison";
  if (source?.data?.type === "knowledge" || source?.data?.layout === "knowledge") {
    if (MEDICAL_TERMS.test(`${title} ${text.slice(0, 800)}`)) return "medical-guide";
    if (COMMERCIAL_TERMS.test(title)) return "decision-guide";
    if (HOW_TO_TERMS.test(title)) return "problem-solving-guide";
    return "guide";
  }
  return "editorial-page";
};

const inferIntent = (pageType, title, text, explicitIntent = "") => {
  if (pageType === "product") return { primary: "product-research", confidence: "high", source: "page-type" };
  if (pageType === "manufacturer") return { primary: "brand-navigation", confidence: "high", source: "page-type" };
  if (pageType === "comparison") return { primary: "comparison", confidence: "high", source: "page-type" };
  if (pageType.endsWith("hub") || pageType.endsWith("index") || pageType === "homepage") {
    return { primary: "category-discovery", confidence: "high", source: "page-type" };
  }
  if (pageType === "medical-guide") {
    return { primary: "medical-information", confidence: "high", source: "page-type" };
  }
  const explicit = {
    informational: "informational",
    "buying-guide": "commercial-investigation",
    "comparison-support": "commercial-investigation",
    troubleshooting: "problem-solving",
    "how-to": "problem-solving",
    "health-guide": "medical-information"
  }[explicitIntent];
  if (explicit) return { primary: explicit, confidence: "high", source: "contentPlatform" };
  if (pageType === "legal" || pageType === "technical") return { primary: "informational", confidence: "high", source: "page-type" };
  if (pageType === "medical-guide" || MEDICAL_TERMS.test(`${title} ${text.slice(0, 900)}`)) {
    return { primary: "medical-information", confidence: "high", source: "content-signals" };
  }
  if (HOW_TO_TERMS.test(title)) return { primary: "problem-solving", confidence: "medium", source: "title-structure" };
  if (COMMERCIAL_TERMS.test(title)) return { primary: "commercial-investigation", confidence: "medium", source: "title-structure" };
  return { primary: "informational", confidence: "medium", source: "fallback" };
};

const inferCluster = (route, title, source) => {
  const explicit = normalizeText(
    source?.data?.contentGraph?.cluster
    || source?.data?.contentPlatform?.cluster
    || inlineValue(source?.rawFrontmatter, "cluster")
    || source?.data?.category?.key
    || (typeof source?.data?.category === "string" ? source.data.category : "")
    || ""
  ).replace(/ /g, "-");
  if (explicit && !["wissen", "ratgeber", "knowledge", "page", "produkte"].includes(explicit)) {
    if (/gps/.test(explicit)) return "gps-tracker";
    if (/trink|brunnen|wasser/.test(explicit)) return "trinkbrunnen";
    if (/futter|ernahr/.test(explicit)) return "futterautomaten";
    return explicit;
  }
  const value = normalizeText(`${route} ${title}`);
  if (/gps|tracker|bluetooth|airtag/.test(value)) return "gps-tracker";
  if (/trinkbrunnen|katzenbrunnen|wasser/.test(value)) return "trinkbrunnen";
  if (/futter|mahlzeit|schling/.test(value)) return "futterautomaten";
  if (/katze/.test(value) && MEDICAL_TERMS.test(value)) return "gesundheit-katze";
  if (/hund/.test(value) && MEDICAL_TERMS.test(value)) return "gesundheit-hund";
  if (route.startsWith("/hersteller/")) return "hersteller";
  return "smarte-haustiertechnik";
};

const inferAnimal = (title, text, source) => {
  const explicit = inlineValue(source?.rawFrontmatter, "animal");
  if (["dog", "cat", "both"].includes(explicit)) return explicit;
  const value = normalizeText(`${title} ${text.slice(0, 600)}`);
  const dog = /\bhund/.test(value);
  const cat = /\bkatze|\bkatzen/.test(value);
  return dog && cat ? "both" : dog ? "dog" : cat ? "cat" : "";
};

const inferProductCategory = (cluster, title) => {
  const value = normalizeText(title);
  if (/tracker|gps/.test(value) || cluster === "gps-tracker") return "gps-tracker";
  if (/brunnen|fountain/.test(value) || cluster === "trinkbrunnen") return "trinkbrunnen";
  if (/futter|feeder/.test(value) || cluster === "futterautomaten") return "futterautomat";
  return "";
};

const topicOwnerFor = (page, config) => {
  const normalized = normalizeText(`${page.title} ${page.h1} ${page.route}`);
  const candidates = config.topicOwners.filter((owner) =>
    owner.route === page.route
    || (owner.cluster === page.cluster
      && owner.intent === page.searchIntent.primary
      && owner.terms.some((term) => normalized.includes(normalizeText(term))))
  );
  const owner = candidates.sort((left, right) => Number(right.route === page.route) - Number(left.route === page.route))[0];
  return owner ? { id: owner.id, route: owner.route, explicit: true } : {
    id: `route:${page.route}`,
    route: page.route,
    explicit: false
  };
};

const qualityFor = (page) => {
  let score = 20;
  const signals = [];
  if (page.title && page.h1) { score += 10; signals.push("clear-title-h1"); }
  if (page.metaDescription) { score += 8; signals.push("meta-description"); }
  if (page.headingCount >= 3) { score += 12; signals.push("structured-headings"); }
  if (page.wordCount >= (page.pageType === "product" ? 90 : 180)) { score += 15; signals.push("substantive-content"); }
  if (page.internalOutgoingLinks >= 2) { score += 8; signals.push("internal-context"); }
  if (page.structuredData.length) { score += 7; signals.push("structured-data"); }
  if (page.features.tables) { score += 5; signals.push("table"); }
  if (page.features.faq) { score += 5; signals.push("faq"); }
  if (page.features.decisionSupport) { score += 10; signals.push("decision-support"); }
  return { score: Math.min(100, score), signals };
};

const secondaryIntents = (page) => {
  const values = [];
  if (page.searchIntent.primary === "medical-information") values.push("problem-solving");
  if (page.searchIntent.primary === "comparison") values.push("commercial-investigation", "transactional-support");
  if (page.searchIntent.primary === "product-research") values.push("transactional-support");
  if (page.searchIntent.primary === "category-discovery") values.push("informational");
  return values;
};

const stableHash = (value) => crypto.createHash("sha256").update(normalizeText(value)).digest("hex");
const pairKey = (routes) => [...routes].sort().join("|");

export const preparePageForAnalysis = (input, config = { allowedSystemPhrases: [] }) => {
  const page = {
    sourceFile: "",
    pageType: "guide",
    title: "",
    h1: "",
    h1Count: 1,
    metaDescription: "",
    canonicalRoute: input.route,
    indexable: true,
    inSitemap: true,
    cluster: "smarte-haustiertechnik",
    searchIntent: { primary: "informational", confidence: "medium", source: "fixture" },
    secondaryIntents: [],
    mainEntity: "",
    internalIncomingLinks: 0,
    internalOutgoingLinks: 0,
    outgoingRoutes: [],
    wordCount: 0,
    headingCount: 0,
    headings: [],
    structuredData: [],
    mainText: "",
    topicOwner: { route: input.route, id: `route:${input.route}`, explicit: false },
    quality: { score: 70, signals: ["fixture"] },
    expectedComparisonCount: 0,
    renderedComparisonCount: 0,
    ...input
  };
  const similarityText = (config.allowedSystemPhrases ?? []).reduce(
    (text, phrase) => text.replaceAll(phrase, " "),
    page.mainText
  );
  page.wordCount ||= normalizeText(page.mainText).split(" ").filter(Boolean).length;
  page.headingCount ||= page.headings.length;
  page._similarity = {
    title: textTokens(`${page.title} ${page.h1}`),
    headings: page.headings.map(normalizeText),
    bodyTokens: textTokens(similarityText),
    bodyNgrams: [...ngrams(similarityText)],
    entities: textTokens(`${page.mainEntity} ${page.cluster}`),
    bodyHash: stableHash(similarityText)
  };
  return page;
};

const allowedSeparation = (left, right, config) =>
  config.allowedSeparations.find((item) => pairKey(item.routes) === pairKey([left.route, right.route]));

const tokenCoverage = (required, actual) => {
  const requiredTokens = textTokens(required);
  const actualTokens = new Set(textTokens(actual));
  if (!requiredTokens.length) return 1;
  return requiredTokens.filter((token) => actualTokens.has(token)).length / requiredTokens.length;
};

const comparisonMetrics = (left, right, includeBody = true) => {
  const title = jaccard(left._similarity.title, right._similarity.title);
  const headings = jaccard(left._similarity.headings, right._similarity.headings);
  const body = includeBody
    ? Number((
        jaccard(left._similarity.bodyTokens, right._similarity.bodyTokens) * 0.38
        + jaccard(left._similarity.bodyNgrams, right._similarity.bodyNgrams) * 0.62
      ).toFixed(4))
    : 0;
  const entities = jaccard(left._similarity.entities, right._similarity.entities);
  const combined = Number((title * 0.28 + headings * 0.17 + body * 0.43 + entities * 0.12).toFixed(4));
  return { title: Number(title.toFixed(4)), headings: Number(headings.toFixed(4)), body, entities: Number(entities.toFixed(4)), combined };
};

const finding = (code, severity, routes, details = {}) => ({
  id: `${code.toLocaleLowerCase()}|${pairKey(routes)}`,
  code,
  severity,
  routes: [...routes].sort(),
  ...details
});

export const analysePages = ({ pages, config, redirects, sitemap }) => {
  const findings = [];
  const conflicts = [];
  const pageByRoute = new Map(pages.map((page) => [page.route, page]));
  const thresholds = config.thresholds;

  for (const page of pages) {
    if (page.indexable && !page.mainText) {
      findings.push(finding("CONTENT_EMPTY_MAIN", "error", [page.route], { evidence: "Indexierbare Seite ohne sichtbaren Hauptinhalt." }));
    }
    if (page.indexable && !page.searchIntent?.primary) {
      findings.push(finding("CONTENT_INTENT_MISSING", "error", [page.route], { evidence: "Keine primäre Suchintention ableitbar." }));
    }
    if (page.indexable && page.h1Count !== 1) {
      findings.push(finding("CONTENT_H1_COUNT_INVALID", page.h1Count === 0 ? "error" : "warning", [page.route], {
        evidence: `Gerenderte H1-Anzahl: ${page.h1Count}.`
      }));
    }
    if (page.inSitemap && !page.indexable) {
      findings.push(finding("CONTENT_NOINDEX_IN_SITEMAP", "error", [page.route], { evidence: "Nicht indexierbare Seite ist in der Sitemap enthalten." }));
    }
    if (page.indexable && page.wordCount < (page.pageType === "product" ? thresholds.minimumProductWords : thresholds.minimumEditorialWords)
      && page.quality.score < 55) {
      findings.push(finding("CONTENT_THIN_WITHOUT_VALUE", "warning", [page.route], {
        evidence: `Nur ${page.wordCount} sichtbare Wörter und ${page.quality.signals.length} belastbare Nutzwertsignale.`,
        qualityScore: page.quality.score
      }));
    }
    if (/(?:\bTODO\b|\bLorem ipsum\b|\{\{[^}]+\}\}|<%=?[^%]+%>)/i.test(page.mainText)) {
      findings.push(finding("CONTENT_VISIBLE_PLACEHOLDER", "error", [page.route], { evidence: "Sichtbarer technischer Platzhalter im Hauptinhalt." }));
    }
    if (page.indexable && page.canonicalRoute && page.canonicalRoute !== page.route) {
      findings.push(finding("CONTENT_CANONICAL_PURPOSE_MISMATCH", "error", [page.route], {
        evidence: `Canonical zeigt auf ${page.canonicalRoute}.`
      }));
    }
    if (page.pageType === "product"
      && page.mainEntity
      && tokenCoverage(page.mainEntity, `${page.title} ${page.h1}`) < 0.7) {
      findings.push(finding("CONTENT_PRODUCT_REFERENCE_MISMATCH", "error", [page.route], {
        evidence: `Produktentität "${page.mainEntity}" stimmt nicht mit Title und H1 überein.`
      }));
    }
    if (page.pageType === "manufacturer"
      && page.mainEntity
      && tokenCoverage(page.mainEntity, `${page.title} ${page.h1}`) < 0.7) {
      findings.push(finding("CONTENT_MANUFACTURER_REFERENCE_MISMATCH", "error", [page.route], {
        evidence: `Herstellerentität "${page.mainEntity}" stimmt nicht mit Title und H1 überein.`
      }));
    }
    if (page.pageType === "comparison"
      && page.expectedComparisonCount > 0
      && page.renderedComparisonCount > 0
      && page.expectedComparisonCount !== page.renderedComparisonCount) {
      findings.push(finding("CONTENT_COMPARISON_COUNT_MISMATCH", "error", [page.route], {
        evidence: `Quelldaten nennen ${page.expectedComparisonCount} Vergleichsprodukte, gerendert erkannt wurden ${page.renderedComparisonCount}.`
      }));
    }
    if (page.searchIntent.primary === "medical-information"
      && /^\/(?:produkt|vergleiche)\//.test(page.topicOwner.route)) {
      findings.push(finding("CONTENT_HEALTH_INTENT_CONFLICT", "error", [page.route, page.topicOwner.route], {
        evidence: "Gesundheitlicher Ratgeber verweist auf einen kommerziellen Topic Owner."
      }));
    }
  }

  const indexable = pages.filter((page) => page.indexable);
  for (let leftIndex = 0; leftIndex < indexable.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < indexable.length; rightIndex += 1) {
      const left = indexable[leftIndex];
      const right = indexable[rightIndex];
      const allowed = allowedSeparation(left, right, config);
      const sameIntent = left.searchIntent.primary === right.searchIntent.primary;
      const sameType = left.pageType === right.pageType;
      const sameCluster = left.cluster === right.cluster;
      const exactTitle = normalizeText(left.title) && normalizeText(left.title) === normalizeText(right.title);
      const exactH1 = normalizeText(left.h1) && normalizeText(left.h1) === normalizeText(right.h1);
      const exactBody = left.wordCount > 80 && left._similarity.bodyHash === right._similarity.bodyHash;
      const productPair = left.pageType === "product" && right.pageType === "product";
      const nearThreshold = productPair ? thresholds.productNearDuplicate : thresholds.editorialNearDuplicate;
      const cheapMetrics = comparisonMetrics(left, right, false);
      const compareBody = exactBody || sameCluster || cheapMetrics.title >= 0.24 || cheapMetrics.entities >= 0.5;
      const metrics = compareBody ? comparisonMetrics(left, right) : cheapMetrics;

      if (exactTitle) findings.push(finding("CONTENT_TITLE_DUPLICATE", "error", [left.route, right.route], { metrics, evidence: "Exakt identische gerenderte Titles." }));
      if (exactH1) findings.push(finding("CONTENT_H1_DUPLICATE", "error", [left.route, right.route], { metrics, evidence: "Exakt identische gerenderte H1." }));
      if (exactBody) findings.push(finding("CONTENT_EXACT_DUPLICATE", "error", [left.route, right.route], { metrics, evidence: "Exakt identischer normalisierter Hauptinhalt." }));
      if (!compareBody && !exactTitle && !exactH1) continue;

      if (allowed) {
        if (metrics.combined >= 0.56) conflicts.push({
          id: `separated|${pairKey([left.route, right.route])}`,
          type: "intent-separation",
          severity: "info",
          routes: [left.route, right.route].sort(),
          pageTypes: [left.pageType, right.pageType],
          intents: [left.searchIntent.primary, right.searchIntent.primary],
          mainEntities: [left.mainEntity, right.mainEntity],
          titles: [left.title, right.title],
          h1: [left.h1, right.h1],
          metrics,
          topicOwners: [left.topicOwner.route, right.topicOwner.route],
          reason: allowed.reason,
          action: "DIFFERENTIATE",
          automatic: false,
          before: "similar-topics",
          after: "intentionally-separated"
        });
        continue;
      }

      if (metrics.combined >= nearThreshold && sameIntent && sameType && sameCluster) {
        const severity = metrics.combined >= 0.86 && !productPair ? "error" : "warning";
        findings.push(finding("CONTENT_NEAR_DUPLICATE", severity, [left.route, right.route], {
          metrics,
          evidence: `Kombinierte Ähnlichkeit ${metrics.combined}; gleicher Seitentyp, Intent und Cluster.`
        }));
        conflicts.push({
          id: `near-duplicate|${pairKey([left.route, right.route])}`,
          type: "exact-intent-conflict",
          severity,
          routes: [left.route, right.route].sort(),
          pageTypes: [left.pageType, right.pageType],
          intents: [left.searchIntent.primary, right.searchIntent.primary],
          mainEntities: [left.mainEntity, right.mainEntity],
          titles: [left.title, right.title],
          h1: [left.h1, right.h1],
          metrics,
          topicOwners: [left.topicOwner.route, right.topicOwner.route],
          reason: "Hohe Inhaltsähnlichkeit bei gleichem Seitentyp, Cluster und primärer Intention.",
          action: severity === "error" ? "CONSOLIDATE" : "MANUAL_REVIEW",
          automatic: false,
          before: "active",
          after: "open"
        });
      } else if (metrics.title >= thresholds.titleSimilarity && sameCluster) {
        findings.push(finding("CONTENT_TITLE_INTENT_MISMATCH", "warning", [left.route, right.route], {
          metrics,
          evidence: "Sehr ähnliche Suchdarstellung innerhalb desselben Clusters."
        }));
      }
    }
  }

  for (const consolidation of config.consolidations) {
    const fromActive = pageByRoute.has(consolidation.from);
    const redirectTarget = redirects.get(consolidation.from);
    const linksToOld = pages.filter((page) => page.outgoingRoutes.includes(consolidation.from)).map((page) => page.route);
    const resolved = !fromActive && redirectTarget === consolidation.to && linksToOld.length === 0;
    conflicts.push({
      id: consolidation.id,
      type: "exact-intent-conflict",
      severity: resolved ? "info" : "error",
      routes: [consolidation.from, consolidation.to],
      pageTypes: [pageByRoute.get(consolidation.from)?.pageType ?? "consolidated", pageByRoute.get(consolidation.to)?.pageType ?? "missing"],
      intents: [pageByRoute.get(consolidation.from)?.searchIntent?.primary ?? "commercial-investigation", pageByRoute.get(consolidation.to)?.searchIntent?.primary ?? "unknown"],
      mainEntities: [pageByRoute.get(consolidation.from)?.mainEntity ?? "GPS vs Bluetooth", pageByRoute.get(consolidation.to)?.mainEntity ?? ""],
      titles: [pageByRoute.get(consolidation.from)?.title ?? "", pageByRoute.get(consolidation.to)?.title ?? ""],
      h1: [pageByRoute.get(consolidation.from)?.h1 ?? "", pageByRoute.get(consolidation.to)?.h1 ?? ""],
      metrics: pageByRoute.has(consolidation.from) && pageByRoute.has(consolidation.to)
        ? comparisonMetrics(pageByRoute.get(consolidation.from), pageByRoute.get(consolidation.to))
        : null,
      topicOwners: [consolidation.to],
      reason: consolidation.reason,
      action: "CONSOLIDATE",
      automatic: true,
      before: "confirmed-duplicate",
      after: resolved ? "resolved" : "incomplete",
      redirect: { expected: consolidation.to, actual: redirectTarget ?? null },
      remainingInternalLinks: linksToOld
    });
    if (!resolved) {
      findings.push(finding("CONTENT_CONSOLIDATION_REDIRECT_MISSING", "error", [consolidation.from, consolidation.to], {
        evidence: fromActive
          ? "Konsolidierte Quellseite ist weiterhin indexierbar."
          : redirectTarget !== consolidation.to
            ? `Redirect fehlt oder zeigt auf ${redirectTarget ?? "kein Ziel"}.`
            : `Interne Links zeigen weiter auf die alte URL: ${linksToOld.join(", ")}.`
      }));
    }
  }

  const titleClaims = new Map();
  for (const owner of config.topicOwners) {
    const key = `${owner.cluster}|${owner.intent}|${owner.terms.map(normalizeText).sort().join("|")}`;
    const list = titleClaims.get(key) ?? [];
    list.push(owner);
    titleClaims.set(key, list);
  }
  for (const owners of titleClaims.values()) {
    if (owners.length > 1) {
      findings.push(finding("CONTENT_TOPIC_OWNER_CONFLICT", "error", owners.map((owner) => owner.route), {
        evidence: "Mehrere explizite Topic Owner beanspruchen dasselbe Cluster, denselben Intent und dieselben Begriffe."
      }));
    }
  }

  const decisionByRoute = new Map();
  for (const page of pages) {
    const pageFindings = findings.filter((item) => item.routes.includes(page.route));
    const conflict = conflicts.find((item) => item.routes.includes(page.route) && item.after === "open");
    let decision = page.indexable ? "KEEP" : "NOINDEX";
    let confidence = "high";
    let reason = page.indexable ? "Eigenständige, indexierbare Seitenrolle ohne bestätigten Konflikt." : "Technische oder bewusst nicht indexierbare Seite.";
    if (config.consolidations.some((item) => item.from === page.route)) {
      decision = "CONSOLIDATE";
      reason = "Bestätigtes Intent-Duplikat mit festgelegter Zielseite.";
    } else if (pageFindings.some((item) => item.code === "CONTENT_VISIBLE_PLACEHOLDER" || item.code === "CONTENT_EMPTY_MAIN")) {
      decision = "IMPROVE";
      reason = "Harter Inhaltsfehler auf der Seite.";
    } else if (conflict?.action === "MANUAL_REVIEW") {
      decision = "MANUAL_REVIEW";
      confidence = "medium";
      reason = conflict.reason;
    } else if (pageFindings.some((item) => item.code === "CONTENT_TITLE_INTENT_MISMATCH")) {
      decision = "DIFFERENTIATE";
      confidence = "medium";
      reason = "Suchdarstellung überschneidet sich mit einer ähnlichen Seite.";
    } else if (pageFindings.some((item) => item.severity === "warning")) {
      decision = "IMPROVE";
      confidence = "medium";
      reason = pageFindings.find((item) => item.severity === "warning")?.evidence ?? reason;
    }
    decisionByRoute.set(page.route, {
      route: page.route,
      decision,
      reason,
      confidence,
      conflictRoutes: [...new Set(pageFindings.flatMap((item) => item.routes).filter((route) => route !== page.route))],
      topicOwner: page.topicOwner.route,
      action: decision
    });
  }
  for (const consolidation of config.consolidations) {
    if (!decisionByRoute.has(consolidation.from)) {
      decisionByRoute.set(consolidation.from, {
        route: consolidation.from,
        decision: "CONSOLIDATE",
        reason: consolidation.reason,
        confidence: "high",
        conflictRoutes: [consolidation.to],
        topicOwner: consolidation.to,
        action: "Redirect und interne Links auf Zielinhaber"
      });
    }
  }

  return {
    findings: findings.sort((a, b) => a.severity.localeCompare(b.severity) || a.code.localeCompare(b.code) || a.id.localeCompare(b.id)),
    conflicts: conflicts.sort((a, b) => a.id.localeCompare(b.id)),
    decisions: [...decisionByRoute.values()].sort((a, b) => a.route.localeCompare(b.route, "de"))
  };
};

export const collectContentQuality = ({ appRoot, repoRoot, config }) => {
  const dist = path.join(appRoot, "dist");
  if (!fs.existsSync(dist)) throw new Error("Build-Ausgabe fehlt. Zuerst den PfotenTechnik-Build ausführen.");
  const sources = sourceDocuments(appRoot, repoRoot);
  const sourceByRoute = new Map(sources.map((source) => [source.route, source]));
  const sitemap = sitemapRoutes(dist);
  const redirects = readRedirects(appRoot);
  const searchFile = path.join(appRoot, "src/data/seo/search-dashboard-ranges.json");
  let searchData = { available: false, generatedAt: null, range: null, pageMetrics: new Map() };
  if (fs.existsSync(searchFile)) {
    try {
      const dashboard = JSON.parse(fs.readFileSync(searchFile, "utf8"));
      const rangeKey = dashboard.defaultRange && dashboard.ranges?.[dashboard.defaultRange]
        ? dashboard.defaultRange
        : Object.keys(dashboard.ranges ?? {})[0];
      const range = dashboard.ranges?.[rangeKey];
      searchData = {
        available: Boolean(range),
        generatedAt: dashboard.generatedAt ?? null,
        range: rangeKey ?? null,
        pageMetrics: new Map((range?.pages ?? []).map((item) => [normalizeRoute(item.page), {
          clicks: item.clicks ?? 0,
          impressions: item.impressions ?? 0,
          ctr: item.ctr ?? 0,
          position: item.position ?? 0
        }]))
      };
    } catch {
      searchData = { available: false, generatedAt: null, range: null, pageMetrics: new Map() };
    }
  }
  const pages = [];

  for (const file of walkFiles(dist).filter((item) => item.endsWith(".html"))) {
    const route = routeForDistFile(dist, file);
    const html = fs.readFileSync(file, "utf8");
    const source = sourceByRoute.get(route);
    const mainMatch = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
    const mainHtml = mainMatch?.[1] ?? html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? html;
    const mainText = stripMarkup(mainHtml);
    const title = tagValues(html, "title")[0] ?? source?.data?.seoTitle ?? source?.data?.title ?? "";
    const headings = [1, 2, 3, 4, 5, 6].flatMap((level) => tagValues(mainHtml, `h${level}`).map((text) => ({ level, text })));
    const h1Values = headings.filter((item) => item.level === 1).map((item) => item.text);
    const metaDescription = metaValue(html, "description") || source?.data?.seoDescription || source?.data?.description || "";
    const robots = metaValue(html, "robots").toLocaleLowerCase("de-DE");
    const indexable = !/(?:^|[,\s])noindex(?:[,\s]|$)/.test(robots)
      && !/^\/(?:admin|api)(?:\/|$)/.test(route)
      && !/^\/(?:404|500)\/$/.test(route);
    const pageType = inferPageType(route, source, title, mainText);
    const searchIntent = inferIntent(pageType, title, mainText, source?.explicitIntent);
    const cluster = inferCluster(route, title, source);
    const outgoingRoutes = [...new Set(internalLinks(mainHtml).filter((target) => target !== route))];
    const structuredData = [...new Set([...html.matchAll(/"@type"\s*:\s*"([^"]+)"/g)].map((match) => match[1]))];
    const countFrontmatterList = (raw, key) => {
      const lines = String(raw ?? "").split(/\r?\n/);
      const start = lines.findIndex((line) => new RegExp(`^\\s*${key}:\\s*$`).test(line));
      if (start < 0) return 0;
      const baseIndent = lines[start].match(/^\s*/)?.[0].length ?? 0;
      let count = 0;
      for (const line of lines.slice(start + 1)) {
        if (!line.trim()) continue;
        const indent = line.match(/^\s*/)?.[0].length ?? 0;
        if (indent <= baseIndent) break;
        if (indent === baseIndent + 2 && /^\s*-\s+/.test(line)) count += 1;
      }
      return count;
    };
    const pageBase = {
      route,
      sourceFile: source?.sourceFile ?? path.relative(repoRoot, file).replace(/\\/g, "/"),
      collection: source?.collection ?? "static",
      pageType,
      title,
      h1: h1Values[0] ?? "",
      h1Count: h1Values.length,
      metaTitle: title,
      metaDescription,
      canonical: canonicalValue(html),
      canonicalRoute: normalizeRoute(canonicalValue(html)),
      indexable,
      inSitemap: sitemap.has(route),
      publishedAt: String(source?.data?.publishedAt ?? ""),
      updatedAt: String(source?.data?.updatedAt ?? ""),
      author: source?.author ?? "",
      cluster,
      searchIntent,
      secondaryIntents: [],
      mainEntity: source?.data?.name || source?.data?.title || h1Values[0] || title,
      animal: inferAnimal(title, mainText, source),
      productCategory: inferProductCategory(cluster, title),
      audience: inferAnimal(title, mainText, source) || "pet-owners",
      character: ["comparison", "product", "manufacturer", "decision-guide"].includes(pageType) ? "commercial" : "informational",
      internalIncomingLinks: 0,
      internalOutgoingLinks: outgoingRoutes.length,
      outgoingRoutes,
      linkDepth: null,
      wordCount: normalizeText(mainText).split(" ").filter(Boolean).length,
      headingCount: headings.length,
      headings: headings.map((item) => item.text),
      headingStructure: headings,
      structuredData,
      recommendationTypes: [
        /\bTop-Empfehlung\b/i.test(mainText) ? "top-recommendation" : "",
        /\bAlternative\b/i.test(mainText) ? "alternatives" : "",
        /\bVergleichssieger\b/i.test(mainText) ? "comparison-winner" : ""
      ].filter(Boolean),
      relatedProducts: [...new Set(outgoingRoutes.filter((target) => target.startsWith("/produkt/")))],
      relatedComparisons: [...new Set(outgoingRoutes.filter((target) => target.startsWith("/vergleiche/")))],
      searchPerformance: searchData.pageMetrics.get(route) ?? null,
      expectedComparisonCount: pageType === "comparison" ? countFrontmatterList(source?.rawFrontmatter, "items") : 0,
      renderedComparisonCount: pageType === "comparison"
        ? Number(html.match(/"numberOfItems"\s*:\s*(\d+)/)?.[1] ?? 0)
        : 0,
      mainText,
      features: {
        tables: /<table\b/i.test(mainHtml),
        faq: /\bFAQ\b|Häufige Fragen|FAQPage/i.test(`${mainText} ${structuredData.join(" ")}`),
        decisionSupport: /\b(?:Entscheidung|Checkliste|geeignet|Kaufberatung|Vergleich)\b/i.test(mainText)
      }
    };
    const page = preparePageForAnalysis(pageBase, config);
    page.secondaryIntents = secondaryIntents(page);
    page.topicOwner = topicOwnerFor(page, config);
    page.quality = qualityFor(page);
    page._similarity.entities = textTokens(`${page.mainEntity} ${page.cluster}`);
    pages.push(page);
  }

  const byRoute = new Map(pages.map((page) => [page.route, page]));
  for (const page of pages) {
    for (const target of page.outgoingRoutes) {
      const targetPage = byRoute.get(target);
      if (targetPage) targetPage.internalIncomingLinks += 1;
    }
  }
  const queue = [{ route: "/", depth: 0 }];
  const depths = new Map();
  while (queue.length) {
    const current = queue.shift();
    if (depths.has(current.route) && depths.get(current.route) <= current.depth) continue;
    depths.set(current.route, current.depth);
    const page = byRoute.get(current.route);
    if (!page) continue;
    for (const target of page.outgoingRoutes) if (byRoute.has(target)) queue.push({ route: target, depth: current.depth + 1 });
  }
  for (const page of pages) page.linkDepth = depths.get(page.route) ?? null;

  const analysis = analysePages({ pages, config, redirects, sitemap });
  return {
    pages: pages.sort((a, b) => a.route.localeCompare(b.route, "de")),
    ...analysis,
    searchData: {
      available: searchData.available,
      generatedAt: searchData.generatedAt,
      range: searchData.range,
      matchedPages: pages.filter((page) => page.searchPerformance).length
    },
    sitemap,
    redirects
  };
};

#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { composeTrafficOpportunities } from "../../src/lib/seo/traffic-opportunities.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, "../..");
const repoRoot = path.resolve(appRoot, "../..");
const distRoot = path.join(appRoot, "dist");
const outputArgument = process.argv.indexOf("--out");
const outputRoot = outputArgument >= 0 && process.argv[outputArgument + 1]
  ? path.resolve(appRoot, process.argv[outputArgument + 1])
  : path.join(appRoot, "reports/seo-rebaseline-current");
const CATEGORY_HUB_ROUTES = new Set([
  "/automatische-katzentoiletten/",
  "/gps-tracker/",
  "/haustierkameras/",
  "/katzenklappen/",
  "/smarte-futterautomaten/",
  "/trinkbrunnen/",
]);

const readJson = (file, fallback = null) => {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
};

const walk = (directory, output = []) => {
  if (!fs.existsSync(directory)) return output;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file, output);
    else output.push(file);
  }
  return output;
};

const decodeEntities = (value) => String(value ?? "")
  .replace(/&#(\d+);/g, (_, number) => String.fromCodePoint(Number(number)))
  .replace(/&#x([0-9a-f]+);/gi, (_, number) => String.fromCodePoint(parseInt(number, 16)))
  .replace(/&amp;/gi, "&")
  .replace(/&quot;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/&lt;/gi, "<")
  .replace(/&gt;/gi, ">");

const normalizeRoute = (value) => {
  if (!value) return "/";
  try {
    const url = new URL(String(value), "https://pfotentechnik.de/");
    if (!new Set(["pfotentechnik.de", "www.pfotentechnik.de"]).has(url.hostname)) return "";
    let route = decodeURI(url.pathname).replace(/\\/g, "/").replace(/\/{2,}/g, "/");
    if (route !== "/" && !path.posix.extname(route) && !route.endsWith("/")) route += "/";
    return route || "/";
  } catch {
    return "";
  }
};

const routeForFile = (file) => {
  const relative = path.relative(distRoot, file).replace(/\\/g, "/");
  if (relative === "index.html") return "/";
  if (relative.endsWith("/index.html")) return `/${relative.slice(0, -11)}/`;
  return `/${relative.replace(/\.html$/i, "")}/`;
};

const attributes = (markup) => Object.fromEntries(
  [...String(markup).matchAll(/([:\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)]
    .map((match) => [match[1].toLowerCase(), decodeEntities(match[2] ?? match[3] ?? match[4] ?? "")])
);

const tagContent = (html, tag) =>
  [...html.matchAll(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi"))]
    .map((match) => decodeEntities(match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()));

const metaContent = (html, name) => {
  for (const match of html.matchAll(/<meta\b([^>]*)>/gi)) {
    const attrs = attributes(match[1]);
    if ((attrs.name || attrs.property || "").toLowerCase() === name.toLowerCase()) return attrs.content || "";
  }
  return "";
};

const canonical = (html) => {
  for (const match of html.matchAll(/<link\b([^>]*)>/gi)) {
    const attrs = attributes(match[1]);
    if ((attrs.rel || "").toLowerCase().split(/\s+/).includes("canonical")) return attrs.href || "";
  }
  return "";
};

const section = (html, tag) => html.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"))?.[1] ?? "";

const linksIn = (html) => {
  const links = new Set();
  for (const match of html.matchAll(/<a\b([^>]*)>/gi)) {
    const href = attributes(match[1]).href;
    if (!href || href.startsWith("#") || /^(?:mailto:|tel:|javascript:|data:)/i.test(href)) continue;
    const route = normalizeRoute(href);
    if (route && !path.posix.extname(route)) links.add(route);
  }
  return [...links];
};

const schemaValues = (html) => {
  const values = [];
  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      values.push(JSON.parse(match[1].trim()));
    } catch {
      values.push({ "@type": "__INVALID_JSON_LD__" });
    }
  }
  return values;
};

const schemaTypes = (value, output = new Set(), seen = new Set()) => {
  if (!value || typeof value !== "object" || seen.has(value)) return output;
  seen.add(value);
  if (Array.isArray(value)) {
    for (const item of value) schemaTypes(item, output, seen);
    return output;
  }
  const type = value["@type"];
  for (const item of Array.isArray(type) ? type : type ? [type] : []) output.add(item);
  for (const child of Object.values(value)) schemaTypes(child, output, seen);
  return output;
};

const parseRedirects = () => {
  const file = path.join(appRoot, "public/_redirects");
  const redirects = new Map();
  if (!fs.existsSync(file)) return redirects;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 3 || !/^30[1278]$/.test(parts[2])) continue;
    const from = normalizeRoute(parts[0]);
    const to = normalizeRoute(parts[1]);
    if (from && to) redirects.set(from, { target: to, status: Number(parts[2]) });
  }
  return redirects;
};

const resolveRedirect = (route, redirects) => {
  let current = route;
  const chain = [];
  const seen = new Set();
  while (redirects.has(current) && !seen.has(current)) {
    seen.add(current);
    chain.push(current);
    current = redirects.get(current).target;
  }
  return { target: current, chain, loop: seen.has(current) };
};

const tokenize = (value) => new Set(
  decodeEntities(value).toLocaleLowerCase("de-DE").replace(/[^\p{L}\p{N}]+/gu, " ").trim().split(/\s+/).filter((token) => token.length > 2)
);

const overlap = (left, right) => {
  const a = tokenize(left);
  const b = tokenize(right);
  if (!a.size || !b.size) return 0;
  return Number(([...a].filter((token) => b.has(token)).length / Math.min(a.size, b.size)).toFixed(3));
};

const inventory = readJson(path.join(appRoot, "reports/content-quality/content-inventory.json"), { pages: [] });
const inventoryByRoute = new Map((inventory.pages ?? []).map((page) => [page.route, page]));
const redirects = parseRedirects();
const sitemapXml = walk(distRoot)
  .filter((file) => /sitemap.*\.xml$/i.test(path.basename(file)))
  .map((file) => fs.readFileSync(file, "utf8"))
  .join("\n");
const sitemapRoutes = new Set(
  [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((match) => normalizeRoute(match[1]))
    .filter((route) => route && !path.posix.extname(route))
);

const htmlFiles = walk(distRoot).filter((file) => file.endsWith(".html"));
const pages = htmlFiles.map((file) => {
  const html = fs.readFileSync(file, "utf8");
  const route = routeForFile(file);
  const header = section(html, "header");
  const main = section(html, "main");
  const footer = section(html, "footer");
  const title = tagContent(html, "title")[0] ?? "";
  const h1s = tagContent(main || html, "h1");
  const description = metaContent(html, "description");
  const robots = metaContent(html, "robots").toLowerCase();
  const canonicalRaw = canonical(html);
  const canonicalRoute = normalizeRoute(canonicalRaw);
  const noindex = /(?:^|[,\s])noindex(?:[,\s]|$)/.test(robots);
  const schemas = schemaValues(html);
  const types = [...schemas.reduce((set, value) => schemaTypes(value, set), new Set())].sort();
  const images = [...html.matchAll(/<img\b([^>]*)>/gi)]
    .map((match) => attributes(match[1]))
    .filter((image) => !("data-lightbox-image" in image));
  const inventoryPage = inventoryByRoute.get(route);
  const role = CATEGORY_HUB_ROUTES.has(route) ? "category-hub"
    : inventoryPage?.pageType === "category-hub" ? "secondary-hub"
      : inventoryPage?.pageType
    ?? (route.startsWith("/admin/") ? "admin" : ["/404/", "/500/"].includes(route) ? "error" : "utility");
  const inSitemap = sitemapRoutes.has(route);
  const indexability = inSitemap && !noindex ? "INDEXABLE"
    : ["/404/", "/500/"].includes(route) ? "ERROR"
      : "NOINDEX_INTENTIONAL";
  return {
    route,
    file,
    role,
    indexability,
    inSitemap,
    noindex,
    robots,
    title,
    description,
    h1s,
    canonical: canonicalRaw,
    canonicalRoute,
    schemaTypes: types,
    invalidSchema: types.includes("__INVALID_JSON_LD__"),
    fullLinks: linksIn(html),
    meaningfulLinks: [...new Set([...linksIn(header), ...linksIn(main)])],
    footerLinks: linksIn(footer),
    images,
    quality: inventoryPage?.quality ?? null,
    primaryIntent: inventoryPage?.searchIntent?.primary ?? "utility",
    wordCount: inventoryPage?.wordCount ?? 0,
  };
});

const allRoutes = new Set(pages.map((page) => page.route));
const indexablePages = pages.filter((page) => page.indexability === "INDEXABLE");
const indexableRoutes = new Set(indexablePages.map((page) => page.route));
const pageByRoute = new Map(pages.map((page) => [page.route, page]));
const incomingAny = new Map(indexablePages.map((page) => [page.route, new Set()]));
const incomingMeaningful = new Map(indexablePages.map((page) => [page.route, new Set()]));
const meaningfulEdges = [];
const anyEdges = [];

for (const page of indexablePages) {
  for (const target of page.fullLinks) {
    if (!indexableRoutes.has(target) || target === page.route) continue;
    incomingAny.get(target).add(page.route);
    anyEdges.push([page.route, target]);
  }
  for (const target of page.meaningfulLinks) {
    if (!indexableRoutes.has(target) || target === page.route) continue;
    incomingMeaningful.get(target).add(page.route);
    meaningfulEdges.push([page.route, target]);
  }
}

const uniqueEdges = (edges) => [...new Map(edges.map((edge) => [edge.join("\u0000"), edge])).values()]
  .sort(([leftSource, leftTarget], [rightSource, rightTarget]) =>
    leftSource.localeCompare(rightSource, "de") || leftTarget.localeCompare(rightTarget, "de"));
const graphEdges = uniqueEdges(meaningfulEdges);
const fullEdges = uniqueEdges(anyEdges);
const adjacency = new Map(indexablePages.map((page) => [page.route, []]));
for (const [source, target] of graphEdges) adjacency.get(source).push(target);

const depths = new Map([["/", 0]]);
const queue = ["/"];
while (queue.length) {
  const source = queue.shift();
  for (const target of adjacency.get(source) ?? []) {
    if (depths.has(target)) continue;
    depths.set(target, depths.get(source) + 1);
    queue.push(target);
  }
}

const graphNodes = indexablePages.map((page) => {
  const any = incomingAny.get(page.route)?.size ?? 0;
  const meaningful = incomingMeaningful.get(page.route)?.size ?? 0;
  const depth = depths.get(page.route) ?? null;
  const linkClass = page.route === "/" ? "ADEQUATELY_LINKED"
    : page.role === "legal" && any > 0 ? "INTENTIONALLY_ISOLATED_UTILITY"
    : any === 0 ? "TRUE_ORPHAN"
      : meaningful <= 1 || depth === null || depth >= 4 ? "WEAKLY_LINKED"
        : "ADEQUATELY_LINKED";
  return {
    route: page.route,
    pageType: page.role,
    title: page.title,
    primaryIntent: page.primaryIntent,
    incomingAny: any,
    incomingMeaningful: meaningful,
    outgoingMeaningful: (adjacency.get(page.route) ?? []).length,
    depth,
    linkClass,
  };
}).sort((left, right) => left.route.localeCompare(right.route, "de"));

const duplicateGroups = (key) => {
  const groups = new Map();
  for (const page of indexablePages) {
    const value = page[key].trim().toLocaleLowerCase("de-DE");
    if (!value) continue;
    const routes = groups.get(value) ?? [];
    routes.push(page.route);
    groups.set(value, routes);
  }
  return [...groups.entries()].filter(([, routes]) => routes.length > 1).map(([value, routes]) => ({ value, routes }));
};

const metadataFindings = indexablePages.flatMap((page) => [
  ...(!page.title ? [{ severity: "error", code: "TITLE_MISSING", route: page.route }] : []),
  ...(!page.description ? [{ severity: "error", code: "DESCRIPTION_MISSING", route: page.route }] : []),
  ...(page.h1s.length === 0 ? [{ severity: "error", code: "H1_MISSING", route: page.route }] : []),
  ...(page.h1s.length > 1 ? [{ severity: "error", code: "MULTIPLE_H1", route: page.route, count: page.h1s.length }] : []),
  ...(!page.canonicalRoute ? [{ severity: "error", code: "CANONICAL_MISSING", route: page.route }] : []),
  ...(page.canonicalRoute && page.canonicalRoute !== page.route
    ? [{ severity: "error", code: "CANONICAL_MISMATCH", route: page.route, canonical: page.canonicalRoute }]
    : []),
]);

const duplicateCanonicalTargets = [...indexablePages.reduce((groups, page) => {
  const routes = groups.get(page.canonicalRoute) ?? [];
  routes.push(page.route);
  groups.set(page.canonicalRoute, routes);
  return groups;
}, new Map()).entries()].filter(([target, routes]) => target && routes.length > 1).map(([target, routes]) => ({ target, routes }));

const mediaFindings = [];
let imageCount = 0;
let missingAlt = 0;
let missingDimensions = 0;
let brokenLocal = 0;
for (const page of indexablePages) {
  for (const image of page.images) {
    imageCount += 1;
    if (!("alt" in image)) {
      missingAlt += 1;
      mediaFindings.push({ severity: "warning", code: "ALT_ATTRIBUTE_MISSING", route: page.route, src: image.src ?? "" });
    }
    if (!image.width || !image.height) {
      missingDimensions += 1;
      mediaFindings.push({ severity: "warning", code: "IMAGE_DIMENSIONS_MISSING", route: page.route, src: image.src ?? "" });
    }
    const src = image.src ?? "";
    if (src.startsWith("/") && !src.startsWith("//")) {
      const local = path.join(distRoot, decodeURI(src).replace(/^\//, ""));
      if (!fs.existsSync(local)) {
        brokenLocal += 1;
        mediaFindings.push({ severity: "error", code: "LOCAL_IMAGE_MISSING", route: page.route, src });
      }
    }
  }
}

const depthDistribution = Object.fromEntries([1, 2, 3, 4, "5+", "unreachable"].map((label) => [label, 0]));
const depthByPageType = {};
for (const node of graphNodes) {
  const label = node.depth === null ? "unreachable" : node.depth >= 5 ? "5+" : String(node.depth);
  if (node.route !== "/") depthDistribution[label] = (depthDistribution[label] ?? 0) + 1;
  depthByPageType[node.pageType] ??= Object.fromEntries([1, 2, 3, 4, "5+", "unreachable"].map((item) => [item, 0]));
  if (node.route !== "/") depthByPageType[node.pageType][label] = (depthByPageType[node.pageType][label] ?? 0) + 1;
}

const roleCounts = Object.fromEntries([...indexablePages.reduce((map, page) => {
  map.set(page.role, (map.get(page.role) ?? 0) + 1);
  return map;
}, new Map()).entries()].sort(([left], [right]) => left.localeCompare(right, "de")));

const redirectInventory = [...redirects.entries()].map(([source, value]) => {
  const resolved = resolveRedirect(source, redirects);
  return { source, target: value.target, finalTarget: resolved.target, status: value.status, chainLength: resolved.chain.length, loop: resolved.loop };
}).sort((left, right) => left.source.localeCompare(right.source, "de"));

const graphReport = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  source: "fresh Astro production dist; rendered anchors; existing content-quality page roles",
  indexability: {
    generatedHtml: pages.length,
    indexable: indexablePages.length,
    noindexIntentional: pages.filter((page) => page.indexability === "NOINDEX_INTENTIONAL").length,
    errors: pages.filter((page) => page.indexability === "ERROR").length,
    sitemapUrls: sitemapRoutes.size,
    redirects: redirectInventory.length,
    roleCounts,
    duplicateCanonicalTargets,
  },
  metadata: {
    findings: metadataFindings,
    duplicateTitles: duplicateGroups("title"),
    duplicateDescriptions: duplicateGroups("description"),
    titleH1LowOverlap: indexablePages
      .map((page) => ({ route: page.route, overlap: overlap(page.title, page.h1s[0] ?? ""), title: page.title, h1: page.h1s[0] ?? "" }))
      .filter((item) => item.overlap < 0.25),
  },
  schema: {
    invalidJsonLd: indexablePages.filter((page) => page.invalidSchema).map((page) => page.route),
    typeCounts: Object.fromEntries([...indexablePages.reduce((map, page) => {
      for (const type of page.schemaTypes) map.set(type, (map.get(type) ?? 0) + 1);
      return map;
    }, new Map()).entries()].sort(([left], [right]) => left.localeCompare(right, "de"))),
  },
  media: { imageCount, missingAlt, missingDimensions, brokenLocal, findings: mediaFindings },
  graph: {
    nodes: graphNodes.length,
    meaningfulEdges: graphEdges.length,
    allDocumentEdges: fullEdges.length,
    trueOrphans: graphNodes.filter((node) => node.linkClass === "TRUE_ORPHAN").map((node) => node.route),
    weaklyLinked: graphNodes.filter((node) => node.linkClass === "WEAKLY_LINKED").map((node) => node.route),
    intentionallyIsolatedUtility: graphNodes.filter((node) => node.linkClass === "INTENTIONALLY_ISOLATED_UTILITY").map((node) => node.route),
    adequatelyLinked: graphNodes.filter((node) => node.linkClass === "ADEQUATELY_LINKED").length,
    depthDistribution,
    depthByPageType,
  },
  redirects: redirectInventory,
  nonIndexableRoutes: pages.filter((page) => page.indexability !== "INDEXABLE").map((page) => ({
    route: page.route,
    pageType: page.role,
    indexability: page.indexability,
    robots: page.robots,
  })),
  nodes: graphNodes,
  edges: graphEdges,
};

const gscRanges = readJson(path.join(appRoot, "src/data/seo/gsc-dashboard-ranges.json"), { ranges: {} });
const currentRange = gscRanges.ranges?.["28d"] ?? null;
const supportRange = gscRanges.ranges?.["3m"] ?? currentRange;
const recovery = readJson(path.join(appRoot, "reports/seo-recovery/recovery-latest.json"), {});
const linkHealth = readJson(path.join(appRoot, "reports/internal-linking/internal-link-health-audit.json"), {});
const demandDepth = readJson(path.join(repoRoot, "reports/demand-discovery/demand-depth-program-04.json"), {});
const demandMatching = readJson(path.join(appRoot, "reports/demand-discovery/demand-matching.json"), {});
const evidence = readJson(path.join(appRoot, "reports/product-evidence/latest.json"), { rows: [] });
const evidenceByRoute = new Map((evidence.rows ?? []).map((item) => [`/produkt/${item.slug}/`, item]));
const currentByRoute = new Map((currentRange?.pages ?? []).map((item) => [normalizeRoute(item.page), item]));
const supportByRoute = new Map((supportRange?.pages ?? []).map((item) => [normalizeRoute(item.page), item]));
const composer = composeTrafficOpportunities({ range: supportRange, recovery, linkHealth, demand: demandDepth });
const bestComposerByPage = new Map();
for (const item of composer) {
  if (!indexableRoutes.has(item.page)) continue;
  const current = bestComposerByPage.get(item.page);
  if (!current || item.score > current.score) bestComposerByPage.set(item.page, item);
}
const demandByOwner = new Map();
for (const item of demandMatching.matches ?? []) {
  const route = normalizeRoute(item.intentOwner);
  const values = demandByOwner.get(route) ?? [];
  values.push(item);
  demandByOwner.set(route, values);
}

const opportunityZone = (metrics, composed) => {
  if (!metrics || metrics.impressions < 10) return composed?.zone === "EMERGING" ? "ZONE D — DISCOVERY" : "ZONE E — LOW DATA";
  if (metrics.clicks > 0 && (metrics.ctr >= 2.5 || metrics.position <= 3)) return "ZONE F — DEFENSIVE";
  if (metrics.position > 3 && metrics.position <= 15 && metrics.ctr < 2.5 && metrics.impressions >= 20) return "ZONE B — CTR OPPORTUNITY";
  if (metrics.position > 3 && metrics.position <= 15) return "ZONE A — STRIKING DISTANCE";
  if (metrics.position > 15 && metrics.position <= 25) return "ZONE C — PAGE-2 OPPORTUNITY";
  return "ZONE D — DISCOVERY";
};

const candidates = indexablePages.map((page) => {
  const support = supportByRoute.get(page.route) ?? null;
  const current = currentByRoute.get(page.route) ?? null;
  const composed = bestComposerByPage.get(page.route) ?? null;
  const evidenceRow = evidenceByRoute.get(page.route) ?? null;
  const node = graphNodes.find((item) => item.route === page.route);
  const demand = demandByOwner.get(page.route) ?? [];
  const zone = opportunityZone(support, composed);
  const authorityGap = node?.linkClass === "TRUE_ORPHAN" || node?.linkClass === "WEAKLY_LINKED";
  const evidenceGap = evidenceRow && evidenceRow.status !== "complete";
  const demandScore = support ? Math.min(20, Math.round(Math.log1p(support.impressions) * 5)) : 0;
  const rankScore = support?.position > 3 && support.position <= 15 ? 25 : support?.position <= 25 ? 18 : support?.position <= 50 ? 8 : 0;
  const score = (composed?.score ?? 0) + demandScore + rankScore + (authorityGap ? 8 : 0) + (evidenceGap ? 5 : 0);
  const query = composed?.query;
  return { page, support, current, composed, evidenceRow, node, demand, zone, authorityGap, evidenceGap, score, query };
}).filter((item) => item.support || item.current || item.authorityGap || item.evidenceGap);

const actionable = candidates
  .filter((item) => item.zone !== "ZONE F — DEFENSIVE")
  .sort((left, right) => {
    const tier = (item) => item.zone.includes("CTR") || item.zone.includes("STRIKING") ? 0
      : item.zone.includes("PAGE-2") ? 1
        : item.zone.includes("DISCOVERY") && (item.support?.impressions ?? 0) >= 10 ? 2
          : item.authorityGap && (item.support?.impressions ?? 0) >= 3 ? 3
            : item.evidenceGap && (item.support?.impressions ?? 0) >= 3 ? 4
              : 5;
    return tier(left) - tier(right)
      || right.score - left.score
      || (right.support?.impressions ?? 0) - (left.support?.impressions ?? 0)
      || left.page.route.localeCompare(right.page.route, "de");
  })
  .slice(0, 15);

const opportunityRecords = actionable.map((item, index) => {
  const { page, support, current, evidenceRow, node, demand, zone, authorityGap, evidenceGap, query } = item;
  const priority = index < 5 ? "P1" : index < 10 ? "P2" : "P3";
  const observed = [
    zone.includes("CTR") ? "Sufficient supporting-period impressions at positions 4–15 with CTR below the existing Traffic Leverage threshold."
      : zone.includes("STRIKING") ? "Sufficient supporting-period impressions within striking distance; intent/snippet fit needs focused review."
        : zone.includes("PAGE-2") ? "Meaningful supporting-period demand on page two."
          : zone.includes("DISCOVERY") ? "Demand is visible, but ranking or current-period volume is not yet strong enough for broad intervention."
            : "Insufficient data for a confident content change.",
    ...(authorityGap ? ["Rendered graph shows weak meaningful internal authority."] : []),
    ...(evidenceGap ? [`Product evidence is ${evidenceRow.status}; missing: ${evidenceRow.missingParts.join(", ")}.`] : []),
  ].join(" ");
  const change = authorityGap
    ? "Review one natural same-cluster parent and add a contextual main-content link only if it improves the user journey."
    : evidenceGap
      ? "Research and close the decision-critical evidence gap; preserve unknowns where sources remain unavailable."
      : zone.includes("CTR") || zone.includes("STRIKING")
        ? "Review query-to-title/H1/intro alignment and snippet promise; change only the smallest element with a demonstrated mismatch."
        : zone.includes("PAGE-2")
          ? "Compare the visible answer and decision depth with the ranking intent; strengthen the existing page before considering a new URL."
          : "Observe the next data window and make only a tightly scoped intent or evidence improvement if the signal persists.";
  return {
    id: `SEO345-${String(index + 1).padStart(2, "0")}`,
    url: page.route,
    pageType: page.role,
    primaryIntent: page.primaryIntent,
    zone,
    score: item.score,
    queryOrDemandSignal: query || demand.map((entry) => entry.userProblem).slice(0, 2).join(" | ") || "Page-level search performance",
    currentPerformance: {
      current28d: current ? { clicks: current.clicks, impressions: current.impressions, ctr: current.ctr, position: current.position } : null,
      supporting3m: support ? { clicks: support.clicks, impressions: support.impressions, ctr: support.ctr, position: support.position } : null,
      lowData: (current?.impressions ?? 0) < 10,
    },
    observedProblem: observed,
    evidence: [
      ...(current ? [`GSC 28d: ${current.impressions} impressions, ${current.clicks} clicks, position ${current.position}.`] : []),
      ...(support ? [`GSC 3m: ${support.impressions} impressions, ${support.clicks} clicks, position ${support.position}.`] : []),
      ...(query ? [`Existing Traffic Leverage query signal: ${query}.`] : []),
      ...(demand.length ? [`Demand Discovery: ${demand.map((entry) => entry.status).join(", ")}.`] : []),
      ...(authorityGap ? [`Rendered link class: ${node.linkClass}; ${node.incomingMeaningful} meaningful incoming links.`] : []),
      ...(evidenceRow ? [`Evidence status: ${evidenceRow.status}.`] : []),
    ],
    whyItMatters: "This combines observed search demand with the current page's intent, authority, and evidence state; it is a prioritization signal, not a ranking promise.",
    recommendedChange: change,
    expectedMechanism: authorityGap ? "more coherent crawl and decision path"
      : evidenceGap ? "stronger evidence and decision trust"
        : zone.includes("CTR") ? "closer snippet/intent match"
          : zone.includes("STRIKING") ? "closer intent match"
            : "stronger existing-page coverage",
    risk: page.role === "product" || page.role === "comparison" ? "medium — frozen commercial experience" : "low-medium",
    effort: evidenceGap ? "medium" : authorityGap ? "small" : "small-medium",
    confidence: support?.impressions >= 20 ? "medium" : support?.impressions >= 10 ? "medium-low" : "low",
    priority,
    measurementPlan: "After implementation, compare the next complete 28-day window with this baseline; require at least 20 impressions before interpreting CTR or position movement.",
  };
});

const opportunityReport = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  model: "existing Traffic Leverage composer enriched with rendered graph, current Evidence, Demand Discovery, and 28d/3m page sufficiency",
  dataPeriod: {
    current: currentRange ? { startDate: currentRange.startDate, endDate: currentRange.endDate, lowData: currentRange.lowData } : null,
    supporting: supportRange ? { startDate: supportRange.startDate, endDate: supportRange.endDate, lowData: supportRange.lowData } : null,
  },
  safeguards: {
    currentLowData: true,
    minimumQueryImpressionsForStrike: 10,
    minimumPageImpressionsForInterpretation: 10,
    noAutomaticTitleRewrite: true,
    noAutomaticNewPage: true,
  },
  summary: Object.fromEntries([
    "ZONE A — STRIKING DISTANCE",
    "ZONE B — CTR OPPORTUNITY",
    "ZONE C — PAGE-2 OPPORTUNITY",
    "ZONE D — DISCOVERY",
    "ZONE E — LOW DATA",
    "ZONE F — DEFENSIVE",
  ].map((zone) => [zone, candidates.filter((item) => item.zone === zone).length])),
  opportunities: opportunityRecords,
};

fs.mkdirSync(outputRoot, { recursive: true });
fs.writeFileSync(path.join(outputRoot, "internal-link-graph.json"), `${JSON.stringify(graphReport, null, 2)}\n`, "utf8");
fs.writeFileSync(path.join(outputRoot, "opportunity-queue.json"), `${JSON.stringify(opportunityReport, null, 2)}\n`, "utf8");

console.log("Production SEO baseline generated");
console.log(`HTML: ${pages.length}; indexable: ${indexablePages.length}; noindex: ${pages.length - indexablePages.length}`);
console.log(`Sitemap: ${sitemapRoutes.size}; redirects: ${redirectInventory.length}`);
console.log(`Graph: ${graphNodes.length} nodes; ${graphEdges.length} meaningful edges; ${fullEdges.length} all-document edges`);
console.log(`True orphans: ${graphReport.graph.trueOrphans.length}; weakly linked: ${graphReport.graph.weaklyLinked.length}`);
console.log(`Metadata findings: ${metadataFindings.length}; invalid JSON-LD: ${graphReport.schema.invalidJsonLd.length}`);
console.log(`Images: ${imageCount}; broken: ${brokenLocal}; missing alt: ${missingAlt}; missing dimensions: ${missingDimensions}`);
console.log(`Opportunities: ${opportunityRecords.length}`);
console.log(`Output: ${path.relative(repoRoot, outputRoot)}`);

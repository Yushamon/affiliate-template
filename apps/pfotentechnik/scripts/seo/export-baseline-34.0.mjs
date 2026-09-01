#!/usr/bin/env node
/*
 * 34.0 report exporter: serializes the already generated static output.
 * It deliberately does not decide SEO quality; existing audit commands do
 * that. The output is a reproducible route-level baseline for later deltas.
 */
import fs from "node:fs";
import path from "node:path";

const appRoot = path.resolve(".");
const distRoot = path.join(appRoot, "dist");
const reportRoot = path.join(appRoot, "reports", "seo-baseline-34.0");
const origin = "https://pfotentechnik.de";

const htmlFiles = [];
const visit = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) visit(file);
    else if (entry.name === "index.html") htmlFiles.push(file);
  }
};

const decode = (value = "") => value
  .replaceAll("&amp;", "&")
  .replaceAll("&quot;", '"')
  .replaceAll("&#39;", "'")
  .replaceAll("&nbsp;", " ");
const text = (value = "") => decode(value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
const match = (source, expression) => source.match(expression)?.[1] ?? "";
const typeFor = (route) => {
  if (route === "/") return "homepage";
  if (route.startsWith("/produkt/")) return "product";
  if (route.startsWith("/vergleiche/") && route !== "/vergleiche/") return "comparison";
  if (["/smarte-futterautomaten/", "/trinkbrunnen/", "/gps-tracker/", "/katzenklappen/", "/haustierkameras/", "/automatische-katzentoiletten/"].includes(route)) return "category-hub";
  if (route.startsWith("/hersteller/")) return route === "/hersteller/" ? "manufacturer-hub" : "manufacturer";
  if (route.startsWith("/admin/") || ["/foundation/", "/404/", "/500/"].includes(route)) return "functional";
  if (["/affiliate-hinweis/", "/datenschutz/", "/impressum/", "/kontakt/", "/redaktion/", "/kaufberatung/"].includes(route)) return "other-editorial";
  return "guide";
};
const normalRoute = (value) => {
  if (!value || /^(mailto:|tel:|javascript:|#)/i.test(value)) return null;
  try {
    const url = new URL(value, origin);
    if (url.origin !== origin) return null;
    return url.pathname === "/" ? "/" : `${url.pathname.replace(/\/+$/, "")}/`;
  } catch { return null; }
};
const parseSchema = (source) => [...source.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  .flatMap((entry) => {
    try {
      const parsed = JSON.parse(entry[1]);
      const nodes = Array.isArray(parsed) ? parsed : parsed["@graph"] ?? [parsed];
      return nodes.flatMap((node) => Array.isArray(node?.["@type"]) ? node["@type"] : [node?.["@type"]]).filter(Boolean);
    } catch { return ["INVALID_JSON_LD"]; }
  });

visit(distRoot);
const routes = htmlFiles.map((file) => {
  const relative = path.relative(distRoot, path.dirname(file)).split(path.sep).join("/");
  const route = relative ? `/${relative}/` : "/";
  const source = fs.readFileSync(file, "utf8");
  const schemaTypes = [...new Set(parseSchema(source))];
  const images = [...source.matchAll(/<img\b[^>]*\bsrc="([^"]+)"[^>]*>/gi)].map((entry) => entry[1]);
  const imageChecks = images.map((src) => ({
    src,
    valid: !src.startsWith("/") || fs.existsSync(path.join(distRoot, src.slice(1)))
  }));
  const outgoing = [...source.matchAll(/<a\b[^>]*\bhref="([^"]+)"[^>]*>/gi)]
    .map((entry) => normalRoute(decode(entry[1])))
    .filter(Boolean);
  const dateMatches = [...source.matchAll(/"date(Published|Modified)":"([^"]+)"/g)];
  const dates = Object.fromEntries(dateMatches.map((entry) => [entry[1] === "Published" ? "publishedAt" : "updatedAt", entry[2]]));
  return {
    url: `${origin}${route}`,
    route,
    pageType: typeFor(route),
    indexable: !/name="robots" content="[^\"]*noindex/i.test(source),
    title: text(match(source, /<title>([\s\S]*?)<\/title>/i)),
    metaDescription: decode(match(source, /<meta name="description" content="([\s\S]*?)"/i)),
    h1: text(match(source, /<h1\b[^>]*>([\s\S]*?)<\/h1>/i)),
    h1Count: (source.match(/<h1\b/gi) ?? []).length,
    canonical: decode(match(source, /<link rel="canonical" href="([^"]+)"/i)),
    robots: decode(match(source, /<meta name="robots" content="([^"]+)"/i)),
    publishedAt: dates.publishedAt ?? null,
    updatedAt: dates.updatedAt ?? null,
    visibleAuthor: /PfotenTechnik Redaktion|PfotenTechnik Redaktionsteam/i.test(source),
    schemaTypes,
    structuredDataValid: !schemaTypes.includes("INVALID_JSON_LD"),
    contentLength: text(source).length,
    primaryImage: images[0] ?? null,
    imageCount: images.length,
    imagesValid: imageChecks.every((item) => item.valid),
    internalOutboundLinks: [...new Set(outgoing)],
    internalInboundLinks: 0
  };
});
const byRoute = new Map(routes.map((route) => [route.route, route]));
for (const route of routes) {
  for (const target of route.internalOutboundLinks) {
    const targetRoute = byRoute.get(target);
    if (targetRoute) targetRoute.internalInboundLinks += 1;
  }
}
for (const route of routes) route.internalOutboundLinks = route.internalOutboundLinks.length;
const indexable = routes.filter((route) => route.indexable);
const countBy = (items, key) => Object.fromEntries([...new Set(items.map((item) => item[key]))].sort().map((value) => [value, items.filter((item) => item[key] === value).length]));
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  source: "fresh Astro production build",
  origin,
  summary: {
    htmlRoutes: routes.length,
    indexableHtmlRoutes: indexable.length,
    pageTypes: countBy(routes, "pageType"),
    indexablePageTypes: countBy(indexable, "pageType"),
    missing: {
      title: indexable.filter((route) => !route.title).map((route) => route.route),
      metaDescription: indexable.filter((route) => !route.metaDescription).map((route) => route.route),
      h1: indexable.filter((route) => !route.h1).map((route) => route.route),
      canonical: indexable.filter((route) => !route.canonical).map((route) => route.route),
      validStructuredData: indexable.filter((route) => !route.structuredDataValid).map((route) => route.route),
      validImages: indexable.filter((route) => !route.imagesValid).map((route) => route.route)
    }
  },
  routes
};
fs.mkdirSync(reportRoot, { recursive: true });
fs.writeFileSync(path.join(reportRoot, "baseline.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(`SEO Baseline 34.0: ${routes.length} HTML routes; ${indexable.length} indexable HTML routes.`);

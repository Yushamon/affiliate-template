#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const sourceOnly = process.argv.includes("--source-only");
const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, "../..");
const root = path.resolve(app, "../..");
const dist = path.join(app, "dist");
const checks = [];

const normalize = (value) =>
  String(value).replace(/^\\uFEFF/, "").replace(/\\r\\n?/g, "\\n");

const read = (file) => normalize(fs.readFileSync(file, "utf8"));

const check = (name, ok, detail = "") => {
  checks.push({ name, ok, detail });
};

const sourceFiles = {
  astroConfig: path.join(app, "astro.config.mjs"),
  projectLayout: path.join(app, "src/layouts/ProjectLayout.astro"),
  affiliateLayout: path.join(root, "packages/affiliate-core/src/layouts/AffiliateLayout.astro"),
  pageRoute: path.join(app, "src/pages/[slug].astro"),
  comparisonRoute: path.join(app, "src/pages/vergleiche/[comparison].astro"),
  adminLayout: path.join(app, "src/layouts/SeoAdminLayout.astro"),
  packageJson: path.join(app, "package.json")
};

const astroConfig = read(sourceFiles.astroConfig);
check("Sitemap schließt /admin/ aus", astroConfig.includes('"/admin/"'));
check("Sitemap schließt /api/ aus", astroConfig.includes('"/api/"'));
check("Sitemap schließt Fehlerseiten aus", astroConfig.includes('"/404/"') && astroConfig.includes('"/500/"'));
check("Sitemap nutzt Ausschlussfunktion", astroConfig.includes("shouldExcludeFromSitemap(normalized)"));
check("Sitemap-Lastmod wird validiert", astroConfig.includes("toLastmodDate"));

const projectLayout = read(sourceFiles.projectLayout);
check("ProjectLayout normalisiert Canonicals", projectLayout.includes("normalizeCanonicalPath"));
check("ProjectLayout entfernt Query/Hash", projectLayout.includes("new URL(raw"));

const affiliateLayout = read(sourceFiles.affiliateLayout);
check("AffiliateLayout normalisiert Canonicals", affiliateLayout.includes("normalizeCanonicalPath"));
check("Redaktion als Organization", affiliateLayout.includes("articleAuthorType"));
check("WebPage datePublished", /const webPageSchema = \{[\s\S]*?datePublished:/m.test(affiliateLayout));
check("WebPage dateModified", /const webPageSchema = \{[\s\S]*?dateModified:/m.test(affiliateLayout));

const pageRoute = read(sourceFiles.pageRoute);
check("Ratgeber haben Article-Schema", pageRoute.includes('schemaType="article"'));

const comparisonRoute = read(sourceFiles.comparisonRoute);
check("Comparison übergibt publishedAt", comparisonRoute.includes("publishedAt={comparison.publishedAt}"));
check("Comparison übergibt updatedAt", comparisonRoute.includes("updatedAt={comparison.updatedAt ?? comparison.publishedAt}"));
check("ItemList hat stabile ID", comparisonRoute.includes('#item-list'));
check(
  "ItemList enthält direkte Produktverweise",
  /itemListElement:[\s\S]*?["@']@type["@']:\s*["@']ListItem["@'][\s\S]*?name:\s*product\.title[\s\S]*?url:\s*new URL\(product\.href,/m.test(comparisonRoute) &&
    !/itemListElement:[\s\S]*?item:\s*\{/m.test(comparisonRoute) &&
    !/itemListElement:[\s\S]*?["@']@type["@']:\s*["@']Product["@']/m.test(comparisonRoute)
);
check("ItemList-Reihenfolge dokumentiert", comparisonRoute.includes("ItemListOrderAscending"));

const adminLayout = read(sourceFiles.adminLayout);
check("Admin bleibt noindex", adminLayout.includes('name="robots" content="noindex,nofollow"'));

const packageData = JSON.parse(read(sourceFiles.packageJson));
check(
  "npm-Audit-Befehl vorhanden",
  packageData.scripts?.["audit:technical-seo"] ===
    "node scripts/seo/audit-week4-technical-seo.mjs"
);

function walk(directory, matcher = () => true) {
  const result = [];
  if (!fs.existsSync(directory)) return result;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...walk(full, matcher));
    else if (matcher(full)) result.push(full);
  }
  return result;
}

function parseJsonLd(html) {
  const values = [];
  const regex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(regex)) {
    try {
      const parsed = JSON.parse(match[1].trim());
      if (parsed?.["@graph"] && Array.isArray(parsed["@graph"])) {
        values.push(...parsed["@graph"]);
      } else {
        values.push(parsed);
      }
    } catch {
      values.push({ "@type": "__INVALID_JSON_LD__" });
    }
  }
  return values;
}

function collectSchemaTypes(value, result = new Set(), seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return result;
  seen.add(value);

  if (Array.isArray(value)) {
    for (const entry of value) collectSchemaTypes(entry, result, seen);
    return result;
  }

  const type = value["@type"];
  if (Array.isArray(type)) {
    for (const entry of type) result.add(entry);
  } else if (type) {
    result.add(type);
  }

  for (const [key, child] of Object.entries(value)) {
    if (key === "@context") continue;
    if (child && typeof child === "object") {
      collectSchemaTypes(child, result, seen);
    }
  }

  return result;
}

function schemaTypes(html) {
  return [
    ...parseJsonLd(html).reduce(
      (result, entry) => collectSchemaTypes(entry, result),
      new Set()
    )
  ];
}
function canonicalValues(html) {
  return [...html.matchAll(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/gi)]
    .map((match) => match[1]);
}

function htmlPathForUrl(urlValue) {
  const url = new URL(urlValue);
  const pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") return path.join(dist, "index.html");
  if (pathname.endsWith("/")) {
    return path.join(dist, pathname.slice(1), "index.html");
  }
  return path.join(dist, pathname.slice(1));
}

if (!sourceOnly) {
  check("Build-Verzeichnis vorhanden", fs.existsSync(dist), dist);

  if (fs.existsSync(dist)) {
    const sitemapFiles = walk(
      dist,
      (file) => /sitemap.*\.xml$/i.test(path.basename(file))
    );
    check("Sitemap-Dateien vorhanden", sitemapFiles.length > 0, String(sitemapFiles.length));

    const sitemapXml = sitemapFiles.map(read).join("\n");
    const sitemapUrls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map((match) => match[1])
      .filter((value) => {
        try {
          return new URL(value).hostname === "pfotentechnik.de";
        } catch {
          return false;
        }
      });

    const forbidden = sitemapUrls.filter((value) => {
      const pathname = new URL(value).pathname;
      return (
        pathname.startsWith("/admin/") ||
        pathname.startsWith("/api/") ||
        pathname === "/404/" ||
        pathname === "/500/"
      );
    });
    check("Keine internen Routen in Sitemap", forbidden.length === 0, forbidden.join(", "));

    const missingHtml = sitemapUrls.filter((value) => !fs.existsSync(htmlPathForUrl(value)));
    check("Alle Sitemap-URLs sind gebaut", missingHtml.length === 0, missingHtml.slice(0, 5).join(", "));

    const canonicalProblems = [];
    const noindexInSitemap = [];
    for (const sitemapUrl of sitemapUrls) {
      const htmlFile = htmlPathForUrl(sitemapUrl);
      if (!fs.existsSync(htmlFile) || !htmlFile.endsWith(".html")) continue;
      const html = read(htmlFile);
      const canonicals = canonicalValues(html);
      if (canonicals.length !== 1) {
        canonicalProblems.push(`${sitemapUrl}: ${canonicals.length} Canonicals`);
        continue;
      }
      const expected = new URL(sitemapUrl);
      expected.search = "";
      expected.hash = "";
      const actual = new URL(canonicals[0], "https://pfotentechnik.de");
      if (
        actual.origin !== "https://pfotentechnik.de" ||
        actual.search ||
        actual.hash ||
        actual.pathname !== expected.pathname
      ) {
        canonicalProblems.push(`${sitemapUrl}: ${actual.href}`);
      }
      if (/name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html)) {
        noindexInSitemap.push(sitemapUrl);
      }
    }

    check("Sitemap-Canonicals konsistent", canonicalProblems.length === 0, canonicalProblems.slice(0, 5).join(" | "));
    check("Keine noindex-Seite in Sitemap", noindexInSitemap.length === 0, noindexInSitemap.slice(0, 5).join(", "));

    const adminHtml = walk(
      path.join(dist, "admin"),
      (file) => file.endsWith(".html")
    );
    const adminWithoutNoindex = adminHtml.filter(
      (file) => !/name=["']robots["'][^>]+content=["']noindex,nofollow["']/i.test(read(file))
    );
    check("Alle Admin-Seiten sind noindex", adminWithoutNoindex.length === 0, adminWithoutNoindex.join(", "));

    const targetSchemas = [
      ["smarte-futterautomaten/index.html", ["Article"], "Ratgeber"],
      ["vergleiche/beste-futterautomaten-ohne-wlan/index.html", ["WebPage", "ItemList"], "Comparison"],
      ["produkt/petlibro-polar-wet-food-feeder/index.html", ["WebPage", "Product"], "Produkt"],
      ["hersteller/petlibro/index.html", ["Article"], "Hersteller"]
    ];

    for (const [relative, expectedTypes, label] of targetSchemas) {
      const file = path.join(dist, relative);
      check(`${label}-HTML vorhanden`, fs.existsSync(file), relative);
      if (!fs.existsSync(file)) continue;
      const types = schemaTypes(read(file));
      check(
        `${label}-Schema vollständig`,
        expectedTypes.every((type) => types.includes(type)),
        `gefunden: ${types.join(", ")}`
      );
      check(
        `${label}-JSON-LD parsebar`,
        !types.includes("__INVALID_JSON_LD__")
      );
    }
  }
}

const failed = checks.filter((entry) => !entry.ok);
for (const entry of checks) {
  console.log(
    `${entry.ok ? "OK" : "FEHLER"}  ${entry.name}${entry.detail ? ` (${entry.detail})` : ""}`
  );
}

if (failed.length) {
  console.error(`\n${failed.length} technische SEO-Prüfung(en) fehlgeschlagen.`);
  process.exit(1);
}

console.log(
  sourceOnly
    ? "\nWoche-4-Source-Audit erfolgreich."
    : "\nWoche-4-Source- und Build-Audit erfolgreich."
);

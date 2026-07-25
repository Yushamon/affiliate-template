#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const PATCH = "pfotentechnik-seo-week4-technical-indexing-12.0.0";
const CHECK = process.argv.includes("--check");

function findRepoRoot(start) {
  let current = path.resolve(start);
  for (let index = 0; index < 12; index += 1) {
    if (
      fs.existsSync(path.join(current, "apps", "pfotentechnik")) &&
      fs.existsSync(path.join(current, "package.json"))
    ) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error("Repository-Root mit apps/pfotentechnik nicht gefunden.");
}

const root = findRepoRoot(process.cwd());
const app = path.join(root, "apps", "pfotentechnik");
const changed = new Map();

const normalizeText = (value) =>
  String(value)
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n");

const rel = (file) => path.relative(root, file).replaceAll("\\", "/");

function read(file) {
  if (!fs.existsSync(file)) {
    throw new Error(`Datei fehlt: ${rel(file)}`);
  }
  return normalizeText(fs.readFileSync(file, "utf8"));
}

function stage(file, content) {
  const next = normalizeText(content);
  const old = fs.existsSync(file) ? read(file) : null;
  if (old !== next) changed.set(file, { old, next });
}

function replaceRequired(text, search, replacement, label) {
  if (text.includes(replacement)) return text;
  if (!text.includes(search)) {
    throw new Error(`${label}: Anker nicht gefunden.`);
  }
  return text.replace(search, replacement);
}

function replaceRegexRequired(text, regex, replacement, label) {
  if (typeof replacement === "string" && text.includes(replacement)) return text;
  if (!regex.test(text)) {
    throw new Error(`${label}: Muster nicht gefunden.`);
  }
  return text.replace(regex, replacement);
}

function replaceBetween(text, startMarker, endMarker, replacement, label) {
  if (text.includes(replacement.trim())) return text;
  const start = text.indexOf(startMarker);
  const end = text.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0) {
    throw new Error(`${label}: Blockgrenzen nicht gefunden.`);
  }
  return text.slice(0, start) + replacement + text.slice(end);
}

function insertPropIntoProjectLayout(text, prop, anchorProp, label) {
  if (text.includes(prop.trim())) return text;
  const start = text.indexOf("<ProjectLayout");
  if (start < 0) throw new Error(`${label}: ProjectLayout nicht gefunden.`);
  const end = text.indexOf(">", start);
  if (end < 0) throw new Error(`${label}: ProjectLayout-Ende nicht gefunden.`);
  const block = text.slice(start, end);
  const anchor = block.lastIndexOf(anchorProp);
  if (anchor < 0) throw new Error(`${label}: Prop-Anker nicht gefunden.`);
  const lineEnd = block.indexOf("\n", anchor);
  const insertAt = lineEnd >= 0 ? start + lineEnd : end;
  return text.slice(0, insertAt) + `\n${prop}` + text.slice(insertAt);
}

const files = {
  astroConfig: path.join(app, "astro.config.mjs"),
  projectLayout: path.join(app, "src", "layouts", "ProjectLayout.astro"),
  affiliateLayout: path.join(root, "packages", "affiliate-core", "src", "layouts", "AffiliateLayout.astro"),
  pageRoute: path.join(app, "src", "pages", "[slug].astro"),
  comparisonRoute: path.join(app, "src", "pages", "vergleiche", "[comparison].astro"),
  packageJson: path.join(app, "package.json"),
  audit: path.join(app, "scripts", "seo", "audit-week4-technical-seo.mjs")
};

// 1) Sitemap: technische und nicht öffentliche Routen sicher ausschließen.
{
  let text = read(files.astroConfig);

  if (!text.includes("const excludedSitemapPrefixes")) {
    const marker = "\nconst readFrontmatter = (file) => {";
    const index = text.indexOf(marker);
    if (index < 0) throw new Error("Sitemap-Helfer: readFrontmatter-Anker nicht gefunden.");
    const helper = `

const excludedSitemapPrefixes = [
  "/admin/",
  "/api/"
];

const excludedSitemapPaths = new Set([
  "/404/",
  "/500/"
]);

const shouldExcludeFromSitemap = (value) => {
  const pathname = normalizePath(value);
  return (
    excludedSitemapPaths.has(pathname) ||
    excludedSitemapPrefixes.some((prefix) => pathname.startsWith(prefix))
  );
};

const toLastmodDate = (value) => {
  if (!value) return undefined;
  const normalized = /^\\d{4}-\\d{2}-\\d{2}$/.test(String(value))
    ? \`\${value}T00:00:00Z\`
    : String(value);
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? undefined : date;
};
`;
    text = text.slice(0, index) + helper + text.slice(index);
  }

  text = text.replace(
    'const source = readFileSync(file, "utf8");',
    'const source = readFileSync(file, "utf8").replace(/^\\\\uFEFF/, "");'
  );

  if (!text.includes("shouldExcludeFromSitemap(page)")) {
    text = replaceRegexRequired(
      text,
      /filter:\s*\(page\)\s*=>\s*sitemapMetadata\.get\(normalizePath\(page\)\)\?\.include\s*!==\s*false,/,
      `filter: (page) => {
        const normalized = normalizePath(page);
        if (shouldExcludeFromSitemap(normalized)) return false;
        return sitemapMetadata.get(normalized)?.include !== false;
      },`,
      "Sitemap-Filter"
    );
  }

  if (!text.includes("const lastmod = toLastmodDate(metadata.lastmod);")) {
    text = replaceRequired(
      text,
      `        return {
          ...item,
          ...(metadata.lastmod
            ? { lastmod: new Date(\`\${metadata.lastmod}T00:00:00Z\`) }
            : {}),
          ...(metadata.changefreq`,
      `        const lastmod = toLastmodDate(metadata.lastmod);
        return {
          ...item,
          ...(lastmod ? { lastmod } : {}),
          ...(metadata.changefreq`,
      "Sitemap-Lastmod"
    );
  }

  stage(files.astroConfig, text);
}

// 2) Canonicals zentral auf Pfad, Slash und query-freie Form normalisieren.
{
  let text = read(files.projectLayout);
  const oldBlock = `const requestedCanonical = props.canonical ?? "/";
const canonical =
  requestedCanonical === "/" || requestedCanonical.endsWith("/")
    ? requestedCanonical
    : \`\${requestedCanonical}/\`;`;

  const newBlock = `const normalizeCanonicalPath = (value) => {
  const raw = String(value ?? "/").trim();
  let pathname = raw;

  try {
    pathname = new URL(raw, "https://pfotentechnik.de").pathname;
  } catch {
    pathname = raw.split(/[?#]/, 1)[0] || "/";
  }

  const withLeadingSlash = pathname.startsWith("/")
    ? pathname
    : \`/\${pathname}\`;

  return withLeadingSlash === "/" || withLeadingSlash.endsWith("/")
    ? withLeadingSlash
    : \`\${withLeadingSlash}/\`;
};

const canonical = normalizeCanonicalPath(props.canonical ?? "/");`;

  if (!text.includes("const normalizeCanonicalPath = (value)")) {
    text = replaceRegexRequired(
      text,
      /const requestedCanonical = props\.canonical \?\? "\/";[\s\S]*?const canonical =[\s\S]*?;(?=\nimport |\n---|\nconst )/,
      newBlock,
      "ProjectLayout-Canonical"
    );
  }
  stage(files.projectLayout, text);
}

// 3) Generische Layout-Schemas verbessern.
{
  let text = read(files.affiliateLayout);

  if (!text.includes("const normalizeCanonicalPath = (value: string)")) {
    const oldCanonical = `const normalizedCanonical =
  canonical === "/"
    ? "/"
    : canonical.startsWith("/")
      ? canonical
      : \`/\${canonical}\`;

const canonicalUrl = toAbsoluteUrl(site.domain, normalizedCanonical);`;

    const newCanonical = `const normalizeCanonicalPath = (value: string) => {
  const raw = String(value ?? "/").trim();
  let pathname = raw;

  try {
    pathname = new URL(raw, site.domain).pathname;
  } catch {
    pathname = raw.split(/[?#]/, 1)[0] || "/";
  }

  const withLeadingSlash = pathname.startsWith("/")
    ? pathname
    : \`/\${pathname}\`;

  return withLeadingSlash === "/" || withLeadingSlash.endsWith("/")
    ? withLeadingSlash
    : \`\${withLeadingSlash}/\`;
};

const normalizedCanonical = normalizeCanonicalPath(canonical);
const canonicalUrl = toAbsoluteUrl(site.domain, normalizedCanonical);`;

    text = replaceRegexRequired(
      text,
      /const normalizedCanonical =[\s\S]*?const canonicalUrl = toAbsoluteUrl\(site\.domain, normalizedCanonical\);/,
      newCanonical,
      "AffiliateLayout-Canonical"
    );
  }

  if (!text.includes("const articleAuthorType")) {
    const anchor = `const authorUrl = visibleAuthor.url
  ? toAbsoluteUrl(site.domain, visibleAuthor.url)
  : undefined;`;

    const replacement = `${anchor}

const articleAuthorType =
  visibleAuthor.name.toLowerCase().includes("redaktion") ||
  visibleAuthor.role?.toLowerCase().includes("redaktion")
    ? "Organization"
    : "Person";`;

    text = replaceRequired(text, anchor, replacement, "Article-Autor-Typ");
  }

  if (!text.includes("datePublished: publishedAt") || !text.includes("const webPageSchema")) {
    throw new Error("WebPage-Schema-Grundstruktur nicht gefunden.");
  }

  // datePublished/dateModified nur im WebPage-Schema ergänzen.
  if (!/const webPageSchema = \{[\s\S]*?dateModified:/m.test(text)) {
    const oldWebPageEnd = `  isPartOf: {
    "@type": "WebSite",
    name: site.siteName,
    url: site.domain
  }
};`;
    const newWebPageEnd = `  isPartOf: {
    "@type": "WebSite",
    name: site.siteName,
    url: site.domain
  },
  ...(publishedAt ? { datePublished: publishedAt } : {}),
  ...(updatedAt || publishedAt
    ? { dateModified: updatedAt ?? publishedAt }
    : {})
};`;
    text = replaceRequired(text, oldWebPageEnd, newWebPageEnd, "WebPage-Datumsfelder");
  }

  text = text.replace(
    `  author: {
    "@type": "Person",
    name: visibleAuthor.name,`,
    `  author: {
    "@type": articleAuthorType,
    name: visibleAuthor.name,`
  );

  stage(files.affiliateLayout, text);
}

// 4) Ratgeber als Article auszeichnen.
{
  let text = read(files.pageRoute);
  text = insertPropIntoProjectLayout(
    text,
    '  schemaType="article"',
    "  breadcrumbs={breadcrumbs}",
    "Ratgeber-Article-Schema"
  );
  stage(files.pageRoute, text);
}

// 5) Comparison-Metadaten und ItemList semantisch vervollständigen.
{
  let text = read(files.comparisonRoute);

  const schemaBlock = `const comparisonCanonicalPath =
  comparison.seo?.canonical ??
  \`/vergleiche/\${comparison.slug}/\`;
const comparisonCanonicalUrl = new URL(
  comparisonCanonicalPath,
  Astro.site ?? Astro.url
).href;

const comparisonItemListSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  "@id": \`\${comparisonCanonicalUrl}#item-list\`,
  name: comparison.title,
  description: comparison.seo?.description ?? comparison.description,
  url: comparisonCanonicalUrl,
  itemListOrder: "https://schema.org/ItemListOrderAscending",
  numberOfItems: model.products.length,
  itemListElement: model.products.map((product, index) => ({
    "@type": "ListItem",
    position: index + 1,
    item: {
      "@type": "Product",
      name: product.title,
      url: new URL(product.href, Astro.site ?? Astro.url).href
    }
  }))
};

`;

  text = replaceBetween(
    text,
    "const comparisonItemListSchema = {",
    "const comparisonNextSteps =",
    schemaBlock,
    "Comparison-ItemList"
  );

  text = insertPropIntoProjectLayout(
    text,
    "  publishedAt={comparison.publishedAt}",
    '  schemaType="webpage"',
    "Comparison-publishedAt"
  );
  text = insertPropIntoProjectLayout(
    text,
    "  updatedAt={comparison.updatedAt ?? comparison.publishedAt}",
    "  publishedAt={comparison.publishedAt}",
    "Comparison-updatedAt"
  );

  stage(files.comparisonRoute, text);
}

// 6) Dauerhaften npm-Audit-Befehl ergänzen.
{
  const packageData = JSON.parse(read(files.packageJson));
  packageData.scripts ??= {};
  packageData.scripts["audit:technical-seo"] =
    "node scripts/seo/audit-week4-technical-seo.mjs";
  packageData.scripts["audit:technical-seo:source"] =
    "node scripts/seo/audit-week4-technical-seo.mjs --source-only";
  stage(files.packageJson, `${JSON.stringify(packageData, null, 2)}\n`);
}

// 7) Source- und Build-Audit installieren.
const auditSource = `#!/usr/bin/env node
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
  String(value).replace(/^\\\\uFEFF/, "").replace(/\\\\r\\\\n?/g, "\\\\n");

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
check("WebPage datePublished", /const webPageSchema = \\{[\\s\\S]*?datePublished:/m.test(affiliateLayout));
check("WebPage dateModified", /const webPageSchema = \\{[\\s\\S]*?dateModified:/m.test(affiliateLayout));

const pageRoute = read(sourceFiles.pageRoute);
check("Ratgeber haben Article-Schema", pageRoute.includes('schemaType="article"'));

const comparisonRoute = read(sourceFiles.comparisonRoute);
check("Comparison übergibt publishedAt", comparisonRoute.includes("publishedAt={comparison.publishedAt}"));
check("Comparison übergibt updatedAt", comparisonRoute.includes("updatedAt={comparison.updatedAt ?? comparison.publishedAt}"));
check("ItemList hat stabile ID", comparisonRoute.includes('#item-list'));
check("ItemList enthält Product-Items", comparisonRoute.includes('"@type": "Product"'));
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
  const regex = /<script[^>]+type=["']application\\/ld\\\\+json["'][^>]*>([\\\\s\\\\S]*?)<\\/script>/gi;
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

function schemaTypes(html) {
  return parseJsonLd(html).flatMap((entry) => {
    const type = entry?.["@type"];
    return Array.isArray(type) ? type : type ? [type] : [];
  });
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
      (file) => /sitemap.*\\\\.xml$/i.test(path.basename(file))
    );
    check("Sitemap-Dateien vorhanden", sitemapFiles.length > 0, String(sitemapFiles.length));

    const sitemapXml = sitemapFiles.map(read).join("\\n");
    const sitemapUrls = [...sitemapXml.matchAll(/<loc>([^<]+)<\\/loc>/g)]
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
        canonicalProblems.push(\`\${sitemapUrl}: \${canonicals.length} Canonicals\`);
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
        canonicalProblems.push(\`\${sitemapUrl}: \${actual.href}\`);
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
      ["futterautomat-ohne-wlan/index.html", ["Article"], "Ratgeber"],
      ["vergleiche/beste-futterautomaten-ohne-wlan/index.html", ["WebPage", "ItemList"], "Comparison"],
      ["produkt/petlibro-polar-wet-food-feeder/index.html", ["WebPage", "Product"], "Produkt"],
      ["hersteller/petlibro/index.html", ["Article"], "Hersteller"]
    ];

    for (const [relative, expectedTypes, label] of targetSchemas) {
      const file = path.join(dist, relative);
      check(\`\${label}-HTML vorhanden\`, fs.existsSync(file), relative);
      if (!fs.existsSync(file)) continue;
      const types = schemaTypes(read(file));
      check(
        \`\${label}-Schema vollständig\`,
        expectedTypes.every((type) => types.includes(type)),
        \`gefunden: \${types.join(", ")}\`
      );
      check(
        \`\${label}-JSON-LD parsebar\`,
        !types.includes("__INVALID_JSON_LD__")
      );
    }
  }
}

const failed = checks.filter((entry) => !entry.ok);
for (const entry of checks) {
  console.log(
    \`\${entry.ok ? "OK" : "FEHLER"}  \${entry.name}\${entry.detail ? \` (\${entry.detail})\` : ""}\`
  );
}

if (failed.length) {
  console.error(\`\\n\${failed.length} technische SEO-Prüfung(en) fehlgeschlagen.\`);
  process.exit(1);
}

console.log(
  sourceOnly
    ? "\\nWoche-4-Source-Audit erfolgreich."
    : "\\nWoche-4-Source- und Build-Audit erfolgreich."
);
`;

stage(files.audit, auditSource);

console.log(`[${PATCH}] Repository: ${root}`);
console.log(`[${PATCH}] Ändern/erstellen: ${changed.size}`);

if (CHECK) {
  for (const file of changed.keys()) {
    console.log(`ÄNDERN: ${rel(file)}`);
  }
  console.log(`[${PATCH}] Vorprüfung erfolgreich. Es wurde nichts verändert.`);
  process.exit(0);
}

const backupRoot = path.join(
  root,
  ".patch-backups",
  `${PATCH}-${new Date().toISOString().replaceAll(":", "-")}`
);

try {
  for (const [file, state] of changed) {
    if (state.old !== null) {
      const backup = path.join(backupRoot, rel(file));
      fs.mkdirSync(path.dirname(backup), { recursive: true });
      fs.writeFileSync(backup, state.old, "utf8");
    }
  }

  for (const [file, state] of changed) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, state.next, "utf8");
    console.log(`GEÄNDERT: ${rel(file)}`);
  }

  const auditUrl = pathToFileURL(files.audit).href;
  process.argv.push("--source-only");
  await import(`${auditUrl}?t=${Date.now()}`);

  console.log(`[${PATCH}] Erfolgreich angewendet.`);
  console.log(`[${PATCH}] Backup: ${backupRoot}`);
  console.log("Nächster Schritt: npm run build:pfotentechnik");
  console.log("Danach: npm --prefix apps/pfotentechnik run audit:technical-seo");
} catch (error) {
  console.error(`[${PATCH}] Fehler: ${error.message}`);

  for (const [file, state] of changed) {
    if (state.old === null) {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    } else {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, state.old, "utf8");
    }
  }

  console.error(`[${PATCH}] Alle Änderungen wurden zurückgesetzt.`);
  process.exit(1);
}

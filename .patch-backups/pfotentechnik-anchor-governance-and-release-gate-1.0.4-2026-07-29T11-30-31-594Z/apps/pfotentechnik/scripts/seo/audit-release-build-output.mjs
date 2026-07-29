#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const strict = process.argv.includes("--strict");
const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, "../..");
const root = path.resolve(app, "../..");
const dist = path.join(app, "dist");
const sitemapIndex = path.join(dist, "sitemap-index.xml");
const redirectsFile = path.join(app, "public", "_redirects");
const reportDir = path.join(app, "reports", "seo-release");
const findings = [];

const add = (severity, code, details) => findings.push({ severity, code, ...details });
const decodeXml = (value) => String(value ?? "")
  .replace(/&amp;/g, "&")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'");

const normalizePath = (value) => {
  try {
    const url = new URL(decodeXml(String(value ?? "")), "https://pfotentechnik.de/");
    let pathname = decodeURI(url.pathname).replace(/\\/g, "/").replace(/\/{2,}/g, "/");
    return pathname === "/" ? "/" : pathname.replace(/\/+$/, "") + "/";
  } catch {
    return "";
  }
};

const walk = (dir, output = []) => {
  if (!fs.existsSync(dir)) return output;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file, output);
    else output.push(file);
  }
  return output;
};

const routeForFile = (file) => {
  const relative = path.relative(dist, file).replace(/\\/g, "/");
  if (relative === "index.html") return "/";
  if (relative.endsWith("/index.html")) return "/" + relative.slice(0, -11) + "/";
  if (relative.endsWith(".html")) return "/" + relative.slice(0, -5).replace(/\/+$/, "") + "/";
  return "";
};

const parseMeta = (html, name) => {
  const patterns = [
    new RegExp(`<meta\\b[^>]*name=["']${name}["'][^>]*content=["']([^"']*)["'][^>]*>`, "gi"),
    new RegExp(`<meta\\b[^>]*content=["']([^"']*)["'][^>]*name=["']${name}["'][^>]*>`, "gi")
  ];
  return patterns.flatMap((pattern) => [...html.matchAll(pattern)].map((match) => match[1]));
};

const parseCanonicals = (html) => {
  const values = [
    ...html.matchAll(/<link\b[^>]*rel=["'][^"']*canonical[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>/gi),
    ...html.matchAll(/<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["'][^"']*canonical[^"']*["'][^>]*>/gi)
  ].map((match) => decodeXml(match[1]));
  return [...new Set(values)];
};

const htmlFiles = walk(dist).filter((file) => file.endsWith(".html"));
const routeToFile = new Map(htmlFiles.map((file) => [routeForFile(file), file]));
const routes = new Set(routeToFile.keys());

if (!fs.existsSync(dist)) {
  add("error", "BUILD_OUTPUT_MISSING", { path: path.relative(root, dist) });
}
if (!fs.existsSync(sitemapIndex)) {
  add("error", "SITEMAP_MISSING", { path: path.relative(root, sitemapIndex) });
}

const redirects = new Map();
if (fs.existsSync(redirectsFile)) {
  for (const [lineNumber, rawLine] of fs.readFileSync(redirectsFile, "utf8").split(/\r?\n/).entries()) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const parts = line.split(/\s+/);
    if (parts.length < 3 || !/^30[1278]$/.test(parts[2])) continue;
    const from = normalizePath(parts[0]);
    const to = normalizePath(parts[1]);
    if (from && to) redirects.set(from, { to, line: lineNumber + 1 });
  }
}

const sitemapDocuments = [];
if (fs.existsSync(sitemapIndex)) {
  const indexXml = fs.readFileSync(sitemapIndex, "utf8");
  const sitemapLocs = [...indexXml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)]
    .map((match) => decodeXml(match[1]).trim());

  if (sitemapLocs.length === 0) {
    add("error", "SITEMAP_INDEX_EMPTY", { file: path.relative(root, sitemapIndex) });
  }

  for (const rawUrl of sitemapLocs) {
    try {
      const url = new URL(rawUrl);
      const local = path.join(dist, decodeURI(url.pathname).replace(/^\/+/, ""));
      if (!fs.existsSync(local)) {
        add("error", "SITEMAP_PART_MISSING", { url: rawUrl, file: path.relative(root, local) });
      } else {
        sitemapDocuments.push(local);
      }
    } catch {
      add("error", "SITEMAP_INDEX_URL_INVALID", { url: rawUrl });
    }
  }
}

const sitemapUrls = [];
for (const file of sitemapDocuments) {
  const xml = fs.readFileSync(file, "utf8");
  const urls = [...xml.matchAll(/<url>\s*([\s\S]*?)\s*<\/url>/gi)];
  for (const block of urls) {
    const loc = block[1].match(/<loc>\s*([^<]+?)\s*<\/loc>/i)?.[1];
    if (loc) sitemapUrls.push(decodeXml(loc).trim());
  }
}

const sitemapRouteSet = new Set();
const sitemapUrlSet = new Set();

for (const rawUrl of sitemapUrls) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    add("error", "SITEMAP_URL_INVALID", { url: rawUrl });
    continue;
  }

  const route = normalizePath(rawUrl);
  if (url.protocol !== "https:" || url.hostname !== "pfotentechnik.de") {
    add("error", "SITEMAP_HOST_INVALID", { url: rawUrl });
  }
  if (url.search || url.hash) {
    add("error", "SITEMAP_URL_NOT_CANONICAL", { url: rawUrl });
  }
  if (sitemapUrlSet.has(rawUrl)) {
    add("error", "SITEMAP_URL_DUPLICATE", { url: rawUrl });
  }
  sitemapUrlSet.add(rawUrl);
  sitemapRouteSet.add(route);

  if (/^\/(?:admin|api)(?:\/|$)/.test(route) || /^\/(?:404|500)\/$/.test(route)) {
    add("error", "SITEMAP_FORBIDDEN_ROUTE", { url: rawUrl });
  }
  if (redirects.has(route)) {
    add("error", "SITEMAP_REDIRECT_ALIAS", {
      url: rawUrl,
      finalTarget: redirects.get(route).to
    });
  }
  if (!routes.has(route)) {
    add("error", "SITEMAP_BUILD_TARGET_MISSING", { url: rawUrl, route });
  }
}

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  const route = routeForFile(file);
  const robotsValues = parseMeta(html, "robots");
  const robots = robotsValues.join(",").toLowerCase();
  const noindex = /(?:^|[,\s])noindex(?:[,\s]|$)/i.test(robots);
  const isAdmin = route === "/admin/" || route.startsWith("/admin/");
  const isApi = route === "/api/" || route.startsWith("/api/");
  const isErrorPage = /^\/(?:404|500)\/$/.test(route);
  const indexable = !isAdmin && !isApi && !isErrorPage && !noindex;
  const canonicals = parseCanonicals(html);

  if (indexable && canonicals.length !== 1) {
    add("error", "CANONICAL_COUNT_INVALID", {
      route,
      file: path.relative(root, file),
      count: canonicals.length
    });
  }

  if (canonicals.length > 1) {
    add("error", "CANONICAL_CONFLICT", {
      route,
      file: path.relative(root, file),
      canonicals
    });
  }

  if (canonicals.length === 1) {
    try {
      const canonical = new URL(canonicals[0]);
      const canonicalRoute = normalizePath(canonicals[0]);

      if (canonical.protocol !== "https:" || canonical.hostname !== "pfotentechnik.de") {
        add("error", "CANONICAL_HOST_INVALID", {
          route,
          canonical: canonicals[0]
        });
      }

      if (indexable && canonicalRoute !== route) {
        add("error", "CANONICAL_ROUTE_MISMATCH", {
          route,
          canonical: canonicals[0],
          canonicalRoute
        });
      }

      if (indexable && !routes.has(canonicalRoute)) {
        add("error", "CANONICAL_TARGET_MISSING", {
          route,
          canonical: canonicals[0],
          canonicalRoute
        });
      }

      if (redirects.has(canonicalRoute)) {
        add("error", "CANONICAL_TARGET_REDIRECT", {
          route,
          canonical: canonicals[0],
          finalTarget: redirects.get(canonicalRoute).to
        });
      }
    } catch {
      add("error", "CANONICAL_INVALID", {
        route,
        canonical: canonicals[0]
      });
    }
  }

  if (indexable && noindex) {
    add("error", "INDEXABLE_NOINDEX_CONFLICT", { route });
  }

  if (sitemapRouteSet.has(route) && !indexable) {
    add("error", "SITEMAP_NOINDEX_CONFLICT", {
      route,
      robots: robotsValues
    });
  }

  const mainOpen = (html.match(/<main\b/gi) ?? []).length;
  const mainClose = (html.match(/<\/main>/gi) ?? []).length;

  // PfotenTechnik nutzt mehrere etablierte Layouttypen. Ein physisches
  // <main>-Element ist deshalb nicht auf jeder Route verpflichtend.
  // Blockierend sind nur konkurrierende oder unausgeglichene Hauptbereiche.
  if (mainOpen > 1 || mainClose > 1 || mainOpen !== mainClose) {
    add("error", "MAIN_STRUCTURE_INVALID", {
      route,
      open: mainOpen,
      close: mainClose,
      reason: "Mehrere oder nicht ausgeglichene <main>-Elemente erkannt."
    });
  }

  for (const [index, block] of [...html.matchAll(
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  )].entries()) {
    const raw = block[1].trim();
    if (!raw) {
      add("error", "JSON_LD_EMPTY", { route, block: index + 1 });
      continue;
    }
    try {
      const parsed = JSON.parse(raw);
      if (
        parsed == null ||
        (Array.isArray(parsed) && parsed.length === 0) ||
        (!Array.isArray(parsed) && typeof parsed === "object" && Object.keys(parsed).length === 0)
      ) {
        add("error", "JSON_LD_EMPTY", { route, block: index + 1 });
      }
    } catch (error) {
      add("error", "JSON_LD_INVALID", {
        route,
        block: index + 1,
        reason: error.message
      });
    }
  }
}

for (const route of sitemapRouteSet) {
  const file = routeToFile.get(route);
  if (!file) continue;
  const html = fs.readFileSync(file, "utf8");
  const canonicals = parseCanonicals(html);
  const canonicalRoute = canonicals.length === 1 ? normalizePath(canonicals[0]) : "";
  if (canonicalRoute && canonicalRoute !== route) {
    add("error", "SITEMAP_CANONICAL_MISMATCH", {
      route,
      canonicalRoute
    });
  }
}

const errors = findings.filter((finding) => finding.severity === "error");
const warnings = findings.filter((finding) => finding.severity === "warning");
const counts = Object.fromEntries(
  [...new Set(findings.map((finding) => finding.code))]
    .map((code) => [code, findings.filter((finding) => finding.code === code).length])
    .sort((left, right) => right[1] - left[1])
);

fs.mkdirSync(reportDir, { recursive: true });

const report = {
  version: "1.0.3",
  generatedAt: new Date().toISOString(),
  strict,
  summary: {
    pages: htmlFiles.length,
    sitemapDocuments: sitemapDocuments.length,
    sitemapUrls: sitemapUrls.length,
    errors: errors.length,
    warnings: warnings.length,
    counts
  },
  findings
};

fs.writeFileSync(
  path.join(reportDir, "build-output-latest.json"),
  JSON.stringify(report, null, 2) + "\n",
  "utf8"
);

const markdown = [
  "# SEO Release Build Output Audit",
  "",
  `- Seiten: ${htmlFiles.length}`,
  `- Sitemap-Dateien: ${sitemapDocuments.length}`,
  `- Sitemap-URLs: ${sitemapUrls.length}`,
  `- Fehler: ${errors.length}`,
  `- Warnungen: ${warnings.length}`,
  "",
  "## Fehlercodes",
  "",
  ...(Object.keys(counts).length
    ? Object.entries(counts).map(([code, count]) => `- ${code}: ${count}`)
    : ["Keine."]),
  "",
  "## Befunde",
  "",
  ...(findings.length
    ? findings.map((finding) => `- **${finding.severity.toUpperCase()} ${finding.code}** — ${JSON.stringify(finding)}`)
    : ["Keine Befunde."]),
  ""
].join("\n");

fs.writeFileSync(
  path.join(reportDir, "build-output-latest.md"),
  markdown,
  "utf8"
);

console.log(
  `Release Build Output: ${errors.length} Fehler, ${warnings.length} Warnungen.`
);
for (const [code, count] of Object.entries(counts).slice(0, 12)) {
  console.log(`- ${code}: ${count}`);
}

if (errors.length) process.exit(1);

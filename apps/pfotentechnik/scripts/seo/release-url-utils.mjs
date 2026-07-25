#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const SITE = "https://pfotentechnik.de";
export const HOST = "pfotentechnik.de";

const here = path.dirname(fileURLToPath(import.meta.url));
export const APP_ROOT = path.resolve(here, "../..");
export const REPO_ROOT = path.resolve(APP_ROOT, "../..");
export const DIST_ROOT = path.join(APP_ROOT, "dist");
export const CONTENT_ROOT = path.join(APP_ROOT, "src", "content");

export const normalizeText = (value) =>
  String(value ?? "")
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n");

export function git(args, { allowFailure = true } = {}) {
  try {
    return execFileSync("git", args, {
      cwd: REPO_ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", allowFailure ? "ignore" : "pipe"]
    }).trim();
  } catch (error) {
    if (allowFailure) return "";
    throw error;
  }
}

export function normalizeUrl(value) {
  const url = new URL(value, SITE);
  if (url.hostname !== HOST) {
    throw new Error(`Fremde Domain: ${value}`);
  }

  url.protocol = "https:";
  url.search = "";
  url.hash = "";

  if (
    !url.pathname.endsWith("/") &&
    !/\.[a-z0-9]{1,8}$/i.test(url.pathname)
  ) {
    url.pathname = `${url.pathname}/`;
  }

  return url.href;
}

export const unique = (values) =>
  [...new Set(values.filter(Boolean).map(normalizeUrl))].sort();

function decodeXml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

export function sitemapUrls(distRoot = DIST_ROOT) {
  if (!fs.existsSync(distRoot)) {
    throw new Error(`Build-Verzeichnis fehlt: ${distRoot}`);
  }

  const initial = [
    "sitemap-index.xml",
    "sitemap.xml",
    "sitemap-0.xml"
  ]
    .map((name) => path.join(distRoot, name))
    .filter(fs.existsSync);

  if (!initial.length) {
    throw new Error("Keine Sitemap im Build-Verzeichnis gefunden.");
  }

  const queue = [...initial];
  const seen = new Set();
  const urls = [];

  while (queue.length) {
    const file = queue.shift();
    if (!file || seen.has(file)) continue;
    seen.add(file);

    const xml = normalizeText(fs.readFileSync(file, "utf8"));
    for (const match of xml.matchAll(/<loc>([\s\S]*?)<\/loc>/gi)) {
      const location = decodeXml(match[1].trim());
      const url = new URL(location, SITE);
      if (url.hostname !== HOST) continue;

      if (url.pathname.endsWith(".xml")) {
        const local = path.join(
          distRoot,
          decodeURIComponent(url.pathname).replace(/^\/+/, "")
        );
        if (fs.existsSync(local)) queue.push(local);
      } else {
        urls.push(url.href);
      }
    }
  }

  return unique(urls);
}

function frontmatter(text) {
  const match = normalizeText(text).match(/^---\n([\s\S]*?)\n---/);
  return match?.[1] ?? "";
}

function topLevelValue(frontmatterText, key) {
  const match = frontmatterText.match(
    new RegExp(
      `^${key}:\\s*(?:"([^"]*)"|'([^']*)'|([^\\n#]+))\\s*$`,
      "m"
    )
  );
  return (match?.[1] ?? match?.[2] ?? match?.[3])?.trim() || null;
}

function nestedBlock(frontmatterText, key) {
  const lines = frontmatterText.split("\n");
  const start = lines.findIndex((line) => line === `${key}:`);
  if (start < 0) return "";

  let end = start + 1;
  while (
    end < lines.length &&
    (lines[end].startsWith(" ") || lines[end].trim() === "")
  ) {
    end += 1;
  }
  return lines.slice(start + 1, end).join("\n");
}

function nestedValue(frontmatterText, block, key) {
  const content = nestedBlock(frontmatterText, block);
  if (!content) return null;
  const match = content.match(
    new RegExp(
      `^\\s+${key}:\\s*(?:"([^"]*)"|'([^']*)'|([^\\n#]+))\\s*$`,
      "m"
    )
  );
  return (match?.[1] ?? match?.[2] ?? match?.[3])?.trim() || null;
}

function nestedBoolean(frontmatterText, block, key) {
  const value = nestedValue(frontmatterText, block, key);
  if (value === null) return null;
  if (/^(?:true|yes)$/i.test(value)) return true;
  if (/^(?:false|no)$/i.test(value)) return false;
  return null;
}

function slugFromPath(filePath) {
  return path.basename(filePath).replace(/\.(?:md|mdx|json)$/i, "");
}

function cleanRoute(value) {
  if (!value) return null;
  return normalizeUrl(value);
}

export function routeFromContent(filePath, source) {
  const normalizedPath = filePath.replaceAll("\\", "/");
  const fm = frontmatter(source);
  const noindex = nestedBoolean(fm, "seo", "noindex") === true;
  const sitemap = nestedBoolean(fm, "seo", "sitemap");
  const excluded = noindex || sitemap === false;

  const canonical = nestedValue(fm, "seo", "canonical");
  const slug = topLevelValue(fm, "slug") || slugFromPath(filePath);
  const productUrl = topLevelValue(fm, "productUrl");

  let route = null;
  let kind = null;

  if (normalizedPath.includes("/src/content/pages/")) {
    route = canonical || `/${slug}/`;
    kind = "page";
  } else if (normalizedPath.includes("/src/content/products/")) {
    route = canonical || productUrl || `/produkt/${slug}/`;
    kind = "product";
  } else if (normalizedPath.includes("/src/content/comparisons/")) {
    route = canonical || `/vergleiche/${slug}/`;
    kind = "comparison";
  } else if (normalizedPath.includes("/src/content/manufacturers/")) {
    route = canonical || `/hersteller/${slug}/`;
    kind = "manufacturer";
  } else if (normalizedPath.includes("/src/data/comparisons/")) {
    try {
      const parsed = JSON.parse(source);
      route = `/vergleiche/${parsed.slug || slug}/`;
      kind = "comparison-legacy";
    } catch {
      route = `/vergleiche/${slug}/`;
      kind = "comparison-legacy";
    }
  }

  return {
    url: route ? cleanRoute(route) : null,
    kind,
    excluded
  };
}

function contentSourceAtRevision(revision, relativePath) {
  if (!revision) return "";
  return git(["show", `${revision}:${relativePath}`]);
}

function currentSource(relativePath) {
  const absolute = path.join(REPO_ROOT, relativePath);
  return fs.existsSync(absolute)
    ? normalizeText(fs.readFileSync(absolute, "utf8"))
    : "";
}

function pathExists(relativePath) {
  return fs.existsSync(path.join(REPO_ROOT, relativePath));
}

function parseNameStatus(output, origin) {
  if (!output.trim()) return [];

  const entries = [];
  for (const line of normalizeText(output).split("\n")) {
    if (!line.trim()) continue;
    const parts = line.split("\t");
    const status = parts[0];

    if (/^[RC]/.test(status) && parts.length >= 3) {
      entries.push({
        status,
        oldPath: parts[1].replaceAll("\\", "/"),
        path: parts[2].replaceAll("\\", "/"),
        origin
      });
    } else {
      entries.push({
        status,
        oldPath: status.startsWith("D")
          ? parts[1]?.replaceAll("\\", "/")
          : null,
        path: parts.at(-1)?.replaceAll("\\", "/"),
        origin
      });
    }
  }
  return entries.filter((entry) => entry.path);
}

export function resolveBaseRef(explicitBase = "") {
  const candidates = [
    explicitBase,
    process.env.SEO_RELEASE_BASE_REF?.trim(),
    process.env.INDEXNOW_BASE_REF?.trim(),
    git(["rev-parse", "HEAD~1"])
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (git(["rev-parse", "--verify", candidate])) return candidate;
  }

  return null;
}

export function resolveHeadRef(explicitHead = "") {
  const candidate = explicitHead || "HEAD";
  return git(["rev-parse", "--verify", candidate]) ? candidate : "HEAD";
}

export function collectChanges({ baseRef = "", headRef = "HEAD" } = {}) {
  const base = resolveBaseRef(baseRef);
  const head = resolveHeadRef(headRef);
  const changes = [];

  if (base) {
    changes.push(
      ...parseNameStatus(
        git(["diff", "--name-status", "--find-renames", base, head]),
        "committed"
      )
    );
  }

  changes.push(
    ...parseNameStatus(
      git(["diff", "--name-status", "--find-renames", head]),
      "working-tree"
    )
  );

  const untracked = git(["ls-files", "--others", "--exclude-standard"]);
  for (const file of normalizeText(untracked).split("\n").filter(Boolean)) {
    changes.push({
      status: "A",
      oldPath: null,
      path: file.replaceAll("\\", "/"),
      origin: "untracked"
    });
  }

  const deduped = new Map();
  for (const change of changes) {
    const key = `${change.oldPath || ""}->${change.path}`;
    deduped.set(key, change);
  }

  return {
    base,
    head,
    changes: [...deduped.values()]
  };
}

function isContentPath(value) {
  return /apps\/pfotentechnik\/src\/(?:content\/(?:pages|products|comparisons|manufacturers)\/.+\.(?:md|mdx)|data\/comparisons\/.+\.json)$/i.test(value);
}

function isGlobalPath(value) {
  return (
    value === "package.json" ||
    value === "apps/pfotentechnik/package.json" ||
    value === "apps/pfotentechnik/astro.config.mjs" ||
    value.startsWith("packages/affiliate-core/") ||
    value.startsWith("apps/pfotentechnik/src/layouts/") ||
    value.startsWith("apps/pfotentechnik/src/components/") ||
    value.startsWith("apps/pfotentechnik/src/styles/") ||
    value.startsWith("apps/pfotentechnik/src/domain/") ||
    value.startsWith("apps/pfotentechnik/src/lib/") ||
    /^apps\/pfotentechnik\/src\/pages\/.*\[[^/]+\].*\.astro$/i.test(value)
  );
}

function staticPageUrl(relativePath) {
  const prefix = "apps/pfotentechnik/src/pages/";
  if (!relativePath.startsWith(prefix) || !relativePath.endsWith(".astro")) {
    return null;
  }

  const local = relativePath.slice(prefix.length, -".astro".length);
  if (
    local.startsWith("admin/") ||
    local.startsWith("api/") ||
    local.includes("[")
  ) {
    return null;
  }

  const route = local === "index"
    ? "/"
    : `/${local.replace(/\/index$/, "")}/`;

  return normalizeUrl(route);
}

function parseRedirects(source) {
  const rows = [];
  for (const line of normalizeText(source).split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const parts = trimmed.split(/\s+/);
    if (parts.length < 2 || !parts[0].startsWith("/")) continue;

    try {
      rows.push({
        source: normalizeUrl(parts[0]),
        target: normalizeUrl(parts[1])
      });
    } catch {
      // External redirects are intentionally ignored.
    }
  }
  return rows;
}

function assetReferenceRoutes(relativePath) {
  const normalized = relativePath.replaceAll("\\", "/");
  const productMatch = normalized.match(
    /apps\/pfotentechnik\/src\/assets\/images\/products\/([^/]+)\//
  );
  if (productMatch) {
    return [normalizeUrl(`/produkt/${productMatch[1]}/`)];
  }

  const basename = path.basename(normalized);
  const routes = [];

  for (const directory of [
    "pages",
    "products",
    "comparisons",
    "manufacturers"
  ]) {
    const absoluteDirectory = path.join(CONTENT_ROOT, directory);
    if (!fs.existsSync(absoluteDirectory)) continue;

    for (const entry of fs.readdirSync(absoluteDirectory, {
      withFileTypes: true
    })) {
      if (!entry.isFile() || !/\.(?:md|mdx)$/i.test(entry.name)) continue;
      const file = path.join(absoluteDirectory, entry.name);
      const source = normalizeText(fs.readFileSync(file, "utf8"));
      if (!source.includes(basename)) continue;
      const route = routeFromContent(file, source);
      if (route.url && !route.excluded) routes.push(route.url);
    }
  }

  return unique(routes);
}

function addReason(map, url, reason, metadata = {}) {
  if (!url) return;

  const normalized = normalizeUrl(url);
  const current = map.get(normalized) || {
    url: normalized,
    reasons: [],
    deleted: false,
    redirectSource: false
  };

  if (!current.reasons.includes(reason)) current.reasons.push(reason);
  current.deleted ||= Boolean(metadata.deleted);
  current.redirectSource ||= Boolean(metadata.redirectSource);
  map.set(normalized, current);
}

function routeForPath(relativePath, source) {
  return routeFromContent(
    path.join(REPO_ROOT, relativePath),
    source
  );
}

export function collectReleaseManifest({
  baseRef = "",
  headRef = "HEAD",
  distRoot = DIST_ROOT
} = {}) {
  const { base, head, changes } = collectChanges({ baseRef, headRef });
  const urls = new Map();
  const warnings = [];
  const errors = [];
  let includeAllSitemapUrls = false;

  for (const change of changes) {
    const currentPath = change.path;
    const oldPath = change.oldPath;
    const isDeleted = change.status.startsWith("D");

    if (isGlobalPath(currentPath) || (oldPath && isGlobalPath(oldPath))) {
      includeAllSitemapUrls = true;
      continue;
    }

    if (
      currentPath === "apps/pfotentechnik/public/_redirects" ||
      oldPath === "apps/pfotentechnik/public/_redirects"
    ) {
      const currentRedirects = pathExists(currentPath)
        ? parseRedirects(currentSource(currentPath))
        : [];
      const oldRedirects = base
        ? parseRedirects(
            contentSourceAtRevision(
              base,
              oldPath || currentPath
            )
          )
        : [];

      for (const redirect of [...currentRedirects, ...oldRedirects]) {
        addReason(
          urls,
          redirect.source,
          `Redirect-Quelle: ${currentPath}`,
          { redirectSource: true }
        );
        addReason(
          urls,
          redirect.target,
          `Redirect-Ziel: ${currentPath}`
        );
      }
      continue;
    }

    if (isContentPath(currentPath) || (oldPath && isContentPath(oldPath))) {
      if (!isDeleted && pathExists(currentPath)) {
        const route = routeForPath(currentPath, currentSource(currentPath));
        if (route.url && !route.excluded) {
          addReason(
            urls,
            route.url,
            `${route.kind || "content"} geändert: ${currentPath}`
          );
        }
      }

      const deletionPath = oldPath || (isDeleted ? currentPath : null);
      if (deletionPath && base) {
        const oldSource = contentSourceAtRevision(base, deletionPath);
        if (oldSource) {
          const oldRoute = routeForPath(deletionPath, oldSource);
          if (oldRoute.url) {
            addReason(
              urls,
              oldRoute.url,
              `entfernt oder umbenannt: ${deletionPath}`,
              { deleted: true }
            );
          }
        }
      }
      continue;
    }

    const staticRoute = staticPageUrl(currentPath);
    if (staticRoute) {
      addReason(urls, staticRoute, `statische Route geändert: ${currentPath}`);
      continue;
    }

    if (currentPath.startsWith("apps/pfotentechnik/src/assets/images/")) {
      const assetRoutes = assetReferenceRoutes(currentPath);
      if (assetRoutes.length) {
        for (const route of assetRoutes) {
          addReason(urls, route, `Bild geändert: ${currentPath}`);
        }
      } else {
        includeAllSitemapUrls = true;
      }
    }
  }

  let sitemap = [];
  try {
    sitemap = sitemapUrls(distRoot);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }

  if (includeAllSitemapUrls) {
    for (const url of sitemap) {
      addReason(urls, url, "globale Template-, Layout- oder Konfigurationsänderung");
    }
  }

  const sitemapSet = new Set(sitemap);
  const entries = [...urls.values()]
    .map((entry) => {
      const inSitemap = sitemapSet.has(entry.url);
      const status = inSitemap
        ? "sitemap"
        : entry.deleted
          ? "deleted"
          : entry.redirectSource
            ? "redirect-source"
            : "missing-from-sitemap";

      if (status === "missing-from-sitemap") {
        errors.push(`Geänderte URL fehlt in der Sitemap: ${entry.url}`);
      }

      return {
        ...entry,
        reasons: entry.reasons.sort(),
        inSitemap,
        status
      };
    })
    .sort((a, b) => a.url.localeCompare(b.url));

  if (!base) {
    warnings.push(
      "Keine Basis-Revision gefunden. Das Manifest berücksichtigt nur Working Tree und ungetrackte Dateien."
    );
  }

  if (!changes.length) {
    warnings.push("Keine geänderten Dateien erkannt.");
  }

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    site: SITE,
    baseRef: base,
    headRef: head,
    includeAllSitemapUrls,
    changeCount: changes.length,
    urlCount: entries.length,
    changes,
    urls: entries,
    warnings: [...new Set(warnings)],
    errors: [...new Set(errors)]
  };
}

export function writeReleaseManifest(
  manifest,
  outputDirectory = path.join(APP_ROOT, ".seo-release")
) {
  fs.mkdirSync(outputDirectory, { recursive: true });

  const stamp = manifest.generatedAt
    .replace(/\.\d{3}Z$/, "Z")
    .replaceAll(":", "-");

  const jsonPath = path.join(outputDirectory, `release-${stamp}.json`);
  const markdownPath = path.join(outputDirectory, `release-${stamp}.md`);
  const latestJson = path.join(outputDirectory, "latest.json");
  const latestMarkdown = path.join(outputDirectory, "latest.md");

  const markdown = [
    "# PfotenTechnik SEO Release-Manifest",
    "",
    `Generiert: ${manifest.generatedAt}`,
    `Basis: ${manifest.baseRef || "nicht verfügbar"}`,
    `Head: ${manifest.headRef}`,
    `Dateiänderungen: ${manifest.changeCount}`,
    `URLs: ${manifest.urlCount}`,
    `Globaler Sitemap-Refresh: ${manifest.includeAllSitemapUrls ? "ja" : "nein"}`,
    "",
    "## URLs",
    "",
    "| URL | Status | Gründe |",
    "|---|---|---|",
    ...manifest.urls.map((entry) =>
      `| ${entry.url} | ${entry.status} | ${entry.reasons.join("; ").replaceAll("|", "\\|")} |`
    ),
    "",
    "## Warnungen",
    "",
    ...(manifest.warnings.length
      ? manifest.warnings.map((item) => `- ${item}`)
      : ["- keine"]),
    "",
    "## Fehler",
    "",
    ...(manifest.errors.length
      ? manifest.errors.map((item) => `- ${item}`)
      : ["- keine"]),
    ""
  ].join("\n");

  const json = `${JSON.stringify(manifest, null, 2)}\n`;
  fs.writeFileSync(jsonPath, json, "utf8");
  fs.writeFileSync(latestJson, json, "utf8");
  fs.writeFileSync(markdownPath, markdown, "utf8");
  fs.writeFileSync(latestMarkdown, markdown, "utf8");

  return {
    jsonPath,
    markdownPath,
    latestJson,
    latestMarkdown
  };
}

#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, "../..");
const root = path.resolve(app, "../..");
const dist = path.join(app, "dist");
const sitemapIndex = path.join(dist, "sitemap-index.xml");
const redirectsFile = path.join(app, "public/_redirects");
const reportDir = path.join(app, "reports/seo-release");
const findings = [];
const add = (severity, code, details) => findings.push({ severity, code, ...details });

const normPath = (value) => {
  try {
    const url = new URL(String(value ?? ""), "https://pfotentechnik.de/");
    let pathname = decodeURI(url.pathname).replace(/\/{2,}/g, "/");
    return pathname === "/" ? "/" : pathname.replace(/\/+$/, "") + "/";
  } catch { return ""; }
};
const routeForFile = (file) => {
  const relative = path.relative(dist, file).replace(/\\/g, "/");
  if (relative === "index.html") return "/";
  if (relative.endsWith("/index.html")) return "/" + relative.slice(0, -11) + "/";
  return "/" + relative.replace(/\.html$/, "") + "/";
};
const walk = (dir, out = []) => {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file, out); else out.push(file);
  }
  return out;
};
if (!fs.existsSync(dist)) add("error", "BUILD_OUTPUT_MISSING", { path: path.relative(root, dist) });
if (!fs.existsSync(sitemapIndex)) add("error", "SITEMAP_MISSING", { path: path.relative(root, sitemapIndex) });

const htmlFiles = walk(dist).filter((file) => file.endsWith(".html"));
const routes = new Set(htmlFiles.map(routeForFile));
const redirects = new Set();
if (fs.existsSync(redirectsFile)) {
  for (const line of fs.readFileSync(redirectsFile, "utf8").split(/\r?\n/)) {
    const parts = line.trim().split(/\s+/);
    if (parts.length >= 3 && /^30[1278]$/.test(parts[2])) redirects.add(normPath(parts[0]));
  }
}

const sitemapFiles = new Set([sitemapIndex]);
if (fs.existsSync(sitemapIndex)) {
  const indexXml = fs.readFileSync(sitemapIndex, "utf8");
  for (const match of indexXml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    try {
      const url = new URL(match[1]);
      const file = path.join(dist, url.pathname.replace(/^\//, ""));
      sitemapFiles.add(file);
      if (!fs.existsSync(file)) add("error", "SITEMAP_PART_MISSING", { url: match[1], file: path.relative(root, file) });
    } catch { add("error", "SITEMAP_XML_INVALID_URL", { value: match[1] }); }
  }
}

const sitemapUrls = [];
for (const file of sitemapFiles) {
  if (!fs.existsSync(file)) continue;
  const xml = fs.readFileSync(file, "utf8");
  for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    if (file === sitemapIndex) continue;
    sitemapUrls.push(match[1]);
  }
}
const sitemapSeen = new Set();
for (const raw of sitemapUrls) {
  let url;
  try { url = new URL(raw); } catch { add("error", "SITEMAP_URL_INVALID", { url: raw }); continue; }
  const route = normPath(raw);
  if (url.protocol !== "https:" || url.hostname !== "pfotentechnik.de") add("error", "SITEMAP_HOST_INVALID", { url: raw });
  if (sitemapSeen.has(raw)) add("error", "SITEMAP_URL_DUPLICATE", { url: raw });
  sitemapSeen.add(raw);
  if (/^\/(?:admin|api)(?:\/|$)/.test(route) || /\/(?:404|500)\/$/.test(route)) add("error", "SITEMAP_FORBIDDEN_ROUTE", { url: raw });
  if (redirects.has(route)) add("error", "SITEMAP_REDIRECT_ALIAS", { url: raw });
  if (!routes.has(route)) add("error", "SITEMAP_BUILD_TARGET_MISSING", { url: raw, route });
}

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  const route = routeForFile(file);
  const robots = [...html.matchAll(/<meta\b[^>]*name=["']robots["'][^>]*content=["']([^"']*)["']/gi)].map((m) => m[1]).join(",");
  const noindex = /\bnoindex\b/i.test(robots);
  const admin = route.startsWith("/admin/");
  const canonicals = [
    ...html.matchAll(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/gi),
    ...html.matchAll(/<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["']/gi)
  ].map((m) => m[1]);
  if (!admin && !noindex && canonicals.length !== 1) add("error", "CANONICAL_COUNT_INVALID", { route, count: canonicals.length });
  if (canonicals.length === 1) {
    try {
      const canonical = new URL(canonicals[0]);
      if (canonical.protocol !== "https:" || canonical.hostname !== "pfotentechnik.de") add("error", "CANONICAL_HOST_INVALID", { route, canonical: canonicals[0] });
      if (normPath(canonicals[0]) !== route) add("error", "CANONICAL_ROUTE_MISMATCH", { route, canonical: canonicals[0] });
    } catch { add("error", "CANONICAL_INVALID", { route, canonical: canonicals[0] }); }
  }
  if (sitemapSeen.has("https://pfotentechnik.de" + route) && noindex) add("error", "SITEMAP_NOINDEX_CONFLICT", { route });
  const mainCount = (html.match(/<main\b/gi) ?? []).length;
  if (!admin && mainCount !== 1) add("error", "MAIN_COUNT_INVALID", { route, count: mainCount });
  for (const block of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(block[1]);
      if (!parsed || (typeof parsed === "object" && !Array.isArray(parsed) && Object.keys(parsed).length === 0)) add("error", "JSON_LD_EMPTY", { route });
    } catch (error) { add("error", "JSON_LD_INVALID", { route, reason: error.message }); }
  }
}

const errors = findings.filter((item) => item.severity === "error");
const warnings = findings.filter((item) => item.severity === "warning");
fs.mkdirSync(reportDir, { recursive: true });
const report = { version: "1.0.0", generatedAt: new Date().toISOString(), summary: { pages: htmlFiles.length, sitemapUrls: sitemapUrls.length, errors: errors.length, warnings: warnings.length }, findings };
fs.writeFileSync(path.join(reportDir, "build-output-latest.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(reportDir, "build-output-latest.md"), ["# SEO Release Build Output Audit", "", "- Seiten: " + htmlFiles.length, "- Sitemap-URLs: " + sitemapUrls.length, "- Fehler: " + errors.length, "- Warnungen: " + warnings.length, "", ...findings.map((item) => "- **" + item.severity.toUpperCase() + " " + item.code + "** " + JSON.stringify(item))].join("\n") + "\n", "utf8");
console.log("Release Build Output: " + errors.length + " Fehler, " + warnings.length + " Warnungen.");
if (errors.length) process.exit(1);

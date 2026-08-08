#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DIST_ROOT = path.join(APP_ROOT, "dist");
const REPORT_ROOT = path.join(APP_ROOT, "reports", "url-consistency");
const STRICT = process.argv.includes("--strict");
const CANONICAL_ORIGIN = "https://pfotentechnik.de";
const INTERNAL_HOSTS = new Set(["pfotentechnik.de", "www.pfotentechnik.de"]);
const FILTER_PARAM = /^filter(?:-|$)/i;
const MALFORMED_COMPARISON = /^\/vergleiche\/-/i;

const findings = [];
let indexableHtml = 0;
let nonIndexableHtml = 0;
const add = (severity, code, file, value, message) => findings.push({ severity, code, file, value, message });

const walk = (dir, predicate) => {
  if (!fs.existsSync(dir)) return [];
  const result = [];
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(absolute);
      else if (!predicate || predicate(absolute)) result.push(absolute);
    }
  }
  return result;
};

const routeForHtml = (file) => {
  const relative = path.relative(DIST_ROOT, file).replace(/\\/g, "/");
  if (relative === "index.html") return "/";
  if (relative.endsWith("/index.html")) return "/" + relative.slice(0, -10);
  return "/" + relative.replace(/\.html$/, "/");
};

const hasFilterParams = (url) => {
  for (const key of url.searchParams.keys()) if (FILTER_PARAM.test(key)) return true;
  return false;
};

const parseInternal = (value, route) => {
  try {
    const url = new URL(value, CANONICAL_ORIGIN + route);
    return INTERNAL_HOSTS.has(url.hostname.toLowerCase()) ? url : null;
  } catch {
    return null;
  }
};

if (!fs.existsSync(DIST_ROOT)) {
  add("error", "DIST_MISSING", "dist", "", "Build-Ausgabe fehlt.");
} else {
  for (const file of walk(DIST_ROOT, (candidate) => candidate.endsWith(".html"))) {
    const html = fs.readFileSync(file, "utf8");
    const relative = path.relative(APP_ROOT, file).replace(/\\/g, "/");
    const route = routeForHtml(file);

    const canonical =
      html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i) ||
      html.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*>/i);

    const robotsContent = [
      ...html.matchAll(/<meta\\b[^>]*name=["']robots["'][^>]*content=["']([^"']*)["']/gi),
      ...html.matchAll(/<meta\\b[^>]*content=["']([^"']*)["'][^>]*name=["']robots["']/gi)
    ].map((match) => match[1].toLowerCase()).join(",");

    const isAdminRoute = route === "/admin/" || route.startsWith("/admin/");
    const isNoindex = /(?:^|[,\\s])noindex(?:[,\\s]|$)/i.test(robotsContent);
    const canonicalRequired = !isAdminRoute && !isNoindex;
    if (canonicalRequired) indexableHtml += 1;
    else nonIndexableHtml += 1;

    if (!canonical && canonicalRequired) {
      add("error", "CANONICAL_MISSING", relative, route, "Indexierbare Seite besitzt keinen Canonical.");
    } else if (canonical) {
      let url = null;
      try { url = new URL(canonical[1], CANONICAL_ORIGIN); }
      catch { add("error", "CANONICAL_INVALID", relative, canonical[1], "Canonical ist ungültig."); }

      if (url) {
        if (url.origin !== CANONICAL_ORIGIN) add("error", "CANONICAL_HOST", relative, url.href, "Canonical verwendet nicht den kanonischen Host.");
        if (url.search || url.hash) add("error", "CANONICAL_STATE", relative, url.href, "Canonical enthält Query oder Fragment.");
        if (MALFORMED_COMPARISON.test(url.pathname)) add("error", "CANONICAL_MALFORMED_COMPARISON", relative, url.href, "Canonical enthält eine fehlerhafte Vergleichsroute.");
      }
    }

    for (const match of html.matchAll(/\bhref=["']([^"']+)["']/gi)) {
      const raw = match[1];
      const url = parseInternal(raw, route);
      if (!url) continue;
      if (hasFilterParams(url)) add("error", "INTERNAL_FILTER_QUERY", relative, raw, "Interner Link enthält einen crawlbaren Filterparameter.");
      if (MALFORMED_COMPARISON.test(url.pathname)) add("error", "INTERNAL_MALFORMED_COMPARISON", relative, raw, "Interner Link enthält eine fehlerhafte Vergleichsroute.");
      if (/^https:\/\/www\.pfotentechnik\.de/i.test(raw)) add("error", "ABSOLUTE_WWW_INTERNAL_URL", relative, raw, "Absoluter interner Link verwendet www statt des kanonischen Hosts.");
    }
  }

  for (const file of walk(DIST_ROOT, (candidate) => /sitemap.*\.xml$/i.test(candidate))) {
    const xml = fs.readFileSync(file, "utf8");
    const relative = path.relative(APP_ROOT, file).replace(/\\/g, "/");
    for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/gi)) {
      const raw = match[1].trim();
      let url;
      try { url = new URL(raw); }
      catch {
        add("error", "SITEMAP_INVALID_URL", relative, raw, "Ungültige Sitemap-URL.");
        continue;
      }
      if (url.origin !== CANONICAL_ORIGIN) add("error", "SITEMAP_HOST", relative, raw, "Sitemap verwendet nicht den kanonischen Host.");
      if (url.search || url.hash) add("error", "SITEMAP_STATE_URL", relative, raw, "Sitemap enthält Query oder Fragment.");
      if (MALFORMED_COMPARISON.test(url.pathname)) add("error", "SITEMAP_MALFORMED_COMPARISON", relative, raw, "Sitemap enthält eine fehlerhafte Vergleichsroute.");
    }
  }
}

fs.mkdirSync(REPORT_ROOT, { recursive: true });
const summary = {
  checkedAt: new Date().toISOString(),
  canonicalOrigin: CANONICAL_ORIGIN,
  errors: findings.filter((item) => item.severity === "error").length,
  warnings: findings.filter((item) => item.severity === "warning").length,
  findings: findings.length,
  indexableHtml,
  nonIndexableHtml
};

fs.writeFileSync(
  path.join(REPORT_ROOT, "url-consistency-audit.json"),
  JSON.stringify({ schemaVersion: 1, summary, findings }, null, 2) + "\n",
  "utf8"
);

fs.writeFileSync(
  path.join(REPORT_ROOT, "url-consistency-audit.md"),
  [
    "# URL Consistency Audit",
    "",
    "- Kanonischer Host: " + CANONICAL_ORIGIN,
    "- Fehler: " + summary.errors,
    "- Warnungen: " + summary.warnings,
    "",
    "## Findings",
    "",
    ...(findings.length
      ? findings.map((item) => "- **" + item.severity.toUpperCase() + " · " + item.code + "** " + item.file + ": " + item.value + " — " + item.message)
      : ["Keine Findings."]),
    ""
  ].join("\n"),
  "utf8"
);

console.log("URL Consistency Audit");
console.log("Kanonischer Host:", CANONICAL_ORIGIN);
console.log("Indexierbare HTML-Seiten:", summary.indexableHtml);
console.log("Noindex/Admin-HTML-Seiten:", summary.nonIndexableHtml);
console.log("Fehler:", summary.errors);
console.log("Warnungen:", summary.warnings);
if (STRICT && summary.errors > 0) process.exitCode = 1;

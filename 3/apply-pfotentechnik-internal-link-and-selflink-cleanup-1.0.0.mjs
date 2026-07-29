#!/usr/bin/env node
/**
 * PfotenTechnik Internal Link + Selflink Cleanup 1.0.0
 *
 * Ausführung im Root von Yushamon/affiliate-template:
 *   node apply-pfotentechnik-internal-link-and-selflink-cleanup-1.0.0.mjs
 *
 * Optionen:
 *   --dry-run       Nur analysieren, nichts schreiben, keine Tests ausführen
 *   --skip-install  npm install überspringen
 *   --skip-tests    Build und Audits überspringen
 *   --force         Nur bekannte, eng begrenzte Architekturabweichungen tolerieren
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";

const VERSION = "1.0.0";
const NAME = `pfotentechnik-internal-link-and-selflink-cleanup-${VERSION}`;
const PREFIX = `[${NAME}]`;
const ROOT = process.cwd();
const APP = path.join(ROOT, "apps", "pfotentechnik");
const CORE = path.join(ROOT, "packages", "affiliate-core");
const DRY_RUN = process.argv.includes("--dry-run");
const SKIP_INSTALL = process.argv.includes("--skip-install");
const SKIP_TESTS = process.argv.includes("--skip-tests");
const FORCE = process.argv.includes("--force");
const RUN_ID = new Date().toISOString().replace(/[:.]/g, "-");
const BACKUP_ROOT = path.join(ROOT, ".patch-backups", `${NAME}-${RUN_ID}`);
const REPORT_ROOT = path.join(APP, "reports", "internal-linking");

const REQUIRED = {
  rootPackage: path.join(ROOT, "package.json"),
  appPackage: path.join(APP, "package.json"),
  redirects: path.join(APP, "public", "_redirects"),
  linkEngine: path.join(CORE, "src", "linking", "linkEngine.ts"),
  autoLinkContent: path.join(CORE, "src", "components", "AutoLinkContent.astro"),
  decisionNextSteps: path.join(APP, "src", "components", "DecisionNextSteps.astro"),
  comparisonPage: path.join(APP, "src", "pages", "vergleiche", "[comparison].astro"),
  internalLinkAudit: path.join(ROOT, "scripts", "audit-internal-links.mjs")
};

const GENERATED = {
  policy: path.join(APP, "src", "domain", "content", "internalUrlPolicy.ts"),
  audit: path.join(APP, "scripts", "audit-internal-link-targets.mjs"),
  test: path.join(APP, "test", "internal-url-policy.test.mjs")
};

const changes = [];
const skipped = [];
const cleanupFindings = [];
const ambiguityFindings = [];
const originalCanonicals = new Map();

function log(message = "") { console.log(`${PREFIX} ${message}`.trimEnd()); }
function fail(message) { console.error(`\n${PREFIX} FEHLER: ${message}`); process.exit(1); }
function rel(file) { return path.relative(ROOT, file).replace(/\\/g, "/"); }
function exists(file) { return fs.existsSync(file); }
function read(file) {
  if (!exists(file)) fail(`Erwartete Datei fehlt: ${rel(file)}`);
  return fs.readFileSync(file, "utf8");
}
function sha(value) { return crypto.createHash("sha256").update(value).digest("hex"); }
function eolOf(value) { return value.includes("\r\n") ? "\r\n" : "\n"; }
function withEol(value, eol) { return value.replace(/\r?\n/g, eol); }
function ensureDir(dir) { if (!DRY_RUN) fs.mkdirSync(dir, { recursive: true }); }
function backup(file) {
  if (DRY_RUN || !exists(file)) return;
  const target = path.join(BACKUP_ROOT, rel(file));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
}
function writeIfChanged(file, content, reason) {
  const before = exists(file) ? fs.readFileSync(file, "utf8") : null;
  const normalized = before == null ? content : withEol(content, eolOf(before));
  if (before === normalized) {
    skipped.push({ file: rel(file), reason: "bereits aktuell" });
    return false;
  }
  if (!DRY_RUN) {
    if (before != null) backup(file);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, normalized, "utf8");
  }
  changes.push({ file: rel(file), reason, beforeSha: before == null ? null : sha(before), afterSha: sha(normalized) });
  return true;
}
function replaceRequired(source, from, to, label) {
  if (source.includes(to)) return source;
  if (!source.includes(from)) {
    if (FORCE) {
      ambiguityFindings.push({ type: "architecture", label, status: "force-skip" });
      return source;
    }
    fail(`Architekturprüfung fehlgeschlagen: ${label}`);
  }
  return source.replace(from, to);
}
function run(command, args, options = {}) {
  log(`Ausführen: ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? ROOT,
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
    env: { ...process.env, FORCE_COLOR: "0" }
  });
  if (result.error) fail(`${command} konnte nicht gestartet werden: ${result.error.message}`);
  if (result.status !== 0) {
    const detail = options.capture ? `\n${result.stdout ?? ""}\n${result.stderr ?? ""}` : "";
    fail(`Befehl fehlgeschlagen (${result.status}): ${command} ${args.join(" ")}${detail}`);
  }
  return result;
}

function validateRepository() {
  for (const file of Object.values(REQUIRED)) if (!exists(file)) fail(`Repository-Struktur unbekannt, Datei fehlt: ${rel(file)}`);
  const rootPkg = JSON.parse(read(REQUIRED.rootPackage));
  const appPkg = JSON.parse(read(REQUIRED.appPackage));
  if (rootPkg.name !== "affiliate-sites-monorepo") fail(`Unerwartetes Root-Paket: ${rootPkg.name ?? "ohne name"}`);
  if (appPkg.name !== "@affiliate-sites/pfotentechnik") fail(`Unerwartetes App-Paket: ${appPkg.name ?? "ohne name"}`);
  const engine = read(REQUIRED.linkEngine);
  const auto = read(REQUIRED.autoLinkContent);
  if (!engine.includes("export const findInternalLinkMatches") || !engine.includes("normalizePath")) fail("linkEngine.ts entspricht nicht der erwarteten Architektur.");
  if (!auto.includes("createInternalLinkedHtml") || !auto.includes("sourcePath")) fail("AutoLinkContent.astro entspricht nicht der erwarteten Architektur.");
}

function normalizePathname(value) {
  let pathname = String(value ?? "").trim();
  if (!pathname) return "";
  try {
    if (/^https?:\/\//i.test(pathname)) pathname = new URL(pathname).pathname;
  } catch { return ""; }
  pathname = pathname.split("#")[0].split("?")[0] || "/";
  if (!pathname.startsWith("/")) pathname = `/${pathname}`;
  pathname = pathname.replace(/\/{2,}/g, "/");
  return pathname === "/" ? "/" : `${pathname.replace(/\/+$/, "")}/`;
}

function parseRedirects(raw) {
  const map = new Map();
  for (const [index, line] of raw.split(/\r?\n/).entries()) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const parts = trimmed.split(/\s+/);
    if (parts.length < 3 || !/^30[1278]$/.test(parts[2])) continue;
    const from = normalizePathname(parts[0]);
    const to = normalizePathname(parts[1]);
    if (!from || !to || !to.startsWith("/vergleiche/")) continue;
    if (from.startsWith("/vergleiche/")) continue;
    const previous = map.get(from);
    if (previous && previous !== to) fail(`Widersprüchliches Redirect-Mapping in _redirects, Zeile ${index + 1}: ${from}`);
    map.set(from, to);
  }
  if (map.size < 20) fail(`Zu wenige Vergleichs-Aliasse aus _redirects gelesen (${map.size}).`);
  return map;
}

function resolveRedirect(pathname, redirectMap) {
  let current = normalizePathname(pathname);
  const seen = new Set();
  while (redirectMap.has(current) && !seen.has(current)) {
    seen.add(current);
    current = redirectMap.get(current);
  }
  return current;
}

function splitUrlParts(raw) {
  const value = String(raw ?? "");
  const match = value.match(/^([^?#]*)(\?[^#]*)?(#.*)?$/);
  return { base: match?.[1] ?? value, query: match?.[2] ?? "", hash: match?.[3] ?? "" };
}

function isInternalUrl(raw) {
  const value = String(raw ?? "").trim();
  if (!value || /^(?:mailto:|tel:|sms:|javascript:|data:)/i.test(value)) return false;
  if (value.startsWith("#")) return true;
  if (value.startsWith("/")) return true;
  try {
    const url = new URL(value);
    return ["pfotentechnik.de", "www.pfotentechnik.de"].includes(url.hostname.toLowerCase());
  } catch { return false; }
}

function rewriteTarget(raw, redirectMap) {
  if (!isInternalUrl(raw) || String(raw).startsWith("#")) return raw;
  const parts = splitUrlParts(raw);
  let pathname = parts.base;
  let absolute = false;
  try {
    if (/^https?:\/\//i.test(parts.base)) {
      const url = new URL(parts.base);
      if (!["pfotentechnik.de", "www.pfotentechnik.de"].includes(url.hostname.toLowerCase())) return raw;
      pathname = url.pathname;
      absolute = true;
    }
  } catch { return raw; }
  const normalized = normalizePathname(pathname);
  const finalPath = resolveRedirect(normalized, redirectMap);
  if (!finalPath || finalPath === normalized) return raw;
  cleanupFindings.push({ type: "legacy-link", oldUrl: raw, finalUrl: `${absolute ? "https://pfotentechnik.de" : ""}${finalPath}${parts.query}${parts.hash}` });
  return `${absolute ? "https://pfotentechnik.de" : ""}${finalPath}${parts.query}${parts.hash}`;
}

function frontmatterInfo(raw, file) {
  if (!/\.mdx?$/i.test(file)) return null;
  const fm = raw.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/);
  const data = fm?.[1] ?? "";
  const canonical = data.match(/^canonical:\s*["']?([^"'\s]+)["']?\s*$/m)?.[1]
    ?? data.match(/^\s{2}canonical:\s*["']?([^"'\s]+)["']?\s*$/m)?.[1];
  const slug = data.match(/^slug:\s*["']?([^"'\s]+)["']?\s*$/m)?.[1]
    ?? path.basename(file, path.extname(file));
  let route = canonical;
  const posix = rel(file);
  if (!route) {
    if (posix.includes("/src/content/comparisons/")) route = `/vergleiche/${slug}/`;
    else if (posix.includes("/src/content/products/")) route = `/produkt/${slug}/`;
    else if (posix.includes("/src/content/manufacturers/")) route = `/hersteller/${slug}/`;
    else if (posix.includes("/src/content/pages/")) route = `/${slug}/`;
  }
  return { frontmatter: fm?.[0] ?? "", bodyStart: fm?.[0]?.length ?? 0, canonical: normalizePathname(route) };
}

function rewriteMarkdownSegment(segment, redirectMap, canonical, file, lineOffset) {
  let result = segment;
  result = result.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g, (full, label, target, offset) => {
    const rewritten = rewriteTarget(target, redirectMap);
    const normalizedTarget = resolveRedirect(normalizePathname(splitUrlParts(rewritten).base), redirectMap);
    if (canonical && isInternalUrl(rewritten) && !String(rewritten).startsWith("#") && normalizedTarget === canonical) {
      cleanupFindings.push({ type: "self-link", file: rel(file), line: lineOffset + segment.slice(0, offset).split("\n").length, canonical, target, normalizedTarget, cause: "Markdown-Link" });
      return label;
    }
    return full.replace(target, rewritten);
  });
  result = result.replace(/<a\b([^>]*?)\bhref=(['"])(.*?)\2([^>]*)>([\s\S]*?)<\/a>/gi, (full, before, quote, target, after, inner, offset) => {
    const rewritten = rewriteTarget(target, redirectMap);
    const normalizedTarget = resolveRedirect(normalizePathname(splitUrlParts(rewritten).base), redirectMap);
    if (canonical && isInternalUrl(rewritten) && !String(rewritten).startsWith("#") && normalizedTarget === canonical) {
      cleanupFindings.push({ type: "self-link", file: rel(file), line: lineOffset + segment.slice(0, offset).split("\n").length, canonical, target, normalizedTarget, cause: "HTML-Link im Markdown" });
      return inner;
    }
    return `<a${before}href=${quote}${rewritten}${quote}${after}>${inner}</a>`;
  });
  return result;
}

function transformMarkdown(raw, file, redirectMap) {
  const info = frontmatterInfo(raw, file);
  if (!info) return raw;
  const frontmatter = raw.slice(0, info.bodyStart);
  let body = raw.slice(info.bodyStart);
  const pieces = body.split(/(```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]+`)/g);
  let line = frontmatter.split(/\r?\n/).length;
  body = pieces.map((piece, index) => {
    const protectedPart = index % 2 === 1;
    const output = protectedPart ? piece : rewriteMarkdownSegment(piece, redirectMap, info.canonical, file, line);
    line += piece.split(/\r?\n/).length - 1;
    return output;
  }).join("");
  return frontmatter + body;
}

function transformStructured(raw, file, redirectMap) {
  const lines = raw.split(/(?<=\n)/);
  return lines.map((line) => {
    if (/^\s*(?:canonical|"canonical"|'canonical')\s*[:=]/i.test(line)) return line;
    return line.replace(/https?:\/\/(?:www\.)?pfotentechnik\.de\/[A-Za-z0-9_~!$&'()*+,;=:@%./?-]*|\/[A-Za-z0-9_~!$&'()*+,;=:@%.-]+(?:\/[A-Za-z0-9_~!$&'()*+,;=:@%.-]+)*\/?(?:\?[^\s"'`<>)]*)?(?:#[^\s"'`<>)]*)?/g, (target) => rewriteTarget(target, redirectMap));
  }).join("");
}

const EXCLUDED_DIRS = new Set(["node_modules", "dist", ".git", ".patch-backups", "reports", ".astro", "coverage", "tmp", "temp"]);
function walk(dir, output = []) {
  if (!exists(dir)) return output;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && EXCLUDED_DIRS.has(entry.name)) continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file, output);
    else output.push(file);
  }
  return output;
}

function collectSourceFiles() {
  const roots = [path.join(APP, "src"), path.join(CORE, "src")];
  return roots.flatMap((dir) => walk(dir)).filter((file) => /\.(?:md|mdx|json|astro|ts|js|mjs|cjs)$/i.test(file));
}

function snapshotCanonicals(files) {
  for (const file of files.filter((item) => /\.mdx?$/i.test(item))) {
    const raw = fs.readFileSync(file, "utf8");
    const matches = [...raw.matchAll(/^\s*(?:canonical|seo:\s*\r?\n\s+canonical):\s*["']?([^"'\s]+)["']?\s*$/gm)].map((m) => m[1]);
    originalCanonicals.set(rel(file), matches);
  }
}
function assertCanonicalsUnchanged(files) {
  for (const file of files.filter((item) => /\.mdx?$/i.test(item))) {
    const raw = fs.readFileSync(file, "utf8");
    const current = [...raw.matchAll(/^\s*(?:canonical|seo:\s*\r?\n\s+canonical):\s*["']?([^"'\s]+)["']?\s*$/gm)].map((m) => m[1]);
    const before = originalCanonicals.get(rel(file)) ?? [];
    if (JSON.stringify(before) !== JSON.stringify(current)) fail(`Canonical-Werte wurden unerwartet verändert: ${rel(file)}`);
  }
}

function policySource(redirectMap) {
  const aliases = [...redirectMap.entries()].sort(([a], [b]) => a.localeCompare(b, "de"));
  return `/** Generated by ${NAME}. Redirect aliases remain sourced from public/_redirects. */
export const PFOTENTECHNIK_HOSTS = new Set(["pfotentechnik.de", "www.pfotentechnik.de"]);

export const COMPARISON_REDIRECT_ALIASES: Readonly<Record<string, string>> = Object.freeze(${JSON.stringify(Object.fromEntries(aliases), null, 2)});

const FUNCTIONAL_QUERY_KEYS = new Set(["filter", "tab", "sort", "view", "page", "step"]);

export const normalizeInternalPath = (value?: string, options: { keepFunctionalQuery?: boolean } = {}) => {
  const input = String(value ?? "").trim();
  if (!input) return "";
  if (input.startsWith("#")) return input;
  if (/^(?:mailto:|tel:|sms:|javascript:|data:)/i.test(input)) return "";
  let url: URL;
  try { url = new URL(input, "https://pfotentechnik.de/"); } catch { return ""; }
  if (!PFOTENTECHNIK_HOSTS.has(url.hostname.toLowerCase())) return "";
  let pathname = url.pathname.replace(/\\/{2,}/g, "/");
  pathname = pathname === "/" ? "/" : pathname.replace(/\\/+$/, "") + "/";
  let resolved = pathname;
  const seen = new Set<string>();
  while (COMPARISON_REDIRECT_ALIASES[resolved] && !seen.has(resolved)) {
    seen.add(resolved);
    resolved = COMPARISON_REDIRECT_ALIASES[resolved];
  }
  if (!options.keepFunctionalQuery) return resolved;
  const functional = new URLSearchParams();
  for (const [key, val] of url.searchParams) if (FUNCTIONAL_QUERY_KEYS.has(key)) functional.append(key, val);
  const query = functional.toString();
  return query ? resolved + "?" + query : resolved;
};

export const isInternalTarget = (value?: string) => {
  const input = String(value ?? "").trim();
  if (!input) return false;
  if (input.startsWith("#") || input.startsWith("/")) return true;
  try { return PFOTENTECHNIK_HOSTS.has(new URL(input).hostname.toLowerCase()); } catch { return false; }
};

export const isSelfLinkTarget = (target?: string, current?: string) => {
  const raw = String(target ?? "").trim();
  if (!raw || raw.startsWith("#")) return false;
  const targetFunctional = normalizeInternalPath(raw, { keepFunctionalQuery: true });
  const currentFunctional = normalizeInternalPath(current, { keepFunctionalQuery: true });
  if (!targetFunctional || !currentFunctional) return false;
  if (targetFunctional.includes("?") && targetFunctional !== normalizeInternalPath(raw)) return targetFunctional === currentFunctional;
  return normalizeInternalPath(raw) === normalizeInternalPath(current);
};

export const filterSelfLinkItems = <T extends { href?: string }>(items: T[], current?: string) =>
  items.filter((item) => item?.href && !isSelfLinkTarget(item.href, current));
`;
}

function auditSource() {
  return `#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const strict = process.argv.includes("--strict");
const root = process.cwd();
const app = path.join(root, "apps", "pfotentechnik");
const dist = path.join(app, "dist");
const redirectsFile = path.join(app, "public", "_redirects");
const reportDir = path.join(app, "reports", "internal-linking");
const HOSTS = new Set(["pfotentechnik.de", "www.pfotentechnik.de"]);
const FUNCTIONAL = new Set(["filter", "tab", "sort", "view", "page", "step"]);
const findings = [];
const add = (severity, code, details) => findings.push({ severity, code, ...details });
const normPath = (value) => {
  let input = String(value ?? "").trim();
  if (!input || input.startsWith("#")) return input;
  try {
    const url = new URL(input, "https://pfotentechnik.de/");
    if (!HOSTS.has(url.hostname.toLowerCase())) return "";
    let p = url.pathname.replace(/\\/{2,}/g, "/");
    return p === "/" ? "/" : p.replace(/\\/+$/, "") + "/";
  } catch { return ""; }
};
const redirects = new Map();
for (const line of fs.readFileSync(redirectsFile, "utf8").split(/\\r?\\n/)) {
  const parts = line.trim().split(/\\s+/);
  if (parts.length >= 3 && /^30[1278]$/.test(parts[2])) {
    const from = normPath(parts[0]); const to = normPath(parts[1]);
    if (from && to && to.startsWith("/vergleiche/") && !from.startsWith("/vergleiche/")) redirects.set(from, to);
  }
}
const resolve = (value) => { let p = normPath(value); const seen = new Set(); while (redirects.has(p) && !seen.has(p)) { seen.add(p); p = redirects.get(p); } return p; };
const isInternal = (value) => {
  const input = String(value ?? "").trim();
  if (!input || /^(mailto:|tel:|sms:|javascript:|data:)/i.test(input)) return false;
  if (input.startsWith("/") || input.startsWith("#")) return true;
  try { return HOSTS.has(new URL(input).hostname.toLowerCase()); } catch { return false; }
};
const functionalState = (value) => {
  try { const u = new URL(value, "https://pfotentechnik.de/"); const q = new URLSearchParams(); for (const [k,v] of u.searchParams) if (FUNCTIONAL.has(k)) q.append(k,v); return q.toString(); } catch { return ""; }
};
const walk = (dir, out=[]) => { if (!fs.existsSync(dir)) return out; for (const e of fs.readdirSync(dir,{withFileTypes:true})) { const f=path.join(dir,e.name); if(e.isDirectory()) walk(f,out); else out.push(f); } return out; };
const htmlFiles = walk(dist).filter((f) => f.endsWith(".html"));
const existing = new Set(htmlFiles.map((file) => {
  const r = path.relative(dist, file).replace(/\\\\/g,"/");
  if (r === "index.html") return "/";
  if (r.endsWith("/index.html")) return "/" + r.slice(0,-11) + "/";
  return "/" + r.replace(/\.html$/, "") + "/";
}));
for (const file of htmlFiles) {
  const html = fs.readFileSync(file,"utf8");
  const canonicalRaw = html.match(/<link\\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1]
    ?? html.match(/<link\\b[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["']/i)?.[1];
  const canonical = resolve(canonicalRaw);
  if (!canonical) add("error","CANONICAL_MISSING",{file:path.relative(root,file)});
  const main = html.match(/<main\\b[^>]*>([\\s\\S]*?)<\\/main>/i)?.[1] ?? html;
  for (const match of main.matchAll(/<a\\b([^>]*?)href=["']([^"']*)["']([^>]*)>([\\s\\S]*?)<\\/a>/gi)) {
    const attrs = match[1] + " " + match[3]; const href = match[2]; const inner = match[4];
    if (!href.trim()) add("error","EMPTY_LINK_TARGET",{file:path.relative(root,file),canonical,href,className:attrs.match(/class=["']([^"']+)/i)?.[1]});
    if (!isInternal(href) || href.startsWith("#")) continue;
    const rawPath = normPath(href); const finalPath = resolve(href);
    if (redirects.has(rawPath)) add("error","LEGACY_COMPARISON_LINK",{file:path.relative(root,file),canonical,href,expected:finalPath});
    const functional = functionalState(href);
    if (canonical && finalPath === canonical && !functional) add("error","SELF_LINK",{file:path.relative(root,file),canonical,href,normalizedTarget:finalPath,cause:attrs.match(/class=["']([^"']+)/i)?.[1] ?? "main-content"});
    if (finalPath && finalPath.startsWith("/") && !existing.has(finalPath) && !finalPath.startsWith("/api/") && !/\\.[a-z0-9]{2,5}\\/$/i.test(finalPath)) add("error","TARGET_404",{file:path.relative(root,file),canonical,href,normalizedTarget:finalPath});
    if (/\\b(?:card|cta)\\b/i.test(attrs) && !inner.replace(/<[^>]+>/g,"").trim()) add("error","EMPTY_LINK_CARD",{file:path.relative(root,file),canonical,href});
  }
  for (const section of main.matchAll(/<section\\b[^>]*(?:pt-next-steps|related)[^>]*>([\\s\\S]*?)<\\/section>/gi)) {
    if (!/<a\\b|<button\\b/i.test(section[1])) add("error","EMPTY_RECOMMENDATION_BLOCK",{file:path.relative(root,file),canonical});
  }
}
const errors = findings.filter((f)=>f.severity==="error");
fs.mkdirSync(reportDir,{recursive:true});
const report = { version:"1.0.0", generatedAt:new Date().toISOString(), strict, summary:{pages:htmlFiles.length,redirectAliases:redirects.size,errors:errors.length}, findings };
fs.writeFileSync(path.join(reportDir,"internal-link-target-audit.json"),JSON.stringify(report,null,2)+"\\n","utf8");
const md=["# Audit interne Vergleichslinks und Selbstlinks","","Erstellt: " + report.generatedAt,"","- Gebaute Seiten: " + report.summary.pages,"- Vergleichs-Aliasse: " + report.summary.redirectAliases,"- Fehler: " + report.summary.errors,"","## Befunde","",...(findings.length?findings.map(f=>"- **" + f.severity.toUpperCase() + " " + f.code + ":** " + (f.file ?? f.route ?? "") + " " + (f.href ?? "") + " " + (f.expected ? "→ " + f.expected : "")):["Keine Befunde."]),""];
fs.writeFileSync(path.join(reportDir,"internal-link-target-audit.md"),md.join("\\n"),"utf8");
console.log("Interne Linkziele: " + htmlFiles.length + " Seiten, " + errors.length + " Fehler.");
if(strict && errors.length) process.exit(1);
`;
}

function testSource() {
  return `import test from "node:test";
import assert from "node:assert/strict";
import { normalizeInternalPath, isSelfLinkTarget, filterSelfLinkItems } from "../src/domain/content/internalUrlPolicy.ts";

test("Redirect-Alias wird auf finale Comparison aufgelöst", () => {
  assert.equal(normalizeInternalPath("https://www.pfotentechnik.de/futterautomat-mit-kamera?utm_source=x#modelle"), "/vergleiche/beste-futterautomaten-mit-kamera/");
});

test("Slash, Host und Protokoll sind für Selbstlinks irrelevant", () => {
  assert.equal(isSelfLinkTarget("http://www.pfotentechnik.de/vergleiche/beste-futterautomaten-ohne-wlan", "https://pfotentechnik.de/vergleiche/beste-futterautomaten-ohne-wlan/"), true);
});

test("reine Sprunglinks bleiben erhalten", () => {
  assert.equal(isSelfLinkTarget("#faq", "/vergleiche/beste-futterautomaten-ohne-wlan/"), false);
});

test("funktionaler Filterzustand wird nicht als gewöhnlicher Selbstlink entfernt", () => {
  assert.equal(isSelfLinkTarget("/vergleiche/beste-futterautomaten-ohne-wlan/?filter=akku", "/vergleiche/beste-futterautomaten-ohne-wlan/"), false);
});

test("Empfehlungslisten verlieren nur echte Selbstlinks", () => {
  const items = filterSelfLinkItems([{href:"/futterautomat-ohne-wlan/"},{href:"/produkt/cat-mate-c500/"}], "/vergleiche/beste-futterautomaten-ohne-wlan/");
  assert.deepEqual(items.map((item)=>item.href), ["/produkt/cat-mate-c500/"]);
});
`;
}

function patchDecisionNextSteps() {
  const before = read(REQUIRED.decisionNextSteps);
  let after = before;
  after = replaceRequired(after,
    'import OptimizedImage from "@affiliate-core/components/OptimizedImage.astro";',
    'import OptimizedImage from "@affiliate-core/components/OptimizedImage.astro";\nimport { filterSelfLinkItems } from "../domain/content/internalUrlPolicy";',
    "DecisionNextSteps Import");
  after = replaceRequired(after,
    `const visibleItems = items\n  .filter((item) => item?.href && item?.title && item?.label)\n  .slice(0, 2);`,
    `const visibleItems = filterSelfLinkItems(\n  items.filter((item) => item?.href && item?.title && item?.label),\n  Astro.url.href\n).slice(0, 2);`,
    "DecisionNextSteps Selbstlinkfilter");
  writeIfChanged(REQUIRED.decisionNextSteps, after, "zentrale Selbstlinkfilterung für Empfehlungs- und CTA-Karten");
}

function patchLinkEngine() {
  const before = read(REQUIRED.linkEngine);
  if (before.includes('new URL(input, "https://pfotentechnik.de/")')) {
    skipped.push({ file: rel(REQUIRED.linkEngine), reason: "bereits aktuell" });
    return;
  }
  const pattern = /const normalizePath = \(value\?: string\) => \{[\s\S]*?\n\};/;
  if (!pattern.test(before)) {
    if (FORCE) {
      ambiguityFindings.push({ type: "architecture", label: "linkEngine URL-Normalisierung", status: "force-skip" });
      return;
    }
    fail("Architekturprüfung fehlgeschlagen: linkEngine URL-Normalisierung");
  }
  const replacement = `const normalizePath = (value?: string) => {
  const input = String(value ?? "").trim();
  if (!input || input.startsWith("#")) return input;
  if (/^(?:mailto:|tel:|sms:|javascript:|data:)/i.test(input)) return "";
  try {
    const url = new URL(input, "https://pfotentechnik.de/");
    if (!["pfotentechnik.de", "www.pfotentechnik.de"].includes(url.hostname.toLowerCase())) return "";
    const pathname = url.pathname.replace(/\\/{2,}/g, "/");
    return pathname === "/" ? "/" : pathname.replace(/\\/+$/, "") + "/";
  } catch {
    return "";
  }
};`;
  const after = before.replace(pattern, replacement);
  writeIfChanged(REQUIRED.linkEngine, after, "Host-, Protokoll- und Slash-sichere Auto-Link-Selbstlinkprüfung");
}

function patchPackageJson() {
  const before = read(REQUIRED.appPackage);
  const pkg = JSON.parse(before);
  pkg.scripts ??= {};
  pkg.scripts["audit:internal-link-targets"] = "node scripts/audit-internal-link-targets.mjs";
  pkg.scripts["audit:internal-link-targets:strict"] = "node scripts/audit-internal-link-targets.mjs --strict";
  const existingTest = pkg.scripts["test:internal-linking"] ?? "";
  if (!existingTest.includes("test/internal-url-policy.test.mjs")) {
    pkg.scripts["test:internal-linking"] = `${existingTest} test/internal-url-policy.test.mjs`.trim();
  }
  writeIfChanged(REQUIRED.appPackage, `${JSON.stringify(pkg, null, 2)}\n`, "Audit- und URL-Policy-Tests registriert");
}

function cleanSources(files, redirectMap) {
  for (const file of files) {
    if (Object.values(GENERATED).includes(file)) continue;
    const before = fs.readFileSync(file, "utf8");
    const after = /\.mdx?$/i.test(file)
      ? transformMarkdown(before, file, redirectMap)
      : transformStructured(before, file, redirectMap);
    writeIfChanged(file, after, "alte interne Vergleichsroute auf finales /vergleiche/-Ziel umgestellt");
  }
}

function writeReports(redirectMap) {
  const sourceReport = {
    version: VERSION,
    generatedAt: new Date().toISOString(),
    dryRun: DRY_RUN,
    redirectAliases: Object.fromEntries([...redirectMap.entries()].sort()),
    summary: {
      changedFiles: changes.length,
      skippedFiles: skipped.length,
      cleanupFindings: cleanupFindings.length,
      ambiguities: ambiguityFindings.length
    },
    changes,
    skipped,
    findings: cleanupFindings,
    ambiguities: ambiguityFindings
  };
  const json = `${JSON.stringify(sourceReport, null, 2)}\n`;
  const md = [
    "# PfotenTechnik Link Cleanup",
    "",
    `Erstellt: ${sourceReport.generatedAt}`,
    "",
    `- Geänderte Dateien: ${changes.length}`,
    `- Übersprungene Dateien: ${skipped.length}`,
    `- Korrigierte Fundstellen: ${cleanupFindings.length}`,
    `- Unklare Fundstellen: ${ambiguityFindings.length}`,
    "",
    "## Änderungen",
    "",
    ...(changes.length ? changes.map((item) => `- ${item.file}: ${item.reason}`) : ["Keine Änderungen."]),
    "",
    "## Fundstellen",
    "",
    ...(cleanupFindings.length ? cleanupFindings.map((item) => `- ${item.type}: ${item.file ?? "Repository"}${item.line ? `:${item.line}` : ""} ${item.oldUrl ?? item.target ?? ""} → ${item.finalUrl ?? item.normalizedTarget ?? ""}`) : ["Keine Fundstellen."]),
    ""
  ].join("\n");
  if (!DRY_RUN) {
    fs.mkdirSync(REPORT_ROOT, { recursive: true });
    fs.writeFileSync(path.join(REPORT_ROOT, "internal-link-cleanup.json"), json, "utf8");
    fs.writeFileSync(path.join(REPORT_ROOT, "internal-link-cleanup.md"), md, "utf8");
  }
}

function syntaxChecks() {
  const files = [process.argv[1], GENERATED.audit, GENERATED.test];
  for (const file of files) if (exists(file)) run(process.execPath, ["--check", file]);
}

function runValidation() {
  if (DRY_RUN || SKIP_TESTS) return;
  if (!SKIP_INSTALL) run("npm", ["install"]);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "test:internal-linking"]);
  run("npm", ["run", "build:pfotentechnik"]);
  const appPkg = JSON.parse(read(REQUIRED.appPackage));
  const candidates = [
    "audit:internal-links:strict",
    "audit:internal-link-targets:strict",
    "audit:repository:strict",
    "audit:technical-seo",
    "comparison:audit:strict",
    "comparison:integrity"
  ];
  for (const script of candidates) {
    if (appPkg.scripts?.[script]) run("npm", ["--workspace", "apps/pfotentechnik", "run", script]);
    else log(`Übersprungen: Script nicht vorhanden: ${script}`);
  }
}

log("Vorprüfung");
validateRepository();
const redirectMap = parseRedirects(read(REQUIRED.redirects));
const sourceFiles = collectSourceFiles();
snapshotCanonicals(sourceFiles);
log(`${redirectMap.size} eindeutige Vergleichs-Aliasse aus _redirects gelesen.`);
log(`${sourceFiles.length} produktive Quelldateien im Prüfumfang.`);

cleanSources(sourceFiles, redirectMap);
writeIfChanged(GENERATED.policy, policySource(redirectMap), "zentrale URL-Normalisierung und Redirect-Alias-Auflösung");
writeIfChanged(GENERATED.audit, auditSource(), "strikter Audit für gebautes HTML");
writeIfChanged(GENERATED.test, testSource(), "Tests für URL-Normalisierung und Selbstlinkfilter");
patchDecisionNextSteps();
patchLinkEngine();
patchPackageJson();

if (!DRY_RUN) assertCanonicalsUnchanged(sourceFiles);
syntaxChecks();
writeReports(redirectMap);
runValidation();

log("");
log("Abgeschlossen.");
log(`Geänderte Dateien: ${changes.length}`);
log(`Übersprungene Dateien: ${skipped.length}`);
log(`Korrigierte Fundstellen: ${cleanupFindings.length}`);
if (changes.length && !DRY_RUN) log(`Backups: ${rel(BACKUP_ROOT)}`);
log(`Berichte: ${rel(REPORT_ROOT)}/internal-link-cleanup.{json,md}`);
log("Keine GitHub-Veröffentlichung, kein Push und kein Pull Request wurden ausgeführt.");

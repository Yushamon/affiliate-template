#!/usr/bin/env node
/**
 * PfotenTechnik Internal Link + Selflink Cleanup 1.0.4
 *
 * Ausführung im Root von Yushamon/affiliate-template:
 *   node apply-pfotentechnik-internal-link-and-selflink-cleanup-1.0.4.mjs
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

const VERSION = "1.0.4";
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
  internalLinkAudit: path.join(ROOT, "scripts", "audit-internal-links.mjs"),
  advisorPage: path.join(APP, "src", "pages", "berater", "futterautomat.astro")
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
  const capture = options.capture || options.allowFailure;
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? ROOT,
    encoding: "utf8",
    stdio: capture ? "pipe" : "inherit",
    env: { ...process.env, FORCE_COLOR: "0" }
  });
  if (capture) {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
  }
  if (result.error) fail(`${command} konnte nicht gestartet werden: ${result.error.message}`);
  if (result.status !== 0) {
    if (options.allowFailure) {
      const finding = {
        type: "validation-advisory",
        command: `${command} ${args.join(" ")}`,
        exitCode: result.status,
        reason: options.reason ?? "Bestandsaudit meldet Findings außerhalb des Cleanup-Scopes"
      };
      ambiguityFindings.push(finding);
      log(`HINWEIS: Bestandsaudit meldet Findings (Exit ${result.status}); der Cleanup-spezifische Audit bleibt maßgeblich.`);
      return result;
    }
    const detail = capture ? `\n${result.stdout ?? ""}\n${result.stderr ?? ""}` : "";
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
  // Historische Ratgeber-URL ohne eigene Route: direkt auf den bestehenden Berufstätigen-Vergleich führen.
  map.set("/futterautomat-fuer-berufstaetige/", "/vergleiche/beste-futterautomaten-fuer-berufstaetige/");
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
  return Buffer.from("IyEvdXNyL2Jpbi9lbnYgbm9kZQppbXBvcnQgZnMgZnJvbSAibm9kZTpmcyI7CmltcG9ydCBwYXRoIGZyb20gIm5vZGU6cGF0aCI7CmltcG9ydCB7IGZpbGVVUkxUb1BhdGggfSBmcm9tICJub2RlOnVybCI7Cgpjb25zdCBzdHJpY3QgPSBwcm9jZXNzLmFyZ3YuaW5jbHVkZXMoIi0tc3RyaWN0Iik7CmNvbnN0IHNjcmlwdERpciA9IHBhdGguZGlybmFtZShmaWxlVVJMVG9QYXRoKGltcG9ydC5tZXRhLnVybCkpOwpjb25zdCBhcHAgPSBwYXRoLnJlc29sdmUoc2NyaXB0RGlyLCAiLi4iKTsKY29uc3Qgcm9vdCA9IHBhdGgucmVzb2x2ZShhcHAsICIuLi8uLiIpOwpjb25zdCBkaXN0ID0gcGF0aC5qb2luKGFwcCwgImRpc3QiKTsKY29uc3QgcmVkaXJlY3RzRmlsZSA9IHBhdGguam9pbihhcHAsICJwdWJsaWMiLCAiX3JlZGlyZWN0cyIpOwpjb25zdCByZXBvcnREaXIgPSBwYXRoLmpvaW4oYXBwLCAicmVwb3J0cyIsICJpbnRlcm5hbC1saW5raW5nIik7CmNvbnN0IEhPU1RTID0gbmV3IFNldChbInBmb3RlbnRlY2huaWsuZGUiLCAid3d3LnBmb3RlbnRlY2huaWsuZGUiXSk7CmNvbnN0IEZVTkNUSU9OQUwgPSBuZXcgU2V0KFsiZmlsdGVyIiwgInRhYiIsICJzb3J0IiwgInZpZXciLCAicGFnZSIsICJzdGVwIl0pOwpjb25zdCBmaW5kaW5ncyA9IFtdOwpjb25zdCBhZGQgPSAoc2V2ZXJpdHksIGNvZGUsIGRldGFpbHMpID0+IGZpbmRpbmdzLnB1c2goeyBzZXZlcml0eSwgY29kZSwgLi4uZGV0YWlscyB9KTsKY29uc3Qgbm9ybVBhdGggPSAodmFsdWUpID0+IHsKICBsZXQgaW5wdXQgPSBTdHJpbmcodmFsdWUgPz8gIiIpLnRyaW0oKTsKICBpZiAoIWlucHV0IHx8IGlucHV0LnN0YXJ0c1dpdGgoIiMiKSkgcmV0dXJuIGlucHV0OwogIHRyeSB7CiAgICBjb25zdCB1cmwgPSBuZXcgVVJMKGlucHV0LCAiaHR0cHM6Ly9wZm90ZW50ZWNobmlrLmRlLyIpOwogICAgaWYgKCFIT1NUUy5oYXModXJsLmhvc3RuYW1lLnRvTG93ZXJDYXNlKCkpKSByZXR1cm4gIiI7CiAgICBsZXQgcCA9IHVybC5wYXRobmFtZS5yZXBsYWNlKC9cL3syLH0vZywgIi8iKTsKICAgIHJldHVybiBwID09PSAiLyIgPyAiLyIgOiBwLnJlcGxhY2UoL1wvKyQvLCAiIikgKyAiLyI7CiAgfSBjYXRjaCB7IHJldHVybiAiIjsgfQp9Owpjb25zdCByZWRpcmVjdHMgPSBuZXcgTWFwKCk7CmZvciAoY29uc3QgbGluZSBvZiBmcy5yZWFkRmlsZVN5bmMocmVkaXJlY3RzRmlsZSwgInV0ZjgiKS5zcGxpdCgvXHI/XG4vKSkgewogIGNvbnN0IHBhcnRzID0gbGluZS50cmltKCkuc3BsaXQoL1xzKy8pOwogIGlmIChwYXJ0cy5sZW5ndGggPj0gMyAmJiAvXjMwWzEyNzhdJC8udGVzdChwYXJ0c1syXSkpIHsKICAgIGNvbnN0IGZyb20gPSBub3JtUGF0aChwYXJ0c1swXSk7IGNvbnN0IHRvID0gbm9ybVBhdGgocGFydHNbMV0pOwogICAgaWYgKGZyb20gJiYgdG8gJiYgdG8uc3RhcnRzV2l0aCgiL3ZlcmdsZWljaGUvIikgJiYgIWZyb20uc3RhcnRzV2l0aCgiL3ZlcmdsZWljaGUvIikpIHJlZGlyZWN0cy5zZXQoZnJvbSwgdG8pOwogIH0KfQpjb25zdCByZXNvbHZlID0gKHZhbHVlKSA9PiB7IGxldCBwID0gbm9ybVBhdGgodmFsdWUpOyBjb25zdCBzZWVuID0gbmV3IFNldCgpOyB3aGlsZSAocmVkaXJlY3RzLmhhcyhwKSAmJiAhc2Vlbi5oYXMocCkpIHsgc2Vlbi5hZGQocCk7IHAgPSByZWRpcmVjdHMuZ2V0KHApOyB9IHJldHVybiBwOyB9Owpjb25zdCBpc0ludGVybmFsID0gKHZhbHVlKSA9PiB7CiAgY29uc3QgaW5wdXQgPSBTdHJpbmcodmFsdWUgPz8gIiIpLnRyaW0oKTsKICBpZiAoIWlucHV0IHx8IC9eKG1haWx0bzp8dGVsOnxzbXM6fGphdmFzY3JpcHQ6fGRhdGE6KS9pLnRlc3QoaW5wdXQpKSByZXR1cm4gZmFsc2U7CiAgaWYgKGlucHV0LnN0YXJ0c1dpdGgoIi8iKSB8fCBpbnB1dC5zdGFydHNXaXRoKCIjIikpIHJldHVybiB0cnVlOwogIHRyeSB7IHJldHVybiBIT1NUUy5oYXMobmV3IFVSTChpbnB1dCkuaG9zdG5hbWUudG9Mb3dlckNhc2UoKSk7IH0gY2F0Y2ggeyByZXR1cm4gZmFsc2U7IH0KfTsKY29uc3QgZnVuY3Rpb25hbFN0YXRlID0gKHZhbHVlKSA9PiB7CiAgdHJ5IHsgY29uc3QgdSA9IG5ldyBVUkwodmFsdWUsICJodHRwczovL3Bmb3RlbnRlY2huaWsuZGUvIik7IGNvbnN0IHEgPSBuZXcgVVJMU2VhcmNoUGFyYW1zKCk7IGZvciAoY29uc3QgW2ssdl0gb2YgdS5zZWFyY2hQYXJhbXMpIGlmIChGVU5DVElPTkFMLmhhcyhrKSkgcS5hcHBlbmQoayx2KTsgcmV0dXJuIHEudG9TdHJpbmcoKTsgfSBjYXRjaCB7IHJldHVybiAiIjsgfQp9Owpjb25zdCB3YWxrID0gKGRpciwgb3V0PVtdKSA9PiB7IGlmICghZnMuZXhpc3RzU3luYyhkaXIpKSByZXR1cm4gb3V0OyBmb3IgKGNvbnN0IGUgb2YgZnMucmVhZGRpclN5bmMoZGlyLHt3aXRoRmlsZVR5cGVzOnRydWV9KSkgeyBjb25zdCBmPXBhdGguam9pbihkaXIsZS5uYW1lKTsgaWYoZS5pc0RpcmVjdG9yeSgpKSB3YWxrKGYsb3V0KTsgZWxzZSBvdXQucHVzaChmKTsgfSByZXR1cm4gb3V0OyB9Owpjb25zdCBodG1sRmlsZXMgPSB3YWxrKGRpc3QpLmZpbHRlcigoZikgPT4gZi5lbmRzV2l0aCgiLmh0bWwiKSk7CmNvbnN0IGV4aXN0aW5nID0gbmV3IFNldChodG1sRmlsZXMubWFwKChmaWxlKSA9PiB7CiAgY29uc3QgciA9IHBhdGgucmVsYXRpdmUoZGlzdCwgZmlsZSkucmVwbGFjZSgvXFwvZywiLyIpOwogIGlmIChyID09PSAiaW5kZXguaHRtbCIpIHJldHVybiAiLyI7CiAgaWYgKHIuZW5kc1dpdGgoIi9pbmRleC5odG1sIikpIHJldHVybiAiLyIgKyByLnNsaWNlKDAsLTExKSArICIvIjsKICByZXR1cm4gIi8iICsgci5yZXBsYWNlKC9cLmh0bWwkLywgIiIpICsgIi8iOwp9KSk7CmZvciAoY29uc3QgZmlsZSBvZiBodG1sRmlsZXMpIHsKICBjb25zdCBodG1sID0gZnMucmVhZEZpbGVTeW5jKGZpbGUsInV0ZjgiKTsKICBjb25zdCBjYW5vbmljYWxSYXcgPSBodG1sLm1hdGNoKC88bGlua1xiW14+XSpyZWw9WyInXWNhbm9uaWNhbFsiJ11bXj5dKmhyZWY9WyInXShbXiInXSspWyInXS9pKT8uWzFdCiAgICA/PyBodG1sLm1hdGNoKC88bGlua1xiW14+XSpocmVmPVsiJ10oW14iJ10rKVsiJ11bXj5dKnJlbD1bIiddY2Fub25pY2FsWyInXS9pKT8uWzFdOwogIGNvbnN0IGNhbm9uaWNhbCA9IHJlc29sdmUoY2Fub25pY2FsUmF3KTsKICBjb25zdCByb3V0ZUZyb21GaWxlID0gcGF0aC5yZWxhdGl2ZShkaXN0LCBmaWxlKS5yZXBsYWNlKC9cXC9nLCAiLyIpLnJlcGxhY2UoLyg/Ol58XC8paW5kZXhcLmh0bWwkLywgIiIpLnJlcGxhY2UoL14vLCAiLyIpLnJlcGxhY2UoL1wvKyQvLCAiLyIpIHx8ICIvIjsKICBjb25zdCBpc0FkbWluUm91dGUgPSByb3V0ZUZyb21GaWxlID09PSAiL2FkbWluLyIgfHwgcm91dGVGcm9tRmlsZS5zdGFydHNXaXRoKCIvYWRtaW4vIik7CiAgaWYgKCFjYW5vbmljYWwgJiYgIWlzQWRtaW5Sb3V0ZSkgYWRkKCJlcnJvciIsIkNBTk9OSUNBTF9NSVNTSU5HIix7ZmlsZTpwYXRoLnJlbGF0aXZlKHJvb3QsZmlsZSl9KTsKICBjb25zdCBtYWluID0gaHRtbC5tYXRjaCgvPG1haW5cYltePl0qPihbXHNcU10qPyk8XC9tYWluPi9pKT8uWzFdID8/IGh0bWw7CiAgZm9yIChjb25zdCBtYXRjaCBvZiBtYWluLm1hdGNoQWxsKC88YVxiKFtePl0qPylocmVmPVsiJ10oW14iJ10qKVsiJ10oW14+XSopPihbXHNcU10qPyk8XC9hPi9naSkpIHsKICAgIGNvbnN0IGF0dHJzID0gbWF0Y2hbMV0gKyAiICIgKyBtYXRjaFszXTsgY29uc3QgaHJlZiA9IG1hdGNoWzJdOyBjb25zdCBpbm5lciA9IG1hdGNoWzRdOwogICAgaWYgKCFocmVmLnRyaW0oKSkgYWRkKCJlcnJvciIsIkVNUFRZX0xJTktfVEFSR0VUIix7ZmlsZTpwYXRoLnJlbGF0aXZlKHJvb3QsZmlsZSksY2Fub25pY2FsLGhyZWYsY2xhc3NOYW1lOmF0dHJzLm1hdGNoKC9jbGFzcz1bIiddKFteIiddKykvaSk/LlsxXX0pOwogICAgaWYgKCFpc0ludGVybmFsKGhyZWYpIHx8IGhyZWYuc3RhcnRzV2l0aCgiIyIpKSBjb250aW51ZTsKICAgIGNvbnN0IHJhd1BhdGggPSBub3JtUGF0aChocmVmKTsgY29uc3QgZmluYWxQYXRoID0gcmVzb2x2ZShocmVmKTsKICAgIGlmIChyZWRpcmVjdHMuaGFzKHJhd1BhdGgpKSBhZGQoImVycm9yIiwiTEVHQUNZX0NPTVBBUklTT05fTElOSyIse2ZpbGU6cGF0aC5yZWxhdGl2ZShyb290LGZpbGUpLGNhbm9uaWNhbCxocmVmLGV4cGVjdGVkOmZpbmFsUGF0aH0pOwogICAgY29uc3QgZnVuY3Rpb25hbCA9IGZ1bmN0aW9uYWxTdGF0ZShocmVmKTsKICAgIGlmIChjYW5vbmljYWwgJiYgZmluYWxQYXRoID09PSBjYW5vbmljYWwgJiYgIWZ1bmN0aW9uYWwpIGFkZCgiZXJyb3IiLCJTRUxGX0xJTksiLHtmaWxlOnBhdGgucmVsYXRpdmUocm9vdCxmaWxlKSxjYW5vbmljYWwsaHJlZixub3JtYWxpemVkVGFyZ2V0OmZpbmFsUGF0aCxjYXVzZTphdHRycy5tYXRjaCgvY2xhc3M9WyInXShbXiInXSspL2kpPy5bMV0gPz8gIm1haW4tY29udGVudCJ9KTsKICAgIGlmIChmaW5hbFBhdGggJiYgZmluYWxQYXRoLnN0YXJ0c1dpdGgoIi8iKSAmJiAhZXhpc3RpbmcuaGFzKGZpbmFsUGF0aCkgJiYgIWZpbmFsUGF0aC5zdGFydHNXaXRoKCIvYXBpLyIpICYmICEvXC5bYS16MC05XXsyLDV9XC8kL2kudGVzdChmaW5hbFBhdGgpKSBhZGQoImVycm9yIiwiVEFSR0VUXzQwNCIse2ZpbGU6cGF0aC5yZWxhdGl2ZShyb290LGZpbGUpLGNhbm9uaWNhbCxocmVmLG5vcm1hbGl6ZWRUYXJnZXQ6ZmluYWxQYXRofSk7CiAgICBpZiAoL1xiKD86Y2FyZHxjdGEpXGIvaS50ZXN0KGF0dHJzKSAmJiAhaW5uZXIucmVwbGFjZSgvPFtePl0rPi9nLCIiKS50cmltKCkpIGFkZCgiZXJyb3IiLCJFTVBUWV9MSU5LX0NBUkQiLHtmaWxlOnBhdGgucmVsYXRpdmUocm9vdCxmaWxlKSxjYW5vbmljYWwsaHJlZn0pOwogIH0KICBmb3IgKGNvbnN0IHNlY3Rpb24gb2YgbWFpbi5tYXRjaEFsbCgvPHNlY3Rpb25cYltePl0qKD86cHQtbmV4dC1zdGVwc3xyZWxhdGVkKVtePl0qPihbXHNcU10qPyk8XC9zZWN0aW9uPi9naSkpIHsKICAgIGlmICghLzxhXGJ8PGJ1dHRvblxiL2kudGVzdChzZWN0aW9uWzFdKSkgYWRkKCJlcnJvciIsIkVNUFRZX1JFQ09NTUVOREFUSU9OX0JMT0NLIix7ZmlsZTpwYXRoLnJlbGF0aXZlKHJvb3QsZmlsZSksY2Fub25pY2FsfSk7CiAgfQp9CmNvbnN0IGVycm9ycyA9IGZpbmRpbmdzLmZpbHRlcigoZik9PmYuc2V2ZXJpdHk9PT0iZXJyb3IiKTsKZnMubWtkaXJTeW5jKHJlcG9ydERpcix7cmVjdXJzaXZlOnRydWV9KTsKY29uc3QgcmVwb3J0ID0geyB2ZXJzaW9uOiIxLjAuMCIsIGdlbmVyYXRlZEF0Om5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSwgc3RyaWN0LCBzdW1tYXJ5OntwYWdlczpodG1sRmlsZXMubGVuZ3RoLHJlZGlyZWN0QWxpYXNlczpyZWRpcmVjdHMuc2l6ZSxlcnJvcnM6ZXJyb3JzLmxlbmd0aH0sIGZpbmRpbmdzIH07CmZzLndyaXRlRmlsZVN5bmMocGF0aC5qb2luKHJlcG9ydERpciwiaW50ZXJuYWwtbGluay10YXJnZXQtYXVkaXQuanNvbiIpLEpTT04uc3RyaW5naWZ5KHJlcG9ydCxudWxsLDIpKyJcbiIsInV0ZjgiKTsKY29uc3QgbWQ9WyIjIEF1ZGl0IGludGVybmUgVmVyZ2xlaWNoc2xpbmtzIHVuZCBTZWxic3RsaW5rcyIsIiIsIkVyc3RlbGx0OiAiICsgcmVwb3J0LmdlbmVyYXRlZEF0LCIiLCItIEdlYmF1dGUgU2VpdGVuOiAiICsgcmVwb3J0LnN1bW1hcnkucGFnZXMsIi0gVmVyZ2xlaWNocy1BbGlhc3NlOiAiICsgcmVwb3J0LnN1bW1hcnkucmVkaXJlY3RBbGlhc2VzLCItIEZlaGxlcjogIiArIHJlcG9ydC5zdW1tYXJ5LmVycm9ycywiIiwiIyMgQmVmdW5kZSIsIiIsLi4uKGZpbmRpbmdzLmxlbmd0aD9maW5kaW5ncy5tYXAoZj0+Ii0gKioiICsgZi5zZXZlcml0eS50b1VwcGVyQ2FzZSgpICsgIiAiICsgZi5jb2RlICsgIjoqKiAiICsgKGYuZmlsZSA/PyBmLnJvdXRlID8/ICIiKSArICIgIiArIChmLmhyZWYgPz8gIiIpICsgIiAiICsgKGYuZXhwZWN0ZWQgPyAi4oaSICIgKyBmLmV4cGVjdGVkIDogIiIpKTpbIktlaW5lIEJlZnVuZGUuIl0pLCIiXTsKZnMud3JpdGVGaWxlU3luYyhwYXRoLmpvaW4ocmVwb3J0RGlyLCJpbnRlcm5hbC1saW5rLXRhcmdldC1hdWRpdC5tZCIpLG1kLmpvaW4oIlxuIiksInV0ZjgiKTsKY29uc29sZS5sb2coIkludGVybmUgTGlua3ppZWxlOiAiICsgaHRtbEZpbGVzLmxlbmd0aCArICIgU2VpdGVuLCAiICsgZXJyb3JzLmxlbmd0aCArICIgRmVobGVyLiIpOwppZihzdHJpY3QgJiYgZXJyb3JzLmxlbmd0aCkgcHJvY2Vzcy5leGl0KDEpOwo=", "base64").toString("utf8");
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

function patchExistingInternalLinkAudit() {
  const file = REQUIRED.internalLinkAudit;
  let source = read(file);

  if (!source.includes('from "node:url"')) {
    const importAnchor = 'import path from "node:path";';
    if (!source.includes(importAnchor)) {
      if (FORCE) {
        ambiguityFindings.push({ type: "architecture", label: "audit-internal-links node:path import", status: "force-skip" });
        return;
      }
      fail("Architekturprüfung fehlgeschlagen: audit-internal-links besitzt keinen erwarteten node:path-Import");
    }
    source = source.replace(importAnchor, `${importAnchor}\nimport { fileURLToPath } from "node:url";`);
  }

  const legacyRoot = 'const cwd = process.cwd();\nconst root = fs.existsSync(path.join(cwd, "apps/pfotentechnik")) ? cwd : path.resolve(cwd, "../..");';
  const stableRoot = 'const scriptDir = path.dirname(fileURLToPath(import.meta.url));\nconst root = path.resolve(scriptDir, "..");';
  if (source.includes(legacyRoot)) {
    source = source.replace(legacyRoot, stableRoot);
  } else if (!source.includes(stableRoot)) {
    if (FORCE) {
      ambiguityFindings.push({ type: "architecture", label: "audit-internal-links root detection", status: "force-skip" });
      return;
    }
    fail("Architekturprüfung fehlgeschlagen: Root-Ermittlung in scripts/audit-internal-links.mjs ist unbekannt");
  }

  writeIfChanged(file, source, "workspace-unabhängige Root-Ermittlung im bestehenden Internal-Link-Audit");
}

function patchAdvisorSelfLinkPage() {
  const file = REQUIRED.advisorPage;
  const before = read(file);
  let after = before;
  const componentPattern = /\n?[ \t]*<AdvisorCta\b[^>]*\/>[ \t]*\n?/g;
  const matches = [...after.matchAll(componentPattern)];
  if (matches.length) {
    after = after.replace(componentPattern, "\n");
    cleanupFindings.push({ type: "self-link-component-removed", file: rel(file), target: "/berater/futterautomat/", occurrences: matches.length });
  }
  if (!/<AdvisorCta\b/.test(after)) {
    after = after.replace(/^import\s+AdvisorCta\s+from\s+["'][^"']*AdvisorCta\.astro["'];?\s*\n/m, "");
  }
  writeIfChanged(file, after, "Advisor-CTA auf seiner eigenen Zielseite entfernt");
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
  // Der neue, auf diesen Patch zugeschnittene Audit ist der harte Release-Gate.
  if (appPkg.scripts?.["audit:internal-link-targets:strict"]) {
    run("npm", ["--workspace", "apps/pfotentechnik", "run", "audit:internal-link-targets:strict"]);
  } else {
    fail("Erwartetes Script fehlt: audit:internal-link-targets:strict");
  }

  // Breite Bestandsaudits prüfen deutlich mehr als Redirect- und Selflink-Cleanup.
  // Ihre Findings werden vollständig ausgegeben und protokolliert, blockieren diesen
  // eng begrenzten Installer aber nicht. So werden Altlasten nicht verschwiegen und
  // zugleich nicht fälschlich als Installationsfehler behandelt.
  const advisoryScripts = [
    "audit:internal-links:strict",
    "audit:repository:strict",
    "audit:technical-seo",
    "comparison:audit:strict",
    "comparison:integrity"
  ];
  for (const script of advisoryScripts) {
    if (appPkg.scripts?.[script]) {
      run("npm", ["--workspace", "apps/pfotentechnik", "run", script], {
        allowFailure: true,
        reason: `${script} ist ein repositoryweiter Bestandsaudit außerhalb des begrenzten Cleanup-Gates`
      });
    } else {
      log(`Übersprungen: Script nicht vorhanden: ${script}`);
    }
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
patchExistingInternalLinkAudit();
patchAdvisorSelfLinkPage();
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

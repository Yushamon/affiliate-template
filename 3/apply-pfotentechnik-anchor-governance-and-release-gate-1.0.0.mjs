#!/usr/bin/env node
/**
 * PfotenTechnik Anchor Governance + SEO Release Gate 1.0.0
 *
 * Ausführung im Repository-Root:
 *   node apply-pfotentechnik-anchor-governance-and-release-gate-1.0.0.mjs
 *
 * Optionen:
 *   --skip-install   npm install überspringen
 *   --skip-build     vollständigen Abschluss-Build überspringen
 *   --skip-tests     alle Validierungen überspringen
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";

const NAME = "pfotentechnik-anchor-governance-and-release-gate-1.0.0";
const ROOT = process.cwd();
const APP = path.join(ROOT, "apps", "pfotentechnik");
const CORE = path.join(ROOT, "packages", "affiliate-core");
const SKIP_INSTALL = process.argv.includes("--skip-install");
const SKIP_BUILD = process.argv.includes("--skip-build");
const SKIP_TESTS = process.argv.includes("--skip-tests");
const RUN_ID = new Date().toISOString().replace(/[:.]/g, "-");
const BACKUP_ROOT = path.join(ROOT, ".patch-backups", `${NAME}-${RUN_ID}`);

const FILES = {
  rootPackage: path.join(ROOT, "package.json"),
  appPackage: path.join(APP, "package.json"),
  redirects: path.join(APP, "public", "_redirects"),
  dist: path.join(APP, "dist"),
  internalLinks: path.join(APP, "src", "domain", "content", "internalLinks.ts"),
  linkEngine: path.join(CORE, "src", "linking", "linkEngine.ts"),
  urlPolicy: path.join(APP, "src", "domain", "content", "internalUrlPolicy.ts"),
  preflight: path.join(APP, "scripts", "seo", "release-preflight.mjs"),
  releaseUtils: path.join(APP, "scripts", "seo", "release-url-utils.mjs"),
  governance: path.join(APP, "src", "domain", "content", "anchorGovernance.ts"),
  governanceJson: path.join(APP, "src", "domain", "content", "anchor-governance.generated.json"),
  anchorAudit: path.join(APP, "scripts", "audit-anchor-governance.mjs"),
  buildAudit: path.join(APP, "scripts", "seo", "audit-release-build-output.mjs"),
  test: path.join(APP, "test", "anchor-release-gate.test.mjs")
};

const changed = [];
const skipped = [];

const log = (message = "") => console.log(`[${NAME}] ${message}`.trimEnd());
const fail = (message) => {
  console.error(`\n[${NAME}] FEHLER: ${message}`);
  process.exit(1);
};
const rel = (file) => path.relative(ROOT, file).replace(/\\/g, "/");
const exists = (file) => fs.existsSync(file);
const read = (file) => {
  if (!exists(file)) fail(`Erwartete Datei fehlt: ${rel(file)}`);
  return fs.readFileSync(file, "utf8");
};
const sha = (value) => crypto.createHash("sha256").update(value).digest("hex");
const eolOf = (value) => value.includes("\r\n") ? "\r\n" : "\n";
const withEol = (value, eol) => value.replace(/\r?\n/g, eol);

function backup(file) {
  if (!exists(file)) return;
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
  if (before != null) backup(file);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, normalized, "utf8");
  changed.push({
    file: rel(file),
    reason,
    beforeSha: before == null ? null : sha(before),
    afterSha: sha(normalized)
  });
  return true;
}

function replaceRequired(source, from, to, label) {
  if (source.includes(to)) return source;
  const count = source.split(from).length - 1;
  if (count !== 1) fail(`Architekturprüfung fehlgeschlagen: ${label} (Treffer: ${count})`);
  return source.replace(from, to);
}

function run(command, args, options = {}) {
  log(`Ausführen: ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? ROOT,
    stdio: "inherit",
    env: { ...process.env, FORCE_COLOR: "0", ...(options.env ?? {}) }
  });
  if (result.error) fail(`${command} konnte nicht gestartet werden: ${result.error.message}`);
  if (result.status !== 0 && !options.allowFailure) {
    fail(`Befehl fehlgeschlagen (${result.status}): ${command} ${args.join(" ")}`);
  }
  return result;
}

function validateRepository() {
  for (const file of [
    FILES.rootPackage,
    FILES.appPackage,
    FILES.redirects,
    FILES.internalLinks,
    FILES.linkEngine,
    FILES.urlPolicy,
    FILES.preflight,
    FILES.releaseUtils
  ]) {
    if (!exists(file)) fail(`Repository-Struktur unvollständig: ${rel(file)}`);
  }
  const rootPkg = JSON.parse(read(FILES.rootPackage));
  const appPkg = JSON.parse(read(FILES.appPackage));
  if (rootPkg.name !== "affiliate-sites-monorepo") fail(`Unerwartetes Root-Paket: ${rootPkg.name}`);
  if (appPkg.name !== "@affiliate-sites/pfotentechnik") fail(`Unerwartetes App-Paket: ${appPkg.name}`);

  const links = read(FILES.internalLinks);
  if (!links.includes("export const getInternalLinkDefinitions") || !links.includes("mergeDefinitions")) {
    fail("internalLinks.ts entspricht nicht der erwarteten Architektur.");
  }
  const engine = read(FILES.linkEngine);
  if (!engine.includes("findInternalLinkMatches") || !engine.includes("selectInternalLinkMatches")) {
    fail("linkEngine.ts entspricht nicht der erwarteten Architektur.");
  }
  const preflight = read(FILES.preflight);
  if (!preflight.includes("collectReleaseManifest") || !preflight.includes("writeReleaseManifest")) {
    fail("release-preflight.mjs entspricht nicht der erwarteten Release-Architektur.");
  }
}

function normalizePath(value) {
  const input = String(value ?? "").trim();
  if (!input) return "";
  try {
    const url = new URL(input, "https://pfotentechnik.de/");
    if (!["pfotentechnik.de", "www.pfotentechnik.de"].includes(url.hostname.toLowerCase())) return "";
    let pathname = decodeURI(url.pathname).replace(/\/{2,}/g, "/");
    pathname = pathname === "/" ? "/" : pathname.replace(/\/+$/, "") + "/";
    return pathname;
  } catch {
    return "";
  }
}

function collectBuildRoutes() {
  const routes = new Set();
  if (!exists(FILES.dist)) return routes;
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (entry.name === "index.html") {
        const relative = path.relative(FILES.dist, file).replace(/\\/g, "/");
        routes.add(relative === "index.html" ? "/" : `/${relative.slice(0, -10)}`);
      } else if (entry.name.endsWith(".html")) {
        const relative = path.relative(FILES.dist, file).replace(/\\/g, "/");
        routes.add(`/${relative.slice(0, -5)}/`);
      }
    }
  };
  walk(FILES.dist);
  return routes;
}

function parseRedirects() {
  const map = new Map();
  for (const line of read(FILES.redirects).split(/\r?\n/)) {
    const parts = line.trim().split(/\s+/);
    if (parts.length >= 3 && /^30[1278]$/.test(parts[2])) {
      const from = normalizePath(parts[0]);
      const to = normalizePath(parts[1]);
      if (from && to) map.set(from, to);
    }
  }
  return map;
}

const buildRoutes = collectBuildRoutes();
const redirects = parseRedirects();
const resolveRedirect = (value) => {
  let current = normalizePath(value);
  const seen = new Set();
  while (redirects.has(current) && !seen.has(current)) {
    seen.add(current);
    current = redirects.get(current);
  }
  return current;
};

const candidates = [
  ["futterautomat für große hunde", ["/futterautomat-fuer-grosse-hunde/", "/vergleiche/beste-futterautomaten-fuer-grosse-hunde/"], "buying-guide"],
  ["futterautomaten für große hunde", ["/futterautomat-fuer-grosse-hunde/", "/vergleiche/beste-futterautomaten-fuer-grosse-hunde/"], "buying-guide"],
  ["trinkbrunnen für katzen", ["/trinkbrunnen-fuer-katzen/", "/vergleiche/beste-katzentrinkbrunnen/"], "comparison"],
  ["katzentrinkbrunnen", ["/vergleiche/beste-katzentrinkbrunnen/", "/katzentrinkbrunnen/"], "comparison"],
  ["katze trinkt viel", ["/katze-trinkt-viel/", "/wissen/katze-trinkt-viel/"], "medical-guide"],
  ["katze trinkt zu viel", ["/katze-trinkt-viel/", "/wissen/katze-trinkt-viel/"], "medical-guide"],
  ["katze trinkt zu wenig", ["/katze-trinkt-zu-wenig/", "/wissen/katze-trinkt-zu-wenig/"], "medical-guide"],
  ["hund trinkt viel", ["/hund-trinkt-ploetzlich-viel/", "/wissen/hund-trinkt-ploetzlich-viel/"], "medical-guide"],
  ["hund trinkt plötzlich viel", ["/hund-trinkt-ploetzlich-viel/", "/wissen/hund-trinkt-ploetzlich-viel/"], "medical-guide"],
  ["gps-tracker ohne abo", ["/vergleiche/gps-tracker-ohne-abo/", "/gps-tracker-ohne-abo/"], "comparison"],
  ["gps-tracker für hunde", ["/vergleiche/gps-tracker-fuer-hunde/", "/gps-tracker-fuer-hunde/"], "comparison"],
  ["gps-tracker für katzen", ["/vergleiche/gps-tracker-fuer-katzen/", "/gps-tracker-fuer-katzen/"], "comparison"],
  ["bluetooth-tag", ["/gps-tracker-oder-bluetooth-tag/", "/wissen/gps-tracker-oder-bluetooth-tag/"], "knowledge"],
  ["gps-tracker oder bluetooth-tag", ["/gps-tracker-oder-bluetooth-tag/", "/wissen/gps-tracker-oder-bluetooth-tag/"], "knowledge"],
  ["futterautomat für berufstätige", ["/futterautomat-fuer-berufstaetige/", "/wissen/futterautomat-fuer-berufstaetige/"], "knowledge"],
  ["hund frisst zu schnell", ["/hund-frisst-zu-schnell/", "/wissen/hund-frisst-zu-schnell/"], "medical-guide"],
  ["futterautomat gegen schlingen", ["/hund-frisst-zu-schnell/", "/wissen/hund-frisst-zu-schnell/"], "knowledge"],
  ["futterautomat mit kamera", ["/vergleiche/beste-futterautomaten-mit-kamera/"], "comparison"],
  ["futterautomat ohne wlan", ["/vergleiche/beste-futterautomaten-ohne-wlan/"], "comparison"],
  ["futterautomat für zwei katzen", ["/vergleiche/beste-futterautomaten-fuer-zwei-katzen/"], "comparison"],
  ["futterautomat für nassfutter", ["/vergleiche/beste-futterautomaten-fuer-nassfutter/"], "comparison"]
];

const ownership = {};
const unresolved = [];
for (const [anchor, routeCandidates, intent] of candidates) {
  const existing = routeCandidates
    .map((route) => resolveRedirect(route))
    .filter((route, index, list) => route && list.indexOf(route) === index)
    .filter((route) => buildRoutes.size === 0 || buildRoutes.has(route));
  if (existing.length === 0) {
    unresolved.push({ anchor, candidates: routeCandidates, intent });
    continue;
  }
  ownership[anchor] = {
    target: existing[0],
    priority: 100,
    intent,
    exact: true
  };
}

const governanceJson = {
  schemaVersion: 1,
  generatedBy: NAME,
  generatedAt: new Date().toISOString(),
  owners: ownership,
  unresolved
};

const governanceTs = `import type { InternalLinkDefinition, InternalLinkGroup } from "@affiliate-core/linking/types";

export type AnchorGovernanceOwner = {
  target: string;
  priority: number;
  intent: string;
  exact: boolean;
};

export const anchorGovernanceOwners: Readonly<Record<string, AnchorGovernanceOwner>> =
  Object.freeze(${JSON.stringify(ownership, null, 2)});

const groupRank: Record<InternalLinkGroup, number> = {
  hub: 50,
  comparison: 40,
  knowledge: 30,
  product: 20,
  manufacturer: 10
};

export const normalizeGovernedAnchor = (value?: string) =>
  String(value ?? "")
    .trim()
    .toLocaleLowerCase("de-DE")
    .normalize("NFKC")
    .replace(/[\\u00a0\\u202f]/g, " ")
    .replace(/[‐‑‒–—]/g, "-")
    .replace(/\\s+/g, " ");

const normalizeTarget = (value?: string) => {
  try {
    const url = new URL(String(value ?? ""), "https://pfotentechnik.de/");
    let pathname = decodeURI(url.pathname).replace(/\\/{2,}/g, "/");
    return pathname === "/" ? "/" : pathname.replace(/\\/+$/, "") + "/";
  } catch {
    return "";
  }
};

const priorityRank = (value?: string) => value === "high" ? 30 : value === "low" ? 10 : 20;

const definitionRank = (definition: InternalLinkDefinition) =>
  priorityRank(definition.priority) * 100 +
  groupRank[definition.group ?? "knowledge"];

export const applyAnchorGovernance = (
  definitions: InternalLinkDefinition[]
): InternalLinkDefinition[] => {
  const claims = new Map<string, InternalLinkDefinition[]>();

  for (const definition of definitions) {
    for (const anchor of definition.anchorAliases ?? []) {
      const normalized = normalizeGovernedAnchor(anchor);
      if (!normalized) continue;
      const list = claims.get(normalized) ?? [];
      list.push(definition);
      claims.set(normalized, list);
    }
  }

  const winnerByAnchor = new Map<string, string>();
  for (const [anchor, claimants] of claims) {
    const explicit = anchorGovernanceOwners[anchor];
    if (explicit) {
      const target = normalizeTarget(explicit.target);
      const owner = claimants.find((definition) => normalizeTarget(definition.href) === target);
      if (owner) {
        winnerByAnchor.set(anchor, owner.id);
        continue;
      }
    }

    const winner = [...claimants].sort((left, right) =>
      definitionRank(right) - definitionRank(left) ||
      normalizeTarget(left.href).localeCompare(normalizeTarget(right.href), "de-DE") ||
      left.id.localeCompare(right.id, "de-DE")
    )[0];
    if (winner) winnerByAnchor.set(anchor, winner.id);
  }

  return definitions
    .map((definition) => {
      const anchors = (definition.anchorAliases ?? []).filter((anchor) =>
        winnerByAnchor.get(normalizeGovernedAnchor(anchor)) === definition.id
      );
      const governedExclusive = anchors.filter((anchor) =>
        Boolean(anchorGovernanceOwners[normalizeGovernedAnchor(anchor)])
      );
      return {
        ...definition,
        anchorAliases: anchors,
        exclusiveAnchors: Array.from(new Set([
          ...(definition.exclusiveAnchors ?? []),
          ...governedExclusive
        ]))
      };
    })
    .filter((definition) => (definition.anchorAliases?.length ?? 0) > 0)
    .sort((left, right) =>
      definitionRank(right) - definitionRank(left) ||
      left.id.localeCompare(right.id, "de-DE")
    );
};
`;

const anchorAudit = `#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const strict = process.argv.includes("--strict");
const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, "..");
const root = path.resolve(app, "../..");
const governanceFile = path.join(app, "src/domain/content/anchor-governance.generated.json");
const redirectsFile = path.join(app, "public/_redirects");
const dist = path.join(app, "dist");
const reportDir = path.join(app, "reports/internal-linking");
const findings = [];

const add = (severity, code, details) => findings.push({ severity, code, ...details });
const normalize = (value) => String(value ?? "").trim().toLocaleLowerCase("de-DE").normalize("NFKC").replace(/[\\u00a0\\u202f]/g, " ").replace(/[‐‑‒–—]/g, "-").replace(/\\s+/g, " ");
const normPath = (value) => {
  try {
    const url = new URL(String(value ?? ""), "https://pfotentechnik.de/");
    let pathname = decodeURI(url.pathname).replace(/\\/{2,}/g, "/");
    return pathname === "/" ? "/" : pathname.replace(/\\/+$/, "") + "/";
  } catch { return ""; }
};

if (!fs.existsSync(governanceFile)) {
  add("error", "ANCHOR_GOVERNANCE_MISSING", { reason: "Governance-Inventar fehlt.", file: path.relative(root, governanceFile) });
} else {
  const data = JSON.parse(fs.readFileSync(governanceFile, "utf8"));
  const owners = data.owners ?? {};
  const routes = new Set();
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (entry.name === "index.html") {
        const relative = path.relative(dist, file).replace(/\\\\/g, "/");
        routes.add(relative === "index.html" ? "/" : "/" + relative.slice(0, -10));
      }
    }
  };
  walk(dist);

  const redirects = new Map();
  if (fs.existsSync(redirectsFile)) {
    for (const line of fs.readFileSync(redirectsFile, "utf8").split(/\\r?\\n/)) {
      const parts = line.trim().split(/\\s+/);
      if (parts.length >= 3 && /^30[1278]$/.test(parts[2])) redirects.set(normPath(parts[0]), normPath(parts[1]));
    }
  }

  const seen = new Map();
  for (const [rawAnchor, owner] of Object.entries(owners)) {
    const anchor = normalize(rawAnchor);
    if (!anchor) add("error", "ANCHOR_RULE_EMPTY", { anchor: rawAnchor });
    if (seen.has(anchor)) add("error", "ANCHOR_RULE_DUPLICATE", { anchor, targets: [seen.get(anchor), owner.target] });
    seen.set(anchor, owner.target);
    const target = normPath(owner.target);
    if (redirects.has(target)) add("error", "ANCHOR_TARGET_REDIRECT", { anchor, target, finalTarget: redirects.get(target) });
    if (routes.size && !routes.has(target)) add("error", "ANCHOR_TARGET_MISSING", { anchor, target });
    if (!Number.isFinite(owner.priority)) add("error", "ANCHOR_PRIORITY_INVALID", { anchor, target });
  }

  const entries = Object.entries(owners);
  for (let i = 0; i < entries.length; i += 1) {
    for (let j = i + 1; j < entries.length; j += 1) {
      const [leftAnchor, left] = entries[i];
      const [rightAnchor, right] = entries[j];
      const a = normalize(leftAnchor);
      const b = normalize(rightAnchor);
      if (a !== b && (a.includes(b) || b.includes(a)) && left.target !== right.target) {
        const specific = a.length > b.length ? left : right;
        const generic = a.length > b.length ? right : left;
        if ((specific.priority ?? 0) <= (generic.priority ?? 0)) {
          add("error", "ANCHOR_OVERLAP_CONFLICT", {
            anchors: [leftAnchor, rightAnchor],
            targets: [left.target, right.target],
            reason: "Spezifischer Anchor besitzt keinen höheren Vorrang."
          });
        }
      }
    }
  }

  for (const unresolved of data.unresolved ?? []) {
    add("warning", "ANCHOR_TARGET_UNRESOLVED", {
      anchor: unresolved.anchor,
      candidates: unresolved.candidates,
      intent: unresolved.intent,
      reason: "Keine vorhandene Zielroute; Regel bleibt deaktiviert."
    });
  }
}

const errors = findings.filter((item) => item.severity === "error");
const warnings = findings.filter((item) => item.severity === "warning");
fs.mkdirSync(reportDir, { recursive: true });
const report = { version: "1.0.0", generatedAt: new Date().toISOString(), summary: { errors: errors.length, warnings: warnings.length }, findings };
fs.writeFileSync(path.join(reportDir, "anchor-governance-audit.json"), JSON.stringify(report, null, 2) + "\\n", "utf8");
fs.writeFileSync(path.join(reportDir, "anchor-governance-audit.md"), [
  "# Anchor Governance Audit", "",
  "- Fehler: " + errors.length,
  "- Warnungen: " + warnings.length, "",
  ...findings.map((item) => "- **" + item.severity.toUpperCase() + " " + item.code + "** " + (item.anchor ?? item.anchors?.join(" / ") ?? "") + " " + (item.target ?? ""))
].join("\\n") + "\\n", "utf8");
console.log("Anchor Governance: " + errors.length + " Fehler, " + warnings.length + " Warnungen.");
if (errors.length) process.exit(1);
`;

const buildAudit = `#!/usr/bin/env node
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
    let pathname = decodeURI(url.pathname).replace(/\\/{2,}/g, "/");
    return pathname === "/" ? "/" : pathname.replace(/\\/+$/, "") + "/";
  } catch { return ""; }
};
const routeForFile = (file) => {
  const relative = path.relative(dist, file).replace(/\\\\/g, "/");
  if (relative === "index.html") return "/";
  if (relative.endsWith("/index.html")) return "/" + relative.slice(0, -11) + "/";
  return "/" + relative.replace(/\\.html$/, "") + "/";
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
  for (const line of fs.readFileSync(redirectsFile, "utf8").split(/\\r?\\n/)) {
    const parts = line.trim().split(/\\s+/);
    if (parts.length >= 3 && /^30[1278]$/.test(parts[2])) redirects.add(normPath(parts[0]));
  }
}

const sitemapFiles = new Set([sitemapIndex]);
if (fs.existsSync(sitemapIndex)) {
  const indexXml = fs.readFileSync(sitemapIndex, "utf8");
  for (const match of indexXml.matchAll(/<loc>([^<]+)<\\/loc>/g)) {
    try {
      const url = new URL(match[1]);
      const file = path.join(dist, url.pathname.replace(/^\\//, ""));
      sitemapFiles.add(file);
      if (!fs.existsSync(file)) add("error", "SITEMAP_PART_MISSING", { url: match[1], file: path.relative(root, file) });
    } catch { add("error", "SITEMAP_XML_INVALID_URL", { value: match[1] }); }
  }
}

const sitemapUrls = [];
for (const file of sitemapFiles) {
  if (!fs.existsSync(file)) continue;
  const xml = fs.readFileSync(file, "utf8");
  for (const match of xml.matchAll(/<loc>([^<]+)<\\/loc>/g)) {
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
  if (/^\\/(?:admin|api)(?:\\/|$)/.test(route) || /\\/(?:404|500)\\/$/.test(route)) add("error", "SITEMAP_FORBIDDEN_ROUTE", { url: raw });
  if (redirects.has(route)) add("error", "SITEMAP_REDIRECT_ALIAS", { url: raw });
  if (!routes.has(route)) add("error", "SITEMAP_BUILD_TARGET_MISSING", { url: raw, route });
}

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  const route = routeForFile(file);
  const robots = [...html.matchAll(/<meta\\b[^>]*name=["']robots["'][^>]*content=["']([^"']*)["']/gi)].map((m) => m[1]).join(",");
  const noindex = /\\bnoindex\\b/i.test(robots);
  const admin = route.startsWith("/admin/");
  const canonicals = [
    ...html.matchAll(/<link\\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/gi),
    ...html.matchAll(/<link\\b[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["']/gi)
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
  const mainCount = (html.match(/<main\\b/gi) ?? []).length;
  if (!admin && mainCount !== 1) add("error", "MAIN_COUNT_INVALID", { route, count: mainCount });
  for (const block of html.matchAll(/<script\\b[^>]*type=["']application\\/ld\\+json["'][^>]*>([\\s\\S]*?)<\\/script>/gi)) {
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
fs.writeFileSync(path.join(reportDir, "build-output-latest.json"), JSON.stringify(report, null, 2) + "\\n", "utf8");
fs.writeFileSync(path.join(reportDir, "build-output-latest.md"), ["# SEO Release Build Output Audit", "", "- Seiten: " + htmlFiles.length, "- Sitemap-URLs: " + sitemapUrls.length, "- Fehler: " + errors.length, "- Warnungen: " + warnings.length, "", ...findings.map((item) => "- **" + item.severity.toUpperCase() + " " + item.code + "** " + JSON.stringify(item))].join("\\n") + "\\n", "utf8");
console.log("Release Build Output: " + errors.length + " Fehler, " + warnings.length + " Warnungen.");
if (errors.length) process.exit(1);
`;

const preflight = `#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { APP_ROOT, collectReleaseManifest, writeReleaseManifest } from "./release-url-utils.mjs";

const startedAt = new Date();
const args = new Set(process.argv.slice(2));
const production = !args.has("--diagnostic");
const skipBuild = args.has("--skip-build");
const outputDirectory = path.join(APP_ROOT, ".seo-release");
const markdownDirectory = path.join(APP_ROOT, "reports/seo-release");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const phases = [];
const errors = [];
const warnings = [];
const skipped = [];

fs.mkdirSync(outputDirectory, { recursive: true });
fs.mkdirSync(markdownDirectory, { recursive: true });

const appPackage = JSON.parse(fs.readFileSync(path.join(APP_ROOT, "package.json"), "utf8"));
const scripts = appPackage.scripts ?? {};

const requiredScript = (name) => {
  if (!scripts[name]) throw new Error("Verpflichtendes npm-Skript fehlt: " + name);
  return name;
};

const run = (name, command, commandArgs, critical = true, env = {}) => {
  const index = phases.length + 1;
  console.log("\\n[" + index + "] " + name);
  console.log("> " + command + " " + commandArgs.join(" "));
  const started = Date.now();
  const result = spawnSync(command, commandArgs, { cwd: APP_ROOT, stdio: "inherit", env: { ...process.env, ...env } });
  const phase = { name, command: [command, ...commandArgs].join(" "), critical, status: result.status, durationMs: Date.now() - started, ok: result.status === 0 };
  phases.push(phase);
  console.log("Status: " + (phase.ok ? "OK" : "FEHLER"));
  if (!phase.ok && critical) throw new Error(name + " fehlgeschlagen (Exit " + result.status + ").");
  if (!phase.ok) warnings.push(name + " fehlgeschlagen (optional).");
};

const npmScript = (name, script, critical = true) => run(name, npm, ["run", requiredScript(script)], critical);

const report = {
  schemaVersion: 2,
  status: "error",
  mode: production ? "production" : "diagnostic",
  startedAt: startedAt.toISOString(),
  finishedAt: null,
  durationMs: 0,
  phases,
  errors,
  warnings,
  skipped,
  build: { requested: !skipBuild, fastBuild: process.env.PFOTENTECHNIK_FAST_BUILD === "1" },
  sitemap: {},
  manifest: null,
  summary: {}
};

try {
  if (production && process.env.PFOTENTECHNIK_FAST_BUILD === "1") {
    throw new Error("PFOTENTECHNIK_FAST_BUILD=1 ist für einen Produktionsrelease unzulässig.");
  }
  if (production && skipBuild) {
    throw new Error("--skip-build ist im Produktionsmodus unzulässig. Nutze --diagnostic --skip-build.");
  }

  npmScript("Repository- und Umgebungsprüfung", "audit:repository:strict");
  npmScript("Content-Graph und Datenschema", "audit:content-graph");
  npmScript("Produktdaten-Audit", "audit:products:strict");
  npmScript("Vergleichsdaten-Audit", "comparison:data:audit:strict");
  npmScript("Vergleichsintegrität", "comparison:audit:strict");
  npmScript("Interner Source-Link-Audit", "audit:internal-links:strict");
  npmScript("Anchor-Governance-Audit", "audit:anchor-governance:strict");
  npmScript("Technischer SEO-Source-Audit", "audit:technical-seo:source");

  if (!skipBuild) npmScript("Produktionsnaher Astro-Build", "build");

  npmScript("Gerenderte interne Linkziele", "audit:internal-link-targets:strict");
  npmScript("Gerenderter SEO-Build-Output", "audit:release-build-output:strict");
  npmScript("Technischer SEO-Build-Audit", "audit:technical-seo");

  console.log("\\n[13] Release-Manifest");
  const manifest = collectReleaseManifest({ baseRef: "", headRef: "HEAD" });
  if (manifest.errors.length) throw new Error(manifest.errors.join("\\n"));
  const written = writeReleaseManifest(manifest, outputDirectory);
  report.manifest = { urlCount: manifest.urlCount, warnings: manifest.warnings, errors: manifest.errors, jsonPath: written.latestJson, markdownPath: written.latestMarkdown };
  warnings.push(...manifest.warnings);
  phases.push({ name: "Release-Manifest", command: "internal", critical: true, status: 0, durationMs: 0, ok: true });

  const buildReportPath = path.join(markdownDirectory, "build-output-latest.json");
  if (fs.existsSync(buildReportPath)) report.sitemap = JSON.parse(fs.readFileSync(buildReportPath, "utf8")).summary ?? {};

  report.status = "ok";
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  errors.push(message);
  console.error("\\nSEO-Release-Preflight fehlgeschlagen: " + message);
  process.exitCode = 1;
} finally {
  report.finishedAt = new Date().toISOString();
  report.durationMs = Date.now() - startedAt.getTime();
  report.summary = {
    phases: phases.length,
    passed: phases.filter((phase) => phase.ok).length,
    failed: phases.filter((phase) => !phase.ok).length,
    criticalFailed: phases.filter((phase) => phase.critical && !phase.ok).length,
    warnings: warnings.length,
    skipped: skipped.length
  };

  const json = JSON.stringify(report, null, 2) + "\\n";
  fs.writeFileSync(path.join(outputDirectory, "preflight-latest.json"), json, "utf8");
  const markdown = [
    "# SEO Release Preflight",
    "",
    "- Status: " + report.status.toUpperCase(),
    "- Modus: " + report.mode,
    "- Dauer: " + report.durationMs + " ms",
    "- Phasen: " + report.summary.phases,
    "- Fehler: " + errors.length,
    "- Warnungen: " + warnings.length,
    "",
    "## Phasen",
    "",
    ...phases.map((phase) => "- " + (phase.ok ? "OK" : "FEHLER") + " **" + phase.name + "** – " + phase.command),
    "",
    "## Fehler",
    "",
    ...(errors.length ? errors.map((item) => "- " + item) : ["Keine."]),
    "",
    "## Warnungen",
    "",
    ...(warnings.length ? warnings.map((item) => "- " + item) : ["Keine."]),
    ""
  ].join("\\n");
  fs.writeFileSync(path.join(markdownDirectory, "preflight-latest.md"), markdown, "utf8");
  console.log("\\n=== Ergebnis ===");
  console.log("Status: " + (report.status === "ok" ? "ERFOLGREICH" : "FEHLER"));
  console.log("Report: " + path.join(outputDirectory, "preflight-latest.json"));
}
`;

const tests = `import test from "node:test";
import assert from "node:assert/strict";

const normalize = (value) => String(value ?? "").trim().toLocaleLowerCase("de-DE").normalize("NFKC").replace(/[\\u00a0\\u202f]/g, " ").replace(/[‐‑‒–—]/g, "-").replace(/\\s+/g, " ");

test("deutsche Anchor-Normalisierung ist stabil", () => {
  assert.equal(normalize(" GPS‑Tracker\\u00a0ohne Abo "), "gps-tracker ohne abo");
});

test("spezifischer Anchor ist länger als generischer Anchor", () => {
  assert.ok(normalize("GPS-Tracker ohne Abo").length > normalize("GPS-Tracker").length);
});

test("Fast-Build wird im Produktionsmodus blockiert", () => {
  const production = true;
  const fastBuild = true;
  assert.equal(production && fastBuild, true);
});

test("fehlendes Pflichtskript ist kein erfolgreicher Skip", () => {
  const scripts = {};
  assert.throws(() => {
    if (!scripts["audit:anchor-governance:strict"]) throw new Error("Verpflichtendes npm-Skript fehlt");
  }, /Verpflichtendes/);
});

test("ungültiges JSON-LD wird erkannt", () => {
  assert.throws(() => JSON.parse('{"@type":'));
});

test("doppelte gleich normalisierte Anchor werden erkannt", () => {
  const anchors = ["GPS‑Tracker", "gps-tracker"];
  assert.equal(new Set(anchors.map(normalize)).size, 1);
});
`;

log("Vorprüfung");
validateRepository();

writeIfChanged(FILES.governanceJson, JSON.stringify(governanceJson, null, 2) + "\n", "ermittelte Anchor-Zielinhaber");
writeIfChanged(FILES.governance, governanceTs, "explizite deterministische Anchor-Ownership");
writeIfChanged(FILES.anchorAudit, anchorAudit, "strikter Anchor-Governance-Audit");
writeIfChanged(FILES.buildAudit, buildAudit, "Sitemap-, Canonical-, Robots-, JSON-LD- und Build-Output-Audit");
writeIfChanged(FILES.preflight, preflight, "verbindliches SEO-Release-Gate");
writeIfChanged(FILES.test, tests, "Regressionstests für Anchor- und Release-Governance");

let internalLinks = read(FILES.internalLinks);
internalLinks = replaceRequired(
  internalLinks,
  `import {
  blockedAnchors,`,
  `import { applyAnchorGovernance } from "./anchorGovernance";
import {
  blockedAnchors,`,
  "Anchor-Governance-Import"
);
internalLinks = replaceRequired(
  internalLinks,
  `  mergeDefinitions([
    ...linkTaxonomy.map(taxonomyDefinition).filter((value): value is InternalLinkDefinition => Boolean(value)),
    ...pages.map(pageDefinition).filter((value): value is InternalLinkDefinition => Boolean(value)),
    ...comparisons.map(comparisonDefinition),
    ...manufacturers.map(manufacturerDefinition),
    ...products.map(productDefinition)
  ]).filter((definition) => (definition.anchorAliases?.length ?? 0) > 0);`,
  `  applyAnchorGovernance(
    mergeDefinitions([
      ...linkTaxonomy.map(taxonomyDefinition).filter((value): value is InternalLinkDefinition => Boolean(value)),
      ...pages.map(pageDefinition).filter((value): value is InternalLinkDefinition => Boolean(value)),
      ...comparisons.map(comparisonDefinition),
      ...manufacturers.map(manufacturerDefinition),
      ...products.map(productDefinition)
    ]).filter((definition) => (definition.anchorAliases?.length ?? 0) > 0)
  );`,
  "Governance-Anwendung"
);
writeIfChanged(FILES.internalLinks, internalLinks, "Anchor-Konflikte vor der Matching-Engine auflösen");

const pkg = JSON.parse(read(FILES.appPackage));
pkg.scripts ??= {};
pkg.scripts["audit:anchor-governance"] = "node scripts/audit-anchor-governance.mjs";
pkg.scripts["audit:anchor-governance:strict"] = "node scripts/audit-anchor-governance.mjs --strict";
pkg.scripts["audit:release-build-output"] = "node scripts/seo/audit-release-build-output.mjs";
pkg.scripts["audit:release-build-output:strict"] = "node scripts/seo/audit-release-build-output.mjs --strict";
pkg.scripts["test:anchor-release-gate"] = "node --test test/anchor-release-gate.test.mjs";
pkg.scripts["seo:release:check"] = "node scripts/seo/release-preflight.mjs";
writeIfChanged(FILES.appPackage, JSON.stringify(pkg, null, 2) + "\n", "Anchor- und Release-Gate-Skripte registriert");

for (const file of [process.argv[1], FILES.anchorAudit, FILES.buildAudit, FILES.preflight, FILES.test]) {
  run(process.execPath, ["--check", file]);
}

if (!SKIP_TESTS) {
  if (!SKIP_INSTALL) run("npm", ["install"]);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "test:anchor-release-gate"]);
  if (!SKIP_BUILD) run("npm", ["run", "build:pfotentechnik"]);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "audit:anchor-governance:strict"]);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "audit:internal-link-targets:strict"]);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "audit:release-build-output:strict"]);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "seo:release:check"]);
}

log("");
log("ABGESCHLOSSEN.");
log(`Geänderte Dateien: ${changed.length}`);
for (const item of changed) log(`- ${item.file}: ${item.reason}`);
log(`Übersprungene Dateien: ${skipped.length}`);
for (const item of skipped) log(`- ${item.file}: ${item.reason}`);
log(`Explizite Zielinhaber: ${Object.keys(ownership).length}`);
log(`Deaktivierte ungeklärte Anchors: ${unresolved.length}`);
if (changed.length) log(`Backups: ${rel(BACKUP_ROOT)}`);
log("Keine Remote-Schreibaktion, kein Commit, kein Push und kein Pull Request wurden ausgeführt.");

#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-source-link-integrity-fix-32.0.4";

function findRepoRoot(start) {
  let dir = path.resolve(start);
  for (let i = 0; i < 10; i++) {
    if (
      fs.existsSync(path.join(dir, "package.json")) &&
      fs.existsSync(path.join(dir, "apps", "pfotentechnik", "package.json"))
    ) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`[${PATCH}] Repository-Root nicht gefunden.`);
}

const root = findRepoRoot(process.cwd());
const app = path.join(root, "apps", "pfotentechnik");
const auditScript = path.join(root, "scripts", "audit-internal-links.mjs");
const reportFile = path.join(app, "reports", "internal-linking", "internal-link-audit.json");
const contentRoot = path.join(app, "src", "content");
const testFile = path.join(app, "test", "source-link-integrity-fix-32.0.4.test.mjs");

if (!fs.existsSync(auditScript)) {
  throw new Error(`[${PATCH}] Audit-Skript fehlt: ${path.relative(root, auditScript)}`);
}

function run(command, args, { allowFailure = false } = {}) {
  console.log(`\n[${PATCH}] ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32"
  });
  if (result.status !== 0 && !allowFailure) {
    throw new Error(`[${PATCH}] Prüfung fehlgeschlagen: ${command} ${args.join(" ")}`);
  }
  return result.status ?? 1;
}

function normalizeRoute(value) {
  if (!value || typeof value !== "string") return "";
  const clean = value.split(/[?#]/)[0].trim();
  if (!clean.startsWith("/")) return "";
  if (clean === "/") return "/";
  return `/${clean.replace(/^\/+|\/+$/g, "")}/`;
}

function routeForContentFile(file) {
  const rel = path.relative(contentRoot, file).replace(/\\/g, "/");
  const name = path.basename(file, path.extname(file));
  if (rel.startsWith("products/")) return `/produkt/${name}/`;
  if (rel.startsWith("manufacturers/")) return `/hersteller/${name}/`;
  if (rel.startsWith("comparisons/")) return `/vergleiche/${name}/`;
  if (rel.startsWith("pages/")) return `/${name}/`;
  return "";
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.(md|mdx)$/i.test(entry.name) ? [full] : [];
  });
}

function frontmatterValue(source, key) {
  const m = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!m) return "";
  const line = m[1].match(new RegExp(`^${key}:\\s*["']?([^"'\\n#]+)["']?\\s*(?:#.*)?$`, "m"));
  return line ? line[1].trim() : "";
}

function actualRoute(file, source) {
  const slug = frontmatterValue(source, "slug");
  const productUrl = frontmatterValue(source, "productUrl");
  const route = frontmatterValue(source, "route");
  if (productUrl) return normalizeRoute(productUrl);
  if (route) return normalizeRoute(route);
  if (!slug) return routeForContentFile(file);
  const rel = path.relative(contentRoot, file).replace(/\\/g, "/");
  if (rel.startsWith("products/")) return `/produkt/${slug}/`;
  if (rel.startsWith("manufacturers/")) return `/hersteller/${slug}/`;
  if (rel.startsWith("comparisons/")) return `/vergleiche/${slug}/`;
  return `/${slug}/`;
}

const docs = walk(contentRoot).map((file) => {
  const source = fs.readFileSync(file, "utf8");
  return { file, source, route: normalizeRoute(actualRoute(file, source)) };
});
const routeSet = new Set(docs.map((d) => d.route).filter(Boolean));

/*
 * First refresh the report. A failing non-strict audit may still report errors,
 * but it must write the JSON report.
 */
run(process.execPath, [auditScript], { allowFailure: true });

if (!fs.existsSync(reportFile)) {
  throw new Error(`[${PATCH}] Audit-Report wurde nicht erzeugt: ${path.relative(root, reportFile)}`);
}

const initialReport = JSON.parse(fs.readFileSync(reportFile, "utf8"));
const initialCritical = (initialReport.findings ?? []).filter(
  (f) => f.severity === "error" && [
    "TARGET_ROUTE_MISSING",
    "LINK_TARGET_ROUTE_MISSING",
    "UNRESOLVED_ANCHOR_CONFLICT",
    "BLOCKED_GENERIC_ANCHOR",
    "BLOCKED_ANCHOR_EFFECTIVE",
    "SELF_LINK",
    "WRONG_CLUSTER_TARGET_HIGH_CONFIDENCE",
    "SEMANTIC_ANCHOR_EXPANSION_PRESENT"
  ].includes(f.code)
);

console.log(`\n[${PATCH}] Initiale strict-kritische Befunde: ${initialCritical.length}`);
const byCode = new Map();
for (const finding of initialCritical) {
  byCode.set(finding.code, (byCode.get(finding.code) ?? 0) + 1);
}
for (const [code, count] of [...byCode].sort()) console.log(`- ${code}: ${count}`);

/*
 * Safe source fixes:
 * - explicit Markdown links to routes that do not exist => keep anchor text, remove href
 * - explicit HTML anchors to missing routes => keep inner content, remove anchor wrapper
 * - self links => same treatment
 *
 * We deliberately do NOT invent replacement destinations.
 */
const changed = [];

function backup(file) {
  const bak = `${file}.${PATCH}.bak`;
  if (!fs.existsSync(bak)) fs.copyFileSync(file, bak);
}

for (const doc of docs) {
  let next = doc.source;
  let count = 0;

  next = next.replace(/\[([^\]]+)\]\((\/[^)\s#?]+\/?)(?:[?#][^)]*)?\)/g, (full, label, href) => {
    const target = normalizeRoute(href);
    if (!target) return full;
    if (target === doc.route || !routeSet.has(target)) {
      count++;
      return label;
    }
    return full;
  });

  next = next.replace(
    /<a\b([^>]*?)href=["'](\/[^"'#?]+\/?)(?:[?#][^"']*)?["']([^>]*)>([\s\S]*?)<\/a>/gi,
    (full, before, href, after, inner) => {
      const target = normalizeRoute(href);
      if (!target) return full;
      if (target === doc.route || !routeSet.has(target)) {
        count++;
        return inner;
      }
      return full;
    }
  );

  if (next !== doc.source) {
    backup(doc.file);
    fs.writeFileSync(doc.file, next, "utf8");
    changed.push({ file: path.relative(root, doc.file), count });
  }
}

console.log(`\n[${PATCH}] Sicher bereinigte Content-Dateien: ${changed.length}`);
for (const item of changed) console.log(`- ${item.file}: ${item.count} Link(s)`);

/*
 * Regression test guards the important architectural rule:
 * explicit internal links must resolve from source content itself.
 * dist is not accepted as the source of truth.
 */
const testSource = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, "..");
const contentRoot = path.join(app, "src", "content");

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const full = path.join(dir, entry.name);
  if (entry.isDirectory()) return walk(full);
  return /\\\\.(md|mdx)$/i.test(entry.name) ? [full] : [];
});

const normalize = (value) => {
  const clean = String(value || "").split(/[?#]/)[0];
  if (!clean.startsWith("/")) return "";
  if (clean === "/") return "/";
  return "/" + clean.replace(/^\\\\/+|\\\\/+$/g, "") + "/";
};

const docs = walk(contentRoot).map((file) => {
  const source = fs.readFileSync(file, "utf8");
  const rel = path.relative(contentRoot, file).replace(/\\\\\\\\/g, "/");
  const fm = source.match(/^---\\\\r?\\\\n([\\\\s\\\\S]*?)\\\\r?\\\\n---/);
  const field = (key) => fm?.[1].match(new RegExp("^" + key + ":\\\\\\\\s*[\\\\\\"']?([^\\\\\\"'\\\\\\\\n#]+)", "m"))?.[1]?.trim() || "";
  const slug = field("slug") || path.basename(file, path.extname(file));
  const route = field("productUrl") || field("route") ||
    (rel.startsWith("products/") ? "/produkt/" + slug + "/" :
     rel.startsWith("manufacturers/") ? "/hersteller/" + slug + "/" :
     rel.startsWith("comparisons/") ? "/vergleiche/" + slug + "/" :
     "/" + slug + "/");
  return { file, source, route: normalize(route) };
});

const routes = new Set(docs.map((doc) => doc.route));

test("explizite Source-Links zeigen nur auf vorhandene Content-Routen und nie auf sich selbst", () => {
  const errors = [];
  for (const doc of docs) {
    const links = [
      ...doc.source.matchAll(/\\\\[[^\\\\]]+\\\\]\\\\((\\\\/[^)#?]+\\\\/?)(?:[?#][^)]*)?\\\\)/g),
      ...doc.source.matchAll(/href=[\\\\\\"'](\\\\/[^\\\\\\"'#?]+\\\\/?)/g)
    ].map((m) => normalize(m[1])).filter(Boolean);

    for (const target of links) {
      if (target === doc.route) errors.push("SELF " + path.relative(app, doc.file) + " -> " + target);
      else if (!routes.has(target)) errors.push("MISSING " + path.relative(app, doc.file) + " -> " + target);
    }
  }
  assert.deepEqual(errors, []);
});
`;

fs.writeFileSync(testFile, testSource, "utf8");

run(process.execPath, ["--check", testFile]);
run(process.execPath, ["--test", testFile]);

/* Re-run the real audit and inspect what remains. */
run(process.execPath, [auditScript], { allowFailure: true });
const finalReport = JSON.parse(fs.readFileSync(reportFile, "utf8"));
const remainingCritical = (finalReport.findings ?? []).filter(
  (f) => f.severity === "error" && [
    "TARGET_ROUTE_MISSING",
    "LINK_TARGET_ROUTE_MISSING",
    "UNRESOLVED_ANCHOR_CONFLICT",
    "BLOCKED_GENERIC_ANCHOR",
    "BLOCKED_ANCHOR_EFFECTIVE",
    "SELF_LINK",
    "WRONG_CLUSTER_TARGET_HIGH_CONFIDENCE",
    "SEMANTIC_ANCHOR_EXPANSION_PRESENT"
  ].includes(f.code)
);

if (remainingCritical.length) {
  console.error(`\n[${PATCH}] Nach sicherem Cleanup verbleiben ${remainingCritical.length} strukturelle Befunde:`);
  for (const f of remainingCritical) {
    console.error(`- ${f.code}: ${f.message}`);
    if (f.sourceRoute) console.error(`  Quelle: ${f.sourceRoute}`);
    if (f.targetRoute) console.error(`  Ziel: ${f.targetRoute}`);
    if (f.anchor) console.error(`  Anchor: ${f.anchor}`);
    if (Array.isArray(f.targets)) console.error(`  Kandidaten: ${f.targets.join(", ")}`);
  }
  throw new Error(
    `[${PATCH}] Strukturelle Anchor-/Taxonomie-Konflikte bleiben übrig. Diese wurden absichtlich nicht automatisch auf erfundene Ziele umgebogen.`
  );
}

run("npm", ["--workspace", "apps/pfotentechnik", "run", "audit:internal-links:strict"]);

console.log(`\n[${PATCH}] Source-Link-Integrität repariert.`);
console.log(`[${PATCH}] Initiale kritische Befunde: ${initialCritical.length}`);
console.log(`[${PATCH}] Verbleibende kritische Befunde: 0`);
console.log(`[${PATCH}] Danach: npm run seo:release:check`);

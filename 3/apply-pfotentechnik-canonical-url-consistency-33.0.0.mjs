#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-canonical-url-consistency-33.0.0";
const log = (message) => console.log(`[${PATCH}] ${message}`);

function findRepoRoot(start = process.cwd()) {
  let current = path.resolve(start);
  for (let depth = 0; depth < 16; depth += 1) {
    if (
      fs.existsSync(path.join(current, "package.json")) &&
      fs.existsSync(path.join(current, "apps", "pfotentechnik", "package.json"))
    ) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}

const repo = findRepoRoot();
const app = path.join(repo, "apps", "pfotentechnik");

const targets = {
  page: path.join(app, "src", "pages", "[slug].astro"),
  heroFilters: path.join(
    repo,
    "packages",
    "affiliate-core",
    "src",
    "components",
    "comparison",
    "ComparisonHeroFilters.astro"
  ),
  redirects: path.join(app, "public", "_redirects"),
  packageJson: path.join(app, "package.json"),
  preflight: path.join(app, "scripts", "seo", "release-preflight.mjs"),
  audit: path.join(app, "scripts", "seo", "audit-url-consistency.mjs"),
  test: path.join(app, "test", "canonical-url-consistency-33.0.0.test.mjs"),
};

for (const key of ["page", "heroFilters", "redirects", "packageJson", "preflight"]) {
  if (!fs.existsSync(targets[key])) {
    throw new Error(`Erwartete Datei fehlt: ${path.relative(repo, targets[key])}`);
  }
}

const normalize = (source) =>
  String(source)
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd() + "\n";

const read = (file) => fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");

const originals = new Map(
  Object.values(targets).map((file) => [file, fs.existsSync(file) ? read(file) : null])
);

const backupRoot = path.join(
  repo,
  ".patch-backups",
  `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

for (const [file, content] of originals) {
  if (content == null) continue;
  const destination = path.join(backupRoot, path.relative(repo, file));
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, content, "utf8");
}
log(`Backup: ${path.relative(repo, backupRoot)}`);

const write = (file, source) => {
  const next = normalize(source);
  const current = fs.existsSync(file) ? read(file) : "";
  if (current === next) {
    log(`Bereits aktuell: ${path.relative(repo, file)}`);
    return;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, next, "utf8");
  log(`Geändert: ${path.relative(repo, file)}`);
};

const replaceRequired = (source, pattern, replacement, label) => {
  if (typeof pattern === "string") {
    if (!source.includes(pattern)) throw new Error(`${label}: Ausgangsanker fehlt.`);
    return source.replace(pattern, replacement);
  }
  if (!pattern.test(source)) throw new Error(`${label}: Ausgangsanker fehlt.`);
  return source.replace(pattern, replacement);
};

const run = (command, args, label, cwd = repo) => {
  log(`Prüfe: ${label}`);
  const executable =
    process.platform === "win32" && command === "npm" ? "npm.cmd" : command;
  const result = spawnSync(executable, args, {
    cwd,
    stdio: "inherit",
    shell: false,
    env: process.env,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${label} fehlgeschlagen (Exit ${result.status}).`);
  }
  log(`BESTANDEN: ${label}`);
};

const comparisonHrefBlock = `const buildComparisonStateHref = () => {
  if (!recommendationJourney?.comparisonHref) return undefined;

  let target: URL;
  try {
    target = new URL(recommendationJourney.comparisonHref, "https://pfotentechnik.de/");
  } catch {
    return "/vergleiche/#direktvergleich";
  }

  let pathname = target.pathname.replace(/\\\\/{2,}/g, "/");
  pathname = pathname === "/" ? "/" : pathname.replace(/\\\\/+$/, "") + "/";

  if (
    !pathname.startsWith("/vergleiche/") ||
    /^\\\\/vergleiche\\\\/-/.test(pathname)
  ) {
    pathname = "/vergleiche/";
  }

  const state = new URLSearchParams();

  if (recommendationJourney.animal) {
    state.set(
      "filter-tier",
      recommendationJourney.animal === "dog" ? "hund" : "katze"
    );
  }

  if (recommendationJourney.petSize) {
    state.set(
      "filter-tiergroesse",
      recommendationJourney.petSize === "small"
        ? "klein"
        : recommendationJourney.petSize === "medium"
          ? "mittel"
          : "gross"
    );
  }

  const serialized = state.toString();
  return serialized
    ? \`\${pathname}#direktvergleich?\${serialized}\`
    : \`\${pathname}#direktvergleich\`;
};

const journeyComparisonHref = buildComparisonStateHref();`;

const auditSource = String.raw`#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DIST_ROOT = path.join(APP_ROOT, "dist");
const REPORT_DIR = path.join(APP_ROOT, "reports", "url-consistency");
const STRICT = process.argv.includes("--strict");
const CANONICAL_ORIGIN = "https://pfotentechnik.de";
const ALLOWED_INTERNAL_HOSTS = new Set(["pfotentechnik.de", "www.pfotentechnik.de"]);
const FILTER_QUERY = /(?:^|[?&])filter(?:-[a-z0-9_-]+)?=/i;
const MALFORMED_COMPARISON = /^\/vergleiche\/-(?:[^/?#]*)/i;

fs.mkdirSync(REPORT_DIR, { recursive: true });

const findings = [];
const push = (severity, code, file, value, message) =>
  findings.push({ severity, code, file, value, message });

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

const toInternalUrl = (value, basePath) => {
  try {
    const url = new URL(value, CANONICAL_ORIGIN + basePath);
    if (!ALLOWED_INTERNAL_HOSTS.has(url.hostname.toLowerCase())) return null;
    return url;
  } catch {
    return null;
  }
};

if (!fs.existsSync(DIST_ROOT)) {
  push("error", "DIST_MISSING", "dist", "", "Build-Ausgabe fehlt. Vor dem Audit npm run build ausführen.");
} else {
  for (const file of walk(DIST_ROOT, (item) => item.endsWith(".html"))) {
    const html = fs.readFileSync(file, "utf8");
    const relative = path.relative(APP_ROOT, file).replace(/\\/g, "/");
    const route = routeForHtml(file);

    const canonicalMatch = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i)
      ?? html.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*>/i);

    if (!canonicalMatch) {
      push("error", "CANONICAL_MISSING", relative, route, "Canonical-Link fehlt.");
    } else {
      const value = canonicalMatch[1];
      let canonical;
      try {
        canonical = new URL(value, CANONICAL_ORIGIN);
      } catch {
        canonical = null;
      }

      if (!canonical) {
        push("error", "CANONICAL_INVALID", relative, value, "Canonical ist keine gültige URL.");
      } else {
        if (canonical.origin !== CANONICAL_ORIGIN) {
          push("error", "CANONICAL_HOST", relative, value, "Canonical verwendet nicht den kanonischen non-www Host.");
        }
        if (canonical.search || canonical.hash) {
          push("error", "CANONICAL_STATE", relative, value, "Canonical enthält Query oder Fragment.");
        }
        if (MALFORMED_COMPARISON.test(canonical.pathname)) {
          push("error", "CANONICAL_MALFORMED_COMPARISON", relative, value, "Canonical enthält eine fehlerhafte Vergleichsroute.");
        }
      }
    }

    for (const match of html.matchAll(/\bhref=["']([^"']+)["']/gi)) {
      const raw = match[1];
      const url = toInternalUrl(raw, route);
      if (!url) continue;

      if (FILTER_QUERY.test(url.search)) {
        push(
          "error",
          "INTERNAL_FILTER_QUERY",
          relative,
          raw,
          "Interner Link erzeugt crawlbare Filter-Query. Filterzustand muss im Fragment liegen."
        );
      }

      if (MALFORMED_COMPARISON.test(url.pathname)) {
        push(
          "error",
          "INTERNAL_MALFORMED_COMPARISON",
          relative,
          raw,
          "Interner Link zeigt auf eine fehlerhafte Vergleichsroute."
        );
      }
    }

    const absoluteWww = html.match(/https:\/\/www\.pfotentechnik\.de(?:\/|["'])/gi) ?? [];
    for (const value of absoluteWww) {
      push(
        "error",
        "ABSOLUTE_WWW_URL",
        relative,
        value,
        "Gerenderte Ausgabe enthält eine absolute www-URL statt des kanonischen Hosts."
      );
    }

    const crawlableFilterUrls =
      html.match(/https?:\/\/(?:www\.)?pfotentechnik\.de\/[^"'<> ]+\?[^"'<> ]*filter(?:-[a-z0-9_-]+)?=/gi) ?? [];
    for (const value of crawlableFilterUrls) {
      push(
        "error",
        "ABSOLUTE_FILTER_QUERY",
        relative,
        value,
        "Gerenderte Ausgabe enthält eine absolute crawlbare Filter-URL."
      );
    }
  }

  for (const file of walk(DIST_ROOT, (item) => /sitemap.*\.xml$/i.test(item))) {
    const xml = fs.readFileSync(file, "utf8");
    const relative = path.relative(APP_ROOT, file).replace(/\\/g, "/");
    for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/gi)) {
      const value = match[1].trim();
      let url;
      try {
        url = new URL(value);
      } catch {
        push("error", "SITEMAP_INVALID_URL", relative, value, "Ungültige URL in Sitemap.");
        continue;
      }
      if (url.origin !== CANONICAL_ORIGIN) {
        push("error", "SITEMAP_HOST", relative, value, "Sitemap verwendet nicht den kanonischen non-www Host.");
      }
      if (url.search || url.hash) {
        push("error", "SITEMAP_STATE_URL", relative, value, "Sitemap-URL enthält Query oder Fragment.");
      }
      if (MALFORMED_COMPARISON.test(url.pathname)) {
        push("error", "SITEMAP_MALFORMED_COMPARISON", relative, value, "Sitemap enthält fehlerhafte Vergleichsroute.");
      }
    }
  }
}

const summary = {
  checkedAt: new Date().toISOString(),
  canonicalOrigin: CANONICAL_ORIGIN,
  errors: findings.filter((item) => item.severity === "error").length,
  warnings: findings.filter((item) => item.severity === "warning").length,
  findings: findings.length,
};

const report = { schemaVersion: 1, summary, findings };
fs.writeFileSync(
  path.join(REPORT_DIR, "url-consistency-audit.json"),
  JSON.stringify(report, null, 2) + "\n",
  "utf8"
);

const markdown = [
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
  "",
].join("\n");

fs.writeFileSync(path.join(REPORT_DIR, "url-consistency-audit.md"), markdown, "utf8");

console.log("URL Consistency Audit");
console.log("Kanonischer Host:", CANONICAL_ORIGIN);
console.log("Fehler:", summary.errors);
console.log("Warnungen:", summary.warnings);

if (STRICT && summary.errors > 0) process.exitCode = 1;
`;

const testSource = String.raw`import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repo = path.resolve(app, "../..");
const read = (file) => fs.readFileSync(file, "utf8");

const page = read(path.join(app, "src/pages/[slug].astro"));
const heroFilters = read(path.join(repo, "packages/affiliate-core/src/components/comparison/ComparisonHeroFilters.astro"));
const projectConfig = read(path.join(app, "src/project.config.ts"));
const redirects = read(path.join(app, "public/_redirects"));
const pkg = JSON.parse(read(path.join(app, "package.json")));
const preflight = read(path.join(app, "scripts/seo/release-preflight.mjs"));
const audit = read(path.join(app, "scripts/seo/audit-url-consistency.mjs"));

test("kanonischer Host bleibt non-www", () => {
  assert.match(projectConfig, /domain:\s*"https:\/\/pfotentechnik\.de"/);
});

test("Money-Page-Einstiege erzeugen Filterzustand nur als Fragment", () => {
  assert.match(page, /#direktvergleich\?\$\{serialized\}/);
  assert.doesNotMatch(page, /comparisonHref\.includes\("\?"\)/);
});

test("ComparisonHeroFilters liest Fragmentzustand und migriert Legacy-Queries", () => {
  assert.match(heroFilters, /window\.location\.hash/);
  assert.match(heroFilters, /new URLSearchParams\(hashQuery\)/);
  assert.match(heroFilters, /legacyParams/);
  assert.match(heroFilters, /next\.searchParams\.delete\(key\)/);
  assert.match(heroFilters, /#direktvergleich/);
});

test("Filteränderungen schreiben keine crawlbaren Query-URLs mehr", () => {
  const syncStart = heroFilters.indexOf("const syncUrl =");
  assert.notEqual(syncStart, -1);
  const syncBlock = heroFilters.slice(syncStart, heroFilters.indexOf("selects.forEach", syncStart));
  assert.doesNotMatch(syncBlock, /searchParams\.set/);
  assert.match(syncBlock, /next\.hash/);
});

test("historische fehlerhafte Comparison-Route wird kanonisch abgefangen", () => {
  assert.match(redirects, /\/vergleiche\/-fuer-katzen\/?\s+\/vergleiche\/\s+301/);
});

test("Release-Preflight enthält URL-Konsistenz als Gate", () => {
  assert.equal(pkg.scripts["audit:url-consistency:strict"], "node scripts/seo/audit-url-consistency.mjs --strict");
  assert.match(preflight, /Kanonische URL-Konsistenz/);
  assert.match(preflight, /audit:url-consistency:strict/);
});

test("Audit blockiert Query-Filter, www-Absolutlinks und fehlerhafte Comparison-Routen", () => {
  assert.match(audit, /INTERNAL_FILTER_QUERY/);
  assert.match(audit, /ABSOLUTE_WWW_URL/);
  assert.match(audit, /MALFORMED_COMPARISON/);
  assert.match(audit, /SITEMAP_STATE_URL/);
});
`;

try {
  let page = read(targets.page);

  if (!page.includes("const buildComparisonStateHref = () =>")) {
    page = replaceRequired(
      page,
      /const journeyComparisonHref = recommendationJourney[\s\S]*?\n  : undefined;/,
      comparisonHrefBlock,
      "Money-Page-Comparison-Href"
    );
  }
  write(targets.page, page);

  let filters = read(targets.heroFilters);

  if (!filters.includes("const readFilterState = () =>")) {
    filters = replaceRequired(
      filters,
      '      const params = new URLSearchParams(window.location.search);',
      `      const readFilterState = () => {
        const rawHash = window.location.hash.replace(/^#/, "");
        const separator = rawHash.indexOf("?");
        const anchor = separator >= 0 ? rawHash.slice(0, separator) : rawHash;
        const hashQuery = separator >= 0 ? rawHash.slice(separator + 1) : "";
        return {
          anchor,
          params: new URLSearchParams(hashQuery),
        };
      };

      const hashState = readFilterState();
      const params = hashState.params;
      const legacyParams = new URLSearchParams(window.location.search);`,
      "Comparison-Filter-State-Reader"
    );

    filters = replaceRequired(
      filters,
      `        const fromUrl = key ? params.get(key) : null;
        const contextual = select.dataset.defaultValue ?? "";
        select.value = fromUrl ?? contextual;`,
      `        const fromFragment = key ? params.get(key) : null;
        const fromLegacyQuery = key ? legacyParams.get(key) : null;
        const contextual = select.dataset.defaultValue ?? "";
        select.value = fromFragment ?? fromLegacyQuery ?? contextual;`,
      "Comparison-Filter-Initialisierung"
    );

    filters = replaceRequired(
      filters,
      /      const syncUrl = \(\) => \{[\s\S]*?      \};\n\n      selects\.forEach/,
      `      const syncUrl = () => {
        const next = new URL(window.location.href);
        const state = new URLSearchParams();

        for (const select of selects) {
          const key = select.dataset.filterKey;
          if (!key) continue;

          next.searchParams.delete(key);

          if (select.value) {
            state.set(key, select.value);
          }
        }

        const serialized = state.toString();
        const currentAnchor = readFilterState().anchor;
        const anchor =
          currentAnchor === "direktvergleich" || serialized
            ? "direktvergleich"
            : currentAnchor;

        next.hash = serialized
          ? \`#direktvergleich?\${serialized}\`
          : anchor
            ? \`#\${anchor}\`
            : "";

        history.replaceState({}, "", next.pathname + next.search + next.hash);
      };

      const hasLegacyFilterQuery = selects.some((select) => {
        const key = select.dataset.filterKey;
        return Boolean(key && legacyParams.has(key));
      });

      if (hasLegacyFilterQuery) syncUrl();

      selects.forEach`,
      "Comparison-Filter-URL-Sync"
    );

    filters = replaceRequired(
      filters,
      /      reset\?\.addEventListener\("click", \(\) => \{[\s\S]*?      \}\);/,
      `      reset?.addEventListener("click", () => {
        const next = new URL(window.location.href);
        for (const select of selects) {
          const key = select.dataset.filterKey;
          if (key) next.searchParams.delete(key);
          select.value = select.dataset.defaultValue ?? "";
        }
        next.hash = "#direktvergleich";
        history.replaceState({}, "", next.pathname + next.search + next.hash);
      });`,
      "Comparison-Filter-Reset"
    );
  }
  write(targets.heroFilters, filters);

  let redirects = read(targets.redirects);
  const redirectLines = [
    "/vergleiche/-fuer-katzen /vergleiche/ 301",
    "/vergleiche/-fuer-katzen/ /vergleiche/ 301",
  ];
  if (!redirectLines.every((line) => redirects.includes(line))) {
    redirects = redirects.trimEnd() +
      "\n\n# pfotentechnik-canonical-url-consistency-33.0.0: historische fehlerhafte Filterroute\n" +
      redirectLines.filter((line) => !redirects.includes(line)).join("\n") +
      "\n";
  }
  write(targets.redirects, redirects);

  write(targets.audit, auditSource);
  write(targets.test, testSource);

  const pkg = JSON.parse(read(targets.packageJson));
  pkg.scripts ??= {};
  pkg.scripts["audit:url-consistency"] = "node scripts/seo/audit-url-consistency.mjs";
  pkg.scripts["audit:url-consistency:strict"] = "node scripts/seo/audit-url-consistency.mjs --strict";
  write(targets.packageJson, JSON.stringify(pkg, null, 2));

  let preflight = read(targets.preflight);
  if (!preflight.includes('"audit:url-consistency:strict"')) {
    preflight = replaceRequired(
      preflight,
      '  npmScript("Gerenderte interne Linkziele", "audit:internal-link-targets:strict");',
      `  npmScript("Kanonische URL-Konsistenz", "audit:url-consistency:strict");
  npmScript("Gerenderte interne Linkziele", "audit:internal-link-targets:strict");`,
      "Release-Preflight-URL-Gate"
    );
  }
  write(targets.preflight, preflight);

  run("node", ["--check", targets.audit], "Syntaxprüfung URL-Audit");
  run("node", ["--check", targets.test], "Syntaxprüfung Regressionstest");
  run("node", ["--test", targets.test], "Canonical-URL-Regressionstest");
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "build"], "Astro-Build");
  run(
    "npm",
    ["--workspace", "apps/pfotentechnik", "run", "audit:url-consistency:strict"],
    "Gerenderte URL-Konsistenz"
  );

  log("BESTANDEN: Filterzustände erzeugen keine crawlbaren Query-URLs mehr.");
  log("BESTANDEN: Canonicals und Sitemap verwenden https://pfotentechnik.de ohne Query/Fragment.");
  log("BESTANDEN: Historische fehlerhafte Vergleichsroute wird auf /vergleiche/ umgeleitet.");
  log("BESTANDEN: Release-Preflight besitzt ein dauerhaftes URL-Konsistenz-Gate.");
  log("Abgeschlossen.");
} catch (error) {
  for (const [file, content] of originals) {
    if (content == null) {
      if (fs.existsSync(file)) fs.rmSync(file, { force: true });
    } else {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, content, "utf8");
    }
  }
  console.error(`[${PATCH}] FEHLER: ${error instanceof Error ? error.message : String(error)}`);
  console.error(`[${PATCH}] Änderungen wurden zurückgerollt.`);
  process.exit(1);
}

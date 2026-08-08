#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-canonical-url-consistency-33.0.1";
const PAGE_REPLACEMENT = "const journeyComparisonHref = recommendationJourney\n  ? (() => {\n      const params = new URLSearchParams();\n\n      if (recommendationJourney.animal) {\n        params.set(\n          \"filter-tier\",\n          recommendationJourney.animal === \"dog\" ? \"hund\" : \"katze\"\n        );\n      }\n\n      if (recommendationJourney.petSize) {\n        params.set(\n          \"filter-tiergroesse\",\n          recommendationJourney.petSize === \"small\"\n            ? \"klein\"\n            : recommendationJourney.petSize === \"medium\"\n              ? \"mittel\"\n              : \"gross\"\n        );\n      }\n\n      const baseHref =\n        recommendationJourney.comparisonHref.split(/[?#]/)[0] || \"/vergleiche/\";\n      const serialized = params.toString();\n\n      return baseHref + \"#direktvergleich\" + (serialized ? \"?\" + serialized : \"\");\n    })()\n  : undefined;";
const FILTER_SCRIPT = "<script>\n  const initializeComparisonContextFilters = () => {\n    document.querySelectorAll<HTMLElement>(\"[data-comparison-context-filters]\").forEach((root) => {\n      if (root.dataset.contextInitialized === \"true\") return;\n      root.dataset.contextInitialized = \"true\";\n\n      const selects = Array.from(root.querySelectorAll<HTMLSelectElement>(\"[data-comparison-hero-select]\"));\n      const reset = root.querySelector<HTMLButtonElement>(\"[data-comparison-hero-filter-reset]\");\n      const apply = root.querySelector<HTMLButtonElement>(\"[data-comparison-hero-apply]\");\n      const toggle = root.querySelector<HTMLButtonElement>(\"[data-comparison-filter-toggle]\");\n\n      const parseFragmentState = () => {\n        const raw = window.location.hash.replace(/^#/, \"\");\n        const separator = raw.indexOf(\"?\");\n        return {\n          anchor: separator >= 0 ? raw.slice(0, separator) : raw,\n          params: new URLSearchParams(separator >= 0 ? raw.slice(separator + 1) : \"\")\n        };\n      };\n\n      const fragmentState = parseFragmentState();\n      const legacyQuery = new URLSearchParams(window.location.search);\n\n      const setOpen = (open: boolean) => {\n        root.dataset.mobileCollapsed = String(!open);\n        toggle?.setAttribute(\"aria-expanded\", String(open));\n      };\n\n      for (const select of selects) {\n        const key = select.dataset.filterKey ?? \"\";\n        const fromFragment = key ? fragmentState.params.get(key) : null;\n        const fromLegacyQuery = key ? legacyQuery.get(key) : null;\n        const contextual = select.dataset.defaultValue ?? \"\";\n        select.value = fromFragment ?? fromLegacyQuery ?? contextual;\n      }\n\n      const syncUrl = () => {\n        const next = new URL(window.location.href);\n        const state = new URLSearchParams();\n\n        for (const select of selects) {\n          const key = select.dataset.filterKey;\n          if (!key) continue;\n          next.searchParams.delete(key);\n          if (select.value) state.set(key, select.value);\n        }\n\n        const serialized = state.toString();\n        next.hash = serialized\n          ? \"#direktvergleich?\" + serialized\n          : \"#direktvergleich\";\n\n        history.replaceState({}, \"\", next.pathname + next.search + next.hash);\n      };\n\n      const hasLegacyFilterQuery = selects.some((select) => {\n        const key = select.dataset.filterKey;\n        return Boolean(key && legacyQuery.has(key));\n      });\n\n      if (hasLegacyFilterQuery) syncUrl();\n\n      selects.forEach((select) => select.addEventListener(\"change\", syncUrl));\n\n      toggle?.addEventListener(\"click\", () => {\n        setOpen(toggle.getAttribute(\"aria-expanded\") !== \"true\");\n      });\n\n      apply?.addEventListener(\"click\", () => {\n        syncUrl();\n        setOpen(false);\n        document.getElementById(\"direktvergleich\")?.scrollIntoView({\n          behavior: \"smooth\",\n          block: \"start\"\n        });\n      });\n\n      reset?.addEventListener(\"click\", () => {\n        for (const select of selects) {\n          select.value = select.dataset.defaultValue ?? \"\";\n        }\n        syncUrl();\n      });\n\n      const desktop = window.matchMedia(\"(min-width: 48rem)\");\n      const syncViewport = () => setOpen(desktop.matches);\n      desktop.addEventListener(\"change\", syncViewport);\n      syncViewport();\n    });\n  };\n\n  initializeComparisonContextFilters();\n  document.addEventListener(\"astro:page-load\", initializeComparisonContextFilters);\n</script>";
const AUDIT_SOURCE = "#!/usr/bin/env node\nimport fs from \"node:fs\";\nimport path from \"node:path\";\nimport { fileURLToPath } from \"node:url\";\n\nconst APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), \"../..\");\nconst DIST_ROOT = path.join(APP_ROOT, \"dist\");\nconst REPORT_ROOT = path.join(APP_ROOT, \"reports\", \"url-consistency\");\nconst STRICT = process.argv.includes(\"--strict\");\nconst CANONICAL_ORIGIN = \"https://pfotentechnik.de\";\nconst INTERNAL_HOSTS = new Set([\"pfotentechnik.de\", \"www.pfotentechnik.de\"]);\nconst FILTER_PARAM = /^filter(?:-|$)/i;\nconst MALFORMED_COMPARISON = /^\\/vergleiche\\/-/i;\n\nconst findings = [];\nconst add = (severity, code, file, value, message) => findings.push({ severity, code, file, value, message });\n\nconst walk = (dir, predicate) => {\n  if (!fs.existsSync(dir)) return [];\n  const result = [];\n  const stack = [dir];\n  while (stack.length) {\n    const current = stack.pop();\n    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {\n      const absolute = path.join(current, entry.name);\n      if (entry.isDirectory()) stack.push(absolute);\n      else if (!predicate || predicate(absolute)) result.push(absolute);\n    }\n  }\n  return result;\n};\n\nconst routeForHtml = (file) => {\n  const relative = path.relative(DIST_ROOT, file).replace(/\\\\/g, \"/\");\n  if (relative === \"index.html\") return \"/\";\n  if (relative.endsWith(\"/index.html\")) return \"/\" + relative.slice(0, -10);\n  return \"/\" + relative.replace(/\\.html$/, \"/\");\n};\n\nconst hasFilterParams = (url) => {\n  for (const key of url.searchParams.keys()) if (FILTER_PARAM.test(key)) return true;\n  return false;\n};\n\nconst parseInternal = (value, route) => {\n  try {\n    const url = new URL(value, CANONICAL_ORIGIN + route);\n    return INTERNAL_HOSTS.has(url.hostname.toLowerCase()) ? url : null;\n  } catch {\n    return null;\n  }\n};\n\nif (!fs.existsSync(DIST_ROOT)) {\n  add(\"error\", \"DIST_MISSING\", \"dist\", \"\", \"Build-Ausgabe fehlt.\");\n} else {\n  for (const file of walk(DIST_ROOT, (candidate) => candidate.endsWith(\".html\"))) {\n    const html = fs.readFileSync(file, \"utf8\");\n    const relative = path.relative(APP_ROOT, file).replace(/\\\\/g, \"/\");\n    const route = routeForHtml(file);\n\n    const canonical =\n      html.match(/<link\\b[^>]*rel=[\"']canonical[\"'][^>]*href=[\"']([^\"']+)[\"'][^>]*>/i) ||\n      html.match(/<link\\b[^>]*href=[\"']([^\"']+)[\"'][^>]*rel=[\"']canonical[\"'][^>]*>/i);\n\n    if (!canonical) {\n      add(\"error\", \"CANONICAL_MISSING\", relative, route, \"Canonical fehlt.\");\n    } else {\n      let url = null;\n      try { url = new URL(canonical[1], CANONICAL_ORIGIN); }\n      catch { add(\"error\", \"CANONICAL_INVALID\", relative, canonical[1], \"Canonical ist ungültig.\"); }\n\n      if (url) {\n        if (url.origin !== CANONICAL_ORIGIN) add(\"error\", \"CANONICAL_HOST\", relative, url.href, \"Canonical verwendet nicht den kanonischen Host.\");\n        if (url.search || url.hash) add(\"error\", \"CANONICAL_STATE\", relative, url.href, \"Canonical enthält Query oder Fragment.\");\n        if (MALFORMED_COMPARISON.test(url.pathname)) add(\"error\", \"CANONICAL_MALFORMED_COMPARISON\", relative, url.href, \"Canonical enthält eine fehlerhafte Vergleichsroute.\");\n      }\n    }\n\n    for (const match of html.matchAll(/\\bhref=[\"']([^\"']+)[\"']/gi)) {\n      const raw = match[1];\n      const url = parseInternal(raw, route);\n      if (!url) continue;\n      if (hasFilterParams(url)) add(\"error\", \"INTERNAL_FILTER_QUERY\", relative, raw, \"Interner Link enthält einen crawlbaren Filterparameter.\");\n      if (MALFORMED_COMPARISON.test(url.pathname)) add(\"error\", \"INTERNAL_MALFORMED_COMPARISON\", relative, raw, \"Interner Link enthält eine fehlerhafte Vergleichsroute.\");\n      if (/^https:\\/\\/www\\.pfotentechnik\\.de/i.test(raw)) add(\"error\", \"ABSOLUTE_WWW_INTERNAL_URL\", relative, raw, \"Absoluter interner Link verwendet www statt des kanonischen Hosts.\");\n    }\n  }\n\n  for (const file of walk(DIST_ROOT, (candidate) => /sitemap.*\\.xml$/i.test(candidate))) {\n    const xml = fs.readFileSync(file, \"utf8\");\n    const relative = path.relative(APP_ROOT, file).replace(/\\\\/g, \"/\");\n    for (const match of xml.matchAll(/<loc>([^<]+)<\\/loc>/gi)) {\n      const raw = match[1].trim();\n      let url;\n      try { url = new URL(raw); }\n      catch {\n        add(\"error\", \"SITEMAP_INVALID_URL\", relative, raw, \"Ungültige Sitemap-URL.\");\n        continue;\n      }\n      if (url.origin !== CANONICAL_ORIGIN) add(\"error\", \"SITEMAP_HOST\", relative, raw, \"Sitemap verwendet nicht den kanonischen Host.\");\n      if (url.search || url.hash) add(\"error\", \"SITEMAP_STATE_URL\", relative, raw, \"Sitemap enthält Query oder Fragment.\");\n      if (MALFORMED_COMPARISON.test(url.pathname)) add(\"error\", \"SITEMAP_MALFORMED_COMPARISON\", relative, raw, \"Sitemap enthält eine fehlerhafte Vergleichsroute.\");\n    }\n  }\n}\n\nfs.mkdirSync(REPORT_ROOT, { recursive: true });\nconst summary = {\n  checkedAt: new Date().toISOString(),\n  canonicalOrigin: CANONICAL_ORIGIN,\n  errors: findings.filter((item) => item.severity === \"error\").length,\n  warnings: findings.filter((item) => item.severity === \"warning\").length,\n  findings: findings.length\n};\n\nfs.writeFileSync(\n  path.join(REPORT_ROOT, \"url-consistency-audit.json\"),\n  JSON.stringify({ schemaVersion: 1, summary, findings }, null, 2) + \"\\n\",\n  \"utf8\"\n);\n\nfs.writeFileSync(\n  path.join(REPORT_ROOT, \"url-consistency-audit.md\"),\n  [\n    \"# URL Consistency Audit\",\n    \"\",\n    \"- Kanonischer Host: \" + CANONICAL_ORIGIN,\n    \"- Fehler: \" + summary.errors,\n    \"- Warnungen: \" + summary.warnings,\n    \"\",\n    \"## Findings\",\n    \"\",\n    ...(findings.length\n      ? findings.map((item) => \"- **\" + item.severity.toUpperCase() + \" · \" + item.code + \"** \" + item.file + \": \" + item.value + \" — \" + item.message)\n      : [\"Keine Findings.\"]),\n    \"\"\n  ].join(\"\\n\"),\n  \"utf8\"\n);\n\nconsole.log(\"URL Consistency Audit\");\nconsole.log(\"Kanonischer Host:\", CANONICAL_ORIGIN);\nconsole.log(\"Fehler:\", summary.errors);\nconsole.log(\"Warnungen:\", summary.warnings);\nif (STRICT && summary.errors > 0) process.exitCode = 1;\n";
const TEST_SOURCE = "import assert from \"node:assert/strict\";\nimport fs from \"node:fs\";\nimport path from \"node:path\";\nimport test from \"node:test\";\nimport { fileURLToPath } from \"node:url\";\n\nconst app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), \"..\");\nconst repo = path.resolve(app, \"../..\");\nconst read = (file) => fs.readFileSync(file, \"utf8\");\n\nconst page = read(path.join(app, \"src/pages/[slug].astro\"));\nconst filters = read(path.join(repo, \"packages/affiliate-core/src/components/comparison/ComparisonHeroFilters.astro\"));\nconst redirects = read(path.join(app, \"public/_redirects\"));\nconst pkg = JSON.parse(read(path.join(app, \"package.json\")));\nconst preflight = read(path.join(app, \"scripts/seo/release-preflight.mjs\"));\nconst projectConfig = read(path.join(app, \"src/project.config.ts\"));\n\ntest(\"Projekt verwendet non-www als kanonischen Host\", () => {\n  assert.match(projectConfig, /domain:\\s*\"https:\\/\\/pfotentechnik\\.de\"/);\n});\n\ntest(\"Money-Page baut Filterzustand im Fragment\", () => {\n  assert.match(page, /baseHref\\s*\\+\\s*\"#direktvergleich\"/);\n  assert.match(page, /serialized\\s*\\?\\s*\"\\?\"\\s*\\+\\s*serialized/);\n  assert.doesNotMatch(page, /comparisonHref\\.includes\\(\"\\?\"\\)/);\n});\n\ntest(\"ComparisonHeroFilters liest Fragmentzustand\", () => {\n  assert.match(filters, /parseFragmentState/);\n  assert.match(filters, /window\\.location\\.hash/);\n  assert.match(filters, /fromFragment/);\n});\n\ntest(\"Legacy-Filterqueries werden aus der URL entfernt\", () => {\n  assert.match(filters, /legacyQuery/);\n  assert.match(filters, /next\\.searchParams\\.delete\\(key\\)/);\n  assert.match(filters, /hasLegacyFilterQuery/);\n});\n\ntest(\"Filteränderungen erzeugen keine Queryparameter\", () => {\n  const start = filters.indexOf(\"const syncUrl =\");\n  const end = filters.indexOf(\"const hasLegacyFilterQuery\", start);\n  assert.notEqual(start, -1);\n  assert.notEqual(end, -1);\n  const syncBlock = filters.slice(start, end);\n  assert.doesNotMatch(syncBlock, /searchParams\\.set/);\n  assert.match(syncBlock, /next\\.hash/);\n});\n\ntest(\"historische kaputte Vergleichsroute wird umgeleitet\", () => {\n  assert.match(redirects, /\\/vergleiche\\/-fuer-katzen\\/\\s+\\/vergleiche\\/\\s+301/);\n});\n\ntest(\"URL-Konsistenz ist Release-Gate\", () => {\n  assert.equal(pkg.scripts[\"audit:url-consistency:strict\"], \"node scripts/seo/audit-url-consistency.mjs --strict\");\n  assert.match(preflight, /Kanonische URL-Konsistenz/);\n  assert.match(preflight, /audit:url-consistency:strict/);\n});\n";
const log = (message) => console.log("[" + PATCH + "] " + message);

function findRepoRoot(start = process.cwd()) {
  let current = path.resolve(start);
  for (let depth = 0; depth < 16; depth += 1) {
    if (fs.existsSync(path.join(current, "package.json")) &&
        fs.existsSync(path.join(current, "apps", "pfotentechnik", "package.json"))) return current;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}

const repo = findRepoRoot();
const app = path.join(repo, "apps", "pfotentechnik");
const files = {
  page: path.join(app, "src", "pages", "[slug].astro"),
  filters: path.join(repo, "packages", "affiliate-core", "src", "components", "comparison", "ComparisonHeroFilters.astro"),
  redirects: path.join(app, "public", "_redirects"),
  packageJson: path.join(app, "package.json"),
  preflight: path.join(app, "scripts", "seo", "release-preflight.mjs"),
  audit: path.join(app, "scripts", "seo", "audit-url-consistency.mjs"),
  test: path.join(app, "test", "canonical-url-consistency-33.0.1.test.mjs")
};

for (const key of ["page", "filters", "redirects", "packageJson", "preflight"]) {
  if (!fs.existsSync(files[key])) throw new Error("Erwartete Datei fehlt: " + path.relative(repo, files[key]));
}

const read = (file) => fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
const normalize = (source) => String(source).replace(/\r\n/g, "\n").trimEnd() + "\n";
const originals = new Map(Object.values(files).map((file) => [file, fs.existsSync(file) ? read(file) : null]));

const backupRoot = path.join(repo, ".patch-backups", PATCH + "-" + new Date().toISOString().replace(/[:.]/g, "-"));
for (const [file, content] of originals) {
  if (content == null) continue;
  const destination = path.join(backupRoot, path.relative(repo, file));
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, content, "utf8");
}
log("Backup: " + path.relative(repo, backupRoot));

const write = (file, source) => {
  const next = normalize(source);
  const current = fs.existsSync(file) ? read(file) : "";
  if (current === next) { log("Bereits aktuell: " + path.relative(repo, file)); return; }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, next, "utf8");
  log("Geändert: " + path.relative(repo, file));
};

const run = (command, args, label, cwd = repo) => {
  log("Prüfe: " + label);
  const executable = process.platform === "win32" && command === "npm" ? "npm.cmd" : command;
  const result = spawnSync(executable, args, { cwd, stdio: "inherit", shell: false, env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(label + " fehlgeschlagen (Exit " + result.status + ").");
  log("BESTANDEN: " + label);
};

try {
  let page = read(files.page);
  if (!page.includes('baseHref + "#direktvergleich"')) {
    const pattern = /const journeyComparisonHref = recommendationJourney[\s\S]*?\n  : undefined;/;
    if (!pattern.test(page)) throw new Error("Money-Page-Comparison-Link: Ausgangsstruktur nicht gefunden.");
    page = page.replace(pattern, PAGE_REPLACEMENT);
  }
  write(files.page, page);

  let filters = read(files.filters);
  if (!filters.includes("const parseFragmentState = () =>")) {
    const pattern = /<script>[\s\S]*?<\/script>/;
    if (!pattern.test(filters)) throw new Error("ComparisonHeroFilters-Script: Ausgangsstruktur nicht gefunden.");
    filters = filters.replace(pattern, FILTER_SCRIPT);
  }
  write(files.filters, filters);

  let redirects = read(files.redirects);
  const redirectLines = [
    "/vergleiche/-fuer-katzen /vergleiche/ 301",
    "/vergleiche/-fuer-katzen/ /vergleiche/ 301"
  ];
  if (!redirectLines.every((line) => redirects.includes(line))) {
    redirects = redirects.trimEnd() + "\n\n# " + PATCH + ": historische fehlerhafte Vergleichsroute\n" +
      redirectLines.filter((line) => !redirects.includes(line)).join("\n") + "\n";
  }
  write(files.redirects, redirects);

  write(files.audit, AUDIT_SOURCE);
  write(files.test, TEST_SOURCE);

  const pkg = JSON.parse(read(files.packageJson));
  pkg.scripts = pkg.scripts || {};
  pkg.scripts["audit:url-consistency"] = "node scripts/seo/audit-url-consistency.mjs";
  pkg.scripts["audit:url-consistency:strict"] = "node scripts/seo/audit-url-consistency.mjs --strict";
  write(files.packageJson, JSON.stringify(pkg, null, 2));

  let preflight = read(files.preflight);
  if (!preflight.includes('"audit:url-consistency:strict"')) {
    const anchor = '  npmScript("Gerenderte interne Linkziele", "audit:internal-link-targets:strict");';
    if (!preflight.includes(anchor)) throw new Error("Release-Preflight-Anker nicht gefunden.");
    preflight = preflight.replace(anchor, '  npmScript("Kanonische URL-Konsistenz", "audit:url-consistency:strict");\n' + anchor);
  }
  write(files.preflight, preflight);

  run("node", ["--check", files.audit], "Syntaxprüfung URL-Audit");
  run("node", ["--check", files.test], "Syntaxprüfung Regressionstest");
  run("node", ["--test", files.test], "Canonical-URL-Regressionstest");
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "build"], "Astro-Build");
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "audit:url-consistency:strict"], "Gerenderte URL-Konsistenz");
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
  console.error("[" + PATCH + "] FEHLER: " + (error instanceof Error ? error.message : String(error)));
  console.error("[" + PATCH + "] Änderungen wurden zurückgerollt.");
  process.exit(1);
}

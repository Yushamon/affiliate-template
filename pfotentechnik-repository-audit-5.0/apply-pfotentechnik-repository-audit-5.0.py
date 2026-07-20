#!/usr/bin/env python3
from __future__ import annotations

import json
import shutil
import sys
from datetime import datetime
from pathlib import Path

AUDIT_SCRIPT = 'import fs from "node:fs";\nimport path from "node:path";\nimport process from "node:process";\n\nconst appRoot = process.cwd();\nconst srcRoot = path.join(appRoot, "src");\nconst reportDir = path.join(appRoot, "reports");\nconst strict = process.argv.includes("--strict");\n\nconst exists = (value) => fs.existsSync(value);\nconst walk = (dir, extensions = null) => {\n  if (!exists(dir)) return [];\n  const result = [];\n  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {\n    const full = path.join(dir, entry.name);\n    if (entry.isDirectory()) result.push(...walk(full, extensions));\n    else if (!extensions || extensions.some((ext) => entry.name.endsWith(ext))) result.push(full);\n  }\n  return result;\n};\n\nconst relative = (file) => path.relative(appRoot, file).replaceAll(path.sep, "/");\nconst read = (file) => fs.readFileSync(file, "utf8");\nconst normalizeRoute = (value) => {\n  if (!value || /^(https?:|mailto:|tel:|#|javascript:)/i.test(value)) return null;\n  const clean = value.split(/[?#]/)[0];\n  if (!clean.startsWith("/")) return null;\n  const route = clean === "/" ? "/" : `/${clean.replace(/^\\/+|\\/+$/g, "")}/`;\n  return route.replace(/\\/+/g, "/");\n};\n\nconst parseFrontmatter = (source) => {\n  const match = source.match(/^---\\r?\\n([\\s\\S]*?)\\r?\\n---/);\n  if (!match) return {};\n  const raw = match[1];\n  const value = (key) => {\n    const found = raw.match(new RegExp(`^${key}:\\\\s*(.+)$`, "m"));\n    return found ? found[1].trim().replace(/^[\'"]|[\'"]$/g, "") : null;\n  };\n  return {\n    slug: value("slug"),\n    title: value("title"),\n    description: value("description"),\n    publishedAt: value("publishedAt"),\n    updatedAt: value("updatedAt"),\n    category: value("category"),\n  };\n};\n\nconst collections = {\n  pages: { dir: path.join(srcRoot, "content", "pages"), route: (fm) => `/${fm.slug}/` },\n  products: { dir: path.join(srcRoot, "content", "products"), route: (fm) => `/produkt/${fm.slug}/` },\n  manufacturers: { dir: path.join(srcRoot, "content", "manufacturers"), route: (fm) => `/hersteller/${fm.slug}/` },\n  comparisons: { dir: path.join(srcRoot, "content", "comparisons"), route: (fm) => `/vergleiche/${fm.slug}/` },\n};\n\nconst findings = [];\nconst add = (severity, area, message, file = null, data = {}) =>\n  findings.push({ severity, area, message, file, ...data });\n\nconst routeOwners = new Map();\nconst entries = [];\n\nfor (const [collection, config] of Object.entries(collections)) {\n  for (const file of walk(config.dir, [".md", ".mdx"])) {\n    const source = read(file);\n    const fm = parseFrontmatter(source);\n    if (!fm.slug) {\n      add("error", "content", `Fehlender slug in ${collection}`, relative(file));\n      continue;\n    }\n    const route = normalizeRoute(config.route(fm));\n    if (routeOwners.has(route)) {\n      add("error", "technical-seo", `Doppelte Route ${route}`, relative(file), {\n        otherFile: routeOwners.get(route),\n      });\n    } else {\n      routeOwners.set(route, relative(file));\n    }\n    if (!fm.title) add("error", "content", "Fehlender title", relative(file));\n    if (!fm.description) add("warning", "technical-seo", "Fehlende description", relative(file));\n    if (collection === "pages" && !fm.publishedAt) {\n      add("warning", "structured-data", "Ratgeber ohne publishedAt", relative(file));\n    }\n    entries.push({ collection, file, route, fm, source });\n  }\n}\n\nfor (const file of walk(path.join(srcRoot, "pages"), [".astro", ".md", ".mdx"])) {\n  const rel = relative(file);\n  const routePath = rel\n    .replace(/^src\\/pages/, "")\n    .replace(/\\/index\\.astro$/, "/")\n    .replace(/\\.astro$/, "/");\n  if (!routePath.includes("[") && !routePath.includes("...")) {\n    const route = normalizeRoute(routePath || "/");\n    if (route && !routeOwners.has(route)) routeOwners.set(route, rel);\n  }\n}\n\nconst sourceFiles = walk(srcRoot, [".astro", ".ts", ".js", ".mjs", ".md", ".mdx"]);\nconst incoming = new Map([...routeOwners.keys()].map((route) => [route, 0]));\nconst hrefPatterns = [\n  /\\bhref\\s*=\\s*["\']([^"\']+)["\']/g,\n  /\\]\\((\\/[^)\\s]+)\\)/g,\n  /\\b(?:canonical|productUrl)\\s*:\\s*["\']([^"\']+)["\']/g,\n];\n\nfor (const file of sourceFiles) {\n  const source = read(file);\n  for (const pattern of hrefPatterns) {\n    for (const match of source.matchAll(pattern)) {\n      const route = normalizeRoute(match[1]);\n      if (!route) continue;\n      if (incoming.has(route)) incoming.set(route, incoming.get(route) + 1);\n      else if (!route.includes("[") && !/\\.(svg|png|jpe?g|webp|avif|css|js|xml|txt|pdf)\\/?$/i.test(route)) {\n        add("warning", "internal-linking", `Möglicherweise gebrochener interner Link: ${route}`, relative(file));\n      }\n    }\n  }\n\n  if (file.endsWith(".astro")) {\n    for (const tag of source.match(/<img\\b[\\s\\S]*?>/gi) ?? []) {\n      if (!/\\balt\\s*=/.test(tag)) add("error", "accessibility", "img ohne alt-Attribut", relative(file));\n    }\n  }\n\n  const lineCount = source.split(/\\r?\\n/).length;\n  if (lineCount > 1000) add("warning", "maintainability", `Sehr große Datei mit ${lineCount} Zeilen`, relative(file));\n}\n\nfor (const entry of entries) {\n  if (entry.route !== "/" && (incoming.get(entry.route) ?? 0) === 0) {\n    add("warning", "internal-linking", `Verwaister Inhalt ohne erkannten internen Link: ${entry.route}`, relative(entry.file));\n  }\n}\n\nconst componentFiles = walk(path.join(srcRoot, "components"), [".astro", ".tsx", ".jsx"]);\nconst searchable = sourceFiles.map((file) => ({ file, source: read(file) }));\nfor (const component of componentFiles) {\n  const base = path.basename(component).replace(/\\.(astro|tsx|jsx)$/, "");\n  const used = searchable.some(({ file, source }) => file !== component && new RegExp(`\\\\b${base}\\\\b`).test(source));\n  if (!used) add("info", "unused-components", `Komponente ohne erkannten Import: ${base}`, relative(component));\n}\n\nfor (const file of walk(path.join(srcRoot, "styles"), [".css"])) {\n  const source = read(file);\n  const counts = new Map();\n  for (const match of source.matchAll(/(^|})\\s*([^@}{][^{]+)\\s*\\{/gm)) {\n    const selector = match[2].trim().replace(/\\s+/g, " ");\n    if (!selector || selector.length > 180) continue;\n    counts.set(selector, (counts.get(selector) ?? 0) + 1);\n  }\n  for (const [selector, count] of counts) {\n    if (count >= 3) add("info", "css", `Selektor ${count}× definiert: ${selector}`, relative(file));\n  }\n  if (source.split(/\\r?\\n/).length > 2500) add("warning", "css", "CSS-Datei sollte modularisiert werden", relative(file));\n}\n\nconst countsByCollection = Object.fromEntries(\n  Object.keys(collections).map((name) => [name, entries.filter((entry) => entry.collection === name).length])\n);\nconst categoryCounts = {};\nfor (const entry of entries.filter((item) => item.collection === "pages")) {\n  const key = entry.fm.category || "ohne Kategorie";\n  categoryCounts[key] = (categoryCounts[key] ?? 0) + 1;\n}\n\nconst severityOrder = { error: 0, warning: 1, info: 2 };\nfindings.sort((a, b) =>\n  severityOrder[a.severity] - severityOrder[b.severity] ||\n  a.area.localeCompare(b.area) ||\n  (a.file ?? "").localeCompare(b.file ?? "")\n);\n\nconst summary = {\n  generatedAt: new Date().toISOString(),\n  countsByCollection,\n  categoryCounts,\n  routes: routeOwners.size,\n  findings: {\n    error: findings.filter((item) => item.severity === "error").length,\n    warning: findings.filter((item) => item.severity === "warning").length,\n    info: findings.filter((item) => item.severity === "info").length,\n  },\n};\n\nfs.mkdirSync(reportDir, { recursive: true });\nfs.writeFileSync(path.join(reportDir, "repository-audit.json"), JSON.stringify({ summary, findings }, null, 2) + "\\n");\n\nconst markdown = [\n  "# Pfotentechnik Repository Audit",\n  "",\n  `Erstellt: ${summary.generatedAt}`,\n  "",\n  "## Zusammenfassung",\n  "",\n  `- Routen: ${summary.routes}`,\n  `- Fehler: ${summary.findings.error}`,\n  `- Warnungen: ${summary.findings.warning}`,\n  `- Hinweise: ${summary.findings.info}`,\n  "",\n  "## Content-Bestand",\n  "",\n  ...Object.entries(countsByCollection).map(([key, value]) => `- ${key}: ${value}`),\n  "",\n  "## Befunde",\n  "",\n  ...findings.map((item) =>\n    `- **${item.severity.toUpperCase()} · ${item.area}**: ${item.message}` +\n    (item.file ? ` (\\`${item.file}\\`)` : "")\n  ),\n  "",\n].join("\\n");\n\nfs.writeFileSync(path.join(reportDir, "repository-audit.md"), markdown);\nconsole.log(markdown);\n\nif (strict && findings.some((item) => item.severity === "error")) process.exitCode = 1;\n'
REPO_README = '# Pfotentechnik Repository Audit 5.0\n\nDieses Paket ergänzt das Repository um eine prüfbare Audit-Schicht und korrigiert konkrete SEO-Probleme im gemeinsamen Layout.\n\n## Enthaltene Änderungen\n\n- absolute Publisher- und Autoren-URLs in strukturierten Daten\n- `WebSite`-Schema nur auf der Startseite\n- `max-image-preview:large`, Open-Graph-Locale, Theme-Color und Color-Scheme\n- Audit für doppelte Routen, fehlende Metadaten, interne Links und verwaiste Inhalte\n- Hinweise auf ungenutzte Komponenten, CSS-Dopplungen und übergroße Dateien\n- Markdown- und JSON-Report unter `apps/pfotentechnik/reports/`\n\n## Ausführung\n\n```bash\npython3 apply-pfotentechnik-repository-audit-5.0.py\nnpm --workspace apps/pfotentechnik run audit:repository\nnpm run build:pfotentechnik\n```\n\nStrikter Modus:\n\n```bash\nnpm --workspace apps/pfotentechnik run audit:repository:strict\n```\n'

def fail(message: str) -> None:
    print(f"Fehler: {message}", file=sys.stderr)
    raise SystemExit(1)

def find_repo_root(start: Path) -> Path:
    for candidate in [start, *start.parents]:
        if (candidate / "apps" / "pfotentechnik").is_dir() and (candidate / "packages" / "affiliate-core").is_dir():
            return candidate
    fail("Repository-Root nicht gefunden. Script im Repository oder einem Unterordner ausführen.")

def replace_once(source: str, old: str, new: str, label: str) -> str:
    count = source.count(old)
    if count != 1:
        fail(f"{label}: erwartete Fundstelle genau 1×, gefunden {count}×. Datei wurde nicht verändert.")
    return source.replace(old, new, 1)

root = find_repo_root(Path.cwd().resolve())
app = root / "apps" / "pfotentechnik"
layout = root / "packages" / "affiliate-core" / "src" / "layouts" / "AffiliateLayout.astro"
package = app / "package.json"
audit_file = app / "scripts" / "audit-repository.mjs"
readme_file = root / "PFOTENTECHNIK_REPOSITORY_AUDIT_5.0.md"

for required in [layout, package]:
    if not required.exists():
        fail(f"Erforderliche Datei fehlt: {required}")

stamp = datetime.now().strftime("%Y-%m-%dT%H-%M-%S")
backup = root / f".pfotentechnik-repository-audit-5.0-backup-{stamp}"
for file in [layout, package]:
    target = backup / file.relative_to(root)
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(file, target)

source = layout.read_text(encoding="utf-8")
source = replace_once(
    source,
    'const imageUrl = ogImage\n  ? toAbsoluteUrl(site.domain, ogImage)\n  : toAbsoluteUrl(site.domain, projectConfig.defaultOgImage ?? "/favicon.svg");',
    'const imageUrl = ogImage\n  ? toAbsoluteUrl(site.domain, ogImage)\n  : toAbsoluteUrl(site.domain, projectConfig.defaultOgImage ?? "/favicon.svg");\nconst publisherLogoUrl = toAbsoluteUrl(site.domain, siteMeta.publisher.logo);\nconst authorUrl = visibleAuthor.url\n  ? toAbsoluteUrl(site.domain, visibleAuthor.url)\n  : siteMeta.defaultAuthor.url\n    ? toAbsoluteUrl(site.domain, siteMeta.defaultAuthor.url)\n    : undefined;',
    "Absolute Schema-URLs",
)
source = source.replace("logo: siteMeta.publisher.logo", "logo: publisherLogoUrl")
source = source.replace("url: siteMeta.publisher.logo", "url: publisherLogoUrl")
source = source.replace(
    "url: visibleAuthor.url ?? siteMeta.defaultAuthor.url",
    "...(authorUrl ? { url: authorUrl } : {})",
)
source = replace_once(
    source,
    'content={noindex ? "noindex,follow" : "index,follow"}',
    'content={noindex\n        ? "noindex,follow,max-image-preview:large"\n        : "index,follow,max-image-preview:large"}',
    "Robots-Metadaten",
)
source = replace_once(
    source,
    '    <link\n      rel="icon"\n      type="image/svg+xml"\n      href="/favicon.svg"\n    />',
    '    <link\n      rel="icon"\n      type="image/svg+xml"\n      href="/favicon.svg"\n    />\n    <meta name="theme-color" content="#101512" />\n    <meta name="color-scheme" content="light dark" />\n    <meta property="og:locale" content="de_DE" />',
    "Social- und Browser-Metadaten",
)
source = replace_once(
    source,
    '    <script\n      type="application/ld+json"\n      set:html={JSON.stringify(websiteSchema)}\n    />',
    '    {\n      isHome && (\n        <script\n          type="application/ld+json"\n          set:html={JSON.stringify(websiteSchema)}\n        />\n      )\n    }',
    "WebSite-Schema nur Startseite",
)
layout.write_text(source, encoding="utf-8")

package_data = json.loads(package.read_text(encoding="utf-8"))
scripts = package_data.setdefault("scripts", {})
scripts["audit:repository"] = "node scripts/audit-repository.mjs"
scripts["audit:repository:strict"] = "node scripts/audit-repository.mjs --strict"
package.write_text(json.dumps(package_data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

audit_file.parent.mkdir(parents=True, exist_ok=True)
audit_file.write_text(AUDIT_SCRIPT, encoding="utf-8")
readme_file.write_text(REPO_README, encoding="utf-8")

print("Pfotentechnik Repository Audit 5.0 installiert.")
print(f"Backup: {backup}")
print("Jetzt ausführen:")
print("  npm --workspace apps/pfotentechnik run audit:repository")
print("  npm run build:pfotentechnik")

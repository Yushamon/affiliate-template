#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-content-discovery-linking-32.6.0";
const SYNC_SCRIPT = "#!/usr/bin/env node\nimport fs from \"node:fs\";\nimport path from \"node:path\";\nimport process from \"node:process\";\nimport { fileURLToPath } from \"node:url\";\n\nconst APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), \"../..\");\nconst CONTENT_ROOT = path.join(APP_ROOT, \"src\", \"content\");\nconst PRODUCT_DIR = path.join(CONTENT_ROOT, \"products\");\nconst MANUFACTURER_DIR = path.join(CONTENT_ROOT, \"manufacturers\");\nconst PAGE_DIR = path.join(CONTENT_ROOT, \"pages\");\nconst COMPARISON_DIR = path.join(CONTENT_ROOT, \"comparisons\");\nconst REPORT_DIR = path.join(APP_ROOT, \"reports\", \"internal-linking\");\n\nconst args = new Set(process.argv.slice(2));\nconst writeMode = args.has(\"--write\");\nconst checkMode = args.has(\"--check\") || !writeMode;\nconst backupRoot = process.env.PT_DISCOVERY_BACKUP_ROOT || \"\";\n\nconst MARKERS = {\n  categoryProducts: [\n    \"<!-- pt:content-discovery:category-products:start -->\",\n    \"<!-- pt:content-discovery:category-products:end -->\"\n  ],\n  manufacturerProducts: [\n    \"<!-- pt:content-discovery:manufacturer-products:start -->\",\n    \"<!-- pt:content-discovery:manufacturer-products:end -->\"\n  ],\n  manufacturerDirectory: [\n    \"<!-- pt:content-discovery:manufacturer-directory:start -->\",\n    \"<!-- pt:content-discovery:manufacturer-directory:end -->\"\n  ],\n  fallbackProducts: [\n    \"<!-- pt:content-discovery:fallback-products:start -->\",\n    \"<!-- pt:content-discovery:fallback-products:end -->\"\n  ]\n};\n\nconst normalizeSlashes = (value) => String(value || \"\").replaceAll(\"\\\\\", \"/\");\n\nconst normalizeRoute = (value) => {\n  const pathOnly = String(value || \"\").trim().split(/[?#]/, 1)[0];\n  if (!pathOnly.startsWith(\"/\")) return \"\";\n  const compact = pathOnly.replace(/\\/+/g, \"/\");\n  return compact === \"/\" ? \"/\" : `${compact.replace(/\\/+$/, \"\")}/`;\n};\n\nconst listMarkdown = (dir) => {\n  if (!fs.existsSync(dir)) return [];\n  return fs.readdirSync(dir, { withFileTypes: true })\n    .flatMap((entry) => {\n      const full = path.join(dir, entry.name);\n      if (entry.isDirectory()) return listMarkdown(full);\n      return entry.isFile() && entry.name.endsWith(\".md\") ? [full] : [];\n    });\n};\n\nconst read = (file) => fs.readFileSync(file, \"utf8\").replace(/\\r\\n/g, \"\\n\");\n\nconst unquote = (value) => {\n  const trimmed = String(value || \"\").trim().replace(/,$/, \"\");\n  if (\n    (trimmed.startsWith('\"') && trimmed.endsWith('\"')) ||\n    (trimmed.startsWith(\"'\") && trimmed.endsWith(\"'\"))\n  ) {\n    return trimmed.slice(1, -1);\n  }\n  return trimmed;\n};\n\nconst frontmatterOf = (source) => {\n  const normalized = source.replace(/\\r\\n/g, \"\\n\");\n  if (!normalized.startsWith(\"---\\n\")) return \"\";\n  const end = normalized.indexOf(\"\\n---\", 4);\n  return end >= 0 ? normalized.slice(4, end) : \"\";\n};\n\nconst topScalar = (fm, key) => {\n  const escaped = key.replace(/[.*+?^${}()|[\\]\\\\]/g, \"\\\\$&\");\n  const match = fm.match(new RegExp(`^${escaped}:\\\\s*(.+)$`, \"m\"));\n  if (!match) return \"\";\n  const value = match[1].trim();\n  if (value.startsWith(\"{\") || value.startsWith(\"[\")) return \"\";\n  return unquote(value);\n};\n\nconst sectionSource = (fm, section) => {\n  const escaped = section.replace(/[.*+?^${}()|[\\]\\\\]/g, \"\\\\$&\");\n  const inline = fm.match(new RegExp(`^${escaped}:\\\\s*\\\\{([^\\\\n}]*)\\\\}\\\\s*$`, \"m\"));\n  if (inline) return `{${inline[1]}}`;\n\n  const block = fm.match(new RegExp(`^${escaped}:\\\\s*\\\\n((?:[ \\\\t]+[^\\\\n]*(?:\\\\n|$))*)`, \"m\"));\n  return block?.[1] || \"\";\n};\n\nconst sectionScalar = (fm, section, key) => {\n  const source = sectionSource(fm, section);\n  if (!source) return \"\";\n  const escaped = key.replace(/[.*+?^${}()|[\\]\\\\]/g, \"\\\\$&\");\n  const inline = source.startsWith(\"{\")\n    ? source.match(new RegExp(`(?:^|[,\\\\s])${escaped}:\\\\s*(\"[^\"]*\"|'[^']*'|[^,}]+)`))\n    : source.match(new RegExp(`^[ \\\\t]+${escaped}:\\\\s*(.+)$`, \"m\"));\n  return inline ? unquote(inline[1]) : \"\";\n};\n\nconst isNoindex = (fm) => {\n  const direct = topScalar(fm, \"noindex\");\n  const nested = sectionScalar(fm, \"seo\", \"noindex\");\n  return [direct, nested].some((value) => /^true$/i.test(value));\n};\n\nconst routeFromEntry = (kind, slug, fm) => {\n  if (kind === \"product\") return normalizeRoute(`/produkt/${slug}/`);\n  if (kind === \"manufacturer\") return normalizeRoute(`/hersteller/${slug}/`);\n  if (kind === \"comparison\") return normalizeRoute(`/vergleiche/${slug}/`);\n  if (kind === \"page\") {\n    const canonical = sectionScalar(fm, \"seo\", \"canonical\");\n    return normalizeRoute(canonical || `/${slug}/`);\n  }\n  return \"\";\n};\n\nconst makeEntry = (file, kind) => {\n  const source = read(file);\n  const fm = frontmatterOf(source);\n  const filenameSlug = path.basename(file, \".md\");\n  const slug = topScalar(fm, \"slug\") || filenameSlug;\n  const title = topScalar(fm, \"title\") || slug;\n  return {\n    file,\n    relative: normalizeSlashes(path.relative(APP_ROOT, file)),\n    kind,\n    source,\n    fm,\n    slug,\n    title,\n    route: routeFromEntry(kind, slug, fm),\n    noindex: isNoindex(fm)\n  };\n};\n\nconst products = listMarkdown(PRODUCT_DIR).map((file) => {\n  const entry = makeEntry(file, \"product\");\n  const status = topScalar(entry.fm, \"productStatus\") || \"active\";\n  return {\n    ...entry,\n    status,\n    active: ![\"legacy\", \"discontinued\"].includes(status) && !entry.noindex,\n    manufacturerSlug: sectionScalar(entry.fm, \"manufacturer\", \"slug\"),\n    manufacturerName: sectionScalar(entry.fm, \"manufacturer\", \"name\"),\n    categoryPath: normalizeRoute(sectionScalar(entry.fm, \"category\", \"path\")),\n    categoryKey: sectionScalar(entry.fm, \"category\", \"key\")\n  };\n});\n\nconst manufacturers = listMarkdown(MANUFACTURER_DIR)\n  .map((file) => makeEntry(file, \"manufacturer\"))\n  .filter((entry) => !entry.noindex);\n\nconst pages = listMarkdown(PAGE_DIR)\n  .map((file) => makeEntry(file, \"page\"))\n  .filter((entry) => !entry.noindex);\n\nconst comparisons = listMarkdown(COMPARISON_DIR)\n  .map((file) => makeEntry(file, \"comparison\"))\n  .filter((entry) => !entry.noindex);\n\nconst allEntries = [...products, ...manufacturers, ...pages, ...comparisons];\n\nconst pageByRoute = new Map(pages.map((entry) => [entry.route, entry]));\nconst pageBySlug = new Map(pages.map((entry) => [entry.slug, entry]));\nconst manufacturerBySlug = new Map(manufacturers.map((entry) => [entry.slug, entry]));\n\nconst centralHub =\n  pageBySlug.get(\"smarte-haustiertechnik\") ||\n  pageByRoute.get(\"/smarte-haustiertechnik/\");\n\nif (!centralHub) {\n  throw new Error(\n    \"Zentraler Hub smarte-haustiertechnik wurde nicht gefunden. Content-Discovery kann nicht sicher erzeugt werden.\"\n  );\n}\n\nconst markerRegex = ([start, end]) =>\n  new RegExp(\n    `${start.replace(/[.*+?^${}()|[\\]\\\\]/g, \"\\\\$&\")}[\\\\s\\\\S]*?${end.replace(/[.*+?^${}()|[\\]\\\\]/g, \"\\\\$&\")}\\\\n*`,\n    \"g\"\n  );\n\nconst stripBlock = (source, markers) => source.replace(markerRegex(markers), \"\").trimEnd() + \"\\n\";\n\nconst stripAllManagedBlocks = (source) => {\n  let next = source;\n  for (const markers of Object.values(MARKERS)) next = next.replace(markerRegex(markers), \"\");\n  return next.trimEnd() + \"\\n\";\n};\n\nconst markdownLinks = (source) => {\n  const routes = [];\n  const patterns = [\n    /\\]\\((\\/[^)\\s]+)\\)/g,\n    /\\bhref\\s*=\\s*[\"'](\\/[^\"'#?]+(?:[?#][^\"']*)?)[\"']/g\n  ];\n  for (const pattern of patterns) {\n    for (const match of source.matchAll(pattern)) {\n      const route = normalizeRoute(match[1]);\n      if (route) routes.push(route);\n    }\n  }\n  return routes;\n};\n\nconst relationBody = (heading, intro, links) => [\n  heading,\n  \"\",\n  intro,\n  \"\",\n  ...links.map((link) => `- [${link.label}](${link.href})`)\n].join(\"\\n\");\n\nconst managedBlock = (markers, body) =>\n  body\n    ? `${markers[0]}\\n${body.trim()}\\n${markers[1]}\\n`\n    : \"\";\n\nconst appendManagedBlock = (source, markers, body) => {\n  const base = stripBlock(source, markers).trimEnd();\n  const block = managedBlock(markers, body);\n  return block ? `${base}\\n\\n${block}` : `${base}\\n`;\n};\n\nconst sourceWithoutManagedLinks = new Map(\n  allEntries.map((entry) => [entry.file, stripAllManagedBlocks(entry.source)])\n);\n\nconst plans = new Map();\nconst setPlan = (entry, nextSource) => {\n  if (nextSource !== entry.source) plans.set(entry.file, nextSource);\n};\n\nconst organicLinksFor = (entry) =>\n  new Set(markdownLinks(sourceWithoutManagedLinks.get(entry.file) || entry.source));\n\nconst activeProducts = products.filter((product) => product.active);\nconst unresolvedCategoryProducts = [];\n\n// 1) Kategorie-Hubs verlinken alle aktiven Produkte ihrer Kategorie,\n//    soweit diese nicht bereits redaktionell im Hub verlinkt sind.\nconst productsByHubFile = new Map();\n\nfor (const product of activeProducts) {\n  let hub = product.categoryPath ? pageByRoute.get(product.categoryPath) : null;\n\n  if (!hub && product.categoryKey) {\n    hub = pageBySlug.get(product.categoryKey) || pageByRoute.get(normalizeRoute(`/${product.categoryKey}/`));\n  }\n\n  if (!hub) {\n    unresolvedCategoryProducts.push(product);\n    continue;\n  }\n\n  const list = productsByHubFile.get(hub.file) || [];\n  list.push(product);\n  productsByHubFile.set(hub.file, list);\n}\n\nfor (const [hubFile, hubProducts] of productsByHubFile) {\n  const hub = pages.find((entry) => entry.file === hubFile);\n  const organic = organicLinksFor(hub);\n  const missing = hubProducts\n    .filter((product) => !organic.has(product.route))\n    .sort((a, b) => a.title.localeCompare(b.title, \"de\"));\n\n  const body = missing.length\n    ? relationBody(\n        \"## Weitere Produktseiten im Themenbereich\",\n        \"Diese Modelle gehören ebenfalls zu diesem Themenbereich. In den redaktionellen Vergleichen erscheinen nur Produkte, die zur jeweiligen Suchintention und zu den gemeinsamen Kriterien passen.\",\n        missing.map((product) => ({ label: product.title, href: product.route }))\n      )\n    : \"\";\n\n  setPlan(hub, appendManagedBlock(hub.source, MARKERS.categoryProducts, body));\n}\n\n// 2) Herstellerseiten verlinken die aktiven Produkte des Herstellers.\nconst productsByManufacturer = new Map();\n\nfor (const product of activeProducts) {\n  if (!product.manufacturerSlug) continue;\n  const list = productsByManufacturer.get(product.manufacturerSlug) || [];\n  list.push(product);\n  productsByManufacturer.set(product.manufacturerSlug, list);\n}\n\nfor (const manufacturer of manufacturers) {\n  const manufacturerProducts = productsByManufacturer.get(manufacturer.slug) || [];\n  const organic = organicLinksFor(manufacturer);\n  const missing = manufacturerProducts\n    .filter((product) => !organic.has(product.route))\n    .sort((a, b) => a.title.localeCompare(b.title, \"de\"));\n\n  const body = missing.length\n    ? relationBody(\n        `## Weitere Produkte von ${manufacturer.title}`,\n        \"Diese Produktseiten ergänzen das Herstellerprofil und führen zu den jeweiligen redaktionellen Einordnungen.\",\n        missing.map((product) => ({ label: product.title, href: product.route }))\n      )\n    : \"\";\n\n  setPlan(\n    manufacturer,\n    appendManagedBlock(manufacturer.source, MARKERS.manufacturerProducts, body)\n  );\n}\n\n// 3) Zentraler Smart-Home-/Haustiertechnik-Hub erschließt Herstellerseiten.\n//    Bereits redaktionell gesetzte Links werden nicht dupliziert.\n{\n  const organic = organicLinksFor(centralHub);\n  const missing = manufacturers\n    .filter((manufacturer) => !organic.has(manufacturer.route))\n    .sort((a, b) => a.title.localeCompare(b.title, \"de\"));\n\n  const body = missing.length\n    ? relationBody(\n        \"## Herstellerseiten im Überblick\",\n        \"Die Herstellerseiten bündeln Produktfamilien, dokumentierte Systemunterschiede und die jeweils gepflegten Produktseiten.\",\n        missing.map((manufacturer) => ({\n          label: manufacturer.title,\n          href: manufacturer.route\n        }))\n      )\n    : \"\";\n\n  const current = plans.get(centralHub.file) || centralHub.source;\n  plans.set(\n    centralHub.file,\n    appendManagedBlock(current, MARKERS.manufacturerDirectory, body)\n  );\n}\n\n// 4) Sicherheitsnetz: Produkte ohne auflösbaren Kategorie-Hub erhalten einen\n//    sichtbaren Link vom zentralen Hub. Der Report markiert diese Fälle trotzdem.\n{\n  const organic = new Set(\n    markdownLinks(\n      stripBlock(\n        stripBlock(\n          plans.get(centralHub.file) || centralHub.source,\n          MARKERS.fallbackProducts\n        ),\n        MARKERS.manufacturerDirectory\n      )\n    )\n  );\n\n  const missingFallback = unresolvedCategoryProducts\n    .filter((product) => !organic.has(product.route))\n    .sort((a, b) => a.title.localeCompare(b.title, \"de\"));\n\n  const body = missingFallback.length\n    ? relationBody(\n        \"## Weitere Produktseiten\",\n        \"Für diese Produktseiten ist aktuell kein eindeutiger Kategorie-Hub auflösbar. Sie bleiben erreichbar, bis die Kategoriezuordnung korrigiert ist.\",\n        missingFallback.map((product) => ({ label: product.title, href: product.route }))\n      )\n    : \"\";\n\n  const current = plans.get(centralHub.file) || centralHub.source;\n  plans.set(\n    centralHub.file,\n    appendManagedBlock(current, MARKERS.fallbackProducts, body)\n  );\n}\n\nconst expectedSource = new Map(\n  allEntries.map((entry) => [entry.file, plans.get(entry.file) || entry.source])\n);\n\nconst routeForSourceFile = new Map(allEntries.map((entry) => [entry.file, entry.route]));\nconst incoming = new Map();\n\nfor (const [file, source] of expectedSource) {\n  const sourceRoute = routeForSourceFile.get(file) || \"\";\n  for (const target of markdownLinks(source)) {\n    if (!target || target === sourceRoute) continue;\n    const set = incoming.get(target) || new Set();\n    set.add(sourceRoute || normalizeSlashes(path.relative(APP_ROOT, file)));\n    incoming.set(target, set);\n  }\n}\n\nconst orphanProducts = activeProducts\n  .filter((product) => !(incoming.get(product.route)?.size))\n  .map((product) => ({ slug: product.slug, route: product.route, title: product.title }));\n\nconst orphanManufacturers = manufacturers\n  .filter((manufacturer) => !(incoming.get(manufacturer.route)?.size))\n  .map((manufacturer) => ({\n    slug: manufacturer.slug,\n    route: manufacturer.route,\n    title: manufacturer.title\n  }));\n\nconst missingManufacturerProfiles = activeProducts\n  .filter(\n    (product) =>\n      product.manufacturerSlug &&\n      !manufacturerBySlug.has(product.manufacturerSlug)\n  )\n  .map((product) => ({\n    product: product.slug,\n    manufacturerSlug: product.manufacturerSlug\n  }));\n\nconst changedFiles = [...plans.entries()]\n  .filter(([file, source]) => source !== read(file))\n  .map(([file]) => normalizeSlashes(path.relative(APP_ROOT, file)))\n  .sort();\n\nconst report = {\n  schemaVersion: 1,\n  generatedAt: new Date().toISOString(),\n  mode: writeMode ? \"write\" : \"check\",\n  summary: {\n    activeProducts: activeProducts.length,\n    manufacturers: manufacturers.length,\n    plannedChanges: changedFiles.length,\n    orphanProducts: orphanProducts.length,\n    orphanManufacturers: orphanManufacturers.length,\n    unresolvedCategoryHubs: unresolvedCategoryProducts.length,\n    missingManufacturerProfiles: missingManufacturerProfiles.length\n  },\n  changedFiles,\n  orphanProducts,\n  orphanManufacturers,\n  unresolvedCategoryHubs: unresolvedCategoryProducts.map((product) => ({\n    slug: product.slug,\n    categoryPath: product.categoryPath,\n    categoryKey: product.categoryKey\n  })),\n  missingManufacturerProfiles\n};\n\nfs.mkdirSync(REPORT_DIR, { recursive: true });\nfs.writeFileSync(\n  path.join(REPORT_DIR, \"content-discovery-latest.json\"),\n  JSON.stringify(report, null, 2) + \"\\n\",\n  \"utf8\"\n);\n\nconst markdownReport = [\n  \"# Content Discovery Linking\",\n  \"\",\n  `- Modus: ${report.mode}`,\n  `- Aktive Produkte: ${report.summary.activeProducts}`,\n  `- Hersteller: ${report.summary.manufacturers}`,\n  `- Geplante Änderungen: ${report.summary.plannedChanges}`,\n  `- Verwaiste Produkte nach Sollzustand: ${report.summary.orphanProducts}`,\n  `- Verwaiste Hersteller nach Sollzustand: ${report.summary.orphanManufacturers}`,\n  `- Nicht auflösbare Kategorie-Hubs: ${report.summary.unresolvedCategoryHubs}`,\n  `- Fehlende Herstellerprofile: ${report.summary.missingManufacturerProfiles}`,\n  \"\",\n  \"## Geänderte Dateien\",\n  \"\",\n  ...(changedFiles.length ? changedFiles.map((file) => `- \\`${file}\\``) : [\"Keine.\"]),\n  \"\",\n  \"## Verwaiste Produkte\",\n  \"\",\n  ...(orphanProducts.length\n    ? orphanProducts.map((item) => `- ${item.route} (${item.title})`)\n    : [\"Keine.\"]),\n  \"\",\n  \"## Verwaiste Hersteller\",\n  \"\",\n  ...(orphanManufacturers.length\n    ? orphanManufacturers.map((item) => `- ${item.route} (${item.title})`)\n    : [\"Keine.\"]),\n  \"\"\n].join(\"\\n\");\n\nfs.writeFileSync(\n  path.join(REPORT_DIR, \"content-discovery-latest.md\"),\n  markdownReport,\n  \"utf8\"\n);\n\nif (orphanProducts.length || orphanManufacturers.length) {\n  console.error(\n    `Content-Discovery fehlgeschlagen: ${orphanProducts.length} Produkt-Orphans, ${orphanManufacturers.length} Hersteller-Orphans im Sollzustand.`\n  );\n  process.exitCode = 1;\n} else if (checkMode && changedFiles.length) {\n  console.error(\n    `Content-Discovery ist nicht synchron: ${changedFiles.length} Datei(en) müssen aktualisiert werden.`\n  );\n  console.error(\"Ausführen: npm run seo:discovery:sync\");\n  process.exitCode = 1;\n} else if (writeMode) {\n  const backedUp = new Set();\n\n  for (const [file, source] of plans) {\n    if (source === read(file)) continue;\n\n    if (backupRoot && !backedUp.has(file)) {\n      const relative = path.relative(APP_ROOT, file);\n      const backupFile = path.join(backupRoot, relative);\n      fs.mkdirSync(path.dirname(backupFile), { recursive: true });\n      fs.copyFileSync(file, backupFile);\n      backedUp.add(file);\n    }\n\n    fs.writeFileSync(file, source, \"utf8\");\n  }\n\n  console.log(\n    `Content-Discovery synchronisiert: ${changedFiles.length} Datei(en), ` +\n    `${activeProducts.length} aktive Produkte, ${manufacturers.length} Hersteller.`\n  );\n  if (unresolvedCategoryProducts.length) {\n    console.warn(\n      `${unresolvedCategoryProducts.length} Produkt(e) nutzen vorübergehend den zentralen Fallback-Link.`\n    );\n  }\n  if (missingManufacturerProfiles.length) {\n    console.warn(\n      `${missingManufacturerProfiles.length} Produkt(e) referenzieren ein fehlendes Herstellerprofil.`\n    );\n  }\n} else {\n  console.log(\n    `Content-Discovery aktuell: ${activeProducts.length} aktive Produkte und ` +\n    `${manufacturers.length} Hersteller ohne Orphans.`\n  );\n}\n";
const TEST_SCRIPT = "import test from \"node:test\";\nimport assert from \"node:assert/strict\";\nimport fs from \"node:fs\";\nimport path from \"node:path\";\nimport { spawnSync } from \"node:child_process\";\n\nconst root = process.cwd();\nconst app = path.join(root, \"apps/pfotentechnik\");\n\ntest(\"Content-Discovery Sync ist nach dem Installer aktuell\", () => {\n  const result = spawnSync(\n    process.execPath,\n    [\"scripts/seo/sync-content-discovery-links.mjs\", \"--check\"],\n    { cwd: app, encoding: \"utf8\" }\n  );\n\n  assert.equal(\n    result.status,\n    0,\n    `${result.stdout || \"\"}\\n${result.stderr || \"\"}`\n  );\n});\n\ntest(\"Discovery-Report enthält keine Produkt- oder Hersteller-Orphans\", () => {\n  const report = JSON.parse(\n    fs.readFileSync(\n      path.join(app, \"reports/internal-linking/content-discovery-latest.json\"),\n      \"utf8\"\n    )\n  );\n\n  assert.equal(report.summary.orphanProducts, 0);\n  assert.equal(report.summary.orphanManufacturers, 0);\n});\n\ntest(\"Release-Preflight schützt den Discovery-Link-Vertrag\", () => {\n  const preflight = fs.readFileSync(\n    path.join(app, \"scripts/seo/release-preflight.mjs\"),\n    \"utf8\"\n  );\n  const pkg = JSON.parse(fs.readFileSync(path.join(app, \"package.json\"), \"utf8\"));\n\n  assert.equal(\n    pkg.scripts[\"seo:discovery:sync\"],\n    \"node scripts/seo/sync-content-discovery-links.mjs --write\"\n  );\n  assert.equal(\n    pkg.scripts[\"seo:discovery:check\"],\n    \"node scripts/seo/sync-content-discovery-links.mjs --check\"\n  );\n  assert.match(preflight, /Content-Discovery-Link-Vertrag/);\n  assert.match(preflight, /seo:discovery:check/);\n});\n\ntest(\"generierte Links besitzen kontrollierte Marker\", () => {\n  const script = fs.readFileSync(\n    path.join(app, \"scripts/seo/sync-content-discovery-links.mjs\"),\n    \"utf8\"\n  );\n\n  assert.match(script, /pt:content-discovery:category-products:start/);\n  assert.match(script, /pt:content-discovery:manufacturer-products:start/);\n  assert.match(script, /pt:content-discovery:manufacturer-directory:start/);\n});\n";
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const skipBuild = process.argv.includes("--skip-build");

const candidates = [
  process.cwd(),
  path.resolve(SCRIPT_DIR, ".."),
  path.resolve(SCRIPT_DIR, "../..")
];

const root = candidates.find((candidate) =>
  fs.existsSync(path.join(candidate, "apps/pfotentechnik")) &&
  fs.existsSync(path.join(candidate, "packages/affiliate-core"))
);

if (!root) throw new Error(`[${PATCH}] Repository-Root nicht gefunden.`);

const appRoot = path.join(root, "apps/pfotentechnik");
const backupRoot = path.join(
  root,
  ".patch-backups",
  `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

const files = {
  sync: "apps/pfotentechnik/scripts/seo/sync-content-discovery-links.mjs",
  test: "apps/pfotentechnik/test/content-discovery-linking-32.6.0.test.mjs",
  package: "apps/pfotentechnik/package.json",
  preflight: "apps/pfotentechnik/scripts/seo/release-preflight.mjs",
  centralHub: "apps/pfotentechnik/src/content/pages/smarte-haustiertechnik.md"
};

for (const required of [files.package, files.preflight, files.centralHub]) {
  if (!fs.existsSync(path.join(root, required))) {
    throw new Error(`[${PATCH}] Erwartete Datei fehlt: ${required}`);
  }
}

let changed = 0;
const backedUp = new Set();
const absolute = (relative) => path.join(root, relative);

function backup(relative) {
  if (backedUp.has(relative)) return;
  const source = absolute(relative);
  if (!fs.existsSync(source)) return;
  const target = path.join(backupRoot, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  backedUp.add(relative);
}

function writeIfChanged(relative, content) {
  const target = absolute(relative);
  const current = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : null;
  if (current === content) {
    console.log(`[${PATCH}] Unverändert: ${relative}`);
    return;
  }

  backup(relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, content, "utf8");
  fs.renameSync(temporary, target);
  changed += 1;
  console.log(`[${PATCH}] Geschrieben: ${relative}`);
}

writeIfChanged(files.sync, SYNC_SCRIPT);
writeIfChanged(files.test, TEST_SCRIPT);

const packageJson = JSON.parse(fs.readFileSync(absolute(files.package), "utf8"));
packageJson.scripts ??= {};
packageJson.scripts["seo:discovery:sync"] =
  "node scripts/seo/sync-content-discovery-links.mjs --write";
packageJson.scripts["seo:discovery:check"] =
  "node scripts/seo/sync-content-discovery-links.mjs --check";
packageJson.scripts["test:content-discovery"] =
  "node --test test/content-discovery-linking-32.6.0.test.mjs";
writeIfChanged(files.package, JSON.stringify(packageJson, null, 2) + "\n");

let preflight = fs.readFileSync(absolute(files.preflight), "utf8");
if (!preflight.includes('"Content-Discovery-Link-Vertrag"')) {
  const repositoryAudit =
    /^(\s*)npmScript\("Repository- und Umgebungsprüfung", "audit:repository:strict"\);$/m;
  const match = preflight.match(repositoryAudit);

  if (!match) {
    throw new Error(
      `[${PATCH}] Repository-Audit-Aufruf im Release-Preflight nicht gefunden.`
    );
  }

  const indent = match[1] || "";
  preflight = preflight.replace(
    repositoryAudit,
    `${indent}npmScript("Content-Discovery-Link-Vertrag", "seo:discovery:check");\n` +
    `${indent}npmScript("Repository- und Umgebungsprüfung", "audit:repository:strict");`
  );
}
writeIfChanged(files.preflight, preflight);

function run(command, args, env = {}) {
  console.log(`[${PATCH}] ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, ...env }
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      `[${PATCH}] Kommando fehlgeschlagen (${result.status}): ${command} ${args.join(" ")}`
    );
  }
}

// Die Content-Dateien werden vom Sync selbst ermittelt. Der Installer reicht
// sein Backup-Verzeichnis durch, damit jede tatsächliche Änderung gesichert wird.
run(
  process.execPath,
  ["apps/pfotentechnik/scripts/seo/sync-content-discovery-links.mjs", "--write"],
  { PT_DISCOVERY_BACKUP_ROOT: backupRoot }
);

run(process.execPath, [
  "--test",
  "apps/pfotentechnik/test/content-discovery-linking-32.6.0.test.mjs"
]);

run("npm", [
  "--workspace",
  "apps/pfotentechnik",
  "run",
  "audit:repository:strict"
]);

if (!skipBuild) {
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "build"]);
}

console.log(
  `[${PATCH}] Fertig. ${changed} direkt verwaltete Datei(en) geändert; ` +
  `Content-Hubs/Hersteller wurden vom Discovery-Sync bedarfsgerecht aktualisiert.` +
  `${skipBuild ? " Build übersprungen." : ""}`
);

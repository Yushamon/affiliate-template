#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const CONTENT_ROOT = path.join(APP_ROOT, "src", "content");
const PRODUCT_DIR = path.join(CONTENT_ROOT, "products");
const MANUFACTURER_DIR = path.join(CONTENT_ROOT, "manufacturers");
const PAGE_DIR = path.join(CONTENT_ROOT, "pages");
const COMPARISON_DIR = path.join(CONTENT_ROOT, "comparisons");
const REPORT_DIR = path.join(APP_ROOT, "reports", "internal-linking");

const args = new Set(process.argv.slice(2));
const writeMode = args.has("--write");
const checkMode = args.has("--check") || !writeMode;
const backupRoot = process.env.PT_DISCOVERY_BACKUP_ROOT || "";

const MARKERS = {
  categoryProducts: [
    "<!-- pt:content-discovery:category-products:start -->",
    "<!-- pt:content-discovery:category-products:end -->"
  ],
  manufacturerProducts: [
    "<!-- pt:content-discovery:manufacturer-products:start -->",
    "<!-- pt:content-discovery:manufacturer-products:end -->"
  ],
  manufacturerDirectory: [
    "<!-- pt:content-discovery:manufacturer-directory:start -->",
    "<!-- pt:content-discovery:manufacturer-directory:end -->"
  ],
  fallbackProducts: [
    "<!-- pt:content-discovery:fallback-products:start -->",
    "<!-- pt:content-discovery:fallback-products:end -->"
  ]
};

const normalizeSlashes = (value) => String(value || "").replaceAll("\\", "/");

const normalizeRoute = (value) => {
  const pathOnly = String(value || "").trim().split(/[?#]/, 1)[0];
  if (!pathOnly.startsWith("/")) return "";
  const compact = pathOnly.replace(/\/+/g, "/");
  return compact === "/" ? "/" : `${compact.replace(/\/+$/, "")}/`;
};

const listMarkdown = (dir) => {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return listMarkdown(full);
      return entry.isFile() && entry.name.endsWith(".md") ? [full] : [];
    });
};

const read = (file) => fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");

const unquote = (value) => {
  const trimmed = String(value || "").trim().replace(/,$/, "");
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
};

const frontmatterOf = (source) => {
  const normalized = source.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) return "";
  const end = normalized.indexOf("\n---", 4);
  return end >= 0 ? normalized.slice(4, end) : "";
};

const topScalar = (fm, key) => {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = fm.match(new RegExp(`^${escaped}:\\s*(.+)$`, "m"));
  if (!match) return "";
  const value = match[1].trim();
  if (value.startsWith("{") || value.startsWith("[")) return "";
  return unquote(value);
};

const sectionSource = (fm, section) => {
  const escaped = section.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const inline = fm.match(new RegExp(`^${escaped}:\\s*\\{([^\\n}]*)\\}\\s*$`, "m"));
  if (inline) return `{${inline[1]}}`;

  const block = fm.match(new RegExp(`^${escaped}:\\s*\\n((?:[ \\t]+[^\\n]*(?:\\n|$))*)`, "m"));
  return block?.[1] || "";
};

const sectionScalar = (fm, section, key) => {
  const source = sectionSource(fm, section);
  if (!source) return "";
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const inline = source.startsWith("{")
    ? source.match(new RegExp(`(?:^|[,\\s])${escaped}:\\s*("[^"]*"|'[^']*'|[^,}]+)`))
    : source.match(new RegExp(`^[ \\t]+${escaped}:\\s*(.+)$`, "m"));
  return inline ? unquote(inline[1]) : "";
};

const isNoindex = (fm) => {
  const direct = topScalar(fm, "noindex");
  const nested = sectionScalar(fm, "seo", "noindex");
  return [direct, nested].some((value) => /^true$/i.test(value));
};

const routeFromEntry = (kind, slug, fm) => {
  if (kind === "product") return normalizeRoute(`/produkt/${slug}/`);
  if (kind === "manufacturer") return normalizeRoute(`/hersteller/${slug}/`);
  if (kind === "comparison") return normalizeRoute(`/vergleiche/${slug}/`);
  if (kind === "page") {
    const canonical = sectionScalar(fm, "seo", "canonical");
    return normalizeRoute(canonical || `/${slug}/`);
  }
  return "";
};

const makeEntry = (file, kind) => {
  const source = read(file);
  const fm = frontmatterOf(source);
  const filenameSlug = path.basename(file, ".md");
  const slug = topScalar(fm, "slug") || filenameSlug;
  const title = topScalar(fm, "title") || slug;
  return {
    file,
    relative: normalizeSlashes(path.relative(APP_ROOT, file)),
    kind,
    source,
    fm,
    slug,
    title,
    route: routeFromEntry(kind, slug, fm),
    noindex: isNoindex(fm)
  };
};

const products = listMarkdown(PRODUCT_DIR).map((file) => {
  const entry = makeEntry(file, "product");
  const status = topScalar(entry.fm, "productStatus") || "active";
  return {
    ...entry,
    status,
    active: !["legacy", "discontinued"].includes(status) && !entry.noindex,
    manufacturerSlug: sectionScalar(entry.fm, "manufacturer", "slug"),
    manufacturerName: sectionScalar(entry.fm, "manufacturer", "name"),
    categoryPath: normalizeRoute(sectionScalar(entry.fm, "category", "path")),
    categoryKey: sectionScalar(entry.fm, "category", "key")
  };
});

const manufacturers = listMarkdown(MANUFACTURER_DIR)
  .map((file) => makeEntry(file, "manufacturer"))
  .filter((entry) => !entry.noindex);

const pages = listMarkdown(PAGE_DIR)
  .map((file) => makeEntry(file, "page"))
  .filter((entry) => !entry.noindex);

const comparisons = listMarkdown(COMPARISON_DIR)
  .map((file) => makeEntry(file, "comparison"))
  .filter((entry) => !entry.noindex);

const allEntries = [...products, ...manufacturers, ...pages, ...comparisons];

const pageByRoute = new Map(pages.map((entry) => [entry.route, entry]));
const pageBySlug = new Map(pages.map((entry) => [entry.slug, entry]));
const manufacturerBySlug = new Map(manufacturers.map((entry) => [entry.slug, entry]));

const centralHub =
  pageBySlug.get("smarte-haustiertechnik") ||
  pageByRoute.get("/smarte-haustiertechnik/");

if (!centralHub) {
  throw new Error(
    "Zentraler Hub smarte-haustiertechnik wurde nicht gefunden. Content-Discovery kann nicht sicher erzeugt werden."
  );
}

const markerRegex = ([start, end]) =>
  new RegExp(
    `${start.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${end.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\n*`,
    "g"
  );

const stripBlock = (source, markers) => source.replace(markerRegex(markers), "").trimEnd() + "\n";

const stripAllManagedBlocks = (source) => {
  let next = source;
  for (const markers of Object.values(MARKERS)) next = next.replace(markerRegex(markers), "");
  return next.trimEnd() + "\n";
};

const markdownLinks = (source) => {
  const routes = [];
  const patterns = [
    /\]\((\/[^)\s]+)\)/g,
    /\bhref\s*=\s*["'](\/[^"'#?]+(?:[?#][^"']*)?)["']/g
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      const route = normalizeRoute(match[1]);
      if (route) routes.push(route);
    }
  }
  return routes;
};

const relationBody = (heading, intro, links) => [
  heading,
  "",
  intro,
  "",
  ...links.map((link) => `- [${link.label}](${link.href})`)
].join("\n");

const managedBlock = (markers, body) =>
  body
    ? `${markers[0]}\n${body.trim()}\n${markers[1]}\n`
    : "";

const appendManagedBlock = (source, markers, body) => {
  const base = stripBlock(source, markers).trimEnd();
  const block = managedBlock(markers, body);
  return block ? `${base}\n\n${block}` : `${base}\n`;
};

const sourceWithoutManagedLinks = new Map(
  allEntries.map((entry) => [entry.file, stripAllManagedBlocks(entry.source)])
);

const plans = new Map();
const setPlan = (entry, nextSource) => {
  if (nextSource !== entry.source) plans.set(entry.file, nextSource);
};

const organicLinksFor = (entry) =>
  new Set(markdownLinks(sourceWithoutManagedLinks.get(entry.file) || entry.source));

const activeProducts = products.filter((product) => product.active);
const unresolvedCategoryProducts = [];

// 1) Kategorie-Hubs verlinken alle aktiven Produkte ihrer Kategorie,
//    soweit diese nicht bereits redaktionell im Hub verlinkt sind.
const productsByHubFile = new Map();

for (const product of activeProducts) {
  let hub = product.categoryPath ? pageByRoute.get(product.categoryPath) : null;

  if (!hub && product.categoryKey) {
    hub = pageBySlug.get(product.categoryKey) || pageByRoute.get(normalizeRoute(`/${product.categoryKey}/`));
  }

  if (!hub) {
    unresolvedCategoryProducts.push(product);
    continue;
  }

  const list = productsByHubFile.get(hub.file) || [];
  list.push(product);
  productsByHubFile.set(hub.file, list);
}

for (const [hubFile, hubProducts] of productsByHubFile) {
  const hub = pages.find((entry) => entry.file === hubFile);
  const organic = organicLinksFor(hub);
  const missing = hubProducts
    .filter((product) => !organic.has(product.route))
    .sort((a, b) => a.title.localeCompare(b.title, "de"));

  const body = missing.length
    ? relationBody(
        "## Weitere Produktseiten im Themenbereich",
        "Diese Modelle gehören ebenfalls zu diesem Themenbereich. In den redaktionellen Vergleichen erscheinen nur Produkte, die zur jeweiligen Suchintention und zu den gemeinsamen Kriterien passen.",
        missing.map((product) => ({ label: product.title, href: product.route }))
      )
    : "";

  setPlan(hub, appendManagedBlock(hub.source, MARKERS.categoryProducts, body));
}

// 2) Herstellerseiten verlinken die aktiven Produkte des Herstellers.
const productsByManufacturer = new Map();

for (const product of activeProducts) {
  if (!product.manufacturerSlug) continue;
  const list = productsByManufacturer.get(product.manufacturerSlug) || [];
  list.push(product);
  productsByManufacturer.set(product.manufacturerSlug, list);
}

for (const manufacturer of manufacturers) {
  const manufacturerProducts = productsByManufacturer.get(manufacturer.slug) || [];
  const organic = organicLinksFor(manufacturer);
  const missing = manufacturerProducts
    .filter((product) => !organic.has(product.route))
    .sort((a, b) => a.title.localeCompare(b.title, "de"));

  const body = missing.length
    ? relationBody(
        `## Weitere Produkte von ${manufacturer.title}`,
        "Diese Produktseiten ergänzen das Herstellerprofil und führen zu den jeweiligen redaktionellen Einordnungen.",
        missing.map((product) => ({ label: product.title, href: product.route }))
      )
    : "";

  setPlan(
    manufacturer,
    appendManagedBlock(manufacturer.source, MARKERS.manufacturerProducts, body)
  );
}

// 3) Zentraler Smart-Home-/Haustiertechnik-Hub erschließt Herstellerseiten.
//    Bereits redaktionell gesetzte Links werden nicht dupliziert.
{
  const organic = organicLinksFor(centralHub);
  const missing = manufacturers
    .filter((manufacturer) => !organic.has(manufacturer.route))
    .sort((a, b) => a.title.localeCompare(b.title, "de"));

  const body = missing.length
    ? relationBody(
        "## Herstellerseiten im Überblick",
        "Die Herstellerseiten bündeln Produktfamilien, dokumentierte Systemunterschiede und die jeweils gepflegten Produktseiten.",
        missing.map((manufacturer) => ({
          label: manufacturer.title,
          href: manufacturer.route
        }))
      )
    : "";

  const current = plans.get(centralHub.file) || centralHub.source;
  plans.set(
    centralHub.file,
    appendManagedBlock(current, MARKERS.manufacturerDirectory, body)
  );
}

// 4) Sicherheitsnetz: Produkte ohne auflösbaren Kategorie-Hub erhalten einen
//    sichtbaren Link vom zentralen Hub. Der Report markiert diese Fälle trotzdem.
{
  const organic = new Set(
    markdownLinks(
      stripBlock(
        stripBlock(
          plans.get(centralHub.file) || centralHub.source,
          MARKERS.fallbackProducts
        ),
        MARKERS.manufacturerDirectory
      )
    )
  );

  const missingFallback = unresolvedCategoryProducts
    .filter((product) => !organic.has(product.route))
    .sort((a, b) => a.title.localeCompare(b.title, "de"));

  const body = missingFallback.length
    ? relationBody(
        "## Weitere Produktseiten",
        "Für diese Produktseiten ist aktuell kein eindeutiger Kategorie-Hub auflösbar. Sie bleiben erreichbar, bis die Kategoriezuordnung korrigiert ist.",
        missingFallback.map((product) => ({ label: product.title, href: product.route }))
      )
    : "";

  const current = plans.get(centralHub.file) || centralHub.source;
  plans.set(
    centralHub.file,
    appendManagedBlock(current, MARKERS.fallbackProducts, body)
  );
}

const expectedSource = new Map(
  allEntries.map((entry) => [entry.file, plans.get(entry.file) || entry.source])
);

const routeForSourceFile = new Map(allEntries.map((entry) => [entry.file, entry.route]));
const incoming = new Map();

for (const [file, source] of expectedSource) {
  const sourceRoute = routeForSourceFile.get(file) || "";
  for (const target of markdownLinks(source)) {
    if (!target || target === sourceRoute) continue;
    const set = incoming.get(target) || new Set();
    set.add(sourceRoute || normalizeSlashes(path.relative(APP_ROOT, file)));
    incoming.set(target, set);
  }
}

const orphanProducts = activeProducts
  .filter((product) => !(incoming.get(product.route)?.size))
  .map((product) => ({ slug: product.slug, route: product.route, title: product.title }));

const orphanManufacturers = manufacturers
  .filter((manufacturer) => !(incoming.get(manufacturer.route)?.size))
  .map((manufacturer) => ({
    slug: manufacturer.slug,
    route: manufacturer.route,
    title: manufacturer.title
  }));

const missingManufacturerProfiles = activeProducts
  .filter(
    (product) =>
      product.manufacturerSlug &&
      !manufacturerBySlug.has(product.manufacturerSlug)
  )
  .map((product) => ({
    product: product.slug,
    manufacturerSlug: product.manufacturerSlug
  }));

const changedFiles = [...plans.entries()]
  .filter(([file, source]) => source !== read(file))
  .map(([file]) => normalizeSlashes(path.relative(APP_ROOT, file)))
  .sort();

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  mode: writeMode ? "write" : "check",
  summary: {
    activeProducts: activeProducts.length,
    manufacturers: manufacturers.length,
    plannedChanges: changedFiles.length,
    orphanProducts: orphanProducts.length,
    orphanManufacturers: orphanManufacturers.length,
    unresolvedCategoryHubs: unresolvedCategoryProducts.length,
    missingManufacturerProfiles: missingManufacturerProfiles.length
  },
  changedFiles,
  orphanProducts,
  orphanManufacturers,
  unresolvedCategoryHubs: unresolvedCategoryProducts.map((product) => ({
    slug: product.slug,
    categoryPath: product.categoryPath,
    categoryKey: product.categoryKey
  })),
  missingManufacturerProfiles
};

fs.mkdirSync(REPORT_DIR, { recursive: true });
fs.writeFileSync(
  path.join(REPORT_DIR, "content-discovery-latest.json"),
  JSON.stringify(report, null, 2) + "\n",
  "utf8"
);

const markdownReport = [
  "# Content Discovery Linking",
  "",
  `- Modus: ${report.mode}`,
  `- Aktive Produkte: ${report.summary.activeProducts}`,
  `- Hersteller: ${report.summary.manufacturers}`,
  `- Geplante Änderungen: ${report.summary.plannedChanges}`,
  `- Verwaiste Produkte nach Sollzustand: ${report.summary.orphanProducts}`,
  `- Verwaiste Hersteller nach Sollzustand: ${report.summary.orphanManufacturers}`,
  `- Nicht auflösbare Kategorie-Hubs: ${report.summary.unresolvedCategoryHubs}`,
  `- Fehlende Herstellerprofile: ${report.summary.missingManufacturerProfiles}`,
  "",
  "## Geänderte Dateien",
  "",
  ...(changedFiles.length ? changedFiles.map((file) => `- \`${file}\``) : ["Keine."]),
  "",
  "## Verwaiste Produkte",
  "",
  ...(orphanProducts.length
    ? orphanProducts.map((item) => `- ${item.route} (${item.title})`)
    : ["Keine."]),
  "",
  "## Verwaiste Hersteller",
  "",
  ...(orphanManufacturers.length
    ? orphanManufacturers.map((item) => `- ${item.route} (${item.title})`)
    : ["Keine."]),
  ""
].join("\n");

fs.writeFileSync(
  path.join(REPORT_DIR, "content-discovery-latest.md"),
  markdownReport,
  "utf8"
);

if (orphanProducts.length || orphanManufacturers.length) {
  console.error(
    `Content-Discovery fehlgeschlagen: ${orphanProducts.length} Produkt-Orphans, ${orphanManufacturers.length} Hersteller-Orphans im Sollzustand.`
  );
  process.exitCode = 1;
} else if (checkMode && changedFiles.length) {
  console.error(
    `Content-Discovery ist nicht synchron: ${changedFiles.length} Datei(en) müssen aktualisiert werden.`
  );
  console.error("Ausführen: npm run seo:discovery:sync");
  process.exitCode = 1;
} else if (writeMode) {
  const backedUp = new Set();

  for (const [file, source] of plans) {
    if (source === read(file)) continue;

    if (backupRoot && !backedUp.has(file)) {
      const relative = path.relative(APP_ROOT, file);
      const backupFile = path.join(backupRoot, relative);
      fs.mkdirSync(path.dirname(backupFile), { recursive: true });
      fs.copyFileSync(file, backupFile);
      backedUp.add(file);
    }

    fs.writeFileSync(file, source, "utf8");
  }

  console.log(
    `Content-Discovery synchronisiert: ${changedFiles.length} Datei(en), ` +
    `${activeProducts.length} aktive Produkte, ${manufacturers.length} Hersteller.`
  );
  if (unresolvedCategoryProducts.length) {
    console.warn(
      `${unresolvedCategoryProducts.length} Produkt(e) nutzen vorübergehend den zentralen Fallback-Link.`
    );
  }
  if (missingManufacturerProfiles.length) {
    console.warn(
      `${missingManufacturerProfiles.length} Produkt(e) referenzieren ein fehlendes Herstellerprofil.`
    );
  }
} else {
  console.log(
    `Content-Discovery aktuell: ${activeProducts.length} aktive Produkte und ` +
    `${manufacturers.length} Hersteller ohne Orphans.`
  );
}

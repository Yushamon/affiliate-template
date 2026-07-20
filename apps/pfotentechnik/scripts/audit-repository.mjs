import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const appRoot = process.cwd();
const srcRoot = path.join(appRoot, "src");
const reportDir = path.join(appRoot, "reports");
const strict = process.argv.includes("--strict");

const exists = (value) => fs.existsSync(value);
const walk = (dir, extensions = null) => {
  if (!exists(dir)) return [];
  const result = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...walk(full, extensions));
    else if (!extensions || extensions.some((ext) => entry.name.endsWith(ext))) result.push(full);
  }
  return result;
};

const relative = (file) => path.relative(appRoot, file).replaceAll(path.sep, "/");
const read = (file) => fs.readFileSync(file, "utf8");
const normalizeRoute = (value) => {
  if (!value || /^(https?:|mailto:|tel:|#|javascript:)/i.test(value)) return null;
  const clean = value.split(/[?#]/)[0];
  if (!clean.startsWith("/")) return null;
  const route = clean === "/" ? "/" : `/${clean.replace(/^\/+|\/+$/g, "")}/`;
  return route.replace(/\/+/g, "/");
};

const parseFrontmatter = (source) => {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const raw = match[1];
  const value = (key) => {
    const found = raw.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
    return found ? found[1].trim().replace(/^['"]|['"]$/g, "") : null;
  };
  return {
    slug: value("slug"),
    title: value("title"),
    description: value("description"),
    publishedAt: value("publishedAt"),
    updatedAt: value("updatedAt"),
    category: value("category"),
  };
};

const collections = {
  pages: { dir: path.join(srcRoot, "content", "pages"), route: (fm) => `/${fm.slug}/` },
  products: { dir: path.join(srcRoot, "content", "products"), route: (fm) => `/produkt/${fm.slug}/` },
  manufacturers: { dir: path.join(srcRoot, "content", "manufacturers"), route: (fm) => `/hersteller/${fm.slug}/` },
  comparisons: { dir: path.join(srcRoot, "content", "comparisons"), route: (fm) => `/vergleiche/${fm.slug}/` },
};

const findings = [];
const add = (severity, area, message, file = null, data = {}) =>
  findings.push({ severity, area, message, file, ...data });

const routeOwners = new Map();
const entries = [];

for (const [collection, config] of Object.entries(collections)) {
  for (const file of walk(config.dir, [".md", ".mdx"])) {
    const source = read(file);
    const fm = parseFrontmatter(source);
    if (!fm.slug) {
      add("error", "content", `Fehlender slug in ${collection}`, relative(file));
      continue;
    }
    const route = normalizeRoute(config.route(fm));
    if (routeOwners.has(route)) {
      add("error", "technical-seo", `Doppelte Route ${route}`, relative(file), {
        otherFile: routeOwners.get(route),
      });
    } else {
      routeOwners.set(route, relative(file));
    }
    if (!fm.title) add("error", "content", "Fehlender title", relative(file));
    if (!fm.description) add("warning", "technical-seo", "Fehlende description", relative(file));
    if (collection === "pages" && !fm.publishedAt) {
      add("warning", "structured-data", "Ratgeber ohne publishedAt", relative(file));
    }
    entries.push({ collection, file, route, fm, source });
  }
}

for (const file of walk(path.join(srcRoot, "pages"), [".astro", ".md", ".mdx"])) {
  const rel = relative(file);
  const routePath = rel
    .replace(/^src\/pages/, "")
    .replace(/\/index\.astro$/, "/")
    .replace(/\.astro$/, "/");
  if (!routePath.includes("[") && !routePath.includes("...")) {
    const route = normalizeRoute(routePath || "/");
    if (route && !routeOwners.has(route)) routeOwners.set(route, rel);
  }
}

const sourceFiles = walk(srcRoot, [".astro", ".ts", ".js", ".mjs", ".md", ".mdx"]);
const incoming = new Map([...routeOwners.keys()].map((route) => [route, 0]));
const hrefPatterns = [
  /\bhref\s*=\s*["']([^"']+)["']/g,
  /\]\((\/[^)\s]+)\)/g,
  /\b(?:canonical|productUrl)\s*:\s*["']([^"']+)["']/g,
];

for (const file of sourceFiles) {
  const source = read(file);
  for (const pattern of hrefPatterns) {
    for (const match of source.matchAll(pattern)) {
      const route = normalizeRoute(match[1]);
      if (!route) continue;
      if (incoming.has(route)) incoming.set(route, incoming.get(route) + 1);
      else if (!route.includes("[") && !/\.(svg|png|jpe?g|webp|avif|css|js|xml|txt|pdf)\/?$/i.test(route)) {
        add("warning", "internal-linking", `Möglicherweise gebrochener interner Link: ${route}`, relative(file));
      }
    }
  }

  if (file.endsWith(".astro")) {
    for (const tag of source.match(/<img\b[\s\S]*?>/gi) ?? []) {
      if (!/\balt\s*=/.test(tag)) add("error", "accessibility", "img ohne alt-Attribut", relative(file));
    }
  }

  const lineCount = source.split(/\r?\n/).length;
  if (lineCount > 1000) add("warning", "maintainability", `Sehr große Datei mit ${lineCount} Zeilen`, relative(file));
}

for (const entry of entries) {
  if (entry.route !== "/" && (incoming.get(entry.route) ?? 0) === 0) {
    add("warning", "internal-linking", `Verwaister Inhalt ohne erkannten internen Link: ${entry.route}`, relative(entry.file));
  }
}

const componentFiles = walk(path.join(srcRoot, "components"), [".astro", ".tsx", ".jsx"]);
const searchable = sourceFiles.map((file) => ({ file, source: read(file) }));
for (const component of componentFiles) {
  const base = path.basename(component).replace(/\.(astro|tsx|jsx)$/, "");
  const used = searchable.some(({ file, source }) => file !== component && new RegExp(`\\b${base}\\b`).test(source));
  if (!used) add("info", "unused-components", `Komponente ohne erkannten Import: ${base}`, relative(component));
}

for (const file of walk(path.join(srcRoot, "styles"), [".css"])) {
  const source = read(file);
  const counts = new Map();
  for (const match of source.matchAll(/(^|})\s*([^@}{][^{]+)\s*\{/gm)) {
    const selector = match[2].trim().replace(/\s+/g, " ");
    if (!selector || selector.length > 180) continue;
    counts.set(selector, (counts.get(selector) ?? 0) + 1);
  }
  for (const [selector, count] of counts) {
    if (count >= 3) add("info", "css", `Selektor ${count}× definiert: ${selector}`, relative(file));
  }
  if (source.split(/\r?\n/).length > 2500) add("warning", "css", "CSS-Datei sollte modularisiert werden", relative(file));
}

const countsByCollection = Object.fromEntries(
  Object.keys(collections).map((name) => [name, entries.filter((entry) => entry.collection === name).length])
);
const categoryCounts = {};
for (const entry of entries.filter((item) => item.collection === "pages")) {
  const key = entry.fm.category || "ohne Kategorie";
  categoryCounts[key] = (categoryCounts[key] ?? 0) + 1;
}

const severityOrder = { error: 0, warning: 1, info: 2 };
findings.sort((a, b) =>
  severityOrder[a.severity] - severityOrder[b.severity] ||
  a.area.localeCompare(b.area) ||
  (a.file ?? "").localeCompare(b.file ?? "")
);

const summary = {
  generatedAt: new Date().toISOString(),
  countsByCollection,
  categoryCounts,
  routes: routeOwners.size,
  findings: {
    error: findings.filter((item) => item.severity === "error").length,
    warning: findings.filter((item) => item.severity === "warning").length,
    info: findings.filter((item) => item.severity === "info").length,
  },
};

fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(path.join(reportDir, "repository-audit.json"), JSON.stringify({ summary, findings }, null, 2) + "\n");

const markdown = [
  "# Pfotentechnik Repository Audit",
  "",
  `Erstellt: ${summary.generatedAt}`,
  "",
  "## Zusammenfassung",
  "",
  `- Routen: ${summary.routes}`,
  `- Fehler: ${summary.findings.error}`,
  `- Warnungen: ${summary.findings.warning}`,
  `- Hinweise: ${summary.findings.info}`,
  "",
  "## Content-Bestand",
  "",
  ...Object.entries(countsByCollection).map(([key, value]) => `- ${key}: ${value}`),
  "",
  "## Befunde",
  "",
  ...findings.map((item) =>
    `- **${item.severity.toUpperCase()} · ${item.area}**: ${item.message}` +
    (item.file ? ` (\`${item.file}\`)` : "")
  ),
  "",
].join("\n");

fs.writeFileSync(path.join(reportDir, "repository-audit.md"), markdown);
console.log(markdown);

if (strict && findings.some((item) => item.severity === "error")) process.exitCode = 1;

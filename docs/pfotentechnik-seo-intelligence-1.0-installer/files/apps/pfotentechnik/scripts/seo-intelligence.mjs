import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const strict = process.argv.includes("--strict");
const cwd = process.cwd();
const roots = {
  pages: "src/content/pages",
  products: "src/content/products",
  comparisons: "src/content/comparisons",
  manufacturers: "src/content/manufacturers"
};
const ignored = new Set(["impressum", "datenschutz", "ueber-uns", "kontakt"]);
const commercial = ["vergleich", "test", "beste", "bester", "kaufen", "empfehlung", "preis", "alternative"];
const moneyPrefixes = ["/vergleich/", "/produkt/", "/hersteller/"];

const normalize = (value = "") => value
  .toLocaleLowerCase("de-DE")
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const stopwords = new Set(["der", "die", "das", "den", "dem", "des", "ein", "eine", "und", "oder", "fur", "mit", "ohne", "von", "zu", "im", "in", "am", "an", "auf", "ist", "sind", "wie", "was", "wann", "warum"]);
const tokens = (value) => normalize(value).split(/\s+/).filter((token) => token && !stopwords.has(token));
const similarity = (left, right) => {
  const a = new Set(tokens(left));
  const b = new Set(tokens(right));
  if (!a.size || !b.size) return 0;
  const intersection = [...a].filter((item) => b.has(item)).length;
  return intersection / new Set([...a, ...b]).size;
};

const walk = async (directory) => {
  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) files.push(...await walk(full));
      else if (/\.(md|mdx)$/i.test(entry.name)) files.push(full);
    }
    return files;
  } catch {
    return [];
  }
};

const split = (source) => {
  if (!source.startsWith("---")) return { frontmatter: "", body: source };
  const end = source.indexOf("\n---", 3);
  if (end === -1) return { frontmatter: "", body: source };
  return { frontmatter: source.slice(4, end), body: source.slice(end + 4) };
};

const scalar = (frontmatter, key) => {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
  return match?.[1]?.trim().replace(/^["']|["']$/g, "");
};

const nested = (frontmatter, parent, key) => {
  const lines = frontmatter.split(/\r?\n/);
  const start = lines.findIndex((line) => new RegExp(`^${parent}:\\s*$`).test(line));
  if (start === -1) return undefined;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^[A-Za-z][\w-]*:\s*/.test(lines[index])) break;
    const match = lines[index].match(new RegExp(`^\\s+${key}:\\s*(.+)$`));
    if (match) return match[1].trim().replace(/^["']|["']$/g, "");
  }
};

const array = (frontmatter, key) => {
  const lines = frontmatter.split(/\r?\n/);
  const start = lines.findIndex((line) => new RegExp(`^${key}:\\s*$`).test(line));
  if (start === -1) return [];
  const values = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^[A-Za-z][\w-]*:\s*/.test(lines[index])) break;
    const match = lines[index].match(/^\s*-\s*(.+)$/);
    if (match) values.push(match[1].trim().replace(/^["']|["']$/g, ""));
  }
  return values;
};

const explicitLinks = (body) => {
  const links = [];
  const patterns = [/\[[^\]]+\]\((\/[^)#\s]+)(?:#[^)]+)?\)/g, /href=["'](\/[^"'#\s]+)(?:#[^"']*)?["']/g];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(body))) links.push(match[1].replace(/\/+$/, "") || "/");
  }
  return [...new Set(links)];
};

const routeFor = (kind, slug) => kind === "products"
  ? `/produkt/${slug}`
  : kind === "comparisons"
    ? `/vergleich/${slug}`
    : kind === "manufacturers"
      ? `/hersteller/${slug}`
      : `/${slug}`;

const load = async () => {
  const items = [];
  for (const [kind, relative] of Object.entries(roots)) {
    for (const file of await walk(path.resolve(cwd, relative))) {
      const source = await fs.readFile(file, "utf8");
      const { frontmatter, body } = split(source);
      const slug = scalar(frontmatter, "slug") ?? path.basename(file).replace(/\.(md|mdx)$/i, "");
      const title = scalar(frontmatter, "title") ?? slug;
      const description = scalar(frontmatter, "description") ?? "";
      const category = nested(frontmatter, "contentPlatform", "cluster") ?? scalar(frontmatter, "category") ?? nested(frontmatter, "category", "key") ?? "unclassified";
      const intent = nested(frontmatter, "contentPlatform", "intent") ?? `${title} ${description}`;
      const structured = [
        ...array(frontmatter, "comparisonProducts").map((value) => `/produkt/${value}`),
        ...array(frontmatter, "alternatives").map((value) => `/produkt/${value}`),
        ...array(frontmatter, "comparisons").map((value) => `/vergleich/${value}`)
      ];
      items.push({ kind, file, slug, title, description, category, intent, route: routeFor(kind, slug), links: explicitLinks(body), structured });
    }
  }
  return items;
};

const main = async () => {
  const items = await load();
  const byRoute = new Map(items.map((item) => [item.route, item]));
  const inbound = new Map(items.map((item) => [item.route, 0]));
  const issues = [];
  const add = (severity, rule, item, message, related = []) => issues.push({ severity, rule, route: item.route, file: path.relative(cwd, item.file), message, related });

  for (const item of items) {
    const targets = [...new Set([...item.links, ...item.structured])].filter((target) => target !== item.route);
    for (const target of targets) if (byRoute.has(target)) inbound.set(target, (inbound.get(target) ?? 0) + 1);

    if (item.kind === "pages" && item.links.length < 2) {
      add("warning", "weak-internal-linking", item, `Nur ${item.links.length} explizite interne Links gefunden.`);
    }

    const haystack = normalize(`${item.title} ${item.description} ${item.intent}`);
    const hasCommercialIntent = commercial.some((signal) => haystack.includes(normalize(signal)));
    const hasMoneyPath = targets.some((target) => moneyPrefixes.some((prefix) => target.startsWith(prefix)));
    if (hasCommercialIntent && !hasMoneyPath) {
      add("warning", "missing-money-path", item, "Kommerzielle Suchintention ohne direkten Link zu Vergleich, Produkt oder Hersteller.");
    }
  }

  for (const item of items) {
    if (!ignored.has(item.slug) && (inbound.get(item.route) ?? 0) === 0) {
      add("error", "orphan-page", item, "Keine eingehende interne Verlinkung im analysierten Content gefunden.");
    }
  }

  for (let left = 0; left < items.length; left += 1) {
    for (let right = left + 1; right < items.length; right += 1) {
      const a = items[left];
      const b = items[right];
      if (a.category !== b.category) continue;
      const titleScore = similarity(a.title, b.title);
      const intentScore = similarity(a.intent, b.intent);
      if (titleScore >= 0.84) add("warning", "similar-title", a, `Sehr ähnliche Titel (${titleScore.toFixed(2)}).`, [b.route]);
      if (intentScore >= 0.72) add("warning", "possible-cannibalization", a, `Mögliche Überschneidung der Suchintention (${intentScore.toFixed(2)}).`, [b.route]);
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      items: items.length,
      errors: issues.filter((issue) => issue.severity === "error").length,
      warnings: issues.filter((issue) => issue.severity === "warning").length
    },
    inboundLinks: Object.fromEntries(inbound),
    issues
  };

  const reportPath = path.resolve(cwd, "reports/seo-intelligence.json");
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");

  for (const issue of issues) {
    const related = issue.related.length ? ` -> ${issue.related.join(", ")}` : "";
    console.log(`${issue.severity.toUpperCase()} ${issue.rule} ${issue.route} - ${issue.message}${related}`);
  }
  console.log(`\nSEO Intelligence: ${report.summary.items} Inhalte, ${report.summary.errors} Fehler, ${report.summary.warnings} Warnungen.`);
  console.log(`Report: ${path.relative(cwd, reportPath)}`);

  if (report.summary.errors > 0 || (strict && report.summary.warnings > 0)) process.exitCode = 1;
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

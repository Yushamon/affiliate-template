#!/usr/bin/env node
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import yaml from "js-yaml";

const root = process.cwd();
const app = path.join(root, "apps", "pfotentechnik");
const pages = path.join(app, "src", "content", "pages");
const comparisons = path.join(app, "src", "content", "comparisons");
const redirectsFile = path.join(app, "public", "_redirects");

const mergeMappings = [
  {
    "oldSlug": "futterautomat-mit-kamera",
    "targetSlug": "beste-futterautomaten-mit-kamera"
  },
  {
    "oldSlug": "futterautomat-ohne-wlan",
    "targetSlug": "beste-futterautomaten-ohne-wlan"
  },
  {
    "oldSlug": "futterautomat-nassfutter",
    "targetSlug": "beste-futterautomaten-fuer-nassfutter"
  },
  {
    "oldSlug": "futterautomat-fuer-zwei-katzen",
    "targetSlug": "beste-futterautomaten-fuer-zwei-katzen"
  }
];
const migratedSlugs = [
  "beste-futterautomaten-mit-akku",
  "beste-futterautomaten-unter-100-euro",
  "beste-futterautomaten-mit-edelstahl-napf",
  "futterautomat-gegen-schlingen",
  "beste-futterautomaten-fuer-mehrtierhaushalte",
  "beste-futterautomaten-fuer-kleine-hunde",
  "beste-futterautomaten-fuer-berufstaetige",
  "beste-futterautomaten-fuer-seniorenkatzen",
  "beste-futterautomaten-fuer-welpen",
  "futterautomat-fuer-grosse-hunde",
  "futterautomat-mit-app"
];
const requiredPatterns = [
  /kurzantwort|kurze antwort|schnellentscheidung/i,
  /empfehlung|testsieger|gesamtsieger/i,
  /fur wen geeignet|wann lohnt|eignet sich|nutzungsszenario/i,
  /methodik|testmethodik|so bewerten|bewertung/i,
  /quellen|belege/i,
  /weiterfuhrende links|interne links|weitere passende|weiterfuhrende ratgeber/i
];

const exists = async (file) => {
  try { await access(file); return true; } catch { return false; }
};

const parse = async (file) => {
  const source = await readFile(file, "utf8");
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) throw new Error(`Ungültiges Frontmatter: ${file}`);
  return { data: yaml.load(match[1]) || {}, body: match[2] };
};

const errors = [];
const redirectText = await readFile(redirectsFile, "utf8");
const comparisonFiles = (await readdir(comparisons))
  .filter((name) => /\.mdx?$/.test(name));
const slugSet = new Set();

for (const name of comparisonFiles) {
  const file = path.join(comparisons, name);
  const { data, body } = await parse(file);
  const slug = data.slug;
  if (!slug) {
    errors.push(`${name}: slug fehlt`);
    continue;
  }
  if (slugSet.has(slug)) errors.push(`Doppelter Vergleichsslug: ${slug}`);
  slugSet.add(slug);

  const canonical = `/vergleiche/${slug}/`;
  if (data.seo?.canonical !== canonical) {
    errors.push(`${slug}: Canonical ist ${data.seo?.canonical || "nicht gesetzt"}`);
  }
  if (data.seo?.noindex === true || data.seo?.sitemap === false) {
    errors.push(`${slug}: Vergleich ist von Index oder Sitemap ausgeschlossen`);
  }
  if (!Array.isArray(data.items) || data.items.length < 2) {
    errors.push(`${slug}: weniger als zwei Vergleichsitems`);
  }
  if (!Array.isArray(data.faq) || data.faq.length < 6) {
    errors.push(`${slug}: weniger als sechs FAQ`);
  }
  const headings = [...body.matchAll(/^##\s+(.+)$/gm)].map((match) =>
    match[1].toLocaleLowerCase("de").normalize("NFD").replace(/\p{Diacritic}/gu, "")
  );
  for (const pattern of requiredPatterns) {
    if (!headings.some((heading) => pattern.test(heading))) {
      errors.push(`${slug}: Pflichtabschnitt fehlt (${pattern})`);
    }
  }

  const old = `/${slug}/`;
  const redirectLine = `${old} ${canonical} 301`;
  const noSlashLine = `${old.replace(/\/$/, "")} ${canonical} 301`;
  if (!redirectText.includes(redirectLine) || !redirectText.includes(noSlashLine)) {
    errors.push(`${slug}: Root-Alias-Redirect fehlt`);
  }
}

for (const mapping of mergeMappings) {
  const legacy = path.join(pages, `${mapping.oldSlug}.md`);
  if (await exists(legacy)) errors.push(`Legacy-Seite existiert noch: ${mapping.oldSlug}`);
  const target = path.join(comparisons, `${mapping.targetSlug}.md`);
  if (!(await exists(target))) errors.push(`Zielvergleich fehlt: ${mapping.targetSlug}`);
}

for (const slug of migratedSlugs) {
  if (await exists(path.join(pages, `${slug}.md`))) {
    errors.push(`Migrierte Seite existiert noch: ${slug}`);
  }
  if (!(await exists(path.join(comparisons, `${slug}.md`)))) {
    errors.push(`Migrierter Vergleich fehlt: ${slug}`);
  }
}

const scanRoots = [
  path.join(app, "src"),
  path.join(root, "packages", "affiliate-core", "src")
];
const extensions = new Set([".md", ".mdx", ".astro", ".ts", ".tsx", ".js", ".mjs", ".json"]);

const walk = async (dir) => {
  const result = [];
  if (!(await exists(dir))) return result;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if ([
      "node_modules",
      "dist",
      ".patch-backups",
      "reports",
      "generated"
    ].includes(entry.name)) continue;
    if (
      entry.isDirectory() &&
      entry.name === "seo" &&
      full.includes(path.join("src", "data", "seo"))
    ) continue;
    if (entry.isDirectory()) result.push(...await walk(full));
    else if (extensions.has(path.extname(entry.name))) result.push(full);
  }
  return result;
};

const forbidden = [
  ...mergeMappings.map((item) => `/${item.oldSlug}/`),
  ...migratedSlugs.map((slug) => `/${slug}/`),
  "/vergleiche/beste-futterautomaten/"
];

const containsLegacyUrl = (source, oldUrl) => {
  const candidates = [oldUrl, oldUrl.replace(/\/$/, "")];
  for (const candidate of candidates) {
    let index = source.indexOf(candidate);
    while (index >= 0) {
      const prefix = source.slice(Math.max(0, index - 10), index);
      const isCanonicalTarget =
        !candidate.startsWith("/vergleiche/") &&
        prefix.endsWith("/vergleiche");
      const nextCharacter = source[index + candidate.length] || "";
      const hasBoundary =
        candidate.endsWith("/") ||
        !/[a-z0-9-]/i.test(nextCharacter);

      if (!isCanonicalTarget && hasBoundary) return true;
      index = source.indexOf(candidate, index + 1);
    }
  }
  return false;
};

for (const rootDir of scanRoots) {
  for (const file of await walk(rootDir)) {
    const source = await readFile(file, "utf8");
    for (const oldUrl of forbidden) {
      if (containsLegacyUrl(source, oldUrl)) {
        errors.push(
          "Alter interner Link " + oldUrl + " in " + path.relative(root, file)
        );
      }
    }
  }
}

if (errors.length) {
  console.error("\nVergleichs-Refactor-Audit fehlgeschlagen:\n");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Vergleichs-Refactor-Audit erfolgreich: ${comparisonFiles.length} kanonische Vergleichsseiten.`);

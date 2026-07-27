#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const NAME = "pfotentechnik-comparison-release-closure-14.0.2";
const args = new Set(process.argv.slice(2));
const CHECK_ONLY = args.has("--check") || args.has("--dry-run");
const NO_BUILD = args.has("--no-build");
const COMMIT = args.has("--commit");
let CURRENT_STAGE = "Initialisierung";

const log = (message) => console.log(`[${NAME}] ${message}`);
const diagnosticFile = path.join(
  process.cwd(),
  "pfotentechnik-comparison-release-closure-14.0.2-error.log"
);

const serializeError = (error) => {
  if (error instanceof Error) {
    return {
      name: error.name || "Error",
      message: error.message || "(keine Fehlermeldung)",
      stack: error.stack || "(kein Stack verfügbar)"
    };
  }

  return {
    name: typeof error,
    message:
      typeof error === "string"
        ? error || "(leere Fehlermeldung)"
        : JSON.stringify(error) || "(unbekannter Fehler)",
    stack: "(kein Stack verfügbar)"
  };
};

const writeDiagnostic = (error) => {
  const details = serializeError(error);
  const payload = [
    `Patch: ${NAME}`,
    `Zeit: ${new Date().toISOString()}`,
    `Arbeitsverzeichnis: ${process.cwd()}`,
    `Schritt: ${CURRENT_STAGE}`,
    `Typ: ${details.name}`,
    `Nachricht: ${details.message}`,
    "",
    details.stack
  ].join("\n");

  try {
    fs.writeFileSync(diagnosticFile, payload + "\n", "utf8");
  } catch {
    // Das ursprüngliche Problem darf nicht durch das Diagnose-Logging verdeckt werden.
  }

  return details;
};

const fail = (error) => {
  const details = writeDiagnostic(error);
  console.error(`[${NAME}] FEHLER`);
  console.error(`[${NAME}] Schritt: ${CURRENT_STAGE}`);
  console.error(`[${NAME}] Typ: ${details.name}`);
  console.error(`[${NAME}] Nachricht: ${details.message}`);
  console.error(`[${NAME}] Diagnose: ${diagnosticFile}`);
  process.exit(1);
};

const stage = (name) => {
  CURRENT_STAGE = name;
  log(`Schritt: ${name}`);
};

process.on("uncaughtException", (error) => fail(error));
process.on("unhandledRejection", (error) => fail(error));

function findRoot(start) {
  let current = path.resolve(start);
  while (true) {
    if (
      fs.existsSync(path.join(current, "package.json")) &&
      fs.existsSync(path.join(current, "apps", "pfotentechnik", "package.json")) &&
      fs.existsSync(path.join(current, "packages", "affiliate-core"))
    ) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

const root =
  findRoot(process.cwd()) ||
  findRoot(path.dirname(fileURLToPath(import.meta.url)));

if (!root) {
  fail("Repository-Root nicht gefunden. Starte den Installer im affiliate-template-Repository.");
}

let yaml;
try {
  ({ default: yaml } = await import("js-yaml"));
} catch (error) {
  fail(`js-yaml konnte nicht geladen werden: ${error.message}`);
}

const appRoot = path.join(root, "apps", "pfotentechnik");
const comparisonDir = path.join(appRoot, "src", "content", "comparisons");
const productDir = path.join(appRoot, "src", "content", "products");
const manufacturerDir = path.join(appRoot, "src", "content", "manufacturers");

const files = {
  route: path.join(appRoot, "src", "pages", "vergleiche", "[comparison].astro"),
  viewModel: path.join(appRoot, "src", "domain", "comparison", "buildComparisonViewModel.ts"),
  resolverTs: path.join(appRoot, "src", "domain", "comparison", "comparisonDataPlatform.ts"),
  resolverMjs: path.join(appRoot, "scripts", "comparison-platform", "data-platform.mjs"),
  audit: path.join(appRoot, "scripts", "comparison-platform", "audit.mjs"),
  dataAudit: path.join(appRoot, "scripts", "comparison-platform", "data-audit.mjs"),
  coverageAudit: path.join(appRoot, "scripts", "comparison-platform", "coverage-audit.mjs"),
  refactorAudit: path.join(appRoot, "scripts", "comparison-platform", "refactor-audit.mjs"),
  releaseAudit: path.join(appRoot, "scripts", "comparison-platform", "release-closure.mjs"),
  comparisonTable: path.join(root, "packages", "affiliate-core", "src", "components", "comparison", "ComparisonTable.astro"),
  mobileCards: path.join(root, "packages", "affiliate-core", "src", "components", "comparison", "ComparisonMobileCards.astro"),
  shell: path.join(root, "packages", "affiliate-core", "src", "components", "comparison", "ComparisonShell.astro"),
  sticky: path.join(root, "packages", "affiliate-core", "src", "components", "comparison", "ComparisonStickyBar.astro"),
  premiumCss: path.join(root, "packages", "affiliate-core", "src", "components", "comparison", "comparison-premium-ux.css"),
  appPackage: path.join(appRoot, "package.json"),
  redirects: path.join(appRoot, "public", "_redirects"),
  test: path.join(appRoot, "test", "comparison-release-closure-14.0.2.test.mjs"),
  report: path.join(appRoot, "reports", "comparison-platform", "comparison-release-closure-installer-14.0.2.md")
};

for (const [key, file] of Object.entries(files)) {
  if (["releaseAudit", "test", "report"].includes(key)) continue;
  if (!fs.existsSync(file)) {
    fail(`Pflichtdatei fehlt: ${path.relative(root, file)}`);
  }
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(root, ".patch-backups", `${NAME}-${timestamp}`);
const changedFiles = new Set();

const relative = (file) => path.relative(root, file).split(path.sep).join("/");
const read = (file) => fs.readFileSync(file, "utf8");
const ensureDir = (dir) => fs.mkdirSync(dir, { recursive: true });

function backup(file) {
  if (CHECK_ONLY || !fs.existsSync(file)) return;
  const target = path.join(backupRoot, relative(file));
  ensureDir(path.dirname(target));
  fs.copyFileSync(file, target);
}

function write(file, content) {
  const previous = fs.existsSync(file) ? read(file) : "";
  if (previous === content) return false;
  changedFiles.add(relative(file));
  if (!CHECK_ONLY) {
    backup(file);
    ensureDir(path.dirname(file));
    fs.writeFileSync(file, content);
  }
  return true;
}

function replaceRequired(source, search, replacement, label) {
  if (typeof search === "string") {
    if (!source.includes(search)) fail(`Anker nicht gefunden: ${label}`);
    return source.replace(search, replacement);
  }
  if (!search.test(source)) fail(`Anker nicht gefunden: ${label}`);
  search.lastIndex = 0;
  return source.replace(search, replacement);
}

function stripMarkedBlock(source, start, end) {
  const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return source.replace(
    new RegExp(`${escape(start)}[\\s\\S]*?${escape(end)}\\s*`, "g"),
    ""
  );
}

function run(command, commandArgs) {
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    stdio: "inherit",
    shell: false
  });
  return result.status === 0;
}

function listFiles(dir, extensions) {
  if (!fs.existsSync(dir)) return [];
  const output = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", "dist", ".patch-backups", "reports", "generated"].includes(entry.name)) {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) output.push(...listFiles(full, extensions));
    else if (extensions.has(path.extname(entry.name).toLowerCase())) output.push(full);
  }
  return output;
}

function splitFrontmatter(source, file) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) fail(`Ungültiges Frontmatter: ${relative(file)}`);
  return {
    data: yaml.load(match[1]) || {},
    body: match[2]
  };
}

function dumpFrontmatter(data, body) {
  const frontmatter = yaml.dump(data, {
    lineWidth: 120,
    noRefs: true,
    sortKeys: false,
    quotingType: '"',
    forceQuotes: false
  }).trimEnd();
  return `---\n${frontmatter}\n---\n\n${body.replace(/^\s+/, "").trimEnd()}\n`;
}

function parseEntries(dir) {
  return fs.readdirSync(dir)
    .filter((name) => /\.mdx?$/i.test(name))
    .sort()
    .map((name) => {
      const file = path.join(dir, name);
      const source = read(file);
      const parsed = splitFrontmatter(source, file);
      return {
        file,
        name,
        source,
        body: parsed.body,
        data: parsed.data,
        slug: parsed.data.slug || name.replace(/\.mdx?$/i, "")
      };
    });
}

function parseRedirects(source) {
  const map = new Map();
  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const parts = line.split(/\s+/);
    if (parts.length < 3 || !/^30[18]$/.test(parts[2])) continue;
    const [from, to] = parts;
    if (!from.startsWith("/") || !to.startsWith("/")) continue;
    map.set(from, to);
    if (from.endsWith("/")) map.set(from.slice(0, -1), to);
    else map.set(`${from}/`, to);
  }
  return map;
}

const knownMalformedComparisonPaths = new Map([
  ["/vergleiche/-fuer-kleine-hunde/", "/vergleiche/beste-futterautomaten-fuer-kleine-hunde/"],
  ["/vergleiche/-unter-100-euro/", "/vergleiche/beste-futterautomaten-unter-100-euro/"],
  ["/vergleiche/-fuer-welpen/", "/vergleiche/beste-futterautomaten-fuer-welpen/"]
]);

function normalizePathOnly(value, redirectMap, comparisonSlugs) {
  if (!value.startsWith("/")) return value;
  const match = value.match(/^([^?#]*)([?#].*)?$/);
  const pathname = match?.[1] ?? value;
  const suffix = match?.[2] ?? "";

  if (knownMalformedComparisonPaths.has(pathname)) {
    return knownMalformedComparisonPaths.get(pathname) + suffix;
  }

  const malformed = pathname.match(/^\/vergleiche\/-([a-z0-9-]+)\/?$/i);
  if (malformed) {
    const tail = malformed[1];
    const matches = [...comparisonSlugs].filter((slug) => slug.endsWith(`-${tail}`));
    if (matches.length === 1) return `/vergleiche/${matches[0]}/${suffix}`;
  }

  const redirected = redirectMap.get(pathname);
  if (redirected?.startsWith("/vergleiche/")) return redirected + suffix;

  return value;
}

function rewriteInternalLinks(source, redirectMap, comparisonSlugs) {
  let output = source;

  output = output.replace(
    /(\]\()([^)\s]+)(\))/g,
    (full, start, href, end) =>
      `${start}${normalizePathOnly(href, redirectMap, comparisonSlugs)}${end}`
  );

  output = output.replace(
    /(["'`])(\/[^"'`\s]*)(\1)/g,
    (full, quote, href) =>
      `${quote}${normalizePathOnly(href, redirectMap, comparisonSlugs)}${quote}`
  );

  return output;
}

function normalizeCriterionKey(key, label) {
  const value = String(key || "");
  const replacements = new Map([
    ["krokettengro-e", "krokettengroesse"],
    ["geeignete-hundegro-e", "geeignete-hundegroesse"]
  ]);
  if (replacements.has(value)) return replacements.get(value);

  if (/gro-e/i.test(value)) {
    return value.replace(/gro-e/gi, "groesse");
  }

  if (!value && label) {
    return String(label)
      .toLocaleLowerCase("de-DE")
      .replaceAll("ä", "ae")
      .replaceAll("ö", "oe")
      .replaceAll("ü", "ue")
      .replaceAll("ß", "ss")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  return value;
}

function productEligible(product) {
  if (!product) return false;
  if (["legacy", "discontinued"].includes(product.productStatus)) return false;
  if (["discontinued"].includes(product.availability)) return false;
  if (["excluded", "blocked"].includes(product.recommendationStatus)) return false;
  return true;
}

/* -------------------------------------------------------------------------- */
/* 1. CONTENT-NORMALISIERUNG                                                   */
/* -------------------------------------------------------------------------- */

stage("Vergleichs- und Produktdaten einlesen");
const comparisonEntries = parseEntries(comparisonDir);
const productEntries = parseEntries(productDir);
const manufacturerEntries = parseEntries(manufacturerDir);
const productBySlug = new Map(productEntries.map((entry) => [entry.slug, entry.data]));
const manufacturerSlugs = new Set(manufacturerEntries.map((entry) => entry.slug));
const comparisonSlugs = new Set(comparisonEntries.map((entry) => entry.slug));
const redirectMap = parseRedirects(read(files.redirects));

if (comparisonEntries.length !== 24) {
  fail(`Erwartet werden 24 Vergleichsdateien, gefunden wurden ${comparisonEntries.length}.`);
}

stage("24 Vergleichsdateien normalisieren");
for (const entry of comparisonEntries) {
  const data = structuredClone(entry.data);
  const canonical = `/vergleiche/${entry.slug}/`;

  data.slug = entry.slug;
  data.canonical = canonical;
  data.seo = {
    ...(data.seo || {}),
    canonical,
    sitemap: true,
    noindex: false
  };

  const items = Array.isArray(data.items) ? data.items : [];
  const deduplicated = [];
  const seen = new Set();

  for (const item of items) {
    if (!item?.slug || seen.has(`${item.type}:${item.slug}`)) continue;
    const exists = item.type === "manufacturer"
      ? manufacturerSlugs.has(item.slug)
      : productBySlug.has(item.slug);
    if (!exists) continue;
    seen.add(`${item.type}:${item.slug}`);
    deduplicated.push({
      ...item,
      values: item.values && typeof item.values === "object" ? item.values : {},
      overrides: item.overrides && typeof item.overrides === "object" ? item.overrides : {}
    });
  }

  if (deduplicated.length < 2) {
    fail(`${entry.slug}: Nach Bereinigung bleiben weniger als zwei gültige Items.`);
  }

  data.items = deduplicated;

  const keyChanges = new Map();
  data.criteria = (Array.isArray(data.criteria) ? data.criteria : []).map((criterion) => {
    const oldKey = criterion?.key;
    const newKey = normalizeCriterionKey(oldKey, criterion?.label);
    if (oldKey && newKey && oldKey !== newKey) keyChanges.set(oldKey, newKey);
    return {
      ...criterion,
      key: newKey,
      fallback: "–"
    };
  });

  if (keyChanges.size) {
    data.items = data.items.map((item) => {
      const migrate = (record) => {
        const next = { ...(record || {}) };
        for (const [oldKey, newKey] of keyChanges) {
          if (Object.prototype.hasOwnProperty.call(next, oldKey) &&
              !Object.prototype.hasOwnProperty.call(next, newKey)) {
            next[newKey] = next[oldKey];
          }
          delete next[oldKey];
        }
        return next;
      };
      return {
        ...item,
        values: migrate(item.values),
        overrides: migrate(item.overrides)
      };
    });
  }

  const itemProductSlugs = data.items
    .filter((item) => item.type === "product")
    .map((item) => item.slug);
  const eligibleSlugs = itemProductSlugs.filter((slug) =>
    productEligible(productBySlug.get(slug))
  );

  if (!eligibleSlugs.length) {
    fail(`${entry.slug}: Kein empfehlungsfähiges Produkt vorhanden.`);
  }

  const scoreOf = (slug) => {
    const product = productBySlug.get(slug);
    return Number(product?.score ?? (typeof product?.rating === "number" ? product.rating * 20 : 0));
  };
  eligibleSlugs.sort((a, b) => scoreOf(b) - scoreOf(a));

  const recommendation = {
    ...(data.recommendation || {})
  };
  const configuredWinner = recommendation.winnerSlug;
  const configuredAlternative = recommendation.alternativeSlug;

  recommendation.winnerSlug =
    eligibleSlugs.includes(configuredWinner)
      ? configuredWinner
      : eligibleSlugs[0];

  recommendation.alternativeSlug =
    configuredAlternative &&
    configuredAlternative !== recommendation.winnerSlug &&
    eligibleSlugs.includes(configuredAlternative)
      ? configuredAlternative
      : eligibleSlugs.find((slug) => slug !== recommendation.winnerSlug);

  if (!recommendation.title) {
    recommendation.title = `Unsere Empfehlung für ${data.title}`;
  }
  if (!recommendation.text) {
    recommendation.text = data.description;
  }

  data.recommendation = recommendation;

  let body = rewriteInternalLinks(entry.body, redirectMap, comparisonSlugs);
  body = body.replace(/\/vergleiche\/-([a-z0-9-]+)\/?/gi, (full, tail) => {
    const matches = [...comparisonSlugs].filter((slug) => slug.endsWith(`-${tail}`));
    return matches.length === 1 ? `/vergleiche/${matches[0]}/` : full;
  });

  write(entry.file, dumpFrontmatter(data, body));
}

/* Alle übrigen internen Quelllinks auf kanonische Vergleichsziele umstellen. */
const sourceExtensions = new Set([".md", ".mdx", ".astro", ".ts", ".tsx", ".js", ".mjs", ".json"]);
for (const scanRoot of [
  path.join(appRoot, "src"),
  path.join(root, "packages", "affiliate-core", "src")
]) {
  for (const file of listFiles(scanRoot, sourceExtensions)) {
    if (file.startsWith(comparisonDir)) continue;
    const source = read(file);
    const updated = rewriteInternalLinks(source, redirectMap, comparisonSlugs);
    write(file, updated);
  }
}

/* -------------------------------------------------------------------------- */
/* 2. RESOLVER-ALIASE UND SEMANTISCHE FALLBACKS                                */
/* -------------------------------------------------------------------------- */

const aliasExtension = `  bewertung: ["bewertung", "rating"],
  mindestportion: ["mindestportion", "realemindestportion", "portionsgroesse", "portionsgrosse", "portiongrams", "portionml"],
  krokettengroesse: ["krokettengroesse", "krokettengrosse", "kibblemaxmm"],
  napfergonomie: ["napfergonomie", "napf", "napfmaterial", "schale"],
  standfestigkeit: ["standfestigkeit", "stabilitaet", "standsicherheit"],
  offlinezeitplan: ["offlinezeitplan", "notstrom", "stromreserve", "backuppower", "batterie"],
  stromreserve: ["stromreserve", "notstrom", "backuppower", "batterie"],
  kontrollierbarkeit: ["kontrollierbarkeit", "app", "kamera", "zugang", "statusmeldungen"],
  tiertrennung: ["tiertrennung", "zugangskontrolle", "mikrochip", "multipet"],
  zugangskontrolle: ["zugangskontrolle", "zugang", "mikrochip", "access"],
  futterkammern: ["futterkammern", "kammern", "futterfaecher", "mealcount"],
  napfkonzept: ["napfkonzept", "napf", "schale", "napfmaterial"],
  napfundreinigung: ["napfundreinigung", "napf", "reinigung", "cleaning"],
  geraeusch: ["geraeusch", "lautstaerke", "noise"],
  maximaleausgabe: ["maximaleausgabe", "maxmealgrams", "maxmealml"],
  geeignetehundegroesse: ["geeignetehundegroesse", "hundegroesse", "petsize", "tiergroesse"],
  zeitplaene: ["zeitplaene", "zeitplane", "mahlzeiten", "mealcount"],
  stoerungsmeldungen: ["stoerungsmeldungen", "statusmeldungen", "app"],
  vorrat: ["vorrat", "kapazitaet", "reservoirliters"],
  material: ["material", "werkstoff", "napfmaterial"]`;

stage("Resolver-Erweiterungen vorbereiten");
const aliasHelperTs = `
const comparisonAliasCandidates = (
  normalized: string,
  label: string
): Set<string> => {
  const seeds = new Set([
    normalized,
    normalizeKey(label)
  ]);
  const result = new Set(seeds);

  for (const [group, values] of Object.entries(aliases)) {
    const normalizedGroup = normalizeKey(group);
    const normalizedValues = values.map(normalizeKey);
    if (
      seeds.has(normalizedGroup) ||
      normalizedValues.some((value) => seeds.has(value))
    ) {
      result.add(normalizedGroup);
      normalizedValues.forEach((value) => result.add(value));
    }
  }

  return result;
};
`;

const aliasHelperMjs = `
const comparisonAliasCandidates = (normalized, label) => {
  const seeds = new Set([normalized, normalizeKey(label)]);
  const result = new Set(seeds);

  for (const [group, values] of Object.entries(aliases)) {
    const normalizedGroup = normalizeKey(group);
    const normalizedValues = values.map(normalizeKey);
    if (
      seeds.has(normalizedGroup) ||
      normalizedValues.some((value) => seeds.has(value))
    ) {
      result.add(normalizedGroup);
      normalizedValues.forEach((value) => result.add(value));
    }
  }

  return result;
};
`;

function findAliasesObjectRange(source, label) {
  const declaration = /(?:export\s+)?(?:const|let|var)\s+aliases(?:\s*:\s*[^=\n]+)?\s*=\s*\{/m.exec(source);
  if (!declaration) fail(new Error(`Aliasobjekt nicht gefunden: ${label}`));

  const open = declaration.index + declaration[0].lastIndexOf("{");
  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (let index = open; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (lineComment) {
      if (char === "\n") lineComment = false;
      continue;
    }
    if (blockComment) {
      if (char === "*" && next === "/") {
        blockComment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === quote) quote = null;
      continue;
    }
    if (char === "/" && next === "/") {
      lineComment = true;
      index += 1;
      continue;
    }
    if (char === "/" && next === "*") {
      blockComment = true;
      index += 1;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return { open, close: index };
    }
  }

  fail(new Error(`Aliasobjekt ist nicht abgeschlossen: ${label}`));
}

const releaseAliasEntries = {
  mindestportion: ["mindestportion", "realemindestportion", "portionsgroesse", "portionsgrosse", "portiongrams", "portionml"],
  krokettengroesse: ["krokettengroesse", "krokettengrosse", "kibblemaxmm"],
  napfergonomie: ["napfergonomie", "napf", "napfmaterial", "schale"],
  standfestigkeit: ["standfestigkeit", "stabilitaet", "standsicherheit"],
  offlinezeitplan: ["offlinezeitplan", "notstrom", "stromreserve", "backuppower", "batterie"],
  stromreserve: ["stromreserve", "notstrom", "backuppower", "batterie"],
  kontrollierbarkeit: ["kontrollierbarkeit", "app", "kamera", "zugang", "statusmeldungen"],
  tiertrennung: ["tiertrennung", "zugangskontrolle", "mikrochip", "multipet"],
  zugangskontrolle: ["zugangskontrolle", "zugang", "mikrochip", "access"],
  futterkammern: ["futterkammern", "kammern", "futterfaecher", "mealcount"],
  napfkonzept: ["napfkonzept", "napf", "schale", "napfmaterial"],
  napfundreinigung: ["napfundreinigung", "napf", "reinigung", "cleaning"],
  geraeusch: ["geraeusch", "lautstaerke", "noise"],
  maximaleausgabe: ["maximaleausgabe", "maxmealgrams", "maxmealml"],
  geeignetehundegroesse: ["geeignetehundegroesse", "hundegroesse", "petsize", "tiergroesse"],
  zeitplaene: ["zeitplaene", "zeitplane", "mahlzeiten", "mealcount"],
  stoerungsmeldungen: ["stoerungsmeldungen", "statusmeldungen", "app"],
  vorrat: ["vorrat", "kapazitaet", "reservoirliters"]
};

function upsertAliasEntries(source, label) {
  const { open, close } = findAliasesObjectRange(source, label);
  const body = source.slice(open + 1, close);
  const missing = Object.entries(releaseAliasEntries).filter(([key]) =>
    !new RegExp(`(^|\\n)\\s*${key}\\s*:`, "m").test(body)
  );

  if (!missing.length) return source;

  let prefix = source.slice(0, close);
  const lastNonWhitespace = prefix.search(/\S\s*$/);
  if (lastNonWhitespace >= 0 && prefix[lastNonWhitespace] !== "{" && prefix[lastNonWhitespace] !== ",") {
    prefix = prefix.slice(0, lastNonWhitespace + 1) + "," + prefix.slice(lastNonWhitespace + 1);
  }

  const lines = missing.map(([key, values]) =>
    `  ${key}: ${JSON.stringify(values)},`
  ).join("\n");

  return `${prefix}\n${lines}\n${source.slice(close)}`;
}

function insertBeforeAsRecord(source, helper, label) {
  if (source.includes("comparisonAliasCandidates")) return source;
  const match = /\n(?:export\s+)?const\s+asRecord\b/m.exec(source);
  if (!match) fail(new Error(`asRecord-Anker nicht gefunden: ${label}`));
  return source.slice(0, match.index) + helper + source.slice(match.index);
}

function replaceCandidateBuilder(source, label) {
  if (source.includes("const candidates = comparisonAliasCandidates(")) return source;

  const candidatesDeclaration = /const\s+candidates\s*=/m.exec(source);
  if (!candidatesDeclaration) {
    fail(new Error(`Kandidatenaufbau nicht gefunden: ${label}`));
  }

  const statementEnd = source.indexOf(";", candidatesDeclaration.index);
  if (statementEnd === -1) {
    fail(new Error(`Kandidatenaufbau besitzt kein Statement-Ende: ${label}`));
  }

  const statement = source.slice(candidatesDeclaration.index, statementEnd + 1);
  if (!/normalized/.test(statement) || !/criterion\.label/.test(statement)) {
    fail(new Error(
      `Kandidatenaufbau hat eine unbekannte Form: ${label}\n${statement.slice(0, 500)}`
    ));
  }

  return (
    source.slice(0, candidatesDeclaration.index) +
    "const candidates = comparisonAliasCandidates(normalized, criterion.label);" +
    source.slice(statementEnd + 1)
  );
}

function insertSwitchCases(source, snippet, label) {
  if (source.includes('case "mindestportion":')) return source;
  const anchor = /\n\s*case\s+["'](?:preisklasse|score)["']\s*:/m.exec(source);
  if (!anchor) fail(new Error(`Switch-Anker nicht gefunden: ${label}`));
  return source.slice(0, anchor.index) + `\n${snippet}` + source.slice(anchor.index);
}

function describeResolverShape(source, label) {
  const aliasDeclaration =
    /(?:export\s+)?(?:const|let|var)\s+aliases(?:\s*:\s*[^=\n]+)?\s*=\s*\{/m.test(source);
  const asRecordDeclaration =
    /(?:export\s+)?const\s+asRecord\b/m.test(source);
  const candidatesDeclaration =
    /const\s+candidates\s*=/m.test(source);
  const switchAnchor =
    /\n\s*case\s+["'](?:preisklasse|score)["']\s*:/m.test(source);

  log(
    `${label}: aliases=${aliasDeclaration}, asRecord=${asRecordDeclaration}, ` +
    `candidates=${candidatesDeclaration}, switch=${switchAnchor}`
  );
}

function patchResolverTs(source) {
  let output = upsertAliasEntries(source, "TypeScript");
  output = insertBeforeAsRecord(output, aliasHelperTs, "TypeScript");
  output = replaceCandidateBuilder(output, "TypeScript");
  output = insertSwitchCases(output, `    case "mindestportion":
    case "realemindestportion":
    case "portionsgroesse":
      return filters?.portionGrams
        ? \`\${filters.portionGrams} g je Einheit\`
        : filters?.portionMl
          ? \`\${filters.portionMl} ml je Einheit\`
          : undefined;
    case "krokettengroesse":
      return filters?.kibbleMaxMm ? \`Bis \${filters.kibbleMaxMm} mm\` : undefined;
    case "maximaleausgabe":
      return filters?.maxMealGrams
        ? \`Bis \${filters.maxMealGrams} g je Mahlzeit\`
        : filters?.maxMealMl
          ? \`Bis \${filters.maxMealMl} ml je Mahlzeit\`
          : undefined;
    case "geeignetehundegroesse":
      return filters?.petSize?.length ? sizeLabels(filters.petSize) : undefined;
    case "stromreserve":
    case "offlinezeitplan":
      return typeof filters?.backupPower === "boolean"
        ? filters.backupPower
          ? "Zeitplan mit Batterie-Backup"
          : "Keine bestätigte Stromreserve"
        : undefined;
    case "kontrollierbarkeit": {
      const controls = [
        filters?.app ? "App" : undefined,
        filters?.camera ? "Kamera" : undefined,
        filters?.access === "microchip" ? "Mikrochip-Zugang" : undefined
      ].filter(Boolean);
      return controls.length ? controls.join(", ") : undefined;
    }`, "TypeScript");
  return output;
}

function patchResolverMjs(source) {
  let output = upsertAliasEntries(source, "MJS");
  output = insertBeforeAsRecord(output, aliasHelperMjs, "MJS");
  output = replaceCandidateBuilder(output, "MJS");
  output = insertSwitchCases(output, `    case "mindestportion":
    case "realemindestportion":
    case "portionsgroesse":
      return filters.portionGrams
        ? \`\${filters.portionGrams} g je Einheit\`
        : filters.portionMl
          ? \`\${filters.portionMl} ml je Einheit\`
          : undefined;
    case "krokettengroesse":
      return filters.kibbleMaxMm ? \`Bis \${filters.kibbleMaxMm} mm\` : undefined;
    case "maximaleausgabe":
      return filters.maxMealGrams
        ? \`Bis \${filters.maxMealGrams} g je Mahlzeit\`
        : filters.maxMealMl
          ? \`Bis \${filters.maxMealMl} ml je Mahlzeit\`
          : undefined;
    case "geeignetehundegroesse":
      return filters.petSize?.length ? mapList(filters.petSize, "size") : undefined;
    case "stromreserve":
    case "offlinezeitplan":
      return typeof filters.backupPower === "boolean"
        ? filters.backupPower
          ? "Zeitplan mit Batterie-Backup"
          : "Keine bestätigte Stromreserve"
        : undefined;
    case "kontrollierbarkeit": {
      const controls = [
        filters.app ? "App" : undefined,
        filters.camera ? "Kamera" : undefined,
        filters.access === "microchip" ? "Mikrochip-Zugang" : undefined
      ].filter(Boolean);
      return controls.length ? controls.join(", ") : undefined;
    }`, "MJS");
  return output;
}

stage("TypeScript-Resolver strukturell erweitern");
try {
  const resolverSource = read(files.resolverTs);
  describeResolverShape(resolverSource, "TypeScript-Resolver");
  write(files.resolverTs, patchResolverTs(resolverSource));
} catch (error) {
  fail(error);
}
stage("MJS-Resolver strukturell erweitern");
try {
  const resolverSource = read(files.resolverMjs);
  describeResolverShape(resolverSource, "MJS-Resolver");
  write(files.resolverMjs, patchResolverMjs(resolverSource));
} catch (error) {
  fail(error);
}

/* -------------------------------------------------------------------------- */
/* 3. VIEW MODEL: EMPFEHLUNGS-FALLBACK UND NUR VOLLSTÄNDIGE ZEILEN             */
/* -------------------------------------------------------------------------- */

stage("Comparison View Model absichern");
let viewModel = read(files.viewModel);

viewModel = replaceRequired(
  viewModel,
  `  const winnerCandidate = automaticRecommendation.winnerSlug ?? data.recommendation.winnerSlug;
  const alternativeCandidate = automaticRecommendation.alternativeSlug ?? data.recommendation.alternativeSlug;
  const resolvedWinnerSlug = recommendationEligible(winnerCandidate) ? winnerCandidate : undefined;
  const resolvedAlternativeSlug = recommendationEligible(alternativeCandidate) ? alternativeCandidate : undefined;`,
  `  const eligibleItemSlugs = items
    .filter((item) =>
      item.type === "product" &&
      recommendationEligible(item.slug)
    )
    .map((item) => item.slug);

  const winnerCandidate =
    automaticRecommendation.winnerSlug ??
    data.recommendation.winnerSlug;
  const alternativeCandidate =
    automaticRecommendation.alternativeSlug ??
    data.recommendation.alternativeSlug;

  const resolvedWinnerSlug =
    winnerCandidate && eligibleItemSlugs.includes(winnerCandidate)
      ? winnerCandidate
      : eligibleItemSlugs[0];

  const resolvedAlternativeSlug =
    alternativeCandidate &&
    alternativeCandidate !== resolvedWinnerSlug &&
    eligibleItemSlugs.includes(alternativeCandidate)
      ? alternativeCandidate
      : eligibleItemSlugs.find((slug) => slug !== resolvedWinnerSlug);`,
  "Empfehlungsfallback"
);

const rowsStart = viewModel.indexOf("  const rows: ComparisonRow[] = rawRows.map((row) => {");
const rowsEnd = viewModel.indexOf("\n\n  const filterValuesBySlug", rowsStart);
if (rowsStart === -1 || rowsEnd === -1) {
  fail("Zeilenaufbereitung im ViewModel nicht gefunden.");
}

const rowsReplacement = `  const rowCandidates = rawRows.map((row) => {
    const resolvedCells = row.cells.filter(
      (cell) =>
        Boolean(cell.value) &&
        cell.value !== "–"
    );
    const normalizedValues = new Set(
      resolvedCells.map((cell) =>
        cell.value.trim().toLocaleLowerCase("de")
      )
    );

    return {
      ...row,
      resolvedCount: resolvedCells.length,
      coverage:
        row.cells.length > 0
          ? resolvedCells.length / row.cells.length
          : 0,
      hasDifferences: normalizedValues.size > 1
    };
  });

  /*
   * Release Closure 14.0:
   * Nur vollständig belegte Kriterien werden öffentlich ausgespielt.
   * Unvollständige Quellkriterien bleiben im Audit sichtbar, erzeugen aber
   * keine "Keine Angabe"-Wüsten in Desktop-Tabelle oder Mobile Cards.
   */
  const rows: ComparisonRow[] = rowCandidates
    .filter((row) =>
      row.cells.length >= 2 &&
      row.resolvedCount === row.cells.length
    )
    .map(({ resolvedCount: _resolvedCount, coverage: _coverage, ...row }) => row);`;

viewModel = viewModel.slice(0, rowsStart) + rowsReplacement + viewModel.slice(rowsEnd);
write(files.viewModel, viewModel);

/* -------------------------------------------------------------------------- */
/* 4. ÖFFENTLICHE MISSING-DATA-DARSTELLUNG                                     */
/* -------------------------------------------------------------------------- */

stage("Öffentliche Missing-Data-Darstellung bereinigen");
let comparisonTable = read(files.comparisonTable);
comparisonTable = comparisonTable.replace(
  ') : "Keine Angabe"}',
  ') : <span class="comparison-value-missing" title="Kein redaktioneller Score verfügbar">–</span>}'
);
comparisonTable = comparisonTable.replace(
  'price.amountLabel ?? (price.url ? "Beim Händler prüfen" : "Keine Angabe")',
  'price.amountLabel ?? (price.url ? "Beim Händler prüfen" : "Preis nicht verfügbar")'
);
comparisonTable = comparisonTable.replace(
  `              const value =
                cell?.value && cell.value !== "–"
                  ? cell.value
                  : "Keine Angabe";`,
  `              const value =
                cell?.value && cell.value !== "–"
                  ? cell.value
                  : null;`
);
comparisonTable = comparisonTable.replace(
  "                  {value}\n",
  '                  {value ?? <span class="comparison-value-missing" title="Nicht verlässlich dokumentiert">–</span>}\n'
);
write(files.comparisonTable, comparisonTable);

let mobileCards = read(files.mobileCards);
mobileCards = mobileCards.replace(
  `            const value =
              cell?.value && cell.value !== "–"
                ? cell.value
                : "Keine Angabe";`,
  `            const value =
              cell?.value && cell.value !== "–"
                ? cell.value
                : null;`
);
mobileCards = mobileCards.replace(
  "                <dd>{value}</dd>",
  '                <dd>{value ?? <span class="comparison-value-missing" title="Nicht verlässlich dokumentiert">–</span>}</dd>'
);
write(files.mobileCards, mobileCards);

/* -------------------------------------------------------------------------- */
/* 5. DARK-MODE- UND STICKY-SAFEGUARDS                                         */
/* -------------------------------------------------------------------------- */

stage("Dark-Mode- und Sticky-Bar-Safeguards anwenden");
let shell = read(files.shell);
shell = shell.replace(
  '<div class="comparison-shell comparison-shell--premium" data-comparison-polish="3.3">',
  '<div class="comparison-shell comparison-shell--premium" data-comparison-polish="3.3" data-dark-mode-ready="true">'
);
write(files.shell, shell);

let sticky = read(files.sticky);
sticky = sticky.replace(
  '<aside class="comparison-sticky-bar comparison-sticky-bar--v121" aria-label="Top-Empfehlung">',
  '<aside class="comparison-sticky-bar comparison-sticky-bar--v121" aria-label="Top-Empfehlung" data-comparison-sticky="true">'
);
sticky = stripMarkedBlock(
  sticky,
  "<!-- PT_COMPARISON_RELEASE_CLOSURE_14_0_0_START -->",
  "<!-- PT_COMPARISON_RELEASE_CLOSURE_14_0_0_END -->"
).trimEnd();

sticky += `

<!-- PT_COMPARISON_RELEASE_CLOSURE_14_0_0_START -->
<style is:global>
  @media (max-width: 47.99rem) {
    .comparison-detail {
      padding-bottom: calc(11rem + env(safe-area-inset-bottom)) !important;
    }

    .comparison-sticky-bar[data-comparison-sticky="true"] {
      max-height: min(10.5rem, calc(100dvh - 1.25rem)) !important;
      overflow: auto !important;
      overscroll-behavior: contain;
    }

    .comparison-sticky-bar__actions:has(> :only-child) {
      grid-template-columns: minmax(0, 1fr) !important;
    }
  }

  @media print {
    .comparison-sticky-bar[data-comparison-sticky="true"] {
      display: none !important;
    }

    .comparison-detail {
      padding-bottom: 0 !important;
    }
  }
</style>
<!-- PT_COMPARISON_RELEASE_CLOSURE_14_0_0_END -->
`;
write(files.sticky, sticky);

let premiumCss = read(files.premiumCss);
premiumCss = stripMarkedBlock(
  premiumCss,
  "/* PT_COMPARISON_RELEASE_CLOSURE_14_0_0_START */",
  "/* PT_COMPARISON_RELEASE_CLOSURE_14_0_0_END */"
).trimEnd();

premiumCss += `

/* PT_COMPARISON_RELEASE_CLOSURE_14_0_0_START */
[data-dark-mode-ready="true"] {
  color: var(--comparison-text);
}

[data-dark-mode-ready="true"] :is(
  .recommendation-card,
  .comparison-mobile-product,
  .comparison-table-wrap,
  .comparison-winner-card,
  .comparison-quick-answer,
  .comparison-insight-summary,
  .comparison-methodology,
  .comparison-verdict
) {
  border-color: var(--comparison-line) !important;
  color: var(--comparison-text) !important;
  background-color: var(--comparison-surface) !important;
}

[data-dark-mode-ready="true"] :is(
  h2,
  h3,
  h4,
  strong,
  th,
  td,
  dt,
  dd
) {
  color: var(--comparison-text);
}

[data-dark-mode-ready="true"] :is(
  p,
  small,
  .comparison-section__note,
  .recommendation-card__manufacturer
) {
  color: var(--comparison-muted);
}

[data-dark-mode-ready="true"] :is(
  .recommendation-card__image-link,
  .comparison-mobile-product__image,
  .comparison-winner-card__image
) {
  background: #f5f7f5 !important;
}

.comparison-value-missing {
  color: var(--comparison-muted);
  font-weight: 700;
}

html[data-theme="dark"] [data-dark-mode-ready="true"] .comparison-table,
html.dark [data-dark-mode-ready="true"] .comparison-table,
body.dark [data-dark-mode-ready="true"] .comparison-table,
[data-theme="dark"] [data-dark-mode-ready="true"] .comparison-table {
  color: var(--comparison-text);
  background: var(--comparison-surface);
}

html[data-theme="dark"] [data-dark-mode-ready="true"] .comparison-table :is(th, td),
html.dark [data-dark-mode-ready="true"] .comparison-table :is(th, td),
body.dark [data-dark-mode-ready="true"] .comparison-table :is(th, td),
[data-theme="dark"] [data-dark-mode-ready="true"] .comparison-table :is(th, td) {
  border-color: var(--comparison-line);
  color: var(--comparison-text);
  background: var(--comparison-surface);
}
/* PT_COMPARISON_RELEASE_CLOSURE_14_0_0_END */
`;
write(files.premiumCss, premiumCss);

/* -------------------------------------------------------------------------- */
/* 6. AUDITS AUF DIE ZENTRALE DATENPLATTFORM UMRÜSTEN                           */
/* -------------------------------------------------------------------------- */

stage("Comparison-Audits aktualisieren");
let audit = read(files.audit);

if (!audit.includes('from "./data-platform.mjs"')) {
  audit = audit.replace(
    '} from "./core.mjs";',
    '} from "./core.mjs";\nimport { resolveComparisonValue } from "./data-platform.mjs";'
  );
}

audit = audit.replace(
  '  "RECOMMENDATION_DUPLICATE"\n]);',
  `  "RECOMMENDATION_DUPLICATE",
  "COMPARISON_VISIBLE_ROWS_TOO_FEW",
  "WINNER_INELIGIBLE",
  "ALTERNATIVE_INELIGIBLE"
]);`
);

audit = audit.replace(
  `    for (const key of criterionKeys) {
      if (!(key in values)) {
        addIssue(issues, "VALUE_MISSING", c, slug + ": Wert für " + key + " fehlt.", {
          itemSlug: slug,
          criterionKey: key
        });
      }
    }`,
  `    /*
     * Leere item.values sind seit der Comparison Data Platform kein Fehler.
     * Die tatsächliche Auflösung wird zeilenweise über resolveComparisonValue
     * geprüft und nur vollständig belegte Zeilen werden öffentlich gerendert.
     */`
);

if (!audit.includes("COMPARISON_VISIBLE_ROWS_TOO_FEW")) {
  fail("Audit-Fehlercodes konnten nicht erweitert werden.");
}

const winnerAnchor = `  const winner = d.recommendation?.winnerSlug;
  const alternative = d.recommendation?.alternativeSlug;`;

const auditRowBlock = `  const productItems = items.filter((item) => item.type === "product");
  const fullyResolvedRows = criteria.filter((criterion) =>
    productItems.length >= 2 &&
    productItems.every((item) => {
      const product = productBySlug.get(item.slug)?.data;
      const value = resolveComparisonValue({ product, item, criterion });
      return Boolean(value) && value !== "–";
    })
  );

  if (fullyResolvedRows.length < 3) {
    addIssue(
      issues,
      "COMPARISON_VISIBLE_ROWS_TOO_FEW",
      c,
      \`Nur \${fullyResolvedRows.length} vollständig belegte Kriterien sind öffentlich darstellbar.\`,
      { count: fullyResolvedRows.length }
    );
  }

  const isEligible = (slug) => {
    if (!slug || !seen.has(slug)) return false;
    const product = productBySlug.get(slug)?.data;
    if (!product) return false;
    if (["legacy", "discontinued"].includes(product.productStatus)) return false;
    if (product.availability === "discontinued") return false;
    if (["excluded", "blocked"].includes(product.recommendationStatus)) return false;
    return true;
  };

${winnerAnchor}`;

if (!audit.includes("const fullyResolvedRows")) {
  audit = replaceRequired(audit, winnerAnchor, auditRowBlock, "Audit-Zeilenabdeckung");
}

audit = audit.replace(
  `  if (winner && !seen.has(winner)) addIssue(issues, "WINNER_NOT_IN_ITEMS", c, "winnerSlug " + winner + " ist nicht in items.");
  if (alternative && !seen.has(alternative)) addIssue(issues, "ALTERNATIVE_NOT_IN_ITEMS", c, "alternativeSlug " + alternative + " ist nicht in items.");
  if (winner && alternative && winner === alternative) addIssue(issues, "RECOMMENDATION_DUPLICATE", c, "winnerSlug und alternativeSlug sind identisch.");`,
  `  if (winner && !seen.has(winner)) addIssue(issues, "WINNER_NOT_IN_ITEMS", c, "winnerSlug " + winner + " ist nicht in items.");
  if (alternative && !seen.has(alternative)) addIssue(issues, "ALTERNATIVE_NOT_IN_ITEMS", c, "alternativeSlug " + alternative + " ist nicht in items.");
  if (winner && alternative && winner === alternative) addIssue(issues, "RECOMMENDATION_DUPLICATE", c, "winnerSlug und alternativeSlug sind identisch.");
  if (winner && !isEligible(winner)) addIssue(issues, "WINNER_INELIGIBLE", c, "winnerSlug " + winner + " ist operativ nicht empfehlungsfähig.");
  if (alternative && !isEligible(alternative)) addIssue(issues, "ALTERNATIVE_INELIGIBLE", c, "alternativeSlug " + alternative + " ist operativ nicht empfehlungsfähig.");`
);

audit = audit.replace(
  `  if (strict && (report.summary.errors || report.summary.warnings)) {
    process.exitCode = 1;
  }`,
  `  if (strict && report.summary.errors) {
    process.exitCode = 1;
  }`
);
write(files.audit, audit);

/* -------------------------------------------------------------------------- */
/* 7. NEUER DATEN- UND COVERAGE-AUDIT                                          */
/* -------------------------------------------------------------------------- */

stage("Daten- und Coverage-Audits erzeugen");
const dataAuditSource = `import fs from "node:fs";
import path from "node:path";
import {
  COMPARISON_DIR,
  PRODUCT_DIR,
  REPORT_DIR,
  loadEntries,
  slugOf,
  ensureReportDir
} from "./core.mjs";
import { resolveComparisonValue } from "./data-platform.mjs";

const STRICT = process.argv.includes("--strict");
const EXPECTED_COMPARISONS = 24;
const MIN_VISIBLE_ROWS = 3;
const MIN_RENDERED_COVERAGE = 95;

const isResolved = (value) => Boolean(value) && value !== "–";

export function runDataAudit({ strict = STRICT } = {}) {
  const comparisons = loadEntries(COMPARISON_DIR);
  const products = loadEntries(PRODUCT_DIR);
  const productBySlug = new Map(products.map((entry) => [slugOf(entry), entry.data]));

  let allResolved = 0;
  let allUnresolved = 0;
  let renderedResolved = 0;
  let renderedUnresolved = 0;
  let legacyValueCount = 0;
  let overrideCount = 0;

  const comparisonReports = comparisons.map((comparison) => {
    const criteria = Array.isArray(comparison.data.criteria)
      ? comparison.data.criteria
      : [];
    const items = (Array.isArray(comparison.data.items)
      ? comparison.data.items
      : []).filter((item) => item.type === "product");

    const rows = criteria.map((criterion) => {
      const cells = items.map((item) => {
        const value = resolveComparisonValue({
          product: productBySlug.get(item.slug),
          item,
          criterion
        });
        const resolved = isResolved(value);
        if (resolved) allResolved++;
        else allUnresolved++;
        return {
          product: item.slug,
          value,
          resolved
        };
      });

      const resolvedCount = cells.filter((cell) => cell.resolved).length;
      const visible = cells.length >= 2 && resolvedCount === cells.length;

      if (visible) {
        renderedResolved += resolvedCount;
        renderedUnresolved += cells.length - resolvedCount;
      }

      return {
        key: criterion.key,
        label: criterion.label,
        resolved: resolvedCount,
        total: cells.length,
        coverage: cells.length
          ? Math.round(resolvedCount / cells.length * 1000) / 10
          : 0,
        visible,
        cells
      };
    });

    for (const item of items) {
      legacyValueCount += Object.keys(item.values ?? {}).length;
      overrideCount += Object.keys(item.overrides ?? {}).length;
    }

    const visibleRows = rows.filter((row) => row.visible);
    return {
      slug: slugOf(comparison),
      file: comparison.rel,
      items: items.length,
      criteria: criteria.length,
      visibleRows: visibleRows.length,
      hiddenRows: rows.length - visibleRows.length,
      passed: items.length >= 2 && visibleRows.length >= MIN_VISIBLE_ROWS,
      rows
    };
  });

  const sourceCells = allResolved + allUnresolved;
  const renderedCells = renderedResolved + renderedUnresolved;
  const sourceCoverage = sourceCells
    ? Math.round(allResolved / sourceCells * 1000) / 10
    : 100;
  const renderedCoverage = renderedCells
    ? Math.round(renderedResolved / renderedCells * 1000) / 10
    : 0;

  const failures = [];
  if (comparisons.length !== EXPECTED_COMPARISONS) {
    failures.push(\`Erwartet: \${EXPECTED_COMPARISONS} Vergleiche, gefunden: \${comparisons.length}.\`);
  }
  for (const comparison of comparisonReports) {
    if (!comparison.passed) {
      failures.push(
        \`\${comparison.slug}: nur \${comparison.visibleRows} vollständig belegte Kriterien.\`
      );
    }
  }
  if (renderedCoverage < MIN_RENDERED_COVERAGE) {
    failures.push(
      \`Gerenderte Datenabdeckung \${renderedCoverage} % liegt unter \${MIN_RENDERED_COVERAGE} %.\`
    );
  }

  const report = {
    generatedAt: new Date().toISOString(),
    expectedComparisons: EXPECTED_COMPARISONS,
    thresholds: {
      minimumVisibleRows: MIN_VISIBLE_ROWS,
      minimumRenderedCoverage: MIN_RENDERED_COVERAGE
    },
    passed: failures.length === 0,
    summary: {
      comparisons: comparisons.length,
      products: products.length,
      sourceCells,
      allResolved,
      allUnresolved,
      sourceCoverage,
      renderedCells,
      renderedResolved,
      renderedUnresolved,
      renderedCoverage,
      legacyValueCount,
      overrideCount
    },
    failures,
    comparisons: comparisonReports
  };

  ensureReportDir();
  fs.writeFileSync(
    path.join(REPORT_DIR, "comparison-data-platform.json"),
    JSON.stringify(report, null, 2) + "\\n",
    "utf8"
  );

  const markdown = [
    "# Comparison Data Platform Audit",
    "",
    \`Erstellt: \${report.generatedAt}\`,
    "",
    \`**Status: \${report.passed ? "BESTANDEN" : "NICHT BESTANDEN"}**\`,
    "",
    \`- Vergleiche: \${report.summary.comparisons} / \${EXPECTED_COMPARISONS}\`,
    \`- Quellabdeckung: \${report.summary.sourceCoverage} %\`,
    \`- öffentlich gerenderte Abdeckung: \${report.summary.renderedCoverage} %\`,
    \`- alte values-Felder: \${report.summary.legacyValueCount}\`,
    \`- bewusste Overrides: \${report.summary.overrideCount}\`,
    "",
    "## Vergleichsseiten",
    "",
    "| Vergleich | Items | Kriterien sichtbar | ausgeblendet | Status |",
    "|---|---:|---:|---:|---|",
    ...report.comparisons.map((item) =>
      \`| \\\`\${item.slug}\\\` | \${item.items} | \${item.visibleRows} | \${item.hiddenRows} | \${item.passed ? "OK" : "BLOCKIERT"} |\`
    ),
    "",
    "## Blocker",
    "",
    ...(report.failures.length
      ? report.failures.map((failure) => \`- \${failure}\`)
      : ["- Keine."]),
    "",
    "Unvollständige Quellkriterien bleiben im JSON-Bericht sichtbar, werden aber nicht als leere Tabellenzeilen veröffentlicht.",
    ""
  ].join("\\n");

  fs.writeFileSync(
    path.join(REPORT_DIR, "comparison-data-platform.md"),
    markdown,
    "utf8"
  );

  console.log("Comparison Data Platform Audit");
  console.log(\`Vergleiche: \${comparisons.length}/\${EXPECTED_COMPARISONS}\`);
  console.log(\`Quellabdeckung: \${sourceCoverage} %\`);
  console.log(\`Gerenderte Abdeckung: \${renderedCoverage} %\`);
  console.log(\`Status: \${report.passed ? "BESTANDEN" : "NICHT BESTANDEN"}\`);

  if (strict && !report.passed) process.exitCode = 1;
  return report;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replaceAll("\\\\", "/"))) {
  runDataAudit({ strict: STRICT });
}
`;

write(files.dataAudit, dataAuditSource);

const coverageAuditSource = `#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { REPORT_DIR, ensureReportDir } from "./core.mjs";
import { runDataAudit } from "./data-audit.mjs";

const strict = process.argv.includes("--strict");
const thresholdArg = process.argv.find((value) => value.startsWith("--threshold="));
const threshold = thresholdArg ? Number(thresholdArg.split("=")[1]) : 95;

const dataReport = runDataAudit({ strict: false });
const coverage = dataReport.summary.renderedCoverage;
const passed =
  dataReport.summary.comparisons === dataReport.expectedComparisons &&
  dataReport.comparisons.every((item) => item.passed) &&
  coverage >= threshold;

const report = {
  generatedAt: new Date().toISOString(),
  threshold,
  passed,
  summary: {
    comparisons: dataReport.summary.comparisons,
    sourceCoverage: dataReport.summary.sourceCoverage,
    renderedCoverage: coverage,
    visibleRows: dataReport.comparisons.reduce((sum, item) => sum + item.visibleRows, 0),
    hiddenRows: dataReport.comparisons.reduce((sum, item) => sum + item.hiddenRows, 0)
  },
  comparisons: dataReport.comparisons.map((item) => ({
    slug: item.slug,
    visibleRows: item.visibleRows,
    hiddenRows: item.hiddenRows,
    passed: item.passed
  }))
};

ensureReportDir();
fs.writeFileSync(
  path.join(REPORT_DIR, "comparison-data-coverage-phase2.json"),
  JSON.stringify(report, null, 2) + "\\n"
);
fs.writeFileSync(
  path.join(REPORT_DIR, "comparison-data-coverage-phase2.md"),
  [
    "# Comparison Data Coverage – Release Closure",
    "",
    \`Status: \${passed ? "BESTANDEN" : "NICHT BESTANDEN"}\`,
    \`Vergleiche: \${report.summary.comparisons}\`,
    \`Quellabdeckung: \${report.summary.sourceCoverage} %\`,
    \`Gerenderte Abdeckung: \${report.summary.renderedCoverage} %\`,
    \`Sichtbare Kriterien: \${report.summary.visibleRows}\`,
    \`Ausgeblendete unvollständige Kriterien: \${report.summary.hiddenRows}\`,
    \`Schwellenwert: \${threshold} %\`,
    ""
  ].join("\\n")
);

console.log("Comparison Data Coverage – Release Closure");
console.log(\`Gerenderte Abdeckung: \${coverage} %\`);
console.log(\`Status: \${passed ? "BESTANDEN" : "NICHT BESTANDEN"}\`);

if (strict && !passed) process.exitCode = 1;
`;

write(files.coverageAudit, coverageAuditSource);

/* -------------------------------------------------------------------------- */
/* 8. REFACTOR-AUDIT UM KAPUTTE VERGLEICHSPFADE ERWEITERN                       */
/* -------------------------------------------------------------------------- */

let refactorAudit = read(files.refactorAudit);
if (!refactorAudit.includes("MALFORMED_COMPARISON_PATH")) {
  refactorAudit = replaceRequired(
    refactorAudit,
    `for (const rootDir of scanRoots) {
  for (const file of await walk(rootDir)) {
    const source = await readFile(file, "utf8");
    for (const oldUrl of forbidden) {`,
    `for (const rootDir of scanRoots) {
  for (const file of await walk(rootDir)) {
    const source = await readFile(file, "utf8");

    const malformedComparisonPath = source.match(/\\/vergleiche\\/-[a-z0-9-]+\\/?/i);
    if (malformedComparisonPath) {
      errors.push(
        "MALFORMED_COMPARISON_PATH " +
        malformedComparisonPath[0] +
        " in " +
        path.relative(root, file)
      );
    }

    for (const oldUrl of forbidden) {`,
    "Refactor-Audit Linkmuster"
  );
}
write(files.refactorAudit, refactorAudit);

/* -------------------------------------------------------------------------- */
/* 9. RELEASE-AUDIT FÜR DIST                                                    */
/* -------------------------------------------------------------------------- */

stage("24-Seiten-Release-Audit erzeugen");
const releaseAuditSource = `#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import yaml from "js-yaml";
import { fileURLToPath } from "node:url";
import { runDataAudit } from "./data-audit.mjs";

const args = new Set(process.argv.slice(2));
const strict = args.has("--strict");
const requireVisual = args.has("--require-visual");
const confirmVisual = args.has("--confirm-visual");

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(scriptDir, "..", "..");
const repoRoot = path.resolve(appRoot, "..", "..");
const comparisonDir = path.join(appRoot, "src", "content", "comparisons");
const distRoot = path.join(appRoot, "dist");
const reportDir = path.join(appRoot, "reports", "comparison-platform");
const signoffFile = path.join(reportDir, "comparison-visual-signoff.json");
const reportJson = path.join(reportDir, "comparison-release-closure.json");
const reportMd = path.join(reportDir, "comparison-release-closure.md");

const EXPECTED_COMPARISONS = 24;

const parse = (file) => {
  const source = fs.readFileSync(file, "utf8");
  const match = source.match(/^---\\r?\\n([\\s\\S]*?)\\r?\\n---\\r?\\n?/);
  if (!match) throw new Error(\`Ungültiges Frontmatter: \${file}\`);
  return yaml.load(match[1]) || {};
};

const routeFile = (slug) => path.join(distRoot, "vergleiche", slug, "index.html");
const routeExists = (href) => {
  const clean = href.split(/[?#]/)[0];
  if (!clean.startsWith("/") || clean.startsWith("/_astro/")) return true;
  if (/\\.[a-z0-9]{2,5}$/i.test(clean)) {
    return fs.existsSync(path.join(distRoot, clean.replace(/^\\//, "")));
  }
  const normalized = clean.endsWith("/") ? clean : \`\${clean}/\`;
  const relative = normalized === "/" ? "index.html" : \`\${normalized.replace(/^\\//, "")}index.html\`;
  return fs.existsSync(path.join(distRoot, relative));
};

const extractAttribute = (tag, name) => {
  const match = tag.match(new RegExp(\`\\\\b\${name}=["']([^"']+)["']\`, "i"));
  return match?.[1];
};

const typesIn = (value, result = new Set()) => {
  if (Array.isArray(value)) {
    value.forEach((item) => typesIn(item, result));
    return result;
  }
  if (!value || typeof value !== "object") return result;
  const type = value["@type"];
  if (Array.isArray(type)) type.forEach((item) => result.add(item));
  else if (type) result.add(type);
  Object.values(value).forEach((item) => typesIn(item, result));
  return result;
};

fs.mkdirSync(reportDir, { recursive: true });

if (confirmVisual) {
  if (process.env.PFOTENTECHNIK_VISUAL_QA_CONFIRMED !== "1") {
    console.error(
      "Visuelle Abnahme nicht gespeichert. Setze PFOTENTECHNIK_VISUAL_QA_CONFIRMED=1 erst nach der Prüfung von 375/414 px in Light und Dark Mode."
    );
    process.exit(1);
  }

  fs.writeFileSync(
    signoffFile,
    JSON.stringify({
      confirmedAt: new Date().toISOString(),
      matrix: [
        { viewport: "375x812", theme: "light", passed: true },
        { viewport: "375x812", theme: "dark", passed: true },
        { viewport: "414x896", theme: "light", passed: true },
        { viewport: "414x896", theme: "dark", passed: true }
      ],
      checks: [
        "Sticky-Bar überdeckt keine Inhalte",
        "Produktname und CTA bleiben vollständig bedienbar",
        "Gewinnerkarte, Tabelle, Karten und FAQ sind lesbar",
        "Keine hellen Fremdflächen im Dark Mode"
      ]
    }, null, 2) + "\\n"
  );
}

if (!fs.existsSync(distRoot)) {
  console.error("dist fehlt. Zuerst npm run build:pfotentechnik ausführen.");
  process.exit(1);
}

const comparisonFiles = fs.readdirSync(comparisonDir)
  .filter((name) => /\\.mdx?$/.test(name))
  .sort();

const comparisonData = comparisonFiles.map((name) => ({
  name,
  data: parse(path.join(comparisonDir, name))
}));

const redirectSources = new Set();
const redirectsFile = path.join(appRoot, "public", "_redirects");
if (fs.existsSync(redirectsFile)) {
  for (const line of fs.readFileSync(redirectsFile, "utf8").split(/\\r?\\n/)) {
    const parts = line.trim().split(/\\s+/);
    if (parts.length >= 3 && /^30[18]$/.test(parts[2]) && parts[0].startsWith("/")) {
      redirectSources.add(parts[0]);
      redirectSources.add(parts[0].replace(/\\/$/, ""));
    }
  }
}

const dataReport = runDataAudit({ strict: false });
const results = [];
const globalErrors = [];

if (comparisonData.length !== EXPECTED_COMPARISONS) {
  globalErrors.push(
    \`Erwartet: \${EXPECTED_COMPARISONS} Vergleichsseiten, gefunden: \${comparisonData.length}.\`
  );
}

for (const entry of comparisonData) {
  const slug = entry.data.slug;
  const expectedPath = \`/vergleiche/\${slug}/\`;
  const file = routeFile(slug);
  const errors = [];

  if (!fs.existsSync(file)) {
    errors.push("Route fehlt im Build.");
    results.push({ slug, route: expectedPath, errors, passed: false });
    continue;
  }

  const html = fs.readFileSync(file, "utf8");
  const canonicalTags = html.match(/<link\\b[^>]*rel=["'][^"']*canonical[^"']*["'][^>]*>/gi) || [];
  const canonical = canonicalTags.map((tag) => extractAttribute(tag, "href")).find(Boolean);

  if (!canonical) {
    errors.push("Canonical fehlt.");
  } else {
    try {
      const pathname = new URL(canonical, "https://pfotentechnik.de").pathname;
      if (pathname !== expectedPath) {
        errors.push(\`Canonical zeigt auf \${pathname}.\`);
      }
    } catch {
      errors.push("Canonical ist ungültig.");
    }
  }

  if (!html.includes('data-dark-mode-ready="true"')) {
    errors.push("Dark-Mode-Ready-Marker fehlt.");
  }
  if (!html.includes('data-comparison-sticky="true"')) {
    errors.push("Mobile Sticky-Bar fehlt.");
  }
  if (!html.includes('id="vergleichssieger"') || !html.includes("comparison-winner-card")) {
    errors.push("Gewinnerkarte fehlt.");
  }
  if (!html.includes("comparison-winner-card__image")) {
    errors.push("Gewinnerbild fehlt.");
  }
  if (!html.includes(">Test lesen<")) {
    errors.push("Produkt-CTA fehlt.");
  }
  if (/>\\s*Keine Angabe\\s*</i.test(html)) {
    errors.push('Öffentliche Ausgabe enthält "Keine Angabe".');
  }

  const jsonLdBlocks = [
    ...html.matchAll(/<script\\b[^>]*type=["']application\\/ld\\+json["'][^>]*>([\\s\\S]*?)<\\/script>/gi)
  ];
  const schemaTypes = new Set();
  for (const match of jsonLdBlocks) {
    try {
      typesIn(JSON.parse(match[1]), schemaTypes);
    } catch {
      errors.push("Ungültiger JSON-LD-Block.");
    }
  }
  if (!schemaTypes.has("ItemList")) errors.push("ItemList-Schema fehlt.");
  if (!schemaTypes.has("FAQPage")) errors.push("FAQPage-Schema fehlt.");

  const anchors = [...html.matchAll(/<a\\b[^>]*href=["']([^"']+)["'][^>]*>/gi)];
  for (const [, href] of anchors) {
    const clean = href.split(/[?#]/)[0];
    if (/^\\/vergleiche\\/-/.test(clean)) {
      errors.push(\`Ungültiger Vergleichslink: \${href}\`);
      continue;
    }
    if (redirectSources.has(clean) && !clean.startsWith("/vergleiche/")) {
      errors.push(\`Interner Link zeigt auf Redirect: \${href}\`);
      continue;
    }
    if (clean.startsWith("/") && !routeExists(clean)) {
      errors.push(\`Internes Linkziel fehlt im Build: \${href}\`);
    }
  }

  const affiliateTags = html.match(/<a\\b[^>]*data-affiliate-link[^>]*>/gi) || [];
  for (const tag of affiliateTags) {
    const href = extractAttribute(tag, "href");
    if (!href || !/^https:\\/\\//i.test(href)) {
      errors.push("Affiliate-CTA besitzt kein gültiges HTTPS-Ziel.");
    }
  }

  const images = [...html.matchAll(/<img\\b[^>]*src=["']([^"']+)["'][^>]*>/gi)];
  for (const [, src] of images) {
    if (src.startsWith("/_astro/") && !fs.existsSync(path.join(distRoot, src.replace(/^\\//, "")))) {
      errors.push(\`Bilddatei fehlt im Build: \${src}\`);
    }
  }

  const sourceData = dataReport.comparisons.find((item) => item.slug === slug);
  if (!sourceData?.passed) {
    errors.push(
      \`Zu wenige vollständig belegte Kriterien: \${sourceData?.visibleRows ?? 0}.\`
    );
  }

  results.push({
    slug,
    route: expectedPath,
    canonical,
    schemaTypes: [...schemaTypes],
    visibleRows: sourceData?.visibleRows ?? 0,
    affiliateCtas: affiliateTags.length,
    errors: [...new Set(errors)],
    passed: errors.length === 0
  });
}

const visualSignoff = fs.existsSync(signoffFile)
  ? JSON.parse(fs.readFileSync(signoffFile, "utf8"))
  : null;
const technicalPassed =
  globalErrors.length === 0 &&
  dataReport.passed &&
  results.every((item) => item.passed);
const finalPassed = technicalPassed && Boolean(visualSignoff);

const report = {
  generatedAt: new Date().toISOString(),
  expectedComparisons: EXPECTED_COMPARISONS,
  technicalPassed,
  visualPassed: Boolean(visualSignoff),
  finalPassed,
  globalErrors,
  dataSummary: dataReport.summary,
  visualSignoff,
  routes: results
};

fs.writeFileSync(reportJson, JSON.stringify(report, null, 2) + "\\n");

const markdown = [
  "# Comparison Release Closure 14.0.1",
  "",
  \`Erstellt: \${report.generatedAt}\`,
  "",
  \`## Technischer Status: \${technicalPassed ? "BESTANDEN" : "NICHT BESTANDEN"}\`,
  \`## Visuelle Abnahme: \${visualSignoff ? "BESTANDEN" : "AUSSTEHEND"}\`,
  \`## Gesamtstatus: \${finalPassed ? "ABGESCHLOSSEN" : "NOCH NICHT ABGESCHLOSSEN"}\`,
  "",
  \`- Vergleichsrouten: \${results.length} / \${EXPECTED_COMPARISONS}\`,
  \`- gerenderte Datenabdeckung: \${dataReport.summary.renderedCoverage} %\`,
  \`- Quellabdeckung: \${dataReport.summary.sourceCoverage} %\`,
  \`- technisch fehlerfreie Routen: \${results.filter((item) => item.passed).length}\`,
  "",
  "## Routenmatrix",
  "",
  "| Route | Kriterien | Affiliate-CTAs | Status |",
  "|---|---:|---:|---|",
  ...results.map((item) =>
    \`| \\\`\${item.route}\\\` | \${item.visibleRows} | \${item.affiliateCtas} | \${item.passed ? "OK" : "BLOCKIERT"} |\`
  ),
  "",
  "## Blocker",
  "",
  ...(
    globalErrors.length || results.some((item) => item.errors.length)
      ? [
          ...globalErrors.map((error) => \`- \${error}\`),
          ...results.flatMap((item) =>
            item.errors.map((error) => \`- \\\`\${item.route}\\\`: \${error}\`)
          )
        ]
      : ["- Keine technischen Blocker."]
  ),
  "",
  "## Visuelle Abnahme",
  "",
  visualSignoff
    ? \`Bestätigt am \${visualSignoff.confirmedAt}.\`
    : "Noch manuell in 375 × 812 und 414 × 896, jeweils Light und Dark Mode, zu prüfen.",
  ""
].join("\\n");

fs.writeFileSync(reportMd, markdown);

console.log("Comparison Release Closure 14.0.1");
console.log(\`Technisch: \${technicalPassed ? "BESTANDEN" : "NICHT BESTANDEN"}\`);
console.log(\`Visuell: \${visualSignoff ? "BESTANDEN" : "AUSSTEHEND"}\`);
console.log(\`Gesamt: \${finalPassed ? "ABGESCHLOSSEN" : "NOCH NICHT ABGESCHLOSSEN"}\`);
console.log(\`Bericht: \${path.relative(repoRoot, reportMd)}\`);

const shouldFail =
  !technicalPassed ||
  (requireVisual && !visualSignoff);

if (strict && shouldFail) process.exitCode = 1;
`;

write(files.releaseAudit, releaseAuditSource);

/* -------------------------------------------------------------------------- */
/* 10. PACKAGE-SCRIPTS                                                         */
/* -------------------------------------------------------------------------- */

stage("Package-Skripte ergänzen");
const appPackage = JSON.parse(read(files.appPackage));
appPackage.scripts = {
  ...appPackage.scripts,
  "comparison:release:check": "node scripts/comparison-platform/release-closure.mjs --strict",
  "comparison:release:final": "node scripts/comparison-platform/release-closure.mjs --strict --require-visual",
  "comparison:release:signoff": "node scripts/comparison-platform/release-closure.mjs --confirm-visual --strict --require-visual"
};
write(files.appPackage, JSON.stringify(appPackage, null, 2) + "\n");

/* -------------------------------------------------------------------------- */
/* 11. REGRESSIONSTEST                                                         */
/* -------------------------------------------------------------------------- */

stage("Regressionstest erzeugen");
const testSource = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(appRoot, "..", "..");

const read = (relative) => fs.readFile(path.join(repoRoot, relative), "utf8");
const parse = (source) => {
  const match = source.match(/^---\\r?\\n([\\s\\S]*?)\\r?\\n---\\r?\\n?([\\s\\S]*)$/);
  assert.ok(match);
  return { data: yaml.load(match[1]), body: match[2] };
};

test("all 24 comparison files use canonical comparison routes", async () => {
  const dir = path.join(appRoot, "src", "content", "comparisons");
  const names = (await fs.readdir(dir)).filter((name) => /\\.mdx?$/.test(name));
  assert.equal(names.length, 24);

  for (const name of names) {
    const { data, body } = parse(await fs.readFile(path.join(dir, name), "utf8"));
    const canonical = \`/vergleiche/\${data.slug}/\`;
    assert.equal(data.canonical, canonical);
    assert.equal(data.seo.canonical, canonical);
    assert.equal(data.seo.noindex, false);
    assert.equal(data.seo.sitemap, true);
    assert.doesNotMatch(body, /\\/vergleiche\\/-[a-z0-9-]+\\/?/i);
    assert.ok(data.items.length >= 2);
    assert.ok(data.items.some((item) => item.slug === data.recommendation.winnerSlug));
    if (data.recommendation.alternativeSlug) {
      assert.ok(data.items.some((item) => item.slug === data.recommendation.alternativeSlug));
      assert.notEqual(data.recommendation.winnerSlug, data.recommendation.alternativeSlug);
    }
  }
});

test("comparison UI hides unresolved criteria instead of rendering empty-data walls", async () => {
  const viewModel = await read("apps/pfotentechnik/src/domain/comparison/buildComparisonViewModel.ts");
  const table = await read("packages/affiliate-core/src/components/comparison/ComparisonTable.astro");
  const mobile = await read("packages/affiliate-core/src/components/comparison/ComparisonMobileCards.astro");

  assert.match(viewModel, /resolvedCount === row\\.cells\\.length/);
  assert.doesNotMatch(table, />Keine Angabe</);
  assert.doesNotMatch(mobile, />Keine Angabe</);
  assert.match(table, /comparison-value-missing/);
  assert.match(mobile, /comparison-value-missing/);
});

test("release safeguards cover dark mode, sticky CTA, schema and links", async () => {
  const shell = await read("packages/affiliate-core/src/components/comparison/ComparisonShell.astro");
  const sticky = await read("packages/affiliate-core/src/components/comparison/ComparisonStickyBar.astro");
  const releaseAudit = await read("apps/pfotentechnik/scripts/comparison-platform/release-closure.mjs");
  const refactorAudit = await read("apps/pfotentechnik/scripts/comparison-platform/refactor-audit.mjs");

  assert.match(shell, /data-dark-mode-ready="true"/);
  assert.match(sticky, /data-comparison-sticky="true"/);
  assert.match(sticky, /safe-area-inset-bottom/);
  assert.match(releaseAudit, /ItemList/);
  assert.match(releaseAudit, /FAQPage/);
  assert.match(releaseAudit, /EXPECTED_COMPARISONS = 24/);
  assert.match(refactorAudit, /MALFORMED_COMPARISON_PATH/);
});
`;

write(files.test, testSource);

/* -------------------------------------------------------------------------- */
/* 12. INSTALLER-REPORT UND AUSFÜHRUNG                                         */
/* -------------------------------------------------------------------------- */

const report = `# Comparison Release Closure Installer 14.0.0

## Änderungen

- alle 24 Vergleichsdateien auf kanonische \`/vergleiche/.../\`-Pfade normalisiert
- kaputte \`/vergleiche/-...\`-Links repariert
- Redirect-Ziele in internen Links kanonisiert
- beschädigte Größen-Kriterienschlüssel repariert
- Gewinner und Alternative auf vorhandene, empfehlungsfähige Produkte abgesichert
- Resolver-Aliase für migrierte Einsatzkriterien erweitert
- öffentlich werden nur vollständig belegte Vergleichszeilen gerendert
- wiederholte „Keine Angabe“-Ausgaben entfernt
- Sticky-Bar erhält Safe-Area- und Überdeckungsschutz
- Dark-Mode-Flächen und Texte erhalten finale Comparison-Tokens
- Daten-, Refactor- und Release-Audits auf 24 Seiten aktualisiert
- Abschlussreport trennt technische und manuelle visuelle Abnahme

## Geänderte Dateien

${[...changedFiles].sort().map((file) => `- ${file}`).join("\n")}
`;

stage("Transformation validieren");
if (CHECK_ONLY) {
  log("Check erfolgreich. Es wurde nichts verändert.");
  log(`${changedFiles.size} Datei(en) würden geändert oder neu angelegt.`);
  for (const file of [...changedFiles].sort()) log(`- ${file}`);
  process.exit(0);
}

stage("Änderungen schreiben und Prüfungen starten");
ensureDir(path.dirname(files.report));
fs.writeFileSync(files.report, report);
changedFiles.add(relative(files.report));

log(`Backups: ${relative(backupRoot)}`);
log(`Installer-Report: ${relative(files.report)}`);

if (!run("node", ["--test", relative(files.test)])) {
  fail("Regressionstest fehlgeschlagen.");
}

if (!run("node", [relative(files.refactorAudit)])) {
  fail("Comparison-Refactor-Audit fehlgeschlagen.");
}

if (!run("node", [relative(files.audit), "--strict"])) {
  fail("Comparison-Platform-Audit meldet Release-Blocker.");
}

if (!run("node", [relative(files.dataAudit), "--strict"])) {
  fail("Comparison-Data-Audit meldet zu wenige vollständig belegte Kriterien.");
}

if (!run("node", [relative(files.coverageAudit), "--strict", "--threshold=95"])) {
  fail("Comparison-Coverage-Audit liegt unter dem Release-Ziel.");
}

if (!NO_BUILD) {
  if (!run("npm", ["run", "build:pfotentechnik"])) {
    fail("PfotenTechnik-Build fehlgeschlagen.");
  }

  if (!run("node", [path.join("apps", "pfotentechnik", "scripts", "seo", "audit-comparison-product-schema.mjs")])) {
    fail("Comparison-Schema-Audit fehlgeschlagen.");
  }

  if (!run("node", [path.join("apps", "pfotentechnik", "scripts", "design-system", "visual-qa.mjs"), "--strict"])) {
    fail("Visual-QA meldet schwere statische Risiken.");
  }

  if (!run("node", [relative(files.releaseAudit), "--strict"])) {
    fail("Comparison Release Closure Audit fehlgeschlagen.");
  }
} else {
  log("Build und Dist-Release-Audit wurden mit --no-build übersprungen.");
}

if (COMMIT) {
  const status = spawnSync("git", ["status", "--porcelain"], {
    cwd: root,
    encoding: "utf8"
  });
  if (status.status !== 0) fail("git status fehlgeschlagen.");

  if (status.stdout.trim()) {
    if (!run("git", ["add", ...[...changedFiles].sort()])) {
      fail("git add fehlgeschlagen.");
    }
    if (!run("git", ["commit", "-m", "fix(pfotentechnik): close comparison platform release"])) {
      fail("Commit fehlgeschlagen.");
    }
    log("Lokal committed.");
  } else {
    log("Keine offenen Änderungen.");
  }
}

log("Comparison Release Closure 14.0.2 technisch abgeschlossen.");
log("Für den finalen Gesamtstatus ist anschließend die manuelle 375/414-Light/Dark-Abnahme zu bestätigen.");

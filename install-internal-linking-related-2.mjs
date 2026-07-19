#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(root, `.internal-linking-related-2-backup-${stamp}`);

const files = {
  internalLinks: "apps/pfotentechnik/src/domain/content/internalLinks.ts",
  related: "apps/pfotentechnik/src/domain/content/related.ts",
  page: "apps/pfotentechnik/src/pages/[slug].astro"
};

const read = (file) => {
  const absolute = path.join(root, file);
  if (!fs.existsSync(absolute)) throw new Error(`Datei nicht gefunden: ${file}`);
  return fs.readFileSync(absolute, "utf8");
};

const backupAndWrite = (file, before, after) => {
  if (before === after) {
    console.log(`Unverändert: ${file}`);
    return false;
  }
  const backup = path.join(backupRoot, file);
  fs.mkdirSync(path.dirname(backup), { recursive: true });
  fs.writeFileSync(backup, before, "utf8");
  fs.writeFileSync(path.join(root, file), after, "utf8");
  console.log(`Aktualisiert: ${file}`);
  return true;
};

const replaceOnce = (content, pattern, replacement, label) => {
  if (!pattern.test(content)) throw new Error(`Muster nicht gefunden: ${label}`);
  pattern.lastIndex = 0;
  return content.replace(pattern, replacement);
};

const updateInternalLinks = () => {
  const before = read(files.internalLinks);
  let after = before;

  if (!after.includes("const semanticKeywordGroups")) {
    const marker = /const uniqueStrings = \([\s\S]*?\n\s*\);\n/;
    after = replaceOnce(after, marker, (match) => `${match}

const semanticKeywordGroups = [
  ["futterautomat", "futterautomaten", "smarter futterautomat", "smarte futterautomaten", "smart feeder"],
  ["trinkbrunnen", "katzenbrunnen", "hundebrunnen", "haustierbrunnen", "wasserbrunnen"],
  ["gps tracker", "gps-tracker", "haustier tracker", "tierortung", "gps ortung"],
  ["nassfutter", "feuchtfutter"],
  ["trockenfutter", "trockennahrung"],
  ["katze", "katzen"],
  ["hund", "hunde"],
  ["mehrkatzenhaushalt", "mehrere katzen", "multi cat"],
  ["mehrhundehaushalt", "mehrere hunde", "multi dog"]
] as const;

const normalizeKeyword = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\\s+/g, " ")
    .trim();

const expandSemanticKeywords = (keywords: string[]) => {
  const expanded = new Set(keywords);

  for (const keyword of keywords) {
    const normalizedKeyword = normalizeKeyword(keyword);

    for (const group of semanticKeywordGroups) {
      const normalizedGroup = group.map(normalizeKeyword);

      if (
        normalizedGroup.some(
          (candidate) =>
            normalizedKeyword === candidate ||
            normalizedKeyword.includes(candidate) ||
            candidate.includes(normalizedKeyword)
        )
      ) {
        group.forEach((candidate) => expanded.add(candidate));
      }
    }
  }

  return uniqueStrings([...expanded]);
};
`, "semantische Keyword-Gruppen");
  }

  after = after.replace(
    /keywords:\s*uniqueStrings\(\[\s*\.\.\.linking\.keywords,([\s\S]*?)\]\),/,
    `keywords: expandSemanticKeywords([\n      ...linking.keywords,$1]),`
  );

  after = after.replace(
    /keywords:\s*buildTitleKeywords\(product\.data\.title\),/,
    `keywords: expandSemanticKeywords(\n    buildTitleKeywords(product.data.title)\n  ),`
  );

  after = after.replace(
    /keywords:\s*uniqueStrings\(\[\s*manufacturer\.data\.name,\s*manufacturer\.data\.title\s*\]\),/,
    `keywords: expandSemanticKeywords([\n    manufacturer.data.name,\n    manufacturer.data.title\n  ]),`
  );

  return backupAndWrite(files.internalLinks, before, after);
};

const relatedSource = `import type { HubContentEntry } from "./registry";
import { getAllContent } from "./registry";

type RelatedContentOptions = {
  currentSlug: string;
  tags: string[];
  sections?: string[];
  type?: HubContentEntry["type"];
  title?: string;
  description?: string;
  exclude?: string[];
  limit?: number;
};

type ScoredEntry = {
  entry: HubContentEntry;
  score: number;
};

const normalizeValue = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\\s+/g, " ")
    .trim();

const stopWords = new Set([
  "aber", "alle", "auch", "beim", "eine", "einem", "einen", "einer", "eines",
  "fuer", "haben", "ihre", "oder", "sind", "ueber", "unter", "vergleich",
  "ratgeber", "test", "tests", "welche", "welcher", "welches"
]);

const stemToken = (token: string) =>
  token.replace(/(ern|em|en|er|es|e|n|s)$/i, "").trim();

const tokenize = (values: Array<string | undefined>) =>
  new Set(
    values
      .flatMap((value) => normalizeValue(value ?? "").split(" "))
      .map(stemToken)
      .filter((token) => token.length >= 3 && !stopWords.has(token))
  );

const exactMatchCount = (sourceValues: string[], targetValues: string[]) => {
  const normalizedTargets = new Set(targetValues.map(normalizeValue));
  return sourceValues.reduce(
    (score, value) => normalizedTargets.has(normalizeValue(value)) ? score + 1 : score,
    0
  );
};

const tokenOverlapScore = (sourceTokens: Set<string>, targetTokens: Set<string>) => {
  if (sourceTokens.size === 0 || targetTokens.size === 0) return 0;
  const matches = [...sourceTokens].filter((token) => targetTokens.has(token)).length;
  const union = new Set([...sourceTokens, ...targetTokens]).size;
  return union > 0 ? matches / union : 0;
};

const getTypeBonus = (
  sourceType: HubContentEntry["type"] | undefined,
  targetType: HubContentEntry["type"]
) => {
  const matrix: Partial<Record<HubContentEntry["type"], Partial<Record<HubContentEntry["type"], number>>>> = {
    knowledge: { comparison: 4, knowledge: 3, product: 2, manufacturer: 1 },
    page: { comparison: 4, knowledge: 3, product: 2, manufacturer: 1 },
    comparison: { product: 4, knowledge: 3, manufacturer: 2, comparison: 1 },
    product: { comparison: 4, knowledge: 3, manufacturer: 2, product: 1 },
    manufacturer: { product: 4, comparison: 3, knowledge: 2, manufacturer: 1 }
  };
  return sourceType ? matrix[sourceType]?.[targetType] ?? 0 : 0;
};

const scoreEntry = (
  entry: HubContentEntry,
  options: RelatedContentOptions,
  sourceTokens: Set<string>
): ScoredEntry => {
  const tagMatches = exactMatchCount(entry.tags, options.tags);
  const sectionMatches = exactMatchCount(entry.sections, options.sections ?? []);
  const targetTokens = tokenize([
    entry.title,
    entry.description,
    entry.hubTitle,
    entry.hubDescription,
    ...entry.tags,
    ...entry.sections
  ]);
  const semanticScore = tokenOverlapScore(sourceTokens, targetTokens) * 20;
  const clusterBonus = sectionMatches > 0 ? 8 : 0;
  const cornerstoneBonus =
    (entry.featured ? 5 : 0) +
    Math.max(0, Math.min(3, (100 - entry.order) / 25));
  const score =
    tagMatches * 5 +
    sectionMatches * 7 +
    semanticScore +
    clusterBonus +
    getTypeBonus(options.type, entry.type) +
    cornerstoneBonus;
  return { entry, score };
};

const selectDiverseEntries = (entries: ScoredEntry[], limit: number) => {
  const selected: HubContentEntry[] = [];
  const typeCounts = new Map<HubContentEntry["type"], number>();
  const maxPerType = limit <= 3 ? 1 : 2;

  for (const candidate of entries) {
    if (selected.length >= limit) break;
    const currentTypeCount = typeCounts.get(candidate.entry.type) ?? 0;
    if (currentTypeCount >= maxPerType) continue;
    selected.push(candidate.entry);
    typeCounts.set(candidate.entry.type, currentTypeCount + 1);
  }

  if (selected.length < limit) {
    for (const candidate of entries) {
      if (selected.length >= limit) break;
      if (!selected.includes(candidate.entry)) selected.push(candidate.entry);
    }
  }

  return selected;
};

export const getRelatedContent = async ({
  currentSlug,
  tags,
  sections = [],
  type,
  title,
  description,
  exclude = [],
  limit = 4
}: RelatedContentOptions): Promise<HubContentEntry[]> => {
  const content = await getAllContent();
  const excludedSlugs = new Set([currentSlug, ...exclude].map(normalizeValue));
  const sourceTokens = tokenize([title, description, ...tags, ...sections]);

  const scoredEntries = content
    .filter((entry) => !excludedSlugs.has(normalizeValue(entry.slug)))
    .map((entry) => scoreEntry(entry, {
      currentSlug,
      tags,
      sections,
      type,
      title,
      description,
      exclude,
      limit
    }, sourceTokens))
    .filter(({ score }) => score >= 3)
    .sort((a, b) =>
      b.score - a.score ||
      Number(b.entry.featured) - Number(a.entry.featured) ||
      a.entry.order - b.entry.order ||
      a.entry.hubTitle.localeCompare(b.entry.hubTitle, "de")
    );

  return selectDiverseEntries(scoredEntries, limit);
};
`;

const updateRelated = () => {
  const before = read(files.related);
  return backupAndWrite(files.related, before, relatedSource);
};

const updatePage = () => {
  const before = read(files.page);
  let after = before;

  if (!after.includes("title: page.data.title,") || !after.includes("description: page.data.description,")) {
    after = replaceOnce(
      after,
      /const relatedEntries = await getRelatedContent\(\{\s*currentSlug: page\.data\.slug,/,
      `const relatedEntries = await getRelatedContent({\n  currentSlug: page.data.slug,\n  title: page.data.title,\n  description: page.data.description,`,
      "Related-Content-Quelltext"
    );
  }

  after = after.replace(/maxLinksPerPage=\{3\}/, "maxLinksPerPage={5}");
  return backupAndWrite(files.page, before, after);
};

try {
  const changed = [updateInternalLinks(), updateRelated(), updatePage()].filter(Boolean).length;
  console.log("");
  console.log(`Internal Linking 2.1 + Related Articles 2.0 installiert. ${changed} Datei(en) geändert.`);
  console.log(`Backups: ${path.relative(root, backupRoot)}`);
  console.log("");
  console.log("Jetzt prüfen:");
  console.log("  npm run build:pfotentechnik");
  console.log("  git diff --check");
  console.log("  git diff --stat");
} catch (error) {
  console.error("");
  console.error("Installation abgebrochen:");
  console.error(error instanceof Error ? error.message : error);
  console.error(`Backups: ${path.relative(root, backupRoot)}`);
  process.exit(1);
}

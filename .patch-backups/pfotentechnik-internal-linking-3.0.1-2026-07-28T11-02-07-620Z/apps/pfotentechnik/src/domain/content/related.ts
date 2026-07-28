import type { HubContentEntry } from "./registry";
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
    .replace(/\s+/g, " ")
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

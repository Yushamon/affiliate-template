import { getInternalLinkRuleWeight } from "@affiliate-core/linking/rules";
import type { InternalLinkGroup } from "@affiliate-core/linking/types";
import type { HubContentEntry } from "./registry";
import { getAllContent } from "./registry";
import { detectLinkTopics, normalizeTaxonomyTerm } from "./linkTaxonomy";
import { hasThematicProximity } from "./linkingSemantics";

type RelatedContentOptions = {
  currentSlug: string;
  tags: string[];
  sections?: string[];
  type?: HubContentEntry["type"];
  title?: string;
  description?: string;
  exclude?: string[];
  explicitRelations?: string[];
  limit?: number;
};

type ScoredEntry = { entry: HubContentEntry; score: number; evidence: string[] };

const normalizeValue = normalizeTaxonomyTerm;
const stopWords = new Set([
  "aber", "alle", "auch", "beim", "eine", "einem", "einen", "einer", "eines",
  "fuer", "haben", "ihre", "oder", "sind", "ueber", "unter", "vergleich",
  "ratgeber", "test", "tests", "welche", "welcher", "welches"
]);

const stemToken = (token: string) => token.replace(/(ern|em|en|er|es|e|n|s)$/i, "").trim();
const tokenize = (values: Array<string | undefined>) => new Set(
  values.flatMap((value) => normalizeValue(value ?? "").split(" "))
    .map(stemToken)
    .filter((token) => token.length >= 4 && !stopWords.has(token))
);
const exactMatches = (left: string[], right: string[]) => {
  const targets = new Set(right.map(normalizeValue));
  return left.filter((value) => targets.has(normalizeValue(value))).length;
};
const semanticSimilarity = (left: Set<string>, right: Set<string>) => {
  if (!left.size || !right.size) return 0;
  const intersection = [...left].filter((token) => right.has(token)).length;
  return intersection / new Set([...left, ...right]).size;
};
const toGroup = (type?: HubContentEntry["type"]): InternalLinkGroup =>
  type === "comparison" || type === "product" || type === "manufacturer"
    ? type
    : "knowledge";

const getEntryData = (entry: HubContentEntry) => entry.entry.data as Record<string, any>;
const getExplicitTargetSlugs = (entry: HubContentEntry) => {
  const data = getEntryData(entry);
  return [
    ...(Array.isArray(data.related?.include) ? data.related.include : []),
    ...(Array.isArray(data.relatedSlugs) ? data.relatedSlugs : []),
    ...(Array.isArray(data.comparisons) ? data.comparisons : []),
    ...(Array.isArray(data.productSlugs) ? data.productSlugs : []),
    ...(Array.isArray(data.alternatives) ? data.alternatives : [])
  ].map(String);
};

export const scoreRelatedEntry = (
  entry: HubContentEntry,
  options: RelatedContentOptions
): ScoredEntry | null => {
  const sourceValues = [
    options.title,
    options.description,
    ...options.tags,
    ...(options.sections ?? [])
  ];
  const targetValues = [
    entry.title,
    entry.description,
    entry.hubTitle,
    entry.hubDescription,
    ...entry.tags,
    ...entry.sections
  ];
  const sourceTopics = new Set(detectLinkTopics(sourceValues));
  const targetTopics = new Set(detectLinkTopics(targetValues));
  const sharedTopics = [...sourceTopics].filter((topic) => targetTopics.has(topic));
  const tagMatches = exactMatches(options.tags, entry.tags);
  const sectionMatches = exactMatches(options.sections ?? [], entry.sections);
  const semantic = semanticSimilarity(tokenize(sourceValues), tokenize(targetValues));
  const explicit = new Set([
    ...(options.explicitRelations ?? []),
    ...getExplicitTargetSlugs(entry)
  ].map(normalizeValue)).has(normalizeValue(entry.slug)) ||
    getExplicitTargetSlugs(entry).map(normalizeValue).includes(normalizeValue(options.currentSlug));

  const hasThematicEvidence = hasThematicProximity({
    explicit,
    sharedTopics,
    exactTagMatches: tagMatches,
    sharedHubs: sectionMatches,
    semanticSimilarity: semantic
  });
  if (!hasThematicEvidence) return null;

  const evidence = [
    ...(explicit ? ["explizite Relation"] : []),
    ...(sharedTopics.length ? [`Themen: ${sharedTopics.join(", ")}`] : []),
    ...(tagMatches ? [`${tagMatches} exakter Tag`] : []),
    ...(sectionMatches ? [`${sectionMatches} gemeinsamer Hub`] : []),
    ...(semantic >= 0.18 ? [`semantische Nähe ${semantic.toFixed(2)}`] : [])
  ];
  const funnel = getInternalLinkRuleWeight({
    sourceGroup: toGroup(options.type),
    targetGroup: toGroup(entry.type),
    targetPath: entry.href
  });
  const score =
    (explicit ? 100 : 0) +
    sharedTopics.length * 24 +
    tagMatches * 16 +
    sectionMatches * 18 +
    semantic * 40 +
    funnel / 8 +
    (entry.featured ? 2 : 0);
  return { entry, score, evidence };
};

const selectDiverseEntries = (entries: ScoredEntry[], limit: number) => {
  const selected: HubContentEntry[] = [];
  const typeCounts = new Map<HubContentEntry["type"], number>();
  const maxPerType = limit <= 3 ? 1 : 2;
  for (const candidate of entries) {
    if (selected.length >= limit) break;
    const count = typeCounts.get(candidate.entry.type) ?? 0;
    if (count >= maxPerType) continue;
    selected.push(candidate.entry);
    typeCounts.set(candidate.entry.type, count + 1);
  }
  for (const candidate of entries) {
    if (selected.length >= limit) break;
    if (!selected.includes(candidate.entry)) selected.push(candidate.entry);
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
  explicitRelations = [],
  limit = 4
}: RelatedContentOptions): Promise<HubContentEntry[]> => {
  const content = await getAllContent();
  const excluded = new Set([currentSlug, ...exclude].map(normalizeValue));
  const options = { currentSlug, tags, sections, type, title, description, exclude, explicitRelations, limit };
  const scored = content
    .filter((entry) => !excluded.has(normalizeValue(entry.slug)))
    .map((entry) => scoreRelatedEntry(entry, options))
    .filter((value): value is ScoredEntry => Boolean(value))
    .sort((a, b) =>
      b.score - a.score ||
      Number(b.entry.featured) - Number(a.entry.featured) ||
      a.entry.order - b.entry.order ||
      a.entry.href.localeCompare(b.entry.href, "de")
    );
  return selectDiverseEntries(scored, limit);
};

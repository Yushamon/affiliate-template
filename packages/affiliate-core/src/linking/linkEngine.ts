import {
  getDefaultPageLinkBudget,
  getInternalLinkGroupLimit,
  getInternalLinkRuleWeight
} from "./rules.ts";
import type {
  InternalLinkDefinition,
  InternalLinkGroup,
  InternalLinkIntent,
  LinkPriority
} from "./types.ts";

export interface LinkMatch {
  definition: InternalLinkDefinition;
  keyword: string;
  index: number;
  documentIndex: number;
  length: number;
  score: number;
  nodeIndex?: number;
  placementScore?: number;
  intentScore?: number;
  contextScore?: number;
}

export interface LinkBudgetState {
  limit: number;
  used: number;
  linkedTargets: Set<string>;
  occurrences: Map<string, number>;
  targetOccurrences?: Map<string, number>;
  groupCounts: Map<InternalLinkGroup, number>;
}

export interface LinkEngineOptions {
  maxLinksPerPage?: number;
  sourceGroup?: InternalLinkGroup;
  sourcePath?: string;
  sourceContext?: string;
  sourceContexts?: string[];
  sourceIntent?: InternalLinkIntent | InternalLinkIntent[];
  blockedAnchors?: Iterable<string>;
  linkBudget?: LinkBudgetState;
}

const priorityWeight: Record<LinkPriority, number> = {
  low: 10,
  normal: 20,
  high: 30
};

const intentPatterns: Record<InternalLinkIntent, RegExp> = {
  informational: /\b(?:wissen|erklaer|erklär|grundlage|einordn|ueberblick|überblick)\w*/iu,
  comparison: /\b(?:vergleich|vergleichen|beste\w*|testsieger|modelle|gegenueber|gegenüber)\w*/iu,
  "buying-guide": /\b(?:kaufberatung|kaufentscheidung|auswahl|welcher|welche|passend|empfehlung)\w*/iu,
  "how-to": /\b(?:wie|anleitung|reinigen|wechseln|befestigen|einrichten|verwenden|pflegen)\w*/iu,
  troubleshooting: /\b(?:problem|ursache|fehler|funktioniert nicht|hilfe|loesung|lösung|repar)\w*/iu,
  product: /\b(?:modell|produkt|geraet|gerät|testbericht|datenblatt)\w*/iu,
  manufacturer: /\b(?:hersteller|marke|anbieter|unternehmen)\w*/iu
};

const groupIntent: Partial<Record<InternalLinkGroup, InternalLinkIntent[]>> = {
  hub: ["informational"],
  knowledge: ["informational", "how-to", "troubleshooting", "buying-guide"],
  comparison: ["comparison", "buying-guide"],
  product: ["product"],
  manufacturer: ["manufacturer"]
};

export const normalizeLinkTerm = (value?: string) =>
  (value ?? "")
    .trim()
    .toLocaleLowerCase("de-DE")
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/ß/g, "ss")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizePath = (value?: string) => {
  const input = String(value ?? "").trim();
  if (!input || input.startsWith("#")) return input;
  if (/^(?:mailto:|tel:|sms:|javascript:|data:)/i.test(input)) return "";
  try {
    const url = new URL(input, "https://pfotentechnik.de/");
    if (!["pfotentechnik.de", "www.pfotentechnik.de"].includes(url.hostname.toLowerCase())) return "";
    const pathname = url.pathname.replace(/\/{2,}/g, "/");
    return pathname === "/" ? "/" : pathname.replace(/\/+$/, "") + "/";
  } catch {
    return "";
  }
};

const unique = (values: Array<string | undefined>) =>
  [...new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))];

export const getDefinitionAnchors = (definition: InternalLinkDefinition) =>
  unique([...(definition.anchorAliases ?? []), ...(definition.keywords ?? [])]);

const getDefinitionContexts = (definition: InternalLinkDefinition) =>
  unique([...(definition.contextTerms ?? []), ...(definition.contexts ?? []), ...(definition.topics ?? [])]);

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getKeywordPattern = (keyword: string) =>
  new RegExp(
    `(?<![\\p{L}\\p{N}])${escapeRegExp(keyword).replace(/\\ /g, "\\s+")}(?![\\p{L}\\p{N}])`,
    "giu"
  );

const tokenSet = (values: Array<string | undefined>) =>
  new Set(
    values
      .flatMap((value) => normalizeLinkTerm(value).split(" "))
      .filter((token) => token.length >= 3)
  );

const overlapCount = (left: Set<string>, right: Set<string>) => {
  let count = 0;
  for (const token of left) if (right.has(token)) count += 1;
  return count;
};

const getLocalContext = (text: string, index: number, length: number) => {
  const before = text.slice(0, index);
  const after = text.slice(index + length);
  const start = Math.max(
    before.lastIndexOf("\n\n") + 2,
    before.lastIndexOf(". ") + 2,
    before.lastIndexOf("! ") + 2,
    before.lastIndexOf("? ") + 2,
    index - 240
  );
  const endings = [after.indexOf("\n\n"), after.indexOf(". "), after.indexOf("! "), after.indexOf("? ")]
    .filter((value) => value >= 0);
  const end = Math.min(text.length, index + length + (endings.length ? Math.min(...endings) + 2 : 240));
  return text.slice(start, end);
};

const detectIntents = (value: string): Set<InternalLinkIntent> => {
  const intents = new Set<InternalLinkIntent>();
  for (const [intent, pattern] of Object.entries(intentPatterns) as Array<[InternalLinkIntent, RegExp]>) {
    if (pattern.test(value)) intents.add(intent);
  }
  return intents;
};

const getIntentScore = (
  definition: InternalLinkDefinition,
  localContext: string,
  options: LinkEngineOptions
) => {
  const localIntents = detectIntents(localContext);
  const explicitSourceIntents = Array.isArray(options.sourceIntent)
    ? options.sourceIntent
    : options.sourceIntent
      ? [options.sourceIntent]
      : [];
  explicitSourceIntents.forEach((intent) => localIntents.add(intent));

  const targetIntents = new Set<InternalLinkIntent>(groupIntent[definition.group ?? "knowledge"] ?? []);
  for (const term of definition.intentTerms ?? []) {
    const termIntents = detectIntents(term);
    termIntents.forEach((intent) => targetIntents.add(intent));
  }

  let score = 0;
  for (const intent of localIntents) {
    if (targetIntents.has(intent)) score += 55;
  }

  if (localIntents.has("comparison") && definition.group !== "comparison") score -= 25;
  if ((localIntents.has("how-to") || localIntents.has("troubleshooting")) && definition.group === "comparison") score -= 40;
  if (localIntents.has("product") && definition.group === "product") score += 35;
  if (localIntents.has("manufacturer") && definition.group === "manufacturer") score += 35;
  return score;
};

const getContextScore = (
  definition: InternalLinkDefinition,
  localContext: string,
  options: LinkEngineOptions
) => {
  const target = tokenSet(getDefinitionContexts(definition));
  if (target.size === 0) return 0;
  const source = tokenSet([options.sourceContext, ...(options.sourceContexts ?? []), localContext]);
  const overlap = overlapCount(target, source);
  return overlap > 0 ? Math.min(70, overlap * 18) : -35;
};

const isExclusiveAnchor = (definition: InternalLinkDefinition, keyword: string) => {
  const normalized = normalizeLinkTerm(keyword);
  return (definition.exclusiveAnchors ?? []).some(
    (anchor) => normalizeLinkTerm(anchor) === normalized
  );
};

const getSpecificityScore = (keyword: string) => {
  const tokens = normalizeLinkTerm(keyword).split(" ").filter(Boolean).length;
  return tokens * 1000 + Math.min(240, keyword.length * 3);
};

const getDefinitionScore = (
  definition: InternalLinkDefinition,
  keyword: string,
  localContext: string,
  options: LinkEngineOptions,
  documentIndex: number
) => {
  const ownership = isExclusiveAnchor(definition, keyword) ? 1000 : 0;
  const specificity = getSpecificityScore(keyword);
  const intent = getIntentScore(definition, localContext, options);
  const context = getContextScore(definition, localContext, options);
  const funnel = getInternalLinkRuleWeight({
    sourcePath: options.sourcePath,
    sourceGroup: options.sourceGroup,
    targetPath: definition.href,
    targetGroup: definition.group
  });
  const priority = priorityWeight[definition.priority ?? "normal"];
  const position = -Math.min(20, Math.floor(documentIndex / 800));
  return { score: ownership + specificity + intent + context + funnel + priority + position, intent, context };
};

export const createLinkBudgetState = (
  limit: number,
  seed?: Partial<LinkBudgetState>
): LinkBudgetState => ({
  limit,
  used: seed?.used ?? 0,
  linkedTargets: seed?.linkedTargets ?? new Set<string>(),
  occurrences: seed?.occurrences ?? new Map<string, number>(),
  targetOccurrences: seed?.targetOccurrences ?? new Map<string, number>(),
  groupCounts: seed?.groupCounts ?? new Map<InternalLinkGroup, number>()
});

const getBudget = (options: LinkEngineOptions) =>
  options.linkBudget ?? createLinkBudgetState(
    getDefaultPageLinkBudget(options.sourceGroup, options.maxLinksPerPage)
  );

export const findInternalLinkMatches = (
  text: string,
  definitions: InternalLinkDefinition[],
  options: LinkEngineOptions = {},
  offset = 0,
  nodeIndex?: number,
  placementScore = 0
): LinkMatch[] => {
  const matches: LinkMatch[] = [];
  const blocked = new Set(
    [...(options.blockedAnchors ?? [])].map(normalizeLinkTerm)
  );

  for (const definition of definitions) {
    if (normalizePath(options.sourcePath) === normalizePath(definition.href)) continue;

    const anchors = getDefinitionAnchors(definition)
      .filter((anchor) => !blocked.has(normalizeLinkTerm(anchor)))
      .sort((a, b) => b.length - a.length || a.localeCompare(b, "de"));

    for (const anchor of anchors) {
      const pattern = getKeywordPattern(anchor);
      for (const match of text.matchAll(pattern)) {
        if (typeof match.index !== "number") continue;
        const localContext = getLocalContext(text, match.index, match[0].length);
        const documentIndex = offset + match.index;
        const scoring = getDefinitionScore(
          definition,
          match[0],
          localContext,
          options,
          documentIndex
        );
        matches.push({
          definition,
          keyword: match[0],
          index: match.index,
          documentIndex,
          length: match[0].length,
          score: scoring.score + placementScore,
          nodeIndex,
          placementScore,
          intentScore: scoring.intent,
          contextScore: scoring.context
        });
      }
    }
  }

  return matches.sort((a, b) =>
    b.score - a.score ||
    b.length - a.length ||
    a.documentIndex - b.documentIndex ||
    a.definition.id.localeCompare(b.definition.id, "de")
  );
};

const overlaps = (candidate: LinkMatch, accepted: LinkMatch[]) =>
  accepted.some((match) => {
    if (candidate.nodeIndex !== match.nodeIndex) return false;
    const candidateEnd = candidate.index + candidate.length;
    const acceptedEnd = match.index + match.length;
    return candidate.index < acceptedEnd && candidateEnd > match.index;
  });

export const selectInternalLinkMatches = (
  matches: LinkMatch[],
  options: LinkEngineOptions = {}
): LinkMatch[] => {
  const budget = getBudget(options);
  const invocationLimit = Math.min(
    options.maxLinksPerPage ?? budget.limit,
    Math.max(0, budget.limit - budget.used)
  );
  const accepted: LinkMatch[] = [];
  const orderedMatches = [...matches].sort((a, b) =>
    b.score - a.score ||
    b.length - a.length ||
    a.definition.id.localeCompare(b.definition.id, "de") ||
    (a.nodeIndex ?? 0) - (b.nodeIndex ?? 0) ||
    a.index - b.index
  );

  for (const match of orderedMatches) {
    if (accepted.length >= invocationLimit || budget.used >= budget.limit) break;
    if (overlaps(match, accepted)) continue;

    const target = normalizePath(match.definition.href);
    const maximumOccurrences = match.definition.maxOccurrences ?? 1;
    const targetOccurrences = budget.targetOccurrences ?? new Map<string, number>();
    budget.targetOccurrences = targetOccurrences;
    const targetCount = targetOccurrences.get(target) ?? 0;
    const occurrences = budget.occurrences.get(match.definition.id) ?? 0;
    if (targetCount >= maximumOccurrences || occurrences >= maximumOccurrences) continue;

    const group = match.definition.group ?? "knowledge";
    const groupLimit = getInternalLinkGroupLimit({
      sourcePath: options.sourcePath,
      sourceGroup: options.sourceGroup,
      targetPath: match.definition.href,
      targetGroup: group
    });
    const groupCount = budget.groupCounts.get(group) ?? 0;
    if (groupLimit <= 0 || groupCount >= groupLimit) continue;

    accepted.push(match);
    budget.used += 1;
    budget.linkedTargets.add(target);
    targetOccurrences.set(target, targetCount + 1);
    budget.occurrences.set(match.definition.id, occurrences + 1);
    budget.groupCounts.set(group, groupCount + 1);
  }

  return accepted.sort((a, b) =>
    (a.nodeIndex ?? 0) - (b.nodeIndex ?? 0) || a.index - b.index
  );
};

const escapeAttribute = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

export const createInternalLinkHtml = (
  text: string,
  definitions: InternalLinkDefinition[],
  options: LinkEngineOptions = {}
) => {
  const matches = selectInternalLinkMatches(
    findInternalLinkMatches(text, definitions, options),
    options
  );
  if (matches.length === 0) return text;

  let cursor = 0;
  let result = "";
  for (const match of matches) {
    result += text.slice(cursor, match.index);
    const title = match.definition.title
      ? ` title="${escapeAttribute(match.definition.title)}"`
      : "";
    result += `<a href="${escapeAttribute(match.definition.href)}"${title}>${text.slice(
      match.index,
      match.index + match.length
    )}</a>`;
    cursor = match.index + match.length;
  }
  return result + text.slice(cursor);
};

export const simulateInternalLinks = (
  text: string,
  definitions: InternalLinkDefinition[],
  options: LinkEngineOptions = {}
) =>
  selectInternalLinkMatches(
    findInternalLinkMatches(text, definitions, options),
    options
  ).map((match) => ({
    href: normalizePath(match.definition.href),
    anchor: match.keyword,
    definitionId: match.definition.id,
    group: match.definition.group ?? "knowledge"
  }));

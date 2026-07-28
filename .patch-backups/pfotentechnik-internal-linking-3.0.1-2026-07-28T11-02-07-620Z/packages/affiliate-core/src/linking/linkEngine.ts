import type {
  InternalLinkDefinition,
  InternalLinkGroup,
  LinkPriority
} from "./types";

export interface LinkMatch {
  definition: InternalLinkDefinition;
  keyword: string;
  index: number;
  length: number;
  score: number;
}

export interface LinkEngineOptions {

  maxLinksPerPage?: number;

  ignoredTags?: string[];

  sourceGroup?: InternalLinkGroup;

  sourcePath?: string;

  sourceContext?: string;

  sourceContexts?: string[];

}

const priorityWeight: Record<LinkPriority, number> = {
  low: 1,
  normal: 2,
  high: 3
};

const funnelWeight: Record<
  InternalLinkGroup,
  Partial<Record<InternalLinkGroup, number>>
> = {
  knowledge: {
    comparison: 40,
    knowledge: 30,
    product: 20,
    manufacturer: 10
  },
  comparison: {
    product: 40,
    manufacturer: 25,
    knowledge: 15,
    comparison: 0
  },
  product: {
    manufacturer: 35,
    comparison: 30,
    knowledge: 20,
    product: 0
  },
  manufacturer: {
    product: 35,
    comparison: 25,
    knowledge: 20,
    manufacturer: 0
  }
};

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getPriorityWeight = (
  definition: InternalLinkDefinition
) => priorityWeight[definition.priority ?? "normal"] * 100;

const getFunnelWeight = (
  sourceGroup?: InternalLinkGroup,
  targetGroup?: InternalLinkGroup
) => {
  if (!sourceGroup || !targetGroup) {
    return 0;
  }

  return funnelWeight[sourceGroup]?.[targetGroup] ?? 0;
};

const getDefinitionScore = (
  definition: InternalLinkDefinition,
  options: LinkEngineOptions,
  keywordLength: number,
  index: number
) =>
  getPriorityWeight(definition) +
  getFunnelWeight(options.sourceGroup, definition.group) +
  Math.min(keywordLength, 40) -
  Math.min(Math.floor(index / 500), 20);
const normalizeContext = (value?: string) =>
  value
    ?.trim()
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenizeContext = (value?: string) =>
  new Set(
    (normalizeContext(value) ?? "")
      .split(" ")
      .filter((token) => token.length >= 3)
      .map((token) =>
        token.replace(/(en|er|e|n|s)$/i, "").trim()
      )
      .filter((token) => token.length >= 3)
  );

const contextsOverlap = (
  left?: string,
  right?: string
) => {
  const normalizedLeft = normalizeContext(left);
  const normalizedRight = normalizeContext(right);

  if (!normalizedLeft || !normalizedRight) {
    return false;
  }

  if (
    normalizedLeft === normalizedRight ||
    normalizedLeft.includes(normalizedRight) ||
    normalizedRight.includes(normalizedLeft)
  ) {
    return true;
  }

  const leftTokens = tokenizeContext(normalizedLeft);
  const rightTokens = tokenizeContext(normalizedRight);

  return [...leftTokens].some((token) =>
    rightTokens.has(token)
  );
};
const matchesSourceContext = (
  definition: InternalLinkDefinition,
  sourceContext?: string,
  sourceContexts: string[] = []
) => {
  if (!definition.contexts || definition.contexts.length === 0) {
    return true;
  }

  const normalizedSourceContexts = [sourceContext, ...sourceContexts]
    .map(normalizeContext)
    .filter((context): context is string => Boolean(context));

  if (normalizedSourceContexts.length === 0) {
    return false;
  }

  return definition.contexts.some((context) =>
    normalizedSourceContexts.some((source) =>
      contextsOverlap(context, source)
    )
  );
};

const normalizePath = (path?: string) => {
  if (!path) {
    return "";
  }

  const normalized = path.split("#")[0].split("?")[0];
  const withLeadingSlash = normalized.startsWith("/")
    ? normalized
    : `/${normalized}`;

  return withLeadingSlash.endsWith("/")
    ? withLeadingSlash
    : `${withLeadingSlash}/`;
};

const getKeywordPattern = (keyword: string) =>
  new RegExp(
    `(?<![\\p{L}\\p{N}])${escapeRegExp(keyword)}(?![\\p{L}\\p{N}])`,
    "giu"
  );

export const findInternalLinkMatches = (
  text: string,
  definitions: InternalLinkDefinition[],
  options: LinkEngineOptions = {}
): LinkMatch[] => {
  const matches: LinkMatch[] = [];
  for (const definition of definitions) {
    if (
      normalizePath(options.sourcePath) &&
      normalizePath(options.sourcePath) === normalizePath(definition.href)
    ) {
      continue;
    }

    if (!matchesSourceContext(
      definition,
      options.sourceContext,
      options.sourceContexts
    )) {
      continue;
    }

    const sortedKeywords = [...definition.keywords]
      .filter(Boolean)
      .sort((a, b) => b.length - a.length);

    for (const keyword of sortedKeywords) {
      const pattern = getKeywordPattern(keyword);

      for (const match of text.matchAll(pattern)) {
        if (typeof match.index !== "number") {
          continue;
        }

        matches.push({
          definition,
          keyword: match[0],
          index: match.index,
          length: match[0].length,
          score: getDefinitionScore(
            definition,
            options,
            match[0].length,
            match.index
          )
        });
      }
    }
  }

  return matches.sort((a, b) => {
    const scoreDifference = b.score - a.score;

    if (scoreDifference !== 0) {
      return scoreDifference;
    }

    const lengthDifference = b.length - a.length;

    if (lengthDifference !== 0) {
      return lengthDifference;
    }

    return a.index - b.index;
  });
};

const overlaps = (
  candidate: LinkMatch,
  accepted: LinkMatch[]
) => {
  const candidateStart = candidate.index;
  const candidateEnd = candidate.index + candidate.length;

  return accepted.some((match) => {
    const acceptedStart = match.index;
    const acceptedEnd = match.index + match.length;

    return (
      candidateStart < acceptedEnd &&
      candidateEnd > acceptedStart
    );
  });
};

export const selectInternalLinkMatches = (
  matches: LinkMatch[],
  options: LinkEngineOptions = {}
): LinkMatch[] => {
  const maxLinksPerPage = options.maxLinksPerPage ?? 12;
  const accepted: LinkMatch[] = [];
  const occurrences = new Map<string, number>();
  const linkedTargets = new Set<string>();
  for (const match of matches) {
    if (accepted.length >= maxLinksPerPage) {
      break;
    }

    if (overlaps(match, accepted)) {
      continue;
    }

    if (linkedTargets.has(match.definition.href)) {
      continue;
    }
    const currentOccurrences =
      occurrences.get(match.definition.id) ?? 0;

    const maxOccurrences =
      match.definition.maxOccurrences ?? 1;

    if (currentOccurrences >= maxOccurrences) {
      continue;
    }

    accepted.push(match);
    linkedTargets.add(match.definition.href);
    occurrences.set(
      match.definition.id,
      currentOccurrences + 1
    );
  }

  return accepted.sort((a, b) => a.index - b.index);
};

export const createInternalLinkHtml = (
  text: string,
  definitions: InternalLinkDefinition[],
  options: LinkEngineOptions = {}
) => {
  const matches = selectInternalLinkMatches(
    findInternalLinkMatches(text, definitions, options),
    options
  );

  if (matches.length === 0) {
    return text;
  }

  let cursor = 0;
  let result = "";

  for (const match of matches) {
    result += text.slice(cursor, match.index);

    const titleAttribute = match.definition.title
      ? ` title="${match.definition.title.replace(/"/g, "&quot;")}"`
      : "";

    result += `<a href="${match.definition.href}"${titleAttribute}>${text.slice(
      match.index,
      match.index + match.length
    )}</a>`;

    cursor = match.index + match.length;
  }

  result += text.slice(cursor);

  return result;
};

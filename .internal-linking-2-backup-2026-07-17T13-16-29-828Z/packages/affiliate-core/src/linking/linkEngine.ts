import type {
  InternalLinkDefinition,
  LinkPriority
} from "./types";

export interface LinkMatch {
  definition: InternalLinkDefinition;
  keyword: string;
  index: number;
  length: number;
}

export interface LinkEngineOptions {

  maxLinksPerPage?: number;

  ignoredTags?: string[];

  sourceGroup?: string;

  sourcePath?: string;

  sourceContext?: string;

  sourceContexts?: string[];

}

const priorityWeight: Record<LinkPriority, number> = {
  low: 1,
  normal: 2,
  high: 3
};

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getPriorityWeight = (
  definition: InternalLinkDefinition
) => priorityWeight[definition.priority ?? "normal"];
const normalizeContext = (value?: string) =>

  value?.trim().toLowerCase();
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

  return definition.contexts.some(
    (context) => {
      const normalizedContext = normalizeContext(context);

      return normalizedContext
        ? normalizedSourceContexts.includes(normalizedContext)
        : false;
    }
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
          length: match[0].length
        });
      }
    }
  }

  return matches.sort((a, b) => {
    const priorityDifference =
      getPriorityWeight(b.definition) -
      getPriorityWeight(a.definition);

    if (priorityDifference !== 0) {
      return priorityDifference;
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

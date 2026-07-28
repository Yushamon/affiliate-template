import type {
  InternalLinkGroup,
  InternalLinkIntent,
  LinkPriority
} from "@affiliate-core/linking/types";
import {
  BLOCKED_ANCHORS,
  BLOCKED_ANCHOR_SET,
  LINK_TAXONOMY,
  detectTaxonomyIntents,
  detectTaxonomyTopics,
  getCornerstoneEntries,
  isBlockedAnchor,
  normalizeTaxonomyPath,
  normalizeTaxonomyTerm,
  sanitizeAnchorAliases,
  taxonomyEntriesForHref
} from "./linkTaxonomy.data.mjs";

export type LinkTopic =
  | "futterautomaten"
  | "trinkbrunnen"
  | "gps-tracker"
  | "haustiertechnik"
  | "katzenklappen"
  | "haustierkameras"
  | "katzentoiletten"
  | "gesundheit"
  | "ernaehrung"
  | "nassfutter"
  | "abo"
  | "hunde"
  | "katzen";

export type LinkTaxonomyEntry = {
  id: string;
  href: string | null;
  title: string;
  targetGroup: InternalLinkGroup;
  topics: LinkTopic[];
  anchorAliases: string[];
  contextTerms: string[];
  intentTerms?: string[];
  exclusiveAnchors?: string[];
  priority: LinkPriority;
  cornerstone?: boolean;
};

export const linkTaxonomy = LINK_TAXONOMY as LinkTaxonomyEntry[];
export const blockedAnchors = BLOCKED_ANCHORS as string[];
export const blockedAnchorSet = BLOCKED_ANCHOR_SET as Set<string>;
export {
  detectTaxonomyTopics,
  getCornerstoneEntries,
  isBlockedAnchor,
  normalizeTaxonomyPath,
  normalizeTaxonomyTerm,
  sanitizeAnchorAliases,
  taxonomyEntriesForHref
};

export const detectLinkTopics = (values: unknown[]): LinkTopic[] =>
  detectTaxonomyTopics(values.map((value) => String(value ?? ""))) as LinkTopic[];

export const detectLinkIntents = (values: unknown[]): InternalLinkIntent[] =>
  detectTaxonomyIntents(values.map((value) => String(value ?? ""))) as InternalLinkIntent[];

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getEffectiveTaxonomyLinks = ({
  text,
  sourceRoute,
  sourceValues = [],
  limit = 8
}: {
  text: string;
  sourceRoute: string;
  sourceValues?: unknown[];
  limit?: number;
}) => {
  const sourceTopics = new Set(detectLinkTopics([text, ...sourceValues]));
  return linkTaxonomy
    .filter((entry) => entry.href && normalizeTaxonomyPath(entry.href) !== normalizeTaxonomyPath(sourceRoute))
    .flatMap((entry) => entry.anchorAliases.map((anchor) => ({ entry, anchor })))
    .filter(({ anchor }) => !isBlockedAnchor(anchor))
    .map(({ entry, anchor }) => {
      const pattern = new RegExp(
        `(?<![\\p{L}\\p{N}])${escapeRegExp(anchor).replace(/\\ /g, "\\s+")}(?![\\p{L}\\p{N}])`,
        "iu"
      );
      const match = pattern.exec(text);
      const sharedTopics = entry.topics.filter((topic) => sourceTopics.has(topic));
      return match ? {
        href: normalizeTaxonomyPath(entry.href ?? ""),
        anchor: match[0],
        score: (entry.exclusiveAnchors?.some((value) => normalizeTaxonomyTerm(value) === normalizeTaxonomyTerm(anchor)) ? 5000 : 0) +
          normalizeTaxonomyTerm(anchor).split(" ").length * 1000 + sharedTopics.length * 100 + anchor.length
      } : null;
    })
    .filter((value): value is { href: string; anchor: string; score: number } => Boolean(value))
    .sort((a, b) => b.score - a.score || a.href.localeCompare(b.href, "de"))
    .filter((item, index, items) => items.findIndex((candidate) => candidate.href === item.href) === index)
    .slice(0, limit);
};

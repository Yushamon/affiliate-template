import type {
  HubContentEntry
} from "./registry";

import {
  getAllContent,
  sortHubEntries
} from "./registry";

type RelatedContentOptions = {
  currentSlug: string;
  tags: string[];
  sections?: string[];
  type?: HubContentEntry["type"];
  exclude?: string[];
  limit?: number;
};

const normalizeValue = (
  value: string
) =>
  value
    .trim()
    .toLowerCase();

const countMatches = (
  sourceValues: string[],
  targetValues: string[]
) => {
  const normalizedTargets =
    new Set(
      targetValues.map(
        normalizeValue
      )
    );

  return sourceValues.reduce(
    (score, value) =>
      normalizedTargets.has(
        normalizeValue(value)
      )
        ? score + 1
        : score,
    0
  );
};

export const getRelatedContent =
  async ({
    currentSlug,
    tags,
    sections = [],
    type,
    exclude = [],
    limit = 4
  }: RelatedContentOptions): Promise<
    HubContentEntry[]
  > => {
    const content =
      await getAllContent();

    const excludedSlugs =
      new Set(
        [
          currentSlug,
          ...exclude
        ].map(
          normalizeValue
        )
      );

    const scoredEntries =
      content
        .filter(
          (entry) =>
            !excludedSlugs.has(
              normalizeValue(
                entry.slug
              )
            )
        )
        .map((entry) => {
          const tagMatches =
            countMatches(
              entry.tags,
              tags
            );

          const sectionMatches =
            countMatches(
              entry.sections,
              sections
            );

          const typeBonus =
            type &&
            entry.type === type
              ? 1
              : 0;

          const score =
            tagMatches * 3 +
            sectionMatches * 2 +
            typeBonus;

          return {
            entry,
            score
          };
        })
        .filter(
          ({ score }) =>
            score > 0
        )
        .sort(
          (a, b) =>
            b.score - a.score
        )
        .map(
          ({ entry }) =>
            entry
        );

    return sortHubEntries(
      scoredEntries
    ).slice(
      0,
      limit
    );
  };
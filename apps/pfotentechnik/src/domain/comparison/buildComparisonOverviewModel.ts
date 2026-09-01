import type { HubContentEntry } from "../content/registry";
import {
  categoryDecisionRouting,
  getCategoryRouteForComparison,
  type CategoryDecisionRoutingSlug
} from "../category/categoryDecisionRouting";

export type ComparisonOverviewItem = {
  slug: string;
  href: string;
  title: string;
  description: string;
  icon: string;
  categoryLabel: string;
  categoryHref: string;
};

export type ComparisonOverviewArea = ComparisonOverviewItem & {
  categorySlug: CategoryDecisionRoutingSlug;
  question: string;
  reason: string;
};

const routeEntries = Object.entries(categoryDecisionRouting) as [
  CategoryDecisionRoutingSlug,
  (typeof categoryDecisionRouting)[CategoryDecisionRoutingSlug]
][];

export const buildComparisonOverviewModel = (comparisons: HubContentEntry[]) => {
  const comparisonBySlug = new Map(
    comparisons.map((comparison) => [comparison.slug, comparison])
  );
  const routeByCategory = new Map(routeEntries);

  const toItem = (comparison: HubContentEntry): ComparisonOverviewItem | undefined => {
    const category = getCategoryRouteForComparison(comparison.slug);
    if (!category) return undefined;

    return {
      slug: comparison.slug,
      href: comparison.href,
      title: comparison.hubTitle,
      description: comparison.hubDescription,
      icon: comparison.icon ?? "↔",
      categoryLabel: category.categoryLabel,
      categoryHref: category.categoryHref
    };
  };

  const areas = routeEntries
    .sort(([, a], [, b]) => a.overview.rank - b.overview.rank)
    .flatMap(([categorySlug, route]) => {
      const comparison = comparisonBySlug.get(route.primaryComparison.slug);
      const item = comparison && toItem(comparison);
      return item ? [{
        ...item,
        categorySlug,
        question: route.primaryComparison.question,
        reason: route.primaryComparison.why
      }] : [];
    });

  const primaryAreas = areas.filter(({ categorySlug }) =>
    routeByCategory.get(categorySlug)?.overview.tier === "primary"
  );
  const additionalAreas = areas.filter(({ categorySlug }) =>
    routeByCategory.get(categorySlug)?.overview.tier !== "primary"
  );
  const primarySlugs = new Set(areas.map((area) => area.slug));

  const specialistComparisons = comparisons
    .filter((comparison) => !primarySlugs.has(comparison.slug))
    .flatMap((comparison) => {
      const item = toItem(comparison);
      const category = getCategoryRouteForComparison(comparison.slug);
      if (!item || !category) return [];

      const route = routeByCategory.get(category.categorySlug);
      const secondaryRank = route?.secondaryComparisons.findIndex(
        (candidate) => candidate.slug === comparison.slug
      ) ?? -1;

      return [{
        ...item,
        categoryRank: route?.overview.rank ?? Number.MAX_SAFE_INTEGER,
        secondaryRank: secondaryRank < 0 ? Number.MAX_SAFE_INTEGER : secondaryRank,
        editorialRank: comparison.order
      }];
    })
    .sort((a, b) =>
      a.categoryRank - b.categoryRank ||
      a.secondaryRank - b.secondaryRank ||
      a.editorialRank - b.editorialRank ||
      a.title.localeCompare(b.title, "de")
    );

  return {
    primaryAreas,
    additionalAreas,
    specialistComparisons
  };
};

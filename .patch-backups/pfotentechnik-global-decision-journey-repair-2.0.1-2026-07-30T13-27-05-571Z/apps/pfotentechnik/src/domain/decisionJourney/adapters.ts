import type { JourneyEntry } from "./registry";

function routeFor(type: JourneyEntry["type"], slug: string): string {
  if (type === "comparison") return `/vergleiche/${slug}/`;
  if (type === "product") return `/produkt/${slug}/`;
  return `/${slug}/`;
}

function explicitJourney(data: any): JourneyEntry["explicit"] | undefined {
  const value = data?.decisionJourney;
  if (!value || typeof value !== "object") return undefined;

  return {
    stage: value.stage,
    intent: value.intent,
    primaryQuestion: value.primaryQuestion,
    next: Array.isArray(value.next) ? value.next : [],
    fallback: Array.isArray(value.fallback) ? value.fallback : [],
  };
}

export function toJourneyEntries({
  pages,
  comparisons,
  products,
}: {
  pages: any[];
  comparisons: any[];
  products: any[];
}): JourneyEntry[] {
  return [
    ...pages.map((entry) => ({
      route: routeFor("page", entry.data.slug),
      type: "page" as const,
      slug: entry.data.slug,
      title: entry.data.title,
      description: entry.data.description,
      cluster: entry.data.decisionJourney?.cluster,
      relatedTags: entry.data.tags,
      explicit: explicitJourney(entry.data),
    })),
    ...comparisons.map((entry) => ({
      route: routeFor("comparison", entry.data.slug),
      type: "comparison" as const,
      slug: entry.data.slug,
      title: entry.data.title,
      description: entry.data.description,
      cluster:
        entry.data.decisionJourney?.cluster ??
        entry.data.category?.key,
      categoryKey: entry.data.category?.key,
      score: entry.data.score,
      relatedTags: entry.data.tags,
      explicit: explicitJourney(entry.data),
    })),
    ...products.map((entry) => ({
      route: routeFor("product", entry.data.slug),
      type: "product" as const,
      slug: entry.data.slug,
      title: entry.data.title,
      description: entry.data.description,
      cluster:
        entry.data.decisionJourney?.cluster ??
        entry.data.category?.key,
      categoryKey: entry.data.category?.key,
      manufacturer: entry.data.manufacturer?.name,
      score: entry.data.score ?? entry.data.rating,
      relatedTags: entry.data.tags,
      explicit: explicitJourney(entry.data),
    })),
  ];
}

export function findJourneyEntry(
  entries: JourneyEntry[],
  type: JourneyEntry["type"],
  slug: string,
): JourneyEntry {
  const route = routeFor(type, slug);
  const entry = entries.find((candidate) => candidate.route === route);
  if (!entry) throw new Error(`Decision-Journey-Eintrag fehlt: ${route}`);
  return entry;
}

import type { CollectionEntry } from "astro:content";
import type { InternalLinkDefinition } from "@affiliate-core/linking/types";

type PageEntry = CollectionEntry<"pages">;

const normalizePath = (path: string) => {
  const withLeadingSlash = path.startsWith("/")
    ? path
    : `/${path}`;

  return withLeadingSlash.endsWith("/")
    ? withLeadingSlash
    : `${withLeadingSlash}/`;
};

export const getPageInternalLinkDefinitions = (
  pages: PageEntry[]
): InternalLinkDefinition[] =>
  pages.flatMap((page) => {
    const linking = page.data.linking;

    if (!linking) {
      return [];
    }

    return [{
      id: `page:${page.data.slug}`,
      keywords: linking.keywords,
      href: normalizePath(page.data.slug),
      title: page.data.title,
      group: "knowledge",
      priority: linking.priority,
      maxOccurrences: linking.maxOccurrences,
      contexts: linking.contexts.length > 0
        ? linking.contexts
        : [page.data.linkContext ?? page.data.category],
      preventNestedLinks: true
    }];
  });

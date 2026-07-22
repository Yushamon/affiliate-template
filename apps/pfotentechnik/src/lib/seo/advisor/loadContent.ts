import { getCollection } from "astro:content";
import contentGraphJson from "../../../generated/content-graph.json";
import { normalizeSeoPath } from "../loadDashboard";
import type { ContentDocument, ContentGraphData } from "./types";

type CollectionName = ContentDocument["collection"];
type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const stringValue = (value: unknown): string => typeof value === "string" ? value : "";

const stringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

const routeFor = (collection: CollectionName, slug: string): string => {
  if (collection === "products") return `/produkt/${slug}/`;
  if (collection === "manufacturers") return `/hersteller/${slug}/`;
  if (collection === "comparisons") return `/vergleiche/${slug}/`;
  return `/${slug}/`;
};

const pageTypeFor = (collection: CollectionName, route: string): string => {
  if (collection === "products") return "Produkt";
  if (collection === "manufacturers") return "Hersteller";
  if (collection === "comparisons") return "Vergleich";
  if (["/smarte-futterautomaten/", "/trinkbrunnen/", "/gps-tracker/", "/smarte-haustiertechnik/"].includes(route)) return "Cornerstone";
  return "Ratgeber";
};

const filePathFor = (collection: CollectionName, id: string): string =>
  `apps/pfotentechnik/src/content/${collection}/${id.replace(/\\/g, "/")}${/\.(md|mdx)$/i.test(id) ? "" : ".md"}`;

export const loadAdvisorContent = async (): Promise<{
  documents: ContentDocument[];
  graph: ContentGraphData;
}> => {
  const graph = contentGraphJson as ContentGraphData;
  const graphByRoute = new Map(graph.nodes.map((node) => [normalizeSeoPath(node.route), node]));
  const documents: ContentDocument[] = [];
  const collectionNames: CollectionName[] = ["pages", "products", "manufacturers", "comparisons"];

  for (const collection of collectionNames) {
    const entries = await getCollection(collection);
    for (const entry of entries) {
      const data = entry.data as UnknownRecord;
      const slug = stringValue(data.slug) || entry.id.replace(/\.(md|mdx)$/i, "");
      const route = routeFor(collection, slug);
      const graphNode = graphByRoute.get(normalizeSeoPath(route));
      const author = isRecord(data.author) ? data.author : undefined;
      const editorial = isRecord(data.editorial) ? data.editorial : undefined;
      const methodology = isRecord(data.methodology) ? data.methodology : undefined;
      const sources = Array.isArray(data.sources) ? data.sources : [];
      const contentGraph = isRecord(data.contentGraph) ? data.contentGraph : undefined;
      const category = isRecord(data.category) ? data.category : undefined;
      const body = stringValue(entry.body);

      documents.push({
        id: `${collection}:${slug}`,
        collection,
        route,
        slug,
        title: stringValue(data.title) || slug,
        description: stringValue(data.description),
        filePath: filePathFor(collection, entry.id),
        pageType: pageTypeFor(collection, route),
        cluster: graphNode?.cluster || stringValue(contentGraph?.cluster) || stringValue(category?.key) || stringValue(data.category),
        topics: graphNode?.topics ?? [...stringArray(contentGraph?.topics), ...stringArray(data.tags)],
        body,
        authorPresent: Boolean(stringValue(author?.name)),
        authorVisible: collection !== "comparisons",
        publishedAt: stringValue(data.publishedAt),
        updatedAt: stringValue(data.updatedAt),
        hasEditorialReview: Boolean(editorial || data.review || data.testStatus === "editorial-review"),
        hasMethodology: Boolean(methodology || /methodik|bewertungsgrundlage|so bewerten/i.test(body)),
        hasProductDataSource: sources.length > 0 || /hersteller|produktdatenquelle|datenquelle/i.test(body),
      });
    }
  }

  return { documents, graph };
};

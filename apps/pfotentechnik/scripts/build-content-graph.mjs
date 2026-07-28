#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {
  LINK_TAXONOMY,
  detectTaxonomyTopics,
  getCornerstoneEntries,
  normalizeTaxonomyPath,
  normalizeTaxonomyTerm
} from "../src/domain/content/linkTaxonomy.data.mjs";
import { asStringArray, normalizeSlug, parseFrontmatter, walkFiles } from "./internal-linking-utils.mjs";

const cwd = process.cwd();
const appRoot = fs.existsSync(path.join(cwd, "src/content")) ? cwd : path.join(cwd, "apps/pfotentechnik");
const strict = process.argv.includes("--strict");
const repoRoot = fs.existsSync(path.join(cwd, "apps/pfotentechnik")) ? cwd : path.resolve(appRoot, "../..");

const sources = [
  { collection: "pages", dir: "src/content/pages", type: "page", route: (slug) => `/${slug}/` },
  { collection: "products", dir: "src/content/products", type: "product", route: (slug) => `/produkt/${slug}/` },
  { collection: "comparisons", dir: "src/content/comparisons", type: "comparison", route: (slug) => `/vergleiche/${slug}/` },
  { collection: "manufacturers", dir: "src/content/manufacturers", type: "manufacturer", route: (slug) => `/hersteller/${slug}/` }
];
const cornerstoneRoutes = new Set(getCornerstoneEntries().map((entry) => normalizeTaxonomyPath(entry.href)));
const warnings = [];
const nodes = [];

const objectValue = (value) => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const relationValues = (data) => [
  ...asStringArray(data.related?.include),
  ...asStringArray(data.relatedSlugs),
  ...asStringArray(data.comparisons),
  ...asStringArray(data.productSlugs),
  ...asStringArray(data.alternatives),
  ...asStringArray(data.featuredProductSlugs)
];

for (const source of sources) {
  const directory = path.join(appRoot, source.dir);
  for (const file of walkFiles(directory).filter((item) => /\.(md|mdx)$/i.test(item))) {
    try {
      const raw = fs.readFileSync(file, "utf8");
      const { data, body } = parseFrontmatter(raw);
      const slug = normalizeSlug(data.slug || path.basename(file, path.extname(file)));
      if (!slug) continue;
      const route = normalizeTaxonomyPath(data.productUrl || data.route || source.route(slug));
      const contentPlatform = objectValue(data.contentPlatform);
      const contentGraph = objectValue(data.contentGraph);
      const linking = objectValue(data.linking);
      const hub = objectValue(data.hub);
      const category = typeof data.category === "object" ? data.category : {};
      const tags = asStringArray(data.tags);
      const sections = asStringArray(hub.sections);
      const topics = [...new Set([
        ...asStringArray(contentGraph.topics),
        ...tags,
        ...sections,
        ...detectTaxonomyTopics([
          data.title, data.name, data.description, contentPlatform.cluster,
          category.key, category.label, data.category, ...tags, ...sections,
          ...asStringArray(linking.contexts)
        ])
      ].map(normalizeTaxonomyTerm).filter(Boolean))];
      const cluster = normalizeTaxonomyTerm(
        contentGraph.cluster || contentPlatform.cluster || category.key || data.category || topics[0] || ""
      );
      const aliases = [
        ...asStringArray(linking.keywords),
        ...asStringArray(data.aliases),
        ...LINK_TAXONOMY.filter((entry) => entry.href && normalizeTaxonomyPath(entry.href) === route)
          .flatMap((entry) => entry.anchorAliases)
      ];
      nodes.push({
        id: `${source.type}:${slug}`,
        collection: source.collection,
        slug,
        route,
        title: String(data.title || data.name || slug.replace(/-/g, " ")),
        description: String(data.description || data.summary || ""),
        type: source.type,
        cluster,
        topics,
        tags: tags.map(normalizeTaxonomyTerm).filter(Boolean),
        sections: sections.map(normalizeTaxonomyTerm).filter(Boolean),
        aliases: [...new Set(aliases)],
        priority: Number(contentGraph.priority || data.hubPriority || hub.order || 50),
        cornerstone: cornerstoneRoutes.has(route) || Boolean(contentGraph.cornerstone || data.cornerstone),
        explicitRelations: relationValues(data).map(normalizeSlug).filter(Boolean),
        sourceFile: path.relative(repoRoot, file).replace(/\\/g, "/"),
        body
      });
    } catch (error) {
      warnings.push(`${path.relative(repoRoot, file)}: ${error.message}`);
    }
  }
}

const bySlug = new Map(nodes.map((node) => [node.slug, node]));
const edges = [];
const overlap = (left = [], right = []) => {
  const set = new Set(left);
  return right.filter((value) => set.has(value)).length;
};
for (const source of nodes) {
  for (const relation of source.explicitRelations) {
    const target = bySlug.get(relation);
    if (!target || target.id === source.id) continue;
    edges.push({ source: source.id, target: target.id, type: "explicit", score: 100, explicit: true, automatic: false });
  }
  for (const target of nodes) {
    if (target.id === source.id) continue;
    const topicOverlap = overlap(source.topics, target.topics);
    const tagOverlap = overlap(source.tags, target.tags);
    const sectionOverlap = overlap(source.sections, target.sections);
    let score = topicOverlap * 22 + tagOverlap * 16 + sectionOverlap * 18;
    if (source.cluster && source.cluster === target.cluster) score += 30;
    if (target.cornerstone && source.cluster && (target.topics.includes(source.cluster) || target.cluster === source.cluster)) score += 12;
    if (score < 25) continue;
    edges.push({
      source: source.id,
      target: target.id,
      type: source.cluster && source.cluster === target.cluster ? "cluster" : "semantic",
      score: Math.min(100, score),
      explicit: false,
      automatic: true
    });
  }
}

const uniqueEdges = [...new Map(edges.map((edge) => [`${edge.source}|${edge.target}|${edge.explicit}`, edge])).values()]
  .sort((a, b) => a.source.localeCompare(b.source) || Number(b.explicit) - Number(a.explicit) || b.score - a.score || a.target.localeCompare(b.target));
const output = {
  version: 2,
  generatedAt: new Date().toISOString(),
  taxonomyVersion: 3,
  nodes: nodes.map(({ body, explicitRelations, ...node }) => node).sort((a, b) => a.id.localeCompare(b.id)),
  edges: uniqueEdges
};
const outputPath = path.join(appRoot, "src/generated/content-graph.json");
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(`Content Graph: ${output.nodes.length} Nodes, ${output.edges.length} Edges.`);
if (warnings.length) warnings.forEach((warning) => console.warn(`WARN ${warning}`));
if (strict && (warnings.length || output.nodes.length === 0 || output.nodes.some((node) => node.route.startsWith("/produkte/")))) process.exit(1);

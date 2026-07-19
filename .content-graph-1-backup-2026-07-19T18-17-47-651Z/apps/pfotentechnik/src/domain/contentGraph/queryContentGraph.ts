import type { ContentGraphData, ContentGraphEdgeType, ContentGraphNode } from './types';
export type ContentGraphQuery = { types?: ContentGraphNode['type'][]; edgeTypes?: ContentGraphEdgeType[]; limit?: number; minScore?: number; };
export const queryContentGraph = (graph:ContentGraphData, sourceId:string, query:ContentGraphQuery = {}) => {
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const seen = new Set<string>();
  return graph.edges
    .filter((edge) => edge.source === sourceId)
    .filter((edge) => !query.edgeTypes?.length || query.edgeTypes.includes(edge.type))
    .filter((edge) => edge.score >= (query.minScore ?? 0))
    .map((edge) => ({ edge, node: nodeById.get(edge.target) }))
    .filter((item): item is { edge: typeof item.edge; node: ContentGraphNode } => Boolean(item.node))
    .filter((item) => !query.types?.length || query.types.includes(item.node.type))
    .sort((a,b) => Number(b.edge.explicit)-Number(a.edge.explicit) || b.edge.score-a.edge.score || b.node.priority-a.node.priority)
    .filter(({node}) => seen.has(node.id) ? false : (seen.add(node.id), true))
    .slice(0, query.limit ?? 6);
};
export const getGraphSections = (graph:ContentGraphData, sourceId:string) => ({
  guides: queryContentGraph(graph, sourceId, { types:['page'], edgeTypes:['parent','child','related','cluster','semantic'], minScore:20, limit:4 }),
  comparisons: queryContentGraph(graph, sourceId, { types:['comparison'], edgeTypes:['comparison','cluster','semantic'], minScore:25, limit:3 }),
  products: queryContentGraph(graph, sourceId, { types:['product'], edgeTypes:['product','cluster','semantic'], minScore:25, limit:4 }),
  manufacturers: queryContentGraph(graph, sourceId, { types:['manufacturer'], edgeTypes:['manufacturer','semantic'], minScore:30, limit:3 })
});

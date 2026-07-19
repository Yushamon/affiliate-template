import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const app = path.join(root, 'apps/pfotentechnik');

const files = {
  'apps/pfotentechnik/src/domain/contentGraph/types.ts': `export type ContentGraphNodeType = 'page' | 'product' | 'comparison' | 'manufacturer';
export type ContentGraphEdgeType = 'parent' | 'child' | 'related' | 'product' | 'comparison' | 'manufacturer' | 'cluster' | 'semantic';
export type ContentGraphNode = { id:string; slug:string; route:string; title:string; description:string; type:ContentGraphNodeType; cluster:string; topics:string[]; entities:string[]; priority:number; cornerstone:boolean; };
export type ContentGraphEdge = { source:string; target:string; type:ContentGraphEdgeType; score:number; explicit:boolean; };
export type ContentGraphData = { version:1; generatedAt:string; nodes:ContentGraphNode[]; edges:ContentGraphEdge[]; };
`,
  'apps/pfotentechnik/src/domain/contentGraph/queryContentGraph.ts': `import type { ContentGraphData, ContentGraphEdgeType, ContentGraphNode } from './types';
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
`,
  'apps/pfotentechnik/src/domain/contentGraph/index.ts': `export * from './types';\nexport * from './queryContentGraph';\n`,
  'apps/pfotentechnik/src/generated/content-graph.json': JSON.stringify({version:1,generatedAt:'1970-01-01T00:00:00.000Z',nodes:[],edges:[]}, null, 2) + '\n',
  'apps/pfotentechnik/src/components/ContentGraphSections.astro': `---
import graphJson from '../generated/content-graph.json';
import { getGraphSections, type ContentGraphData } from '../domain/contentGraph';
interface Props { sourceId: string; }
const { sourceId } = Astro.props;
const sections = getGraphSections(graphJson as ContentGraphData, sourceId);
const groups = [
  { title:'Passende Ratgeber', items:sections.guides },
  { title:'Passende Vergleiche', items:sections.comparisons },
  { title:'Passende Produkttests', items:sections.products }
].filter((group) => group.items.length > 0);
---
{groups.length > 0 && <aside class="content-graph" aria-label="Thematisch passende Inhalte">
  {groups.map((group) => <section><h2>{group.title}</h2><div class="content-graph-grid">
    {group.items.map(({node,edge}) => <a href={node.route}><span>{node.type}</span><h3>{node.title}</h3><p>{node.description}</p><small>{edge.explicit ? 'Redaktionell verknüpft' : 'Thematisch passend'}</small></a>)}
  </div></section>)}
</aside>}
<style>
.content-graph{margin:56px 0}.content-graph section+section{margin-top:36px}.content-graph h2{margin:0 0 18px;font-size:clamp(1.45rem,2.5vw,2rem)}.content-graph-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:14px}.content-graph-grid a{display:block;padding:20px;border:1px solid rgba(15,23,42,.1);border-radius:18px;background:#fff;color:inherit;text-decoration:none}.content-graph-grid a:hover{border-color:rgba(46,125,50,.42);transform:translateY(-1px)}.content-graph-grid span,.content-graph-grid small{color:#2e7d32;font-size:.76rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em}.content-graph-grid h3{margin:7px 0 9px;font-size:1.05rem;line-height:1.3}.content-graph-grid p{margin:0 0 12px;color:#475569;line-height:1.55}
</style>
`
};

function writeNew(rel, content) {
  const abs = path.join(root, rel);
  if (fs.existsSync(abs)) return;
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, 'utf8');
}

for (const [rel, content] of Object.entries(files)) writeNew(rel, content);

function replaceOnce(rel, needle, replacement) {
  const abs = path.join(root, rel);
  const source = fs.readFileSync(abs, 'utf8');
  if (source.includes(replacement)) return;
  if (!source.includes(needle)) throw new Error(`Einfügepunkt nicht gefunden: ${rel}`);
  fs.writeFileSync(abs, source.replace(needle, replacement), 'utf8');
}

replaceOnce('apps/pfotentechnik/package.json',
  '"audit:seo:strict": "node scripts/seo-intelligence.mjs --strict",',
  '"audit:seo:strict": "node scripts/seo-intelligence.mjs --strict",\n    "build:content-graph": "node scripts/build-content-graph.mjs",\n    "audit:content-graph": "node scripts/build-content-graph.mjs --strict",');

replaceOnce('package.json',
  '"audit:seo:strict": "npm --workspace apps/pfotentechnik run audit:seo:strict",',
  '"audit:seo:strict": "npm --workspace apps/pfotentechnik run audit:seo:strict",\n    "build:content-graph": "npm --workspace apps/pfotentechnik run build:content-graph",\n    "audit:content-graph": "npm --workspace apps/pfotentechnik run audit:content-graph",');

console.log('Content Graph Basisdateien installiert.');
console.log('Hinweis: build-content-graph.mjs und die optionale Schema-/Seiteneinbindung liegen bewusst als nächster sicherer Schritt an.');

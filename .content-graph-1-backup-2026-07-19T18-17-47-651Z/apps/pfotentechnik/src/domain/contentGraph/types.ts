export type ContentGraphNodeType = 'page' | 'product' | 'comparison' | 'manufacturer';
export type ContentGraphEdgeType = 'parent' | 'child' | 'related' | 'product' | 'comparison' | 'manufacturer' | 'cluster' | 'semantic';
export type ContentGraphNode = { id:string; slug:string; route:string; title:string; description:string; type:ContentGraphNodeType; cluster:string; topics:string[]; entities:string[]; priority:number; cornerstone:boolean; };
export type ContentGraphEdge = { source:string; target:string; type:ContentGraphEdgeType; score:number; explicit:boolean; };
export type ContentGraphData = { version:1; generatedAt:string; nodes:ContentGraphNode[]; edges:ContentGraphEdge[]; };

export const RESEARCH_TYPES = ["topic", "product", "manufacturer", "content-refresh"] as const;
export const RESEARCH_STATUSES = ["open", "planned", "implemented", "rejected"] as const;
export type ResearchType = (typeof RESEARCH_TYPES)[number];
export type ResearchStatus = (typeof RESEARCH_STATUSES)[number];
export interface ResearchEvidence { source: string; url?: string; note: string; accessedAt?: string; }
export interface ResearchAction { type: "create-page"|"update-page"|"create-product"|"update-product"|"update-manufacturer"|"update-comparison"|"add-internal-links"|"manual-review"; target?: string; reason: string; }
export interface ResearchItem { id:string; type:ResearchType; title:string; slug?:string; manufacturer?:string; category?:string; intent?:string; status:ResearchStatus; priority:number; confidence:number; reason:string; repositoryMatch?:{exists:boolean;route?:string;file?:string;similarRoutes?:string[]}; actions:ResearchAction[]; evidence:ResearchEvidence[]; discoveredAt:string; lastConfirmedAt:string; }
export interface ResearchStore { version:1; updatedAt:string|null; provider:string; scope:string[]; items:ResearchItem[]; }
const record=(v:unknown):v is Record<string,unknown>=>Boolean(v)&&typeof v==="object"&&!Array.isArray(v);
const text=(v:unknown,f:string)=>{if(typeof v!=="string"||!v.trim())throw new Error(`${f} muss ein nicht leerer String sein.`);return v.trim();};
const score=(v:unknown,f:string)=>{if(typeof v!=="number"||!Number.isFinite(v)||v<0||v>100)throw new Error(`${f} muss zwischen 0 und 100 liegen.`);return Math.round(v);};
export const normalizeResearchStore=(input:unknown):ResearchStore=>{
 if(!record(input))throw new Error("Research-Import muss ein JSON-Objekt sein.");
 const seen=new Set<string>(); const now=new Date().toISOString();
 const items=(Array.isArray(input.items)?input.items:[]).map((raw,index):ResearchItem=>{
  if(!record(raw))throw new Error(`items[${index}] muss ein Objekt sein.`);
  const id=text(raw.id,`items[${index}].id`); if(seen.has(id))throw new Error(`Doppelte Research-ID: ${id}`); seen.add(id);
  const type=text(raw.type,`items[${index}].type`) as ResearchType; if(!RESEARCH_TYPES.includes(type))throw new Error(`Unbekannter Research-Typ: ${type}`);
  const status=(typeof raw.status==="string"?raw.status:"open") as ResearchStatus; if(!RESEARCH_STATUSES.includes(status))throw new Error(`Unbekannter Research-Status: ${status}`);
  const evidence=Array.isArray(raw.evidence)?raw.evidence:[]; if(!evidence.length)throw new Error(`Research-Item ${id} benötigt mindestens einen nachvollziehbaren Beleg.`);
  return {id,type,title:text(raw.title,`items[${index}].title`),slug:typeof raw.slug==="string"?raw.slug.trim():undefined,manufacturer:typeof raw.manufacturer==="string"?raw.manufacturer.trim():undefined,category:typeof raw.category==="string"?raw.category.trim():undefined,intent:typeof raw.intent==="string"?raw.intent.trim():undefined,status,priority:score(raw.priority,`items[${index}].priority`),confidence:score(raw.confidence,`items[${index}].confidence`),reason:text(raw.reason,`items[${index}].reason`),repositoryMatch:record(raw.repositoryMatch)?{exists:raw.repositoryMatch.exists===true,route:typeof raw.repositoryMatch.route==="string"?raw.repositoryMatch.route:undefined,file:typeof raw.repositoryMatch.file==="string"?raw.repositoryMatch.file:undefined,similarRoutes:Array.isArray(raw.repositoryMatch.similarRoutes)?raw.repositoryMatch.similarRoutes.filter((v):v is string=>typeof v==="string"):undefined}:undefined,actions:(Array.isArray(raw.actions)?raw.actions:[]).map((a,i)=>{if(!record(a))throw new Error(`items[${index}].actions[${i}] muss ein Objekt sein.`);return {type:text(a.type,`items[${index}].actions[${i}].type`) as ResearchAction["type"],target:typeof a.target==="string"?a.target.trim():undefined,reason:text(a.reason,`items[${index}].actions[${i}].reason`)};}),evidence:evidence.map((e,i)=>{if(!record(e))throw new Error(`items[${index}].evidence[${i}] muss ein Objekt sein.`);return {source:text(e.source,`items[${index}].evidence[${i}].source`),url:typeof e.url==="string"?e.url.trim():undefined,note:text(e.note,`items[${index}].evidence[${i}].note`),accessedAt:typeof e.accessedAt==="string"?e.accessedAt:undefined};}),discoveredAt:typeof raw.discoveredAt==="string"?raw.discoveredAt:now,lastConfirmedAt:typeof raw.lastConfirmedAt==="string"?raw.lastConfirmedAt:now};
 });
 return {version:1,updatedAt:typeof input.updatedAt==="string"?input.updatedAt:now,provider:typeof input.provider==="string"&&input.provider.trim()?input.provider.trim():"manual-chatgpt",scope:Array.isArray(input.scope)?input.scope.filter((v):v is string=>typeof v==="string"):[],items};
};

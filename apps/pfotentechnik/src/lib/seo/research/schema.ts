export const RESEARCH_TYPES = ["topic", "product", "manufacturer", "content-refresh"] as const;
export const RESEARCH_STATUSES = ["open", "planned", "implemented", "rejected"] as const;
export const RESEARCH_EFFORTS = ["small", "medium", "large"] as const;
export const RESEARCH_IMPACTS = ["low", "medium", "high"] as const;
export const RESEARCH_LIFECYCLE_STATES = ["new", "announced", "updated", "successor", "discontinued", "recalled", "firmware-update", "app-update", "unchanged"] as const;

export type ResearchType = (typeof RESEARCH_TYPES)[number];
export type ResearchStatus = (typeof RESEARCH_STATUSES)[number];
export type ResearchEffort = (typeof RESEARCH_EFFORTS)[number];
export type ResearchImpact = (typeof RESEARCH_IMPACTS)[number];
export type ResearchLifecycleState = (typeof RESEARCH_LIFECYCLE_STATES)[number];

export interface ResearchEvidence { source: string; url?: string; note: string; accessedAt?: string; }
export interface ResearchAction { type: "create-page"|"update-page"|"create-product"|"update-product"|"update-manufacturer"|"update-comparison"|"add-internal-links"|"manual-review"; target?: string; reason: string; }
export interface ResearchOpportunity { seo:number; ux:number; business:number; freshness:number; effort:ResearchEffort; priority:number; reason:string; }
export interface ResearchSerpGap { score:number; query?:string; analyzedResults:number; missingContent:string[]; missingVisuals:string[]; missingCalculators:string[]; missingDecisionTools:string[]; competitorPatterns:string[]; informationGain:string; }
export interface ResearchLifecycle { state:ResearchLifecycleState; modelId?:string; launchDate?:string; predecessor?:string; successor?:string; changeSummary?:string; affectedComparisons:string[]; }
export interface ResearchRefreshPlan { targetRoute?:string; changeType:"expand"|"correct"|"restructure"|"consolidate"|"update-data"|"improve-ux"; missingSections:string[]; sectionsToUpdate:string[]; factsToVerify:string[]; visuals:string[]; decisionTools:string[]; faqUpdates:string[]; schemaUpdates:string[]; internalLinks:string[]; affectedProducts:string[]; affectedComparisons:string[]; }
export interface ResearchImpactPlan { affectedPages:string[]; affectedComparisons:string[]; affectedProducts:string[]; estimatedContentHours:number; estimatedImageHours:number; estimatedSeoImpact:ResearchImpact; }
export interface ResearchActionBundle { id?:string; title:string; sequence:string[]; }


export interface ResearchImplementationBrief {
  goal:string;
  problem:string;
  userValue:string;
  implementation:string[];
  files:string[];
  doNotChange:string[];
  acceptanceCriteria:string[];
  verification:string[];
}
export interface ResearchItem {
  id:string; type:ResearchType; title:string; slug?:string; manufacturer?:string; category?:string; intent?:string;
  status:ResearchStatus; priority:number; confidence:number; reason:string;
  repositoryMatch?:{exists:boolean;route?:string;file?:string;similarRoutes?:string[]};
  opportunity?:ResearchOpportunity; serpGap?:ResearchSerpGap; lifecycle?:ResearchLifecycle;
  refreshPlan?:ResearchRefreshPlan; impact?:ResearchImpactPlan; actionBundle?:ResearchActionBundle; implementationBrief?:ResearchImplementationBrief;
  actions:ResearchAction[]; evidence:ResearchEvidence[]; discoveredAt:string; lastConfirmedAt:string;
}
export interface ResearchStore { version:1|2; updatedAt:string|null; provider:string; scope:string[]; items:ResearchItem[]; }

const record=(v:unknown):v is Record<string,unknown>=>Boolean(v)&&typeof v==="object"&&!Array.isArray(v);
const text=(v:unknown,f:string)=>{if(typeof v!=="string"||!v.trim())throw new Error(`${f} muss ein nicht leerer String sein.`);return v.trim();};
const optionalText=(v:unknown)=>typeof v==="string"&&v.trim()?v.trim():undefined;
const score=(v:unknown,f:string,fallback?:number)=>{if(v==null&&fallback!=null)return fallback;if(typeof v!=="number"||!Number.isFinite(v)||v<0||v>100)throw new Error(`${f} muss zwischen 0 und 100 liegen.`);return Math.round(v);};
const nonNegative=(v:unknown,f:string,fallback=0)=>{if(v==null)return fallback;if(typeof v!=="number"||!Number.isFinite(v)||v<0)throw new Error(`${f} muss eine nicht negative Zahl sein.`);return Math.round(v*10)/10;};
const strings=(v:unknown)=>Array.isArray(v)?v.filter((x):x is string=>typeof x==="string"&&Boolean(x.trim())).map(x=>x.trim()):[];

const opportunity=(v:unknown,f:string):ResearchOpportunity|undefined=>{if(!record(v))return;const effort=optionalText(v.effort) as ResearchEffort|undefined;if(!effort||!RESEARCH_EFFORTS.includes(effort))throw new Error(`${f}.effort ist ungültig.`);return{seo:score(v.seo,`${f}.seo`),ux:score(v.ux,`${f}.ux`),business:score(v.business,`${f}.business`,0),freshness:score(v.freshness,`${f}.freshness`,0),effort,priority:score(v.priority,`${f}.priority`),reason:text(v.reason,`${f}.reason`)};};
const serpGap=(v:unknown,f:string):ResearchSerpGap|undefined=>{if(!record(v))return;return{score:score(v.score,`${f}.score`),query:optionalText(v.query),analyzedResults:nonNegative(v.analyzedResults,`${f}.analyzedResults`),missingContent:strings(v.missingContent),missingVisuals:strings(v.missingVisuals),missingCalculators:strings(v.missingCalculators),missingDecisionTools:strings(v.missingDecisionTools),competitorPatterns:strings(v.competitorPatterns),informationGain:text(v.informationGain,`${f}.informationGain`)};};
const lifecycle=(v:unknown,f:string):ResearchLifecycle|undefined=>{if(!record(v))return;const state=optionalText(v.state) as ResearchLifecycleState|undefined;if(!state||!RESEARCH_LIFECYCLE_STATES.includes(state))throw new Error(`${f}.state ist ungültig.`);return{state,modelId:optionalText(v.modelId),launchDate:optionalText(v.launchDate),predecessor:optionalText(v.predecessor),successor:optionalText(v.successor),changeSummary:optionalText(v.changeSummary),affectedComparisons:strings(v.affectedComparisons)};};
const refreshPlan=(v:unknown,f:string):ResearchRefreshPlan|undefined=>{if(!record(v))return;const changeType=optionalText(v.changeType) as ResearchRefreshPlan["changeType"]|undefined;const allowed=["expand","correct","restructure","consolidate","update-data","improve-ux"];if(!changeType||!allowed.includes(changeType))throw new Error(`${f}.changeType ist ungültig.`);return{targetRoute:optionalText(v.targetRoute),changeType,missingSections:strings(v.missingSections),sectionsToUpdate:strings(v.sectionsToUpdate),factsToVerify:strings(v.factsToVerify),visuals:strings(v.visuals),decisionTools:strings(v.decisionTools),faqUpdates:strings(v.faqUpdates),schemaUpdates:strings(v.schemaUpdates),internalLinks:strings(v.internalLinks),affectedProducts:strings(v.affectedProducts),affectedComparisons:strings(v.affectedComparisons)};};
const impact=(v:unknown,f:string):ResearchImpactPlan|undefined=>{if(!record(v))return;const estimatedSeoImpact=optionalText(v.estimatedSeoImpact) as ResearchImpact|undefined;if(!estimatedSeoImpact||!RESEARCH_IMPACTS.includes(estimatedSeoImpact))throw new Error(`${f}.estimatedSeoImpact ist ungültig.`);return{affectedPages:strings(v.affectedPages),affectedComparisons:strings(v.affectedComparisons),affectedProducts:strings(v.affectedProducts),estimatedContentHours:nonNegative(v.estimatedContentHours,`${f}.estimatedContentHours`),estimatedImageHours:nonNegative(v.estimatedImageHours,`${f}.estimatedImageHours`),estimatedSeoImpact};};
const bundle=(v:unknown,f:string):ResearchActionBundle|undefined=>{if(!record(v))return;
const implementationBrief=(v:unknown,f:string):ResearchImplementationBrief|undefined=>{
 if(!record(v))return;
 return{
  goal:text(v.goal,`${f}.goal`),
  problem:text(v.problem,`${f}.problem`),
  userValue:text(v.userValue,`${f}.userValue`),
  implementation:strings(v.implementation),
  files:strings(v.files),
  doNotChange:strings(v.doNotChange),
  acceptanceCriteria:strings(v.acceptanceCriteria),
  verification:strings(v.verification)
 };
};
return{id:optionalText(v.id),title:text(v.title,`${f}.title`),sequence:strings(v.sequence)};};

const normalizeImplementationBrief=(v:unknown,f:string):ResearchImplementationBrief|undefined=>{
 if(!record(v))return;
 return{
  goal:text(v.goal,`${f}.goal`),
  problem:text(v.problem,`${f}.problem`),
  userValue:text(v.userValue,`${f}.userValue`),
  implementation:strings(v.implementation),
  files:strings(v.files),
  doNotChange:strings(v.doNotChange),
  acceptanceCriteria:strings(v.acceptanceCriteria),
  verification:strings(v.verification)
 };
};

export const normalizeResearchStore=(input:unknown):ResearchStore=>{
 if(!record(input))throw new Error("Research-Import muss ein JSON-Objekt sein.");
 const seen=new Set<string>(); const now=new Date().toISOString();
 const items=(Array.isArray(input.items)?input.items:[]).map((raw,index):ResearchItem=>{
  if(!record(raw))throw new Error(`items[${index}] muss ein Objekt sein.`);
  const id=text(raw.id,`items[${index}].id`); if(seen.has(id))throw new Error(`Doppelte Research-ID: ${id}`); seen.add(id);
  const type=text(raw.type,`items[${index}].type`) as ResearchType; if(!RESEARCH_TYPES.includes(type))throw new Error(`Unbekannter Research-Typ: ${type}`);
  const status=(typeof raw.status==="string"?raw.status:"open") as ResearchStatus; if(!RESEARCH_STATUSES.includes(status))throw new Error(`Unbekannter Research-Status: ${status}`);
  const evidence=Array.isArray(raw.evidence)?raw.evidence:[]; if(!evidence.length)throw new Error(`Research-Item ${id} benötigt mindestens einen nachvollziehbaren Beleg.`);
  return {
   id,type,title:text(raw.title,`items[${index}].title`),slug:optionalText(raw.slug),manufacturer:optionalText(raw.manufacturer),category:optionalText(raw.category),intent:optionalText(raw.intent),status,
   priority:score(raw.priority,`items[${index}].priority`),confidence:score(raw.confidence,`items[${index}].confidence`),reason:text(raw.reason,`items[${index}].reason`),
   repositoryMatch:record(raw.repositoryMatch)?{exists:raw.repositoryMatch.exists===true,route:optionalText(raw.repositoryMatch.route),file:optionalText(raw.repositoryMatch.file),similarRoutes:strings(raw.repositoryMatch.similarRoutes)}:undefined,
   opportunity:opportunity(raw.opportunity,`items[${index}].opportunity`),serpGap:serpGap(raw.serpGap,`items[${index}].serpGap`),lifecycle:lifecycle(raw.lifecycle,`items[${index}].lifecycle`),refreshPlan:refreshPlan(raw.refreshPlan,`items[${index}].refreshPlan`),impact:impact(raw.impact,`items[${index}].impact`),actionBundle:bundle(raw.actionBundle,`items[${index}].actionBundle`),implementationBrief:normalizeImplementationBrief(raw.implementationBrief,`items[${index}].implementationBrief`),
   actions:(Array.isArray(raw.actions)?raw.actions:[]).map((a,i)=>{if(!record(a))throw new Error(`items[${index}].actions[${i}] muss ein Objekt sein.`);return{type:text(a.type,`items[${index}].actions[${i}].type`) as ResearchAction["type"],target:optionalText(a.target),reason:text(a.reason,`items[${index}].actions[${i}].reason`)};}),
   evidence:evidence.map((e,i)=>{if(!record(e))throw new Error(`items[${index}].evidence[${i}] muss ein Objekt sein.`);return{source:text(e.source,`items[${index}].evidence[${i}].source`),url:optionalText(e.url),note:text(e.note,`items[${index}].evidence[${i}].note`),accessedAt:optionalText(e.accessedAt)};}),
   discoveredAt:optionalText(raw.discoveredAt)??now,lastConfirmedAt:optionalText(raw.lastConfirmedAt)??now
  };
 });
 return{version:input.version===2?2:1,updatedAt:optionalText(input.updatedAt)??now,provider:optionalText(input.provider)??"manual-chatgpt",scope:strings(input.scope),items};
};

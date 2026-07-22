export type AdvisorCategory = "quick-win" | "ctr" | "ranking" | "content" | "internal-links" | "indexing" | "eeat" | "technical";
export type AdvisorPriority = "A" | "B" | "C" | "D";
export type AdvisorEffort = "low" | "medium" | "high";
export interface AdvisorMetric { clicks?: number; impressions?: number; ctr?: number; position?: number; previousClicks?: number; previousImpressions?: number; previousCtr?: number; previousPosition?: number; }
export interface AdvisorPage { url:string; title?:string; type?:string; updatedAt?:string; inboundLinks?:number; outboundLinks?:number; wordCount?:number; indexed?:boolean; metric?:AdvisorMetric; }
export interface AdvisorQuery { query:string; page?:string; metric:AdvisorMetric; }
export interface AdvisorContext { generatedAt:string; period:string; pages:AdvisorPage[]; queries:AdvisorQuery[]; site?:Record<string, number|string|boolean|null|undefined>; }
export interface AdvisorRecommendation { id:string; ruleId:string; category:AdvisorCategory; title:string; summary:string; reason:string; action:string; url?:string; score:number; priority:AdvisorPriority; impact:number; confidence:number; effort:AdvisorEffort; evidence?:Record<string,string|number|boolean|null>; }
export interface AdvisorRule { id:string; label:string; category:AdvisorCategory; run(context:AdvisorContext):AdvisorRecommendation[]; }
export interface AdvisorResult { generatedAt:string; period:string; recommendations:AdvisorRecommendation[]; counts:Record<AdvisorPriority,number>; }

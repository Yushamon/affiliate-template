export type SeoStatus = "ok" | "warning" | "error" | "pending";
export interface SeoKpi { id:string; label:string; value:string; detail?:string }
export interface ConnectorStatus { id:"google"|"bing"|"indexnow"|"sitemap"; label:string; status:SeoStatus; message:string }
export interface SeoRecommendation { id:string; priority:"high"|"medium"|"low"; title:string; url?:string; reason:string; actions:string[]; potential?:string }
export interface SeoPageRow { title:string; url:string; clicks?:number; impressions?:number; ctr?:number; position?:number; indexed?:boolean; status:SeoStatus }
export interface SeoReport { name:string; path:string; kind:"json"|"markdown"|"other"; updated?:string }
export interface SeoDashboardData { site:{name:string;url:string}; generatedAt:string; kpis:SeoKpi[]; connectors:ConnectorStatus[]; recommendations:SeoRecommendation[]; pages:SeoPageRow[]; reports:SeoReport[] }

import fs from "node:fs/promises";
import path from "node:path";
import { seoDashboardConfig as config } from "./config";
import { buildRecommendations } from "./recommendations";
import type { ConnectorStatus, SeoDashboardData, SeoKpi, SeoPageRow, SeoReport, SeoStatus } from "./types";

const reportsDir=path.join(process.cwd(),config.reportsDirectory);
async function json(name:string){try{return JSON.parse(await fs.readFile(path.join(reportsDir,name),"utf8"))}catch{return null}}
function num(v:unknown){if(typeof v==="number"&&Number.isFinite(v))return v;if(typeof v==="string"){const n=Number(v.replace(",","."));if(Number.isFinite(n))return n}}
function pick(o:Record<string,unknown>,keys:string[]){for(const k of keys){const n=num(o[k]);if(n!==undefined)return n}}
function gsc(raw:unknown){
  if(!raw||typeof raw!=="object") return {kpis:[] as SeoKpi[],pages:[] as SeoPageRow[],status:{id:"google",label:"Google Search Console",status:"pending",message:"Noch kein GSC-Report gefunden. Führe npm run gsc:audit aus."} as ConnectorStatus};
  const src=raw as Record<string,unknown>, summary=src.summary&&typeof src.summary==="object"?src.summary as Record<string,unknown>:src;
  const clicks=pick(summary,["clicks","totalClicks"]), impressions=pick(summary,["impressions","totalImpressions"]), ctr=pick(summary,["ctr","averageCtr"]), position=pick(summary,["position","averagePosition"]);
  const rows=(Array.isArray(src.pages)&&src.pages)||(Array.isArray(src.rows)&&src.rows)||[];
  const pages=(rows as unknown[]).map((r):SeoPageRow|null=>{
    if(!r||typeof r!=="object")return null;const x=r as Record<string,unknown>,keys=Array.isArray(x.keys)?x.keys:[];
    const url=typeof x.url==="string"?x.url:typeof x.page==="string"?x.page:typeof keys[0]==="string"?keys[0]:""; if(!url)return null;
    const c=pick(x,["ctr"]);
    return {title:typeof x.title==="string"?x.title:decodeURIComponent(url.split("/").filter(Boolean).at(-1)||"/").replaceAll("-"," "),url,clicks:pick(x,["clicks"]),impressions:pick(x,["impressions"]),ctr:c!==undefined&&c<=1?c*100:c,position:pick(x,["position"]),indexed:typeof x.indexed==="boolean"?x.indexed:undefined,status:"ok"};
  }).filter((x):x is SeoPageRow=>x!==null);
  const c=ctr!==undefined&&ctr<=1?ctr*100:ctr;
  return {pages,kpis:[
    {id:"clicks",label:"Klicks",value:clicks?.toLocaleString("de-DE")??"–",detail:"Google"},
    {id:"impressions",label:"Impressionen",value:impressions?.toLocaleString("de-DE")??"–",detail:"Google"},
    {id:"ctr",label:"CTR",value:c!==undefined?`${c.toFixed(1)} %`:"–",detail:"Google"},
    {id:"position",label:"Ø Position",value:position?.toFixed(1)??"–",detail:"Google"}],
    status:{id:"google",label:"Google Search Console",status:"ok",message:"GSC-Report wurde erfolgreich eingelesen."} as ConnectorStatus};
}
async function reports():Promise<SeoReport[]>{try{const es=await fs.readdir(reportsDir,{withFileTypes:true});return (await Promise.all(es.filter(e=>e.isFile()).map(async e=>{const s=await fs.stat(path.join(reportsDir,e.name));return{name:e.name,path:`reports/${e.name}`,kind:e.name.endsWith(".json")?"json":e.name.endsWith(".md")?"markdown":"other",updated:s.mtime.toISOString()} as SeoReport}))).sort((a,b)=>(b.updated||"").localeCompare(a.updated||""))}catch{return[]}}
function status(id:ConnectorStatus["id"],label:string,raw:unknown,missing:string):ConnectorStatus{if(!raw)return{id,label,status:"pending",message:missing};const x=raw as Record<string,unknown>,s=String(x.status||x.state||"").toLowerCase();const state:SeoStatus=s.includes("error")||s.includes("fail")?"error":s.includes("warn")?"warning":"ok";return{id,label,status:state,message:typeof x.message==="string"?x.message:"Report wurde eingelesen."}}
export async function getSeoDashboardData():Promise<SeoDashboardData>{
  const [gr,br,ir,rr]=await Promise.all([json(config.reports.google),json(config.reports.bing),json(config.reports.indexnow),reports()]);
  const g=gsc(gr), connectors=[g.status,status("bing","Bing Webmaster",br,"Noch kein Bing-Report gefunden. Datenintegration folgt in 1.1."),status("indexnow","IndexNow",ir,"IndexNow ist eingerichtet; Dashboard-Statusreport fehlt noch."),{id:"sitemap",label:"Sitemap",status:"ok",message:config.sitemap} as ConnectorStatus];
  const recommendations=buildRecommendations(g.pages);
  if(!recommendations.length)recommendations.push({id:"ready",priority:"low",title:"Dashboard Foundation ist bereit",reason:"Sobald GSC-Seitendaten vorliegen, werden automatisch Aufgaben erzeugt.",actions:["GSC-Verbindung abschließen","npm run gsc:audit ausführen","Dashboard neu bauen"]});
  return{site:config.site,generatedAt:new Date().toISOString(),kpis:[...g.kpis,{id:"pages",label:"Seiten mit Daten",value:String(g.pages.length),detail:"Importiert"},{id:"health",label:"SEO Health",value:connectors.some(x=>x.status==="error")?"Kritisch":"Basis",detail:"Score folgt in 1.2"}],connectors,recommendations,pages:g.pages,reports:rr};
}

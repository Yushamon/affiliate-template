import fs from "node:fs/promises";
import path from "node:path";
import { ensure, slugify, writeJson } from "./lib.mjs";
const UA="Mozilla/5.0 (compatible; PfotenTechnikMediaFactory/2.1-free)";
function meta(html,key){for(const re of [
 new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["']`,"i"),
 new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["']`,"i")
]){const m=html.match(re);if(m)return m[1].replace(/&amp;/g,"&")}return""}
function imageUrls(html,base){
 const set=new Set(); for(const k of ["og:image","og:image:secure_url","twitter:image"]){const x=meta(html,k);if(x)try{set.add(new URL(x,base).href)}catch{}}
 for(const m of html.matchAll(/<img[^>]+(?:src|data-src|data-old-hires)=["']([^"']+)["']/gi)){try{const u=new URL(m[1].replace(/&amp;/g,"&"),base).href;if(!/sprite|icon|logo|badge|pixel|avatar/i.test(u))set.add(u)}catch{}}
 return [...set];
}
export async function importUrl({url,appRoot,slug,max=10}){
 const r=await fetch(url,{redirect:"follow",headers:{"user-agent":UA,accept:"text/html"}});
 if(!r.ok)throw new Error(`Produktseite HTTP ${r.status}`);
 const html=await r.text(), final=r.url, title=meta(html,"og:title")||html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim()||"";
 slug=slug||slugify(title)||`produkt-${Date.now()}`;
 const amazon=/amazon\./i.test(new URL(final).hostname), bucket=amazon?"amazon":"manufacturer";
 const manufacturer=(title.split(/\s+/)[0]||"").replace(/[^\p{L}\p{N}-]/gu,"");
 const dir=path.join(appRoot,"media-source",slug,bucket); await ensure(dir);
 const results=[]; let i=0;
 for(const u of imageUrls(html,final).slice(0,Number(max))){i++;try{
  const q=await fetch(u,{redirect:"follow",headers:{"user-agent":UA,accept:"image/*"}});
  if(!q.ok)throw new Error(`HTTP ${q.status}`); const ct=q.headers.get("content-type")||""; if(!ct.startsWith("image/"))throw new Error("kein Bild");
  const b=Buffer.from(await q.arrayBuffer()); if(b.length<12000)throw new Error("zu klein");
  const ext=[".jpg",".jpeg",".png",".webp",".avif"].includes(path.extname(new URL(u).pathname).toLowerCase())?path.extname(new URL(u).pathname).toLowerCase():".jpg";
  const f=path.join(dir,`reference-${String(i).padStart(2,"0")}${ext}`); await fs.writeFile(f,b);results.push({url:u,file:path.relative(appRoot,f).replaceAll("\\","/"),bytes:b.length});
 }catch(e){results.push({url:u,error:e.message})}}
 const data={version:"2.1-free",sourceUrl:url,resolvedUrl:final,title,manufacturer,slug,bucket,downloads:results,importedAt:new Date().toISOString()};
 await writeJson(path.join(appRoot,"media-source",slug,"import.json"),data);return data;
}

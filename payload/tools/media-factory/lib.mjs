import fs from "node:fs/promises";
import path from "node:path";
export const IMG = new Set([".jpg",".jpeg",".png",".webp",".avif"]);
export const exists = async p => { try { await fs.access(p); return true; } catch { return false; } };
export const ensure = p => fs.mkdir(p,{recursive:true});
export async function walk(d){ if(!await exists(d)) return []; let out=[]; for(const e of await fs.readdir(d,{withFileTypes:true})){const p=path.join(d,e.name); out.push(...(e.isDirectory()?await walk(p):[p]));} return out; }
export function slugify(s){return String(s||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/&/g," und ").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");}
export function args(v){const o={_:[]};for(let i=0;i<v.length;i++){const x=v[i];if(!x.startsWith("--"))o._.push(x);else{const [k,z]=x.slice(2).split("=",2);o[k]=z??(v[i+1]&&!v[i+1].startsWith("--")?v[++i]:true)}}return o}
export async function readJson(p,f={}){try{return JSON.parse(await fs.readFile(p,"utf8"))}catch{return f}}
export async function writeJson(p,v){await ensure(path.dirname(p));await fs.writeFile(p,JSON.stringify(v,null,2)+"\n")}
export function rel(root,p){return path.relative(root,p).split(path.sep).join("/")}
export function sourceBucket(file){const n=file.split(path.sep).join("/");for(const x of ["user","manufacturer","amazon","existing","generated"])if(n.includes(`/${x}/`))return x;return "unknown"}
export function isUrl(v){return /^https?:\/\//i.test(v||"")}

#!/usr/bin/env node
import fs from "node:fs";import path from "node:path";import {spawnSync} from "node:child_process";import {fileURLToPath} from "node:url";
const here=path.dirname(fileURLToPath(import.meta.url)),repo=process.cwd(),marker=path.join(repo,"apps/pfotentechnik/package.json");
if(!fs.existsSync(marker)){console.error("Bitte im Root von Yushamon/affiliate-template ausführen.");process.exit(1)}
const source=path.join(here,"payload"),backup=path.join(repo,".patch-backups",`seo-dashboard-foundation-1.0-${Date.now()}`),written=[];
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
try{for(const s of walk(source)){const rel=path.relative(source,s),t=path.join(repo,rel),b=path.join(backup,rel);if(fs.existsSync(t)){fs.mkdirSync(path.dirname(b),{recursive:true});fs.copyFileSync(t,b)}fs.mkdirSync(path.dirname(t),{recursive:true});fs.copyFileSync(s,t);written.push([t,b]);console.log("✓",rel)}
const r=spawnSync("npm",["run","build:pfotentechnik"],{cwd:repo,stdio:"inherit",shell:process.platform==="win32"});if(r.status!==0)throw new Error("Build fehlgeschlagen");
console.log("\nInstalliert: /admin/seo/\nHinweis: noindex, aber noch nicht authentifiziert.");
}catch(e){console.error("\n"+e.message+" – Rollback …");for(const [t,b] of written.reverse()){if(fs.existsSync(b))fs.copyFileSync(b,t);else fs.rmSync(t,{force:true})}process.exit(1)}

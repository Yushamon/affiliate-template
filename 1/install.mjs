#!/usr/bin/env node
import path from "node:path";
import process from "node:process";
import { command, createContext, resolveRepoRoot } from "./lib/installer-utils.mjs";
import productExperience from "./modules/01-product-experience.mjs";
import priceIntelligence from "./modules/02-price-intelligence.mjs";
import mediaFactory from "./modules/03-media-factory.mjs";
import mediaCenter from "./modules/04-media-center.mjs";

const modules=[productExperience,priceIntelligence,mediaFactory,mediaCenter];
const args=Object.fromEntries(process.argv.slice(2).map((arg)=>{const [key,...parts]=arg.replace(/^--/,"").split("=");return[key,parts.length?parts.join("="):true]}));
if(args.help||args.h){console.log(`PfotenTechnik Platform 2.0\n\nnode install.mjs --repo=<Repository> [--module=01-product-experience|02-price-intelligence|03-media-factory|04-media-center] [--skip-checks] [--skip-baseline]\n\nEin ausgewähltes Modul schließt seine Vorgängermodule ein, damit Abhängigkeiten nicht still fehlen.`);process.exit(0)}
const repoRoot=await resolveRepoRoot(typeof args.repo==="string"?args.repo:process.cwd());
const selectedId=typeof args.module==="string"?args.module:null;let selected=modules;
if(selectedId){const index=modules.findIndex((module)=>module.id===selectedId);if(index<0)throw new Error(`Unbekanntes Modul: ${selectedId}`);selected=modules.slice(0,index+1)}
const skipChecks=Boolean(args["skip-checks"]);const skipBaseline=Boolean(args["skip-baseline"]);
console.log(`PfotenTechnik Platform 2.0\nRepository: ${repoRoot}\nModule: ${selected.map((module)=>module.id).join(", ")}\nChecks: ${skipChecks?"übersprungen":"aktiv"}`);
if(!skipBaseline&&!skipChecks)command("npm run build:pfotentechnik",{cwd:repoRoot,label:"Unveränderter Ausgangs-Build"});
const ctx=await createContext(repoRoot,{skipChecks,selected:selected.map((module)=>module.id)});
for(const module of selected){
  await ctx.beginModule(module.id,module.title);
  try{
    await module.apply(ctx);
    if(!skipChecks)await module.checks(ctx);
    await ctx.finishModule();
  }catch(error){
    console.error(`\n[${module.id}] ${error instanceof Error?error.message:String(error)}`);
    await ctx.failModule(error);
    if(!skipChecks){try{command("npm run build:pfotentechnik",{cwd:repoRoot,label:`Kontroll-Build nach Rollback von ${module.id}`})}catch(rollbackError){console.error(`Der Ausgangszustand baut nach dem Rollback ebenfalls nicht: ${rollbackError.message}`)}}
    console.error(`Modul ${module.id} wurde vollständig zurückgerollt. Vorher erfolgreich installierte Module bleiben unverändert.`);
    process.exitCode=1;
    break;
  }
}
await ctx.complete();
if(!process.exitCode){console.log(`\nPfotenTechnik Platform 2.0 wurde vollständig installiert.\nStatus: ${path.relative(repoRoot,ctx.statePath)}\nBackups: ${path.relative(repoRoot,ctx.backupRoot)}\nSEO Cockpit: npm run dev:pfotentechnik:seo`)}

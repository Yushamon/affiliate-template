#!/usr/bin/env node
import fs from "node:fs/promises";
import process from "node:process";
import { command, loadState, resolveRepoRoot, rollbackRecordedModule } from "./lib/installer-utils.mjs";
const args=Object.fromEntries(process.argv.slice(2).map((arg)=>{const [key,...parts]=arg.replace(/^--/,"").split("=");return[key,parts.length?parts.join("="):true]}));
const repoRoot=await resolveRepoRoot(typeof args.repo==="string"?args.repo:process.cwd());const {file,state}=await loadState(repoRoot);const requested=typeof args.module==="string"?args.module:null;let modules=state.modules.filter((module)=>module.status==="installed");
if(requested){const index=state.modules.findIndex((module)=>module.id===requested);if(index<0)throw new Error(`Modul ${requested} ist im letzten Lauf nicht enthalten.`);modules=state.modules.slice(index).filter((module)=>module.status==="installed")}
for(const module of [...modules].reverse()){console.log(`Rollback: ${module.id}`);await rollbackRecordedModule(repoRoot,state,module)}state.rolledBackAt=new Date().toISOString();await fs.writeFile(file,JSON.stringify(state,null,2));if(!args["skip-checks"])command("npm run build:pfotentechnik",{cwd:repoRoot,label:"Build nach Rollback"});console.log("Rollback abgeschlossen.");

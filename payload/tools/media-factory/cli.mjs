#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { CONFIG } from "./config.mjs";
import { args, isUrl } from "./lib.mjs";
import { importUrl } from "./importer.mjs";
import { runProduct } from "./pipeline.mjs";
const a=args(process.argv.slice(2)),cmd=a._[0]||"help",repoRoot=process.cwd(),appRoot=path.join(repoRoot,CONFIG.appRoot);
async function product(value){let slug=value;if(isUrl(value))slug=(await importUrl({url:value,appRoot,slug:a.slug,max:a["max-images"]||10})).slug;return runProduct({repoRoot,slug,writeMd:!!a["write-md"]})}
try{
 if(cmd==="import")console.log(JSON.stringify(await importUrl({url:a._[1],appRoot,slug:a.slug,max:a["max-images"]||10}),null,2));
 else if(cmd==="build")console.log(JSON.stringify(await runProduct({repoRoot,slug:a._[1],writeMd:!!a["write-md"]}),null,2));
 else if(cmd==="product")console.log(JSON.stringify(await product(a._[1]),null,2));
 else if(cmd==="batch"){const list=(await fs.readFile(a._[1],"utf8")).split(/\r?\n/).map(x=>x.trim()).filter(x=>x&&!x.startsWith("#"));const out=[];for(const value of list)try{out.push({value,ok:true,audit:await product(value)})}catch(e){out.push({value,ok:false,error:e.message})}console.log(JSON.stringify(out,null,2))}
 else console.log(`Product Media Factory 2.1 Free
npm run media:product -- <URL-oder-Slug> [--write-md]
npm run media:batch -- products.txt [--write-md]
npm run media:build -- <slug> [--write-md]

Kostenlos: keine API, kein Schlüssel, keine laufenden Kosten.`);
}catch(e){console.error(`\n[media-factory] ${e.message}\n`);process.exitCode=1}

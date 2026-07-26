#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
const NAME="pfotentechnik-product-media-factory-2.1.0-free",root=process.cwd();
const here=path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,"$1")),payload=path.join(here,"payload");
const exists=async p=>{try{await fs.access(p);return true}catch{return false}};
async function walk(d){let o=[];for(const e of await fs.readdir(d,{withFileTypes:true})){const p=path.join(d,e.name);o.push(...(e.isDirectory()?await walk(p):[p]))}return o}
try{
 if(!await exists(path.join(root,"apps","pfotentechnik")))throw new Error("apps/pfotentechnik fehlt. Installer im Repository-Stamm ausführen.");
 for(const src of await walk(payload)){const dest=path.join(root,path.relative(payload,src));await fs.mkdir(path.dirname(dest),{recursive:true});await fs.copyFile(src,dest)}
 const pkgFile=path.join(root,"package.json"),pkg=JSON.parse(await fs.readFile(pkgFile,"utf8"));pkg.scripts||={};
 Object.assign(pkg.scripts,{
  "media:import":"node tools/media-factory/cli.mjs import",
  "media:build":"node tools/media-factory/cli.mjs build",
  "media:product":"node tools/media-factory/cli.mjs product",
  "media:batch":"node tools/media-factory/cli.mjs batch"
 });
 pkg.devDependencies||={};if(!pkg.dependencies?.sharp&&!pkg.devDependencies.sharp)pkg.devDependencies.sharp="^0.34.3";
 await fs.writeFile(pkgFile,JSON.stringify(pkg,null,2)+"\n");
 console.log(`\n[${NAME}] installiert.\n\nDanach:\n  npm install\n  npm run media:product -- "URL" --slug produkt-slug --write-md\n`);
}catch(e){console.error(`\n[${NAME}] Installation fehlgeschlagen: ${e.message}\n`);process.exitCode=1}

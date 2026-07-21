#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
const root=process.cwd();
const mf=path.join(root,".ui-polish-5.0-manifest.json");
if(!fs.existsSync(mf)){console.error("Manifest fehlt.");process.exit(1)}
const m=JSON.parse(fs.readFileSync(mf,"utf8"));
for(const rel of m.files){
  const target=path.join(root,rel),backup=path.join(m.backupRoot,rel);
  if(fs.existsSync(backup)){fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(backup,target)}
  else if(fs.existsSync(target))fs.rmSync(target,{force:true});
}
fs.rmSync(mf,{force:true});
console.log("UI Polish 5.0 zurückgerollt.");

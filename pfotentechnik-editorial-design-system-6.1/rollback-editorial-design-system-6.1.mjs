#!/usr/bin/env node
import fs from "node:fs";import path from "node:path";
const root=process.cwd(),m=path.join(root,".editorial-design-system-6.1-manifest.json");
if(!fs.existsSync(m)){console.error("Manifest fehlt.");process.exit(1)}
const data=JSON.parse(fs.readFileSync(m,"utf8"));
for(const rel of data.files){const t=path.join(root,rel),b=path.join(data.backupRoot,rel);if(fs.existsSync(b)){fs.mkdirSync(path.dirname(t),{recursive:true});fs.copyFileSync(b,t)}else if(fs.existsSync(t))fs.rmSync(t,{force:true})}
fs.rmSync(m,{force:true});console.log("Editorial Design System 6.1 zurückgerollt.");


#!/usr/bin/env node
import fs from "node:fs";import path from "node:path";
const root=process.cwd(),m=path.join(root,".pfotentechnik-design-system-v3.5-manifest.json");
if(!fs.existsSync(m)){console.error("Kein Manifest gefunden.");process.exit(1)}
const x=JSON.parse(fs.readFileSync(m,"utf8"));
for(const p of [...x.files].reverse()){const t=path.join(root,p),s=path.join(x.backupRoot,p);if(fs.existsSync(s)){fs.mkdirSync(path.dirname(t),{recursive:true});fs.copyFileSync(s,t)}else if(fs.existsSync(t))fs.rmSync(t,{force:true})}
fs.rmSync(m,{force:true});console.log("Design System 3.5 zurückgerollt.");

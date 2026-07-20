#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root=process.cwd();
const here=path.dirname(fileURLToPath(import.meta.url));
const css="apps/pfotentechnik/src/styles/pfotentechnik-design-system-v3.5.css";
const layout="apps/pfotentechnik/src/layouts/ProjectLayout.astro";
const manifest=".pfotentechnik-design-system-v3.5-manifest.json";
const backup=path.join(root,`.pfotentechnik-design-system-v3.5-backup-${new Date().toISOString().replace(/[:.]/g,"-")}`);
const abs=p=>path.join(root,p);
const save=p=>{if(!fs.existsSync(abs(p)))return;const t=path.join(backup,p);fs.mkdirSync(path.dirname(t),{recursive:true});fs.copyFileSync(abs(p),t)};
const restore=p=>{const s=path.join(backup,p);if(fs.existsSync(s)){fs.mkdirSync(path.dirname(abs(p)),{recursive:true});fs.copyFileSync(s,abs(p))}else if(fs.existsSync(abs(p)))fs.rmSync(abs(p),{force:true})};
const touched=[css,layout];
try{
for(const p of ["package.json",layout,"apps/pfotentechnik/src/pages/vergleiche/index.astro","packages/affiliate-core/src/components/comparison/ComparisonShell.astro"])if(!fs.existsSync(abs(p)))throw new Error(`Fehlt: ${p}`);
touched.forEach(save);
fs.mkdirSync(path.dirname(abs(css)),{recursive:true});
fs.copyFileSync(path.join(here,"files",css),abs(css));
let text=fs.readFileSync(abs(layout),"utf8");
const line='import "../styles/pfotentechnik-design-system-v3.5.css";';
if(!text.includes(line)){
const anchors=['import "../styles/pfotentechnik-design-system-v3.4.css";','import "../styles/pfotentechnik-design-system-v3.3.css";','import "../styles/pfotentechnik-design-system-v3.css";'];
const a=anchors.find(x=>text.includes(x));
if(a)text=text.replace(a,`${a}\n${line}`);else{const i=text.indexOf("\n---",3);if(i<0)throw new Error("Frontmatter nicht erkannt");text=text.slice(0,i)+"\n"+line+text.slice(i)}
fs.writeFileSync(abs(layout),text);
}
fs.writeFileSync(abs(manifest),JSON.stringify({installedAt:new Date().toISOString(),backupRoot:backup,files:touched},null,2)+"\n");
console.log("Design System 3.5 installiert.");
}catch(e){[...touched].reverse().forEach(restore);console.error("Installation fehlgeschlagen; zurückgesetzt.");console.error(e.message);process.exit(1)}

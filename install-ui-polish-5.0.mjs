#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root=process.cwd();
const pkg=path.dirname(fileURLToPath(import.meta.url));
const target=path.join(root,"packages/affiliate-core/src/renderer/PremiumRenderer.astro");
const source=path.join(pkg,"PremiumRenderer.5.0.style.txt");
const manifest=path.join(root,".ui-polish-5.0-manifest.json");

if(!fs.existsSync(target)){console.error("PremiumRenderer.astro fehlt.");process.exit(1)}
let content=fs.readFileSync(target,"utf8");
if(!content.includes("premium-v3--pfotentechnik")){console.error("UI Polish 4.1 fehlt.");process.exit(1)}
if(!content.includes("project")){console.error("UI Polish 4.1.1 fehlt.");process.exit(1)}

const backupRoot=path.join(root,`.ui-polish-5.0-backup-${new Date().toISOString().replace(/[:.]/g,"-")}`);
const backup=path.join(backupRoot,path.relative(root,target));
fs.mkdirSync(path.dirname(backup),{recursive:true});
fs.copyFileSync(target,backup);

const css=fs.readFileSync(source,"utf8").trim();
const start=content.indexOf("<style>");
const end=content.lastIndexOf("</style>");
content=start>=0&&end>start?content.slice(0,start).trimEnd()+"\n\n"+css+"\n":content.trimEnd()+"\n\n"+css+"\n";
fs.writeFileSync(target,content,"utf8");

const result=fs.readFileSync(target,"utf8");
for(const needle of ["PremiumRenderer V2",".premium-v3-answer",".premium-v3-decision",".premium-v3-grid-products","@media(min-width:980px)"]){
  if(!result.includes(needle)){fs.copyFileSync(backup,target);console.error("Verifikation fehlgeschlagen:",needle);process.exit(1)}
}

const audit=path.join(root,"apps/pfotentechnik/UI_POLISH_5_0_AUDIT.json");
fs.writeFileSync(audit,JSON.stringify({
  installedAt:new Date().toISOString(),markdownChanges:0,mobileFirst:true,
  layouts:{answer:"spotlight",quickFacts:"numbered-bento",scenarios:"editorial-stories",
  decision:"numbered-process",checks:"quality-band",mistakes:"warning-grid",
  products:"mobile-swipe-desktop-grid"}
},null,2)+"\n");

fs.writeFileSync(manifest,JSON.stringify({backupRoot,files:[path.relative(root,target),path.relative(root,audit)]},null,2)+"\n");
console.log("UI Polish 5.0 installiert.");
console.log("Jetzt: npm run build:pfotentechnik");

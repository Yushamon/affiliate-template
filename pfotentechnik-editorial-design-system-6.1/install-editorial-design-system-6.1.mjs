#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
const root=process.cwd(),pkg=path.dirname(fileURLToPath(import.meta.url));
const renderer=path.join(root,"packages/affiliate-core/src/renderer/PremiumRenderer.astro");
const design=path.join(root,"apps/pfotentechnik/src/styles/pfotentechnik-design-system.css");
const manifest=path.join(root,".editorial-design-system-6.1-manifest.json");
for(const f of [renderer,design])if(!fs.existsSync(f)){console.error("Datei fehlt:",f);process.exit(1)}
let r=fs.readFileSync(renderer,"utf8"),g=fs.readFileSync(design,"utf8");
if(!r.includes("premium-v3-product-media")){console.error("6.0 Produktkartenstruktur fehlt.");process.exit(1)}
const backupRoot=path.join(root,`.editorial-design-system-6.1-backup-${new Date().toISOString().replace(/[:.]/g,"-")}`);
for(const f of [renderer,design]){const b=path.join(backupRoot,path.relative(root,f));fs.mkdirSync(path.dirname(b),{recursive:true});fs.copyFileSync(f,b)}
r=r.replace('products: "★"','products: "▦"').replace('expert: "★"','expert: "i"');
for(const [s,e] of [
["/* === PfotenTechnik Editorial Design System 6.0.1 Mobile Layout Hotfix === */","/* === End PfotenTechnik Editorial Design System 6.0.1 Mobile Layout Hotfix === */"],
["/* === PfotenTechnik Editorial Design System 6.0.2 Combined Fix === */","/* === End PfotenTechnik Editorial Design System 6.0.2 Combined Fix === */"],
["/* === PfotenTechnik Editorial Design System 6.1 === */","/* === End PfotenTechnik Editorial Design System 6.1 === */"]]){
 const a=r.indexOf(s),b=r.indexOf(e);if(a>=0&&b>a)r=r.slice(0,a).trimEnd()+"\n\n"+r.slice(b+e.length).trimStart()
}
const patch=fs.readFileSync(path.join(pkg,"PremiumRenderer.6.1.css"),"utf8").trim();
const close=r.lastIndexOf("</style>");if(close<0){console.error("Styleblock fehlt.");process.exit(1)}
r=r.slice(0,close).trimEnd()+"\n\n"+patch+"\n"+r.slice(close);fs.writeFileSync(renderer,r);
const gp=fs.readFileSync(path.join(pkg,"EditorialGlobal.6.1.css"),"utf8").trim();
const gs="/* === PfotenTechnik Editorial Design System 6.1 Global === */",ge="/* === End PfotenTechnik Editorial Design System 6.1 Global === */";
const a=g.indexOf(gs),b=g.indexOf(ge);g=a>=0&&b>a?g.slice(0,a).trimEnd()+"\n\n"+gp+"\n"+g.slice(b+ge.length).trimStart():g.trimEnd()+"\n\n"+gp+"\n";
fs.writeFileSync(design,g);
for(const [f,n] of [[renderer,"Editorial Design System 6.1"],[renderer,'products: "▦"'],[renderer,"-webkit-line-clamp:3"],[design,"safe-area-inset-bottom"]])if(!fs.readFileSync(f,"utf8").includes(n)){console.error("Verifikation fehlgeschlagen:",n);process.exit(1)}
const audit=path.join(root,"apps/pfotentechnik/EDITORIAL_DESIGN_SYSTEM_6_1_AUDIT.json");
fs.writeFileSync(audit,JSON.stringify({installedAt:new Date().toISOString(),version:"6.1",ratingScale:"0-100",starsRemoved:true,productCards:"v3",mobileFirst:true,replaces:["6.0.1","6.0.2"]},null,2)+"\n");
fs.writeFileSync(manifest,JSON.stringify({backupRoot,files:[path.relative(root,renderer),path.relative(root,design),path.relative(root,audit)]},null,2)+"\n");
console.log("Editorial Design System 6.1 installiert.");
console.log("Jetzt: npm run build:pfotentechnik");

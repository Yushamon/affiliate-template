#!/usr/bin/env node
import fs from "node:fs"; import path from "node:path";
const app=path.resolve(path.dirname(new URL(import.meta.url).pathname),"../..");
const dir=path.join(app,"src/content/products"), out=path.join(app,"reports/product-evidence");
fs.mkdirSync(out,{recursive:true});
const rows=fs.readdirSync(dir).filter(n=>/\.mdx?$/i.test(n)).sort().map(name=>{
 const raw=fs.readFileSync(path.join(dir,name),"utf8");
 const slug=(raw.match(/^slug:\s*["']?([^"'\n]+)["']?/m)?.[1]||name.replace(/\.mdx?$/i,"")).trim();
 return {slug,hasExternal:/^externalEvidence:\s*$/m.test(raw),professional:(raw.match(/^\s*-\s+publisher:/gm)||[]).length,userSources:(raw.match(/^\s*-\s+platform:/gm)||[]).length,consensus:(raw.match(/^\s+finding:/gm)||[]).length};
});
const covered=rows.filter(r=>r.hasExternal).length, complete=rows.filter(r=>r.professional&&r.userSources&&r.consensus).length;
const result={generatedAt:new Date().toISOString(),products:rows.length,covered,complete,missing:rows.filter(r=>!r.hasExternal).map(r=>r.slug),rows};
fs.writeFileSync(path.join(out,"latest.json"),JSON.stringify(result,null,2)+"\n");
fs.writeFileSync(path.join(out,"latest.md"),["# Product External Evidence Audit","",`- Produkte: ${rows.length}`,`- Mit externalEvidence: ${covered}`,`- Vollständig: ${complete}`,"","## Ohne Evidenz","",...result.missing.map(x=>`- ${x}`)].join("\n")+"\n");
console.log(`External Evidence: ${covered}/${rows.length}; vollständig: ${complete}`);

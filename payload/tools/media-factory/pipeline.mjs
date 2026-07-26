import fs from "node:fs/promises";
import path from "node:path";
import { CONFIG } from "./config.mjs";
import { analyzeSources, duplicateGroups } from "./analyzer.mjs";
import { brandProfile } from "./brands.mjs";
import { ensure, exists, readJson, rel, writeJson } from "./lib.mjs";

function promptFor(name,product,brand){
 const v=CONFIG.variants[name];
 return `Create a highly realistic product photograph of ${product.title||product.slug}. ${v.scene}
Use the supplied reference images as strict product identity references.
Preserve: ${brand.preserve.join(", ")}.
Manufacturer style: ${brand.style.join(", ")}.
Never introduce: ${brand.forbidden.join(", ")}.
The exact model variant and color must remain unchanged. Keep logos and text faithful; when uncertain, preserve the reference rather than inventing details.`;
}
async function outputRoot(appRoot){for(const c of CONFIG.outputCandidates)if(await exists(path.join(appRoot,c)))return path.join(appRoot,c);return path.join(appRoot,CONFIG.outputCandidates[0])}
async function normalize(sharp,src,dest,spec){await ensure(path.dirname(dest));await sharp(src,{failOn:"none"}).rotate().resize({width:spec.width,height:spec.height,fit:"contain",background:{r:250,g:250,b:248,alpha:1}}).webp({quality:CONFIG.quality,effort:5}).toFile(dest)}
export async function runProduct({repoRoot,slug,writeMd=false}){
 const appRoot=path.join(repoRoot,CONFIG.appRoot),sourceDir=path.join(appRoot,"media-source",slug);
 const {sharp,sources}=await analyzeSources(sourceDir);if(!sources.length)throw new Error(`Keine Referenzen in ${rel(repoRoot,sourceDir)}`);
 const info=await readJson(path.join(sourceDir,"import.json"),{}),product={slug,title:info.title||slug,manufacturer:info.manufacturer||"Generic"};
 const brand=await brandProfile(appRoot,product.manufacturer),outDir=path.join(await outputRoot(appRoot),slug),reviewDir=path.join(appRoot,"media-review",slug);
 await ensure(outDir);await ensure(reviewDir);
 const results={},prompts={}; let index=0;
 for(const [name,spec] of Object.entries(CONFIG.variants)){
  prompts[name]=promptFor(name,product,brand);
  const preferredGenerated=path.join(sourceDir,"generated",`${name}.png`);
  const preferredGeneratedWebp=path.join(sourceDir,"generated",`${name}.webp`);
  const src=await exists(preferredGenerated)?preferredGenerated:await exists(preferredGeneratedWebp)?preferredGeneratedWebp:sources[Math.min(index,sources.length-1)].file;
  const dest=path.join(outDir,`${name}.webp`);await normalize(sharp,src,dest,spec);
  results[name]={output:rel(appRoot,dest),source:rel(appRoot,src),mode:src.includes(`${path.sep}generated${path.sep}`)?"generated":"reference-derived"};
  index++;
 }
 const audit={version:CONFIG.version,generatedAt:new Date().toISOString(),product,sourceRanking:sources.map(s=>({file:rel(appRoot,s.file),bucket:s.bucket,width:s.width,height:s.height,score:Math.round(s.score)})),duplicateGroups:duplicateGroups(sources).map(g=>g.map(f=>rel(appRoot,f))),results,manualReviewRequired:true,limits:["Die kostenlose Version erzeugt keine KI-Bilder selbst.","Sie automatisiert Import, WebP, Größen, Benennung, Prompt-Paket, Duplikaterkennung, Ablage und Markdown-Update."]};
 await writeJson(path.join(reviewDir,"audit.json"),audit);await writeJson(path.join(reviewDir,"prompts.json"),prompts);
 await fs.writeFile(path.join(reviewDir,"README.md"),`# Bildpaket: ${product.title}\n\nErzeuge fehlende Bilder mit den Prompts aus prompts.json und lege sie als hero.png, thumbnail.png, comparison.png, gallery-1.png, gallery-2.png und gallery-3.png unter media-source/${slug}/generated/ ab. Danach denselben Build-Befehl erneut ausführen.\n`);
 if(writeMd)await updateMarkdown(appRoot,slug,results);
 return audit;
}
async function updateMarkdown(appRoot,slug,results){
 const file=path.join(appRoot,"src/content/products",`${slug}.md`);if(!await exists(file))return;
 let raw=await fs.readFile(file,"utf8"),end=raw.indexOf("\n---",3);if(!raw.startsWith("---")||end<0)return;
 const url=x=>x.startsWith("public/")?"/"+x.slice(7):"/"+x;
 const b=`# media-factory:start
images:
  hero: "${url(results.hero.output)}"
  thumbnail: "${url(results.thumbnail.output)}"
  comparison: "${url(results.comparison.output)}"
  gallery:
    - "${url(results["gallery-1"].output)}"
    - "${url(results["gallery-2"].output)}"
    - "${url(results["gallery-3"].output)}"
# media-factory:end`;
 raw=raw.includes("# media-factory:start")?raw.replace(/# media-factory:start[\s\S]*?# media-factory:end/,b):raw.slice(0,end)+"\n"+b+raw.slice(end);
 await fs.writeFile(file,raw);
}

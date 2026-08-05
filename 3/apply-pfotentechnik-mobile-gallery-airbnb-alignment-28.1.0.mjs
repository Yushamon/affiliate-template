#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-mobile-gallery-airbnb-alignment-28.1.0";
const log = (m) => console.log(`[${PATCH}] ${m}`);

function rootFrom(start) {
  let current = path.resolve(start);
  for (let i = 0; i < 16; i += 1) {
    if (fs.existsSync(path.join(current, "apps", "pfotentechnik", "package.json"))) return current;
    const parent = path.dirname(current); if (parent === current) break; current = parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}
function conflict(s) { return /^(<<<<<<<|=======|>>>>>>>)(?: .*)?$/m.test(s); }
function blockEnd(s, open) {
  let depth=0, quote="", esc=false;
  for (let i=open;i<s.length;i+=1) {
    const c=s[i];
    if (quote) { if (esc) esc=false; else if (c==="\\") esc=true; else if (c===quote) quote=""; continue; }
    if (c==='"'||c==="'") { quote=c; continue; }
    if (c==="{") depth+=1; else if (c==="}" && --depth===0) return i;
  }
  throw new Error("Block ist nicht geschlossen.");
}
function styleRange(s,label) {
  const a=s.indexOf("<style>"), b=s.lastIndexOf("</style>");
  if (a<0||b<a) throw new Error(`${label}: Style-Block fehlt.`);
  return {a:a+7,b,css:s.slice(a+7,b)};
}
function replaceRule(css, selector, body) {
  const found=[]; let pos=0;
  while (pos<css.length) {
    const i=css.indexOf(selector,pos); if (i<0) break;
    let j=i+selector.length; while (/\s/.test(css[j]||"")) j+=1;
    if (css[j]==="{") { const e=blockEnd(css,j); found.push({i,e:e+1}); pos=e+1; } else pos=i+selector.length;
  }
  if (found.length!==1) throw new Error(`CSS-Regel ${selector}: ${found.length} Treffer.`);
  const m=found[0]; return css.slice(0,m.i)+`${selector} {\n${body.trim()}\n  }`+css.slice(m.e);
}
function replaceStyle(s,label,fn) { const r=styleRange(s,label); return s.slice(0,r.a)+fn(r.css)+s.slice(r.b); }
function appendStyle(s,label,css) { const i=s.lastIndexOf("</style>"); if(i<0) throw new Error(`${label}: Style-Ende fehlt.`); return s.slice(0,i)+"\n"+css.trim()+"\n"+s.slice(i); }
function write(file,content,root) {
  const n=content.replace(/\r\n/g,"\n").replace(/\s+$/u,"")+"\n";
  const c=fs.existsSync(file)?fs.readFileSync(file,"utf8").replace(/\r\n/g,"\n"):"";
  if(c===n){log(`Bereits aktuell: ${path.relative(root,file)}`);return;}
  fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,n,"utf8");log(`Geändert: ${path.relative(root,file)}`);
}
function run(cmd,args,label,cwd){log(`Prüfe: ${label}`);const exe=process.platform==="win32"&&cmd==="npm"?"npm.cmd":cmd;const r=spawnSync(exe,args,{cwd,stdio:"inherit",shell:false,env:process.env});if(r.error)throw r.error;if(r.status!==0)throw new Error(`${label} fehlgeschlagen (Exit ${r.status}).`);log(`BESTANDEN: ${label}`);}

const ROOT=rootFrom(process.cwd()), APP=path.join(ROOT,"apps","pfotentechnik");
const G=path.join(APP,"src/components/product-experience-2/ProductGallery2.astro");
const H=path.join(APP,"src/components/product-experience-2/ProductHero2.astro");
const P=path.join(APP,"package.json");
const T=path.join(APP,"test/mobile-gallery-airbnb-alignment-28.1.0.test.mjs");
for(const [label,file] of [["Galerie",G],["Hero",H],["package.json",P]]){if(!fs.existsSync(file))throw new Error(`${label} fehlt.`);const s=fs.readFileSync(file,"utf8");if(conflict(s))throw new Error(`${label}: Git-Konfliktmarker.`);}
let gallery=fs.readFileSync(G,"utf8").replace(/\r\n/g,"\n");
let hero=fs.readFileSync(H,"utf8").replace(/\r\n/g,"\n");
for(const m of ["data-px2-editorial-gallery","px2-editorial-gallery__mobile","px2-editorial-gallery__slide","px2-editorial-gallery__mobile-meta"])if(!gallery.includes(m))throw new Error(`Galerie-Anker fehlt: ${m}`);
if(!hero.includes("px2-hero__media"))throw new Error("Hero-Media-Wrapper fehlt.");
const pkg=JSON.parse(fs.readFileSync(P,"utf8"));for(const s of ["lint:content","build"])if(typeof pkg.scripts?.[s]!=="string")throw new Error(`npm-Skript fehlt: ${s}`);

gallery=replaceStyle(gallery,"Galerie",css=>{
  let n=css;
  n=replaceRule(n,".px2-editorial-gallery__mobile",`position: relative;\n    display: flex;\n    width: 100%;\n    overflow-x: auto;\n    overscroll-behavior-inline: contain;\n    scroll-snap-type: x mandatory;\n    scrollbar-width: none;\n    border-radius: 0;\n    background: var(--px2-surface-soft);`);
  n=replaceRule(n,".px2-editorial-gallery__slide",`flex: 0 0 100%;\n    width: 100%;\n    height: auto;\n    aspect-ratio: 1 / 1;\n    padding: 0;\n    overflow: hidden;\n    border: 0;\n    background: var(--px2-surface-raised);\n    scroll-snap-align: start;\n    scroll-snap-stop: always;\n    cursor: zoom-in;`);
  n=replaceRule(n,".px2-editorial-gallery__mobile-meta",`position: absolute;\n    z-index: 4;\n    right: 0;\n    bottom: 12px;\n    left: 0;\n    display: flex;\n    align-items: center;\n    justify-content: space-between;\n    gap: 10px;\n    margin: 0;\n    padding-inline: max(16px, env(safe-area-inset-left)) max(16px, env(safe-area-inset-right));\n    pointer-events: none;`);
  n=replaceRule(n,".px2-editorial-gallery__mobile-meta span",`padding: 6px 10px;\n    border-radius: 999px;\n    background: rgba(10, 16, 13, .78);\n    color: #fff;\n    box-shadow: 0 4px 18px rgba(0,0,0,.2);\n    backdrop-filter: blur(10px);\n    font-size: .75rem;\n    font-weight: 850;\n    pointer-events: auto;`);
  n=replaceRule(n,".px2-editorial-gallery__mobile-meta button",`display: inline-flex;\n    align-items: center;\n    gap: 7px;\n    min-height: 42px;\n    margin-left: auto;\n    padding: 8px 12px;\n    border: 1px solid rgba(255,255,255,.36);\n    border-radius: 12px;\n    background: rgba(10,28,20,.82);\n    color: #fff;\n    box-shadow: 0 4px 18px rgba(0,0,0,.22);\n    backdrop-filter: blur(10px);\n    font-size: .82rem;\n    font-weight: 850;\n    cursor: pointer;\n    pointer-events: auto;`);
  return n;
});
if(!gallery.includes("data-gallery-airbnb-mobile")) gallery=gallery.replace("data-px2-editorial-gallery",'data-px2-editorial-gallery data-gallery-airbnb-mobile');
if(!gallery.includes("object-fit: cover;")) gallery=appendStyle(gallery,"Galerie",`@media (max-width: 759px) {\n  .px2-editorial-gallery { position: relative; width: 100%; max-width: none; margin: 0; }\n  .px2-editorial-gallery__slide img { width: 100%; height: 100%; object-fit: cover; object-position: center; background: transparent; }\n  .px2-editorial-gallery__empty { margin-inline: 16px; }\n}`);
if(!hero.includes("data-mobile-gallery-full-bleed")) hero=hero.replace('<div class="px2-hero__media">','<div class="px2-hero__media" data-mobile-gallery-full-bleed>');
if(!hero.includes("margin-left: -50dvw")) hero=appendStyle(hero,"Hero",`@media (max-width: 759px) {\n  .px2-hero__media[data-mobile-gallery-full-bleed] { position: relative; left: 50%; width: 100vw; width: 100dvw; max-width: 100vw; max-width: 100dvw; margin-left: -50vw; margin-left: -50dvw; }\n}`);
const test=`import assert from "node:assert/strict";\nimport fs from "node:fs";\nimport path from "node:path";\nimport test from "node:test";\nconst g=fs.readFileSync(path.join(process.cwd(),"src/components/product-experience-2/ProductGallery2.astro"),"utf8");\nconst h=fs.readFileSync(path.join(process.cwd(),"src/components/product-experience-2/ProductHero2.astro"),"utf8");\ntest("full bleed",()=>{assert.match(h,/data-mobile-gallery-full-bleed/);assert.match(h,/width: 100dvw/);assert.match(h,/margin-left: -50dvw/);});\ntest("no artificial whitespace",()=>{assert.match(g,/aspect-ratio: 1 \\/ 1/);assert.match(g,/object-fit: cover/);assert.doesNotMatch(g,/height: clamp\\(300px, 92vw, 460px\\)/);});\ntest("controls overlay image",()=>{assert.match(g,/bottom: 12px/);assert.match(g,/position: absolute/);assert.match(g,/pointer-events: none/);});\ntest("desktop and single image remain",()=>{assert.match(g,/px2-editorial-gallery__desktop/);assert.match(g,/is-single/);});\n`;
const B=path.join(ROOT,".patch-backups",`${PATCH}-${new Date().toISOString().replace(/[:.]/g,"-")}`);fs.mkdirSync(B,{recursive:true});for(const f of [G,H,T])if(fs.existsSync(f)){const d=path.join(B,path.relative(ROOT,f));fs.mkdirSync(path.dirname(d),{recursive:true});fs.copyFileSync(f,d);}log(`Backup: ${path.relative(ROOT,B)}`);
const rollback=()=>{for(const f of [G,H,T]){const b=path.join(B,path.relative(ROOT,f));if(fs.existsSync(b)){fs.mkdirSync(path.dirname(f),{recursive:true});fs.copyFileSync(b,f);}else if(f===T&&fs.existsSync(f))fs.rmSync(f,{force:true});}};
try{write(G,gallery,ROOT);write(H,hero,ROOT);write(T,test,ROOT);run(process.execPath,["--check",path.relative(APP,T)],"Syntaxprüfung Galerie-Test",APP);run(process.execPath,["--test",path.relative(APP,T)],"Mobile-Galerie-Test",APP);run("npm",["--workspace","apps/pfotentechnik","run","lint:content"],"Content-Lint",ROOT);run("npm",["--workspace","apps/pfotentechnik","run","build"],"Astro-Build",ROOT);const gi=fs.readFileSync(G,"utf8"),hi=fs.readFileSync(H,"utf8");for(const m of ["aspect-ratio: 1 / 1","object-fit: cover","bottom: 12px"])if(!gi.includes(m))throw new Error(`Galerie-Ziel fehlt: ${m}`);for(const m of ["width: 100dvw","margin-left: -50dvw"])if(!hi.includes(m))throw new Error(`Hero-Ziel fehlt: ${m}`);if(gi.includes("height: clamp(300px, 92vw, 460px)"))throw new Error("Legacy-Höhenregel bleibt aktiv.");log("Abgeschlossen: randlose, bildfüllende Mobile-Galerie.");}catch(e){rollback();log(`FEHLER: ${e instanceof Error?e.message:String(e)}`);log("Änderungen wurden zurückgerollt.");process.exitCode=1;}

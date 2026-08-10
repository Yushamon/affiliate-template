#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH="pfotentechnik-anchor-governance-source-route-fix-33.3.0";
const log=(m)=>console.log(`[${PATCH}] ${m}`);

function root(start=process.cwd()){
  let d=path.resolve(start);
  for(let i=0;i<16;i++){
    if(fs.existsSync(path.join(d,"apps","pfotentechnik","package.json"))) return d;
    const p=path.dirname(d); if(p===d) break; d=p;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}
const repo=root(), app=path.join(repo,"apps","pfotentechnik");
const audit=path.join(app,"scripts","audit-anchor-governance.mjs");
const test=path.join(app,"test","anchor-governance-source-route-fix-33.3.0.test.mjs");
if(!fs.existsSync(audit)) throw new Error("Anchor-Governance-Audit fehlt.");

const old=fs.readFileSync(audit,"utf8").replace(/\r\n/g,"\n");
const oldTest=fs.existsSync(test)?fs.readFileSync(test,"utf8"):null;
const backup=path.join(repo,".patch-backups",`${PATCH}-${new Date().toISOString().replace(/[:.]/g,"-")}`);
for(const [f,c] of [[audit,old],[test,oldTest]]){
  if(c==null) continue;
  const dst=path.join(backup,path.relative(repo,f)); fs.mkdirSync(path.dirname(dst),{recursive:true}); fs.writeFileSync(dst,c);
}
log(`Backup: ${path.relative(repo,backup)}`);

const needle=`  const routes = new Set();
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (entry.name === "index.html") {
        const relative = path.relative(dist, file).replace(/\\\\/g, "/");
        routes.add(relative === "index.html" ? "/" : "/" + relative.slice(0, -10));
      }
    }
  };
  walk(dist);
`;

const replacement=`  // Governance is a source-level contract. The release preflight runs before a
  // fresh Astro build, so dist/ can legitimately be stale. Build the route
  // inventory from source content first and only use dist as an additional
  // signal for static/non-content routes.
  const routes = new Set();
  const addRoute = (value) => {
    const route = normPath(value);
    if (route) routes.add(route);
  };
  const readSlug = (file) => {
    const source = fs.readFileSync(file, "utf8");
    const frontmatter = source.match(/^---\\\\s*\\\\n([\\\\s\\\\S]*?)\\\\n---/);
    if (!frontmatter) return "";
    const slug = frontmatter[1].match(/^slug:\\\\s*["']?([^"'\\\\n#]+?)["']?\\\\s*$/m);
    return slug ? slug[1].trim() : "";
  };
  const collectContentRoutes = (dir, prefix = "/") => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) collectContentRoutes(file, prefix);
      else if (entry.isFile() && /\\\\.mdx?$/.test(entry.name)) {
        const slug = readSlug(file) || entry.name.replace(/\\\\.mdx?$/, "");
        addRoute(prefix + slug + "/");
      }
    }
  };
  collectContentRoutes(path.join(app, "src/content/pages"), "/");
  collectContentRoutes(path.join(app, "src/content/comparisons"), "/vergleiche/");
  collectContentRoutes(path.join(app, "src/content/products"), "/produkt/");
  collectContentRoutes(path.join(app, "src/content/manufacturers"), "/hersteller/");

  const walkDist = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walkDist(file);
      else if (entry.name === "index.html") {
        const relative = path.relative(dist, file).replace(/\\\\/g, "/");
        addRoute(relative === "index.html" ? "/" : "/" + relative.slice(0, -10));
      }
    }
  };
  walkDist(dist);
`;

try{
  let src=old;
  if(src.includes(needle)) src=src.replace(needle,replacement);
  else if(src.includes("collectContentRoutes(path.join(app, \"src/content/pages\")")) log("Source-Route-Inventar bereits vorhanden.");
  else throw new Error("Erwarteter Route-Inventar-Block nicht gefunden; Audit wurde inzwischen strukturell geändert.");
  fs.writeFileSync(audit,src,"utf8");
  log(`Geändert: ${path.relative(repo,audit)}`);

  const t=`import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const audit=fs.readFileSync(path.join(app,"scripts/audit-anchor-governance.mjs"),"utf8");

test("Anchor Governance validiert Source-Routen",()=>{
  assert.match(audit,/collectContentRoutes\\(path\\.join\\(app, "src\\/content\\/pages"\\), "\\/"\\)/);
  assert.match(audit,/collectContentRoutes\\(path\\.join\\(app, "src\\/content\\/comparisons"\\), "\\/vergleiche\\/"\\)/);
  assert.match(audit,/walkDist\\(dist\\)/);
});

test("dist ist nur Zusatzsignal",()=>{
  const sourcePos=audit.indexOf('collectContentRoutes(path.join(app, "src/content/pages")');
  const distPos=audit.indexOf("walkDist(dist)");
  assert.ok(sourcePos>=0 && distPos>sourcePos);
});

test("bestehende Governance-Prüfungen bleiben",()=>{
  for(const code of ["ANCHOR_TARGET_REDIRECT","ANCHOR_TARGET_MISSING","ANCHOR_PRIORITY_INVALID","ANCHOR_OVERLAP_CONFLICT"])
    assert.match(audit,new RegExp(code));
});
`;
  fs.mkdirSync(path.dirname(test),{recursive:true}); fs.writeFileSync(test,t,"utf8");
  log(`Geschrieben: ${path.relative(repo,test)}`);

  const run=(cmd,args,label)=>{
    log(`Prüfe: ${label}`);
    const exe=process.platform==="win32"&&cmd==="npm"?"npm.cmd":cmd;
    const r=spawnSync(exe,args,{cwd:repo,stdio:"inherit",shell:false});
    if(r.error) throw r.error;
    if(r.status!==0) throw new Error(`${label} fehlgeschlagen (Exit ${r.status}).`);
    log(`BESTANDEN: ${label}`);
  };
  run("node",["--check",audit],"Syntax Audit");
  run("node",["--test",test],"Regressionstest");
  run("npm",["--workspace","apps/pfotentechnik","run","audit:anchor-governance:strict"],"Anchor-Governance strict");
  log("Abgeschlossen. Die 15 False-Positive-Missing-Targets müssen damit verschwinden; echte Fehler bleiben strict-kritisch.");
}catch(e){
  fs.writeFileSync(audit,old,"utf8");
  if(oldTest==null) fs.rmSync(test,{force:true}); else fs.writeFileSync(test,oldTest,"utf8");
  console.error(`[${PATCH}] FEHLER: ${e instanceof Error?e.message:String(e)}`);
  console.error(`[${PATCH}] Änderungen wurden zurückgerollt.`);
  process.exit(1);
}

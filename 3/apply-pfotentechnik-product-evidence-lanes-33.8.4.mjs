#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-product-evidence-lanes-33.8.4";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = path.join(root, "apps", "pfotentechnik");
const queue = path.join(app, "scripts", "product-evidence", "research-queue.mjs");
const testFile = path.join(app, "test", "product-evidence-lanes-33.8.4.test.mjs");

if (!fs.existsSync(queue)) throw new Error(`[${PATCH}] research-queue.mjs fehlt.`);
let src = fs.readFileSync(queue, "utf8");

if (!src.includes('gsc-dashboard-ranges.json') || !src.includes('evidence.status!=="complete"')) {
  throw new Error(`[${PATCH}] Erwarteter 33.8.x-Stand nicht gefunden.`);
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backup = path.join(root, ".patch-backups", `${PATCH}-${stamp}`);
const backupFile = path.join(backup, path.relative(root, queue));
fs.mkdirSync(path.dirname(backupFile), { recursive: true });
fs.copyFileSync(queue, backupFile);

const rep = (a,b,label) => {
  if (!src.includes(a)) throw new Error(`Patchanker fehlt: ${label}`);
  src = src.replace(a,b);
};

rep('const limit = Math.max(1, Number(arg("--limit")) || 30);',
    'const limit = Math.max(1, Number(arg("--limit")) || 30);\nconst laneArg = (arg("--lane") || "all").toUpperCase();',
    "lane");

rep('const confidence = (i) => i>=20?1:i>=10?.9:i>=6?.75:i>=3?.55:i>=1?.35:.2;',
    'const confidence = (i) => i>=20?1:i>=10?.9:i>=6?.75:i>=3?.55:i>=1?.35:0;',
    "confidence");

rep('const gap = (e) => e.status==="missing"?30:e.status==="complete"?0:Math.round(30*e.missingParts.length/3);',
`const gap = (e) => e.status==="missing"?30:e.status==="complete"?0:Math.round(30*e.missingParts.length/3);
const classifyLane = (search, ctx, ev) => {
  const hasSearch = search.impressions > 0 || ctx.impressions > 0;
  if (!hasSearch) return "BACKLOG";
  if (search.impressions >= 3 || ctx.impressions >= 5) return "NOW";
  if (ev.status === "partial" && search.impressions >= 1) return "NOW";
  return "WATCH";
};`,
"classify");

rep('const searchWeighted=Math.round(searchBase*cf), evidenceGap=gap(ev), commercial=field(raw,"recommendationStatus")==="recommended"?5:2, total=Math.min(100,searchWeighted+evidenceGap+commercial);',
`const searchWeighted=Math.round(searchBase*cf), evidenceGap=gap(ev), commercial=field(raw,"recommendationStatus")==="recommended"?5:2;
  const rawTotal=Math.min(100,searchWeighted+evidenceGap+commercial);
  const lane=classifyLane(search,ctx,ev);
  const total=lane==="BACKLOG"?0:rawTotal;`,
"score");

rep('return { file:"src/content/products/"+name, slug, title, evidence:ev, search:{primaryRange:primaryKey,impressions:search.impressions,clicks:search.clicks,position:search.position,ctr:search.ctr,contextRange:contextKey,contextImpressions:ctx.impressions,queries:search.queries,confidence:cf}, score:{total,searchBase,searchWeighted,evidenceGap,commercial}, action:ev.status==="partial"?"complete-evidence":(!search.impressions&&!ctx.impressions?"research-low-search-signal":"research") };',
'return { file:"src/content/products/"+name, slug, title, lane, evidence:ev, search:{primaryRange:primaryKey,impressions:search.impressions,clicks:search.clicks,position:search.position,ctr:search.ctr,contextRange:contextKey,contextImpressions:ctx.impressions,queries:search.queries,confidence:cf}, score:{total,rawTotal,searchBase,searchWeighted,evidenceGap,commercial}, action:ev.status==="partial"?"complete-evidence":(lane==="BACKLOG"?"backlog-research":"research") };',
"return");

rep('}).filter((p)=>p.evidence.status!=="complete").sort((a,b)=>b.score.total-a.score.total||b.search.impressions-a.search.impressions||b.search.contextImpressions-a.search.contextImpressions||a.title.localeCompare(b.title,"de"));\nconst selected=products.slice(0,limit);',
`}).filter((p)=>p.evidence.status!=="complete").sort((a,b)=>{
  const order={NOW:0,WATCH:1,BACKLOG:2};
  return order[a.lane]-order[b.lane]||b.score.total-a.score.total||b.search.impressions-a.search.impressions||b.search.contextImpressions-a.search.contextImpressions||a.title.localeCompare(b.title,"de");
});
const filtered=laneArg==="ALL"?products:products.filter((p)=>p.lane===laneArg);
const selected=filtered.slice(0,limit);`,
"sort");

rep('const payload={generatedAt:new Date().toISOString(),source:{provider:"google",file:fs.existsSync(dashboardFile)?"gsc-dashboard-ranges.json":null,primaryRange:primaryKey,contextRange:contextKey},counts:{open:products.length,selected:selected.length,missing:products.filter((p)=>p.evidence.status==="missing").length,partial:products.filter((p)=>p.evidence.status==="partial").length},rules,products:selected};',
'const payload={generatedAt:new Date().toISOString(),source:{provider:"google",file:fs.existsSync(dashboardFile)?"gsc-dashboard-ranges.json":null,primaryRange:primaryKey,contextRange:contextKey},lane:laneArg,counts:{open:products.length,selected:selected.length,missing:products.filter((p)=>p.evidence.status==="missing").length,partial:products.filter((p)=>p.evidence.status==="partial").length,now:products.filter((p)=>p.lane==="NOW").length,watch:products.filter((p)=>p.lane==="WATCH").length,backlog:products.filter((p)=>p.lane==="BACKLOG").length},rules,products:selected};',
"payload");

rep('"- Priorität: "+p.score.total+"/100"',
    '"- Lane: "+p.lane,"- Priorität: "+(p.lane==="BACKLOG"?"BACKLOG":p.score.total+"/100")',
    "brief");

rep('"- Teilweise: "+payload.counts.partial,"",...selected.flatMap(brief)',
    '"- Teilweise: "+payload.counts.partial,"- NOW: "+payload.counts.now,"- WATCH: "+payload.counts.watch,"- BACKLOG: "+payload.counts.backlog,"- Filter: "+laneArg,"",...selected.flatMap(brief)',
    "md");

rep('console.log("Research Queue: "+selected.length+"/"+products.length+" offene Produkte · GSC: "+(primary?primaryKey:"nicht verfügbar")+" · partial: "+payload.counts.partial);',
    'console.log("Research Queue: "+selected.length+"/"+filtered.length+" im Filter "+laneArg+" · NOW "+payload.counts.now+" · WATCH "+payload.counts.watch+" · BACKLOG "+payload.counts.backlog);',
    "log");

const test = `import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const s=fs.readFileSync(path.join(app,"scripts/product-evidence/research-queue.mjs"),"utf8");

test("Queue besitzt NOW WATCH BACKLOG",()=>{assert.ok(s.includes("classifyLane"));assert.ok(s.includes('"NOW"'));assert.ok(s.includes('"WATCH"'));assert.ok(s.includes('"BACKLOG"'));});
test("BACKLOG bekommt Score 0",()=>assert.ok(s.includes('const total=lane==="BACKLOG"?0:rawTotal;')));
test("ohne Impressionen ist Confidence 0",()=>{assert.ok(s.includes('i>=1?.35:0;'));assert.ok(!s.includes('i>=1?.35:.2;'));});
test("CLI kann Lane filtern",()=>{assert.ok(s.includes("--lane"));assert.ok(s.includes('laneArg==="ALL"'));});
test("vollständige Evidence-Produkte bleiben ausgeschlossen",()=>assert.ok(s.includes('evidence.status!=="complete"')));
test("nur GSC priorisiert Search",()=>{assert.ok(s.includes("gsc-dashboard-ranges.json"));assert.ok(!s.includes("search-dashboard-ranges.json"));assert.ok(!s.includes("bing-dashboard"));});
`;

try {
  fs.writeFileSync(queue, src, "utf8");
  fs.writeFileSync(testFile, test, "utf8");

  const checks = [
    ["Queue-Syntax", ["--check", queue]],
    ["Test-Syntax", ["--check", testFile]],
    ["Regressionstests", ["--test", testFile]],
    ["NOW-Queue", [queue, "--lane=NOW", "--limit=10"]]
  ];

  for (const [label,args] of checks) {
    console.log(`[${PATCH}] Prüfe: ${label}`);
    const r=spawnSync(process.execPath,args,{cwd:root,stdio:"inherit"});
    if(r.status!==0) throw new Error(`${label} fehlgeschlagen (Exit ${r.status})`);
    console.log(`[${PATCH}] BESTANDEN: ${label}`);
  }

  console.log(`[${PATCH}] Abgeschlossen.`);
  console.log(`[${PATCH}] Backup: ${path.relative(root, backup)}`);
} catch (error) {
  fs.copyFileSync(backupFile, queue);
  if (fs.existsSync(testFile)) fs.rmSync(testFile);
  console.error(`[${PATCH}] FEHLER: ${error instanceof Error ? error.message : String(error)}`);
  console.error(`[${PATCH}] Änderungen wurden zurückgerollt.`);
  process.exit(1);
}

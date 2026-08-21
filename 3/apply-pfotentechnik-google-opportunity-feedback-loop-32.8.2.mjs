#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const TAG="[pfotentechnik-google-opportunity-feedback-loop-32.8.2]";
const root=process.cwd();
const file=path.join(root,"apps/pfotentechnik/src/pages/admin/seo/cockpit.astro");
const replacements=[["Service-Konfiguration Frontmatter", "const recovery = loadSeoRecovery();\nconst opportunityState = readOpportunityState();", "const recovery = loadSeoRecovery();\nconst opportunityServiceUrl = import.meta.env.PUBLIC_SEARCH_ADMIN_URL || \"http://127.0.0.1:4178\";\nconst serializedOpportunityConfig = JSON.stringify({ serviceUrl: opportunityServiceUrl }).replaceAll(\"<\", \"\\\\u003c\");\nconst opportunityState = readOpportunityState();"], ["Service-Konfiguration DOM", "    <script type=\"application/json\" data-search-json set:html={serializedPayload}></script>", "    <script type=\"application/json\" data-opportunity-config set:html={serializedOpportunityConfig}></script>\n    <script type=\"application/json\" data-search-json set:html={serializedPayload}></script>"], ["Client Service-URL", "    const postJson = async (url: string, body: Record<string, unknown>) => {\n      const response = await fetch(url, {", "    const opportunityConfigNode = root.querySelector<HTMLScriptElement>(\"[data-opportunity-config]\");\n    const opportunityConfig = JSON.parse(opportunityConfigNode?.textContent || \"{}\");\n    const opportunityServiceUrl = String(\n      opportunityConfig.serviceUrl || \"http://127.0.0.1:4178\"\n    ).replace(/\\/$/, \"\");\n\n    const postJson = async (url: string, body: Record<string, unknown>) => {\n      const response = await fetch(`${opportunityServiceUrl}${url}`, {"]];

const fail=(m)=>{console.error(`${TAG} FEHLER: ${m}`);process.exit(1)};
const log=(m)=>console.log(`${TAG} ${m}`);

if(!fs.existsSync(file)) fail(`Datei fehlt: ${path.relative(root,file)}`);
let source=fs.readFileSync(file,"utf8");
const original=source;

for(const [label,before,after] of replacements){
  if(source.includes(after)){log(`${label}: bereits aktuell.`);continue}
  const count=source.split(before).length-1;
  if(count!==1) fail(`${label}: Ausgangsmuster kommt ${count}× vor. Erwartet wird 32.8.1.`);
  source=source.replace(before,after);
  log(`${label}: aktualisiert.`);
}

for(const token of ["PUBLIC_SEARCH_ADMIN_URL","data-opportunity-config","http://127.0.0.1:4178","opportunityServiceUrl"]) {
  if(!source.includes(token)) fail(`Sicherheitscheck fehlgeschlagen: ${token}`);
}
if(source.includes("const response = await fetch(url, {")) fail("Relative Opportunity-API ist noch enthalten.");

if(source===original){log("Keine Änderungen nötig.");process.exit(0)}

const tmp=`${file}.tmp-${process.pid}-${Date.now()}`;
fs.writeFileSync(tmp,source,"utf8");
fs.renameSync(tmp,file);

log(`Aktualisiert: ${path.relative(root,file)}`);
log("Opportunity-API nutzt jetzt PUBLIC_SEARCH_ADMIN_URL bzw. http://127.0.0.1:4178.");
log("Keine .bak-Datei angelegt.");
console.log("\nJetzt prüfen:");
console.log("  npm --workspace apps/pfotentechnik run build");
console.log("  git diff -- apps/pfotentechnik/src/pages/admin/seo/cockpit.astro");
console.log("\nFalls der Search-Admin schon vor 32.8.1 lief: Prozess auf Port 4178 einmal neu starten.");

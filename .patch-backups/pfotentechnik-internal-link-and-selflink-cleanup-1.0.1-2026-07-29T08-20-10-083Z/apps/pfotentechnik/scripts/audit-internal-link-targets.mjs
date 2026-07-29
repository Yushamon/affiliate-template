#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const strict = process.argv.includes("--strict");
const root = process.cwd();
const app = path.join(root, "apps", "pfotentechnik");
const dist = path.join(app, "dist");
const redirectsFile = path.join(app, "public", "_redirects");
const reportDir = path.join(app, "reports", "internal-linking");
const HOSTS = new Set(["pfotentechnik.de", "www.pfotentechnik.de"]);
const FUNCTIONAL = new Set(["filter", "tab", "sort", "view", "page", "step"]);
const findings = [];
const add = (severity, code, details) => findings.push({ severity, code, ...details });
const normPath = (value) => {
  let input = String(value ?? "").trim();
  if (!input || input.startsWith("#")) return input;
  try {
    const url = new URL(input, "https://pfotentechnik.de/");
    if (!HOSTS.has(url.hostname.toLowerCase())) return "";
    let p = url.pathname.replace(/\/{2,}/g, "/");
    return p === "/" ? "/" : p.replace(/\/+$/, "") + "/";
  } catch { return ""; }
};
const redirects = new Map();
for (const line of fs.readFileSync(redirectsFile, "utf8").split(/\r?\n/)) {
  const parts = line.trim().split(/\s+/);
  if (parts.length >= 3 && /^30[1278]$/.test(parts[2])) {
    const from = normPath(parts[0]); const to = normPath(parts[1]);
    if (from && to && to.startsWith("/vergleiche/") && !from.startsWith("/vergleiche/")) redirects.set(from, to);
  }
}
const resolve = (value) => { let p = normPath(value); const seen = new Set(); while (redirects.has(p) && !seen.has(p)) { seen.add(p); p = redirects.get(p); } return p; };
const isInternal = (value) => {
  const input = String(value ?? "").trim();
  if (!input || /^(mailto:|tel:|sms:|javascript:|data:)/i.test(input)) return false;
  if (input.startsWith("/") || input.startsWith("#")) return true;
  try { return HOSTS.has(new URL(input).hostname.toLowerCase()); } catch { return false; }
};
const functionalState = (value) => {
  try { const u = new URL(value, "https://pfotentechnik.de/"); const q = new URLSearchParams(); for (const [k,v] of u.searchParams) if (FUNCTIONAL.has(k)) q.append(k,v); return q.toString(); } catch { return ""; }
};
const walk = (dir, out=[]) => { if (!fs.existsSync(dir)) return out; for (const e of fs.readdirSync(dir,{withFileTypes:true})) { const f=path.join(dir,e.name); if(e.isDirectory()) walk(f,out); else out.push(f); } return out; };
const htmlFiles = walk(dist).filter((f) => f.endsWith(".html"));
const existing = new Set(htmlFiles.map((file) => {
  const r = path.relative(dist, file).replace(/\\/g,"/");
  if (r === "index.html") return "/";
  if (r.endsWith("/index.html")) return "/" + r.slice(0,-11) + "/";
  return "/" + r.replace(/.html$/, "") + "/";
}));
for (const file of htmlFiles) {
  const html = fs.readFileSync(file,"utf8");
  const canonicalRaw = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1]
    ?? html.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["']/i)?.[1];
  const canonical = resolve(canonicalRaw);
  if (!canonical) add("error","CANONICAL_MISSING",{file:path.relative(root,file)});
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? html;
  for (const match of main.matchAll(/<a\b([^>]*?)href=["']([^"']*)["']([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const attrs = match[1] + " " + match[3]; const href = match[2]; const inner = match[4];
    if (!href.trim()) add("error","EMPTY_LINK_TARGET",{file:path.relative(root,file),canonical,href,className:attrs.match(/class=["']([^"']+)/i)?.[1]});
    if (!isInternal(href) || href.startsWith("#")) continue;
    const rawPath = normPath(href); const finalPath = resolve(href);
    if (redirects.has(rawPath)) add("error","LEGACY_COMPARISON_LINK",{file:path.relative(root,file),canonical,href,expected:finalPath});
    const functional = functionalState(href);
    if (canonical && finalPath === canonical && !functional) add("error","SELF_LINK",{file:path.relative(root,file),canonical,href,normalizedTarget:finalPath,cause:attrs.match(/class=["']([^"']+)/i)?.[1] ?? "main-content"});
    if (finalPath && finalPath.startsWith("/") && !existing.has(finalPath) && !finalPath.startsWith("/api/") && !/\.[a-z0-9]{2,5}\/$/i.test(finalPath)) add("error","TARGET_404",{file:path.relative(root,file),canonical,href,normalizedTarget:finalPath});
    if (/\b(?:card|cta)\b/i.test(attrs) && !inner.replace(/<[^>]+>/g,"").trim()) add("error","EMPTY_LINK_CARD",{file:path.relative(root,file),canonical,href});
  }
  for (const section of main.matchAll(/<section\b[^>]*(?:pt-next-steps|related)[^>]*>([\s\S]*?)<\/section>/gi)) {
    if (!/<a\b|<button\b/i.test(section[1])) add("error","EMPTY_RECOMMENDATION_BLOCK",{file:path.relative(root,file),canonical});
  }
}
const errors = findings.filter((f)=>f.severity==="error");
fs.mkdirSync(reportDir,{recursive:true});
const report = { version:"1.0.0", generatedAt:new Date().toISOString(), strict, summary:{pages:htmlFiles.length,redirectAliases:redirects.size,errors:errors.length}, findings };
fs.writeFileSync(path.join(reportDir,"internal-link-target-audit.json"),JSON.stringify(report,null,2)+"\n","utf8");
const md=["# Audit interne Vergleichslinks und Selbstlinks","","Erstellt: " + report.generatedAt,"","- Gebaute Seiten: " + report.summary.pages,"- Vergleichs-Aliasse: " + report.summary.redirectAliases,"- Fehler: " + report.summary.errors,"","## Befunde","",...(findings.length?findings.map(f=>"- **" + f.severity.toUpperCase() + " " + f.code + ":** " + (f.file ?? f.route ?? "") + " " + (f.href ?? "") + " " + (f.expected ? "→ " + f.expected : "")):["Keine Befunde."]),""];
fs.writeFileSync(path.join(reportDir,"internal-link-target-audit.md"),md.join("\n"),"utf8");
console.log("Interne Linkziele: " + htmlFiles.length + " Seiten, " + errors.length + " Fehler.");
if(strict && errors.length) process.exit(1);

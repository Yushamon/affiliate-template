#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const PATCH = "pfotentechnik-product-data-research-batch-2-32.7.1";
const root = process.cwd();
const productDir = path.join(root, "apps/pfotentechnik/src/content/products");
const candidates = [
  path.join(root, "3", "pfotentechnik-product-data-research-batch-2.json"),
  path.join(root, "pfotentechnik-product-data-research-batch-2.json")
];
const fail = (m) => { console.error(`[${PATCH}] FEHLER: ${m}`); process.exit(1); };
const log = (m) => console.log(`[${PATCH}] ${m}`);

const manifestPath = candidates.find(fs.existsSync);
if (!manifestPath) fail("Research-JSON fehlt im Repo-Root oder in ./3/.");

let manifest;
try { manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")); }
catch (e) { fail(`Research-JSON ungültig: ${e.message}`); }

if (manifest.schemaVersion !== 1 || manifest.batch !== "pfotentechnik-product-data-research-batch-2") fail("Falscher Research-Batch.");

const allowed = new Set(["confirmed", "confirmed_absent"]);
const labels = {
  "lautstärke":"Lautstärke","akku":"Akku","uv":"UV","trinkhöhe":"Trinkhöhe","wasserfluss":"Wasserfluss",
  "ersatzfilter":"Ersatzfilter","gewicht":"Gewicht","napf":"Napf","reinigung":"Reinigung","wlan":"WLAN",
  "batterie":"Batterie","maße":"Maße","app":"App","bluetooth":"Bluetooth","material":"Material","abmessungen":"Abmessungen"
};
const aliases = {
  "lautstärke":["lautstärke","lautstaerke","geräusch","geraeusch"],
  "akku":["akku","akkulaufzeit","kabellos"],"uv":["uv","uvc"],"trinkhöhe":["trinkhöhe","trinkhoehe"],
  "wasserfluss":["wasserfluss","durchfluss"],"ersatzfilter":["ersatzfilter"],"gewicht":["gewicht"],
  "napf":["napf","napfmaterial"],"reinigung":["reinigung","spülmaschinengeeignet","spuelmaschinengeeignet"],
  "wlan":["wlan","wifi"],"batterie":["batterie","notstrom","backup"],"maße":["maße","masse","abmessungen"],
  "app":["app","app-steuerung"],"bluetooth":["bluetooth"],"material":["material","gehäuse","gehaeuse"],
  "abmessungen":["abmessungen","maße","masse"]
};
const norm = (s) => String(s ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/ß/g,"ss").replace(/[^a-z0-9]+/g," ").trim();
const q = (s) => JSON.stringify(String(s));

function fm(source, slug) {
  if (!source.startsWith("---\n")) fail(`${slug}: Frontmatter-Start fehlt.`);
  const end = source.indexOf("\n---",4);
  if (end < 0) fail(`${slug}: Frontmatter-Ende fehlt.`);
  return { text: source.slice(4,end), end };
}
function block(lines,key) {
  const start = lines.findIndex(l => l === `${key}:`);
  if (start < 0) return null;
  let end = lines.length;
  for (let i=start+1;i<lines.length;i++) if (/^[A-Za-z0-9_-]+:\s*(?:.*)?$/.test(lines[i]) && !/^\s/.test(lines[i])) { end=i; break; }
  return {start,end};
}
function specLabels(lines,r) {
  const out=[];
  for (let i=r.start+1;i<r.end;i++) {
    let m=lines[i].match(/^\s*-\s*\{\s*label:\s*["']?([^,"'}]+)["']?\s*,/);
    if (m) { out.push(m[1].trim()); continue; }
    m=lines[i].match(/^\s*-\s*label:\s*(?:"([^"]+)"|'([^']+)'|(.+))$/);
    if (m) out.push((m[1]||m[2]||m[3]).trim());
  }
  return out;
}
function has(existing,field) {
  const aa=(aliases[field]||[field]).map(norm);
  return existing.some(x => aa.some(a => norm(x)===a || norm(x).includes(a)));
}

const planned=[];
for (const [slug,p] of Object.entries(manifest.products)) {
  const additions=Object.entries(p.fields||{}).filter(([,v]) => allowed.has(v.status) && typeof v.value==="string" && v.value.trim());
  if (!additions.length) { log(`${slug}: keine bestätigten Ergänzungen.`); continue; }

  const file=path.join(productDir,`${slug}.md`);
  if (!fs.existsSync(file)) fail(`${slug}: Produktdatei fehlt.`);
  const source=fs.readFileSync(file,"utf8");
  const {text,end}=fm(source,slug);
  if (!new RegExp(`^slug:\\s*["']?${slug}["']?\\s*$`,"m").test(text)) fail(`${slug}: Slug stimmt nicht.`);

  const lines=text.split("\n");
  let r=block(lines,"specs");
  if (!r) { lines.push("specs:"); r={start:lines.length-1,end:lines.length}; }

  const existing=specLabels(lines,r);
  const todo=additions.filter(([field]) => !has(existing,field));
  if (!todo.length) { log(`${slug}: bestätigte Specs bereits vorhanden.`); continue; }

  const addLines=[];
  for (const [field,v] of todo) {
    addLines.push(`  - label: ${q(labels[field]||field)}`);
    addLines.push(`    value: ${q(v.value)}`);
  }
  lines.splice(r.end,0,...addLines);
  const after=source.slice(0,4)+lines.join("\n")+source.slice(end);
  planned.push({slug,file,after,fields:todo.map(([f])=>f)});
}
for (const x of planned) {
  const tmp=`${x.file}.tmp-${process.pid}`;
  fs.writeFileSync(tmp,x.after,"utf8");
  fs.renameSync(tmp,x.file);
  log(`Aktualisiert: ${path.relative(root,x.file)} (${x.fields.join(", ")})`);
}
console.log("");
log(`${planned.length} Produktdatei(en) geändert. Keine .bak-Dateien angelegt.`);
console.log("Jetzt prüfen:");
console.log("  npm --workspace apps/pfotentechnik run audit:products");
console.log("  git diff -- apps/pfotentechnik/src/content/products");

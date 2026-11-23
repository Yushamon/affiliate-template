import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {gzipSync, gunzipSync} from 'node:zlib';
import {parse} from 'parse5';
import yaml from 'js-yaml';

const root = 'apps/pfotentechnik', out = `${root}/reports/product-evidence-update-35.6`;
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const baseline = JSON.parse(fs.readFileSync(`${out}/baseline.json`));
const original = !process.argv.includes('--archived') && fs.existsSync('/tmp/35.6-html-before.json.gz') ? JSON.parse(gunzipSync(fs.readFileSync('/tmp/35.6-html-before.json.gz'))) : null;
const attrs = n => Object.fromEntries((n.attrs ?? []).map(a => [a.name, a.value]));
const find = (node, predicate, result = []) => {
  if (predicate(node)) result.push(node);
  for (const child of node.childNodes ?? []) find(child, predicate, result);
  return result;
};
const text = node => node.nodeName === '#text' ? node.value : ['style', 'script'].includes(node.tagName) ? '' : (node.childNodes ?? []).map(text).join(' ');
const compact = value => value.replace(/\s+/g, ' ').trim();
const alias = value => value.replace(/\/_astro\/(?:hero|comparison|thumbnail|gallery-\d+)\.([A-Za-z0-9_-]{8})(?:_[A-Za-z0-9_-]+)?\.webp/g, '/_astro/IMAGE.$1.webp');
function snapshot(html) {
  const doc = parse(html), main = find(doc, n => n.tagName === 'main')[0] ?? doc;
  return {
    hash: sha(html), aliasNormalizedHash: sha(alias(html)),
    canonical: find(doc, n => n.tagName === 'link' && attrs(n).rel === 'canonical').map(n => attrs(n).href),
    robots: find(doc, n => n.tagName === 'meta' && attrs(n).name === 'robots').map(n => attrs(n).content),
    main: compact(text(main)),
    sponsored: find(doc, n => n.tagName === 'a' && /sponsored/.test(attrs(n).rel ?? '')).map(n => attrs(n).href),
    schemas: find(doc, n => n.tagName === 'script' && attrs(n).type === 'application/ld+json').map(n => JSON.parse(n.childNodes.map(c => c.value ?? '').join(''))),
  };
}
const issues = [], rows = [], beforeSnapshots = original ? {} : JSON.parse(gunzipSync(fs.readFileSync(`${out}/rendered-before.json.gz`)));
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const types = (value, wanted, result = []) => {
  if (Array.isArray(value)) value.forEach(v => types(v, wanted, result));
  else if (value && typeof value === 'object') {
    if (wanted.includes(value['@type'])) result.push(value);
    Object.values(value).forEach(v => types(v, wanted, result));
  }
  return result;
};
for (const [file, html] of Object.entries(original ?? beforeSnapshots)) {
  const before = original ? snapshot(html) : html, afterFile = `${root}/dist/${file}`;
  beforeSnapshots[file] = before;
  if (!fs.existsSync(afterFile)) { issues.push([file, 'Removed HTML']); continue; }
  const after = snapshot(fs.readFileSync(afterFile, 'utf8'));
  for (const key of ['canonical', 'robots', 'sponsored']) if (!equal(before[key], after[key])) issues.push([file, `${key} changed`]);
  for (const kind of ['Review', 'AggregateRating', 'Offer', 'AggregateOffer']) {
    const prior=types(structuredClone(before.schemas),[kind]),current=types(structuredClone(after.schemas),[kind]);
    if(kind==='Review'&&file==='produkt/petlibro-one-rfid-smart-feeder/index.html'){for(const list of [prior,current])for(const review of list){delete review.reviewBody;delete review.positiveNotes?.itemListElement?.[0]?.name;}}
    if (!equal(prior,current)) issues.push([file, `${kind} changed`]);
  }
  rows.push({file, canonical: after.canonical[0], mainChanged: before.main !== after.main, rawEqual: before.hash === after.hash, aliasNormalizedEqual: before.aliasNormalizedHash === after.aliasNormalizedHash});
}
const currentFiles = [];
function walk(dir) { for (const d of fs.readdirSync(dir, {withFileTypes: true})) { const f = path.join(dir, d.name); if (d.isDirectory()) walk(f); else if (f.endsWith('.html')) currentFiles.push(path.relative(`${root}/dist`, f)); } }
walk(`${root}/dist`);
if (!equal(Object.keys(original ?? beforeSnapshots).sort(), currentFiles.sort())) issues.push(['routes', 'HTML route inventory changed']);
const selection = JSON.parse(fs.readFileSync(`${root}/reports/indexation-gap-analysis-35.5/selection-lock.json`));
const protectedRows = [];
const protectedHtml = original ? {} : JSON.parse(gunzipSync(fs.readFileSync(`${out}/experiment-html-before.json.gz`)));
for (const pair of selection.pairs) for (const group of ['treatment', 'control']) {
  const p = pair[group], file = p.route.slice(1) + 'index.html';
  const oldSource = baseline.pages.find(r => r.file === p.source);
  const sourceEqual = sha(fs.readFileSync(p.source)) === oldSource.sha256;
  const row = rows.find(r => r.file === file);
  protectedRows.push({canonical: p.canonical, group, sourceEqual, rawEqual: row.rawEqual, aliasNormalizedEqual: row.aliasNormalizedEqual, mainEqual: !row.mainChanged});
  if(original) protectedHtml[file] = original[file];
  if (!sourceEqual || !row.aliasNormalizedEqual) issues.push([p.canonical, 'Protected experiment changed']);
}
const invariantKeys = ['score', 'rating', 'ratings', 'affiliate', 'offers', 'price', 'seo', 'productUrl', 'publishedAt', 'updatedAt'];
const sourceChanges = [];
for (const page of baseline.pages) {
  const source = fs.readFileSync(page.file, 'utf8');
  if (sha(source) === page.sha256) continue;
  const current = yaml.load(source.match(/^---\s*\n([\s\S]*?)\n---/)[1]);
  sourceChanges.push(page.canonical);
  for (const key of invariantKeys) if (!equal(page.data[key], current[key])) issues.push([page.file, `Invariant ${key} changed`]);
}
const markers = {
  'petlibro-one-rfid-smart-feeder': ['V2.0.27', 'RFID-Zugang für das zugeordnete Tier'],
  'petlibro-granary-wifi-feeder': ['V1.0.58', 'AF103/PLAF103'],
  'petlibro-granary-camera-feeder': ['F.A.Z. Kaufkompass', 'Der Blickwinkel ist fest'],
  'tractive-cat-6-mini': ['Bluetooth-Reichweite manuell aktivieren'],
  'wie-funktionieren-gps-tracker': ['zuletzt übermittelten Akkustand'],
};
const renderedEvidence = [];
const reviewHtml = original ? {} : null;
for (const [slug, values] of Object.entries(markers)) {
  const page = baseline.pages.find(p => p.data.slug === slug), file = new URL(page.canonical).pathname.slice(1) + 'index.html';
  if(original) reviewHtml[file] = original[file];
  const after = snapshot(fs.readFileSync(`${root}/dist/${file}`, 'utf8'));
  const matches = values.map(value => ({value, visible: after.main.includes(value)}));
  if (matches.some(m => !m.visible)) issues.push([slug, 'Change absent from rendered main']);
  renderedEvidence.push({canonical: page.canonical, matches});
}
const gps = baseline.pages.filter(p => p.collection === 'products' && /gps|tracker/i.test(JSON.stringify(p.data.category))).map(p => {
  const html = fs.readFileSync(`${root}/dist/${new URL(p.canonical).pathname.slice(1)}index.html`, 'utf8');
  const main = snapshot(html).main;
  const forbidden = /Kein integrierter Akku|externe Notstrom|separate Batterie- oder Notstrom|Netzbetrieb erforderlich|Notstromversorgung/i.test(main);
  if (forbidden) issues.push([p.canonical, 'GPS power mismatch']);
  return {canonical: p.canonical, forbiddenPowerClaim: forbidden};
});
if(original) fs.writeFileSync(`${out}/review-html-before.json.gz`, gzipSync(JSON.stringify(reviewHtml)));
fs.writeFileSync(`${out}/rendered-before.json.gz`, gzipSync(JSON.stringify(beforeSnapshots)));
fs.writeFileSync(`${out}/experiment-html-before.json.gz`, gzipSync(JSON.stringify(protectedHtml)));
const report = {htmlDocuments: rows.length, changedMain: rows.filter(r => r.mainChanged), sourceChanges, protectedRows, renderedEvidence, gps, rows, issues, pass: !issues.length};
fs.writeFileSync(`${out}/scope-and-render-validation.json`, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({documents: rows.length, changedMain: report.changedMain.map(r => r.canonical), protected: protectedRows.length, issues, pass: report.pass}, null, 2));
process.exitCode = issues.length ? 1 : 0;

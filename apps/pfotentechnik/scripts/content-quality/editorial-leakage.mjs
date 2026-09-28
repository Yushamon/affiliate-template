import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parse} from 'parse5';

const normalize = value => value.replace(/\s+/g, ' ').trim();
const attrs = node => Object.fromEntries((node.attrs ?? []).map(a => [a.name, a.value]));
const ignored = new Set(['script', 'style', 'template']);
const blocks = new Set(['div', 'section', 'article', 'nav', 'header', 'footer', 'aside', 'p', 'li', 'td', 'th', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'summary', 'figcaption', 'button', 'label', 'dt', 'dd', 'title']);

/** Only reader text: never comments, data attributes, scripts or schema keys/URLs.
 * Hidden interactive panels are included because readers can open them.
 */
export function publicText(html) {
  const document = parse(html), surfaces = [], metadata = {canonical: [], robots: [], links: [], ids: []};
  const buckets = new Map();
  function visit(node, block = document, location = 'body') {
    const a = attrs(node);
    if (node.tagName === 'link' && a.rel === 'canonical') metadata.canonical.push(a.href);
    if (node.tagName === 'meta') {
      if (/^(robots|googlebot)$/i.test(a.name ?? '')) metadata.robots.push(a.content);
      if (/^(description|og:title|og:description|twitter:title|twitter:description)$/i.test(a.name ?? a.property ?? '')) surfaces.push({surface: 'PUBLIC_METADATA', location: a.name ?? a.property, text: a.content ?? ''});
    }
    if (node.tagName === 'a' && a.href) metadata.links.push(a.href);
    if (a.id) metadata.ids.push(a.id);
    if (node.tagName === 'script' && a.type === 'application/ld+json') {
      function editorial(value, trail = '') {
        if (!value || typeof value !== 'object') return;
        for (const [key, item] of Object.entries(value)) {
          if (typeof item === 'string' && ['name', 'description', 'reviewBody', 'text', 'headline', 'caption', 'disambiguatingDescription'].includes(key)) surfaces.push({surface: 'PUBLIC_METADATA', location: `jsonld${trail}.${key}`, text: item});
          else if (typeof item === 'object') editorial(item, `${trail}.${key}`);
        }
      }
      try { editorial(JSON.parse((node.childNodes ?? []).map(n => n.value ?? '').join(''))); } catch { /* Schema syntax is checked by the existing schema audit. */ }
    }
    if (ignored.has(node.tagName)) return;
    if (['nav', 'header', 'footer', 'main'].includes(node.tagName)) location = node.tagName;
    if (blocks.has(node.tagName)) block = node;
    for (const key of ['alt', 'title', 'aria-label', 'placeholder']) if (a[key]) surfaces.push({surface: 'PUBLIC_RENDERED', location: `${location}:${node.tagName}[${key}]`, text: a[key]});
    if (node.nodeName === '#text') {
      if (!buckets.has(block)) buckets.set(block, {surface: block.tagName === 'title' ? 'PUBLIC_METADATA' : 'PUBLIC_RENDERED', location: `${location}:${block.tagName ?? 'text'}`, chunks: []});
      buckets.get(block).chunks.push(node.value);
    }
    for (const child of node.childNodes ?? []) visit(child, block, location);
  }
  visit(document);
  for (const {chunks, ...item} of buckets.values()) surfaces.push({...item, text: normalize(chunks.join(' '))});
  return {...metadata, surfaces: surfaces.filter(s => s.text.trim())};
}

// Narrow invariants, not a blacklist of ordinary words such as Modell/Status/Provision.
export const leakageRules = [
  {id: 'seo-production', pattern: /\b(?:cornerstone|information gain|content cluster|topic cluster|Cluster-Hub|(?:Support|Problem|Evaluations|Komplettsystem)-Intent|Evaluationsintention|keyword density|link juice|primary keyword|target keyword)\b/gi},
  {id: 'internal-state', pattern: /\b(?:research-constrained|(?:lifecycle|intent|editorial|publication|maintenance)[\s-]+owner|(?:evidence|research|publication|coverage|workflow)[\s-]+(?:status|state|gate)|(?:STATUS|EVIDENCE|OWNER|GATE|CONFIDENCE|DECISION|RESEARCH|COVERAGE)\s*:\s*(?:PASS|FAIL|READY|BLOCKED|PARTIAL|COMPLETE|UNKNOWN|NOT_READY))\b/gi},
  {id: 'implementation', pattern: /\b(?:frontmatter|ProductExperience2?|Commerce Core|Affiliate Core|Content Registry|externalEvidence|evidenceSources|reviewCount|Repository-Evidence|Audit-Status)\b/gi},
  {id: 'publication-artifact', pattern: /\b(?:TODO|FIXME|PLACEHOLDER|lorem ipsum|Geplanter Bildslot|Temporärer (?:Editorial-)?Platzhalter)\b|\[(?:Produktname|Link|Quelle)\]|\{\{\s*[^}]+\s*\}\}|\*\*[^*]+\*\*/gi}
];

// Exceptions must specify route, rule AND exact reader text, with an explanation.
// No exceptions are currently necessary. Keep this small and review additions.
export const allowlist = [];
export function inspectPublicText(html, route = '/') {
  if (/^\/(?:admin|foundation)(?:\/|$)/.test(route)) return [];
  return publicText(html).surfaces.flatMap(item => leakageRules.flatMap(rule => {
    if (allowlist.some(a => a.route === route && a.rule === rule.id && a.text === item.text && a.reason)) return [];
    return [...item.text.matchAll(new RegExp(rule.pattern))].map(match => ({...item, rule: rule.id, match: match[0], route}));
  }));
}

export function walkFiles(dir) {
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap(entry => entry.isDirectory() ? walkFiles(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
}
export const htmlRoute = file => file === 'index.html' ? '/' : file.endsWith('/index.html') ? '/' + file.slice(0, -10) : '/' + file;

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const dist = path.join(app, 'dist');
  const files = walkFiles(dist).filter(f => f.endsWith('.html'));
  let scanned = 0;
  const findings = files.flatMap(file => {
    const route = htmlRoute(path.relative(dist, file));
    if (/^\/(?:admin|foundation)(?:\/|$)/.test(route)) return [];
    scanned++;
    return inspectPublicText(fs.readFileSync(file, 'utf8'), route);
  });
  console.log(JSON.stringify({scanned, findings}, null, 2));
  if (findings.length) process.exitCode = 1;
}

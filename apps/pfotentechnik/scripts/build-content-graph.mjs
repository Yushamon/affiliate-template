#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const cwd = process.cwd();

const appRoot = fs.existsSync(path.join(cwd, 'src/content'))
  ? cwd
  : path.join(cwd, 'apps/pfotentechnik');

const root = fs.existsSync(path.join(cwd, 'apps/pfotentechnik'))
  ? cwd
  : path.resolve(cwd, '../..');
const strict = process.argv.includes('--strict');

const sources = [
  { dir: 'src/content/pages', type: 'page', route: (slug) => `/${slug}/` },
  { dir: 'src/content/products', type: 'product', route: (slug) => `/produkte/${slug}/` },
  { dir: 'src/data/comparisons', type: 'comparison', route: (slug) => `/vergleiche/${slug}/` },
  { dir: 'src/content/manufacturers', type: 'manufacturer', route: (slug) => `/hersteller/${slug}/` }
];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(absolute) : [absolute];
  });
}

function scalar(value = '') {
  if (value == null) {
    return '';
  }

  if (typeof value === 'boolean' || typeof value === 'number') {
    return value;
  }

  if (typeof value === 'object') {
    return '';
  }

  const trimmed = String(value).trim();
  if (/^(true|false)$/i.test(trimmed)) return trimmed.toLowerCase() === 'true';
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  return trimmed.replace(/^['"]|['"]$/g, '');
}

function array(value = '') {
  if (value == null) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .flatMap((item) => array(item))
      .filter(Boolean);
  }

  if (typeof value === 'object') {
    return Object.values(value)
      .flatMap((item) => array(item))
      .filter(Boolean);
  }

  const trimmed = String(value).trim();

  if (!trimmed) {
    return [];
  }

  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return trimmed
      .slice(1, -1)
      .split(',')
      .map((item) => scalar(item))
      .filter(Boolean);
  }

  return [scalar(trimmed)].filter(Boolean);
}
function parseFrontmatter(text) {
  if (!text.startsWith('---')) return {};
  const end = text.indexOf('\n---', 3);
  if (end < 0) return {};
  const block = text.slice(3, end).split(/\r?\n/);
  const data = {};
  let current = null;

  for (const raw of block) {
    if (!raw.trim() || raw.trim().startsWith('#')) continue;
    const listMatch = raw.match(/^\s*-\s+(.+)$/);
    if (listMatch && current) {
      data[current] ??= [];
      if (!Array.isArray(data[current])) data[current] = [data[current]];
      data[current].push(scalar(listMatch[1]));
      continue;
    }
    const match = raw.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;
    const [, key, value] = match;
    current = key;
    data[key] = value === '' ? [] : value.trim().startsWith('[') ? array(value) : scalar(value);
  }
  return data;
}

function normalize(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function overlap(a, b) {
  const left = new Set(a);
  return b.filter((item) => left.has(item)).length;
}

const nodes = [];
const warnings = [];

for (const source of sources) {
  const absoluteDir = path.join(appRoot, source.dir);
  for (const file of walk(absoluteDir).filter((file) => /\.(md|mdx|json)$/i.test(file))) {
    const extension = path.extname(file).toLowerCase();
    let data = {};
    try {
      data = extension === '.json'
        ? JSON.parse(fs.readFileSync(file, 'utf8'))
        : parseFrontmatter(fs.readFileSync(file, 'utf8'));
    } catch (error) {
      warnings.push(`${path.relative(root, file)}: ${error.message}`);
      continue;
    }

    const slug = normalize(data.slug || path.basename(file, extension));
    if (!slug) continue;
    const graph = data.contentGraph && typeof data.contentGraph === 'object' ? data.contentGraph : {};
    const cluster = normalize(graph.cluster || data.cluster || data.category || data.categoryLabel || '');
    const topics = [
      ...array(graph.topics),
      ...array(data.topics),
      ...array(data.tags),
      cluster
    ].map(normalize).filter(Boolean);
    const entities = [
      ...array(graph.entities),
      ...array(data.entities),
      ...array(data.brand),
      ...array(data.manufacturer)
    ].map(normalize).filter(Boolean);

    nodes.push({
      id: `${source.type}:${slug}`,
      slug,
      route: data.route || source.route(slug),
      title: data.title || data.name || slug.replace(/-/g, ' '),
      description: data.description || data.excerpt || '',
      type: source.type,
      cluster,
      topics: [...new Set(topics)],
      entities: [...new Set(entities)],
      priority: Number(graph.priority || data.priority || 50),
      cornerstone: Boolean(graph.cornerstone || data.cornerstone)
    });
  }
}

const edges = [];
for (const source of nodes) {
  for (const target of nodes) {
    if (source.id === target.id) continue;
    let score = 0;
    let type = 'semantic';

    if (source.cluster && source.cluster === target.cluster) {
      score += 35;
      type = 'cluster';
    }
    score += overlap(source.topics, target.topics) * 12;
    score += overlap(source.entities, target.entities) * 18;
    if (target.cornerstone) score += 10;

    if (source.type === 'page' && target.type === 'comparison') type = 'comparison';
    if ((source.type === 'page' || source.type === 'comparison') && target.type === 'product') type = 'product';
    if (target.type === 'manufacturer') type = 'manufacturer';

    if (score >= 20) {
      edges.push({
        source: source.id,
        target: target.id,
        type,
        score: Math.min(score, 100),
        explicit: false
      });
    }
  }
}

const output = {
  version: 1,
  generatedAt: new Date().toISOString(),
  nodes: nodes.sort((a, b) => a.id.localeCompare(b.id)),
  edges: edges.sort((a, b) => a.source.localeCompare(b.source) || b.score - a.score)
};

const outputPath = path.join(appRoot, 'src/generated/content-graph.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2) + '\n', 'utf8');

console.log(`Content Graph: ${nodes.length} Nodes, ${edges.length} Edges.`);
if (warnings.length) {
  console.warn(`Warnungen: ${warnings.length}`);
  warnings.slice(0, 20).forEach((warning) => console.warn(`- ${warning}`));
}
if (strict && (warnings.length || nodes.length === 0)) process.exit(1);

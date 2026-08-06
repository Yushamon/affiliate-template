import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ID = 'pfotentechnik-layout-engine-30.0.0';
const ROOT = process.cwd();
const files = {
  global: 'packages/affiliate-core/src/styles/global.css',
  layout: 'packages/affiliate-core/src/styles/layout.css',
  engine: 'packages/affiliate-core/src/styles/page-layout-engine.css',
  productPage: 'apps/pfotentechnik/src/pages/produkt/[product].astro',
  comparisonPage: 'apps/pfotentechnik/src/pages/vergleiche/[comparison].astro',
  comparisonCss: 'packages/affiliate-core/src/components/comparison/comparison-system.css',
  experience: 'apps/pfotentechnik/src/components/product-experience-2/ProductExperience2.astro',
  hero: 'apps/pfotentechnik/src/components/product-experience-2/ProductHero2.astro',
  test: 'apps/pfotentechnik/test/layout-engine-30.0.0.test.mjs',
};

const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(ROOT, p));
const write = (p, content) => {
  const abs = path.join(ROOT, p);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content.replace(/\r\n/g, '\n'), 'utf8');
  console.log(`[${ID}] Geändert: ${p}`);
};
const replaceOnce = (source, search, replacement, label) => {
  const matches = source.match(search);
  if (!matches) throw new Error(`${label}: Ausgangsanker fehlt.`);
  return source.replace(search, replacement);
};

for (const [key, p] of Object.entries(files)) {
  if (key === 'engine' || key === 'test') continue;
  if (!exists(p)) throw new Error(`Pflichtdatei fehlt: ${p}`);
}

const backupRoot = path.join(ROOT, '.patch-backups', `${ID}-${new Date().toISOString().replace(/[:.]/g, '-')}`);
for (const p of Object.values(files)) {
  if (!exists(p)) continue;
  const dest = path.join(backupRoot, p);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(path.join(ROOT, p), dest);
}
console.log(`[${ID}] Backup: ${path.relative(ROOT, backupRoot)}`);

try {
  let globalCss = read(files.global);
  if (!globalCss.includes('@import "./page-layout-engine.css";')) {
    globalCss = globalCss.replace('@import "./layout.css";', '@import "./layout.css";\n@import "./page-layout-engine.css";');
  }
  write(files.global, globalCss);

  const layoutCss = `.container {
  --pt-page-gutter: clamp(16px, 4vw, 24px);
  --pt-content-width: 1200px;
  --pt-reading-width: 76rem;
  width: 100%;
  min-width: 0;
  max-width: var(--pt-content-width);
  margin-inline: auto;
  padding: 70px var(--pt-page-gutter);
}

.section-title {
  margin-block: 90px 28px;
  font-size: 38px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.card {
  padding: 32px;
  border: 1px solid var(--border);
  border-radius: 26px;
  color: inherit;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 14px 36px rgba(20, 32, 26, 0.06);
  text-decoration: none;
  transition: transform .2s ease, box-shadow .2s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 50px rgba(20, 32, 26, 0.1);
}

.card-category {
  color: var(--primary);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.card h3 {
  margin-block: 14px;
  font-size: 24px;
  line-height: 1.3;
}

.card p {
  margin: 0;
  color: var(--muted);
  line-height: 1.7;
}

@media (max-width: 768px) {
  .container:not(.container--page) {
    padding-top: 90px;
  }

  .section-title {
    margin-top: 60px;
    font-size: 30px;
  }

  .card { padding: 24px; }
  .card h3 { font-size: 21px; }
}
`;
  write(files.layout, layoutCss);

  const engineCss = `/*
 * PfotenTechnik Layout Engine 30
 * Ein Owner für Seitenbreite, Inhaltsgutter und Full-Bleed-Bereiche.
 */
.container.container--page {
  --pt-page-gutter: clamp(16px, 4vw, 24px);
  --pt-content-width: 1200px;
  --pt-reading-width: 76rem;
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 0 0 calc(64px + env(safe-area-inset-bottom));
}

.pt-page {
  width: 100%;
  min-width: 0;
  margin: 0;
}

.pt-page__content,
.pt-page [data-page-content] {
  width: min(calc(100% - 2 * var(--pt-page-gutter)), var(--pt-content-width));
  margin-inline: auto;
}

.pt-page__reading,
.pt-page [data-page-reading] {
  width: min(calc(100% - 2 * var(--pt-page-gutter)), var(--pt-reading-width));
  margin-inline: auto;
}

.pt-page__bleed,
.pt-page [data-page-bleed] {
  width: 100%;
  max-width: none;
  margin-inline: 0;
}

.pt-page--product .product-detail {
  width: 100%;
  max-width: var(--pt-content-width);
  margin-inline: auto;
}

.pt-page--comparison .comparison-detail {
  width: 100%;
  margin: 0;
  padding: 0;
  background: var(--pt-color-background, transparent);
}

.pt-page--comparison .comparison-shell {
  width: 100%;
  margin: 0;
  padding: 0;
  background: transparent;
}

.pt-page--comparison .comparison-shell > *,
.pt-page--comparison .comparison-detail > :not(.comparison-shell) {
  width: min(calc(100% - 2 * var(--pt-page-gutter)), var(--pt-content-width));
  margin-inline: auto;
}

.pt-page--comparison .comparison-detail > .comparison-content,
.pt-page--comparison .comparison-detail > #faq {
  width: min(calc(100% - 2 * var(--pt-page-gutter)), var(--pt-reading-width));
}

@media (max-width: 759px) {
  .pt-page--product .product-detail {
    max-width: none;
  }

  .pt-page--product [data-mobile-gallery-full-bleed] {
    width: 100%;
    max-width: none;
    margin-inline: 0;
  }

  .pt-page--comparison .comparison-shell > *,
  .pt-page--comparison .comparison-detail > :not(.comparison-shell) {
    width: calc(100% - 2 * var(--pt-page-gutter));
  }
}
`;
  write(files.engine, engineCss);

  let productPage = read(files.productPage)
    .replace('mainClass="container--immersive"', 'mainClass="container--page"')
    .replace('<div class="product-detail pt-product-detail" data-product-page>', '<div class="pt-page pt-page--product product-detail pt-product-detail" data-product-page>');
  write(files.productPage, productPage);

  let comparisonPage = read(files.comparisonPage)
    .replace('mainClass="container--immersive"', 'mainClass="container--page"')
    .replace('<div class="comparison-detail">', '<div class="pt-page pt-page--comparison comparison-detail">');
  write(files.comparisonPage, comparisonPage);

  let comparisonCss = read(files.comparisonCss);
  comparisonCss = replaceOnce(
    comparisonCss,
    /\.comparison-detail,\s*\n\.comparison-shell\s*\{[\s\S]*?\}\s*\n\s*\.comparison-detail\s*\{[\s\S]*?\}\s*\n\s*\.comparison-detail > \.comparison-content,\s*\n\.comparison-detail > #faq\s*\{[\s\S]*?\}\s*/,
    `.comparison-detail,\n.comparison-shell {\n  display: grid;\n  width: 100%;\n  min-width: 0;\n  gap: clamp(3rem, 6vw, 5.5rem);\n}\n\n`,
    'Vergleichs-Layoutkopf'
  );
  comparisonCss = comparisonCss
    .replace(/--comparison-page-gutter\s*:[^;]+;/g, '')
    .replace(/padding-inline:\s*var\(--comparison-page-gutter[^;]*;/g, '');
  write(files.comparisonCss, comparisonCss);

  let experience = read(files.experience);
  experience = experience.replace(
    /@media \(max-width: 759px\) \{\s*\.px2 > :not\(\.px2-hero\) \{\s*margin-inline:[^;]+;\s*\}\s*\}/,
    `@media (max-width: 759px) {\n    .px2 > :not(.px2-hero) {\n      width: calc(100% - 2 * var(--pt-page-gutter));\n      margin-inline: auto;\n    }\n  }`
  );
  write(files.experience, experience);

  let hero = read(files.hero);
  hero = hero.replace(
    /\.px2-hero__content \{\s*margin-inline:\s*var\(--pt-page-gutter, 12px\);\s*\}/,
    `.px2-hero__content {\n      width: calc(100% - 2 * var(--pt-page-gutter));\n      margin-inline: auto;\n    }`
  );
  write(files.hero, hero);

  const test = `import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (p) => fs.readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const globalCss = read('../packages/affiliate-core/src/styles/global.css');
const layout = read('../packages/affiliate-core/src/styles/layout.css');
const engine = read('../packages/affiliate-core/src/styles/page-layout-engine.css');
const productPage = read('src/pages/produkt/[product].astro');
const comparisonPage = read('src/pages/vergleiche/[comparison].astro');
const comparisonCss = read('../packages/affiliate-core/src/components/comparison/comparison-system.css');
const experience = read('src/components/product-experience-2/ProductExperience2.astro');
const hero = read('src/components/product-experience-2/ProductHero2.astro');

test('eine gemeinsame Layout Engine wird global geladen', () => {
  assert.match(globalCss, /page-layout-engine\.css/);
  assert.match(engine, /container\.container--page/);
  assert.equal((engine.match(/--pt-page-gutter:/g) || []).length, 1);
});

test('Produkt und Vergleich verwenden denselben Page Owner', () => {
  assert.match(productPage, /mainClass="container--page"/);
  assert.match(comparisonPage, /mainClass="container--page"/);
  assert.doesNotMatch(productPage + comparisonPage + layout, /container--immersive|container--product/);
});

test('Galerie bleibt mobile full bleed', () => {
  assert.match(hero, /data-mobile-gallery-full-bleed/);
  assert.match(engine, /data-mobile-gallery-full-bleed/);
  assert.match(engine, /margin-inline:\s*0/);
});

test('Produktinhalte nutzen exakt den globalen Gutter', () => {
  assert.match(experience, /calc\(100% - 2 \* var\(--pt-page-gutter\)\)/);
  assert.match(hero, /calc\(100% - 2 \* var\(--pt-page-gutter\)\)/);
});

test('Vergleich besitzt keinen eigenen Seitengutter', () => {
  assert.doesNotMatch(comparisonCss, /--comparison-page-gutter/);
  assert.doesNotMatch(comparisonCss, /padding-inline:\s*var\(--pt-page-gutter/);
  assert.match(engine, /pt-page--comparison \.comparison-shell > \*/);
});

test('keine neue important Regel und keine Viewport Hacks', () => {
  const sources = [layout, engine, experience, hero, comparisonCss].join('\n');
  assert.doesNotMatch(engine, /!important|100vw|left:\s*50%|margin-left:\s*-50vw|translateX/);
});
`;
  write(files.test, test);

  const checks = [
    ['Syntaxprüfung Installer-Test', ['--check', files.test]],
    ['Layout-Engine-Test', ['--test', files.test]],
  ];
  for (const [label, args] of checks) {
    console.log(`[${ID}] Prüfe: ${label}`);
    const result = spawnSync(process.execPath, args, { cwd: ROOT, stdio: 'inherit' });
    if (result.status !== 0) throw new Error(`${label} fehlgeschlagen (Exit ${result.status}).`);
  }

  const build = spawnSync('npm', ['--workspace', 'apps/pfotentechnik', 'run', 'build'], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (build.status !== 0) throw new Error(`Astro-Build fehlgeschlagen (Exit ${build.status}).`);

  console.log(`[${ID}] Abgeschlossen.`);
} catch (error) {
  console.error(`[${ID}] FEHLER: ${error.message}`);
  for (const p of Object.values(files)) {
    const backup = path.join(backupRoot, p);
    const target = path.join(ROOT, p);
    if (fs.existsSync(backup)) {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(backup, target);
    } else if (fs.existsSync(target) && (p === files.engine || p === files.test)) {
      fs.rmSync(target, { force: true });
    }
  }
  console.error(`[${ID}] Änderungen wurden zurückgerollt.`);
  process.exit(1);
}

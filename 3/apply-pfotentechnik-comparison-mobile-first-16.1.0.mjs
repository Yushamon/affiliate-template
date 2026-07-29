#!/usr/bin/env node
import { access, cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const VERSION = '16.1.0';
const LABEL = `pfotentechnik-comparison-mobile-first-${VERSION}`;
const rootArg = process.argv.find((v) => v.startsWith('--root='));
const root = resolve(rootArg ? rootArg.slice(7) : process.cwd());
const skipChecks = process.argv.includes('--skip-checks');
const backupRoot = join(root, '.patch-backups', `${LABEL}-${new Date().toISOString().replaceAll(':','-')}`);

const PATHS = {
  shell: 'packages/affiliate-core/src/components/comparison/ComparisonShell.astro',
  hero: 'packages/affiliate-core/src/components/comparison/ComparisonHero.astro',
  grid: 'packages/affiliate-core/src/components/comparison/RecommendationGrid.astro',
  recommendation: 'packages/affiliate-core/src/components/comparison/ComparisonEditorialRecommendation.astro',
  sticky: 'packages/affiliate-core/src/components/comparison/ComparisonStickyBar.astro',
  css: 'packages/affiliate-core/src/components/comparison/comparison-editorial-cover.css'
};

const exists = async (p) => { try { await access(join(root,p), constants.F_OK); return true; } catch { return false; } };
const read = (p) => readFile(join(root,p), 'utf8');
const backup = async (p) => {
  if (!(await exists(p))) throw new Error(`Datei fehlt: ${p}`);
  const target = join(backupRoot,p);
  await mkdir(dirname(target), {recursive:true});
  await cp(join(root,p), target);
};
const write = async (p,c) => {
  const target = join(root,p);
  await mkdir(dirname(target), {recursive:true});
  await writeFile(target,c,'utf8');
  console.log(`Geändert: ${p}`);
};
const run = async (script, required=true) => {
  const pkg = JSON.parse(await readFile(join(root,'apps/pfotentechnik/package.json'),'utf8'));
  if (!pkg.scripts?.[script]) {
    if (required) throw new Error(`Workspace-Script fehlt: ${script}`);
    console.warn(`Optionaler Check fehlt: ${script}`);
    return;
  }
  const r = spawnSync('npm',['--workspace','apps/pfotentechnik','run',script],{cwd:root,stdio:'inherit',shell:process.platform==='win32'});
  if (required && r.status !== 0) throw new Error(`Check fehlgeschlagen: ${script}`);
};

const hero = `---
import OptimizedImage from "../OptimizedImage.astro";
import type { ComparisonFilter, CoreImage } from "../../comparison/model";
import ComparisonHeroFilters from "./ComparisonHeroFilters.astro";

type Props = {
  eyebrow: string;
  title: string;
  image: CoreImage;
  facts?: Array<{ label: string; value: string }>;
  filters?: ComparisonFilter[];
  productCount?: number;
};

const { eyebrow, title, image, facts = [], filters = [], productCount = 0 } = Astro.props as Props;
const productFact = facts.find((fact) => /model|produkt/i.test(fact.label));
const dateFact = facts.find((fact) => /datenstand|stand|aktuell/i.test(fact.label));
const visibleFacts = [
  productFact ? { label: \`${'${productFact.value}'} Modelle\`, value: "im Vergleich", icon: "box" } : { label: \`${'${productCount}'} Modelle\`, value: "im Vergleich", icon: "box" },
  { label: "Redaktionell", value: "bewertet", icon: "check" },
  dateFact ? { label: "Datenstand", value: dateFact.value, icon: "calendar" } : null
].filter(Boolean);
---

<header class="comparison-cover" data-comparison-cover="16.1.0">
  <div class="comparison-cover__copy">
    <span class="comparison-cover__eyebrow">{eyebrow}</span>
    <h1>{title}</h1>
    <p>Unabhängig verglichen, verständlich eingeordnet und auf die wichtigsten Kaufentscheidungen reduziert.</p>
  </div>

  <div class="comparison-cover__media">
    <OptimizedImage src={image.src} alt={image.alt ?? ""} class="comparison-cover__image" layout="full-width" priority />
  </div>

  <dl class="comparison-cover__facts" aria-label="Vergleich auf einen Blick">
    {visibleFacts.map((fact) => fact && (
      <div class="comparison-cover__fact">
        <span class={\`comparison-cover__fact-icon comparison-cover__fact-icon--${'${fact.icon}'}\`} aria-hidden="true"></span>
        <span><dt>{fact.label}</dt><dd>{fact.value}</dd></span>
      </div>
    ))}
  </dl>

  <ComparisonHeroFilters filters={filters} productCount={productCount} />
</header>
`;

const grid = `---
import OptimizedImage from "../OptimizedImage.astro";
import EditorialScore from "../EditorialScore.astro";
import type { ComparisonProduct } from "../../comparison/model";
import { getPriceDisplay } from "../../comparison/price";

type Props = { products: ComparisonProduct[] };
const { products } = Astro.props as Props;

const getUseCase = (product: ComparisonProduct) => {
  const haystack = [product.badge, product.recommendation, ...(product.strengths ?? [])].filter(Boolean).join(" ").toLowerCase();
  if (/preis|günstig|budget|preis.?leistung/.test(haystack)) return { icon: "€", label: "Preis-Leistungs-Tipp", tone: "value" };
  if (/mehrkatzen|mehrere katzen|mehrtier|futterneid|chip/.test(haystack)) return { icon: "♧", label: "Für Mehrtierhaushalte", tone: "multi" };
  if (/kamera|video|sicht|überwachung/.test(haystack)) return { icon: "▣", label: "Beste Kamera", tone: "camera" };
  if (/ohne abo|kein abo|keine laufenden/.test(haystack)) return { icon: "×", label: "Ohne Abo", tone: "simple" };
  if (/akku|batterie|laufzeit/.test(haystack)) return { icon: "▥", label: "Lange Akkulaufzeit", tone: "battery" };
  if (/nassfutter|gekühlt|kühlung/.test(haystack)) return { icon: "◫", label: "Für Nassfutter", tone: "wet" };
  if (/große hund|large dog|großes tier/.test(haystack)) return { icon: "◇", label: "Für große Hunde", tone: "large" };
  return { icon: "→", label: product.badge || "Starke Alternative", tone: "default" };
};
---

<section class="comparison-alternatives" aria-labelledby="comparison-alternatives-title">
  <div class="comparison-alternatives__heading">
    <span class="comparison-eyebrow">Alternativen nach Bedarf</span>
    <h2 id="comparison-alternatives-title">Welche Empfehlung passt zu dir?</h2>
    <p>Jedes Modell steht für einen konkreten Vorteil – nicht für eine zweite Rangliste.</p>
  </div>
  <div class="comparison-alternatives__list">
    {products.map((product) => {
      const price = getPriceDisplay(product.price);
      const useCase = getUseCase(product);
      return (
        <article class="comparison-alternative" data-product-slug={product.slug}>
          <div class={\`comparison-alternative__use-case comparison-alternative__use-case--${'${useCase.tone}'}\`}>
            <span aria-hidden="true">{useCase.icon}</span><strong>{useCase.label}</strong>
          </div>
          <a href={product.href} class="comparison-alternative__media" tabindex="-1" aria-hidden="true">
            {product.image ? <OptimizedImage src={product.image.src} alt={product.image.alt ?? product.title} width={160} height={120} layout="constrained" /> : <span aria-hidden="true">□</span>}
          </a>
          <div class="comparison-alternative__content">
            {product.manufacturer && <span>{product.manufacturer}</span>}
            <h3><a href={product.href}>{product.title}</a></h3>
            {product.recommendation && <p>{product.recommendation}</p>}
          </div>
          {typeof product.rating === "number" && <EditorialScore value={product.rating} scale={100} variant="ring-compact" description="Redaktioneller Gesamtscore" />}
          <div class="comparison-alternative__decision">
            {price?.formatted && <strong>{price.formatted}</strong>}
            <a href={product.href} aria-label={\`${'${product.title}'} ansehen\`}>›</a>
          </div>
        </article>
      );
    })}
  </div>
  <a href="#direktvergleich" class="pt-button comparison-alternatives__all">Alle Modelle direkt vergleichen</a>
</section>
`;

const recommendation = `---
import type { ComparisonProduct } from "../../comparison/model";
import EditorialScore from "../EditorialScore.astro";
import ComparisonPriceSignal from "./ComparisonPriceSignal.astro";
import { getPriceDisplay } from "../../comparison/price";

type Props = { product: ComparisonProduct };
const { product } = Astro.props as Props;
const price = getPriceDisplay(product.price);
---

<section id="vergleichssieger" class="comparison-editorial-recommendation" aria-labelledby="comparison-editorial-recommendation-title">
  <div class="comparison-editorial-recommendation__heading">
    <span class="comparison-editorial-recommendation__star" aria-hidden="true">★</span>
    <div><span class="comparison-eyebrow">Unsere Empfehlung</span><strong>Das beste Gesamtpaket</strong></div>
  </div>
  <div class="comparison-editorial-recommendation__body">
    {product.image && <a href={product.href} class="comparison-editorial-recommendation__media"><img src={typeof product.image.src === "string" ? product.image.src : product.image.src.src} alt={product.image.alt ?? product.title} width="720" height="540" loading="eager" decoding="async" /></a>}
    <div class="comparison-editorial-recommendation__copy">
      {product.manufacturer && <span class="comparison-editorial-recommendation__manufacturer">{product.manufacturer}</span>}
      <h2 id="comparison-editorial-recommendation-title"><a href={product.href}>{product.title}</a></h2>
      {product.recommendation && <p>{product.recommendation}</p>}
      {product.strengths.length > 0 && <ul>{product.strengths.slice(0,4).map((strength) => <li>{strength}</li>)}</ul>}
    </div>
    <div class="comparison-editorial-recommendation__decision">
      {typeof product.rating === "number" && <EditorialScore value={product.rating} scale={100} variant="ring" description="Redaktioneller Gesamtscore" />}
      <ComparisonPriceSignal price={product.price} variant="standard" />
      <div class="comparison-editorial-recommendation__actions">
        {price?.url && <a href={price.url} class="pt-button comparison-button" rel={price.rel} target={price.target} data-affiliate-link>{price.label}</a>}
        <a href={product.href} class="pt-button comparison-button comparison-button--secondary">Test lesen</a>
      </div>
    </div>
  </div>
  <p class="comparison-editorial-recommendation__statement"><strong>Unsere Einordnung:</strong> Wenn wir heute selbst ein Modell aus diesem Vergleich wählen müssten, wäre {product.title} unsere erste Wahl.</p>
</section>
`;

const sticky = `---
import type { ComparisonProduct } from "../../comparison/model";
import { getPriceDisplay } from "../../comparison/price";
type Props = { product?: ComparisonProduct };
const { product } = Astro.props as Props;
const price = product ? getPriceDisplay(product.price) : null;
---
{product && price?.url && (
  <aside class="comparison-sticky-bar" aria-label="Top-Empfehlung" data-comparison-sticky hidden>
    <div class="comparison-sticky-bar__identity"><span>Unsere Empfehlung</span><strong title={product.title}>{product.title}</strong></div>
    <a href={price.url} class="pt-button comparison-button comparison-sticky-bar__primary" rel={price.rel} target={price.target} data-affiliate-link>Preis prüfen</a>
  </aside>
)}
<script>
  const setupComparisonSticky = () => {
    document.querySelectorAll<HTMLElement>("[data-comparison-sticky]").forEach((sticky) => {
      if (sticky.dataset.ready === "true") return;
      sticky.dataset.ready = "true";
      const recommendation = document.getElementById("vergleichssieger");
      if (!recommendation) return;
      let scheduled = false;
      const update = () => { scheduled = false; const rect = recommendation.getBoundingClientRect(); const visible = rect.bottom < window.innerHeight * .15; sticky.hidden = !visible; sticky.toggleAttribute("data-visible", visible); };
      const requestUpdate = () => { if (scheduled) return; scheduled = true; requestAnimationFrame(update); };
      update();
      window.addEventListener("scroll", requestUpdate, { passive: true });
      window.addEventListener("resize", requestUpdate, { passive: true });
    });
  };
  setupComparisonSticky();
  document.addEventListener("astro:page-load", setupComparisonSticky);
</script>
`;

const cssBlock = `
/* PT_COMPARISON_MOBILE_FIRST_16_1_0_START */
.comparison-shell[data-comparison-cover-version="16.1.0"] { --comparison-mobile-gutter: clamp(.9rem,4vw,1.15rem); }
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-decision-flow { display:grid; gap:clamp(2.75rem,9vw,4.75rem); }
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-premium-nav { display:none; }
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-cover { display:grid; grid-template-columns:minmax(0,1fr); gap:1rem; padding-inline:var(--comparison-mobile-gutter); }
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-cover__copy,
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-cover__media,
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-cover__facts,
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-hero-filters { grid-column:1; width:100%; min-width:0; }
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-cover__copy h1 { max-width:12ch; margin-bottom:.75rem; font-size:clamp(2rem,9vw,2.7rem); line-height:1.02; letter-spacing:-.04em; }
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-cover__copy p { margin:0; font-size:clamp(1rem,4vw,1.08rem); line-height:1.55; }
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-cover__media { aspect-ratio:16/10; overflow:hidden; border-radius:var(--pt-radius-xl); }
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-cover__media picture { display:contents; }
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-cover__image { width:100%; height:100%; object-fit:cover; }
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-cover__facts { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:.25rem; margin:0; }
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-cover__fact { display:grid; grid-template-columns:1.55rem minmax(0,1fr); gap:.35rem; min-width:0; padding:.65rem .2rem; border:0; background:transparent; }
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-cover__fact dt,
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-cover__fact dd { overflow-wrap:anywhere; font-size:.7rem; line-height:1.25; }
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-hero-filters { padding:1rem; border:1px solid var(--comparison-line); border-radius:var(--pt-radius-xl); background:var(--comparison-surface); }
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-editorial-recommendation { margin-inline:var(--comparison-mobile-gutter); padding:1rem; border-radius:var(--pt-radius-xl); }
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-editorial-recommendation__heading>div { display:grid; gap:.1rem; }
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-editorial-recommendation__body { display:grid; grid-template-columns:minmax(0,1fr); gap:1rem; }
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-editorial-recommendation__media { display:grid; width:100%; min-height:12rem; aspect-ratio:4/3; place-items:center; padding:1rem; border-radius:var(--pt-radius-lg); background:var(--comparison-surface-soft); }
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-editorial-recommendation__media img { width:100%; height:100%; object-fit:contain; }
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-editorial-recommendation__copy h2 { margin:.2rem 0 .65rem; font-size:clamp(1.65rem,7vw,2.2rem); line-height:1.05; }
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-editorial-recommendation__copy ul { display:grid; gap:.45rem; margin:1rem 0 0; padding:0; list-style:none; }
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-editorial-recommendation__copy li { position:relative; padding-left:1.45rem; }
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-editorial-recommendation__copy li::before { content:'✓'; position:absolute; left:0; color:var(--comparison-accent); font-weight:800; }
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-editorial-recommendation__decision { display:grid; grid-template-columns:minmax(0,1fr); gap:.85rem; padding-top:.9rem; border-top:1px solid var(--comparison-line); }
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-editorial-recommendation__actions { display:grid; grid-template-columns:minmax(0,1fr); gap:.65rem; }
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-editorial-recommendation__actions .comparison-button { width:100%; min-height:3.15rem; }
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-editorial-recommendation__statement { margin:1rem 0 0; padding:.9rem; border-radius:var(--pt-radius-lg); color:var(--comparison-muted); background:color-mix(in srgb,var(--comparison-accent) 7%,var(--comparison-surface)); font-size:.92rem; line-height:1.45; }
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternatives { display:grid; gap:1rem; margin-inline:var(--comparison-mobile-gutter); }
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternatives__heading h2 { margin:.25rem 0 .45rem; font-size:clamp(1.55rem,7vw,2.1rem); line-height:1.08; }
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternatives__heading p { margin:0; color:var(--comparison-muted); }
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternatives__list { overflow:hidden; border:1px solid var(--comparison-line); border-radius:var(--pt-radius-xl); background:var(--comparison-surface); }
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternative { display:grid; grid-template-columns:4.5rem minmax(0,1fr) auto; grid-template-areas:'case case case' 'media copy score' 'media copy decision'; align-items:center; gap:.65rem .7rem; min-width:0; padding:.85rem; }
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternative+.comparison-alternative { border-top:1px solid var(--comparison-line); }
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternative__use-case { grid-area:case; display:inline-flex; justify-self:start; align-items:center; gap:.4rem; padding:.35rem .55rem; border-radius:var(--pt-radius-pill); color:var(--comparison-accent); background:color-mix(in srgb,var(--comparison-accent) 8%,var(--comparison-surface)); font-size:.76rem; line-height:1.2; }
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternative__media { grid-area:media; display:grid; width:4.5rem; aspect-ratio:4/3; place-items:center; overflow:hidden; border-radius:var(--pt-radius-md); background:var(--comparison-surface-soft); }
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternative__media img { width:100%; height:100%; object-fit:contain; }
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternative__content { grid-area:copy; min-width:0; }
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternative__content>span { color:var(--comparison-muted); font-size:.68rem; font-weight:750; text-transform:uppercase; }
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternative__content h3 { margin:.1rem 0 .25rem; font-size:1rem; line-height:1.15; }
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternative__content h3 a { color:var(--comparison-text); text-decoration:none; }
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternative__content p { display:-webkit-box; overflow:hidden; margin:0; color:var(--comparison-muted); font-size:.77rem; line-height:1.35; -webkit-box-orient:vertical; -webkit-line-clamp:2; }
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternative>.pt-score { grid-area:score; align-self:end; transform:scale(.78); transform-origin:right bottom; }
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternative__decision { grid-area:decision; display:flex; align-items:center; justify-content:flex-end; gap:.35rem; }
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternative__decision strong { color:var(--comparison-text); font-size:.77rem; white-space:nowrap; }
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternative__decision a { display:grid; width:2.15rem; height:2.15rem; place-items:center; border-radius:var(--pt-radius-pill); color:var(--comparison-text); text-decoration:none; }
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternatives__all { width:100%; min-height:3.15rem; }
.comparison-sticky-bar { position:fixed; z-index:90; right:max(.65rem,env(safe-area-inset-right)); bottom:max(.65rem,env(safe-area-inset-bottom)); left:max(.65rem,env(safe-area-inset-left)); display:grid; grid-template-columns:minmax(0,1fr) minmax(8.75rem,.9fr); align-items:center; gap:.65rem; max-width:44rem; margin-inline:auto; padding:.65rem; border:1px solid color-mix(in srgb,var(--comparison-line) 70%,transparent); border-radius:var(--pt-radius-xl); color:#f8fafc; background:color-mix(in srgb,#071426 94%,transparent); box-shadow:var(--pt-shadow-lg); backdrop-filter:blur(16px) saturate(130%); }
.comparison-sticky-bar[hidden] { display:none; }
.comparison-sticky-bar__identity { display:grid; min-width:0; gap:.1rem; }
.comparison-sticky-bar__identity span { color:#77d58a; font-size:.68rem; font-weight:800; }
.comparison-sticky-bar__identity strong { overflow:hidden; color:#fff; font-size:.86rem; line-height:1.2; text-overflow:ellipsis; white-space:nowrap; }
.comparison-sticky-bar__primary { width:100%; min-height:2.9rem; }
@media (min-width:48rem) {
  .comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-cover { grid-template-columns:minmax(0,.92fr) minmax(22rem,1.08fr); gap:1.5rem 2rem; }
  .comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-cover__copy { grid-column:1; grid-row:1; }
  .comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-cover__media { grid-column:2; grid-row:1/span 2; }
  .comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-cover__facts { grid-column:1; grid-row:2; }
  .comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-hero-filters { grid-column:1/-1; }
  .comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-editorial-recommendation__body { grid-template-columns:minmax(15rem,.8fr) minmax(0,1.2fr); }
  .comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-editorial-recommendation__decision { grid-column:1/-1; grid-template-columns:auto minmax(12rem,1fr) minmax(18rem,1fr); align-items:center; }
  .comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-editorial-recommendation__actions { grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr); }
  .comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternative { grid-template-columns:minmax(10rem,.85fr) 6.25rem minmax(0,1.4fr) auto auto; grid-template-areas:'case media copy score decision'; padding:1rem; }
  .comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternative__media { width:6.25rem; }
}
@media print { .comparison-sticky-bar { display:none; } }
/* PT_COMPARISON_MOBILE_FIRST_16_1_0_END */
`;

for (const p of Object.values(PATHS)) await backup(p);
await write(PATHS.hero, hero);
await write(PATHS.grid, grid);
await write(PATHS.recommendation, recommendation);
await write(PATHS.sticky, sticky);

let shell = await read(PATHS.shell);
if (!shell.includes('const winner = model.verdict.winner;')) throw new Error('ComparisonShell-Architektur unerwartet.');
if (!shell.includes('const alternativeProducts =')) {
  shell = shell.replace('const winner = model.verdict.winner;', `const winner = model.verdict.winner;\nconst alternativeProducts = model.recommendationProducts.filter((product) => product.slug !== winner?.slug);\nconst comparisonProducts = model.products.filter((product) => product.slug !== winner?.slug);`);
}
shell = shell.replace(/<nav class="comparison-premium-nav"[\s\S]*?<\/nav>\s*/, '');
shell = shell.replace(/<section id="schnelle-empfehlung"[\s\S]*?<\/section>/, `<section id="alternativen" class="comparison-premium-section">\n      <RecommendationGrid products={alternativeProducts} />\n    </section>`);
shell = shell.replace('products={model.products}\n      rows={model.rows}', 'products={comparisonProducts}\n      rows={model.rows}');
shell = shell.replace(/data-comparison-cover-version="[^"]+"/, 'data-comparison-cover-version="16.1.0"');
await write(PATHS.shell, shell);

let css = await read(PATHS.css);
css = css.replace(/\/\* PT_COMPARISON_MOBILE_FIRST_16_1_0_START \*\/[\s\S]*?\/\* PT_COMPARISON_MOBILE_FIRST_16_1_0_END \*\//g,'').trimEnd();
await write(PATHS.css, `${css}\n\n${cssBlock}\n`);

const checks = {
  shell: await read(PATHS.shell), hero: await read(PATHS.hero), grid: await read(PATHS.grid), recommendation: await read(PATHS.recommendation), sticky: await read(PATHS.sticky), css: await read(PATHS.css)
};
if (!checks.shell.includes('comparisonProducts')) throw new Error('Sieger nicht aus Direktvergleich entfernt.');
if (!checks.hero.includes('data-comparison-cover="16.1.0"')) throw new Error('Mobile-Hero fehlt.');
if (!checks.grid.includes('Welche Empfehlung passt zu dir?')) throw new Error('Alternativen fehlen.');
if (!checks.recommendation.includes('Unsere Einordnung:')) throw new Error('Einordnung fehlt.');
if (checks.sticky.includes('Test lesen')) throw new Error('Sticky CTA hat noch zwei Buttons.');
if (!checks.css.includes('PT_COMPARISON_MOBILE_FIRST_16_1_0_START')) throw new Error('Styles fehlen.');

if (!skipChecks) {
  await run('comparison:hero:audit');
  await run('comparison:audit:strict');
  await run('design-system:tokens:audit');
  await run('design-system:components:audit');
  await run('design-system:responsive:audit');
  await run('design-system:visual-qa:strict');
  await run('build');
  await run('design-system:budget:audit', false);
}

console.log(`\n[${LABEL}] ABGESCHLOSSEN.`);
console.log(`Backups: ${backupRoot.replace(`${root}/`, '')}`);
console.log('- echter 414-px-Mobile-First-Hero');
console.log('- vollständig einspaltige Hauptempfehlung auf Mobile');
console.log('- Alternativen nach Preis-Leistung, Mehrtierhaushalt, Kamera usw.');
console.log('- Sieger nicht erneut in Alternativen oder Direktvergleich');
console.log('- kompakte Sticky-Bar mit nur einem Preis-CTA');

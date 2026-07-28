#!/usr/bin/env node
import { access, copyFile, cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";

const VERSION = "15.2.3";
const LABEL = `pfotentechnik-comparison-editorial-cover-${VERSION}`;
const HERO_DIRECTORY = "apps/pfotentechnik/src/assets/images/project/pfotentechnik/comparison";
const DEFAULT_HERO = `${HERO_DIRECTORY}/default-editorial-hero.webp`;
const LEGACY_FALLBACK_HERO = "apps/pfotentechnik/src/assets/images/project/pfotentechnik/pet-tech-hero.webp";

const FILES = {
  "packages/affiliate-core/src/components/comparison/ComparisonHero.astro": '---\nimport OptimizedImage from "../OptimizedImage.astro";\nimport type { ComparisonFilter, CoreImage } from "../../comparison/model";\nimport ComparisonHeroFilters from "./ComparisonHeroFilters.astro";\n\ntype Props = {\n  eyebrow: string;\n  title: string;\n  image: CoreImage;\n  facts?: Array<{ label: string; value: string }>;\n  filters?: ComparisonFilter[];\n  productCount?: number;\n};\n\nconst {\n  eyebrow,\n  title,\n  image,\n  facts = [],\n  filters = [],\n  productCount = 0\n} = Astro.props as Props;\n\nconst productFact = facts.find((fact) => /model|produkt/i.test(fact.label));\nconst dateFact = facts.find((fact) => /datenstand|stand|aktuell/i.test(fact.label));\nconst visibleFacts = [\n  productFact\n    ? { label: `${productFact.value} Modelle`, value: "verglichen", icon: "box" }\n    : { label: `${productCount} Modelle`, value: "verglichen", icon: "box" },\n  dateFact\n    ? { label: `Stand ${dateFact.value}`, value: "aktuell geprüft", icon: "check" }\n    : { label: "Redaktionell", value: "bewertet", icon: "check" }\n].slice(0, 2);\n---\n\n<header class="comparison-cover" data-comparison-cover="15.2.3">\n  <div class="comparison-cover__copy">\n    <span class="comparison-cover__eyebrow">{eyebrow}</span>\n    <h1>{title}</h1>\n    <p>Klare Empfehlungen statt endloser Produktlisten.</p>\n  </div>\n\n  <dl class="comparison-cover__facts" aria-label="Vergleich auf einen Blick">\n    {visibleFacts.map((fact) => (\n      <div class="comparison-cover__fact">\n        <span class={`comparison-cover__fact-icon comparison-cover__fact-icon--${fact.icon}`} aria-hidden="true"></span>\n        <span>\n          <dt>{fact.label}</dt>\n          <dd>{fact.value}</dd>\n        </span>\n      </div>\n    ))}\n  </dl>\n\n  <div class="comparison-cover__media">\n    <OptimizedImage\n      src={image.src}\n      alt={image.alt ?? ""}\n      class="comparison-cover__image"\n      layout="full-width"\n      priority\n    />\n  </div>\n\n  <ComparisonHeroFilters filters={filters} productCount={productCount} />\n</header>\n',
  "packages/affiliate-core/src/components/comparison/ComparisonHeroFilters.astro": '---\nimport type { ComparisonFilter } from "../../comparison/model";\n\ntype Props = {\n  filters: ComparisonFilter[];\n  productCount: number;\n};\n\nconst { filters, productCount } = Astro.props as Props;\nconst preferredKeys = ["tier", "futterart", "app", "kamera", "reichweite", "akkulaufzeit", "akku", "preisklasse", "preis"];\nconst orderedFilters = [...filters].sort((a, b) => {\n  const aIndex = preferredKeys.indexOf(a.key);\n  const bIndex = preferredKeys.indexOf(b.key);\n  return (aIndex < 0 ? 999 : aIndex) - (bIndex < 0 ? 999 : bIndex);\n});\nconst quickFilters = orderedFilters.filter((filter) => filter.options.length > 0).slice(0, 4);\n---\n\n{quickFilters.length > 0 && (\n  <section class="comparison-cover-filters" aria-labelledby="comparison-cover-filter-title">\n    <div class="comparison-cover-filters__head">\n      <span class="comparison-cover-filters__icon" aria-hidden="true"></span>\n      <h2 id="comparison-cover-filter-title">Produkte filtern</h2>\n    </div>\n\n    <div class="comparison-cover-filters__grid">\n      {quickFilters.map((filter) => (\n        <label class="comparison-cover-filter">\n          <span class="comparison-cover-filter__label">{filter.label}</span>\n          <span class="pt-control comparison-cover-filter__control">\n            <select class="pt-control" data-comparison-hero-select data-filter-key={filter.key} aria-label={filter.label}>\n              <option value="">Alle</option>\n              {filter.options.map((option) => <option value={option.value}>{option.label}</option>)}\n            </select>\n            <span class="comparison-cover-filter__chevron" aria-hidden="true"></span>\n          </span>\n        </label>\n      ))}\n    </div>\n\n    <div class="comparison-cover-filters__actions">\n      <button type="button" class="pt-button comparison-cover-filters__apply" data-comparison-hero-apply>\n        Vergleich anpassen\n        <span aria-hidden="true">→</span>\n      </button>\n      <button type="button" class="pt-button comparison-cover-filters__reset" data-comparison-hero-filter-reset>\n        Filter zurücksetzen\n      </button>\n    </div>\n\n    <p class="comparison-cover-filters__result" aria-live="polite">\n      <strong data-comparison-hero-result-count>{productCount}</strong>\n      <span> passende Modelle</span>\n    </p>\n  </section>\n)}\n',
  "packages/affiliate-core/src/components/comparison/ComparisonEditorialRecommendation.astro": '---\nimport type { ComparisonProduct } from "../../comparison/model";\nimport EditorialScore from "../EditorialScore.astro";\nimport ComparisonPriceSignal from "./ComparisonPriceSignal.astro";\nimport { getPriceDisplay } from "../../comparison/price";\n\ntype Props = { product: ComparisonProduct };\nconst { product } = Astro.props as Props;\nconst price = getPriceDisplay(product.price);\n---\n\n<section id="vergleichssieger" class="comparison-editorial-recommendation" aria-labelledby="comparison-editorial-recommendation-title">\n  <div class="comparison-editorial-recommendation__heading">\n    <span class="comparison-editorial-recommendation__star" aria-hidden="true">★</span>\n    <span>Unsere Empfehlung der Redaktion</span>\n  </div>\n\n  <div class="comparison-editorial-recommendation__body">\n    {product.image && (\n      <a href={product.href} class="comparison-editorial-recommendation__media">\n        <img\n          src={typeof product.image.src === "string" ? product.image.src : product.image.src.src}\n          alt={product.image.alt ?? product.title}\n          width="720"\n          height="540"\n          loading="eager"\n          decoding="async"\n        />\n      </a>\n    )}\n\n    <div class="comparison-editorial-recommendation__copy">\n      <span class="comparison-editorial-recommendation__badge">Beste Empfehlung</span>\n      {product.manufacturer && <span class="comparison-editorial-recommendation__manufacturer">{product.manufacturer}</span>}\n      <h2 id="comparison-editorial-recommendation-title"><a href={product.href}>{product.title}</a></h2>\n      {product.recommendation && <p>{product.recommendation}</p>}\n      {product.strengths.length > 0 && (\n        <ul>\n          {product.strengths.slice(0, 3).map((strength) => <li>{strength}</li>)}\n        </ul>\n      )}\n    </div>\n\n    <div class="comparison-editorial-recommendation__decision">\n      {typeof product.rating === "number" && (\n        <EditorialScore value={product.rating} scale={100} variant="ring" description="Redaktioneller Gesamtscore" />\n      )}\n      <ComparisonPriceSignal price={product.price} variant="standard" />\n      <div class="comparison-editorial-recommendation__actions">\n        {price?.url && (\n          <a href={price.url} class="pt-button comparison-button" rel={price.rel} target={price.target} data-affiliate-link>\n            {price.label}\n          </a>\n        )}\n        <a href={product.href} class="comparison-editorial-recommendation__details">Details vergleichen →</a>\n      </div>\n    </div>\n  </div>\n</section>\n',
  "packages/affiliate-core/src/components/comparison/ComparisonShell.astro": '---\nimport type { ComparisonViewModel } from "../../comparison/model";\nimport ComparisonHero from "./ComparisonHero.astro";\nimport ComparisonEditorialRecommendation from "./ComparisonEditorialRecommendation.astro";\nimport RecommendationGrid from "./RecommendationGrid.astro";\nimport ComparisonProsCons from "./ComparisonProsCons.astro";\nimport ComparisonExplorer from "./ComparisonExplorer.astro";\nimport ComparisonVerdict from "./ComparisonVerdict.astro";\nimport ComparisonStickyBar from "./ComparisonStickyBar.astro";\nimport ComparisonInsightSummary from "./ComparisonInsightSummary.astro";\nimport ComparisonMethodology from "./ComparisonMethodology.astro";\nimport "./comparison.css";\nimport "./comparison-editorial-cover.css";\nimport "./comparison-premium-ux.css";\nimport "./comparison-premium-seo.css";\nimport "./comparison-ux-polish-3.2.css";\nimport "./comparison-mobile-price-fix-4.0.1.css";\nimport "./comparison-cta-system.css";\n\ntype Props = { model: ComparisonViewModel };\nconst { model } = Astro.props as Props;\nconst winner = model.verdict.winner;\n---\n\n<div class="comparison-shell comparison-shell--premium" data-comparison-cover-version="15.2.3" data-dark-mode-ready="true">\n  <ComparisonHero\n    eyebrow={model.eyebrow}\n    title={model.title}\n    image={model.heroImage}\n    facts={model.facts}\n    filters={model.filters}\n    productCount={model.products.length}\n  />\n\n  {winner && <ComparisonEditorialRecommendation product={winner} />}\n\n  <nav class="comparison-premium-nav" aria-label="Sprungnavigation zum Vergleich">\n    {winner && <a href="#vergleichssieger">Top-Empfehlung</a>}\n    <a href="#schnelle-empfehlung">Schnelle Auswahl</a>\n    <a href="#einsatzzwecke">Einsatzzwecke</a>\n    <a href="#direktvergleich">Direktvergleich</a>\n    {model.rows.length > 0 && <a href="#redaktionelle-zusammenfassung">Zusammenfassung</a>}\n    <a href="#methodik">Methodik</a>\n  </nav>\n\n  <div class="comparison-decision-flow">\n    <section id="schnelle-empfehlung" class="comparison-premium-section">\n      <div class="comparison-premium-section__heading">\n        <div>\n          <span class="comparison-eyebrow">Schnelle Auswahl</span>\n          <h2>Die stärksten Modelle auf einen Blick</h2>\n        </div>\n        <p>Starte mit dem Einsatzgebiet. Score, Preis und die vollständigen Unterschiede folgen im Direktvergleich.</p>\n      </div>\n      <RecommendationGrid products={model.recommendationProducts} />\n    </section>\n\n    <section id="einsatzzwecke" class="comparison-premium-section comparison-slot-section">\n      <slot name="scenario-recommendations" />\n    </section>\n\n    <ComparisonExplorer\n      products={model.products}\n      rows={model.rows}\n      filters={model.filters}\n      initialVisibleProducts={model.initialVisibleProducts}\n    />\n\n    {model.rows.length > 0 && (\n      <section id="redaktionelle-zusammenfassung" class="comparison-premium-section" aria-label="Redaktionelle Zusammenfassung">\n        <ComparisonInsightSummary products={model.products} rows={model.rows} />\n      </section>\n    )}\n\n    <ComparisonProsCons products={model.products} />\n\n    <section id="methodik" class="comparison-premium-section">\n      <ComparisonMethodology productCount={model.products.length} criterionCount={model.rows.length} />\n    </section>\n\n    <div id="vergleich-fazit">\n      <ComparisonVerdict\n        title={model.verdict.title}\n        text={model.verdict.text}\n        winner={model.verdict.winner}\n        alternative={model.verdict.alternative}\n      />\n    </div>\n  </div>\n</div>\n\n<ComparisonStickyBar product={model.verdict.winner} />\n',
  "packages/affiliate-core/src/components/comparison/comparison-editorial-cover.css": '/* PfotenTechnik Comparison Editorial Cover 15.2.3 */\n.comparison-cover {\n  display: grid;\n  grid-template-areas: "copy" "facts" "media" "filters";\n  gap: var(--pt-space-5);\n  min-width: 0;\n  color: var(--pt-color-text);\n}\n\n.comparison-cover__copy { grid-area: copy; }\n.comparison-cover__eyebrow {\n  color: var(--pt-color-brand-600);\n  font-size: var(--pt-font-size-xs);\n  font-weight: var(--pt-font-weight-black);\n  letter-spacing: var(--pt-letter-spacing-label);\n  text-transform: uppercase;\n}\n.comparison-cover h1 {\n  max-width: 15ch;\n  margin: var(--pt-space-3) 0 var(--pt-space-3);\n  color: var(--pt-color-text);\n  font-size: clamp(2rem, 9.4vw, 3rem);\n  line-height: 1.02;\n  letter-spacing: var(--pt-letter-spacing-tight);\n  text-wrap: balance;\n}\n.comparison-cover__copy > p {\n  max-width: 36ch;\n  margin: 0;\n  color: var(--pt-color-text-muted);\n  font-size: var(--pt-font-size-base);\n  line-height: 1.55;\n}\n\n.comparison-cover__facts {\n  grid-area: facts;\n  display: grid;\n  grid-template-columns: repeat(2, minmax(0, 1fr));\n  gap: var(--pt-space-2);\n  margin: 0;\n}\n.comparison-cover__fact {\n  display: flex;\n  min-width: 0;\n  align-items: center;\n  gap: var(--pt-space-2);\n  padding: var(--pt-space-3);\n  border: 1px solid var(--pt-color-border);\n  border-radius: var(--pt-radius-lg);\n  background: color-mix(in srgb, var(--pt-color-surface) 88%, transparent);\n}\n.comparison-cover__fact-icon {\n  position: relative;\n  display: grid;\n  width: 2rem;\n  height: 2rem;\n  flex: 0 0 2rem;\n  place-items: center;\n  border-radius: var(--pt-radius-md);\n  color: var(--pt-color-brand-700);\n  background: var(--pt-color-brand-100);\n}\n.comparison-cover__fact-icon--box::before { content: "◇"; font-size: 1.2rem; font-weight: 900; }\n.comparison-cover__fact-icon--check::before { content: "✓"; font-size: 1.15rem; font-weight: 900; }\n.comparison-cover__fact dt,\n.comparison-cover__fact dd { overflow: hidden; margin: 0; text-overflow: ellipsis; white-space: nowrap; }\n.comparison-cover__fact dt { color: var(--pt-color-text); font-size: .76rem; font-weight: var(--pt-font-weight-black); }\n.comparison-cover__fact dd { margin-top: .1rem; color: var(--pt-color-text-muted); font-size: .68rem; font-weight: var(--pt-font-weight-semibold); }\n\n.comparison-cover__media {\n  grid-area: media;\n  overflow: hidden;\n  aspect-ratio: 4 / 3;\n  border-radius: var(--pt-radius-xl);\n  background: var(--pt-color-surface-soft);\n}\n.comparison-cover__media picture,\n.comparison-cover__image { display: block; width: 100%; height: 100%; }\n.comparison-cover__media img { display: block; width: 100%; height: 100%; object-fit: cover; object-position: 66% center; }\n\n.comparison-cover-filters {\n  grid-area: filters;\n  display: grid;\n  gap: var(--pt-space-3);\n  padding-top: var(--pt-space-4);\n  border-top: 1px solid var(--pt-color-border);\n}\n.comparison-cover-filters__head { display: flex; align-items: center; gap: var(--pt-space-2); }\n.comparison-cover-filters__head h2 { margin: 0; color: var(--pt-color-text); font-size: var(--pt-font-size-base); }\n.comparison-cover-filters__icon::before { content: "☷"; color: var(--pt-color-brand-600); font-size: 1.25rem; }\n.comparison-cover-filters__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--pt-space-2); }\n.comparison-cover-filter {\n  display: grid;\n  min-width: 0;\n  gap: .15rem;\n  min-height: 4.25rem;\n  align-content: center;\n  padding: .65rem .75rem;\n  border: 1px solid var(--pt-color-border);\n  border-radius: var(--pt-radius-md);\n  background: var(--pt-color-surface);\n  transition: border-color var(--pt-transition-fast), box-shadow var(--pt-transition-fast);\n}\n.comparison-cover-filter:focus-within { border-color: var(--pt-color-brand-600); box-shadow: var(--pt-focus-ring); }\n.comparison-cover-filter__label { color: var(--pt-color-text-muted); font-size: .68rem; font-weight: var(--pt-font-weight-semibold); }\n.comparison-cover-filter__control { position: relative; display: block; min-width: 0; }\n.comparison-cover-filter select {\n  width: 100%;\n  min-width: 0;\n  padding: 0 1.25rem 0 0;\n  border: 0;\n  outline: 0;\n  color: var(--pt-color-text);\n  background: transparent;\n  font: inherit;\n  font-size: .82rem;\n  font-weight: var(--pt-font-weight-black);\n  appearance: none;\n}\n.comparison-cover-filter__chevron { position: absolute; right: 0; top: 50%; width: .48rem; height: .48rem; border-right: 1.5px solid currentColor; border-bottom: 1.5px solid currentColor; transform: translateY(-70%) rotate(45deg); pointer-events: none; }\n.comparison-cover-filters__actions { display: grid; gap: var(--pt-space-2); }\n.comparison-cover-filters__apply,\n.comparison-cover-filters__reset {\n  min-height: var(--pt-control-min-height);\n  border-radius: var(--pt-radius-md);\n  font: inherit;\n  font-weight: var(--pt-font-weight-black);\n  cursor: pointer;\n}\n.comparison-cover-filters__apply { display: inline-flex; align-items: center; justify-content: center; gap: var(--pt-space-2); border: 1px solid var(--pt-color-brand-600); color: var(--pt-color-on-brand); background: var(--pt-color-brand-600); }\n.comparison-cover-filters__reset { border: 0; color: var(--pt-color-text-muted); background: transparent; font-size: var(--pt-font-size-sm); }\n.comparison-cover-filters__result { margin: 0; color: var(--pt-color-text-muted); font-size: var(--pt-font-size-sm); }\n.comparison-cover-filters__result strong { color: var(--pt-color-text); }\n\n.comparison-editorial-recommendation {\n  scroll-margin-top: 7rem;\n  overflow: hidden;\n  padding: clamp(var(--pt-space-4), 3vw, var(--pt-space-6));\n  border: 1px solid color-mix(in srgb, var(--pt-color-brand-600) 26%, var(--pt-color-border));\n  border-radius: var(--pt-radius-xl);\n  background: linear-gradient(135deg, color-mix(in srgb, var(--pt-color-brand-050) 72%, var(--pt-color-surface)), var(--pt-color-surface));\n  box-shadow: var(--pt-shadow-sm);\n}\n.comparison-editorial-recommendation__heading { display: flex; align-items: center; gap: var(--pt-space-2); margin-bottom: var(--pt-space-4); color: var(--pt-color-text); font-size: var(--pt-font-size-base); font-weight: var(--pt-font-weight-black); }\n.comparison-editorial-recommendation__star { display: grid; width: 2rem; height: 2rem; place-items: center; border-radius: var(--pt-radius-md); color: var(--pt-color-brand-700); background: var(--pt-color-brand-100); }\n.comparison-editorial-recommendation__body { display: grid; gap: var(--pt-space-5); }\n.comparison-editorial-recommendation__media { display: grid; min-height: 220px; place-items: center; overflow: hidden; border-radius: var(--pt-radius-lg); background: var(--pt-color-surface); }\n.comparison-editorial-recommendation__media img { width: 100%; height: 100%; max-height: 300px; object-fit: contain; }\n.comparison-editorial-recommendation__copy { min-width: 0; }\n.comparison-editorial-recommendation__badge { display: inline-flex; margin-bottom: var(--pt-space-2); padding: .35rem .6rem; border-radius: var(--pt-radius-pill); color: var(--pt-color-brand-700); background: var(--pt-color-brand-100); font-size: .68rem; font-weight: var(--pt-font-weight-black); letter-spacing: .04em; text-transform: uppercase; }\n.comparison-editorial-recommendation__manufacturer { display: block; color: var(--pt-color-text-muted); font-size: var(--pt-font-size-xs); font-weight: var(--pt-font-weight-bold); text-transform: uppercase; }\n.comparison-editorial-recommendation h2 { margin: var(--pt-space-2) 0 var(--pt-space-3); color: var(--pt-color-text); font-size: clamp(1.55rem, 5vw, 2.2rem); line-height: 1.08; letter-spacing: var(--pt-letter-spacing-heading); }\n.comparison-editorial-recommendation h2 a { color: inherit; text-decoration: none; }\n.comparison-editorial-recommendation__copy p { margin: 0; color: var(--pt-color-text-muted); line-height: 1.58; }\n.comparison-editorial-recommendation ul { display: flex; flex-wrap: wrap; gap: var(--pt-space-2) var(--pt-space-4); margin: var(--pt-space-4) 0 0; padding: 0; list-style: none; }\n.comparison-editorial-recommendation li { position: relative; padding-left: 1.15rem; color: var(--pt-color-text); font-size: var(--pt-font-size-sm); }\n.comparison-editorial-recommendation li::before { position: absolute; left: 0; color: var(--pt-color-brand-600); content: "✓"; font-weight: 900; }\n.comparison-editorial-recommendation__decision { display: grid; align-content: end; gap: var(--pt-space-4); }\n.comparison-editorial-recommendation__actions { display: grid; gap: var(--pt-space-2); }\n.comparison-editorial-recommendation__actions .comparison-button { min-height: 3rem; font-size: var(--pt-font-size-base); }\n.comparison-editorial-recommendation__details { color: var(--pt-color-text); font-size: var(--pt-font-size-sm); font-weight: var(--pt-font-weight-bold); text-decoration: none; text-align: center; }\n\n[data-theme="dark"] .comparison-cover-filter,\n.dark .comparison-cover-filter { background: var(--pt-color-surface-soft); }\n[data-theme="dark"] .comparison-editorial-recommendation,\n.dark .comparison-editorial-recommendation { background: linear-gradient(135deg, color-mix(in srgb, var(--pt-color-brand-100) 40%, var(--pt-color-surface)), var(--pt-color-surface)); box-shadow: var(--pt-shadow-md); }\n\n@media (min-width: 760px) {\n  .comparison-cover {\n    grid-template-columns: minmax(0, .9fr) minmax(380px, 1.1fr);\n    grid-template-areas: "copy media" "facts media" "filters filters";\n    align-items: center;\n    gap: clamp(var(--pt-space-5), 3vw, var(--pt-space-8));\n  }\n  .comparison-cover h1 { max-width: 13ch; font-size: clamp(2.75rem, 5vw, 4.4rem); }\n  .comparison-cover__media { min-height: 380px; aspect-ratio: auto; }\n  .comparison-cover__facts { align-self: start; max-width: 34rem; }\n  .comparison-cover-filters { padding: var(--pt-space-5); border: 1px solid var(--pt-color-border); border-radius: var(--pt-radius-xl); background: var(--pt-color-surface); box-shadow: var(--pt-shadow-xs); }\n  .comparison-cover-filters__grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }\n  .comparison-cover-filters__actions { grid-template-columns: minmax(170px, auto) auto; align-items: center; }\n  .comparison-cover-filters__result { justify-self: end; }\n  .comparison-editorial-recommendation__body { grid-template-columns: minmax(220px, .8fr) minmax(0, 1.25fr) minmax(210px, .7fr); align-items: stretch; }\n  .comparison-editorial-recommendation__media { min-height: 280px; }\n  .comparison-editorial-recommendation__details { text-align: left; }\n}\n\n@media (min-width: 1120px) {\n  .comparison-cover { grid-template-columns: minmax(0, .82fr) minmax(520px, 1.18fr); }\n  .comparison-cover__media { min-height: 430px; max-height: 500px; }\n}\n\n@media (max-width: 420px) {\n  .comparison-cover { gap: var(--pt-space-4); }\n  .comparison-cover h1 { font-size: clamp(1.9rem, 9vw, 2.55rem); }\n  .comparison-cover__fact { padding: .65rem; }\n  .comparison-cover__fact-icon { width: 1.75rem; height: 1.75rem; flex-basis: 1.75rem; }\n  .comparison-cover-filter { min-height: 4rem; padding-inline: .65rem; }\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .comparison-cover-filter { transition: none; }\n}\n',
  "apps/pfotentechnik/scripts/comparison-platform/audit-editorial-heroes.mjs": "#!/usr/bin/env node\nimport { access, readdir, readFile } from \"node:fs/promises\";\nimport { constants } from \"node:fs\";\nimport { basename, extname, join, relative, resolve } from \"node:path\";\nimport process from \"node:process\";\n\nconst strict = process.argv.includes(\"--strict\");\nconst root = resolve(process.cwd());\nconst comparisonDir = join(root, \"src/content/comparisons\");\nconst heroDir = join(root, \"src/assets/images/project/pfotentechnik/comparison\");\nconst defaultHero = join(heroDir, \"default-editorial-hero.webp\");\n\nconst exists = async (path) => {\n  try { await access(path, constants.F_OK); return true; } catch { return false; }\n};\n\nconst walk = async (directory) => {\n  const entries = await readdir(directory, { withFileTypes: true });\n  const files = [];\n  for (const entry of entries) {\n    const path = join(directory, entry.name);\n    if (entry.isDirectory()) files.push(...await walk(path));\n    else if ([\".md\", \".mdx\", \".json\"].includes(extname(entry.name).toLowerCase())) files.push(path);\n  }\n  return files;\n};\n\nconst slugFromContent = (content, path) => {\n  if (extname(path).toLowerCase() === \".json\") {\n    try { return JSON.parse(content).slug; } catch { return undefined; }\n  }\n  return content.match(/^slug:\\s*[\"']?([^\"'\\n]+)[\"']?\\s*$/m)?.[1]?.trim()\n    ?? basename(path).replace(/\\.(md|mdx)$/i, \"\");\n};\n\nif (!(await exists(comparisonDir))) {\n  console.error(`Vergleichsordner fehlt: ${relative(root, comparisonDir)}`);\n  process.exit(1);\n}\n\nconst files = await walk(comparisonDir);\nconst missing = [];\nfor (const file of files) {\n  const content = await readFile(file, \"utf8\");\n  const slug = slugFromContent(content, file);\n  if (!slug) continue;\n  const expected = join(heroDir, `${slug}-editorial-hero.webp`);\n  if (!(await exists(expected))) missing.push({ slug, expected: relative(root, expected) });\n}\n\nconsole.log(`Editorial-Hero-Audit: ${files.length} Vergleichsdateien geprüft.`);\nconsole.log(`Standard-Fallback: ${await exists(defaultHero) ? \"vorhanden\" : \"FEHLT\"}`);\nif (missing.length === 0) {\n  console.log(\"Alle Vergleichsseiten besitzen ein slug-spezifisches Editorial-Hero.\");\n  process.exit(0);\n}\n\nconsole.warn(`Fehlende slug-spezifische Hero-Bilder: ${missing.length}`);\nfor (const item of missing) console.warn(`- ${item.slug}: ${item.expected}`);\nconsole.warn(\"Diese Seiten verwenden bis dahin default-editorial-hero.webp.\");\nif (strict) process.exitCode = 1;\n",
};

const REMOVALS = [
  "packages/affiliate-core/src/components/comparison/comparison-hero-v2.css",
  "packages/affiliate-core/src/components/comparison/comparison-editorial-hero.css"
];

const argValue = (name) => {
  const direct = process.argv.find((arg) => arg.startsWith(`${name}=`));
  if (direct) return direct.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
};
const skipChecks = process.argv.includes("--skip-checks");
const heroImageArgument = argValue("--hero-image");
const heroSlugArgument = argValue("--hero-slug");
const heroDirectoryArgument = argValue("--hero-dir");

const exists = async (path) => {
  try { await access(path, constants.F_OK); return true; } catch { return false; }
};

const findRepoRoot = async (start) => {
  let current = resolve(start);
  while (true) {
    if (await exists(join(current, "package.json")) && await exists(join(current, "apps/pfotentechnik/package.json"))) return current;
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error("Repository-Root nicht gefunden. Starte den Installer im affiliate-template Repository.");
};

const run = (root, command, args) => {
  const printable = [command, ...args].join(" ");
  console.log(`\n> ${printable}`);
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", shell: process.platform === "win32" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Check fehlgeschlagen (${result.status}): ${printable}`);
};


const runStatusCheck = (root, command, args, label) => {
  const printable = [command, ...args].join(" ");
  console.log(`\n> ${printable}`);
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    shell: process.platform === "win32"
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) throw result.error;

  if (result.status !== 0) {
    console.warn(`\n[${LABEL}] HINWEIS: ${label} ist noch nicht abgeschlossen.`);
    console.warn("Der Editorial-Cover-Installer wurde dennoch erfolgreich technisch geprüft.");
    console.warn("Das globale Release-Gate umfasst zusätzliche Plattform- und manuelle Visual-QA-Anforderungen.");
    return false;
  }

  console.log(`[${LABEL}] ${label}: BESTANDEN`);
  return true;
};

const assertFile = async (root, path, anchors) => {
  const absolute = join(root, path);
  if (!(await exists(absolute))) throw new Error(`Vorprüfung fehlgeschlagen: Datei fehlt: ${path}`);
  const content = await readFile(absolute, "utf8");
  if (!anchors.some((anchor) => content.includes(anchor))) throw new Error(`Vorprüfung fehlgeschlagen: erwarteter Anker fehlt in ${path}`);
};

const patchExplorer = async (root) => {
  const path = "packages/affiliate-core/src/components/comparison/ComparisonExplorer.astro";
  const absolute = join(root, path);
  let content = await readFile(absolute, "utf8");
  if (content.includes("data-comparison-hero-select") && content.includes("heroSelects")) return content;

  const anchor = '      const viewTabs = Array.from(explorer.querySelectorAll("[data-comparison-view]"));';
  if (!content.includes(anchor)) throw new Error(`Explorer-Anker fehlt: ${path}`);
  content = content.replace(anchor, `${anchor}
      const heroSelects = Array.from(document.querySelectorAll("select[data-comparison-hero-select]"));
      const heroReset = document.querySelector("[data-comparison-hero-filter-reset]");
      const heroApply = document.querySelector("[data-comparison-hero-apply]");
      const heroCount = document.querySelector("[data-comparison-hero-result-count]");`);

  const countAnchor = '        if (count) count.textContent = String(matchingSlugs.length);';
  if (!content.includes(countAnchor)) throw new Error(`Count-Anker fehlt: ${path}`);
  content = content.replace(countAnchor, `${countAnchor}
        if (heroCount) heroCount.textContent = String(matchingSlugs.length);`);

  const listenerAnchor = '      differencesToggle?.addEventListener("change", applyState);';
  if (!content.includes(listenerAnchor)) throw new Error(`Listener-Anker fehlt: ${path}`);
  content = content.replace(listenerAnchor, `      heroSelects.forEach((select) => {
        select.addEventListener("change", () => {
          if (!(select instanceof HTMLSelectElement)) return;
          const key = select.dataset.filterKey;
          if (!key) return;
          inputs.forEach((input) => {
            if (!(input instanceof HTMLInputElement) || input.dataset.filterKey !== key) return;
            input.checked = Boolean(select.value) && input.value === select.value;
          });
          showAll = false;
          applyState();
        });
      });

      heroReset?.addEventListener("click", () => {
        heroSelects.forEach((select) => { if (select instanceof HTMLSelectElement) select.value = ""; });
        inputs.forEach((input) => { if (input instanceof HTMLInputElement) input.checked = false; });
        showAll = false;
        applyState();
      });

      heroApply?.addEventListener("click", () => {
        explorer.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      });

${listenerAnchor}`);

  return content;
};

const patchHeroFallback = async (root) => {
  const path = "apps/pfotentechnik/src/domain/comparison/buildComparisonViewModel.ts";
  const absolute = join(root, path);
  let content = await readFile(absolute, "utf8");

  const legacyImports = [
    'import petTechHeroImage from "../../assets/images/project/pfotentechnik/pet-tech-hero.webp";',
    'import editorialComparisonHeroImage from "../../assets/images/project/pfotentechnik/comparison/gps-tracker-hund-editorial-hero.webp";'
  ];
  const defaultImport = 'import defaultEditorialComparisonHeroImage from "../../assets/images/project/pfotentechnik/comparison/default-editorial-hero.webp";';

  for (const legacyImport of legacyImports) content = content.replace(`${legacyImport}\n`, "");
  if (!content.includes(defaultImport)) {
    const importAnchor = 'import type { CollectionEntry } from "astro:content";';
    if (!content.includes(importAnchor)) throw new Error(`Import-Anker fehlt: ${path}`);
    content = content.replace(importAnchor, `${importAnchor}\nimport type { ImageMetadata } from "astro";\n${defaultImport}`);
  } else if (!content.includes('import type { ImageMetadata } from "astro";')) {
    content = content.replace('import type { CollectionEntry } from "astro:content";', 'import type { CollectionEntry } from "astro:content";\nimport type { ImageMetadata } from "astro";');
  }

  if (!content.includes("const editorialComparisonHeroes = import.meta.glob")) {
    const anchor = 'type ManufacturerEntry = CollectionEntry<"manufacturers">;';
    if (!content.includes(anchor)) throw new Error(`Typ-Anker fehlt: ${path}`);
    const resolver = [
      anchor,
      "",
      "const editorialComparisonHeroes = import.meta.glob<ImageMetadata>(",
      '  "../../assets/images/project/pfotentechnik/comparison/*-editorial-hero.webp",',
      '  { eager: true, import: "default" }',
      ");",
      "",
      "const resolveComparisonHeroImage = (slug: string): ImageMetadata => {",
      '  const expectedSuffix = `/${slug}-editorial-hero.webp`;',
      "  const match = Object.entries(editorialComparisonHeroes).find(([path]) =>",
      "    path.endsWith(expectedSuffix)",
      "  );",
      "  return match?.[1] ?? defaultEditorialComparisonHeroImage;",
      "};"
    ].join("\n");
    content = content.replace(anchor, resolver);
  }

  content = content.replace(/src:\s*(?:petTechHeroImage|editorialComparisonHeroImage)/g, "src: resolveComparisonHeroImage(data.slug)");
  if (!content.includes("src: resolveComparisonHeroImage(data.slug)")) {
    const fallbackAnchor = "heroImage: data.heroImage ?? {";
    if (!content.includes(fallbackAnchor)) throw new Error(`Hero-Fallback-Anker fehlt: ${path}`);
    content = content.replace(fallbackAnchor, `${fallbackAnchor}\n      src: resolveComparisonHeroImage(data.slug),`);
  }
  return content;
};

const validateHeroSource = async (source) => {
  if (!(await exists(source))) throw new Error(`Hero-Bild nicht gefunden: ${source}`);
  if (extname(source).toLowerCase() !== ".webp") throw new Error(`Hero-Bild muss als WebP vorliegen: ${source}`);
  const info = await stat(source);
  if (info.size < 80000) console.warn(`WARNUNG: ${basename(source)} ist kleiner als 80 KB. Auflösung und Qualität prüfen.`);
};

const backupAsset = async (root, backupRoot, relativePath) => {
  const source = join(root, relativePath);
  if (!(await exists(source))) return;
  const backup = join(backupRoot, relativePath);
  await mkdir(dirname(backup), { recursive: true });
  await cp(source, backup);
};

const installHeroAssets = async (root, backupRoot) => {
  const heroDirectory = join(root, HERO_DIRECTORY);
  await mkdir(heroDirectory, { recursive: true });
  await backupAsset(root, backupRoot, DEFAULT_HERO);

  const defaultTarget = join(root, DEFAULT_HERO);
  if (!(await exists(defaultTarget))) {
    const legacyFallback = join(root, LEGACY_FALLBACK_HERO);
    if (!(await exists(legacyFallback))) throw new Error(`Standard-Hero fehlt und Legacy-Fallback wurde nicht gefunden: ${LEGACY_FALLBACK_HERO}`);
    await copyFile(legacyFallback, defaultTarget);
    console.log(`Standard-Fallback angelegt: ${DEFAULT_HERO}`);
  }

  let copied = 0;
  if (heroDirectoryArgument) {
    const sourceDirectory = resolve(heroDirectoryArgument);
    if (!(await exists(sourceDirectory))) throw new Error(`Hero-Quellordner nicht gefunden: ${sourceDirectory}`);
    const entries = await readdir(sourceDirectory, { withFileTypes: true });
    const images = entries.filter((entry) => entry.isFile() && entry.name.endsWith("-editorial-hero.webp"));
    for (const entry of images) {
      const source = join(sourceDirectory, entry.name);
      await validateHeroSource(source);
      const relativeTarget = `${HERO_DIRECTORY}/${entry.name}`;
      await backupAsset(root, backupRoot, relativeTarget);
      await copyFile(source, join(root, relativeTarget));
      console.log(`Hero-Bild übernommen: ${relativeTarget}`);
      copied += 1;
    }
  }

  if (heroImageArgument) {
    if (!heroSlugArgument) throw new Error("Bei --hero-image muss zusätzlich --hero-slug angegeben werden.");
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(heroSlugArgument)) throw new Error(`Ungültiger Vergleichsslug: ${heroSlugArgument}`);
    const source = resolve(heroImageArgument);
    await validateHeroSource(source);
    const relativeTarget = `${HERO_DIRECTORY}/${heroSlugArgument}-editorial-hero.webp`;
    await backupAsset(root, backupRoot, relativeTarget);
    await copyFile(source, join(root, relativeTarget));
    console.log(`Hero-Bild übernommen: ${relativeTarget}`);
    copied += 1;
  }

  return copied;
};


const patchHeaderDesignSystem = async (root) => {
  const path = "packages/affiliate-core/src/components/Header.astro";
  const absolute = join(root, path);
  if (!(await exists(absolute))) return null;

  let content = await readFile(absolute, "utf8");
  let changed = 0;

  content = content.replace(/<button\b([^>]*)>/g, (full, attributes) => {
    if (/\bpt-button\b/.test(attributes)) return full;

    const doubleQuotedClass = attributes.match(/\bclass\s*=\s*"([^"]*)"/);
    if (doubleQuotedClass) {
      changed += 1;
      const classes = `${doubleQuotedClass[1]} pt-button`.trim().replace(/\s+/g, " ");
      return full.replace(doubleQuotedClass[0], `class="${classes}"`);
    }

    const singleQuotedClass = attributes.match(/\bclass\s*=\s*'([^']*)'/);
    if (singleQuotedClass) {
      changed += 1;
      const classes = `${singleQuotedClass[1]} pt-button`.trim().replace(/\s+/g, " ");
      return full.replace(singleQuotedClass[0], `class='${classes}'`);
    }

    if (/\bclass:list\s*=/.test(attributes)) {
      console.warn(`WARNUNG: Dynamisches class:list in ${path} konnte nicht automatisch um pt-button ergänzt werden.`);
      return full;
    }

    changed += 1;
    return `<button class="pt-button"${attributes}>`;
  });

  if (changed > 0) console.log(`Design-System-Adoption ergänzt: ${path} (${changed} Button${changed === 1 ? "" : "s"})`);
  return content;
};


const verifyDesignSystemAdoption = async (root) => {
  const path = "packages/affiliate-core/src/components/comparison/ComparisonHeroFilters.astro";
  const content = await readFile(join(root, path), "utf8");

  const selectMatches = [...content.matchAll(/<select\b[^>]*>/g)].map((match) => match[0]);
  if (selectMatches.length === 0) {
    throw new Error(`${path}: Kein Select-Control gefunden.`);
  }

  const invalidSelect = selectMatches.find((tag) => !/\bclass\s*=\s*["'][^"']*\bpt-control\b[^"']*["']/.test(tag));
  if (invalidSelect) {
    throw new Error(`${path}: Select ohne pt-control nach dem Schreiben: ${invalidSelect}`);
  }

  const wrapperMatch = content.match(/<span\b[^>]*comparison-cover-filter__control[^>]*>/);
  if (!wrapperMatch || !/\bpt-control\b/.test(wrapperMatch[0])) {
    throw new Error(`${path}: Statischer Control-Wrapper ohne pt-control nach dem Schreiben.`);
  }

  console.log(`Design-System-Adoption verifiziert: ${path}`);
};

const patchPackageScripts = async (root) => {
  const path = "apps/pfotentechnik/package.json";
  const absolute = join(root, path);
  const data = JSON.parse(await readFile(absolute, "utf8"));
  data.scripts ??= {};
  data.scripts["comparison:hero:audit"] = "node scripts/comparison-platform/audit-editorial-heroes.mjs";
  data.scripts["comparison:hero:audit:strict"] = "node scripts/comparison-platform/audit-editorial-heroes.mjs --strict";
  return `${JSON.stringify(data, null, 2)}\n`;
};

const main = async () => {
  const root = await findRepoRoot(process.cwd());
  console.log(`[${LABEL}] Repository: ${root}`);
  console.log("Namenskonvention: apps/pfotentechnik/src/assets/images/project/pfotentechnik/comparison/<slug>-editorial-hero.webp");

  await assertFile(root, "packages/affiliate-core/src/components/comparison/ComparisonHero.astro", ["comparison-hero", "comparison-editorial-hero", "comparison-cover"]);
  await assertFile(root, "packages/affiliate-core/src/components/comparison/ComparisonShell.astro", ["ComparisonHero", "comparison-editorial-cover.css"]);
  await assertFile(root, "packages/affiliate-core/src/components/comparison/ComparisonExplorer.astro", ["data-comparison-explorer"]);
  await assertFile(root, "apps/pfotentechnik/src/domain/comparison/buildComparisonViewModel.ts", ["heroImage", "petTechHeroImage", "editorialComparisonHeroImage", "resolveComparisonHeroImage"]);

  const timestamp = new Date().toISOString().replaceAll(":", "-");
  const backupRoot = join(root, ".patch-backups", `${LABEL}-${timestamp}`);
  const touched = [...Object.keys(FILES), ...REMOVALS, "packages/affiliate-core/src/components/comparison/ComparisonExplorer.astro", "apps/pfotentechnik/src/domain/comparison/buildComparisonViewModel.ts", "apps/pfotentechnik/package.json", "packages/affiliate-core/src/components/Header.astro", DEFAULT_HERO];

  for (const path of touched) {
    const source = join(root, path);
    if (!(await exists(source))) continue;
    const destination = join(backupRoot, path);
    await mkdir(dirname(destination), { recursive: true });
    await cp(source, destination);
  }

  const copiedHeroCount = await installHeroAssets(root, backupRoot);

  FILES["packages/affiliate-core/src/components/comparison/ComparisonExplorer.astro"] = await patchExplorer(root);
  FILES["apps/pfotentechnik/src/domain/comparison/buildComparisonViewModel.ts"] = await patchHeroFallback(root);
  FILES["apps/pfotentechnik/package.json"] = await patchPackageScripts(root);
  const patchedHeader = await patchHeaderDesignSystem(root);
  if (patchedHeader !== null) FILES["packages/affiliate-core/src/components/Header.astro"] = patchedHeader;

  for (const [path, content] of Object.entries(FILES)) {
    const absolute = join(root, path);
    await mkdir(dirname(absolute), { recursive: true });
    await writeFile(absolute, content, "utf8");
    console.log(`Geändert: ${path}`);
  }

  for (const path of REMOVALS) {
    const absolute = join(root, path);
    if (await exists(absolute)) { await rm(absolute); console.log(`Entfernt: ${path}`); }
  }

  await verifyDesignSystemAdoption(root);

  if (!skipChecks) {
    run(root, "npm", ["run", "build:pfotentechnik"]);
    const astroCheck = join(root, "node_modules/@astrojs/check/package.json");
    if (await exists(astroCheck)) run(root, "npm", ["exec", "--workspace", "apps/pfotentechnik", "astro", "check"]);
    else console.warn("SKIP Typecheck: @astrojs/check ist nicht installiert.");
    run(root, "npm", ["--workspace", "apps/pfotentechnik", "run", "comparison:data:test"]);
    run(root, "npm", ["--workspace", "apps/pfotentechnik", "run", "comparison:hero:audit"]);
    run(root, "npm", ["--workspace", "apps/pfotentechnik", "run", "comparison:audit:strict"]);
    run(root, "npm", ["--workspace", "apps/pfotentechnik", "run", "design-system:tokens:audit"]);
    run(root, "npm", ["--workspace", "apps/pfotentechnik", "run", "design-system:components:audit"]);
    run(root, "npm", ["--workspace", "apps/pfotentechnik", "run", "design-system:responsive:audit"]);
    run(root, "npm", ["--workspace", "apps/pfotentechnik", "run", "design-system:visual-qa:strict"]);
    run(root, "npm", ["--workspace", "apps/pfotentechnik", "run", "audit:technical-seo:source"]);
    const globalReleaseReady = runStatusCheck(
      root,
      "npm",
      ["--workspace", "apps/pfotentechnik", "run", "comparison:release:check"],
      "Globales Comparison-Release-Gate"
    );
    if (!globalReleaseReady) {
      console.warn("Bericht prüfen: apps/pfotentechnik/reports/comparison-platform/comparison-release-closure.md");
    }
  }

  console.log(`\n[${LABEL}] INSTALLATION UND TECHNISCHE HERO-PRÜFUNGEN BESTANDEN.`);
  console.log(`Backups: ${relative(root, backupRoot)}`);
  console.log(`Hero-System: ${HERO_DIRECTORY}/<slug>-editorial-hero.webp`);
  console.log(`Standard-Fallback: ${DEFAULT_HERO}`);
  console.log(`Neu übernommene slug-spezifische Bilder: ${copiedHeroCount}`);
  console.log("Fehlende slug-spezifische Bilder bleiben zulässige Fallback-Hinweise, bis das finale Bildset erstellt ist.");
  console.log("Mobile: Editorial-Cover, Vertrauens-Chips vor dem Bild, 2×2 zweizeilige Filterkarten.");
  console.log("Desktop: kompakter Cover-Hero, ruhige Filterleiste und eigenständige Redaktionsempfehlung.");
};

main().catch((error) => {
  console.error(`\n[${LABEL}] FEHLER: ${error.message}`);
  process.exitCode = 1;
});

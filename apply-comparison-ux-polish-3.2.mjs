#!/usr/bin/env node
/**
 * PfotenTechnik Comparison UX Polish 3.2
 *
 * Usage:
 *   node apply-comparison-ux-polish-3.2.mjs --check
 *   node apply-comparison-ux-polish-3.2.mjs
 *
 * Properties:
 * - repository-root discovery via package.json
 * - timestamped backups
 * - idempotent
 * - --check dry run
 * - no brittle line-number anchors
 * - only touches Comparison-related files
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const args = new Set(process.argv.slice(2));
const CHECK = args.has("--check");
const VERSION = "3.2.0";
const MARKER = `Comparison UX Polish ${VERSION}`;

function findRoot(start = process.cwd()) {
  let dir = path.resolve(start);
  while (true) {
    const pkg = path.join(dir, "package.json");
    if (fs.existsSync(pkg)) {
      try {
        const data = JSON.parse(fs.readFileSync(pkg, "utf8"));
        if (data?.scripts?.["build:pfotentechnik"] || fs.existsSync(path.join(dir, "apps", "pfotentechnik"))) {
          return dir;
        }
      } catch {}
    }
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error("Repository-Wurzel nicht gefunden.");
    dir = parent;
  }
}

const root = findRoot();
const backupRoot = path.join(
  root,
  ".patch-backups",
  `comparison-ux-polish-${VERSION}-${Date.now()}`
);

const files = {
  shell: "packages/affiliate-core/src/components/comparison/ComparisonShell.astro",
  page: "apps/pfotentechnik/src/pages/vergleiche/[comparison].astro",
  scenario: "apps/pfotentechnik/src/components/comparison/ScenarioRecommendations.astro",
  ux: "packages/affiliate-core/src/components/comparison/comparison-premium-ux.css",
  polish: "packages/affiliate-core/src/components/comparison/comparison-ux-polish-3.2.css"
};

function read(rel) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) throw new Error(`Pflichtdatei fehlt: ${rel}`);
  return fs.readFileSync(abs, "utf8");
}

function sha(text) {
  return crypto.createHash("sha256").update(text).digest("hex").slice(0, 12);
}

const original = Object.fromEntries(
  Object.entries(files)
    .filter(([, rel]) => fs.existsSync(path.join(root, rel)))
    .map(([key, rel]) => [key, read(rel)])
);

function ensureSignature(name, content, signatures) {
  const missing = signatures.filter((signature) => !content.includes(signature));
  if (missing.length) {
    throw new Error(
      `${name}: unbekannter Repository-Stand. Fehlende Strukturmerkmale: ${missing.join(", ")}`
    );
  }
}

ensureSignature(files.shell, original.shell, [
  "<ComparisonHero",
  "<ComparisonInsightSummary",
  "<RecommendationGrid",
  "<ComparisonExplorer",
  "<ComparisonMethodology",
  "<ComparisonVerdict",
  "<ComparisonStickyBar"
]);
ensureSignature(files.page, original.page, [
  "<ComparisonShell model={model} />",
  "<ScenarioRecommendations",
  "<Content />",
  "<FAQ items={comparison.faq}",
  "<RelatedArticles"
]);
ensureSignature(files.scenario, original.scenario, [
  'class="scenario-recommendations"',
  'class="scenario-grid"',
  'class="scenario-card"'
]);

function replaceOnce(content, pattern, replacement, label) {
  const matches = content.match(pattern);
  if (!matches) throw new Error(`${label}: erwartete semantische Struktur nicht gefunden.`);
  return content.replace(pattern, replacement);
}

let shell = original.shell;
if (!shell.includes(`./comparison-ux-polish-3.2.css`)) {
  shell = replaceOnce(
    shell,
    /import "\.\/comparison-premium-seo\.css";/,
    `import "./comparison-premium-seo.css";\nimport "./comparison-ux-polish-3.2.css";`,
    files.shell
  );
}

const shellFrontmatterEnd = shell.indexOf("---", 4);
const shellFrontmatter = shell.slice(0, shellFrontmatterEnd + 3);
const shellTemplate = shell.slice(shellFrontmatterEnd + 3);
const stickyMatch = shellTemplate.match(/\n<ComparisonStickyBar product=\{model\.verdict\.winner\} \/>\s*$/);
if (!stickyMatch) throw new Error(`${files.shell}: StickyBar-Struktur nicht erkannt.`);

const newShellTemplate = `
<div class="comparison-shell comparison-shell--premium" data-comparison-polish="3.2">
  <ComparisonHero
    eyebrow={model.eyebrow}
    title={model.title}
    description={model.description}
    image={model.heroImage}
    facts={model.facts}
  />

  <nav class="comparison-premium-nav" aria-label="Sprungnavigation zum Vergleich">
    <a href="#schnelle-empfehlung">30-Sekunden-Empfehlung</a>
    <a href="#vergleichssieger">Testsieger</a>
    <a href="#einsatzzwecke">Einsatzzwecke</a>
    <a href="#redaktionelle-zusammenfassung">Zusammenfassung</a>
    <a href="#direktvergleich">Vergleich</a>
    <a href="#methodik">Methodik</a>
  </nav>

  <div class="comparison-decision-flow">
    <section id="schnelle-empfehlung" class="comparison-premium-section">
      <div class="comparison-premium-section__heading">
        <div>
          <span class="comparison-eyebrow">30-Sekunden-Empfehlung</span>
          <h2>Die stärksten Modelle auf einen Blick</h2>
        </div>
        <p>Starte mit dem Einsatzgebiet. Die vollständigen Unterschiede folgen anschließend im Direktvergleich.</p>
      </div>
      <RecommendationGrid products={model.recommendationProducts} />
    </section>

    {winner && (
      <section id="vergleichssieger" class="comparison-premium-section comparison-winner-section" aria-labelledby="vergleichssieger-title">
        <div class="comparison-premium-section__heading">
          <div>
            <span class="comparison-eyebrow">Gesamtsieger</span>
            <h2 id="vergleichssieger-title">Unsere stärkste Empfehlung</h2>
          </div>
          <p>Entscheidend sind nicht einzelne Funktionen, sondern die ausgewogene Gesamtleistung im Vergleich.</p>
        </div>

        <div class="comparison-winner-card">
          <span class="comparison-winner-card__eyebrow">Unsere Empfehlung</span>
          {winner.badge && <span class="comparison-winner-card__badge">{winner.badge}</span>}
          {winner.image && (
            <a href={winner.href} class="comparison-winner-card__image">
              <img
                src={typeof winner.image.src === "string" ? winner.image.src : winner.image.src.src}
                alt={winner.image.alt ?? winner.title}
                width="520"
                height="420"
                loading="eager"
                decoding="async"
              />
            </a>
          )}
          <div class="comparison-winner-card__copy">
            {winner.manufacturer && <span>{winner.manufacturer}</span>}
            <h3><a href={winner.href}>{winner.title}</a></h3>
            {typeof winner.rating === "number" && (
              <div class="comparison-winner-card__score">
                <strong>{Math.round(winner.rating)}</strong>
                <span>von 100 Punkten</span>
              </div>
            )}
            {winner.recommendation && <p>{winner.recommendation}</p>}
            {winner.strengths.length > 0 && (
              <ul>
                {winner.strengths.slice(0, 4).map((strength) => <li>{strength}</li>)}
              </ul>
            )}
          </div>
          <div class="comparison-winner-card__actions">
            <a href={winner.href} class="comparison-button comparison-button--secondary">Test lesen</a>
            {winnerPrice?.url && (
              <a
                href={winnerPrice.url}
                class="comparison-button"
                rel={winnerPrice.rel}
                target={winnerPrice.target}
                data-affiliate-link
              >
                {winnerPrice.label}
              </a>
            )}
          </div>
        </div>
      </section>
    )}

    <section id="einsatzzwecke" class="comparison-premium-section comparison-slot-section">
      <slot name="scenario-recommendations" />
    </section>

    <section id="redaktionelle-zusammenfassung" class="comparison-premium-section" aria-label="Redaktionelle Zusammenfassung">
      <ComparisonInsightSummary products={model.products} rows={model.rows} />
    </section>

    <ComparisonExplorer
      products={model.products}
      rows={model.rows}
      filters={model.filters}
      initialVisibleProducts={model.initialVisibleProducts}
    />

    <ComparisonProsCons products={model.products} />

    <section id="methodik" class="comparison-premium-section">
      <ComparisonMethodology
        productCount={model.products.length}
        criterionCount={model.rows.length}
      />
    </section>

    <div id="vergleich-fazit">
      <ComparisonVerdict
        title={model.verdict.title}
        text={model.verdict.text}
        winner={model.verdict.winner}
        alternative={model.verdict.alternative}
      />
    </div>
  </div>
</div>

<ComparisonStickyBar product={model.verdict.winner} />
`;

shell = shellFrontmatter + newShellTemplate;

let page = original.page;
page = replaceOnce(
  page,
  /<ComparisonShell model=\{model\} \/>\s*\n\s*<ScenarioRecommendations scenarios=\{model\.scenarioRecommendations\} \/>/,
  `<ComparisonShell model={model}>\n      <ScenarioRecommendations slot="scenario-recommendations" scenarios={model.scenarioRecommendations} />\n    </ComparisonShell>`,
  files.page
);

page = replaceOnce(
  page,
  /<RelatedArticles items=\{relatedItems\} \/>\s*\n\s*\{comparison\.faq\.length > 0 && \(\s*\n\s*<FAQ items=\{comparison\.faq\} \/>\s*\n\s*\)\}/,
  `{comparison.faq.length > 0 && (\n      <section id="faq" aria-label="Häufige Fragen zum Vergleich">\n        <FAQ items={comparison.faq} />\n      </section>\n    )}\n\n    <RelatedArticles items={relatedItems} />`,
  files.page
);

let scenario = original.scenario;
scenario = scenario.replace(
  '<section class="scenario-recommendations" aria-labelledby="scenario-title">',
  '<section class="scenario-recommendations" aria-labelledby="scenario-title" data-comparison-scenarios>'
);

const styleStart = scenario.indexOf("<style>");
const styleEnd = scenario.indexOf("</style>");
if (styleStart === -1 || styleEnd === -1) throw new Error(`${files.scenario}: Style-Block fehlt.`);
scenario =
  scenario.slice(0, styleStart) +
  `<style>
  .scenario-recommendations {
    width: 100%;
    min-width: 0;
    margin: 0;
  }
  .scenario-heading {
    max-width: 760px;
    margin-bottom: 1.5rem;
  }
  .scenario-heading > span,
  .scenario-label {
    color: var(--comparison-accent);
    font-size: .78rem;
    font-weight: 800;
    letter-spacing: .08em;
    text-transform: uppercase;
  }
  .scenario-heading h2 {
    margin: .35rem 0 .6rem;
    color: var(--comparison-text);
  }
  .scenario-heading p,
  .scenario-card p {
    color: var(--comparison-muted);
  }
  .scenario-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 250px), 1fr));
    gap: 1rem;
    min-width: 0;
  }
  .scenario-card {
    min-width: 0;
    padding: 1.25rem;
    border: 1px solid var(--comparison-line);
    border-radius: 1rem;
    color: var(--comparison-text);
    background: var(--comparison-surface);
    box-shadow: var(--comparison-premium-shadow);
  }
  .scenario-card h3 {
    margin: .3rem 0 .65rem;
    font-size: 1.08rem;
    overflow-wrap: anywhere;
  }
  .scenario-card h3 a,
  .scenario-meta a {
    color: inherit;
  }
  .scenario-card a:hover {
    color: var(--comparison-accent);
  }
  .scenario-card a:focus-visible {
    outline: 3px solid var(--comparison-focus);
    outline-offset: 3px;
    border-radius: .25rem;
  }
  .scenario-meta {
    display: flex;
    flex-wrap: wrap;
    gap: .55rem 1rem;
    margin-top: 1rem;
    min-width: 0;
    font-size: .86rem;
    font-weight: 700;
  }
  .scenario-meta > * {
    min-width: 0;
    overflow-wrap: anywhere;
  }
  @media (max-width: 760px) {
    .scenario-grid {
      grid-template-columns: minmax(0, 1fr);
    }
    .scenario-card {
      padding: 1.05rem;
    }
  }
</style>` +
  scenario.slice(styleEnd + "</style>".length);

const polishCss = `/*
 * ${MARKER}
 * Final cascade layer for viewport safety, touch ergonomics and token-only dark mode.
 */

.comparison-detail,
.comparison-shell,
.comparison-shell *,
.comparison-decision-flow,
.comparison-decision-flow > *,
.comparison-explorer,
.comparison-explorer__layout,
.comparison-explorer__content,
.comparison-table-wrap,
.comparison-mobile-list,
.recommendation-grid,
.scenario-grid {
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
}

.comparison-detail img,
.comparison-shell img {
  max-width: 100%;
  height: auto;
}

.comparison-decision-flow {
  display: grid;
  gap: clamp(3rem, 6vw, 5rem);
}

.comparison-slot-section:empty {
  display: none;
}

.comparison-winner-section .comparison-winner-card {
  display: grid;
  grid-template-columns: minmax(220px, 34%) minmax(0, 1fr);
  align-items: stretch;
}

.comparison-winner-section .comparison-winner-card__eyebrow,
.comparison-winner-section .comparison-winner-card__badge {
  grid-column: 1 / -1;
}

.comparison-winner-section .comparison-winner-card__image {
  min-width: 0;
}

.comparison-winner-section .comparison-winner-card__copy {
  min-width: 0;
  align-self: center;
}

.comparison-winner-section .comparison-winner-card h3 {
  margin: .3rem 0 .65rem;
  color: var(--comparison-text);
  font-size: clamp(1.35rem, 2.4vw, 2rem);
  line-height: 1.15;
  overflow-wrap: anywhere;
}

.comparison-winner-section .comparison-winner-card h3 a {
  color: inherit;
  text-decoration: none;
}

.comparison-winner-section .comparison-winner-card__actions {
  grid-column: 1 / -1;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.comparison-premium-nav {
  max-width: 100%;
  overscroll-behavior-inline: contain;
}

.comparison-premium-nav a,
.comparison-view-tab,
.comparison-filter-trigger,
.comparison-show-all,
.comparison-button {
  min-height: 44px;
}

.comparison-table-wrap {
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  -webkit-overflow-scrolling: touch;
}

.comparison-table {
  width: 100%;
}

.comparison-table th,
.comparison-table td,
.comparison-mobile-product,
.recommendation-card,
.comparison-fit-card,
.comparison-verdict {
  overflow-wrap: anywhere;
}

.comparison-sticky-bar,
.comparison-sticky-bar__inner {
  max-width: 100vw;
  min-width: 0;
}

@media (max-width: 760px) {
  .comparison-detail,
  .comparison-shell {
    width: 100%;
    max-width: 100%;
  }

  .comparison-premium-nav {
    position: relative;
    top: auto;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    overflow: visible;
    margin-inline: 0;
  }

  .comparison-premium-nav a {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 0;
    padding: .72rem .6rem;
    text-align: center;
    white-space: normal;
  }

  .comparison-premium-section__heading {
    gap: .75rem;
  }

  .comparison-winner-section .comparison-winner-card {
    display: block;
  }

  .comparison-winner-section .comparison-winner-card__actions,
  .comparison-winner-card__actions {
    grid-template-columns: minmax(0, 1fr);
  }

  .recommendation-grid,
  .comparison-mobile-list {
    display: grid !important;
    grid-template-columns: minmax(0, 1fr) !important;
    grid-auto-flow: row !important;
    grid-auto-columns: auto !important;
    overflow: visible !important;
    margin-inline: 0 !important;
    padding-inline: 0 !important;
    scroll-snap-type: none !important;
  }

  .recommendation-card,
  .comparison-mobile-product {
    width: 100%;
    max-width: 100%;
    scroll-snap-align: none;
  }

  .comparison-view-tabs {
    position: relative;
    top: auto;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .comparison-view-tab,
  .comparison-filter-trigger {
    width: 100%;
    min-width: 0;
    padding-inline: .55rem;
  }

  .comparison-explorer__filters {
    width: 100%;
    max-width: 100vw;
  }

  .comparison-filter-drawer__mobile-head {
    margin-inline: -.9rem;
  }

  .comparison-mobile-product__actions {
    position: static;
  }
}

@media (max-width: 420px) {
  .comparison-premium-nav {
    grid-template-columns: minmax(0, 1fr);
  }

  .comparison-view-tabs {
    grid-template-columns: minmax(0, 1fr);
  }
}
`;

const targets = {
  [files.shell]: shell,
  [files.page]: page,
  [files.scenario]: scenario,
  [files.polish]: polishCss
};

const changes = Object.entries(targets).filter(([rel, next]) => {
  const abs = path.join(root, rel);
  return !fs.existsSync(abs) || fs.readFileSync(abs, "utf8") !== next;
});

console.log(`[comparison-ux-polish-${VERSION}] Repository: ${root}`);
console.log(`[comparison-ux-polish-${VERSION}] Modus: ${CHECK ? "CHECK" : "APPLY"}`);

if (!changes.length) {
  console.log("Bereits vollständig installiert. Keine Änderungen nötig.");
  process.exit(0);
}

for (const [rel, next] of changes) {
  const abs = path.join(root, rel);
  const before = fs.existsSync(abs) ? fs.readFileSync(abs, "utf8") : "";
  console.log(`- ${rel}: ${before ? sha(before) : "neu"} -> ${sha(next)}`);
}

if (CHECK) {
  console.log(`Check erfolgreich: ${changes.length} Datei(en) würden geändert.`);
  process.exit(0);
}

for (const [rel] of changes) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) continue;
  const backup = path.join(backupRoot, rel);
  fs.mkdirSync(path.dirname(backup), { recursive: true });
  fs.copyFileSync(abs, backup);
}

for (const [rel, next] of changes) {
  const abs = path.join(root, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, next, "utf8");
}

console.log(`Installiert. Backup: ${backupRoot}`);
console.log("Als Nächstes ausführen:");
console.log("  npm run build:pfotentechnik");

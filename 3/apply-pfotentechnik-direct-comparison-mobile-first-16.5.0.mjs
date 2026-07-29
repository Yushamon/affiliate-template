#!/usr/bin/env node
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const VERSION = "16.5.0";
const LABEL = `pfotentechnik-direct-comparison-mobile-first-${VERSION}`;
const rootArg = process.argv.find((value) => value.startsWith("--root="));
const root = resolve(rootArg ? rootArg.slice("--root=".length) : process.cwd());
const skipChecks = process.argv.includes("--skip-checks");

const EXPLORER = "packages/affiliate-core/src/components/comparison/ComparisonExplorer.astro";
const CARDS = "packages/affiliate-core/src/components/comparison/ComparisonMobileCards.astro";
const CSS = "packages/affiliate-core/src/components/comparison/comparison-editorial-cover.css";
const backupRoot = join(root, ".patch-backups", `${LABEL}-${new Date().toISOString().replaceAll(":", "-")}`);

for (const path of [EXPLORER, CARDS, CSS]) {
  const target = join(backupRoot, path);
  await mkdir(dirname(target), { recursive: true });
  await cp(join(root, path), target);
}

let explorer = await readFile(join(root, EXPLORER), "utf8");

explorer = explorer
  .replace("<h2>Finde das passende Modell</h2>", "<h2>Alle Modelle direkt vergleichen</h2>")
  .replace(
    "Filtere nach deinem Einsatzgebiet oder blende identische Eigenschaften aus.",
    "Vergleiche Funktionen, Preise und wichtige Unterschiede. Identische Merkmale kannst du ausblenden."
  )
  .replace(
    '<div class="comparison-view-tabs" role="tablist" aria-label="Darstellung wählen">',
    `<div class="comparison-explorer__mobile-summary">
      <p><strong data-comparison-result-count-mobile>{products.length}</strong><span> passende Modelle</span></p>
      <span>Unsere Top-Empfehlung findest du weiter oben.</span>
    </div>

    <div class="comparison-explorer__mobile-controls">
      <button
        type="button"
        class="pt-button comparison-filter-trigger comparison-filter-trigger--primary"
        data-comparison-filter-trigger
        aria-expanded="false"
      >
        Filter
      </button>

      <label class="comparison-toggle comparison-toggle--mobile">
        <input type="checkbox" data-differences-only-mobile />
        <span class="pt-control comparison-control-box" aria-hidden="true"></span>
        <span>Nur Unterschiede</span>
      </label>
    </div>

    <div class="comparison-view-tabs" role="tablist" aria-label="Darstellung wählen">`
  )
  .replace(
    /<button\s+type="button"\s+class="comparison-view-tab is-active"[\s\S]*?data-comparison-view="table"[\s\S]*?<\/button>\s*<button\s+type="button"\s+class="comparison-view-tab"[\s\S]*?data-comparison-view="cards"[\s\S]*?<\/button>/,
    `<button
      type="button"
      class="comparison-view-tab is-active"
      role="tab"
      aria-selected="true"
      data-comparison-view="cards"
    >
      Karten
    </button>
    <button
      type="button"
      class="comparison-view-tab"
      role="tab"
      aria-selected="false"
      data-comparison-view="table"
    >
      Tabelle
    </button>`
  )
  .replace(
    /<button\s+type="button"\s+class="comparison-filter-trigger"\s+data-comparison-filter-trigger[\s\S]*?<\/button>/,
    ""
  )
  .replace(
    'const differencesToggle = explorer.querySelector("[data-differences-only]");',
    `const differencesToggle = explorer.querySelector("[data-differences-only]");
      const mobileDifferencesToggle = explorer.querySelector("[data-differences-only-mobile]");
      const mobileCount = explorer.querySelector("[data-comparison-result-count-mobile]");`
  )
  .replace(
    "if (count) count.textContent = String(matchingSlugs.length);",
    `if (count) count.textContent = String(matchingSlugs.length);
        if (mobileCount) mobileCount.textContent = String(matchingSlugs.length);`
  )
  .replace(
    'differencesToggle?.addEventListener("change", applyState);',
    `differencesToggle?.addEventListener("change", () => {
        if (
          differencesToggle instanceof HTMLInputElement &&
          mobileDifferencesToggle instanceof HTMLInputElement
        ) {
          mobileDifferencesToggle.checked = differencesToggle.checked;
        }
        applyState();
      });

      mobileDifferencesToggle?.addEventListener("change", () => {
        if (
          differencesToggle instanceof HTMLInputElement &&
          mobileDifferencesToggle instanceof HTMLInputElement
        ) {
          differencesToggle.checked = mobileDifferencesToggle.checked;
        }
        applyState();
      });`
  );

if (!explorer.includes("comparison-explorer__mobile-controls")) {
  throw new Error("Mobile Controls konnten nicht eingefügt werden.");
}

await writeFile(join(root, EXPLORER), explorer, "utf8");
console.log(`Geändert: ${EXPLORER}`);

const cards = `---
import OptimizedImage from "../OptimizedImage.astro";
import EditorialScore from "../EditorialScore.astro";
import type { ComparisonProduct, ComparisonRow } from "../../comparison/model";
import { getPriceDisplay } from "../../comparison/price";

type Props = {
  products: ComparisonProduct[];
  rows: ComparisonRow[];
  initialVisibleProducts?: number;
};

const { products, rows } = Astro.props as Props;
const priorityRows = rows.slice(0, 6);
---

<div class="comparison-mobile-list" aria-label="Produktvergleich">
  {products.map((product) => {
    const price = getPriceDisplay(product.price);

    return (
      <article
        class="comparison-mobile-product comparison-mobile-product--decision"
        data-mobile-product={product.slug}
      >
        <header class="comparison-mobile-product__head">
          <a href={product.href} class="comparison-mobile-product__image" tabindex="-1" aria-hidden="true">
            {product.image && (
              <OptimizedImage
                src={product.image.src}
                alt={product.image.alt ?? product.title}
                width={240}
                height={180}
                layout="constrained"
              />
            )}
          </a>

          <div class="comparison-mobile-product__identity">
            {product.manufacturer && <span>{product.manufacturer}</span>}
            <h3><a href={product.href}>{product.title}</a></h3>
            {typeof product.rating === "number" && (
              <EditorialScore
                value={product.rating}
                scale={100}
                variant="inline"
                label=""
              />
            )}
          </div>
        </header>

        <dl class="comparison-mobile-product__values">
          {priorityRows.map((row) => {
            const cell = row.cells.find((entry) => entry.productSlug === product.slug);
            const value = cell?.value && cell.value !== "–" ? cell.value : "Keine Angabe";

            return (
              <div
                data-mobile-criterion
                data-has-differences={String(row.hasDifferences)}
              >
                <dt>{row.criterion.label}</dt>
                <dd>{value}</dd>
              </div>
            );
          })}
        </dl>

        <footer class="comparison-mobile-product__footer">
          <div class="comparison-mobile-product__price">
            <small>Preis</small>
            <strong>{price.amountLabel ? price.amountLabel.replace(/^ca\\.\\s*/, "") : "nicht verfügbar"}</strong>
          </div>

          <a
            href={product.href}
            class="pt-button comparison-button comparison-mobile-product__details"
          >
            Details
          </a>

          {price.url && (
            <a
              href={price.url}
              class="pt-button comparison-button"
              rel={price.rel}
              target={price.target}
              data-affiliate-link
            >
              {price.label}
            </a>
          )}
        </footer>
      </article>
    );
  })}
</div>
`;

await writeFile(join(root, CARDS), cards, "utf8");
console.log(`Geändert: ${CARDS}`);

const block = `
/* PT_DIRECT_COMPARISON_MOBILE_FIRST_16_5_0_START */
.comparison-explorer__mobile-summary,
.comparison-explorer__mobile-controls {
  display: none;
}

@media (max-width: 47.5rem) {
  .comparison-explorer .comparison-premium-section__heading {
    display: grid;
    gap: .55rem;
    margin-bottom: 1rem;
  }

  .comparison-explorer .comparison-premium-section__heading h2 {
    margin: .2rem 0 0;
    font-size: clamp(1.75rem, 8vw, 2.25rem);
    line-height: 1.06;
  }

  .comparison-explorer .comparison-premium-section__heading p {
    margin: 0;
    color: var(--comparison-muted);
    font-size: 1rem;
    line-height: 1.5;
  }

  .comparison-explorer__mobile-summary {
    display: grid;
    gap: .2rem;
    margin-bottom: .85rem;
    padding: .85rem 1rem;
    border: 1px solid var(--comparison-line);
    border-radius: var(--pt-radius-lg);
    background: var(--comparison-surface);
  }

  .comparison-explorer__mobile-summary p {
    margin: 0;
    color: var(--comparison-text);
  }

  .comparison-explorer__mobile-summary > span {
    color: var(--comparison-muted);
    font-size: .82rem;
  }

  .comparison-explorer__mobile-controls {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: .65rem;
    margin-bottom: .75rem;
  }

  .comparison-filter-trigger--primary {
    min-height: 3rem;
  }

  .comparison-toggle--mobile {
    display: flex;
    min-height: 3rem;
    align-items: center;
    justify-content: center;
    gap: .5rem;
    padding: .65rem .75rem;
    border: 1px solid var(--comparison-line);
    border-radius: var(--pt-radius-lg);
    color: var(--comparison-text);
    background: var(--comparison-surface);
    font-weight: 800;
  }

  .comparison-view-tabs {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: .4rem;
    margin-bottom: 1rem;
    padding: .25rem;
    border: 1px solid var(--comparison-line);
    border-radius: var(--pt-radius-lg);
    background: var(--comparison-surface-soft);
  }

  .comparison-view-tab {
    min-height: 2.75rem;
    border-radius: calc(var(--pt-radius-lg) - .2rem);
  }

  .comparison-view-tab.is-active {
    background: var(--comparison-surface);
    box-shadow: var(--pt-shadow-sm);
  }

  .comparison-explorer__layout {
    display: block;
  }

  .comparison-result-summary {
    display: none;
  }

  .comparison-show-all {
    width: 100%;
    min-height: 2.9rem;
  }

  .comparison-mobile-list {
    display: grid;
    gap: 1rem;
  }

  .comparison-mobile-product--decision {
    display: grid;
    gap: 1rem;
    padding: 1rem;
    border: 1px solid var(--comparison-line);
    border-radius: var(--pt-radius-xl);
    background: var(--comparison-surface);
    box-shadow: var(--pt-shadow-sm);
  }

  .comparison-mobile-product--decision .comparison-mobile-product__head {
    display: grid;
    grid-template-columns: 5.5rem minmax(0, 1fr);
    align-items: center;
    gap: .85rem;
  }

  .comparison-mobile-product--decision .comparison-mobile-product__image {
    display: grid;
    width: 5.5rem;
    aspect-ratio: 4 / 3;
    place-items: center;
    overflow: hidden;
    border-radius: var(--pt-radius-md);
    background: var(--comparison-surface-soft);
  }

  .comparison-mobile-product--decision .comparison-mobile-product__image img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .comparison-mobile-product__identity {
    min-width: 0;
  }

  .comparison-mobile-product__identity > span {
    color: var(--comparison-muted);
    font-size: .7rem;
    font-weight: 800;
    text-transform: uppercase;
  }

  .comparison-mobile-product__identity h3 {
    margin: .15rem 0 .55rem;
    font-size: 1.18rem;
    line-height: 1.16;
  }

  .comparison-mobile-product__identity h3 a {
    color: var(--comparison-text);
    text-decoration: none;
    overflow-wrap: break-word;
    word-break: normal;
  }

  .comparison-mobile-product__identity .pt-score__label {
    display: none;
  }

  .comparison-mobile-product__values {
    display: grid;
    margin: 0;
    border-top: 1px solid var(--comparison-line);
  }

  .comparison-mobile-product__values > div {
    display: grid;
    grid-template-columns: minmax(7.5rem, .9fr) minmax(0, 1.1fr);
    gap: .75rem;
    padding: .7rem 0;
    border-bottom: 1px solid var(--comparison-line);
  }

  .comparison-mobile-product__values dt {
    color: var(--comparison-muted);
    font-size: .82rem;
  }

  .comparison-mobile-product__values dd {
    margin: 0;
    color: var(--comparison-text);
    font-size: .88rem;
    font-weight: 750;
    text-align: right;
  }

  .comparison-mobile-product__footer {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: .65rem;
    align-items: end;
  }

  .comparison-mobile-product__price {
    display: grid;
    gap: .1rem;
  }

  .comparison-mobile-product__price small {
    color: var(--comparison-muted);
    font-size: .72rem;
  }

  .comparison-mobile-product__price strong {
    color: var(--comparison-text);
    font-size: 1.15rem;
  }

  .comparison-mobile-product__details {
    min-height: 3rem;
  }

  .comparison-mobile-product__footer > [data-affiliate-link] {
    grid-column: 1 / -1;
    min-height: 3.1rem;
  }
}
/* PT_DIRECT_COMPARISON_MOBILE_FIRST_16_5_0_END */
`;

let css = await readFile(join(root, CSS), "utf8");
css = css.replace(
  /\/\* PT_DIRECT_COMPARISON_MOBILE_FIRST_16_5_0_START \*\/[\s\S]*?\/\* PT_DIRECT_COMPARISON_MOBILE_FIRST_16_5_0_END \*\//g,
  ""
).trimEnd();
await writeFile(join(root, CSS), `${css}\n\n${block}\n`, "utf8");
console.log(`Geändert: ${CSS}`);

if (!skipChecks) {
  for (const script of [
    "design-system:tokens:audit",
    "design-system:components:audit",
    "design-system:responsive:audit",
    "design-system:visual-qa:strict",
    "build"
  ]) {
    const result = spawnSync(
      "npm",
      ["--workspace", "apps/pfotentechnik", "run", script],
      { cwd: root, shell: process.platform === "win32", stdio: "inherit" }
    );
    if (result.status !== 0) throw new Error(`Check fehlgeschlagen: ${script}`);
  }

  spawnSync(
    "npm",
    ["--workspace", "apps/pfotentechnik", "run", "comparison:audit:strict"],
    { cwd: root, shell: process.platform === "win32", stdio: "inherit" }
  );
}

console.log(`\n[${LABEL}] ABGESCHLOSSEN.`);
console.log("- Kartenansicht ist Mobile-Standard");
console.log("- Filter und Nur-Unterschiede direkt erreichbar");
console.log("- Tabelle bleibt optional");
console.log("- maximal sechs Kernkriterien je Karte");
console.log("- kompakte Preis- und CTA-Zone");

#!/usr/bin/env node
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const VERSION = "16.3.0";
const LABEL = `pfotentechnik-comparison-visual-fix-${VERSION}`;
const rootArg = process.argv.find((value) => value.startsWith("--root="));
const repo = resolve(rootArg ? rootArg.slice(7) : process.cwd());
const skipChecks = process.argv.includes("--skip-checks");

const GRID = "packages/affiliate-core/src/components/comparison/RecommendationGrid.astro";
const CSS = "packages/affiliate-core/src/components/comparison/comparison-editorial-cover.css";
const backupRoot = join(repo, ".patch-backups", `${LABEL}-${new Date().toISOString().replaceAll(":", "-")}`);

const read = (path) => readFile(join(repo, path), "utf8");
const write = (path, content) => writeFile(join(repo, path), content, "utf8");

for (const path of [GRID, CSS]) {
  const target = join(backupRoot, path);
  await mkdir(dirname(target), { recursive: true });
  await cp(join(repo, path), target);
}

let grid = await read(GRID);

const oldPrice = `{price?.formatted && <strong>{price.formatted}</strong>}`;
const newPrice = `{price.amountLabel ? (
                <span class="comparison-alternative__price">
                  <small>ab</small>
                  <strong>{price.amountLabel.replace(/^ca\\\\.\\\\s*/, "")}</strong>
                  {price.meta && <em>{price.meta}</em>}
                </span>
              ) : (
                <span class="comparison-alternative__price comparison-alternative__price--missing">
                  <strong>Preis prüfen</strong>
                </span>
              )}`;

if (grid.includes(oldPrice)) {
  grid = grid.replace(oldPrice, newPrice);
} else if (!grid.includes("comparison-alternative__price")) {
  throw new Error("Preis-Anker in RecommendationGrid nicht gefunden.");
}

grid = grid.replace(
  `<a href={product.href} aria-label={\`\${product.title} ansehen\`}>›</a>`,
  `<a
                href={product.href}
                class="comparison-alternative__chevron"
                aria-label={\`\${product.title} ansehen\`}
              >
                ›
              </a>`
);

await write(GRID, grid);

const block = `
/* PT_COMPARISON_VISUAL_FIX_16_3_0_START */
.comparison-shell[data-comparison-cover-version="16.1.0"],
.comparison-shell[data-comparison-cover-version="16.2.0"] {
  --comparison-mobile-gutter: 1rem;
}

.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-cover,
.comparison-shell[data-comparison-cover-version="16.2.0"] .comparison-cover,
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-editorial-recommendation,
.comparison-shell[data-comparison-cover-version="16.2.0"] .comparison-editorial-recommendation,
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternatives,
.comparison-shell[data-comparison-cover-version="16.2.0"] .comparison-alternatives,
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-explorer,
.comparison-shell[data-comparison-cover-version="16.2.0"] .comparison-explorer {
  margin-inline: 0;
  padding-inline: var(--comparison-mobile-gutter);
}

.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternatives__list,
.comparison-shell[data-comparison-cover-version="16.2.0"] .comparison-alternatives__list {
  display: grid;
  gap: 1rem;
  overflow: visible;
  border: 0;
  border-radius: 0;
  background: transparent;
}

.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternative,
.comparison-shell[data-comparison-cover-version="16.2.0"] .comparison-alternative {
  overflow: hidden;
  border: 1px solid var(--comparison-line);
  border-radius: var(--pt-radius-xl);
  background: var(--comparison-surface);
  box-shadow: var(--pt-shadow-sm);
}

.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternative__media,
.comparison-shell[data-comparison-cover-version="16.2.0"] .comparison-alternative__media {
  aspect-ratio: 16 / 9;
  max-height: 15rem;
  padding: .65rem;
}

.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternative__media img,
.comparison-shell[data-comparison-cover-version="16.2.0"] .comparison-alternative__media img {
  max-height: 13.5rem;
}

.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternative__meta,
.comparison-shell[data-comparison-cover-version="16.2.0"] .comparison-alternative__meta {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(8.75rem, auto) 2.75rem;
  align-items: center;
  gap: .75rem;
}

.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternative__decision,
.comparison-shell[data-comparison-cover-version="16.2.0"] .comparison-alternative__decision {
  display: contents;
}

.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternative__price,
.comparison-shell[data-comparison-cover-version="16.2.0"] .comparison-alternative__price {
  display: grid;
  gap: .05rem;
  min-width: 0;
  padding-left: .75rem;
  border-left: 1px solid var(--comparison-line);
}

.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternative__price small,
.comparison-shell[data-comparison-cover-version="16.2.0"] .comparison-alternative__price small {
  color: var(--comparison-muted);
  font-size: .72rem;
  line-height: 1;
}

.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternative__price strong,
.comparison-shell[data-comparison-cover-version="16.2.0"] .comparison-alternative__price strong {
  color: var(--comparison-text);
  font-size: 1.08rem;
  line-height: 1.15;
  white-space: nowrap;
}

.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternative__price em,
.comparison-shell[data-comparison-cover-version="16.2.0"] .comparison-alternative__price em {
  overflow: hidden;
  color: var(--comparison-muted);
  font-size: .68rem;
  font-style: normal;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternative__chevron,
.comparison-shell[data-comparison-cover-version="16.2.0"] .comparison-alternative__chevron {
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  place-items: center;
  justify-self: end;
  align-self: center;
  border-radius: var(--pt-radius-pill);
  color: var(--comparison-text);
  font-size: 1.75rem;
  line-height: 1;
  text-decoration: none;
}

@media (max-width: 25.875rem) {
  .comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternative__meta,
  .comparison-shell[data-comparison-cover-version="16.2.0"] .comparison-alternative__meta {
    grid-template-columns: minmax(0, 1fr) minmax(7.5rem, auto) 2.5rem;
    gap: .5rem;
  }

  .comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternative__price,
  .comparison-shell[data-comparison-cover-version="16.2.0"] .comparison-alternative__price {
    padding-left: .5rem;
  }

  .comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternative__price strong,
  .comparison-shell[data-comparison-cover-version="16.2.0"] .comparison-alternative__price strong {
    font-size: 1rem;
  }
}
/* PT_COMPARISON_VISUAL_FIX_16_3_0_END */
`;

let css = await read(CSS);
css = css.replace(
  /\/\* PT_COMPARISON_VISUAL_FIX_16_3_0_START \*\/[\s\S]*?\/\* PT_COMPARISON_VISUAL_FIX_16_3_0_END \*\//g,
  ""
).trimEnd();
await write(CSS, `${css}\n\n${block}\n`);

if (!skipChecks) {
  for (const script of [
    "design-system:tokens:audit",
    "design-system:components:audit",
    "design-system:responsive:audit",
    "design-system:visual-qa:strict",
    "build"
  ]) {
    console.log(`\n> npm --workspace apps/pfotentechnik run ${script}`);
    const result = spawnSync(
      "npm",
      ["--workspace", "apps/pfotentechnik", "run", script],
      { cwd: repo, shell: process.platform === "win32", stdio: "inherit" }
    );
    if (result.status !== 0) throw new Error(`Check fehlgeschlagen: ${script}`);
  }

  spawnSync(
    "npm",
    ["--workspace", "apps/pfotentechnik", "run", "comparison:audit:strict"],
    { cwd: repo, shell: process.platform === "win32", stdio: "inherit" }
  );
}

console.log(`\n[${LABEL}] ABGESCHLOSSEN.`);
console.log("- 16 px Seitenabstand");
console.log("- klare Kartentrennung");
console.log("- Preis aus amountLabel");
console.log("- korrekt ausgerichtete Chevron");
console.log("- kompaktere Bilder");

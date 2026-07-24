#!/usr/bin/env node
/**
 * PfotenTechnik Product Light Mode + Category Link 4.1.2
 *
 * Fix gegenüber 4.1.1:
 * - verhindert die vorzeitige Auswertung von ${category} im Installer
 *
 * Usage:
 *   node apply-pfotentechnik-product-lightmode-category-4.1.2.mjs --check
 *   node apply-pfotentechnik-product-lightmode-category-4.1.2.mjs
 */

import fs from "node:fs";
import path from "node:path";

const VERSION = "4.1.2";
const CHECK = process.argv.includes("--check");

const FILES = {
  renderer: "apps/pfotentechnik/src/components/product-standard-2/ProductRenderer.astro",
  nextSteps: "apps/pfotentechnik/src/components/DecisionNextSteps.astro"
};

const RENDERER_START = "/* product-lightmode-category-4.1.2 */";
const RENDERER_END = "/* end product-lightmode-category-4.1.2 */";
const NEXT_START = "/* decision-next-steps-theme-4.1.2 */";
const NEXT_END = "/* end decision-next-steps-theme-4.1.2 */";

function findRoot(start = process.cwd()) {
  let current = path.resolve(start);

  while (true) {
    if (
      fs.existsSync(path.join(current, FILES.renderer)) &&
      fs.existsSync(path.join(current, FILES.nextSteps))
    ) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      throw new Error("Repository-Wurzel nicht gefunden.");
    }

    current = parent;
  }
}

function read(root, rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function assertContains(source, rel, fragments) {
  const missing = fragments.filter((fragment) => !source.includes(fragment));

  if (missing.length) {
    throw new Error(
      `${rel}: unbekannter Repository-Stand. Fehlend: ${missing.join(", ")}`
    );
  }
}

function removeBlock(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  if (start === -1) return source;

  const end = source.indexOf(endMarker, start);
  if (end === -1) {
    throw new Error(`Unvollständiger Patchblock: ${startMarker}`);
  }

  return (
    source.slice(0, start).trimEnd() +
    "\n" +
    source.slice(end + endMarker.length).trimStart()
  );
}

function removeLegacyBlocks(source) {
  const markerPairs = [
    [
      "/* product-lightmode-category-4.1.1 */",
      "/* end product-lightmode-category-4.1.1 */"
    ],
    [
      "/* decision-next-steps-theme-4.1.1 */",
      "/* end decision-next-steps-theme-4.1.1 */"
    ],
    [RENDERER_START, RENDERER_END],
    [NEXT_START, NEXT_END]
  ];

  let result = source;
  for (const [start, end] of markerPairs) {
    result = removeBlock(result, start, end);
  }
  return result;
}

function insertBeforeLastStyleClose(source, css) {
  const close = source.lastIndexOf("</style>");
  if (close === -1) {
    throw new Error("Kein abschließender Style-Block gefunden.");
  }

  return (
    source.slice(0, close).trimEnd() +
    "\n\n" +
    css.trim() +
    "\n" +
    source.slice(close)
  );
}

const root = findRoot();
const rendererOriginal = read(root, FILES.renderer);
const nextOriginal = read(root, FILES.nextSteps);

assertContains(rendererOriginal, FILES.renderer, [
  "const category = asText(",
  'class="native-product__badge"',
  "native-product__score",
  "<style>"
]);

assertContains(nextOriginal, FILES.nextSteps, [
  'data-feature="recommendation-cards-2.0"',
  "recommendation-cards-2.1",
  "--next-bg",
  "<style is:global>"
]);

let rendererNext = removeLegacyBlocks(rendererOriginal);

if (!rendererNext.includes("const categoryHref =")) {
  const categoryPattern =
    /const category = asText\(\s*value\.category \?\?\s*source\.category\?\.label \?\?\s*source\.category\s*\);/;

  if (!categoryPattern.test(rendererNext)) {
    throw new Error(
      `${FILES.renderer}: Kategorie-Datenblock konnte nicht sicher erweitert werden.`
    );
  }

  rendererNext = rendererNext.replace(
    categoryPattern,
    `const category = asText(
  value.category ??
  source.category?.label ??
  source.category
);

const categoryHref = asText(
  value.categoryHref ??
  source.category?.path
);`
  );
}

const oldBadge =
  '{category && <span class="native-product__badge">{category}</span>}';

const linkedBadge = [
  "{category && (",
  "        categoryHref",
  "          ? (",
  "              <a",
  '                class="native-product__badge native-product__badge--category"',
  "                href={categoryHref}",
  '                aria-label={`Zum Vergleich und Ratgeberbereich ${category}`}',
  "              >",
  "                {category}",
  "              </a>",
  "            )",
  '          : <span class="native-product__badge">{category}</span>',
  "      )}"
].join("\n");

if (rendererNext.includes(oldBadge)) {
  rendererNext = rendererNext.replace(oldBadge, linkedBadge);
} else if (!rendererNext.includes("native-product__badge--category")) {
  throw new Error(
    `${FILES.renderer}: Kategorie-Badge konnte nicht sicher ersetzt werden.`
  );
}

const rendererCss = `
${RENDERER_START}
  .native-product__badge--category {
    text-decoration: none;
    transition:
      background-color .16s ease,
      border-color .16s ease,
      transform .16s ease;
  }

  .native-product__badge--category:hover {
    background: var(--np-green-strong);
    transform: translateY(-1px);
  }

  .native-product__badge--category:focus-visible {
    outline: 3px solid color-mix(in srgb, var(--np-green) 28%, transparent);
    outline-offset: 3px;
  }

  .native-product__score {
    border: 1px solid color-mix(
      in srgb,
      var(--np-green) 34%,
      var(--np-border)
    );
    color: var(--np-green-strong);
    background: var(--np-green-soft);
    box-shadow: none;
  }

  .native-product__score strong,
  .native-product__score small {
    color: inherit;
  }

  :global(html[data-theme="dark"]) .native-product__score,
  :global(html.dark) .native-product__score,
  :global([data-theme="dark"]) .native-product__score {
    border-color: color-mix(
      in srgb,
      var(--np-green) 42%,
      var(--np-border)
    );
    color: var(--np-green-strong);
    background: var(--np-green-soft);
  }
${RENDERER_END}
`;

rendererNext = insertBeforeLastStyleClose(rendererNext, rendererCss);

let nextStepsNext = removeLegacyBlocks(nextOriginal);

const nextCss = `
${NEXT_START}
  .pt-next-steps[data-feature="recommendation-cards-2.0"] {
    --next-bg:
      radial-gradient(
        circle at top right,
        color-mix(in srgb, var(--color-primary, #16813d) 10%, transparent),
        transparent 38%
      ),
      linear-gradient(
        145deg,
        var(--color-surface, #ffffff),
        var(--color-surface-soft, #f4f8f6)
      );
    --next-card: var(--color-surface, #ffffff);
    --next-border: var(--color-border, #dbe3df);
    --next-text: var(--color-text, #101828);
    --next-muted: var(--color-text-muted, #5f6f69);
    --next-accent: var(--color-primary, #16813d);

    border-color: var(--next-border);
    color: var(--next-text);
    background: var(--next-bg);
    box-shadow: 0 18px 48px rgba(16, 24, 40, .09);
  }

  .pt-next-steps[data-feature="recommendation-cards-2.0"]
    .pt-next-steps__card {
    border-color: var(--next-border);
    color: var(--next-text);
    background: var(--next-card);
    box-shadow: 0 8px 24px rgba(16, 24, 40, .045);
  }

  .pt-next-steps[data-feature="recommendation-cards-2.0"]
    .pt-next-steps__card--product {
    border-color: color-mix(
      in srgb,
      var(--next-accent) 34%,
      var(--next-border)
    );
    background:
      linear-gradient(
        145deg,
        color-mix(in srgb, var(--next-accent) 8%, var(--next-card)),
        var(--next-card)
      );
  }

  .pt-next-steps[data-feature="recommendation-cards-2.0"]
    :is(
      .pt-next-steps__header h2,
      .pt-next-steps__card h3,
      .pt-next-steps__score strong,
      .pt-next-steps__stat strong
    ) {
    color: var(--next-text);
  }

  .pt-next-steps[data-feature="recommendation-cards-2.0"]
    :is(
      .pt-next-steps__header > p:last-child,
      .pt-next-steps__card p,
      .pt-next-steps__highlights li,
      .pt-next-steps__score small,
      .pt-next-steps__stat small
    ) {
    color: var(--next-muted) !important;
  }

  .pt-next-steps[data-feature="recommendation-cards-2.0"]
    :is(
      .pt-next-steps__eyebrow,
      .pt-next-steps__label,
      .pt-next-steps__cta
    ) {
    color: var(--next-accent);
  }

  .pt-next-steps[data-feature="recommendation-cards-2.0"]
    .pt-next-steps__card:hover,
  .pt-next-steps[data-feature="recommendation-cards-2.0"]
    .pt-next-steps__card:focus-visible {
    border-color: var(--next-accent);
    box-shadow: 0 14px 34px rgba(16, 24, 40, .11);
  }

  html[data-theme="dark"]
    .pt-next-steps[data-feature="recommendation-cards-2.0"],
  html.dark
    .pt-next-steps[data-feature="recommendation-cards-2.0"],
  body.dark
    .pt-next-steps[data-feature="recommendation-cards-2.0"],
  [data-theme="dark"]
    .pt-next-steps[data-feature="recommendation-cards-2.0"] {
    --next-bg:
      radial-gradient(circle at top right, rgba(99, 230, 163, .11), transparent 36%),
      linear-gradient(145deg, #102239 0%, #0d1d31 100%);
    --next-card:
      linear-gradient(145deg, rgba(22, 43, 66, .98), rgba(18, 36, 57, .98));
    --next-border: rgba(148, 180, 202, .22);
    --next-text: #f8fafc;
    --next-muted: #c8d3de;
    --next-accent: #63e6a3;

    box-shadow: 0 18px 48px rgba(0, 0, 0, .22);
  }

  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]):not(.light)
      .pt-next-steps[data-feature="recommendation-cards-2.0"] {
      --next-bg:
        radial-gradient(circle at top right, rgba(99, 230, 163, .11), transparent 36%),
        linear-gradient(145deg, #102239 0%, #0d1d31 100%);
      --next-card:
        linear-gradient(145deg, rgba(22, 43, 66, .98), rgba(18, 36, 57, .98));
      --next-border: rgba(148, 180, 202, .22);
      --next-text: #f8fafc;
      --next-muted: #c8d3de;
      --next-accent: #63e6a3;
    }
  }
${NEXT_END}
`;

nextStepsNext = insertBeforeLastStyleClose(nextStepsNext, nextCss);

const changes = [
  [FILES.renderer, rendererOriginal, rendererNext],
  [FILES.nextSteps, nextOriginal, nextStepsNext]
].filter(([, before, after]) => before !== after);

console.log(`[product-lightmode-category-${VERSION}] Repository: ${root}`);
console.log(
  `[product-lightmode-category-${VERSION}] Modus: ${
    CHECK ? "--check" : "installieren"
  }`
);

if (!changes.length) {
  console.log("Bereits vollständig installiert.");
  process.exit(0);
}

for (const [rel] of changes) {
  console.log(`- ${rel}`);
}

if (CHECK) {
  console.log(
    `Check erfolgreich. ${changes.length} Datei(en) würden geändert.`
  );
  process.exit(0);
}

const backupRoot = path.join(
  root,
  ".patch-backups",
  `product-lightmode-category-${VERSION}-${Date.now()}`
);

for (const [rel] of changes) {
  const source = path.join(root, rel);
  const backup = path.join(backupRoot, rel);
  fs.mkdirSync(path.dirname(backup), { recursive: true });
  fs.copyFileSync(source, backup);
}

for (const [rel, , after] of changes) {
  fs.writeFileSync(path.join(root, rel), after, "utf8");
}

console.log("Patch erfolgreich installiert.");
console.log(`Backup: ${backupRoot}`);
console.log("Jetzt ausführen:");
console.log("  npm run build:pfotentechnik");

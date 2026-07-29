#!/usr/bin/env node
import { access, cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const VERSION = "16.2.0";
const LABEL = `pfotentechnik-comparison-mobile-layout-recovery-${VERSION}`;
const rootArg = process.argv.find((value) => value.startsWith("--root="));
const root = resolve(rootArg ? rootArg.slice("--root=".length) : process.cwd());
const skipChecks = process.argv.includes("--skip-checks");
const backupRoot = join(
  root,
  ".patch-backups",
  `${LABEL}-${new Date().toISOString().replaceAll(":", "-")}`
);

const PATHS = {
  grid: "packages/affiliate-core/src/components/comparison/RecommendationGrid.astro",
  sticky: "packages/affiliate-core/src/components/comparison/ComparisonStickyBar.astro",
  css: "packages/affiliate-core/src/components/comparison/comparison-editorial-cover.css"
};

const exists = async (relativePath) => {
  try {
    await access(join(root, relativePath), constants.F_OK);
    return true;
  } catch {
    return false;
  }
};

const read = (relativePath) => readFile(join(root, relativePath), "utf8");

const backup = async (relativePath) => {
  if (!(await exists(relativePath))) {
    throw new Error(`Datei fehlt: ${relativePath}`);
  }
  const source = join(root, relativePath);
  const target = join(backupRoot, relativePath);
  await mkdir(dirname(target), { recursive: true });
  await cp(source, target);
};

const write = async (relativePath, content) => {
  const target = join(root, relativePath);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, content, "utf8");
  console.log(`Geändert: ${relativePath}`);
};

const run = async (script, required = true) => {
  const pkg = JSON.parse(
    await readFile(join(root, "apps/pfotentechnik/package.json"), "utf8")
  );

  if (!pkg.scripts?.[script]) {
    if (required) throw new Error(`Workspace-Script fehlt: ${script}`);
    console.warn(`[${LABEL}] Optionaler Check fehlt: ${script}`);
    return false;
  }

  console.log(`\n> npm --workspace apps/pfotentechnik run ${script}`);
  const result = spawnSync(
    "npm",
    ["--workspace", "apps/pfotentechnik", "run", script],
    {
      cwd: root,
      shell: process.platform === "win32",
      stdio: "inherit"
    }
  );

  if (required && result.status !== 0) {
    throw new Error(`Check fehlgeschlagen: ${script}`);
  }
  return result.status === 0;
};

const grid = `---
import OptimizedImage from "../OptimizedImage.astro";
import EditorialScore from "../EditorialScore.astro";
import type { ComparisonProduct } from "../../comparison/model";
import { getPriceDisplay } from "../../comparison/price";

type Props = {
  products: ComparisonProduct[];
};

const { products } = Astro.props as Props;

type UseCase = {
  icon: string;
  label: string;
  tone: string;
  test: (text: string) => boolean;
};

const useCases: UseCase[] = [
  {
    icon: "€",
    label: "Preis-Leistungs-Tipp",
    tone: "value",
    test: (text) => /preis|günstig|budget|preis.?leistung/.test(text)
  },
  {
    icon: "♧",
    label: "Für Mehrtierhaushalte",
    tone: "multi",
    test: (text) => /mehrkatzen|mehrere katzen|mehrtier|futterneid|chip/.test(text)
  },
  {
    icon: "▣",
    label: "Beste Kamera",
    tone: "camera",
    test: (text) => /kamera|video|sicht|überwachung/.test(text)
  },
  {
    icon: "×",
    label: "Ohne Abo",
    tone: "simple",
    test: (text) => /ohne abo|kein abo|keine laufenden/.test(text)
  },
  {
    icon: "▥",
    label: "Lange Akkulaufzeit",
    tone: "battery",
    test: (text) => /akku|batterie|laufzeit/.test(text)
  },
  {
    icon: "◫",
    label: "Für Nassfutter",
    tone: "wet",
    test: (text) => /nassfutter|gekühlt|kühlung/.test(text)
  },
  {
    icon: "◇",
    label: "Für große Hunde",
    tone: "large",
    test: (text) => /große hund|large dog|großes tier/.test(text)
  },
  {
    icon: "⌂",
    label: "Für Einsteiger",
    tone: "starter",
    test: (text) => /einsteiger|einfach|unkompliziert|leicht zu bedienen/.test(text)
  }
];

const usedLabels = new Set<string>();

const recommendations = products.map((product) => {
  const text = [
    product.badge,
    product.recommendation,
    ...(product.strengths ?? [])
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const matched = useCases.find(
    (useCase) => !usedLabels.has(useCase.label) && useCase.test(text)
  );

  if (matched) {
    usedLabels.add(matched.label);
    return { product, useCase: matched };
  }

  const fallbackLabel = product.badge && !usedLabels.has(product.badge)
    ? product.badge
    : "Starke Alternative";

  usedLabels.add(fallbackLabel);

  return {
    product,
    useCase: {
      icon: "→",
      label: fallbackLabel,
      tone: "default",
      test: () => true
    }
  };
});
---

<section class="comparison-alternatives" aria-labelledby="comparison-alternatives-title">
  <div class="comparison-alternatives__heading">
    <span class="comparison-eyebrow">Alternativen nach Bedarf</span>
    <h2 id="comparison-alternatives-title">Welche Empfehlung passt zu dir?</h2>
    <p>Jedes Modell steht für einen konkreten Vorteil – nicht für eine zweite Rangliste.</p>
  </div>

  <div class="comparison-alternatives__list">
    {recommendations.map(({ product, useCase }) => {
      const price = getPriceDisplay(product.price);

      return (
        <article class="comparison-alternative" data-product-slug={product.slug}>
          <div class={\`comparison-alternative__use-case comparison-alternative__use-case--\${useCase.tone}\`}>
            <span aria-hidden="true">{useCase.icon}</span>
            <strong>{useCase.label}</strong>
          </div>

          <a
            href={product.href}
            class="comparison-alternative__media"
            tabindex="-1"
            aria-hidden="true"
          >
            {product.image ? (
              <OptimizedImage
                src={product.image.src}
                alt={product.image.alt ?? product.title}
                width={320}
                height={240}
                layout="constrained"
              />
            ) : (
              <span class="comparison-alternative__placeholder" aria-hidden="true">□</span>
            )}
          </a>

          <div class="comparison-alternative__content">
            {product.manufacturer && <span>{product.manufacturer}</span>}
            <h3><a href={product.href}>{product.title}</a></h3>
            {product.recommendation && <p>{product.recommendation}</p>}
          </div>

          <div class="comparison-alternative__meta">
            {typeof product.rating === "number" && (
              <EditorialScore
                value={product.rating}
                scale={100}
                variant="ring-compact"
                description="Redaktioneller Gesamtscore"
              />
            )}

            <div class="comparison-alternative__decision">
              {price?.formatted && <strong>{price.formatted}</strong>}
              <a href={product.href} aria-label={\`\${product.title} ansehen\`}>›</a>
            </div>
          </div>
        </article>
      );
    })}
  </div>

  <a href="#direktvergleich" class="pt-button comparison-alternatives__all">
    Alle Modelle direkt vergleichen
  </a>
</section>
`;

let sticky = await read(PATHS.sticky);
sticky = sticky
  .replace(
    /<strong title=\{product\.title\}>\{product\.title\}<\/strong>/,
    '<strong title={product.title}>{product.title}</strong>'
  )
  .replace(
    /class="pt-button comparison-button comparison-sticky-bar__primary"/,
    'class="pt-button comparison-button comparison-sticky-bar__primary"'
  );

const cssBlock = `
/* PT_COMPARISON_MOBILE_LAYOUT_RECOVERY_16_2_0_START */

/* Reset the broken 16.1.0 mobile alternative grid. */
.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternative,
.comparison-shell[data-comparison-cover-version="16.2.0"] .comparison-alternative {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-areas:
    "case"
    "media"
    "copy"
    "meta";
  gap: .85rem;
  min-width: 0;
  padding: 1rem;
}

.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternative__use-case,
.comparison-shell[data-comparison-cover-version="16.2.0"] .comparison-alternative__use-case {
  grid-area: case;
  max-width: 100%;
  white-space: normal;
}

.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternative__media,
.comparison-shell[data-comparison-cover-version="16.2.0"] .comparison-alternative__media {
  grid-area: media;
  width: 100%;
  min-width: 0;
  aspect-ratio: 16 / 10;
  padding: .75rem;
}

.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternative__media img,
.comparison-shell[data-comparison-cover-version="16.2.0"] .comparison-alternative__media img {
  width: 100%;
  height: 100%;
  max-width: 17rem;
  margin-inline: auto;
  object-fit: contain;
}

.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternative__content,
.comparison-shell[data-comparison-cover-version="16.2.0"] .comparison-alternative__content {
  grid-area: copy;
  width: 100%;
  min-width: 0;
}

.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternative__content > span,
.comparison-shell[data-comparison-cover-version="16.2.0"] .comparison-alternative__content > span {
  display: block;
  margin-bottom: .2rem;
  overflow-wrap: normal;
  word-break: normal;
}

.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternative__content h3,
.comparison-shell[data-comparison-cover-version="16.2.0"] .comparison-alternative__content h3 {
  width: 100%;
  min-width: 0;
  margin: 0 0 .45rem;
  font-size: clamp(1.2rem, 5.5vw, 1.45rem);
  line-height: 1.16;
  overflow-wrap: break-word;
  word-break: normal;
  hyphens: auto;
}

.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternative__content h3 a,
.comparison-shell[data-comparison-cover-version="16.2.0"] .comparison-alternative__content h3 a {
  display: block;
  width: 100%;
  min-width: 0;
  overflow-wrap: break-word;
  word-break: normal;
}

.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternative__content p,
.comparison-shell[data-comparison-cover-version="16.2.0"] .comparison-alternative__content p {
  display: -webkit-box;
  margin: 0;
  font-size: .95rem;
  line-height: 1.45;
  overflow-wrap: break-word;
  word-break: normal;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternative__meta,
.comparison-shell[data-comparison-cover-version="16.2.0"] .comparison-alternative__meta {
  grid-area: meta;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .75rem;
  width: 100%;
  min-width: 0;
  padding-top: .85rem;
  border-top: 1px solid var(--comparison-line);
}

.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternative__meta > .pt-score,
.comparison-shell[data-comparison-cover-version="16.2.0"] .comparison-alternative__meta > .pt-score {
  flex: 0 0 auto;
  transform: none;
}

.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternative__decision,
.comparison-shell[data-comparison-cover-version="16.2.0"] .comparison-alternative__decision {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: .5rem;
  min-width: 0;
}

.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternative__decision strong,
.comparison-shell[data-comparison-cover-version="16.2.0"] .comparison-alternative__decision strong {
  font-size: .95rem;
  white-space: nowrap;
}

.comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternative__decision a,
.comparison-shell[data-comparison-cover-version="16.2.0"] .comparison-alternative__decision a {
  flex: 0 0 auto;
  width: 2.75rem;
  height: 2.75rem;
}

.comparison-sticky-bar {
  bottom: max(.4rem, env(safe-area-inset-bottom));
  padding: .7rem;
}

.comparison-sticky-bar__identity strong {
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow-wrap: normal;
  word-break: normal;
}

.comparison-sticky-bar__primary {
  min-height: 3.25rem;
}

@media (min-width: 36rem) {
  .comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternative,
  .comparison-shell[data-comparison-cover-version="16.2.0"] .comparison-alternative {
    grid-template-columns: 8rem minmax(0, 1fr);
    grid-template-areas:
      "case case"
      "media copy"
      "media meta";
    align-items: center;
  }

  .comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternative__media,
  .comparison-shell[data-comparison-cover-version="16.2.0"] .comparison-alternative__media {
    aspect-ratio: 4 / 3;
  }
}

@media (min-width: 48rem) {
  .comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternative,
  .comparison-shell[data-comparison-cover-version="16.2.0"] .comparison-alternative {
    grid-template-columns: minmax(10rem, .8fr) 7rem minmax(0, 1.4fr) auto;
    grid-template-areas: "case media copy meta";
    gap: 1rem;
  }

  .comparison-shell[data-comparison-cover-version="16.1.0"] .comparison-alternative__meta,
  .comparison-shell[data-comparison-cover-version="16.2.0"] .comparison-alternative__meta {
    min-width: 12rem;
    padding-top: 0;
    border-top: 0;
  }
}

/* PT_COMPARISON_MOBILE_LAYOUT_RECOVERY_16_2_0_END */
`;

for (const path of Object.values(PATHS)) {
  await backup(path);
}

await write(PATHS.grid, grid);
await write(PATHS.sticky, sticky);

let css = await read(PATHS.css);
css = css
  .replace(
    /\/\* PT_COMPARISON_MOBILE_LAYOUT_RECOVERY_16_2_0_START \*\/[\s\S]*?\/\* PT_COMPARISON_MOBILE_LAYOUT_RECOVERY_16_2_0_END \*\//g,
    ""
  )
  .trimEnd();

await write(PATHS.css, `${css}\n\n${cssBlock}\n`);

const writtenGrid = await read(PATHS.grid);
const writtenCss = await read(PATHS.css);
const writtenSticky = await read(PATHS.sticky);

if (!writtenGrid.includes("const usedLabels = new Set<string>();")) {
  throw new Error("Eindeutige Badge-Vergabe fehlt.");
}
if (!writtenGrid.includes('class="comparison-alternative__meta"')) {
  throw new Error("Mobile Meta-Zeile fehlt.");
}
if (!writtenCss.includes("PT_COMPARISON_MOBILE_LAYOUT_RECOVERY_16_2_0_START")) {
  throw new Error("Recovery-CSS fehlt.");
}
if (!writtenCss.includes("word-break: normal")) {
  throw new Error("Vertikaler Textumbruch wurde nicht abgesichert.");
}
if (writtenSticky.includes("Test lesen")) {
  throw new Error("Sticky-Bar enthält weiterhin einen zweiten CTA.");
}

if (!skipChecks) {
  await run("design-system:tokens:audit");
  await run("design-system:components:audit");
  await run("design-system:responsive:audit");
  await run("design-system:visual-qa:strict");
  await run("build");
  await run("comparison:audit:strict", false);
}

console.log(`\n[${LABEL}] ABGESCHLOSSEN.`);
console.log(`Backups: ${backupRoot.replace(`${root}/`, "")}`);
console.log("- vertikale Produktnamen behoben");
console.log("- 414-px-Alternativenkarten vollständig einspaltig");
console.log("- Badge-Kategorien pro Vergleich nur einmal vergeben");
console.log("- Produktname vor Score und Preis priorisiert");
console.log("- Sticky-Bar kompakter und mobil robuster");

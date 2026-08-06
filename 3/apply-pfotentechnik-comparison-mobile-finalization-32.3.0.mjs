#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-comparison-mobile-finalization-32.3.0";
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const skipBuild = process.argv.includes("--skip-build");

const candidates = [
  process.cwd(),
  path.resolve(SCRIPT_DIR, ".."),
  path.resolve(SCRIPT_DIR, "../..")
];

const root = candidates.find((candidate) =>
  fs.existsSync(path.join(candidate, "apps/pfotentechnik")) &&
  fs.existsSync(path.join(candidate, "packages/affiliate-core"))
);

if (!root) {
  throw new Error(`[${PATCH}] Repository-Root nicht gefunden.`);
}

const paths = {
  css: "packages/affiliate-core/src/components/comparison/comparison-experience.css",
  explorer: "packages/affiliate-core/src/components/comparison/ComparisonExplorer.astro"
};

const payloads = {
  "packages/affiliate-core/src/components/comparison/ComparisonStickyBar.astro": "---\nimport type { ComparisonProduct } from \"../../comparison/model\";\nimport { getPriceDisplay } from \"../../comparison/price\";\n\ntype Props = { product?: ComparisonProduct };\nconst { product } = Astro.props as Props;\nconst price = product ? getPriceDisplay(product.price) : null;\n---\n{product && price?.url && (\n  <aside\n    class=\"comparison-sticky-bar\"\n    aria-label=\"Top-Empfehlung\"\n    data-comparison-sticky=\"true\"\n    hidden\n  >\n    <div class=\"comparison-sticky-bar__identity\">\n      <span>Unsere Empfehlung</span>\n      <strong title={product.title}>{product.title}</strong>\n    </div>\n\n    <a\n      href={price.url}\n      class=\"pt-button comparison-button comparison-sticky-bar__primary\"\n      rel={price.rel}\n      target={price.target}\n      data-affiliate-link\n    >\n      Preis prüfen\n    </a>\n  </aside>\n)}\n\n<script>\n  type ComparisonStickyElement = HTMLElement & {\n    comparisonStickyController?: AbortController;\n  };\n\n  const setupComparisonSticky = () => {\n    document\n      .querySelectorAll<ComparisonStickyElement>(\"[data-comparison-sticky]\")\n      .forEach((sticky) => {\n        sticky.comparisonStickyController?.abort();\n\n        const recommendation = document.getElementById(\"vergleichssieger\");\n        if (!recommendation) {\n          sticky.hidden = true;\n          return;\n        }\n\n        const footer = document.querySelector(\"footer\");\n        const controller = new AbortController();\n        const { signal } = controller;\n        sticky.comparisonStickyController = controller;\n\n        let scheduled = false;\n\n        const update = () => {\n          scheduled = false;\n\n          const recommendationRect = recommendation.getBoundingClientRect();\n          const footerRect = footer?.getBoundingClientRect();\n          const afterRecommendation = recommendationRect.bottom < 0;\n          const footerReached = Boolean(\n            footerRect && footerRect.top < window.innerHeight + 24\n          );\n          const visible = afterRecommendation && !footerReached;\n\n          sticky.hidden = !visible;\n          sticky.toggleAttribute(\"data-visible\", visible);\n        };\n\n        const requestUpdate = () => {\n          if (scheduled) return;\n          scheduled = true;\n          requestAnimationFrame(update);\n        };\n\n        update();\n        window.addEventListener(\"scroll\", requestUpdate, {\n          passive: true,\n          signal\n        });\n        window.addEventListener(\"resize\", requestUpdate, {\n          passive: true,\n          signal\n        });\n      });\n  };\n\n  const resetComparisonSticky = () => {\n    document\n      .querySelectorAll<ComparisonStickyElement>(\"[data-comparison-sticky]\")\n      .forEach((sticky) => {\n        sticky.comparisonStickyController?.abort();\n        sticky.comparisonStickyController = undefined;\n        sticky.hidden = true;\n        sticky.removeAttribute(\"data-visible\");\n      });\n  };\n\n  setupComparisonSticky();\n  document.addEventListener(\"astro:page-load\", setupComparisonSticky);\n  document.addEventListener(\"astro:before-swap\", resetComparisonSticky);\n</script>\n",
  "packages/affiliate-core/src/components/comparison/ComparisonMethodology.astro": "---\ntype Props = {\n  productCount: number;\n  criterionCount: number;\n};\n\nconst { productCount, criterionCount } = Astro.props as Props;\n---\n\n<details class=\"comparison-methodology comparison-methodology--compact\">\n  <summary class=\"comparison-methodology__summary\">\n    <span class=\"comparison-methodology__summary-copy\">\n      <span class=\"comparison-eyebrow\">Transparenz</span>\n      <strong>So entsteht dieser Vergleich</strong>\n    </span>\n\n    <span class=\"comparison-methodology__summary-icon\" aria-hidden=\"true\">+</span>\n  </summary>\n\n  <div class=\"comparison-methodology__content\">\n    <p>\n      Wir ordnen {productCount} Modelle anhand von {criterionCount}\n      dokumentierten Kriterien ein. Der Score ist eine redaktionelle\n      Entscheidungshilfe, kein Labormesswert und kein bezahltes Ranking.\n    </p>\n\n    <ul>\n      <li><strong>Datenbasis:</strong> Herstellerunterlagen, technische Daten, dokumentierte Praxiserfahrungen und passende Fachquellen werden nach ihrer Aussagekraft getrennt.</li>\n      <li><strong>Eignung vor Funktionsmenge:</strong> Mehr Funktionen ergeben nur dann einen Vorteil, wenn sie im jeweiligen Einsatz einen nachvollziehbaren Nutzen haben.</li>\n      <li><strong>Unsicherheit kostet keinen Bonus:</strong> Fehlende oder widersprüchliche Angaben werden nicht geschätzt und können eine Empfehlung begrenzen.</li>\n      <li><strong>Preis ist kein Score-Faktor:</strong> Preise und Affiliate-Provisionen verändern die redaktionelle Bewertung und Rangfolge nicht.</li>\n      <li><strong>Grenzen gehören zum Urteil:</strong> Top-Empfehlung und Alternativen werden nach Szenario gewählt. Deshalb kann ein niedriger bewertetes Modell für einen bestimmten Haushalt passender sein.</li>\n    </ul>\n\n    <p>\n      Eigene Praxistests werden ausdrücklich als solche bezeichnet. Ohne diese\n      Kennzeichnung handelt es sich um einen transparenten Daten- und\n      Quellencheck.\n    </p>\n\n    <a href=\"/so-bewerten-wir/\">\n      Kriterien, Gewichtung und Korrekturprozess ansehen\n    </a>\n  </div>\n</details>\n",
  "apps/pfotentechnik/test/pfotentechnik-comparison-mobile-finalization-32.3.0.test.mjs": "import test from \"node:test\";\nimport assert from \"node:assert/strict\";\nimport fs from \"node:fs\";\nimport path from \"node:path\";\n\nconst root = process.cwd();\nconst read = (relative) =>\n  fs.readFileSync(path.join(root, relative), \"utf8\");\n\nconst css = read(\n  \"packages/affiliate-core/src/components/comparison/comparison-experience.css\"\n);\nconst explorer = read(\n  \"packages/affiliate-core/src/components/comparison/ComparisonExplorer.astro\"\n);\nconst methodology = read(\n  \"packages/affiliate-core/src/components/comparison/ComparisonMethodology.astro\"\n);\nconst sticky = read(\n  \"packages/affiliate-core/src/components/comparison/ComparisonStickyBar.astro\"\n);\n\ntest(\"mobile Produktauswahl ist ein vollständiges Raster ohne abgeschnittene Karten\", () => {\n  assert.match(\n    css,\n    /\\.comparison-lab__picker\\s*\\{[^}]*display:\\s*grid;[^}]*grid-template-columns:\\s*repeat\\(2,\\s*minmax\\(0,\\s*1fr\\)\\);/s\n  );\n  const pickerBlock =\n    css.match(/\\.comparison-lab__picker\\s*\\{[\\s\\S]*?\\}/)?.[0] ?? \"\";\n  assert.doesNotMatch(pickerBlock, /overflow-x:\\s*auto/);\n  assert.match(\n    css,\n    /\\.comparison-pick-card\\s*\\{[^}]*grid-template-columns:\\s*3\\.5rem minmax\\(0,\\s*1fr\\)/s\n  );\n});\n\ntest(\"Auswahlkarten und Tabelle beginnen nach Änderungen wieder am selben Produkt\", () => {\n  assert.match(explorer, /const stage = root\\.querySelector\\(\"\\[data-comparison-stage\\]\"\\)/);\n  assert.match(explorer, /card\\.style\\.order = String\\(/);\n  assert.match(explorer, /requestAnimationFrame\\(resetComparisonScroll\\)/);\n  assert.match(explorer, /stage\\.scrollLeft = 0/);\n});\n\ntest(\"zwei Produktspalten passen mobil gemeinsam mit der Kriterien-Spalte\", () => {\n  assert.match(\n    css,\n    /grid-template-columns:\\s*minmax\\(7rem,\\s*7rem\\)\\s*repeat\\(var\\(--pt-comparison-selected-count\\),\\s*minmax\\(7\\.75rem,\\s*1fr\\)\\)/\n  );\n  assert.match(\n    css,\n    /min-width:\\s*calc\\(7rem \\+ var\\(--pt-comparison-selected-count\\) \\* 7\\.75rem\\)/\n  );\n});\n\ntest(\"mobile Werkzeugleiste bleibt kompakt\", () => {\n  assert.match(\n    css,\n    /\\/\\* Toolbar \\*\\/[\\s\\S]*?\\.comparison-lab__toolbar\\s*\\{[^}]*padding:\\s*\\.65rem/s\n  );\n  assert.match(\n    css,\n    /\\.comparison-lab__filter-button\\s*\\{[^}]*min-height:\\s*44px/s\n  );\n  assert.match(\n    css,\n    /\\.comparison-lab__reset\\s*\\{[^}]*min-height:\\s*32px/s\n  );\n});\n\ntest(\"Methodik-Zeile besitzt getrennte Typografie und nur ein Sprungziel\", () => {\n  assert.match(methodology, /comparison-methodology__summary-copy/);\n  assert.match(methodology, /comparison-methodology__summary-icon/);\n  assert.doesNotMatch(\n    methodology,\n    /<details[^>]*\\sid=\"methodik\"/\n  );\n  assert.match(\n    css,\n    /\\.comparison-methodology__summary\\s*\\{[^}]*grid-template-columns:\\s*minmax\\(0,\\s*1fr\\) 2rem/s\n  );\n});\n\ntest(\"Vergleichsinhalt erhält keinen künstlichen Leerraum für die Sticky-CTA\", () => {\n  assert.match(\n    css,\n    /\\.comparison-shell\\s*\\{\\s*padding-bottom:\\s*0;\\s*\\}/\n  );\n  assert.doesNotMatch(css, /padding-bottom:\\s*calc\\(6rem/);\n});\n\ntest(\"mobile Sticky-CTA ist nur noch ein kompakter Button\", () => {\n  assert.match(\n    css,\n    /@media \\(max-width:\\s*47\\.99rem\\)[\\s\\S]*?\\.comparison-sticky-bar__identity\\s*\\{\\s*display:\\s*none;/s\n  );\n  assert.match(\n    css,\n    /@media \\(max-width:\\s*47\\.99rem\\)[\\s\\S]*?\\.comparison-sticky-bar\\s*\\{[^}]*left:\\s*auto/s\n  );\n  assert.match(sticky, /footerReached/);\n  assert.match(sticky, /astro:before-swap/);\n  assert.match(sticky, /AbortController/);\n});\n\ntest(\"Sprungziele bleiben unter dem Sticky-Header sichtbar\", () => {\n  assert.match(\n    css,\n    /\\.pt-page--comparison[\\s\\S]*scroll-margin-top:\\s*5\\.5rem/\n  );\n});\n\ntest(\"Patch führt keine neuen important-Regeln ein\", () => {\n  const cleaned = css.replace(/\\.sr-only\\s*\\{[\\s\\S]*?\\}/g, \"\");\n  assert.doesNotMatch(cleaned, /!important/);\n});\n"
};

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(root, ".patch-backups", `${PATCH}-${timestamp}`);
let changed = 0;
let backupCreated = false;

const absolute = (relative) => path.join(root, relative);
const ensureParent = (file) => fs.mkdirSync(path.dirname(file), { recursive: true });

const backup = (relative) => {
  const source = absolute(relative);
  if (!fs.existsSync(source)) return;

  const destination = path.join(backupRoot, relative);
  ensureParent(destination);
  fs.copyFileSync(source, destination);
  backupCreated = true;
};

const writeAtomic = (relative, content) => {
  const target = absolute(relative);
  ensureParent(target);
  const temporary = `${target}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, content, "utf8");
  fs.renameSync(temporary, target);
};

const writeIfChanged = (relative, content) => {
  const target = absolute(relative);
  const current = fs.existsSync(target)
    ? fs.readFileSync(target, "utf8")
    : null;

  if (current === content) {
    console.log(`[${PATCH}] Unverändert: ${relative}`);
    return;
  }

  backup(relative);
  writeAtomic(relative, content);
  changed += 1;
  console.log(`[${PATCH}] Geschrieben: ${relative}`);
};

const replaceRequired = (source, oldValue, newValue, label) => {
  if (source.includes(newValue)) return source;
  if (!source.includes(oldValue)) {
    throw new Error(`[${PATCH}] ${label}: erwarteter Ausgangsblock fehlt.`);
  }
  return source.replace(oldValue, newValue);
};

for (const [relative, content] of Object.entries(payloads)) {
  writeIfChanged(relative, content);
}

let explorer = fs.readFileSync(absolute(paths.explorer), "utf8");

explorer = replaceRequired(
  explorer,
  `    const closeButton = root.querySelector("[data-filter-close]");`,
  `    const closeButton = root.querySelector("[data-filter-close]");\n    const stage = root.querySelector("[data-comparison-stage]");`,
  "Vergleichsstufe erfassen"
);

explorer = replaceRequired(
  explorer,
  `    const render = () => {`,
  `    const resetComparisonScroll = () => {\n      if (stage instanceof HTMLElement) stage.scrollLeft = 0;\n    };\n\n    const render = () => {`,
  "Scroll-Reset ergänzen"
);

explorer = replaceRequired(
  explorer,
  `      pickers.forEach((input) => {\n        const card = input.closest("[data-picker-card]");\n        if (card instanceof HTMLElement) {\n          card.classList.toggle("is-selected", input.checked);\n          card.hidden = !matchesFilters(input.value);\n        }\n        input.disabled = !input.checked && selected.length >= MAX_SELECTION;\n      });`,
  `      pickers.forEach((input, originalIndex) => {\n        const card = input.closest("[data-picker-card]");\n        if (card instanceof HTMLElement) {\n          const selectedIndex = selected.indexOf(input.value);\n          card.classList.toggle("is-selected", input.checked);\n          card.hidden = !matchesFilters(input.value);\n          card.style.order = String(\n            selectedIndex >= 0\n              ? selectedIndex\n              : selected.length + originalIndex\n          );\n        }\n        input.disabled = !input.checked && selected.length >= MAX_SELECTION;\n      });`,
  "Ausgewählte Karten zuerst sortieren"
);

explorer = replaceRequired(
  explorer,
  `      input.addEventListener("change", () => {\n        if (selectedSlugs().length > MAX_SELECTION) input.checked = false;\n        render();\n      });`,
  `      input.addEventListener("change", () => {\n        if (selectedSlugs().length > MAX_SELECTION) input.checked = false;\n        render();\n        requestAnimationFrame(resetComparisonScroll);\n      });`,
  "Auswahl synchronisieren"
);

explorer = replaceRequired(
  explorer,
  `      render();\n    });\n\n    root.querySelector("[data-filter-reset]")`,
  `      render();\n      requestAnimationFrame(resetComparisonScroll);\n    });\n\n    root.querySelector("[data-filter-reset]")`,
  "Reset synchronisieren"
);

explorer = replaceRequired(
  explorer,
  `    syncGroupDefaults();\n    render();`,
  `    syncGroupDefaults();\n    render();\n    resetComparisonScroll();`,
  "Initialen Scrollstand setzen"
);

writeIfChanged(paths.explorer, explorer);

let css = fs.readFileSync(absolute(paths.css), "utf8");

css = css.replace(
  "PfotenTechnik Comparison Experience 32.1.0",
  "PfotenTechnik Comparison Experience 32.3.0"
);

css = replaceRequired(
  css,
  `.comparison-lab__picker {\n  display: flex;\n  gap: .75rem;\n  margin-inline: calc(var(--pt-page-gutter, 1rem) * -1);\n  padding-inline: var(--pt-page-gutter, 1rem);\n  overflow-x: auto;\n  scroll-snap-type: x proximity;\n  scrollbar-width: none;\n}\n\n.comparison-lab__picker::-webkit-scrollbar {\n  display: none;\n}`,
  `.comparison-lab__picker {\n  display: grid;\n  grid-template-columns: repeat(2, minmax(0, 1fr));\n  gap: .5rem;\n  margin-inline: 0;\n  padding-inline: 0;\n  overflow: visible;\n}`,
  "Mobile Produktauswahl"
);

css = replaceRequired(
  css,
  `.comparison-pick-card {\n  position: relative;\n  display: grid;\n  flex: 0 0 min(82vw, 18rem);\n  grid-template-columns: 4.5rem minmax(0, 1fr);\n  gap: .75rem;\n  min-width: 0;\n  padding: .75rem;\n  border: 1px solid var(--pt-color-border);\n  border-radius: var(--pt-radius-lg, 1rem);\n  background: var(--pt-color-surface);\n  cursor: pointer;\n  scroll-snap-align: start;\n}`,
  `.comparison-pick-card {\n  position: relative;\n  display: grid;\n  grid-template-columns: 3.5rem minmax(0, 1fr);\n  gap: .55rem;\n  min-width: 0;\n  min-height: 6rem;\n  padding: .6rem;\n  border: 1px solid var(--pt-color-border);\n  border-radius: var(--pt-radius-lg, 1rem);\n  background: var(--pt-color-surface);\n  cursor: pointer;\n}`,
  "Kompakte Produktkarten"
);

css = replaceRequired(
  css,
  `.comparison-pick-card__media {\n  display: grid;\n  min-height: 4.5rem;`,
  `.comparison-pick-card__media {\n  display: grid;\n  min-height: 3.5rem;`,
  "Kompakte Produktbilder"
);

css = replaceRequired(
  css,
  `.comparison-pick-card__body {\n  display: grid;\n  align-content: center;\n  gap: .15rem;\n  min-width: 0;\n}`,
  `.comparison-pick-card__body {\n  display: grid;\n  align-content: center;\n  gap: .15rem;\n  min-width: 0;\n  padding-right: 1.2rem;\n}`,
  "Kartentext vor Auswahlmarke schützen"
);

css = replaceRequired(
  css,
  `.comparison-pick-card__body strong {\n  color: var(--pt-color-text);\n  line-height: 1.25;\n}`,
  `.comparison-pick-card__body strong {\n  color: var(--pt-color-text);\n  font-size: .84rem;\n  line-height: 1.25;\n  overflow-wrap: anywhere;\n}`,
  "Mobile Produkttitel"
);

css = replaceRequired(
  css,
  `.comparison-lab__sticky-products,\n.comparison-lab__row {\n  display: grid;\n  grid-template-columns: minmax(9.5rem, 9.5rem) repeat(var(--pt-comparison-selected-count), minmax(10rem, 1fr));\n  min-width: calc(9.5rem + var(--pt-comparison-selected-count) * 10rem);\n}`,
  `.comparison-lab__sticky-products,\n.comparison-lab__row {\n  display: grid;\n  grid-template-columns: minmax(7rem, 7rem) repeat(var(--pt-comparison-selected-count), minmax(7.75rem, 1fr));\n  min-width: calc(7rem + var(--pt-comparison-selected-count) * 7.75rem);\n}`,
  "Mobile Vergleichsspalten"
);

css = replaceRequired(
  css,
  `/* Toolbar */\n.comparison-lab__toolbar {\n  display: grid;\n  grid-template-columns: minmax(0, 1fr) auto;\n  gap: .75rem;\n  align-items: center;\n  padding: .875rem;\n}\n\n.comparison-lab__filter-button {\n  width: 100%;\n}`,
  `/* Toolbar */\n.comparison-lab__toolbar {\n  display: grid;\n  grid-template-columns: minmax(0, 1fr) auto;\n  gap: .5rem;\n  align-items: center;\n  padding: .65rem;\n}\n\n.comparison-lab__filter-button {\n  width: 100%;\n  min-height: 44px;\n  padding: .6rem .75rem;\n  border-radius: var(--pt-radius-md, .75rem);\n}`,
  "Kompakte Werkzeugleiste"
);

css = replaceRequired(
  css,
  `.comparison-lab__reset {\n  grid-column: 1 / -1;\n  justify-self: start;\n  min-height: 40px;\n  padding: 0;\n  border: 0;\n  color: var(--pt-color-text-muted);\n  background: transparent;\n  font: inherit;\n  font-size: .82rem;\n  font-weight: 700;\n  text-decoration: underline;\n  text-underline-offset: .2em;\n}`,
  `.comparison-lab__reset {\n  grid-column: 1 / -1;\n  justify-self: start;\n  min-height: 32px;\n  padding: 0;\n  border: 0;\n  color: var(--pt-color-text-muted);\n  background: transparent;\n  font: inherit;\n  font-size: .82rem;\n  font-weight: 700;\n  text-decoration: underline;\n  text-underline-offset: .2em;\n}`,
  "Kompakter Auswahl-Reset"
);

css = replaceRequired(
  css,
  `.comparison-insight-summary,\n.comparison-methodology {\n  padding: 1rem;\n  border: 1px solid var(--pt-color-border);\n  border-radius: var(--pt-radius-xl, 1.5rem);\n  color: var(--pt-color-text);\n  background: var(--pt-color-surface);\n}`,
  `.comparison-insight-summary,\n.comparison-methodology {\n  padding: 1rem;\n  border: 1px solid var(--pt-color-border);\n  border-radius: var(--pt-radius-xl, 1.5rem);\n  color: var(--pt-color-text);\n  background: var(--pt-color-surface);\n}\n\n.comparison-methodology__summary {\n  display: grid;\n  grid-template-columns: minmax(0, 1fr) 2rem;\n  align-items: center;\n  gap: .75rem;\n  min-height: 3rem;\n  cursor: pointer;\n  list-style: none;\n}\n\n.comparison-methodology__summary::-webkit-details-marker {\n  display: none;\n}\n\n.comparison-methodology__summary-copy {\n  display: grid;\n  grid-template-columns: auto minmax(0, 1fr);\n  align-items: baseline;\n  gap: .45rem;\n  min-width: 0;\n}\n\n.comparison-methodology__summary-copy .comparison-eyebrow {\n  margin: 0;\n  white-space: nowrap;\n}\n\n.comparison-methodology__summary-copy strong {\n  min-width: 0;\n  color: var(--pt-color-text);\n  line-height: 1.25;\n}\n\n.comparison-methodology__summary-icon {\n  display: grid;\n  width: 2rem;\n  height: 2rem;\n  place-items: center;\n  border: 1px solid var(--pt-color-border);\n  border-radius: 999px;\n  color: var(--pt-color-text-muted);\n  transition: transform .15s ease;\n}\n\n.comparison-methodology[open] .comparison-methodology__summary-icon {\n  transform: rotate(45deg);\n}\n\n.comparison-methodology__content {\n  display: grid;\n  gap: .85rem;\n  padding-top: 1rem;\n  border-top: 1px solid var(--pt-color-border);\n}\n\n.comparison-methodology__content :where(p, ul) {\n  margin: 0;\n}`,
  "Methodik-Zeile"
);

css = replaceRequired(
  css,
  `.comparison-shell {\n  padding-bottom: calc(6rem + env(safe-area-inset-bottom));\n}`,
  `.comparison-shell {\n  padding-bottom: 0;\n}`,
  "Künstlichen Seitenleerraum entfernen"
);

const mobileSticky = `
@media (max-width: 47.99rem) {
  .comparison-sticky-bar {
    right: max(1rem, env(safe-area-inset-right));
    bottom: max(.75rem, env(safe-area-inset-bottom));
    left: auto;
    display: block;
    width: auto;
    min-height: 0;
    max-width: none;
    padding: .35rem;
    border-radius: var(--pt-radius-lg, 1rem);
  }

  .comparison-sticky-bar__identity {
    display: none;
  }

  .comparison-sticky-bar__primary {
    min-width: 8.75rem;
    min-height: 48px;
    padding: .65rem .9rem;
  }
}

.pt-page--comparison :where(
  .comparison-shell section[id],
  .comparison-shell details[id],
  .comparison-content h2[id],
  .comparison-content h3[id]
) {
  scroll-margin-top: 5.5rem;
}
`;

if (!css.includes("scroll-margin-top: 5.5rem")) {
  const anchor = `.comparison-shell {\n  padding-bottom: 0;\n}`;
  css = css.replace(anchor, `${anchor}\n${mobileSticky}`);
}

writeIfChanged(paths.css, css);

if (!backupCreated && fs.existsSync(backupRoot)) {
  fs.rmSync(backupRoot, { recursive: true, force: true });
}

const run = (command, args) => {
  console.log(`[${PATCH}] ${command} ${args.join(" ")}`);

  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32"
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      `[${PATCH}] Kommando fehlgeschlagen (${result.status}): ${command} ${args.join(" ")}`
    );
  }
};

run(process.execPath, [
  "--test",
  "apps/pfotentechnik/test/pfotentechnik-comparison-mobile-finalization-32.3.0.test.mjs",
  "apps/pfotentechnik/test/pfotentechnik-comparison-mobile-cleanup-32.1.0.test.mjs",
  "apps/pfotentechnik/test/pfotentechnik-comparison-controls-lightmode-32.1.1.test.mjs"
]);

if (!skipBuild) {
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "build"]);
}

console.log(
  `[${PATCH}] Fertig. ${changed} Datei(en) geändert.${skipBuild ? " Build übersprungen." : ""}`
);

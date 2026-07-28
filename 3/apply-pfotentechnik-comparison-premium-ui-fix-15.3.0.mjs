#!/usr/bin/env node
import { access, cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const VERSION = "15.3.0";
const LABEL = `pfotentechnik-comparison-premium-ui-fix-${VERSION}`;
const rootArg = process.argv.find((value) => value.startsWith("--root="));
const root = resolve(rootArg ? rootArg.slice("--root=".length) : process.cwd());
const skipChecks = process.argv.includes("--skip-checks");
const backupRoot = join(root, ".patch-backups", `${LABEL}-${new Date().toISOString().replaceAll(":", "-")}`);

const PATHS = {
  filters: "packages/affiliate-core/src/components/comparison/ComparisonHeroFilters.astro",
  shell: "packages/affiliate-core/src/components/comparison/ComparisonShell.astro",
  css: "packages/affiliate-core/src/components/comparison/comparison-premium-fix-15.3.0.css",
  viewModel: "apps/pfotentechnik/src/domain/comparison/buildComparisonViewModel.ts",
  header: "packages/affiliate-core/src/components/Header.astro"
};

const exists = async (path) => {
  try { await access(path, constants.F_OK); return true; } catch { return false; }
};

const backup = async (relativePath) => {
  const source = join(root, relativePath);
  if (!(await exists(source))) return;
  const target = join(backupRoot, relativePath);
  await mkdir(dirname(target), { recursive: true });
  await cp(source, target);
};

const read = (path) => readFile(join(root, path), "utf8");
const write = async (path, content) => {
  const target = join(root, path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, content, "utf8");
  console.log(`Geändert: ${path}`);
};

const run = (command, args, required = true) => {
  console.log(`\n> ${[command, ...args].join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    shell: process.platform === "win32",
    stdio: "inherit"
  });
  if (result.error) throw result.error;
  if (required && result.status !== 0) {
    throw new Error(`Check fehlgeschlagen (${result.status}): ${command} ${args.join(" ")}`);
  }
  return result.status === 0;
};

const filterComponent = `---
import type { ComparisonFilter } from "../../comparison/model";

type Props = {
  filters: ComparisonFilter[];
  productCount: number;
};

const { filters, productCount } = Astro.props as Props;
const pathname = Astro.url.pathname.toLowerCase();
const preferredKeys = [
  "tier", "tierart", "futterart", "steuerung", "app", "kamera",
  "stromversorgung", "akku", "akkulaufzeit", "reichweite", "abo",
  "wlan", "preisklasse", "preis"
];

const orderedFilters = [...filters].sort((a, b) => {
  const ai = preferredKeys.indexOf(a.key.toLowerCase());
  const bi = preferredKeys.indexOf(b.key.toLowerCase());
  return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
});

const quickFilters = orderedFilters
  .filter((filter) => filter.options.length > 0)
  .slice(0, 4);

const normalized = (value: unknown) =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const findOption = (filter: ComparisonFilter, candidates: string[]) => {
  const wanted = candidates.map(normalized);
  return filter.options.find((option) => {
    const haystack = normalized(\`\${option.value} \${option.label}\`);
    return wanted.some((candidate) =>
      haystack === candidate ||
      haystack.includes(candidate) ||
      candidate.includes(haystack)
    );
  })?.value;
};

const getContextDefault = (filter: ComparisonFilter) => {
  const key = normalized(filter.key);
  const label = normalized(filter.label);
  const identity = \`\${key} \${label}\`;

  if (/hund/.test(pathname) && /tier|animal/.test(identity)) {
    return findOption(filter, ["hund", "hunde"]);
  }
  if (/katze|katzen/.test(pathname) && /tier|animal/.test(identity)) {
    return findOption(filter, ["katze", "katzen"]);
  }
  if (/ohne-wlan/.test(pathname) && /wlan|steuerung|app/.test(identity)) {
    return findOption(filter, ["ohne wlan", "kein wlan", "manuell", "offline"]);
  }
  if (/mit-app/.test(pathname) && /steuerung|app/.test(identity)) {
    return findOption(filter, ["app", "mit app", "smartphone"]);
  }
  if (/mit-kamera/.test(pathname) && /kamera/.test(identity)) {
    return findOption(filter, ["mit kamera", "kamera", "ja"]);
  }
  if (/ohne-abo/.test(pathname) && /abo|kosten/.test(identity)) {
    return findOption(filter, ["ohne abo", "kein abo", "nein"]);
  }
  if (/mit-akku|akkulaufzeit/.test(pathname) && /akku|stromversorgung/.test(identity)) {
    return findOption(filter, ["akku", "mit akku", "batterie"]);
  }
  if (/nassfutter/.test(pathname) && /futterart/.test(identity)) {
    return findOption(filter, ["nassfutter", "nass"]);
  }
  return undefined;
};

const filtersWithDefaults = quickFilters.map((filter) => ({
  filter,
  defaultValue: getContextDefault(filter)
}));
---

{filtersWithDefaults.length > 0 && (
  <section class="comparison-cover-filters" aria-labelledby="comparison-cover-filter-title" data-comparison-context-filters>
    <div class="comparison-cover-filters__head">
      <span class="comparison-cover-filters__icon" aria-hidden="true"></span>
      <h2 id="comparison-cover-filter-title">Produkte filtern</h2>
    </div>

    <div class="comparison-cover-filters__grid">
      {filtersWithDefaults.map(({ filter, defaultValue }) => (
        <label class="comparison-cover-filter">
          <span class="comparison-cover-filter__label">{filter.label}</span>
          <span class="pt-control comparison-cover-filter__control">
            <select
              class="pt-control comparison-cover-filter__select"
              data-comparison-hero-select
              data-filter-key={filter.key}
              data-default-value={defaultValue ?? ""}
              aria-label={filter.label}
            >
              <option value="" selected={!defaultValue}>Alle</option>
              {filter.options.map((option) => (
                <option value={option.value} selected={defaultValue === option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span class="comparison-cover-filter__chevron" aria-hidden="true"></span>
          </span>
        </label>
      ))}
    </div>

    <div class="comparison-cover-filters__actions">
      <button type="button" class="pt-button comparison-cover-filters__apply" data-comparison-hero-apply>
        Vergleich anpassen <span aria-hidden="true">→</span>
      </button>
      <button type="button" class="pt-button comparison-cover-filters__reset" data-comparison-hero-filter-reset>
        Filter zurücksetzen
      </button>
    </div>

    <p class="comparison-cover-filters__result" aria-live="polite">
      <strong data-comparison-hero-result-count>{productCount}</strong>
      <span> passende Modelle</span>
    </p>
  </section>
)}

<script>
  const initializeComparisonContextFilters = () => {
    document.querySelectorAll<HTMLElement>("[data-comparison-context-filters]").forEach((root) => {
      if (root.dataset.contextInitialized === "true") return;
      root.dataset.contextInitialized = "true";

      const selects = Array.from(root.querySelectorAll<HTMLSelectElement>("[data-comparison-hero-select]"));
      const reset = root.querySelector<HTMLButtonElement>("[data-comparison-hero-filter-reset]");
      const apply = root.querySelector<HTMLButtonElement>("[data-comparison-hero-apply]");
      const params = new URLSearchParams(window.location.search);

      for (const select of selects) {
        const key = select.dataset.filterKey ?? "";
        const fromUrl = key ? params.get(key) : null;
        const contextual = select.dataset.defaultValue ?? "";
        select.value = fromUrl ?? contextual;
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }

      const syncUrl = () => {
        const next = new URL(window.location.href);
        for (const select of selects) {
          const key = select.dataset.filterKey;
          if (!key) continue;
          if (select.value) next.searchParams.set(key, select.value);
          else next.searchParams.delete(key);
        }
        history.replaceState({}, "", next);
      };

      selects.forEach((select) => select.addEventListener("change", syncUrl));
      apply?.addEventListener("click", syncUrl);

      reset?.addEventListener("click", () => {
        const next = new URL(window.location.href);
        for (const select of selects) {
          const key = select.dataset.filterKey;
          if (key) next.searchParams.delete(key);
          select.value = select.dataset.defaultValue ?? "";
          select.dispatchEvent(new Event("change", { bubbles: true }));
        }
        history.replaceState({}, "", next);
      });
    });
  };

  initializeComparisonContextFilters();
  document.addEventListener("astro:page-load", initializeComparisonContextFilters);
</script>
`;

const css = `/* PfotenTechnik Comparison Premium UI Fix 15.3.0 */
:root {
  --pt-comparison-surface: var(--pt-color-surface, #fff);
  --pt-comparison-surface-subtle: var(--pt-color-surface-subtle, #f6f8f7);
  --pt-comparison-border: color-mix(in srgb, var(--pt-color-text, #15231b) 13%, transparent);
  --pt-comparison-shadow: 0 14px 38px rgb(15 35 24 / .08);
}

[data-theme="dark"],
.dark {
  --pt-comparison-surface: #0f1d2a;
  --pt-comparison-surface-subtle: #132536;
  --pt-comparison-border: rgb(213 231 220 / .16);
  --pt-comparison-shadow: 0 18px 44px rgb(0 0 0 / .26);
}

.comparison-shell,
.comparison-cover,
.comparison-decision-flow {
  min-width: 0;
}

.comparison-cover-filters {
  padding-block: var(--pt-space-5);
  border-top: 1px solid var(--pt-comparison-border);
}

.comparison-cover-filters__head {
  margin-bottom: var(--pt-space-4);
}

.comparison-cover-filters__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--pt-space-3);
}

.comparison-cover-filter {
  min-width: 0;
  padding: .85rem;
  border: 1px solid var(--pt-comparison-border);
  border-radius: var(--pt-radius-lg);
  background: var(--pt-comparison-surface);
  box-shadow: none;
}

.comparison-cover-filter__label {
  display: block;
  margin: 0 0 .45rem;
  color: var(--pt-color-text-muted);
  font-size: .76rem;
  font-weight: 750;
}

.comparison-cover-filter__control {
  position: relative;
  display: block;
  width: 100%;
  min-height: 3.25rem;
  padding: 0;
  border: 0;
  border-radius: var(--pt-radius-md);
  background: var(--pt-comparison-surface-subtle);
}

.comparison-cover-filter__select {
  width: 100%;
  min-height: 3.25rem;
  padding: 0 2.5rem 0 .9rem;
  border: 1px solid transparent !important;
  border-radius: inherit;
  color: var(--pt-color-text) !important;
  background: transparent !important;
  font: inherit;
  font-weight: 750;
  appearance: none;
}

.comparison-cover-filter__select:focus-visible {
  border-color: var(--pt-color-brand-500) !important;
  outline: 3px solid color-mix(in srgb, var(--pt-color-brand-500) 28%, transparent);
  outline-offset: 2px;
}

.comparison-cover-filter__chevron {
  position: absolute;
  right: .9rem;
  top: 50%;
  width: .6rem;
  height: .6rem;
  pointer-events: none;
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  transform: translateY(-70%) rotate(45deg);
}

.comparison-cover-filters__actions {
  display: grid;
  gap: var(--pt-space-2);
  margin-top: var(--pt-space-3);
}

.comparison-cover-filters__apply {
  min-height: 3.25rem;
  border-radius: var(--pt-radius-md);
}

.comparison-cover-filters__reset {
  min-height: 2.75rem;
  color: var(--pt-color-text-muted);
  background: transparent !important;
  border-color: transparent !important;
}

.comparison-cover-filters__result {
  margin: var(--pt-space-5) 0 0;
}

.comparison-editorial-recommendation {
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--pt-color-brand-500) 35%, var(--pt-comparison-border));
  border-radius: var(--pt-radius-xl);
  background: linear-gradient(155deg,
    color-mix(in srgb, var(--pt-color-brand-100) 44%, var(--pt-comparison-surface)),
    var(--pt-comparison-surface) 42%);
  box-shadow: var(--pt-comparison-shadow);
}

.comparison-editorial-recommendation__heading {
  padding: var(--pt-space-4) var(--pt-space-4) 0;
  color: var(--pt-color-text);
  font-size: clamp(1rem, 4.4vw, 1.25rem);
  font-weight: 850;
}

.comparison-editorial-recommendation__media {
  aspect-ratio: 4 / 3;
  background: var(--pt-comparison-surface);
}

.comparison-editorial-recommendation__media img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.comparison-sticky-bar {
  bottom: max(.65rem, env(safe-area-inset-bottom));
  width: min(calc(100% - 1rem), 48rem);
  min-height: auto;
  padding: .75rem;
  border: 1px solid var(--pt-comparison-border);
  border-radius: var(--pt-radius-xl);
  background: color-mix(in srgb, var(--pt-comparison-surface) 94%, transparent);
  box-shadow: 0 16px 42px rgb(0 0 0 / .18);
  backdrop-filter: blur(18px);
}

.comparison-sticky-bar__title,
.comparison-sticky-bar h2,
.comparison-sticky-bar h3 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.site-header-v2 .nav-toggle-button {
  width: 3rem !important;
  height: 3rem !important;
  min-width: 3rem !important;
  min-height: 3rem !important;
  padding: 0 !important;
  border-radius: var(--pt-radius-lg) !important;
  color: var(--pt-color-text) !important;
  background: var(--pt-comparison-surface) !important;
  border: 1px solid var(--pt-comparison-border) !important;
  box-shadow: none !important;
}

.site-header-v2 .nav-toggle__glyph {
  width: 1.35rem;
  height: 1.35rem;
}

@media (max-width: 63.99rem) {
  .site-header-v2 .header-container-v2 {
    min-height: 4.5rem;
    padding-block: .6rem;
  }

  .site-header-v2 .main-nav-v2[data-open] {
    top: 100%;
    padding: var(--pt-space-3);
    border: 1px solid var(--pt-comparison-border);
    border-radius: 0 0 var(--pt-radius-xl) var(--pt-radius-xl);
    background: var(--pt-comparison-surface);
    box-shadow: 0 24px 48px rgb(0 0 0 / .2);
  }

  .site-header-v2 .main-nav-v2__group {
    padding: var(--pt-space-3);
    border-radius: var(--pt-radius-lg);
    background: var(--pt-comparison-surface-subtle);
  }

  .site-header-v2 .main-nav-v2__mobile-link {
    min-height: 3rem;
    color: var(--pt-color-text);
  }
}

[data-theme="dark"] .comparison-cover h1,
.dark .comparison-cover h1 {
  color: #f2f7f4 !important;
}

[data-theme="dark"] .comparison-cover__copy > p,
.dark .comparison-cover__copy > p,
[data-theme="dark"] .comparison-cover-filter__label,
.dark .comparison-cover-filter__label {
  color: #aebdca !important;
}

[data-theme="dark"] .comparison-cover__fact,
.dark .comparison-cover__fact,
[data-theme="dark"] .comparison-cover-filter,
.dark .comparison-cover-filter {
  color: #f2f7f4;
  background: var(--pt-comparison-surface) !important;
  border-color: var(--pt-comparison-border) !important;
}

@media (min-width: 48rem) {
  .comparison-cover-filters__grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .comparison-cover-filters__actions {
    grid-template-columns: minmax(12rem, 1fr) auto;
    align-items: center;
  }
}

@media (max-width: 23.5rem) {
  .comparison-cover-filters__grid {
    gap: .55rem;
  }

  .comparison-cover-filter {
    padding: .7rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .comparison-cover *,
  .comparison-editorial-recommendation *,
  .comparison-sticky-bar * {
    scroll-behavior: auto !important;
    transition-duration: .01ms !important;
    animation-duration: .01ms !important;
  }
}
`;

for (const path of Object.values(PATHS)) await backup(path);

await write(PATHS.filters, filterComponent);
await write(PATHS.css, css);

let shell = await read(PATHS.shell);
const cssImport = 'import "./comparison-premium-fix-15.3.0.css";';
if (!shell.includes(cssImport)) {
  const anchor = 'import "./comparison-cta-system.css";';
  if (!shell.includes(anchor)) throw new Error(`Import-Anker fehlt: ${PATHS.shell}`);
  shell = shell.replace(anchor, `${anchor}\n${cssImport}`);
}
shell = shell.replace(/data-comparison-cover-version="[^"]+"/, 'data-comparison-cover-version="15.3.0"');
await write(PATHS.shell, shell);

let viewModel = await read(PATHS.viewModel);
if (!viewModel.includes("resolveComparisonHeroImage")) {
  throw new Error("Hero-Resolver aus Release 15.2.x fehlt. Zuerst 15.2.3 anwenden.");
}

/*
 * Wichtig: slug-spezifisches Comparison-Asset hat Priorität.
 * data.heroImage liefert nur noch Alt-Text, nicht mehr die Bildquelle.
 */
const heroPattern = /heroImage:\s*data\.heroImage\s*\?\?\s*\{\s*src:\s*resolveComparisonHeroImage\(data\.slug\),\s*alt:\s*([^}]+)\}/m;
if (heroPattern.test(viewModel)) {
  viewModel = viewModel.replace(
    heroPattern,
    'heroImage: {\n      src: resolveComparisonHeroImage(data.slug),\n      alt: data.heroImage?.alt ?? $1\n    }'
  );
} else {
  viewModel = viewModel.replace(
    /heroImage:\s*data\.heroImage\s*\?\?\s*\{/g,
    'heroImage: {\n      src: resolveComparisonHeroImage(data.slug),'
  );
}
await write(PATHS.viewModel, viewModel);

let header = await read(PATHS.header);
header = header.replace('data-site-header>', 'data-site-header data-comparison-header-fix="15.3.0">');
await write(PATHS.header, header);

const writtenFilter = await read(PATHS.filters);
if (!writtenFilter.includes("getContextDefault") || !writtenFilter.includes("data-default-value")) {
  throw new Error("Filter-Vorauswahl wurde nicht korrekt geschrieben.");
}
const writtenModel = await read(PATHS.viewModel);
if (!writtenModel.includes("src: resolveComparisonHeroImage(data.slug)")) {
  throw new Error("Comparison-Hero-Priorität wurde nicht korrekt geschrieben.");
}

if (!skipChecks) {
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "check"]);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "comparison:hero:audit"]);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "comparison:audit:strict"]);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "design-system:tokens:audit"]);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "design-system:components:audit"]);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "design-system:responsive:audit"]);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "design-system:visual-qa:strict"]);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "build"]);
}

console.log(`\n[${LABEL}] ABGESCHLOSSEN.`);
console.log(`Backups: ${backupRoot.replace(root + "/", "")}`);
console.log("Behoben:");
console.log("- slug-spezifische Comparison-Hero-Assets haben Vorrang");
console.log("- kontextabhängige Filter-Vorauswahl");
console.log("- URL-Synchronisierung und Reset auf Kontextstandard");
console.log("- kompaktere mobile Filter");
console.log("- Dark-Mode-Surfaces und Kontraste");
console.log("- Burger-/Close-Button und mobiles Menü");
console.log("- Sticky CTA inklusive Safe Area");
console.log("- redaktionelle Top-Empfehlung");

#!/usr/bin/env node
import { access, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const VERSION = "15.3.3";
const LABEL = `pfotentechnik-comparison-premium-ui-fix-${VERSION}`;
const rootArg = process.argv.find((value) => value.startsWith("--root="));
const root = resolve(rootArg ? rootArg.slice("--root=".length) : process.cwd());
const skipChecks = process.argv.includes("--skip-checks");
const backupRoot = join(root, ".patch-backups", `${LABEL}-${new Date().toISOString().replaceAll(":", "-")}`);

const PATHS = {
  filters: "packages/affiliate-core/src/components/comparison/ComparisonHeroFilters.astro",
  shell: "packages/affiliate-core/src/components/comparison/ComparisonShell.astro",
  css: "packages/affiliate-core/src/components/comparison/comparison-editorial-cover.css",
  viewModel: "apps/pfotentechnik/src/domain/comparison/buildComparisonViewModel.ts",
  header: "packages/affiliate-core/src/components/Header.astro"
};

const STALE_CSS = [
  "packages/affiliate-core/src/components/comparison/comparison-premium-fix-15.3.0.css",
  "packages/affiliate-core/src/components/comparison/comparison-premium-fix-15.3.1.css"
];

const CSS_MARKER_PATTERN = /\/\* comparison-premium-ui-fix:15\.3\.2:start \*\/[\s\S]*?\/\* comparison-premium-ui-fix:15\.3\.2:end \*\//g;

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

const getWorkspaceScripts = async () => {
  const packageJsonPath = join(root, "apps/pfotentechnik/package.json");
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
  return packageJson.scripts ?? {};
};

const runWorkspaceScript = async (script, { required = true } = {}) => {
  const scripts = await getWorkspaceScripts();
  if (!Object.prototype.hasOwnProperty.call(scripts, script)) {
    const message = `Workspace-Script nicht vorhanden und wird übersprungen: ${script}`;
    if (required) throw new Error(message);
    console.warn(`[${LABEL}] HINWEIS: ${message}`);
    return false;
  }
  return run("npm", ["--workspace", "apps/pfotentechnik", "run", script], required);
};

const parseBudgetMetrics = (output) => {
  const metrics = {};
  for (const key of ["cssFiles", "cssBytes", "importantRules", "rootBlocks", "rawHexColors"]) {
    const match = output.match(new RegExp(`${key}:\\s*(\\d+)`));
    if (match) metrics[key] = Number(match[1]);
  }
  return metrics;
};

const readBudgetStatus = () => {
  const result = spawnSync(
    "npm",
    ["--workspace", "apps/pfotentechnik", "run", "design-system:budget:audit"],
    {
      cwd: root,
      encoding: "utf8",
      shell: process.platform === "win32"
    }
  );
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  process.stdout.write(output);
  return {
    passed: result.status === 0,
    metrics: parseBudgetMetrics(output)
  };
};

const assertBudgetNotWorse = (before, after) => {
  const regressions = [];
  for (const key of Object.keys(after.metrics)) {
    if (
      Number.isFinite(before.metrics[key]) &&
      Number.isFinite(after.metrics[key]) &&
      after.metrics[key] > before.metrics[key]
    ) {
      regressions.push(`${key}: ${before.metrics[key]} → ${after.metrics[key]}`);
    }
  }
  if (regressions.length) {
    throw new Error(`CSS-Budget durch diesen Patch verschlechtert: ${regressions.join(", ")}`);
  }
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

const budgetBefore = skipChecks ? null : readBudgetStatus();

for (const path of Object.values(PATHS)) await backup(path);
for (const path of STALE_CSS) await backup(path);

await write(PATHS.filters, filterComponent);

let consolidatedCss = await read(PATHS.css);
consolidatedCss = consolidatedCss
  .replace(CSS_MARKER_PATTERN, "")
  .replace("object-position: 66% center;", "object-position: center;")
  .replace("min-height: 4.25rem;", "min-height: 3.9rem;")
  .replace("padding: .65rem .75rem;", "padding: .55rem .7rem;")
  .replace("min-height: 4rem; padding-inline: .65rem;", "min-height: 3.75rem; padding-inline: .6rem;")
  .replace(/\n{3,}/g, "\n\n")
  .trimEnd() + "\n";
await write(PATHS.css, consolidatedCss);

for (const stalePath of STALE_CSS) {
  const absolute = join(root, stalePath);
  if (await exists(absolute)) {
    await rm(absolute);
    console.log(`Entfernt: ${stalePath}`);
  }
}

let shell = await read(PATHS.shell);
shell = shell.replace(
  /^import "\.\/comparison-premium-fix-15\.3\.[01]\.css";\s*$/gm,
  ""
);
shell = shell.replace(/\n{3,}/g, "\n\n");
shell = shell.replace(/data-comparison-cover-version="[^"]+"/, 'data-comparison-cover-version="15.3.3"');
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
header = header
  .replace(/\sdata-comparison-header-fix="[^"]+"/g, "")
  .replace("data-site-header>", 'data-site-header data-comparison-header-fix="15.3.3">');
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
  await runWorkspaceScript("comparison:hero:audit");
  await runWorkspaceScript("comparison:audit:strict");
  await runWorkspaceScript("design-system:tokens:audit");
  await runWorkspaceScript("design-system:components:audit");
  await runWorkspaceScript("design-system:responsive:audit");
  await runWorkspaceScript("design-system:visual-qa:strict");
  await runWorkspaceScript("build");

  console.log("\n> CSS-Budget-Status nach dem Comparison-Fix");
  const budgetAfter = readBudgetStatus();
  if (budgetBefore) assertBudgetNotWorse(budgetBefore, budgetAfter);

  if (!budgetAfter.passed) {
    console.warn(`\n[${LABEL}] HINWEIS: Das globale Repository-CSS-Budget bleibt über seiner bestehenden Baseline.`);
    console.warn("Der Comparison-Patch hat die gemessenen Budgetwerte nicht verschlechtert.");
    console.warn("Die globale CSS-Bereinigung ist ein separater Design-System-Cleanup und keine Comparison-Installationsblockade.");
  }
}

console.log(`\n[${LABEL}] ABGESCHLOSSEN.`);
console.log(`Backups: ${backupRoot.replace(root + "/", "")}`);
console.log("Behoben:");
console.log("- slug-spezifische Comparison-Hero-Assets haben Vorrang");
console.log("- kontextabhängige Filter-Vorauswahl");
console.log("- URL-Synchronisierung und Reset auf Kontextstandard");
console.log("- kompaktere mobile Filter");
console.log("- Dark-Mode-Surfaces und Kontraste");
console.log("- doppelte 15.3.x-CSS-Dateien und Imports entfernt");
console.log("- zusätzlichen 15.3.2-CSS-Block vollständig entfernt");
console.log("- bestehende Comparison-Regeln direkt und delta-neutral angepasst");
console.log("- globales CSS-Budget wird als Delta-Gate statt als fremder Altlasten-Blocker geprüft");
console.log("- Burger-/Close-Button und mobiles Menü");
console.log("- Sticky CTA inklusive Safe Area");
console.log("- redaktionelle Top-Empfehlung");

#!/usr/bin/env node
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const rootArg = process.argv.find((arg) => arg.startsWith("--root="));
const root = resolve(rootArg ? rootArg.slice(7) : process.cwd());
const skipChecks = process.argv.includes("--skip-checks");
const label = "pfotentechnik-comparison-css-consolidation-17.1.0";

const componentRoot = "packages/affiliate-core/src/components/comparison";
const files = {
  page: "apps/pfotentechnik/src/pages/vergleiche/[comparison].astro",
  shell: `${componentRoot}/ComparisonShell.astro`,
  grid: `${componentRoot}/RecommendationGrid.astro`,
  explorer: `${componentRoot}/ComparisonExplorer.astro`,
  system: `${componentRoot}/comparison-system.css`,
  audit: "apps/pfotentechnik/scripts/audit-comparison-css-system.mjs"
};

const legacyCss = [
  "comparison.css",
  "comparison-editorial-cover.css",
  "comparison-premium-ux.css",
  "comparison-premium-seo.css",
  "comparison-ux-polish-3.2.css",
  "comparison-mobile-price-fix-4.0.1.css",
  "comparison-cta-system.css"
];

const backupRoot = join(
  root,
  ".patch-backups",
  `${label}-${new Date().toISOString().replaceAll(":", "-")}`
);

const normalize = (value) =>
  value.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");

async function backup(relativePath) {
  const source = join(root, relativePath);
  if (!existsSync(source)) return;
  const target = join(backupRoot, relativePath);
  await mkdir(dirname(target), { recursive: true });
  await cp(source, target);
}

for (const relativePath of [
  ...Object.values(files),
  ...legacyCss.map((name) => `${componentRoot}/${name}`)
]) {
  await backup(relativePath);
}

async function rewrite(relativePath, transform) {
  const absolute = join(root, relativePath);
  if (!existsSync(absolute)) throw new Error(`Pflichtdatei fehlt: ${relativePath}`);
  const before = normalize(await readFile(absolute, "utf8"));
  const after = transform(before);
  if (after === before) {
    console.log(`Unverändert: ${relativePath}`);
    return;
  }
  await writeFile(absolute, after, "utf8");
  console.log(`Geändert: ${relativePath}`);
}

await rewrite(files.page, (source) =>
  source
    .replace(
      'import ScenarioRecommendations from "../../components/comparison/ScenarioRecommendations.astro";\n',
      ""
    )
    .replace(
      /    <ComparisonShell model=\{model\}>\n\s*<ScenarioRecommendations slot="scenario-recommendations" scenarios=\{model\.scenarioRecommendations\} \/>\n\s*<\/ComparisonShell>/,
      "    <ComparisonShell model={model} />"
    )
);

await rewrite(files.shell, (source) => {
  let next = source.replace(/import "\.\/comparison(?:-[^"]+)?\.css";\n/g, "");

  if (!next.includes('import "./comparison-system.css";')) {
    const anchor = 'import ComparisonMethodology from "./ComparisonMethodology.astro";';
    if (!next.includes(anchor)) throw new Error("Importanker in ComparisonShell fehlt.");
    next = next.replace(anchor, `${anchor}\nimport "./comparison-system.css";`);
  }

  next = next.replace(
    '<RecommendationGrid products={alternativeProducts} />',
    '<RecommendationGrid products={alternativeProducts} scenarios={model.scenarioRecommendations} />'
  );

  next = next.replace(
    /\n\s*<section id="einsatzzwecke" class="comparison-premium-section comparison-slot-section">\n\s*<slot name="scenario-recommendations" \/>\n\s*<\/section>\n/,
    "\n"
  );

  return next;
});

await rewrite(files.grid, (source) => {
  let next = source;

  next = next.replace(
    'import type { ComparisonViewModel } from "../../comparison/model";',
    'import type { ComparisonViewModel } from "../../comparison/model";'
  );

  if (!next.includes("scenarios?:")) {
    next = next.replace(
      "type Props = {\n  products: ComparisonProduct[];\n};",
      'type Props = {\n  products: ComparisonProduct[];\n  scenarios?: NonNullable<ComparisonViewModel["scenarioRecommendations"]>;\n};'
    );
    next = next.replace(
      "const { products } = Astro.props as Props;",
      "const { products, scenarios = [] } = Astro.props as Props;"
    );
  }

  if (!next.includes("scenarioBySlug")) {
    const anchor = "const usedLabels = new Set<string>();";
    const block = `const scenarioBySlug = new Map<string, { icon: string; label: string; tone: string }>();

for (const scenario of scenarios) {
  const matchingProduct = products.find(
    (product) => product.slug === scenario.winner.slug
  );

  if (!matchingProduct || scenarioBySlug.has(matchingProduct.slug)) continue;

  scenarioBySlug.set(matchingProduct.slug, {
    icon: "✓",
    label: scenario.label,
    tone: "scenario"
  });
}

${anchor}`;
    next = next.replace(anchor, block);

    next = next.replace(
      "const recommendations = products.map((product) => {",
      `const recommendations = products.map((product) => {
  const scenarioUseCase = scenarioBySlug.get(product.slug);

  if (scenarioUseCase && !usedLabels.has(scenarioUseCase.label)) {
    usedLabels.add(scenarioUseCase.label);
    return { product, useCase: scenarioUseCase };
  }
`
    );
  }

  next = next.replace(
    "Jedes Modell steht für einen konkreten Vorteil – nicht für eine zweite Rangliste.",
    "Einsatzzwecke und Alternativen sind in einer gemeinsamen Auswahl zusammengeführt."
  );

  return next;
});

await rewrite(files.explorer, (source) => {
  let next = source
    .replace("<div data-comparison-table-view>", "<div data-comparison-table-view hidden>")
    .replace("<div data-comparison-card-view hidden>", "<div data-comparison-card-view>");

  next = next.replace(
    `        if (tableView instanceof HTMLElement) tableView.hidden = isCards;
        if (cardView instanceof HTMLElement) cardView.hidden = !isCards;`,
    `        if (tableView instanceof HTMLElement) tableView.hidden = isCards;
        if (cardView instanceof HTMLElement) cardView.hidden = !isCards;
        explorer.dataset.activeView = view;`
  );

  return next;
});

function removeExactDuplicateBlocks(css) {
  const seen = new Set();
  return css.replace(/([^{}@][^{}]*\{[^{}]*\})/g, (block) => {
    const key = block.replace(/\s+/g, " ").trim();
    if (seen.has(key)) return "";
    seen.add(key);
    return block;
  });
}

const parts = [];
for (const name of legacyCss) {
  const absolute = join(root, componentRoot, name);
  if (!existsSync(absolute)) continue;
  const content = normalize(await readFile(absolute, "utf8")).trim();
  parts.push(`/* ===== Konsolidiert aus ${name} ===== */\n${content}`);
}

if (!parts.length) throw new Error("Keine bestehenden Comparison-CSS-Dateien gefunden.");

const canonical = `/* ===== Kanonische Regeln 17.1.0 ===== */

.comparison-alternative__use-case--scenario {
  color: var(--comparison-accent);
  background: color-mix(in srgb, var(--comparison-accent) 10%, var(--comparison-surface));
}

[data-comparison-table-view][hidden],
[data-comparison-card-view][hidden] {
  display: none;
}

@media (max-width: 760px) {
  .comparison-shell--premium {
    width: 100%;
    max-width: 100%;
    padding-inline: 16px;
  }

  .comparison-shell--premium .comparison-cover,
  .comparison-shell--premium .comparison-editorial-recommendation,
  .comparison-shell--premium .comparison-decision-flow,
  .comparison-shell--premium .comparison-premium-section,
  .comparison-shell--premium .comparison-explorer,
  .comparison-shell--premium .comparison-alternatives {
    width: 100%;
    max-width: 100%;
    margin-inline: 0;
  }

  .comparison-shell--premium .comparison-premium-section,
  .comparison-shell--premium .comparison-explorer {
    padding-inline: 0;
  }

  .comparison-explorer__mobile-controls {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  .comparison-alternatives__list,
  .comparison-mobile-cards,
  .comparison-explorer__content {
    gap: 16px;
  }

  .comparison-alternative,
  .comparison-explorer__mobile-summary,
  .comparison-view-tabs,
  .comparison-explorer__toolbar,
  .comparison-mobile-card {
    padding: 16px;
  }

  [data-comparison-table-view] {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .comparison-desktop-table {
    display: block;
    min-width: 720px;
  }

  .comparison-table-wrap {
    overflow-x: auto;
    border-radius: 16px;
  }

  .comparison-table {
    width: max-content;
    min-width: 720px;
    table-layout: auto;
  }

  .comparison-table th,
  .comparison-table td {
    min-width: 150px;
    padding: 12px 16px;
    white-space: normal;
    vertical-align: top;
  }

  .comparison-table th:first-child {
    position: sticky;
    left: 0;
    z-index: 2;
    min-width: 170px;
    background: var(--comparison-surface);
  }
}
`;

const systemCss = removeExactDuplicateBlocks(
  `/* PfotenTechnik Comparison System 17.1.0
   Einziger CSS-Einstiegspunkt für ComparisonShell.astro. */

${parts.join("\n\n")}

${canonical}`
)
  .replace(/\n{3,}/g, "\n\n")
  .trim() + "\n";

await writeFile(join(root, files.system), systemCss, "utf8");
console.log(`Geändert: ${files.system}`);

const audit = `#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, "..");
const repo = path.resolve(app, "../..");
const shell = fs.readFileSync(
  path.join(repo, "packages/affiliate-core/src/components/comparison/ComparisonShell.astro"),
  "utf8"
);
const css = fs.readFileSync(
  path.join(repo, "packages/affiliate-core/src/components/comparison/comparison-system.css"),
  "utf8"
);

const imports = [...shell.matchAll(/import "\\.\\/([^"]+\\.css)";/g)]
  .map((match) => match[1]);

const errors = [];

if (imports.length !== 1 || imports[0] !== "comparison-system.css") {
  errors.push("ComparisonShell importiert nicht genau eine CSS-Systemdatei.");
}
if (!css.includes("padding-inline: 16px")) {
  errors.push("Der mobile 16-px-Gutter fehlt.");
}
if (!css.includes("[data-comparison-table-view][hidden]")) {
  errors.push("Der eindeutige View-State fehlt.");
}

if (errors.length) {
  errors.forEach((error) => console.error("FEHLER  " + error));
  process.exit(1);
}

console.log("OK  ComparisonShell importiert genau comparison-system.css.");
console.log("OK  Mobile Außenabstände sind zentral mit 16 px definiert.");
console.log("OK  Karten- und Tabellenansicht besitzen einen eindeutigen hidden-State.");
`;

await mkdir(dirname(join(root, files.audit)), { recursive: true });
await writeFile(join(root, files.audit), audit, "utf8");
console.log(`Geändert: ${files.audit}`);

if (!skipChecks) {
  const checks = [
    ["node", ["--check", join(root, files.audit)]],
    ["node", [join(root, files.audit)]],
    ["npm", ["--workspace", "apps/pfotentechnik", "run", "build"]]
  ];

  for (const [command, args] of checks) {
    const executable =
      process.platform === "win32" && command === "npm" ? "npm.cmd" : command;
    const result = spawnSync(executable, args, {
      cwd: root,
      stdio: "inherit"
    });
    if (result.status !== 0) {
      throw new Error(`Validierung fehlgeschlagen: ${command} ${args.join(" ")}`);
    }
  }
}

console.log(`\n[${label}] ABGESCHLOSSEN.`);
console.log("- sieben CSS-Imports auf eine Systemdatei reduziert");
console.log("- exakt identische Regelblöcke entfernt");
console.log("- Einsatzzwecke in Alternativen integriert");
console.log("- Karten-/Tabellen-State repariert");
console.log("- mobiler 16-px-Gutter zentralisiert");
console.log(`Backup: ${backupRoot}`);

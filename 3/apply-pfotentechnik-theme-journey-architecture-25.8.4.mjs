#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-theme-journey-architecture-25.8.4";
const CHECK_ONLY = process.argv.includes("--check");
const SKIP_BUILD = process.argv.includes("--skip-build");

function findRoot(start) {
  let current = path.resolve(start);

  for (let index = 0; index < 12; index += 1) {
    if (fs.existsSync(path.join(current, "apps", "pfotentechnik", "package.json"))) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  throw new Error("Repository-Wurzel nicht gefunden.");
}

const ROOT = findRoot(process.cwd());
const APP = path.join(ROOT, "apps", "pfotentechnik");
const CORE = path.join(ROOT, "packages", "affiliate-core");
const BACKUP = path.join(
  ROOT,
  ".patch-backups",
  `${NAME}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);
const REPORT = path.join(APP, "reports", "patches", `${NAME}-latest.json`);

const files = {
  tokens: path.join(APP, "src", "styles", "pfotentechnik-design-tokens.css"),
  primitives: path.join(APP, "src", "styles", "pfotentechnik-primitives.css"),
  projectLayout: path.join(APP, "src", "layouts", "ProjectLayout.astro"),
  obsoleteDarkContract: path.join(APP, "src", "styles", "pfotentechnik-dark-mode-contract.css"),
  theme: path.join(CORE, "src", "styles", "theme.css"),
  headerFooter: path.join(CORE, "src", "styles", "header-footer.css"),
  ui: path.join(CORE, "src", "styles", "ui.css"),
  header: path.join(CORE, "src", "components", "Header.astro"),
  home: path.join(CORE, "src", "components", "home", "home.css"),
  comparisonHub: path.join(APP, "src", "pages", "vergleiche", "index.astro"),
  recommendationLinks: path.join(APP, "src", "domain", "recommendationLinks.ts"),
  productPage: path.join(APP, "src", "pages", "produkt", "[product].astro"),
  relatedArticles: path.join(CORE, "src", "components", "RelatedArticles.astro"),
  decisionFacts: path.join(APP, "src", "components", "product-experience-2", "ProductDecisionFacts2.astro"),
  test: path.join(APP, "test", "theme-journey-architecture-25.8.3.test.mjs")
};

const originals = new Map();
const planned = new Map();
const deleted = new Set();

function relative(target) {
  return path.relative(ROOT, target).split(path.sep).join("/");
}

function read(target) {
  if (!fs.existsSync(target)) {
    throw new Error(`Datei nicht gefunden: ${relative(target)}`);
  }
  const content = fs.readFileSync(target, "utf8");
  if (!originals.has(target)) originals.set(target, content);
  return content;
}

function planWrite(target, content) {
  const previous = fs.existsSync(target) ? read(target) : "";
  if (previous === content) return;
  planned.set(target, content);
  deleted.delete(target);
}

function planDelete(target) {
  if (!fs.existsSync(target)) return;
  read(target);
  planned.delete(target);
  deleted.add(target);
}

function replaceRequired(source, search, replacement, label) {
  if (source.includes(replacement)) return source;
  if (!source.includes(search)) {
    throw new Error(`Erwarteter Stand fehlt: ${label}`);
  }
  return source.replace(search, replacement);
}

function replaceRegexRequired(source, pattern, replacement, label) {
  if (typeof replacement === "string" && source.includes(replacement)) return source;
  if (!pattern.test(source)) {
    throw new Error(`Erwarteter Stand fehlt: ${label}`);
  }
  pattern.lastIndex = 0;
  return source.replace(pattern, replacement);
}

function removeRequired(source, fragment, label) {
  if (!source.includes(fragment)) return source;
  return source.replace(fragment, "");
}

function upsertMarkedBlock(source, marker, block) {
  const start = `/* ${marker}:start */`;
  const end = `/* ${marker}:end */`;
  const rendered = `${start}\n${block.trim()}\n${end}`;

  if (source.includes(start) && source.includes(end)) {
    const pattern = new RegExp(
      `${start.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${end.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`
    );
    return source.replace(pattern, rendered);
  }

  return `${source.trimEnd()}\n\n${rendered}\n`;
}

function backup(target) {
  if (!fs.existsSync(target)) return;
  const destination = path.join(BACKUP, relative(target));
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(target, destination);
}

function writeReport(status, details = {}) {
  const report = {
    patch: NAME,
    status,
    generatedAt: new Date().toISOString(),
    checkOnly: CHECK_ONLY,
    skipBuild: SKIP_BUILD,
    changed: [...planned.keys()].map(relative),
    deleted: [...deleted].map(relative),
    backup: fs.existsSync(BACKUP) ? relative(BACKUP) : null,
    ...details
  };

  if (!CHECK_ONLY) {
    fs.mkdirSync(path.dirname(REPORT), { recursive: true });
    fs.writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);
  }

  return report;
}

function run(command, args, options = {}) {
  console.log(`[${NAME}] Prüfe: ${command} ${args.join(" ")}`);
  execFileSync(command, args, {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
    ...options
  });
}

/* -------------------------------------------------------------------------- */
/* 1. Central semantic token architecture                                     */
/* -------------------------------------------------------------------------- */

let tokens = read(files.tokens);

const semanticForegroundRoles = `
:root {
  --pt-color-accent-text: #1f5f35;
  --pt-color-link: var(--pt-color-accent-text);
}

[data-theme="dark"],
.dark {
  --pt-color-accent-text: #72e6a6;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --pt-color-accent-text: #72e6a6;
  }
}
`;

tokens = upsertMarkedBlock(
  tokens,
  "pfotentechnik-semantic-foreground-roles-25.8.3",
  semanticForegroundRoles
);

const stableSurfaceRoles = `
:root {
  --pt-color-text-inverse: #ffffff;
  --pt-color-text-inverse-muted: rgb(255 255 255 / 0.74);
  --pt-color-media-stage: #eef1ed;
  --pt-color-brand-surface: #102019;
  --pt-color-brand-surface-strong: #07120c;
  --pt-color-on-brand-surface: #ffffff;
  --pt-color-on-brand-surface-muted: rgb(255 255 255 / 0.72);
  --pt-color-on-brand-surface-accent: #86efac;
}
`;

const stablePattern = /\/\*\s*\n \* Stable foreground and media tokens\.[\s\S]*?:root\s*\{[\s\S]*?\n\}/;
if (stablePattern.test(tokens)) {
  tokens = tokens.replace(
    stablePattern,
    `/*\n * Stable foreground and media tokens.\n * These values describe luminance contracts and therefore do not flip with\n * the page theme.\n */\n${stableSurfaceRoles.trim()}`
  );
} else {
  tokens = upsertMarkedBlock(
    tokens,
    "pfotentechnik-stable-surface-roles-25.8.3",
    stableSurfaceRoles
  );
}

if (!tokens.includes("@media (prefers-color-scheme: dark)")) {
  throw new Error("Die zentrale System-Dark-Mode-Aktivierung fehlt.");
}

planWrite(files.tokens, tokens);

const themeCss = `:root {
  --primary: var(--pt-color-brand-600, #16a34a);
  --primary-dark: var(--pt-color-brand-700, #15803d);
  --primary-text: var(--pt-color-accent-text, #1f5f35);
  --primary-soft: var(--pt-color-brand-100, #dcfce7);

  --accent: var(--pt-color-warning-500, #f59e0b);
  --accent-soft: var(--pt-color-warning-soft, #fef3c7);

  --text: var(--pt-color-text, #14201a);
  --muted: var(--pt-color-text-muted, #647067);
  --text-inverse: var(--pt-color-text-inverse, #ffffff);
  --text-inverse-muted: var(--pt-color-text-inverse-muted, rgb(255 255 255 / 0.74));

  --border: var(--pt-color-border, rgba(20, 32, 26, 0.1));
  --border-strong: var(--pt-color-border-strong, rgba(20, 32, 26, 0.18));

  --page: var(--pt-color-page, #f5f8f6);
  --surface: var(--pt-color-surface, #ffffff);
  --surface-soft: var(--pt-color-surface-soft, #f0fdf4);
  --surface-raised: var(--pt-color-surface-raised, #ffffff);

  --shadow-soft: var(--pt-shadow-sm, 0 18px 55px rgba(20, 32, 26, 0.08));
  --shadow-strong: var(--pt-shadow-lg, 0 28px 80px rgba(20, 32, 26, 0.1));
}
`;

planWrite(files.theme, themeCss);

/* The old late-loaded override file is deliberately removed. */
let projectLayout = read(files.projectLayout);
projectLayout = removeRequired(
  projectLayout,
  'import "../styles/pfotentechnik-dark-mode-contract.css";\n',
  "veralteter Dark-Mode-Contract-Import"
);
planWrite(files.projectLayout, projectLayout);
planDelete(files.obsoleteDarkContract);

/* -------------------------------------------------------------------------- */
/* 2. Header and footer own their surface contracts                           */
/* -------------------------------------------------------------------------- */

let headerFooter = read(files.headerFooter);

headerFooter = headerFooter
  .replace(
    "border-bottom: 1px solid rgba(20, 32, 26, 0.08);",
    "border-bottom: 1px solid var(--border);"
  )
  .replace(
    "background: rgba(255, 255, 255, 0.9);",
    "background: color-mix(in srgb, var(--surface) 90%, transparent);"
  )
  .replace(
    "    #102019;",
    "    var(--pt-color-brand-surface, #102019);"
  )
  .replaceAll("color: white;", "color: var(--pt-color-on-brand-surface, #ffffff);")
  .replaceAll("color: #86efac;", "color: var(--pt-color-on-brand-surface-accent, #86efac);")
  .replaceAll(
    "color: rgba(255, 255, 255, 0.65);",
    "color: var(--pt-color-on-brand-surface-muted, rgb(255 255 255 / 0.72));"
  )
  .replaceAll(
    "color: rgba(255, 255, 255, 0.72);",
    "color: var(--pt-color-on-brand-surface-muted, rgb(255 255 255 / 0.72));"
  )
  .replaceAll(
    "color: rgba(255, 255, 255, 0.82);",
    "color: var(--pt-color-on-brand-surface, #ffffff);"
  )
  .replaceAll(
    "color: rgba(255, 255, 255, 0.55);",
    "color: var(--pt-color-on-brand-surface-muted, rgb(255 255 255 / 0.72));"
  )
  .replace(
    "border: 1px solid rgba(20, 32, 26, 0.08);",
    "border: 1px solid var(--border);"
  )
  .replace(
    "background: white;",
    "background: var(--surface);"
  );

headerFooter = upsertMarkedBlock(
  headerFooter,
  "header-footer-semantic-foregrounds-25.8.3",
  `
.site-header-v2 .brand-lockup,
.site-header-v2 .brand-name {
  color: var(--text);
}

.footer-v2,
.footer-v2 .footer-brand-lockup,
.footer-v2 .footer-brand-name {
  color: var(--pt-color-on-brand-surface, #ffffff);
}

.footer-v2 .footer-brand-v2 p,
.footer-v2 .footer-values,
.footer-v2 .footer-column-v2 a,
.footer-v2 .footer-bottom-v2 {
  color: var(--pt-color-on-brand-surface-muted, rgb(255 255 255 / 0.72));
}
`
);

planWrite(files.headerFooter, headerFooter);

let header = read(files.header);

header = replaceRequired(
  header,
  `    .site-header-v2 .main-nav-v2 {
      position: absolute;
      z-index: 110;`,
  `    .site-header-v2 .main-nav-v2 {
      position: absolute;
      z-index: 110;`,
  "mobile Navigation"
);

if (!header.includes("background: var(--pt-color-surface);") ||
    !header.includes(".site-header-v2 .nav-toggle-button")) {
  throw new Error("Semantische Button-Fläche im Header fehlt.");
}

header = replaceRequired(
  header,
  `      padding: var(--pt-space-2);
      border-radius: var(--pt-radius-xl);
      box-shadow: var(--pt-shadow-lg);`,
  `      padding: var(--pt-space-2);
      border: 1px solid var(--pt-color-border);
      border-radius: var(--pt-radius-xl);
      color: var(--pt-color-text);
      background: var(--pt-color-surface);
      box-shadow: var(--pt-shadow-lg);`,
  "mobile Navigationsfläche"
);

header = header.replace(
  /\n    html\[data-theme="dark"\] \.site-header-v2,[\s\S]*?box-shadow: none;\n    }\n/,
  "\n"
);

header = replaceRequired(
  header,
  `<style is:global>
  .site-header-v2 .header-container-v2 {`,
  `<style is:global>
  /* header-semantic-brand-foreground-25.8.3 */
  .site-header-v2 .brand-name {
    color: var(--pt-color-text);
  }

  .site-header-v2 .header-container-v2 {`,
  "Header Markenfarbe"
);

planWrite(files.header, header);

/* -------------------------------------------------------------------------- */
/* 3. Shared UI cards use semantic surfaces, never fixed light colors         */
/* -------------------------------------------------------------------------- */

let ui = read(files.ui);

ui = ui
  .replaceAll("background: white;", "background: var(--surface);")
  .replaceAll(
    "border: 1px solid rgba(20, 32, 26, 0.08);",
    "border: 1px solid var(--border);"
  )
  .replaceAll("color: var(--primary-dark);", "color: var(--primary-text);")
  .replace(
    "background: linear-gradient(135deg, white, rgba(240, 253, 244, 0.7));",
    `background: linear-gradient(
    135deg,
    var(--surface),
    color-mix(in srgb, var(--primary-soft) 70%, var(--surface))
  );`
  );

ui = upsertMarkedBlock(
  ui,
  "ui-semantic-card-foregrounds-25.8.3",
  `
.ui-section-header h2,
.ui-card h3,
.ui-comparison-card h3,
.ui-metric-card strong,
.ui-timeline-item h3,
.ui-callout h2,
.ui-accordion-item summary {
  color: var(--text);
}
`
);

planWrite(files.ui, ui);

/* -------------------------------------------------------------------------- */
/* 4. Homepage dark brand surfaces and normal cards are separate contracts    */
/* -------------------------------------------------------------------------- */

let home = read(files.home);

home = replaceRequired(
  home,
  `:root {
  --home3-text: var(--pt-color-text);
  --home3-muted: var(--pt-color-text-muted);
  --home3-accent: var(--pt-color-brand-500);
  --home3-dark: #0b2b26;
  --home3-line: var(--pt-color-border);
  --home3-soft: var(--pt-color-surface-soft);
  --home3-shadow: var(--pt-shadow-md);
}`,
  `.home3 {
  --home3-text: var(--pt-color-text);
  --home3-muted: var(--pt-color-text-muted);
  --home3-accent: var(--pt-color-brand-500);
  --home3-dark: #0b2b26;
  --home3-line: var(--pt-color-border);
  --home3-soft: var(--pt-color-surface-soft);
  --home3-shadow: var(--pt-shadow-md);
}`,
  "lokale Homepage-Tokens"
);

home = home.replace(
  "--home3-accent: var(--pt-color-brand-500);",
  "--home3-accent: var(--pt-color-accent-text);"
);

home = replaceRequired(
  home,
  `.home3-category-card h3 {
  margin: 0.45rem 0;
  font-size: clamp(1.6rem, 3vw, 2.6rem);
}`,
  `.home3-category-card h3 {
  margin: 0.45rem 0;
  color: var(--pt-color-text-inverse);
  font-size: clamp(1.6rem, 3vw, 2.6rem);
}`,
  "Kategorie-Kartenüberschrift"
);

home = replaceRequired(
  home,
  `.home3-method__intro h2 {
  max-width: 15ch;
  margin: 0.6rem 0 1rem;`,
  `.home3-method__intro h2 {
  max-width: 15ch;
  margin: 0.6rem 0 1rem;
  color: var(--pt-color-text-inverse);`,
  "Methodik-Überschrift"
);

home = replaceRequired(
  home,
  `.home3-method li h3,
.home3-method li p {
  margin: 0;
}`,
  `.home3-method li h3,
.home3-method li p {
  margin: 0;
}

.home3-method li h3 {
  color: var(--pt-color-text-inverse);
}`,
  "Methodik-Kartenüberschrift"
);

planWrite(files.home, home);

/* -------------------------------------------------------------------------- */
/* 5. Comparison overview owns scoped semantic variables                     */
/* -------------------------------------------------------------------------- */

let comparisonHub = read(files.comparisonHub);

const variableMap = [
  ["--accent-dark", "--comparison-accent-strong"],
  ["--surface-soft", "--comparison-surface-soft"],
  ["--accent", "--comparison-accent"],
  ["--text", "--comparison-text"],
  ["--muted", "--comparison-muted"],
  ["--border", "--comparison-border"],
  ["--surface", "--comparison-surface"]
];

for (const [from, to] of variableMap) {
  comparisonHub = comparisonHub.replaceAll(from, to);
}

comparisonHub = replaceRequired(
  comparisonHub,
  `    --comparison-surface: var(--pt-color-surface);
    --comparison-surface-soft: var(--pt-color-surface-soft);
    box-sizing: border-box;`,
  `    --comparison-surface: var(--pt-color-surface);
    --comparison-surface-soft: var(--pt-color-surface-soft);
    box-sizing: border-box;
    color: var(--comparison-text);`,
  "Vergleichsübersicht Grundfarbe"
);

comparisonHub = comparisonHub.replace(
  "--comparison-accent: var(--pt-color-brand-500);",
  "--comparison-accent: var(--pt-color-accent-text);"
);

planWrite(files.comparisonHub, comparisonHub);

/* -------------------------------------------------------------------------- */
/* 6. Category-safe recommendations                                           */
/* -------------------------------------------------------------------------- */

let recommendationLinks = read(files.recommendationLinks);

recommendationLinks = replaceRequired(
  recommendationLinks,
  `type Context = {
  animal?: "dog" | "cat";
  petSize?: "small" | "medium" | "large";
  topics: Set<LinkTopic>;`,
  `type RecommendationFamily =
  | "futterautomaten"
  | "trinkbrunnen"
  | "gps-tracker"
  | "katzenklappen"
  | "haustierkameras";

type Context = {
  animal?: "dog" | "cat";
  petSize?: "small" | "medium" | "large";
  family?: RecommendationFamily;
  topics: Set<LinkTopic>;`,
  "Recommendation Context"
);

const familyDetection = `
const FAMILY_PATTERNS: Array<[RecommendationFamily, RegExp]> = [
  ["trinkbrunnen", /\\b(trinkbrunnen|wasserbrunnen|pet fountain|drinking fountain|fountain)\\b/],
  ["futterautomaten", /\\b(futterautomat|futterautomaten|futterspender|automatic feeder|pet feeder|feeder)\\b/],
  ["gps-tracker", /\\b(gps tracker|gps-tracker|haustiertracker|ortungstracker|tracking halsband)\\b/],
  ["katzenklappen", /\\b(katzenklappe|katzenklappen|mikrochipklappe|cat flap)\\b/],
  ["haustierkameras", /\\b(haustierkamera|tierkamera|pet camera|kamera fuer haustiere)\\b/]
];

const detectRecommendationFamily = (
  data: Record<string, any>,
  topics: LinkTopic[],
  normalizedText: string
): RecommendationFamily | undefined => {
  const topicFamily = topics.find((topic): topic is RecommendationFamily =>
    ["futterautomaten", "trinkbrunnen", "gps-tracker", "katzenklappen", "haustierkameras"].includes(topic)
  );
  if (topicFamily) return topicFamily;

  const category = normalize([
    typeof data.category === "string" ? data.category : data.category?.key,
    typeof data.category === "object" ? data.category?.label : "",
    data.contentPlatform?.cluster,
    ...asArray(data.hub?.sections)
  ].filter(Boolean).join(" "));

  for (const [family, pattern] of FAMILY_PATTERNS) {
    if (pattern.test(category)) return family;
  }

  for (const [family, pattern] of FAMILY_PATTERNS) {
    if (pattern.test(normalizedText)) return family;
  }

  return undefined;
};
`;

recommendationLinks = replaceRequired(
  recommendationLinks,
  `export const detectRecommendationTopics = (data: Record<string, any>) =>
  detectLinkTopics(collectValues(data));

const buildContext`,
  `export const detectRecommendationTopics = (data: Record<string, any>) =>
  detectLinkTopics(collectValues(data));

${familyDetection.trim()}

const buildContext`,
  "Kategorie-Familienerkennung"
);

recommendationLinks = replaceRequired(
  recommendationLinks,
  `const buildContext = (data: Record<string, any>): Context => {
  const text = collectText(data);
  return {
    animal: detectAnimal(data, text),
    petSize: detectPetSize(data, text),
    topics: new Set(detectRecommendationTopics(data)),`,
  `const buildContext = (data: Record<string, any>): Context => {
  const text = collectText(data);
  const topics = detectRecommendationTopics(data);
  return {
    animal: detectAnimal(data, text),
    petSize: detectPetSize(data, text),
    family: detectRecommendationFamily(data, topics, text),
    topics: new Set(topics),`,
  "Context-Familie"
);

recommendationLinks = replaceRequired(
  recommendationLinks,
  `const hasCompatibleRecommendationTopic = (source: Context, candidate: Context) => {
  if (source.topics.size === 0 || candidate.topics.size === 0) return true;
  return overlapCount(source.topics, candidate.topics) > 0;
};`,
  `const hasCompatibleRecommendationTopic = (source: Context, candidate: Context) => {
  if (source.family && candidate.family && source.family !== candidate.family) {
    return false;
  }
  if (source.topics.size === 0 || candidate.topics.size === 0) {
    return !source.family || !candidate.family || source.family === candidate.family;
  }
  return overlapCount(source.topics, candidate.topics) > 0;
};`,
  "harte Kategorie-Kompatibilität"
);

planWrite(files.recommendationLinks, recommendationLinks);

/* -------------------------------------------------------------------------- */
/* 7. Product-page continuation hierarchy                                     */
/* -------------------------------------------------------------------------- */

let relatedArticles = read(files.relatedArticles);

relatedArticles = replaceRequired(
  relatedArticles,
  `interface Props {
  items: RelatedItem[];
}

const { items = [] } = Astro.props as Partial<Props>;`,
  `interface Props {
  items: RelatedItem[];
  eyebrow?: string;
  title?: string;
}

const {
  items = [],
  eyebrow = "Weiterführende Inhalte",
  title = "Das könnte dich auch interessieren"
} = Astro.props as Partial<Props>;`,
  "RelatedArticles Props"
);

relatedArticles = replaceRequired(
  relatedArticles,
  `<Section
    eyebrow="Weiterführende Inhalte"
    title="Das könnte dich auch interessieren"
  >`,
  `<Section
    eyebrow={eyebrow}
    title={title}
  >`,
  "RelatedArticles Überschriften"
);

planWrite(files.relatedArticles, relatedArticles);

let productPage = read(files.productPage);

productPage = removeRequired(
  productPage,
  'import DecisionJourney from "../../components/DecisionJourney.astro";\n',
  "DecisionJourney Import"
);

productPage = removeRequired(
  productPage,
  'import { findJourneyEntry, toJourneyEntries } from "../../domain/decisionJourney/adapters";\n',
  "DecisionJourney Adapter Import"
);

productPage = removeRequired(
  productPage,
  `const journeyEntries = toJourneyEntries({ pages, comparisons, products: allProducts });
const currentJourneyEntry = findJourneyEntry(journeyEntries, "product", contentProduct.slug);

`,
  "DecisionJourney Vorbereitung"
);

productPage = replaceRequired(
  productPage,
  `const relatedItems = relatedEntries.map((entry) => ({
  href: entry.href,
  label: entry.type === "product"
    ? "Produkt"
    : entry.type === "manufacturer"
      ? "Hersteller"
      : entry.type === "comparison"
        ? "Vergleich"
        : "Ratgeber",
  title: entry.hubTitle,
  text: entry.hubDescription
}));`,
  `const relatedItems = relatedEntries
  .filter((entry) => entry.type !== "product" && entry.type !== "comparison")
  .map((entry) => ({
    href: entry.href,
    label: entry.type === "manufacturer" ? "Hersteller" : "Ratgeber",
    title: entry.hubTitle,
    text: entry.hubDescription
  }))
  .slice(0, 3);`,
  "ergänzende Inhalte statt doppelter Produktempfehlungen"
);

productPage = removeRequired(
  productPage,
  `    <DecisionJourney current={currentJourneyEntry} entries={journeyEntries} />

`,
  "doppelte DecisionJourney-Ausgabe"
);

productPage = replaceRequired(
  productPage,
  `<RelatedArticles items={relatedItems} />`,
  `<RelatedArticles
  items={relatedItems}
  eyebrow="Ratgeber und Hintergründe"
  title="Passend zum Produkt weiterlesen"
/>`,
  "redaktionelle Folgeinhalte"
);

planWrite(files.productPage, productPage);

/* -------------------------------------------------------------------------- */
/* 8. General sentence casing at the presentation boundary                    */
/* -------------------------------------------------------------------------- */

let decisionFacts = read(files.decisionFacts);

decisionFacts = replaceRequired(
  decisionFacts,
  `const { facts = [] } = Astro.props;
---`,
  `const { facts = [] } = Astro.props;

const sentenceCase = (value: string) => {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "";

  const firstWord = trimmed.match(/^[„"'([{]*([^\\s,;:]+)/u)?.[1] ?? "";
  if (/^\\p{Ll}.*\\p{Lu}/u.test(firstWord)) return trimmed;

  return trimmed.replace(
    /^([„"'([{]*)(\\p{Ll})/u,
    (_match, prefix: string, letter: string) =>
      \`\${prefix}\${letter.toLocaleUpperCase("de-DE")}\`
  );
};
---`,
  "allgemeine Satzgroßschreibung"
);

decisionFacts = replaceRequired(
  decisionFacts,
  `<strong>{fact.value}</strong>`,
  `<strong>{sentenceCase(fact.value)}</strong>`,
  "Decision-Fact-Wert"
);

planWrite(files.decisionFacts, decisionFacts);

/* -------------------------------------------------------------------------- */
/* 9. Regression test                                                         */
/* -------------------------------------------------------------------------- */

const testSource = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = path.resolve(app, "../..");
const core = path.join(root, "packages", "affiliate-core");
const read = (target) => fs.readFileSync(target, "utf8");

test("core theme aliases resolve through project semantic tokens", () => {
  const source = read(path.join(core, "src/styles/theme.css"));
  assert.match(source, /--text:\\s*var\\(--pt-color-text/);
  assert.match(source, /--surface:\\s*var\\(--pt-color-surface/);
  assert.match(source, /--primary-text:\\s*var\\(--pt-color-accent-text/);
  assert.doesNotMatch(source, /--text:\\s*#[0-9a-f]{3,8}/i);
});

test("dark mode is token-driven without a late override stylesheet", () => {
  const layout = read(path.join(app, "src/layouts/ProjectLayout.astro"));
  const tokens = read(path.join(app, "src/styles/pfotentechnik-design-tokens.css"));
  assert.doesNotMatch(layout, /pfotentechnik-dark-mode-contract\\.css/);
  assert.match(tokens, /prefers-color-scheme:\\s*dark/);
  assert.match(tokens, /--pt-color-accent-text:\\s*#72e6a6/);
  assert.match(tokens, /--pt-color-brand-surface:/);
});

test("shared cards and header surfaces use semantic colors", () => {
  const ui = read(path.join(core, "src/styles/ui.css"));
  const chrome = read(path.join(core, "src/styles/header-footer.css"));
  assert.doesNotMatch(ui, /background:\\s*white;/);
  assert.match(ui, /background:\\s*var\\(--surface\\)/);
  assert.match(chrome, /var\\(--pt-color-brand-surface/);
  assert.match(chrome, /\\.site-header-v2 \\.brand-name/);
});

test("homepage and comparison headings own the correct foreground", () => {
  const home = read(path.join(core, "src/components/home/home.css"));
  const comparison = read(path.join(app, "src/pages/vergleiche/index.astro"));
  assert.match(home, /\\.home3\\s*\\{[\\s\\S]*?--home3-text:/);\n  assert.doesNotMatch(home, /:root\\s*\\{[\\s\\S]*?--home3-text:/);
  assert.match(home, /\\.home3-category-card h3[\\s\\S]*?color:\\s*var\\(--pt-color-text-inverse\\)/);
  assert.match(home, /\\.home3-method li h3[\\s\\S]*?color:\\s*var\\(--pt-color-text-inverse\\)/);
  assert.match(comparison, /--comparison-text:\\s*var\\(--pt-color-text\\)/);
  assert.match(comparison, /color:\\s*var\\(--comparison-text\\)/);
  assert.doesNotMatch(comparison, /--text:/);
});

test("recommendations reject cross-category candidates", () => {
  const source = read(path.join(app, "src/domain/recommendationLinks.ts"));
  assert.match(source, /type RecommendationFamily/);
  assert.match(source, /source\\.family && candidate\\.family && source\\.family !== candidate\\.family/);
  assert.match(source, /\\["trinkbrunnen",/);
  assert.match(source, /\\["futterautomaten",/);
});

test("product pages have one primary continuation and complementary reading", () => {
  const product = read(path.join(app, "src/pages/produkt/[product].astro"));
  assert.doesNotMatch(product, /<DecisionJourney/);
  assert.doesNotMatch(product, /import DecisionJourney/);
  assert.match(product, /entry\\.type !== "product" && entry\\.type !== "comparison"/);
  assert.match(product, /title="Passend zum Produkt weiterlesen"/);
});

test("technical values receive sentence casing at rendering time", () => {
  const source = read(path.join(app, "src/components/product-experience-2/ProductDecisionFacts2.astro"));
  assert.match(source, /const sentenceCase/);
  assert.match(source, /sentenceCase\\(fact\\.value\\)/);
});
`;

planWrite(files.test, testSource);

/* -------------------------------------------------------------------------- */
/* Check / apply / rollback                                                    */
/* -------------------------------------------------------------------------- */

const changed = [...planned.keys()];
const removals = [...deleted];

if (changed.length === 0 && removals.length === 0) {
  console.log(`[${NAME}] Bereits vollständig angewendet.`);
  process.exit(0);
}

console.log(`[${NAME}] Geplante Änderungen:`);
for (const target of changed) console.log(`  schreiben: ${relative(target)}`);
for (const target of removals) console.log(`  entfernen: ${relative(target)}`);

if (CHECK_ONLY) {
  console.log(`[${NAME}] Vorprüfung erfolgreich. Keine Datei wurde verändert.`);
  process.exit(0);
}

for (const target of new Set([...changed, ...removals])) backup(target);

try {
  for (const [target, content] of planned) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
    console.log(`[${NAME}] Geschrieben: ${relative(target)}`);
  }

  for (const target of deleted) {
    if (fs.existsSync(target)) {
      fs.rmSync(target);
      console.log(`[${NAME}] Entfernt: ${relative(target)}`);
    }
  }

  run(process.execPath, ["--test", relative(files.test)]);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "design-system:tokens:audit"]);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "design-system:components:audit"]);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "test:product-experience-2"]);

  if (!SKIP_BUILD) {
    run("npm", ["--workspace", "apps/pfotentechnik", "run", "build"]);
  }

  writeReport("passed", {
    validation: [
      "theme-journey-architecture-25.8.3.test.mjs",
      "design-system:tokens:audit",
      "design-system:components:audit",
      "test:product-experience-2",
      ...(SKIP_BUILD ? [] : ["build"])
    ]
  });

  console.log(`[${NAME}] Fertig.`);
} catch (error) {
  console.error(`[${NAME}] Validierung fehlgeschlagen. Änderungen werden zurückgerollt.`);

  for (const target of new Set([...changed, ...removals])) {
    const backupFile = path.join(BACKUP, relative(target));
    if (fs.existsSync(backupFile)) {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(backupFile, target);
    } else if (!originals.has(target) && fs.existsSync(target)) {
      fs.rmSync(target);
    }
  }

  writeReport("failed", {
    error: error instanceof Error ? error.message : String(error)
  });

  throw error;
}

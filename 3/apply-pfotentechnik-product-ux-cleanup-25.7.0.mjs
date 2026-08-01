#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-product-ux-cleanup-25.7.0";

function findRoot(start) {
  let dir = path.resolve(start);
  for (let index = 0; index < 12; index += 1) {
    if (fs.existsSync(path.join(dir, "apps", "pfotentechnik", "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}

const ROOT = findRoot(process.cwd());
const APP = path.join(ROOT, "apps", "pfotentechnik");
const BACKUP = path.join(ROOT, ".patch-backups", NAME + "-" + new Date().toISOString().replace(/[:.]/g, "-"));
const files = {"apps/pfotentechnik/src/components/product-experience-2/ProductEvidence2.astro": "---\ninterface EvidenceItem {\n  label: string;\n  detail?: string;\n}\n\ninterface EvidenceSummary {\n  items: EvidenceItem[];\n  handsOn?: {\n    date?: string;\n    duration?: string;\n    scope?: string[];\n  } | null;\n}\n\ninterface Props {\n  evidence?: EvidenceSummary;\n  updatedAt?: string;\n}\n\nconst { evidence, updatedAt } = Astro.props;\nconst items = evidence?.items ?? [];\nconst formattedDate = updatedAt\n  ? new Intl.DateTimeFormat(\"de-DE\", { dateStyle: \"medium\" }).format(new Date(updatedAt))\n  : null;\nconst show = items.length > 0 || evidence?.handsOn;\nconst iconFor = (label: string) => {\n  const value = label.toLocaleLowerCase(\"de-DE\");\n  if (value.includes(\"hersteller\")) return \"D\";\n  if (value.includes(\"spezifikation\") || value.includes(\"technisch\")) return \"T\";\n  if (value.includes(\"vergleich\")) return \"V\";\n  return \"Q\";\n};\n---\n\n{show && (\n  <section class=\"evidence\" aria-labelledby=\"evidence-title\">\n    <header>\n      <span>Unsere Quellen</span>\n      <h2 id=\"evidence-title\">So ist die Einordnung belegt</h2>\n      {formattedDate && <p>Zuletzt inhaltlich geprüft: {formattedDate}</p>}\n    </header>\n\n    <ul class=\"evidence__items\">\n      {items.map((item) => (\n        <li>\n          <span class=\"evidence__icon\" aria-hidden=\"true\">{iconFor(item.label)}</span>\n          <div>\n            <strong>{item.label}</strong>\n            {item.detail && <small>{item.detail}</small>}\n          </div>\n        </li>\n      ))}\n    </ul>\n\n    {evidence?.handsOn && (\n      <aside class=\"evidence__hands-on\">\n        <strong>Eigener Praxistest durchgeführt</strong>\n        {evidence.handsOn.duration && <span>Testdauer: {evidence.handsOn.duration}</span>}\n        {evidence.handsOn.scope?.length > 0 && <span>{evidence.handsOn.scope.join(\" · \")}</span>}\n      </aside>\n    )}\n  </section>\n)}\n\n<style>\n  .evidence {\n    display: grid;\n    gap: 14px;\n    padding: 16px;\n    border: 1px solid var(--px2-border);\n    border-radius: 18px;\n    background: var(--px2-surface-soft);\n  }\n\n  .evidence header > span {\n    color: var(--px2-green-strong);\n    font-size: .72rem;\n    font-weight: 850;\n    letter-spacing: .07em;\n    text-transform: uppercase;\n  }\n\n  .evidence h2 {\n    margin: 4px 0 3px;\n    font-size: clamp(1.25rem, 5vw, 1.7rem);\n    letter-spacing: -.02em;\n  }\n\n  .evidence header p {\n    margin: 0;\n    color: var(--px2-muted);\n    font-size: .82rem;\n  }\n\n  .evidence__items {\n    display: flex;\n    flex-wrap: wrap;\n    gap: 8px;\n    margin: 0;\n    padding: 0;\n    list-style: none;\n  }\n\n  .evidence__items li {\n    display: grid;\n    grid-template-columns: 1.8rem minmax(0, 1fr);\n    gap: 8px;\n    align-items: center;\n    min-width: min(100%, 13rem);\n    padding: 9px 11px;\n    border: 1px solid var(--px2-border);\n    border-radius: 12px;\n    background: var(--px2-surface);\n  }\n\n  .evidence__icon {\n    display: grid;\n    width: 1.75rem;\n    height: 1.75rem;\n    place-items: center;\n    border-radius: 9px;\n    background: var(--px2-green-soft);\n    color: var(--px2-green-strong);\n    font-size: .72rem;\n    font-weight: 900;\n  }\n\n  .evidence__items div {\n    display: grid;\n    gap: 1px;\n    min-width: 0;\n  }\n\n  .evidence__items strong {\n    font-size: .86rem;\n  }\n\n  .evidence__items small {\n    color: var(--px2-muted);\n    line-height: 1.35;\n  }\n\n  .evidence__hands-on {\n    display: grid;\n    gap: 3px;\n    padding: 11px 12px;\n    border-radius: 12px;\n    background: var(--px2-green-soft);\n  }\n\n  .evidence__hands-on span {\n    color: var(--px2-muted);\n    font-size: .82rem;\n  }\n\n  @media (min-width: 720px) {\n    .evidence {\n      grid-template-columns: minmax(210px, .65fr) minmax(0, 1.35fr);\n      padding: 20px;\n      align-items: center;\n    }\n\n    .evidence__hands-on {\n      grid-column: 1 / -1;\n    }\n  }\n</style>\n", "apps/pfotentechnik/src/components/product-experience-2/ProductDecisionFacts2.astro": "---\ninterface DecisionFact {\n  label: string;\n  value: string;\n  consequence: string;\n  source: \"product-data\" | \"technical-specification\" | \"editorial\";\n}\n\ninterface Props {\n  facts?: DecisionFact[];\n}\n\nconst { facts = [] } = Astro.props;\n---\n\n{facts.length > 0 && (\n  <section class=\"decision-facts\" aria-labelledby=\"decision-facts-title\">\n    <header>\n      <span>Eigenschaft und Konsequenz</span>\n      <h2 id=\"decision-facts-title\">Was die Daten wirklich bedeuten</h2>\n    </header>\n\n    <dl>\n      {facts.map((fact) => (\n        <div>\n          <dt>\n            <span>{fact.label}</span>\n            <strong>{fact.value}</strong>\n          </dt>\n          <dd>\n            <span aria-hidden=\"true\">→</span>\n            <p>{fact.consequence}</p>\n          </dd>\n        </div>\n      ))}\n    </dl>\n  </section>\n)}\n\n<style>\n  .decision-facts {\n    display: grid;\n    gap: 16px;\n    padding: 16px;\n    border: 1px solid var(--px2-border);\n    border-radius: 20px;\n    background: var(--px2-surface);\n  }\n\n  .decision-facts header > span {\n    color: var(--px2-green-strong);\n    font-size: .72rem;\n    font-weight: 850;\n    letter-spacing: .07em;\n    text-transform: uppercase;\n  }\n\n  .decision-facts h2 {\n    margin: 4px 0 0;\n    font-size: clamp(1.35rem, 5.5vw, 1.9rem);\n    letter-spacing: -.025em;\n  }\n\n  .decision-facts dl {\n    display: grid;\n    gap: 10px;\n    margin: 0;\n  }\n\n  .decision-facts dl > div {\n    display: grid;\n    gap: 10px;\n    min-width: 0;\n    padding: 15px;\n    border: 1px solid var(--px2-border);\n    border-radius: 15px;\n    background: var(--px2-surface-raised);\n  }\n\n  .decision-facts dt {\n    display: grid;\n    gap: 3px;\n    min-width: 0;\n  }\n\n  .decision-facts dt span {\n    color: var(--px2-muted);\n    font-size: .7rem;\n    font-weight: 850;\n    letter-spacing: .055em;\n    text-transform: uppercase;\n  }\n\n  .decision-facts dt strong {\n    color: var(--px2-text);\n    font-size: clamp(1.05rem, 4.5vw, 1.3rem);\n    line-height: 1.25;\n    overflow-wrap: anywhere;\n  }\n\n  .decision-facts dd {\n    display: grid;\n    grid-template-columns: 1.2rem minmax(0, 1fr);\n    gap: 7px;\n    margin: 0;\n    color: var(--px2-muted);\n    font-size: .89rem;\n    line-height: 1.5;\n  }\n\n  .decision-facts dd > span {\n    color: var(--px2-green-strong);\n    font-weight: 900;\n  }\n\n  .decision-facts dd p {\n    margin: 0;\n  }\n\n  @media (min-width: 720px) {\n    .decision-facts {\n      padding: 22px;\n    }\n\n    .decision-facts dl {\n      grid-template-columns: 1fr 1fr;\n    }\n  }\n\n  @media (min-width: 1040px) {\n    .decision-facts dl {\n      grid-template-columns: repeat(3, minmax(0, 1fr));\n    }\n  }\n</style>\n", "apps/pfotentechnik/src/components/product-experience-2/ProductDetails2.astro": "---\nimport type { ProductExperienceModel } from \"../../domain/productExperience/model\";\nimport { uniqueTextItems } from \"../../domain/productExperience/contentLists\";\n\ninterface Props {\n  model: ProductExperienceModel;\n}\n\nconst { model } = Astro.props;\nconst pros = uniqueTextItems(model.pros, { exclude: model.cons, limit: 6 });\nconst cons = uniqueTextItems(model.cons, { exclude: model.notFor, limit: 6 });\n---\n\n<section class=\"details\" aria-label=\"Produktdetails\">\n  {(pros.length > 0 || cons.length > 0) && (\n    <section class=\"details__proscons\" aria-label=\"Belegte Stärken und Schwächen\">\n      {pros.length > 0 && (\n        <div class=\"details__column details__column--positive\">\n          <span class=\"details__eyebrow\">Dafür spricht es</span>\n          <h2>Stärken</h2>\n          <ul>\n            {pros.map((item) => <li>{item}</li>)}\n          </ul>\n        </div>\n      )}\n\n      {cons.length > 0 && (\n        <div class=\"details__column details__column--negative\">\n          <span class=\"details__eyebrow\">Darauf achten</span>\n          <h2>Schwächen</h2>\n          <ul>\n            {cons.map((item) => <li>{item}</li>)}\n          </ul>\n        </div>\n      )}\n    </section>\n  )}\n\n  <aside class=\"details__health\">\n    <span>Gesundheit und Sicherheit</span>\n    <h2>Technik ersetzt keine Kontrolle</h2>\n    <p>{model.healthNote}</p>\n  </aside>\n\n  {model.specs.length > 0 && (\n    <details class=\"details__specs\">\n      <summary>Alle technischen Daten</summary>\n      <dl>\n        {model.specs.map((item) => <div><dt>{item.label}</dt><dd>{item.value}</dd></div>)}\n      </dl>\n    </details>\n  )}\n\n  {model.faq.length > 0 && (\n    <section class=\"details__faq\" aria-labelledby=\"product-faq-title\">\n      <h2 id=\"product-faq-title\">Häufige Kauffragen</h2>\n      {model.faq.map((item) => <details><summary>{item.question}</summary><p>{item.answer}</p></details>)}\n    </section>\n  )}\n</section>\n\n<style>\n  .details {\n    display: grid;\n    gap: 18px;\n  }\n\n  .details > aside,\n  .details > details,\n  .details > section {\n    min-width: 0;\n    padding: 16px;\n    border: 1px solid var(--px2-border);\n    border-radius: 20px;\n    background: var(--px2-surface);\n  }\n\n  .details__proscons {\n    display: grid;\n    gap: 24px;\n  }\n\n  .details__column {\n    min-width: 0;\n  }\n\n  .details__eyebrow,\n  .details__health > span {\n    color: var(--px2-green-strong);\n    font-size: .7rem;\n    font-weight: 850;\n    letter-spacing: .065em;\n    text-transform: uppercase;\n  }\n\n  .details__column--negative .details__eyebrow {\n    color: var(--px2-red);\n  }\n\n  .details h2 {\n    margin: 4px 0 12px;\n    font-size: clamp(1.2rem, 4.8vw, 1.55rem);\n  }\n\n  .details ul {\n    display: grid;\n    gap: 10px;\n    margin: 0;\n    padding: 0;\n    list-style: none;\n  }\n\n  .details li {\n    position: relative;\n    padding-left: 1rem;\n    color: var(--px2-muted);\n    line-height: 1.48;\n  }\n\n  .details li::before {\n    position: absolute;\n    top: .64em;\n    left: 0;\n    width: .35rem;\n    height: .35rem;\n    border-radius: 50%;\n    background: var(--px2-green);\n    content: \"\";\n  }\n\n  .details__column--negative li::before {\n    background: var(--px2-red);\n  }\n\n  .details__health {\n    background: var(--px2-green-soft);\n  }\n\n  .details__health h2 {\n    margin: 5px 0 7px;\n  }\n\n  .details__health p {\n    margin: 0;\n    color: var(--px2-muted);\n    line-height: 1.55;\n  }\n\n  .details__specs > summary,\n  .details__faq details > summary {\n    cursor: pointer;\n    font-weight: 850;\n  }\n\n  .details__specs dl {\n    display: grid;\n    margin: 16px 0 0;\n  }\n\n  .details__specs dl > div {\n    display: grid;\n    gap: 3px;\n    padding: 10px 0;\n    border-top: 1px solid var(--px2-border);\n  }\n\n  .details__specs dt {\n    color: var(--px2-muted);\n  }\n\n  .details__specs dd {\n    margin: 0;\n    font-weight: 700;\n    overflow-wrap: anywhere;\n  }\n\n  .details__faq h2 {\n    margin-top: 0;\n  }\n\n  .details__faq details {\n    padding: 12px 0;\n    border-top: 1px solid var(--px2-border);\n  }\n\n  .details__faq p {\n    margin: 9px 0 0;\n    color: var(--px2-muted);\n    line-height: 1.55;\n  }\n\n  @media (min-width: 720px) {\n    .details > aside,\n    .details > details,\n    .details > section {\n      padding: 22px;\n    }\n\n    .details__proscons {\n      grid-template-columns: 1fr 1fr;\n    }\n\n    .details__column--negative {\n      padding-left: 22px;\n      border-left: 1px solid var(--px2-border);\n    }\n\n    .details__specs dl {\n      grid-template-columns: 1fr 1fr;\n      gap: 0 24px;\n    }\n\n    .details__specs dl > div {\n      grid-template-columns: minmax(110px, .8fr) minmax(0, 1.2fr);\n      gap: 12px;\n    }\n  }\n</style>\n", "apps/pfotentechnik/test/product-ux-cleanup-25.7.0.test.mjs": "import test from \"node:test\";\nimport assert from \"node:assert/strict\";\nimport fs from \"node:fs\";\nimport path from \"node:path\";\nimport { fileURLToPath } from \"node:url\";\n\nconst ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), \"../../..\");\nconst APP = path.join(ROOT, \"apps\", \"pfotentechnik\");\nconst COMPONENTS = path.join(APP, \"src\", \"components\", \"product-experience-2\");\nconst RECOMMENDATIONS = path.join(APP, \"src\", \"domain\", \"recommendationLinks.ts\");\n\nconst read = (name) => fs.readFileSync(path.join(COMPONENTS, name), \"utf8\");\n\ntest(\"Quellenbox ist kompakt und verwendet keine Hakenliste\", () => {\n  const source = read(\"ProductEvidence2.astro\");\n  assert.match(source, /Unsere Quellen/);\n  assert.match(source, /So ist die Einordnung belegt/);\n  assert.doesNotMatch(source, />✓</);\n});\n\ntest(\"Decision Facts priorisieren Wert und Konsequenz\", () => {\n  const source = read(\"ProductDecisionFacts2.astro\");\n  assert.match(source, /Was die Daten wirklich bedeuten/);\n  assert.match(source, /\\{fact\\.value\\}/);\n  assert.match(source, /→/);\n});\n\ntest(\"Stärken und Schwächen vermeiden doppelte Symbole\", () => {\n  const source = read(\"ProductDetails2.astro\");\n  assert.doesNotMatch(source, />✓</);\n  assert.doesNotMatch(source, />×</);\n  assert.match(source, /details li::before/);\n});\n\ntest(\"Neue Komponenten bleiben mobile-first und tokenbasiert\", () => {\n  for (const name of [\"ProductEvidence2.astro\", \"ProductDecisionFacts2.astro\", \"ProductDetails2.astro\"]) {\n    const source = read(name);\n    assert.doesNotMatch(source, /!important/);\n    assert.doesNotMatch(source, /#[0-9a-f]{3,8}\\b/i);\n    assert.doesNotMatch(source, /@media\\s*\\(max-width:/);\n  }\n});\n\ntest(\"Recommendation Engine enthält harte Themenkompatibilität\", () => {\n  const source = fs.readFileSync(RECOMMENDATIONS, \"utf8\");\n  assert.match(source, /hasCompatibleRecommendationTopic/);\n  assert.match(source, /sourceContext\\.topics/);\n  assert.match(source, /candidateContext\\.topics/);\n});\n"};

function backup(target) {
  if (!fs.existsSync(target)) return;
  const destination = path.join(BACKUP, path.relative(ROOT, target));
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(target, destination);
}

for (const [relative, content] of Object.entries(files)) {
  const target = path.join(ROOT, relative);
  backup(target);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
  console.log("[" + NAME + "] Geschrieben: " + relative);
}

const recommendationsPath = path.join(APP, "src", "domain", "recommendationLinks.ts");
backup(recommendationsPath);
let recommendations = fs.readFileSync(recommendationsPath, "utf8");

if (!recommendations.includes("const hasCompatibleRecommendationTopic")) {
  const anchor = "const overlapCount = <T>";
  const index = recommendations.indexOf(anchor);
  if (index < 0) throw new Error("Recommendation-Anker overlapCount nicht gefunden.");

  const helper = `const hasCompatibleRecommendationTopic = (source: Context, candidate: Context) => {
  if (source.topics.size === 0 || candidate.topics.size === 0) return true;
  return overlapCount(source.topics, candidate.topics) > 0;
};
`;
  recommendations = recommendations.slice(0, index) + helper + recommendations.slice(index);
}

const oldRank = `  return candidates
    .map((entry) => ({
      entry,
      score: scoreContext(sourceContext, buildContext(entry.data)) + extra(entry) +
        getInternalLinkRuleWeight({ sourceGroup, targetGroup: groupFor(entry.data), targetPath: String(entry.data.slug ?? "") }) / 8
    }))
    .filter(({ score }) => score > 0)`;

const newRank = `  return candidates
    .map((entry) => {
      const candidateContext = buildContext(entry.data);
      if (!hasCompatibleRecommendationTopic(sourceContext, candidateContext)) {
        return { entry, score: Number.NEGATIVE_INFINITY };
      }
      return {
        entry,
        score: scoreContext(sourceContext, candidateContext) + extra(entry) +
          getInternalLinkRuleWeight({ sourceGroup, targetGroup: groupFor(entry.data), targetPath: String(entry.data.slug ?? "") }) / 8
      };
    })
    .filter(({ score }) => Number.isFinite(score) && score > 0)`;

if (recommendations.includes(oldRank)) {
  recommendations = recommendations.replace(oldRank, newRank);
} else if (!recommendations.includes("Number.NEGATIVE_INFINITY")) {
  throw new Error("Rank-Block in recommendationLinks.ts nicht gefunden.");
}

fs.writeFileSync(recommendationsPath, recommendations);
console.log("[" + NAME + "] Geändert: apps/pfotentechnik/src/domain/recommendationLinks.ts");

const experiencePath = path.join(APP, "src", "components", "product-experience-2", "ProductExperience2.astro");
backup(experiencePath);
let experience = fs.readFileSync(experiencePath, "utf8");
experience = experience.replace(
  "gap: clamp(20px, 3vw, 36px);",
  "gap: clamp(24px, 4vw, 46px);"
);
const mobileBlock = `
  @media (max-width: 720px) {
    .px2 {
      gap: 18px;
    }
  }
`;
experience = experience.replace(mobileBlock, "\n");
fs.writeFileSync(experiencePath, experience);
console.log("[" + NAME + "] Geändert: apps/pfotentechnik/src/components/product-experience-2/ProductExperience2.astro");

const packagePath = path.join(APP, "package.json");
backup(packagePath);
const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
pkg.scripts ??= {};
pkg.scripts["test:product-ux-cleanup"] = "node --test test/product-ux-cleanup-25.7.0.test.mjs";
fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + "\n");
console.log("[" + NAME + "] Geändert: apps/pfotentechnik/package.json");

const testPath = path.join(APP, "test", "product-ux-cleanup-25.7.0.test.mjs");
execFileSync(process.execPath, ["--test", testPath], { cwd: ROOT, stdio: "inherit" });
execFileSync("npm", ["--workspace", "apps/pfotentechnik", "run", "test:product-experience-2"], { cwd: ROOT, stdio: "inherit" });
execFileSync("npm", ["--workspace", "apps/pfotentechnik", "run", "test:decision-journeys"], { cwd: ROOT, stdio: "inherit" });
execFileSync("npm", ["--workspace", "apps/pfotentechnik", "run", "product-standard-3:release:no-build"], { cwd: ROOT, stdio: "inherit" });

console.log("[" + NAME + "] Fertig.");
console.log("[" + NAME + "] Danach visuellen Build prüfen:");
console.log("npm --workspace apps/pfotentechnik run build");

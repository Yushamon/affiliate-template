import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const yaml = createRequire(path.join(app, "package.json"))("js-yaml");
const read = (file) => fs.readFileSync(path.join(app, file), "utf8");
const frontmatter = (kind, slug) => {
  const source = read(`src/content/${kind}/${slug}.md`);
  const match = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(match, `${kind}/${slug} has frontmatter`);
  return yaml.load(match[1], { schema: yaml.JSON_SCHEMA });
};

const categories = [
  "smarte-futterautomaten",
  "trinkbrunnen",
  "gps-tracker",
  "katzenklappen",
  "haustierkameras",
  "automatische-katzentoiletten"
];

const configSource = read("src/domain/category/categoryConfig.ts");
const builderSource = read("src/domain/category/buildCategoryViewModel.ts");
const rendererSource = read("src/components/category/CategoryExperience.astro");
const routeSource = read("src/pages/[slug].astro");

test("34.2 uses one shared category route, ViewModel and renderer", () => {
  assert.match(routeSource, /buildCategoryViewModel\(\{ page, pages, products, comparisons \}\)/);
  assert.match(routeSource, /<CategoryExperience/);
  assert.match(rendererSource, /data-category-experience="34\.2"/);
  assert.match(builderSource, /resolveProductMedia\(product\.data\.images\)/);
  assert.match(rendererSource, /<EditorialScore value=\{product\.score\}/);
  for (const category of categories) assert.match(configSource, new RegExp(`(?:"${category}"|${category}):`));
  for (const category of categories) {
    assert.equal(fs.existsSync(path.join(app, `src/pages/${category}.astro`)), false, `${category} has no hand-built page`);
  }
});

test("34.2 primary journey is requirement-first and remains semantic", () => {
  const order = [
    "pt-category-hub__hero",
    "pt-category-hub__primary-comparison",
    "pt-category-hub__requirements",
    "pt-category-hub__paths",
    "pt-category-hub__comparisons",
    "pt-category-hub__products",
    "pt-category-hub__guides",
    "pt-category-hub__evidence",
    "pt-category-hub__closing"
  ].map((token) => rendererSource.indexOf(token));
  assert.ok(order.every((position) => position >= 0));
  assert.deepEqual(order, [...order].sort((a, b) => a - b));
  assert.match(rendererSource, /<ol class="pt-category-hub__requirement-list">/);
  assert.match(rendererSource, /<nav class="pt-category-hub__path-list"/);
  assert.match(rendererSource, /<details class="pt-category-hub__depth">/);
  assert.match(rendererSource, /<summary><span>Vollständige Kaufberatung/);
  assert.doesNotMatch(rendererSource, /background:\s*(?:#fff|#ffffff|white)\b/i);
});

test("34.2 configured destinations and selected products resolve to real content", async () => {
  const { categoryEditorialConfig } = await import("../src/domain/category/categoryConfig.ts");
  const { categoryDecisionRouting, getComparisonHref } = await import("../src/domain/category/categoryDecisionRouting.ts");
  for (const [slug, config] of Object.entries(categoryEditorialConfig)) {
    const routing = categoryDecisionRouting[slug];
    assert.ok(categories.includes(slug));
    assert.ok(config.requirements.length >= 3 && config.requirements.length <= 6, `${slug} requirement count`);
    assert.ok(config.paths.length >= 3 && config.paths.length <= 6, `${slug} decision path count`);
    const visibleSecondary = routing.secondaryComparisons.filter((comparison) => comparison.showInCategoryChapter !== false);
    assert.ok(visibleSecondary.length <= 3, `${slug} secondary comparison count`);
    assert.ok(config.products.length >= 3 && config.products.length <= 6, `${slug} product count`);
    assert.ok(config.guides.length >= 1 && config.guides.length <= 5, `${slug} guide count`);
    assert.ok(config.evidenceHeadings.length >= 3 && config.evidenceHeadings.length <= 5, `${slug} evidence count`);
    const hubSource = read(`src/content/pages/${slug}.md`);
    for (const heading of config.evidenceHeadings) assert.ok(hubSource.includes(`## ${heading}`), `${slug} evidence heading ${heading}`);
    for (const comparison of [routing.primaryComparison, ...routing.secondaryComparisons]) frontmatter("comparisons", comparison.slug);
    for (const product of config.products) frontmatter("products", product.slug);
    for (const guide of config.guides) frontmatter("pages", guide);
    for (const item of config.paths) {
      const href = "comparisonSlug" in item ? getComparisonHref(item.comparisonSlug) : item.href;
      if (href.startsWith("#")) continue;
      const route = href.split(/[?#]/)[0];
      const target = route === "/" ? "dist/index.html" : `dist${route}index.html`;
      assert.ok(fs.existsSync(path.join(app, target)), `${slug} resolves ${href}`);
    }
    const primaryTarget = `dist${getComparisonHref(routing.primaryComparison.slug)}index.html`;
    assert.ok(fs.existsSync(path.join(app, primaryTarget)), `${slug} closing resolves primary comparison`);
  }
});

test("34.2 build output exposes curated category contracts across all six hubs", () => {
  for (const slug of categories) {
    const html = read(`dist/${slug}/index.html`);
    assert.match(html, /data-category-experience="34\.2"/);
    assert.match(html, /data-primary-comparison="\/vergleiche\/[^"]+\/"/);
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1, `${slug} has one H1`);
    const requirementList = html.match(/class="pt-category-hub__requirement-list"[^>]*>([\s\S]*?)<\/ol>/);
    assert.ok(requirementList, `${slug} has requirement list`);
    assert.equal((requirementList[1].match(/<li\b/g) ?? []).length, 6, `${slug} has six requirements`);
    assert.match(html, /class="pt-category-hub__depth"/);
    const evidence = html.match(/class="pt-category-hub__reading"[^>]*>([\s\S]*?)<\/div>/);
    assert.ok(evidence, `${slug} has compact evidence sections`);
    const evidenceCount = (evidence[1].match(/<section\b/g) ?? []).length;
    assert.ok(evidenceCount >= 3 && evidenceCount <= 5, `${slug} has three to five compact evidence sections`);
    assert.match(html, /class="pt-score pt-score--ring-compact/);
    assert.match(html, /<script type="application\/ld\+json">\{"@context":"https:\/\/schema\.org","@type":"Article"/);
    assert.doesNotMatch(html, /href="\/redaktionelle-transparenz\/"/);
  }
});

test("34.2 naturally links the five category-relevant baseline orphan candidates", () => {
  const trinkbrunnen = read("dist/trinkbrunnen/index.html");
  for (const href of [
    "/katze-an-trinkbrunnen-gewoehnen/",
    "/katzentrinkbrunnen-dauerbetrieb-urlaub/",
    "/katzentrinkbrunnen-ohne-filter/",
    "/trinkbrunnen-fuer-kitten-sicher/",
    "/produkt/feelneedy-fn-w18-8l-katzenbrunnen/"
  ]) assert.match(trinkbrunnen, new RegExp(`href="${href}"`));
});

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const yaml = createRequire(path.join(app, "package.json"))("js-yaml");
const read = (file) => fs.readFileSync(path.join(app, file), "utf8");
const getFrontmatter = (kind, slug) => {
  const source = read(`src/content/${kind}/${slug}.md`);
  const match = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(match, `${kind}/${slug} has frontmatter`);
  return yaml.load(match[1], { schema: yaml.JSON_SCHEMA });
};

const { categoryDecisionRouting, getComparisonHref } = await import(
  "../src/domain/category/categoryDecisionRouting.ts"
);
const routes = Object.entries(categoryDecisionRouting);

test("P0 uses one complete six-category decision routing contract", () => {
  assert.equal(routes.length, 6);
  assert.deepEqual(
    routes.map(([slug]) => slug).sort(),
    [
      "automatische-katzentoiletten",
      "gps-tracker",
      "haustierkameras",
      "katzenklappen",
      "smarte-futterautomaten",
      "trinkbrunnen"
    ]
  );

  for (const [categorySlug, route] of routes) {
    assert.equal(route.categoryHref, `/${categorySlug}/`);
    assert.ok(route.primaryComparison.slug);
    assert.ok(route.primaryComparison.cta.includes("Vergleich"));
    assert.notEqual(getComparisonHref(route.primaryComparison.slug), "/vergleiche/");
  }

  const config = read("src/domain/category/categoryConfig.ts");
  const renderer = read("src/components/category/CategoryExperience.astro");
  assert.doesNotMatch(config, /href:\s*["']\/vergleiche\//);
  assert.doesNotMatch(renderer, /href=["']\/vergleiche\//);
});

test("homepage category discovery still routes to all six categories and keeps the neutral overview", () => {
  const homepageModel = read("src/domain/home/buildHomepageModel.ts");
  const homepage = read("dist/index.html");

  for (const [, route] of routes) {
    assert.match(homepageModel, new RegExp(`href:\\s*["']${route.categoryHref}["']`));
    assert.match(homepage, new RegExp(`href="${route.categoryHref}"`));
  }

  assert.match(homepage, /href="\/vergleiche\/"/);
  assert.match(homepageModel, /slug:\s*"beste-futterautomaten-fuer-katzen"/);
  assert.match(homepageModel, /slug:\s*"beste-gps-tracker-fuer-katzen"/);
});

test("each category exposes its specific primary comparison immediately after the hero", () => {
  for (const [categorySlug, route] of routes) {
    const html = read(`dist/${categorySlug}/index.html`);
    const heroIndex = html.indexOf("pt-category-hub__hero");
    const primaryIndex = html.indexOf("pt-category-hub__primary-comparison");
    const requirementsIndex = html.indexOf("pt-category-hub__requirements");
    const primarySection = html.slice(primaryIndex, html.indexOf("</section>", primaryIndex));
    const href = getComparisonHref(route.primaryComparison.slug);

    assert.ok(heroIndex >= 0 && heroIndex < primaryIndex, `${categorySlug} hero precedes primary CTA`);
    assert.ok(primaryIndex < requirementsIndex, `${categorySlug} primary CTA precedes requirements`);
    assert.match(primarySection, new RegExp(`href="${href}"`));
    assert.ok(primarySection.includes(route.primaryComparison.cta));
    assert.doesNotMatch(primarySection, /href="\/vergleiche\/"/);
  }
});

test("all six primary journeys continue from comparison finalist to product and back to the relevant comparison", () => {
  for (const [, route] of routes) {
    const comparisonSlug = route.primaryComparison.slug;
    const comparison = getFrontmatter("comparisons", comparisonSlug);
    const finalistSlug = comparison.items[0].slug;
    const comparisonHtml = read(`dist/vergleiche/${comparisonSlug}/index.html`);
    const productHtml = read(`dist/produkt/${finalistSlug}/index.html`);
    const comparisonHref = getComparisonHref(comparisonSlug);

    assert.match(comparisonHtml, new RegExp(`/produkt/${finalistSlug}/`));
    assert.match(productHtml, new RegExp(`href="${comparisonHref}"`));
    assert.match(productHtml, new RegExp(`href="${route.categoryHref}"`));

    const breadcrumb = comparisonHtml.match(/"@type":"BreadcrumbList"[\s\S]*?<\/script>/)?.[0] ?? "";
    assert.ok(breadcrumb, `${comparisonSlug} emits breadcrumb schema`);
    assert.ok(breadcrumb.includes(`"position":2,"name":"${route.categoryLabel}"`));
    assert.ok(breadcrumb.includes(`"item":"https://pfotentechnik.de${route.categoryHref}"`));
  }
});

test("comparison overview is neutral, demand-led and keeps every comparison discoverable", () => {
  const html = read("dist/vergleiche/index.html");
  const main = html.slice(html.indexOf('data-comparison-overview="demand-led"'));
  const comparisonHrefs = [...main.matchAll(/href="(\/vergleiche\/[^"]+\/)"/g)].map((match) => match[1]);
  const uniqueHrefs = [...new Set(comparisonHrefs)];
  const expectedPrimaryOrder = [...routes]
    .sort(([, a], [, b]) => a.overview.rank - b.overview.rank)
    .map(([, route]) => getComparisonHref(route.primaryComparison.slug));
  const comparisonFiles = fs.readdirSync(path.join(app, "src/content/comparisons"))
    .filter((file) => file.endsWith(".md"));

  assert.match(html, /data-comparison-overview-group="primary"/);
  assert.match(html, /data-comparison-overview-group="additional"/);
  assert.match(html, /data-comparison-overview-group="specialist"/);
  assert.deepEqual(uniqueHrefs.slice(0, 6), expectedPrimaryOrder);
  assert.equal(uniqueHrefs.length, comparisonFiles.length);
  assert.equal(comparisonHrefs.length, uniqueHrefs.length, "each comparison has one overview decision link");

  const overviewSource = read("src/pages/vergleiche/index.astro");
  assert.match(overviewSource, /mainClass="container--comparison-overview"/);
  assert.match(overviewSource, /main\.container\.container--comparison-overview[\s\S]*box-sizing:\s*border-box/);
});

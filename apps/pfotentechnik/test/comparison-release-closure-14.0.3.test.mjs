import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(appRoot, "..", "..");

const read = (relative) => fs.readFile(path.join(repoRoot, relative), "utf8");
const parse = (source) => {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  assert.ok(match);
  return { data: yaml.load(match[1]), body: match[2] };
};

test("all 26 comparison files use canonical comparison routes", async () => {
  const dir = path.join(appRoot, "src", "content", "comparisons");
  const names = (await fs.readdir(dir)).filter((name) => /\.mdx?$/.test(name));
  assert.equal(names.length, 26);

  for (const name of names) {
    const { data, body } = parse(await fs.readFile(path.join(dir, name), "utf8"));
    const canonical = `/vergleiche/${data.slug}/`;
    assert.equal(data.canonical, canonical);
    assert.equal(data.seo.canonical, canonical);
    assert.equal(data.seo.noindex, false);
    assert.equal(data.seo.sitemap, true);
    assert.doesNotMatch(body, /\/vergleiche\/-[a-z0-9-]+\/?/i);
    assert.ok(data.items.length >= 2);
    assert.ok(data.items.some((item) => item.slug === data.recommendation.winnerSlug));
    if (data.recommendation.alternativeSlug) {
      assert.ok(data.items.some((item) => item.slug === data.recommendation.alternativeSlug));
      assert.notEqual(data.recommendation.winnerSlug, data.recommendation.alternativeSlug);
    }
  }
});

test("comparison UI separates complete rows from explicit missing-data states", async () => {
  const viewModel = await read("apps/pfotentechnik/src/domain/comparison/buildComparisonViewModel.ts");
  const explorer = await read("packages/affiliate-core/src/components/comparison/ComparisonExplorer.astro");

  assert.match(viewModel, /resolvedCount === row\.cells\.length/);
  assert.match(explorer, /comparison-lab__missing/);
  assert.match(explorer, /Keine Angabe/);
});

test("release safeguards cover dark mode, sticky CTA, schema and links", async () => {
  const shell = await read("packages/affiliate-core/src/components/comparison/ComparisonShell.astro");
  const sticky = await read("packages/affiliate-core/src/components/comparison/ComparisonStickyBar.astro");
  const comparisonStyles = await read("packages/affiliate-core/src/components/comparison/comparison-system.css");
  const releaseAudit = await read("apps/pfotentechnik/scripts/comparison-platform/release-closure.mjs");
  const refactorAudit = await read("apps/pfotentechnik/scripts/comparison-platform/refactor-audit.mjs");

  assert.match(shell, /data-dark-mode-ready="true"/);
  assert.match(sticky, /data-comparison-sticky="true"/);
  assert.match(comparisonStyles, /safe-area-inset-bottom/);
  assert.match(releaseAudit, /ItemList/);
  assert.match(releaseAudit, /FAQPage/);
  assert.match(releaseAudit, /EXPECTED_COMPARISONS = 26/);
  assert.match(refactorAudit, /MALFORMED_COMPARISON_PATH/);
});

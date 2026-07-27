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

test("all 24 comparison files use canonical comparison routes", async () => {
  const dir = path.join(appRoot, "src", "content", "comparisons");
  const names = (await fs.readdir(dir)).filter((name) => /\.mdx?$/.test(name));
  assert.equal(names.length, 24);

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

test("comparison UI hides unresolved criteria instead of rendering empty-data walls", async () => {
  const viewModel = await read("apps/pfotentechnik/src/domain/comparison/buildComparisonViewModel.ts");
  const table = await read("packages/affiliate-core/src/components/comparison/ComparisonTable.astro");
  const mobile = await read("packages/affiliate-core/src/components/comparison/ComparisonMobileCards.astro");

  assert.match(viewModel, /resolvedCount === row\.cells\.length/);
  assert.doesNotMatch(table, />Keine Angabe</);
  assert.doesNotMatch(mobile, />Keine Angabe</);
  assert.match(table, /comparison-value-missing/);
  assert.match(mobile, /comparison-value-missing/);
});

test("release safeguards cover dark mode, sticky CTA, schema and links", async () => {
  const shell = await read("packages/affiliate-core/src/components/comparison/ComparisonShell.astro");
  const sticky = await read("packages/affiliate-core/src/components/comparison/ComparisonStickyBar.astro");
  const releaseAudit = await read("apps/pfotentechnik/scripts/comparison-platform/release-closure.mjs");
  const refactorAudit = await read("apps/pfotentechnik/scripts/comparison-platform/refactor-audit.mjs");

  assert.match(shell, /data-dark-mode-ready="true"/);
  assert.match(sticky, /data-comparison-sticky="true"/);
  assert.match(sticky, /safe-area-inset-bottom/);
  assert.match(releaseAudit, /ItemList/);
  assert.match(releaseAudit, /FAQPage/);
  assert.match(releaseAudit, /EXPECTED_COMPARISONS = 24/);
  assert.match(refactorAudit, /MALFORMED_COMPARISON_PATH/);
});

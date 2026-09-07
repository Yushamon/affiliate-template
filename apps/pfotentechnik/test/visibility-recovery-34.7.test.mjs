import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const app = new URL('../', import.meta.url);
const read = p => fs.readFileSync(new URL(p, app), 'utf8');

test('historically ranked Solo alias resolves in one permanent hop to the existing Solo 2 owner', () => {
  const rules = read('public/_redirects').split('\n').map(l => l.trim().split(/\s+/)).filter(([from]) => from.startsWith('/'));
  const target = '/produkt/petkit-yumshare-solo-2/';
  for (const source of ['/produkt/petkit-yumshare-solo', '/produkt/petkit-yumshare-solo/']) {
    const matches = rules.filter(([from]) => from === source);
    assert.deepEqual(matches, [[source, target, '301']]);
  }
  assert.equal(rules.some(([from]) => from === target || from === target.slice(0,-1)), false, 'target must not redirect again');
  assert.equal(fs.existsSync(new URL('src/content/products/petkit-yumshare-solo.md', app)), false, 'deleted alias must not compete with redirect');
  const product = read('src/content/products/petkit-yumshare-solo-2.md');
  assert.match(product, /^title: ["']?PETKIT YumShare Solo 2["']?$/m);
  assert.match(product, /^productUrl: ["']?\/produkt\/petkit-yumshare-solo-2\/["']?$/m);
  assert.doesNotMatch(product, /noindex:\s*true|sitemap:\s*false/);
});

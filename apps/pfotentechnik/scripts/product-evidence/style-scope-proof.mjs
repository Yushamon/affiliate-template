import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const app = fileURLToPath(new URL('../../', import.meta.url));
const sha = value => createHash('sha256').update(value).digest('hex');
const cssUrls = html => [...html.matchAll(/<link\b[^>]*href="([^"\s]+\.css)"/g)].map(m => m[1]);
const scopes = (text, className) => [...text.matchAll(new RegExp('\\.' + className + '\\[data-astro-cid-([a-z0-9]+)\\]', 'g'))].map(m => m[1]);

// Astro derives this component's scoped-style ID from its resolved workspace
// location. A different ID is accepted only for unchanged component source and
// CSS that is otherwise byte-identical to the archived stylesheet.
export function createStyleScopeProof({reference, source, additionalSources = {}, readCss}) {
  assert.equal(sha(source), reference.sourceSha256, 'ProductScore source changed; no scope exception');
  for (const item of reference.stylesheets) assert.equal(sha(item.content), item.sha256, 'Invalid archived CSS');
  const archived = new Map(reference.stylesheets.map(item => [item.url, item.content]));
  const components = [{className: 'pt-score'}, ...(reference.additionalComponents ?? [])];
  for(const item of reference.additionalComponents ?? []) assert.equal(sha(additionalSources[item.component]), item.sourceSha256, item.component + ': source changed; no scope exception');
  return {
    normalize(html, {historical = false} = {}) {
      const urls = cssUrls(html);
      const styles = new Map(urls.map(url => [url, historical ? archived.get(url) : readCss(url)]));
      const verifiedScopes = components.map(({className}) => {
        const ids = new Set([...reference.stylesheets.flatMap(item => scopes(item.content, className)), ...scopes(html, className), ...[...styles.values()].filter(Boolean).flatMap(css => scopes(css, className))]);
        assert.ok(ids.size <= 2, 'Unexpected scope identities: ' + className);
        return {className, ids};
      });
      const scopeOnly = value => {
        for (const {className, ids} of verifiedScopes) for(const scope of ids) value = value.replaceAll('data-astro-cid-' + scope, 'data-astro-cid-VERIFIED_' + className.replaceAll('-', '_'));
        return value;
      };
      const expected = new Set(reference.stylesheets.map(item => sha(scopeOnly(item.content))));
      let result = scopeOnly(html);
      for (const [url, css] of styles) {
        if (css && expected.has(sha(scopeOnly(css)))) result = result.replaceAll(`href="${url}"`, `href="/_verified-css/${sha(scopeOnly(css))}.css"`);
      }
      return result;
    },
  };
}

export function buildStyleScopeProof() {
  const reference = JSON.parse(fs.readFileSync(path.join(app, 'research/product-evidence-35.6/style-scope-reference.json')));
  return createStyleScopeProof({reference, source: fs.readFileSync(path.resolve(app, '../..', reference.component)), additionalSources: Object.fromEntries((reference.additionalComponents ?? []).map(item => [item.component, fs.readFileSync(path.resolve(app, '../..', item.component))])), readCss(url) {
    if (!url.startsWith('/_astro/')) return null;
    const file = path.resolve(app, 'dist', '.' + url);
    if (!file.startsWith(path.join(app, 'dist', '_astro') + path.sep) || !fs.existsSync(file)) return null;
    return fs.readFileSync(file, 'utf8');
  }});
}

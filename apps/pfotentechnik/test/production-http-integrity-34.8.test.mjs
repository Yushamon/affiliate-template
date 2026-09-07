import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { runProductionHttpGate, probeCases, traceUrl, readLegacyRules } from '../scripts/seo/production-http-integrity.mjs';

const origin = 'https://pfotentechnik.de';
const paths = ['/', '/produkt/petkit-yumshare-solo-2/', '/trinkbrunnen-fuer-mehrere-katzen/', '/vergleiche/beste-futterautomaten-fuer-katzen/'];
const html = (route, title = route === '/' ? 'Homepage' : route) => `<html><head><title>${title}</title><link href="${origin}${route}" rel="canonical"><meta name="robots" content="index,follow"></head><body>${title}</body></html>`;
const response = (body, status = 200, headers = {}) => new Response(body, { status, headers:{'content-type':'text/html', ...headers} });
const redirect = (url, status = 301) => response('', status, {location:url});
function site(override = () => null, sitemapPaths = paths) {
  return async (value, options) => {
    assert.equal(options.redirect, 'manual');
    const u = new URL(value), special = override(u);
    if (special) return special;
    if (u.hostname.startsWith('www.') || u.protocol === 'http:') return redirect(origin + u.pathname + u.search);
    if (u.pathname === '/sitemap-index.xml') return response(`<sitemapindex><sitemap><loc>${origin}/sitemap-0.xml</loc></sitemap></sitemapindex>`);
    if (u.pathname === '/sitemap-0.xml') return response('<urlset>' + sitemapPaths.map(p=>`<url><loc>${origin}${p}</loc></url>`).join('') + '</urlset>');
    if (u.pathname === '/robots.txt') return response(`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap-index.xml\n`);
    if (['/produkt/petkit-yumshare-solo', '/produkt/petkit-yumshare-solo/'].includes(u.pathname)) return redirect(origin + paths[1] + u.search);
    if (sitemapPaths.includes(u.pathname)) return response(html(u.pathname));
    return response(html('/404/', 'Seite nicht gefunden'), 404);
  };
}
const run = (fetchImpl, extra = {}) => runProductionHttpGate({fetchImpl, nonce:'test-run-unique', expectedSitemap:paths.map(p=>origin+p),...extra});

test('all production contracts pass with direct permanent host redirects, real errors and canonical sitemap', async () => {
  const report = await run(site());
  assert.equal(report.pass, true, JSON.stringify(report.failures));
  assert.equal(report.summary.sitemapChecked, 4);
  assert.equal(report.cases.filter(c=>c.category==='random-404').length, 4);
  assert.notDeepEqual(probeCases().filter(c=>c.category==='random-404').map(c=>c.url), probeCases().filter(c=>c.category==='random-404').map(c=>c.url));
});
test('200 on www fails even when canonical points at apex', async () => {
  const r = await run(site(u=>u.hostname.startsWith('www.') ? response(html(u.pathname)) : null));
  assert.equal(r.pass,false);
  assert.ok(r.cases.find(c=>c.name==='https-www').failures.includes('INITIAL_PERMANENT_REDIRECT'));
});
test('unknown-path homepage fallback is detected by status, title and canonical', async () => {
  const r = await run(site(u=>u.hostname==='pfotentechnik.de'&&u.pathname.includes('seo-http-integrity-404') ? response(html('/')) : null));
  assert.equal(r.pass,false);
  assert.ok(r.cases.filter(c=>c.category==='random-404').every(c=>c.failures.includes('HOMEPAGE_FALLBACK')));
});
test('even a 404 with homepage canonical or title fails the fallback guard', async () => {
  const r = await run(site(u=>u.hostname==='pfotentechnik.de'&&u.pathname.includes('seo-http-integrity-404') ? response(html('/'),404) : null));
  assert.equal(r.pass,false);
});
test('http-www two-hop chains and query loss are rejected', async () => {
  const r = await run(site(u=>u.protocol==='http:'&&u.hostname.startsWith('www.') ? redirect('https://www.pfotentechnik.de'+u.pathname) : null));
  assert.equal(r.pass,false);
  assert.ok(r.cases.find(c=>c.name==='http-www').failures.includes('REDIRECT_CHAIN'));
  assert.ok(r.cases.find(c=>c.name==='http-www-guide-query').failures.includes('FINAL_URL'));
});
test('missing legacy redirect cannot pass because the target itself is healthy', async () => {
  const r = await run(site(u=>u.pathname==='/produkt/petkit-yumshare-solo/' ? response(html('/')) : null));
  assert.equal(r.cases.find(c=>c.name==='solo-legacy').pass,false);
});
test('all sitemap URLs are checked, including a nonrepresentative wrong canonical', async () => {
  const r = await run(site(u=>u.pathname==='/hidden-canonical-bug/' ? response(html('/')) : null, [...paths,'/hidden-canonical-bug/']));
  assert.equal(r.summary.sitemapChecked,5);
  assert.equal(r.sitemap.urls.find(c=>c.url.endsWith('/hidden-canonical-bug/')).pass,false);
});
test('an empty sitemap or redirected sitemap URL cannot give a green gate', async () => {
  assert.equal((await run(site(()=>null,[]))).pass,false);
  const r = await run(site(u=>u.pathname===paths[2] ? redirect(origin+paths[3]) : null));
  assert.equal(r.sitemap.urls.find(c=>c.url===origin+paths[2]).pass,false);
});
test('temporary redirects and noindex on final 200 responses fail', async () => {
  const r=await run(site(u=>u.hostname.startsWith('www.') ? redirect(origin+u.pathname+u.search,302) : u.pathname===paths[1] ? response(html(paths[1]),200,{'x-robots-tag':'noindex'}) : null));
  assert.equal(r.pass,false);
  assert.ok(r.cases.find(c=>c.name==='product').failures.includes('NOINDEX'));
});
test('network failure and redirect loop fail closed', async () => {
  const t=await traceUrl(origin+'/',{fetchImpl:async()=>{throw new Error('network unavailable');}});
  assert.match(t.error,/network unavailable/);
  const loop=await traceUrl(origin+'/',{fetchImpl:async()=>redirect(origin+'/')});
  assert.match(loop.error,/loop/);
});
test('built release retains legacy rules and excludes the new error page from sitemap', () => {
  const root=new URL('../',import.meta.url);
  const rules=readLegacyRules(fs.readFileSync(new URL('public/_redirects',root),'utf8'));
  assert.equal(rules.length,68);
  assert.ok(rules.some(r=>r.source==='/produkt/petkit-yumshare-solo/'&&r.target===paths[1]&&r.status===301));
  const page=fs.readFileSync(new URL('src/pages/404.astro',root),'utf8');
  assert.match(page,/noindex=\{true\}/);
  assert.match(page,/canonical="\/404\/"/);
  assert.ok(fs.readFileSync(new URL('astro.config.mjs',root),'utf8').includes('"/404/"'));
});


test('release manifest excludes host error documents but retains ordinary static routes', async () => {
  const { staticPageUrl } = await import('../scripts/seo/release-url-utils.mjs');
  const prefix = 'apps/pfotentechnik/src/pages/';
  assert.equal(staticPageUrl(prefix + '404.astro'), null);
  assert.equal(staticPageUrl(prefix + '500.astro'), null);
  assert.equal(staticPageUrl(prefix + 'index.astro'), origin + '/');
  assert.equal(staticPageUrl(prefix + 'kontakt.astro'), origin + '/kontakt/');
});

test('measurement clock requires a fresh passing live gate and a known deployment date', async () => {
  const { measurementBaseline } = await import('../scripts/seo/record-http-measurement.mjs');
  const watch = Array.from({length:15}, (_, i) => '/watch-' + i + '/');
  const options = { http:{pass:true, finishedAt:'2026-09-07T12:00:00Z', observations:watch.map(p => ({url:origin+p, pass:true}))}, source:{pages:[]}, gsc:{}, cohort:[], watch, now:new Date('2026-09-07T12:30:00Z') };
  assert.equal(measurementBaseline(options).status, 'PENDING_LIVE_FIX');
  const ready = measurementBaseline({...options, deployedAt:'2026-09-07T11:50:00Z'});
  assert.equal(ready.status, 'POST_FIX_BASELINE');
  assert.equal(ready.observationEnd, '2026-09-21T11:50:00.000Z');
  assert.equal(measurementBaseline({...options, deployedAt:'2026-09-07T11:50:00Z', http:{...options.http, pass:false}}).deploymentAt, null);
  assert.equal(measurementBaseline({...options, deployedAt:'2026-09-07T11:50:00Z', now:new Date('2026-09-07T14:00:00Z')}).deploymentAt, null);
});

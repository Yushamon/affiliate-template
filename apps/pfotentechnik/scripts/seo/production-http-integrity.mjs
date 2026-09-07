#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { APP_ROOT, REPO_ROOT, SITE, sitemapUrls } from './release-url-utils.mjs';

const PERMANENT = new Set([301, 308]);
const REDIRECT = new Set([301, 302, 303, 307, 308]);
const HOSTS = new Set(['pfotentechnik.de', 'www.pfotentechnik.de']);
const sha = value => createHash('sha256').update(value).digest('hex');
const decode = value => String(value).replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n));
const attributes = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map(m => [m[1].toLowerCase(), decode(m[2] ?? m[3])]));
export function htmlSignals(html) {
  const canonical = [...html.matchAll(/<link\b[^>]*>/gi)].map(m => attributes(m[0])).filter(a => a.rel?.toLowerCase().split(/\s+/).includes('canonical')).map(a => a.href);
  const metas = [...html.matchAll(/<meta\b[^>]*>/gi)].map(m => attributes(m[0]));
  return { canonical, title: decode(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').trim(), robots: metas.filter(a => a.name?.toLowerCase() === 'robots').map(a => a.content || '').join(','), bodySha256: sha(html) };
}

// Fixed production domain; injectable transport only for deterministic regression tests.
// Redirects remain manual so a 200 on www cannot masquerade as a correct result.
export async function traceUrl(url, { fetchImpl = fetch, timeoutMs = 15000, maxHops = 5 } = {}) {
  const chain = [], seen = new Set();
  let current = url, body = '', error = null;
  try {
    for (;;) {
      const parsed = new URL(current);
      if (!HOSTS.has(parsed.hostname) || !['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.port) throw new Error('Unexpected redirect host/protocol/credentials/port');
      if (seen.has(current)) throw new Error('Redirect loop');
      seen.add(current);
      const response = await fetchImpl(current, { redirect: 'manual', signal: AbortSignal.timeout(timeoutMs), headers: { 'user-agent': 'PfotenTechnik-Production-HTTP-Integrity/34.8', 'cache-control': 'no-cache' } });
      const location = response.headers.get('location');
      chain.push({ url: current, status: response.status, location, xRobotsTag: response.headers.get('x-robots-tag'), date: response.headers.get('date'), contentType: response.headers.get('content-type'), cfRay: response.headers.get('cf-ray') });
      // The same timeout applies while consuming the body, not just the headers.
      body = await response.text();
      if (!REDIRECT.has(response.status)) break;
      if (!location) throw new Error('Redirect without Location');
      if (chain.length > maxHops) throw new Error('Redirect hop limit exceeded');
      current = new URL(location, current).href;
    }
  } catch (cause) { error = cause.message; }
  return { url, initialStatus: chain[0]?.status ?? null, chain, finalStatus: chain.at(-1)?.status ?? null, finalUrl: current, redirects: chain.filter(h => REDIRECT.has(h.status)).length, error, ...htmlSignals(body), body };
}

export function evaluateCase(trace, expected, home) {
  const failures = [];
  if (trace.error) failures.push(`FETCH: ${trace.error}`);
  if (trace.finalUrl !== expected.finalUrl) failures.push('FINAL_URL');
  if (trace.finalStatus !== expected.status) failures.push('FINAL_STATUS');
  if (trace.redirects > (expected.maxRedirects ?? 0)) failures.push('REDIRECT_CHAIN');
  if (expected.redirect && !PERMANENT.has(trace.initialStatus)) failures.push('INITIAL_PERMANENT_REDIRECT');
  if (trace.chain.some(h => REDIRECT.has(h.status) && !PERMANENT.has(h.status))) failures.push('TEMPORARY_REDIRECT');
  if (expected.status === 200) {
    const canonical = new URL(expected.finalUrl); canonical.search = ''; canonical.hash = '';
    if (trace.canonical.length !== 1 || trace.canonical[0] !== canonical.href) failures.push('CANONICAL');
    if (/\bnoindex\b/i.test(trace.robots + ',' + trace.chain.at(-1)?.xRobotsTag)) failures.push('NOINDEX');
  }
  if (expected.status === 404) {
    if (trace.finalStatus === 200 || trace.canonical.includes(SITE + '/') || (home?.title && trace.title === home.title) || trace.bodySha256 === home?.bodySha256) failures.push('HOMEPAGE_FALLBACK');
    if (trace.canonical.some(c => !c?.startsWith(SITE + '/'))) failures.push('ERROR_PAGE_HOST');
  }
  return { ...expected, ...trace, body: undefined, pass: failures.length === 0, failures };
}

export function probeCases(nonce = randomUUID()) {
  if (!/^[a-zA-Z0-9-]+$/.test(nonce)) throw new Error('Invalid probe nonce');
  const product = '/produkt/petkit-yumshare-solo-2/';
  const guide = '/trinkbrunnen-fuer-mehrere-katzen/';
  const comparison = '/vergleiche/beste-futterautomaten-fuer-katzen/';
  const page = (name, route) => ({ name, category: 'canonical', url: SITE + route, finalUrl: SITE + route, status: 200, maxRedirects: 0 });
  const redirect = (name, url, finalUrl, category = 'preferred-host') => ({ name, category, url, finalUrl, status: 200, redirect: true, maxRedirects: 1 });
  const cases = [page('homepage', '/'), page('product', product), page('guide', guide), page('comparison', comparison),
    redirect('https-www', 'https://www.pfotentechnik.de/', SITE + '/'),
    redirect('http-apex', 'http://pfotentechnik.de/', SITE + '/', 'http-to-https'),
    redirect('http-www', 'http://www.pfotentechnik.de/', SITE + '/', 'http-to-https'),
    redirect('www-product-path', 'https://www.pfotentechnik.de' + product, SITE + product),
    redirect('www-guide-query', 'https://www.pfotentechnik.de' + guide + '?foo=bar&encoded=%2Ftest%20value', SITE + guide + '?foo=bar&encoded=%2Ftest%20value', 'query-preservation'),
    redirect('http-www-guide-query', 'http://www.pfotentechnik.de' + guide + '?foo=bar&encoded=%2Ftest%20value', SITE + guide + '?foo=bar&encoded=%2Ftest%20value', 'query-preservation'),
    redirect('solo-legacy', SITE + '/produkt/petkit-yumshare-solo/', SITE + product, 'legacy'),
    redirect('solo-legacy-no-slash', SITE + '/produkt/petkit-yumshare-solo', SITE + product, 'legacy')];
  for (const suffix of ['a/', 'nested/b/']) {
    const route = `/seo-http-integrity-404-${nonce}/${suffix}`;
    cases.push({ name: 'random-404-' + suffix, category: 'random-404', url: SITE + route, finalUrl: SITE + route, status: 404, maxRedirects: 0 });
    cases.push({ name: 'www-random-404-' + suffix, category: 'random-404', url: 'https://www.pfotentechnik.de' + route + '?foo=bar', finalUrl: SITE + route + '?foo=bar', status: 404, redirect: true, maxRedirects: 1 });
  }
  return cases;
}

async function pool(items, task, concurrency = 4) {
  const results = new Array(items.length); let next = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    for (;;) { const index = next++; if (index >= items.length) break; results[index] = await task(items[index]); }
  }));
  return results;
}

export async function runProductionHttpGate({ fetchImpl = fetch, nonce = randomUUID(), expectedSitemap = [], legacyRules = [], observationUrls = [], onProgress = () => {}, acceptHttpWwwTwoHops = false } = {}) {
  const startedAt = new Date().toISOString(), cases = probeCases(nonce);
  if (acceptHttpWwwTwoHops) for (const spec of cases) {
    if (spec.url.startsWith('http://www.pfotentechnik.de/')) spec.maxRedirects = 2;
  }
  const home = await traceUrl(SITE + '/', { fetchImpl });
  const results = await pool(cases, async spec => evaluateCase(spec.name === 'homepage' ? home : await traceUrl(spec.url, { fetchImpl }), spec, home));
  const problems = [], documents = [], urls = [], queue = [SITE + '/sitemap-index.xml'], seen = new Set();
  onProgress('Host, protocol, query, legacy and random-404 probes complete. Reading production sitemaps.');
  while (queue.length) {
    const url = queue.shift();
    if (seen.has(url)) { problems.push('SITEMAP_CYCLE_OR_DUPLICATE: ' + url); continue; }
    if (seen.size >= 100) { problems.push('SITEMAP_DOCUMENT_LIMIT'); break; }
    seen.add(url);
    if (!url.startsWith(SITE + '/') || new URL(url).origin !== SITE) { problems.push('SITEMAP_DOCUMENT_HOST: ' + url); continue; }
    const t = await traceUrl(url, { fetchImpl });
    documents.push({ ...t, body: undefined });
    if (t.error || t.finalStatus !== 200 || t.redirects || t.finalUrl !== url) { problems.push('SITEMAP_FETCH: ' + url); continue; }
    const locs = [...t.body.matchAll(/<(?:\w+:)?loc\b[^>]*>([^<]+)<\/(?:\w+:)?loc>/g)].map(m => decode(m[1].trim()));
    if (/<(?:\w+:)?sitemapindex\b/.test(t.body)) queue.push(...locs);
    else if (/<(?:\w+:)?urlset\b/.test(t.body)) urls.push(...locs);
    else problems.push('INVALID_SITEMAP_XML: ' + url);
  }
  if (!urls.length) problems.push('EMPTY_SITEMAP');
  if (urls.length !== new Set(urls).size) problems.push('DUPLICATE_SITEMAP_URLS');
  const validUrls = [...new Set(urls)].filter(url => {
    try { const u = new URL(url); if (u.origin === SITE && !u.search && !u.hash && !u.username && !u.password) return true; } catch {}
    problems.push('SITEMAP_URL_HOST_OR_FORMAT: ' + url); return false;
  });
  if (expectedSitemap.length) {
    const expected = new Set(expectedSitemap), actual = new Set(validUrls);
    for (const u of expected) if (!actual.has(u)) problems.push('SITEMAP_MISSING_FROM_PRODUCTION: ' + u);
    for (const u of actual) if (!expected.has(u)) problems.push('SITEMAP_NOT_IN_RELEASE: ' + u);
  }
  let checked = 0;
  const sitemapResults = await pool(validUrls, async url => {
    const trace = await traceUrl(url, { fetchImpl });
    const result = evaluateCase(trace, { name: url, category: 'sitemap', finalUrl: url, status: 200, maxRedirects: 0 }, home);
    if (++checked % 40 === 0) onProgress(`Production sitemap: ${checked}/${validUrls.length} URLs checked.`);
    return result;
  });
  const already = new Map([...results, ...sitemapResults].map(r => [r.url, r]));
  const observations = [];
  for (const route of observationUrls) {
    const url = SITE + route;
    observations.push(already.get(url) || evaluateCase(await traceUrl(url, { fetchImpl }), { name:route, category:'observation', finalUrl:url, status:200, maxRedirects:0 }, home));
  }
  const redirects = await pool(legacyRules, async rule => evaluateCase(await traceUrl(SITE + rule.source, { fetchImpl }), {name:rule.source, category:'legacy-regression', finalUrl:SITE + rule.target, status:200, redirect:true, maxRedirects:1}, home));
  const robots = await traceUrl(SITE + '/robots.txt', { fetchImpl });
  const robotsFailures = [];
  if (robots.error || robots.finalStatus !== 200 || robots.redirects) robotsFailures.push('ROBOTS_FETCH');
  if (!robots.body.includes('Sitemap: ' + SITE + '/sitemap-index.xml')) robotsFailures.push('ROBOTS_SITEMAP_REFERENCE');
  if (/^\s*Disallow:\s*\/\s*$/mi.test(robots.body)) robotsFailures.push('ROBOTS_DISALLOW_ALL');
  const all = [...results, ...sitemapResults, ...observations, ...redirects];
  const failed = all.filter(r => !r.pass);
  const pass = failed.length === 0 && problems.length === 0 && robotsFailures.length === 0;
  return { acceptedExceptions: acceptHttpWwwTwoHops ? ["34.8: user-authorized maximum two permanent hops for HTTP-www; final host, path, query and all other checks unchanged"] : [], schemaVersion:1, startedAt, finishedAt:new Date().toISOString(), origin:SITE, method:'Live GET with manual redirects; all published sitemap URLs; random nonce each run', nonce, pass, status:pass?'PASS':'FAIL', summary:{cases:results.length,sitemapUrls:urls.length,sitemapChecked:sitemapResults.length,legacyRules:redirects.length,observationUrls:observations.length,failedChecks:failed.length,documentErrors:problems.length,robotsErrors:robotsFailures.length}, cases:results, sitemap:{documents,problems,urls:sitemapResults}, legacy:redirects, observations, robots:{...robots,body:undefined,pass:!robotsFailures.length,failures:robotsFailures}, failures:failed.map(r=>({url:r.url,failures:r.failures})) };
}

export function readLegacyRules(text) {
  return text.split(/\r?\n/).map(l=>l.trim().split(/\s+/)).filter(([a,b,c])=>a?.startsWith('/') && b?.startsWith('/') && ['301','308'].includes(c)).map(([source,target,status])=>({source,target,status:Number(status)}));
}

export function writeHttpReport(report, directory = path.join(APP_ROOT, 'reports/seo-release')) {
  fs.mkdirSync(directory, { recursive:true });
  fs.writeFileSync(path.join(directory,'production-http-latest.json'), JSON.stringify(report,null,2)+'\n');
  const clean = v => String(v ?? 'UNKNOWN').replaceAll('|',' / ');
  const rows = [...report.cases,...report.legacy,...report.sitemap.urls];
  fs.writeFileSync(path.join(directory,'production-http-latest.md'), [
    '# Production HTTP Integrity', '', 'Accepted exceptions: '+JSON.stringify(report.acceptedExceptions ?? []), '', `Status: **${report.status}** · ${report.finishedAt} · ${SITE}`, '',
    `Sitemap: ${report.summary.sitemapChecked}/${report.summary.sitemapUrls}; legacy rules: ${report.summary.legacyRules}; failed checks: ${report.summary.failedChecks}.`, '',
    '| URL | Initial | Chain | Final | Final URL | Canonical | Result |', '|---|---|---|---|---|---|---|',
    ...rows.map(r=>'| '+[r.url,r.initialStatus,r.chain.map(h=>h.status).join(' → '),r.finalStatus,r.finalUrl,r.canonical.join(', '),r.pass?'PASS':r.failures.join(', ')].map(clean).join(' | ')+' |'), '',
    'Sitemap errors: '+JSON.stringify(report.sitemap.problems), 'Robots errors: '+JSON.stringify(report.robots.failures), ''
  ].join('\n'));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const watchFile = path.join(REPO_ROOT,'reports/seo-cockpit/visibility-34.7-evidence/monitoring-plan.json');
  const observationUrls = JSON.parse(fs.readFileSync(watchFile,'utf8')).urls;
  const expectedSitemap = sitemapUrls();
  const legacyRules = readLegacyRules(fs.readFileSync(path.join(APP_ROOT,'public/_redirects'),'utf8'));
  const policy = JSON.parse(fs.readFileSync(path.join(APP_ROOT,'config/production-http-policy.json'),'utf8'));
  const report = await runProductionHttpGate({expectedSitemap,legacyRules,observationUrls,onProgress:console.log,acceptHttpWwwTwoHops:policy.acceptHttpWwwTwoHops === true});
  writeHttpReport(report);
  console.log(`Production HTTP Integrity: ${report.status}; ${report.summary.failedChecks} failed URL checks, ${report.summary.documentErrors} sitemap errors.`);
  process.exitCode = report.pass ? 0 : 1;
}

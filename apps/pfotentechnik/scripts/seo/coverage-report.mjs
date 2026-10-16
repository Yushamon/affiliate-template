import fs from 'node:fs';
import path from 'node:path';

export function coverageRecommendation(row) {
  if (row.live?.error) return { priority: 'P1', action: 'HTTP-Prüfung wiederholen; Netzwerkfehler ist kein belegter Seitenfehler.' };
  if (row.live?.status >= 400) return { priority: 'P0', action: `Live-HTTP ${row.live.status} prüfen; Build und Hosting/Redirect-Konfiguration abgleichen.` };
  if (!row.targetBuildExists) return { priority: 'P1', action: 'Historische URL fachlich zuordnen; nur bei belegtem Nachfolger gezielten Redirect einrichten, sonst 404/410 beibehalten.' };
  if (row.redirectLoop || (row.live?.status === 200 && row.live.finalUrl && row.live.finalUrl !== row.targetUrl)) return { priority: 'P1', action: 'Redirect-Ziel weicht vom erwarteten aktuellen Ziel ab; Hosting-Regeln und Kette gezielt prüfen.' };
  if (row.noindex || !row.canonical || row.canonical !== row.targetUrl) return { priority: 'P1', action: 'Canonical-/noindex-Absicht am Ziel prüfen; nur unbeabsichtigte Indexierungssperre korrigieren.' };
  if (row.live?.noindex || (row.live?.canonical && row.live.canonical !== row.targetUrl) || (row.live?.status === 200 && row.live.canonical === null)) return { priority: 'P1', action: 'Abweichende Live-Canonical-/Robots-Signale mit dem aktuellen Build abgleichen.' };
  if (row.variant !== 'current-canonical') return { priority: 'P2', action: 'Historische Variante nicht zur Indexierung einreichen; Weiterleitung und kanonisches Ziel beibehalten bzw. Live-Abweichung prüfen.' };
  if (!row.targetInSitemap) return { priority: 'P2', action: 'Sitemap-Ausschluss am aktuellen Ziel prüfen; keine automatische Aufnahme.' };
  if (!row.incomingHtmlLinks || row.clickDepth === null) return { priority: 'P2', action: 'Fehlende HTML-Erreichbarkeit im bestehenden Themenbereich redaktionell prüfen; keine pauschale Verlinkung.' };
  return { priority: 'P3', action: 'Kein technischer Indexierungsblocker nachgewiesen. Google-Status beobachten und bei Bedarf einzelne URL prüfen; keine pauschale Content- oder Metadatenänderung.' };
}

export async function inspectHttp(url, fetcher = fetch) {
  const chain = []; const seen = new Set(); let current = url;
  try {
    for (let i = 0; i < 8; i++) {
      if (seen.has(current)) throw new Error('Redirect loop');
      seen.add(current);
      const response = await fetcher(current, { redirect: 'manual', signal: AbortSignal.timeout(15000), headers: { 'User-Agent': 'PfotenTechnik-Technical-SEO-Audit/1.0' } });
      const location = response.headers.get('location');
      chain.push({ url: current, status: response.status, location });
      if ([301,302,303,307,308].includes(response.status) && location) {
        await response.body?.cancel();
        const next = new URL(location, current);
        if (!['pfotentechnik.de','www.pfotentechnik.de'].includes(next.hostname)) throw new Error('External redirect: ' + next.href);
        current = next.href; continue;
      }
      const html = await response.text();
      const attr = (tag, name) => tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, 'i'))?.[1] ?? '';
      const canonicalTag = [...html.matchAll(/<link\b[^>]*>/gi)].find(m => attr(m[0], 'rel') === 'canonical');
      const robots = [...html.matchAll(/<meta\b[^>]*>/gi)].filter(m => ['robots','googlebot'].includes(attr(m[0], 'name').toLowerCase())).map(m => attr(m[0], 'content')).join(',');
      const xRobotsTag = response.headers.get('x-robots-tag') ?? '';
      return { checkedAt: new Date().toISOString(), initialStatus: chain[0].status, status: response.status, finalUrl: current, chain,
        canonical: canonicalTag ? new URL(attr(canonicalTag[0], 'href'), current).href : null, robots, xRobotsTag, noindex: /\b(noindex|none)\b/i.test(robots + ',' + xRobotsTag) };
    }
    throw new Error('Too many redirects');
  } catch (error) { return { checkedAt: new Date().toISOString(), error: error.message, chain, status: null }; }
}

export async function writeCoverageReport({ input, outputRoot, pages, redirects, resolveRedirect, normalizeRoute, live = false, httpCacheFile }) {
  const imported = JSON.parse(fs.readFileSync(input, 'utf8'));
  const inputs = imported.exports.flatMap(item => item.rows);
  const byRoute = new Map(pages.map(page => [page.route, page]));
  // Count actual HTML anchors, including footer links; exclude admin and self-links.
  const incoming = new Map(); const exactIncoming = new Map(); const adjacency = new Map();
  for (const page of pages.filter(page => !page.route.startsWith('/admin/') && !page.noindex)) {
    if (page.file) {
      const html = fs.readFileSync(page.file, 'utf8').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
      for (const match of html.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi)) {
        try {
          const href = new URL(match[1].replace(/&amp;/g, '&'), 'https://pfotentechnik.de' + page.route);
          href.hash = '';
          if (!['pfotentechnik.de','www.pfotentechnik.de'].includes(href.hostname) || href.href === 'https://pfotentechnik.de' + page.route) continue;
          if (!exactIncoming.has(href.href)) exactIncoming.set(href.href,new Set());
          exactIncoming.get(href.href).add(page.route);
        } catch { /* Invalid links are not crawlable edges. */ }
      }
    }
    const targets = page.fullLinks.filter(target => byRoute.has(target) && target !== page.route);
    adjacency.set(page.route, targets);
    for (const target of targets) { if (!incoming.has(target)) incoming.set(target, new Set()); incoming.get(target).add(page.route); }
  }
  const depths = new Map([['/', 0]]); const queue = ['/'];
  for (let i = 0; i < queue.length; i++) for (const target of adjacency.get(queue[i]) ?? []) {
    if (!depths.has(target)) { depths.set(target, depths.get(queue[i]) + 1); queue.push(target); }
  }
  const cache = httpCacheFile && fs.existsSync(httpCacheFile) ? JSON.parse(fs.readFileSync(httpCacheFile,'utf8')) : {};
  if (live) {
    const urls = [...new Set(inputs.map(row => row.url))]; let next = 0;
    await Promise.all(Array.from({ length: 4 }, async () => {
      while (next < urls.length) { const url = urls[next++]; cache[url] = await inspectHttp(url); }
    }));
    if (httpCacheFile) { fs.mkdirSync(path.dirname(httpCacheFile), {recursive:true}); fs.writeFileSync(httpCacheFile, JSON.stringify(cache,null,2)); }
  }
  const rows = inputs.map(item => {
    const route = normalizeRoute(item.url); const resolved = resolveRedirect(route, redirects);
    const page = byRoute.get(route); const target = byRoute.get(resolved.target);
    const targetUrl = 'https://pfotentechnik.de' + resolved.target;
    const row = { ...item, route, pageType: target?.role ?? (route.startsWith('/produkt/') ? 'product' : 'historical-or-unknown'),
      variant: resolved.chain.length ? 'historical-redirect' : target && item.url === target.canonical ? 'current-canonical' : target ? 'url-variant' : 'not-in-current-build',
      buildExists: !!page, targetBuildExists: !!target, configuredStatus: redirects.get(route)?.status ?? null,
      redirectTarget: resolved.chain.length ? targetUrl : null, redirectLoop: resolved.loop, targetUrl,
      canonical: target?.canonical ?? null, robots: target?.robots ?? null, noindex: target?.noindex ?? null,
      inSitemap: !!page?.inSitemap && item.url === page.canonical, targetInSitemap: !!target?.inSitemap,
      incomingHtmlLinks: incoming.get(route)?.size ?? 0, incomingSources: [...(incoming.get(route) ?? [])].sort(), clickDepth: depths.get(route) ?? null,
      exactUrlIncomingHtmlLinks: exactIncoming.get(item.url)?.size ?? 0,
      exactUrlIncomingSources: [...(exactIncoming.get(item.url) ?? [])].sort(),
      targetIncomingHtmlLinks: incoming.get(resolved.target)?.size ?? 0, targetClickDepth: depths.get(resolved.target) ?? null,
      live: cache[item.url] ?? { status: null, error: 'Not checked; use --coverage-live' } };
    return { ...row, ...coverageRecommendation(row) };
  }).sort((a,b) => a.priority.localeCompare(b.priority) || a.url.localeCompare(b.url));
  const counts = Object.fromEntries(['P0','P1','P2','P3'].map(p => [p, rows.filter(r=>r.priority===p).length]));
  const report = { generatedAt: new Date().toISOString(), exports: imported.exports.map(({rows,...item})=>item), count: rows.length, uniqueUrls: new Set(rows.map(r=>r.url)).size, priorities: counts, rows };
  fs.mkdirSync(outputRoot,{recursive:true});
  fs.writeFileSync(path.join(outputRoot,'google-coverage.json'),JSON.stringify(report,null,2)+'\n');
  const lines = ['# Google-Coverage-Audit', '', `${rows.length} Exportzeilen; ${report.uniqueUrls} eindeutige URLs. ${Object.entries(counts).map(([p,n])=>`${p}: ${n}`).join(' · ')}.`, '',
    'Google-Status stammt aus den Exporten, nicht aus einer erneuten URL-Inspection. Build-Daten und gemessene Live-HTTP-Ergebnisse sind getrennt. Ein vorhandenes HTML-Dokument beweist keinen HTTP-200-Status. Klicktiefe und incomingHtmlLinks beziehen sich auf den normalisierten Pfad; exactUrlIncomingHtmlLinks zählt dagegen Links auf die konkrete Export-URL einschließlich Host/Slash. Gezählt werden eindeutige Quellseiten. Klicktiefe: kürzester HTML-Linkpfad ab Startseite, inklusive Navigation/Footer, ohne Admin/noindex-Quellseiten. Null bedeutet unerreichbar. Historische Ziele werden separat ausgewiesen.', '',
    'P3: Bei diesen aktuellen URLs ist kein technischer Blocker nachgewiesen. Keine pauschale Änderung; Google-Status beobachten. Alle Einzelbefunde einschließlich Google-Status, Linkquellen und HTTP-Kette stehen in google-coverage.json.', '',
    '| Priorität | URL | Handlung |','|---|---|---|', ...rows.filter(row=>row.priority!=='P3').map(row=>`| ${row.priority} | ${row.url} | ${row.action} |`)];
  fs.writeFileSync(path.join(outputRoot,'google-coverage.md'),lines.join('\n')+'\n');
  console.log(JSON.stringify({count:report.count,uniqueUrls:report.uniqueUrls,priorities:counts,outputRoot}));
  return report;
}

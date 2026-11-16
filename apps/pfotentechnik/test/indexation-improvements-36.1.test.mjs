import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';import {gunzipSync} from 'node:zlib';
import {app,sha,inspectHtml,sourceInventory,scanBuild} from '../scripts/indexation/scan.mjs';
import {parseCsv,loadGscEvidence} from '../scripts/indexation/evidence.mjs';
import {buildIndexationModel,robotsBlocks,contentSimilarity} from '../scripts/indexation/model.mjs';
import {verifyIndexation} from '../scripts/indexation/verify.mjs';
import {approvedIndexationChanges} from '../scripts/indexation/approved-changes.mjs';
import {loadIndexation} from '../src/lib/seo/loadIndexation.mjs';
const root=path.join(app,'research/indexation-improvements-36.1'),baseline=JSON.parse(gunzipSync(fs.readFileSync(path.join(root,'baseline.json.gz'))));

test('36.1: Original-Exporte per SHA verifiziert; aktueller API-Status wird nicht erfunden',()=>{
 const e=loadGscEvidence();assert.equal(e.access.clientPresent,false);assert.equal(e.access.tokenPresent,false);assert.equal(e.access.apiCalled,false);
 assert.equal(e.coverageSources.length,3);assert.equal(e.performance.exportDate,'2026-11-16');assert.equal(e.performance.period.endDate,'2026-11-14');assert.equal(e.performance.pageQueriesAvailable,false);assert.deepEqual(e.performance.pageQueries,[]);
 for(const row of e.indexation.values()){assert.equal(row.observedAt,'2026-11-02');assert.equal(row.googleSelectedCanonical,null);assert.notEqual(row.lastCrawl,'1970-01-01')}
 assert.equal(e.indexation.get('https://pfotentechnik.de/produkt/mova-suretrack-pro/'),undefined);
});

test('36.1: CSV-Parser wahrt gequotete Felder und Unicode',()=>{
 assert.deepEqual(parseCsv('URL,Text\r\n"https://example.com/a,b/","A ""Zitat"", ä"\r\n'),[{URL:'https://example.com/a,b/',Text:'A "Zitat", ä'}]);
 assert.throws(()=>parseCsv('A\n"offen'));
});

test('36.1: Navigation, wiederholte Anker und automatische Module zählen nicht als unabhängige Kontextquellen',()=>{
 const html='<html><head><link rel="canonical" href="https://pfotentechnik.de/a/"></head><body><nav><a href="/x/">Nav</a></nav><main><p><a href="/b/">Passendes Modell</a></p><div class="related-articles"><p><a href="/c/">Automatik</a></p></div><script>document.write("Unbelegt")</script></main><footer><a href="/d/">Footer</a></footer></body></html>';
 const s=inspectHtml(html,'/a/');assert.deepEqual(s.links.filter(l=>l.contextual).map(l=>l.target),['/b/']);assert.doesNotMatch(s.mainText,/Unbelegt/);
});

test('36.1: Robots-Gruppen, längere Allow-Regeln und Googlebot werden berücksichtigt',()=>{
 const robots='User-agent: *\nDisallow: /privat/\nAllow: /privat/frei/\n';
 assert.equal(robotsBlocks(robots,'/privat/a/'),true);assert.equal(robotsBlocks(robots,'/privat/frei/a/'),false);assert.equal(robotsBlocks(robots,'/produkt/a/'),false);
 assert.equal(robotsBlocks('User-agent: bingbot\nDisallow: /\nUser-agent: *\nAllow: /','/'),false);
 assert.equal(robotsBlocks('User-agent: *\nAllow: /\nUser-agent: Googlebot\nDisallow: /x/','/x/'),true);
});

test('36.1: alle 110 Produktdateien und 20 geschützten Seiten bleiben erhalten',async()=>{
 const current=new Map(sourceInventory().map(s=>[s.file,s]));let products=0;
 for(const source of baseline.sources.filter(s=>s.collection==='products')){assert.equal(current.get(source.file)?.sha256,source.sha256,source.file);products++}
 assert.equal(products,110);
 const result=await verifyIndexation();assert.equal(result.htmlEquivalent,20);assert.equal(result.incomingEdges,205);assert.equal(result.explicitLinks,12);
});

test('36.1: sechs enge Inhaltsausnahmen, bestehende Linkziele erhalten und alle neuen Ziele im Haupttext',()=>{
 const approved=approvedIndexationChanges();assert.equal(approved.size,6);
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'changes.json'))),snapshot=scanBuild();
 for(const c of manifest.changes){assert.ok(!Object.keys(baseline.protectedHtml).includes(c.route));const before=baseline.pages.find(p=>p.route===c.route),after=snapshot.pages.find(p=>p.route===c.route);
  for(const target of c.addedTargets){assert.ok(after.links.some(l=>l.contextual&&l.target===target));assert.ok(!before.links.some(l=>l.contextual&&l.target===target),`${c.route}: Link war bereits vorhanden`)}
 }
 const source=fs.readFileSync(path.join(app,'src/content/pages/futterautomat-katze.md'),'utf8');assert.doesNotMatch(source,/Ein Ausgabeprotokoll sagt nur, dass Futter bereitgestellt wurde/);assert.match(source,/kein sicherer Nachweis einer tatsächlichen Ausgabe/);
});

test('36.1: alle Canonicals behalten Robots/Sitemap, Status und serverseitigen Hauptinhalt',()=>{
 const model=buildIndexationModel();assert.equal(model.pages.length,269);assert.equal(model.summary.sitemap,268);assert.equal(model.summary.technicalIssues,0);assert.deepEqual(model.brokenInternalLinks,[]);
 for(const p of model.pages){assert.equal(p.http.status,200);assert.deepEqual(p.http.canonical,[p.url]);assert.equal(p.http.redirects,0);assert.ok(p.mainText.length);assert.deepEqual(p.schemaErrors,[]);assert.equal(p.pageQueries,null)}
 assert.equal(model.pages.find(p=>p.route==='/foundation/').sitemapIncluded,false);
 assert.equal(model.liveHttp.redirectCases.length,3);for(const r of model.liveHttp.redirectCases){assert.equal(r.initialStatus,301);assert.equal(r.redirects,r.url==='http://www.pfotentechnik.de/'?2:1);assert.equal(r.finalStatus,200)}
});

test('36.1: Vorher/Nachher zeigt nur belegte Kontextverbesserungen und historische Indexquellen',()=>{
 const m=buildIndexationModel();assert.equal(m.addedContext.length,12);assert.equal(m.summary.zeroContextProducts,0);
 assert.ok(m.summary.productsWithoutHistoricallyIndexedContext<m.baselineSummary.productsWithoutHistoricallyIndexedContext);
 for(const a of m.addedContext)assert.equal(a.sourceHistoricallyIndexed,true);
 const dog=m.pages.find(p=>p.route==='/produkt/tractive-dog-6/'),xl=m.pages.find(p=>p.route==='/produkt/tractive-dog-6-xl/');assert.notDeepEqual(dog.valueReview.productSpecifications,xl.valueReview.productSpecifications);
});

test('36.1: Ähnlichkeit ist ein nachvollziehbarer Prüfhinweis, kein automatischer SEO-Eingriff',()=>{
 const base={blocks:['Ein vollständig eigener Text zur Katzenfütterung'],type:'guide',cluster:'futter'};
 const result=contentSimilarity([{route:'/a/',...base},{route:'/b/',...base}]);assert.equal(result.pairs[0].similarity,1);
 const report=JSON.parse(fs.readFileSync(path.join(app,'reports/indexation-improvements-36.1.json')));assert.ok(report.overlaps.length);assert.ok(report.overlaps.every(p=>p.automatic===false));assert.equal(report.topTenRemaining.length,10);assert.ok(report.technicalProblems.some(p=>p.issues.includes('HOST_REDIRECT_CHAIN')));assert.equal(report.safeguards.newPublicCanonicals,0);
});

test('36.1: Indexierungsansicht im vorhandenen Cockpit enthält Provenienz und Experiment-Schutz',()=>{
 const d=loadIndexation();assert.equal(d.rows.length,269);assert.equal(d.rows.filter(r=>r.protected).length,20);assert.equal(d.gsc.apiAvailable,false);assert.equal(d.phase,'after-build');
 const html=fs.readFileSync(path.join(app,'dist/admin/seo/cockpit/index.html'),'utf8');assert.match(html,/<section[^>]*data-indexation-overview/);assert.equal([...html.matchAll(/<tr[^>]+data-indexation-row/g)].length,269);assert.match(html,/2026-11-02/);assert.match(html,/Keine URL-Query-Paare/);assert.match(html,/noindex/);
 const source=fs.readFileSync(path.join(app,'src/pages/admin/seo/cockpit.astro'),'utf8');assert.match(source,/<IndexationOverview/);
});

test('36.1: Report und Änderungen sind reproduzierbar, Baseline wird nicht überschrieben',()=>{
 execFileSync(process.execPath,['scripts/indexation/apply.mjs'],{cwd:app,stdio:'pipe'});
 execFileSync(process.execPath,['scripts/indexation/report.mjs','--check'],{cwd:app,stdio:'pipe'});
 assert.throws(()=>execFileSync(process.execPath,['scripts/indexation/capture.mjs'],{cwd:app,stdio:'pipe'}));
});

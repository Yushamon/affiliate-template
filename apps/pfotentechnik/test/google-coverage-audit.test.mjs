import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { inspectHttp, coverageRecommendation, writeCoverageReport } from '../scripts/seo/coverage-report.mjs';

test('live HTTP keeps initial status, redirect chain, canonical and header noindex separate',async()=>{
  const calls=[];
  const result=await inspectHttp('https://pfotentechnik.de/old/',async(url)=>{
    calls.push(url);return calls.length===1 ? new Response(null,{status:301,headers:{location:'/new/'}})
      : new Response('<link href="https://pfotentechnik.de/new/" rel="canonical">',{headers:{'x-robots-tag':'noindex'}});
  });
  assert.equal(result.initialStatus,301);assert.equal(result.status,200);
  assert.equal(result.finalUrl,'https://pfotentechnik.de/new/');assert.equal(result.noindex,true);assert.equal(result.chain.length,2);
});
test('network failures and redirect loops are unknown, never fabricated HTTP 404',async()=>{
  const network=await inspectHttp('https://pfotentechnik.de/',async()=>{throw new Error('offline');});
  assert.equal(network.status,null);assert.equal(network.error,'offline');
  const loop=await inspectHttp('https://pfotentechnik.de/',async()=>new Response(null,{status:301,headers:{location:'/'}}));
  assert.match(loop.error,/loop/);
});
test('coverage reuses inventory, distinguishes old target and counts actual HTML reachability',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pt-coverage-'));
  try {
    const input=path.join(dir,'input.json'); const cache=path.join(dir,'http.json');
    const urls=['https://pfotentechnik.de/new/','https://pfotentechnik.de/old/','https://pfotentechnik.de/missing/'];
    fs.writeFileSync(input,JSON.stringify({exports:[{count:3,rows:urls.map(url=>({url,googleStatus:'Gefunden – zurzeit nicht indexiert'}))}]}));
    fs.writeFileSync(cache,JSON.stringify(Object.fromEntries(urls.map(url=>[url,{status:url.endsWith('/missing/')?404:200}]))));
    const homepage=path.join(dir,'index.html');
    fs.writeFileSync(homepage,'<a href="/new/">Current</a><script>const fake = `<a href="/old/">not a link</a>`;</script>');
    const pages=[{route:'/',file:homepage,canonical:'https://pfotentechnik.de/',inSitemap:true,fullLinks:['/new/'],noindex:false},
      {route:'/new/',canonical:urls[0],inSitemap:true,fullLinks:[],noindex:false,robots:'index,follow',role:'product'}];
    const report=await writeCoverageReport({input,outputRoot:dir,pages,redirects:new Map([['/old/',{status:301}]]),
      normalizeRoute:url=>new URL(url).pathname,resolveRedirect:route=>({target:route==='/old/'?'/new/':route,chain:route==='/old/'?['/old/']:[],loop:false}),httpCacheFile:cache});
    const current=report.rows.find(r=>r.url===urls[0]);const old=report.rows.find(r=>r.url===urls[1]);
    assert.equal(current.clickDepth,1);assert.equal(current.incomingHtmlLinks,1);assert.equal(current.priority,'P3');
    assert.equal(current.exactUrlIncomingHtmlLinks,1);assert.equal(old.exactUrlIncomingHtmlLinks,0);
    assert.equal(old.buildExists,false);assert.equal(old.targetBuildExists,true);assert.equal(old.variant,'historical-redirect');assert.equal(old.inSitemap,false);
    assert.equal(report.rows.find(r=>r.url===urls[2]).priority,'P0');
  } finally { fs.rmSync(dir,{recursive:true,force:true}); }
});
test('network uncertainty is an inspection action rather than a content recommendation',()=>{
  assert.match(coverageRecommendation({live:{error:'timeout'}}).action,/Netzwerkfehler/);
});

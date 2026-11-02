import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {readLegacyRules,traceUrl,evaluateCase} from '../scripts/seo/production-http-integrity.mjs';
const suffixes=['fuer-berufstaetige','fuer-hunde','fuer-katzen','fuer-kleine-hunde','fuer-mehrtierhaushalte','fuer-nassfutter','fuer-seniorenkatzen','fuer-welpen','fuer-zwei-katzen','mit-akku','mit-edelstahl-napf','mit-kamera','ohne-wlan','unter-100-euro'];
const rules=readLegacyRules(fs.readFileSync(new URL('../public/_redirects',import.meta.url),'utf8'));
const site='https://pfotentechnik.de';
// 3dc09874 truncated these 14 canonicals; b07f68d7 records their exact intended destinations.
for(const suffix of suffixes) test(`historical canonical -${suffix} recovers its exact comparison in one permanent hop`,async()=>{
 const target=`/vergleiche/beste-futterautomaten-${suffix}/`;
 assert.ok(fs.existsSync(new URL(`../src/content/comparisons/beste-futterautomaten-${suffix}.md`,import.meta.url)));
 assert.equal(rules.some(r=>r.source===target),false,'target must not redirect again');
 for(const tail of ['', '/']){
  const source=`/vergleiche/-${suffix}${tail}`;
  const matches=rules.filter(r=>r.source===source);
  assert.equal(matches.length,1);assert.equal(matches[0].target,target);assert.equal(matches[0].status,301);
  // Exercise the real tracer/evaluator against a transport using the checked-in redirect map.
  const trace=await traceUrl(site+source,{fetchImpl:async value=>{
   const path=new URL(value).pathname;const r=rules.find(r=>r.source===path);
   if(r)return new Response('',{status:r.status,headers:{location:r.target}});
   assert.equal(path,target);
   return new Response(`<link rel="canonical" href="${site}${target}"><meta name="robots" content="index,follow">`);
  }});
  assert.equal(evaluateCase(trace,{finalUrl:site+target,status:200,redirect:true,maxRedirects:1}).pass,true);
 }
});

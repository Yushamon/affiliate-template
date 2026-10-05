import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import {mapProductToAdvisor,isFeederAdvisorProduct} from '../src/domain/advisor/mapProduct.ts';
import {recommendAdvisorProducts,priorityMatch} from '../src/domain/advisor/recommendProducts.ts';
import {parseAdvisorAnswers,serializeAdvisorAnswers} from '../src/domain/advisor/urlState.ts';
import {advisorEntries} from '../src/domain/advisor/entries.ts';
import {structuredState,readiness} from '../scripts/advisor/data-coverage.mjs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const entry=(filters={},extra={})=>({id:'fixture.md',data:{title:'Hund Katze Kamera Mikrochip offline',description:'Für alle Katzen und Hunde',recommendation:'Für Mehrkatzenhaushalte',rating:4,score:80,decision:{bestFor:[],attention:[]},strengths:['Offline'],weaknesses:[],features:['Mikrochip'],category:{key:'futterautomaten'},comparisonFilters:filters,...extra}});
const answers={pet:'cat',petCount:'one',food:'dry',priorities:[],budget:'open',decisionStyle:'best-match'};
const run=(p,a={})=>recommendAdvisorProducts([mapProductToAdvisor(p)],{...answers,...a})[0];

test('structured species overrides conflicting marketing copy; explicit mismatch excludes',()=>{
 const result=run(entry({animal:['dog'],foodType:['dry']}));
 assert.equal(result.fit,'none');assert.match(result.exclusions.join(' '),/Katzen.*nicht unterstützt/);
 assert.equal(run(entry({animal:['cat'],foodType:['dry']})).exclusions.length,0);
});
test('missing species and food stay unknown, not unsupported, with limited fit',()=>{
 const result=run(entry());assert.equal(result.exclusions.length,0);assert.equal(result.fit,'limited');
 assert.match(result.cautions.join(' '),/Katzen.*nicht ausreichend dokumentiert/);
 assert.match(result.cautions.join(' '),/Trockenfutter.*nicht ausreichend dokumentiert/);
});
test('unknown microchip does not exclude; explicit open access does',()=>{
 const a={priorities:['microchip']};assert.equal(run(entry(),a).exclusions.length,0);
 assert.ok(run(entry({access:'open'}),a).exclusions.some(x=>x.includes('Mikrochip')));
 assert.equal(priorityMatch(mapProductToAdvisor(entry()),'microchip'),'unknown');
});
test('hard food mismatch excludes, mixed partial preserves caution',()=>{
 assert.equal(run(entry({foodType:['wet']})).fit,'none');
 const mixed=run(entry({foodType:['dry']}),{food:'mixed'});
 assert.equal(mixed.exclusions.length,0);assert.ok(mixed.cautions.some(x=>x.includes('teilweise')));
});
test('mapping preserves false, missing, arrays, capability partial and category references',()=>{
 const p=mapProductToAdvisor(entry({animal:['cat'],petSize:['small'],foodType:['dry'],app:false,camera:true,access:'open',backupPower:false},{multiPet:{sharedUse:'partial',individualAccess:'unknown'},failureModes:{internetOutage:{status:'partial',functions:{localSchedule:'supported'}}}}));
 assert.deepEqual(p.common.animals,{status:'known',value:['cat']});assert.deepEqual(p.common.petSizes.value,['small']);
 assert.equal(p.common.app,'unavailable');assert.equal(p.common.camera,'supported');assert.equal(p.common.backupPower,'unavailable');
 assert.equal(p.common.offlineSchedule,'supported');assert.equal(p.common.failureModes.internetOutage,'partial');assert.equal(p.common.multiPet.sharedUse,'partial');
 const gps=mapProductToAdvisor(entry({animal:['cat']},{category:{key:'gps-tracker'},gps:{animal:['dog'],deviceWeightGrams:50,subscriptionRequired:false}}));
 assert.deepEqual(gps.common.animals.value,['dog']);assert.equal(gps.common.foodTypes.status,'notApplicable');assert.equal(gps.specific.gps.subscriptionRequired,false);
});
test('overall outage support and prose never prove an offline schedule or feature',()=>{
 const p=mapProductToAdvisor(entry({}, {failureModes:{internetOutage:{status:'supported',behavior:'Schedule supported'}}}));
 for(const priority of ['offline','camera','app','backup','microchip','simple'])assert.equal(priorityMatch(p,priority),'unknown');
 const p2=mapProductToAdvisor(entry({}, {failureModes:{internetOutage:{status:'partial',functions:{localSchedule:'partial'}}}}));
 assert.equal(priorityMatch(p2,'offline'),'partial');
});
test('marketing text changes cannot change recommendations or hard eligibility',()=>{
 const a=entry({animal:['cat'],foodType:['dry']});const b=structuredClone(a);
 Object.assign(b.data,{title:'Nur Hund',description:'Katzen ungeeignet',recommendation:'Hund Kamera App offline Mikrochip',strengths:['Notstrom'],features:['Kamera']});
 const select=r=>({score:r.score,fit:r.fit,reasons:r.reasons,cautions:r.cautions,exclusions:r.exclusions});
 assert.deepEqual(select(run(a,{priorities:['camera','offline']})),select(run(b,{priorities:['camera','offline']})));
});
test('price affects personal fit only and affiliate availability never affects suitability',()=>{
 const p=entry({animal:['cat'],foodType:['dry']},{priceCategory:'budget'});const q=structuredClone(p);q.data.affiliateAvailable=true;
 assert.equal(run(p).score,run(q).score);run(p,{budget:'budget'});assert.equal(p.data.score,80);
});
test('shared feeder selection supports actual category key and excludes archived products',()=>{
 assert.equal(isFeederAdvisorProduct(entry()),true);
 assert.equal(isFeederAdvisorProduct(entry({}, {recommendationStatus:'archived'})),false);
 assert.equal(isFeederAdvisorProduct(entry({}, {category:{key:'trinkbrunnen'}})),false);
 assert.equal(run(entry({}, {category:{key:'trinkbrunnen'}})).fit,'none');
});
test('legacy alias uses existing HTTP 301 redirect infrastructure, no duplicate page or engine',()=>{
 for(const alias of ['/futterautomat-berater','/futterautomat-berater/'])assert.ok(read('public/_redirects').split('\n').includes(`${alias} /berater/futterautomat/ 301`));
 assert.equal(fs.existsSync(new URL('../src/pages/futterautomat-berater.astro',import.meta.url)),false);
 assert.equal(fs.existsSync(new URL('../src/components/advisor/FeederAdvisor.astro',import.meta.url)),false);
 assert.match(read('src/pages/berater/futterautomat.astro'),/<PetAdvisor/);
 assert.doesNotMatch(read('src/components/category/CategoryExperience.astro'),/href="\/futterautomat-berater\//);
});
test('six problem entries have existing non-redirect canonical owners',()=>{
 assert.equal(advisorEntries.length,6);assert.equal(new Set(advisorEntries.map(x=>x.world)).size,6);
 for(const e of advisorEntries){
  const route=e.href.slice(1,-1);
  assert.ok(['src/pages/'+route+'.astro','src/content/pages/'+route+'.md'].some(p=>fs.existsSync(new URL('../'+p,import.meta.url))),e.href);
  assert.equal(read('public/_redirects').split('\n').some(l=>l.startsWith(e.href+' ')),false);
 }
 assert.match(read('src/pages/kaufberatung.astro'),/advisorEntries\.map/);
});
test('URL state roundtrip keeps existing answers and rejects malformed values',()=>{
 const a={...answers,priorities:['microchip','offline']};assert.deepEqual(parseAdvisorAnswers(serializeAdvisorAnswers(a)),a);
 assert.equal(parseAdvisorAnswers(new URLSearchParams('pet=fish')),null);
});
test('coverage rejects prose and counts explicit false separately from unknown',()=>{
 assert.equal(structuredState('Ja'),'unknown');assert.equal(structuredState(false),'known');
 assert.equal(structuredState([],'array'),'unknown');assert.equal(structuredState('unknown','capability'),'unknown');
 assert.equal(structuredState('partial','capability'),'partial');
 assert.equal(readiness([{a:'known'},{a:'unknown'}],['a']),'PARTIAL');
 assert.equal(readiness([{a:'unknown'}],['a']),'NOT_READY');
 assert.equal(readiness([{a:'known'}],['a']),'READY');
});

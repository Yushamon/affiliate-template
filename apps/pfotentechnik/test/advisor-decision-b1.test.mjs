import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import yaml from 'js-yaml';
import { recommendAdvisorProducts, decisionResultState } from '../src/domain/advisor/recommendProducts.ts';
import { createAdvisorSession, advisorComparisonLink } from '../src/domain/advisor/decisionSession.ts';
import { mapDecisionProduct, isDecisionAdvisorProduct } from '../src/domain/advisor/decisionProduct.ts';
import { parseDecisionAnswers, serializeDecisionAnswers } from '../src/domain/advisor/urlState.ts';
import { advisorEntries } from '../src/domain/advisor/entries.ts';
const gps = { category: 'gps', pet: 'cat', weight: 4, subscription: 'yes', priorities: [] };
const fountain = { category: 'fountain', pet: 'cat', material: 'any', cordless: 'any', priorities: [] };
const known = value => ({status:'known',value});
const unknown = {status:'unknown'};
const product = (id, facts={}, category='gps-tracker', score=80) => ({id,slug:id,title:id,category,score,recommendationStatus:'recommended',route:`/produkt/${id}/`,decisionFacts:{animal:known(['cat','dog']),minimumWeight:known(3),subscription:known(true),...facts}});
const run = (products, a=gps) => recommendAdvisorProducts(products, createAdvisorSession(a));

test('hard pass, contradiction and UNKNOWN are independent of editorial score',()=>{
 const matches=run([product('unknown',{minimumWeight:unknown},'gps-tracker',100),product('fail',{minimumWeight:known(5)},'gps-tracker',100),product('pass',{},'gps-tracker',1)]);
 assert.deepEqual(matches.map(m=>[m.product.slug,m.status]),[['pass','pass'],['unknown','possible'],['fail','unsupported']]);
 assert.equal(matches[1].unknowns.length,1);
});
test('preferences mismatch and UNKNOWN never exclude or earn positive preference matches',()=>{
 for(const state of [known(false),unknown]){
  const m=run([product('p',{live:state})],{...gps,priorities:['live']})[0];
  assert.equal(m.status,'pass');assert.deepEqual(m.preferenceMatches,[]);
 }
 const m=run([product('p',{live:known(true),minimumWeight:known(5)})],{...gps,priorities:['live']})[0];
 assert.equal(m.status,'unsupported');assert.equal(decisionResultState([m]).visible.length,0);
});
test('GPS species, weight equality, missing manufacturer minimum and subscription decisions',()=>{
 assert.equal(run([product('p',{animal:known(['dog'])})])[0].status,'unsupported');
 assert.equal(run([product('p',{minimumWeight:known(4)})])[0].status,'pass');
 assert.equal(run([product('p',{minimumWeight:unknown,deviceWeight:known(20)})])[0].status,'possible');
 assert.equal(run([product('p')],{...gps,subscription:'no'})[0].status,'unsupported');
 assert.equal(run([product('p',{subscription:unknown})],{...gps,subscription:'any'})[0].status,'pass');
});
test('battery/light preferences compare only known eligible models, unknown never earns a match',()=>{
 const models=[product('long',{batteryDays:known(30),deviceWeight:known(20)}),product('short',{batteryDays:known(5),deviceWeight:known(60)}),product('unknown',{batteryDays:unknown,deviceWeight:unknown},'gps-tracker',100),product('ineligible',{batteryDays:known(1000),minimumWeight:known(8)})];
 const matches=run(models,{...gps,priorities:['battery','light']});
 assert.equal(matches[0].product.id,'long');assert.equal(matches[0].preferenceMatches.length,2);
 assert.deepEqual(matches.find(m=>m.product.id==='unknown').preferenceMatches,[]);
});
test('PASS stays ahead of POSSIBLE even with more fulfilled preferences',()=>{
 const matches=run([product('possible',{minimumWeight:unknown,live:known(true)}),product('pass',{live:known(false)})],{...gps,priorities:['live']});
 assert.equal(matches[0].product.id,'pass');
});
test('editorial recommendability precedes existing score after preferences; price and affiliate have no effect',()=>{
 const a=product('a',{},'gps-tracker',40),b={...product('b',{},'gps-tracker',100),recommendationStatus:'limited'};
 assert.equal(run([b,a])[0].product.id,'a');
 const order=ps=>run(ps).map(m=>m.product.id);
 assert.deepEqual(order([a,b]),order([{...a,price:{current:9999},affiliateAvailable:false,priceCategory:'premium'},{...b,price:{current:1},affiliateAvailable:true,priceCategory:'budget'}]));
 assert.equal(a.score,40);
});
test('fountain mains contradicts required cordless; unknown power is possible',()=>{
 const matches=run([product('mains',{cordless:known(false)},'trinkbrunnen'),product('unknown',{cordless:unknown},'trinkbrunnen'),product('battery',{cordless:known(true)},'trinkbrunnen')],{...fountain,cordless:'yes'});
 assert.deepEqual(matches.map(m=>m.status),['pass','possible','unsupported']);
});
test('fountain material and multiple pets are preferences; only requested filter-cost preference affects order',()=>{
 const cheap=product('cheap',{steel:known(false),filterCost:known(10),multiPet:unknown},'trinkbrunnen',60);
 const costly=product('costly',{steel:known(true),filterCost:known(70),multiPet:known(false)},'trinkbrunnen',90);
 assert.equal(run([cheap,costly],fountain)[0].product.id,'costly');
 assert.equal(run([cheap,costly],{...fountain,priorities:['costs']})[0].product.id,'cheap');
 assert.equal(run([cheap,costly],{...fountain,material:'steel'})[0].product.id,'costly');
 assert.ok(run([cheap,costly],{...fountain,pet:'multiple'}).every(m=>m.status==='pass'));
});
test('zero PASS displays POSSIBLE and zero results identifies exact editable conflicting requirement',()=>{
 const uncertain=decisionResultState(run([product('p',{minimumWeight:unknown})]));
 assert.equal(uncertain.visible.length,1);assert.match(uncertain.message,/Kein Modell/);assert.equal(uncertain.constraints[0].step,1);
 const none=decisionResultState(run([product('p',{subscription:known(true)})],{...gps,subscription:'no'}));
 assert.match(none.message,/sehr eng/);assert.equal(none.constraints[0].field,'subscription');assert.equal(none.constraints[0].step,2);
});
test('URL roundtrip, malformed state and category-specific preference validation',()=>{
 for(const a of [{...gps,weight:4.25,priorities:['live','light']},{...fountain,pet:'multiple',material:'steel',cordless:'yes',priorities:['costs','capacity']}]) assert.deepEqual(parseDecisionAnswers(serializeDecisionAnswers(a)),a);
 for(const weight of ['','-1','NaN','Infinity'])assert.equal(parseDecisionAnswers(new URLSearchParams(`world=gps&pet=cat&weight=${weight}&subscription=any`)),null);
 assert.equal(parseDecisionAnswers(new URLSearchParams('world=gps&pet=multiple&weight=4&subscription=yes')),null);
 const params=serializeDecisionAnswers(gps);params.set('features','live,live,costs');assert.deepEqual(parseDecisionAnswers(params).priorities,['live']);
});
const sourceDir=new URL('../src/content/products/',import.meta.url);
const foundation=JSON.parse(fs.readFileSync(new URL('../research/fountain-cost-35.0b.json',import.meta.url),'utf8'));
const records=fs.readdirSync(sourceDir).filter(f=>f.endsWith('.md')).map(file=>{
 const data=yaml.load(fs.readFileSync(new URL(file,sourceDir),'utf8').match(/^---\s*\r?\n([\s\S]*?)\r?\n---/)[1],{schema:yaml.JSON_SCHEMA});
 return {id:file,data};
});
const active=records.filter(isDecisionAdvisorProduct);
test('actual active inventory produces recommendations and all product/comparison links exist without redirects',()=>{
 const products=active.map(e=>mapDecisionProduct(e,e.data,foundation.products.find(p=>p.slug===e.data.slug),new Date('2026-10-05')));
 for(const a of [gps,{...gps,pet:'dog',weight:20},{...fountain,cordless:'yes'},fountain]) {
  assert.ok(decisionResultState(run(products,a)).visible.length>0);
  const link=advisorComparisonLink(a);assert.ok(fs.existsSync(new URL(`../src/content/comparisons/${link.split('/')[2]}.md`,import.meta.url)),link);
 }
 for(const p of products)assert.ok(fs.existsSync(new URL(p.slug+'.md',sourceDir)),p.route);
 for(const e of advisorEntries)assert.ok(fs.existsSync(new URL(`../src/pages/${e.href.split('?')[0].slice(1,-1)}.astro`,import.meta.url))||fs.existsSync(new URL(`../src/content/pages/${e.href.slice(1,-1)}.md`,import.meta.url)),e.href);
});
test('mapping never infers minimum weight or missing feature false from schema defaults',()=>{
 const entry=records.find(e=>e.data.category.key==='gps-tracker');
 const raw={...entry.data,gps:{animal:['cat'],deviceWeightGrams:30,subscriptionRequired:false}};
 const p=mapDecisionProduct({...entry,data:{...entry.data,gps:{...raw.gps,liveTracking:false}}},raw);
 assert.equal(p.decisionFacts.minimumWeight.status,'unknown');assert.equal(p.decisionFacts.live.status,'unknown');assert.equal(p.decisionFacts.subscription.value,false);
});
test('mapping preserves mixed material descriptions and treats contradictory power as UNKNOWN',()=>{
 const entry=records.find(e=>e.data.category.key==='trinkbrunnen');
 const data={...entry.data,comparisonData:{fountain:{material:['ABS-Tank mit Edelstahl-Trinkfläche'],powerType:known('mains'),battery:true}}};
 const p=mapDecisionProduct({...entry,data},data);
 assert.equal(p.decisionFacts.cordless.status,'unknown');assert.equal(p.decisionFacts.steel.value,true);assert.match(p.decisionCautions.join(' '),/widersprechen/);assert.match(p.decisionCautions.join(' '),/ABS-Tank/);
});
test('existing explicit unknown wins over research fallback and conflicting known records stay possible',()=>{
 const entry=records.find(e=>e.data.category.key==='trinkbrunnen');
 const data={...entry.data,comparisonData:{fountain:{powerType:unknown}}};
 const record={data:{comparisonData:{fountain:{powerType:known('battery')}}}};
 assert.equal(mapDecisionProduct({...entry,data},data,record).decisionFacts.cordless.status,'unknown');
 data.comparisonData.fountain.powerType=known('mains');
 assert.equal(mapDecisionProduct({...entry,data},data,record).decisionFacts.cordless.status,'unknown');
});

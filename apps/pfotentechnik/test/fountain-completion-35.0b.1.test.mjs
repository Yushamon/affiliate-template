import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {analyzeCompletion} from '../scripts/product-evidence/fountain-completion-report.mjs';
import {readDataset,inspectDataset} from '../scripts/product-evidence/fountain-dataset.mjs';
const data=readDataset();
const baseline=JSON.parse(fs.readFileSync(new URL('../../../reports/seo-cockpit/fountain-cost-35.0b.1-evidence/baseline-dataset.json',import.meta.url),'utf8'));
test('completion preserves all eleven previously calculable records and changes only gap targets',()=>{
 const a=analyzeCompletion(data), targets=new Set(a.cases.map(r=>r.slug));assert.equal(targets.size,13);
 for(const r of data.products)if(!targets.has(r.slug))assert.deepEqual(r,baseline.products.find(b=>b.slug===r.slug));
 assert.deepEqual(a.errors,[]);assert.equal(a.statistics.coverage.after,15);
});
test('mandatory, optional, filterless and unknown partition the inventory without zero imputation',()=>{
 const a=analyzeCompletion();assert.equal(Object.values(a.statistics.filterStructure).reduce((a,b)=>a+b),24);
 assert.equal(a.statistics.coverage.mandatoryCalculable,6);assert.equal(a.statistics.coverage.mandatoryDenominator,6);
 const ultra=a.productRows.find(r=>r.slug==='petkit-eversweet-ultra');assert.equal(ultra.cost.annualCostLow,null);assert.equal(ultra.filterStructure,'NO_CONVENTIONAL_MAIN_FILTER');
 const unknown=a.productRows.find(r=>r.slug==='xiaomi-smart-pet-fountain-2');assert.equal(unknown.cost.mandatory,null);assert.equal(unknown.annualCostSemantic,'conditionalAnnualMainFilterCost');
});
test('new costs fail closed when exact offer is unavailable or its pack tuple is corrupted',()=>{
 for(const slug of ['cat-mate-shell-fountain','xiaomi-smart-pet-fountain-2','petsafe-streamside-trinkbrunnen','petkit-eversweet-max-2-uvc']){
  const d=structuredClone(data),r=d.products.find(r=>r.slug===slug),c=r.data.consumables[0],o=c.offers.find(o=>o.id===r.representativeOfferIds[c.id]);o.availability='out-of-stock';
  assert.notEqual(inspectDataset(d).rows.find(r=>r.slug===slug).annualFilterCost.status,'calculated');
  c.packSize.value=999;assert.equal(inspectDataset(d).status,'FAIL');
 }
});
test('new manual facts do not bypass unresolved EU identity and PW14 interval conflict',()=>{
 const a=analyzeCompletion();for(const slug of ['oneisall-2-2l-cordless-fountain','oneisall-3-2l-cordless-fountain','oneisall-3-5l-cordless-fountain'])assert.equal(a.productRows.find(r=>r.slug===slug).cost.status,'insufficientData');
 assert.equal(data.products.find(r=>r.slug==='oneisall-3-2l-cordless-fountain').data.consumables[0].replacementInterval.status,'unknown');
});
test('available plain merchant offers cannot imply affiliate readiness or full TCO comparability',()=>{
 const a=analyzeCompletion();assert.equal(a.statistics.commerce.productsWithAvailableFilterOffer,16);assert.equal(a.statistics.commerce.affiliateReadyFilterOffers,0);assert.equal(a.readiness.affiliateLevel,'NO');
 for(const r of a.productRows){assert.notEqual(r.comparability,'FULLY_COMPARABLE');assert.equal(r.completeRecurringCost.status,'insufficientData');}
});

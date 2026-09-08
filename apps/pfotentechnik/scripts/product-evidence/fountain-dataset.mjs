import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {costFoundationSchema} from '../../src/content/schema/consumables.mjs';
import {calculateConsumableCost} from '../../src/domain/consumableCosts.mjs';
const root=fileURLToPath(new URL('../../../../',import.meta.url));
export const datasetPath=path.join(root,'apps/pfotentechnik/research/fountain-cost-35.0b.json');
export const readDataset=()=>JSON.parse(fs.readFileSync(datasetPath,'utf8'));
const known=x=>x?.status==='known'?x.value:undefined;
const state=x=>x?.status??'unknown';
export function inspectDataset(dataset, now=dataset.asOf) {
 const scope=JSON.parse(fs.readFileSync(path.join(root,dataset.scopeSource),'utf8')).products;
 const errors=[];
 const slugs=dataset.products.map(x=>x.slug);
 if(slugs.length!==24 || new Set(slugs).size!==24 || scope.some(x=>!slugs.includes(x.slug))) errors.push('Scope must equal the exact 24 products from 35.0A');
 const rows=dataset.products.map(r=>{
  const p=r.data, primary=p.consumables.find(x=>x.type==='filter');
  const valid=costFoundationSchema.safeParse(p);
  if(!valid.success)errors.push(...valid.error.issues.map(x=>r.slug+': '+x.path.join('.')+' '+x.message));
  if(p.slug!==r.slug || scope.find(x=>x.slug===r.slug)?.priority!==r.priority)errors.push(r.slug+': identity/priority mismatch');
  if(!r.research.identity.sourceUrls.length)errors.push(r.slug+': identity evidence missing');
  const calculations=p.consumables.map(item=>({id:item.id,type:item.type,name:item.name,...calculateConsumableCost({product:p,consumableId:item.id,offerId:r.representativeOfferIds[item.id],now})}));
  if(calculations.some(c=>c.status==='invalidData'))errors.push(r.slug+': invalid calculation');
  for(const s of r.research.offerSelection){
   const c=p.consumables.find(c=>c.id===s.consumableId),o=c?.offers.find(o=>o.id===s.offerId);
   if(!o || known(c.packSize)!==s.packSize || o.price.current!==s.price || o.availability!==s.availability)errors.push(r.slug+': price/pack selection mismatch');
   const v=s.variantEvidence;
   if(s.variantId && (!v || v.variantId!==s.variantId || v.priceEUR!==s.price || v.packSize!==s.packSize || v.available!==(o.availability==='available')))errors.push(r.slug+': variant tuple mismatch');
  }
  if(r.research.identity.status==='unresolvedEU' && p.consumables.some(c=>c.offers.length))errors.push(r.slug+': unresolved EU identity has commerce');
  const annual=primary?calculations.find(c=>c.id===primary.id):{status:'notApplicable',annualCostLow:null,annualCostHigh:null,reasons:['noConventionalFilter; otherConsumablesNotZero']};
  const selected=primary?.offers.find(o=>o.id===r.representativeOfferIds[primary.id]);
  const fresh=selected && +new Date(now)>=+new Date(selected.price.checkedAt) && +new Date(now)-+new Date(selected.price.checkedAt)<=30*86400000;
  const dependency=p.consumables.some(x=>known(x.required)===true&&known(x.dependency)==='proprietary')?'A':p.consumables.some(x=>known(x.required)===false&&known(x.dependency)==='proprietary')?'B':p.consumables.some(x=>known(x.dependency)==='generic')?'C':known(p.consumablePolicy.filterlessOperationPossible)===true?'D':'E';
  const pump=p.repairability.parts.find(x=>x.type==='pump');
  const pumpAvailable=pump?.status==='supported'&&pump.offers.some(o=>o.availability==='available');
  const fields={
   filterRequired:known(p.consumablePolicy.filterPresent)===false?'known':state(primary?.required),
   filterlessOperationPossible:state(p.consumablePolicy.filterlessOperationPossible),
   filterType:primary?state(primary.filterType):'notApplicable',replacementInterval:primary?state(primary.replacementInterval):'notApplicable',packSize:primary?state(primary.packSize):'notApplicable',
   currentFilterOffer:!primary?'notApplicable':fresh&&selected.availability==='available'&&selected.price.current>0?'known':'unknown',
   annualFilterCost:annual.status==='calculated'?'known':annual.status==='notApplicable'?'notApplicable':'unknown',
   proprietaryDependency:dependency==='E'?'unknown':'known',replacementPumpAvailability:pumpAvailable||pump?.status==='unavailable'?'known':'unknown'
  };
  return {slug:r.slug,priority:r.priority,identityStatus:r.research.identity.status,filterPresent:known(p.consumablePolicy.filterPresent)??null,filterRequired:known(p.consumablePolicy.filterPresent)===false?false:known(primary?.required)??null,filterlessOperationPossible:known(p.consumablePolicy.filterlessOperationPossible)??null,proprietaryDependency:dependency,fields,annualFilterCost:annual,calculations,pumpAvailability:pumpAvailable?'AVAILABLE':pump?.status==='unavailable'?'NOT_AVAILABLE':'UNKNOWN',pumpListed:!!pump?.officialPart,pumpOffers:pump?.offers??[],completeRecurringCost:{status:'insufficientData',value:null,reasons:['complete inventory and/or required flags/other consumable costs unresolved; primary filter is not total ownership cost']},conflicts:r.research.conflicts};
 });
 const fields=Object.fromEntries(Object.keys(rows[0]?.fields??{}).map(f=>{
  const counts={known:0,unknown:0,notApplicable:0};for(const r of rows)counts[r.fields[f]]++;
  return [f,{...counts,total:24,coveragePercent:counts.known/24*100,resolvedPercent:(counts.known+counts.notApplicable)/24*100}];
 }));
 const costs=rows.filter(r=>r.annualFilterCost.status==='calculated');
 const median=a=>{a=[...a].sort((a,b)=>a-b);return a.length%2?a[(a.length-1)/2]:(a[a.length/2-1]+a[a.length/2])/2;};
 const stats={products:24,filterPresent:rows.filter(r=>r.filterPresent===true).length,filterRequired:rows.filter(r=>r.filterRequired===true).length,filterlessConfirmed:rows.filter(r=>r.filterlessOperationPossible===true).length,proprietaryRequired:rows.filter(r=>r.proprietaryDependency==='A').length,genericConfirmed:rows.filter(r=>r.proprietaryDependency==='C').length,calculablePrimaryFilterCosts:costs.length,insufficientData:rows.filter(r=>r.annualFilterCost.status==='insufficientData').length,notApplicable:rows.filter(r=>r.annualFilterCost.status==='notApplicable').length,pumpsAvailable:rows.filter(r=>r.pumpAvailability==='AVAILABLE').length,pumpsUnavailableConfirmed:rows.filter(r=>r.pumpAvailability==='NOT_AVAILABLE').length,pumpsUnknown:rows.filter(r=>r.pumpAvailability==='UNKNOWN').length,inventoryWideCostStatistics:null,subset:costs.length?{n:costs.length,min:Math.min(...costs.map(r=>r.annualFilterCost.annualCostLow)),max:Math.max(...costs.map(r=>r.annualFilterCost.annualCostHigh)),medianBounds:{low:median(costs.map(r=>r.annualFilterCost.annualCostLow)),high:median(costs.map(r=>r.annualFilterCost.annualCostHigh))},fixedInterval:costs.filter(r=>r.annualFilterCost.annualCostLow===r.annualFilterCost.annualCostHigh).length,intervalBased:costs.filter(r=>r.annualFilterCost.annualCostLow!==r.annualFilterCost.annualCostHigh).length}:null,method:'Only calculated primary-filter observations, not whole stock or complete mandatory recurring cost. Independent medians of low/high endpoints; no midpoint substitution. Shared accessory families are correlated. No quartiles or representative inventory claims at current incomplete coverage.'};
 return {batch:'35.0B',asOf:now,status:errors.length?'FAIL':'PASS',errors,rows,fields,statistics:stats,overallKnownCoveragePercent:100*Object.values(fields).reduce((a,b)=>a+b.known,0)/(24*Object.keys(fields).length)};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const result=inspectDataset(readDataset());console.log(JSON.stringify({status:result.status,errors:result.errors,fields:result.fields,statistics:result.statistics},null,2));if(result.errors.length)process.exitCode=1;
}

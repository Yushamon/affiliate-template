import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import yaml from 'js-yaml';
import {costFoundationSchema, accessoryOfferSchema} from '../src/content/schema/consumables.mjs';
import {calculateConsumableCost as calc, calculateThreeYearCost as tco} from '../src/domain/consumableCosts.mjs';
import {normalizeResearchStore} from '../src/lib/seo/research/schema.ts';
const now = '2026-09-08T12:00:00Z';
const known = value => ({status:'known',value});
const offer = (id='store',current=19.99,currency='EUR') => ({id,price:{current,currency,checkedAt:now,source:{id,label:id,type:'merchant',url:'https://example.com/'+id}},priceState:'available',availability:'available'});
function fixture() {
 const product={slug:'fixture-fountain',consumablePolicy:{inventoryComplete:known(true)},consumables:[{id:'filter-pack',type:'filter',name:'Fixture filter pack',required:known(true),dependency:known('proprietary'),packSize:known(8),replacementInterval:known({minDays:14,maxDays:30}),compatibility:known(['fixture-fountain']),offers:[offer(),offer('manufacturer',24)]}],evidenceSources:[]};
 source(product,'consumablePolicy.inventoryComplete');
 for (const k of ['required','dependency','packSize','replacementInterval','compatibility']) source(product,'consumables.0.'+k);
 return product;
}
function source(p,field,type='manufacturer') {p.evidenceSources.push({source:'Synthetic test source',url:'https://example.com/manual',accessedAt:now,assertion:'Test fixture, not real research',fields:[field],sourceType:type});}
const args = p => ({product:p,consumableId:'filter-pack',offerId:'store',now});
const close = (a,b) => assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);
test('fixed interval uses 365 days',()=>{const p=fixture();p.consumables[0].replacementInterval=known({minDays:30,maxDays:30});const c=calc(args(p));assert.equal(c.status,'calculated');close(c.annualCostLow,19.99/8*365/30);assert.equal(c.annualCostLow,c.annualCostHigh);});
test('interval span is ordered low=max days, high=min days',()=>{const c=calc(args(fixture()));close(c.annualCostLow,30.40145833333333);close(c.annualCostHigh,65.14598214285714);});
test('pack size greater than one, no intermediate rounding',()=>{const c=calc(args(fixture()));assert.equal(c.unitCost,2.49875);assert.notEqual(c.annualCostLow,Math.round(c.annualCostLow*100)/100);assert.equal(c.unitCost.toFixed(2),'2.50');close(c.threeYearConsumableCost.low,c.annualCostLow*3);});
for (const field of ['packSize','replacementInterval']) test('missing '+field+' is insufficient',()=>{const p=fixture();delete p.consumables[0][field];const c=calc(args(p));assert.equal(c.status,'insufficientData');assert.equal(c.annualCostLow,null);});
test('missing price is not zero',()=>{const p=fixture();p.consumables[0].offers[0].price.current=null;assert.equal(calc(args(p)).status,'insufficientData');});
test('filterless needs explicit complete inventory before zero mandatory costs',()=>{const p=fixture();p.consumables=[];p.consumablePolicy.filterlessOperationPossible=known(true);source(p,'consumablePolicy.filterlessOperationPossible');assert.equal(calc(args(p)).status,'insufficientData');assert.equal(tco({product:p,purchaseOffer:offer('device',100),now}).threeYearCost.low,100);delete p.consumablePolicy.inventoryComplete;assert.equal(tco({product:p,purchaseOffer:offer('device',100),now}).status,'insufficientData');});
test('optional filters retain their cost but are excluded from mandatory TCO',()=>{const p=fixture();p.consumables[0].required=known(false);assert.equal(calc(args(p)).mandatory,false);const c=tco({product:p,purchaseOffer:offer('device',100),offerIds:{'filter-pack':'store'},now});assert.equal(c.threeYearCost.low,100);assert.equal(c.optional.length,1);assert.equal(c.optional[0].calculation.status,'calculated');});
test('unknown requirement differs from known false',()=>{const p=fixture();p.consumables[0].required={status:'unknown'};assert.equal(calc(args(p)).mandatory,null);assert.equal(tco({product:p,purchaseOffer:offer('device',100),now}).status,'insufficientData');});
test('explicit merchant selection and price changes update result',()=>{const p=fixture();const a=calc(args(p));const b=calc({...args(p),offerId:'manufacturer'});assert.ok(b.annualCostLow>a.annualCostLow);p.consumables[0].offers[0].price.current=39.98;close(calc(args(p)).annualCostLow,2*a.annualCostLow);assert.equal(calc({...args(p),offerId:undefined}).status,'insufficientData');});
for (const [name,mutate] of [
 ['zero pack',p=>p.consumables[0].packSize=known(0)],['negative pack',p=>p.consumables[0].packSize=known(-2)],['fractional pack',p=>p.consumables[0].packSize=known(1.5)],
 ['negative price',p=>p.consumables[0].offers[0].price.current=-1],['zero price',p=>p.consumables[0].offers[0].price.current=0],
 ['zero interval',p=>p.consumables[0].replacementInterval=known({minDays:0,maxDays:30})],['negative interval',p=>p.consumables[0].replacementInterval=known({minDays:-1,maxDays:30})],['reversed interval',p=>p.consumables[0].replacementInterval=known({minDays:31,maxDays:30})],['infinite price',p=>p.consumables[0].offers[0].price.current=Infinity]
]) test('rejects '+name,()=>{const p=fixture();mutate(p);assert.equal(calc(args(p)).status,'invalidData');});
test('calculated provenance reconstructs price, interval and timestamp',()=>{const c=calc(args(fixture()));const i=c.provenance.inputs;assert.equal(c.provenance.sourceType,'calculated');close(i.packPrice/i.packSize*365/i.maxDays,c.annualCostLow);assert.equal(c.provenance.priceTimestamp,now.replace('Z','.000Z'));assert.ok(c.provenance.evidence.length);assert.equal(c.provenance.offerId,'store');});
test('replacement part without price valid and excluded from TCO',()=>{const p=fixture();p.repairability={parts:[{type:'pump',status:'unknown',detail:'Unknown',id:'pump',compatibility:{status:'unknown'}}]};assert.equal(costFoundationSchema.safeParse(p).success,true);const a=tco({product:p,purchaseOffer:offer('device',100),offerIds:{'filter-pack':'store'},now});p.repairability.parts[0].offers=[offer('pump',999)];assert.deepEqual(tco({product:p,purchaseOffer:offer('device',100),offerIds:{'filter-pack':'store'},now}).threeYearCost,a.threeYearCost);});
test('generic vs proprietary vs unknown dependency preserved without score',()=>{const p=fixture();for(const dependency of [known('generic'),known('proprietary'),{status:'unknown'}]){p.consumables[0].dependency=dependency;assert.deepEqual(costFoundationSchema.parse(p).consumables[0].dependency,dependency);}});
test('notApplicable interval does not become zero',()=>{const p=fixture();p.consumables[0].replacementInterval={status:'notApplicable'};const c=calc(args(p));assert.equal(c.status,'notApplicable');assert.equal(c.annualCostLow,null);});
test('missing and calculated-only research evidence rejected',()=>{const p=fixture();p.evidenceSources=[];assert.equal(calc(args(p)).status,'invalidData');source(p,'consumables.0.packSize','calculated');assert.equal(calc(args(p)).status,'invalidData');});
test('manufacturer interval cannot be sourced only to aggregated user reports',()=>{const p=fixture();p.evidenceSources.find(s=>s.fields.includes('consumables.0.replacementInterval')).sourceType='aggregatedUserReports';assert.equal(calc(args(p)).status,'invalidData');});
test('stale, future and unavailable prices never generate costs',()=>{for(const date of ['2026-01-01','2027-01-01']){const p=fixture();p.consumables[0].offers[0].price.checkedAt=date;assert.equal(calc(args(p)).status,'insufficientData');}const p=fixture();p.consumables[0].offers[0].priceState='stale';assert.equal(calc(args(p)).status,'insufficientData');});
test('currency mismatch cannot produce mixed-currency TCO',()=>{assert.equal(tco({product:fixture(),purchaseOffer:offer('device',100,'USD'),offerIds:{'filter-pack':'store'},now}).status,'insufficientData');});
test('compatibility and offer IDs cannot be guessed',()=>{const p=fixture();p.consumables[0].compatibility=known(['other-product']);assert.equal(calc(args(p)).status,'insufficientData');p.consumables[0].offers.push(offer());assert.equal(costFoundationSchema.safeParse(p).success,false);});
test('merchant-neutral offers reuse price and affiliate model',()=>{const o=offer('fressnapf');o.affiliate={provider:'partner-network',url:'https://example.com/affiliate'};assert.equal(accessoryOfferSchema.parse(o).affiliate.rel,'sponsored nofollow noopener');assert.equal(accessoryOfferSchema.safeParse({...o,affiliate:{url:'javascript:alert(1)'}}).success,false);});
test('research imports preserve provenance category and field paths',()=>{const item={id:'test',type:'product',title:'Test',priority:50,confidence:50,reason:'Fixture',actions:[],evidence:[{source:'Manual',url:'https://example.com',note:'Fixture',sourceType:'manual',fields:['consumables.0.packSize']}]};const r=normalizeResearchStore({items:[item]});assert.equal(r.items[0].evidence[0].sourceType,'manual');assert.deepEqual(r.items[0].evidence[0].fields,['consumables.0.packSize']);});
test('all existing product frontmatter remains valid without new placeholders',()=>{const dir=new URL('../src/content/products/',import.meta.url);let count=0;for(const name of fs.readdirSync(dir).filter(n=>/\.mdx?$/.test(n))){const raw=fs.readFileSync(new URL(name,dir),'utf8');const data=yaml.load(raw.match(/^---\s*\n([\s\S]*?)\n---/)[1],{schema:yaml.JSON_SCHEMA});const parsed=costFoundationSchema.safeParse(data);assert.equal(parsed.success,true,name+': '+JSON.stringify(parsed.error?.issues));count++;}assert.ok(count>100);});

test('actual product collection schema validates old and new commerce/evidence fields',async()=>{
 const {build}=await import('esbuild');
 const result=await build({entryPoints:[new URL('../src/content/schema/product.ts',import.meta.url).pathname],bundle:true,write:false,platform:'node',format:'esm',plugins:[{name:'astro-collection-declarations',setup(b){b.onResolve({filter:/^astro:(content|loaders)$/},a=>({path:a.path,namespace:'collection-stub'}));b.onResolve({filter:/^astro\/loaders$/},a=>({path:a.path,namespace:'collection-stub'}));b.onLoad({filter:/.*/,namespace:'collection-stub'},()=>({contents:'export const defineCollection = x => x; export const glob = x => x;',loader:'js'}));}}]});
 const {createProductContentSchema}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
 const {z}=await import('astro/zod');const schema=createProductContentSchema(()=>z.any());
 const dir=new URL('../src/content/products/',import.meta.url);
 for(const file of fs.readdirSync(dir).filter(n=>/\.mdx?$/.test(n))){const raw=fs.readFileSync(new URL(file,dir),'utf8');const d=yaml.load(raw.match(/^---\s*\n([\s\S]*?)\n---/)[1],{schema:yaml.JSON_SCHEMA});const v=schema.safeParse(d);assert.equal(v.success,true,file+': '+JSON.stringify(v.error?.issues));}
 const raw=fs.readFileSync(new URL('petlibro-stainless-steel-fountain.md',dir),'utf8');const d=yaml.load(raw.match(/^---\s*\n([\s\S]*?)\n---/)[1],{schema:yaml.JSON_SCHEMA});const f=fixture();Object.assign(d,{consumables:f.consumables,consumablePolicy:f.consumablePolicy,evidenceSources:f.evidenceSources});
 const good=schema.safeParse(d);assert.equal(good.success,true,JSON.stringify(good.error?.issues));assert.equal(good.data.consumables[0].offers.length,2);
 d.consumables[0].packSize=known(0);assert.equal(schema.safeParse(d).success,false);
});

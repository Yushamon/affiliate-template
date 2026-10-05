import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import yaml from 'js-yaml';
import {mapProductToAdvisor} from '../../src/domain/advisor/mapProduct.ts';
import {readDataset, inspectDataset} from '../product-evidence/fountain-dataset.mjs';

const app = fileURLToPath(new URL('../../', import.meta.url));
const at = (data, key) => key.split('.').reduce((v, k) => v?.[k], data);
const unknown = 'unknown';
const states = ['known', 'partial', 'unknown', 'notApplicable'];
export function structuredState(value, kind = 'boolean') {
  if (value?.status === 'unknown' || value == null) return unknown;
  if (value?.status === 'notApplicable') return 'notApplicable';
  if (value?.status === 'known') return structuredState(value.value, kind);
  if (kind === 'capability') return ['supported','unavailable'].includes(value) ? 'known' : ['partial','conditional'].includes(value) ? 'partial' : value === 'notApplicable' ? value : unknown;
  if (kind === 'number') return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? 'known' : unknown;
  if (kind === 'array') return Array.isArray(value) && value.length && value.every(v => typeof v === 'string' && v !== 'unknown') ? 'known' : unknown;
  return typeof value === 'boolean' ? 'known' : unknown;
}
const field = (source, kind = 'boolean') => ({source, read: p => structuredState(at(p.data, source), kind)});
const common = (key, kind = 'capability') => ({source: `Advisor common.${key} (explicit product fields only)`, read: p => structuredState(at(p.mapped.common, key), kind)});
const modes = ['powerOutage','wifiOutage','internetOutage','cloudOutage','mechanicalBlock'];
const failure = Object.fromEntries(modes.map(key => [`failureModes.${key}`, field(`failureModes.${key}.status`, 'capability')]));
const animal = common('animals','array');
const identification = {source:'multiPet.identificationMethods',read:p=>structuredState(p.data.multiPet?.identificationMethods,'array')};
const microchip = {source:'multiPet.identificationMethods OR comparisonFilters.access',read:p=>p.data.comparisonFilters?.access ? 'known' : identification.read(p)};
const foundation = (key, kind) => ({source:`research/fountain-cost-35.0b.json: data.${key}`,read:p=>structuredState(at(p.foundation,key),kind)});
export const definitions = {
  feeder: {keys:['futterautomaten','futterautomat'], critical:['animal','foodType','access'], fields:{animal,petSize:common('petSizes','array'),foodType:common('foodTypes','array'),access:{source:'comparisonFilters.access',read:p=>['open','microchip'].includes(p.data.comparisonFilters?.access)?'known':unknown},app:common('app'),camera:common('camera'),backupPower:common('backupPower'),offlineSchedule:common('offlineSchedule'),multiPet:common('multiPet.sharedUse'),...failure}},
  fountain: {keys:['trinkbrunnen'], critical:['animal','capacity','material','filter','power'], fields:{animal,capacity:field('comparisonData.fountain.capacityLiters','number'),material:field('comparisonData.fountain.material','array'),filter:foundation('consumablePolicy.filterPresent','boolean'),filterRequired:{source:'35.0B: primary filter required (no main filter = notApplicable)',read:p=>p.cost?.filterPresent===false?'notApplicable':p.cost?.fields.filterRequired??unknown},filterCost:{source:'35.0B: existing primary-filter cost calculation; 30-day price validity',read:p=>p.cost?.fields.annualFilterCost??unknown},power:foundation('comparisonData.fountain.powerType','power'),battery:field('comparisonData.fountain.battery'),batteryRuntime:foundation('comparisonData.fountain.batteryRuntime','runtime'),offline:field('failureModes.powerOutage.status','capability'),dishwasher:foundation('comparisonData.fountain.dishwasherSafeParts','array'),...failure}},
  gps: {keys:['gps-tracker'],critical:['animal','minimumPetWeight','deviceWeight','subscription','battery','liveTracking','virtualFence'],fields:{animal,minimumPetWeight:field('gps.minimumPetWeightKg','number'),deviceWeight:field('gps.deviceWeightGrams','number'),subscription:field('gps.subscriptionRequired'),battery:field('gps.batteryMaxDays','number'),liveTracking:field('gps.liveTracking'),virtualFence:field('gps.virtualFence'),...failure}},
  catFlap: {keys:['katzenklappen'],critical:['animal','microchip','individualAccess','installation'],fields:{animal,microchip,individualAccess:field('multiPet.individualAccess','capability'),multiPet:field('multiPet.sharedUse','capability'),preyDetection:field('comparisonData.custom.preyDetection'),installation:field('comparisonData.catFlap.installation','array'),...failure}},
  litterBox: {keys:['automatische-katzentoiletten'],critical:['animal','minimumPetWeight','litterCompatibility','multiPet'],fields:{animal,minimumPetWeight:field('sensorLimits.automaticModeMinimumWeightKg','number'),litterCompatibility:{source:'litterCompatibility.status (complete / partial / unknown)',read:p=>p.data.litterCompatibility?.status==='complete'?'known':p.data.litterCompatibility?.status==='partial'?'partial':unknown},multiPet:field('multiPet.sharedUse','capability'),identification,app:common('app'),...failure}},
  camera: {keys:['haustierkameras'],critical:['animal','localStorage','cloud','subscription','detection','nightVision'],fields:{animal,localStorage:field('comparisonData.camera.localStorage'),cloud:field('comparisonData.camera.cloud'),subscription:{source:'subscription.requiredForCoreFunction (status must be documented)',read:p=>p.data.subscription?.status==='unknown'?unknown:structuredState(p.data.subscription?.requiredForCoreFunction)},detection:field('comparisonData.camera.detection'),nightVision:field('comparisonData.camera.nightVision'),...failure}},
  other: {keys:[],critical:['animal'],fields:{animal,...failure}}
};
// Additional accepted structured values; never interpret a descriptive string.
// These requested criteria currently have no typed repository representation.
// Keep the audit slots, but label their absence instead of implying an existing source.
for (const key of ['localStorage','cloud','detection','nightVision']) {
  definitions.camera.fields[key].source = 'No typed camera '+key+' field; descriptive custom/spec strings excluded';
}
definitions.catFlap.fields.installation.source = 'No typed installation compatibility field; descriptive custom/spec strings excluded';
const originalDishwasher = definitions.fountain.fields.dishwasher.read;
definitions.fountain.fields.dishwasher.source += ' OR comparisonData.fountain.dishwasherSafe (boolean)';
definitions.fountain.fields.dishwasher.read = p => {
  const foundationState = originalDishwasher(p);
  return foundationState === 'unknown' ? structuredState(p.data.comparisonData?.fountain?.dishwasherSafe) : foundationState;
};
const originalPower = definitions.fountain.fields.power.read;
definitions.fountain.fields.power.read = p => {
  const v=p.foundation?.comparisonData?.fountain?.powerType;
  return v?.status==='known' && ['mains','battery','mainsAndBattery'].includes(v.value)?'known':originalPower(p);
};
definitions.fountain.fields.batteryRuntime.read = p => {
  const v=p.foundation?.comparisonData?.fountain?.batteryRuntime;
  return v?.status==='known' && typeof v.value?.minDays==='number' && typeof v.value?.maxDays==='number'?'known':v?.status==='notApplicable'?'notApplicable':unknown;
};
const resolved = s => ['known','notApplicable'].includes(s);
export function readiness(rows, critical) {
  if (!rows.length) return 'NOT_READY';
  if (rows.every(r=>critical.every(k=>resolved(r[k])))) return 'READY';
  // A restricted pilot needs at least one record with no unknown critical fact;
  // partial evidence explicitly limits recommendations and never becomes full support.
  if (rows.some(r=>critical.every(k=>resolved(r[k]) || r[k]==='partial'))) return 'PARTIAL';
  return 'NOT_READY';
}
export function buildCoverage(products, {asOf='2026-10-05', fountainDataset=readDataset()}={}) {
  const inspected=inspectDataset(fountainDataset,asOf);
  if(inspected.errors.length) throw new Error(inspected.errors.join('\n'));
  const categories={};
  for(const[world,def]of Object.entries(definitions)){
    const selected=products.filter(data=>world==='other' ? !Object.values(definitions).some(d=>d.keys.includes(data.category?.key)) : def.keys.includes(data.category?.key));
    const rows=selected.map(data=>{
      const p={data,mapped:mapProductToAdvisor({id:data.slug,data}),foundation:fountainDataset.products.find(x=>x.slug===data.slug)?.data,cost:inspected.rows.find(x=>x.slug===data.slug)};
      return {slug:data.slug,productStatus:data.productStatus??'unknown',fields:Object.fromEntries(Object.entries(def.fields).map(([k,f])=>[k,f.read(p)]))};
    });
    const fields=Object.fromEntries(Object.entries(def.fields).map(([key,f])=>{
      const count=Object.fromEntries(states.map(s=>[s,rows.filter(r=>r.fields[key]===s).length]));
      return [key,{source:f.source,...count,coveragePercent:rows.length?Math.round(100*count.known/rows.length):0}];
    }));
    categories[world]={products:rows.length,criticalFields:def.critical,readiness:readiness(rows.map(r=>r.fields),def.critical),fields,rows};
  }
  return {asOf,totalProducts:products.length,criteria:{scope:'All product Markdown records, including inactive; no prose extraction, schema defaults, or marketing heuristics. Supplemental structured fountain research joined by exact slug; not yet a category recommendation module.',coverage:'known / all products; explicit false counts as known. partial, unknown and notApplicable are separate. No inference from comparisonData.custom strings, specs, decision or decisionJourney prose.',readiness:'READY = all products have resolved critical fields. PARTIAL = at least one product has all critical fields known/notApplicable/partial. NOT_READY = none does. Critical fields are declared per category before calculation; operational safety and individual fit still require Phase-B validation.',statusVocabulary:'supported=SUPPORTED, unavailable=UNSUPPORTED, partial=PARTIAL, unknown=UNKNOWN, notApplicable=NOT_APPLICABLE; reuse product capability type, no second enum.'},categories};
}
const nextSteps = {
  feeder: 'Animal data covers all models; food type and access are documented only for a subset, and function-specific offline schedules are missing. Phase B: constrain a pilot to documented food/access combinations and surface other gaps.',
  fountain: 'Structured filter presence covers all models and primary-filter costs cover a subset; capacity, material and power do not yet overlap sufficiently. Phase B: connect the existing fountain research and fill those structural gaps first.',
  gps: 'Animal, weight, subscription, battery, live tracking and virtual fence are broadly structured; minimum animal weight is incomplete. Phase B: a restricted pilot can use documented weight limits and distinguish unverified fit.',
  catFlap: 'Identification and some multi-pet capabilities are structured; installation compatibility is missing as a typed decision field. Phase B: establish installation and individual-access facts before hard recommendations.',
  litterBox: 'Litter compatibility and shared use are mostly documented; automatic-mode minimum weight is structured for only one model. Phase B: limit any pilot to verified safety/weight and litter combinations.',
  camera: 'Subscription data covers most models; storage, cloud dependency, detection and night vision remain mostly descriptive. Phase B: normalize these documented claims before implementing selection.',
  other: 'No products outside the six worlds currently exist.'
};
export function renderCoverage(report){
  const lines=['# Advisor data coverage — Phase A', '',`As of: ${report.asOf}. Products: ${report.totalProducts}.`,'',...Object.values(report.criteria).flatMap(v=>[v,''])];
  for(const[world,c]of Object.entries(report.categories)){
    lines.push(`## ${world}: ${c.readiness}`, '',`Products: ${c.products}. Critical fields: ${c.criticalFields.join(', ')}.`,'','| Field | Known | Coverage | Partial | Unknown | N/A | Structured source |','|---|---:|---:|---:|---:|---:|---|');
    for(const[k,f]of Object.entries(c.fields))lines.push(`| ${k} | ${f.known} | ${f.coveragePercent}% | ${f.partial} | ${f.unknown} | ${f.notApplicable} | ${f.source} |`);
    lines.push('', nextSteps[world], '');
  }
  lines.push('## Phase-B gate','','No additional category recommendation engine is implemented. READY means data coverage only, not medical, safety or product suitability certification. Unknown and partial rows need explicit cautions or a limited pilot. Camera storage/detection prose and cat-flap installation prose must be structured before those modules can make hard decisions. Fountain research already exists separately; wire it into its future module without duplicating the source.','','## Ownership and legacy consolidation','','PetAdvisor and src/domain/advisor are the sole engine. The old FeederAdvisor was mounted only at /berater/futterautomat/. Its wet-food, camera, access, multiple-pet and app/local preferences are covered by PetAdvisor; its portion/large-dog branch did not use product evidence. Portion size, bowl fit, stability, cooling and local programming remain explicit checks rather than unsupported eligibility claims. /futterautomat-berater/ had its own canonical and an internal category link; both slash variants now use the existing public/_redirects HTTP 301 mechanism. The category link points directly to the new owner.','','Existing recommendation tests retain their assertions; fixtures now declare structured animal/access facts instead of relying on prose. The existing redirect-count assertion changes from 68 to 70 because both legacy advisor URL variants are covered. The feeder UI currently selects 31 eligible records; seven archived recommendations remain included in this all-product coverage audit, but are not offered as recommendations.');
  return lines.join('\n')+'\n';
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const dir=path.join(app,'src/content/products');
 const products=fs.readdirSync(dir).filter(f=>/\.mdx?$/.test(f)).sort().map(f=>yaml.load(fs.readFileSync(path.join(dir,f),'utf8').match(/^---\s*\r?\n([\s\S]*?)\r?\n---/)[1],{schema:yaml.JSON_SCHEMA}));
 const report=buildCoverage(products,{asOf:process.argv[2]??new Date().toISOString().slice(0,10)});
 const out=path.join(app,'reports/advisor');fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,'advisor-data-coverage.json'),JSON.stringify(report,null,2)+'\n');
 fs.writeFileSync(path.join(out,'advisor-data-coverage.md'),renderCoverage(report));
 console.log(JSON.stringify(Object.fromEntries(Object.entries(report.categories).map(([k,c])=>[k,{products:c.products,readiness:c.readiness}]))));
}

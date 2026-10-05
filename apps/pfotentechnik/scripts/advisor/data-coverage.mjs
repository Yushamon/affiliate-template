import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import yaml from 'js-yaml';
import {mapProductToAdvisor} from '../../src/domain/advisor/mapProduct.ts';
import {readDataset, inspectDataset} from '../product-evidence/fountain-dataset.mjs';

const app = fileURLToPath(new URL('../../', import.meta.url));
const at = (data, key) => key.split('.').reduce((v, k) => v?.[k], data);
const unknown = 'unknown';
const states = ['known', 'unknown', 'notApplicable', 'missingSchemaData'];
export function structuredState(value, kind = 'boolean') {
  if (value?.status === 'unknown' || value == null) return unknown;
  if (value?.status === 'notApplicable') return 'notApplicable';
  if (value?.status === 'known') return structuredState(value.value, kind);
  if (kind === 'capability') return ['supported','unavailable'].includes(value) ? 'known' : ['partial','conditional'].includes(value) ? 'partial' : value === 'notApplicable' ? value : unknown;
  if (kind === 'number') return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? 'known' : unknown;
  if (kind === 'array') return Array.isArray(value) && value.length && value.every(v => typeof v === 'string' && v !== 'unknown') ? 'known' : unknown;
  return typeof value === 'boolean' ? 'known' : unknown;
}
export function dataState(value, kind = 'boolean') {
  if (value == null) return 'missingSchemaData';
  if (value?.status === 'unknown' || value === 'unknown') return 'unknown';
  if (value?.status === 'notApplicable' || value === 'notApplicable') return 'notApplicable';
  if (value?.status === 'known') {
    if (kind === 'parts' && Array.isArray(value.value)) return 'known';
    return dataState(value.value, kind);
  }
  if (Array.isArray(kind)) return kind.includes(value) ? 'known' : 'unknown';
  if (kind === 'runtime') return typeof value.maxDays === 'number' && value.maxDays > 0 ? 'known' : 'unknown';
  return structuredState(value, kind) === 'known' ? 'known' : 'unknown';
}
const field = (source, kind = 'boolean') => ({source, read: p => dataState(at(p.data, source), kind)});
const commonPaths = {
 animals:['gps.animal','comparisonFilters.animal'], petSizes:['comparisonFilters.petSize'],
 foodTypes:['comparisonFilters.foodType'], app:['comparisonFilters.app','comparisonData.fountain.app'],
 camera:['comparisonFilters.camera','comparisonData.feeder.camera'], backupPower:['comparisonFilters.backupPower'],
 offlineSchedule:['failureModes.internetOutage.functions.localSchedule'], 'multiPet.sharedUse':['multiPet.sharedUse']
};
const common = (key, kind = 'capability') => ({source:commonPaths[key].join(' OR '),read:p=>{
 const values=commonPaths[key].map(path=>at(p.data,path));
 if(values.every(v=>v==null)) return 'missingSchemaData';
 return dataState(at(p.mapped.common,key),kind);
}});
const modes = ['powerOutage','wifiOutage','internetOutage','cloudOutage','mechanicalBlock'];
const failure = Object.fromEntries(modes.map(key => [`failureModes.${key}`, field(`failureModes.${key}.status`, 'capability')]));
const animal = common('animals','array');
const identification = {source:'multiPet.identificationMethods',read:p=>dataState(p.data.multiPet?.identificationMethods,'array')};
const microchip = {source:'multiPet.identificationMethods OR comparisonFilters.access',read:p=>p.data.comparisonFilters?.access ? 'known' : identification.read(p)};
const foundation = (key, kind) => ({source:`research/fountain-cost-35.0b.json: data.${key}`,read:p=>dataState(at(p.data,key) ?? at(p.foundation,key),kind)});
export const definitions = {
  feeder: {keys:['futterautomaten','futterautomat'], critical:['animal','foodType','access'], fields:{animal,petSize:common('petSizes','array'),foodType:common('foodTypes','array'),access:{source:'comparisonFilters.access',read:p=>['open','microchip'].includes(p.data.comparisonFilters?.access)?'known':p.data.comparisonFilters?.access==null?'missingSchemaData':unknown},app:common('app'),camera:common('camera'),backupPower:common('backupPower'),offlineSchedule:common('offlineSchedule'),multiPet:common('multiPet.sharedUse'),...failure}},
  fountain: {keys:['trinkbrunnen'], critical:['animal','capacity','material','filter','power'], fields:{animal,capacity:field('comparisonData.fountain.capacityLiters','number'),material:field('comparisonData.fountain.material','array'),filter:foundation('consumablePolicy.filterPresent','boolean'),filterRequired:{source:'35.0B: primary filter required (no main filter = notApplicable)',read:p=>p.cost?.filterPresent===false?'notApplicable':p.cost?.fields.filterRequired??unknown},filterCost:{source:'35.0B: existing primary-filter cost calculation; 30-day price validity',read:p=>p.cost?.fields.annualFilterCost??unknown},power:foundation('comparisonData.fountain.powerType','power'),battery:field('comparisonData.fountain.battery'),batteryRuntime:foundation('comparisonData.fountain.batteryRuntime','runtime'),offline:field('failureModes.powerOutage.status','capability'),dishwasher:foundation('comparisonData.fountain.dishwasherSafeParts','array'),...failure}},
  gps: {keys:['gps-tracker'],critical:['animal','minimumPetWeight','deviceWeight','subscription','battery','liveTracking','virtualFence'],fields:{animal,minimumPetWeight:field('gps.minimumPetWeightKg','number'),deviceWeight:field('gps.deviceWeightGrams','number'),subscription:field('gps.subscriptionRequired'),battery:field('gps.batteryMaxDays','number'),liveTracking:field('gps.liveTracking'),virtualFence:field('gps.virtualFence'),...failure}},
  catFlap: {keys:['katzenklappen'],critical:['animal','microchip','individualAccess','installation'],fields:{animal,microchip,individualAccess:field('multiPet.individualAccess','capability'),multiPet:field('multiPet.sharedUse','capability'),preyDetection:field('comparisonData.custom.preyDetection'),installation:field('comparisonData.catFlap.installation','array'),...failure}},
  litterBox: {keys:['automatische-katzentoiletten'],critical:['animal','minimumPetWeight','litterCompatibility','multiPet'],fields:{animal,minimumPetWeight:field('sensorLimits.automaticModeMinimumWeightKg','number'),litterCompatibility:{source:'litterCompatibility.status (complete / partial / unknown)',read:p=>p.data.litterCompatibility?.status==='complete'?'known':p.data.litterCompatibility?.status==='partial'?'partial':unknown},multiPet:field('multiPet.sharedUse','capability'),identification,app:common('app'),...failure}},
  camera: {keys:['haustierkameras'],critical:['animal','localStorage','cloud','subscription','detection','nightVision'],fields:{animal,localStorage:field('comparisonData.camera.localStorage'),cloud:field('comparisonData.camera.cloud'),subscription:{source:'subscription.requiredForCoreFunction (status must be documented)',read:p=>p.data.subscription?.status==='unknown'?unknown:structuredState(p.data.subscription?.requiredForCoreFunction)},detection:field('comparisonData.camera.detection'),nightVision:field('comparisonData.camera.nightVision'),...failure}},
  other: {keys:[],critical:['animal'],fields:{animal,...failure}}
};
// Product records take precedence, including explicit unknown; research only fills absent fields.
const operating = (key, kind) => ({source:`comparisonData.fountain.${key} (product first; existing 35.0B research fallback)`,read:p=>dataState(p.data.comparisonData?.fountain?.[key] ?? p.foundation?.comparisonData?.fountain?.[key],kind)});
Object.assign(definitions.fountain.fields, {
 power:operating('powerType',['mains','battery','mainsAndBattery']),
 batteryRuntime:operating('batteryRuntime','runtime'), dishwasher:operating('dishwasherSafeParts','parts'),
 lowWaterShutdown:operating('lowWaterShutdown','boolean'), waterLevelVisible:operating('waterLevelVisible','boolean'), pumpRemovable:operating('pumpRemovable','boolean')
});
const dishwasherParts = definitions.fountain.fields.dishwasher.read;
definitions.fountain.fields.dishwasher.read=p=>dishwasherParts(p)==='missingSchemaData'?dataState(p.data.comparisonData?.fountain?.dishwasherSafe):dishwasherParts(p);
definitions.catFlap.fields.installation={source:'comparisonData.catFlap.installation: at least one documented subfield; partial record does not prove all installation types',read:p=>{
 const v=p.data.comparisonData?.catFlap?.installation;
 if(v==null)return 'missingSchemaData';
 if(['unknown','notApplicable'].includes(v.status))return v.status;
 return Object.values(v).some(f=>f?.status==='known')?'known':'unknown';
}};
for(const key of ['doorSupported','wallSupported','glassSupported','metalDoorSupported','cutoutWidthMm','cutoutHeightMm','roundCutoutDiameterMm','passageWidthMm','passageHeightMm','tunnelDepthMm','adapterRequired']) {
 const source='comparisonData.catFlap.installation.'+key;
 definitions.catFlap.fields['installation.'+key]={source,read:p=>p.data.comparisonData?.catFlap?.installation?.status==='notApplicable'?'notApplicable':dataState(at(p.data,source),key.endsWith('Mm')?'number':'boolean')};
}
Object.assign(definitions.litterBox.fields, {
 minimumOperationalWeight:field('sensorLimits.minimumOperationalWeightKg','number'),
 belowMinimumBehavior:field('sensorLimits.belowMinimumBehavior',['manualOnly','automationDisabled'])
});
for(const[key,values]of Object.entries({localStorage:['supported','unavailable'],cloud:['required','optional','unavailable'],detection:['local','cloud','mixed','unavailable'],nightVision:['infrared','color','both','unavailable']}))definitions.camera.fields[key]=field('comparisonData.camera.'+key,values);
Object.assign(definitions.camera.fields,{localStorageTypes:field('comparisonData.camera.localStorageTypes','array'),maxLocalStorageGb:field('comparisonData.camera.maxLocalStorageGb','number'),detectionTypes:field('comparisonData.camera.detectionTypes','array')});
for(const key of ['localStorageTypes','maxLocalStorageGb']) {
 const original=definitions.camera.fields[key].read;
 definitions.camera.fields[key].read=p=>p.data.comparisonData?.camera?.localStorage==='unavailable'?'notApplicable':original(p);
}
definitions.camera.fields.subscription.read=p=>p.data.subscription==null?'missingSchemaData':p.data.subscription.status==='unknown'?'unknown':dataState(p.data.subscription.requiredForCoreFunction);
definitions.litterBox.fields.litterCompatibility.read=p=>p.data.litterCompatibility==null?'missingSchemaData':p.data.litterCompatibility.status==='complete'?'known':'unknown';
const gpsMinimum=definitions.gps.fields.minimumPetWeight.read;
definitions.gps.fields.minimumPetWeight.read=p=>gpsMinimum(p)==='missingSchemaData' && ['Nicht separat ausgewiesen','Nicht ausgewiesen'].includes(p.data.comparisonData?.custom?.mindestgewicht)?'unknown':gpsMinimum(p);
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
    const totals=Object.fromEntries(states.map(s=>[s,rows.reduce((sum,r)=>sum+Object.values(r.fields).filter(v=>v===s).length,0)]));
    const criticalStates=rows.flatMap(r=>def.critical.map(k=>r.fields[k]));
    const applicable=criticalStates.filter(s=>s!=='notApplicable').length;
    categories[world]={products:rows.length,...totals,readinessPercent:applicable?Math.round(100*criticalStates.filter(s=>s==='known').length/applicable):0,criticalFields:def.critical,readiness:readiness(rows.map(r=>r.fields),def.critical),fields,rows};
  }
  return {asOf,totalProducts:products.length,stateLabels:{known:'KNOWN',unknown:'UNKNOWN',notApplicable:'NOT_APPLICABLE',missingSchemaData:'MISSING_SCHEMA_DATA'},criteria:{scope:'All product Markdown records, including inactive. Product fields take precedence over existing structured fountain research. No automatic prose interpretation or schema defaults.',coverage:'Known / all products for each field. Category totals count product-field observations, not unique products. Explicit false and documented empty dishwasher-safe parts count as known. Partial or conditional capabilities count as unknown, never known.',readiness:'Percentage = known critical product-field observations / applicable critical observations. NOT_APPLICABLE is excluded from that denominator; UNKNOWN and MISSING_SCHEMA_DATA remain in it. Critical criteria stay unchanged from Phase A. READY requires all products resolved; PARTIAL requires at least one fully resolved product.',gaps:'UNKNOWN is an explicit unresolved or conditional fact, not a quality error. MISSING_SCHEMA_DATA is absent typed data, not proof that manufacturer research is missing. Installation coverage means some documented installation facts; its subfields show the remaining limits. Litter minimumPetWeight is the automatic-mode boundary; a generic operational minimum never substitutes for it.'},categories};
}
export function renderCoverage(report){
 const lines=['# Advisor data coverage — Data normalization 01','',`As of: ${report.asOf}. Products: ${report.totalProducts}.`,'',...Object.values(report.criteria).flatMap(v=>[v,'']), '| Category | Products | Known | Unknown | N/A | Missing schema data | Readiness |','|---|---:|---:|---:|---:|---:|---:|'];
 for(const[world,c]of Object.entries(report.categories))if(c.products)lines.push(`| ${world} | ${c.products} | ${c.known} | ${c.unknown} | ${c.notApplicable} | ${c.missingSchemaData} | ${c.readinessPercent}% |`);
 for(const[world,c]of Object.entries(report.categories)){
  if(!c.products)continue;
  lines.push('',`## ${world}: ${c.readiness}`,'',`Products: ${c.products}. Critical fields: ${c.criticalFields.join(', ')}.`,'','| Field | KNOWN | Coverage | UNKNOWN | NOT_APPLICABLE | MISSING_SCHEMA_DATA | Source |','|---|---:|---:|---:|---:|---:|---|');
  for(const[k,f]of Object.entries(c.fields))lines.push(`| ${k} | ${f.known} | ${f.coveragePercent}% | ${f.unknown} | ${f.notApplicable} | ${f.missingSchemaData} | ${f.source} |`);
 }
 lines.push('','## Remaining limits','','No Phase-B recommendation module is implemented. Unknown GPS minimum weights remain eligible for later advice with an explicit fit limitation. Conditional installation requirements, generic night-vision claims and unspecified processing locations are not hard compatibility facts. Product sources retain their existing dates; normalization is not renewed manufacturer verification. Feeder records are unchanged; existing typed camera booleans are included.','');
 return lines.join('\n');
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

#!/usr/bin/env node
// Repository-only 35.0B queue; no network, no product writes or inferred facts.
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'node:url';
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const repo=path.resolve(app,'../..'),out=path.join(repo,'reports/seo-cockpit');
const read=p=>JSON.parse(fs.readFileSync(path.join(repo,p),'utf8'));
const gsc=read('reports/seo-cockpit/http-integrity-34.8-evidence/gsc-original-2026-09-07.json');
const watch=read('reports/seo-cockpit/visibility-34.7-evidence/monitoring-plan.json').urls;
const productDir=path.join(app,'src/content/products');
const docs=fs.readdirSync(productDir).filter(n=>/\.mdx?$/.test(n)).map(file=>{
 const raw=fs.readFileSync(path.join(productDir,file),'utf8');
 return {file,raw,data:yaml.load(raw.match(/^---\s*\n([\s\S]*?)\n---/)[1],{schema:yaml.JSON_SCHEMA})};
});
const comparisonText=fs.readdirSync(path.join(app,'src/content/comparisons')).filter(n=>/\.mdx?$/.test(n)).map(n=>fs.readFileSync(path.join(app,'src/content/comparisons',n),'utf8'));
const pattern=/filter|schwamm|vorfilter|pumpe|ersatz|reinig|wechsel|wartung|strom|akku|material|kapaz|garantie|spül|spuel/i;
const rows=docs.filter(p=>p.data.category?.key==='trinkbrunnen').map(({file,raw,data:d})=>{
 const route='/produkt/'+d.slug+'/';
 const metrics=gsc.pages.filter(p=>{try{return new URL(p.page).pathname.replace(/\/?$/,'/')===route;}catch{return false;}});
 const impressions=metrics.reduce((s,p)=>s+p.impressions,0),clicks=metrics.reduce((s,p)=>s+p.clicks,0);
 const comparisonReferences=comparisonText.filter(t=>t.includes(d.slug)).length;
 const priority=impressions>0 || watch.includes(route) ? 'P1' : d.productStatus==='active' && (comparisonReferences>=2 || d.recommendationStatus==='recommended') ? 'P2':'P3';
 const specs=(d.specs??[]).filter(s=>pattern.test(s.label));
 const filterSpecs=specs.filter(s=>/filter|schwamm|vorfilter/i.test(s.label));
 const filterText=raw.split('\n').filter(s=>/filter|schwamm|vorfilter/i.test(s) && !s.trim().startsWith('http')).slice(0,12);
 const stable=d.consumables??[];
 return {slug:d.slug,manufacturer:d.manufacturer?.name??null,model:d.comparisonData?.fountain?.model??d.title,source:'apps/pfotentechnik/src/content/products/'+file,
   priority,priorityReason:impressions>0?'Original GSC export contains historical Google impressions':watch.includes(route)?'34.7 observation cohort':priority==='P2'?'Active and recommended or referenced by at least two existing comparisons':'Other existing fountain; lower repository-derived priority',
   googleSignals:{period:gsc.period,dataThrough:gsc.dataThrough,impressions,clicks,note:'Original export period aggregates, not current ranking or post-fix results.'},comparisonReferences,
   existingRelevantData:{capacity:d.capacity??null,comparisonFilters:d.comparisonFilters??null,comparisonData:d.comparisonData??null,specs,maintenance:d.experience?.maintenance??null,warrantyNote:d.repairability?.warrantyNote??null},
   existingEvidence:{evidenceSources:d.evidenceSources??[],externalEvidence:d.externalEvidence??null,repairabilitySources:(d.repairability?.parts??[]).map(p=>({type:p.type,sourceUrl:p.sourceUrl??null,sourceType:p.sourceType??null,verifiedAt:p.verifiedAt??null}))},
   filterData:{structuredConsumables:stable,legacySpecs:filterSpecs,legacyTextCandidates:filterText,hasUsefulLegacyData:filterSpecs.length>0 || filterText.length>0,note:'Text candidates are research leads only; no automatic conversion into proven structured claims.'},
   replacementParts:d.repairability?.parts??[],
   commerce:{primaryProductPrice:d.price??null,primaryProductAffiliate:d.affiliate??null,primaryOfferPresent:Boolean(d.affiliate?.url || d.price?.source?.url),accessoryOfferCount:stable.reduce((s,c)=>s+(c.offers?.length??0),0)+(d.repairability?.parts??[]).reduce((s,p)=>s+(p.offers?.length??0),0)},
   missingNewData:[...(!d.consumablePolicy?['filter presence, officially permitted filterless operation, complete consumable inventory']:[]),...(!stable.length?['consumable identities, required/optional, proprietary/generic','pack size, manufacturer replacement interval, exact compatibility','current accessory offers with merchant source and timestamp','typed evidenceSources for each new claim']:[]),...(!(d.repairability?.parts??[]).some(p=>p.compatibility && p.id)?['stable replacement-part ID and explicit compatibility; availability remains repairability.parts.status']:[]),...Object.keys({powerType:1,batteryRuntime:1,lowWaterShutdown:1,waterLevelVisible:1,pumpRemovable:1,dishwasherSafeParts:1}).filter(k=>d.comparisonData?.fountain?.[k]===undefined).map(k=>'structured comparisonData.fountain.'+k+' (verify applicability; reuse existing text as lead)')],
   requiresFullCostResearch:!stable.some(c=>c.packSize?.status==='known' && c.replacementInterval?.status==='known' && c.offers?.some(o=>o.price?.current!=null))};
});
const summary={fountains:rows.length,P1:rows.filter(r=>r.priority==='P1').length,P2:rows.filter(r=>r.priority==='P2').length,P3:rows.filter(r=>r.priority==='P3').length,usefulFilterData:rows.filter(r=>r.filterData.hasUsefulLegacyData).length,requiresFullCostResearch:rows.filter(r=>r.requiresFullCostResearch).length};
const report={batch:'35.0A',method:'Repository only; no external research; original GSC export unchanged. P1: historical impressions or observation cohort. P2: active and recommended or >=2 comparison references. P3: others.',summary,products:rows};
fs.writeFileSync(path.join(out,'fountain-research-readiness-35.0a.json'),JSON.stringify(report,null,2)+'\n');
const lines=['# Fountain Research Readiness 35.0A','',report.method,'',JSON.stringify(summary),'','| Slug | Hersteller / Modell | Priorität | Filter-Vorwissen | Ersatzteile | Produktangebot / Zubehörangebote |','|---|---|---|---|---|---|',...rows.map(r=>`| ${r.slug} | ${r.manufacturer} / ${r.model} | ${r.priority} | ${r.filterData.hasUsefulLegacyData?'Text/Specs; erneut belegen':'keine Kandidaten'} | ${r.replacementParts.length} | ${r.commerce.primaryOfferPresent?'ja':'nein'} / ${r.commerce.accessoryOfferCount} |`),''];
for(const r of rows) lines.push('## '+r.slug,'','- Grund: '+r.priorityReason,'- Vorhandene relevante Angaben: '+r.existingRelevantData.specs.map(s=>s.label+': '+s.value).join('; '),'- Evidence: '+r.existingEvidence.evidenceSources.length+' Feldquellen; '+(r.existingEvidence.externalEvidence?'externalEvidence vorhanden':'keine externalEvidence')+'. Details und Originalwerte im JSON.','- Fehlende Daten: '+r.missingNewData.join('; '),'- Vollständige Kostenrecherche nötig: '+(r.requiresFullCostResearch?'ja':'nein'), '');
fs.writeFileSync(path.join(out,'fountain-research-readiness-35.0a.md'),lines.join('\n'));
console.log(summary);

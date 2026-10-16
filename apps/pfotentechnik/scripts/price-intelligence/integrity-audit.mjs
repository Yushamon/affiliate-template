import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import yaml from 'js-yaml';
import {readProductDocument,readProductFiles} from '../../src/lib/price-intelligence/frontmatter-price.mjs';
import {deriveProductOperations,ageInDays} from '../../src/lib/product-operations/policy.mjs';
import {resolveCommerceOffers} from '../../src/domain/commerceOffers.mjs';
const app=fileURLToPath(new URL('../../',import.meta.url));
const root=path.resolve(app,'../..');
const baselineIndex=process.argv.indexOf('--baseline');
const baseline=baselineIndex<0 ? null : process.argv[baselineIndex+1];
const now=Date.parse('2026-10-16T12:00:00Z');
const records=[];
for(const file of await readProductFiles(path.join(app,'src/content/products'))) {
  const {data}=await readProductDocument(file);
  const source=baseline ? execFileSync('git',['show',`${baseline}:${path.relative(root,file)}`],{cwd:root,encoding:'utf8'}) : null;
  const before=source ? yaml.load(source.match(/^---\r?\n([\s\S]*?)\r?\n---/)[1]) : data;
  const ops=deriveProductOperations(data,{now});
  const issues=[];
  if(before.availability==='available' && before.availabilityReason==='Bei der automatischen Preisprüfung als verfügbar erkannt.') issues.push('Historischer automatischer Positivstatus ohne separat gespeicherten Liefernachweis');
  if(before.priceAvailable && !(Number.isFinite(before.price?.current)&&before.price.current>0)) issues.push('priceAvailable ohne gültigen Preis');
  if(before.price?.currency && before.price.currency!=='EUR') issues.push(`Ausländischer ${before.price.currency}-Preis; kein bestätigter deutscher Preis`);
  if(ageInDays(before.priceUpdated??before.price?.checkedAt,now)>30) issues.push('Preisprüfung älter als 30 Tage');
  if(!before.price?.checkedAt) issues.push('Preisprüfdatum fehlt');
  for(const offer of before.offers??[]) {
    if(offer.mappingStatus!=='verified') issues.push(`${offer.id}: Zuordnung ${offer.mappingStatus}`);
    if(offer.error) issues.push(`${offer.id}: ${offer.error}`);
    if(offer.availability==='available' && offer.mappingStatus!=='verified') issues.push(`${offer.id}: positiver Status bei unbestätigter Zuordnung`);
  }
  if(before.productStatus==='discontinued'&&before.availability==='available') issues.push('Produkt eingestellt, aber verfügbar markiert');
  const offers=resolveCommerceOffers(data,{}, {now});
  const unsafe=offers.filter(o=>o.purchasable&&(!o.verified||!o.domestic||o.availability!=='available'));
  if(unsafe.length) throw Error(`${data.slug}: unsafe offer`);
  records.push({slug:data.slug,issues,beforeAvailability:before.availability,effectiveAvailability:ops.availability,purchasable:ops.purchasable,priceCurrency:data.price?.currency,storedPrice:data.price?.current,publicPrices:offers.filter(o=>o.current!=null).map(o=>({id:o.id,current:o.current,currency:o.currency})),offers:offers.map(o=>({id:o.id,mappingStatus:o.mappingStatus,availability:o.availability,purchasable:o.purchasable,status:o.status}))});
}
const affected=records.filter(r=>r.issues.length);
const summary={asOf:new Date(now).toISOString(),baseline,products:records.length,affected:affected.length,unsupportedPositive:records.filter(r=>r.issues.some(i=>i.startsWith('Historischer'))).length,currencyConflicts:records.filter(r=>r.issues.some(i=>i.startsWith('Ausländischer'))).length,unresolvedMappings:records.filter(r=>r.issues.some(i=>i.includes('Zuordnung unresolved'))).length,stalePrices:records.filter(r=>r.issues.includes('Preisprüfung älter als 30 Tage')).length,unsafePurchasableOffers:0};
const out=path.join(app,'reports/price-availability-integrity');
await fs.mkdir(out,{recursive:true});
await fs.writeFile(path.join(out,'product-audit.json'),JSON.stringify({summary,records},null,2)+'\n');
await fs.writeFile(path.join(out,'product-audit.md'),`# Produkt-Audit\n\nStand: ${summary.asOf}; Ausgangsdaten: ${baseline??'Arbeitsbaum'}. ${summary.products} Produkte, ${summary.affected} mit mindestens einem Befund.\n\nHinweis: Historische automatische Positivwerte hatten denselben Text mit und ohne tatsächlichen Stock-Wert. Sie sind ohne erneuten Nachweis unbekannt; dies beweist keine Nichtlieferbarkeit. Preisbestände und Händlerlinks bleiben gespeichert.\n\n| Produkt | Vorher → effektiv | Kaufbar | Befunde |\n| --- | --- | --- | --- |\n`+affected.map(r=>`| ${r.slug} | ${r.beforeAvailability??'fehlt'} → ${r.effectiveAvailability} | ${r.purchasable?'ja':'nein'} | ${r.issues.join('; ').replaceAll('|','/')} |`).join('\n')+'\n');
console.log(JSON.stringify(summary,null,2));

// Read-only diagnosis. A missing attempt record is not proof that no attempt occurred.
import fs from 'node:fs';import path from 'node:path';
import {app,sourceInventory,sha} from '../indexation/scan.mjs';
import {priceAudit} from '../../src/lib/price-intelligence/service.mjs';
import {affiliatePrograms} from '../../src/config/affiliate-programs.mjs';
const output=path.join(app,'reports/product-operations-recovery-37.3a-qa');fs.mkdirSync(output,{recursive:true});
const before=JSON.parse(fs.readFileSync(path.join(output,'before-data.json'))),audit=await priceAudit(),sources=sourceInventory().filter(p=>p.collection==='products');
const rows=sources.map(({data:d,file,sha256})=>{
 const p=before.products.find(p=>p.slug===d.slug),offers=p.commerceOffers??[],attempts=offers.filter(o=>o.lastAttemptAt||o.error),rawCheck=d.price?.checkedAt??null;
 let priceCause={category:8,reason:'Kein vollständiger historischer Versuchsverlauf vorhanden. Aus dem alten Bestätigungsdatum lässt sich nicht ableiten, ob ein späterer Versuch nie gestartet wurde oder scheiterte.',certainty:'unknown-history'};
 if(d.priceAutomation==='editorial')priceCause={category:8,reason:'Automatische Hauptpreisprüfung redaktionell gesperrt; Hauptpreis wird bewusst manuell gepflegt.',certainty:'documented'};
 else if(p.archived)priceCause={category:8,reason:'Bewusst archiviert; gehört nicht zur aktiven Pflegewarteschlange. Das Archivieren bestätigt keinen neuen Preis.',certainty:'documented'};
 else if(p.availability==='discontinued')priceCause={category:7,reason:'Als eingestellt dokumentiert.',certainty:'documented'};
 else if(offers.some(o=>o.variantLabel||o.price?.variantLabel)||d.price?.variantLabel)priceCause={category:6,reason:'Preis ist einem ausgewiesenen Paket oder einer Variante zugeordnet. Es darf kein Einzelgerätepreis angenommen werden.',certainty:'documented'};
 else if(attempts.some(o=>o.error))priceCause={category:attempts.some(o=>/kein.*preis|keine.*preis|währung/i.test(o.error??''))?3:2,reason:attempts.filter(o=>o.error).map(o=>o.error).join(' · '),certainty:'documented-attempt'};
 else if(p.amazonInvalidLink||offers.some(o=>o.program&&affiliatePrograms[o.program]?.enabled===false))priceCause={category:4,reason:p.amazonInvalidLink?'Amazon-Ziel enthält keine verlässlich auflösbare Produktkennung; sichere CTA-Zuordnung fehlt.':'Anbieterprogramm ist ausdrücklich unvollständig konfiguriert.',certainty:'documented'};
 else if(p.consciouslyUnavailable)priceCause={category:8,reason:'Bewusst vorübergehend oder aktuell nicht lieferbar gepflegt; kein offener automatischer Pflegefall. Keine Aussage über dauerhaftes Marktende.',certainty:'documented'};
 let availabilityCause=null;
 if(p.availability==='unknown'){
  if(d.availability==='available'&&d.availabilityReason==='Bei der automatischen Preisprüfung als verfügbar erkannt.')availabilityCause={category:'Händlerdaten unvollständig',reason:'Historischer automatischer Positivstatus ohne separat nachvollziehbaren Liefernachweis. Wird zu Recht nicht aus dem Preis als lieferbar abgeleitet.'};
  else if(offers.some(o=>o.availability==='available'&&o.mappingStatus!=='verified'))availabilityCause={category:'Technischer Mappingfehler',reason:'Ein positiver Angebotsstatus ist keiner bestätigten Produktzuordnung zugeordnet.'};
  else if(attempts.some(o=>o.error))availabilityCause={category:'Recherche fehlgeschlagen',reason:attempts.filter(o=>o.error).map(o=>o.error).join(' · ')};
  else if(d.price?.currency&&d.price.currency!=='EUR')availabilityCause={category:'Händlerdaten unvollständig',reason:'Preisquelle ist kein bestätigtes EUR-/Deutschland-Angebot; kein lokaler Liefernachweis.'};
  else if(d.availabilityUpdated)availabilityCause={category:'Herstellerstatus unbekannt',reason:'Ein älteres Statusdatum ist gespeichert, der Datensatz erklärt den aktuellen Status dennoch ausdrücklich als unbekannt. Kein automatischer Verfall oder positiver Nachweis erfunden.'};
  else availabilityCause={category:'Nicht recherchiert / nicht dokumentiert',reason:d.availabilityReason??'Kein belastbarer bestätigter Verfügbarkeitsnachweis gespeichert. Ob eine Recherche nie stattfand, ist ohne Protokoll nicht beweisbar.'};
 }
 return {slug:d.slug,product:d.title,manufacturer:d.manufacturer?.name,file,sourceHash:sha256,
  merchant:offers.map(o=>({id:o.id,merchant:o.label??o.merchant,storedPrice:o.price?.current??null,priceCheckedAt:o.price?.checkedAt??null,lastAttemptAt:o.lastAttemptAt??null,error:o.error??null,availability:o.availability,mapping:o.mappingStatus,provider:o.commerceDataProvider,affiliate:o.affiliateUrl??o.officialProductUrl??null})),
  storedPrice:d.price?.current??null,currency:d.price?.currency??'EUR',lastSuccessfulPriceCheck:rawCheck,priceUpdated:d.priceUpdated??null,productUpdatedAt:d.updatedAt??null,localFileModifiedAt:fs.statSync(path.join(app,file)).mtime.toISOString(),
  source:d.price?.source??null,affiliateTarget:d.affiliate?.url??d.price?.affiliateUrl??null,
  priceAgeDays:p.priceAgeDays,lastDocumentedAttemptAt:attempts.map(o=>o.lastAttemptAt).filter(Boolean).sort().at(-1)??null,
  priceOver30Days:p.priceAgeDays>30,priceOver90Days:p.priceAgeDays>90,missingPriceAction:!p.priceAvailable&&!p.editorialPriceControl&&!p.consciouslyUnavailable&&!p.archived,
  priceCause,availability:p.availability,rawAvailability:d.availability??null,rawAvailabilityUpdated:d.availabilityUpdated??null,availabilityCause,archived:p.archived,consciouslyUnavailable:p.consciouslyUnavailable,
  isTask:p.isTask,maintenanceStatus:p.maintenanceStatus,automaticPriceCheckAllowed:d.priceAutomation!=='editorial'};
});
const count=fn=>rows.filter(fn).length,group=(items,key)=>Object.fromEntries([...new Set(items.map(key))].map(k=>[k,items.filter(v=>key(v)===k).length]));
const stale=rows.filter(r=>r.priceOver30Days),unknown=rows.filter(r=>r.availability==='unknown');
if(stale.length!==44||unknown.length!==70)throw Error('Diagnostic baseline scope drift');
const result={version:'37.3A',generatedAt:new Date().toISOString(),readOnly:true,originalCounts:before.summary,currentCounts:audit.summary,
 maintenanceFormula:{numerator:before.products.filter(p=>['complete','archived'].includes(p.maintenanceStatus)).length,denominator:110,archived:before.products.filter(p=>p.archived).length,complete:before.products.filter(p=>p.maintenanceStatus==='complete').length,percent:before.summary.maintenanceRate,definition:'(vollständig gepflegt + bewusst archiviert) / alle Produkte × 100; jedes Produkt zählt einmal. Keine gewichtete Datenqualitätsnote.',requiredFields:['slug','title','manufacturer','category','recommendation','review.summary','review.verdict','images.hero','rating'],thresholds:{priceWarningDays:90,displayStaleDays:[30,90],publicPriceFreshDays:14},unknownAvailability:'Bei automatischer Commerce-Pflege eine Pflichtaufgabe; redaktionelle Preisführung ist davon getrennt.',missingAffiliate:'Pflichtaufgabe für aktive, nicht bewusst unverfügbare Produkte; öffentlich gültige Zielzuordnung wird zusätzlich separat angezeigt.',archivedAndUnavailable:'Keine offene Pflegeaufgabe. Archiv und Marktverfügbarkeit können sich überschneiden.',optionalFields:'Zusatzdienste, Galerieumfang und neue Quellen werden nicht als zusätzliche Pflichtfelder gezählt.'},
 overlaps:{unknownAndArchived:count(r=>r.availability==='unknown'&&r.archived),unavailableAndArchived:count(r=>['temporarily-unavailable','out-of-stock'].includes(r.availability)&&r.archived),discontinuedAndArchived:count(r=>r.availability==='discontinued'&&r.archived),stale30AndArchived:count(r=>r.priceOver30Days&&r.archived),stale30AndUnknown:count(r=>r.priceOver30Days&&r.availability==='unknown')},
 priceCauseCounts:group(stale,r=>r.priceCause.category),unknownAvailabilityCauseCounts:group(unknown,r=>r.availabilityCause.category),
 missingExternalAccess:{amazon:'Vorhandene Pipeline liest öffentliches HTML. Kein PA-API-Client im vorhandenen Preisworkflow; Blockseiten oder fehlende exakte Buybox-Daten bleiben Fehler.',awin:'PETLIBRO-Programm ist mit vorhandenen IDs konfiguriert. Preise kommen aus öffentlichem Shopify-JSON, nicht aus einem angenommenen Awin-Preisfeed.',adcell:affiliatePrograms['tractive-de'].missing,other:'Eigene vollständige Affiliate-Links können redaktionell gepflegt werden. Für unbekannte Hersteller-/Händlerquellen wird kein automatischer Adapter behauptet.'},
 oldPrices:stale,missingPrices:rows.filter(r=>r.missingPriceAction),unknownAvailability:unknown,products:rows};
fs.writeFileSync(path.join(output,'product-diagnosis.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({oldPrices:stale.length,unknownAvailability:unknown.length,formula:result.maintenanceFormula,overlaps:result.overlaps,priceCauses:result.priceCauseCounts,availabilityCauses:result.unknownAvailabilityCauseCounts},null,2));

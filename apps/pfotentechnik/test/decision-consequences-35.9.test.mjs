import {readBeforeEvidence} from '../scripts/product-evidence/approved-changes.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {parse as parseStore} from 'devalue';
import {buildDecisionFacts} from '../src/domain/productExperience/consequences.ts';
import {inspectDecisionFacts,decisionInputSpecs,protectedDecisionSlugs,reviewRenderedConsequences} from '../src/domain/productExperience/decisionQuality.mjs';
import {decisionFactFingerprint} from '../src/domain/productExperience/decisionFactReview.mjs';
import {deriveProductOperations} from '../src/lib/product-operations/policy.mjs';
import {readProductEditorial} from '../src/lib/price-intelligence/service.mjs';
import {readProductDocument} from '../src/lib/price-intelligence/frontmatter-price.mjs';
import {renderedFacts} from '../scripts/decision-consequences/snapshot.mjs';
import {verifyIntegration} from '../scripts/product-integration/verify.mjs';
const app=new URL('../',import.meta.url);
const baseline=JSON.parse(fs.readFileSync(new URL('../research/decision-consequences-35.9/baseline.json',import.meta.url)));
const derive=(category,specs,patch={})=>inspectDecisionFacts({category,...patch},specs);
const fact=(label,value)=>({label,value});

test('35.9: alle 110 Dateien, Scores, Preise, Affiliate-Ziele und Originale bytegenau erhalten',()=>{
 assert.equal(baseline.products.length,110);let originals=0;
 for(const p of baseline.products){
  const raw=readBeforeEvidence(new URL(`src/content/products/${p.slug}.md`,app));
  assert.equal(createHash('sha256').update(raw).digest('hex'),p.sourceSha256,p.slug);
  originals+=(p.data.decisionFacts??[]).length;
 }
 assert.equal(originals,437);
});

test('35.9: unbekannte Werte, unvollständige Felder und hypothetische Funktionen ergeben keine Präsenzbehauptung',()=>{
 for(const category of ['Trinkbrunnen','Futterautomaten','GPS-Tracker','Haustierkameras','Katzenklappen','Automatische Katzentoiletten']){
  for(const label of ['Akku','Kamera','App','Filter','Kapazität','Stromversorgung','Notstrom']){
   for(const value of ['', 'Unbekannt','Nicht dokumentiert','Keine Angaben',`Unbekannt, ob ${label} vorhanden`])assert.deepEqual(derive(category,[fact(label,value)]).facts,[],`${category}/${label}/${value}`);
  }
 }
 assert.deepEqual(derive('Futterautomaten',[fact('Notstrom','Nicht dokumentiert')]).facts,[]);
 assert.ok(derive('Trinkbrunnen',[fact('Akku','Integrierter Akku; Zellchemie nicht dokumentiert')]).facts.length);
});

test('35.9: Einheiten trennen Energie, Volumen, Gewicht und Krokettenlänge',()=>{
 for(const category of ['Trinkbrunnen','Futterautomaten','GPS-Tracker']){
  for(const label of ['Akkukapazität','Kapazität']){
   const result=derive(category,[fact(label,'2150 mAh')]);assert.equal(result.facts.length,1);
   assert.doesNotMatch(result.facts[0].consequence,/nachfüll|nachgefüllt|Futterdichte|Portionsgröße/i);
  }
 }
 for(const [category,label,value]of [['Futterautomaten','Krokettengröße','5 g'],['Futterautomaten','Krokettengröße','450 mAh'],['Katzenklappen','Kapazität','2 Liter'],['Trinkbrunnen','Kapazität','2 kg'],['GPS-Tracker','Gewicht','450 mAh'],['Trinkbrunnen','Akkukapazität','2 Liter'],['GPS-Tracker','Akkulaufzeit','450 mAh'],['Trinkbrunnen','Kapazität','0 Liter'],['GPS-Tracker','Akkukapazität','-450 mAh']])assert.equal(derive(category,[fact(label,value)]).facts.length,0);
});

test('35.9: widersprüchliche Werte und Tierarten werden gesperrt, keine automatische Auflösung',()=>{
 const conflict=derive('Trinkbrunnen',[fact('Kapazität','2 Liter'),fact('Kapazität','4 Liter')]);
 assert.deepEqual(conflict.facts,[]);assert.equal(conflict.rejected[0].code,'CONFLICTING_VALUES');
 const sub=derive('GPS-Tracker',[fact('Abo','Nein')],{gps:{subscriptionRequired:true},subscription:{requiredForCoreFunction:true}});
 assert.ok(sub.rejected.some(r=>r.code==='CONFLICTING_STRUCTURED_VALUES'));assert.ok(!sub.topics.includes('subscription'));
 const animal=derive('GPS-Tracker',[fact('Geeignet für','Katzen ab 3 kg')],{gps:{animal:['dog']}});
 assert.ok(animal.rejected.some(r=>r.code==='CONFLICTING_ANIMAL_SPECIES'));assert.ok(!animal.topics.includes('animal-fit'));
});

test('35.9: zentraler Themenabgleich bündelt Akku- und Abo-Werte, priorisiert nutzbares Wasservolumen',()=>{
 const gps=derive('GPS-Tracker',[fact('Akkulaufzeit','Bis zu 7 Tage'),fact('Akku','Integrierter Akku'),fact('Akkukapazität','450 mAh'),fact('Abo','Ja'),fact('Abo-Kosten','96 Euro jährlich')]);
 assert.deepEqual(gps.topics,['battery','subscription']);
 for(const value of ['450 mAh','Integrierter Akku','Bis zu 7 Tage'])assert.ok(gps.facts[0].value.includes(value));
 const water=derive('Trinkbrunnen',[fact('Kapazität','7 Liter'),fact('Nutzbare Kapazität','4 Liter')]);
 assert.equal(water.facts.length,1);assert.equal(water.facts[0].value,'4 Liter');
});

test('35.9: keine falschen Produktkontexte, Fernzugriffs-, Sicherheits- oder Heilversprechen',()=>{
 const examples=[
  ['Trinkbrunnen',[fact('Kapazität','3 Liter'),fact('Filter','Kein Filter'),fact('Akku','Integrierter Akku')],/Futterdichte|Portionsgröße|Filter verbessern|keimfrei/i],
  ['Futterautomaten',[fact('Krokettengröße','2 bis 12 mm'),fact('Batterie-Backup','3 D-Batterien')],/Körpergröße|Standfestigkeit|überbrücken einen Stromausfall/],
  ['Futterautomaten',[fact('App','Bluetooth-App')],/Einstellungen lassen sich aus der Ferne/],
  ['Automatische Katzentoiletten',[fact('Sicherheit','Elf Sensoren laut Hersteller')],/garantiert sicher|unbeaufsichtigt sicher/],
 ];
 for(const [category,specs,forbidden]of examples)assert.doesNotMatch(derive(category,specs).facts.map(f=>f.consequence).join(' '),forbidden);
});

test('35.9: exakte Einzel-Freigabe bleibt vorrangig; keine Nachbar- oder globale Freigabe',()=>{
 const approved={label:'Akku',value:'Nein',consequence:'Plane einen Netzanschluss ein.'};
 const data={slug:'fixture',category:'Trinkbrunnen',decisionFacts:[approved,{label:'Kamera',value:'Ja',consequence:'Nicht freigegeben.'}]};
 const approvals=[{slug:'fixture',fingerprint:decisionFactFingerprint(approved)}];
 assert.equal(buildDecisionFacts(data,[fact('Akku','Nein'),fact('Kapazität','2 Liter')],approvals)[0].consequence,approved.consequence);
 assert.ok(buildDecisionFacts({...data,slug:'other'},[fact('Akku','Nein')],approvals).every(f=>f.source!=='editorial'));
 assert.ok(buildDecisionFacts(data,[fact('Akku','Ja')],approvals).every(f=>f.source!=='editorial'),'veraltete Freigabe überstimmt keinen technischen Widerspruch');
});

test('35.9: alle nicht geschützten Produkte haben 4–6 unterschiedliche belegte Themen',()=>{
 for(const p of baseline.products){
  const result=inspectDecisionFacts(p.data);
  if(result.protected)continue;
  assert.ok(result.facts.length>=4&&result.facts.length<=6,p.slug);
  assert.equal(new Set(result.topics).size,result.facts.length,p.slug);
  assert.deepEqual(reviewRenderedConsequences(p.data,result.facts).flatMap(f=>f.issues),[],p.slug+': zusätzliche Auditregeln');
  assert.equal(new Set(result.facts.map(f=>f.consequence)).size,result.facts.length,p.slug);
  const inputs=decisionInputSpecs(p.data);
  for(const f of result.facts){
   assert.notEqual(f.source,'editorial');
   assert.ok(f.label==='Streu-Kompatibilität'&&p.data.litterCompatibility||inputs.some(s=>f.label.includes(s.label)&&f.value.includes(String(s.value))),p.slug+': '+f.label);
  }
 }
 assert.deepEqual(derive('Trinkbrunnen',[]).facts,[],'keine Auffülltexte bei fehlenden Daten');
});

test('35.9: Product Operations und bestehender Live-Editor verwenden dieselbe Qualitätsprüfung',async()=>{
 const p=baseline.products.find(p=>p.slug==='tractive-dog-6');
 const operations=deriveProductOperations(p.data);
 assert.equal(operations.decisionQuality.generated,buildDecisionFacts(p.data,p.data.specs).length);
 const doc=await readProductDocument(new URL(`src/content/products/${p.slug}.md`,app));
 const live=await readProductEditorial(p.slug,{find:async()=>doc});
 assert.deepEqual(live.decisionQuality,operations.decisionQuality);
 const source=fs.readFileSync(new URL('src/components/admin/ProductEditorialEditor.astro',app),'utf8');
 assert.match(source,/showQuality\(result.decisionQuality\)/);
 assert.doesNotMatch(source.split('<script>')[1].split('</script>')[0],/decisionQualitySummary|\bdata\b\)/,'keine serverseitigen Daten oder Node-Abhängigkeiten im Browsercode');
});

test('35.9: vollständiger echter Build rendert alle ausgewählten Hinweise und bewahrt alle Originale',()=>{
 const store=parseStore(fs.readFileSync(new URL('.astro-cache/data-store.json',app),'utf8')).get('products');
 let rendered=0;
 for(const p of baseline.products){
  const d=store.get(p.slug).data,actual=renderedFacts(p.slug);
  assert.deepEqual(d.decisionFacts??[],p.data.decisionFacts??[],p.slug);
  if(p.rendered===null){assert.equal(actual,null,p.slug);continue;}
  const expected=buildDecisionFacts(d,d.specs).map(({source,...f})=>f);
  const displayValues=facts=>facts.map(f=>({...f,value:f.value.replace(/\s+/g,' ').trim().toLocaleLowerCase('de-DE')}));
  assert.deepEqual(displayValues(actual),displayValues(expected),p.slug);rendered++;
  if(protectedDecisionSlugs.includes(p.slug))assert.deepEqual(actual,p.rendered,p.slug);
 }
 assert.equal(rendered,108);
});

test('35.9: alle 20 Experimentseiten und 205 eingehenden Linkkanten unverändert',async()=>{
 const result=await verifyIntegration();assert.equal(result.protectedPages,20);assert.equal(result.protectedIncomingEdges,205);
});

test('35.9: vollständiger Vorher-Nachher-Report ist reproduzierbar',()=>{
 execFileSync(process.execPath,['scripts/decision-consequences/report.mjs','--check'],{cwd:app,stdio:'pipe'});
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { parse as parseStore } from 'devalue';
import { parse } from 'parse5';
import { calculateProductScore } from '../src/domain/productScore.ts';
import { buildSubscriptionCostModel } from '../src/domain/subscriptionCosts.ts';
import { resolveCommerceOffers } from '../src/domain/commerceOffers.mjs';
import { readProductDocument } from '../src/lib/price-intelligence/frontmatter-price.mjs';
import { applyDecisions } from '../scripts/product-freshness/apply.mjs';
import { approvedFreshnessChanges } from '../scripts/product-freshness/approved-changes.mjs';
import { verifyIntegration, walk, text } from '../scripts/product-integration/verify.mjs';
const app=fileURLToPath(new URL('../',import.meta.url)),root=path.join(app,'research/product-freshness-36.0');
const baseline=JSON.parse(fs.readFileSync(path.join(root,'baseline.json')));
const changes=JSON.parse(fs.readFileSync(path.join(root,'changes.json')));
const index=JSON.parse(fs.readFileSync(path.join(root,'search-index.json')));
const sha=s=>createHash('sha256').update(s).digest('hex');
const attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value;
const normalized=s=>String(s).replace(/\s/g,'');
const store=parseStore(fs.readFileSync(path.join(app,'.astro-cache/data-store.json'),'utf8')).get('products');
const document=async slug=>(await readProductDocument(path.join(app,'src/content/products',slug+'.md'))).data;
const dom=slug=>parse(fs.readFileSync(path.join(app,'dist/produkt',slug,'index.html'),'utf8'));

test('36.0: alle aktiven Modelle haben drei protokollierte Recherchepfade',()=>{
 assert.equal(baseline.products.length,110);const active=baseline.products.filter(p=>p.active);
 assert.equal(active.length,95);assert.deepEqual(index.products.map(p=>p.slug).sort(),active.map(p=>p.slug).sort());
 for(const p of index.products){assert.equal(p.searches.length,3,p.slug);assert.equal(new Set(p.searches.map(q=>q.purpose)).size,3);for(const q of p.searches){assert.ok(q.query.length>15);assert.ok(Array.isArray(q.hits));for(const h of q.hits)assert.equal(new URL(h.url).protocol,'https:')}}
});

test('36.0: selektive Änderungen reproduzierbar, keine pauschale Neufassung',async()=>{
 assert.deepEqual(await applyDecisions(false),changes);assert.equal(changes.products.length,33);
 const original=JSON.parse(fs.readFileSync(path.join(root,'originals.json')));
 for(const p of changes.products){assert.equal(sha(original[p.file]),p.beforeSha256);assert.equal(sha(fs.readFileSync(path.join(app,p.file))),p.afterSha256);assert.ok(p.reason);assert.ok(Object.keys(p.changedFields).length)}
 assert.equal(approvedFreshnessChanges().size,37);
});

test('36.0: alle URLs, SEO-Felder, Kaufziele, Preise und 437 Originalhinweise geschützt',async()=>{
 const facts=[];
 for(const p of baseline.products){const d=await document(p.slug);
  const change=changes.products.find(c=>c.slug===p.slug);
  for(const [key,value]of Object.entries(p.data))if(!change?.changedFields[key])assert.deepEqual(d[key],value,p.slug+': unverändertes Bestandsfeld '+key);
  for(const k of ['slug','productUrl','seo','affiliate','price','offers','publishedAt','publicationStatus','publicationBlockers','decisionFacts'])assert.deepEqual(d[k],p.data[k],p.slug+'.'+k);
  if(d.decisionFacts?.length)facts.push([p.slug,d.decisionFacts]);
  if(!changes.products.some(c=>c.slug===p.slug))assert.equal(sha(fs.readFileSync(path.join(app,p.file))),p.sha256,p.slug+': unbeabsichtigte Änderung');
 }
 const originals=JSON.parse(fs.readFileSync(path.join(root,'originals.json')));
 const block=source=>source.match(/^decisionFacts:.*(?:\n(?:[ \t].*|$))*/m)?.[0];
 for(const [file,original]of Object.entries(originals))assert.equal(block(fs.readFileSync(path.join(app,file),'utf8')),block(original),file+': Originalhinweise auch im Rohtext unverändert');
 assert.equal(facts.length,73);assert.equal(facts.reduce((n,[,f])=>n+f.length,0),437);
 assert.deepEqual(JSON.parse(fs.readFileSync(path.join(app,'src/config/decision-fact-approvals.json'))),{version:1,approvals:[]});
});

test('36.0: genau eine einzeln begründete Score-Änderung, Paketpreis ohne Doppelzählung',async()=>{
 const changed=[];for(const p of baseline.products){const d=await document(p.slug);if(JSON.stringify(d.ratings)!==JSON.stringify(p.data.ratings)||d.score!==p.data.score||d.rating!==p.data.rating)changed.push(p.slug)}
 assert.deepEqual(changed,['invoxia-biotracker-2026']);
 const p=baseline.products.find(p=>p.slug===changed[0]),d=await document(p.slug);
 assert.equal(calculateProductScore(p.data).score,83);assert.equal(d.ratings.gesundheit,3.5);
 assert.deepEqual(calculateProductScore({ratings:d.ratings}),{score:78,rating:3.9,criteriaCount:5,source:'criteria'});
 assert.equal(calculateProductScore(d).score,78);assert.equal(d.rating,3.9);
 const costs=buildSubscriptionCostModel({subscription:d.subscription,devicePrice:d.price.current,now:'2026-11-16'});
 assert.equal(costs.totals.months12.value,219);assert.ok(Math.abs(costs.totals.months24.value-348.9)<1e-6);
});

test('36.0: neue externe Tests und Hinweise im echten Astro-Speicher erhalten',async()=>{
 for(const c of changes.products){const d=await document(c.slug),built=store.get(c.slug)?.data;assert.ok(built,c.slug);
  for(const k of ['score','rating','ratings','reviewedAlternatives'])if(d[k]!==undefined)assert.deepEqual(built[k],d[k],c.slug+'.'+k);
  if(c.changedFields.experience)assert.equal(built.experience.reliability,d.experience.reliability,c.slug);
  for(const r of (d.externalEvidence?.professionalReviews??[]).filter(r=>r.checkedAt==='2026-11-16')){const stored=built.externalEvidence.professionalReviews.find(s=>s.url===r.url);assert.ok(stored,c.slug+': '+r.url);assert.equal(stored.checkedAt.toISOString().slice(0,10),'2026-11-16');assert.deepEqual(stored.negatives,r.negatives)}
 }
});

test('36.0: jede veränderte Produktseite rendert Hinweise, Kaufziele und konsistente strukturierte Daten',async()=>{
 for(const c of changes.products){const d=await document(c.slug),tree=dom(c.slug),nodes=[...walk(tree)],visible=text(tree);
  assert.equal(attr(nodes.find(n=>n.tagName==='link'&&attr(n,'rel')==='canonical'),'href'),'https://pfotentechnik.de'+d.seo.canonical);
  if(c.changedFields.experience)assert.ok(normalized(visible).includes(normalized(d.experience.reliability)),c.slug+': Hinweis fehlt im sichtbaren Text');
  const ctas=nodes.filter(n=>n.tagName==='a'&&attr(n,'class')==='px2-price__cta').map(n=>attr(n,'href')).sort();
  assert.deepEqual(ctas,resolveCommerceOffers(d).filter(o=>o.canLink).map(o=>o.affiliateUrl).sort(),c.slug+': Preis-CTA');
  for(const n of nodes.filter(n=>n.tagName==='a')){const href=attr(n,'href');if(!href?.startsWith('/')||href.startsWith('//'))continue;const target=href.split(/[?#]/)[0];if(target)assert.ok(fs.existsSync(path.join(app,'dist','.'+target,target.endsWith('/')?'index.html':'')),c.slug+': '+href)}
  const schemas=nodes.filter(n=>n.tagName==='script'&&attr(n,'type')==='application/ld+json').map(n=>JSON.parse(n.childNodes.map(n=>n.value??'').join('')));assert.ok(schemas.length,c.slug);
  const product=schemas.find(s=>s['@type']==='Product');assert.ok(product,c.slug+': Product-Schema');
  assert.equal(product.url,'https://pfotentechnik.de'+d.seo.canonical);assert.equal(product.name,d.title);
  if(product.review)assert.equal(product.review.reviewRating.ratingValue,calculateProductScore(d).score,c.slug+': strukturierter ProductScore');
  assert.ok(!visible.includes('undefined'),c.slug);
 }
 const sat=text(dom('satellai-collar-go'));assert.match(sat,/Lieferbarkeit nicht bestätigt/);
});

test('36.0: GPS-Alternativen behaupten keine Kamera und empfehlen kein XL-Modell für Katzen',async()=>{
 for(const slug of ['tractive-cat-6-mini','tractive-dog-6','tractive-dog-6-xl','pawfit-3','invoxia-biotracker-2026','paj-pet-finder-4g-mini','weenect-xs','weenect-xt','garmin-alpha-t-20','garmin-alpha-tt-25','mova-suretrack-pro','satellai-collar-go']){
  const d=await document(slug);assert.ok(d.reviewedAlternatives.length);assert.ok(!text(dom(slug)).includes('Bessere Wahl mit Kamera'),slug);
 }
 const cat=await document('tractive-cat-6-mini');assert.ok(cat.reviewedAlternatives.every(r=>r.slug!=='tractive-dog-6-xl'));
});

test('36.0: 35.5-Seiten und 205 Linkzugänge exakt erhalten; Vergleichsauswahl mindestens zehn',async()=>{
 const result=await verifyIntegration();assert.equal(result.protectedPages,20);assert.equal(result.protectedIncomingEdges,205);
 for(const slug of ['beste-gps-tracker-fuer-hunde','beste-trinkbrunnen-fuer-katzen','beste-automatische-katzentoiletten']){
  const nodes=[...walk(parse(fs.readFileSync(path.join(app,'dist/vergleiche',slug,'index.html'),'utf8')))];
  const products=new Set(nodes.map(n=>attr(n,'data-picker-card')).filter(Boolean));assert.ok(products.size>=10,slug+': '+products.size);
  assert.ok([...products].filter(slug=>baseline.products.some(p=>p.slug===slug&&p.active&&p.published)).length>=10,slug+': mindestens zehn aktive veröffentlichte Vergleichsprodukte');
 }
});

test('36.0: neue Firmware-Informationen bleiben modellbezogen und ohne erfundene Releaseversion',async()=>{
 const x=await document('xiaomi-smart-pet-food-feeder-2');assert.match(x.experience.reliability,/standardmäßig ausgeschaltet/);
 const lr=await document('litter-robot-4');assert.match(lr.experience.reliability,/LR4S und LR4C/);
 const philips=await document('philips-pet-series-paw3210-02');assert.match(philips.experience.reliability,/erst durch Tastendruck/);
 const riko=await document('neakasa-riko');assert.match(riko.availabilityReason,/abgelaufen/);assert.equal(riko.availability,'unknown');
});

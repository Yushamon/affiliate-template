import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { parse } from 'parse5';
import { readProductDocument } from '../src/lib/price-intelligence/frontmatter-price.mjs';
import { calculateProductScore } from '../src/domain/productScore.ts';
import { buildDecisionFacts } from '../src/domain/productExperience/consequences.ts';
import { resolveCommerceOffers } from '../src/domain/commerceOffers.mjs';
import { buildSubscriptionCostModel } from '../src/domain/subscriptionCosts.ts';
const product=async slug=>(await readProductDocument(new URL(`../src/content/products/${slug}.md`,import.meta.url).pathname)).data;
const baseline=JSON.parse(await fs.readFile(new URL('../research/product-integration-35.8.1/baseline.json',import.meta.url)));
const walk=function*(n){yield n;for(const c of n.childNodes??[])yield*walk(c)};
const attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value;
const text=n=>[...walk(n)].filter(n=>n.nodeName==='#text').map(n=>n.value).join(' ').replace(/\s+/g,' ').trim();
const page=async slug=>[...walk(parse(await fs.readFile(new URL(`../dist/produkt/${slug}/index.html`,import.meta.url),'utf8')))];

test('35.8.1: Bewertungen unterscheiden belegte Kriterien, ohne Preis-/Lieferstatus-Bonus',async()=>{
 const mova=await product('mova-suretrack-pro'),sat=await product('satellai-collar-go');
 assert.equal(calculateProductScore(mova).score,58);assert.equal(calculateProductScore(sat).score,62);
 assert.ok(mova.ratings.tragekomfort>sat.ratings.tragekomfort);
 assert.ok(mova.ratings.akku<sat.ratings.akku);assert.ok(mova.ratings.app<sat.ratings.app);
 assert.equal(mova.ratings.kosten,sat.ratings.kosten);
 for(const d of [mova,sat]){
  assert.equal(calculateProductScore({...d,price:{current:9999},availability:'available'}).score,calculateProductScore(d).score);
  assert.ok(d.evidenceSources.filter(s=>s.sourceType==='independentSource'&&s.fields.includes('ratings')).length>=2);
  assert.equal(d.editorial.testedHandsOn,false);
 }
});

test('35.8.1: keine neuen Produkte, alle 437 gesperrten Originalhinweise bytegetreu erhalten',async()=>{
 const dir=new URL('../src/content/products/',import.meta.url),originals=[],slugs=[];
 for(const file of (await fs.readdir(dir)).filter(f=>/\.md$/.test(f)).sort()){
  const d=(await readProductDocument(new URL(file,dir).pathname)).data;slugs.push(d.slug);
  if(d.decisionFacts?.length)originals.push([d.slug,d.decisionFacts]);
 }
 assert.deepEqual(slugs,baseline.products);assert.equal(originals.length,73);
 assert.equal(originals.reduce((n,p)=>n+p[1].length,0),437);
 assert.equal(createHash('sha256').update(JSON.stringify(originals)).digest('hex'),baseline.decisionFactsSha256);
});

test('35.8.1: gleichwertige GPS-Konsequenzen bündeln ihre Werte, weitere Aussagen rücken nach',()=>{
 const specs=[{label:'Akku',value:'Integrierter Akku'},{label:'Akkukapazität',value:'450 mAh'},{label:'Akkulaufzeit',value:'Bis zu 7 Tage'},{label:'Abo',value:'Erforderlich'},{label:'Abo-Kosten',value:'Tarif prüfen'},{label:'Gewicht',value:'25 g'}];
 const facts=buildDecisionFacts({category:'GPS-Tracker'},specs);
 assert.equal(facts.length,3);assert.equal(new Set(facts.map(f=>f.consequence)).size,3);
 for(const s of specs)assert.ok(facts.some(f=>f.value.includes(s.value)),s.label);
 assert.doesNotMatch(facts.map(f=>f.consequence).join(' '),/Nachfüllen|nachgefüllt/);
 assert.deepEqual(buildDecisionFacts({category:'GPS-Tracker'},[{label:'Akku',value:'Unbekannt'}]),[]);
});

test('35.8.1: Invoxia-Paketpreis zählt das erste Max-GPS-Jahr nicht doppelt',async()=>{
 const d=await product('invoxia-biotracker-2026');
 assert.equal(d.price.current,219);assert.equal(d.asin,'B0H4QZMTSY');
 assert.match(d.price.variantLabel,/Paketangebot.*Max-GPS-Jahrespaket.*12 Monate/);
 const model=buildSubscriptionCostModel({subscription:d.subscription,devicePrice:d.price.current,now:'2026-11-16'});
 assert.equal(model.totals.months12.value,219);
 assert.ok(Math.abs(model.totals.months24.value-(219+129.9))<0.000001);
 const nodes=await page(d.slug),box=nodes.find(n=>n.tagName==='section'&&attr(n,'class')==='px2-price');
 assert.match(text(box),/Paketpreis inklusive Jahrespaket/);assert.match(text(box),/Nach der Inklusivzeit/);
});

test('35.8.1: reale GPS-Seiten ohne Konsequenz-Duplikate; SATELLAI behauptet keine Lieferbarkeit',async()=>{
 for(const slug of ['tractive-cat-6-mini','tractive-dog-6','tractive-dog-6-xl','mova-suretrack-pro','satellai-collar-go','invoxia-biotracker-2026']){
  const nodes=await page(slug),section=nodes.find(n=>n.tagName==='section'&&attr(n,'class')==='decision-facts');
  const consequences=[...walk(section)].filter(n=>n.tagName==='dd').map(text);
  assert.equal(new Set(consequences).size,consequences.length,slug);
  const actual=nodes.filter(n=>n.tagName==='a'&&attr(n,'class')==='px2-price__cta').map(n=>attr(n,'href')).sort();
  assert.deepEqual(actual,resolveCommerceOffers(await product(slug)).filter(o=>o.canLink).map(o=>o.affiliateUrl).sort(),slug+': exakt zugeordnete Preis-CTAs');
 }
 const nodes=await page('satellai-collar-go'),box=nodes.find(n=>n.tagName==='section'&&attr(n,'class')==='px2-price');
 assert.equal(attr(box,'data-availability'),'unknown');assert.match(text(box),/Lieferbarkeit nicht bestätigt/);
 const inspect=function*(v){if(!v||typeof v!=='object')return;yield v;for(const item of Object.values(v))yield*inspect(item)};
 for(const n of nodes.filter(n=>n.tagName==='script'&&attr(n,'type')==='application/ld+json'))for(const v of inspect(JSON.parse(n.childNodes.map(n=>n.value??'').join('')))){
  if((Array.isArray(v['@type'])?v['@type'].includes('Product'):v['@type']==='Product')&&JSON.stringify(v).includes('/produkt/satellai-collar-go/'))assert.ok(!JSON.stringify(v.offers??{}).includes('InStock'));
 }
});

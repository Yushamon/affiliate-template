import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {transform} from '@astrojs/compiler-rs';
import {experimental_AstroContainer} from 'astro/container';
import {parseFragment} from 'parse5';
import {buildSubscriptionCostModel} from '../src/domain/subscriptionCosts.ts';
import {resolveCommerceOffers,compareCommerceOffers} from '../src/domain/commerceOffers.mjs';
import {readProductFiles,readProductDocument} from '../src/lib/price-intelligence/frontmatter-price.mjs';
import {fileURLToPath} from 'node:url';

// Compile the real component and render it with Astro, including synthetic edge cases.
// CSS is checked in the production browser smoke test. Legacy compiler metadata is
// bundler-only and is not consumed by the container's isolated component render.
const source=fs.readFileSync(new URL('../src/components/product-experience-2/PriceBox2.astro',import.meta.url),'utf8');
const compiled=transform(source,{filename:'/PriceBox2.astro',internalURL:'astro/compiler-runtime'});
assert.equal(compiled.diagnostics.filter(d=>d.severity==='error').length,0);
const code=compiled.code.replace(/^import .*\?astro&type=style[^\n]*\n/gm,'')
  .replace(', createMetadata as $$createMetadata','').replace(/export const \$\$metadata = [\s\S]*?\n\}\);\n/,'')
  .replace('"astro/compiler-runtime"',JSON.stringify(import.meta.resolve('astro/compiler-runtime')));
const {default:PriceBox}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const container=await experimental_AstroContainer.create();
const attr=(node,key)=>node.attrs?.find(a=>a.name===key)?.value;
const nodes=node=>[node,...(node.childNodes??[]).flatMap(nodes)];
const text=node=>node.nodeName==='#text'?node.value:(node.childNodes??[]).map(text).join('');
const byClass=(root,name)=>nodes(root).filter(n=>(attr(n,'class')??'').split(' ').includes(name));
const affiliate={url:'https://www.amazon.de/dp/B012345678?tag=yusha0f-21',label:'Amazon',rel:'sponsored nofollow noopener',target:'_blank'};
const offer={id:'amazon',merchant:'amazon',label:'Amazon',affiliateUrl:affiliate.url,rel:affiliate.rel,target:'_blank',tracking:{product:'fixture',placement:'product-commerce',pageType:'product'},formattedPrice:null,shipping:null};
const render=async(overrides={})=>{
  const html=await container.renderToString(PriceBox,{props:{affiliate,operations:{availability:'unknown',availabilityLabel:'Unbekannt',availabilityReason:'Interne Datenqualität ohne Liefernachweis',priceAvailable:false,purchasable:false},commerce:{offers:[offer],hasConfiguredOffers:false},...overrides}});
  return parseFragment(html);
};
const subscription=(patch={})=>buildSubscriptionCostModel({now:'2026-10-16',devicePrice:109.99,subscription:{status:'optional-subscription',provider:'Hersteller',researchedAt:'2026-10-16',source:'https://example.com/tarife',plans:[],freeFunctions:['Basisfunktion'],paidFunctions:['Cloud-Aufzeichnung'],...patch}});

test('unknown availability keeps a short, active Amazon CTA and one merchant note',async()=>{
  const root=await render();
  assert.equal(byClass(root,'px2-availability').length,0);
  assert.doesNotMatch(text(root),/Unbekannt|Liefernachweis|Verfügbarkeit unbekannt/);
  const buttons=byClass(root,'px2-price__cta');assert.equal(buttons.length,1);
  assert.equal(text(buttons[0]).trim(),'Bei Amazon ansehen');assert.equal(attr(buttons[0],'href'),affiliate.url);
  assert.match(attr(buttons[0],'rel'),/sponsored/);assert.equal(attr(buttons[0],'target'),'_blank');
  assert.equal(text(root).match(/Preis und Verfügbarkeit beim Händler prüfen/g).length,1);
  assert.ok(nodes(root).some(n=>attr(n,'href')==='/affiliate-hinweis/'));
});

test('missing price stays compact without disabling a valid merchant link',async()=>{
  const root=await render();assert.equal(byClass(root,'px2-price__purchase').length,1);
  assert.equal(text(root).match(/Preis beim Händler prüfen/g).length,1);
  assert.ok(attr(byClass(root,'px2-price__cta')[0],'href'));
  assert.doesNotMatch(text(root),/Versandkosten beim Händler prüfen|Stand:|€|Preis aktuell nicht verfügbar/);
});

test('single merchant purchase price appears once, preferring the validated merchant value',async()=>{
  const root=await render({commerce:{offers:[{...offer,formattedPrice:'109,99 €'}]},price:{formattedCurrent:'120,00 €',isStale:true}});
  assert.equal(text(root).match(/109,99 €/g).length,1);assert.doesNotMatch(text(root),/120,00|Veralteter Preisstand/);
});

test('older and unconfirmed acquisition prices are explicitly qualified',async()=>{
  for(const isStale of [true,false]){
    const root=await render({price:{formattedCurrent:'109,99 €',isStale}});
    assert.match(text(root),/Zuletzt erfasster Anschaffungspreis/);
    assert.ok(text(root).includes(isStale?'Veralteter Preisstand':'Nicht aktuell bestätigt'));
  }
});

test('optional subscription without a price has a short label without price placeholders',async()=>{
  const root=await render({subscriptionCost:subscription()});
  assert.match(text(byClass(root,'px2-price__summary')[0]),/Optionales Abo möglich/);
  assert.doesNotMatch(text(root),/Preis des optionalen Dienstes aktuell prüfen|Zusatzkosten erforderlich/);
  assert.match(text(root),/Ohne Abo:|Mit Dienst:/);
  assert.equal(attr(byClass(root,'px2-price__details')[0],'open'),undefined);
});

const plan={name:'Jahrestarif',billingPeriod:'annual',billingMode:'upfront',commitmentMonths:12,price:84,currency:'EUR',featured:true,autoRenew:true};
test('known optional costs remain visible; examples move into collapsed details after the CTA',async()=>{
  const root=await render({subscriptionCost:subscription({plans:[plan]})});
  assert.match(text(byClass(root,'px2-price__summary')[0]),/84,00.*Jahr/);
  assert.doesNotMatch(text(byClass(root,'px2-price__summary')[0]),/Gesamtkosten/);
  assert.match(text(byClass(root,'px2-price__details')[0]),/Gesamtkosten nach 2 Jahren/);
  const all=nodes(root);assert.ok(all.indexOf(byClass(root,'px2-price__cta')[0])<all.indexOf(byClass(root,'px2-price__details')[0]));
});

test('required subscriptions and prepaid billing remain visible above the purchase options',async()=>{
  for(const status of ['required-subscription','required-prepaid']){
    const p=status==='required-prepaid'?{...plan,billingPeriod:'term',billingMode:'prepaid',autoRenew:false}:plan;
    const root=await render({subscriptionCost:subscription({status,requiredForCoreFunction:true,plans:[p]})});
    const summary=text(byClass(root,'px2-price__summary')[0]);
    assert.match(summary,/erforderlich/);assert.match(summary,/84,00/);
    assert.ok(summary.includes(status==='required-prepaid'?'12 Monate im Voraus · keine automatische Verlängerung':'jährliche Zahlung'));
    assert.doesNotMatch(summary,/Optionales Abo möglich/);
  }
});

test('unknown or stale required subscription never implies free service',async()=>{
  for(const stale of [false,true]){
    const root=await render({subscriptionCost:subscription({status:'required-subscription',plans:stale?[plan]:[],researchedAt:stale?'2020-01-01':'2026-10-16'})});
    const summary=text(byClass(root,'px2-price__summary')[0]);assert.match(summary,/Abo erforderlich/);assert.match(summary,/Tarif beim Anbieter prüfen/);
    assert.doesNotMatch(summary,/84,00|Kein Pflichtabo/);if(stale)assert.match(summary,/Tarifstand veraltet/);
  }
});

test('multiple merchants keep their distinct tracking URLs and show each known price once',async()=>{
  const awin={...offer,id:'awin',merchant:'petlibro',label:'PETLIBRO',affiliateUrl:'https://www.awin1.com/cread.php?awinmid=123&awinaffid=456&ued=https%3A%2F%2Fde.petlibro.com%2Fproducts%2Ffeeder',formattedPrice:'99,99 €'};
  const adcell={...offer,id:'adcell',merchant:'tractive',label:'Tractive',affiliateUrl:'https://t.adcell.com/p/click?promoId=123&slotId=456&param0=fixture'};
  const manufacturer={...offer,id:'maker',merchant:'maker',label:'Hersteller',affiliateUrl:'https://example.com/produkt?partner=existing'};
  const offers=[{...offer,formattedPrice:'109,99 €'},awin,adcell,manufacturer];
  const root=await render({commerce:{offers,hasConfiguredOffers:true},price:{formattedCurrent:'109,99 €'}});
  assert.deepEqual(byClass(root,'px2-price__cta').map(n=>attr(n,'href')),offers.map(o=>o.affiliateUrl));
  assert.equal(byClass(root,'px2-price__purchase').length,0);
  for(const price of ['109,99 €','99,99 €'])assert.equal(text(root).split(price).length-1,1);
  assert.doesNotMatch(text(root),/Günstigstes|Versandkosten beim Händler prüfen/);
});

test('explicit discontinued warning remains alongside the neutral Amazon merchant option',async()=>{
  const root=await render({operations:{availability:'discontinued',availabilityLabel:'Eingestellt',purchasable:false}});
  assert.match(text(byClass(root,'px2-availability')[0]),/nicht mehr als Hauptempfehlung/);
  assert.ok(attr(byClass(root,'px2-price__cta')[0],'href'));
});

test('actual PETKIT YumShare keeps its exact affiliate target and renders the compact UI',async()=>{
  const {data}=await readProductDocument(new URL('../src/content/products/petkit-yumshare-dual-hopper.md',import.meta.url));
  const commerce=compareCommerceOffers(resolveCommerceOffers(data));const root=await render({commerce});
  const amazon=byClass(root,'px2-price__cta').find(n=>attr(n,'data-merchant')==='amazon');
  assert.equal(attr(amazon,'href'),'https://amzn.to/3TQJw1G');assert.equal(text(amazon).trim(),'Bei Amazon ansehen');
  const html=fs.readFileSync(new URL('../dist/produkt/petkit-yumshare-dual-hopper/index.html',import.meta.url),'utf8');
  const built=parseFragment(html);const boxes=byClass(built,'px2-price');assert.equal(boxes.length,1);
  assert.equal(byClass(boxes[0],'px2-availability').length,0);assert.match(text(boxes[0]),/Optionales Abo möglich/);
});


test('every built product retains all resolved merchant targets and a single availability note',async()=>{
  const files=await readProductFiles(fileURLToPath(new URL('../src/content/products/',import.meta.url)));
  assert.ok(files.length>0);
  for(const file of files){
    const {data}=await readProductDocument(file);
    const html=fs.readFileSync(new URL(`../dist/produkt/${data.slug}/index.html`,import.meta.url),'utf8');
    const boxes=byClass(parseFragment(html),'px2-price');assert.equal(boxes.length,1,data.slug);
    const box=boxes[0];const expected=compareCommerceOffers(resolveCommerceOffers(data)).offers;
    const links=byClass(box,'px2-price__cta').filter(n=>n.tagName==='a');
    assert.deepEqual(links.map(n=>attr(n,'href')),expected.map(o=>o.affiliateUrl),data.slug);
    assert.equal(text(box).match(/Preis und Verfügbarkeit beim Händler prüfen/g)?.length,1,data.slug);
    if(attr(box,'data-availability')==='unknown')assert.equal(byClass(box,'px2-availability').length,0,data.slug);
    for(const a of links){assert.match(attr(a,'rel'),/sponsored/,data.slug);assert.equal(attr(a,'aria-disabled'),undefined,data.slug);}
  }
});

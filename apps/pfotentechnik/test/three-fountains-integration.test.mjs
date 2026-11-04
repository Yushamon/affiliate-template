import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import sharp from 'sharp';
import { costFoundationSchema } from '../src/content/schema/consumables.mjs';
import { assessProductReview } from '../src/domain/productReview.ts';
import { resolveCommerceOffers } from '../src/domain/commerceOffers.mjs';
import { resolveAmazonProductAffiliate } from '../../../packages/affiliate-core/src/affiliate/amazon.ts';
const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const slugs = ['catit-pixi-standard-trinkbrunnen','philips-pet-series-paw3210-02','brook-glass-pet-fountain'];
const entry = slug => {
 const source = fs.readFileSync(path.join(app,'src/content/products',slug+'.md'),'utf8');
 return {data:yaml.load(source.match(/^---\n([\s\S]*?)\n---/)[1]),source};
};
for (const slug of slugs) {
 test(`${slug}: consumable evidence validates and editorial review does not claim hands-on`, () => {
  const {data}=entry(slug);
  assert.equal(costFoundationSchema.safeParse(data).success,true);
  assert.equal(assessProductReview(data).eligible,true);
  assert.equal(assessProductReview(data).handsOn,false);
  assert.ok(data.faq.length>=5);
  assert.equal(data.showEditorialContent,true);
  assert.equal(data.ratings.lautstaerke,undefined,'No noise measurement was performed.');
 });
 test(`${slug}: six local, bounded WebP assets with Amazon image provenance`, async () => {
  const {data}=entry(slug);
  const dir=path.join(app,'src/assets/images/products',slug);
  const provenance=JSON.parse(fs.readFileSync(path.join(dir,'media-provenance.json'),'utf8'));
  assert.equal(provenance.amazonImagesUsed,true);
  assert.equal(provenance.asin,data.asin);
  assert.equal(provenance.authorization.basis,'Explicit operator exception in this conversation');
  assert.equal(provenance.assets.length,6);
  assert.equal(new Set(provenance.assets.map(image=>image.sourceUrl)).size,4,'Four distinct selected-variant gallery images.');
  assert.equal(fs.readdirSync(dir).some(name=>name.endsWith('.svg')),false);
  for(const asset of [data.images.hero,data.images.thumbnail,data.images.comparison,...data.images.gallery]) {
   const file=path.resolve(app,'src/content/products',asset.src);
   const metadata=await sharp(file).metadata();
   assert.equal(metadata.format,'webp');
   assert.ok(metadata.width>=480 && metadata.width<=1200);
   assert.ok(fs.statSync(file).size<100_000,'Keep image transfers bounded.');
   assert.doesNotMatch(asset.alt,/Datengrafik|Infografik|keine Produktfotografie/);
   const record=provenance.assets.find(image=>image.file===path.basename(file));
   assert.ok(record.sourceUrl.startsWith('https://m.media-amazon.com/images/I/'));
   assert.equal(record.kind,'amazon-product-image');
   assert.equal(record.bytes,fs.statSync(file).size);
   assert.equal(record.sha256,createHash('sha256').update(fs.readFileSync(file)).digest('hex'));
   assert.equal(record.sourceAsin,data.asin);
  }
 });
 test(`${slug}: built page includes buying advice, FAQs and valid Product JSON-LD`, () => {
  const file=path.join(app,'dist/produkt',slug,'index.html');
  assert.ok(fs.existsSync(file),'Run the PfotenTechnik build before this integration test.');
  const html=fs.readFileSync(file,'utf8');
  assert.match(html,/class="product-editorial-content"/);
  assert.match(html,/id="quellen-und-prüfstand"/);
  assert.match(html,/id="redaktionelle-bewertung-und-grenzen"/);
  assert.match(html,/id="product-faq-title"/);
  const schemas=[...html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
  const schema=schemas.find(s=>s['@type']==='Product');
  assert.ok(schema);
  assert.equal(schema.model,entry(slug).data.model);
  assert.ok(schema.review.reviewRating.ratingValue>0);
  assert.equal(schemas.filter(s=>s['@type']==='Product').length,1);
  if(slug.startsWith('brook')) {
   assert.equal(schema.identifier.value,'B0D5DP2V53');
   assert.equal(schema.offers,undefined,'No confirmed German offer exists.');
   assert.match(html,/30,33–60,67 US-Dollar/);
  }
  for (const match of html.matchAll(/href="(\/[^"#?]*)(?:[?#][^"]*)?"/g)) {
   const href=match[1];
   if(href.startsWith('//') || /\.[a-z0-9]+$/i.test(href) || href.startsWith('/api/'))continue;
   const target=path.join(app,'dist',href,'index.html');
   assert.ok(fs.existsSync(target),`Broken built internal link: ${href}`);
  }
 });
}
test('new models are discoverable without changing the existing first comparison recommendation', () => {
 const source=fs.readFileSync(path.join(app,'src/content/comparisons/beste-trinkbrunnen-fuer-katzen.md'),'utf8');
 const data=yaml.load(source.match(/^---\n([\s\S]*?)\n---/)[1]);
 assert.equal(data.items.length,14);
 assert.equal(data.items[0].slug,'petkit-eversweet-solo-2-fountain');
 for(const slug of slugs) {
  assert.equal(data.items.filter(i=>i.slug===slug).length,1);
  assert.ok(fs.existsSync(path.join(app,'src/content/manufacturers',entry(slug).data.manufacturer.slug+'.md')));
  const html=fs.readFileSync(path.join(app,'dist/trinkbrunnen/index.html'),'utf8');
  assert.ok(html.includes('/produkt/'+slug+'/'),'Category must expose the new model.');
 }
});

const linkChecks = JSON.parse(fs.readFileSync(path.join(app,'research/three-fountains-2026-11/amazon-link-check.json'),'utf8'));
for (const mapping of linkChecks.results) {
 test(`${mapping.slug}: owner mapping preserves every observed tracking parameter`, () => {
  const {data}=entry(mapping.slug);
  const generated=resolveAmazonProductAffiliate(mapping.destination,linkChecks.trackingId);
  assert.equal(generated.asin,mapping.asin);
  assert.equal(generated.url,mapping.generatedAffiliateLink);
  assert.equal(generated.url,mapping.destination,'Do not discard linkId, linkCode or subtag parameters.');
  assert.equal(new URL(generated.url).searchParams.get('tag'),'yusha0f-21');
  assert.equal(new URL(generated.url).searchParams.getAll('tag').length,1);
  const offers=resolveCommerceOffers(data);
  const amazon=offers.filter(o=>o.amazonLink);
  assert.equal(amazon.length,1,'No duplicate legacy/explicit Amazon offer.');
  assert.equal(amazon[0].canLink,mapping.ctaEnabled);
  assert.equal(amazon[0].current,null,'Other merchants prices must not become Amazon prices.');
  assert.equal(amazon[0].availability,'unknown');
  assert.equal(mapping.ctaEnabled,true);
  assert.equal(data.asin,mapping.asin);
  assert.equal(offers.find(o=>o.canLink).merchant,'amazon');
  assert.equal(amazon[0].affiliateUrl,mapping.generatedAffiliateLink);
  if(mapping.slug.startsWith('catit')){assert.equal(data.mpn,'43718');assert.match(data.title,/Mintgrün/);}

 });
 test(`${mapping.slug}: built CTA follows the checked mapping and retains the model`, () => {
  const html=fs.readFileSync(path.join(app,'dist/produkt',mapping.slug,'index.html'),'utf8');
  const anchors=[...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/g)].filter(m=>m[0].includes('data-affiliate-link')).map(m=>m[1].replaceAll('&amp;','&'));
  const targets=anchors.filter(href=>href.includes('/dp/'+mapping.asin));
  assert.ok(targets.length>0);
  assert.ok(targets.every(href=>href===mapping.generatedAffiliateLink));
  const schemas=[...html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
  const product=schemas.find(schema=>schema['@type']==='Product');
  assert.equal(product.identifier.value,mapping.asin);
  assert.equal(product.offers,undefined,'ASIN is not evidence of stock.');
  if(mapping.slug.startsWith('catit')){assert.equal(product.mpn,'43718');assert.match(product.name,/Mintgrün/);}

 });
}

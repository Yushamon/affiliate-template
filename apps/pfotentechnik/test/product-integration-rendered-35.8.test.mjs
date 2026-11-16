import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { parse as parseStore } from 'devalue';
import { verifyIntegration } from '../scripts/product-integration/verify.mjs';
import { readProductDocument } from '../src/lib/price-intelligence/frontmatter-price.mjs';
import { approvedFreshnessChanges } from '../scripts/product-freshness/approved-changes.mjs';

const protectedFields=JSON.parse(await fs.readFile(new URL('../research/product-integration-35.8/protected-existing-fields.json',import.meta.url)));

test('regulärer Build schützt Entwürfe, Experiment-Zugänge und Vergleichsmitgliedschaft',async()=>{
 const result=await verifyIntegration();
 assert.equal(result.protectedPages,20);
 assert.equal(result.protectedIncomingEdges,205);
 const sitemap=await fs.readFile(new URL('../dist/sitemap-0.xml',import.meta.url),'utf8');
 const advisor=await fs.readFile(new URL('../dist/api/advisor-products.json',import.meta.url),'utf8');
 for(const slug of ['petlibro-granary-2','petlibro-granary-2-vision-duo']){
  assert.ok(!sitemap.includes(`/produkt/${slug}/`));
  assert.ok(!advisor.includes(`\"slug\":\"${slug}\"`));
 }
 assert.equal(result.comparisons['beste-gps-tracker-fuer-hunde'].visibleProducts.length,12);
 assert.deepEqual(result.comparisons['beste-gps-tracker-fuer-hunde'].newProducts,['mova-suretrack-pro','satellai-collar-go']);
});

test('bestehende Scores, Teilbewertungen, SEO-Metadaten und decisionFacts bleiben exakt erhalten',async()=>{
 for(const [slug,fields] of Object.entries(protectedFields)){
  const {data}=await readProductDocument(new URL(`../src/content/products/${slug}.md`,import.meta.url).pathname);
  const approved=approvedFreshnessChanges().get(`src/content/products/${slug}.md`);
  for(const [key,value] of Object.entries(fields)){
   const change=['score','rating','ratings'].includes(key)?approved?.changedFields?.[key]:null;
   if(change){assert.deepEqual(change.before,value,`${slug}.${key}: dokumentierter Ausgangswert`);assert.deepEqual(data[key],change.after,`${slug}.${key}: einzeln begründete 36.0-Bewertung`)}
   else assert.deepEqual(data[key],value,`${slug}.${key}`);
  }
 }
});

test('alle vier neuen Produkte behalten Schemafelder, Bilder und Preise im echten Astro-Speicher',async()=>{
 const store=parseStore(await fs.readFile(new URL('../.astro-cache/data-store.json',import.meta.url),'utf8')).get('products');
 const m=JSON.parse(await fs.readFile(new URL('../research/product-integration-35.8/manifest.json',import.meta.url)));
 for(const slug of m.candidateSlugs){
  const {data}=await readProductDocument(new URL(`../src/content/products/${slug}.md`,import.meta.url).pathname),built=store.get(slug)?.data;
  assert.ok(built,slug);assert.equal(built.publicationStatus,data.publicationStatus);assert.deepEqual(built.publicationBlockers,data.publicationBlockers);
  if(data.subscription)assert.deepEqual(JSON.parse(JSON.stringify(built.subscription)),{...data.subscription,researchedAt:new Date(data.subscription.researchedAt).toISOString()});assert.deepEqual(built.reviewedAlternatives,data.reviewedAlternatives);assert.deepEqual(built.ratings,data.ratings);assert.deepEqual(built.decisionFacts,[]);assert.equal(built.images.gallery.length,3);
  assert.equal(built.price.current,data.price.current);assert.equal(built.offers.length,data.offers?.length??0);
 }
});

test('35.8-Abschlussreport ist aus dem finalen Build reproduzierbar',()=>{
 execFileSync(process.execPath,[new URL('../scripts/product-integration/report.mjs',import.meta.url).pathname,'--check'],{stdio:'pipe'});
});

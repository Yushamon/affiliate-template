import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import yaml from 'js-yaml';
import { getPrimaryAffiliateLink } from '../../../packages/affiliate-core/src/affiliate/affiliateEngine.ts';
import { costFoundationSchema } from '../src/content/schema/consumables.mjs';
import {
  ACCESSORY_COMMERCE_STATUS as STATUS,
  COST_INPUT_OFFER_MISMATCH,
  classifyAccessoryOffer,
  identifyAccessoryMerchant,
  isDirectAmazonProductUrl
} from '../src/domain/accessoryCommerce.mjs';

const known = value => ({ status: 'known', value });
const offer = (url = 'https://www.amazon.de/dp/B0BVQPJRLH', availability = 'available') => ({
  id: 'filter-offer',
  price: { current: 19.99, currency: 'EUR', checkedAt: '2026-09-10T10:00:00Z', source: { id: 'merchant', label: 'Merchant', type: 'merchant', url } },
  priceState: availability === 'available' ? 'available' : 'unknown',
  availability
});
const base = overrides => ({
  offer: offer(),
  productSlug: 'fixture-fountain',
  compatibility: known(['fixture-fountain']),
  exactProductIdentity: true,
  candidatePackSize: 5,
  costInputPackSize: 5,
  affiliateMechanismAvailable: true,
  trackingId: 'example-21',
  ...overrides
});

test('1. accessory offer requires exact fountain compatibility', () => {
  assert.equal(classifyAccessoryOffer(base({})).status, STATUS.AFFILIATE_READY);
  assert.equal(classifyAccessoryOffer(base({ compatibility: known(['other-fountain']) })).status, STATUS.COMPATIBILITY_UNRESOLVED);
});

test('2. exact direct Amazon offer is affiliate-ready through the existing generator', () => {
  const result = classifyAccessoryOffer(base({}));
  assert.equal(result.asin, 'B0BVQPJRLH');
  assert.equal(result.affiliateUrl, 'https://www.amazon.de/dp/B0BVQPJRLH?tag=example-21');
});

test('3. purchasable supported offer without a usable affiliate target stays non-affiliate', () => {
  const result = classifyAccessoryOffer(base({ offer: offer('https://www.amazon.de/s?k=petkit+filter') }));
  assert.equal(result.status, STATUS.PURCHASABLE_NON_AFFILIATE);
  assert.equal(isDirectAmazonProductUrl('https://www.amazon.de/s?k=petkit+filter'), false);
});

test('4. unsupported merchant is explicit', () => {
  assert.equal(classifyAccessoryOffer(base({ offer: offer('https://shop.example/filter') })).status, STATUS.MERCHANT_UNSUPPORTED);
});

test('5. unresolved compatibility cannot become affiliate-ready', () => {
  assert.equal(classifyAccessoryOffer(base({ exactProductIdentity: false })).status, STATUS.COMPATIBILITY_UNRESOLVED);
});

test('6. multiple pack sizes remain separate decisions', () => {
  const five = classifyAccessoryOffer(base({ candidatePackSize: 5, costInputPackSize: 5 }));
  const ten = classifyAccessoryOffer(base({ candidatePackSize: 10, costInputPackSize: 10 }));
  assert.equal(five.status, STATUS.AFFILIATE_READY);
  assert.equal(ten.status, STATUS.AFFILIATE_READY);
});

test('7. pack-size mismatch is preserved as a cost/offer conflict', () => {
  const result = classifyAccessoryOffer(base({ candidatePackSize: 8, costInputPackSize: 4 }));
  assert.equal(result.status, STATUS.COMPATIBILITY_UNRESOLVED);
  assert.deepEqual(result.conflicts, [COST_INPUT_OFFER_MISMATCH]);
});

test('8. unavailable offer has its own status', () => {
  assert.equal(classifyAccessoryOffer(base({ offer: offer('https://www.amazon.de/dp/B0BVQPJRLH', 'out-of-stock') })).status, STATUS.OFFER_UNAVAILABLE);
});

test('9. missing affiliate mechanism cannot produce a tracked link', () => {
  const result = classifyAccessoryOffer(base({ affiliateMechanismAvailable: false }));
  assert.equal(result.status, STATUS.PURCHASABLE_NON_AFFILIATE);
  assert.equal(result.affiliateUrl, null);
});

test('10. accessory decisions do not mutate the main-product offer', () => {
  const main = { affiliateUrl: 'https://legacy.example/product', merchantLinks: { amazon: { asin: 'B0D123ABCD' } } };
  const snapshot = structuredClone(main);
  classifyAccessoryOffer(base({}));
  assert.deepEqual(main, snapshot);
});

test('11. existing main-product commerce resolution is unchanged', () => {
  const result = getPrimaryAffiliateLink({ merchantLinks: { amazon: { asin: 'B0D123ABCD' } } }, { amazon: { trackingId: 'example-21' } });
  assert.equal(result.url, 'https://www.amazon.de/dp/B0D123ABCD?tag=example-21');
});

test('12. the internal accessory module has no UI or renderer dependency', () => {
  const source = fs.readFileSync(new URL('../src/domain/accessoryCommerce.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /from\s+['"][^'"]*(?:\.astro|components\/|renderer)/i);
});

test('13. no product page renders accessory links', () => {
  const source = fs.readFileSync(new URL('../src/pages/produkt/[product].astro', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /accessoryCommerce|consumables\b|repairability\.parts/);
});

test('14. unknown merchant is not conflated with unsupported merchant', () => {
  assert.equal(classifyAccessoryOffer(base({ offer: offer('not-a-url') })).status, STATUS.UNKNOWN);
  assert.equal(identifyAccessoryMerchant('https://shop.example/filter'), 'shop.example');
});

test('15. price fetch was not extended by the internal classifier', () => {
  const source = fs.readFileSync(new URL('../src/domain/accessoryCommerce.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /fetch\s*\(|price-intelligence|extractOffer/);
});

test('16. existing products without accessories remain schema-valid', () => {
  const dir = new URL('../src/content/products/', import.meta.url);
  let withoutAccessories = 0;
  for (const name of fs.readdirSync(dir).filter(name => name.endsWith('.md'))) {
    const raw = fs.readFileSync(new URL(name, dir), 'utf8');
    const data = yaml.load(raw.match(/^---\s*\n([\s\S]*?)\n---/)[1], { schema: yaml.JSON_SCHEMA });
    if (!data.consumables && !data.repairability?.parts?.some(part => part.offers?.length)) withoutAccessories++;
    assert.equal(costFoundationSchema.safeParse(data).success, true, name);
  }
  assert.ok(withoutAccessories > 0);
});

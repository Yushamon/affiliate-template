import test from "node:test";
import assert from "node:assert/strict";
import { extractOfferFromHtml } from "../src/lib/price-intelligence/extract-offer.mjs";
import { safeFetchText } from '../src/lib/price-intelligence/safe-fetch.mjs';

const amazonUrl = 'https://www.amazon.de/dp/B01AUYLVU8';
const amazonHtml = ({asin='B01AUYLVU8',amount='43.86',currency='EUR',extra=''} = {}) => `
  <html><form id="addToCart">
    <input name="ASIN" value="${asin}">
    <input name="items[0.base][customerVisiblePrice][amount]" value="${amount}">
    <input name="items[0.base][customerVisiblePrice][currencyCode]" value="${currency}">
    ${extra}
  </form><div class="recommendations"><span class="a-price">9,99 €</span></div></html>`;

test('Amazon primary product price updates without stock or an enabled purchase button', () => {
  for (const extra of ['', '<div id="availability">Derzeit nicht verfügbar</div><input id="add-to-cart-button" disabled>']) {
    const result = extractOfferFromHtml(amazonHtml({extra}), amazonUrl);
    assert.equal(result.current, 43.86);
    assert.equal(result.currency, 'EUR');
    assert.equal(result.availability, undefined);
    assert.equal(result.method, 'amazon-buybox');
  }
});

test('Amazon parser rejects mismatched products, currencies and ambiguous prices', () => {
  for (const patch of [{asin:'B012345678'}, {currency:'USD'}, {amount:'invalid'}, {amount:'0'},
    {extra:'<input name="items[0.base][customerVisiblePrice][amount]" value="10.00">'}]) {
    assert.equal(extractOfferFromHtml(amazonHtml(patch), amazonUrl), null);
  }
  assert.equal(extractOfferFromHtml(amazonHtml(), 'https://amazon.de.example.com/dp/B01AUYLVU8'), null);
  assert.equal(extractOfferFromHtml(amazonHtml(), 'https://www.amazon.de/s?k=catmate'), null);
});

test('merchant fetch accepts identifiable HTML when Content-Type is absent', async () => {
  const html = '<!doctype html><html><body>Produkt</body></html>';
  const result = await safeFetchText(amazonUrl, {}, {fetchResource:async()=>({buffer:Buffer.from(html),contentType:'',resolvedUrl:amazonUrl,status:200})});
  assert.equal(result.html, html);
});

test('merchant fetch still rejects explicit non-HTML and unidentifiable untyped bodies', async () => {
  for (const [contentType,body] of [['application/json','<html></html>'],['','{"price":43.86}']]) {
    await assert.rejects(()=>safeFetchText(amazonUrl, {}, {fetchResource:async()=>({buffer:Buffer.from(body),contentType,resolvedUrl:amazonUrl,status:200})}), /kein HTML/);
  }
});

test("liest Händlerpreise aus JSON-LD ohne Händler-Hardcoding", () => {
  const html='<script type="application/ld+json">{"@type":"Product","offers":{"@type":"Offer","price":"119.99","priceCurrency":"EUR"}}</script>';
  assert.deepEqual(extractOfferFromHtml(html,"https://shop.example/p"),{current:119.99,currency:"EUR",method:"json-ld",availability:undefined,pageUrl:"https://shop.example/p"});
});

test("fällt auf standardisierte Preis-Metadaten zurück", () => {
  const html='<meta property="product:price:amount" content="89,90"><meta property="product:price:currency" content="EUR">';
  assert.equal(extractOfferFromHtml(html)?.current,89.9);
});

import { isUnsafeNetworkAddress } from "../src/lib/admin/public-fetch.mjs";

test("blockiert lokale und gemappte Netzwerkziele", () => {
  assert.equal(isUnsafeNetworkAddress("127.0.0.1"), true);
  assert.equal(isUnsafeNetworkAddress("192.168.1.4"), true);
  assert.equal(isUnsafeNetworkAddress("::ffff:127.0.0.1"), true);
  assert.equal(isUnsafeNetworkAddress("8.8.8.8"), false);
});

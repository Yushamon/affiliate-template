import test from "node:test";
import assert from "node:assert/strict";
import { extractOfferFromHtml } from "../src/lib/price-intelligence/extract-offer.mjs";

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

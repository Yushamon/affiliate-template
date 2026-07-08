import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAmazonAffiliateUrl,
  buildAmazonSearchAffiliateUrl,
  createAmazonAffiliateUrl,
  extractAmazonAsin,
  normalizeAmazonAsin,
  resolveAmazonAffiliateUrl
} from "./amazon.ts";

const asin = "B0D123ABCD";

test("normalizes a direct ASIN", () => {
  assert.equal(normalizeAmazonAsin(" b0d123abcd "), asin);
  assert.equal(normalizeAmazonAsin("invalid"), null);
});

test("extracts ASINs from common Amazon URL formats", () => {
  const urls = [
    `https://www.amazon.de/Produktname/dp/${asin}/ref=sr_1_1`,
    `https://amazon.de/dp/${asin}?th=1`,
    `https://www.amazon.de/gp/product/${asin}/`,
    `https://www.amazon.de/gp/aw/d/${asin}?psc=1`,
    `https://www.amazon.de/exec/obidos/ASIN/${asin}`,
    `www.amazon.de/s?k=tracker&asin=${asin}`
  ];

  for (const url of urls) {
    assert.equal(extractAmazonAsin(url), asin);
  }
});

test("rejects ASIN-like paths from non-Amazon hosts", () => {
  assert.equal(extractAmazonAsin(`https://example.com/dp/${asin}`), null);
});

test("creates a canonical German affiliate URL", () => {
  assert.equal(
    buildAmazonAffiliateUrl(asin, "yusha0f-21"),
    `https://www.amazon.de/dp/${asin}?tag=yusha0f-21`
  );
  assert.equal(
    buildAmazonSearchAffiliateUrl("GPS Tracker Hund", "yusha0f-21"),
    "https://www.amazon.de/s?k=GPS+Tracker+Hund&tag=yusha0f-21"
  );
  assert.equal(
    createAmazonAffiliateUrl(asin),
    `https://www.amazon.de/dp/${asin}?tag=yusha0f-21`
  );
});

test("resolves ASIN, Amazon URL and legacy short-link sources", () => {
  assert.equal(
    resolveAmazonAffiliateUrl({ asin }),
    `https://www.amazon.de/dp/${asin}?tag=yusha0f-21`
  );
  assert.equal(
    resolveAmazonAffiliateUrl({
      amazonUrl: `https://www.amazon.de/dp/${asin}?tag=old-tag`
    }),
    `https://www.amazon.de/dp/${asin}?tag=yusha0f-21`
  );
  assert.equal(
    resolveAmazonAffiliateUrl({ affiliateUrl: "https://amzn.to/example" }),
    "https://amzn.to/example"
  );
});

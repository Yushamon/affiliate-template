import assert from "node:assert/strict";
import test from "node:test";
import {
  getPrimaryAffiliateLink,
  resolveAmazonLink
} from "./affiliateEngine.ts";

const config = {
  amazon: {
    trackingId: "yusha0f-21"
  }
};

test("prefers an Amazon ASIN over a legacy affiliate URL", () => {
  assert.deepEqual(
    getPrimaryAffiliateLink(
      {
        name: "GPS Tracker Hund",
        productUrl: "/produkt/gps-tracker",
        affiliateUrl: "https://amzn.to/legacy",
        merchantLinks: {
          amazon: { asin: "B0D123ABCD" }
        }
      },
      config
    ),
    {
      merchant: "amazon",
      url: "https://www.amazon.de/dp/B0D123ABCD?tag=yusha0f-21",
      label: "Aktuellen Preis prüfen",
      rel: "sponsored nofollow noopener",
      target: "_blank"
    }
  );
});

test("extracts the ASIN from merchantLinks.amazon.url", () => {
  const link = resolveAmazonLink(
    {
      merchantLinks: {
        amazon: {
          url: "https://www.amazon.de/Tracker/dp/B0D123ABCD?tag=old"
        }
      }
    },
    config
  );

  assert.equal(
    link?.url,
    "https://www.amazon.de/dp/B0D123ABCD?tag=yusha0f-21"
  );
});

test("builds a tracked Amazon search link without an ASIN", () => {
  const link = resolveAmazonLink(
    {
      name: "Tracker",
      merchantLinks: {
        amazon: { searchQuery: "GPS Tracker Hund" }
      }
    },
    config
  );

  assert.equal(
    link?.url,
    "https://www.amazon.de/s?k=GPS+Tracker+Hund&tag=yusha0f-21"
  );
});

test("uses the product name as Amazon search fallback", () => {
  const link = resolveAmazonLink(
    {
      name: "Smarte Haustierkamera",
      merchantLinks: { amazon: {} }
    },
    config
  );

  assert.equal(
    link?.url,
    "https://www.amazon.de/s?k=Smarte+Haustierkamera&tag=yusha0f-21"
  );
});

test("uses legacy and internal fallbacks without Amazon configuration", () => {
  assert.equal(
    getPrimaryAffiliateLink(
      {
        affiliateUrl: "https://amzn.to/legacy",
        productUrl: "/produkt/test",
        merchantLinks: { amazon: { asin: "B0D123ABCD" } }
      },
      {}
    ).url,
    "https://amzn.to/legacy"
  );

  assert.deepEqual(
    getPrimaryAffiliateLink({ productUrl: "/produkt/test" }, config),
    {
      merchant: "internal",
      url: "/produkt/test",
      label: "Zum Testbericht"
    }
  );
});
